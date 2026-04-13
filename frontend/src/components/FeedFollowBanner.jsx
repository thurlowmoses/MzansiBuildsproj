// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const FeedFollowBanner = ({ onFindDevelopers }) => {
  return (
    <div className="feed-follow-banner">
      <div className="feed-follow-banner-copy">
        <p className="feed-follow-banner-title">Personalise your feed</p>
        <p className="feed-follow-banner-text">
          Follow developers to see only their projects here. Currently showing everyone.
        </p>
      </div>
      <button type="button" onClick={onFindDevelopers} className="feed-follow-banner-btn">
        Find developers
      </button>
    </div>
  );
};

export default FeedFollowBanner;

