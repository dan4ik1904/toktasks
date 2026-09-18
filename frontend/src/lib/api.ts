/** Клиент бэкенда Татар.Уку. Все вызовы — no-throw с фолбэком. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function post(path: string, body: Blob | object, json = true): Promise<Response> {
  if (!API_URL) throw new Error("no api url");
  const init: RequestInit = { method: "POST" };
  if (body instanceof Blob) {
    const fd = new FormData();
    fd.append("audio", body, "audio.webm");
    init.body = fd;
  } else {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim();
}

/** Озвучка через Tatsoft TTS; фолбэк — speechSynthesis. Возвращает true, если пел Tatsoft. */
export async function ttsSpeak(text: string): Promise<boolean> {
  try {
    const res = await post("/api/tts", { text });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("audio"));
      };
      audio.play().catch(reject);
    });
    return true;
  } catch {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "tt-RU";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* озвучка недоступна */
    }
    return false;
  }
}

/** Распознавание: Tatsoft STT. Бросает исключение — вызывающий решает (Web Speech / пропуск). */
export async function sttRecognize(audio: Blob): Promise<string> {
  const res = await post("/api/stt", audio, false);
  const data = (await res.json()) as { text: string };
  if (!data.text) throw new Error("empty transcript");
  return data.text;
}

/** Перевод через Tatsoft MT. Фолбэк — null (показать встроенный). */
export async function translateViaApi(
  text: string,
  src = "ru",
  dst = "tt",
): Promise<string | null> {
  try {
    const res = await post("/api/translate", { text, src, dst });
    const data = (await res.json()) as { translation: string };
    return data.translation || null;
  } catch {
    return null;
  }
}

/** Проверка ответа: бэкенд, фолбэк — локальное сравнение. */
export async function checkViaApi(expected: string, heard: string): Promise<boolean> {
  const e = norm(expected);
  const h = norm(heard);
  try {
    const res = await post("/api/check", { expected, heard });
    const data = (await res.json()) as { correct: boolean };
    return data.correct;
  } catch {
    if (!h) return false;
    return e.includes(h) || h.includes(e);
  }
}

export function apiConfigured(): boolean {
  return API_URL !== "";
}

/** Сохранение прогресса на бэкенд (fire-and-forget, тихо). */
export async function saveProgressApi(
  islandSlug: string,
  lessonId: string,
  initData?: string,
): Promise<void> {
  try {
    if (!API_URL) return;
    await fetch(`${API_URL}/api/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      },
      body: JSON.stringify({ island_slug: islandSlug, lesson_id: lessonId }),
    });
  } catch {
    /* офлайн — прогресс живёт локально */
  }
}

/** Вопрос Ярдәмче: сначала бэкенд, иначе исключение (фолбэк у вызывающего). */
export async function assistantChatApi(message: string): Promise<string> {
  const res = await post("/api/assistant/chat", { message });
  const data = (await res.json()) as { reply: string };
  if (!data.reply) throw new Error("empty reply");
  return data.reply;
}
