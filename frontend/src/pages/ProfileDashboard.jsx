// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import DashboardActivitySection from "../components/dashboard/DashboardActivitySection";
import DashboardFollowersSection from "../components/dashboard/DashboardFollowersSection";
import DashboardProjectsSection from "../components/dashboard/DashboardProjectsSection";
import DashboardStageBreakdown from "../components/dashboard/DashboardStageBreakdown";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase_config";
import "../styles/dashboard.css";

// Handles formatTimeLabel.
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

// Handles ProfileDashboard.
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
          // Handles userMap.
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

  // Handles getStageColor.
  const getStageColor = (stage) => {
    // Handles colors.
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

        <DashboardStatsGrid
          projectStats={projectStats}
          activeProjectCount={activeProjectCount}
          followersCount={followersCount}
          followingCount={followingCount}
        />

        <div className="dashboard-content">
          <DashboardProjectsSection
            userProjects={userProjects}
            getStageColor={getStageColor}
            onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
            onCreateProject={() => navigate("/projects/new")}
          />

          <DashboardStageBreakdown projectStats={projectStats} />

          <DashboardActivitySection
            recentActivity={recentActivity}
            onOpenActivity={(projectId) => navigate(`/projects/${projectId}`)}
            formatTimeLabel={formatTimeLabel}
          />

          <DashboardFollowersSection
            followers={followers}
            onOpenProfile={(uid) => navigate(`/profile/${uid}`)}
          />
        </div>
      </div>
    </main>
  );
}

export default ProfileDashboard;
