// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useState } from "react";
import { formatAttachmentSize } from "../utils/feedUtils";

// Handles STAGE CLASS.
const STAGE_CLASS = {
  idea: "stage-idea",
  building: "stage-building",
  beta: "stage-beta",
  completed: "stage-completed",
};

const FeedProjectCard = ({
  project,
  navigate,
  currentUserId,
  onComment,
  onCollab,
  onToggleCompletion,
}) => {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingCompletion, setUpdatingCompletion] = useState(false);

  const stage = project.stage || "idea";
  const stageClass = STAGE_CLASS[stage] || STAGE_CLASS.idea;
  const isOwner = Boolean(currentUserId) && (project.userId === currentUserId || !project.userId);

  // Handles handleComment.
  const handleComment = async () => {
    const value = comment.trim();
    if (!value) return;

    setSubmitting(true);
    await onComment(project.id, value);
    setComment("");
    setSubmitting(false);
  };

  // Handles handleToggleCompletion.
  const handleToggleCompletion = async () => {
    try {
      setUpdatingCompletion(true);
      await onToggleCompletion(project);
    } finally {
      setUpdatingCompletion(false);
    }
  };

  return (
    <article className="project-card">
      <header className="card-header">
        {project.userPhotoURL ? (
          <img
            src={project.userPhotoURL}
            alt={`${project.userName || "Developer"} profile`}
            className="avatar avatar-img"
          />
        ) : (
          <div className="avatar">{(project.userName || "A")[0].toUpperCase()}</div>
        )}
        <div className="card-meta">
          <button
            type="button"
            className="card-username card-username-link"
            onClick={() => project.userId && navigate(`/profile/${project.userId}`)}
          >
            {project.userName || "Developer"}
          </button>
          {project.isGitHub ? (
            <p className="card-time">
              <span className="github-badge">GitHub</span> {project.stars?.toLocaleString()} stars
            </p>
          ) : (
            <p className="card-time">building in public</p>
          )}
        </div>
        <span className={`stage-badge ${stageClass}`}>{stage}</span>
      </header>

      <div className="card-body">
        <h3
          className="card-title"
          onClick={() =>
            project.isGitHub
              ? window.open(project.githubUrl, "_blank", "noopener,noreferrer")
              : navigate(`/projects/${project.id}`)
          }
        >
          {project.title}
          {project.isGitHub ? <span className="external-icon"> â†—</span> : null}
        </h3>

        <p className="card-description">{project.description}</p>

        {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
          <div className="tech-stack">
            {project.techStack.map((tech) => (
              <span key={tech} className="tech-pill">
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        {project.supportNeeded ? (
          <div className="support-box">
            <span className="support-label">Needs help:</span> {project.supportNeeded}
          </div>
        ) : null}

        {project.attachment?.url ? (
          <div className="project-attachment-block">
            {project.attachment.kind === "image" ? (
              <a
                href={project.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="project-attachment-image-link"
              >
                <img
                  src={project.attachment.url}
                  alt={project.attachment.name || "Project attachment"}
                  className="card-code-image"
                />
              </a>
            ) : null}
            <div className="project-attachment-actions">
              <span className="project-attachment-label">
                Attachment: {project.attachment.name || "File"}
                {project.attachment.size ? ` • ${formatAttachmentSize(project.attachment.size)}` : ""}
              </span>
              <a
                href={project.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="project-attachment-open"
              >
                Open file
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {!project.isGitHub ? (
        <>
          <div className="card-actions">
            <button type="button" className="action-btn" onClick={() => navigate(`/projects/${project.id}`)}>
              View details
            </button>
            <button type="button" className="action-btn" onClick={() => setShowComments((prev) => !prev)}>
              Comment
            </button>
            <button type="button" className="action-btn collab" onClick={() => onCollab(project)}>
              Raise hand
            </button>
            {isOwner ? (
              <button
                type="button"
                className="action-btn progress"
                onClick={handleToggleCompletion}
                disabled={updatingCompletion}
              >
                {updatingCompletion
                  ? "Updating..."
                  : project.completed
                    ? "Mark in progress"
                    : "Mark completed"}
              </button>
            ) : null}
          </div>

          {showComments ? (
            <div className="comment-section">
              <div className="comment-input-row">
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Write a comment..."
                  className="comment-input"
                  onKeyDown={(event) => event.key === "Enter" && handleComment()}
                />
                <button
                  type="button"
                  onClick={handleComment}
                  disabled={submitting || !comment.trim()}
                  className="comment-submit"
                >
                  {submitting ? "..." : "Send"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
};

export default FeedProjectCard;

