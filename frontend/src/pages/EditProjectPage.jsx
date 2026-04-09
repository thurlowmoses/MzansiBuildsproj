import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase_config";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "2rem",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#fff",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#aaa",
  },
  input: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid #5a1a1a",
    color: "#ef5350",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "12px",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    background: "transparent",
    border: "1px solid #333",
    color: "#666",
    borderRadius: "8px",
    padding: "11px",
    fontSize: "14px",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "11px",
    fontSize: "14px",
    fontWeight: "600",
  },
};

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

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      <div style={styles.page}>
        <p style={{ color: "#666", padding: "2rem" }}>Loading project...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#ef5350", padding: "2rem" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Edit project</h1>
          <button onClick={handleDelete} disabled={deleting} style={styles.deleteBtn}>
            {deleting ? "Deleting..." : "Delete project"}
          </button>
        </div>

        <form onSubmit={handleUpdate} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Project title *</label>
            <input name="title" value={formData.title} onChange={onChange} required style={styles.input} />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              required
              rows={4}
              style={{ ...styles.input, resize: "vertical" }}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Tech stack</label>
            <input
              name="techStack"
              value={formData.techStack}
              onChange={onChange}
              placeholder="React, Python, Firebase"
              style={styles.input}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Current stage *</label>
            <select name="stage" value={formData.stage} onChange={onChange} style={styles.input}>
              <option value="idea">Idea</option>
              <option value="building">Building</option>
              <option value="beta">Beta</option>
              <option value="completed">Completed - add to Celebration Wall</option>
            </select>
            {formData.stage === "completed" ? (
              <p style={{ fontSize: "12px", color: "#4caf50", margin: "6px 0 0" }}>
                Saving as completed will add you to the Celebration Wall.
              </p>
            ) : null}
          </div>

          <div style={styles.group}>
            <label style={styles.label}>What support do you need?</label>
            <textarea
              name="supportNeeded"
              value={formData.supportNeeded}
              onChange={onChange}
              rows={3}
              style={{ ...styles.input, resize: "vertical" }}
            />
          </div>

          {error ? <p style={{ color: "#ef5350", fontSize: "13px" }}>{error}</p> : null}

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveBtn,
                background: saving ? "#333" : "#2d6a2d",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProjectPage;
