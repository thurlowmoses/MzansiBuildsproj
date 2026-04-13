// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const ProfileTopBar = ({
  avatarUrl,
  displayName,
  email,
  bio,
  github,
  uploading,
  uploadProgress,
  onAvatarChange,
  projectsCount,
  followersCount,
  followingCount,
  onSelectTab,
  menuRef,
  showMenu,
  onToggleMenu,
  onStartEdit,
  onResetPassword,
  onGoSettings,
  onSignOut,
}) => {
  return (
    <div className="profile-topbar">
      <div className="profile-avatar-wrap">
        <label htmlFor="avatar-upload" className="profile-avatar-label">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="profile-avatar-image" />
          ) : (
            <div className="profile-avatar-fallback">{displayName[0].toUpperCase()}</div>
          )}
          <div className="profile-avatar-overlay">{uploading ? `${uploadProgress}%` : "Change"}</div>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          disabled={uploading}
          className="profile-hidden-input"
        />
      </div>

      <div className="profile-main-meta">
        <h1 className="profile-name">{displayName}</h1>
        <p className="profile-email">{email}</p>
        {bio ? <p className="profile-bio">{bio}</p> : null}
        {github ? (
          <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="profile-github-link">
            github.com/{github}
          </a>
        ) : null}

        <div className="profile-stats-row">
          <button type="button" className="profile-stat-btn" onClick={() => onSelectTab("projects")}>
            <span className="profile-stat-num">{projectsCount}</span>
            <span className="profile-stat-label">projects</span>
          </button>
          <button type="button" className="profile-stat-btn" onClick={() => onSelectTab("followers")}>
            <span className="profile-stat-num">{followersCount}</span>
            <span className="profile-stat-label">followers</span>
          </button>
          <button type="button" className="profile-stat-btn" onClick={() => onSelectTab("following")}>
            <span className="profile-stat-num">{followingCount}</span>
            <span className="profile-stat-label">following</span>
          </button>
        </div>
      </div>

      <div className="profile-menu-wrap" ref={menuRef}>
        <button type="button" className="profile-menu-btn" onClick={onToggleMenu}>
          ...
        </button>
        {showMenu ? (
          <div className="profile-dropdown">
            <button type="button" className="profile-dropdown-item" onClick={onStartEdit}>
              Edit profile
            </button>
            <button type="button" className="profile-dropdown-item" onClick={onResetPassword}>
              Change password
            </button>
            <button type="button" className="profile-dropdown-item" onClick={onGoSettings}>
              Settings
            </button>
            <div className="profile-dropdown-sep" />
            <button type="button" className="profile-dropdown-item profile-dropdown-danger" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileTopBar;

