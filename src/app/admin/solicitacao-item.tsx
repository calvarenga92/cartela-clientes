"use client";

import { useState, useTransition } from "react";
import { linkWhatsApp, primeiroNome } from "@/lib/mensagens";
import { formatarTelefone } from "@/lib/telefone";
import { aprovarSolicitacao, recusarSolicitacao } from "./actions";

type Solicitacao = {
  id: string;
  nome: string;
  nome_salao: string;
  email: string;
  telefone: string;
  status: string;
};

export function SolicitacaoItem({ solicitacao }: { solicitacao: Solicitacao }) {
  const [pendente, startTransition] = useTransition();
  const [convite, setConvite] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function aprovar() {
    setErro(null);
    startTransition(async () => {
      const r = await aprovarSolicitacao(solicitacao.id);
      if (r.ok) setConvite(r.link);
      else setErro(r.erro);
    });
  }

  function recusar() {
    startTransition(async () => {
      await recusarSolicitacao(solicitacao.id);
    });
  }

  async function copiar(link: string) {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
  }

  const textoConvite = (link: string) =>
    `Oi, ${primeiroNome(solicitacao.nome)}! Seu acesso à Cartela Clientes foi liberado. ` +
    `Crie sua senha por este link (vale por pouco tempo, use logo):\n\n${link}`;

  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="min-w-0">
        <p className="font-medium">
          {solicitacao.nome} <span className="font-normal text-stone-500">· {solicitacao.nome_salao}</span>
        </p>
        <p className="truncate text-sm text-stone-600 dark:text-stone-400">
          {solicitacao.email} · {formatarTelefone(solicitacao.telefone)}
        </p>
      </div>

      {convite ? (
        <div className="flex flex-col gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <p className="text-sm font-medium">Aprovado. Envie o link para ela criar a senha:</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={linkWhatsApp(solicitacao.telefone, textoConvite(convite))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => copiar(convite)}
              className="h-11 rounded-xl border border-stone-300 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              {copiado ? "Copiado ✓" : "Copiar link"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {solicitacao.status === "pendente" && (
            <button
              type="button"
              onClick={recusar}
              disabled={pendente}
              className="h-11 rounded-xl border border-stone-300 text-sm font-medium hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              Recusar
            </button>
          )}
          <button
            type="button"
            onClick={aprovar}
            disabled={pendente}
            className={`h-11 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 ${
              solicitacao.status === "pendente" ? "" : "col-span-2"
            }`}
          >
            {pendente ? "Aguarde…" : solicitacao.status === "pendente" ? "Aprovar" : "Gerar novo link de senha"}
          </button>
        </div>
      )}

      {erro && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          {erro}
        </p>
      )}
    </li>
  );
}
