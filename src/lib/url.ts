import { headers } from "next/headers";

// Em produção uso NEXT_PUBLIC_SITE_URL; sem ela, monto pelo host da requisição.
export async function getUrlSite(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL;
  if (configurada) return configurada.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
