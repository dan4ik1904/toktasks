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

function readNum(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(key);
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeNum(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(Math.floor(value)));
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
