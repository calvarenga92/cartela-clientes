import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BuscaClientes } from "./busca-clientes";
import { Cabecalho, CabecalhoCarregando } from "./cabecalho";
import { ListaClientes, ListaClientesCarregando } from "./lista-clientes";
import { MenuPrincipal } from "./menu-principal";

export const metadata: Metadata = {
  title: "Fidelidade · Cartela Clientes",
};

export default function FidelidadePage({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-6 pb-28">
      <Suspense fallback={<CabecalhoCarregando />}>
        <Cabecalho />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Fidelidade</h1>
        <Link
          href="/clientes/nova"
          className="flex h-11 shrink-0 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          + Nova cliente
        </Link>
      </div>

      <Suspense fallback={<div className="h-12 rounded-xl bg-stone-100 dark:bg-stone-900" />}>
        <BuscaClientes />
      </Suspense>

      <Suspense fallback={<ListaClientesCarregando />}>
        <Resultados searchParams={searchParams} />
      </Suspense>

      <MenuPrincipal ativo="fidelidade" />
    </main>
  );
}

async function Resultados({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { q } = await searchParams;
  const termo = typeof q === "string" ? q : "";
  return <ListaClientes termo={termo} />;
}
