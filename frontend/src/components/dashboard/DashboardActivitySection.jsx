// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const DashboardActivitySection = ({ recentActivity, onOpenActivity, formatTimeLabel }) => {
  return (
    <section className="dashboard-section">
      <h2 className="section-title">Recent Activity</h2>
      {recentActivity.length === 0 ? (
        <div className="empty-state">
          <p>No activity yet. Check back when you get collaborator interactions!</p>
        </div>
      ) : (
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className={`activity-item ${activity.isRead ? "read" : "unread"}`}
              onClick={() => onOpenActivity(activity.projectId)}
            >
              <div className="activity-dot" />
              <div className="activity-content">
                <p className="activity-message">
                  <strong>{activity.actorName || "Developer"}</strong> {activity.message}
                </p>
                <span className="activity-time">{formatTimeLabel(activity.createdAt)}</span>
              </div>
              <span className="activity-type">{activity.type}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardActivitySection;

