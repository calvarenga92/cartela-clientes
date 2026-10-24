import Link from "next/link";
import { buscarClientes } from "@/lib/clientes";
import { formatarTelefone, somenteDigitos } from "@/lib/telefone";

export async function ListaClientes({ termo }: { termo: string }) {
  const clientes = await buscarClientes(termo);

  if (clientes.length === 0) {
    const digitos = somenteDigitos(termo);
    const params = new URLSearchParams();
    if (termo && digitos.length >= 8) params.set("telefone", digitos);
    else if (termo) params.set("nome", termo);
    const href = `/clientes/nova${params.size ? `?${params}` : ""}`;

    return (
      <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center dark:border-stone-700">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {termo ? `Nenhuma cliente encontrada para “${termo}”.` : "Nenhuma cliente cadastrada ainda."}
        </p>
        <Link
          href={href}
          className="mt-3 inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
        >
          Cadastrar {termo && !(digitos.length >= 8) ? `“${termo}”` : "cliente"}
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
      {clientes.map((c) => (
        <li key={c.id}>
          <Link
            href={`/clientes/${c.id}`}
            className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none dark:hover:bg-stone-900 dark:focus-visible:bg-stone-900"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{c.nome}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{formatarTelefone(c.telefone)}</p>
            </div>
            {c.premio_disponivel ? (
              <span className="shrink-0 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                Prêmio!
              </span>
            ) : (
              <span
                className="shrink-0 text-sm tabular-nums text-stone-600 dark:text-stone-400"
                aria-label={`${c.carimbos} de ${c.meta_carimbos} carimbos`}
              >
                {c.carimbos}/{c.meta_carimbos}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ListaClientesCarregando() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando clientes">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      ))}
    </div>
  );
}
