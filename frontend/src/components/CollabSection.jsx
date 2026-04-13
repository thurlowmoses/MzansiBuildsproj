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
import "../styles/collab.css";

// Handles CollabSection.
const CollabSection = ({ projectId, project, requests, user }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isOwner = project?.userId === user?.uid;

  // Handles handleRaiseHand.
  const handleRaiseHand = async (event) => {
    event.preventDefault();

    if (!user) {
      setError("Please log in.");
      return;
    }

    if (isOwner) {
      setError("You cannot request collaboration on your own project.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await addDoc(collection(db, "projects", projectId, "collaborationRequests"), {
        requesterId: user.uid,
        requesterName: user.displayName || "Developer",
        requesterEmail: user.email || "",
        requesterPhotoURL: user.photoURL || "",
        message: message.trim(),
        status: "open",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "projects", projectId), {
        collabCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      if (project?.userId) {
        await addDoc(collection(db, "notifications"), {
          type: "collaboration",
          recipientId: project.userId,
          actorId: user.uid,
          actorName: user.displayName || "Developer",
          message: `${user.displayName || "Developer"} raised their hand for "${project.title}".`,
          isRead: false,
          createdAt: serverTimestamp(),
          projectId,
          projectTitle: project.title,
        });
      }

      setMessage("");
      setSuccess(true);
    } catch {
      setError("Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="collab-section">
      <h2>Raise Hand for Collaboration</h2>

      {error ? <p className="collab-error">{error}</p> : null}

      {!isOwner ? (
        success ? (
          <div className="collab-success-box">
            <p className="collab-success-title">Collaboration request sent.</p>
            <p className="collab-success-sub">Want to introduce yourself directly?</p>
            <button
              type="button"
              className="collab-message-btn"
              onClick={() =>
                navigate(
                  `/messages?to=${project?.userId}&name=${encodeURIComponent(project?.userName || "Developer")}`
                )
              }
            >
              Send a message to {project?.userName || "the developer"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRaiseHand} className="collab-form">
            <textarea
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="How can you help this project? What skills do you bring?"
              required
            />
            <button type="submit" className="collab-submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Raise Hand"}
            </button>
          </form>
        )
      ) : (
        <div className="collab-request-list">
          <p className="collab-requests-heading">Requests received ({requests.length})</p>
          {requests.length === 0 ? (
            <p className="collab-request-empty">No collaboration requests yet.</p>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="collab-request-item">
                <div className="collab-request-header">
                  <div className="collab-requester-avatar">
                    {(request.requesterName || "D")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="collab-requester-name">{request.requesterName}</p>
                    <span className={`collab-request-status ${request.status || "open"}`}>
                      {request.status || "open"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="collab-message-link"
                    onClick={() =>
                      navigate(`/messages?to=${request.requesterId}&name=${encodeURIComponent(request.requesterName || "Developer")}`)
                    }
                  >
                    Message
                  </button>
                </div>
                <p className="collab-request-message">{request.message}</p>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default CollabSection;

