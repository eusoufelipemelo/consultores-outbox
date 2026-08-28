-- Fixo do Consultor: enquadramento de cada consultor no cadastro.
--
-- O valor pago e o mesmo para todo mundo. O que muda e a rubrica: para PJ sai
-- como parcela fixa contra nota fiscal, para PF entra dentro da comissao.
-- Campo administrativo, nunca aparece na tela do consultor.

alter table public.profiles
  add column if not exists enquadramento text not null default 'pf';

alter table public.profiles
  drop constraint if exists profiles_enquadramento_check;

alter table public.profiles
  add constraint profiles_enquadramento_check
  check (enquadramento in ('pf', 'pj'));

comment on column public.profiles.enquadramento is
  'pf ou pj. Define so a forma de pagamento do Fixo do Consultor, nunca o valor.';

-- sem isso o PostgREST continua servindo o schema antigo e a coluna nao aparece
notify pgrst, 'reload schema';

-- conferencia
select enquadramento, count(*) as consultores
from public.profiles
where role = 'consultor'
group by enquadramento;
