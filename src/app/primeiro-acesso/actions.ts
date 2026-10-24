"use server";

import { createClient } from "@/lib/supabase/server";
import { somenteDigitos, telefoneValido } from "@/lib/telefone";

export type SolicitacaoState = {
  enviado: boolean;
  erros: Partial<Record<"nome" | "email" | "telefone" | "nomeSalao" | "geral", string>>;
  valores: { nome: string; email: string; telefone: string; nomeSalao: string };
} | null;

export async function solicitarAcesso(_anterior: SolicitacaoState, formData: FormData): Promise<SolicitacaoState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefoneDigitado = String(formData.get("telefone") ?? "");
  const telefone = somenteDigitos(telefoneDigitado);
  const nomeSalao = String(formData.get("nome_salao") ?? "").trim();

  const valores = { nome, email, telefone: telefoneDigitado, nomeSalao };
  const erros: NonNullable<SolicitacaoState>["erros"] = {};
  if (!nome) erros.nome = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido.";
  if (!telefoneValido(telefone)) erros.telefone = "Telefone com DDD, ex.: (11) 98888-7777.";
  if (!nomeSalao) erros.nomeSalao = "Informe o nome do salão.";
  if (Object.keys(erros).length > 0) return { enviado: false, erros, valores };

  const supabase = await createClient();
  const { error } = await supabase.rpc("solicitar_acesso", {
    p_nome: nome,
    p_email: email,
    p_telefone: telefone,
    p_nome_salao: nomeSalao,
  });

  if (error) {
    console.error(error);
    return { enviado: false, erros: { geral: "Não foi possível enviar. Tente de novo." }, valores };
  }

  // Resposta igual sempre: não revelo se o e-mail já tem conta ou pedido.
  return { enviado: true, erros: {}, valores };
}
