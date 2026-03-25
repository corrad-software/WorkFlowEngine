import { API_BASE_URL } from "@/env";

let authHeader = "";

export function setAuth(username: string, password: string) {
  authHeader = "Basic " + btoa(`${username}:${password}`);
  localStorage.setItem("flowable-auth", authHeader);
}

export function loadAuth() {
  authHeader = localStorage.getItem("flowable-auth") || "";
}

export function clearAuth() {
  authHeader = "";
  localStorage.removeItem("flowable-auth");
}

export function isAuthed() {
  return !!authHeader;
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return undefined as T;
}
