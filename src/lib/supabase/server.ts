// Cliente Supabase para Server Components, Server Actions e Route Handlers.
// Crie um cliente novo a cada requisição — nunca compartilhe entre requisições.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components não podem gravar cookies.
          // Sem problema: o proxy (src/proxy.ts) renova a sessão a cada navegação.
        }
      },
    },
  });
}
