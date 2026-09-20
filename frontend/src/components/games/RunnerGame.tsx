"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { getRunnerBest, saveRunnerBest } from "@/games/storage";

// ============================================================
// «Шурале-раннер»: бесконечный раннер на canvas 2D.
// Джигит бежит вправо, Шурале летят навстречу, өчпочмаки — бонус.
// Управление: пробел/↑/клик/тап — прыжок (двойной), ↓/s — присесть.
// Пауза при скрытии вкладки (visibilitychange). Рекорд — localStorage.
// ============================================================

type GameStatus = "idle" | "playing" | "paused" | "over";

// Логический размер сцены (CSS растянет canvas на ширину)
const W = 640;
const H = 300;
const GROUND_Y = 248;

interface Obstacle {
  x: number;
  w: number;
  h: number;
  /** y верхнего края */
  y: number;
  kind: "low" | "normal" | "tall";
  passed: boolean;
}

interface Bonus {
  x: number;
  y: number;
  taken: boolean;
  bob: number; // фаза парения
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Effect {
  shieldUntil: number;
  slowUntil: number;
  doubleUntil: number;
  shield: boolean;
}

const BONUS_POINTS = 10;

export function RunnerGame({ onDone }: { onDone: (storePoints: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [effect, setEffect] = useState<"shield" | "slow" | "x2" | null>(null);

  // Всё mutable-состояние игры живёт в ref, чтобы не ре-рендерить 60fps
  const s = useRef({
    status: "idle" as GameStatus,
    score: 0,
    speed: 5,
    dist: 0,
    playerY: 0, // высота над землёй
    vy: 0,
    jumps: 0,
    ducking: false,
    runPhase: 0,
    obstacles: [] as Obstacle[],
    bonuses: [] as Bonus[],
    particles: [] as Particle[],
    spawnIn: 90,
    bonusIn: 240,
    fx: { shieldUntil: 0, slowUntil: 0, doubleUntil: 0, shield: false } as Effect,
    bg1: 0, // параллакс: горы
    bg2: 0, // параллакс: лес
    bg3: 0, // параллакс: земля
    time: 0,
    duckHeld: false,
  });
  const statusRef = useRef<GameStatus>("idle");
  const rafRef = useRef(0);
  const lastHudRef = useRef(0);

  // ---------- helpers ----------
  const setBothStatus = useCallback((v: GameStatus) => {
    statusRef.current = v;
    s.current.status = v;
    setStatus(v);
  }, []);

  // Прыжок (разрешён двойной)
  const doJump = useCallback(() => {
    const g = s.current;
    if (g.status !== "playing") return;
    if (g.jumps < 2) {
      g.vy = g.jumps === 0 ? -12.5 : -10.5;
      g.jumps += 1;
      g.ducking = false;
      // пыль из-под ног
      for (let i = 0; i < 8; i++) {
        g.particles.push({
          x: 84 + Math.random() * 20, y: GROUND_Y - 2,
          vx: -1 - Math.random() * 2, vy: -0.5 - Math.random() * 2,
          life: 0, maxLife: 26 + Math.random() * 14,
          color: "#9db3a5", size: 2 + Math.random() * 2,
        });
      }
    }
  }, []);

  const setDuck = useCallback((v: boolean) => {
    const g = s.current;
    g.duckHeld = v;
    if (g.status !== "playing") return;
    // присесть можно только на земле
    g.ducking = v && g.playerY === 0;
  }, []);

  // ---------- генерация препятствий ----------
  const spawnObstacle = (g: typeof s.current) => {
    const r = Math.random();
    const kind: Obstacle["kind"] = r < 0.35 ? "low" : r < 0.75 ? "normal" : "tall";
    if (kind === "low") {
      g.obstacles.push({ x: W + 20, w: 30, h: 42, y: GROUND_Y - 42, kind, passed: false });
    } else if (kind === "normal") {
      g.obstacles.push({ x: W + 20, w: 38, h: 58, y: GROUND_Y - 58, kind, passed: false });
    } else {
      // высокий Шурале: голова на уровне груди — надо ПРИСЕСТЬ
      g.obstacles.push({ x: W + 20, w: 38, h: 44, y: GROUND_Y - 92, kind, passed: false });
    }
  };

  // Бонус появляется только там, где рядом нет препятствий (безопасно)
  const trySpawnBonus = (g: typeof s.current) => {
    const yVariants = [GROUND_Y - 44, GROUND_Y - 118, GROUND_Y - 178];
    const y = yVariants[Math.floor(Math.random() * yVariants.length)];
    const x = W + 20;
    const danger = g.obstacles.some((o) => Math.abs(o.x - x) < 190 && o.y < y + 30 && o.y + o.h > y - 30);
    if (!danger) g.bonuses.push({ x, y, taken: false, bob: Math.random() * 6 });
  };

  const resetGame = useCallback(() => {
    const g = s.current;
    g.score = 0; g.speed = 5; g.dist = 0;
    g.playerY = 0; g.vy = 0; g.jumps = 0; g.ducking = false;
    g.obstacles = []; g.bonuses = []; g.particles = [];
    g.spawnIn = 80; g.bonusIn = 200;
    g.fx = { shieldUntil: 0, slowUntil: 0, doubleUntil: 0, shield: false };
    g.time = 0;
    setScore(0);
    setIsNewRecord(false);
    setEffect(null);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setBothStatus("playing");
  }, [resetGame, setBothStatus]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") setBothStatus("paused");
    else if (statusRef.current === "paused") setBothStatus("playing");
  }, [setBothStatus]);

  const finishGame = useCallback(() => {
    const g = s.current;
    const finalScore = Math.floor(g.score);
    const record = saveRunnerBest(finalScore);
    setIsNewRecord(record);
    setBest(getRunnerBest());
    setBothStatus("over");
    // в общий стор начисляем поинты: 1 поинт за ~15 очков игры, макс 100
    onDone(Math.min(100, Math.floor(finalScore / 15)));
  }, [onDone, setBothStatus]);

  // ---------- отрисовка ----------
  const draw = (ctx: CanvasRenderingContext2D) => {
    const g = s.current;
    const t = g.time;

    // --- небо: сумеречный градиент ---
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#0a1f33");
    sky.addColorStop(0.6, "#0f3a2e");
    sky.addColorStop(1, "#14532d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // луна + звёзды
    ctx.fillStyle = "#f3d47a";
    ctx.beginPath(); ctx.arc(540, 46, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(243,212,122,0.18)";
    ctx.beginPath(); ctx.arc(540, 46, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 24; i++) {
      const sx = (i * 173 + 40) % W;
      const sy = (i * 97 + 12) % 120;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 40 + i));
      ctx.globalAlpha = tw * 0.8;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // --- параллакс: дальние горы ---
    ctx.fillStyle = "#0d2b26";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= W; x += 8) {
      const wx = x + g.bg1;
      const y = 168 - Math.abs(Math.sin(wx / 130) * 46) - Math.abs(Math.sin(wx / 61 + 2) * 18);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath(); ctx.fill();

    // --- параллакс: лес (ели-треугольники) ---
    for (let x = -40; x < W + 40; x += 64) {
      const wx = x - (g.bg2 % 64);
      const hgt = 52 + ((Math.abs(Math.sin((x + g.bg2) / 50)) * 22) | 0);
      ctx.fillStyle = "#123a2c";
      ctx.beginPath();
      ctx.moveTo(wx, GROUND_Y);
      ctx.lineTo(wx + 18, GROUND_Y - hgt);
      ctx.lineTo(wx + 36, GROUND_Y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#16493a";
      ctx.beginPath();
      ctx.moveTo(wx + 6, GROUND_Y);
      ctx.lineTo(wx + 18, GROUND_Y - hgt + 16);
      ctx.lineTo(wx + 30, GROUND_Y);
      ctx.closePath(); ctx.fill();
    }

    // --- земля ---
    const gr = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    gr.addColorStop(0, "#1c5c3c");
    gr.addColorStop(1, "#0c2b1d");
    ctx.fillStyle = gr;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    // орнамент-пунктир на земле (бегущий)
    ctx.fillStyle = "rgba(227,185,63,0.5)";
    for (let x = -20; x < W + 20; x += 34) {
      const wx = x - (g.bg3 % 34);
      ctx.save();
      ctx.translate(wx, GROUND_Y + 22);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, GROUND_Y, W, 2);

    // --- бонусы: өчпочмак (треугольный пирожок) ---
    for (const b of g.bonuses) {
      if (b.taken) continue;
      const bobY = Math.sin(t / 14 + b.bob) * 4;
      const y = b.y + bobY;
      // свечение
      ctx.fillStyle = "rgba(227,185,63,0.25)";
      ctx.beginPath(); ctx.arc(b.x, y, 20, 0, Math.PI * 2); ctx.fill();
      // треугольник-пирожок
      ctx.fillStyle = "#e8b64c";
      ctx.strokeStyle = "#8a5a1d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, y - 13);
      ctx.lineTo(b.x + 13, y + 9);
      ctx.lineTo(b.x - 13, y + 9);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // начинка
      ctx.fillStyle = "#c1272d";
      ctx.beginPath(); ctx.arc(b.x, y + 2, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    // --- препятствия: Шурале ---
    for (const o of g.obstacles) {
      drawShurale(ctx, o);
    }

    // --- игрок: джигит ---
    drawPlayer(ctx, g);

    // --- щит ---
    if (g.fx.shield && g.status === "playing") {
      ctx.strokeStyle = "rgba(52,211,153,0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(78, GROUND_Y - 40 - g.playerY, 44, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- частицы ---
    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  };

  // Шурале по Тукаю: долговязый лесной дух, тощий, сгорбленный, с одним рогом на лбу и длинными пальцами
  function drawShurale(ctx: CanvasRenderingContext2D, o: Obstacle) {
    const cx = o.x + o.w / 2;
    const base = o.y + o.h;
    const scale = o.kind === "low" ? 0.85 : o.kind === "tall" ? 1.15 : 1.0;
    ctx.save();
    ctx.translate(cx, base);
    ctx.scale(scale, scale);
    // Тень
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2); ctx.fill();

    const bh = o.h / scale;

    // Долговязое тощее тело (темно-бурый / лесной силуэт)
    ctx.fillStyle = "#3d3224";
    ctx.strokeStyle = "#221c13";
    ctx.lineWidth = 2;

    // Сгорбленное туловище
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.45, 10, bh * 0.35, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Тонкие длинные ножки
    ctx.beginPath();
    ctx.moveTo(-4, -bh * 0.2); ctx.lineTo(-8, 0);
    ctx.moveTo(4, -bh * 0.2); ctx.lineTo(6, 0);
    ctx.stroke();

    // Длинные тощие руки с длинными пальцами (щекочущие пальцы)
    ctx.beginPath();
    ctx.moveTo(-8, -bh * 0.6); ctx.lineTo(-24, -bh * 0.35); // рука влево
    ctx.moveTo(-24, -bh * 0.35); ctx.lineTo(-30, -bh * 0.4); // длинные пальцы
    ctx.moveTo(-24, -bh * 0.35); ctx.lineTo(-30, -bh * 0.28);
    ctx.moveTo(8, -bh * 0.6); ctx.lineTo(24, -bh * 0.45); // рука вперед
    ctx.moveTo(24, -bh * 0.45); ctx.lineTo(32, -bh * 0.5); // длинные пальцы
    ctx.moveTo(24, -bh * 0.45); ctx.lineTo(32, -bh * 0.38);
    ctx.stroke();

    // Голова и лицо
    ctx.fillStyle = "#4a3b2c";
    ctx.beginPath();
    ctx.arc(0, -bh + 14, 12, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Единственный рог на лбу (главный признак Шурале по Тукаю)
    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.moveTo(0, -bh + 2);
    ctx.lineTo(-3, -bh - 10);
    ctx.lineTo(3, -bh - 10);
    ctx.closePath();
    ctx.fill();

    // Злобные желтые глаза
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath(); ctx.arc(-4, -bh + 13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -bh + 13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(-4, -bh + 13, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -bh + 13, 1, 0, Math.PI * 2); ctx.fill();

    // Хитрая ухмылка
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -bh + 17, 6, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.restore();

    if (o.kind === "tall") {
      ctx.fillStyle = "rgba(227,185,63,0.9)";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("▼ пригнись", o.x + o.w / 2, o.y - 10);
    }
  }

  // Джигит: тюбетейка, камзол, 4 кадра бега + прыжок + присед
  function drawPlayer(ctx: CanvasRenderingContext2D, g: typeof s.current) {
    const duck = g.ducking;
    const h = duck ? 34 : 62;
    const px = 56;
    const py = GROUND_Y - g.playerY; // ноги
    const top = py - h;
    const airborne = g.playerY > 0;
    const frame = Math.floor(g.runPhase) % 4;

    ctx.save();
    // тень
    const shScale = Math.max(0.4, 1 - g.playerY / 260);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(px + 14, GROUND_Y + 4, 22 * shScale, 5 * shScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (duck) {
      // присед: вытянутое тело
      ctx.fillStyle = "#c1272d";
      roundRect(ctx, px - 6, top + 12, 52, 18, 9); ctx.fill();
      ctx.fillStyle = "#0f5132";
      roundRect(ctx, px - 6, top + 4, 40, 14, 7); ctx.fill();
      // тюбетейка
      ctx.fillStyle = "#0f5132";
      roundRect(ctx, px - 2, top - 4, 26, 12, 5); ctx.fill();
      ctx.fillStyle = "#e3b93f";
      ctx.fillRect(px + 8, top - 4, 3, 12);
      // лицо
      ctx.fillStyle = "#f2c99b";
      ctx.beginPath(); ctx.arc(px + 34, top + 8, 8, 0, Math.PI * 2); ctx.fill();
      // ноги вперёд
      ctx.strokeStyle = "#20303f";
      ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(px + 30, top + 28); ctx.lineTo(px + 52, top + 30); ctx.stroke();
    } else {
      // ноги: 4 кадра бега / прыжок — поджаты
      ctx.strokeStyle = "#20303f";
      ctx.lineWidth = 6; ctx.lineCap = "round";
      const hipX = px + 14, hipY = py - 20;
      if (airborne) {
        ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(hipX + 12, hipY + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(hipX - 6, hipY + 14); ctx.stroke();
      } else {
        const offs = [10, 4, -8, -2];
        const o1 = offs[frame], o2 = offs[(frame + 2) % 4];
        ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(hipX + o1, py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(hipX + o2, py); ctx.stroke();
      }
      // камзол (красный) + отделка
      ctx.fillStyle = "#c1272d";
      roundRect(ctx, px + 2, top + 22, 26, 24, 7); ctx.fill();
      ctx.fillStyle = "#e3b93f";
      ctx.fillRect(px + 13, top + 22, 3, 24);
      // голова
      ctx.fillStyle = "#f2c99b";
      ctx.beginPath(); ctx.arc(px + 15, top + 12, 10, 0, Math.PI * 2); ctx.fill();
      // глаз-точка (смотрит вправо)
      ctx.fillStyle = "#10231a";
      ctx.beginPath(); ctx.arc(px + 19, top + 11, 1.8, 0, Math.PI * 2); ctx.fill();
      // тюбетейка
      ctx.fillStyle = "#0f5132";
      ctx.beginPath();
      ctx.ellipse(px + 15, top + 3, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px + 3, top - 3, 24, 7);
      ctx.fillStyle = "#e3b93f";
      ctx.beginPath(); ctx.arc(px + 15, top - 4, 2.6, 0, Math.PI * 2); ctx.fill();
      // рука: мах в такт бегу
      const armSwing = airborne ? -8 : [-8, 6, 8, -6][frame];
      ctx.strokeStyle = "#f2c99b";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(px + 14, top + 28); ctx.lineTo(px + 14 + armSwing, top + 38); ctx.stroke();
    }
    ctx.restore();
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- игровой цикл ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setBest(getRunnerBest());

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const g = s.current;
      const k = dt / 16.7; // нормировка к 60fps

      if (g.status === "playing") {
        g.time += k;
        const slowed = now < g.fx.slowUntil;
        const baseSpeed = Math.min(11.5, 5 + g.dist / 1400);
        const speed = slowed ? baseSpeed * 0.62 : baseSpeed;
        g.speed = speed;

        // движение мира
        g.dist += speed * k;
        const gained = speed * k * (now < g.fx.doubleUntil ? 0.24 : 0.12);
        g.score += gained;
        g.bg1 += speed * 0.25 * k;
        g.bg2 += speed * 0.55 * k;
        g.bg3 += speed * k;
        g.runPhase += (0.32 + speed * 0.02) * k;

        // физика игрока
        if (g.playerY > 0 || g.vy !== 0) {
          g.vy += 0.7 * k;
          g.playerY -= g.vy * k;
          if (g.playerY <= 0) {
            g.playerY = 0; g.vy = 0; g.jumps = 0;
            g.ducking = g.duckHeld;
            // пыль приземления
            for (let i = 0; i < 5; i++) {
              g.particles.push({
                x: 70 + Math.random() * 24, y: GROUND_Y - 2,
                vx: -1 - Math.random() * 2, vy: -0.5 - Math.random(),
                life: 0, maxLife: 22, color: "#9db3a5", size: 2,
              });
            }
          }
        } else {
          g.ducking = g.duckHeld;
        }

        // спавн препятствий: интервал сжимается со скоростью
        g.spawnIn -= k * (0.7 + speed * 0.06);
        if (g.spawnIn <= 0) {
          spawnObstacle(g);
          const minGap = Math.max(52, 120 - speed * 6);
          g.spawnIn = minGap + Math.random() * 90;
        }
        // спавн бонусов
        g.bonusIn -= k;
        if (g.bonusIn <= 0) {
          trySpawnBonus(g);
          g.bonusIn = 200 + Math.random() * 260;
        }

        // движение объектов
        for (const o of g.obstacles) o.x -= speed * k;
        for (const b of g.bonuses) b.x -= speed * k;
        g.obstacles = g.obstacles.filter((o) => o.x + o.w > -30);
        g.bonuses = g.bonuses.filter((b) => b.x > -30 && !b.taken);

        // хитбокс игрока (уже́, чем спрайт — честно)
        const pw = g.ducking ? 48 : 30;
        const ph = g.ducking ? 32 : 58;
        const px0 = 56 + 4, px1 = 56 + 4 + pw;
        const py1 = GROUND_Y - g.playerY;
        const py0 = py1 - ph;

        // столкновения с Шурале
        for (const o of g.obstacles) {
          const overlap = px0 < o.x + o.w - 5 && px1 > o.x + 5 && py0 < o.y + o.h - 4 && py1 > o.y + 4;
          if (overlap) {
            if (g.fx.shield) {
              // щит спасает один раз
              g.fx.shield = false;
              g.obstacles = g.obstacles.filter((x) => x !== o);
              setEffect(null);
              burst(g, px1, (py0 + py1) / 2, "#34d399");
              break;
            }
            finishGame();
            break;
          }
          if (!o.passed && o.x + o.w < px0) {
            o.passed = true;
            g.score += 2;
          }
        }

        // сбор өчпочмаков
        for (const b of g.bonuses) {
          if (b.taken) continue;
          const dx = b.x - (px0 + px1) / 2;
          const dy = b.y - (py0 + py1) / 2;
          if (Math.abs(dx) < 30 && Math.abs(dy) < 34) {
            b.taken = true;
            const mult = now < g.fx.doubleUntil ? 2 : 1;
            g.score += BONUS_POINTS * mult;
            // случайный эффект
            const r = Math.random();
            if (r < 0.3) { g.fx.shield = true; g.fx.shieldUntil = Infinity; setEffect("shield"); }
            else if (r < 0.6) { g.fx.slowUntil = now + 5000; setEffect("slow"); }
            else { g.fx.doubleUntil = now + 8000; setEffect("x2"); }
            burst(g, b.x, b.y, "#e3b93f");
          }
        }

        // протухание эффектов — выводим актуальный в HUD по ref, без stale-closure
        // (бейдж обновляется в блоке HUD-синхронизации ниже)

        // частицы
        for (const p of g.particles) {
          p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.12 * k; p.life += k;
        }
        g.particles = g.particles.filter((p) => p.life < p.maxLife);

        // HUD в React — не чаще 5 раз/сек
        if (now - lastHudRef.current > 200) {
          lastHudRef.current = now;
          setScore(Math.floor(g.score));
          // актуальный эффект читаем из ref, а не из замкнутого state
          const cur: "shield" | "slow" | "x2" | null =
            g.fx.shield ? "shield" : now < g.fx.slowUntil ? "slow" : now < g.fx.doubleUntil ? "x2" : null;
          setEffect((prev) => (prev === cur ? prev : cur));
        }
      }

      draw(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Вспышка частиц
  function burst(g: typeof s.current, x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      g.particles.push({
        x, y,
        vx: Math.cos(a) * (1 + Math.random() * 3),
        vy: Math.sin(a) * (1 + Math.random() * 3) - 1,
        life: 0, maxLife: 30 + Math.random() * 20,
        color, size: 2 + Math.random() * 2.5,
      });
    }
  }

  // ---------- управление: клавиатура ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (statusRef.current === "idle" || statusRef.current === "over") startGame();
        else doJump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setDuck(true);
      } else if (e.code === "KeyP" || e.code === "Escape") {
        togglePause();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") setDuck(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [doJump, setDuck, startGame, togglePause]);

  // ---------- пауза при скрытии вкладки ----------
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && statusRef.current === "playing") setBothStatus("paused");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setBothStatus]);

  const statusLabel =
    status === "idle" ? "Готов" : status === "playing" ? "Игра" : status === "paused" ? "Пауза" : "Конец";

  return (
    <div className="animate-fade-in">
      {/* HUD: счёт, рекорд, статус */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span className="badge badge-gold">Счёт: {score}</span>
        <span className="badge badge-accent">Рекорд: {Math.max(best, score)}</span>
        <span className={status === "playing" ? "badge badge-accent" : status === "paused" ? "badge badge-red" : "badge badge-gold"}>
          {status === "playing" ? "● " : ""}{statusLabel}
        </span>
        {effect && (
          <span className="badge badge-accent">
            {effect === "shield" ? "🛡 Щит" : effect === "slow" ? "🐢 Замедление" : "✖️ x2 очки"}
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="game-canvas-wrap" style={{ border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", maxWidth: "100%" }}
          onPointerDown={(e) => {
            e.preventDefault();
            if (statusRef.current === "idle" || statusRef.current === "over") startGame();
            else if (statusRef.current === "playing") doJump();
          }}
          aria-label="Шурале-раннер: нажми чтобы прыгнуть"
        />
      </div>
      <p style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 6, textAlign: "center" }}>
        Пробел / тап — прыжок (×2 в воздухе) • ↓ — присесть • высокий Шурале с меткой «▼ пригнись» перепрыгнуть нельзя
      </p>

      {/* Кнопки управления */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: 8 }}>
        {status === "idle" && (
          <button className="btn btn-red" onClick={startGame} style={{ flex: 1 }}>
            <Play size={16} /> Начать бег
          </button>
        )}
        {status === "playing" && (
          <>
            <button className="btn btn-ghost" onClick={togglePause} style={{ flex: 1 }}>
              <Pause size={16} /> Пауза
            </button>
            <button className="btn btn-gold" onPointerDown={(e) => { e.preventDefault(); doJump(); }} style={{ flex: 1 }}>
              ▲ Прыжок
            </button>
            <button
              className="btn btn-ghost"
              onPointerDown={(e) => { e.preventDefault(); setDuck(true); }}
              onPointerUp={() => setDuck(false)}
              onPointerLeave={() => setDuck(false)}
              style={{ flex: 1 }}
            >
              ▼ Присесть
            </button>
          </>
        )}
        {status === "paused" && (
          <>
            <button className="btn btn-primary" onClick={togglePause} style={{ flex: 1 }}>
              <Play size={16} /> Продолжить
            </button>
            <button className="btn btn-ghost" onClick={startGame} style={{ flex: 1 }}>
              <RotateCcw size={16} /> Заново
            </button>
          </>
        )}
        {status === "over" && (
          <div className="card card-gold animate-pop" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "2rem" }}>👹</div>
            <div style={{ fontWeight: 800, marginTop: 4 }}>Шурале поймал!</div>
            <div style={{ color: "var(--gold)", fontWeight: 800, fontSize: "1.2rem", marginTop: 4 }}>
              {score} очков
            </div>
            {isNewRecord && (
              <div className="badge badge-gold" style={{ marginTop: 6 }}>🏆 Новый рекорд!</div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: 10 }}>
              <button className="btn btn-red" onClick={startGame} style={{ flex: 1 }}>
                <RotateCcw size={16} /> Играть снова
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
