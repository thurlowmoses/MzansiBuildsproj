
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase_config";
import "../styles/newproject.css";

const NewProjectPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: "",
    stage: "idea",
    supportNeeded: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!auth.currentUser) {
      setError("You must be logged in to create a project.");
      setLoading(false);
      return;
    }

    try {
      // Convert "React, Python, Firebase" → ["React", "Python", "Firebase"]
      const techArray = formData.techStack
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      await addDoc(collection(db, "projects"), {
        title: formData.title,
        description: formData.description,
        techStack: techArray,
        stage: formData.stage,
        supportNeeded: formData.supportNeeded,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        completed: formData.stage === "completed",
        createdAt: serverTimestamp(),
      });

      navigate("/feed");

    } catch (err) {
      setError(`Failed to create project: ${err?.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="np-page">
      <div className="np-container">

        <h1 className="np-title">Start building in public</h1>
        <p className="np-subtitle">
          Share what you are working on. The community wants to see it.
        </p>

        <form onSubmit={onSubmit} className="np-form">

          <div className="form-group">
            <label htmlFor="title">Project title *</label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              required
              placeholder="e.g. AI Skin Cancer Detector"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">What are you building? *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              required
              placeholder="Describe your project — what problem it solves, who it is for..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="techStack">Tech stack</label>
            <input
              id="techStack"
              name="techStack"
              value={formData.techStack}
              onChange={onChange}
              placeholder="e.g. React, Python, Firebase"
            />
            <p className="form-hint">Separate technologies with commas</p>
          </div>

          <div className="form-group">
            <label htmlFor="stage">Current stage *</label>
            <select
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={onChange}
            >
              <option value="idea">💡 Idea — just getting started</option>
              <option value="building">🔨 Building — actively coding</option>
              <option value="beta">🚀 Beta — testing with users</option>
              <option value="completed">✅ Completed — shipped it!</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="supportNeeded">What support do you need?</label>
            <textarea
              id="supportNeeded"
              name="supportNeeded"
              value={formData.supportNeeded}
              onChange={onChange}
              placeholder="e.g. Looking for a frontend developer, need feedback on my API..."
              rows={3}
            />
          </div>

          {error && <p className="np-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="np-button"
          >
            {loading ? "Posting project..." : "Post my project"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default NewProjectPage;