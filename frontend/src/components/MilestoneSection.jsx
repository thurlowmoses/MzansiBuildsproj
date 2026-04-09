import { useState } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase_config";
import MilestoneTimeline from "./MilestoneTimeline";
import "../styles/milestone.css";

const MilestoneSection = ({ projectId, project, milestones, user }) => {
  const [milestoneForm, setMilestoneForm] = useState({ title: "", note: "", status: "todo" });
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = project?.userId === user?.uid;

  const onChange = (event) => {
    const { name, value } = event.target;
    setMilestoneForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!isOwner) {
      setError("Only the project owner can add milestones.");
      return;
    }

    const title = milestoneForm.title.trim();
    if (!title) return;

    try {
      setLoading(true);
      setError("");
      await addDoc(collection(db, "projects", projectId, "milestones"), {
        title,
        note: milestoneForm.note.trim(),
        status: milestoneForm.status,
        createdById: user.uid,
        createdByName: user.displayName || "Developer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (milestoneForm.status === "done") {
        await updateDoc(doc(db, "projects", projectId), {
          milestoneDoneCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }

      setMilestoneForm({ title: "", note: "", status: "todo" });
      setSuccess("Milestone added.");
    } catch {
      setError("Failed to add milestone.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (milestoneId, nextStatus) => {
    if (!isOwner) {
      setError("Only the project owner can update milestones.");
      return;
    }

    const current = milestones.find((milestone) => milestone.id === milestoneId);
    const wasDone = current?.status === "done";
    const nowDone = nextStatus === "done";

    try {
      setActionId(milestoneId);
      await updateDoc(doc(db, "projects", projectId, "milestones", milestoneId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      if (wasDone !== nowDone) {
        await updateDoc(doc(db, "projects", projectId), {
          milestoneDoneCount: increment(nowDone ? 1 : -1),
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      setError("Failed to update milestone.");
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async (milestoneId) => {
    if (!isOwner) {
      setError("Only the project owner can delete milestones.");
      return;
    }

    if (!window.confirm("Delete this milestone?")) return;
    const current = milestones.find((milestone) => milestone.id === milestoneId);

    try {
      setActionId(milestoneId);
      await deleteDoc(doc(db, "projects", projectId, "milestones", milestoneId));

      if (current?.status === "done") {
        await updateDoc(doc(db, "projects", projectId), {
          milestoneDoneCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }

      setSuccess("Milestone deleted.");
    } catch {
      setError("Failed to delete milestone.");
    } finally {
      setActionId("");
    }
  };

  const statusBadgeClass = (status) => {
    if (status === "done") return "milestone-status-badge done";
    if (status === "in-progress") return "milestone-status-badge progress";
    return "milestone-status-badge todo";
  };

  return (
    <section className="milestone-section">
      <h2>Milestones</h2>

      {error ? <p className="milestone-error">{error}</p> : null}
      {success ? <p className="milestone-success">{success}</p> : null}

      {isOwner ? (
        <form onSubmit={handleCreate} className="milestone-form">
          <input
            name="title"
            value={milestoneForm.title}
            onChange={onChange}
            placeholder="Milestone title"
            required
          />
          <textarea
            name="note"
            rows={2}
            value={milestoneForm.note}
            onChange={onChange}
            placeholder="Optional note"
          />
          <div className="milestone-form-row">
            <select name="status" value={milestoneForm.status} onChange={onChange}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button type="submit" className="milestone-add-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Milestone"}
            </button>
          </div>
        </form>
      ) : (
        <p className="milestone-readonly-notice">Only the project owner can add milestones.</p>
      )}

      <div className="milestone-list">
        {milestones.length === 0 ? <p className="milestone-empty">No milestones yet.</p> : null}
        {milestones.map((milestone) => (
          <article key={milestone.id} className="milestone-item">
            <div className="milestone-header">
              <p className="milestone-title">{milestone.title}</p>
              {isOwner ? (
                <select
                  className="milestone-status-select"
                  value={milestone.status || "todo"}
                  onChange={(event) => handleStatusChange(milestone.id, event.target.value)}
                  disabled={actionId === milestone.id}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <span className={statusBadgeClass(milestone.status)}>{milestone.status || "todo"}</span>
              )}
            </div>
            {milestone.note ? <p className="milestone-note">{milestone.note}</p> : null}
            {isOwner ? (
              <button
                type="button"
                className="milestone-delete"
                onClick={() => handleDelete(milestone.id)}
                disabled={actionId === milestone.id}
              >
                Delete
              </button>
            ) : null}
          </article>
        ))}
      </div>

      <h3 className="timeline-heading">Timeline</h3>
      <MilestoneTimeline milestones={milestones} />
    </section>
  );
};

export default MilestoneSection;
