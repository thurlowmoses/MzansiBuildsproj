import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
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

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [activePeople, setActivePeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setActivePeople([]);
      return;
    }

    const peopleQuery = query(collection(db, "users"), limit(12));

    const unsubscribe = onSnapshot(peopleQuery, (snapshot) => {
      const people = snapshot.docs
        .map((docItem) => {
          const row = docItem.data() || {};
          const name = row.displayName || row.email || "Developer";
          return {
            id: docItem.id,
            name,
            isMe: row.uid === user.uid,
          };
        })
        .filter((person) => !person.isMe)
        .slice(0, 7);

      setActivePeople(people);
    });

    return unsubscribe;
  }, [user]);

  const messageCount = useMemo(() => Math.min(activePeople.length, 9), [activePeople.length]);

  // Send top-bar searches straight to messages.
  const onSearchSubmit = (event) => {
    event.preventDefault();

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate("/messages");
      return;
    }

    navigate(`/messages?q=${encodeURIComponent(trimmed)}`);
  };

  if (location.pathname === "/auth") {
    return null;
  }

  return (


    <nav className="navbar-instagram">
      <div className="navbar-wrapper">
        {/* Brand link. */}
        <NavLink to="/feed" className="navbar-logo">
          <span className="logo-icon" aria-hidden="true">
            <IconSpark />
          </span>
          <span className="logo-text">MzansiBuilds</span>
        </NavLink>

        {/* Developer search. */}
        <form className="navbar-search" onSubmit={onSearchSubmit}>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search developers"
            aria-label="Search developers"
          />
        </form>

        {/* Quick nav actions. */}
        <div className="navbar-icons">
          <NavLink to="/feed" className="nav-icon" title="Feed">
            <IconHome />
            <span className="sr-only">Feed</span>
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
          <NavLink to="/profile" className="nav-icon" title="Profile">
            <IconUser />
            <span className="sr-only">Profile</span>
          </NavLink>
          <NavLink to="/celebration-wall" className="nav-icon" title="Celebrations">
            <IconSpark />
            <span className="sr-only">Celebrations</span>
          </NavLink>
          <NavLink to="/discovery" className="nav-icon" title="GitHub discovery">
            <IconCompass />
            <span className="sr-only">GitHub discovery</span>
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
              title="Settings"
            >
              <IconSettings />
              <span className="sr-only">Settings</span>
            </button>
            {showSettings && (
              <SettingsDropdown onClose={() => setShowSettings(false)} user={user} />
            )}
          </div>
        </div>
      </div>

      <div className="navbar-live-row">
        <span className="live-indicator" aria-hidden="true" />
        <span className="live-title">Currently building</span>
        <div className="live-people">
          {activePeople.length > 0 ? (
            activePeople.map((person) => (
              <NavLink key={person.id} to="/messages" className="live-chip" title={`Message ${person.name}`}>
                {person.name}
              </NavLink>
            ))
          ) : (
            <span className="live-empty">No active developers yet</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
