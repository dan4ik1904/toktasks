"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Cat, Gamepad2, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/tasks", label: "Задания", icon: ListTodo },
  { href: "/cat", label: "Кот", icon: Cat, center: true },
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
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        height: "3.5rem",
        background: "color-mix(in srgb, var(--surface) 85%, transparent)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border-soft)",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;

        if (tab.center) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "-1.5rem",
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "50%",
                background: active ? "var(--gold)" : "var(--accent)",
                color: "#fff",
                boxShadow: active ? "var(--glow-gold)" : "var(--glow-accent)",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={22} />
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
              fontSize: "0.6rem",
              fontWeight: active ? 700 : 500,
              textDecoration: "none",
              transition: "color 0.2s ease",
              padding: "0.25rem 0.5rem",
            }}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
