// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, storage } from "../firebase_config";
import useMessagesData from "./useMessagesData";
import { uploadAttachmentFile } from "../utils/fileUpload";

// Handles useMessagesPageData.
const useMessagesPageData = ({ user }) => {
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showAccountPreview, setShowAccountPreview] = useState(false);

  const {
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
  } = useMessagesData({
    user,
    selectedChatId,
    locationSearch: location.search,
  });

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return developersById[selectedUserId] || null;
  }, [developersById, selectedUserId]);

  const canMessageSelected = selectedUser ? canMessage(selectedUser) : false;

  useEffect(() => {
    if (!targetUserIdFromQuery || !user?.uid) {
      return;
    }

    if (targetUserIdFromQuery === user.uid) {
      return;
    }

    const target = developersById[targetUserIdFromQuery];
    if (!target || !canMessage(target)) {
      return;
    }

    const existing = chats.find(
      (chat) => Array.isArray(chat.participants) && chat.participants.includes(targetUserIdFromQuery)
    );

    setSelectedUserId(targetUserIdFromQuery);
    setSelectedChatId(existing ? existing.id : "");
    setShowAccountPreview(false);
  }, [targetUserIdFromQuery, user?.uid, developersById, chats, followingSet, canMessage]);

  // Handles openConversation.
  const openConversation = (chatId, peerId) => {
    setSelectedUserId(peerId);
    setSelectedChatId(chatId);
    setShowAccountPreview(false);
  };

  // Handles openChatWithDeveloper.
  const openChatWithDeveloper = (developerId) => {
    const target = developersById[developerId];
    if (target && !canMessage(target)) {
      return;
    }

    setSelectedUserId(developerId);
    setShowAccountPreview(false);

    const existing = chats.find(
      (chat) => Array.isArray(chat.participants) && chat.participants.includes(developerId)
    );

    setSelectedChatId(existing ? existing.id : "");
  };

  // Handles toggleFollow.
  const toggleFollow = async (developerId) => {
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

    const followedDeveloper = developersById[developerId];
    const isPrivate = Boolean(followedDeveloper?.isPrivate);
    await addDoc(collection(db, "notifications"), {
      type: isPrivate ? "follow_request" : "follow",
      recipientId: developerId,
      actorId: user.uid,
      actorName: user.displayName || user.email || "Developer",
      actorPhotoURL: user.photoURL || "",
      message: isPrivate
        ? `${user.displayName || user.email || "Developer"} requested to follow you.`
        : `${user.displayName || user.email || "Developer"} started following you.`,
      isRead: false,
      createdAt: serverTimestamp(),
      recipientName: followedDeveloper?.name || "Developer",
      targetType: "profile",
      targetId: developerId,
    });
  };

  // Handles onSend.
  const onSend = async () => {
    if (!user?.uid || !selectedUser || (!draft.trim() && !selectedFile)) {
      return;
    }

    try {
      setSending(true);
      setSendError("");

      const text = draft.trim();
      const attachment = selectedFile
        ? await uploadAttachmentFile({
            file: selectedFile,
            storage,
            pathPrefix: `message-attachments/${user.uid}/${selectedUser.id}`,
          })
        : null;
      const participantIds = [user.uid, selectedUser.id].sort();
      const chatId = participantIds.join("_");
      const lastMessageText = text || `Sent an attachment: ${attachment?.name || "file"}`;

      await setDoc(
        doc(db, "directMessages", chatId),
        {
          participants: participantIds,
          participantNames: [user.displayName || user.email || "Developer", selectedUser.name],
          lastMessage: lastMessageText,
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
        attachment,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        type: "message",
        recipientId: selectedUser.id,
        actorId: user.uid,
        actorName: user.displayName || user.email || "Developer",
        actorPhotoURL: user.photoURL || "",
        message: `${user.displayName || user.email || "Developer"} sent you a message.`,
        isRead: false,
        createdAt: serverTimestamp(),
        targetType: "messages",
        targetId: selectedUser.id,
      });

      setSelectedChatId(chatId);
      setDraft("");
      setSelectedFile(null);
    } catch (error) {
      setSendError(error?.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  return {
    searchText,
    setSearchText,
    selectedUserId,
    selectedChatId,
    selectedUser,
    canMessageSelected,
    draft,
    setDraft,
    selectedFile,
    setSelectedFile,
    sending,
    sendError,
    showAccountPreview,
    setShowAccountPreview,
    developersById,
    messages,
    filteredDevelopers,
    followingSet,
    followerCounts,
    targetUserIdFromQuery,
    conversationRows,
    openConversation,
    openChatWithDeveloper,
    toggleFollow,
    onSend,
  };
};

export default useMessagesPageData;

