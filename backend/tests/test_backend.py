import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from main import app


class BackendHardeningTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def _auth_headers(self):
        return {"Authorization": "Bearer fake-token"}

    def _mock_user(self, uid="user-1", email="user@example.com", name="Test User"):
        return {"uid": uid, "email": email, "name": name}

    def test_comments_list_requires_auth(self):
        response = self.client.get("/projects/project-1/comments")
        self.assertEqual(response.status_code, 401)

    def test_projects_list_uses_pagination(self):
        db = MagicMock()
        projects_collection = MagicMock()
        db.collection.return_value = projects_collection

        ordered_query = MagicMock()
        limited_query = MagicMock()
        cursor_query = MagicMock()

        projects_collection.order_by.return_value = ordered_query
        ordered_query.limit.return_value = limited_query
        limited_query.stream.return_value = [
            MagicMock(id="project-1", to_dict=lambda: {"title": "One", "createdAt": "2026-04-05T10:00:00"}),
            MagicMock(id="project-2", to_dict=lambda: {"title": "Two", "createdAt": "2026-04-05T09:00:00"}),
        ]
        limited_query.start_after.return_value = cursor_query
        cursor_query.stream.return_value = []

        cursor_doc = MagicMock()
        cursor_doc.exists = True
        projects_collection.document.return_value.get.return_value = cursor_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user()), patch(
            "routes.projects.get_firestore_client", return_value=db
        ):
            response = self.client.get("/projects", headers=self._auth_headers())

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 2)
        self.assertEqual(payload["nextCursor"], "project-2")
        self.assertEqual(payload["viewer"], "user-1")

    def test_collaboration_requests_are_owner_only(self):
        db = MagicMock()
        project_collection = MagicMock()
        db.collection.return_value = project_collection

        project_doc = MagicMock()
        project_doc.exists = True
        project_doc.to_dict.return_value = {"userId": "owner-1"}

        project_collection.document.return_value.get.return_value = project_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user(uid="user-2")), patch(
            "routes.posts.get_firestore_client", return_value=db
        ):
            response = self.client.get(
                "/projects/project-1/collaboration-requests",
                headers=self._auth_headers(),
            )

        self.assertEqual(response.status_code, 403)

    def test_comment_list_returns_paged_payload_for_authenticated_user(self):
        db = MagicMock()
        projects_collection = MagicMock()
        db.collection.return_value = projects_collection

        project_doc = MagicMock()
        project_doc.exists = True
        projects_collection.document.return_value.get.return_value = project_doc

        comments_collection = MagicMock()
        ordered_query = MagicMock()
        limited_query = MagicMock()

        projects_collection.document.return_value.collection.return_value = comments_collection
        comments_collection.order_by.return_value = ordered_query
        ordered_query.limit.return_value = limited_query
        limited_query.stream.return_value = [
            MagicMock(id="comment-1", to_dict=lambda: {"content": "Nice work", "createdAt": "2026-04-05T10:00:00"}),
        ]

        with patch("auth.verify_firebase_token", return_value=self._mock_user()), patch(
            "routes.posts.get_firestore_client", return_value=db
        ):
            response = self.client.get("/projects/project-1/comments", headers=self._auth_headers())

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["nextCursor"], "comment-1")
        self.assertEqual(payload["viewer"], "user-1")


if __name__ == "__main__":
    unittest.main()