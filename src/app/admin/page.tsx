import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SolicitacaoItem } from "./solicitacao-item";

export const metadata: Metadata = {
  title: "Admin · Cartela Clientes",
};

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="-ml-2 inline-flex h-11 w-fit items-center rounded-xl px-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
        >
          ← Início
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Pedidos de acesso</h1>
      </header>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <Solicitacoes />
      </Suspense>
    </main>
  );
}

async function Solicitacoes() {
  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  // Para quem não é admin, a página nem existe.
  if (!ehAdmin) notFound();

  const { data } = await supabase.rpc("listar_solicitacoes");
  const pendentes = (data ?? []).filter((s) => s.status === "pendente");
  const aprovadas = (data ?? []).filter((s) => s.status === "aprovada").slice(0, 10);

  return (
    <>
      <section aria-labelledby="pendentes">
        <h2 id="pendentes" className="mb-2 text-sm font-medium text-stone-600 dark:text-stone-400">
          Pendentes ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
            Nenhum pedido novo.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {pendentes.map((s) => (
              <SolicitacaoItem key={s.id} solicitacao={s} />
            ))}
          </ul>
        )}
      </section>

      {aprovadas.length > 0 && (
        <section aria-labelledby="aprovadas">
          <h2 id="aprovadas" className="mb-2 text-sm font-medium text-stone-600 dark:text-stone-400">
            Aprovadas recentemente
          </h2>
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {aprovadas.map((s) => (
              <SolicitacaoItem key={s.id} solicitacao={s} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
