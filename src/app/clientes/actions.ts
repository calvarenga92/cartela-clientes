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

export async function criarCliente(_anterior: CadastroState, formData: FormData): Promise<CadastroState> {
  const { salao } = await getSessao();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefoneDigitado = String(formData.get("telefone") ?? "");
  const telefone = somenteDigitos(telefoneDigitado);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const indicadaPorId = String(formData.get("indicada_por_id") ?? "");
  const consentiu = formData.get("consentimento") === "on";

  const valores = { nome, telefone: telefoneDigitado, email };
  const erros: NonNullable<CadastroState>["erros"] = {};

  if (!salao) erros.geral = "Seu usuário não tem salão configurado.";
  if (!nome) erros.nome = "Informe o nome.";
  if (!telefoneValido(telefone)) erros.telefone = "Telefone com DDD, ex.: (11) 98888-7777.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido.";
  if (!consentiu) erros.consentimento = "É preciso a autorização da cliente.";

  if (Object.keys(erros).length > 0 || !salao) return { erros, valores };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      salao_id: salao.id,
      nome,
      telefone,
      email: email || null,
      indicada_por_id: UUID.test(indicadaPorId) ? indicadaPorId : null,
      consentimento_lgpd_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unicidade violada
    if (error.code === "23505" && error.message.includes("telefone")) {
      return { erros: { telefone: "Já existe uma cliente com esse telefone." }, valores };
    }
    if (error.code === "23505" && error.message.includes("email")) {
      return { erros: { email: "Já existe uma cliente com esse e-mail." }, valores };
    }
    return { erros: { geral: mensagemDeErro(error) }, valores };
  }

  redirect(`/clientes/${data.id}`);
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
