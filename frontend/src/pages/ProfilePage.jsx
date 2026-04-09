import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/profile.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const stageClass = (stage) => {
    const map = {
      idea: "profile-stage-idea",
      building: "profile-stage-building",
      beta: "profile-stage-beta",
      completed: "profile-stage-completed",
    };
    return map[stage] || "profile-stage-default";
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

  const avatarUrl = profile?.avatarUrl || user?.photoURL;
  const displayName = profile?.name || user?.displayName || "Developer";

  return (
    <div className="profile-page">
      <div className="profile-page-inner">
        <div className="profile-topbar">
          <div className="profile-avatar-wrap">
            <label htmlFor="avatar-upload" className="profile-avatar-label">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar-fallback">{displayName[0].toUpperCase()}</div>
              )}
              <div className="profile-avatar-overlay">{uploading ? `${uploadProgress}%` : "Change"}</div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
              className="profile-hidden-input"
            />
          </div>

          <div className="profile-main-meta">
            <h1 className="profile-name">{displayName}</h1>
            <p className="profile-email">{user?.email}</p>
            {profile?.bio ? <p className="profile-bio">{profile.bio}</p> : null}
            {profile?.github ? (
              <a
                href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noreferrer"
                className="profile-github-link"
              >
                github.com/{profile.github}
              </a>
            ) : null}

            <div className="profile-stats-row">
              <button type="button" className="profile-stat-btn" onClick={() => setActiveTab("projects")}>
                <span className="profile-stat-num">{projects.length}</span>
                <span className="profile-stat-label">projects</span>
              </button>
              <button type="button" className="profile-stat-btn" onClick={() => setActiveTab("followers")}>
                <span className="profile-stat-num">{followers.length}</span>
                <span className="profile-stat-label">followers</span>
              </button>
              <button type="button" className="profile-stat-btn" onClick={() => setActiveTab("following")}>
                <span className="profile-stat-num">{following.length}</span>
                <span className="profile-stat-label">following</span>
              </button>
            </div>
          </div>

          <div className="profile-menu-wrap" ref={menuRef}>
            <button type="button" className="profile-menu-btn" onClick={() => setShowMenu((prev) => !prev)}>
              ...
            </button>
            {showMenu ? (
              <div className="profile-dropdown">
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setEditing(true);
                    setShowMenu(false);
                  }}
                >
                  Edit profile
                </button>
                <button type="button" className="profile-dropdown-item" onClick={handlePasswordReset}>
                  Change password
                </button>
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => navigate("/settings")}
                >
                  Settings
                </button>
                <div className="profile-dropdown-sep" />
                <button
                  type="button"
                  className="profile-dropdown-item profile-dropdown-danger"
                  onClick={async () => {
                    await auth.signOut();
                    navigate("/auth");
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
          <div className="profile-skills-row">
            {profile.skills.map((skill) => (
              <span key={skill} className="profile-skill-pill">
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        {error ? <p className="profile-error">{error}</p> : null}
        {success ? <p className="profile-success">{success}</p> : null}

        {editing ? (
          <form onSubmit={handleSave} className="profile-edit-form">
            <h3 className="profile-edit-title">Edit profile</h3>

            <div className="profile-field">
              <label htmlFor="profile-name">Display name</label>
              <input
                id="profile-name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                value={formData.bio}
                onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                rows={3}
                placeholder="Tell other developers what you are working on..."
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-github">GitHub username</label>
              <input
                id="profile-github"
                value={formData.github}
                onChange={(event) => setFormData((prev) => ({ ...prev, github: event.target.value }))}
                placeholder="e.g. thurlowmoses"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-skills">Skills (comma separated)</label>
              <input
                id="profile-skills"
                value={formData.skills}
                onChange={(event) => setFormData((prev) => ({ ...prev, skills: event.target.value }))}
                placeholder="e.g. React, Python, Firebase"
              />
            </div>

            <div className="profile-edit-actions">
              <button
                type="button"
                className="profile-btn profile-btn-cancel"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="profile-btn profile-btn-save" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="profile-tabs">
          {["projects", "followers", "following"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`profile-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "projects" ? (
          <div className="profile-list-col">
            {projects.length === 0 ? (
              <div className="profile-empty-state">
                <p>No projects yet.</p>
                <button type="button" className="profile-btn profile-btn-save" onClick={() => navigate("/projects/new")}>
                  Post your first project
                </button>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="profile-project-card">
                  <div className="profile-project-main">
                    <div className="profile-project-headline">
                      <span className={`profile-stage-pill ${stageClass(project.stage)}`}>
                        {project.stage || "idea"}
                      </span>
                      {project.completed ? <span className="profile-stage-icon">TROPHY</span> : null}
                    </div>
                    <p className="profile-project-title" onClick={() => navigate(`/projects/${project.id}`)}>
                      {project.title}
                    </p>
                    <p className="profile-project-desc">{project.description}</p>
                    {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
                      <div className="profile-project-tech-row">
                        {project.techStack.map((tech) => (
                          <span key={tech} className="profile-tech-pill">
                            {tech}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="profile-btn profile-btn-edit"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "followers" ? (
          <div className="profile-list-col">
            {followers.length === 0 ? (
              <div className="profile-empty-state">
                <p>No followers yet.</p>
              </div>
            ) : (
              followers.map((row) => (
                <button
                  key={row.uid}
                  type="button"
                  className="profile-connection-card"
                  onClick={() => navigate(`/profile/${row.uid}`)}
                >
                  <div className="profile-connection-avatar">
                    {row.avatarUrl ? (
                      <img src={row.avatarUrl} alt="" className="profile-connection-avatar-img" />
                    ) : (
                      (row.name || "D")[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="profile-connection-name">{row.name || row.email || "Developer"}</p>
                    <p className="profile-connection-meta">{row.bio || "Developer"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "following" ? (
          <div className="profile-list-col">
            {following.length === 0 ? (
              <div className="profile-empty-state">
                <p>Not following anyone yet.</p>
                <button
                  type="button"
                  className="profile-btn profile-btn-save"
                  onClick={() => navigate("/discovery")}
                >
                  Find developers
                </button>
              </div>
            ) : (
              following.map((row) => (
                <button
                  key={row.uid}
                  type="button"
                  className="profile-connection-card"
                  onClick={() => navigate(`/profile/${row.uid}`)}
                >
                  <div className="profile-connection-avatar">
                    {row.avatarUrl ? (
                      <img src={row.avatarUrl} alt="" className="profile-connection-avatar-img" />
                    ) : (
                      (row.name || "D")[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="profile-connection-name">{row.name || row.email || "Developer"}</p>
                    <p className="profile-connection-meta">{row.bio || "Developer"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfilePage;
