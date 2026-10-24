import { createClient } from "@/lib/supabase/server";

export const OPCOES_DIAS = [30, 45, 60, 90] as const;
export const DIAS_PADRAO = 45;

export type ClienteParaReativar = {
  id: string;
  nome: string;
  telefone: string;
  tokenPublico: string;
  diasSemVir: number;
  nuncaVeio: boolean;
  carimbos: number;
  meta: number;
  premioDisponivel: boolean;
  // Dias inteiros desde o último contato; null = nunca foi chamada.
  diasDesdeContato: number | null;
};

export function lerDias(valor: unknown): number {
  const n = Number(valor);
  return (OPCOES_DIAS as readonly number[]).includes(n) ? n : DIAS_PADRAO;
}

export async function listarParaReativar(dias: number): Promise<ClienteParaReativar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("clientes_para_reativar", { p_dias: dias });
  if (error) throw new Error(`Erro ao carregar clientes para reativar: ${error.message}`);

  const agora = Date.now();
  return (data ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    tokenPublico: c.token_publico,
    diasSemVir: c.dias_sem_vir,
    nuncaVeio: c.ultima_visita === null,
    carimbos: c.carimbos,
    meta: c.meta_carimbos,
    premioDisponivel: c.premio_disponivel,
    diasDesdeContato: c.ultimo_contato ? Math.floor((agora - new Date(c.ultimo_contato).getTime()) / 86_400_000) : null,
  }));
}

export async function resumoReativacao(): Promise<{ chamadas: number; voltaram: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resumo_reativacao", { p_janela: 30 });
  if (error) throw new Error(`Erro ao carregar resumo: ${error.message}`);
  return data?.[0] ?? { chamadas: 0, voltaram: 0 };
}
