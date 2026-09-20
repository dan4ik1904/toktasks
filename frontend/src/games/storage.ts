// ============================================================
// Рекорды обеих игр в localStorage — отдельно для каждой игры.
// Ключи: shurale-best, quiz-best, quiz-streak.
// Все функции безопасны для SSR (проверка window).
// ============================================================

const KEYS = {
  runnerBest: "shurale-best",
  quizBest: "quiz-best",
  quizStreak: "quiz-streak",
} as const;

/** Префикс per-TG-аккаунт: разные аккаунты на одном устройстве не видят чужие рекорды. */
let NS = "";

export function setStorageNamespace(ns: string): void {
  NS = ns || "";
}

/**
 * Одноразовый переезд рекордов со старых общих ключей под per-аккаунт
 * префикс. Общие ключи после этого удаляются, чтобы чужой рекорд
 * не подхватился другим аккаунтом на том же устройстве.
 */
export function migrateStorageNamespace(ns: string): void {
  if (typeof window === "undefined" || !ns) return;
  try {
    const ls = window.localStorage;
    for (const key of Object.values(KEYS)) {
      const namespacedKey = `${ns}:${key}`;
      const shared = ls.getItem(key);
      if (shared !== null && ls.getItem(namespacedKey) === null) {
        ls.setItem(namespacedKey, shared);
      }
      ls.removeItem(key);
    }
  } catch {
    // приватный режим — молча игнорируем
  }
}

function namespaced(key: string): string {
  return NS ? `${NS}:${key}` : key;
}

function readNum(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(namespaced(key));
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeNum(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(namespaced(key), String(Math.floor(value)));
  } catch {
    // приватный режим — молча игнорируем
  }
}

/** Рекорд раннера. Возвращает true, если побит. */
export function saveRunnerBest(score: number): boolean {
  const best = readNum(KEYS.runnerBest);
  if (score > best) {
    writeNum(KEYS.runnerBest, score);
    return true;
  }
  return false;
}

export function getRunnerBest(): number {
  return readNum(KEYS.runnerBest);
}

/** Рекорд викторины по очкам. Возвращает true, если побит. */
export function saveQuizBest(score: number): boolean {
  const best = readNum(KEYS.quizBest);
  if (score > best) {
    writeNum(KEYS.quizBest, score);
    return true;
  }
  return false;
}

export function getQuizBest(): number {
  return readNum(KEYS.quizBest);
}

/** Рекорд серии викторины. Возвращает true, если побит. */
export function saveQuizStreak(streak: number): boolean {
  const best = readNum(KEYS.quizStreak);
  if (streak > best) {
    writeNum(KEYS.quizStreak, streak);
    return true;
  }
  return false;
}

export function getQuizStreak(): number {
  return readNum(KEYS.quizStreak);
}
