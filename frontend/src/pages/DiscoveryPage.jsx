// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import DiscoveryCard from "../components/DiscoveryCard";
import useGitHubProjects from "../hooks/useGitHubProjects";
import { db } from "../firebase_config";
import { getTimestampMs } from "../utils/timeUtils";
import "../styles/feed.css";
import "../styles/discovery.css";

// Handles DiscoveryPage.
function DiscoveryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mzansi");
  const [mzansiProjects, setMzansiProjects] = useState([]);
  const [mzansiLoading, setMzansiLoading] = useState(true);
  const [mzansiError, setMzansiError] = useState("");
  const [mzansiVisibleCount, setMzansiVisibleCount] = useState(8);
  const [githubVisibleCount, setGithubVisibleCount] = useState(8);

  const {
    projects: githubProjects,
    loading: githubLoading,
    error: githubError,
  } = useGitHubProjects("stars:>100 language:javascript", 18);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        const items = snapshot.docs
          .map((docItem) => ({ id: docItem.id, ...(docItem.data() || {}) }))
          .filter((project) => !project.isGitHub);

        items.sort(
          (a, b) =>
            getTimestampMs(b.updatedAt || b.createdAt) -
            getTimestampMs(a.updatedAt || a.createdAt)
        );

        setMzansiProjects(items);
        setMzansiLoading(false);
      },
      (error) => {
        setMzansiError(error?.message || "Could not load Mzansi discovery projects.");
        setMzansiLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const trendingMzansi = useMemo(() => mzansiProjects.slice(0, 4), [mzansiProjects]);
  const latestMzansi = useMemo(() => mzansiProjects.slice(4, mzansiVisibleCount), [mzansiProjects, mzansiVisibleCount]);
  const trendingGitHub = useMemo(() => githubProjects.slice(0, 4), [githubProjects]);
  const latestGitHub = useMemo(() => githubProjects.slice(4, githubVisibleCount), [githubProjects, githubVisibleCount]);

  // Handles openProject.
  const openProject = (project) => {
    if (project.isGitHub) {
      window.open(project.githubUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(`/projects/${project.id}`);
  };

  useEffect(() => {
    setMzansiVisibleCount(8);
  }, [mzansiProjects.length]);

  useEffect(() => {
    setGithubVisibleCount(8);
  }, [githubProjects.length]);

  // Handles openProfile.
  const openProfile = (profilePath) => {
    navigate(profilePath);
  };

  return (
    <main className="discovery-page">
      <div className="discovery-container">
        <header className="discovery-header">
          <h1>Discovery</h1>
          <p>Switch between GitHub and MzansiBuilds, then jump into what is trending right now.</p>
        </header>

        <div className="discovery-tabs" role="tablist" aria-label="Discovery sources">
          <button type="button" className={`discovery-tab ${activeTab === "mzansi" ? "active" : ""}`} onClick={() => setActiveTab("mzansi")}>
            Mzansi
          </button>
          <button type="button" className={`discovery-tab ${activeTab === "github" ? "active" : ""}`} onClick={() => setActiveTab("github")}>
            GitHub
          </button>
        </div>

        {activeTab === "mzansi" ? (
          <>
            {mzansiLoading ? <p className="discovery-note">Loading Mzansi projects...</p> : null}
            {mzansiError ? <p className="discovery-error">{mzansiError}</p> : null}

            {!mzansiLoading && !mzansiError && mzansiProjects.length === 0 ? (
              <p className="discovery-note">No Mzansi projects found yet. Post the first one from Feed.</p>
            ) : null}

            {trendingMzansi.length > 0 ? (
              <section className="discovery-section">
                <div className="discovery-section-head">
                  <h2>Trending in Mzansi</h2>
                  <span>Fresh builds and active help requests</span>
                </div>
                <div className="feed-list">
                  {trendingMzansi.map((project, index) => (
                    <DiscoveryCard
                      key={project.id}
                      project={project}
                      onOpenProfile={openProfile}
                      onOpenProject={openProject}
                      trendingLabel={`Trending #${index + 1}`}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {latestMzansi.length > 0 ? (
              <section className="discovery-section discovery-section-spaced">
                <div className="discovery-section-head">
                  <h2>Latest from Mzansi</h2>
                  <span>Recent community projects</span>
                </div>
                <div className="feed-list">
                  {latestMzansi.map((project) => (
                    <DiscoveryCard key={project.id} project={project} onOpenProfile={openProfile} onOpenProject={openProject} />
                  ))}
                </div>
                {mzansiProjects.length > mzansiVisibleCount ? (
                  <button type="button" className="load-more-btn" onClick={() => setMzansiVisibleCount((count) => count + 4)}>
                    Load more Mzansi projects
                  </button>
                ) : null}
              </section>
            ) : null}
          </>
        ) : (
          <>
            {githubLoading ? <p className="discovery-note">Loading GitHub projects...</p> : null}
            {githubError ? <p className="discovery-error">{githubError}</p> : null}

            {!githubLoading && !githubError && githubProjects.length === 0 ? (
              <p className="discovery-note">No GitHub projects found right now. Try again shortly.</p>
            ) : null}

            {trendingGitHub.length > 0 ? (
              <section className="discovery-section">
                <div className="discovery-section-head">
                  <h2>Trending on GitHub</h2>
                  <span>Open-source projects worth watching</span>
                </div>
                <div className="feed-list">
                  {trendingGitHub.map((project, index) => (
                    <DiscoveryCard
                      key={project.id}
                      project={project}
                      onOpenProfile={openProfile}
                      onOpenProject={openProject}
                      trendingLabel={`Trending #${index + 1}`}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {latestGitHub.length > 0 ? (
              <section className="discovery-section discovery-section-spaced">
                <div className="discovery-section-head">
                  <h2>More GitHub projects</h2>
                  <span>Extra inspiration from active repos</span>
                </div>
                {githubProjects.length > githubVisibleCount ? (
                  <button type="button" className="load-more-btn" onClick={() => setGithubVisibleCount((count) => count + 4)}>
                    Load more GitHub projects
                  </button>
                ) : null}
                <div className="feed-list">
                  {latestGitHub.map((project) => (
                    <DiscoveryCard key={project.id} project={project} onOpenProfile={openProfile} onOpenProject={openProject} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

export default DiscoveryPage;
