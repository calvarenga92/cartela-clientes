"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODIGO = /^[A-Z0-9-]{4,20}$/;
// Sem 0/O, 1/I/L: código lido em voz alta ou digitado no celular não confunde.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function gerarCodigo(tamanho = 6): string {
  return Array.from({ length: tamanho }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

function normalizarCodigo(valor: string): string {
  return valor.trim().toUpperCase().replace(/\s+/g, "-");
}

function mensagemDeErro(error: { code?: string; message: string }): string {
  if (error.code === "P0001" || error.code === "P0002") return error.message;
  console.error(error);
  return "Não foi possível concluir. Tente de novo.";
}

// -----------------------------------------------------------------------------

export type CupomFormState = {
  erros: Partial<Record<"tipo" | "valor" | "limite" | "validade" | "codigo" | "geral", string>>;
  valores: Record<string, string>;
} | null;

export async function criarCupom(_anterior: CupomFormState, formData: FormData): Promise<CupomFormState> {
  const { salao } = await getSessao();

  const valores = Object.fromEntries(
    ["tipo", "valor", "descricao", "limite", "validade", "codigo"].map((k) => [k, String(formData.get(k) ?? "").trim()]),
  );
  const erros: NonNullable<CupomFormState>["erros"] = {};

  const tipo = valores.tipo === "valor" ? "valor" : valores.tipo === "percentual" ? "percentual" : null;
  // Com vírgula, ponto é milhar ("1.000,50"); sem vírgula, ponto é decimal ("10.5").
  const valor = Number(valores.valor.includes(",") ? valores.valor.replace(/\./g, "").replace(",", ".") : valores.valor);
  const limite = valores.limite ? Number(valores.limite) : null;
  const codigoDigitado = valores.codigo ? normalizarCodigo(valores.codigo) : null;

  if (!salao) erros.geral = "Seu usuário não tem salão configurado.";
  if (!tipo) erros.tipo = "Escolha % ou R$.";
  if (!Number.isFinite(valor) || valor <= 0) erros.valor = "Informe um desconto maior que zero.";
  else if (tipo === "percentual" && valor > 100) erros.valor = "Porcentagem vai até 100.";
  if (limite !== null && (!Number.isInteger(limite) || limite < 1)) erros.limite = "Use um número inteiro a partir de 1.";
  if (valores.validade && !/^\d{4}-\d{2}-\d{2}$/.test(valores.validade)) erros.validade = "Data inválida.";
  if (codigoDigitado && !CODIGO.test(codigoDigitado)) erros.codigo = "De 4 a 20 letras, números ou hífen.";
  if (Object.keys(erros).length > 0 || !salao || !tipo) return { erros, valores };

  const supabase = await createClient();
  // Código automático: tento de novo se cair num que já existe (raro).
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const codigo = codigoDigitado ?? gerarCodigo();
    const { error } = await supabase.from("cupons").insert({
      salao_id: salao.id,
      codigo,
      tipo,
      valor: Math.round(valor * 100) / 100,
      descricao: valores.descricao || null,
      limite_usos: limite,
      validade: valores.validade || null,
    });

    if (!error) redirect(`/cupons?novo=${codigo}`);
    if (error.code !== "23505") return { erros: { geral: mensagemDeErro(error) }, valores };
    if (codigoDigitado) return { erros: { codigo: "Esse código já existe no seu salão." }, valores };
  }

  return { erros: { geral: "Não consegui gerar um código livre. Tente de novo." }, valores };
}

// -----------------------------------------------------------------------------

export type ResultadoUso =
  | { ok: true; usoId: string; codigo: string; tipo: "percentual" | "valor"; valor: number; usos: number; limite: number | null }
  | { ok: false; erro: string };

export async function usarCupom(codigo: string): Promise<ResultadoUso> {
  const normalizado = normalizarCodigo(codigo);
  if (!CODIGO.test(normalizado)) return { ok: false, erro: "Código inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("usar_cupom", { p_codigo: normalizado });
  if (error) return { ok: false, erro: mensagemDeErro(error) };

  const r = data as { uso_id: string; codigo: string; tipo: "percentual" | "valor"; valor: number; usos: number; limite_usos: number | null };
  refresh();
  return { ok: true, usoId: r.uso_id, codigo: r.codigo, tipo: r.tipo, valor: Number(r.valor), usos: r.usos, limite: r.limite_usos };
}

export async function desfazerUsoCupom(usoId: string): Promise<{ ok: boolean; erro?: string }> {
  if (!UUID.test(usoId)) return { ok: false, erro: "Requisição inválida." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("desfazer_uso_cupom", { p_uso_id: usoId });
  if (error) return { ok: false, erro: mensagemDeErro(error) };
  refresh();
  return { ok: true };
}

export async function alternarCupomAtivo(cupomId: string, ativo: boolean): Promise<{ ok: boolean }> {
  if (!UUID.test(cupomId)) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase.from("cupons").update({ ativo }).eq("id", cupomId).select("id").maybeSingle();
  if (error || !data) return { ok: false };
  refresh();
  return { ok: true };
}
