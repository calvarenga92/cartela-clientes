"use client";

import { useActionState, useState } from "react";
import { criarCupom, type CupomFormState } from "../actions";

const estiloCampo =
  "h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 aria-invalid:border-rose-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export function FormularioCupom() {
  const [estado, acao, salvando] = useActionState<CupomFormState, FormData>(criarCupom, null);
  const erros = estado?.erros ?? {};
  const v = estado?.valores ?? {};
  // Controlado só para trocar o prefixo do campo de valor (% ou R$) na hora.
  const [tipo, setTipo] = useState(v.tipo || "percentual");

  return (
    <form action={acao} className="flex flex-col gap-5" noValidate>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Tipo de desconto</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { valor: "percentual", rotulo: "Porcentagem (%)" },
            { valor: "valor", rotulo: "Valor fixo (R$)" },
          ].map((opcao) => (
            <label
              key={opcao.valor}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition has-focus-visible:outline-2 has-focus-visible:outline-rose-600 ${
                tipo === opcao.valor
                  ? "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                  : "border-stone-300 dark:border-stone-700"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={opcao.valor}
                checked={tipo === opcao.valor}
                onChange={() => setTipo(opcao.valor)}
                className="sr-only"
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>
        {erros.tipo && <p className="text-sm text-rose-700 dark:text-rose-400">{erros.tipo}</p>}
      </fieldset>

      <Campo id="valor" label="Desconto" erro={erros.valor}>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-stone-500">
            {tipo === "percentual" ? "%" : "R$"}
          </span>
          <input
            id="valor"
            name="valor"
            inputMode="decimal"
            autoComplete="off"
            placeholder={tipo === "percentual" ? "10" : "20,00"}
            defaultValue={v.valor}
            aria-invalid={Boolean(erros.valor)}
            aria-describedby={erros.valor ? "valor-erro" : undefined}
            className={`${estiloCampo} pl-12`}
          />
        </div>
      </Campo>

      <Campo id="descricao" label="Descrição" opcional dica="Só para você lembrar. Ex.: Promoção Dia das Mães">
        <input id="descricao" name="descricao" autoComplete="off" defaultValue={v.descricao} className={estiloCampo} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo id="limite" label="Limite de usos" opcional dica="Vazio = sem limite" erro={erros.limite}>
          <input
            id="limite"
            name="limite"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={v.limite}
            aria-invalid={Boolean(erros.limite)}
            className={estiloCampo}
          />
        </Campo>
        <Campo id="validade" label="Válido até" opcional dica="Vazio = não vence" erro={erros.validade}>
          <input id="validade" name="validade" type="date" defaultValue={v.validade} aria-invalid={Boolean(erros.validade)} className={estiloCampo} />
        </Campo>
      </div>

      <Campo id="codigo" label="Código" opcional dica="Vazio = gero um código aleatório. Ex.: KARINA10" erro={erros.codigo}>
        <input
          id="codigo"
          name="codigo"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          defaultValue={v.codigo}
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase();
          }}
          aria-invalid={Boolean(erros.codigo)}
          className={`${estiloCampo} font-mono tracking-wider uppercase`}
        />
      </Campo>

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
        {salvando ? "Criando…" : "Criar cupom"}
      </button>
    </form>
  );
}

function Campo({
  id,
  label,
  opcional,
  dica,
  erro,
  children,
}: {
  id: string;
  label: string;
  opcional?: boolean;
  dica?: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {opcional && <span className="font-normal text-stone-500">(opcional)</span>}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} className="text-sm text-rose-700 dark:text-rose-400">
          {erro}
        </p>
      ) : (
        dica && <p className="text-xs text-stone-500">{dica}</p>
      )}
    </div>
  );
}
