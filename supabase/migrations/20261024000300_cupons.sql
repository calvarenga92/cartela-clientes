-- Cupons de desconto: % ou R$, limite de usos e validade opcionais.
-- O uso só acontece pela função usar_cupom, que confere tudo numa transação.

create table public.cupons (
  id           uuid primary key default gen_random_uuid(),
  salao_id     uuid not null references public.saloes (id) on delete cascade,
  codigo       text not null check (codigo ~ '^[A-Z0-9-]{4,20}$'),
  tipo         text not null check (tipo in ('percentual', 'valor')),
  valor        numeric(10, 2) not null check (valor > 0),
  descricao    text,
  limite_usos  int check (limite_usos is null or limite_usos > 0), -- null = sem limite
  validade     date, -- null = não vence; vale até o fim do dia (horário de SP)
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now(),
  constraint percentual_ate_100 check (tipo <> 'percentual' or valor <= 100)
);

create unique index cupons_codigo_por_salao on public.cupons (salao_id, codigo);

create table public.cupom_usos (
  id           uuid primary key default gen_random_uuid(),
  salao_id     uuid not null references public.saloes (id) on delete cascade,
  cupom_id     uuid not null references public.cupons (id) on delete cascade,
  usado_em     timestamptz not null default now(),
  cancelado_em timestamptz
);

create index cupom_usos_cupom_idx on public.cupom_usos (cupom_id) where cancelado_em is null;

-- -----------------------------------------------------------------------------
-- RLS: cupom é do salão; uso só pelas funções
-- -----------------------------------------------------------------------------

alter table public.cupons     enable row level security;
alter table public.cupom_usos enable row level security;

create policy cupons_do_salao on public.cupons
  for all to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()))
  with check (salao_id in (select id from public.saloes where dono_id = auth.uid()));

create policy cupom_usos_leitura on public.cupom_usos
  for select to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()));

grant select, insert, update on public.cupons to authenticated;
grant select on public.cupom_usos to authenticated;

-- -----------------------------------------------------------------------------
-- Funções
-- -----------------------------------------------------------------------------

create or replace function public.usar_cupom(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cupom public.cupons;
  v_usados int;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_uso_id uuid;
begin
  -- Trava a linha do cupom: dois usos simultâneos do último vale entram em fila.
  select c.* into v_cupom
  from public.cupons c
  join public.saloes s on s.id = c.salao_id
  where c.codigo = upper(trim(p_codigo)) and s.dono_id = auth.uid()
  for update of c;

  if not found then
    raise exception 'Cupom não encontrado' using errcode = 'P0002';
  end if;
  if not v_cupom.ativo then
    raise exception 'Cupom desativado' using errcode = 'P0001';
  end if;
  if v_cupom.validade is not null and v_hoje > v_cupom.validade then
    raise exception 'Cupom vencido em %', to_char(v_cupom.validade, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;

  select count(*) into v_usados from public.cupom_usos where cupom_id = v_cupom.id and cancelado_em is null;
  if v_cupom.limite_usos is not null and v_usados >= v_cupom.limite_usos then
    raise exception 'Cupom esgotado (% de % usos)', v_usados, v_cupom.limite_usos using errcode = 'P0001';
  end if;

  insert into public.cupom_usos (salao_id, cupom_id) values (v_cupom.salao_id, v_cupom.id)
  returning id into v_uso_id;

  return jsonb_build_object(
    'uso_id', v_uso_id,
    'codigo', v_cupom.codigo,
    'tipo', v_cupom.tipo,
    'valor', v_cupom.valor,
    'descricao', v_cupom.descricao,
    'usos', v_usados + 1,
    'limite_usos', v_cupom.limite_usos
  );
end;
$$;

create or replace function public.desfazer_uso_cupom(p_uso_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cupom_usos u
  set cancelado_em = now()
  from public.saloes s
  where u.id = p_uso_id and s.id = u.salao_id and s.dono_id = auth.uid() and u.cancelado_em is null;

  if not found then
    raise exception 'Uso não encontrado ou já desfeito' using errcode = 'P0002';
  end if;
end;
$$;

-- Lista com quantos usos válidos cada cupom já teve.
create or replace function public.listar_cupons()
returns table (
  id uuid,
  codigo text,
  tipo text,
  valor numeric,
  descricao text,
  limite_usos int,
  validade date,
  ativo boolean,
  usos int,
  criado_em timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id, c.codigo, c.tipo, c.valor, c.descricao, c.limite_usos, c.validade, c.ativo,
         (select count(*)::int from public.cupom_usos u where u.cupom_id = c.id and u.cancelado_em is null),
         c.criado_em
  from public.cupons c
  order by c.ativo desc, c.criado_em desc
  limit 200;
$$;

revoke all on function public.usar_cupom(text)         from public, anon;
revoke all on function public.desfazer_uso_cupom(uuid) from public, anon;
revoke all on function public.listar_cupons()          from public, anon;
grant execute on function public.usar_cupom(text)         to authenticated;
grant execute on function public.desfazer_uso_cupom(uuid) to authenticated;
grant execute on function public.listar_cupons()          to authenticated;
