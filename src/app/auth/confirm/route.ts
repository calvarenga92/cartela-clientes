import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TIPOS_ACEITOS: EmailOtpType[] = ["invite", "recovery"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  // Só aceito caminho interno: "//site.com" viraria redirect para fora.
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (tokenHash && tipo && TIPOS_ACEITOS.includes(tipo)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(destino, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?erro=link", request.url));
}
