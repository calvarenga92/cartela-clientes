import { Suspense } from "react";
import { getSessao } from "@/lib/auth";
import { sair } from "./login/actions";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      {/* Lê a sessão (cookies): fica dentro do Suspense por causa do cacheComponents */}
      <Suspense fallback={<CabecalhoCarregando />}>
        <Cabecalho />
      </Suspense>

      <section className="mt-10 rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
        Em breve: busca de clientes e registro de atendimento.
      </section>
    </main>
  );
}

async function Cabecalho() {
  const { email, salao } = await getSessao();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {salao?.nome ?? "Salão não configurado"}
        </h1>
        <p className="truncate text-sm text-stone-600 dark:text-stone-400">{email}</p>
      </div>

      <form action={sair}>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl border border-stone-300 px-4 text-sm font-medium transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Sair
        </button>
      </form>
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
