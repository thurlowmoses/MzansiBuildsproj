// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase_config";

// Handles useMessagesData.
const useMessagesData = ({ user, selectedChatId, locationSearch }) => {
  const [developers, setDevelopers] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [followingSet, setFollowingSet] = useState(new Set());
  const [followerCounts, setFollowerCounts] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    const queryText = params.get("q") || "";
    setSearchText(queryText);
  }, [locationSearch]);

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
    const unsubscribe = onSnapshot(collection(db, "follows"), (snapshot) => {
      // Handles counts.
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

  const developersById = useMemo(() => {
    // Handles map.
    const map = {};
    developers.forEach((developer) => {
      map[developer.id] = developer;
    });
    return map;
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return developers;

    return developers.filter((developer) => {
      const haystack = `${developer.name} ${developer.email} ${developer.bio}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [developers, searchText]);

  const targetUserIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(locationSearch);
    return params.get("userId") || "";
  }, [locationSearch]);

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

  const canMessage = useCallback(
    (developer) => !developer?.isPrivate || followingSet.has(developer.id),
    [followingSet]
  );

  return {
    developersById,
    chats,
    messages,
    searchText,
    setSearchText,
    filteredDevelopers,
    followingSet,
    followerCounts,
    targetUserIdFromQuery,
    conversationRows,
    canMessage,
  };
};

export default useMessagesData;

