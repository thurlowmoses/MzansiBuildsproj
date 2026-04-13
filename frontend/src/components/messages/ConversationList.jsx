// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { formatTimeLabel } from "../../utils/messagesUtils";

// Handles ConversationList.
const ConversationList = ({ conversationRows, selectedChatId, onOpenConversation }) => {
  return (
    <div className="conversation-list">
      {conversationRows.map((row) => (
        <button
          key={row.chatId}
          type="button"
          className={`conversation-item ${selectedChatId === row.chatId ? "active" : ""}`}
          onClick={() => onOpenConversation(row.chatId, row.peerId)}
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
  );
};

export default ConversationList;

