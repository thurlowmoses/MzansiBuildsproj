// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/notifications.css";

// Handles formatTimeLabel.
function formatTimeLabel(timestamp) {
  const seconds = timestamp?.seconds;
  if (!seconds) return "now";

  const date = new Date(seconds * 1000);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Handles labelForNotification.
function labelForNotification(notification) {
  switch (notification.type) {
    case "follow_request":
      return "Follow request";
    case "follow":
      return "New follower";
    case "comment":
      return "Comment";
    case "collaboration":
      return "Raised hand";
    case "help_offered":
      return "Help offered";
    case "milestone":
      return "Milestone update";
    case "message":
      return "New message";
    case "project_completed":
      return "Task completed";
    default:
      return "Notification";
  }
}

// Handles NotificationsPage.
function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsQuery = query(collection(db, "notifications"), where("recipientId", "==", user.uid));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() || {}) }));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        setErrorMessage(error?.message || "Could not load notifications.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const followerActivityTypes = useMemo(
    () => new Set(["follow", "follow_request", "project_completed", "milestone"]),
    []
  );
  const followerActivityCount = useMemo(
    () => notifications.filter((item) => followerActivityTypes.has(item.type)).length,
    [notifications, followerActivityTypes]
  );
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "followers") {
      return notifications.filter((item) => followerActivityTypes.has(item.type));
    }
    return notifications;
  }, [activeFilter, notifications, followerActivityTypes]);
  const displayedNotifications = useMemo(
    () => filteredNotifications.slice(0, visibleCount),
    [filteredNotifications, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(6);
  }, [activeFilter, notifications.length]);

  // Handles markRead.
  const markRead = async (notificationId) => {
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
      readAt: serverTimestamp(),
    });
  };

  // Handles openNotification.
  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }

    if (notification.targetType === "project" && notification.targetId) {
      navigate(`/projects/${notification.targetId}`);
      return;
    }

    if (notification.targetType === "profile" && notification.targetId) {
      navigate(`/profile/${notification.targetId}`);
      return;
    }

    if (notification.targetType === "messages") {
      navigate("/messages");
    }
  };

  // Handles openMessageFromNotification.
  const openMessageFromNotification = (event, notification) => {
    event.stopPropagation();
    const actorId = notification.actorId;
    if (!actorId || actorId === user?.uid) {
      return;
    }
    navigate(`/messages?userId=${actorId}`);
  };

  if (loading) {
    return (
      <main className="notifications-page">
        <div className="notifications-shell">
          <p>Loading notifications...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="notifications-page">
      <div className="notifications-shell">
        <header className="notifications-header">
          <div>
            <h1>Notifications</h1>
            <p>{unreadCount} unread</p>
          </div>
        </header>

        <div className="notifications-filters" role="tablist" aria-label="Notification filters">
          <button
            type="button"
            className={`notifications-filter ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`notifications-filter ${activeFilter === "followers" ? "active" : ""}`}
            onClick={() => setActiveFilter("followers")}
          >
            Follower activity ({followerActivityCount})
          </button>
        </div>

        {errorMessage ? <p className="notifications-error">{errorMessage}</p> : null}

        {filteredNotifications.length === 0 ? (
          <p className="notifications-empty">No notifications yet.</p>
        ) : (
          <>
            <section className="notifications-list">
              {displayedNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-card ${notification.isRead ? "read" : "unread"}`}
                  onClick={() => openNotification(notification)}
                >
                  <div className="notification-avatar">
                    {notification.actorPhotoURL ? (
                      <img src={notification.actorPhotoURL} alt={notification.actorName || "Developer"} />
                    ) : (
                      <span>{(notification.actorName || "D")[0].toUpperCase()}</span>
                    )}
                  </div>

                  <div className="notification-content">
                    <div className="notification-topline">
                      <strong>{labelForNotification(notification)}</strong>
                      <span>{formatTimeLabel(notification.createdAt)}</span>
                    </div>
                    <p>{notification.message || "You have a new update."}</p>
                    {notification.projectTitle ? <small>{notification.projectTitle}</small> : null}
                    {notification.actorId && notification.actorId !== user?.uid ? (
                      <button
                        type="button"
                        className="notification-message-btn"
                        onClick={(event) => openMessageFromNotification(event, notification)}
                      >
                        Message {notification.actorName || "developer"}
                      </button>
                    ) : null}
                  </div>

                  <span className="notification-state">{notification.isRead ? "Read" : "Unread"}</span>
                </button>
              ))}
            </section>
            {filteredNotifications.length > visibleCount ? (
              <button type="button" className="load-more-btn" onClick={() => setVisibleCount((count) => count + 6)}>
                Load more notifications
              </button>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

export default NotificationsPage;
