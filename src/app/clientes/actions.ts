"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { somenteDigitos, telefoneValido } from "@/lib/telefone";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// P0001/P0002 são erros de regra que eu lanço no banco, com texto para a usuária.
function mensagemDeErro(error: { code?: string; message: string }): string {
  if (error.code === "P0001" || error.code === "P0002") return error.message;
  console.error(error);
  return "Não foi possível concluir. Tente de novo.";
}

export type CadastroState = {
  erros: Partial<Record<"nome" | "telefone" | "email" | "consentimento" | "geral", string>>;
  valores: { nome: string; telefone: string; email: string };
} | null;

type ErrosCadastro = NonNullable<CadastroState>["erros"];

// Mesma validação para cadastrar e editar.
function lerDadosCliente(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefoneDigitado = String(formData.get("telefone") ?? "");
  const telefone = somenteDigitos(telefoneDigitado);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const erros: ErrosCadastro = {};
  if (!nome) erros.nome = "Informe o nome.";
  if (!telefoneValido(telefone)) erros.telefone = "Telefone com DDD, ex.: (11) 98888-7777.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido.";

  return { dados: { nome, telefone, email: email || null }, valores: { nome, telefone: telefoneDigitado, email }, erros };
}

function erroDeUnicidade(error: { code?: string; message: string }): ErrosCadastro | null {
  // 23505 = unicidade violada
  if (error.code !== "23505") return null;
  if (error.message.includes("telefone")) return { telefone: "Já existe uma cliente com esse telefone." };
  if (error.message.includes("email")) return { email: "Já existe uma cliente com esse e-mail." };
  return null;
}

export async function criarCliente(_anterior: CadastroState, formData: FormData): Promise<CadastroState> {
  const { salao } = await getSessao();
  const { dados, valores, erros } = lerDadosCliente(formData);
  const indicadaPorId = String(formData.get("indicada_por_id") ?? "");

  if (!salao) erros.geral = "Seu usuário não tem salão configurado.";
  if (formData.get("consentimento") !== "on") erros.consentimento = "É preciso a autorização da cliente.";
  if (Object.keys(erros).length > 0 || !salao) return { erros, valores };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      salao_id: salao.id,
      ...dados,
      indicada_por_id: UUID.test(indicadaPorId) ? indicadaPorId : null,
      consentimento_lgpd_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { erros: erroDeUnicidade(error) ?? { geral: mensagemDeErro(error) }, valores };

  redirect(`/clientes/${data.id}`);
}

export async function atualizarCliente(
  clienteId: string,
  _anterior: CadastroState,
  formData: FormData,
): Promise<CadastroState> {
  const { dados, valores, erros } = lerDadosCliente(formData);
  if (!UUID.test(clienteId)) erros.geral = "Requisição inválida.";
  if (Object.keys(erros).length > 0) return { erros, valores };

  // O RLS só deixa alterar cliente do próprio salão; sem linha de volta = não é dela.
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").update(dados).eq("id", clienteId).select("id").maybeSingle();

  if (error) return { erros: erroDeUnicidade(error) ?? { geral: mensagemDeErro(error) }, valores };
  if (!data) return { erros: { geral: "Cliente não encontrada." }, valores };

  redirect(`/clientes/${clienteId}`);
}

type CartelaResumo = { carimbos: number; meta_carimbos: number; status: string };

export type ResultadoAcao =
  | { ok: true; visitaId: string; origem: "visita" | "indicacao" | null; cartela: CartelaResumo | null; repetida: boolean }
  | { ok: false; erro: string };

export async function registrarAtendimento(clienteId: string, chave: string): Promise<ResultadoAcao> {
  if (!UUID.test(clienteId) || !UUID.test(chave)) return { ok: false, erro: "Requisição inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_visita", {
    p_cliente_id: clienteId,
    p_chave_idempotencia: chave,
  });
  if (error) return { ok: false, erro: mensagemDeErro(error) };

  const r = data as { visita_id: string; origem: "visita" | "indicacao"; cartela: CartelaResumo; repetida: boolean };
  refresh();
  return { ok: true, visitaId: r.visita_id, origem: r.origem, cartela: r.cartela, repetida: r.repetida };
}

export async function usarPremio(cartelaId: string): Promise<ResultadoAcao> {
  if (!UUID.test(cartelaId)) return { ok: false, erro: "Requisição inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resgatar_premio", { p_cartela_id: cartelaId });
  if (error) return { ok: false, erro: mensagemDeErro(error) };

  const r = data as { visita_id: string };
  refresh();
  return { ok: true, visitaId: r.visita_id, origem: null, cartela: null, repetida: false };
}

export async function desfazerAtendimento(visitaId: string): Promise<{ ok: boolean; erro?: string }> {
  if (!UUID.test(visitaId)) return { ok: false, erro: "Requisição inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("desfazer_visita", { p_visita_id: visitaId });
  if (error) return { ok: false, erro: mensagemDeErro(error) };

  refresh();
  return { ok: true };
}
