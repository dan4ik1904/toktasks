"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { haptic } from "@/lib/telegram";

// ============================================================
// «Өчпочмак җыю»: аркадная мини-игра.
// Лови падающие өчпочмаки и чак-чак, уворачивайся от мухоморов!
// Награда сильно снижена (сбалансированная экономика).
// ============================================================

type GameStatus = "idle" | "playing" | "paused" | "over";

const W = 640;
const H = 300;
const GROUND_Y = 260;

interface FallingItem {
  x: number;
  y: number;
  vy: number;
  type: "echpochmak" | "chakchak" | "mushroom";
  size: number;
}

export function EchpochmakGame({ onDone }: { onDone: (pts: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);

  const s = useRef({
    status: "idle" as GameStatus,
    playerX: W / 2,
    playerW: 60,
    playerH: 30,
    speed: 6,
    items: [] as FallingItem[],
    spawnTimer: 0,
    score: 0,
    lives: 3,
    moveLeft: false,
    moveRight: false,
  });

  const statusRef = useRef<GameStatus>("idle");
  const rafRef = useRef(0);

  const setBothStatus = useCallback((v: GameStatus) => {
    statusRef.current = v;
    s.current.status = v;
    setStatus(v);
  }, []);

  const startGame = () => {
    haptic("medium");
    s.current = {
      status: "playing",
      playerX: W / 2,
      playerW: 60,
      playerH: 30,
      speed: 6,
      items: [],
      spawnTimer: 0,
      score: 0,
      lives: 3,
      moveLeft: false,
      moveRight: false,
    };
    setScore(0);
    setBothStatus("playing");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") s.current.moveLeft = true;
      if (e.key === "ArrowRight" || e.key === "d") s.current.moveRight = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") s.current.moveLeft = false;
      if (e.key === "ArrowRight" || e.key === "d") s.current.moveRight = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const x = ((clientX - rect.left) / rect.width) * W;
      s.current.playerX = Math.max(30, Math.min(W - 30, x));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      s.current.playerX = Math.max(30, Math.min(W - 30, x));
    });

    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (statusRef.current === "playing") {
        const g = s.current;
        if (g.moveLeft) g.playerX = Math.max(30, g.playerX - g.speed);
        if (g.moveRight) g.playerX = Math.min(W - 30, g.playerX + g.speed);

        // Спавн падающих предметов
        g.spawnTimer++;
        if (g.spawnTimer > 35) {
          g.spawnTimer = 0;
          const types: ("echpochmak" | "chakchak" | "mushroom")[] = ["echpochmak", "echpochmak", "chakchak", "mushroom"];
          const type = types[Math.floor(Math.random() * types.length)]!;
          g.items.push({
            x: 30 + Math.random() * (W - 60),
            y: -20,
            vy: 3 + Math.random() * 2.5,
            type,
            size: type === "mushroom" ? 22 : 26,
          });
        }

        // Обновление предметов
        for (const item of g.items) {
          item.y += item.vy;
        }

        // Проверка сбора / падения
        g.items = g.items.filter((item) => {
          // Столкновение с корзиной (игроком)
          const px = g.playerX;
          const py = GROUND_Y - 20;
          if (
            item.y + item.size / 2 >= py - 15 &&
            item.y - item.size / 2 <= py + 15 &&
            item.x >= px - 35 &&
            item.x <= px + 35
          ) {
            haptic("light");
            if (item.type === "mushroom") {
              g.lives -= 1;
              if (g.lives <= 0) {
                setBothStatus("over");
                // Награда сильно урезана (обесценена)
                const earned = Math.max(2, Math.floor(g.score / 3));
                onDone(earned);
              }
            } else {
              g.score += 1;
              setScore(g.score);
            }
            return false;
          }

          // Упал на землю
          if (item.y > GROUND_Y) {
            if (item.type !== "mushroom") {
              // пропустили вкусняшку — ничего или минус жизнь
            }
            return false;
          }
          return true;
        });
      }

      // Отрисовка
      ctx.clearRect(0, 0, W, H);
      const g = s.current;

      // Небо и фон
      ctx.fillStyle = "#0f251b";
      ctx.fillRect(0, 0, W, H);

      // Земля
      ctx.fillStyle = "#1b3a2a";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.strokeStyle = "#e3b93f";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

      // Корзина / Тюбетейка игрока
      ctx.fillStyle = "#e3b93f";
      ctx.beginPath();
      ctx.roundRect(g.playerX - 32, GROUND_Y - 22, 64, 24, [10, 10, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = "#b8912b";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Предметы
      for (const item of g.items) {
        ctx.save();
        ctx.translate(item.x, item.y);
        if (item.type === "echpochmak") {
          ctx.fillStyle = "#d4a373";
          ctx.beginPath();
          ctx.moveTo(0, -14); ctx.lineTo(-14, 12); ctx.lineTo(14, 12);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#bc6c25";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (item.type === "chakchak") {
          ctx.fillStyle = "#f4a261";
          ctx.fillRect(-10, -10, 20, 20);
          ctx.strokeStyle = "#e76f51";
          ctx.strokeRect(-10, -10, 20, 20);
        } else {
          // Мухомор
          ctx.fillStyle = "#e0443e";
          ctx.beginPath(); ctx.arc(0, -4, 12, Math.PI, 0, false); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(-4, -6, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(4, -8, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // HUD внутри канваса
      ctx.fillStyle = "#f6f2e7";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Собрано: ${g.score}`, 20, 30);
      ctx.textAlign = "right";
      ctx.fillText(`Жизни: ${"❤️ ".repeat(g.lives)}`, W - 20, 30);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onDone, setBothStatus]);

  return (
    <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 6 }}>🥟 Өчпочмак җыю</div>
      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: 10 }}>
        Лови падающие өчпочмаки и чак-чак. Уклоняйся от мухоморов! (Награда снижена).
      </p>

      <div className="game-canvas-wrap" style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", maxWidth: "100%", borderRadius: "0.75rem", background: "#07130e" }} />

        {status === "idle" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(7,19,14,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <div style={{ fontSize: "3rem" }}>🥟</div>
            <button className="btn btn-gold" onClick={startGame}>
              <Play size={18} /> Начать игру
            </button>
          </div>
        )}

        {status === "over" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(7,19,14,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            <div style={{ fontSize: "2.5rem" }}>🏆</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Игра окончена!</div>
            <div style={{ fontSize: "0.9rem", color: "var(--gold)" }}>Собрано өчпочмаков: {score}</div>
            <button className="btn btn-gold" onClick={startGame}>
              <RotateCcw size={16} /> Играть снова
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
