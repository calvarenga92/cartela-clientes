// No banco guardo só dígitos; a máscara é só de tela.

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function telefoneValido(digitos: string): boolean {
  return /^[0-9]{10,11}$/.test(digitos);
}

export function formatarTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length === 9 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
