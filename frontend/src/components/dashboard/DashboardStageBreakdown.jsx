// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const DashboardStageBreakdown = ({ projectStats }) => {
  const stageData = [
    { stage: "Idea", count: projectStats.idea, color: "#9b59b6" },
    { stage: "Building", count: projectStats.building, color: "#3498db" },
    { stage: "Beta", count: projectStats.beta, color: "#f39c12" },
    { stage: "Completed", count: projectStats.completed, color: "#27ae60" },
  ];

  return (
    <section className="dashboard-section">
      <h2 className="section-title">Projects by Stage</h2>
      <div className="stage-bars">
        {stageData.map(({ stage, count, color }) => (
          <div key={stage} className="stage-bar-container">
            <div className="stage-label">{stage}</div>
            <div className="stage-bar">
              <div
                className="stage-bar-fill"
                style={{
                  width: `${projectStats.total > 0 ? (count / projectStats.total) * 100 : 0}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <div className="stage-count">{count}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardStageBreakdown;

