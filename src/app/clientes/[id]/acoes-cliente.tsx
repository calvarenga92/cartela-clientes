"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { gerarChaveIdempotencia } from "@/lib/chave-idempotencia";
import { desfazerAtendimento, registrarAtendimento, usarPremio } from "../actions";

type Aviso = { texto: string; visitaId?: string; tipo: "sucesso" | "erro" };

const TEMPO_AVISO_MS = 8000;

export function AcoesCliente({
  clienteId,
  nome,
  indicadoraNome,
  premioCartelaId,
}: {
  clienteId: string;
  nome: string;
  indicadoraNome: string | null;
  premioCartelaId: string | null;
}) {
  const [pendente, startTransition] = useTransition();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [confirmandoPremio, setConfirmandoPremio] = useState(false);

  // Só troco a chave depois de um sucesso: um novo toque após falha de rede reaproveita a mesma.
  const chave = useRef<string | null>(null);
  // Trava síncrona contra toque duplo antes do "pendente" atualizar.
  const enviando = useRef(false);

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), TEMPO_AVISO_MS);
    return () => clearTimeout(timer);
  }, [aviso]);

  function executar(acao: () => Promise<void>) {
    if (enviando.current) return;
    enviando.current = true;
    startTransition(async () => {
      try {
        await acao();
      } finally {
        enviando.current = false;
      }
    });
  }

  function registrar() {
    executar(async () => {
      chave.current ??= gerarChaveIdempotencia();
      const r = await registrarAtendimento(clienteId, chave.current);
      if (!r.ok) {
        setAviso({ texto: r.erro, tipo: "erro" });
        return;
      }
      chave.current = null;

      const progresso = r.cartela ? `${r.cartela.carimbos}/${r.cartela.meta_carimbos}` : "";
      const completou = r.cartela?.status === "completa";
      const texto =
        r.origem === "indicacao"
          ? `Primeira visita de ${nome}: o carimbo foi para ${indicadoraNome ?? "quem indicou"} (indicação) · ${progresso}`
          : `Carimbo para ${nome}: ${progresso}${completou ? " · Cartela completa! 🎉" : ""}`;
      setAviso({ texto, visitaId: r.visitaId, tipo: "sucesso" });
    });
  }

  function resgatar() {
    if (!premioCartelaId) return;
    executar(async () => {
      const r = await usarPremio(premioCartelaId);
      setConfirmandoPremio(false);
      if (!r.ok) {
        setAviso({ texto: r.erro, tipo: "erro" });
        return;
      }
      setAviso({ texto: "Prêmio usado. A próxima visita começa uma cartela nova.", visitaId: r.visitaId, tipo: "sucesso" });
    });
  }

  function desfazer(visitaId: string) {
    executar(async () => {
      const r = await desfazerAtendimento(visitaId);
      setAviso(r.ok ? { texto: "Desfeito.", tipo: "sucesso" } : { texto: r.erro ?? "Erro ao desfazer.", tipo: "erro" });
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {premioCartelaId && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/40">
            {!confirmandoPremio ? (
              <>
                <p className="font-medium">{nome} tem um prêmio disponível 🎉</p>
                <button
                  type="button"
                  onClick={() => setConfirmandoPremio(true)}
                  disabled={pendente}
                  className="mt-3 h-11 w-full rounded-xl border border-rose-600 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-900"
                >
                  Usar prêmio
                </button>
              </>
            ) : (
              <>
                <p className="font-medium">Confirmar uso do prêmio de {nome}?</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">Esse atendimento não gera carimbo.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoPremio(false)}
                    className="h-11 rounded-xl border border-stone-300 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={resgatar}
                    disabled={pendente}
                    className="h-11 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {pendente ? "Usando…" : "Confirmar"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={registrar}
          disabled={pendente}
          className="h-14 rounded-2xl bg-rose-600 text-lg font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-70"
        >
          {pendente ? "Registrando…" : "Registrar atendimento"}
        </button>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-6">
        {aviso && (
          <div
            role={aviso.tipo === "erro" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${
              aviso.tipo === "erro" ? "bg-rose-700 text-white" : "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
            }`}
          >
            <span>{aviso.texto}</span>
            {aviso.visitaId && (
              <button
                type="button"
                onClick={() => desfazer(aviso.visitaId!)}
                disabled={pendente}
                className="h-10 shrink-0 rounded-lg px-3 font-semibold underline-offset-2 hover:underline disabled:opacity-60"
              >
                Desfazer
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
