-- ============================================================
-- Contas vinculadas: a conta de admin e a conta de consultor da
-- mesma pessoa viram um par. Quem entra por qualquer uma das duas
-- alterna entre os painéis sem sair e entrar de novo.
-- ============================================================

-- 1) o par
alter table public.profiles
  add column if not exists conta_vinculada uuid references public.profiles(id) on delete set null;

-- 2) "posso agir como esta conta?" — a minha e a que está vinculada a ela
create or replace function public.pode_agir_como(p_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select p_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and conta_vinculada = p_id)
      or exists (select 1 from public.profiles where id = p_id       and conta_vinculada = auth.uid());
$$;

-- 3) é admin quem tem o papel OU quem tem uma conta de admin vinculada
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1
      from public.profiles p
      left join public.profiles v on v.id = p.conta_vinculada
     where p.id = auth.uid()
       and (p.role = 'admin' or v.role = 'admin')
  );
$$;

-- 4) o vínculo só pode ser criado por um administrador de verdade.
--    Sem isto, um consultor poderia se vincular a um admin editando o próprio
--    perfil e ganhar acesso total.
create or replace function public.trava_conta_vinculada()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if auth.uid() is null then return new; end if;                 -- service role / migração
  if tg_op = 'INSERT' and new.conta_vinculada is null then return new; end if;
  if tg_op = 'UPDATE' and new.conta_vinculada is not distinct from old.conta_vinculada then return new; end if;
  -- repare: papel próprio, NÃO is_admin(), senão a conta vinculada religaria o vínculo
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Somente um administrador pode vincular contas';
  end if;
  return new;
end $$;

drop trigger if exists profiles_trava_vinculo on public.profiles;
create trigger profiles_trava_vinculo
  before insert or update on public.profiles
  for each row execute function public.trava_conta_vinculada();

-- 5) toda política que hoje exige consultor_id = auth.uid() passa a aceitar o par.
--    Só esse trecho da expressão muda; comando, papéis e o resto da regra ficam iguais.
do $$
declare r record; u text; c text; sql text;
begin
  for r in
    select schemaname, tablename, policyname, cmd, qual, with_check, roles, permissive
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '') like '%consultor_id = auth.uid()%'
         or coalesce(with_check, '') like '%consultor_id = auth.uid()%')
  loop
    -- regex e nao replace simples: ha politicas com apelido de tabela (p.consultor_id = auth.uid()),
    -- e a troca cega gerava "p.public.pode_agir_como(...)", que o Postgres rejeita.
    u := regexp_replace(r.qual,       '([a-zA-Z_][a-zA-Z0-9_]*\.)?consultor_id = auth\.uid\(\)', 'public.pode_agir_como(\1consultor_id)', 'g');
    c := regexp_replace(r.with_check, '([a-zA-Z_][a-zA-Z0-9_]*\.)?consultor_id = auth\.uid\(\)', 'public.pode_agir_como(\1consultor_id)', 'g');
    sql := format('create policy %I on %I.%I as %s for %s to %s',
                  r.policyname, r.schemaname, r.tablename,
                  case when r.permissive = 'PERMISSIVE' then 'permissive' else 'restrictive' end,
                  r.cmd, array_to_string(r.roles, ','));
    if u is not null then sql := sql || ' using (' || u || ')'; end if;
    if c is not null then sql := sql || ' with check (' || c || ')'; end if;
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    execute sql;
  end loop;
end $$;

-- 6) avisa a API do Supabase que o schema mudou (senao ela diz que nao acha a coluna)
notify pgrst, 'reload schema';
