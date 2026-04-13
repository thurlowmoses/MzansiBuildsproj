// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const ProfileEditForm = ({ formData, setFormData, saving, onCancel, onSave }) => {
  return (
    <form onSubmit={onSave} className="profile-edit-form">
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
        <button type="button" className="profile-btn profile-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="profile-btn profile-btn-save" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;

