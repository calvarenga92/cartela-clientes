import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFichaCliente } from "@/lib/clientes";
import { FormularioCliente } from "../../nova/formulario-cliente";

export const metadata: Metadata = {
  title: "Editar cliente · Cartela Clientes",
};

export default function EditarClientePage({ params }: PageProps<"/clientes/[id]/editar">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <Edicao params={params} />
      </Suspense>
    </main>
  );
}

async function Edicao({ params }: { params: PageProps<"/clientes/[id]/editar">["params"] }) {
  const { id } = await params;
  const ficha = await getFichaCliente(id);
  if (!ficha) notFound();

  return (
    <>
      <header className="flex flex-col gap-3">
        <Link
          href={`/clientes/${ficha.id}`}
          className="-ml-2 inline-flex h-11 w-fit items-center rounded-xl px-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
        >
          ← Cancelar
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Editar {ficha.nome}</h1>
        {ficha.indicadora && (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Indicada por {ficha.indicadora.nome}. A indicação não muda depois do cadastro.
          </p>
        )}
      </header>

      <FormularioCliente
        cliente={{ id: ficha.id, nome: ficha.nome, telefone: ficha.telefone, email: ficha.email }}
      />
    </>
  );
}
