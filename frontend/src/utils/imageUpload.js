// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60000;
const MAX_IMAGE_DIMENSION = 1600;

// Handles wait.
function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// Handles withTimeout.
function withTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

// Handles toUploadErrorMessage.
function toUploadErrorMessage(error) {
  if (typeof error?.message === "string" && error.message.includes("timed out")) {
    return error.message;
  }

  const code = error?.code || "";

  if (code === "storage/unauthorized") {
    return "Image upload denied. Check Firebase Storage rules and ensure you are logged in.";
  }

  if (code === "storage/quota-exceeded") {
    return "Firebase Storage quota exceeded. Free space or upgrade your plan.";
  }

  if (code === "storage/invalid-argument" || code === "storage/invalid-url") {
    return "Invalid storage configuration. Verify VITE_FIREBASE_STORAGE_BUCKET in your env file.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "Upload timed out. Try again with a smaller image.";
  }

  if (code === "storage/canceled") {
    return "Upload was canceled before completion. Please try again.";
  }

  return error?.message || "Could not upload image.";
}

async function compressImageFile(file) {
  if (typeof window === "undefined" || !window.document) {
    return file;
  }

  if (!file.type?.startsWith("image/") || file.size <= 1024 * 1024) {
    return file;
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not read image file."));
      image.src = sourceUrl;
    });

    const width = img.width || 0;
    const height = img.height || 0;
    if (!width || !height) {
      return file;
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (outputBlob) => resolve(outputBlob),
        "image/jpeg",
        0.82
      );
    });

    if (!blob) {
      return file;
    }

    if (blob.size >= file.size) {
      return file;
    }

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function uploadBytesWithRetry(uploadRef, file, attempts = 2) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await withTimeout(
        uploadBytes(uploadRef, file),
        UPLOAD_TIMEOUT_MS,
        "Image upload timed out. Check internet or Firebase Storage rules."
      );
    } catch (error) {
      lastError = error;

      const code = error?.code || "";
      const shouldRetry = code !== "storage/unauthorized" && code !== "storage/invalid-argument";
      if (!shouldRetry || attempt === attempts - 1) {
        throw error;
      }

      await wait(900 * (attempt + 1));
    }
  }

  throw lastError || new Error("Image upload failed.");
}

export async function uploadImageFile({ file, storage, pathPrefix }) {
  if (!file) {
    return "";
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Use an image smaller than 5MB.");
  }

  if (!storage?.app?.options?.storageBucket) {
    throw new Error("Firebase Storage bucket is missing. Check VITE_FIREBASE_STORAGE_BUCKET in .env.local.");
  }

  const uploadFile = await compressImageFile(file);
  const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Handles uploadToStorage.
  const uploadToStorage = async (targetStorage) => {
    const uploadRef = ref(targetStorage, `${pathPrefix}/${Date.now()}-${safeName}`);
    await uploadBytesWithRetry(uploadRef, uploadFile, 2);
    return withTimeout(
      getDownloadURL(uploadRef),
      UPLOAD_TIMEOUT_MS,
      "Could not fetch uploaded image URL. Check Firebase Storage configuration."
    );
  };

  try {
    return await uploadToStorage(storage);
  } catch (error) {
    const bucket = storage?.app?.options?.storageBucket || "";
    const projectId = storage?.app?.options?.projectId || "";
    const canTryAppspotFallback = Boolean(projectId) && bucket.endsWith(".firebasestorage.app");

    if (!canTryAppspotFallback) {
      throw new Error(toUploadErrorMessage(error));
    }

    try {
      const fallbackBucket = `${projectId}.appspot.com`;
      const fallbackStorage = getStorage(storage.app, `gs://${fallbackBucket}`);
      return await uploadToStorage(fallbackStorage);
    } catch (fallbackError) {
      throw new Error(toUploadErrorMessage(fallbackError));
    }
  }
}

