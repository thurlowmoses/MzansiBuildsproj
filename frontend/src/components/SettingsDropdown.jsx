import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../firebase_config";

function SettingsDropdown({ onClose, user }) {
  const { logout } = useAuth();
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const onSendReset = async () => {
    try {
      setErrorMessage("");
      setStatusMessage("");

      if (!user?.email) {
        throw new Error("No email is linked to this account.");
      }

      await sendPasswordResetEmail(auth, user.email);
      setStatusMessage("Password reset email sent.");
    } catch (error) {
      setErrorMessage(error?.message || "Could not send password reset email.");
    }
  };

  const onLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="settings-dropdown" ref={rootRef}>
      <div className="settings-header">
        <p className="settings-title">Settings</p>
        <p className="settings-user">{user?.displayName || user?.email || "Developer"}</p>
      </div>

      <NavLink className="settings-item" to="/profile" onClick={onClose}>
        Edit profile
      </NavLink>

      <NavLink className="settings-item" to="/help" onClick={onClose}>
        Help assistant
      </NavLink>

      <button type="button" className="settings-item" onClick={onSendReset}>
        Change password
      </button>

      <button type="button" className="settings-item settings-logout" onClick={onLogout}>
        Log out
      </button>

      {statusMessage ? <p className="settings-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="settings-error">{errorMessage}</p> : null}
    </div>
  );
}

export default SettingsDropdown;
