"use client";

import Link from "next/link";
import { useActionState } from "react";
import { formatarTelefone } from "@/lib/telefone";
import { solicitarAcesso, type SolicitacaoState } from "./actions";

const estiloCampo =
  "h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 aria-invalid:border-rose-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export function FormularioSolicitacao() {
  const [estado, acao, enviando] = useActionState<SolicitacaoState, FormData>(solicitarAcesso, null);

  if (estado?.enviado) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <p className="font-semibold">Pedido enviado!</p>
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
          Assim que for aprovado, você recebe no WhatsApp um link para criar sua senha.
        </p>
        <Link href="/login" className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-rose-700 dark:text-rose-400">
          Voltar para o login
        </Link>
      </div>
    );
  }

  const erros = estado?.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-5" noValidate>
      <Campo id="nome" label="Seu nome" erro={erros.nome}>
        <input id="nome" name="nome" autoComplete="name" defaultValue={estado?.valores.nome}
          aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? "nome-erro" : undefined} className={estiloCampo} />
      </Campo>

      <Campo id="nome_salao" label="Nome do salão" erro={erros.nomeSalao}>
        <input id="nome_salao" name="nome_salao" autoComplete="organization" defaultValue={estado?.valores.nomeSalao}
          aria-invalid={Boolean(erros.nomeSalao)} aria-describedby={erros.nomeSalao ? "nome_salao-erro" : undefined} className={estiloCampo} />
      </Campo>

      <Campo id="email" label="E-mail" erro={erros.email}>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={estado?.valores.email}
          aria-invalid={Boolean(erros.email)} aria-describedby={erros.email ? "email-erro" : undefined} className={estiloCampo} />
      </Campo>

      <Campo id="telefone" label="WhatsApp" erro={erros.telefone}>
        <input id="telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(11) 98888-7777"
          defaultValue={formatarTelefone(estado?.valores.telefone ?? "")}
          onChange={(e) => {
            e.target.value = formatarTelefone(e.target.value);
          }}
          aria-invalid={Boolean(erros.telefone)} aria-describedby={erros.telefone ? "telefone-erro" : undefined} className={estiloCampo} />
      </Campo>

      {erros.geral && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {erros.geral}
        </p>
      )}

      <button type="submit" disabled={enviando}
        className="h-12 rounded-xl bg-rose-600 text-base font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-70">
        {enviando ? "Enviando…" : "Pedir acesso"}
      </button>
    </form>
  );
}

function Campo({ id, label, erro, children }: { id: string; label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {erro && <p id={`${id}-erro`} className="text-sm text-rose-700 dark:text-rose-400">{erro}</p>}
    </div>
  );
}
