"use server";

import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Disparado junto com a abertura do WhatsApp. Não chamo refresh(): a tela já
// marca "chamada agora" sozinha e a lista não pula enquanto ela trabalha.
export async function registrarContato(clienteId: string, cupomId: string | null): Promise<{ ok: boolean }> {
  if (!UUID.test(clienteId) || (cupomId !== null && !UUID.test(cupomId))) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_contato_reativacao", {
    p_cliente_id: clienteId,
    ...(cupomId ? { p_cupom_id: cupomId } : {}),
  });
  if (error) {
    console.error("[reativar]", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}
