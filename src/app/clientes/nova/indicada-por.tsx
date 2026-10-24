"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Opcao = { id: string; nome: string };

export function IndicadaPor() {
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [escolhida, setEscolhida] = useState<Opcao | null>(null);
  const listaId = useId();

  const buscaAtiva = !escolhida && termo.trim().length >= 2;
  const opcoesVisiveis = buscaAtiva ? opcoes : [];

  useEffect(() => {
    if (!buscaAtiva) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      const { data } = await createClient().rpc("buscar_clientes", { p_termo: termo });
      // Descarto resposta de busca antiga que chegar atrasada.
      if (!cancelado) setOpcoes((data ?? []).slice(0, 5).map(({ id, nome }) => ({ id, nome })));
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termo, buscaAtiva]);

  if (escolhida) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Indicada por</span>
        <div className="flex h-12 items-center justify-between rounded-xl border border-stone-300 bg-stone-50 pr-1 pl-4 dark:border-stone-700 dark:bg-stone-900">
          <span className="truncate">{escolhida.nome}</span>
          <button
            type="button"
            onClick={() => {
              setEscolhida(null);
              setTermo("");
            }}
            className="h-10 rounded-lg px-3 text-sm text-stone-600 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            Remover
          </button>
        </div>
        <input type="hidden" name="indicada_por_id" value={escolhida.id} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="indicada-por" className="text-sm font-medium">
        Indicada por <span className="font-normal text-stone-500">(opcional)</span>
      </label>
      <input
        id="indicada-por"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Buscar cliente que indicou"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        aria-controls={listaId}
        aria-expanded={opcoesVisiveis.length > 0}
        className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
      />
      {opcoesVisiveis.length > 0 && (
        <ul id={listaId} className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
          {opcoesVisiveis.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setEscolhida(o)}
                className="flex h-12 w-full items-center px-4 text-left hover:bg-stone-50 dark:hover:bg-stone-900"
              >
                {o.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
