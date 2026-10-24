"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SenhaState = { erro: string } | null;

const TAMANHO_MINIMO = 8;

export async function definirSenha(_anterior: SenhaState, formData: FormData): Promise<SenhaState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < TAMANHO_MINIMO) return { erro: `A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.` };
  if (senha !== confirmacao) return { erro: "As senhas não conferem." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?erro=link");

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    console.error(error);
    return { erro: "Não foi possível salvar a senha. Tente de novo." };
  }

  redirect("/");
}
