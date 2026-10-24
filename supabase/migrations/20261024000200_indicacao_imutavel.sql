-- Indicação é definida no cadastro e não muda mais.
-- Única exceção: a indicadora foi excluída e a FK zera o vínculo (on delete set null).

create or replace function public._travar_indicacao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.indicada_por_id is not distinct from old.indicada_por_id then
    return new;
  end if;

  if new.indicada_por_id is null
     and not exists (select 1 from public.clientes where id = old.indicada_por_id) then
    return new;
  end if;

  raise exception 'A indicação não pode ser alterada depois do cadastro' using errcode = 'P0001';
end;
$$;

create trigger clientes_indicacao_imutavel
  before update of indicada_por_id on public.clientes
  for each row execute function public._travar_indicacao();
