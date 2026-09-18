"use client";

import { use } from "react";
import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Languages,
  Mic,
  PartyPopper,
  Volume2,
  X,
} from "lucide-react";
import { getIsland, ISLANDS } from "@/data/islands";
import { useProgress, XP_PER_LESSON } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import { cn } from "@/lib/utils";

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

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim();
}

type SR = {
  lang: string;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function createRecognizer(): SR | null {
  try {
    const w = window as unknown as Record<string, new () => SR | undefined>;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return null;
    const r = new Ctor();
    if (!r) return null;
    r.lang = "ru-RU";
    return r;
  } catch {
    return null;
  }
}

function EqBars({ side }: { side: "left" | "right" }) {
  const bars = [14, 26, 38, 26, 14];
  return (
    <div
      className={cn("flex items-center gap-1", side === "left" && "flex-row-reverse")}
      aria-hidden
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className="eq-bar w-1.5 rounded-full bg-gradient-to-t from-[#34d399] to-[#f5c044]"
          style={{ height: h, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
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

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"task" | "success" | "finished">("task");
  const [showRu, setShowRu] = useState(false);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState("");

  if (!island) notFound();

  const lesson =
    island.lessons.find((l) => !isCompleted(l.id)) ??
    island.lessons[island.lessons.length - 1];
  const words = lesson.words;
  const word = words[Math.min(step, words.length - 1)];
  const islandIndex = ISLANDS.findIndex((i) => i.slug === slug);

  function next() {
    if (step + 1 >= words.length) {
      completeLesson(lesson.id);
      setPhase("finished");
    } else {
      setStep((s) => s + 1);
      setPhase("task");
      setShowRu(false);
      setHint("");
    }
  }

  function listen() {
    if (listening) return;
    const rec = createRecognizer();
    if (!rec) {
      // Распознавания нет — диктор произносит, ученик повторяет вслух.
      speak(word.tt);
      setHint("Повтори вслух за диктором и жми «Дальше»");
      setPhase("success");
      return;
    }
    setListening(true);
    setHint("");
    let got = false;
    rec.onresult = (e) => {
      got = true;
      const said = e.results[0][0].transcript;
      if (norm(said).includes(norm(word.tt)) || norm(word.tt).includes(norm(said))) {
        setPhase("success");
        setHint("");
      } else {
        setHint(`Услышал: «${said}». Попробуй ещё раз`);
      }
    };
    rec.onerror = () => {
      if (!got) setHint("Не расслышал — попробуй ещё раз");
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      window.setTimeout(() => {
        try {
          rec.stop();
        } catch {
          /* уже остановлено */
        }
      }, 6000);
    } catch {
      setListening(false);
    }
  }

  if (phase === "finished") {
    return (
      <main className="flex w-full flex-1 flex-col items-center gap-4 px-4 pt-10 pb-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-[#f5c044]/15 text-[#f5c044]">
          <PartyPopper className="size-10" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">Остров пройден!</h1>
        <p className="text-[#9db8a8]">
          {lesson.title} · +{XP_PER_LESSON} XP. {island.guide} гордится тобой.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0e9f6e] px-6 font-semibold text-white"
        >
          К островам <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/assistant" className="text-sm text-[#34d399]">
          Спросить Ярдәмче
        </Link>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      {/* Верхняя панель */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Назад к островам"
          className="flex size-10 items-center justify-center rounded-full text-[#f2f7ef] hover:bg-white/5"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <p className="flex items-center gap-2 font-semibold">
          <IslandIcon icon={island.icon} className="size-5 text-[#f5c044]" />
          {island.title}
        </p>
        <Link
          href="/"
          aria-label="Закрыть урок"
          className="flex size-10 items-center justify-center rounded-full text-[#f2f7ef] hover:bg-white/5"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>

      {/* Шаги */}
      <ol className="flex items-center justify-center gap-2" aria-label="Шаги урока">
        {words.map((w, i) => (
          <li
            key={w.tt}
            aria-label={`Задание ${i + 1}${i < step ? ", выполнено" : i === step ? ", текущее" : ""}`}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border text-sm font-semibold",
              i < step || (phase === "success" && i === step)
                ? "border-[#f5c044] bg-[#f5c044] text-[#04150f]"
                : i === step
                  ? "border-[#34d399] text-[#34d399] shadow-[0_0_16px_rgba(52,211,153,0.5)]"
                  : "border-white/20 text-[#9db8a8]",
            )}
          >
            {i < step || (phase === "success" && i === step) ? (
              <Check className="size-4" aria-hidden />
            ) : (
              i + 1
            )}
          </li>
        ))}
      </ol>

      {/* Дух-хранитель */}
      <div className="flex items-center justify-center gap-4 py-2">
        <EqBars side="left" />
        <div className="spirit-ring rounded-full p-1.5">
          <div className="flex size-36 items-center justify-center rounded-full bg-[#07231b]">
            <IslandIcon icon={island.icon} className="size-16 text-[#f5c044]" />
          </div>
        </div>
        <EqBars side="right" />
      </div>
      <p className="text-center text-xs text-[#9db8a8]">
        {island.guide} · хранитель острова
      </p>

      {/* Фраза */}
      <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => speak(word.tt)}
            aria-label="Прослушать фразу"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#34d399] hover:bg-white/10"
          >
            <Volume2 className="size-5" aria-hidden />
          </button>
          <p className="flex-1 text-center text-lg font-semibold text-balance">
            {word.tt}
          </p>
          <button
            onClick={() => speak(word.tt)}
            aria-label="Прослушать фразу"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#34d399] hover:bg-white/10"
          >
            <Volume2 className="size-5" aria-hidden />
          </button>
        </div>
        {(showRu || phase === "success") && (
          <p className="pt-2 text-center text-sm text-[#9db8a8]">
            {word.ru}
            {word.transcription ? ` · ${word.transcription}` : ""}
          </p>
        )}
      </section>

      {/* Задание */}
      {phase === "task" ? (
        <>
          <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4 text-center">
            <p className="font-semibold">Скажи: {word.tt}</p>
            <p className="pt-1 text-sm text-[#9db8a8]">
              Нажми микрофон и произнеси
            </p>
            {hint && <p className="pt-2 text-sm text-[#f5c044]">{hint}</p>}
          </section>

          <div className="flex gap-2">
            <button
              onClick={listen}
              disabled={listening}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0e9f6e] font-semibold text-white shadow-[0_0_24px_rgba(14,159,110,0.45)] disabled:opacity-60"
            >
              <Mic className="size-5" aria-hidden />
              {listening ? "Слушаю…" : "Произнести"}
            </button>
            <button
              onClick={() => setShowRu((v) => !v)}
              className="flex h-14 w-20 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 text-xs"
            >
              <Languages className="size-5 text-[#9db8a8]" aria-hidden />
              Перевод
            </button>
            <button
              onClick={() => {
                setShowRu(true);
                setHint("Ничего страшного — послушай, повтори и иди дальше");
                setPhase("success");
              }}
              className="flex h-14 w-20 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 text-xs"
            >
              <CircleHelp className="size-5 text-[#9db8a8]" aria-hidden />
              Не понимаю
            </button>
          </div>
        </>
      ) : (
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-[#34d399]/60 bg-[#0e9f6e]/20 p-3 pl-4">
          <p className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#34d399]">
              <Check className="size-4" aria-hidden />
            </span>
            Правильно! Молодец!
          </p>
          <button
            onClick={next}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#0e9f6e] px-4 text-sm font-semibold text-white"
          >
            Дальше <ArrowRight className="size-4" aria-hidden />
          </button>
        </section>
      )}

      {/* Низ */}
      <div className="mt-auto pt-2">
        <p className="pb-2 text-sm">
          Задание {Math.min(step + 1, words.length)} из {words.length}
          <span className="text-[#9db8a8]"> · остров {islandIndex + 1}</span>
        </p>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={words.length}
          aria-valuenow={phase === "success" ? step + 1 : step}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#f5c044] transition-all"
            style={{
              width: `${((phase === "success" ? step + 1 : step) / words.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </main>
  );
}
