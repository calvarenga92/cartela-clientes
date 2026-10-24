-- Reativação: clientes que sumiram, registro de quem já foi chamada e quantas voltaram.

create table public.reativacao_contatos (
  id            uuid primary key default gen_random_uuid(),
  salao_id      uuid not null references public.saloes (id) on delete cascade,
  cliente_id    uuid not null references public.clientes (id) on delete cascade,
  cupom_id      uuid references public.cupons (id) on delete set null,
  contatado_em  timestamptz not null default now()
);

create index reativacao_contatos_cliente_idx on public.reativacao_contatos (cliente_id, contatado_em desc);

alter table public.reativacao_contatos enable row level security;

create policy reativacao_contatos_leitura on public.reativacao_contatos
  for select to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()));

grant select on public.reativacao_contatos to authenticated;

-- Última visita válida (atendimento ou prêmio) por cliente.
create index visitas_cliente_validas_idx on public.visitas (cliente_id, criado_em desc) where cancelada_em is null;

-- -----------------------------------------------------------------------------

-- Clientes sem visita há p_dias ou mais. Quem nunca teve visita conta a partir do cadastro.
-- Quem foi chamada nos últimos 7 dias vai para o fim da lista.
create or replace function public.clientes_para_reativar(p_dias int default 45)
returns table (
  id              uuid,
  nome            text,
  telefone        text,
  token_publico   text,
  ultima_visita   timestamptz,
  dias_sem_vir    int,
  carimbos        int,
  meta_carimbos   int,
  premio_disponivel boolean,
  ultimo_contato  timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select
      c.id, c.nome, c.telefone, c.token_publico, c.criado_em,
      (select max(v.criado_em) from public.visitas v
        where v.cliente_id = c.id and v.cancelada_em is null) as ultima_visita,
      (select max(r.contatado_em) from public.reativacao_contatos r
        where r.cliente_id = c.id) as ultimo_contato,
      ct.id as cartela_id,
      coalesce(ct.meta_carimbos, 10) as meta_carimbos
    from public.clientes c
    -- mesma "cartela atual" do buscar_clientes: a aberta; se não houver, a completa mais recente
    left join lateral (
      select * from public.cartelas x
      where x.cliente_id = c.id and x.status in ('aberta', 'completa')
      order by (x.status = 'aberta') desc, x.criado_em desc
      limit 1
    ) ct on true
  )
  select
    b.id, b.nome, b.telefone, b.token_publico, b.ultima_visita,
    floor(extract(epoch from now() - coalesce(b.ultima_visita, b.criado_em)) / 86400)::int,
    coalesce((select count(*)::int from public.carimbos cb
              where cb.cartela_id = b.cartela_id and cb.cancelado_em is null), 0),
    b.meta_carimbos,
    exists (select 1 from public.cartelas cc where cc.cliente_id = b.id and cc.status = 'completa'),
    b.ultimo_contato
  from base b
  where coalesce(b.ultima_visita, b.criado_em) < now() - make_interval(days => greatest(least(coalesce(p_dias, 45), 365), 7))
  order by
    (b.ultimo_contato is not null and b.ultimo_contato > now() - interval '7 days'),
    coalesce(b.ultima_visita, b.criado_em)
  limit 200;
$$;

create or replace function public.registrar_contato_reativacao(p_cliente_id uuid, p_cupom_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salao uuid;
begin
  select c.salao_id into v_salao
  from public.clientes c
  join public.saloes s on s.id = c.salao_id
  where c.id = p_cliente_id and s.dono_id = auth.uid();

  if v_salao is null then
    raise exception 'Cliente não encontrada' using errcode = 'P0002';
  end if;

  -- Cupom só entra se for do mesmo salão; de outro, ignoro.
  insert into public.reativacao_contatos (salao_id, cliente_id, cupom_id)
  values (
    v_salao,
    p_cliente_id,
    (select id from public.cupons where id = p_cupom_id and salao_id = v_salao)
  );
end;
$$;

-- Nos últimos p_janela dias: quantas clientes foram chamadas e quantas tiveram visita depois.
create or replace function public.resumo_reativacao(p_janela int default 30)
returns table (chamadas int, voltaram int)
language sql
stable
security invoker
set search_path = public
as $$
  with chamadas as (
    select cliente_id, min(contatado_em) as primeiro_contato
    from public.reativacao_contatos
    where contatado_em > now() - make_interval(days => greatest(least(coalesce(p_janela, 30), 365), 1))
    group by cliente_id
  )
  select
    count(*)::int,
    count(*) filter (where exists (
      select 1 from public.visitas v
      where v.cliente_id = ch.cliente_id and v.cancelada_em is null and v.criado_em > ch.primeiro_contato
    ))::int
  from chamadas ch;
$$;

revoke all on function public.clientes_para_reativar(int)               from public, anon;
revoke all on function public.registrar_contato_reativacao(uuid, uuid)  from public, anon;
revoke all on function public.resumo_reativacao(int)                    from public, anon;
grant execute on function public.clientes_para_reativar(int)              to authenticated;
grant execute on function public.registrar_contato_reativacao(uuid, uuid) to authenticated;
grant execute on function public.resumo_reativacao(int)                   to authenticated;
