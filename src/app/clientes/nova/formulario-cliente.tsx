"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { formatarTelefone } from "@/lib/telefone";
import { atualizarCliente, criarCliente, type CadastroState } from "../actions";
import { IndicadaPor } from "./indicada-por";

const estiloCampo =
  "h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 aria-invalid:border-rose-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

type ClienteEmEdicao = { id: string; nome: string; telefone: string; email: string | null };

// Sem cliente: cadastro. Com cliente: edição (sem indicação e sem consentimento, que são do cadastro).
export function FormularioCliente({ cliente }: { cliente?: ClienteEmEdicao }) {
  const searchParams = useSearchParams();
  const [estado, acao, salvando] = useActionState<CadastroState, FormData>(
    cliente ? atualizarCliente.bind(null, cliente.id) : criarCliente,
    null,
  );
  const erros = estado?.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-5" noValidate>
      <Campo id="nome" label="Nome" erro={erros.nome}>
        <input
          id="nome"
          name="nome"
          autoComplete="off"
          autoCapitalize="words"
          defaultValue={estado?.valores.nome ?? cliente?.nome ?? searchParams.get("nome") ?? ""}
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erros.nome ? "nome-erro" : undefined}
          className={estiloCampo}
        />
      </Campo>

      <Campo id="telefone" label="Telefone (WhatsApp)" erro={erros.telefone}>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="(11) 98888-7777"
          // Deixo não controlado: o React 19 reseta o form depois da action.
          defaultValue={formatarTelefone(estado?.valores.telefone ?? cliente?.telefone ?? searchParams.get("telefone") ?? "")}
          onChange={(e) => {
            e.target.value = formatarTelefone(e.target.value);
          }}
          aria-invalid={Boolean(erros.telefone)}
          aria-describedby={erros.telefone ? "telefone-erro" : undefined}
          className={estiloCampo}
        />
      </Campo>

      <Campo id="email" label="E-mail" opcional erro={erros.email}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          defaultValue={estado?.valores.email ?? cliente?.email ?? ""}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? "email-erro" : undefined}
          className={estiloCampo}
        />
      </Campo>

      {!cliente && <IndicadaPor />}

      {!cliente && (
        <div className="flex flex-col gap-1.5">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="consentimento"
              aria-invalid={Boolean(erros.consentimento)}
              aria-describedby={erros.consentimento ? "consentimento-erro" : undefined}
              className="mt-0.5 size-5 shrink-0 accent-rose-600"
            />
            <span>A cliente autorizou guardar esses dados para o programa de fidelidade.</span>
          </label>
          {erros.consentimento && (
            <p id="consentimento-erro" className="text-sm text-rose-700 dark:text-rose-400">
              {erros.consentimento}
            </p>
          )}
        </div>
      )}

      {erros.geral && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {erros.geral}
        </p>
      )}

      <button
        type="submit"
        disabled={salvando}
        className="h-12 rounded-xl bg-rose-600 text-base font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-70"
      >
        {salvando ? "Salvando…" : cliente ? "Salvar alterações" : "Cadastrar cliente"}
      </button>
    </form>
  );
}

function Campo({
  id,
  label,
  opcional,
  erro,
  children,
}: {
  id: string;
  label: string;
  opcional?: boolean;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {opcional && <span className="font-normal text-stone-500">(opcional)</span>}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="text-sm text-rose-700 dark:text-rose-400">
          {erro}
        </p>
      )}
    </div>
  );
}
