"use client";

import { useActionState } from "react";
import { entrar, type LoginState } from "./actions";

export function LoginForm() {
  const [estado, acao, enviando] = useActionState<LoginState, FormData>(entrar, null);

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={estado?.email}
          aria-invalid={Boolean(estado?.erro)}
          aria-describedby={estado?.erro ? "login-erro" : undefined}
          className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-medium">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(estado?.erro)}
          aria-describedby={estado?.erro ? "login-erro" : undefined}
          className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>

      <p id="login-erro" role="alert" aria-live="polite" className="min-h-5 text-sm text-rose-700 dark:text-rose-400">
        {estado?.erro}
      </p>

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-xl bg-rose-600 text-base font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
