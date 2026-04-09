import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase_config";
import "../styles/celebration-wall.css";

function getTimestampSeconds(value) {
	if (!value) return 0;
	if (typeof value?.seconds === "number") return value.seconds;
	const parsed = Math.floor(new Date(value).getTime() / 1000);
	return Number.isNaN(parsed) ? 0 : parsed;
}

function CelebrationWall() {
	const [projects, setProjects] = useState([]);
	const [breakthroughs, setBreakthroughs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const completedQuery = query(collection(db, "projects"), where("completed", "==", true));

		const unsubscribe = onSnapshot(
			completedQuery,
			(snapshot) => {
				const entries = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
				setProjects(entries);
				setLoading(false);
			},
			(err) => {
				setError(err?.message || "Could not load celebration wall.");
				setLoading(false);
			}
		);

		return unsubscribe;
	}, []);

	useEffect(() => {
		const breakthroughsQuery = query(collectionGroup(db, "milestones"));

		const unsubscribe = onSnapshot(
			breakthroughsQuery,
			(snapshot) => {
				const entries = snapshot.docs.map((entry) => {
					const row = entry.data() || {};
					const projectId = entry.ref.parent.parent?.id || "";
					return {
						id: entry.id,
						projectId,
						status: row.status || "",
						title: row.title || "Milestone completed",
						note: row.note || "",
						createdByName: row.createdByName || "Developer",
						updatedAt: row.updatedAt,
						createdAt: row.createdAt,
					};
				});

				setBreakthroughs(entries.filter((milestone) => milestone.status === "done"));
			},
			(err) => {
				setError(err?.message || "Could not load milestone breakthroughs.");
			}
		);

		return unsubscribe;
	}, []);

	const sortedProjects = useMemo(() => {
		return [...projects].sort((a, b) => {
			const aSeconds = getTimestampSeconds(a?.completedAt);
			const bSeconds = getTimestampSeconds(b?.completedAt);
			return bSeconds - aSeconds;
		});
	}, [projects]);

	const sortedBreakthroughs = useMemo(() => {
		return [...breakthroughs].sort((a, b) => {
			const aSeconds = getTimestampSeconds(a?.updatedAt || a?.createdAt);
			const bSeconds = getTimestampSeconds(b?.updatedAt || b?.createdAt);
			return bSeconds - aSeconds;
		});
	}, [breakthroughs]);

	return (
		<main className="celebration-page">
			<section className="celebration-container">
				<h1>Celebration Wall</h1>
				<p className="celebration-subtitle">
					Completed projects from developers building in public.
				</p>

				{loading && <p>Loading completed projects...</p>}
				{error && <p className="celebration-error">{error}</p>}

				{!loading && !error && sortedProjects.length === 0 && (
					<p>No completed projects yet. Ship one and come celebrate here.</p>
				)}

				<section className="celebration-grid">
					{sortedProjects.map((project) => (
						<article key={project.id} className="celebration-card">
							<h2>{project.title}</h2>
							<p>{project.description}</p>
							<p className="celebration-meta">Built by {project.userName || "Developer"}</p>
							{Array.isArray(project.techStack) && project.techStack.length > 0 && (
								<div className="celebration-tags">
									{project.techStack.map((tech) => (
										<span key={tech}>{tech}</span>
									))}
								</div>
							)}
							<Link to={`/projects/${project.id}`} className="celebration-link">
								View Project
							</Link>
						</article>
					))}
				</section>

				<section className="celebration-breakthroughs">
					<h2 className="celebration-breakthrough-title">Breakthrough Milestones</h2>
					{sortedBreakthroughs.length === 0 ? (
						<p>No breakthroughs yet. Mark milestones as done to celebrate wins.</p>
					) : (
						<div className="celebration-grid">
							{sortedBreakthroughs.map((milestone) => (
								<article key={`${milestone.projectId}-${milestone.id}`} className="celebration-card">
									<h2>{milestone.title}</h2>
									<p>{milestone.note || "Major progress unlocked."}</p>
									<p className="celebration-meta">Breakthrough by {milestone.createdByName}</p>
									{milestone.projectId ? (
										<Link to={`/projects/${milestone.projectId}`} className="celebration-link">
											View Project
										</Link>
									) : null}
								</article>
							))}
						</div>
					)}
				</section>
			</section>
		</main>
	);
}

export default CelebrationWall;
