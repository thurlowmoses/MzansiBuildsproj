// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const PublicProfileHeader = ({
  avatarUrl,
  displayName,
  profile,
  projectsCount,
  followerCount,
  followingCount,
  user,
  isFollowing,
  followLoading,
  onFollowToggle,
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="profile-topbar public-profile-header">
      <div className="profile-avatar-wrap">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="profile-avatar-image public-profile-avatar-img"
          />
        ) : (
          <div className="profile-avatar-fallback public-profile-avatar public-profile-avatar-fallback">
            {displayName[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="profile-main-meta public-profile-copy">
        <h1 className="profile-name">{displayName}</h1>
        <p className="profile-email">{profile?.email || ""}</p>
        {profile?.bio ? <p className="profile-bio">{profile.bio}</p> : null}
        {profile?.github ? (
          <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="profile-github-link">
            github.com/{profile.github}
          </a>
        ) : null}

        <div className="profile-stats-row public-profile-tags">
          <button
            type="button"
            className={`profile-stat-btn public-profile-tags-item ${
              activeTab === "projects" ? "public-profile-stat-active" : ""
            }`}
            onClick={() => onSelectTab("projects")}
          >
            <span className="profile-stat-num">{projectsCount}</span>
            <span className="profile-stat-label">projects</span>
          </button>
          <button
            type="button"
            className={`profile-stat-btn public-profile-tags-item ${
              activeTab === "followers" ? "public-profile-stat-active" : ""
            }`}
            onClick={() => onSelectTab("followers")}
          >
            <span className="profile-stat-num">{followerCount}</span>
            <span className="profile-stat-label">followers</span>
          </button>
          <button
            type="button"
            className={`profile-stat-btn public-profile-tags-item ${
              activeTab === "following" ? "public-profile-stat-active" : ""
            }`}
            onClick={() => onSelectTab("following")}
          >
            <span className="profile-stat-num">{followingCount}</span>
            <span className="profile-stat-label">following</span>
          </button>
        </div>
      </div>

      {user ? (
        <button
          type="button"
          className={isFollowing ? "profile-btn public-profile-unfollow-btn" : "profile-btn public-profile-follow-btn"}
          onClick={onFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
        </button>
      ) : null}
    </div>
  );
};

export default PublicProfileHeader;

