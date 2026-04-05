import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import CommentBox from "../components/CommentBox";
import { db } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/project-detail.css";

function ProjectDetailPage() {
	const { projectId } = useParams();
	const { user } = useAuth();

	const [project, setProject] = useState(null);
	const [comments, setComments] = useState([]);
	const [requests, setRequests] = useState([]);
	const [milestones, setMilestones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [commentLoading, setCommentLoading] = useState(false);
	const [requestLoading, setRequestLoading] = useState(false);
	const [milestoneLoading, setMilestoneLoading] = useState(false);
	const [completionLoading, setCompletionLoading] = useState(false);
	const [milestoneActionId, setMilestoneActionId] = useState("");
	const [requestMessage, setRequestMessage] = useState("");
	const [milestoneForm, setMilestoneForm] = useState({
		title: "",
		note: "",
		status: "todo",
	});
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		if (!projectId) return;

		const projectRef = doc(db, "projects", projectId);
		const unsubscribe = onSnapshot(
			projectRef,
			(snapshot) => {
				if (snapshot.exists()) {
					setProject({ id: snapshot.id, ...snapshot.data() });
					setError("");
				} else {
					setProject(null);
					setError("Project not found.");
				}
				setLoading(false);
			},
			(err) => {
				setError(err?.message || "Could not load project details.");
				setLoading(false);
			}
		);

		return unsubscribe;
	}, [projectId]);

	useEffect(() => {
		if (!projectId) return;

		const milestonesQuery = query(
			collection(db, "projects", projectId, "milestones"),
			orderBy("createdAt", "desc")
		);

		const unsubscribe = onSnapshot(
			milestonesQuery,
			(snapshot) => {
				const nextMilestones = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
				setMilestones(nextMilestones);
			},
			(err) => {
				setError(err?.message || "Could not load milestones.");
			}
		);

		return unsubscribe;
	}, [projectId]);

	useEffect(() => {
		if (!projectId) return;

		const commentsQuery = query(
			collection(db, "projects", projectId, "comments"),
			orderBy("createdAt", "desc")
		);

		const unsubscribe = onSnapshot(
			commentsQuery,
			(snapshot) => {
				const nextComments = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
				setComments(nextComments);
			},
			(err) => {
				setError(err?.message || "Could not load comments.");
			}
		);

		return unsubscribe;
	}, [projectId]);

	useEffect(() => {
		if (!projectId) return;

		const requestsQuery = query(
			collection(db, "projects", projectId, "collaborationRequests"),
			orderBy("createdAt", "desc")
		);

		const unsubscribe = onSnapshot(
			requestsQuery,
			(snapshot) => {
				const nextRequests = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
				setRequests(nextRequests);
			},
			(err) => {
				setError(err?.message || "Could not load collaboration requests.");
			}
		);

		return unsubscribe;
	}, [projectId]);

	const handleCommentSubmit = async (content) => {
		if (!projectId || !user) return;

		try {
			setCommentLoading(true);
			setError("");

			await addDoc(collection(db, "projects", projectId, "comments"), {
				content,
				userId: user.uid,
				userName: user.displayName || user.email || "Developer",
				createdAt: serverTimestamp(),
			});
		} catch (err) {
			setError(err?.message || "Failed to post comment.");
		} finally {
			setCommentLoading(false);
		}
	};

	const handleRaiseHand = async (event) => {
		event.preventDefault();

		if (!projectId || !user) return;

		try {
			setRequestLoading(true);
			setError("");
			setSuccess("");

			await addDoc(collection(db, "projects", projectId, "collaborationRequests"), {
				requesterId: user.uid,
				requesterName: user.displayName || user.email || "Developer",
				requesterEmail: user.email || "",
				message: requestMessage.trim(),
				status: "open",
				createdAt: serverTimestamp(),
			});

			setRequestMessage("");
			setSuccess("Collaboration request sent.");
		} catch (err) {
			setError(err?.message || "Failed to send collaboration request.");
		} finally {
			setRequestLoading(false);
		}
	};

	const handleMilestoneChange = (event) => {
		const { name, value } = event.target;
		setMilestoneForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleCreateMilestone = async (event) => {
		event.preventDefault();

		if (!projectId || !user) return;

		const title = milestoneForm.title.trim();
		if (!title) return;

		try {
			setMilestoneLoading(true);
			setError("");
			setSuccess("");

			await addDoc(collection(db, "projects", projectId, "milestones"), {
				title,
				note: milestoneForm.note.trim(),
				status: milestoneForm.status,
				createdById: user.uid,
				createdByName: user.displayName || user.email || "Developer",
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			});

			setMilestoneForm({ title: "", note: "", status: "todo" });
			setSuccess("Milestone added.");
		} catch (err) {
			setError(err?.message || "Failed to add milestone.");
		} finally {
			setMilestoneLoading(false);
		}
	};

	const handleUpdateMilestoneStatus = async (milestoneId, nextStatus) => {
		if (!projectId) return;

		try {
			setMilestoneActionId(milestoneId);
			setError("");

			await updateDoc(doc(db, "projects", projectId, "milestones", milestoneId), {
				status: nextStatus,
				updatedAt: serverTimestamp(),
			});
		} catch (err) {
			setError(err?.message || "Failed to update milestone.");
		} finally {
			setMilestoneActionId("");
		}
	};

	const handleDeleteMilestone = async (milestoneId) => {
		if (!projectId) return;

		try {
			setMilestoneActionId(milestoneId);
			setError("");

			await deleteDoc(doc(db, "projects", projectId, "milestones", milestoneId));
			setSuccess("Milestone deleted.");
		} catch (err) {
			setError(err?.message || "Failed to delete milestone.");
		} finally {
			setMilestoneActionId("");
		}
	};

	const handleCompletionToggle = async () => {
		if (!projectId || !project || !user) return;

		const isOwner = project.userId === user.uid;
		if (!isOwner) {
			setError("Only the project owner can change completion status.");
			return;
		}

		try {
			setCompletionLoading(true);
			setError("");
			setSuccess("");

			const markCompleted = !project.completed;

			await updateDoc(doc(db, "projects", projectId), {
				completed: markCompleted,
				stage: markCompleted ? "completed" : project.stage || "building",
				completedAt: markCompleted ? serverTimestamp() : null,
				updatedAt: serverTimestamp(),
			});

			setSuccess(markCompleted ? "Project marked as completed. It now appears on Celebration Wall." : "Project moved out of Celebration Wall.");
		} catch (err) {
			setError(err?.message || "Failed to update project completion.");
		} finally {
			setCompletionLoading(false);
		}
	};

	if (loading) {
		return (
			<main className="detail-page">
				<p>Loading project details...</p>
			</main>
		);
	}

	return (
		<main className="detail-page">
			<section className="detail-container">
				{error && <p className="detail-error">{error}</p>}
				{success && <p className="detail-success">{success}</p>}

				{project && (
					<>
						<header className="detail-header">
							<h1>{project.title}</h1>
							<span className="detail-stage">{project.stage || "idea"}</span>
						</header>

						<p className="detail-description">{project.description}</p>

						{Array.isArray(project.techStack) && project.techStack.length > 0 && (
							<div className="detail-tags">
								{project.techStack.map((tech) => (
									<span key={tech} className="detail-tag">
										{tech}
									</span>
								))}
							</div>
						)}

						<p className="detail-meta">Built by {project.userName || "Developer"}</p>

						<section className="detail-card">
							<h2>Project Status</h2>
							<p>
								Current status: <strong>{project.completed ? "Completed" : "In Progress"}</strong>
							</p>
							{project.completed && <p className="detail-success">This project is on the Celebration Wall.</p>}

							{user?.uid === project.userId && (
								<button
									type="button"
									className="completion-button"
									onClick={handleCompletionToggle}
									disabled={completionLoading}
								>
									{completionLoading
										? "Updating..."
										: project.completed
											? "Mark as In Progress"
											: "Mark as Completed"}
								</button>
							)}
						</section>

						<section className="detail-card">
							<h2>Milestones</h2>
							<form onSubmit={handleCreateMilestone} className="milestone-form">
								<input
									name="title"
									value={milestoneForm.title}
									onChange={handleMilestoneChange}
									placeholder="Milestone title"
									required
								/>
								<textarea
									name="note"
									rows={2}
									value={milestoneForm.note}
									onChange={handleMilestoneChange}
									placeholder="Optional note"
								/>
								<div className="milestone-form-row">
									<select name="status" value={milestoneForm.status} onChange={handleMilestoneChange}>
										<option value="todo">To Do</option>
										<option value="in-progress">In Progress</option>
										<option value="done">Done</option>
									</select>
									<button type="submit" disabled={milestoneLoading}>
										{milestoneLoading ? "Adding..." : "Add Milestone"}
									</button>
								</div>
							</form>

							<div className="milestone-list">
								{milestones.length === 0 && <p>No milestones added yet.</p>}
								{milestones.map((milestone) => (
									<article key={milestone.id} className="milestone-item">
										<div className="milestone-header">
											<p className="milestone-title">{milestone.title}</p>
											<select
												value={milestone.status || "todo"}
												onChange={(event) =>
													handleUpdateMilestoneStatus(milestone.id, event.target.value)
												}
												disabled={milestoneActionId === milestone.id}
											>
												<option value="todo">To Do</option>
												<option value="in-progress">In Progress</option>
												<option value="done">Done</option>
											</select>
										</div>
										{milestone.note && <p className="milestone-note">{milestone.note}</p>}
										<button
											type="button"
											className="milestone-delete"
											onClick={() => handleDeleteMilestone(milestone.id)}
											disabled={milestoneActionId === milestone.id}
										>
											Delete
										</button>
									</article>
								))}
							</div>
						</section>

						<section className="detail-card">
							<h2>Raise Hand for Collaboration</h2>
							<form onSubmit={handleRaiseHand} className="request-form">
								<textarea
									rows={3}
									value={requestMessage}
									onChange={(event) => setRequestMessage(event.target.value)}
									placeholder="How can you help this project?"
									required
								/>
								<button type="submit" disabled={requestLoading}>
									{requestLoading ? "Sending..." : "Raise Hand"}
								</button>
							</form>

							<div className="request-list">
								{requests.length === 0 && <p>No collaboration requests yet.</p>}
								{requests.map((request) => (
									<article key={request.id} className="request-item">
										<p>
											<strong>{request.requesterName}</strong>
										</p>
										<p>{request.message}</p>
										<small>Status: {request.status || "open"}</small>
									</article>
								))}
							</div>
						</section>

						<section className="detail-card">
							<h2>Comments</h2>
							<CommentBox onSubmit={handleCommentSubmit} loading={commentLoading} />

							<div className="comment-list">
								{comments.length === 0 && <p>No comments yet.</p>}
								{comments.map((comment) => (
									<article key={comment.id} className="comment-item">
										<p className="comment-author">{comment.userName}</p>
										<p>{comment.content}</p>
									</article>
								))}
							</div>
						</section>
					</>
				)}
			</section>
		</main>
	);
}

export default ProjectDetailPage;
