"use client";

import { useState } from "react";
import Link from "next/link";
import { Map, Gamepad2, Flame, Star, Zap, ChevronRight, QrCode, BookOpen } from "lucide-react";
import { useStore } from "@/store/use-store";
import { useLang } from "@/store/use-lang";
import { PartnerModal } from "@/components/partner-modal";
import { AssistantFab } from "@/components/assistant-fab";
import { PlacementModal } from "@/components/placement-modal";
import { CatSprite, type CatMood } from "@/components/cat-sprite";
import { playMunch, playPurr } from "@/lib/pet-sounds";
import { haptic } from "@/lib/telegram";

export default function HomePage() {
  const { points, streak, dailyTasks, completedTasks, achievements } = useStore();
  const { petHunger, petHappiness, petEnergy, petOutfit, feedPet, petPet, muted } = useStore();
  const { t } = useLang();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const recentAchievements = achievements.filter((a) => a.unlocked).slice(-3);

  const mood: CatMood =
    petEnergy < 20 ? "sleepy" : petHunger < 30 ? "hungry" : petHappiness > 82 ? "happy" : "normal";
  const moodText =
    mood === "sleepy" ? "Хочет спать... 😴" : mood === "hungry" ? "Просит кушать... 🥺" : mood === "happy" ? "Счастлив! 😻" : "Ждёт тебя 🐾";

  const quickPet = () => {
    haptic("light");
    petPet();
    if (!muted) playPurr();
  };
  const quickFeed = () => {
    haptic("medium");
    if (feedPet("echpochmak") || feedPet("chakchak") || feedPet("milk")) {
      if (!muted) playMunch();
    }
  };

  return (
    <div className="page-shell">
      <PlacementModal />

      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">TATARCHA</h1>
        </div>
        <div className="badge badge-accent">
          <Zap size={12} /> {points} XP
        </div>
      </div>

      {/* Hero: Иптәш — сердце приложения */}
      <div className="hero-card animate-slide-up" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.1rem 1.25rem" }}>
        <Link href="/cat" onClick={() => haptic("light")} style={{ textDecoration: "none", flexShrink: 0 }} aria-label="Открыть Иптәша">
          <CatSprite mood={mood} action="idle" outfit={petOutfit} size={104} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--fg)" }}>Иптәш</span>
            <span className="badge badge-gold">питомец</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginTop: 2 }}>{moodText}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <div className="progress-track" title="Сытость" style={{ flex: 1, height: 5 }}>
              <div className="progress-fill" style={{ width: `${petHunger}%`, background: petHunger > 50 ? "var(--success)" : "var(--danger)" }} />
            </div>
            <div className="progress-track" title="Счастье" style={{ flex: 1, height: 5 }}>
              <div className="progress-fill progress-fill-gold" style={{ width: `${petHappiness}%` }} />
            </div>
            <div className="progress-track" title="Энергия" style={{ flex: 1, height: 5 }}>
              <div className="progress-fill" style={{ width: `${petEnergy}%` }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: 8 }}>
            <button className="btn btn-sm btn-gold" onClick={quickFeed} style={{ flex: 1, fontSize: "0.72rem" }}>
              🥟 Покормить
            </button>
            <button className="btn btn-sm btn-ghost" onClick={quickPet} style={{ flex: 1, fontSize: "0.72rem" }}>
              💛 Погладить
            </button>
            <Link href="/cat" onClick={() => haptic("light")} className="btn btn-sm btn-ghost" style={{ fontSize: "0.72rem", textDecoration: "none" }}>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Переход к Древу уроков и Играм */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Link href="/tasks" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
          <div className="card card-lift card-accent" style={{ padding: "1rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Map size={26} style={{ color: "var(--accent)" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--fg)" }}>{t("lessonTreeTitle")}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 2 }}>{dailyTasks} {t("lessonTreeDesc").toLowerCase()}</div>
            </div>
          </div>
        </Link>
        <Link href="/games" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
          <div className="card card-lift card-red" style={{ padding: "1rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Gamepad2 size={26} style={{ color: "var(--tatar-red)" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--fg)" }}>{t("miniGamesTitle")}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 2 }}>{t("miniGamesDesc")}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Партнёр Тюбетей */}
      <button className="card card-lift card-gold" onClick={() => { haptic("medium"); setPartnerOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: "2rem" }}>🍲</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--fg)", display: "block" }}>{t("partner")}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>{t("partnerSub")}</span>
        </span>
        <QrCode size={22} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />

      {/* Статистика */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "0.9rem 0.4rem" }}>
          <Flame size={20} style={{ color: "var(--tatar-red)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{streak}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("streak")}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.9rem 0.4rem" }}>
          <Star size={20} style={{ color: "var(--gold)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>{points}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("xp")}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.9rem 0.4rem" }}>
          <BookOpen size={20} style={{ color: "var(--accent)" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("tasks")}</div>
        </div>
      </div>

      {/* Достижения */}
      {recentAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 8 }}>{t("achievements")}</div>
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

      <AssistantFab />
    </div>
  );
}
