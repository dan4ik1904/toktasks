"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Crown, Map, MessageCircleMore, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Карта", icon: Map },
  { href: "/progress", label: "Прогресс", icon: Compass },
  { href: "/assistant", label: "Ярдәмче", icon: MessageCircleMore, main: true },
  { href: "/top", label: "Топ", icon: Crown },
  { href: "/profile", label: "Профиль", icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-xl">
      <div className="grid grid-cols-5 px-2 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold",
                active ? "text-[var(--accent)]" : "text-[var(--muted)]",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  tab.main && "-mt-5 size-12 border-4 border-[var(--bg)] bg-[var(--ink)] text-[var(--paper)] shadow-lg",
                  active && !tab.main && "bg-[var(--accent-soft)]",
                )}
              >
                <tab.icon className={cn(tab.main ? "size-5" : "size-[1.15rem]")} aria-hidden />
              </span>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
