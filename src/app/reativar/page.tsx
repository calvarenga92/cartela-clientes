import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSessao } from "@/lib/auth";
import { formatarDesconto, formatarValidade, listarCupons } from "@/lib/cupons";
import { lerDias, listarParaReativar, OPCOES_DIAS, resumoReativacao } from "@/lib/reativacao";
import { getUrlSite } from "@/lib/url";
import { Cabecalho, CabecalhoCarregando } from "../cabecalho";
import { MenuPrincipal } from "../menu-principal";
import { ListaReativar } from "./lista-reativar";

export const metadata: Metadata = {
  title: "Reativar · Cartela Clientes",
};

export default function ReativarPage({ searchParams }: PageProps<"/reativar">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-6 pb-28">
      <Suspense fallback={<CabecalhoCarregando />}>
        <Cabecalho />
      </Suspense>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chamar de volta</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Clientes que não aparecem há um tempo. Um toque abre o WhatsApp com a mensagem pronta.
        </p>
      </div>

      <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <Resumo />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>

      <MenuPrincipal ativo="reativar" />
    </main>
  );
}

async function Resumo() {
  const { chamadas, voltaram } = await resumoReativacao();
  if (chamadas === 0) return null;

  return (
    <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
      Nos últimos 30 dias você chamou <strong>{chamadas}</strong> {chamadas === 1 ? "cliente" : "clientes"} e{" "}
      <strong>{voltaram}</strong> {voltaram === 1 ? "voltou" : "voltaram"}.
    </p>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/reativar">["searchParams"] }) {
  const dias = lerDias((await searchParams).dias);
  const [clientes, cupons, { salao }, urlSite] = await Promise.all([
    listarParaReativar(dias),
    listarCupons(),
    getSessao(),
    getUrlSite(),
  ]);

  const cuponsAtivos = cupons
    .filter((c) => c.status === "ativo")
    .map((c) => ({
      id: c.id,
      codigo: c.codigo,
      desconto: formatarDesconto(c.tipo, c.valor),
      validade: c.validade ? formatarValidade(c.validade) : null,
    }));

  return (
    <>
      <nav aria-label="Tempo sem vir" className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600 dark:text-stone-400">Sem vir há mais de</span>
        {OPCOES_DIAS.map((opcao) => {
          const atual = opcao === dias;
          return (
            <Link
              key={opcao}
              href={`/reativar?dias=${opcao}`}
              aria-current={atual ? "true" : undefined}
              replace
              scroll={false}
              className={`flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 ${
                atual
                  ? "bg-rose-600 text-white"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              }`}
            >
              {opcao} dias
            </Link>
          );
        })}
      </nav>

      <ListaReativar
        clientes={clientes}
        cupons={cuponsAtivos}
        salaoNome={salao?.nome ?? "salão"}
        urlSite={urlSite}
      />
    </>
  );
}
