// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

function getTimeLabel(value) {
	const seconds = value?.seconds;
	if (!seconds) return "now";
	const date = new Date(seconds * 1000);
	return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Handles MilestoneTimeline.
function MilestoneTimeline({ milestones = [] }) {
	if (!Array.isArray(milestones) || milestones.length === 0) {
		return <p className="timeline-empty">No milestones yet.</p>;
	}

	const sorted = [...milestones].sort((a, b) => {
		const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
		const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
		return bTime - aTime;
	});

	return (
		<div className="timeline-list">
			{sorted.map((milestone) => (
				<article key={milestone.id} className={`timeline-item status-${milestone.status || "todo"}`}>
					<div className="timeline-dot" aria-hidden="true" />
					<div className="timeline-content">
						<p className="timeline-title">{milestone.title || "Untitled milestone"}</p>
						<p className="timeline-meta">
							{(milestone.status || "todo").replace("-", " ")} • {getTimeLabel(milestone.updatedAt || milestone.createdAt)}
						</p>
						{milestone.note ? <p className="timeline-note">{milestone.note}</p> : null}
					</div>
				</article>
			))}
		</div>
	);
}

export default MilestoneTimeline;

