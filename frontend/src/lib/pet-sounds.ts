/** Милые синтезированные звуки Иптәша-котёнка через WebAudio — без внешних файлов. */

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
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

function softNoise(c: AudioContext, delay: number, freq: number, dur = 0.07, vol = 0.1): void {
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 2.5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
}

/** Нежное котёночье «мяу» — высокое и короткое. */
export function playMeow(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 950, to: 1350, dur: 0.16, vol: 0.12 });
    tone(c, { type: "sine", from: 1350, to: 1050, dur: 0.22, delay: 0.14, vol: 0.1 });
    tone(c, { type: "triangle", from: 1900, to: 2100, dur: 0.3, vol: 0.03 });
  } catch { /* ignore */ }
}

/** Нежное тихое мурчание ~1.4 c. */
export function playPurr(): void {
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 88;
    const lfo = c.createOscillator();
    lfo.frequency.value = 6;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.03;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.2);
    gain.gain.setValueAtTime(0.06, t0 + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + 1.5);
    lfo.stop(t0 + 1.5);
  } catch { /* ignore */ }
}

/** Милое чавканье: мягкие высокие чмоки. */
export function playMunch(): void {
  const c = ac();
  if (!c) return;
  try {
    softNoise(c, 0.05, 2400);
    softNoise(c, 0.28, 2700);
    softNoise(c, 0.51, 2500);
    tone(c, { type: "sine", from: 700, to: 1050, dur: 0.22, delay: 0.7, vol: 0.08 });
  } catch { /* ignore */ }
}

/** Покупка: нежное арпеджио музыкальной шкатулки. */
export function playCoin(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 1046, dur: 0.12, vol: 0.08 });
    tone(c, { type: "sine", from: 1318, dur: 0.12, delay: 0.1, vol: 0.08 });
    tone(c, { type: "sine", from: 1568, dur: 0.22, delay: 0.2, vol: 0.08 });
  } catch { /* ignore */ }
}

/** Сонный сладкий вздох. */
export function playSnore(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 320, to: 220, dur: 0.55, vol: 0.07 });
    tone(c, { type: "sine", from: 260, to: 330, dur: 0.45, delay: 0.6, vol: 0.06 });
  } catch { /* ignore */ }
}

/** Милый «пиу» для тапов. */
export function playPop(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 900, to: 1400, dur: 0.08, vol: 0.07 });
  } catch { /* ignore */ }
}
