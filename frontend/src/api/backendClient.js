import { auth } from "../firebase_config";

const API_BASE = (
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function getIdTokenOrThrow() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  return currentUser.getIdToken();
}

async function request(path, { method = "GET", body, requiresAuth = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const idToken = await getIdTokenOrThrow();
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.detail || data?.message || `Request failed (${response.status})`;
    throw new Error(detail);
  }

  return data;
}

export function createProject(payload) {
  return request("/projects", { method: "POST", body: payload });
}

export function fetchMyProfile() {
  return request("/users/me", { method: "GET" });
}

export function updateMyProfile(payload) {
  return request("/users/me", { method: "PATCH", body: payload });
}
