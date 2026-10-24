// Centralizo aqui os textos que vão para a cliente.

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function mensagemCartela({
  nome,
  salao,
  carimbos,
  meta,
  premioDisponivel,
  link,
}: {
  nome: string;
  salao: string;
  carimbos: number;
  meta: number;
  premioDisponivel: boolean;
  link: string;
}): string {
  const saudacao = `Oi, ${primeiroNome(nome)}!`;
  const status = premioDisponivel
    ? `Você completou a cartela do ${salao} e ganhou um serviço grátis! 🎉`
    : `Sua cartela do ${salao} está com ${carimbos} de ${meta} carimbos.`;
  return `${saudacao} ${status}\n\nAcompanhe aqui: ${link}`;
}

export function linkWhatsApp(telefoneDigitos: string, texto: string): string {
  return `https://wa.me/55${telefoneDigitos}?text=${encodeURIComponent(texto)}`;
}
