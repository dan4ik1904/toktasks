"use client";

import { use } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Volume2, X } from "lucide-react";
import { getIsland, ISLANDS } from "@/data/islands";
import { checkViaApi, sttRecognize, translateViaApi, ttsSpeak } from "@/lib/api";
import { useProgress, XP_PER_LESSON } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import { TaskNumbers } from "@/components/task-numbers";
import { AIOrb } from "@/components/ai-orb";
import { VoiceButton } from "@/components/voice-button";

function speak(text: string) {
  void ttsSpeak(text);
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

type Phase = "task" | "success" | "fail" | "finished";

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
  const [phase, setPhase] = useState<Phase>("task");
  const [doneSteps, setDoneSteps] = useState<boolean[]>([]);
  const [maxReached, setMaxReached] = useState(0);
  const [showRu, setShowRu] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [liveTt, setLiveTt] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!island) notFound();

  const lesson =
    island.lessons.find((l) => !isCompleted(l.id)) ??
    island.lessons[island.lessons.length - 1];
  const words = lesson.words;
  const word = words[Math.min(step, words.length - 1)];
  const islandIndex = ISLANDS.findIndex((i) => i.slug === slug);

  function markDone(i: number) {
    setDoneSteps((d) => {
      const next = [...d];
      next[i] = true;
      return next;
    });
    setMaxReached((m) => Math.max(m, Math.min(i + 1, words.length - 1)));
  }

  function next() {
    markDone(step);
    if (step + 1 >= words.length) {
      completeLesson(lesson.id);
      setPhase("finished");
    } else {
      setStep(step + 1);
      setPhase("task");
      setShowRu(false);
      setLiveTt(null);
      setHeard("");
    }
  }

  function select(i: number) {
    setStep(i);
    setHeard("");
    setShowRu(false);
    setLiveTt(null);
    setPhase(doneSteps[i] ? "success" : "task");
  }

  async function handleTranscript(said: string) {
    const ok = await checkViaApi(word.tt, said);
    setHeard(said);
    setPhase(ok ? "success" : "fail");
    if (ok) setShowRu(true);
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
    } catch {
      finishRecording();
    }
  }

  function finishRecording() {
    setListening(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || "audio/webm",
    });
    chunksRef.current = [];
    if (blob.size === 0) {
      setPhase("fail");
      return;
    }
    sttRecognize(blob).then(handleTranscript).catch(() => {
      // Tatsoft недоступен — пробуем Web Speech, иначе повтор за диктором.
      webSpeechFallback();
    });
  }

  function webSpeechFallback() {
    const rec = createRecognizer();
    if (!rec) {
      speak(word.tt);
      setShowRu(true);
      setPhase("success");
      return;
    }
    let got = false;
    rec.onresult = (e) => {
      got = true;
      void handleTranscript(e.results[0][0].transcript);
    };
    rec.onerror = () => {
      if (!got) setPhase("fail");
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
      setPhase("fail");
    }
  }

  async function listen() {
    if (listening) {
      // Повторный тап — закончить запись досрочно.
      stopRecording();
      return;
    }
    // Основной путь: запись -> Tatsoft STT -> /api/check.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = finishRecording;
      rec.start();
      setListening(true);
      setHeard("");
      window.setTimeout(() => {
        if (recorderRef.current === rec) stopRecording();
      }, 8000);
    } catch {
      // Нет микрофона — Web Speech или повтор за диктором.
      setListening(true);
      webSpeechFallback();
    }
  }

  async function showTranslation() {
    if (showRu) {
      setShowRu(false);
      return;
    }
    setShowRu(true);
    if (liveTt !== null) return;
    setTranslating(true);
    const t = await translateViaApi(word.ru, "ru", "tt");
    setTranslating(false);
    if (t) setLiveTt(t);
  }

  if (phase === "finished") {
    return (
      <main className="flex w-full flex-1 flex-col items-center gap-4 px-4 pt-10 pb-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-[#f5c044]/15 text-4xl">
          <span role="img" aria-label="Праздник">
            🎉
          </span>
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
    <>
      {/* 1. Хедер (fixed): Назад, название, выход */}
      <header className="fixed top-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-b border-[#1c4d3a] bg-[#04150f]/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            aria-label="Назад к островам"
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <p className="flex items-center gap-2 font-semibold">
            <IslandIcon icon={island.icon} className="size-5 text-[#f5c044]" />
            {island.title}
          </p>
          <Link
            href="/"
            aria-label="Выйти из урока"
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/5"
          >
            <X className="size-5" aria-hidden />
          </Link>
        </div>
        {/* 2. Номера заданий (fixed): скролл, клик → переход */}
        <div className="pt-1 pb-2">
          <TaskNumbers
            total={words.length}
            current={step}
            done={doneSteps}
            maxReached={maxReached}
            onSelect={select}
          />
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-36 pb-6">
        {/* 3. Круглый ИИ-помощник */}
        <AIOrb
          icon={island.icon}
          guide={island.guide}
          active={listening || phase === "success"}
        />

        {/* 4. Речь ИИ: татарский + перевод */}
        <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => speak(word.tt)}
              aria-label="Прослушать фразу"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl hover:bg-white/10"
            >
              <span role="img" aria-hidden>
                🔊
              </span>
            </button>
            <p className="flex-1 text-center text-lg font-semibold text-balance">
              {word.tt}
            </p>
            <button
              onClick={() => speak(word.tt)}
              aria-label="Прослушать фразу"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl hover:bg-white/10"
            >
              <span role="img" aria-hidden>
                🔊
              </span>
            </button>
          </div>
          {(showRu || phase !== "task") && (
            <p className="pt-2 text-center text-sm text-[#9db8a8]">
              {word.ru}
              {word.transcription ? ` · ${word.transcription}` : ""}
              {showRu && liveTt && liveTt !== word.tt && (
                <span className="block pt-1 text-[#34d399]">
                  Tatsoft: {liveTt}
                </span>
              )}
              {showRu && translating && (
                <span className="block pt-1">Перевожу через Tatsoft…</span>
              )}
            </p>
          )}
        </section>

        {/* 5–7. Задание / кнопки / фидбек */}
        {phase === "task" && (
          <>
            <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4 text-center">
              <p className="font-semibold">Скажи по-татарски:</p>
              <p className="pt-1 text-sm text-[#9db8a8]">«{word.ru}»</p>
            </section>
            <div className="flex gap-2">
              <VoiceButton variant="mic" onClick={listen} listening={listening} />
              <VoiceButton variant="translate" onClick={showTranslation} />
              <VoiceButton
                variant="help"
                onClick={() => {
                  setShowRu(true);
                  setPhase("success");
                }}
              />
            </div>
          </>
        )}

        {phase === "success" && (
          <section className="flex items-center justify-between gap-2 rounded-2xl border border-[#34d399]/60 bg-[#0e9f6e]/20 p-3 pl-4">
            <p className="flex items-center gap-2 font-semibold">
              <span
                className="flex size-8 items-center justify-center rounded-full border-2 border-[#34d399] text-lg"
                role="img"
                aria-label="Правильно"
              >
                ✅
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

        {phase === "fail" && (
          <section className="flex flex-col gap-3 rounded-2xl border border-red-400/50 bg-red-500/10 p-4">
            <p className="flex items-center gap-2 font-semibold">
              <span className="text-lg" role="img" aria-label="Не совсем">
                ❌
              </span>
              Не совсем так
            </p>
            <p className="text-sm text-[#9db8a8]">
              {heard ? (
                <>
                  Услышал: «{heard}». Нужно: «{word.tt}»
                </>
              ) : (
                <>
                  Не расслышал. Послушай диктора{" "}
                  <button
                    onClick={() => speak(word.tt)}
                    className="inline-flex items-center gap-1 text-[#34d399] underline"
                  >
                    <Volume2 className="size-4" aria-hidden /> слушать
                  </button>{" "}
                  и попробуй ещё.
                </>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPhase("task")}
                className="h-11 flex-1 rounded-xl bg-[#0e9f6e] text-sm font-semibold text-white"
              >
                Ещё раз
              </button>
              <button
                onClick={next}
                className="h-11 flex-1 rounded-xl border border-[#1c4d3a] text-sm"
              >
                Дальше
              </button>
            </div>
          </section>
        )}

        {/* 8. Прогресс внизу */}
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
            aria-valuenow={phase === "task" ? step : step + 1}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#f5c044] transition-all"
              style={{
                width: `${((phase === "task" ? step : step + 1) / words.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
