"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Острова", icon: Map },
  { href: "/progress", label: "Прогресс", icon: BarChart3 },
  { href: "/profile", label: "Профиль", icon: User },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 border-t border-[#1c4d3a] bg-[#04150f]/90 backdrop-blur">
      <div className="mx-auto grid w-full max-w-3xl grid-cols-3 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs",
                active ? "text-[#f5c044]" : "text-[#9db8a8]",
              )}
            >
              <t.icon
                className={cn("size-6", active && "drop-shadow-[0_0_8px_rgba(245,192,68,0.6)]")}
                aria-hidden
              />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
