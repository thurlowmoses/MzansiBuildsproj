import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from main import app
from routes._helpers import is_breakthrough_milestone


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

    def test_complete_project_marks_project_completed(self):
        db = MagicMock()
        projects_collection = MagicMock()
        activities_collection = MagicMock()

        def collection_side_effect(name):
            if name == "projects":
                return projects_collection
            if name == "activities":
                return activities_collection
            raise AssertionError(name)

        db.collection.side_effect = collection_side_effect

        project_doc = MagicMock()
        project_doc.exists = True
        project_doc.to_dict.return_value = {"userId": "user-1", "stage": "building"}
        projects_collection.document.return_value.get.return_value = project_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user()), patch(
            "routes.projects.get_firestore_client", return_value=db
        ):
            response = self.client.post(
                "/projects/project-1/complete",
                headers=self._auth_headers(),
                json={"complete": True},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["completed"])
        projects_collection.document.return_value.set.assert_called_once()

    def test_delete_project_removes_owned_project(self):
        db = MagicMock()
        projects_collection = MagicMock()
        activities_collection = MagicMock()
        notifications_collection = MagicMock()

        def collection_side_effect(name):
            if name == "projects":
                return projects_collection
            if name == "activities":
                return activities_collection
            if name == "notifications":
                return notifications_collection
            raise AssertionError(name)

        db.collection.side_effect = collection_side_effect

        project_doc = MagicMock()
        project_doc.exists = True
        project_doc.to_dict.return_value = {"userId": "user-1", "title": "Demo App"}
        projects_collection.document.return_value.get.return_value = project_doc

        for subcollection_name in ("comments", "milestones", "collaborationRequests"):
            subcollection = MagicMock()
            empty_query = MagicMock()
            empty_query.stream.return_value = []
            subcollection.stream.return_value = []
            projects_collection.document.return_value.collection.return_value = subcollection

        activities_query = MagicMock()
        activities_query.stream.return_value = []
        activities_collection.where.return_value = activities_query

        notifications_query = MagicMock()
        notifications_query.stream.return_value = []
        notifications_collection.where.return_value = notifications_query

        with patch("auth.verify_firebase_token", return_value=self._mock_user()), patch(
            "routes.projects.get_firestore_client", return_value=db
        ):
            response = self.client.delete("/projects/project-1", headers=self._auth_headers())

        self.assertEqual(response.status_code, 200)
        projects_collection.document.return_value.delete.assert_called_once()

    def test_delete_project_blocks_non_owner(self):
        db = MagicMock()
        projects_collection = MagicMock()
        db.collection.return_value = projects_collection

        project_doc = MagicMock()
        project_doc.exists = True
        project_doc.to_dict.return_value = {"userId": "owner-1", "title": "Demo App"}
        projects_collection.document.return_value.get.return_value = project_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user(uid="user-2")), patch(
            "routes.projects.get_firestore_client", return_value=db
        ):
            response = self.client.delete("/projects/project-1", headers=self._auth_headers())

        self.assertEqual(response.status_code, 403)

    def test_profile_update_merges_fields(self):
        db = MagicMock()
        users_collection = MagicMock()
        db.collection.return_value = users_collection
        user_doc = MagicMock()
        users_collection.document.return_value = user_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user()), patch(
            "routes.users.get_firestore_client", return_value=db
        ):
            response = self.client.patch(
                "/users/me",
                headers=self._auth_headers(),
                json={"displayName": "Updated User", "bio": "Building something new", "isPrivate": True},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["uid"], "user-1")
        self.assertEqual(payload["applied"]["displayName"], "Updated User")
        user_doc.set.assert_called_once()

    def test_comment_creation_writes_notification(self):
        db = MagicMock()
        projects_collection = MagicMock()
        notifications_collection = MagicMock()
        activities_collection = MagicMock()

        def collection_side_effect(name):
            if name == "projects":
                return projects_collection
            if name == "notifications":
                return notifications_collection
            if name == "activities":
                return activities_collection
            raise AssertionError(name)

        db.collection.side_effect = collection_side_effect

        project_doc = MagicMock()
        project_doc.exists = True
        project_doc.to_dict.return_value = {"userId": "owner-1", "title": "Demo App"}
        projects_collection.document.return_value.get.return_value = project_doc

        comment_doc = MagicMock()
        projects_collection.document.return_value.collection.return_value.document.return_value = comment_doc
        notification_doc = MagicMock()
        notifications_collection.document.return_value = notification_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user(uid="user-2")), patch(
            "routes.posts.get_firestore_client", return_value=db
        ):
            response = self.client.post(
                "/projects/project-1/comments",
                headers=self._auth_headers(),
                json={"content": "Nice work"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(notification_doc.set.called)

    def test_collaboration_request_writes_notification(self):
        db = MagicMock()
        projects_collection = MagicMock()
        notifications_collection = MagicMock()
        activities_collection = MagicMock()

        def collection_side_effect(name):
            if name == "projects":
                return projects_collection
            if name == "notifications":
                return notifications_collection
            if name == "activities":
                return activities_collection
            raise AssertionError(name)

        db.collection.side_effect = collection_side_effect

        project_doc = MagicMock()
        project_doc.exists = True
        project_doc.to_dict.return_value = {"userId": "owner-1", "title": "Demo App"}
        projects_collection.document.return_value.get.return_value = project_doc

        request_doc = MagicMock()
        projects_collection.document.return_value.collection.return_value.document.return_value = request_doc
        notification_doc = MagicMock()
        notifications_collection.document.return_value = notification_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user(uid="user-2")), patch(
            "routes.posts.get_firestore_client", return_value=db
        ):
            response = self.client.post(
                "/projects/project-1/collaboration-requests",
                headers=self._auth_headers(),
                json={"message": "I can help"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(notification_doc.set.called)

    def test_breakthrough_helper_detects_done_milestones(self):
        self.assertTrue(is_breakthrough_milestone({"status": "done"}))
        self.assertFalse(is_breakthrough_milestone({"status": "todo"}))

    def test_follow_creates_notification(self):
        db = MagicMock()
        follows_collection = MagicMock()
        users_collection = MagicMock()
        notifications_collection = MagicMock()

        def collection_side_effect(name):
            if name == "follows":
                return follows_collection
            if name == "users":
                return users_collection
            if name == "notifications":
                return notifications_collection
            raise AssertionError(name)

        db.collection.side_effect = collection_side_effect

        target_user = MagicMock()
        target_user.exists = True
        target_user.to_dict.return_value = {"uid": "target-1", "displayName": "Target User"}
        users_collection.document.return_value.get.return_value = target_user

        follow_doc = MagicMock()
        follows_collection.document.return_value = follow_doc
        notification_doc = MagicMock()
        notifications_collection.document.return_value = notification_doc

        with patch("auth.verify_firebase_token", return_value=self._mock_user(uid="user-1")), patch(
            "routes.users.get_firestore_client", return_value=db
        ):
            response = self.client.post(
                "/users/follow",
                headers=self._auth_headers(),
                json={"targetUserId": "target-1"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(follow_doc.set.called)
        self.assertTrue(notification_doc.set.called)

    def test_follow_prevents_self_follow(self):
        db = MagicMock()

        with patch("auth.verify_firebase_token", return_value=self._mock_user(uid="user-1")), patch(
            "routes.users.get_firestore_client", return_value=db
        ):
            response = self.client.post(
                "/users/follow",
                headers=self._auth_headers(),
                json={"targetUserId": "user-1"},
            )

        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()