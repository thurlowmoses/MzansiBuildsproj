// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const DashboardFollowersSection = ({ followers, onOpenProfile }) => {
  if (followers.length === 0) return null;

  return (
    <section className="dashboard-section">
      <h2 className="section-title">Recent Followers</h2>
      <div className="followers-grid">
        {followers.map((follower) => (
          <div key={follower.uid} className="follower-card" onClick={() => onOpenProfile(follower.uid)}>
            <div className="follower-avatar">
              {follower.photoURL ? (
                <img src={follower.photoURL} alt={follower.displayName} />
              ) : (
                <div className="avatar-placeholder">{follower.displayName?.charAt(0) || "?"}</div>
              )}
            </div>
            <p className="follower-name">{follower.displayName}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardFollowersSection;

