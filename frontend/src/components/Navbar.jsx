import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase_config";
import SettingsDropdown from "./SettingsDropdown";
import "../styles/navbar.css";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 19.5V15a2 2 0 0 0-4 0v4.5A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5v-8Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.1 3.1c-.66.5-1.57.03-1.57-.8V16.8A2.5 2.5 0 0 1 2 14.5v-9A2.5 2.5 0 0 1 4.5 3H6" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.8 3.7c.17-.9 1.43-.9 1.6 0l.9 4.5a2 2 0 0 0 1.54 1.54l4.5.9c.9.17.9 1.43 0 1.6l-4.5.9a2 2 0 0 0-1.54 1.54l-.9 4.5c-.17.9-1.43.9-1.6 0l-.9-4.5a2 2 0 0 0-1.54-1.54l-4.5-.9c-.9-.17-.9-1.43 0-1.6l4.5-.9a2 2 0 0 0 1.54-1.54l.9-4.5ZM6 15.5a1 1 0 0 1 1 1l.3 1.2a1 1 0 0 0 .7.7l1.2.3a1 1 0 0 1 0 2l-1.2.3a1 1 0 0 0-.7.7L7 23a1 1 0 1 1-2 0l-.3-1.2a1 1 0 0 0-.7-.7l-1.2-.3a1 1 0 0 1 0-2l1.2-.3a1 1 0 0 0 .7-.7L5 16.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-7 8a7 7 0 0 1 14 0v1H5v-1Z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m19.5 12 .96-1.66a1 1 0 0 0-.37-1.37l-1.55-.9a6.8 6.8 0 0 0-.59-1.4l.45-1.74a1 1 0 0 0-.72-1.22l-1.9-.5a1 1 0 0 0-1.17.56L13.8 5h-1.6l-.81-1.5a1 1 0 0 0-1.17-.56l-1.9.5a1 1 0 0 0-.72 1.22l.45 1.75c-.24.45-.44.92-.59 1.4l-1.55.9a1 1 0 0 0-.37 1.36L4.5 12l-.96 1.66a1 1 0 0 0 .37 1.37l1.55.9c.15.48.35.95.59 1.4l-.45 1.74a1 1 0 0 0 .72 1.22l1.9.5a1 1 0 0 0 1.17-.56l.81-1.5h1.6l.81 1.5a1 1 0 0 0 1.17.56l1.9-.5a1 1 0 0 0 .72-1.22l-.45-1.75c.24-.44.44-.91.59-1.39l1.55-.9a1 1 0 0 0 .37-1.36L19.5 12Zm-7.5 3a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2.4 2.4 0 0 0 2.2-1.4h-4.4A2.4 2.4 0 0 0 12 22Zm7-5.5-1.3-1.4V11a5.7 5.7 0 0 0-4.4-5.5V4a1.3 1.3 0 0 0-2.6 0v1.5A5.7 5.7 0 0 0 6.3 11v4.1L5 16.5a.9.9 0 0 0 .6 1.5h12.8a.9.9 0 0 0 .6-1.5Z" />
    </svg>
  );
}

