"use client";

import { useEffect, useRef } from "react";
import type { User } from "@telegram-apps/types";
import { useTelegram } from "@/providers/telegram-provider";
import { useStore } from "@/store/use-store";
import { useLang, type Lang } from "@/store/use-lang";
import { fetchStateApi, saveStateApi } from "@/lib/profile-sync";
import { setStorageNamespace, migrateStorageNamespace } from "@/games/storage";
import { getTelegramUser, getInitDataRaw } from "@/lib/telegram";

const LANGS: Lang[] = ["ru", "en", "tt"];

interface Identity {
  tgId: string;
  firstName: string;
  username: string;
  initData?: string;
}

/** Достаём пользователя из сырого initData (fallback, если объект user недоступен). */
function parseUserFromRaw(raw?: string): User | undefined {
  try {
    if (!raw) return undefined;
    const u = new URLSearchParams(raw).get("user");
    if (!u) return undefined;
    const parsed = JSON.parse(u) as Partial<User>;
    if (parsed && typeof parsed.id === "number") return parsed as User;
  } catch {
    /* ignore */
  }
  return undefined;
}

function resolveIdentity(
  ctxUser: User | undefined,
  ctxRaw: string | undefined,
): Identity {
  const raw = ctxRaw ?? getInitDataRaw();
  const user = ctxUser ?? getTelegramUser() ?? parseUserFromRaw(raw);
  if (user && typeof user.id === "number") {
    return {
      tgId: String(user.id),
      firstName: user.first_name ?? "",
      username: user.username ?? "",
      initData: raw,
    };
  }
  return { tgId: "demo", firstName: "", username: "", initData: raw };
}

function buildSnapshot(): Record<string, unknown> {
  const s = useStore.getState();
  return {
    v: 1,
    points: s.points,
    streak: s.streak,
    lastDay: s.lastDay,
    dailyTasks: s.dailyTasks,
    dailyTasksDay: s.dailyTasksDay,
    completedTasks: s.completedTasks,
    completedTopics: s.completedTopics,
    achievements: s.achievements,
    shopPurchases: s.shopPurchases,
    gamesPlayed: s.gamesPlayed,
    userLevel: s.userLevel,
    muted: s.muted,
    kbdHintShown: s.kbdHintShown,
    chatMessages: s.chatMessages.slice(-40),
    lang: useLang.getState().lang,
  };
}

/** Есть ли в серверном снапшоте осмысленные данные (а не пустой профиль). */
function hasServerData(data: Record<string, unknown>): boolean {
  if (typeof data.userLevel === "string" && data.userLevel) return true;
  if (Array.isArray(data.completedTasks) && data.completedTasks.length > 0) return true;
  if (Array.isArray(data.completedTopics) && data.completedTopics.length > 0) return true;
  if (typeof data.points === "number" && data.points > 0) return true;
  if (typeof data.gamesPlayed === "number" && data.gamesPlayed > 0) return true;
  return false;
}

function wipeLegacySharedKeys(): void {
  try {
    // Старые общие ключи (до per-аккаунт изоляции): удаляем, чтобы чужой
    // прогресс никогда не подхватился ни одним аккаунтом.
    window.localStorage.removeItem("tatarcha-store");
    window.localStorage.removeItem("tatarcha-lang");
  } catch {
    /* ignore */
  }
}

/**
 * Привязка профиля к TG-аккаунту и синхронизация с БД.
 * Каждый TG id получает свои ключи localStorage и свою строку в БД —
 * два аккаунта на одном устройстве больше не видят данные друг друга.
 */
export function SyncManager() {
  const { user, initDataRaw } = useTelegram();
  const bootedFor = useRef<string | null>(null);
  const booting = useRef(false);
  const identity = useRef<Identity>({ tgId: "demo", firstName: "", username: "", initData: undefined });

  // Дебаунс сохранений при любых изменениях сторов
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      const { profileReady } = useStore.getState();
      if (!profileReady || booting.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const id = identity.current;
        void saveStateApi(id.tgId, buildSnapshot(), id.firstName, id.username, id.initData);
      }, 1500);
    };
    const unsubStore = useStore.subscribe(schedule);
    const unsubLang = useLang.subscribe(schedule);
    const flush = () => {
      const id = identity.current;
      if (!useStore.getState().profileReady) return;
      void saveStateApi(id.tgId, buildSnapshot(), id.firstName, id.username, id.initData);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      if (timer) clearTimeout(timer);
      unsubStore();
      unsubLang();
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // Загрузка профиля при появлении TG identity
  useEffect(() => {
    const id = resolveIdentity(user, initDataRaw);
    if (bootedFor.current === id.tgId || booting.current) return;
    booting.current = true;
    identity.current = id;

    (async () => {
      const store = useStore.getState();
      // Сразу гасим готовность: пока идёт привязка, модалка и экраны
      // не должны показывать состояние прошлого аккаунта.
      store.setProfileReady(false);
      store.setTgId(id.tgId);
      store.setName(id.firstName || (id.username ? `@${id.username}` : "") || store.name || "Ученик");
      // Чистим память от данных прошлого аккаунта, затем подхватываем per-user кэши
      store.resetProfileData();
      useStore.persist.setOptions({ name: `tatarcha-store:${id.tgId}` });
      useLang.persist.setOptions({ name: `tatarcha-lang:${id.tgId}` });
      useLang.setState({ lang: "ru" });
      try {
        await useStore.persist.rehydrate();
        await useLang.persist.rehydrate();
      } catch {
        /* повреждённый кэш — стартуем с дефолта */
      }
      setStorageNamespace(`tg${id.tgId}`);
      migrateStorageNamespace(`tg${id.tgId}`);
      wipeLegacySharedKeys();

      const snap = await fetchStateApi(id.tgId, id.initData);
      if (snap && snap.exists && hasServerData(snap.data)) {
        useStore.getState().applyServerSnapshot(snap.data);
        const lang = snap.data.lang;
        if (typeof lang === "string" && (LANGS as string[]).includes(lang)) {
          useLang.getState().setLang(lang as Lang);
        }
      } else {
        // Новый аккаунт (или пусто в БД) — публикуем локальное состояние
        await saveStateApi(id.tgId, buildSnapshot(), id.firstName, id.username, id.initData);
      }
      bootedFor.current = id.tgId;
      booting.current = false;
      useStore.getState().setProfileReady(true);
    })().catch(() => {
      booting.current = false;
      useStore.getState().setProfileReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, initDataRaw]);

  return null;
}
