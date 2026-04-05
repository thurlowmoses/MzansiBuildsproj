import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-mark">M</div>
          <span>
            Mzansi<span className="logo-green">Builds</span>
          </span>
        </div>
        <button className="landing-signin" onClick={() => navigate("/auth")}>
          Sign in
        </button>
      </nav>

      <section className="hero">
        <div className="hero-badge">🇿🇦 Built for African developers</div>
        <h1 className="hero-title">
          Build in public.
          <br />
          <span className="hero-green">Grow together.</span>
        </h1>
        <p className="hero-subtitle">
          MzansiBuilds is where developers share what they are working on, get help when they are
          stuck, and celebrate when they ship.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate("/auth")}>
            Get started - it is free
          </button>
          <button className="btn-secondary" onClick={() => navigate("/feed")}>
            See what is being built
          </button>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-icon">📢</span>
          <h3>Post your project</h3>
          <p>Share what you are building, what stage you are at, and what help you need.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Live feed</h3>
          <p>See what other developers are building right now. Comment and collaborate in real time.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🤖</span>
          <h3>AI code review</h3>
          <p>Paste your code and get instant feedback from an AI senior developer.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🏆</span>
          <h3>Celebration Wall</h3>
          <p>When you ship, you get added to the wall of developers who built in public.</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
