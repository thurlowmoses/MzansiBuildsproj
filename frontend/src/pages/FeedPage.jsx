// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useNavigate } from "react-router-dom";
import {
	addDoc,
	collection,
	doc,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import FeedFollowBanner from "../components/FeedFollowBanner";
import FeedProjectCard from "../components/FeedProjectCard";
import { auth, db } from "../firebase_config";
import useFeedData from "../hooks/useFeedData";
import "../styles/feed.css";

// Handles FeedPage.
function FeedPage() {
	// Feed data stays live through Firestore snapshots.
	const navigate = useNavigate();
	const { loadingUser, userError, displayProjects, hasFollowing } = useFeedData();

	// Handles handleComment.
	const handleComment = async (projectId, text) => {
		// Write comments to the project subcollection.
		if (!auth.currentUser) return;
		await addDoc(collection(db, "projects", projectId, "comments"), {
			content: text,
			userId: auth.currentUser.uid,
			userName: auth.currentUser.displayName || "Anonymous",
			createdAt: serverTimestamp(),
		});
	};

	// Handles handleCollab.
	const handleCollab = async (project) => {
		// Store a simple collaboration request record.
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

	// Handles handleCompletionToggle.
	const handleCompletionToggle = async (project) => {
		if (!auth.currentUser?.uid) {
			window.alert("Please log in first.");
			return;
		}

		if (project.userId && project.userId !== auth.currentUser.uid) {
			window.alert("Only the project owner can change completion status.");
			return;
		}

		const markCompleted = !project.completed;
		await updateDoc(doc(db, "projects", project.id), {
			completed: markCompleted,
			stage: markCompleted ? "completed" : "building",
			completedAt: markCompleted ? serverTimestamp() : null,
			updatedAt: serverTimestamp(),
		});
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
			{displayProjects.length > 0 ? (
				<>
					{/* Follow banner - only shown when user follows nobody yet */}
					{!hasFollowing && auth.currentUser ? (
						<FeedFollowBanner onFindDevelopers={() => navigate("/discovery")} />
					) : null}
					<p className="feed-section-label">From the community</p>
					<section className="feed-list">
						{displayProjects.map((project) => (
							<FeedProjectCard
								key={project.id}
								project={project}
								onComment={handleComment}
								onCollab={handleCollab}
								onToggleCompletion={handleCompletionToggle}
								navigate={navigate}
								currentUserId={auth.currentUser?.uid || ""}
							/>
						))}
					</section>
				</>
			) : null}

			{displayProjects.length === 0 && !loadingUser ? (
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

