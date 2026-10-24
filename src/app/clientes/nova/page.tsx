import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioCliente } from "./formulario-cliente";

export const metadata: Metadata = {
  title: "Nova cliente · Cartela Clientes",
};

export default function NovaClientePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="-ml-2 inline-flex h-11 w-fit items-center rounded-xl px-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
        >
          ← Clientes
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Nova cliente</h1>
      </header>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <FormularioCliente />
      </Suspense>
    </main>
  );
}
