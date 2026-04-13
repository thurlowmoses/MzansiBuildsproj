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
}) => {
  return (
    <div className="profile-topbar public-profile-header">
      <div className="profile-avatar-wrap">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="profile-avatar-image public-profile-avatar-img" />
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
          <div className="profile-stat-btn public-profile-tags-item">
            <span className="profile-stat-num">{projectsCount}</span>
            <span className="profile-stat-label">projects</span>
          </div>
          <div className="profile-stat-btn public-profile-tags-item">
            <span className="profile-stat-num">{followerCount}</span>
            <span className="profile-stat-label">followers</span>
          </div>
          <div className="profile-stat-btn public-profile-tags-item">
            <span className="profile-stat-num">{followingCount}</span>
            <span className="profile-stat-label">following</span>
          </div>
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

