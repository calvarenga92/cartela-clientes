-- =============================================================================
-- Permissões explícitas da API (menor privilégio)
--
-- O projeto não expõe tabelas automaticamente. Aqui liberamos só o necessário
-- para o papel `authenticated`. O papel `anon` (visitante sem login) não
-- recebe acesso a nenhuma tabela. O RLS continua filtrando as linhas por salão.
-- =============================================================================

grant usage on schema public to authenticated;

-- Salão: a dona cria e edita o próprio (onboarding)
grant select, insert, update on public.saloes to authenticated;

-- Clientes: CRUD direto pelo app
grant select, insert, update, delete on public.clientes to authenticated;

-- Cartelas, visitas e carimbos: só leitura direta.
-- Escrita acontece exclusivamente pelas funções (registrar_visita etc.)
grant select on public.cartelas to authenticated;
grant select on public.visitas  to authenticated;
grant select on public.carimbos to authenticated;

-- Garantia extra: visitante sem login não acessa nada
revoke all on all tables in schema public from anon;
