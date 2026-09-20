"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/use-store";
import { useTheme } from "@/providers/theme-provider";
import { CatSprite } from "@/components/cat-sprite";
import { useTelegram } from "@/providers/telegram-provider";
import { useLang } from "@/store/use-lang";
import { Zap, Flame, Trophy, Sun, Moon, QrCode, VolumeX, Volume2, ShoppingBag, ChevronRight } from "lucide-react";
import { PartnerModal } from "@/components/partner-modal";
import { haptic } from "@/lib/telegram";

export default function ProfilePage() {
  const { name, setName, points, streak, completedTasks, achievements, muted, toggleMute, tgId, userLevel, setUserLevel } = useStore();
  const { petHunger, petHappiness, petEnergy, petOutfit, petSleeping } = useStore();
  const petMood = petSleeping || petEnergy < 20 ? "sleepy" : petHunger < 30 ? "hungry" : petHappiness > 82 ? "happy" : "normal";
  const petMoodText = petSleeping ? "сладко спит 💤" : petMood === "sleepy" ? "хочет спать 😴" : petMood === "hungry" ? "голодный 🥺" : petMood === "happy" ? "счастлив 😻" : "ждёт тебя 🐾";
  const { user: tgUser, isInTelegram } = useTelegram();
  const tgDisplayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || name
    : name;
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const level = Math.min(50, Math.floor(points / 100) + 1);
  const xpInLevel = points % 100;
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div className="page-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title">{t("profile")}</h1>
        <button className="btn btn-ghost" onClick={() => { haptic("light"); toggleTheme(); }}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Кнопка Маркет наград */}
      <Link href="/market" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
        <div className="card card-lift card-gold" style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--gold-soft)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", flexShrink: 0 }}>
            <ShoppingBag size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--fg)" }}>Маркет: Скидки, промокоды и мерч</div>
            <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Обменивай XP на акции, купоны и подарки</div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--gold)" }} />
        </div>
      </Link>

      {/* Настройки: Беззвучный режим (озвучка ИИ) */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 700 }}>
          {muted ? <VolumeX size={18} style={{ color: "var(--danger)" }} /> : <Volume2 size={18} style={{ color: "var(--accent)" }} />}
          {t("mutedMode")}:
        </div>
        <button
          onClick={() => { haptic("light"); toggleMute(); }}
          className={"btn btn-sm " + (muted ? "btn-danger" : "btn-primary")}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem" }}
        >
          {muted ? t("on") : t("off")}
        </button>
      </div>

      {/* User card — данные TG-аккаунта, прогресс хранится в БД per-аккаунт */}
      <div className="card card-gold" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: "1.3rem",
          border: "3px solid var(--gold)", flexShrink: 0,
        }}>
          {(tgDisplayName || "У").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isInTelegram && tgUser ? (
            <>
              <div style={{ color: "var(--fg)", fontWeight: 700, fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tgDisplayName}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>
                {tgUser.username ? `@${tgUser.username} • ` : ""}TG ID: {tgUser.id} • ☁️ в облаке
              </div>
            </>
          ) : (
            <input value={name} onChange={(e) => setName(e.target.value)}
              style={{ background: "transparent", border: "none", color: "var(--fg)", fontWeight: 700, fontSize: "1rem", width: "100%", padding: 0 }} />
          )}
          <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{t("level")} {level} • Татар телен өйрәнәбез</div>
          <div className="progress-track" style={{ marginTop: 6 }}>
            <div className="progress-fill progress-fill-gold" style={{ width: xpInLevel + "%" }} />
          </div>
          {!isInTelegram && (
            <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)", marginTop: 4 }}>Демо-профиль (вне Telegram): {tgId}</div>
          )}
        </div>
      </div>

      {/* Мой Иптәш */}
      <Link href="/cat" onClick={() => haptic("light")} style={{ textDecoration: "none" }}>
        <div className="card card-lift card-accent" style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }}>
          <div style={{ flexShrink: 0 }}>
            <CatSprite mood={petMood} action="idle" outfit={petOutfit} size={64} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--fg)" }}>Мой Иптәш • {petMoodText}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <div className="progress-track" style={{ flex: 1, height: 4 }}>
                <div className="progress-fill" style={{ width: `${petHunger}%`, background: petHunger > 50 ? "var(--success)" : "var(--danger)" }} />
              </div>
              <div className="progress-track" style={{ flex: 1, height: 4 }}>
                <div className="progress-fill progress-fill-gold" style={{ width: `${petHappiness}%` }} />
              </div>
              <div className="progress-track" style={{ flex: 1, height: 4 }}>
                <div className="progress-fill" style={{ width: `${petEnergy}%` }} />
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
        </div>
      </Link>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Zap size={18} style={{ color: "var(--gold)" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 4 }}>{points}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)" }}>{t("xp")}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Flame size={18} style={{ color: "#E74C3C" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 4 }}>{streak}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)" }}>{t("streak")}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.8rem 0.4rem" }}>
          <Trophy size={18} style={{ color: "var(--accent)" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 4 }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)" }}>{t("tasks")}</div>
        </div>
      </div>

      {/* Перепройти входной тест (смена уровня) */}
      {userLevel && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            haptic("medium");
            if (confirm("Перепройти входное тестирование? Уровень будет определён заново.")) {
              setUserLevel(null);
            }
          }}
          style={{ width: "100%" }}
        >
          🔄 Перепройти входной тест
        </button>
      )}

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>{t("achievements")} ({unlockedAchievements.length})</div>
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
          <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--fg)", display: "block" }}>{t("partner")}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>показать QR на кассе</span>
        </span>
        <QrCode size={20} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />
    </div>
  );
}
