-- =============================================================================
-- Telefone obrigatório e único por salão + busca de clientes
--
-- Decisões (20/10):
--   - Telefone identifica a cliente: evita cadastro duplicado, que dividiria
--     os carimbos em duas cartelas
--   - Guardado só com dígitos (DDD + número): a máscara é responsabilidade da UI
--   - Busca por nome (ignorando acento e maiúscula) ou por telefone
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Telefone
-- -----------------------------------------------------------------------------

alter table public.clientes
  alter column telefone set not null,
  add constraint telefone_so_digitos check (telefone ~ '^[0-9]{10,11}$');

create unique index clientes_telefone_por_salao on public.clientes (salao_id, telefone);

-- E-mail, quando informado, também não se repete no salão
create unique index clientes_email_por_salao on public.clientes (salao_id, lower(email))
  where email is not null;

-- -----------------------------------------------------------------------------
-- Busca
-- -----------------------------------------------------------------------------

-- unaccent não é IMMUTABLE por padrão; este wrapper permite usá-lo em índices
-- e deixa o planner otimizar. Seguro porque o dicionário usado é fixo.
create or replace function public.sem_acento(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, '')));
$$;

create index clientes_nome_sem_acento_idx on public.clientes (salao_id, public.sem_acento(nome));

-- Lista clientes do salão da usuária, com o progresso da cartela aberta (ou completa).
-- SECURITY INVOKER: roda com as permissões de quem chama, então o RLS filtra o salão.
create or replace function public.buscar_clientes(p_termo text default '')
returns table (
  id            uuid,
  nome          text,
  telefone      text,
  carimbos      int,
  meta_carimbos int,
  premio_disponivel boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with termo as (
    select
      public.sem_acento(trim(coalesce(p_termo, ''))) as texto,
      regexp_replace(coalesce(p_termo, ''), '[^0-9]', '', 'g') as digitos
  )
  select
    c.id,
    c.nome,
    c.telefone,
    coalesce((
      select count(*)::int from public.carimbos cb
      where cb.cartela_id = ct.id and cb.cancelado_em is null
    ), 0) as carimbos,
    coalesce(ct.meta_carimbos, 10) as meta_carimbos,
    exists (
      select 1 from public.cartelas cc
      where cc.cliente_id = c.id and cc.status = 'completa'
    ) as premio_disponivel
  from public.clientes c
  cross join termo t
  left join lateral (
    -- cartela "atual": a aberta; se não houver, a completa mais recente
    select * from public.cartelas x
    where x.cliente_id = c.id and x.status in ('aberta', 'completa')
    order by (x.status = 'aberta') desc, x.criado_em desc
    limit 1
  ) ct on true
  where
    t.texto = ''
    or public.sem_acento(c.nome) like '%' || t.texto || '%'
    or (length(t.digitos) >= 3 and c.telefone like '%' || t.digitos || '%')
  order by public.sem_acento(c.nome)
  limit 50;
$$;

revoke all on function public.buscar_clientes(text) from public, anon;
grant execute on function public.buscar_clientes(text) to authenticated;
grant execute on function public.sem_acento(text) to authenticated;
