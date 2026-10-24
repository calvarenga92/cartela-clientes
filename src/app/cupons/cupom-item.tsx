"use client";

import { useState, useTransition } from "react";
import { formatarDesconto, formatarValidade, type Cupom, type StatusCupom } from "@/lib/cupons-formato";
import { alternarCupomAtivo } from "./actions";

const SELO: Record<StatusCupom, { texto: string; classe: string }> = {
  ativo: { texto: "Ativo", classe: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  vencido: { texto: "Vencido", classe: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300" },
  esgotado: { texto: "Esgotado", classe: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  desativado: { texto: "Desativado", classe: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300" },
};

export function CupomItem({ cupom, salaoNome, destaque }: { cupom: Cupom; salaoNome: string; destaque: boolean }) {
  const [pendente, startTransition] = useTransition();
  const [copiado, setCopiado] = useState(false);
  const desconto = formatarDesconto(cupom.tipo, cupom.valor);
  const usavel = cupom.status === "ativo";

  const texto =
    `Use o cupom ${cupom.codigo} e ganhe ${desconto} de desconto no ${salaoNome}!` +
    (cupom.validade ? ` ${formatarValidade(cupom.validade)}.` : "");

  async function copiar() {
    await navigator.clipboard.writeText(cupom.codigo);
    setCopiado(true);
  }

  return (
    <li className={`flex flex-col gap-3 p-4 ${destaque ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-lg font-semibold tracking-wider">{cupom.codigo}</p>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            <strong>{desconto}</strong> de desconto{cupom.descricao && ` · ${cupom.descricao}`}
          </p>
          <p className="text-xs text-stone-500">
            {formatarValidade(cupom.validade)} ·{" "}
            {cupom.limiteUsos !== null ? `${cupom.usos} de ${cupom.limiteUsos} usos` : `${cupom.usos} usos, sem limite`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${SELO[cupom.status].classe}`}>
          {SELO[cupom.status].texto}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={copiar}
          disabled={!usavel}
          className="h-10 rounded-xl border border-stone-300 text-sm font-medium hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          {copiado ? "Copiado ✓" : "Copiar"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!usavel}
          className={`flex h-10 items-center justify-center rounded-xl border border-emerald-600 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950 ${
            usavel ? "" : "pointer-events-none opacity-40"
          }`}
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => startTransition(async () => void (await alternarCupomAtivo(cupom.id, !cupom.ativo)))}
          disabled={pendente}
          className="h-10 rounded-xl border border-stone-300 text-sm font-medium hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          {cupom.ativo ? "Desativar" : "Reativar"}
        </button>
      </div>
    </li>
  );
}
