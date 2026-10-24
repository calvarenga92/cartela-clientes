"use client";

import Link from "next/link";
import { useState } from "react";
import { formatarTelefone } from "@/lib/telefone";
import { linkWhatsApp, mensagemReativacao } from "@/lib/mensagens";
import type { ClienteParaReativar } from "@/lib/reativacao";
import { registrarContato } from "./actions";

type CupomOpcao = { id: string; codigo: string; desconto: string; validade: string | null };

function textoContato(dias: number | null): string | null {
  if (dias === null) return null;
  if (dias === 0) return "chamada hoje";
  if (dias === 1) return "chamada ontem";
  return `chamada há ${dias} dias`;
}

export function ListaReativar({
  clientes,
  cupons,
  salaoNome,
  urlSite,
}: {
  clientes: ClienteParaReativar[];
  cupons: CupomOpcao[];
  salaoNome: string;
  urlSite: string;
}) {
  const [cupomId, setCupomId] = useState("");
  // Marca na hora quem acabou de ser chamada, sem esperar o servidor.
  const [chamadasAgora, setChamadasAgora] = useState<Set<string>>(() => new Set());
  const cupom = cupons.find((c) => c.id === cupomId) ?? null;

  function chamar(clienteId: string) {
    setChamadasAgora((atual) => new Set(atual).add(clienteId));
    // Fire-and-forget: se falhar, o WhatsApp já abriu; perco só o registro.
    void registrarContato(clienteId, cupom?.id ?? null);
  }

  if (clientes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
        Ninguém sumido nesse período. 🎉
      </p>
    );
  }

  return (
    <section aria-labelledby="para-chamar" className="flex flex-col gap-4">
      {cupons.length > 0 && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Incluir cupom na mensagem</span>
          <select
            value={cupomId}
            onChange={(e) => setCupomId(e.target.value)}
            className="h-11 rounded-xl border border-stone-300 bg-background px-3 dark:border-stone-700"
          >
            <option value="">Sem cupom</option>
            {cupons.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {c.desconto}
              </option>
            ))}
          </select>
        </label>
      )}

      <h2 id="para-chamar" className="text-sm font-medium text-stone-600 dark:text-stone-400">
        {clientes.length === 1 ? "1 cliente" : `${clientes.length} clientes`} para chamar
      </h2>

      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
        {clientes.map((c) => {
          const contato = chamadasAgora.has(c.id) ? "chamada agora" : textoContato(c.diasDesdeContato);
          const texto = mensagemReativacao({
            nome: c.nome,
            salao: salaoNome,
            carimbos: c.carimbos,
            meta: c.meta,
            premioDisponivel: c.premioDisponivel,
            link: `${urlSite}/c/${c.tokenPublico}`,
            cupom,
          });

          return (
            <li key={c.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/clientes/${c.id}`} className="block truncate font-medium hover:underline">
                  {c.nome}
                </Link>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {c.nuncaVeio ? `Cadastrada há ${c.diasSemVir} dias, sem visita` : `Última visita há ${c.diasSemVir} dias`}
                </p>
                <p className="text-xs text-stone-500">
                  {c.premioDisponivel ? (
                    <span className="font-medium text-rose-700 dark:text-rose-400">Prêmio esperando</span>
                  ) : (
                    `${c.carimbos}/${c.meta} carimbos`
                  )}
                  {" · "}
                  {formatarTelefone(c.telefone)}
                  {contato && <span className="text-emerald-700 dark:text-emerald-400"> · {contato}</span>}
                </p>
              </div>
              <a
                href={linkWhatsApp(c.telefone, texto)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => chamar(c.id)}
                aria-label={`Chamar ${c.nome} no WhatsApp`}
                className="flex h-11 shrink-0 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                Chamar
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
