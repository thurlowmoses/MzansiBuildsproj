// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useState } from "react";
import { formatAttachmentSize, getFileTypeLabel } from "../../utils/messagesUtils";

const MessageComposer = ({
  selectedUser,
  canMessageSelected,
  sending,
  draft,
  setDraft,
  selectedFile,
  setSelectedFile,
  onSend,
  sendError,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const disabled = !selectedUser || sending || !canMessageSelected;

  // Handles handleDragOver.
  const handleDragOver = (event) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(true);
  };

  // Handles handleDragLeave.
  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  // Handles handleDrop.
  const handleDrop = (event) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0] || null;
    setSelectedFile(file);
  };

  const clearSelectedFile = () => setSelectedFile(null);

  return (
    <div
      className={`thread-compose ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={selectedUser ? `Message ${selectedUser.name}` : "Select a developer first"}
        disabled={disabled}
      />

      <div className={`thread-dropzone ${isDragging ? "active" : ""}`}>
        <div className="thread-compose-file-row">
          <label className="thread-file-label" htmlFor="messageAttachment">
            Attach file or drag and drop here
          </label>
          <input
            id="messageAttachment"
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={disabled}
          />
        </div>
      </div>

      {selectedFile ? (
        <div className="thread-file-chip">
          <span className="message-file-type-icon" aria-hidden="true">
            {getFileTypeLabel(selectedFile)}
          </span>
          <p className="thread-file-meta">
            Selected: {selectedFile.name}
            {formatAttachmentSize(selectedFile.size) ? ` (${formatAttachmentSize(selectedFile.size)})` : ""}
          </p>
          <button type="button" className="thread-file-clear" onClick={clearSelectedFile} disabled={disabled}>
            Remove
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSend}
        disabled={!selectedUser || sending || (!draft.trim() && !selectedFile) || !canMessageSelected}
      >
        {sending ? "Sending..." : "Send"}
      </button>

      {sendError ? <p className="thread-send-error">{sendError}</p> : null}
      {selectedUser && !canMessageSelected ? (
        <p className="thread-private-note">This account is private. Follow first to message and view activity.</p>
      ) : null}
    </div>
  );
};

export default MessageComposer;

