"use client";

import Link from "next/link";
import { Cat, ListTodo, Gamepad2, Flame, Star, Zap } from "lucide-react";
import { CatSprite } from "@/components/cat-sprite";
import { useStore } from "@/store/use-store";

export default function HomePage() {
  const { name, points, streak, hearts, dailyTasks, cat, completedTasks, achievements } = useStore();
  const level = Math.min(50, Math.floor(points / 100) + 1);
  const xpInLevel = points % 100;
  const recentAchievements = achievements.filter((a) => a.unlocked).slice(-3);

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title" style={{ color: "var(--gold)" }}>
            TATARCHA
          </h1>
          <p className="page-subtitle">Салам, {name}!</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-gold">
            <Star size={12} /> Ур. {level}
          </div>
          <div className="badge badge-accent">
            <Zap size={12} /> {points}
          </div>
        </div>
      </div>

      {/* Cat card */}
      <Link href="/cat" style={{ textDecoration: "none" }}>
        <div className="card card-gold" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <CatSprite cat={cat} size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--fg)" }}>
              Мой кот
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 4 }}>
              {cat.mood === "happy" && "😊 Счастлив!"}
              {cat.mood === "normal" && "😺 Нормально"}
              {cat.mood === "hungry" && "😿 Хочет есть"}
              {cat.mood === "sleeping" && "😴 Спит..."}
              {cat.mood === "playing" && "🎉 Играет!"}
              {" · "}Ур. {cat.level}
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${cat.hunger}%` }} />
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)", marginTop: 2 }}>
              Сытость: {cat.hunger}%
            </div>
          </div>
        </div>
      </Link>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        <Link href="/tasks" style={{ textDecoration: "none" }}>
          <div className="card" style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
            <ListTodo size={28} style={{ color: "var(--accent)" }} />
            <div style={{ fontSize: "0.75rem", fontWeight: 600, marginTop: 6, color: "var(--fg)" }}>
              Задания
            </div>
          </div>
        </Link>
        <Link href="/cat" style={{ textDecoration: "none" }}>
          <div className="card" style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
            <Cat size={28} style={{ color: "var(--gold)" }} />
            <div style={{ fontSize: "0.75rem", fontWeight: 600, marginTop: 6, color: "var(--fg)" }}>
              Кот
            </div>
          </div>
        </Link>
        <Link href="/games" style={{ textDecoration: "none" }}>
          <div className="card" style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
            <Gamepad2 size={28} style={{ color: "var(--accent)" }} />
            <div style={{ fontSize: "0.75rem", fontWeight: 600, marginTop: 6, color: "var(--fg)" }}>
              Игры
            </div>
          </div>
        </Link>
      </div>

      {/* Daily progress */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Прогресс дня</span>
          <span className="badge badge-accent">{dailyTasks} заданий</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill progress-fill-gold"
            style={{ width: `${Math.min(100, dailyTasks * 20)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <Flame size={20} style={{ color: "#E74C3C" }} />
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 4 }}>{streak}</div>
          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>Серия</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <Cat size={20} style={{ color: "var(--gold)" }} />
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 4 }}>{cat.level}</div>
          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>Ур. кота</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <Star size={20} style={{ color: "var(--accent)" }} />
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 4 }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>Заданий</div>
        </div>
      </div>

      {/* Hearts */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Жизни:</span>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: "1.1rem",
                opacity: i < hearts ? 1 : 0.25,
              }}
            >
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>
            Достижения
          </div>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
            {recentAchievements.map((a) => (
              <div
                key={a.id}
                className="card card-gold"
                style={{ minWidth: 120, textAlign: "center", padding: "0.75rem 0.5rem" }}
              >
                <div style={{ fontSize: "1.5rem" }}>{a.icon}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: 4 }}>
                  {a.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
