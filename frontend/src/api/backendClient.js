import { auth } from "../firebase_config";

const API_BASE = (
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 15000;

async function getIdTokenOrThrow() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  return currentUser.getIdToken();
}

async function refreshIdTokenOrThrow() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  return currentUser.getIdToken(true);
}

async function request(path, { method = "GET", body, requiresAuth = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const idToken = await getIdTokenOrThrow();
    headers.Authorization = `Bearer ${idToken}`;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Make sure backend is running on port 8000.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (response.status === 401 && requiresAuth) {
    try {
      const freshToken = await refreshIdTokenOrThrow();
      headers.Authorization = `Bearer ${freshToken}`;

      const retryResponse = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!retryResponse.ok) {
        const retryData = await retryResponse.json().catch(() => ({}));
        const retryDetail = retryData?.detail || retryData?.message || `Request failed (${retryResponse.status})`;

        throw new Error(retryDetail);
      }

      return retryResponse.json();
    } catch (retryError) {
      throw retryError;
    }
  }

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

export function fetchProject(projectId) {
  return request(`/projects/${projectId}`, { method: "GET" });
}

export function updateProject(projectId, payload) {
  return request(`/projects/${projectId}`, { method: "PATCH", body: payload });
}

export function deleteProject(projectId) {
  return request(`/projects/${projectId}`, { method: "DELETE" });
}

export function fetchMyProfile() {
  return request("/users/me", { method: "GET" });
}

export function updateMyProfile(payload) {
  return request("/users/me", { method: "PATCH", body: payload });
}

export function fetchFeedActivities({ limit = 20, after } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (after) {
    params.set("after", after);
  }
  return request(`/feed/activities?${params.toString()}`, { method: "GET" });
}

export function followUser(targetUserId) {
  return request("/users/follow", { method: "POST", body: { targetUserId } });
}

export function unfollowUser(targetUserId) {
  return request(`/users/follow/${targetUserId}`, { method: "DELETE" });
}

export async function streamHelpResponse(question, onChunk) {
  const response = await fetch(`${API_BASE}/ai/help/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Assistant request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) {
      onChunk(text);
    }
  }
}
