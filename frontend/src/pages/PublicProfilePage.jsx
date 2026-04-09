import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase_config";
import "../styles/feed.css";
import "../styles/public-profile.css";

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!userId) {
      setErrorMessage("Profile not found.");
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setProfile(null);
          setErrorMessage("Profile not found.");
        } else {
          setProfile({ id: snapshot.id, ...(snapshot.data() || {}) });
          setErrorMessage("");
        }

        setLoading(false);
      },
      (error) => {
        setErrorMessage(error?.message || "Could not load profile.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...(docItem.data() || {}) }))
        .filter((project) => project.userId === userId && !project.isGitHub);

      items.sort((a, b) => getTimeValue(b.updatedAt || b.createdAt) - getTimeValue(a.updatedAt || a.createdAt));
      setProjects(items);
    });

    return unsubscribe;
  }, [userId]);

  const struggles = useMemo(() => {
    const values = projects.map((project) => project.supportNeeded).filter(Boolean);
    return Array.from(new Set(values));
  }, [projects]);

  if (loading) {
    return (
      <main className="public-profile-page">
        <div className="public-profile-shell">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="public-profile-page">
      <div className="public-profile-shell">
        {errorMessage ? <p className="public-profile-error">{errorMessage}</p> : null}

        {profile ? (
          <>
            <header className="public-profile-header">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName || "Developer"} className="public-profile-avatar" />
              ) : (
                <div className="public-profile-avatar public-profile-avatar-fallback">
                  {(profile.displayName || profile.email || "Developer")[0].toUpperCase()}
                </div>
              )}

              <div className="public-profile-copy">
                <h1>{profile.displayName || profile.email || "Developer"}</h1>
                <p>{profile.bio || "This developer has not shared a bio yet."}</p>
                <div className="public-profile-tags">
                  <span>{projects.length.toLocaleString()} projects</span>
                  <span>{profile.isPrivate ? "Private account" : "Public account"}</span>
                </div>
                <div className="public-profile-actions">
                  <button
                    type="button"
                    className="public-profile-message-btn"
                    onClick={() => navigate(`/messages?userId=${userId}`)}
                  >
                    Message developer
                  </button>
                </div>
              </div>
            </header>

            <section className="public-profile-section">
              <div className="public-profile-section-head">
                <h2>What they created</h2>
                <span>Recent builds and progress</span>
              </div>

              {projects.length === 0 ? (
                <p className="public-profile-empty">No public projects yet.</p>
              ) : (
                <div className="feed-list">
                  {projects.map((project) => (
                    <article key={project.id} className="project-card">
                      <header className="card-header">
                        <div className="avatar">
                          {(project.userName || profile.displayName || "D")[0].toUpperCase()}
                        </div>
                        <div className="card-meta">
                          <p className="card-username">{project.title}</p>
                          <p className="card-time">{project.stage || "idea"}</p>
                        </div>
                        <span className="stage-badge stage-building">{project.completed ? "completed" : "in progress"}</span>
                      </header>

                      <div className="card-body">
                        <p className="card-description">{project.description}</p>
                        {project.supportNeeded ? (
                          <div className="support-box">
                            <span className="support-label">Needs help:</span> {project.supportNeeded}
                          </div>
                        ) : null}
                        <button type="button" className="profile-project-btn" onClick={() => navigate(`/projects/${project.id}`)}>
                          Open project
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="public-profile-section">
              <div className="public-profile-section-head">
                <h2>What they are struggling with</h2>
                <span>Support requests from their builds</span>
              </div>

              {struggles.length === 0 ? (
                <p className="public-profile-empty">No struggle notes have been shared yet.</p>
              ) : (
                <div className="public-profile-struggles">
                  {struggles.map((item) => (
                    <div key={item} className="public-profile-struggle-card">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default PublicProfilePage;