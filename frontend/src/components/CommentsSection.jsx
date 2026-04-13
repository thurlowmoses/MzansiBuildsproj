// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase_config";
import "../styles/comments.css";

// Handles CommentsSection.
const CommentsSection = ({ projectId, project, comments, user }) => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handles handleSubmit.
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || !user) return;

    try {
      setLoading(true);
      setError("");

      await addDoc(collection(db, "projects", projectId, "comments"), {
        content: text.trim(),
        userId: user.uid,
        userName: user.displayName || "Developer",
        userPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "projects", projectId), {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      if (project?.userId && project.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "comment",
          recipientId: project.userId,
          actorId: user.uid,
          actorName: user.displayName || "Developer",
          message: `${user.displayName || "Developer"} commented on "${project.title}".`,
          isRead: false,
          createdAt: serverTimestamp(),
          projectId,
          projectTitle: project.title,
        });
      }

      setText("");
    } catch {
      setError("Failed to post comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="comments-section">
      <h2>Comments ({comments.length})</h2>

      <div className="comments-form">
        <form onSubmit={handleSubmit}>
          <div className="comments-input-row">
            <input
              className="comments-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a comment..."
              required
              onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && handleSubmit(event)}
            />
            <button type="submit" className="comments-submit-btn" disabled={loading || !text.trim()}>
              {loading ? "..." : "Post"}
            </button>
          </div>
          {error ? <p className="comments-error">{error}</p> : null}
        </form>
      </div>

      <div className="comment-list">
        {comments.length === 0 ? <p className="comment-empty">No comments yet. Be the first.</p> : null}
        {comments.map((comment) => (
          <article key={comment.id} className="comment-item">
            <div className="comment-author-row">
              <div className="comment-avatar">
                {comment.userPhoto ? (
                  <img src={comment.userPhoto} alt="" />
                ) : (
                  (comment.userName || "D")[0].toUpperCase()
                )}
              </div>
              <p className="comment-author" onClick={() => navigate(`/profile/${comment.userId}`)}>
                {comment.userName}
              </p>
            </div>
            <p className="comment-text">{comment.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CommentsSection;

