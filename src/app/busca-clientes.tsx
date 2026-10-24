"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// Deixo o termo na URL para o "voltar" do celular manter a busca.
export function BuscaClientes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [termo, setTermo] = useState(searchParams.get("q") ?? "");
  const [buscando, startTransition] = useTransition();
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const url = termo.trim() ? `/?q=${encodeURIComponent(termo.trim())}` : "/";
      startTransition(() => router.replace(url, { scroll: false }));
    }, 250);
    return () => clearTimeout(timer);
  }, [termo, router]);

  return (
    <div className="relative">
      <label htmlFor="busca" className="sr-only">
        Buscar cliente por nome ou telefone
      </label>
      <input
        id="busca"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Buscar por nome ou telefone"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 pr-10 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
      />
      {buscando && (
        <span
          aria-hidden
          className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-stone-300 border-t-rose-600"
        />
      )}
    </div>
  );
}
