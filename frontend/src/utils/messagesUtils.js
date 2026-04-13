// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

export function formatTimeLabel(timestamp) {
  const seconds = timestamp?.seconds;
  if (!seconds) return "now";

  const date = new Date(seconds * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Handles formatAttachmentSize.
export function formatAttachmentSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Handles getFileExtension.
function getFileExtension(name = "") {
  const parts = String(name).split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

// Handles getFileTypeLabel.
export function getFileTypeLabel(fileOrAttachment) {
  const contentType = (fileOrAttachment?.type || fileOrAttachment?.contentType || "").toLowerCase();
  const extension = getFileExtension(fileOrAttachment?.name || "");

  if (contentType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
    return "IMG";
  }

  if (contentType === "application/pdf" || extension === "pdf") {
    return "PDF";
  }

  if (contentType.startsWith("text/") || ["txt", "md", "csv", "json"].includes(extension)) {
    return "TXT";
  }

  if (["doc", "docx"].includes(extension)) {
    return "DOC";
  }

  if (["xls", "xlsx"].includes(extension)) {
    return "XLS";
  }

  return "FILE";
}

