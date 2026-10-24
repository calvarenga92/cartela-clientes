import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvisoLink } from "./aviso-link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · Cartela Clientes",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Cartela Clientes</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Entre para registrar atendimentos.
          </p>
        </div>
        <Suspense fallback={null}>
          <AvisoLink />
        </Suspense>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
          Primeiro acesso?{" "}
          <Link href="/primeiro-acesso" className="font-semibold text-rose-700 dark:text-rose-400">
            Peça aqui
          </Link>
        </p>
      </div>
    </main>
  );
}
