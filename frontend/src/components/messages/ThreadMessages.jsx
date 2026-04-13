// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import {
  formatAttachmentSize,
  formatTimeLabel,
  getFileTypeLabel,
} from "../../utils/messagesUtils";

// Handles ThreadMessages.
const ThreadMessages = ({ messages, currentUserId }) => {
  return (
    <div className="thread-messages">
      {messages.length > 0 ? (
        messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <article key={message.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
              {message.text ? <p>{message.text}</p> : null}
              {message.attachment?.url ? (
                <div className="message-attachment">
                  {message.attachment.kind === "image" ? (
                    <a
                      href={message.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="message-attachment-image-link"
                    >
                      <img
                        src={message.attachment.url}
                        alt={message.attachment.name || "Message attachment"}
                        className="message-attachment-image"
                      />
                    </a>
                  ) : null}
                  <div className="message-attachment-fileline">
                    <span className="message-file-type-icon" aria-hidden="true">
                      {getFileTypeLabel(message.attachment)}
                    </span>
                    <a
                      href={message.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="message-attachment-open"
                    >
                      {message.attachment.name || "Open attachment"}
                    </a>
                  </div>
                  {message.attachment.size ? (
                    <small className="message-attachment-size">
                      {formatAttachmentSize(message.attachment.size)}
                    </small>
                  ) : null}
                </div>
              ) : null}
              <small>{formatTimeLabel(message.createdAt)}</small>
            </article>
          );
        })
      ) : (
        <p className="thread-empty">No messages yet. Start with a quick intro and what you can help with.</p>
      )}
    </div>
  );
};

export default ThreadMessages;

