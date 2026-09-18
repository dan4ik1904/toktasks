"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ISLANDS } from "@/data/islands";
import { useProgress } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const completedLessons = useProgress((s) => s.completedLessons);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
          Татар телен өйрәнәбез
        </p>
        <h1 className="text-3xl font-bold text-balance">
          Учи татарский остров за островом
        </h1>
        <p className="max-w-xl opacity-70">
          Каждый остров — одна тема: слова, фразы и короткие уроки. Проходи
          уроки, собирай XP и спрашивай ИИ-помощника Ярдәмче, если что-то
          непонятно.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {ISLANDS.map((island) => {
          const total = island.lessons.length;
          const done = island.lessons.filter((l) =>
            completedLessons.includes(l.id),
          ).length;
          const finished = total > 0 && done === total;
          return (
            <Link key={island.slug} href={`/island/${island.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                      <IslandIcon icon={island.icon} className="size-6" />
                    </span>
                    {finished ? (
                      <CheckCircle2
                        className="size-5 text-emerald-600"
                        aria-label="Остров пройден"
                      />
                    ) : (
                      <span className="rounded-full bg-black/[.06] px-2.5 py-0.5 text-xs font-medium dark:bg-white/10">
                        {island.level}
                      </span>
                    )}
                  </div>
                  <CardTitle className="pt-2 text-xl">
                    {island.title}{" "}
                    <span className="font-normal opacity-60">
                      · {island.titleRu}
                    </span>
                  </CardTitle>
                  <CardDescription>{island.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Progress value={done} max={total} className="flex-1" />
                  <span className="text-xs font-medium whitespace-nowrap opacity-70 tabular-nums">
                    {done}/{total}
                  </span>
                  <ArrowRight className="size-4 opacity-50" aria-hidden />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
