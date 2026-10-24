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

// Convite para voltar: lembra o progresso da cartela e, se tiver, o cupom.
export function mensagemReativacao({
  nome,
  salao,
  carimbos,
  meta,
  premioDisponivel,
  link,
  cupom,
}: {
  nome: string;
  salao: string;
  carimbos: number;
  meta: number;
  premioDisponivel: boolean;
  link: string;
  cupom?: { codigo: string; desconto: string; validade: string | null } | null;
}): string {
  const partes = [`Oi, ${primeiroNome(nome)}! Sentimos sua falta no ${salao} 💕`];

  if (premioDisponivel) {
    partes.push("Seu serviço grátis da cartela está te esperando!");
  } else if (carimbos > 0) {
    const faltam = meta - carimbos;
    partes.push(
      `Você já tem ${carimbos} de ${meta} carimbos — ${faltam === 1 ? "falta só 1" : `faltam só ${faltam}`} para ganhar um serviço grátis.`,
    );
  }

  if (cupom) {
    partes.push(`Para a sua volta: use o cupom ${cupom.codigo} e ganhe ${cupom.desconto} de desconto${cupom.validade ? ` (${cupom.validade.toLowerCase()})` : ""}.`);
  }

  partes.push("Que tal agendar um horário?");
  return `${partes.join(" ")}\n\nSua cartela: ${link}`;
}

export function linkWhatsApp(telefoneDigitos: string, texto: string): string {
  return `https://wa.me/55${telefoneDigitos}?text=${encodeURIComponent(texto)}`;
}
