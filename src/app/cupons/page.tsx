import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSessao } from "@/lib/auth";
import { listarCupons } from "@/lib/cupons";
import { Cabecalho, CabecalhoCarregando } from "../cabecalho";
import { MenuPrincipal } from "../menu-principal";
import { CupomItem } from "./cupom-item";
import { ValidarCupom } from "./validar-cupom";

export const metadata: Metadata = {
  title: "Cupons · Cartela Clientes",
};

export default function CuponsPage({ searchParams }: PageProps<"/cupons">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-6 pb-28">
      <Suspense fallback={<CabecalhoCarregando />}>
        <Cabecalho />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Cupons</h1>
        <Link
          href="/cupons/novo"
          className="flex h-11 shrink-0 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          + Novo cupom
        </Link>
      </div>

      <ValidarCupom />

      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <Lista searchParams={searchParams} />
      </Suspense>

      <MenuPrincipal ativo="cupons" />
    </main>
  );
}

async function Lista({ searchParams }: { searchParams: PageProps<"/cupons">["searchParams"] }) {
  const [{ novo }, cupons, { salao }] = await Promise.all([searchParams, listarCupons(), getSessao()]);

  if (cupons.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
        Nenhum cupom ainda. Crie o primeiro para divulgar uma promoção.
      </p>
    );
  }

  return (
    <section aria-labelledby="meus-cupons">
      <h2 id="meus-cupons" className="mb-2 text-sm font-medium text-stone-600 dark:text-stone-400">
        Meus cupons
      </h2>
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
        {cupons.map((c) => (
          <CupomItem key={c.id} cupom={c} salaoNome={salao?.nome ?? "salão"} destaque={c.codigo === novo} />
        ))}
      </ul>
    </section>
  );
}
