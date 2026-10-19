// Renova a sessão do Supabase antes de cada página renderizar.
// Chamado por src/proxy.ts.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Atualiza os cookies na requisição (para a página ler o token novo)...
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        // ...e na resposta (para o navegador guardar o token novo)
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Impede CDN de cachear uma resposta com o token de outra pessoa
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims:
  // é aqui que o token expirado é renovado.
  const { data } = await supabase.auth.getClaims();

  return { response, user: data?.claims ?? null };
}
