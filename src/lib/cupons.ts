import { createClient } from "@/lib/supabase/server";
import type { Cupom, StatusCupom, TipoCupom } from "./cupons-formato";

export type { Cupom, StatusCupom, TipoCupom } from "./cupons-formato";
export { formatarDesconto, formatarValidade } from "./cupons-formato";

// en-CA formata como AAAA-MM-DD, o mesmo formato da coluna date do banco.
const HOJE_SP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

function calcularStatus(c: { ativo: boolean; validade: string | null; limiteUsos: number | null; usos: number }, hoje: string): StatusCupom {
  if (!c.ativo) return "desativado";
  if (c.validade && c.validade < hoje) return "vencido";
  if (c.limiteUsos !== null && c.usos >= c.limiteUsos) return "esgotado";
  return "ativo";
}

export async function listarCupons(): Promise<Cupom[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listar_cupons");
  if (error) throw new Error(`Erro ao carregar cupons: ${error.message}`);

  const hoje = HOJE_SP.format(new Date());
  return (data ?? []).map((c) => {
    const base = {
      id: c.id,
      codigo: c.codigo,
      tipo: c.tipo as TipoCupom,
      valor: Number(c.valor),
      descricao: c.descricao ?? null,
      limiteUsos: c.limite_usos ?? null,
      validade: c.validade ?? null,
      ativo: c.ativo,
      usos: c.usos,
    };
    return { ...base, status: calcularStatus(base, hoje) };
  });
}
