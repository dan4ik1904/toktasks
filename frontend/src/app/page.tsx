"use client";

import { useState } from "react";
import Link from "next/link";
import { Cat, ListTodo, Gamepad2, Flame, Star, Zap, ChevronRight, Sparkles, UtensilsCrossed, Shirt, QrCode } from "lucide-react";
import { CatSprite } from "@/components/cat-sprite";
import { useStore, petRank, satietyMultiplier } from "@/store/use-store";
import { GenderModal } from "@/components/gender-modal";
import { AssistantFab } from "@/components/assistant-fab";
import { PartnerModal } from "@/components/partner-modal";

// Главная: тамагочи по центру, сверху сытность + уровень,
// справа баллы, снизу Ашхана/Кибет/Уеннар, в углу — помощник.
// Стиль: стекло, mesh-градиент, тюльпан-орнамент.
export default function HomePage() {
  const { name, points, streak, hearts, dailyTasks, cat, gender, gamesPlayed, completedTasks, achievements } = useStore();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const level = Math.min(50, Math.floor(points / 100) + 1);
  const recentAchievements = achievements.filter((a) => a.unlocked).slice(-3);
  const rank = petRank(points, gamesPlayed);
  const mult = satietyMultiplier(cat.hunger);

  return (
    <div className="page-shell">
      {/* Выбор пола при первом запуске */}
      <GenderModal />

      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 6 }}>
            <Sparkles size={11} /> Татарча • өйрәнәбез
          </div>
          <h1 className="page-title">TATARCHA</h1>
          <p className="page-subtitle">Салам, {name}! Бүген нәрсә өйрәнәбез?</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-gold">
            <Star size={12} /> {rank.name}
          </div>
          <div className="badge badge-accent">
            <Zap size={12} /> {points}
          </div>
        </div>
      </div>

      {/* Hero: тамагочи */}
      <Link href="/cat" style={{ textDecoration: "none" }}>
        <div className="hero-card animate-slide-up" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem" }}>
          <CatSprite cat={cat} gender={gender} size={92} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--fg)" }}>Мой кот</span>
              <span className="badge badge-gold">{rank.name} • Ур. {cat.level}</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginTop: 4 }}>
              {cat.hunger <= 0 && "😴 Спит… покорми в Ашхане!"}
              {cat.hunger > 0 && cat.mood === "happy" && "😊 Счастлив и мурлычет!"}
              {cat.hunger > 0 && cat.mood === "normal" && "😺 Ждёт татарских слов"}
              {cat.hunger > 0 && cat.mood === "hungry" && "😿 Хочет өчпочмак..."}
              {cat.hunger > 0 && cat.mood === "playing" && "🎉 Играет в сабантуй!"}
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div
                className={cat.hunger < 40 ? "progress-fill progress-fill-red" : "progress-fill progress-fill-gold"}
                style={{ width: `${cat.hunger}%` }}
              />
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)", marginTop: 3, display: "flex", justifyContent: "space-between" }}>
              <span>Сытость: {cat.hunger}% (×{mult})</span>
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>Поговорить →</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Три кнопки ТЗ: Ашхана / Кибет / Уеннар */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <Link href="/cat" style={{ textDecoration: "none" }}>
          <div className="card card-lift card-gold" style={{ padding: "0.9rem 0.7rem", height: "100%", textAlign: "center" }}>
            <UtensilsCrossed size={24} style={{ color: "var(--gold)" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 800, marginTop: 8, color: "var(--fg)" }}>Ашхана</div>
            <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>покормить</div>
          </div>
        </Link>
        <Link href="/cat" style={{ textDecoration: "none" }}>
          <div className="card card-lift card-accent" style={{ padding: "0.9rem 0.7rem", height: "100%", textAlign: "center" }}>
            <Shirt size={24} style={{ color: "var(--accent)" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 800, marginTop: 8, color: "var(--fg)" }}>Кибет</div>
            <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>одеть</div>
          </div>
        </Link>
        <Link href="/games" style={{ textDecoration: "none" }}>
          <div className="card card-lift card-red" style={{ padding: "0.9rem 0.7rem", height: "100%", textAlign: "center" }}>
            <Gamepad2 size={24} style={{ color: "var(--tatar-red)" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 800, marginTop: 8, color: "var(--fg)" }}>Уеннар</div>
            <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>4 игры</div>
          </div>
        </Link>
      </div>

      {/* Партнёр Тюбетей */}
      <button className="card card-lift card-gold" onClick={() => setPartnerOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: "1.8rem" }}>🍲</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--fg)", display: "block" }}>Тюбетей • скидки за баллы</span>
          <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>1000 = 10% • 2500 = 20% • 5000 = эчпочмак</span>
        </span>
        <QrCode size={20} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />

      {/* Bento: задания / магазин */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        <Link href="/tasks" style={{ textDecoration: "none" }}>
          <div className="card card-lift card-accent" style={{ padding: "0.9rem 0.7rem", height: "100%", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ListTodo size={24} style={{ color: "var(--accent)" }} />
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--fg)" }}>Задания</div>
              <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>{dailyTasks} сегодня</div>
            </div>
          </div>
        </Link>
        <Link href="/profile" style={{ textDecoration: "none" }}>
          <div className="card card-lift card-gold" style={{ padding: "0.9rem 0.7rem", height: "100%", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Cat size={24} style={{ color: "var(--gold)" }} />
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--fg)" }}>Профиль</div>
              <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>{points} 💰</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Прогресс дня */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>Прогресс дня</span>
          <span className="badge badge-accent">{dailyTasks} заданий</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill progress-fill-gold" style={{ width: `${Math.min(100, dailyTasks * 20)}%` }} />
        </div>
        <Link href="/tasks" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)", textDecoration: "none" }}>
          Продолжить учиться <ChevronRight size={14} />
        </Link>
      </div>

      {/* Статистика */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Flame size={20} style={{ color: "var(--tatar-red)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{streak}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Серия</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Cat size={20} style={{ color: "var(--gold)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>{gamesPlayed}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Игр сыграно</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Star size={20} style={{ color: "var(--accent)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Заданий</div>
        </div>
      </div>

      {/* Жизни */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Жизни:</span>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ fontSize: "1.1rem", opacity: i < hearts ? 1 : 0.25, filter: i < hearts ? "none" : "grayscale(1)" }}>
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Достижения */}
      {recentAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 8 }}>Достижения</div>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: 4 }}>
            {recentAchievements.map((a) => (
              <div key={a.id} className="card card-gold" style={{ minWidth: 120, textAlign: "center", padding: "0.75rem 0.5rem" }}>
                <div style={{ fontSize: "1.5rem" }}>{a.icon}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, marginTop: 4 }}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Мини-помощник в правом нижнем углу */}
      <AssistantFab />
    </div>
  );
}
