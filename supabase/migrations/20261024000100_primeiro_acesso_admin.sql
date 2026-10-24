-- Primeiro acesso: a dona do salão pede acesso, o admin aprova no painel.

-- -----------------------------------------------------------------------------
-- Admins
-- -----------------------------------------------------------------------------

create table public.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- Sem policy: ninguém lê nem escreve direto, só as funções abaixo.
alter table public.admins enable row level security;

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Solicitações
-- -----------------------------------------------------------------------------

create table public.solicitacoes_acesso (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null check (length(trim(nome)) > 0),
  email        text not null check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  telefone     text not null check (telefone ~ '^[0-9]{10,11}$'),
  nome_salao   text not null check (length(trim(nome_salao)) > 0),
  status       text not null default 'pendente' check (status in ('pendente', 'aprovada', 'recusada')),
  criado_em    timestamptz not null default now(),
  decidido_em  timestamptz,
  decidido_por uuid references auth.users (id)
);

-- Um pedido pendente por e-mail: repetir o envio não duplica.
create unique index solicitacoes_pendente_por_email
  on public.solicitacoes_acesso (lower(email)) where status = 'pendente';

alter table public.solicitacoes_acesso enable row level security;

-- Chamada pela tela pública. Sempre responde igual, exista ou não pedido/usuário
-- com esse e-mail, para não revelar quem já está cadastrado.
create or replace function public.solicitar_acesso(
  p_nome text,
  p_email text,
  p_telefone text,
  p_nome_salao text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if exists (select 1 from auth.users where lower(email) = v_email) then
    return;
  end if;

  -- Freio contra robô: com fila grande pendente, descarto em silêncio até o admin limpar.
  if (select count(*) from public.solicitacoes_acesso where status = 'pendente') >= 50 then
    return;
  end if;

  insert into public.solicitacoes_acesso (nome, email, telefone, nome_salao)
  values (trim(p_nome), v_email, regexp_replace(p_telefone, '[^0-9]', '', 'g'), trim(p_nome_salao))
  on conflict (lower(email)) where status = 'pendente' do nothing;
end;
$$;

create or replace function public.listar_solicitacoes()
returns setof public.solicitacoes_acesso
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  return query
    select * from public.solicitacoes_acesso
    order by (status = 'pendente') desc, criado_em desc
    limit 100;
end;
$$;

-- Chamada pelo servidor com a chave secreta, depois de gerar o convite no Auth.
-- Idempotente: aprovar de novo não duplica o salão.
create or replace function public.concluir_aprovacao(p_solicitacao_id uuid, p_admin_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sol    public.solicitacoes_acesso;
  v_user   uuid;
  v_salao  uuid;
begin
  select * into v_sol from public.solicitacoes_acesso where id = p_solicitacao_id for update;
  if not found then
    raise exception 'Solicitação não encontrada' using errcode = 'P0002';
  end if;

  select id into v_user from auth.users where lower(email) = lower(v_sol.email);
  if v_user is null then
    raise exception 'Usuário ainda não foi criado no Auth' using errcode = 'P0001';
  end if;

  select id into v_salao from public.saloes where dono_id = v_user limit 1;
  if v_salao is null then
    insert into public.saloes (nome, dono_id) values (v_sol.nome_salao, v_user)
    returning id into v_salao;
  end if;

  update public.solicitacoes_acesso
  set status = 'aprovada', decidido_em = coalesce(decidido_em, now()), decidido_por = p_admin_id
  where id = v_sol.id;

  return v_salao;
end;
$$;

create or replace function public.recusar_solicitacao(p_solicitacao_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.eh_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  update public.solicitacoes_acesso
  set status = 'recusada', decidido_em = now(), decidido_por = auth.uid()
  where id = p_solicitacao_id and status = 'pendente';
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissões
-- -----------------------------------------------------------------------------

revoke all on function public.eh_admin()                              from public, anon;
revoke all on function public.solicitar_acesso(text, text, text, text) from public;
revoke all on function public.listar_solicitacoes()                   from public, anon;
revoke all on function public.concluir_aprovacao(uuid, uuid)          from public, anon, authenticated;
revoke all on function public.recusar_solicitacao(uuid)               from public, anon;

grant execute on function public.eh_admin()                              to authenticated;
grant execute on function public.solicitar_acesso(text, text, text, text) to anon, authenticated;
grant execute on function public.listar_solicitacoes()                   to authenticated;
grant execute on function public.concluir_aprovacao(uuid, uuid)          to service_role;
grant execute on function public.recusar_solicitacao(uuid)               to authenticated;
