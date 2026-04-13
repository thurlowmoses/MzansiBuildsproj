// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const ProjectSummary = ({ project, isOwner, onEditProject, formatAttachmentSize }) => {
  return (
    <>
      <header className="detail-header">
        <h1>{project.title}</h1>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <span className="detail-stage">{project.stage || "idea"}</span>
          {isOwner ? (
            <button type="button" className="completion-button" onClick={onEditProject}>
              Edit project
            </button>
          ) : null}
        </div>
      </header>

      <p className="detail-description">{project.description}</p>

      {project.attachment?.url ? (
        <section className="detail-attachment-wrap" aria-label="Project attachment">
          {project.attachment.kind === "image" ? (
            <a href={project.attachment.url} target="_blank" rel="noopener noreferrer">
              <img
                src={project.attachment.url}
                alt={project.attachment.name || "Project attachment"}
                className="detail-code-image"
              />
            </a>
          ) : null}
          <div className="detail-attachment-row">
            <p className="detail-attachment-name">
              Attachment: {project.attachment.name || "File"}
              {project.attachment.size ? ` • ${formatAttachmentSize(project.attachment.size)}` : ""}
            </p>
            <a className="detail-attachment-open" href={project.attachment.url} target="_blank" rel="noopener noreferrer">
              Open file
            </a>
          </div>
        </section>
      ) : null}

      {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
        <div className="detail-tags">
          {project.techStack.map((tech) => (
            <span key={tech} className="detail-tag">
              {tech}
            </span>
          ))}
        </div>
      ) : null}

      <p className="detail-meta">Built by {project.userName || "Developer"}</p>
    </>
  );
};

export default ProjectSummary;

