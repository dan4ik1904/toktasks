"use client";

import Link from "next/link";
import { Bot, Map, Sparkles } from "lucide-react";
import { useProgress } from "@/store/use-progress";

export function AppHeader() {
  const xp = useProgress((s) => s.xp);

  return (
    <header className="sticky top-0 z-10 border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.12] dark:bg-black/60">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Map className="size-5 text-emerald-600" aria-hidden />
          <span>
            Татар.Уку <span className="font-normal opacity-60">· острова</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300"
            title="Твои очки опыта"
          >
            <Sparkles className="size-4" aria-hidden />
            {xp} XP
          </span>
          <Link
            href="/assistant"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Bot className="size-4" aria-hidden />
            Ярдәмче
          </Link>
        </div>
      </div>
    </header>
  );
}
