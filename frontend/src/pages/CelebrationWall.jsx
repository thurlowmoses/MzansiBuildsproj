import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase_config";
import "../styles/celebration-wall.css";

function CelebrationWall() {
	const [projects, setProjects] = useState([]);
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

	const sortedProjects = useMemo(() => {
		return [...projects].sort((a, b) => {
			const aSeconds = a?.completedAt?.seconds || 0;
			const bSeconds = b?.completedAt?.seconds || 0;
			return bSeconds - aSeconds;
		});
	}, [projects]);

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
			</section>
		</main>
	);
}

export default CelebrationWall;
