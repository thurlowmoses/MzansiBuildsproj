// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const DeveloperDirectory = ({
  filteredDevelopers,
  selectedUserId,
  followingSet,
  followerCounts,
  onOpenChat,
  onToggleFollow,
}) => {
  return (
    <div className="developer-list">
      {filteredDevelopers.map((developer) => {
        const followed = followingSet.has(developer.id);
        const locked = developer.isPrivate && !followed;

        return (
          <div
            key={developer.id}
            className={`developer-item ${selectedUserId === developer.id ? "active" : ""} ${locked ? "locked" : ""}`}
            onClick={() => onOpenChat(developer.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenChat(developer.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className="developer-avatar">{developer.name.charAt(0).toUpperCase()}</span>
            <span className="developer-meta">
              <strong>
                {developer.name}
                {developer.isPrivate ? <span className="private-pill">Private</span> : null}
              </strong>
              <small>
                {(followerCounts[developer.id] || 0).toLocaleString()} followers
                {locked ? " • Follow to view developer activity" : ` • ${developer.bio}`}
              </small>
            </span>
            <div className="developer-actions">
              <button
                type="button"
                className={`follow-btn ${followed ? "following" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFollow(developer.id);
                }}
              >
                {followed ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DeveloperDirectory;

