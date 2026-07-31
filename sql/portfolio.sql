-- Portfólio gerenciável pelo admin (inserir, tirar do ar, excluir), em tempo real.
-- A lista original continua como semente em js/data.js; esta tabela entra por cima.
create table if not exists public.portfolio_itens (
  id            text primary key,
  categoria     text default 'sites',   -- sites | ecommerce | identidade | brandbook | sistemas
  nome          text not null,
  link          text,
  img           text,                   -- caminho em assets/ (semente) ou imagem enviada pelo admin
  nicho         text,                   -- vira o filtro que o consultor usa
  ativo         boolean default true,   -- false = fora do ar (some para o consultor)
  ordem         integer default 0,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.portfolio_itens enable row level security;
create index if not exists portfolio_itens_ordem_idx on public.portfolio_itens (ordem);

drop policy if exists "portfolio leitura" on public.portfolio_itens;
create policy "portfolio leitura" on public.portfolio_itens for select using (true);

drop policy if exists "portfolio admin" on public.portfolio_itens;
create policy "portfolio admin" on public.portfolio_itens
  for all using (public.is_admin()) with check (public.is_admin());

-- realtime: o consultor vê a mudança sem recarregar
do $blk$
begin
  alter publication supabase_realtime add table public.portfolio_itens;
exception when duplicate_object then null;
end $blk$;

notify pgrst, 'reload schema';
