"use client";

import { useState } from "react";
import Link from "next/link";
import { Map, Gamepad2, Flame, Star, Zap, ChevronRight, Sparkles, QrCode, BookOpen } from "lucide-react";
import { useStore } from "@/store/use-store";
import { PartnerModal } from "@/components/partner-modal";
import { AssistantFab } from "@/components/assistant-fab";
import { PlacementModal } from "@/components/placement-modal";
import { haptic } from "@/lib/telegram";

// ============================================================
// Главная страница TatarLearn (Duolingo Style TWA):
// Статистика, стрик, быстрый прыжок к древу уроков и Ак Барсу.
// ============================================================

export default function HomePage() {
  const { name, points, streak, dailyTasks, completedTasks, achievements } = useStore();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const recentAchievements = achievements.filter((a) => a.unlocked).slice(-3);

  return (
    <div className="page-shell">
      {/* Модалка теста уровня при первом запуске */}
      <PlacementModal />

      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 6 }}>
            <Sparkles size={11} /> TatarLearn • Платформа
          </div>
          <h1 className="page-title">TATARCHA</h1>
          <p className="page-subtitle">Салам, {name}! Бүген нәрсә өйрәнәбез?</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-accent">
            <Zap size={12} /> {points} XP
          </div>
        </div>
      </div>

      {/* Hero: Ак Барс ИИ-ассистент */}
      <Link href="/cat" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
        <div className="hero-card animate-slide-up" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--gold-soft)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }}>
            🐆
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--fg)" }}>Ак Барс • ИИ-Репетитор</span>
              <span className="badge badge-gold">AI</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 3 }}>
              Задай вопрос по грамматике, переводи фразы или общайся голосом
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 700, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              Спросить репетитора <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </Link>

      {/* Переход к Древу уроков и Играм */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Link href="/tasks" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
          <div className="card card-lift card-accent" style={{ padding: "1rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Map size={26} style={{ color: "var(--accent)" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--fg)" }}>Древо уроков</div>
              <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 2 }}>{dailyTasks} выполнено сегодня</div>
            </div>
          </div>
        </Link>
        <Link href="/games" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
          <div className="card card-lift card-red" style={{ padding: "1rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Gamepad2 size={26} style={{ color: "var(--tatar-red)" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--fg)" }}>Мини-игры</div>
              <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 2 }}>Слова и квизы</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Партнёр Тюбетей */}
      <button className="card card-lift card-gold" onClick={() => { haptic("medium"); setPartnerOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: "2rem" }}>🍲</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--fg)", display: "block" }}>Ресторан «Тюбетей» • Скидки за XP</span>
          <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Обменивай баллы на скидки и эчпочмаки</span>
        </span>
        <QrCode size={22} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />

      {/* Статистика */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "0.9rem 0.4rem" }}>
          <Flame size={20} style={{ color: "var(--tatar-red)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{streak}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Серия дней</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.9rem 0.4rem" }}>
          <Star size={20} style={{ color: "var(--gold)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>{points}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Очки XP</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.9rem 0.4rem" }}>
          <BookOpen size={20} style={{ color: "var(--accent)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Уроков</div>
        </div>
      </div>

      {/* Достижения */}
      {recentAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 8 }}>Достижения</div>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: 4 }}>
            {recentAchievements.map((a) => (
              <div key={a.id} className="card card-gold" style={{ minWidth: 130, textAlign: "center", padding: "0.8rem 0.5rem" }}>
                <div style={{ fontSize: "1.6rem" }}>{a.icon}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, marginTop: 4 }}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB помощника */}
      <AssistantFab />
    </div>
  );
}
