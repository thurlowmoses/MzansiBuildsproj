// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useRef, useState } from "react";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db, storage } from "../firebase_config";

// Handles useProfilePageData.
const useProfilePageData = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState("projects");
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    github: "",
    skills: "",
  });

  const menuRef = useRef(null);
  const followersRequestSeqRef = useRef(0);
  const followingRequestSeqRef = useRef(0);

  useEffect(() => {
    // Handles handler.
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setProfile(data);
      setFormData({
        name: data.name || user.displayName || "",
        bio: data.bio || "",
        github: data.github || "",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
      });
      setLoading(false);
    });

    return () => unsubProfile();
  }, [user?.uid, user?.displayName]);

  useEffect(() => {
    if (!user?.uid) return;

    const projectQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubProjects = onSnapshot(projectQuery, (snap) => {
      setProjects(snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
    });

    return () => unsubProjects();
  }, [user?.uid]);

  // Handles fetchUserProfiles.
  const fetchUserProfiles = async (ids) => {
    if (!ids.length) return [];

    const rows = await Promise.all(
      ids.map(async (id) => {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) return null;
        return { uid: id, ...snap.data() };
      })
    );

    return rows.filter(Boolean);
  };

  useEffect(() => {
    if (!user?.uid) return;

    const followersQ = query(collection(db, "follows"), where("followingId", "==", user.uid));
    const unsubFollowers = onSnapshot(followersQ, async (snap) => {
      const requestId = ++followersRequestSeqRef.current;
      const ids = snap.docs.map((docItem) => docItem.data()?.followerId).filter(Boolean);
      const profilesList = await fetchUserProfiles(ids);
      if (requestId === followersRequestSeqRef.current) {
        setFollowers(profilesList);
      }
    });

    const followingQ = query(collection(db, "follows"), where("followerId", "==", user.uid));
    const unsubFollowing = onSnapshot(followingQ, async (snap) => {
      const requestId = ++followingRequestSeqRef.current;
      const ids = snap.docs.map((docItem) => docItem.data()?.followingId).filter(Boolean);
      const profilesList = await fetchUserProfiles(ids);
      if (requestId === followingRequestSeqRef.current) {
        setFollowing(profilesList);
      }
    });

    return () => {
      followersRequestSeqRef.current += 1;
      followingRequestSeqRef.current += 1;
      unsubFollowers();
      unsubFollowing();
    };
  }, [user?.uid]);

  // Handles handleAvatarChange.
  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (uploadErr) => {
          setError(`Upload failed: ${uploadErr.message}`);
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            await updateProfile(auth.currentUser, { photoURL: downloadURL });
            await setDoc(
              doc(db, "users", user.uid),
              { avatarUrl: downloadURL, updatedAt: serverTimestamp() },
              { merge: true }
            );

            setSuccess("Profile photo updated!");
          } catch (completionErr) {
            setError(`Upload failed: ${completionErr.message}`);
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (err) {
      setError(`Upload error: ${err.message}`);
      setUploading(false);
    }
  };

  // Handles handleSave.
  const handleSave = async (event) => {
    event.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await updateProfile(auth.currentUser, { displayName: formData.name });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: formData.name,
          bio: formData.bio,
          github: formData.github,
          skills: skillsArray,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccess("Profile saved!");
      setEditing(false);
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handles handlePasswordReset.
  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess(`Password reset email sent to ${user.email}`);
      setShowMenu(false);
    } catch {
      setError("Could not send reset email.");
    }
  };

  return {
    profile,
    projects,
    followers,
    following,
    activeTab,
    setActiveTab,
    showMenu,
    setShowMenu,
    loading,
    saving,
    uploading,
    uploadProgress,
    error,
    success,
    editing,
    setEditing,
    formData,
    setFormData,
    menuRef,
    handleAvatarChange,
    handleSave,
    handlePasswordReset,
  };
};

export default useProfilePageData;

