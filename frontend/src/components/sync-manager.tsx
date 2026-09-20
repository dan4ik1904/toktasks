"use client";

import { useEffect, useRef } from "react";
import { useTelegram } from "@/providers/telegram-provider";
import { useStore } from "@/store/use-store";
import { useLang, type Lang } from "@/store/use-lang";
import { fetchStateApi, saveStateApi } from "@/lib/profile-sync";
import { setStorageNamespace } from "@/games/storage";

const LANGS: Lang[] = ["ru", "en", "tt"];

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

/**
 * Привязка профиля к TG-аккаунту и синхронизация с БД.
 * Каждый TG id получает свои ключи localStorage и свою строку в БД —
 * два аккаунта на одном устройстве больше не видят данные друг друга.
 */
export function SyncManager() {
  const { user, initDataRaw } = useTelegram();
  const bootedFor = useRef<string | null>(null);
  const booting = useRef(false);
  const identity = useRef({ tgId: "demo", firstName: "", username: "", initData: undefined as string | undefined });

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
    const tgId = user?.id ? String(user.id) : "demo";
    const firstName = user?.first_name ?? "";
    const username = user?.username ?? "";
    if (bootedFor.current === tgId || booting.current) return;
    booting.current = true;
    identity.current = { tgId, firstName, username, initData: initDataRaw };

    (async () => {
      const store = useStore.getState();
      store.setTgId(tgId);
      store.setName(firstName || (username ? `@${username}` : "") || store.name || "Ученик");
      // Чистим память от данных прошлого аккаунта, затем подхватываем per-user кэши
      store.resetProfileData();
      useStore.persist.setOptions({ name: `tatarcha-store:${tgId}` });
      useLang.persist.setOptions({ name: `tatarcha-lang:${tgId}` });
      try {
        await useStore.persist.rehydrate();
        await useLang.persist.rehydrate();
      } catch {
        /* повреждённый кэш — стартуем с дефолта */
      }
      setStorageNamespace(`tg${tgId}`);

      const snap = await fetchStateApi(tgId, initDataRaw);
      if (snap && snap.exists && hasServerData(snap.data)) {
        useStore.getState().applyServerSnapshot(snap.data);
        const lang = snap.data.lang;
        if (typeof lang === "string" && (LANGS as string[]).includes(lang)) {
          useLang.getState().setLang(lang as Lang);
        }
      } else {
        // Новый аккаунт (или пусто в БД) — публикуем локальное состояние
        await saveStateApi(tgId, buildSnapshot(), firstName, username, initDataRaw);
      }
      bootedFor.current = tgId;
      booting.current = false;
      useStore.getState().setProfileReady(true);
    })().catch(() => {
      booting.current = false;
      useStore.getState().setProfileReady(true);
    });
  }, [user?.id, initDataRaw]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
