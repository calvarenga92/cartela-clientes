-- =============================================================================
-- Cartela Clientes — schema inicial
--
-- Regras de negócio:
--   1. Todo atendimento normal gera 1 carimbo
--   2. Primeira visita de cliente indicada: o carimbo vai para quem indicou
--   3. Visitas seguintes da indicada: carimbo para ela mesma
--   4. Visita de prêmio não gera carimbo
--   5. Carimbos de visita, indicação e manuais somam na mesma cartela
--   6. Cartela completa com `meta_carimbos` (padrão 10); não expira
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------

create table public.saloes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  dono_id    uuid not null references auth.users (id) on delete cascade,
  criado_em  timestamptz not null default now()
);

create table public.clientes (
  id                    uuid primary key default gen_random_uuid(),
  salao_id              uuid not null references public.saloes (id) on delete cascade,
  nome                  text not null check (length(trim(nome)) > 0),
  telefone              text,
  email                 text,
  aniversario           date,
  observacoes           text,
  indicada_por_id       uuid references public.clientes (id) on delete set null,
  consentimento_lgpd_em timestamptz,
  criado_em             timestamptz not null default now(),
  constraint cliente_nao_indica_a_si_mesma check (indicada_por_id is null or indicada_por_id <> id)
);

create table public.cartelas (
  id             uuid primary key default gen_random_uuid(),
  salao_id       uuid not null references public.saloes (id) on delete cascade,
  cliente_id     uuid not null references public.clientes (id) on delete cascade,
  meta_carimbos  int  not null default 10 check (meta_carimbos > 0),
  status         text not null default 'aberta' check (status in ('aberta', 'completa', 'resgatada')),
  completada_em  timestamptz,
  resgatada_em   timestamptz,
  criado_em      timestamptz not null default now()
);

create table public.visitas (
  id                    uuid primary key default gen_random_uuid(),
  salao_id              uuid not null references public.saloes (id) on delete cascade,
  cliente_id            uuid not null references public.clientes (id) on delete cascade,
  data                  date not null default current_date,
  servico               text,
  tipo                  text not null default 'normal' check (tipo in ('normal', 'premio')),
  cartela_resgatada_id  uuid references public.cartelas (id),
  chave_idempotencia    uuid unique, -- gerada pelo app a cada intenção de registro
  cancelada_em          timestamptz,
  criado_em             timestamptz not null default now(),
  constraint premio_exige_cartela check (
    (tipo = 'premio' and cartela_resgatada_id is not null)
    or (tipo = 'normal' and cartela_resgatada_id is null)
  )
);

create table public.carimbos (
  id            uuid primary key default gen_random_uuid(),
  salao_id      uuid not null references public.saloes (id) on delete cascade,
  cartela_id    uuid not null references public.cartelas (id) on delete cascade,
  cliente_id    uuid not null references public.clientes (id) on delete cascade, -- dona da cartela
  origem        text not null check (origem in ('visita', 'indicacao', 'manual')),
  visita_id     uuid references public.visitas (id),
  motivo        text,
  cancelado_em  timestamptz,
  criado_em     timestamptz not null default now(),
  constraint manual_exige_motivo check (origem <> 'manual' or motivo is not null),
  constraint visita_ou_manual check (
    (origem = 'manual' and visita_id is null)
    or (origem <> 'manual' and visita_id is not null)
  )
);

-- -----------------------------------------------------------------------------
-- Índices e garantias de integridade
-- -----------------------------------------------------------------------------

-- Só uma cartela aberta por cliente
create unique index cartela_aberta_unica on public.cartelas (cliente_id) where status = 'aberta';

-- Uma visita gera no máximo um carimbo válido (proteção contra duplo registro)
create unique index carimbo_por_visita_unico on public.carimbos (visita_id)
  where visita_id is not null and cancelado_em is null;

-- Uma cartela só pode ser resgatada por uma visita de prêmio válida
create unique index premio_por_cartela_unico on public.visitas (cartela_resgatada_id)
  where cartela_resgatada_id is not null and cancelada_em is null;

