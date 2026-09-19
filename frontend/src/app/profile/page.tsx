"use client";

import { useState } from "react";
import { useStore } from "@/store/use-store";
import { useTheme } from "@/providers/theme-provider";
import { useLang, type Lang } from "@/store/use-lang";
import { Zap, Flame, Trophy, Sun, Moon, QrCode, Globe, VolumeX, Volume2 } from "lucide-react";
import { PartnerModal } from "@/components/partner-modal";
import { haptic } from "@/lib/telegram";

export default function ProfilePage() {
  const { name, setName, points, streak, completedTasks, achievements, muted, toggleMute } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLang();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const level = Math.min(50, Math.floor(points / 100) + 1);
  const xpInLevel = points % 100;
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  const LANGUAGES: { id: Lang; label: string }[] = [
    { id: "ru", label: "Русский" },
    { id: "en", label: "English" },
    { id: "tt", label: "Татарча" },
  ];

  return (
    <div className="page-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title">Профиль / Profile</h1>
        <button className="btn btn-ghost" onClick={() => { haptic("light"); toggleTheme(); }}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Настройки: Язык интерфейса */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 700 }}>
          <Globe size={18} style={{ color: "var(--accent)" }} /> Язык / Language:
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => { haptic("light"); setLang(l.id); }}
              className={"btn btn-sm " + (lang === l.id ? "btn-primary" : "btn-ghost")}
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Настройки: Беззвучный режим (озвучка ИИ) */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 700 }}>
          {muted ? <VolumeX size={18} style={{ color: "var(--danger)" }} /> : <Volume2 size={18} style={{ color: "var(--accent)" }} />}
          Беззвучный режим (озвучка ИИ):
        </div>
        <button
          onClick={() => { haptic("light"); toggleMute(); }}
          className={"btn btn-sm " + (muted ? "btn-danger" : "btn-primary")}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem" }}
        >
          {muted ? "Вкл (Тишина)" : "Выкл (Звук)"}
        </button>
      </div>

      {/* User card */}
      <div className="card card-gold" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: "1.3rem",
          border: "3px solid var(--gold)",
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <input value={name} onChange={(e) => setName(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--fg)", fontWeight: 700, fontSize: "1rem", width: "100%", padding: 0 }} />
          <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Уровень {level} • Татар тилен өйрәнәбез</div>
          <div className="progress-track" style={{ marginTop: 6 }}>
            <div className="progress-fill progress-fill-gold" style={{ width: xpInLevel + "%" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Zap size={18} style={{ color: "var(--gold)" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 4 }}>{points}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)" }}>Баллы (XP)</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Flame size={18} style={{ color: "#E74C3C" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 4 }}>{streak}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)" }}>Серия дней</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Trophy size={18} style={{ color: "var(--accent)" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 4 }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)" }}>Заданий</div>
        </div>
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>Достижения ({unlockedAchievements.length})</div>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: 4 }}>
            {unlockedAchievements.map((a) => (
              <div key={a.id} className="card card-gold" style={{ minWidth: 110, textAlign: "center", padding: "0.6rem" }}>
                <div style={{ fontSize: "1.4rem" }}>{a.icon}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, marginTop: 4 }}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Партнёр Тюбетей */}
      <button className="card card-lift card-gold" onClick={() => { haptic("medium"); setPartnerOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: "1.8rem" }}>🍲</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--fg)", display: "block" }}>Тюбетей • скидки за баллы</span>
          <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>показать QR на кассе</span>
        </span>
        <QrCode size={20} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />
    </div>
  );
}
