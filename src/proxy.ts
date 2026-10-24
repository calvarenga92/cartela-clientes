import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Públicas: abrem sem login. Só deslogado: quem já entrou é mandado para o app.
const ROTAS_PUBLICAS = ["/login", "/primeiro-acesso", "/auth/", "/c/"];
const ROTAS_SO_DESLOGADO = ["/login", "/primeiro-acesso"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const ehRotaPublica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));

  if (!user && !ehRotaPublica) {
    return redirecionar(request, response, "/login");
  }

  if (user && ROTAS_SO_DESLOGADO.some((rota) => pathname.startsWith(rota))) {
    return redirecionar(request, response, "/");
  }

  return response;
}

// Copio cookies e cabeçalhos do Supabase, senão o token renovado se perde no redirect.
function redirecionar(request: NextRequest, response: NextResponse, destino: string) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const valor = response.headers.get(header);
    if (valor) redirect.headers.set(header, valor);
  });
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
