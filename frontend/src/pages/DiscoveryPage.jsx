import useGitHubProjects from "../hooks/useGitHubProjects";
import "../styles/discovery.css";

const STAGE_CLASS = {
  idea: "stage-idea",
  building: "stage-building",
  beta: "stage-beta",
  completed: "stage-completed",
};

function DiscoveryCard({ project }) {
  const stage = project.stage || "building";
  const stageClass = STAGE_CLASS[stage] || STAGE_CLASS.building;

  return (
    <article className="project-card">
      <header className="card-header">
        <div className="avatar">{(project.userName || "G")[0].toUpperCase()}</div>
        <div className="card-meta">
          <p className="card-username">{project.userName || "GitHub Developer"}</p>
          <p className="card-time">
            <span className="github-badge">GitHub</span> {project.stars?.toLocaleString()} stars
          </p>
        </div>
        <span className={`stage-badge ${stageClass}`}>{stage}</span>
      </header>

      <div className="card-body">
        <h3
          className="card-title"
          onClick={() => window.open(project.githubUrl, "_blank", "noopener,noreferrer")}
        >
          {project.title}
          <span className="external-icon"> ↗</span>
        </h3>

        <p className="card-description">{project.description}</p>

        {Array.isArray(project.techStack) && project.techStack.length > 0 ? (
          <div className="tech-stack">
            {project.techStack.map((tech) => (
              <span key={`${project.id}-${tech}`} className="tech-pill">
                {tech}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function DiscoveryPage() {
  const {
    projects: githubProjects,
    loading,
    error,
  } = useGitHubProjects("stars:>100 language:javascript", 18);

  return (
    <main className="discovery-page">
      <div className="discovery-container">
        <header className="discovery-header">
          <h1>GitHub Discovery</h1>
          <p>Explore trending open-source projects for inspiration and collaboration ideas.</p>
        </header>

        {loading ? <p className="discovery-note">Loading GitHub projects...</p> : null}
        {error ? <p className="discovery-error">{error}</p> : null}

        {!loading && !error && githubProjects.length === 0 ? (
          <p className="discovery-note">No GitHub projects found right now. Try again shortly.</p>
        ) : null}

        <section className="feed-list">
          {githubProjects.map((project) => (
            <DiscoveryCard key={project.id} project={project} />
          ))}
        </section>
      </div>
    </main>
  );
}

export default DiscoveryPage;
