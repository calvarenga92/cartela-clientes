"use client";

import { useState, useTransition } from "react";
import { formatarDesconto } from "@/lib/cupons-formato";
import { desfazerUsoCupom, usarCupom, type ResultadoUso } from "./actions";

export function ValidarCupom() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<ResultadoUso | null>(null);
  const [desfeito, setDesfeito] = useState(false);
  const [pendente, startTransition] = useTransition();

  function usar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || pendente) return;
    setDesfeito(false);
    startTransition(async () => {
      const r = await usarCupom(codigo);
      setResultado(r);
      if (r.ok) setCodigo("");
    });
  }

  function desfazer(usoId: string) {
    startTransition(async () => {
      const r = await desfazerUsoCupom(usoId);
      if (r.ok) setDesfeito(true);
    });
  }

  return (
    <section aria-labelledby="validar" className="rounded-2xl border border-stone-200 p-4 dark:border-stone-800">
      <h2 id="validar" className="mb-3 text-sm font-medium text-stone-600 dark:text-stone-400">
        Cliente trouxe um cupom?
      </h2>
      <form onSubmit={usar} className="flex gap-2">
        <label htmlFor="codigo-cupom" className="sr-only">
          Código do cupom
        </label>
        <input
          id="codigo-cupom"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 font-mono text-base tracking-wider text-stone-900 uppercase outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <button
          type="submit"
          disabled={pendente || !codigo.trim()}
          className="h-12 shrink-0 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {pendente ? "…" : "Usar cupom"}
        </button>
      </form>

      <div aria-live="polite">
        {resultado && !resultado.ok && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            {resultado.erro}
          </p>
        )}
        {resultado?.ok && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40">
            {desfeito ? (
              <span>Uso do {resultado.codigo} desfeito.</span>
            ) : (
              <>
                <span>
                  <strong className="font-mono">{resultado.codigo}</strong> aplicado:{" "}
                  <strong>{formatarDesconto(resultado.tipo, resultado.valor)}</strong> de desconto
                  {resultado.limite !== null && ` · uso ${resultado.usos} de ${resultado.limite}`}
                </span>
                <button
                  type="button"
                  onClick={() => desfazer(resultado.usoId)}
                  disabled={pendente}
                  className="h-10 shrink-0 rounded-lg px-3 font-semibold underline-offset-2 hover:underline disabled:opacity-60"
                >
                  Desfazer
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
