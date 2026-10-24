# Cartela Clientes

Cartela fidelidade digital para salões de beleza: cadastro de clientes, carimbo a cada atendimento e prêmio a cada 10 carimbos. Indicação de cliente nova também vale carimbo.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Postgres, Auth, Row Level Security)
- Deploy: Vercel

## Funcionalidades

- Login da dona do salão (e-mail e senha)
- Busca de clientes por nome ou telefone
- Cadastro de cliente com indicação
- Registro de atendimento com desfazer
- Cartela visual e resgate de prêmio

## Rodando localmente

```bash
npm install
npm run dev
```

Requer um `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Banco: as migrations ficam em `supabase/migrations` e sobem com `npx supabase db push`.

---

Desenvolvido por Claudio Alvarenga
