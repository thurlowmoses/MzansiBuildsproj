import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	addDoc,
	collection,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	where,
} from "firebase/firestore";
import { auth, db } from "../firebase_config";
import "../styles/feed.css";

const STAGE_CLASS = {
	idea: "stage-idea",
	building: "stage-building",
	beta: "stage-beta",
	completed: "stage-completed",
};

function ProjectCard({ project, onComment, onCollab, navigate }) {
	const [comment, setComment] = useState("");
	const [showComments, setShowComments] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const stage = project.stage || "idea";
	const stageClass = STAGE_CLASS[stage] || STAGE_CLASS.idea;

	const handleComment = async () => {
		const value = comment.trim();
		if (!value) return;

		setSubmitting(true);
		await onComment(project.id, value);
		setComment("");
		setSubmitting(false);
	};

	return (
		<article className="project-card">
			<header className="card-header">
				<div className="avatar">{(project.userName || "A")[0].toUpperCase()}</div>
				<div className="card-meta">
					<p className="card-username">{project.userName || "Developer"}</p>
					{project.isGitHub ? (
						<p className="card-time">
							<span className="github-badge">GitHub</span> {project.stars?.toLocaleString()} stars
						</p>
					) : (
						<p className="card-time">building in public</p>
					)}
				</div>
				<span className={`stage-badge ${stageClass}`}>{stage}</span>
			</header>

			<div className="card-body">
				<h3
					className="card-title"
					onClick={() =>
						project.isGitHub ? window.open(project.githubUrl, "_blank", "noopener,noreferrer") : navigate(`/projects/${project.id}`)
					}
				>
					{project.title}
					{project.isGitHub ? <span className="external-icon"> ↗</span> : null}
				</h3>

				<p className="card-description">{project.description}</p>

				{Array.isArray(project.techStack) && project.techStack.length > 0 ? (
					<div className="tech-stack">
						{project.techStack.map((tech) => (
							<span key={tech} className="tech-pill">
								{tech}
							</span>
						))}
					</div>
				) : null}

				{project.supportNeeded ? (
					<div className="support-box">
						<span className="support-label">Needs help:</span> {project.supportNeeded}
					</div>
				) : null}
			</div>

			{!project.isGitHub ? (
				<>
					<div className="card-actions">
						<button type="button" className="action-btn" onClick={() => setShowComments((prev) => !prev)}>
							Comment
						</button>
						<button type="button" className="action-btn collab" onClick={() => onCollab(project)}>
							Raise hand
						</button>
					</div>

					{showComments ? (
						<div className="comment-section">
							<div className="comment-input-row">
								<input
									value={comment}
									onChange={(event) => setComment(event.target.value)}
									placeholder="Write a comment..."
									className="comment-input"
									onKeyDown={(event) => event.key === "Enter" && handleComment()}
								/>
								<button type="button" onClick={handleComment} disabled={submitting || !comment.trim()} className="comment-submit">
									{submitting ? "..." : "Send"}
								</button>
							</div>
						</div>
					) : null}
				</>
			) : null}
		</article>
	);
}

function FeedPage() {
	const navigate = useNavigate();
	const [userProjects, setUserProjects] = useState([]);
	const [loadingUser, setLoadingUser] = useState(true);
	const [userError, setUserError] = useState("");
	const [privacyByUserId, setPrivacyByUserId] = useState({});
	const [followingSet, setFollowingSet] = useState(new Set());

	useEffect(() => {
		const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));

		const unsubscribe = onSnapshot(
			projectsQuery,
			(snapshot) => {
				const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
				setUserProjects(items);
				setLoadingUser(false);
			},
			(err) => {
				setUserError(err?.message || "Could not load user project feed.");
				setLoadingUser(false);
			}
		);

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
			const mapping = {};
			snapshot.docs.forEach((docItem) => {
				const row = docItem.data() || {};
				const uid = row.uid || docItem.id;
				mapping[uid] = Boolean(row.isPrivate);
			});
			setPrivacyByUserId(mapping);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (!auth.currentUser?.uid) {
			setFollowingSet(new Set());
			return;
		}

		const followsQuery = query(collection(db, "follows"), where("followerId", "==", auth.currentUser.uid));

		const unsubscribe = onSnapshot(followsQuery, (snapshot) => {
			const nextSet = new Set(snapshot.docs.map((docItem) => (docItem.data() || {}).followingId).filter(Boolean));
			setFollowingSet(nextSet);
		});

		return () => unsubscribe();
	}, [auth.currentUser?.uid]);

	const visibleUserProjects = useMemo(() => {
		const currentUserId = auth.currentUser?.uid;

		return userProjects.filter((project) => {
			const ownerId = project.userId;

			if (!ownerId) {
				return true;
			}

			if (ownerId === currentUserId) {
				return true;
			}

			const isPrivate = Boolean(privacyByUserId[ownerId]);
			if (!isPrivate) {
				return true;
			}

			return followingSet.has(ownerId);
		});
	}, [userProjects, privacyByUserId, followingSet]);

	const handleComment = async (projectId, text) => {
		if (!auth.currentUser) return;
		await addDoc(collection(db, "projects", projectId, "comments"), {
			content: text,
			userId: auth.currentUser.uid,
			userName: auth.currentUser.displayName || "Anonymous",
			createdAt: serverTimestamp(),
		});
	};

	const handleCollab = async (project) => {
		if (!auth.currentUser) {
			window.alert("Please log in first.");
			return;
		}

		if (project.userId === auth.currentUser.uid) {
			window.alert("This is your own project.");
			return;
		}

		await addDoc(collection(db, "collabRequests"), {
			projectId: project.id,
			projectTitle: project.title,
			projectOwnerId: project.userId,
			fromUserId: auth.currentUser.uid,
			fromUserName: auth.currentUser.displayName || "Anonymous",
			message: `I would like to collaborate on ${project.title}`,
			status: "pending",
			createdAt: serverTimestamp(),
		});

		window.alert("Collaboration request sent.");
	};

	if (loadingUser) {
		return (
			<main className="feed-page">
				<p className="feed-loading">Loading feed...</p>
			</main>
		);
	}

	return (
		<main className="feed-page">
			<div className="feed-header">
				<h1 className="feed-title">What developers are building</h1>
				<button type="button" className="new-project-btn" onClick={() => navigate("/projects/new")}>
					+ New Project
				</button>
			</div>

			{userError ? <p className="feed-error">{userError}</p> : null}
			{visibleUserProjects.length > 0 ? (
				<>
					<p className="feed-section-label">From the community</p>
					<section className="feed-list">
						{visibleUserProjects.map((project) => (
							<ProjectCard key={project.id} project={project} onComment={handleComment} onCollab={handleCollab} navigate={navigate} />
						))}
					</section>
				</>
			) : null}

			{visibleUserProjects.length === 0 && !loadingUser ? (
				<div className="feed-empty">
					<p>No projects posted yet. Be the first to build in public.</p>
					<button type="button" onClick={() => navigate("/projects/new")} className="new-project-btn feed-empty-btn">
						Post your project
					</button>
				</div>
			) : null}

		</main>
	);
}

export default FeedPage;
