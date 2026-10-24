import type { Metadata } from "next";
import { Suspense } from "react";
import { CartelaVisual } from "@/app/clientes/[id]/cartela-visual";
import type { OrigemCarimbo } from "@/lib/clientes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Minha cartela",
  // Escondo do buscador e do Referer: o link é a chave de acesso.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type CartelaPublica = {
  primeiro_nome: string;
  salao: string;
  meta_carimbos: number;
  carimbos: OrigemCarimbo[];
  premio_disponivel: boolean;
};

export default function CartelaPublicaPage({ params }: PageProps<"/c/[token]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
        <Conteudo params={params} />
      </Suspense>
    </main>
  );
}

async function Conteudo({ params }: { params: PageProps<"/c/[token]">["params"] }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("cartela_publica", { p_token: token });
  const cartela = data as CartelaPublica | null;

  if (!cartela) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold">Cartela não encontrada</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Confira se o link está completo ou peça um novo no salão.
        </p>
      </div>
    );
  }

  const total = cartela.carimbos.length;
  const faltam = Math.max(cartela.meta_carimbos - total, 0);

  return (
    <>
      <header>
        <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{cartela.salao}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Oi, {cartela.primeiro_nome}!</h1>
      </header>

      {cartela.premio_disponivel ? (
        <p className="rounded-2xl bg-rose-600 p-4 text-center font-semibold text-white">
          Você ganhou um serviço grátis! 🎉 É só avisar no próximo atendimento.
        </p>
      ) : (
        <p className="text-stone-700 dark:text-stone-300">
          {faltam === 1 ? "Falta 1 atendimento" : `Faltam ${faltam} atendimentos`} para o seu serviço grátis.
        </p>
      )}

      <CartelaVisual
        meta={cartela.meta_carimbos}
        carimbos={cartela.carimbos.map((origem, i) => ({ id: String(i), origem }))}
      />

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
        <p className="font-semibold">
          <span aria-hidden>★ </span>Indique uma amiga
        </p>
        <p className="mt-1 text-stone-700 dark:text-stone-300">
          Quando ela for atendida pela primeira vez no {cartela.salao}, você ganha um carimbo.
        </p>
      </section>
    </>
  );
}
