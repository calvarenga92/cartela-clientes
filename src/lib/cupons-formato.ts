// Sem acesso a banco: pode ser usado no navegador.

export type TipoCupom = "percentual" | "valor";
export type StatusCupom = "ativo" | "vencido" | "esgotado" | "desativado";

export type Cupom = {
  id: string;
  codigo: string;
  tipo: TipoCupom;
  valor: number;
  descricao: string | null;
  limiteUsos: number | null;
  validade: string | null;
  ativo: boolean;
  usos: number;
  status: StatusCupom;
};

const FORMATO_REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarDesconto(tipo: TipoCupom, valor: number): string {
  return tipo === "percentual" ? `${Number(valor).toLocaleString("pt-BR")}%` : FORMATO_REAL.format(valor);
}

export function formatarValidade(validade: string | null): string {
  if (!validade) return "Sem validade";
  const [ano, mes, dia] = validade.split("-");
  return `Até ${dia}/${mes}/${ano}`;
}
