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

/** Чистим текст для TTS: многоточия и мусор, на которых спотыкается синтез. */
function cleanForTts(text: string): string {
  return (
    text
      .replace(/[….]{2,}/g, "…")
      .replace(/[…]/g, "")
      .replace(/[!?]+/g, ".")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Делим длинную фразу на предложения — интонация чище, чем одним куском. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

// Кэш озвучки: текст+голос -> blob URL (слова повторяются постоянно).
const ttsCache = new Map<string, string>();
const TTS_CACHE_LIMIT = 60;

function cacheKey(text: string, voice: string): string {
  return `${voice}::${text}`;
}

async function fetchTtsBlob(text: string, voice: string): Promise<Blob> {
  const res = await post("/api/tts", { text, voice });
  return res.blob();
}

function playBlob(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("audio"));
    audio.play().catch(reject);
  });
}

function fallbackSpeak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tt-RU";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* озвучка недоступна */
  }
}

/**
 * Озвучка через Tatsoft TTS (голос духа).
 * Улучшения: чистка текста, чанкинг по предложениям, кэш, фолбэк speechSynthesis.
 * Возвращает true, если пел Tatsoft.
 */
export async function ttsSpeak(text: string, voice = "alsu"): Promise<boolean> {
  const clean = cleanForTts(text);
  if (!clean) return false;
  try {
    for (const sentence of splitSentences(clean)) {
      const key = cacheKey(sentence, voice);
      let url = ttsCache.get(key);
      if (!url) {
        const blob = await fetchTtsBlob(sentence, voice);
        url = URL.createObjectURL(blob);
        ttsCache.set(key, url);
        if (ttsCache.size > TTS_CACHE_LIMIT) {
          const first = ttsCache.keys().next().value;
          if (first) {
            URL.revokeObjectURL(ttsCache.get(first)!);
            ttsCache.delete(first);
          }
        }
      }
      await playBlob(url);
    }
    return true;
  } catch {
    fallbackSpeak(clean);
    return false;
  }
}

/** Греем кэш: озвучить заранее, без воспроизведения. */
export function prefetchTts(text: string, voice = "alsu"): void {
  const clean = cleanForTts(text);
  if (!clean) return;
  void (async () => {
    try {
      for (const sentence of splitSentences(clean)) {
        const key = cacheKey(sentence, voice);
        if (ttsCache.has(key)) continue;
        const blob = await fetchTtsBlob(sentence, voice);
        ttsCache.set(key, URL.createObjectURL(blob));
      }
    } catch {
      /* прогрев не критичен */
    }
  })();
}

/** Распознавание: Tatsoft STT. Бросает исключение — вызывающий решает (Web Speech / пропуск). */
export async function sttRecognize(audio: Blob): Promise<string> {
  const res = await post("/api/stt", audio, false);
  const data = (await res.json()) as { text: string };
  if (!data.text) throw new Error("empty transcript");
  return data.text;
}

/**
 * Конвертация записи в WAV 16 кГц моно — родной формат Tatsoft ASR.
 * MediaRecorder отдаёт webm/opus, на котором старая модель чаще ошибается.
 * При любой ошибке бросает — вызывающий шлёт исходный blob.
 */
export async function toWav16kMono(blob: Blob): Promise<Blob> {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const raw = await blob.arrayBuffer();
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(raw);
    const targetRate = 16000;
    const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);
    const src = off.createBufferSource();
    src.buffer = decoded;
    // Моно: усредняем каналы.
    if (decoded.numberOfChannels > 1) {
      const len = decoded.length;
      const mono = off.createBuffer(1, len, decoded.sampleRate);
      const out = mono.getChannelData(0);
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        const ch = decoded.getChannelData(c);
        for (let i = 0; i < len; i++) out[i] = (out[i] ?? 0) + ch[i]! / decoded.numberOfChannels;
      }
      src.buffer = mono;
    }
    src.connect(off.destination);
    src.start();
    const rendered = await off.startRendering();
    return encodeWav(rendered);
  } finally {
    void ctx.close().catch(() => {});
  }
}

