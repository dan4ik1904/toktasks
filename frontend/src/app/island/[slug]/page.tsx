"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Volume2 } from "lucide-react";
import { getIsland } from "@/data/islands";
import { useProgress, XP_PER_LESSON } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tt-RU";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* озвучка недоступна */
  }
}

export default function IslandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const island = getIsland(slug);
  const completeLesson = useProgress((s) => s.completeLesson);
  const isCompleted = useProgress((s) => s.isCompleted);

  if (!island) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-sm opacity-70 hover:opacity-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Все острова
      </Link>

      <section className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
          <IslandIcon icon={island.icon} className="size-8" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">
            {island.title}{" "}
            <span className="font-normal opacity-60">· {island.titleRu}</span>
          </h1>
          <p className="opacity-70">{island.description}</p>
        </div>
      </section>

      {island.lessons.map((lesson) => {
        const done = isCompleted(lesson.id);
        return (
          <Card key={lesson.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>
                    {lesson.title}{" "}
                    <span className="font-normal opacity-60">
                      · {lesson.titleRu}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    +{XP_PER_LESSON} XP за прохождение
                  </CardDescription>
                </div>
                {done && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Пройдено
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ul className="divide-y divide-black/[.06] dark:divide-white/10">
                {lesson.words.map((w) => (
                  <li
                    key={w.tt}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div>
                      <p className="font-semibold">{w.tt}</p>
                      <p className="text-sm opacity-70">
                        {w.ru}
                        {w.transcription ? ` · ${w.transcription}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Озвучить: ${w.tt}`}
                      onClick={() => speak(w.tt)}
                    >
                      <Volume2 />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-2 w-full"
                variant={done ? "secondary" : "default"}
                disabled={done}
                onClick={() => completeLesson(lesson.id)}
              >
                {done ? "Урок пройден" : "Завершить урок"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </main>
  );
}
