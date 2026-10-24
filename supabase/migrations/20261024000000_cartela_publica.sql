-- Link público da cartela: a cliente abre sem login.
-- O token é o que protege o link: 122 bits aleatórios, impossível de adivinhar.

alter table public.clientes
  add column token_publico text not null default replace(gen_random_uuid()::text, '-', '');

create unique index clientes_token_publico on public.clientes (token_publico);

-- Devolve só o mínimo para a página pública: primeiro nome, salão e carimbos.
-- Nada de telefone, e-mail ou sobrenome.
create or replace function public.cartela_publica(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cliente public.clientes;
  v_salao   text;
  v_cartela public.cartelas;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return null;
  end if;

  select * into v_cliente from public.clientes where token_publico = p_token;
  if not found then
    return null;
  end if;

  select nome into v_salao from public.saloes where id = v_cliente.salao_id;

  select * into v_cartela
  from public.cartelas
  where cliente_id = v_cliente.id and status in ('aberta', 'completa')
  order by (status = 'aberta') desc, criado_em desc
  limit 1;

  return jsonb_build_object(
    'primeiro_nome', split_part(trim(v_cliente.nome), ' ', 1),
    'salao', v_salao,
    'meta_carimbos', coalesce(v_cartela.meta_carimbos, 10),
    'carimbos', coalesce((
      select jsonb_agg(cb.origem order by cb.criado_em)
      from public.carimbos cb
      where cb.cartela_id = v_cartela.id and cb.cancelado_em is null
    ), '[]'::jsonb),
    'premio_disponivel', exists (
      select 1 from public.cartelas
      where cliente_id = v_cliente.id and status = 'completa'
    )
  );
end;
$$;

revoke all on function public.cartela_publica(text) from public;
grant execute on function public.cartela_publica(text) to anon, authenticated;
