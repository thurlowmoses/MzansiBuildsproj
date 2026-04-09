import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import CollabSection from "../components/CollabSection";
import CommentsSection from "../components/CommentsSection";
import MilestoneSection from "../components/MilestoneSection";
import { db } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/project-detail.css";

function ProjectDetailPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

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

  const handleCompletionToggle = async () => {
    if (!projectId || !project || !user) return;

    const isOwner = project.userId ? project.userId === user.uid : true;
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

      if (markCompleted) {
        setShowCelebration(true);
        window.setTimeout(() => setShowCelebration(false), 2000);

        const followsSnapshot = await getDocs(
          query(collection(db, "follows"), where("followingId", "==", user.uid))
        );
        const followerIds = [
          ...new Set(
            followsSnapshot.docs
              .map((entry) => (entry.data() || {}).followerId)
              .filter(Boolean)
          ),
        ];

        await Promise.all(
          followerIds.map((recipientId) =>
            addDoc(collection(db, "notifications"), {
              type: "project_completed",
              recipientId,
              actorId: user.uid,
              actorName: user.displayName || user.email || "Developer",
              actorPhotoURL: user.photoURL || "",
              message: `${user.displayName || user.email || "Developer"} completed ${project.title}.`,
              isRead: false,
              createdAt: serverTimestamp(),
              targetType: "project",
              targetId: projectId,
              projectId,
              projectTitle: project.title,
            })
          )
        );
      }

      setSuccess(
        markCompleted
          ? "Project marked as completed. It now appears on Celebration Wall."
          : "Project moved out of Celebration Wall."
      );
    } catch (err) {
      setError(err?.message || "Failed to update project completion.");
    } finally {
      setCompletionLoading(false);
    }
  };

  const isOwner = !project?.userId || project.userId === user?.uid;

  if (loading) {
    return (
      <main className="detail-page">
        <p>Loading project details...</p>
      </main>
    );
  }

  return (
    <main className="detail-page">
      {showCelebration ? (
        <div className="detail-celebration-pop" aria-live="polite">
          <span>Great work! Project completed.</span>
        </div>
      ) : null}
      <section className="detail-container">
        {error ? <p className="detail-error">{error}</p> : null}
        {success ? <p className="detail-success">{success}</p> : null}

        {project ? (
          <>
            <header className="detail-header">
              <h1>{project.title}</h1>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <span className="detail-stage">{project.stage || "idea"}</span>
                {isOwner ? (
                  <button
                    type="button"
                    className="completion-button"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                  >
                    Edit project
                  </button>
                ) : null}
              </div>
            </header>

            <p className="detail-description">{project.description}</p>

            {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
              <div className="detail-tags">
                {project.techStack.map((tech) => (
                  <span key={tech} className="detail-tag">
                    {tech}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="detail-meta">Built by {project.userName || "Developer"}</p>

            <section className="detail-card">
              <h2>Project Status</h2>
              <p>
                Current status: <strong>{project.completed ? "Completed" : "In Progress"}</strong>
              </p>
              {project.completed ? (
                <p className="detail-success">This project is on the Celebration Wall.</p>
              ) : null}

              {(!project.userId || user?.uid === project.userId) ? (
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
              ) : null}
            </section>

            <MilestoneSection
              projectId={projectId}
              project={project}
              milestones={milestones}
              user={user}
            />

            <CollabSection
              projectId={projectId}
              project={project}
              requests={requests}
              user={user}
            />

            <CommentsSection
              projectId={projectId}
              project={project}
              comments={comments}
              user={user}
            />
          </>
        ) : null}
      </section>
    </main>
  );
}

export default ProjectDetailPage;
