import type { Metadata } from "next";
import Link from "next/link";
import { FormularioSolicitacao } from "./formulario-solicitacao";

export const metadata: Metadata = {
  title: "Primeiro acesso · Cartela Clientes",
};

export default function PrimeiroAcessoPage() {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Primeiro acesso</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Peça acesso para usar a cartela fidelidade no seu salão.
          </p>
        </div>
        <FormularioSolicitacao />
        <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-rose-700 dark:text-rose-400">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
