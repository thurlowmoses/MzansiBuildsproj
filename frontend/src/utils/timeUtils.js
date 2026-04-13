// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

export function getTimestampMs(value) {
  if (!value) return 0;

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Handles getTimestampSeconds.
export function getTimestampSeconds(value) {
  return Math.floor(getTimestampMs(value) / 1000);
}

// Handles timeAgo.
export function timeAgo(value) {
  const ms = getTimestampMs(value);
  if (!ms) return "";

  const seconds = Math.floor((Date.now() - ms) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

