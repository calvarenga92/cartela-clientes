"use client";

import { useActionState } from "react";
import { definirSenha, type SenhaState } from "./actions";

const estiloCampo =
  "h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export function FormularioSenha() {
  const [estado, acao, salvando] = useActionState<SenhaState, FormData>(definirSenha, null);

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-medium">Nova senha</label>
        <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required
          aria-describedby="senha-dica" className={estiloCampo} />
        <p id="senha-dica" className="text-xs text-stone-500">Pelo menos 8 caracteres.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmacao" className="text-sm font-medium">Repita a senha</label>
        <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required className={estiloCampo} />
      </div>

      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-rose-700 dark:text-rose-400">
        {estado?.erro}
      </p>

      <button type="submit" disabled={salvando}
        className="h-12 rounded-xl bg-rose-600 text-base font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-70">
        {salvando ? "Salvando…" : "Salvar senha e entrar"}
      </button>
    </form>
  );
}
