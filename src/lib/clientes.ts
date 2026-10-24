import { createClient } from "@/lib/supabase/server";

export type ClienteResumo = {
  id: string;
  nome: string;
  telefone: string;
  carimbos: number;
  meta_carimbos: number;
  premio_disponivel: boolean;
};

export type OrigemCarimbo = "visita" | "indicacao" | "manual";

export type FichaCliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  indicadora: { id: string; nome: string } | null;
  cartela: {
    meta: number;
    carimbos: { id: string; origem: OrigemCarimbo }[];
  };
  premioCartelaId: string | null;
  visitas: { id: string; data: string; tipo: "normal" | "premio" }[];
};

const META_PADRAO = 10;

export async function buscarClientes(termo: string): Promise<ClienteResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("buscar_clientes", { p_termo: termo });
  if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);
  return data ?? [];
}

export async function getFichaCliente(id: string): Promise<FichaCliente | null> {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nome, telefone, email, indicadora:clientes!clientes_indicada_por_id_fkey(id, nome)")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) return null;

  const [cartelasResp, visitasResp] = await Promise.all([
    supabase
      .from("cartelas")
      .select("id, status, meta_carimbos, criado_em, carimbos(id, origem, criado_em, cancelado_em)")
      .eq("cliente_id", id)
      .in("status", ["aberta", "completa"])
      .order("criado_em", { ascending: true }),
    supabase
      .from("visitas")
      .select("id, data, tipo")
      .eq("cliente_id", id)
      .is("cancelada_em", null)
      .order("criado_em", { ascending: false })
      .limit(10),
  ]);

  const cartelas = cartelasResp.data ?? [];
  const aberta = cartelas.find((c) => c.status === "aberta");
  const completa = cartelas.find((c) => c.status === "completa");
  // Mostro a aberta; sem ela, a completa esperando o prêmio.
  const atual = aberta ?? completa;

  const carimbos = (atual?.carimbos ?? [])
    .filter((c) => c.cancelado_em === null)
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
    .map((c) => ({ id: c.id, origem: c.origem as OrigemCarimbo }));

  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    email: cliente.email,
    // O tipo gerado declara lista no auto-relacionamento, mas vem objeto.
    indicadora: Array.isArray(cliente.indicadora) ? (cliente.indicadora[0] ?? null) : cliente.indicadora,
    cartela: { meta: atual?.meta_carimbos ?? META_PADRAO, carimbos },
    premioCartelaId: completa?.id ?? null,
    visitas: (visitasResp.data ?? []).map((v) => ({
      id: v.id,
      data: v.data,
      tipo: v.tipo as "normal" | "premio",
    })),
  };
}
