// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const ProjectStatusCard = ({ project, user, completionLoading, onToggleCompletion }) => {
  return (
    <section className="detail-card">
      <h2>Project Status</h2>
      <p>
        Current status: <strong>{project.completed ? "Completed" : "In Progress"}</strong>
      </p>
      {project.completed ? (
        <p className="detail-success">This project is on the Celebration Wall.</p>
      ) : null}

      {(!project.userId || user?.uid === project.userId) ? (
        <button type="button" className="completion-button" onClick={onToggleCompletion} disabled={completionLoading}>
          {completionLoading
            ? "Updating..."
            : project.completed
              ? "Mark as In Progress"
              : "Mark as Completed"}
        </button>
      ) : null}
    </section>
  );
};

export default ProjectStatusCard;

