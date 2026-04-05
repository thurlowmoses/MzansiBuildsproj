import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 20000;

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

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

  return error?.message || "Could not upload image.";
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

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadRef = ref(storage, `${pathPrefix}/${Date.now()}-${safeName}`);
    await withTimeout(
      uploadBytes(uploadRef, file),
      UPLOAD_TIMEOUT_MS,
      "Image upload timed out. Check internet or Firebase Storage rules."
    );
    return await withTimeout(
      getDownloadURL(uploadRef),
      UPLOAD_TIMEOUT_MS,
      "Could not fetch uploaded image URL. Check Firebase Storage configuration."
    );
  } catch (error) {
    throw new Error(toUploadErrorMessage(error));
  }
}