function encodeWav(buffer: AudioBuffer): Blob {
  const n = buffer.length;
  const bytes = new ArrayBuffer(44 + n * 2);
  const v = new DataView(bytes);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  writeStr(36, "data");
  v.setUint32(40, n * 2, true);
  const ch = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]!));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([bytes], { type: "audio/wav" });
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

export interface Grade {
  correct: boolean;
  hint_tt: string;
  hint_ru: string;
  syllables: string[];
  say_this: string;
  source: "llm" | "offline";
}

/** Строгий судья: /api/grade (LLM), иначе локальная проверка. Не бросает. */
export async function gradeViaApi(expected: string, heard: string): Promise<Grade> {
  try {
    const res = await post("/api/grade", { expected, heard });
    const data = (await res.json()) as Grade;
    if (typeof data.correct !== "boolean") throw new Error("bad grade");
    return {
      correct: data.correct,
      hint_tt: data.hint_tt || "Тыңла һәм кабатла.",
      hint_ru: data.hint_ru || "",
      syllables: Array.isArray(data.syllables) ? data.syllables : [],
      say_this: data.say_this || expected,
      source: data.source === "llm" ? "llm" : "offline",
    };
  } catch {
    const correct = await checkViaApi(expected, heard);
    return {
      correct,
      hint_tt: correct ? "Дөрес! Бик шәп!" : "Тыңла һәм кабатла.",
      hint_ru: "",
      syllables: [],
      say_this: expected,
      source: "offline",
    };
  }
}

export function apiConfigured(): boolean {
  return API_URL !== "";
}

/** Сохранение прогресса на бэкенд. Возвращает серверный профиль. */
export interface ServerProfile {
  tg_id: string;
  xp: number;
  streak: number;
  hearts: number;
  lessons: string[];
}

async function get(path: string): Promise<Response> {
  if (!API_URL) throw new Error("no api url");
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export async function saveProgressApi(
  islandSlug: string,
  lessonId: string,
  initData?: string,
  userId = "demo",
): Promise<ServerProfile | null> {
  try {
    if (!API_URL) return null;
    const res = await fetch(`${API_URL}/api/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      },
      body: JSON.stringify({ island_slug: islandSlug, lesson_id: lessonId, user_id: userId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerProfile;
  } catch {
    /* офлайн — прогресс живёт локально */
    return null;
  }
}

/** Регистрация по TG ID. Не бросает. */
export async function registerApi(
  tgId: string,
  firstName = "",
  username = "",
  initData?: string,
): Promise<ServerProfile | null> {
  try {
    if (!API_URL) return null;
    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      },
      body: JSON.stringify({ tg_id: tgId, first_name: firstName, username }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerProfile;
  } catch {
    return null;
  }
}

export async function meApi(userId: string): Promise<ServerProfile | null> {
  try {
    return ((await get(`/api/me?user_id=${encodeURIComponent(userId)}`)).json() as Promise<ServerProfile>);
  } catch {
    return null;
  }
}

export interface LeaderRow {
  tg_id: string;
  name: string;
  xp: number;
  streak: number;
  lessons: number;
}

export async function leaderboardApi(): Promise<LeaderRow[]> {
  try {
    return ((await get("/api/leaderboard")).json() as Promise<LeaderRow[]>);
  } catch {
    return [];
  }
}

export async function spendHeartApi(userId: string): Promise<number | null> {
  try {
    if (!API_URL) return null;
    const res = await fetch(`${API_URL}/api/hearts/spend?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
    });
    if (!res.ok) return null;
    return ((await res.json()) as ServerProfile).hearts;
  } catch {
    return null;
  }
}

export async function refillHeartsApi(userId: string): Promise<number | null> {
  try {
    if (!API_URL) return null;
    const res = await fetch(`${API_URL}/api/hearts/refill?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
    });
    if (!res.ok) return null;
    return ((await res.json()) as ServerProfile).hearts;
  } catch {
    return null;
  }
}

/** Вопрос Ярдәмче: сначала бэкенд, иначе исключение (фолбэк у вызывающего). */
export async function assistantChatApi(message: string): Promise<string> {
  const res = await post("/api/assistant/chat", { message });
  const data = (await res.json()) as { reply: string };
  if (!data.reply) throw new Error("empty reply");
  return data.reply;
}
