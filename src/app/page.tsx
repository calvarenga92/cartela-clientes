import Link from "next/link";
import { Suspense } from "react";
import { getSessao } from "@/lib/auth";
import { BuscaClientes } from "./busca-clientes";
import { ListaClientes, ListaClientesCarregando } from "./lista-clientes";
import { sair } from "./login/actions";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-6 pb-28">
      <Suspense fallback={<CabecalhoCarregando />}>
        <Cabecalho />
      </Suspense>

      <Suspense fallback={<div className="h-12 rounded-xl bg-stone-100 dark:bg-stone-900" />}>
        <BuscaClientes />
      </Suspense>

      <Suspense fallback={<ListaClientesCarregando />}>
        <Resultados searchParams={searchParams} />
      </Suspense>

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-background/90 px-4 py-4 backdrop-blur dark:border-stone-800">
        <Link
          href="/clientes/nova"
          className="mx-auto flex h-12 w-full max-w-md items-center justify-center rounded-xl bg-rose-600 text-base font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          + Nova cliente
        </Link>
      </div>
    </main>
  );
}

async function Resultados({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { q } = await searchParams;
  const termo = typeof q === "string" ? q : "";
  return <ListaClientes termo={termo} />;
}

async function Cabecalho() {
  const { email, salao, admin } = await getSessao();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {salao?.nome ?? "Salão não configurado"}
        </h1>
        <p className="truncate text-sm text-stone-600 dark:text-stone-400">{email}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        {admin && (
          <Link
            href="/admin"
            className="flex h-11 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium transition hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            Admin
          </Link>
        )}
        <form action={sair}>
          <button
            type="submit"
            className="h-11 rounded-xl border border-stone-300 px-4 text-sm font-medium transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}

function CabecalhoCarregando() {
  return (
    <header className="flex items-start justify-between gap-4" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-4 w-52 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      <div className="h-11 w-16 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
    </header>
  );
}
