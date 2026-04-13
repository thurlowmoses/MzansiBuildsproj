// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const ProfileConnectionsList = ({ rows, onOpenProfile }) => {
  return (
    <div className="profile-list-col">
      {rows.map((row) => (
        <button
          key={row.uid}
          type="button"
          className="profile-connection-card"
          onClick={() => onOpenProfile(row.uid)}
        >
          <div className="profile-connection-avatar">
            {row.avatarUrl ? (
              <img src={row.avatarUrl} alt="" className="profile-connection-avatar-img" />
            ) : (
              (row.name || "D")[0].toUpperCase()
            )}
          </div>
          <div>
            <p className="profile-connection-name">{row.name || row.email || "Developer"}</p>
            <p className="profile-connection-meta">{row.bio || "Developer"}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

// Handles ProfileProjects.
const ProfileProjects = ({ projects, stageClass, onOpenProject, onEditProject, onCreateFirstProject }) => {
  if (projects.length === 0) {
    return (
      <div className="profile-list-col">
        <div className="profile-empty-state">
          <p>No projects yet.</p>
          <button type="button" className="profile-btn profile-btn-save" onClick={onCreateFirstProject}>
            Post your first project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-list-col">
      {projects.map((project) => (
        <div key={project.id} className="profile-project-card">
          <div className="profile-project-main">
            <div className="profile-project-headline">
              <span className={`profile-stage-pill ${stageClass(project.stage)}`}>
                {project.stage || "idea"}
              </span>
              {project.completed ? <span className="profile-stage-icon">TROPHY</span> : null}
            </div>
            <p className="profile-project-title" onClick={() => onOpenProject(project.id)}>
              {project.title}
            </p>
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
          <button type="button" className="profile-btn profile-btn-edit" onClick={() => onEditProject(project.id)}>
            Edit
          </button>
        </div>
      ))}
    </div>
  );
};

const ProfileTabPanel = ({
  activeTab,
  projects,
  followers,
  following,
  stageClass,
  onOpenProject,
  onEditProject,
  onCreateFirstProject,
  onOpenConnection,
  onDiscover,
}) => {
  if (activeTab === "projects") {
    return (
      <ProfileProjects
        projects={projects}
        stageClass={stageClass}
        onOpenProject={onOpenProject}
        onEditProject={onEditProject}
        onCreateFirstProject={onCreateFirstProject}
      />
    );
  }

  if (activeTab === "followers") {
    return followers.length === 0 ? (
      <div className="profile-list-col">
        <div className="profile-empty-state">
          <p>No followers yet.</p>
        </div>
      </div>
    ) : (
      <ProfileConnectionsList rows={followers} onOpenProfile={onOpenConnection} />
    );
  }

  return following.length === 0 ? (
    <div className="profile-list-col">
      <div className="profile-empty-state">
        <p>Not following anyone yet.</p>
        <button type="button" className="profile-btn profile-btn-save" onClick={onDiscover}>
          Find developers
        </button>
      </div>
    </div>
  ) : (
    <ProfileConnectionsList rows={following} onOpenProfile={onOpenConnection} />
  );
};

export default ProfileTabPanel;

