import type { Metadata } from "next";
import { FormularioSenha } from "./formulario-senha";

export const metadata: Metadata = {
  title: "Criar senha · Cartela Clientes",
};

export default function DefinirSenhaPage() {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Crie sua senha</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            É com ela que você vai entrar daqui pra frente.
          </p>
        </div>
        <FormularioSenha />
      </div>
    </main>
  );
}
