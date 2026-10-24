import type { OrigemCarimbo } from "@/lib/clientes";

export type CarimboVisual = {
  id: string;
  origem: OrigemCarimbo;
  // Só a ficha manda os detalhes; a página pública da cliente não.
  criadoEm?: string;
  indicadaNome?: string | null;
  motivo?: string | null;
};

// Fuso fixo: na Vercel o servidor roda em UTC.
const FORMATO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function cor(origem: OrigemCarimbo) {
  if (origem === "indicacao") return "bg-amber-500 text-white";
  if (origem === "manual") return "bg-stone-500 text-white";
  return "bg-rose-600 text-white";
}

function marca(origem: OrigemCarimbo) {
  return origem === "indicacao" ? "★" : "✓";
}

function descricao(carimbo: CarimboVisual) {
  if (carimbo.origem === "indicacao") return `Indicação de ${carimbo.indicadaNome ?? "cliente removida"}`;
  if (carimbo.origem === "manual") return `Carimbo manual${carimbo.motivo ? `: ${carimbo.motivo}` : ""}`;
  return "Atendimento";
}

export function CartelaVisual({ meta, carimbos }: { meta: number; carimbos: CarimboVisual[] }) {
  const completa = carimbos.length >= meta;
  const comDetalhes = carimbos.some((c) => c.criadoEm);

  return (
    <section
      aria-label="Cartela"
      className={`rounded-2xl border p-5 ${
        completa
          ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Cartela</p>
        <p className="text-2xl font-semibold tabular-nums" aria-label={`${carimbos.length} de ${meta} carimbos`}>
          {carimbos.length}
          <span className="text-base font-normal text-stone-500">/{meta}</span>
        </p>
      </div>

      {/* Com a lista embaixo, a grade é só visual para o leitor de tela. */}
      <ol className="grid grid-cols-5 gap-3" aria-hidden={comDetalhes || undefined}>
        {Array.from({ length: meta }, (_, i) => {
          const carimbo = carimbos[i];
          return (
            <li
              key={carimbo?.id ?? `vazio-${i}`}
              aria-label={carimbo ? `Casa ${i + 1}: ${descricao(carimbo)}` : `Casa ${i + 1}: vazia`}
              className={`flex aspect-square items-center justify-center rounded-full text-lg font-semibold ${
                carimbo
                  ? cor(carimbo.origem)
                  : "border-2 border-dashed border-stone-300 text-stone-300 dark:border-stone-700 dark:text-stone-700"
              }`}
            >
              <span aria-hidden>{carimbo ? marca(carimbo.origem) : i + 1}</span>
            </li>
          );
        })}
      </ol>

      {comDetalhes && carimbos.length > 0 && (
        <ol className="mt-5 divide-y divide-stone-200 border-t border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {carimbos.map((carimbo, i) => (
            <li key={carimbo.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${cor(carimbo.origem)}`}
              >
                {marca(carimbo.origem)}
              </span>
              <span className="w-5 shrink-0 tabular-nums text-stone-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{descricao(carimbo)}</span>
              {carimbo.criadoEm && (
                <time dateTime={carimbo.criadoEm} className="shrink-0 tabular-nums text-stone-500">
                  {FORMATO.format(new Date(carimbo.criadoEm))}
                </time>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
