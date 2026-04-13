// Purpose: Render follower/following rows for the public profile tabs.

const PublicProfileConnections = ({ rows, emptyMessage, onOpenProfile }) => {
  if (!rows.length) {
    return (
      <div className="profile-list-col">
        <div className="profile-empty-state public-profile-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-list-col">
      {rows.map((row) => (
        <button
          key={row.uid}
          type="button"
          className="profile-connection-card"
          onClick={() => onOpenProfile(row.uid)}
        >
          <div className="profile-connection-avatar">
            {row.avatarUrl ? (
              <img
                src={row.avatarUrl}
                alt=""
                className="profile-connection-avatar-img"
              />
            ) : (
              (row.name || row.email || "D")[0].toUpperCase()
            )}
          </div>
          <div>
            <p className="profile-connection-name">
              {row.name || row.email || "Developer"}
            </p>
            <p className="profile-connection-meta">{row.bio || "Developer"}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PublicProfileConnections;
