import type { OrigemCarimbo } from "@/lib/clientes";

const ROTULO: Record<OrigemCarimbo, string> = {
  visita: "atendimento",
  indicacao: "indicação",
  manual: "carimbo manual",
};

export function CartelaVisual({
  meta,
  carimbos,
}: {
  meta: number;
  carimbos: { id: string; origem: OrigemCarimbo }[];
}) {
  const completa = carimbos.length >= meta;
  const indicacoes = carimbos.filter((c) => c.origem === "indicacao").length;

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
        <p className="text-2xl font-semibold tabular-nums">
          {carimbos.length}
          <span className="text-base font-normal text-stone-500">/{meta}</span>
        </p>
      </div>

      <ol className="grid grid-cols-5 gap-3">
        {Array.from({ length: meta }, (_, i) => {
          const carimbo = carimbos[i];
          return (
            <li
              key={carimbo?.id ?? `vazio-${i}`}
              aria-label={carimbo ? `Casa ${i + 1}: ${ROTULO[carimbo.origem]}` : `Casa ${i + 1}: vazia`}
              className={`flex aspect-square items-center justify-center rounded-full text-lg font-semibold ${
                !carimbo
                  ? "border-2 border-dashed border-stone-300 text-stone-300 dark:border-stone-700 dark:text-stone-700"
                  : carimbo.origem === "indicacao"
                    ? "bg-amber-500 text-white"
                    : carimbo.origem === "manual"
                      ? "bg-stone-500 text-white"
                      : "bg-rose-600 text-white"
              }`}
            >
              <span aria-hidden>{!carimbo ? i + 1 : carimbo.origem === "indicacao" ? "★" : "✓"}</span>
            </li>
          );
        })}
      </ol>

      {indicacoes > 0 && (
        <p className="mt-4 text-xs text-stone-600 dark:text-stone-400">
          <span aria-hidden className="text-amber-500">★</span> {indicacoes}{" "}
          {indicacoes === 1 ? "carimbo veio de indicação" : "carimbos vieram de indicação"}
        </p>
      )}
    </section>
  );
}
