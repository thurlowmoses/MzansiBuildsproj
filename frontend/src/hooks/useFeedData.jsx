// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebase_config";

// Handles useFeedData.
const useFeedData = () => {
  const [userProjects, setUserProjects] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");
  const [privacyByUserId, setPrivacyByUserId] = useState({});
  const [profileByUserId, setProfileByUserId] = useState({});
  const [following, setFollowing] = useState([]);
  const [hasFollowing, setHasFollowing] = useState(false);

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
      // Handles mapping.
      const mapping = {};
      // Handles profiles.
      const profiles = {};
      snapshot.docs.forEach((docItem) => {
        const row = docItem.data() || {};
        const uid = row.uid || docItem.id;
        mapping[uid] = Boolean(row.isPrivate);
        profiles[uid] = {
          userName: row.displayName || row.email || "Developer",
          userPhotoURL: row.photoURL || "",
        };
      });
      setPrivacyByUserId(mapping);
      setProfileByUserId(profiles);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubFollows = () => {};

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubFollows();

      if (!firebaseUser) {
        setFollowing([]);
        setHasFollowing(false);
        return;
      }

      const followsRef = collection(db, "users", firebaseUser.uid, "following");
      unsubFollows = onSnapshot(
        followsRef,
        (snap) => {
          const followedIds = snap.docs.map((docItem) => docItem.id);
          setFollowing(followedIds);
          setHasFollowing(followedIds.length > 0);
        },
        (error) => {
          console.error("Failed to load following list:", error);
          setFollowing([]);
          setHasFollowing(false);
        }
      );
    });

    return () => {
      unsubFollows();
      unsubAuth();
    };
  }, []);

  const enrichedProjects = useMemo(() => {
    return userProjects.map((project) => {
      if (!project.userId) {
        return project;
      }

      const profile = profileByUserId[project.userId];
      if (!profile) {
        return project;
      }

      return {
        ...project,
        userName: profile.userName || project.userName || "Developer",
        userPhotoURL: profile.userPhotoURL || project.userPhotoURL || "",
      };
    });
  }, [userProjects, profileByUserId]);

  const visibleUserProjects = useMemo(() => {
    const currentUserId = auth.currentUser?.uid;

    return enrichedProjects.filter((project) => {
      const ownerId = project.userId;

      if (!ownerId) return true;
      if (ownerId === currentUserId) return true;

      const isPrivate = Boolean(privacyByUserId[ownerId]);
      if (!isPrivate) return true;

      return following.includes(ownerId);
    });
  }, [enrichedProjects, privacyByUserId, following]);

  const displayProjects = useMemo(() => {
    if (!hasFollowing) return visibleUserProjects;
    return visibleUserProjects.filter(
      (project) => project.userId == null || following.includes(project.userId)
    );
  }, [hasFollowing, visibleUserProjects, following]);

  return {
    loadingUser,
    userError,
    displayProjects,
    hasFollowing,
  };
};

export default useFeedData;

