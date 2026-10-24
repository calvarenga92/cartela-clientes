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
  tokenPublico: string;
  salaoNome: string;
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

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nome, telefone, email, token_publico, indicada_por_id, salao:saloes(nome)")
    .eq("id", id)
    .maybeSingle();

  // Erro de banco não pode virar 404: deixo estourar com a mensagem.
  if (error) throw new Error(`Erro ao carregar cliente: ${error.message}`);
  if (!cliente) return null;

  // Indicadora em consulta separada: o auto-relacionamento é ambíguo para o embed.
  const [cartelasResp, visitasResp, indicadoraResp] = await Promise.all([
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
    cliente.indicada_por_id
      ? supabase.from("clientes").select("id, nome").eq("id", cliente.indicada_por_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const erroConsulta = cartelasResp.error ?? visitasResp.error ?? indicadoraResp.error;
  if (erroConsulta) throw new Error(`Erro ao carregar ficha: ${erroConsulta.message}`);

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
    tokenPublico: cliente.token_publico,
    salaoNome: cliente.salao?.nome ?? "",
    indicadora: indicadoraResp.data,
    cartela: { meta: atual?.meta_carimbos ?? META_PADRAO, carimbos },
    premioCartelaId: completa?.id ?? null,
    visitas: (visitasResp.data ?? []).map((v) => ({
      id: v.id,
      data: v.data,
      tipo: v.tipo as "normal" | "premio",
    })),
  };
}
