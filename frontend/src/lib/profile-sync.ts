/** Синхронизация профиля пользователя с БД бэкенда (per-TG-аккаунт). Все вызовы — no-throw. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface ServerSnapshot {
  exists: boolean;
  updated_at: number;
  data: Record<string, unknown>;
  reset_epoch?: number;
}

function headers(initData?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
  };
}

/** Забрать снапшот состояния из БД. null — нет связи/бэкенда. */
export async function fetchStateApi(
  userId: string,
  initData?: string,
): Promise<ServerSnapshot | null> {
  try {
    if (!API_URL) return null;
    const res = await fetch(
      `${API_URL}/api/state?user_id=${encodeURIComponent(userId)}`,
      { headers: headers(initData) },
    );
    if (!res.ok) return null;
    return (await res.json()) as ServerSnapshot;
  } catch {
    return null;
  }
}

/** Сохранить снапшот состояния в БД. Возвращает updated_at либо null. */
export async function saveStateApi(
  userId: string,
  data: Record<string, unknown>,
  firstName = "",
  username = "",
  initData?: string,
): Promise<number | null> {
  try {
    if (!API_URL) return null;
    const res = await fetch(`${API_URL}/api/state`, {
      method: "POST",
      headers: headers(initData),
      body: JSON.stringify({ user_id: userId, first_name: firstName, username, data }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { updated_at?: number };
    return typeof json.updated_at === "number" ? json.updated_at : null;
  } catch {
    return null;
  }
}