create index clientes_salao_nome_idx on public.clientes (salao_id, lower(nome));
create index visitas_cliente_idx     on public.visitas (cliente_id, data desc);
create index carimbos_cartela_idx    on public.carimbos (cartela_id) where cancelado_em is null;

-- -----------------------------------------------------------------------------
-- Row Level Security: cada dona só enxerga o próprio salão
-- -----------------------------------------------------------------------------

alter table public.saloes   enable row level security;
alter table public.clientes enable row level security;
alter table public.cartelas enable row level security;
alter table public.visitas  enable row level security;
alter table public.carimbos enable row level security;

create policy saloes_do_dono on public.saloes
  for all to authenticated
  using (dono_id = auth.uid())
  with check (dono_id = auth.uid());

create policy clientes_do_salao on public.clientes
  for all to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()))
  with check (salao_id in (select id from public.saloes where dono_id = auth.uid()));

-- Cartelas, visitas e carimbos: leitura direta liberada; escrita só pelas funções abaixo
create policy cartelas_leitura on public.cartelas
  for select to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()));

create policy visitas_leitura on public.visitas
  for select to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()));

create policy carimbos_leitura on public.carimbos
  for select to authenticated
  using (salao_id in (select id from public.saloes where dono_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- Funções internas
-- -----------------------------------------------------------------------------

-- Busca o cliente garantindo que pertence a um salão do usuário logado.
-- Trava a linha (FOR UPDATE) para serializar operações simultâneas na mesma cliente.
create or replace function public._cliente_do_usuario(p_cliente_id uuid)
returns public.clientes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente public.clientes;
begin
  select c.* into v_cliente
  from public.clientes c
  join public.saloes s on s.id = c.salao_id
  where c.id = p_cliente_id
    and s.dono_id = auth.uid()
  for update of c;

  if not found then
    raise exception 'Cliente não encontrada' using errcode = 'P0002';
  end if;

  return v_cliente;
end;
$$;

-- Retorna a cartela aberta da cliente, criando uma se não existir.
create or replace function public._cartela_aberta(p_cliente_id uuid, p_salao_id uuid)
returns public.cartelas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cartela public.cartelas;
begin
  select * into v_cartela
  from public.cartelas
  where cliente_id = p_cliente_id and status = 'aberta'
  for update;

  if not found then
    -- ON CONFLICT cobre a corrida de duas transações criando a cartela ao mesmo tempo
    insert into public.cartelas (salao_id, cliente_id)
    values (p_salao_id, p_cliente_id)
    on conflict (cliente_id) where status = 'aberta' do nothing;

    select * into v_cartela
    from public.cartelas
    where cliente_id = p_cliente_id and status = 'aberta'
    for update;
  end if;

  return v_cartela;
end;
$$;

-- Fecha a cartela se atingiu a meta. Retorna o total de carimbos válidos.
create or replace function public._atualizar_status_cartela(p_cartela_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_meta  int;
begin
  select count(*) into v_total
  from public.carimbos
  where cartela_id = p_cartela_id and cancelado_em is null;

  select meta_carimbos into v_meta from public.cartelas where id = p_cartela_id;

  if v_total >= v_meta then
    update public.cartelas
    set status = 'completa', completada_em = coalesce(completada_em, now())
    where id = p_cartela_id and status = 'aberta';
  end if;

  return v_total;
end;
$$;

-- Monta o JSON de resposta com o estado atual de uma cartela.
create or replace function public._cartela_json(p_cartela_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',            ct.id,
    'cliente_id',    ct.cliente_id,
    'status',        ct.status,
    'meta_carimbos', ct.meta_carimbos,
    'carimbos',      (select count(*) from public.carimbos cb
                      where cb.cartela_id = ct.id and cb.cancelado_em is null)
  )
  from public.cartelas ct
  where ct.id = p_cartela_id;
$$;

-- -----------------------------------------------------------------------------
-- API pública (chamada pelo app via supabase.rpc)
-- -----------------------------------------------------------------------------

-- Registra um atendimento normal e distribui o carimbo conforme as regras.
-- p_chave_idempotencia: se a mesma chave chegar duas vezes (duplo toque, retry de rede),
-- a segunda chamada devolve o resultado da primeira em vez de criar outra visita.
create or replace function public.registrar_visita(
  p_cliente_id         uuid,
  p_servico            text default null,
  p_data               date default current_date,
  p_chave_idempotencia uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente       public.clientes;
  v_primeira      boolean;
  v_visita_id     uuid;
  v_beneficiaria  uuid;
  v_origem        text;
  v_cartela       public.cartelas;
begin
  -- Trava a cliente: chamadas simultâneas para ela passam a rodar em fila
  v_cliente := public._cliente_do_usuario(p_cliente_id);

  if p_chave_idempotencia is not null then
    select v.id into v_visita_id
    from public.visitas v
    where v.chave_idempotencia = p_chave_idempotencia;

    if found then
      select cb.cliente_id, cb.origem, cb.cartela_id
        into v_beneficiaria, v_origem, v_cartela.id
      from public.carimbos cb
      where cb.visita_id = v_visita_id;

      return jsonb_build_object(
        'visita_id',       v_visita_id,
        'origem',          v_origem,
        'beneficiaria_id', v_beneficiaria,
        'cartela',         public._cartela_json(v_cartela.id),
        'repetida',        true
      );
    end if;
  end if;

  v_primeira := not exists (
    select 1 from public.visitas
    where cliente_id = v_cliente.id and cancelada_em is null
  );

  insert into public.visitas (salao_id, cliente_id, data, servico, tipo, chave_idempotencia)
  values (v_cliente.salao_id, v_cliente.id, p_data, p_servico, 'normal', p_chave_idempotencia)
  returning id into v_visita_id;

  if v_primeira and v_cliente.indicada_por_id is not null then
    v_beneficiaria := v_cliente.indicada_por_id;
    v_origem       := 'indicacao';
  else
    v_beneficiaria := v_cliente.id;
    v_origem       := 'visita';
  end if;

  v_cartela := public._cartela_aberta(v_beneficiaria, v_cliente.salao_id);

  insert into public.carimbos (salao_id, cartela_id, cliente_id, origem, visita_id)
  values (v_cliente.salao_id, v_cartela.id, v_beneficiaria, v_origem, v_visita_id);

  perform public._atualizar_status_cartela(v_cartela.id);

  return jsonb_build_object(
    'visita_id',       v_visita_id,
    'origem',          v_origem,
    'beneficiaria_id', v_beneficiaria,
    'cartela',         public._cartela_json(v_cartela.id),
    'repetida',        false
  );
end;
$$;

-- Usa o prêmio de uma cartela completa. Não gera carimbo.
create or replace function public.resgatar_premio(
  p_cartela_id uuid,
  p_servico    text default null,
  p_data       date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cartela   public.cartelas;
  v_visita_id uuid;
begin
  select ct.* into v_cartela
  from public.cartelas ct
  join public.saloes s on s.id = ct.salao_id
  where ct.id = p_cartela_id and s.dono_id = auth.uid()
  for update of ct;

  if not found then
    raise exception 'Cartela não encontrada' using errcode = 'P0002';
  end if;

  if v_cartela.status <> 'completa' then
    raise exception 'Cartela ainda não está completa (status: %)', v_cartela.status
      using errcode = 'P0001';
  end if;

  insert into public.visitas (salao_id, cliente_id, data, servico, tipo, cartela_resgatada_id)
  values (v_cartela.salao_id, v_cartela.cliente_id, p_data, p_servico, 'premio', v_cartela.id)
  returning id into v_visita_id;

  update public.cartelas
  set status = 'resgatada', resgatada_em = now()
  where id = v_cartela.id;

  return jsonb_build_object(
    'visita_id', v_visita_id,
    'cartela',   public._cartela_json(v_cartela.id)
  );
end;
$$;

-- Carimbo fora da regra, concedido manualmente pela dona do salão.
create or replace function public.conceder_carimbo(
  p_cliente_id uuid,
  p_motivo     text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente public.clientes;
  v_cartela public.cartelas;
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'Informe o motivo do carimbo manual' using errcode = 'P0001';
  end if;

  v_cliente := public._cliente_do_usuario(p_cliente_id);
  v_cartela := public._cartela_aberta(v_cliente.id, v_cliente.salao_id);

  insert into public.carimbos (salao_id, cartela_id, cliente_id, origem, motivo)
  values (v_cliente.salao_id, v_cartela.id, v_cliente.id, 'manual', trim(p_motivo));

  perform public._atualizar_status_cartela(v_cartela.id);

  return jsonb_build_object('cartela', public._cartela_json(v_cartela.id));
end;
$$;

-- Desfaz uma visita (normal ou prêmio) e reverte seus efeitos.
create or replace function public.desfazer_visita(p_visita_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visita     public.visitas;
  v_carimbo    public.carimbos;
  v_total      int;
  v_meta       int;
  v_cartela_id uuid;
begin
  select v.* into v_visita
  from public.visitas v
  join public.saloes s on s.id = v.salao_id
  where v.id = p_visita_id and s.dono_id = auth.uid()
  for update of v;

  if not found then
    raise exception 'Visita não encontrada' using errcode = 'P0002';
  end if;

  if v_visita.cancelada_em is not null then
    raise exception 'Visita já foi desfeita' using errcode = 'P0001';
  end if;

  update public.visitas set cancelada_em = now() where id = v_visita.id;

  if v_visita.tipo = 'premio' then
    -- Prêmio desfeito: a cartela volta a ficar disponível para resgate
    update public.cartelas
    set status = 'completa', resgatada_em = null
    where id = v_visita.cartela_resgatada_id;
    v_cartela_id := v_visita.cartela_resgatada_id;
  else
    update public.carimbos
    set cancelado_em = now()
    where visita_id = v_visita.id and cancelado_em is null
    returning * into v_carimbo;

    v_cartela_id := v_carimbo.cartela_id;

    if v_cartela_id is not null then
      select count(*) into v_total
      from public.carimbos where cartela_id = v_cartela_id and cancelado_em is null;

      select meta_carimbos into v_meta from public.cartelas where id = v_cartela_id;

      -- Cartela que tinha completado por causa deste carimbo volta a ficar aberta,
      -- desde que a cliente ainda não tenha outra cartela aberta.
      if v_total < v_meta and not exists (
        select 1 from public.cartelas
        where cliente_id = v_carimbo.cliente_id and status = 'aberta' and id <> v_cartela_id
      ) then
        update public.cartelas
        set status = 'aberta', completada_em = null
        where id = v_cartela_id and status = 'completa';
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'visita_id', v_visita.id,
    'cartela',   case when v_cartela_id is null then null
                      else public._cartela_json(v_cartela_id) end
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissões: funções internas não são expostas na API
-- -----------------------------------------------------------------------------

revoke all on function public._cliente_do_usuario(uuid)        from public, anon, authenticated;
revoke all on function public._cartela_aberta(uuid, uuid)      from public, anon, authenticated;
revoke all on function public._atualizar_status_cartela(uuid)  from public, anon, authenticated;
revoke all on function public._cartela_json(uuid)              from public, anon, authenticated;

revoke all on function public.registrar_visita(uuid, text, date, uuid) from public, anon;
revoke all on function public.resgatar_premio(uuid, text, date)  from public, anon;
revoke all on function public.conceder_carimbo(uuid, text)       from public, anon;
revoke all on function public.desfazer_visita(uuid)              from public, anon;

grant execute on function public.registrar_visita(uuid, text, date, uuid) to authenticated;
grant execute on function public.resgatar_premio(uuid, text, date)  to authenticated;
grant execute on function public.conceder_carimbo(uuid, text)       to authenticated;
grant execute on function public.desfazer_visita(uuid)              to authenticated;
