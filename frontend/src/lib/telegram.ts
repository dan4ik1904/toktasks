import {
  hapticFeedback,
  retrieveLaunchParams,
  retrieveRawInitData,
} from "@telegram-apps/sdk-react";
import type { User } from "@telegram-apps/types";

/** True, если код выполняется внутри Telegram Mini App. Не бросает исключений. */
export function isTelegramEnv(): boolean {
  if (typeof window === "undefined") return false;
  try {
    retrieveLaunchParams();
    return true;
  } catch {
    return false;
  }
}

/** Пользователь из launch params либо undefined вне Telegram. */
export function getTelegramUser(): User | undefined {
  try {
    return retrieveLaunchParams().tgWebAppData?.user;
  } catch {
    return undefined;
  }
}

/** Сырой initData (для заголовка Authorization к бэкенду). */
export function getInitDataRaw(): string | undefined {
  try {
    return retrieveRawInitData();
  } catch {
    return undefined;
  }
}

/** Схема ОС; по умолчанию dark — приложение тёмное. */
export function getColorScheme(): "dark" | "light" {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return "dark";
}

/** Короткая вибрация; вне Telegram — no-op. */
export function haptic(style: "light" | "medium" | "heavy" = "light"): void {
  try {
    if (hapticFeedback.isSupported()) hapticFeedback.impactOccurred(style);
  } catch {
    /* ignore */
  }
}
