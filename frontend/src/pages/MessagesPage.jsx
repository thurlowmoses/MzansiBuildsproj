import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
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

function MessagesPage() {
  const { user } = useAuth();
  const [developers, setDevelopers] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const items = snapshot.docs
        .map((docItem) => {
          const row = docItem.data() || {};
          return {
            id: row.uid || docItem.id,
            name: row.displayName || row.email || "Developer",
            email: row.email || "",
            bio: row.bio || "Building in public",
          };
        })
        .filter((row) => row.id && row.id !== user?.uid)
        .slice(0, 24);

      setDevelopers(items);
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
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

  const selectedUser = useMemo(
    () => developers.find((developer) => developer.id === selectedUserId) || null,
    [developers, selectedUserId]
  );

  const openChatWithDeveloper = (developerId) => {
    setSelectedUserId(developerId);

    const existing = chats.find((chat) =>
      Array.isArray(chat.participants) && chat.participants.includes(developerId)
    );

    if (existing) {
      setSelectedChatId(existing.id);
    } else {
      setSelectedChatId("");
    }
  };

  const onSend = async () => {
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
          <h1>Direct messages</h1>
          <p>See what developers are currently building and reach out to collaborate.</p>

          <div className="developer-list">
            {developers.map((developer) => (
              <button
                key={developer.id}
                type="button"
                className={`developer-item ${selectedUserId === developer.id ? "active" : ""}`}
                onClick={() => openChatWithDeveloper(developer.id)}
              >
                <span className="developer-avatar">{developer.name.charAt(0).toUpperCase()}</span>
                <span className="developer-meta">
                  <strong>{developer.name}</strong>
                  <small>{developer.bio}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="messages-thread">
          <header className="thread-header">
            {selectedUser ? (
              <>
                <h2>{selectedUser.name}</h2>
                <p>Start a conversation and offer help on their project.</p>
              </>
            ) : (
              <>
                <h2>Select a developer</h2>
                <p>Pick someone from the left to send a direct message.</p>
              </>
            )}
          </header>

          <div className="thread-messages">
            {messages.length > 0 ? (
              messages.map((message) => {
                const mine = message.senderId === user?.uid;
                return (
                  <article key={message.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
                    <p>{message.text}</p>
                    <small>{message.senderName || "Developer"}</small>
                  </article>
                );
              })
            ) : (
              <p className="thread-empty">No messages yet. Say hello and ask what they are building.</p>
            )}
          </div>

          <div className="thread-compose">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedUser ? `Message ${selectedUser.name}` : "Select a developer first"}
              disabled={!selectedUser || sending}
            />
            <button type="button" onClick={onSend} disabled={!selectedUser || sending || !draft.trim()}>
              {sending ? "Sending..." : "Send message"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default MessagesPage;
