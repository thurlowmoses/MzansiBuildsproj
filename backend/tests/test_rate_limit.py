import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from main import app


class RateLimitTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.original_rules = list(app.state.rate_limit_rules)

        app.state.rate_limit_rules = [("/health", 1, 60), ("/", 2, 60)]
        app.state.rate_limit_counters.clear()

    def tearDown(self):
        app.state.rate_limit_rules = self.original_rules
        app.state.rate_limit_counters.clear()

    def test_rate_limit_blocks_second_request_in_window(self):
        first = self.client.get("/health")
        self.assertEqual(first.status_code, 200)

        second = self.client.get("/health")
        self.assertEqual(second.status_code, 429)
        self.assertIn("Retry-After", second.headers)

    def test_rate_limit_uses_per_endpoint_rules(self):
        root_first = self.client.get("/")
        root_second = self.client.get("/")
        self.assertEqual(root_first.status_code, 200)
        self.assertEqual(root_second.status_code, 200)

        root_third = self.client.get("/")
        self.assertEqual(root_third.status_code, 429)


if __name__ == "__main__":
    unittest.main()
