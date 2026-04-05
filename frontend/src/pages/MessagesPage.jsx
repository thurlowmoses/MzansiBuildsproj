import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/messages.css";

function formatTimeLabel(timestamp) {
  const seconds = timestamp?.seconds;
  if (!seconds) return "now";

  const date = new Date(seconds * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessagesPage() {
  // Inbox state is driven by Firestore snapshots.
  const { user } = useAuth();
  const location = useLocation();
  const [developers, setDevelopers] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [followingSet, setFollowingSet] = useState(new Set());
  const [followerCounts, setFollowerCounts] = useState({});
  const [showAccountPreview, setShowAccountPreview] = useState(false);

  useEffect(() => {
    // Pre-fill search from the navbar query string.
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearchText(q);
  }, [location.search]);

  useEffect(() => {
    // Build the developer directory.
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => {
          const row = docItem.data() || {};
          return {
            id: row.uid || docItem.id,
            name: row.displayName || row.email || "Developer",
            email: row.email || "",
            bio: row.bio || "Building in public",
            isPrivate: Boolean(row.isPrivate),
          };
        })
        .filter((row) => row.id && row.id !== user?.uid)
        .slice(0, 120);

      setDevelopers(items);
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    // Track who the current user follows.
    if (!user?.uid) {
      setFollowingSet(new Set());
      return;
    }

    const followsQuery = query(collection(db, "follows"), where("followerId", "==", user.uid));

    const unsubscribe = onSnapshot(followsQuery, (snapshot) => {
      const nextSet = new Set(snapshot.docs.map((docItem) => (docItem.data() || {}).followingId).filter(Boolean));
      setFollowingSet(nextSet);
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    // Count followers for profile badges.
    const unsubscribe = onSnapshot(collection(db, "follows"), (snapshot) => {
      const counts = {};

      snapshot.docs.forEach((docItem) => {
        const row = docItem.data() || {};
        if (!row.followingId) return;
        counts[row.followingId] = (counts[row.followingId] || 0) + 1;
      });

      setFollowerCounts(counts);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Load inbox threads for the current user.
    if (!user?.uid) {
      setChats([]);
      return;
    }

    const chatQuery = query(
      collection(db, "directMessages"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() || {}),
      }));

      items.sort((a, b) => {
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime;
      });

      setChats(items);
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    // Subscribe to the selected thread messages.
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(collection(db, "directMessages", selectedChatId, "messages"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() || {}),
      }));

      items.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime;
      });

      setMessages(items);
    });

    return unsubscribe;
  }, [selectedChatId]);

  const developersById = useMemo(() => {
    const map = {};
    developers.forEach((developer) => {
      map[developer.id] = developer;
    });
    return map;
  }, [developers]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return developersById[selectedUserId] || null;
  }, [developersById, selectedUserId]);

  const filteredDevelopers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return developers;

    return developers.filter((developer) => {
      const haystack = `${developer.name} ${developer.email} ${developer.bio}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [developers, searchText]);

  const conversationRows = useMemo(() => {
    return chats
      .map((chat) => {
        const participants = Array.isArray(chat.participants) ? chat.participants : [];
        const peerId = participants.find((id) => id !== user?.uid);

        if (!peerId) return null;

        const peer = developersById[peerId];
        const fallbackName = Array.isArray(chat.participantNames)
          ? chat.participantNames.find((name) => name && name !== (user?.displayName || user?.email || "Developer"))
          : "Developer";

        return {
          chatId: chat.id,
          peerId,
          name: peer?.name || fallbackName || "Developer",
          lastMessage: chat.lastMessage || "Start a conversation",
          updatedAt: chat.updatedAt,
        };
      })
      .filter(Boolean);
  }, [chats, developersById, user?.uid, user?.displayName, user?.email]);

  const canMessage = (developer) => !developer?.isPrivate || followingSet.has(developer.id);

  const openConversation = (chatId, peerId) => {
    // Open an existing thread.
    setSelectedUserId(peerId);
    setSelectedChatId(chatId);
    setShowAccountPreview(false);
  };

  const openChatWithDeveloper = (developerId) => {
    // Private accounts stay locked until followed.
    const target = developersById[developerId];
    if (target && !canMessage(target)) {
      return;
    }

    setSelectedUserId(developerId);
    setShowAccountPreview(false);

    const existing = chats.find(
      (chat) => Array.isArray(chat.participants) && chat.participants.includes(developerId)
    );

    if (existing) {
      setSelectedChatId(existing.id);
    } else {
      setSelectedChatId("");
    }
  };

  const toggleFollow = async (developerId) => {
    // Toggle follow state with one document.
    if (!user?.uid) return;

    const relationshipId = `${user.uid}_${developerId}`;

    if (followingSet.has(developerId)) {
      await deleteDoc(doc(db, "follows", relationshipId));
      return;
    }

    await setDoc(doc(db, "follows", relationshipId), {
      followerId: user.uid,
      followingId: developerId,
      createdAt: serverTimestamp(),
    });
  };

  const onSend = async () => {
    // Create the thread if needed, then add the message.
    if (!user?.uid || !selectedUser || !draft.trim()) {
      return;
    }

    try {
      setSending(true);

      const text = draft.trim();
      const participantIds = [user.uid, selectedUser.id].sort();
      const chatId = participantIds.join("_");

      await setDoc(
        doc(db, "directMessages", chatId),
        {
          participants: participantIds,
          participantNames: [
            user.displayName || user.email || "Developer",
            selectedUser.name,
          ],
          lastMessage: text,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "directMessages", chatId, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || user.email || "Developer",
        recipientId: selectedUser.id,
        text,
        createdAt: serverTimestamp(),
      });

      setSelectedChatId(chatId);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <section className="messages-layout">
        <aside className="messages-sidebar">
          <div className="messages-inbox-header">
            <h1>{user?.displayName || "Inbox"}</h1>
            <p>Direct messages</p>
          </div>

          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="developer-search"
            placeholder="Search developers"
          />

          <div className="conversation-list">
            {conversationRows.map((row) => (
              <button
                key={row.chatId}
                type="button"
                className={`conversation-item ${selectedChatId === row.chatId ? "active" : ""}`}
                onClick={() => openConversation(row.chatId, row.peerId)}
              >
                <span className="conversation-avatar">{row.name.charAt(0).toUpperCase()}</span>
                <span className="conversation-meta">
                  <strong>{row.name}</strong>
                  <small>{row.lastMessage}</small>
                </span>
                <span className="conversation-time">{formatTimeLabel(row.updatedAt)}</span>
              </button>
            ))}
          </div>

          <p className="developer-section-label">Discover developers</p>
          <div className="developer-list">
            {filteredDevelopers.map((developer) => {
              const followed = followingSet.has(developer.id);
              const locked = developer.isPrivate && !followed;

              return (
                <div
                  key={developer.id}
                  className={`developer-item ${selectedUserId === developer.id ? "active" : ""} ${locked ? "locked" : ""}`}
                  onClick={() => openChatWithDeveloper(developer.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openChatWithDeveloper(developer.id);
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
                        toggleFollow(developer.id);
                      }}
                    >
                      {followed ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="messages-thread">
          <header className="thread-header">
            {selectedUser ? (
              /* Thread summary and account action. */
              <div className="thread-head-main">
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p>
                    {(followerCounts[selectedUser.id] || 0).toLocaleString()} followers • {selectedUser.isPrivate ? "Private account" : "Public account"}
                  </p>
                </div>
                <div className="thread-head-actions">
                  <button
                    type="button"
                    className="view-account-btn"
                    onClick={() => setShowAccountPreview((current) => !current)}
                  >
                    {showAccountPreview ? "Hide account" : "View account"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2>Select a conversation</h2>
                <p>Choose a chat from the inbox or start one with a developer.</p>
              </>
            )}
          </header>

          {selectedUser && showAccountPreview ? (
            /* Compact profile preview. */
            <section className="account-preview-card" aria-label="Selected developer account preview">
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email || "No public email"}</p>
              <p>{selectedUser.bio || "No bio added yet."}</p>
              <small>
                {(followerCounts[selectedUser.id] || 0).toLocaleString()} followers • {selectedUser.isPrivate ? "Private account" : "Public account"}
              </small>
            </section>
          ) : null}

          <div className="thread-messages">
            {messages.length > 0 ? (
              messages.map((message) => {
                const mine = message.senderId === user?.uid;
                return (
                  <article key={message.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
                    <p>{message.text}</p>
                    <small>{formatTimeLabel(message.createdAt)}</small>
                  </article>
                );
              })
            ) : (
              <p className="thread-empty">No messages yet. Start with a quick intro and what you can help with.</p>
            )}
          </div>

          <div className="thread-compose">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedUser ? `Message ${selectedUser.name}` : "Select a developer first"}
              disabled={!selectedUser || sending || !canMessage(selectedUser)}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!selectedUser || sending || !draft.trim() || !canMessage(selectedUser)}
            >
              {sending ? "Sending..." : "Send"}
            </button>
            {selectedUser && !canMessage(selectedUser) ? (
              <p className="thread-private-note">This account is private. Follow first to message and view activity.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default MessagesPage;