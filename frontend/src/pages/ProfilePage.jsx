// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useNavigate } from "react-router-dom";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import ProfileTabPanel from "../components/profile/ProfileTabPanel";
import ProfileTopBar from "../components/profile/ProfileTopBar";
import useProfilePageData from "../hooks/useProfilePageData";
import { useAuth } from "../hooks/useAuth";
import { stageClass } from "../utils/profileUtils";
import "../styles/profile.css";

// Handles ProfilePage.
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile,
    projects,
    followers,
    following,
    activeTab,
    setActiveTab,
    showMenu,
    setShowMenu,
    loading,
    saving,
    uploading,
    uploadProgress,
    error,
    success,
    editing,
    setEditing,
    formData,
    setFormData,
    menuRef,
    handleAvatarChange,
    handleSave,
    handlePasswordReset,
    handleTogglePrivacy,
    handleSignOut,
    handleDeleteAccount,
  } = useProfilePageData({ user });

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-page-inner">
          <p className="profile-loading">Loading profile...</p>
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatarUrl || user?.photoURL;
  const displayName = profile?.name || user?.displayName || "Developer";

  return (
    <div className="profile-page">
      <div className="profile-page-inner">
        <ProfileTopBar
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={user?.email}
          bio={profile?.bio}
          github={profile?.github}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onAvatarChange={handleAvatarChange}
          projectsCount={projects.length}
          followersCount={followers.length}
          followingCount={following.length}
          onSelectTab={setActiveTab}
          menuRef={menuRef}
          showMenu={showMenu}
          onToggleMenu={() => setShowMenu((prev) => !prev)}
          onStartEdit={() => {
            setEditing(true);
            setShowMenu(false);
          }}
          onResetPassword={handlePasswordReset}
          isPrivate={Boolean(profile?.isPrivate)}
          onTogglePrivacy={handleTogglePrivacy}
          onSignOut={async () => {
            await handleSignOut();
            navigate("/auth");
          }}
          onDeleteAccount={async () => {
            const result = await handleDeleteAccount();
            if (result?.deleted) {
              navigate("/auth");
            }
          }}
        />

        {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
          <div className="profile-skills-row">
            {profile.skills.map((skill) => (
              <span key={skill} className="profile-skill-pill">
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        {error ? <p className="profile-error">{error}</p> : null}
        {success ? <p className="profile-success">{success}</p> : null}

        {editing ? (
          <ProfileEditForm
            formData={formData}
            setFormData={setFormData}
            saving={saving}
            onCancel={() => setEditing(false)}
            onSave={handleSave}
          />
        ) : null}

        <div className="profile-tabs">
          {["projects", "followers", "following"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`profile-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <ProfileTabPanel
          activeTab={activeTab}
          projects={projects}
          followers={followers}
          following={following}
          stageClass={stageClass}
          onOpenProject={(id) => navigate(`/projects/${id}`)}
          onEditProject={(id) => navigate(`/projects/${id}/edit`)}
          onCreateFirstProject={() => navigate("/projects/new")}
          onOpenConnection={(uid) => navigate(`/profile/${uid}`)}
          onDiscover={() => navigate("/discovery")}
        />
      </div>
    </div>
  );
};

export default ProfilePage;

