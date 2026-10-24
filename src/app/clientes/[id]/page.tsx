import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFichaCliente } from "@/lib/clientes";
import { linkWhatsApp, mensagemCartela } from "@/lib/mensagens";
import { formatarTelefone } from "@/lib/telefone";
import { getUrlSite } from "@/lib/url";
import { AcoesCliente } from "./acoes-cliente";
import { CartelaVisual } from "./cartela-visual";

export default function FichaClientePage({ params }: PageProps<"/clientes/[id]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-6 pb-28">
      <Link
        href="/"
        className="-ml-2 inline-flex h-11 w-fit items-center rounded-xl px-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
      >
        ← Clientes
      </Link>

      <Suspense fallback={<FichaCarregando />}>
        <Ficha params={params} />
      </Suspense>
    </main>
  );
}

async function Ficha({ params }: { params: PageProps<"/clientes/[id]">["params"] }) {
  const { id } = await params;
  const ficha = await getFichaCliente(id);
  if (!ficha) notFound();

  const linkCartela = `${await getUrlSite()}/c/${ficha.tokenPublico}`;
  const whatsapp = linkWhatsApp(
    ficha.telefone,
    mensagemCartela({
      nome: ficha.nome,
      salao: ficha.salaoNome,
      carimbos: ficha.cartela.carimbos.length,
      meta: ficha.cartela.meta,
      premioDisponivel: ficha.premioCartelaId !== null,
      link: linkCartela,
    }),
  );

  return (
    <>
      <header>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{ficha.nome}</h1>
          <Link
            href={`/clientes/${ficha.id}/editar`}
            className="flex h-11 shrink-0 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium transition hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            Editar
          </Link>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {formatarTelefone(ficha.telefone)}
          {ficha.email && ` · ${ficha.email}`}
        </p>
        {ficha.indicadora && (
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Indicada por{" "}
            <Link href={`/clientes/${ficha.indicadora.id}`} className="font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-400">
              {ficha.indicadora.nome}
            </Link>
          </p>
        )}
      </header>

      <CartelaVisual meta={ficha.cartela.meta} carimbos={ficha.cartela.carimbos} />

      <AcoesCliente
        clienteId={ficha.id}
        nome={ficha.nome}
        indicadoraNome={ficha.indicadora?.nome ?? null}
        premioCartelaId={ficha.premioCartelaId}
      />

      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-600 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950"
      >
        Enviar cartela no WhatsApp
      </a>

      <section aria-labelledby="historico">
        <h2 id="historico" className="mb-2 text-sm font-medium text-stone-600 dark:text-stone-400">
          Últimas visitas
        </h2>
        {ficha.visitas.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma visita ainda.</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {ficha.visitas.map((v) => (
              <li key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{formatarData(v.data)}</span>
                {v.tipo === "premio" ? (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    Prêmio
                  </span>
                ) : (
                  <span className="text-stone-500">Atendimento</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// Uso meio-dia para o fuso não voltar a data um dia.
function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function FichaCarregando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-4 w-36 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      <div className="h-14 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}
