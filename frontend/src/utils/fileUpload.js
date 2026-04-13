// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "msi",
  "bat",
  "cmd",
  "com",
  "scr",
  "ps1",
  "sh",
  "jar",
]);

// Handles normalizeFileName.
function normalizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Handles getExtension.
function getExtension(fileName) {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

// Handles inferKind.
function inferKind(contentType) {
  if (contentType.startsWith("image/")) return "image";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("text/")) return "text";
  return "file";
}

// Handles toStorageErrorMessage.
function toStorageErrorMessage(error) {
  const code = error?.code || "";

  if (code === "storage/unauthorized") {
    return "Upload denied. Please check Firebase Storage rules and your sign-in status.";
  }

  if (code === "storage/quota-exceeded") {
    return "Storage quota exceeded. Please try a smaller file or free up space.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "Upload timed out. Please retry on a stable connection.";
  }

  return error?.message || "Could not upload file.";
}

export async function uploadAttachmentFile({ file, storage, pathPrefix }) {
  if (!file) {
    return null;
  }

  if (!storage?.app?.options?.storageBucket) {
    throw new Error("Storage bucket is not configured. Check your Firebase environment variables.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is too large. Maximum allowed size is 15MB.");
  }

  const extension = getExtension(file.name);
  if (BLOCKED_EXTENSIONS.has(extension)) {
    throw new Error("This file type is blocked for safety. Please upload a different file format.");
  }

  const safeName = normalizeFileName(file.name);
  const uploadRef = ref(storage, `${pathPrefix}/${Date.now()}-${safeName}`);

  try {
    await uploadBytes(uploadRef, file);
    const url = await getDownloadURL(uploadRef);
    const contentType = file.type || "application/octet-stream";

    return {
      name: file.name,
      url,
      contentType,
      size: file.size,
      extension,
      kind: inferKind(contentType),
    };
  } catch (error) {
    throw new Error(toStorageErrorMessage(error));
  }
}

