import axios from "axios";

// NEXT_PUBLIC_API_URL is baked in at build time and used by the BROWSER,
// so it must be an address reachable from the user's machine (e.g. http://localhost:3001/api)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const FILE_BASE_URL =
  process.env.NEXT_PUBLIC_FILE_URL || "http://localhost:3001";

// Must match the backend's GOOGLE_CLIENT_ID (same OAuth app). Not required
// for the current redirect-based sign-in flow (the backend owns that), but
// exposed here for anything on the frontend that needs it directly, e.g.
// rendering Google's official button/One Tap via Google Identity Services.
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "pm_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${FILE_BASE_URL}${imageUrl}`;
}
