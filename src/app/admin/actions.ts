"use server";

import { refresh } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUrlSite } from "@/lib/url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResultadoAprovacao =
  | { ok: true; link: string; nome: string; telefone: string }
  | { ok: false; erro: string };

// Confiro no banco, com a sessão de quem chamou, antes de usar a chave secreta.
async function adminLogado(): Promise<string | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  return ehAdmin && claims?.claims.sub ? claims.claims.sub : null;
}

export async function aprovarSolicitacao(solicitacaoId: string): Promise<ResultadoAprovacao> {
  if (!UUID.test(solicitacaoId)) return { ok: false, erro: "Requisição inválida." };

  const adminId = await adminLogado();
  if (!adminId) return { ok: false, erro: "Acesso negado." };

  const admin = createAdminClient();
  const { data: sol } = await admin
    .from("solicitacoes_acesso")
    .select("id, nome, email, telefone, status")
    .eq("id", solicitacaoId)
    .maybeSingle();
  if (!sol || sol.status === "recusada") return { ok: false, erro: "Solicitação não encontrada." };

  // Convite cria o usuário. Se ele já existe (aprovação repetida), gero link de redefinir senha.
  let tipo: "invite" | "recovery" = "invite";
  let link = await admin.auth.admin.generateLink({ type: "invite", email: sol.email, options: { data: { nome: sol.nome } } });
  if (link.error && link.error.code === "email_exists") {
    tipo = "recovery";
    link = await admin.auth.admin.generateLink({ type: "recovery", email: sol.email });
  }
  if (link.error || !link.data.properties) {
    console.error(link.error);
    return { ok: false, erro: "Não foi possível gerar o convite." };
  }

  const { error } = await admin.rpc("concluir_aprovacao", {
    p_solicitacao_id: sol.id,
    p_admin_id: adminId,
  });
  if (error) {
    console.error(error);
    return { ok: false, erro: "Convite gerado, mas não consegui criar o salão. Tente aprovar de novo." };
  }

  const params = new URLSearchParams({
    token_hash: link.data.properties.hashed_token,
    type: tipo,
    next: "/definir-senha",
  });
  refresh();
  return { ok: true, link: `${await getUrlSite()}/auth/confirm?${params}`, nome: sol.nome, telefone: sol.telefone };
}

export async function recusarSolicitacao(solicitacaoId: string): Promise<{ ok: boolean }> {
  if (!UUID.test(solicitacaoId)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.rpc("recusar_solicitacao", { p_solicitacao_id: solicitacaoId });
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