function IconTool() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 7.2a6.2 6.2 0 0 1-8.8 5.6l-6.8 6.8a1.2 1.2 0 0 1-1.7 0l-.3-.3a1.2 1.2 0 0 1 0-1.7l6.8-6.8A6.2 6.2 0 0 1 16.8 3a1 1 0 0 1 .7 1.7l-2 2 1.8 1.8 2-2a1 1 0 0 1 1.7.7Z" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-5a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 12 17Zm-2.2-7.3a1 1 0 0 0 2 0 1.3 1.3 0 1 1 2.6 0c0 .47-.2.76-.68 1.14l-.42.33c-.77.6-1.36 1.24-1.36 2.53a1 1 0 1 0 2 0c0-.45.14-.67.58-1.03l.42-.33c.9-.72 1.46-1.56 1.46-2.64a3.3 3.3 0 1 0-6.6 0Z" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm3.9 5.8-5.6 2.4a1 1 0 0 0-.5.5l-2.4 5.6a.75.75 0 0 0 1 .98l5.6-2.38a1 1 0 0 0 .5-.5l2.4-5.6a.75.75 0 0 0-.98-1Zm-3.25 3.96a1.2 1.2 0 1 1-1.7 1.7 1.2 1.2 0 0 1 1.7-1.7Z" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10v2h2.5A1.5 1.5 0 0 1 21 6.5V8a5 5 0 0 1-5 5h-.08A5.99 5.99 0 0 1 13 15.92V18h3a1 1 0 1 1 0 2H8a1 1 0 0 1 0-2h3v-2.08A5.99 5.99 0 0 1 8.08 13H8a5 5 0 0 1-5-5V6.5A1.5 1.5 0 0 1 4.5 5H7V3Zm10 4v1a3 3 0 0 1-.24 1.18A3 3 0 0 0 19 8V7h-2Zm-10 0H5v1a3 3 0 0 0 2.24 2.9A3 3 0 0 1 7 8V7Z" />
    </svg>
  );
}

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [followingIds, setFollowingIds] = useState([]);
  const [activePeople, setActivePeople] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationPopup, setNotificationPopup] = useState(null);
  const knownNotificationIdsRef = useRef(new Set());
  const hasInitializedNotificationsRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setFollowingIds([]);
      setActivePeople([]);
      setUnreadNotifications(0);
      return;
    }

    const followsQuery = query(collection(db, "follows"), where("followerId", "==", user.uid));

    const unsubscribe = onSnapshot(followsQuery, (snapshot) => {
      const nextIds = snapshot.docs
        .map((docItem) => docItem.data() || {})
        .map((row) => row.followingId)
        .filter(Boolean);
      setFollowingIds(nextIds);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || followingIds.length === 0) {
      setActivePeople([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const people = snapshot.docs
        .map((docItem) => {
          const row = docItem.data() || {};
          const name = row.displayName || row.email || "Developer";
          return {
            id: row.uid || docItem.id,
            name,
            photoURL: row.photoURL || "",
          };
        })
        .filter((person) => followingIds.includes(person.id))
        .slice(0, 7);

      setActivePeople(people);
    });

    return unsubscribe;
  }, [user, followingIds]);

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      knownNotificationIdsRef.current = new Set();
      hasInitializedNotificationsRef.current = false;
      return;
    }

    const notificationsQuery = query(collection(db, "notifications"), where("recipientId", "==", user.uid));

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const userRows = snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() || {}) }));
      const unread = userRows.filter((row) => !row.isRead).length;

      const nextKnown = new Set(userRows.map((row) => row.id));
      const newlyArrived = userRows
        .filter((row) => !knownNotificationIdsRef.current.has(row.id) && !row.isRead)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      if (hasInitializedNotificationsRef.current && newlyArrived.length > 0) {
        const latest = newlyArrived[0];
        setNotificationPopup({
          id: latest.id,
          message: latest.message || "You have a new update.",
          targetType: latest.targetType || "notifications",
          targetId: latest.targetId || "",
          actorId: latest.actorId || "",
        });

        window.setTimeout(() => {
          setNotificationPopup((prev) => (prev?.id === latest.id ? null : prev));
        }, 2800);
      }

      knownNotificationIdsRef.current = nextKnown;
      hasInitializedNotificationsRef.current = true;

      const unreadFromFilter = userRows.filter((row) => !row.isRead).length;
      setUnreadNotifications(unreadFromFilter);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const rows = snapshot.docs.map((docItem) => {
        const data = docItem.data() || {};
        return {
          id: data.uid || docItem.id,
          displayName: data.displayName || data.email || "Developer",
          email: data.email || "",
          photoURL: data.photoURL || "",
        };
      });
      setAllUsers(rows);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const rows = snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() || {}) }));
      setAllProjects(rows);
    });

    return unsubscribe;
  }, []);

  const messageCount = useMemo(() => Math.min(activePeople.length, 9), [activePeople.length]);
  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const matchedUsers = useMemo(() => {
    if (!normalizedQuery) return [];
    return allUsers
      .filter((person) => person.id !== user?.uid)
      .filter((person) => {
        return (
          person.displayName.toLowerCase().includes(normalizedQuery) ||
          person.email.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 5);
  }, [allUsers, normalizedQuery, user?.uid]);

  const matchedProjects = useMemo(() => {
    if (!normalizedQuery) return [];
    return allProjects
      .filter((project) => {
        const haystack = [
          project.title,
          project.description,
          project.userName,
          project.supportNeeded,
          ...(Array.isArray(project.techStack) ? project.techStack : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => getTimeValue(b.updatedAt || b.createdAt) - getTimeValue(a.updatedAt || a.createdAt))
      .slice(0, 5);
  }, [allProjects, normalizedQuery]);

  const trendingProjects = useMemo(() => {
    return [...allProjects]
      .filter((project) => !project.isGitHub)
      .sort((a, b) => {
        const scoreA = (a.completed ? 2 : 0) + (a.supportNeeded ? 1 : 0);
        const scoreB = (b.completed ? 2 : 0) + (b.supportNeeded ? 1 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return getTimeValue(b.updatedAt || b.createdAt) - getTimeValue(a.updatedAt || a.createdAt);
      })
      .slice(0, 5);
  }, [allProjects]);

  const showSearchResults = searchOpen && (normalizedQuery.length > 0 || trendingProjects.length > 0);

  const openProject = (project) => {
    if (project.isGitHub && project.githubUrl) {
      window.open(project.githubUrl, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(`/projects/${project.id}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const openUser = (person) => {
    if (person.id === user?.uid) {
      navigate("/profile");
    } else {
      navigate(`/profile/${person.id}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Send top-bar searches straight to messages.
  const onSearchSubmit = (event) => {
    event.preventDefault();

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate("/discovery");
      return;
    }

    if (trimmed.toLowerCase().includes("celebration")) {
      navigate("/celebration");
      setSearchOpen(false);
      return;
    }

    if (matchedUsers.length > 0) {
      openUser(matchedUsers[0]);
      return;
    }

    if (matchedProjects.length > 0) {
      openProject(matchedProjects[0]);
      return;
    }

    navigate(`/discovery?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
  };

  if (location.pathname === "/auth" || location.pathname === "/") {
    return null;
  }

  return (


    <nav className="navbar-instagram">
      {notificationPopup ? (
        <div className="navbar-notification-pop" role="status" aria-live="polite">
          <button
            type="button"
            className="navbar-notification-main"
            onClick={() => {
              if (notificationPopup.targetType === "project" && notificationPopup.targetId) {
                navigate(`/projects/${notificationPopup.targetId}`);
              } else if (notificationPopup.targetType === "profile" && notificationPopup.targetId) {
                navigate(`/profile/${notificationPopup.targetId}`);
              } else if (notificationPopup.targetType === "messages") {
                navigate("/messages");
              } else {
                navigate("/notifications");
              }
              setNotificationPopup(null);
            }}
          >
            <span className="navbar-notification-pop-dot" aria-hidden="true" />
            <span>{notificationPopup.message}</span>
          </button>
          {notificationPopup.actorId && notificationPopup.actorId !== user?.uid ? (
            <button
              type="button"
              className="navbar-notification-message"
              onClick={() => {
                navigate(`/messages?userId=${notificationPopup.actorId}`);
                setNotificationPopup(null);
              }}
            >
              Message
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="navbar-wrapper">
        {/* Brand link. */}
        <NavLink to="/feed" className="navbar-logo">
          <span className="logo-icon" aria-hidden="true">
            <IconSpark />
          </span>
          <span className="logo-text">MzansiBuilds</span>
        </NavLink>

        {/* Developer search. */}
        <div
          className="navbar-search-wrap"
          onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
        >
          <form className="navbar-search" onSubmit={onSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search users, projects, trends"
              aria-label="Search users, projects, trends"
            />
          </form>

          {showSearchResults ? (
            <div className="search-results-popover" role="listbox" aria-label="Search suggestions">
              {normalizedQuery ? (
                <>
                  <div className="search-group">
                    <p className="search-group-title">Users</p>
                    {matchedUsers.length === 0 ? (
                      <p className="search-empty">No users found.</p>
                    ) : (
                      matchedUsers.map((person) => (
                        <button
                          key={`user-${person.id}`}
                          type="button"
                          className="search-item"
                          onMouseDown={() => openUser(person)}
                        >
                          <span className="search-item-title">{person.displayName}</span>
                          <span className="search-item-sub">{person.email || "Profile"}</span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="search-group">
                    <p className="search-group-title">Projects</p>
                    {matchedProjects.length === 0 ? (
                      <p className="search-empty">No projects found.</p>
                    ) : (
                      matchedProjects.map((project) => (
                        <button
                          key={`project-${project.id}`}
                          type="button"
                          className="search-item"
                          onMouseDown={() => openProject(project)}
                        >
                          <span className="search-item-title">{project.title || "Untitled project"}</span>
                          <span className="search-item-sub">by {project.userName || "Developer"}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : null}

              <div className="search-group">
                <p className="search-group-title">Trending</p>
                {trendingProjects.length === 0 ? (
                  <p className="search-empty">No trending projects yet.</p>
                ) : (
                  trendingProjects.map((project, index) => (
                    <button
                      key={`trend-${project.id}`}
                      type="button"
                      className="search-item"
                      onMouseDown={() => openProject(project)}
                    >
                      <span className="search-item-title">#{index + 1} {project.title || "Untitled project"}</span>
                      <span className="search-item-sub">
                        {project.supportNeeded ? `Needs help: ${project.supportNeeded}` : project.completed ? "Completed" : "Active"}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="search-group">
                <p className="search-group-title">Quick links</p>
                <button
                  type="button"
                  className="search-item"
                  onMouseDown={() => {
                    navigate("/celebration");
                    setSearchOpen(false);
                  }}
                >
                  <span className="search-item-title">Celebration Wall</span>
                  <span className="search-item-sub">See completed projects and breakthroughs</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick nav actions. */}
        <div className="navbar-icons">
          <NavLink to="/feed" className="nav-icon" title="Feed">
            <IconHome />
            <span className="sr-only">Feed</span>
          </NavLink>
          <NavLink to="/discovery" className="nav-icon" title="GitHub discovery">
            <IconCompass />
            <span className="sr-only">GitHub discovery</span>
          </NavLink>
          <NavLink to="/projects/new" className="nav-icon" title="Create">
            <IconPlus />
            <span className="sr-only">Create</span>
          </NavLink>
          <NavLink to="/messages" className="nav-icon nav-messages" title="Messages">
            <IconMessage />
            <span className="sr-only">Messages</span>
            {messageCount > 0 ? <span className="message-badge">{messageCount}</span> : null}
          </NavLink>
          <NavLink to="/notifications" className="nav-icon nav-notifications" title="Notifications">
            <IconBell />
            <span className="sr-only">Notifications</span>
            {unreadNotifications > 0 ? <span className="message-badge">{unreadNotifications}</span> : null}
          </NavLink>
          <NavLink to="/dashboard" className="nav-icon" title="Dashboard">
            <IconDashboard />
            <span className="sr-only">Dashboard</span>
          </NavLink>
          <NavLink to="/celebration" className="nav-icon" title="Celebration wall">
            <IconTrophy />
            <span className="sr-only">Celebration wall</span>
          </NavLink>
          <NavLink to="/help" className="nav-icon" title="Help assistant">
            <IconHelp />
            <span className="sr-only">Help assistant</span>
          </NavLink>

          {/* Settings menu. */}
          <div className="navbar-settings-container">
            <button
              type="button"
              className="nav-icon settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Tools"
            >
              <IconTool />
              <span className="sr-only">Tools</span>
            </button>
            {showSettings && (
              <SettingsDropdown onClose={() => setShowSettings(false)} user={user} />
            )}
          </div>

          <NavLink to="/profile" className="nav-icon" title="Profile">
            <IconUser />
            <span className="sr-only">Profile</span>
          </NavLink>
        </div>
      </div>

      <div className="navbar-live-row">
        <span className="live-indicator" aria-hidden="true" />
        <span className="live-title">Following now</span>
        <div className="live-people">
          {activePeople.length > 0 ? (
            activePeople.map((person) => (
              <NavLink key={person.id} to={`/profile/${person.id}`} className="live-chip" title={`View ${person.name}`}>
                {person.photoURL ? (
                  <img src={person.photoURL} alt={person.name} className="live-chip-avatar" />
                ) : (
                  <span className="live-chip-avatar live-chip-initial">{person.name.charAt(0).toUpperCase()}</span>
                )}
                <span>{person.name}</span>
              </NavLink>
            ))
          ) : (
            <span className="live-empty">Follow developers to see activity here</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
