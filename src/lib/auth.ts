import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Sessao = {
  email: string;
  salao: { id: string; nome: string } | null;
};

// Lê cookies: só chamo dentro de <Suspense>, Server Action ou Route Handler.
export async function getSessao(): Promise<Sessao> {
  const supabase = await createClient();

  // getClaims valida o JWT; getSession não valida.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/login");
  }

  const { data: salao } = await supabase
    .from("saloes")
    .select("id, nome")
    .maybeSingle();

  return {
    email: String(data.claims.email ?? ""),
    salao,
  };
}
