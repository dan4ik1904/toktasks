/** Звуки Иптәша: настоящие mp3 (мурчание, чавканье, храп) + синтез для остального. */

const audioCache = new Map<string, HTMLAudioElement>();
/** Активные синтезированные ноды — чтобы гасить их перед новым звуком. */
const activeNodes = new Set<AudioScheduledSourceNode>();

/** Таймер автостопа длинных записей (еда/мурчание/храп обрезаются). */
let stopTimer: ReturnType<typeof setTimeout> | null = null;

/** Остановить ВСЕ звуки кота (mp3 и синтез). Один канал — без наложений. */
export function stopAllSounds(): void {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  try {
    audioCache.forEach((a) => {
      try { a.pause(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
  activeNodes.forEach((n) => {
    try { n.stop(); } catch { /* ignore */ }
  });
  activeNodes.clear();
}

/**
 * Проиграть mp3-файл из /public/sounds (предыдущий звук гасится).
 * maxSeconds — обрезать длинную запись (еда/мурчание 3с, храп 5с).
 */
function playFile(name: string, vol = 1, maxSeconds?: number): void {
  try {
    if (typeof window === "undefined") return;
    stopAllSounds();
    let a = audioCache.get(name);
    if (!a) {
      a = new Audio(`/sounds/${name}`);
      a.preload = "auto";
      audioCache.set(name, a);
    }
    a.loop = false;
    a.volume = vol;
    a.currentTime = 0;
    void a.play().catch(() => {});
    if (maxSeconds) {
      const el = a;
      stopTimer = setTimeout(() => {
        try { el.pause(); } catch { /* ignore */ }
      }, maxSeconds * 1000);
    }
  } catch { /* ignore */ }
}

/** Храп на время сна — 5 секунд. */
export function startSnoreLoop(): void {
  playFile("snore.mp3", 0.85, 5);
}

export function stopSnoreLoop(): void {
  try {
    const a = audioCache.get("snore.mp3");
    if (a) {
      a.loop = false;
      try { a.pause(); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  c: AudioContext,
  opts: {
    type?: OscillatorType;
    from: number;
    to?: number;
    dur: number;
    delay?: number;
    vol?: number;
  },
): void {
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.from, t0);
  if (opts.to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t0 + opts.dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(opts.vol ?? 0.12, t0 + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(gain).connect(c.destination);
  activeNodes.add(osc);
  osc.onended = () => activeNodes.delete(osc);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

/** Нежное котёночье «мяу» — высокое и короткое. */
export function playMeow(): void {
  stopAllSounds();
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 950, to: 1350, dur: 0.16, vol: 0.12 });
    tone(c, { type: "sine", from: 1350, to: 1050, dur: 0.22, delay: 0.14, vol: 0.1 });
    tone(c, { type: "triangle", from: 1900, to: 2100, dur: 0.3, vol: 0.03 });
  } catch { /* ignore */ }
}

/** Настоящее мурчание кошки (mp3, 3 секунды). */
export function playPurr(): void {
  playFile("purr.mp3", 0.9, 3);
}

/** Настоящее хрустящее чавканье (mp3, 3 секунды). */
export function playMunch(): void {
  playFile("munch.mp3", 0.9, 3);
}

/** Покупка: нежное арпеджио музыкальной шкатулки. */
export function playCoin(): void {
  stopAllSounds();
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 1046, dur: 0.12, vol: 0.08 });
    tone(c, { type: "sine", from: 1318, dur: 0.12, delay: 0.1, vol: 0.08 });
    tone(c, { type: "sine", from: 1568, dur: 0.22, delay: 0.2, vol: 0.08 });
  } catch { /* ignore */ }
}

/** Настоящий храп (mp3). */
export function playSnore(): void {
  playFile("snore.mp3", 0.9);
}

/** Милый «пиу» для тапов. */
export function playPop(): void {
  stopAllSounds();
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 900, to: 1400, dur: 0.08, vol: 0.07 });
  } catch { /* ignore */ }
}
