"use client";

import { use } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import confetti from "canvas-confetti";
import { ArrowLeft, ArrowRight, Volume2, X } from "lucide-react";
import { getIsland, ISLANDS } from "@/data/islands";
import {
  gradeViaApi,
  prefetchTts,
  refillHeartsApi,
  saveProgressApi,
  spendHeartApi,
  sttRecognize,
  toWav16kMono,
  translateViaApi,
  ttsSpeak,
} from "@/lib/api";
import { useTelegram } from "@/providers/telegram-provider";
import { MAX_HEARTS } from "@/store/use-progress";
import { SpeechBubble, type Speech } from "@/components/speech-bubble";
import { useProgress, XP_PER_LESSON } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import { TaskNumbers } from "@/components/task-numbers";
import { AIOrb } from "@/components/ai-orb";
import { VoiceButton } from "@/components/voice-button";

function speak(text: string, voice = "alsu") {
  void ttsSpeak(text, voice);
}

type SR = {
  lang: string;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function seededRand(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

const PRAISE: Speech[] = [
  { tt: "Дөрес! Бик шәп!", ru: "Правильно! Очень круто!" },
  { tt: "Әйбәт! Дәвам ит!", ru: "Отлично! Продолжай!" },
  { tt: "Шәп! Син булдырасың!", ru: "Класс! У тебя получается!" },
];

const FAREWELL: Speech = {
  tt: "Рәхмәт! Киләсе утрауда очрашабыз!",
  ru: "Спасибо! Увидимся на следующем острове!",
};

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
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [gradeHint, setGradeHint] = useState("");
  const [gradeSyllables, setGradeSyllables] = useState<string[]>([]);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const { initDataRaw } = useTelegram();
  const tgId = useProgress((s) => s.tgId) || "demo";
  const hearts = useProgress((s) => s.hearts);
  const setHearts = useProgress((s) => s.setHearts);
  const applyServer = useProgress((s) => s.applyServer);
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
  const voice = island?.voice ?? "alsu";

  // Титры хранителя: приветствие на входе + попытка автоплея.
  useEffect(() => {
    setSpeech(island.greeting);
    let cancelled = false;
    void ttsSpeak(island.greeting.tt, voice).then((played) => {
      if (!cancelled && !played) setNeedsTap(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Каждую новую реплику духа озвучиваем сразу (после жеста — можно).
  const firstSpeech = useRef(true);
  useEffect(() => {
    if (!speech) return;
    if (firstSpeech.current) {
      firstSpeech.current = false;
      return;
    }
    void ttsSpeak(speech.tt, voice).then((played) => {
      if (!played) setNeedsTap(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech]);

  // Предзагрузка озвучки следующего слова — отвечает мгновенно.
  useEffect(() => {
    const nxt = words[Math.min(step + 1, words.length - 1)];
    if (nxt && nxt.tt !== word.tt) prefetchTts(nxt.tt, voice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function markDone(i: number) {
    setDoneSteps((d) => {
      const next = [...d];
      next[i] = true;
      return next;
    });
    setMaxReached((m) => Math.max(m, Math.min(i + 1, words.length - 1)));
  }

  async function spendHeart() {
    const h = await spendHeartApi(tgId);
    setHearts(h ?? Math.max(0, hearts - 1));
  }

  function next() {
    markDone(step);
    if (step + 1 >= words.length) {
      completeLesson(lesson.id);
      void saveProgressApi(slug, lesson.id, initDataRaw, tgId).then((p) => {
        if (p) applyServer(tgId, p);
      });
      setPhase("finished");
    } else {
      setStep(step + 1);
      setPhase("task");
      setShowRu(false);
      setLiveTt(null);
      setWrongPick(null);
      setFails(0);
      setGradeHint("");
      setGradeSyllables([]);
      setHeard("");
    }
  }

  // Конфетти на финише (с уважением к reduced-motion).
  useEffect(() => {
    if (phase !== "finished") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void confetti({
      particleCount: 130,
      spread: 75,
      origin: { y: 0.3 },
      colors: ["#a87b2f", "#176b5b", "#a34f3d", "#ffffff"],
    });
  }, [phase]);

  // Тип задания: чётные шаги — произношение, нечётные — квиз.
  const taskType = step % 2 === 0 ? "repeat" : "quiz";

  // Варианты квиза: правильный + 3 отвлекающих, порядок стабилен (SSR-safe).
  const quizOptions = useMemo(() => {
    const idx = Math.min(step, words.length - 1);
    const others = words.filter((_, i) => i !== idx);
    const pool = [...others];
    for (const l of island.lessons) {
      for (const w of l.words) {
        if (pool.length >= 3) break;
        if (w.tt !== words[idx].tt && !pool.some((p) => p.tt === w.tt)) pool.push(w);
      }
    }
    const opts = [words[idx], ...pool.slice(0, 3)];
    const rand = seededRand(step * 97 + 13);
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [island, words, step]);

  function pickOption(tt: string) {
    if (tt === word.tt) {
      setWrongPick(null);
      setShowRu(true);
      setSpeech(PRAISE[step % PRAISE.length]);
      setPhase("success");
    } else {
      if (wrongPick === null) void spendHeart();
      setWrongPick(tt);
      setSpeech({ tt: "Юк... Тагын тырыш!", ru: "Нет... Попробуй ещё!" });
    }
  }

  function select(i: number) {
    setStep(i);
    setHeard("");
    setShowRu(false);
    setLiveTt(null);
    setWrongPick(null);
    setFails(0);
    setGradeHint("");
    setGradeSyllables([]);
    setPhase(doneSteps[i] ? "success" : "task");
  }

  async function handleTranscript(said: string) {
    // Строгий судья: LLM (Ollama), иначе Левенштейн. Дух отвечает по-татарски.
    const g = await gradeViaApi(word.tt, said);
    setHeard(said);
    if (g.correct) {
      setFails(0);
      setGradeHint("");
      setGradeSyllables([]);
      setShowRu(true);
      setSpeech(PRAISE[step % PRAISE.length]);
      setPhase("success");
    } else {
      const f = fails + 1;
      setFails(f);
      setGradeHint(g.hint_ru);
      setGradeSyllables(g.syllables);
      setSpeech({ tt: g.hint_tt || g.say_this, ru: g.hint_ru });
      setPhase("fail");
      void spendHeart();
    }
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
    } catch {
      finishRecording();
    }
  }

  async function finishRecording() {
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
    // Конвертируем в WAV 16 кГц моно — иначе старый ASR чаще ошибается.
    const wav = await toWav16kMono(blob).catch(() => blob);
    sttRecognize(wav).then(handleTranscript).catch(() => {
      // Tatsoft недоступен — пробуем Web Speech, иначе повтор за диктором.
      webSpeechFallback();
    });
  }

  function webSpeechFallback() {
    const rec = createRecognizer();
    if (!rec) {
      speak(word.tt, voice);
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
        <span className="flex size-20 items-center justify-center rounded-full bg-[var(--gold-soft)] text-4xl">
          <span role="img" aria-label="Праздник">
            🎉
          </span>
        </span>
        <h1 className="text-2xl font-bold">Остров пройден!</h1>
        <p className="text-[var(--muted)]">
          {lesson.title} · {island.guide} гордится тобой.
        </p>
        <p className="max-w-xs text-sm text-[var(--muted)]">
          «{FAREWELL.tt}» — {FAREWELL.ru}
        </p>
        <p className="rounded-full bg-[var(--gold-soft)] px-4 py-1.5 font-bold text-[var(--gold)]">
          +{XP_PER_LESSON} XP
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 font-semibold text-white"
        >
          К островам <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/assistant" className="text-sm text-[var(--accent)]">
          Спросить Ярдәмче
        </Link>
      </main>
    );
  }

  return (
    <>
      {/* 1. Хедер (fixed): Назад, название, выход */}
      <header className="fixed top-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            aria-label="Назад к островам"
            className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <IslandIcon icon={island.icon} className="size-5 text-[var(--gold)]" />
            {island.title}
            <span
              className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300"
              title="Сердца"
            >
              <span aria-hidden>❤️</span>
              {hearts}
            </span>
          </div>
          <Link
            href="/"
            aria-label="Выйти из урока"
            className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface-2)]"
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

      {/* Нет сердец — пауза (дуолинго-стайл). Финиш уже вернулся раньше. */}
      {hearts <= 0 && (
        <div className="fixed inset-0 z-20 mx-auto flex w-full max-w-md items-center justify-center bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-6xl" role="img" aria-label="Разбитое сердце">
              💔
            </span>
            <h2 className="text-xl font-bold">Сердца закончились!</h2>
            <p className="text-sm text-[var(--muted)]">
              Хранитель ждёт: сердца возвращаются со временем
              или на новом дне — либо пополни сейчас (демо).
            </p>
            <button
              onClick={() =>
                void refillHeartsApi(tgId).then((h) => {
                  if (h !== null) setHearts(h);
                })
              }
              className="h-12 rounded-2xl bg-[#ff5c5c] px-6 font-semibold text-white"
            >
              Пополнить ❤️×{MAX_HEARTS}
            </button>
            <Link href="/" className="text-sm text-[var(--accent)]">
              К островам
            </Link>
          </div>
        </div>
      )}

      <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-36 pb-6">
        {/* 3. Круглый ИИ-помощник */}
        <AIOrb
          icon={island.icon}
          guide={island.guide}
          active={listening || phase === "success"}
        />

        {/* Титры: что говорит хранитель */}
        {speech && <SpeechBubble speech={speech} voice={island.voice} needsTap={needsTap} />}

        {/* 4. Речь ИИ: татарский + перевод */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => speak(word.tt, voice)}
              aria-label="Прослушать фразу"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xl hover:bg-[var(--track)]"
            >
              <span role="img" aria-hidden>
                🔊
              </span>
            </button>
            <p className="flex-1 text-center text-lg font-semibold text-balance">
              {word.tt}
            </p>
            <button
              onClick={() => speak(word.tt, voice)}
              aria-label="Прослушать фразу"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xl hover:bg-[var(--track)]"
            >
              <span role="img" aria-hidden>
                🔊
              </span>
            </button>
          </div>
          {(showRu || phase !== "task") && (
            <p className="pt-2 text-center text-sm text-[var(--muted)]">
              {word.ru}
              {word.transcription ? ` · ${word.transcription}` : ""}
              {showRu && liveTt && liveTt !== word.tt && (
                <span className="block pt-1 text-[var(--accent)]">
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
        {phase === "task" && taskType === "quiz" && (
          <>
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-center">
              <p className="font-semibold">Выбери перевод:</p>
              <button
                onClick={() => speak(word.tt, voice)}
                className="pt-1 text-2xl font-bold text-[var(--gold)]"
                aria-label="Прослушать слово"
              >
                «{word.tt}»
              </button>
            </section>
            <div className="grid grid-cols-1 gap-2">
              {quizOptions.map((o) => (
                <button
                  key={o.tt}
                  onClick={() => pickOption(o.tt)}
                  className={
                    o.tt === wrongPick
                      ? "h-12 rounded-xl border border-red-400/60 bg-red-500/10 text-sm line-through opacity-70"
                      : "h-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm hover:border-[var(--accent)]"
                  }
                >
                  {o.ru}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "task" && taskType === "repeat" && (
          <>
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-center">
              <p className="font-semibold">Скажи по-татарски:</p>
              <p className="pt-1 text-sm text-[var(--muted)]">«{word.ru}»</p>
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
          <section className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--accent)]/60 bg-[var(--accent-soft)] p-3 pl-4">
            <p className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--accent)] text-lg"
                role="img"
                aria-label="Дөрес"
              >
                ✅
              </span>
              <span>
                <span className="block font-semibold">Дөрес! Бик шәп!</span>
                <span className="block text-xs font-normal text-[var(--muted)]">
                  Правильно! Очень круто!
                </span>
              </span>
            </p>
            <button
              onClick={next}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            >
              Дальше <ArrowRight className="size-4" aria-hidden />
            </button>
          </section>
        )}

        {phase === "fail" && (
          <section className="flex flex-col gap-3 rounded-2xl border border-red-400/50 bg-red-500/10 p-4">
            <p className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label="Юк әле">
                ❌
              </span>
              <span>
                <span className="block font-semibold">Юк әле{gradeHint ? "!" : ""}</span>
                {gradeHint && (
                  <span className="block text-xs font-normal text-[var(--muted)]">
                    {gradeHint}
                  </span>
                )}
              </span>
            </p>
            <p className="text-sm text-[var(--muted)]">
              {heard ? (
                <>
                  Услышал: «{heard}». Нужно: «{word.tt}»
                </>
              ) : (
                <>Не расслышал. Послушай и попробуй ещё.</>
              )}
            </p>
            {fails >= 2 && gradeSyllables.length > 0 && (
              <div>
                <p className="pb-1.5 text-xs text-[var(--muted)]">
                  Скажи по слогам (нажми, чтобы услышать):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gradeSyllables.map((s, i) => (
                    <button
                      key={`${s}-${i}`}
                      onClick={() => speak(s, voice)}
                      className="rounded-lg border border-[var(--gold)]/50 bg-[var(--gold-soft)] px-2.5 py-1 text-sm font-semibold text-[var(--gold)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setPhase("task")}
                className="h-11 flex-1 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white"
              >
                Ещё раз
              </button>
              {fails >= 3 ? (
                <button
                  onClick={next}
                  className="h-11 flex-1 rounded-xl border border-[var(--line)] text-sm"
                >
                  Пропустить
                </button>
              ) : (
                <button
                  onClick={() => speak(word.tt, voice)}
                  className="h-11 flex-1 rounded-xl border border-[var(--line)] text-sm"
                >
                  🔊 Послушать
                </button>
              )}
            </div>
          </section>
        )}

        {/* 8. Прогресс внизу */}
        <div className="mt-auto pt-2">
          <p className="pb-2 text-sm">
            Задание {Math.min(step + 1, words.length)} из {words.length}
            <span className="text-[var(--muted)]"> · остров {islandIndex + 1}</span>
          </p>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-[var(--track)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={words.length}
            aria-valuenow={phase === "task" ? step : step + 1}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--gold)] transition-all"
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
