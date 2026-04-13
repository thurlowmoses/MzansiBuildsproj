// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { Link } from "react-router-dom";

// Handles PublicProfileProjects.
const PublicProfileProjects = ({ projects, displayName, stageColor }) => {
  return (
    <section className="public-profile-section">
      <div className="public-profile-section-head">
        <h2>{displayName.split(" ")[0]}'s projects</h2>
        <span>Recent builds and progress</span>
      </div>

      {projects.length === 0 ? (
        <div className="profile-empty-state public-profile-empty">
          <p>No projects posted yet.</p>
        </div>
      ) : (
        <div className="profile-list-col">
          {projects.map((project) => (
            <article key={project.id} className="profile-project-card public-profile-project-card">
              <div className="profile-project-main">
                <div className="profile-project-headline">
                  <span className="profile-stage-pill" style={{ color: stageColor(project.stage) }}>
                    {project.stage || "idea"}
                  </span>
                  {project.completed ? <span className="profile-stage-icon">🏆</span> : null}
                </div>
                <p className="profile-project-title">{project.title}</p>
                <p className="profile-project-desc">{project.description}</p>
                {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
                  <div className="profile-project-tech-row">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="profile-tech-pill">
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <Link to={`/projects/${project.id}`} className="profile-btn profile-btn-edit public-profile-project-btn">
                Open
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default PublicProfileProjects;

