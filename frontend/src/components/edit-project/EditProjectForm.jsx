// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const EditProjectForm = ({
  formData,
  onChange,
  onSubmit,
  saving,
  error,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="edit-project-form">
      <div className="edit-project-group">
        <label className="edit-project-label">Project title *</label>
        <input name="title" value={formData.title} onChange={onChange} required className="edit-project-input" />
      </div>

      <div className="edit-project-group">
        <label className="edit-project-label">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          required
          rows={4}
          className="edit-project-input edit-project-textarea"
        />
      </div>

      <div className="edit-project-group">
        <label className="edit-project-label">Tech stack</label>
        <input
          name="techStack"
          value={formData.techStack}
          onChange={onChange}
          placeholder="React, Python, Firebase"
          className="edit-project-input"
        />
      </div>

      <div className="edit-project-group">
        <label className="edit-project-label">Current stage *</label>
        <select name="stage" value={formData.stage} onChange={onChange} className="edit-project-input">
          <option value="idea">Idea</option>
          <option value="building">Building</option>
          <option value="beta">Beta</option>
          <option value="completed">Completed - add to Celebration Wall</option>
        </select>
        {formData.stage === "completed" ? (
          <p className="edit-project-completed-note">
            Saving as completed will add you to the Celebration Wall.
          </p>
        ) : null}
      </div>

      <div className="edit-project-group">
        <label className="edit-project-label">What support do you need?</label>
        <textarea
          name="supportNeeded"
          value={formData.supportNeeded}
          onChange={onChange}
          rows={3}
          className="edit-project-input edit-project-textarea"
        />
      </div>

      {error ? <p className="edit-project-error-inline">{error}</p> : null}

      <div className="edit-project-actions">
        <button type="button" onClick={onCancel} className="edit-project-btn edit-project-cancel">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`edit-project-btn edit-project-save ${saving ? "disabled" : ""}`}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default EditProjectForm;

