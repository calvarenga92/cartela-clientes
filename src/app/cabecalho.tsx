import Link from "next/link";
import { getSessao } from "@/lib/auth";
import { sair } from "./login/actions";

const estiloBotao =
  "flex h-11 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:border-stone-700 dark:hover:bg-stone-800";

// Lê a sessão: quem usa precisa envolver em <Suspense fallback={<CabecalhoCarregando />}>.
export async function Cabecalho() {
  const { email, salao, admin } = await getSessao();

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold tracking-tight">{salao?.nome ?? "Salão não configurado"}</p>
        <p className="truncate text-sm text-stone-600 dark:text-stone-400">{email}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        {admin && (
          <Link href="/admin" className={estiloBotao}>
            Admin
          </Link>
        )}
        <form action={sair}>
          <button type="submit" className={estiloBotao}>
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}

export function CabecalhoCarregando() {
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
