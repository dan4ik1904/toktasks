"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        const ok = await register(username, password, displayName);
        if (!ok) setError("Имя пользователя уже занято");
      } else {
        const ok = await login(username, password);
        if (!ok) setError("Неверное имя пользователя или пароль");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center px-6 pt-12 pb-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-5xl">⛵</span>
          <h1 className="mt-4 text-3xl font-black">Татар.Уку</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {isRegister ? "Создай аккаунт и начни учить татарский" : "Войди, чтобы продолжить"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegister && (
            <input
              type="text"
              placeholder="Как тебя зовут?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              required
            />
          )}
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
          />

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_var(--accent-deep)] transition active:translate-y-1 active:shadow-none disabled:opacity-60"
          >
            {loading ? "…" : isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="font-bold text-[var(--accent)] underline"
          >
            {isRegister ? "Войти" : "Зарегистрироваться"}
          </button>
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
          <p className="mb-2 font-bold text-[var(--fg)]">Демо-аккаунты:</p>
          <p><code>alina_tatar</code> / <code>tatar123</code> — 8 уроков</p>
          <p><code>timur_kazan</code> / <code>kazan456</code> — 15 уроков</p>
          <p><code>dashulya</code> / <code>dashulya789</code> — 5 уроков</p>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          <Link href="/" className="underline">Пропустить и учить без аккаунта →</Link>
        </p>
      </div>
    </main>
  );
}
