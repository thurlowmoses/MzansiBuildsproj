// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import PublicProfileHeader from "../components/public-profile/PublicProfileHeader";
import PublicProfileProjects from "../components/public-profile/PublicProfileProjects";
import { db } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/profile.css";
import "../styles/public-profile.css";

// Handles PublicProfilePage.
const PublicProfilePage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.uid && uid === user.uid) {
      navigate("/profile", { replace: true });
    }
  }, [uid, user, navigate]);

  useEffect(() => {
    if (!uid) return;

    // Handles loadProfile.
    const loadProfile = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", uid));
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        } else {
          setError("Profile not found.");
        }
      } catch {
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const followersQ = query(collection(db, "follows"), where("followingId", "==", uid));
    const followingQ = query(collection(db, "follows"), where("followerId", "==", uid));

    const unsubFollowers = onSnapshot(followersQ, (snapshot) => setFollowerCount(snapshot.size));
    const unsubFollowing = onSnapshot(followingQ, (snapshot) => setFollowingCount(snapshot.size));

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !user?.uid) return;

    const followsQuery = query(
      collection(db, "follows"),
      where("followerId", "==", user.uid),
      where("followingId", "==", uid)
    );

    const unsubscribe = onSnapshot(followsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowDocId(snapshot.docs[0].id);
      } else {
        setIsFollowing(false);
        setFollowDocId(null);
      }
    });

    return () => unsubscribe();
  }, [uid, user?.uid]);

  // Handles handleFollow.
  const handleFollow = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setFollowLoading(true);
    try {
      await addDoc(collection(db, "follows"), {
        followerId: user.uid,
        followingId: uid,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        type: "follow",
        recipientId: uid,
        actorId: user.uid,
        actorName: user.displayName || "A developer",
        actorPhoto: user.photoURL || "",
        message: `${user.displayName || "A developer"} started following you.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      setError("Could not follow. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  // Handles handleUnfollow.
  const handleUnfollow = async () => {
    if (!followDocId) return;

    setFollowLoading(true);
    try {
      await deleteDoc(doc(db, "follows", followDocId));
    } catch {
      setError("Could not unfollow.");
    } finally {
      setFollowLoading(false);
    }
  };

  // Handles stageColor.
  const stageColor = (stage) => {
    // Handles map.
    const map = {
      idea: "#7b8cde",
      building: "#4caf50",
      beta: "#ffc107",
      completed: "#81c784",
    };
    return map[stage] || "#888";
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-page-inner">
          <p className="profile-loading">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-page-inner">
          <p className="profile-error">{error}</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || profile?.displayName || "Developer";
  const avatarUrl = profile?.avatarUrl || profile?.photoURL;

  return (
    <div className="profile-page public-profile-page">
      <div className="profile-page-inner public-profile-shell">
        {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
          <div className="profile-skills-row public-profile-actions">
            {profile.skills.map((skill) => (
              <span key={skill} className="profile-skill-pill public-profile-message-btn">
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        <div className="profile-tabs public-profile-tabs">
          <button type="button" className="profile-tab is-active">
            Projects
          </button>
          <button type="button" className="profile-tab" onClick={() => navigate(`/profile/${uid}#followers`)}>
            Followers
          </button>
          <button type="button" className="profile-tab" onClick={() => navigate(`/profile/${uid}#following`)}>
            Following
          </button>
        </div>

        <PublicProfileHeader
          avatarUrl={avatarUrl}
          displayName={displayName}
          profile={profile}
          projectsCount={projects.length}
          followerCount={followerCount}
          followingCount={followingCount}
          user={user}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollowToggle={isFollowing ? handleUnfollow : handleFollow}
        />
        <PublicProfileProjects projects={projects} displayName={displayName} stageColor={stageColor} />
      </div>
    </div>
  );
};

export default PublicProfilePage;

