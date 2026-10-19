// Data Access Layer de autenticação.
// Toda leitura de "quem está logado" passa por aqui — um ponto só para auditar.

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Sessao = {
  email: string;
  salao: { id: string; nome: string } | null;
};

/**
 * Retorna a usuária logada e o salão dela.
 * Sem sessão válida, redireciona para /login (lança, não retorna).
 *
 * Lê cookies: só pode ser chamada dentro de um <Suspense> (cacheComponents),
 * em Server Actions ou em Route Handlers.
 */
export async function getSessao(): Promise<Sessao> {
  // Marca o restante como "só na requisição". O Supabase usa Date.now()
  // para checar a expiração do token, e o cacheComponents proíbe valores
  // instáveis durante a pré-renderização.
  await connection();

  const supabase = await createClient();

  // getClaims valida o JWT; getSession apenas lê o cookie sem validar
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/login");
  }

  // RLS garante que só volta o salão da própria usuária
  const { data: salao } = await supabase
    .from("saloes")
    .select("id, nome")
    .maybeSingle();

  return {
    email: String(data.claims.email ?? ""),
    salao,
  };
}
