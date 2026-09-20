/** Синтезированные звуки Иптәша через WebAudio — без внешних файлов. */

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
  gain.gain.exponentialRampToValueAtTime(opts.vol ?? 0.18, t0 + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

function noiseBurst(c: AudioContext, delay: number, dur = 0.09, vol = 0.22): void {
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900 + Math.random() * 600;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
}

/** Короткое довольное «мяу». */
export function playMeow(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sawtooth", from: 520, to: 880, dur: 0.22, vol: 0.08 });
    tone(c, { type: "sawtooth", from: 880, to: 620, dur: 0.28, delay: 0.2, vol: 0.08 });
    tone(c, { type: "sine", from: 1040, to: 1240, dur: 0.4, vol: 0.05 });
  } catch { /* ignore */ }
}

/** Мурчание ~1.4 c. */
export function playPurr(): void {
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 48;
    const lfo = c.createOscillator();
    lfo.frequency.value = 9;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.05;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.15);
    gain.gain.setValueAtTime(0.09, t0 + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + 1.5);
    lfo.stop(t0 + 1.5);
  } catch { /* ignore */ }
}

/** Чавканье: три хруста. */
export function playMunch(): void {
  const c = ac();
  if (!c) return;
  try {
    noiseBurst(c, 0.05);
    noiseBurst(c, 0.3);
    noiseBurst(c, 0.55);
    tone(c, { type: "sine", from: 300, to: 520, dur: 0.25, delay: 0.75, vol: 0.1 });
  } catch { /* ignore */ }
}

/** Покупка/награда: две монетки. */
export function playCoin(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "square", from: 880, dur: 0.09, vol: 0.06 });
    tone(c, { type: "square", from: 1320, dur: 0.16, delay: 0.09, vol: 0.06 });
  } catch { /* ignore */ }
}

/** Сонное сопение. */
export function playSnore(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 140, to: 90, dur: 0.7, vol: 0.1 });
    tone(c, { type: "sine", from: 110, to: 150, dur: 0.5, delay: 0.75, vol: 0.08 });
  } catch { /* ignore */ }
}

/** Мягкий «поп» для тапов. */
export function playPop(): void {
  const c = ac();
  if (!c) return;
  try {
    tone(c, { type: "sine", from: 500, to: 760, dur: 0.09, vol: 0.1 });
  } catch { /* ignore */ }
}
