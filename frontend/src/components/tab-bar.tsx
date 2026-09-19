"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Gamepad2, User } from "lucide-react";
import { haptic } from "@/lib/telegram";
import { useLang } from "@/store/use-lang";

export function TabBar() {
  const pathname = usePathname();
  const { t } = useLang();

  const TABS = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/tasks", label: t("learning"), icon: Map },
    { href: "/cat", label: t("assistant"), icon: () => <span style={{ fontSize: "1.4rem" }}>🐆</span>, center: true },
    { href: "/games", label: t("games"), icon: Gamepad2 },
    { href: "/profile", label: t("profile"), icon: User },
  ];

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
              onClick={() => haptic("medium")}
              aria-label="Ак Барс ИИ-ассистент"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "-1.9rem",
                width: "3.8rem",
                height: "3.8rem",
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
              <span style={{ fontSize: "1.6rem" }}>🐆</span>
            </Link>
          );
        }

        const LucideIcon = Icon as React.ComponentType<{ size?: number; strokeWidth?: number }>;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => haptic("light")}
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
            <LucideIcon size={19} strokeWidth={active ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
