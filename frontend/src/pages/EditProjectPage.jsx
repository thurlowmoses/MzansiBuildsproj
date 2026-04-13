// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import EditProjectForm from "../components/edit-project/EditProjectForm";
import { auth, db } from "../firebase_config";
import "../styles/edit-project.css";

// Handles EditProjectPage.
function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: "",
    stage: "idea",
    supportNeeded: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Handles loadProject.
    const loadProject = async () => {
      if (!id) {
        setError("Project not found.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Project not found.");
          setLoading(false);
          return;
        }

        const data = docSnap.data() || {};

        if (data.userId && data.userId !== auth.currentUser?.uid) {
          setError("You can only edit your own projects.");
          setLoading(false);
          return;
        }

        setFormData({
          title: data.title || "",
          description: data.description || "",
          techStack: Array.isArray(data.techStack) ? data.techStack.join(", ") : "",
          stage: data.stage || "idea",
          supportNeeded: data.supportNeeded || "",
        });
      } catch {
        setError("Could not load project.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  // Handles onChange.
  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handles handleUpdate.
  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!id) return;

    setSaving(true);
    setError("");

    try {
      const techArray = formData.techStack
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await updateDoc(doc(db, "projects", id), {
        title: formData.title,
        description: formData.description,
        techStack: techArray,
        stage: formData.stage,
        supportNeeded: formData.supportNeeded,
        updatedAt: serverTimestamp(),
        completed: formData.stage === "completed",
      });

      navigate(`/projects/${id}`);
    } catch {
      setError("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handles handleDelete.
  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await deleteDoc(doc(db, "projects", id));
      navigate("/dashboard");
    } catch {
      setError("Failed to delete project.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-project-page">
        <p className="edit-project-loading">Loading project...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="edit-project-page">
        <p className="edit-project-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="edit-project-page">
      <div className="edit-project-container">
        <div className="edit-project-header">
          <h1 className="edit-project-title">Edit project</h1>
          <button onClick={handleDelete} disabled={deleting} className="edit-project-delete-btn">
            {deleting ? "Deleting..." : "Delete project"}
          </button>
        </div>

        <EditProjectForm
          formData={formData}
          onChange={onChange}
          onSubmit={handleUpdate}
          saving={saving}
          error={error}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

export default EditProjectPage;

