"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, MessageSquareText, Gamepad2, User } from "lucide-react";

// ============================================================
// Нижняя навигация: плавающая стеклянная пилюля.
// Центральная кнопка «Сөйләшү» (Чат с ИИ) приподнята и подсвечена золотом.
// ============================================================

const TABS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/tasks", label: "Задания", icon: ListTodo },
  { href: "/cat", label: "Сөйләшү", icon: MessageSquareText, center: true },
  { href: "/games", label: "Игры", icon: Gamepad2 },
  { href: "/profile", label: "Профиль", icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="tabbar-float" aria-label="Навигация">
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;

        if (tab.center) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label="Сөйләшү"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "-1.9rem",
                width: "3.6rem",
                height: "3.6rem",
                borderRadius: "50%",
                background: active
                  ? "linear-gradient(135deg, var(--gold), var(--gold-light))"
                  : "linear-gradient(135deg, var(--accent-deep), var(--accent))",
                color: active ? "#1a1405" : "#fff",
                border: "3px solid var(--bg)",
                boxShadow: active ? "var(--glow-gold)" : "var(--glow-accent)",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={22} strokeWidth={2.2} />
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.15rem",
              color: active ? "var(--gold)" : "var(--fg-muted)",
              fontSize: "0.62rem",
              fontWeight: active ? 800 : 600,
              textDecoration: "none",
              transition: "color 0.2s ease",
              padding: "0.35rem 0.55rem",
              borderRadius: "0.8rem",
              background: active ? "var(--gold-soft)" : "transparent",
            }}
          >
            <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
