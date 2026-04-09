import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase_config";
import "../styles/dashboard.css";

function formatTimeLabel(timestamp) {
  const seconds = timestamp?.seconds;
  if (!seconds) return "now";

  const date = new Date(seconds * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ProfileDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Projects data
  const [userProjects, setUserProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    completed: 0,
    beta: 0,
    building: 0,
    idea: 0,
  });

  // Followers/Following data
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState([]);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's projects
  useEffect(() => {
    if (!user?.uid) {
      setUserProjects([]);
      setProjectStats({
        total: 0,
        completed: 0,
        beta: 0,
        building: 0,
        idea: 0,
      });
      return;
    }

    const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      // Sort by created date descending
      projects.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setUserProjects(projects);

      // Calculate stats
      const stats = {
        total: projects.length,
        completed: projects.filter((p) => p.stage === "completed").length,
        beta: projects.filter((p) => p.stage === "beta").length,
        building: projects.filter((p) => p.stage === "building").length,
        idea: projects.filter((p) => p.stage === "idea").length,
      };
      setProjectStats(stats);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe to followers
  useEffect(() => {
    if (!user?.uid) {
      setFollowersCount(0);
      setFollowers([]);
      return;
    }

    const followersQuery = query(collection(db, "follows"), where("followingId", "==", user.uid));

    const unsubscribe = onSnapshot(followersQuery, (snapshot) => {
      const followerIds = snapshot.docs.map((docItem) => docItem.data().followerId).filter(Boolean);
      setFollowersCount(followerIds.length);

      // Fetch follower user details (limit to 5)
      if (followerIds.length > 0) {
        const usersQuery = query(collection(db, "users"));
        const unsubUsers = onSnapshot(usersQuery, (usersSnapshot) => {
          const userMap = {};
          usersSnapshot.docs.forEach((docItem) => {
            const data = docItem.data();
            userMap[data.uid] = data;
          });

          const topFollowers = followerIds.slice(0, 5).map((id) => ({
            uid: id,
            displayName: (userMap[id]?.displayName || userMap[id]?.email || "Developer").split(" ")[0],
            photoURL: userMap[id]?.photoURL || "",
          }));

          setFollowers(topFollowers);
        });

        return unsubUsers;
      }
      setFollowers([]);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe to following count
  useEffect(() => {
    if (!user?.uid) {
      setFollowingCount(0);
      return;
    }

    const followingQuery = query(collection(db, "follows"), where("followerId", "==", user.uid));

    const unsubscribe = onSnapshot(followingQuery, (snapshot) => {
      setFollowingCount(snapshot.size);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe to recent activity (last 10 notifications)
  useEffect(() => {
    if (!user?.uid) {
      setRecentActivity([]);
      setLoading(false);
      return;
    }

    const activityQuery = query(collection(db, "notifications"), where("recipientId", "==", user.uid));

    const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      // Sort by created date descending and take 8
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecentActivity(items.slice(0, 8));
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  const activeProjectCount = useMemo(
    () => userProjects.filter((p) => p.stage && p.stage !== "completed").length,
    [userProjects]
  );

  const getStageColor = (stage) => {
    const colors = {
      idea: "#9b59b6",
      building: "#3498db",
      beta: "#f39c12",
      completed: "#27ae60",
    };
    return colors[stage] || "#95a5a6";
  };

  if (loading && userProjects.length === 0) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard</h1>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{projectStats.total}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeProjectCount}</div>
            <div className="stat-label">Active Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{projectStats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{followersCount}</div>
            <div className="stat-label">Followers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{followingCount}</div>
            <div className="stat-label">Following</div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Active Projects Section */}
          <section className="dashboard-section">
            <h2 className="section-title">Active Projects</h2>
            {userProjects.length === 0 ? (
              <div className="empty-state">
                <p>No projects yet. Create your first project to get started!</p>
                <button className="btn-primary" onClick={() => navigate("/projects/new")}>
                  Create Project
                </button>
              </div>
            ) : (
              <div className="project-list">
                {userProjects.map((project) => (
                  <div key={project.id} className="project-list-item" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="project-list-header">
                      <h3 className="project-title">{project.title || "Untitled Project"}</h3>
                      <span className="project-stage" style={{ backgroundColor: getStageColor(project.stage) }}>
                        {project.stage?.charAt(0).toUpperCase() + project.stage?.slice(1)}
                      </span>
                    </div>
                    <p className="project-description">{project.description || "No description"}</p>
                    <div className="project-meta">
                      <span className="meta-item">👁 {project.views || 0} views</span>
                      {project.milestones && <span className="meta-item">🎯 {project.milestones.length} milestones</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Stage Breakdown Section */}
          <section className="dashboard-section">
            <h2 className="section-title">Projects by Stage</h2>
            <div className="stage-bars">
              {[
                { stage: "Idea", count: projectStats.idea, color: "#9b59b6" },
                { stage: "Building", count: projectStats.building, color: "#3498db" },
                { stage: "Beta", count: projectStats.beta, color: "#f39c12" },
                { stage: "Completed", count: projectStats.completed, color: "#27ae60" },
              ].map(({ stage, count, color }) => (
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

          {/* Recent Activity Section */}
          <section className="dashboard-section">
            <h2 className="section-title">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <p>No activity yet. Check back when you get collaborator interactions!</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`activity-item ${activity.isRead ? "read" : "unread"}`}
                    onClick={() => navigate(`/projects/${activity.projectId}`)}
                  >
                    <div className="activity-dot" />
                    <div className="activity-content">
                      <p className="activity-message">
                        <strong>{activity.actorName || "Developer"}</strong> {activity.message}
                      </p>
                      <span className="activity-time">{formatTimeLabel(activity.createdAt)}</span>
                    </div>
                    <span className="activity-type">{activity.type}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Followers Section */}
          {followers.length > 0 && (
            <section className="dashboard-section">
              <h2 className="section-title">Recent Followers</h2>
              <div className="followers-grid">
                {followers.map((follower) => (
                  <div
                    key={follower.uid}
                    className="follower-card"
                    onClick={() => navigate(`/profile/${follower.uid}`)}
                  >
                    <div className="follower-avatar">
                      {follower.photoURL ? (
                        <img src={follower.photoURL} alt={follower.displayName} />
                      ) : (
                        <div className="avatar-placeholder">{follower.displayName?.charAt(0) || "?"}</div>
                      )}
                    </div>
                    <p className="follower-name">{follower.displayName}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default ProfileDashboard;