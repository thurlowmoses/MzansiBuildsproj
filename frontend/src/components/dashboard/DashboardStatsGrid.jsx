// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const DashboardStatsGrid = ({ projectStats, activeProjectCount, followersCount, followingCount }) => {
  const stats = [
    { label: "Total Projects", value: projectStats.total },
    { label: "Active Projects", value: activeProjectCount },
    { label: "Completed", value: projectStats.completed },
    { label: "Followers", value: followersCount },
    { label: "Following", value: followingCount },
  ];

  return (
    <div className="stats-grid">
      {stats.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsGrid;

