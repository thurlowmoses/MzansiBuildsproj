// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const DashboardProjectsSection = ({ userProjects, getStageColor, onOpenProject, onCreateProject }) => {
  return (
    <section className="dashboard-section">
      <h2 className="section-title">Active Projects</h2>
      {userProjects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Create your first project to get started!</p>
          <button className="btn-primary" onClick={onCreateProject}>
            Create Project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {userProjects.map((project) => (
            <div key={project.id} className="project-list-item" onClick={() => onOpenProject(project.id)}>
              <div className="project-list-header">
                <h3 className="project-title">{project.title || "Untitled Project"}</h3>
                <span className="project-stage" style={{ backgroundColor: getStageColor(project.stage) }}>
                  {project.stage?.charAt(0).toUpperCase() + project.stage?.slice(1)}
                </span>
              </div>
              <p className="project-description">{project.description || "No description"}</p>
              <div className="project-meta">
                <span className="meta-item">👀 {project.views || 0} views</span>
                {project.milestones ? <span className="meta-item">🎯 {project.milestones.length} milestones</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardProjectsSection;

