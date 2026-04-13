// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import "../styles/feed.css";
import "../styles/discovery.css";

// Handles STAGE CLASS.
const STAGE_CLASS = {
  idea: "stage-idea",
  building: "stage-building",
  beta: "stage-beta",
  completed: "stage-completed",
};

// Handles DiscoveryCard.
const DiscoveryCard = ({ project, onOpenProfile, onOpenProject, trendingLabel }) => {
  const stage = project.stage || "building";
  const stageClass = STAGE_CLASS[stage] || STAGE_CLASS.building;
  const canOpenProfile = Boolean(project.userId) && !project.isGitHub;

  return (
    <article className="project-card discovery-card">
      <header className="card-header">
        {canOpenProfile ? (
          <button
            type="button"
            className="avatar-link"
            onClick={() => onOpenProfile(`/profile/${project.userId}`)}
            aria-label={`View ${project.userName || "Developer"} profile`}
          >
            {project.userPhotoURL ? (
              <img
                src={project.userPhotoURL}
                alt={`${project.userName || "Developer"} avatar`}
                className="avatar avatar-img"
              />
            ) : (
              <div className="avatar">{(project.userName || "D")[0].toUpperCase()}</div>
            )}
          </button>
        ) : project.userPhotoURL ? (
          <img
            src={project.userPhotoURL}
            alt={`${project.userName || "Developer"} avatar`}
            className="avatar avatar-img"
          />
        ) : (
          <div className="avatar">{(project.userName || "D")[0].toUpperCase()}</div>
        )}

        <div className="card-meta">
          {canOpenProfile ? (
            <button
              type="button"
              className="card-username card-username-link"
              onClick={() => onOpenProfile(`/profile/${project.userId}`)}
            >
              {project.userName || "Developer"}
            </button>
          ) : (
            <p className="card-username">{project.userName || "Developer"}</p>
          )}

          <p className="card-time">
            {project.isGitHub ? (
              <span className="github-badge">GitHub</span>
            ) : (
              <span className="github-badge mzanzi-badge">Mzansi</span>
            )}
            {project.stars?.toLocaleString
              ? `${project.stars.toLocaleString()} stars`
              : project.isGitHub
                ? "Trending project"
                : "Building in public"}
          </p>
        </div>

        <span className={`stage-badge ${stageClass}`}>{stage}</span>
      </header>

      <div className="card-body">
        <h3 className="card-title" onClick={() => onOpenProject(project)}>
          {project.title}
          {project.isGitHub ? <span className="external-icon"> â†—</span> : null}
        </h3>

        <p className="card-description">{project.description}</p>

        {!project.isGitHub && trendingLabel ? (
          <span className="trend-pill">{trendingLabel}</span>
        ) : null}

        {!project.isGitHub && project.supportNeeded ? (
          <div className="support-box">
            <span className="support-label">Struggling with:</span> {project.supportNeeded}
          </div>
        ) : null}

        {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
          <div className="tech-stack">
            {project.techStack.map((tech) => (
              <span key={`${project.id}-${tech}`} className="tech-pill">
                {tech}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default DiscoveryCard;

