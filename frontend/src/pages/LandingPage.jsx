// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

// Handles LandingPage.
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
        <div className="hero-badge">{"\uD83C\uDF0D"} Built for African developers</div>
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
          <button className="btn-secondary" onClick={() => navigate("/auth")}>
            See what is being built
          </button>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-icon" aria-hidden="true">{"\uD83D\uDCE2"}</span>
          <h3>Post your project</h3>
          <p>Share what you are building, what stage you are at, and what help you need.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon" aria-hidden="true">{"\u26A1"}</span>
          <h3>Live feed</h3>
          <p>See what other developers are building right now. Comment and collaborate in real time.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon" aria-hidden="true">{"\uD83E\uDD16"}</span>
          <h3>AI code review</h3>
          <p>Paste your code and get instant feedback from an AI senior developer.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon" aria-hidden="true">{"\uD83C\uDFC6"}</span>
          <h3>Celebration Wall</h3>
          <p>When you ship, you get added to the wall of developers who built in public.</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

