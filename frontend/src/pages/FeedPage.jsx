import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase_config";
import "../styles/feed.css";

function FeedPage() {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));

		const unsubscribe = onSnapshot(
			projectsQuery,
			(snapshot) => {
				const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
				setProjects(items);
				setLoading(false);
			},
			(err) => {
				setError(err?.message || "Could not load project feed.");
				setLoading(false);
			}
		);

		return unsubscribe;
	}, []);

	return (
		<main className="feed-page">
			<div className="feed-container">
				<h1 className="feed-title">Live Builder Feed</h1>
				<p className="feed-subtitle">See what other developers are building in public.</p>

				{loading && <p className="feed-state">Loading projects...</p>}
				{error && <p className="feed-error">{error}</p>}

				{!loading && !error && projects.length === 0 && (
					<p className="feed-state">No projects yet. Be the first to post one.</p>
				)}

				<section className="feed-list">
					{projects.map((project) => (
						<article key={project.id} className="feed-card">
							<div className="feed-card-header">
								<h2>{project.title}</h2>
								<span className="feed-stage">{project.stage || "idea"}</span>
							</div>

							<p className="feed-description">{project.description}</p>

							{Array.isArray(project.techStack) && project.techStack.length > 0 && (
								<div className="feed-tags">
									{project.techStack.map((tech) => (
										<span key={tech} className="feed-tag">
											{tech}
										</span>
									))}
								</div>
							)}

							{project.supportNeeded && (
								<p className="feed-support">
									<strong>Support needed:</strong> {project.supportNeeded}
								</p>
							)}

							<p className="feed-meta">Posted by {project.userName || "Developer"}</p>
							<Link to={`/projects/${project.id}`} className="feed-link">
								View Project Details
							</Link>
						</article>
					))}
				</section>
			</div>
		</main>
	);
}

export default FeedPage;
