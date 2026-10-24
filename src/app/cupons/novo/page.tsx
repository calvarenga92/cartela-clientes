import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCupom } from "./formulario-cupom";

export const metadata: Metadata = {
  title: "Novo cupom · Cartela Clientes",
};

export default function NovoCupomPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/cupons"
          className="-ml-2 inline-flex h-11 w-fit items-center rounded-xl px-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
        >
          ← Cupons
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Novo cupom</h1>
      </header>
      <FormularioCupom />
    </main>
  );
}
