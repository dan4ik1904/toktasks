/** Auth token management + authenticated fetch helpers. */

const TOKEN_KEY = "tatar-uku-token";
const USER_KEY = "tatar-uku-user";

export interface AuthUser {
  tg_id: string;
  username: string;
  display_name: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Authenticated fetch — adds Bearer token if available. */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!API_URL) throw new Error("no api url");
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export async function authGet(path: string): Promise<Response> {
  return authFetch(path, { method: "GET" });
}

export async function authPost(path: string, body: object): Promise<Response> {
  return authFetch(path, { method: "POST", body: JSON.stringify(body) });
}

/** Login with username/password. Returns {token, user, profile}. */
export async function loginApi(
  username: string,
  password: string,
): Promise<{ token: string; user: AuthUser; profile: Record<string, unknown> } | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { token: string; user: AuthUser; profile: Record<string, unknown> };
  } catch {
    return null;
  }
}

/** Register new user. Returns {token, user, profile}. */
export async function registerAuthApi(
  username: string,
  password: string,
  displayName: string,
): Promise<{ token: string; user: AuthUser; profile: Record<string, unknown> } | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { token: string; user: AuthUser; profile: Record<string, unknown> };
  } catch {
    return null;
  }
}

/** Fetch current user profile using stored token. */
export async function fetchMeApi(): Promise<{
  user: AuthUser | null;
  profile: Record<string, unknown>;
} | null> {
  try {
    const res = await authGet("/api/auth/me");
    return (await res.json()) as { user: AuthUser | null; profile: Record<string, unknown> };
  } catch {
    return null;
  }
}

/** Fetch platform stats. */
export async function fetchStatsApi(): Promise<Record<string, unknown> | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API_URL}/api/stats`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Fetch user stats. */
export async function fetchUserStatsApi(): Promise<Record<string, unknown> | null> {
  try {
    const res = await authGet("/api/user/stats");
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
