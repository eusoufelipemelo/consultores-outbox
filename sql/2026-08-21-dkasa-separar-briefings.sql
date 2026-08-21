-- DKASA MOVEIS PLANEJADOS / Boa Vista Brasilia
-- Separa os dois briefings da cliente em documentos proprios dentro do sistema.
--
-- Contexto: em 20/08/2026 a cliente preencheu os dois briefings (site e
-- apresentacao). O sistema gravava os dois no mesmo campo, entao o segundo
-- envio apagou o primeiro. O bloco especifico de site nao e recuperavel e fica
-- marcado como EM ABERTO, para ninguem confundir reconstrucao com resposta dela.
--
-- Rodar uma vez no SQL Editor do Supabase.

with t as (
  select briefing_respostas as txt
  from public.projetos
  where id = 'd36c73de-1058-407c-8cb0-1a7f64befa4e'::uuid
), p as (
  select btrim(split_part(txt, 'ESTRUTURA E SLIDES', 1)) as comum,
         btrim('MATERIAIS E CONTATO' || split_part(txt, 'MATERIAIS E CONTATO', 2)) as contato
  from t
)
update public.projetos set
  briefing_por_servico = coalesce(briefing_por_servico, '{}'::jsonb) || jsonb_build_object(
    'site',
      (select comum from p) || chr(10) || chr(10) ||
      $b$O PROJETO E O ESTILO
• AVISO DA OUTBOX: As respostas desta secao foram perdidas em 20/08/2026 por uma falha do sistema, que gravava os dois briefings da cliente no mesmo campo. As demais secoes deste documento vieram do formulario preenchido pela propria cliente, na mesma data, e valem igualmente para o site. As perguntas abaixo continuam em aberto.
• O nome do site a ser desenvolvido sera: EM ABERTO, confirmar com a cliente
• Endereco (dominio), caso ja tenha: EM ABERTO, confirmar com a cliente
• Secoes ou paginas que nao podem faltar: EM ABERTO, confirmar com a cliente
• Quais atributos devem descrever o projeto: EM ABERTO, confirmar com a cliente
• Ja tem em mente alguma aparencia? Descreva e cole links de referencia: EM ABERTO, confirmar com a cliente
• Cite no minimo 3 sites que voce gosta do layout e da navegacao (com links): EM ABERTO, confirmar com a cliente
• O que voce definitivamente NAO quer ver no seu site: EM ABERTO, confirmar com a cliente
• Existe um padrao a seguir? (cores, tipografias, manual da marca): EM ABERTO, confirmar com a cliente
• Tem preferencia de cores? A marca ja tem identidade visual: EM ABERTO, confirmar com a cliente
• Voce ja tem os textos (copy) prontos ou precisa da nossa redacao: EM ABERTO, confirmar com a cliente$b$
      || chr(10) || chr(10) || (select contato from p),
    'apresentacao',
      (select txt from t) || chr(10) || chr(10) ||
      $a$OBSERVACAO DA OUTBOX
• Secao nao registrada: a etapa "A apresentacao" (titulo, objetivo, onde sera usada, quem apresenta, duracao, momento da negociacao, objecoes, atributos, cores, padrao, referencias e o que evitar) nao consta no envio gravado em 20/08/2026. Confirmar esses pontos com a cliente antes da producao.$a$
  )
where id = 'd36c73de-1058-407c-8cb0-1a7f64befa4e'::uuid;

-- conferencia
select jsonb_object_keys(briefing_por_servico) as servico,
       length(briefing_por_servico->>'site') as tam_site,
       length(briefing_por_servico->>'apresentacao') as tam_apn,
       length(briefing_respostas) as tam_original
from public.projetos
where id = 'd36c73de-1058-407c-8cb0-1a7f64befa4e'::uuid;
