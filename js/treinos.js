/* ============================================================
   OutBox Consultores — Conteúdo dos Treinamentos (treinos.js)
   Quizzes por produto. Cada pergunta tem nível de dificuldade,
   4 alternativas, a correta (índice) e uma explicação didática
   que ensina o conceito e tira a dúvida, acertando ou errando.
   ============================================================ */
const TREINOS = {
  /* nota mínima (%) para ser aprovado em qualquer treinamento */
  OBJETIVO: 70,

  /* níveis de dificuldade (cor + rótulo) */
  NIVEIS: {
    basico:        { nome: 'Básico',        chip: 'green' },
    intermediario: { nome: 'Intermediário', chip: 'warn' },
    avancado:      { nome: 'Avançado',      chip: 'brand' }
  },

  /* mapeia o produto da venda para o treinamento correspondente */
  PRODUTO_TREINO: { onepage: 'onepage', institucional: 'institucional', ecommerce: 'ecommerce', sistemas: 'sistemas', identidade: 'identidade' },
  treinoDoProduto(produtoId) {
    const tid = this.PRODUTO_TREINO[produtoId];
    if (!tid) return null;
    return this.PRODUTOS.find(p => p.id === tid) || null;
  },

  /* medalhas por faixa de nota final */
  medalha(nota) {
    if (nota >= 100) return { id: 'perfeito', nome: 'Especialista', cor: '#111111', sub: 'Gabaritou! Você domina esse produto.' };
    if (nota >= 90)  return { id: 'ouro',     nome: 'Ouro',        cor: '#C9A227', sub: 'Excelente! Você está pronto para vender com segurança.' };
    if (nota >= TREINOS.OBJETIVO) return { id: 'prata', nome: 'Prata', cor: '#9AA3AD', sub: 'Aprovado! Boa base para vender esse produto.' };
    return { id: 'treinar', nome: 'Continue treinando', cor: '#e0573f', sub: 'Quase lá. Revise as explicações e tente de novo.' };
  },

  /* catálogo de treinamentos de produto (ordem de exibição) */
  PRODUTOS: [
    { id: 'onepage',            nome: 'Site One Page',               icon: 'quote',   disponivel: true, resumo: 'O cartão de visitas digital: presença profissional em uma página, focada em conversão.' },
    { id: 'institucional',      nome: 'Site Institucional',          icon: 'docs',    disponivel: true, resumo: 'Várias páginas para empresas com mais conteúdo, credibilidade e SEO mais forte.' },
    { id: 'institucional-blog', nome: 'Site Institucional + Blog',   icon: 'docs',    disponivel: true, resumo: 'Institucional com blog para gerar conteúdo, autoridade e tráfego orgânico no Google.' },
    { id: 'hospedagem',         nome: 'Hospedagem',                  icon: 'shield',  disponivel: true, resumo: 'Onde o site mora para ficar no ar 24h: servidor, segurança e recorrência mensal.' },
    { id: 'identidade',         nome: 'Identidade Visual',           icon: 'edit',    disponivel: true, resumo: 'O rosto da marca: logo, cores e tipografia que profissionalizam o negócio.' },
    { id: 'brandbook',          nome: 'BrandBook',                   icon: 'receipt', disponivel: true, resumo: 'O manual completo da marca: regras de uso, tom de voz e consistência.' },
    { id: 'social',             nome: 'Social Media',                icon: 'share',   disponivel: true, resumo: 'Gestão das redes sociais: conteúdo, design e planejamento, com recorrência mensal.' },
    { id: 'ecommerce',          nome: 'E-commerce',                  icon: 'cart',    disponivel: true, resumo: 'Loja virtual completa: catálogo, carrinho, pagamento e frete para vender 24h.' },
    { id: 'ecommerce-catalogo', nome: 'E-commerce estilo Catálogo',  icon: 'cart',    disponivel: true, resumo: 'Vitrine online dos produtos com pedido pelo WhatsApp, sem checkout, mais acessível.' },
    { id: 'sistemas',           nome: 'Desenvolvimento de Sistemas', icon: 'kanban',  disponivel: true, resumo: 'Software sob medida para resolver um problema específico do negócio. Maior ticket.' }
  ],

  /* treinamentos de habilidade (como vender), não de produto */
  HABILIDADES: [
    { id: 'spin',           nome: 'Fundamentos de Vendas (SPIN)', icon: 'target',   disponivel: true, resumo: 'Venda fazendo as perguntas certas: Situação, Problema, Implicação e Necessidade.' },
    { id: 'prospeccao',     nome: 'Prospecção e Abordagem',       icon: 'users',    disponivel: true, resumo: 'Como encontrar clientes e fazer o primeiro contato sem parecer robô.' },
    { id: 'objecoes',       nome: 'Objeções Gerais',              icon: 'shield',   disponivel: true, resumo: 'Contorne "vou pensar", "tá caro" e "me manda no WhatsApp" com técnica.' },
    { id: 'sistema-outbox', nome: 'Como usar o Sistema',          icon: 'overview', disponivel: true, resumo: 'Domine o sistema: vendas, orçamentos, comissão, funil e onboarding do consultor.' }
  ],

  /* todos os treinamentos (produto + habilidade) e busca por id */
  disponiveis() { return this.PRODUTOS.concat(this.HABILIDADES).filter(p => p.disponivel); },
  buscar(id) { return this.PRODUTOS.find(p => p.id === id) || this.HABILIDADES.find(p => p.id === id) || null; },

  /* carga horária por treinamento (para o certificado) */
  HORAS: {
    onepage: 3, institucional: 3, 'institucional-blog': 3, hospedagem: 3, identidade: 3, brandbook: 3,
    social: 3, ecommerce: 4, 'ecommerce-catalogo': 3, sistemas: 4,
    spin: 4, prospeccao: 3, objecoes: 3, 'sistema-outbox': 2
  },
  horasDe(id) { return this.HORAS[id] || 2; },
  horasTotais() { return this.disponiveis().reduce((n, p) => n + this.horasDe(p.id), 0); },

  /* ============================================================
     QUIZ: SITE ONE PAGE
     ============================================================ */
  QUIZ: {
    onepage: {
      titulo: 'Site One Page',
      intro: 'Neste treinamento você vai dominar o produto mais vendido para quem quer entrar na internet: o Site One Page. Do conceito básico até como contornar objeções e fechar a venda. Responda com calma, leia as explicações de cada questão e mire nos 70% para ser aprovado.',
      perguntas: [
        /* ---------- BÁSICO ---------- */
        {
          nivel: 'basico',
          q: 'O que é, na prática, um Site One Page?',
          ops: [
            'Um site com várias páginas separadas por um menu grande',
            'Um site de página única, onde todo o conteúdo fica em uma só rolagem',
            'Um perfil turbinado no Instagram',
            'Um blog com muitos artigos publicados'
          ],
          correta: 1,
          exp: 'One Page significa "uma página". Todo o conteúdo do negócio fica junto, e o visitante navega rolando a tela (ou clicando em âncoras do menu que levam às seções). É direto, objetivo e ótimo no celular.'
        },
        {
          nivel: 'basico',
          q: 'Para qual tipo de cliente o One Page costuma ser a melhor indicação?',
          ops: [
            'Uma grande loja com milhares de produtos no catálogo',
            'Um portal de notícias com publicações diárias',
            'Um negócio com oferta enxuta que quer presença profissional rápida e foco em contato',
            'Uma empresa que precisa de dezenas de páginas e um blog ativo'
          ],
          correta: 2,
          exp: 'O One Page brilha quando a oferta é objetiva: profissional liberal, prestador de serviço, clínica, restaurante, lançamento. Quem tem muito produto ou muito conteúdo pede E-commerce ou Site Institucional.'
        },
        {
          nivel: 'basico',
          q: 'Como o visitante costuma navegar em um One Page?',
          ops: [
            'Trocando de página inteira a cada clique',
            'Rolando a página, e podendo usar um menu que leva direto às seções',
            'Apenas fazendo buscas dentro do site',
            'Baixando um PDF com as informações'
          ],
          correta: 1,
          exp: 'A navegação é por rolagem e por âncoras (o menu leva à seção certa na mesma página). Menos cliques e uma jornada guiada até o botão de ação, como WhatsApp ou formulário.'
        },
        /* ---------- INTERMEDIÁRIO ---------- */
        {
          nivel: 'intermediario',
          q: 'Qual é a diferença principal entre One Page e Site Institucional?',
          ops: [
            'Nenhuma, são exatamente a mesma coisa',
            'O Institucional não funciona no celular',
            'O One Page é sempre mais caro que o Institucional',
            'O One Page concentra tudo em uma página; o Institucional distribui o conteúdo em várias páginas'
          ],
          correta: 3,
          exp: 'One Page é objetividade e foco em conversão. Institucional tem várias páginas (Home, Sobre, Serviços, Contato), o que dá mais espaço para conteúdo, credibilidade e um SEO mais forte por página.'
        },
        {
          nivel: 'intermediario',
          q: 'Sobre One Page e Landing Page, qual afirmação está correta?',
          ops: [
            'São palavras diferentes para a mesma coisa, sem distinção',
            'A Landing Page foca em UMA ação de campanha; o One Page apresenta o negócio como um todo em uma página',
            'A Landing Page tem várias páginas com menu completo',
            'O One Page nunca pode ter formulário de contato'
          ],
          correta: 1,
          exp: 'Toda Landing Page é uma página só, mas com um objetivo único (capturar um lead, vender um produto, uma campanha). O One Page é o "cartão de visitas digital" completo do negócio, também em uma página.'
        },
        {
          nivel: 'intermediario',
          q: 'O que normalmente está incluso em um One Page da OutBox?',
          ops: [
            'Apenas o texto, sem design nenhum',
            'Um aplicativo para publicar na App Store',
            'Layout responsivo, seções essenciais, botão de WhatsApp ou formulário e SEO básico',
            'Um sistema completo de controle de estoque'
          ],
          correta: 2,
          exp: 'O pacote entrega presença pronta para converter: adaptado ao celular (responsivo), seções como topo, sobre, serviços e contato, canal direto (WhatsApp ou formulário) e otimização básica para o Google.'
        },
        {
          nivel: 'intermediario',
          q: 'Qual é uma grande vantagem do One Page para gerar contatos e vendas?',
          ops: [
            'Ter muitos menus e páginas para o cliente explorar por horas',
            'A jornada guiada em uma rolagem, levando o visitante direto ao botão de ação, com ótima experiência no celular',
            'Obrigar o visitante a criar uma conta antes de ver qualquer coisa',
            'Não precisar de textos nem de fotos'
          ],
          correta: 1,
          exp: 'Menos distração significa mais foco na ação. Como a maioria acessa pelo celular, a rolagem única é natural e conduz o visitante até o contato, aumentando a taxa de conversão.'
        },
        {
          nivel: 'intermediario',
          q: 'O que o cliente precisa fornecer para o projeto começar bem?',
          ops: [
            'Nada, a OutBox inventa tudo sozinha',
            'O código-fonte pronto do site',
            'Um servidor próprio configurado',
            'Logo (ou o pedido de criação), textos e informações do negócio, fotos e o objetivo do site'
          ],
          correta: 3,
          exp: 'Quanto melhor o material (logo, textos, fotos e objetivo), mais rápido e melhor fica o resultado. Se o cliente não tem logo, essa é a deixa perfeita para oferecer também a Identidade Visual.'
        },
        /* ---------- AVANÇADO ---------- */
        {
          nivel: 'avancado',
          q: 'O cliente diz: "Eu já tenho Instagram, por que preciso de um site?". Qual é a melhor resposta?',
          ops: [
            'Tem razão, se você tem Instagram não precisa de site',
            'O Instagram é uma casa alugada: as regras e o alcance não são seus. O site é seu, aparece no Google, passa mais credibilidade e converte melhor. Um complementa o outro',
            'Site é moda passageira, o Instagram já basta',
            'Sem site você nunca vai vender nada'
          ],
          correta: 1,
          exp: 'Nunca desmereça a rede social do cliente. Posicione o site como base própria: aparece no Google, é profissional e não depende de algoritmo. O Instagram atrai, o site converte e dá credibilidade.'
        },
        {
          nivel: 'avancado',
          q: 'Quando você NÃO deve indicar um One Page e sim um Site Institucional?',
          ops: [
            'Quando o cliente quer algo simples e com bom custo',
            'Quando o negócio tem muitas áreas ou serviços, precisa de várias páginas, blog ou um SEO mais robusto',
            'Sempre que o cliente já tiver um logo pronto',
            'Nunca, o One Page atende qualquer situação'
          ],
          correta: 1,
          exp: 'O divisor é o volume de conteúdo. Muitas áreas, necessidade de blog ou de rankear vários termos no Google pedem o Institucional. Indicar a solução certa gera confiança e abre espaço para novas vendas.'
        },
        {
          nivel: 'avancado',
          q: 'O cliente acha o One Page "caro". Qual a melhor abordagem?',
          ops: [
            'Dar 50% de desconto na hora para não perder a venda',
            'Concordar que realmente é caro',
            'Reforçar o valor: presença profissional, aparecer no Google e gerar contatos 24 horas; mostrar o retorno e o custo de não ter, não só o preço',
            'Dizer que é o mais barato do mercado'
          ],
          correta: 2,
          exp: 'Preço é objeção de valor percebido. Traga o retorno (um único cliente novo já paga o site), o profissionalismo e o custo de continuar sem presença digital. Descontão na hora desvaloriza o seu trabalho.'
        },
        {
          nivel: 'avancado',
          q: 'O cliente pergunta: "Um One Page aparece no Google?". Qual resposta é correta?',
          ops: [
            'Não, One Page nunca aparece no Google',
            'Só aparece se pagar anúncio todo mês',
            'O Google não consegue indexar site de uma página',
            'Sim. Ele já vem com SEO básico e, com Google Meu Negócio e boas práticas, é encontrado; para competir por muitos termos, o Institucional ajuda mais'
          ],
          correta: 3,
          exp: 'One Page é indexado e aparece, principalmente pelo nome do negócio e pela região. Para uma estratégia ampla de muitas palavras-chave, o Institucional (mais páginas) leva vantagem. Seja honesto: gera confiança.'
        },
        {
          nivel: 'avancado',
          q: 'Um cliente com mais de 20 serviços bem diferentes insiste em um One Page. O que fazer?',
          ops: [
            'Colocar os 20 serviços espremidos em uma página só',
            'Entender a necessidade: se dá para agrupar em poucos blocos, o One Page funciona; se cada serviço precisa de destaque e SEO próprio, recomendar o Institucional',
            'Recusar o cliente e encerrar a conversa',
            'Fazer 20 sites separados'
          ],
          correta: 1,
          exp: 'Consultoria vale mais que empurrar produto. Agrupar e priorizar pode manter o One Page; se não der, o Institucional entrega melhor. O cliente percebe que você quer o resultado dele, e isso fecha negócio.'
        },
        {
          nivel: 'avancado',
          q: 'Qual é o melhor gatilho de fechamento para o One Page?',
          ops: [
            'Pensa com calma e me chama quando quiser',
            'Com poucas informações suas a gente já coloca seu negócio no ar rápido e profissional. Consegue me enviar o logo e as fotos ainda hoje para começarmos?',
            'É por sua conta e risco se der errado',
            'Se você não fechar agora, o preço dobra amanhã'
          ],
          correta: 1,
          exp: 'Feche pela facilidade e proponha o próximo passo concreto (enviar o material). Isso gera ação imediata sem pressão agressiva nem urgência falsa, que quebram a confiança.'
        },
        {
          nivel: 'avancado',
          q: 'Sobre o investimento de um One Page na OutBox, o que é correto dizer ao cliente?',
          ops: [
            'É um preço fixo único, igual para todo mundo',
            'É sempre o produto mais caro do catálogo',
            'O valor acompanha o porte do cliente (pequena, média, grande, indústria); consulte a Tabela de Preços por Porte no sistema',
            'É de graça, só cobramos a hospedagem'
          ],
          correta: 2,
          exp: 'O investimento varia conforme o porte do cliente. Use a Tabela de Preços por Porte dentro do sistema para passar o valor certo com segurança e nunca "chutar" preço na frente do cliente.'
        }
      ]
    },

    institucional: {
      titulo: 'Site Institucional',
      intro: 'O Site Institucional é o produto para empresas que têm mais o que mostrar. Aqui você aprende a diferenciá-lo do One Page, defender o valor das várias páginas e do SEO, e conduzir a venda com segurança do básico ao avançado.',
      perguntas: [
        { nivel: 'basico', q: 'O que é um Site Institucional?', ops: ['Um site de uma página só com tudo junto', 'Um site com várias páginas (Home, Sobre, Serviços, Contato) que apresenta a empresa de forma completa', 'Uma loja virtual com carrinho e pagamento', 'Um perfil no Instagram'], correta: 1, exp: 'O Institucional distribui o conteúdo em várias páginas, dando mais espaço para a empresa mostrar quem é, o que faz e gerar credibilidade.' },
        { nivel: 'basico', q: 'Para qual cliente o Site Institucional é mais indicado?', ops: ['Quem quer só um cartão de visitas digital bem simples', 'Uma empresa com vários serviços ou áreas, que precisa de mais conteúdo e credibilidade', 'Quem só vende produtos físicos online', 'Quem não tem nenhuma informação para colocar no site'], correta: 1, exp: 'Quando o negócio tem bastante o que mostrar (serviços, unidades, equipe, cases), as várias páginas organizam tudo e passam mais seriedade.' },
        { nivel: 'basico', q: 'Quais páginas normalmente compõem um Site Institucional?', ops: ['Só uma página de contato', 'Home, Sobre, Serviços ou Produtos, Contato e outras conforme a necessidade', 'Apenas um blog', 'Somente a página de checkout'], correta: 1, exp: 'A estrutura clássica tem Home, Sobre, Serviços e Contato, e pode crescer com páginas como Unidades, Equipe, Portfólio ou Perguntas Frequentes.' },
        { nivel: 'intermediario', q: 'Qual a diferença principal entre One Page e Institucional?', ops: ['O Institucional não funciona no celular', 'O One Page concentra tudo em uma página; o Institucional divide em várias páginas, com mais espaço e SEO por página', 'O One Page é sempre mais caro', 'Não existe diferença'], correta: 1, exp: 'Mais páginas significam mais conteúdo organizado e mais oportunidades de aparecer no Google para termos diferentes. Por isso o Institucional é mais robusto.' },
        { nivel: 'intermediario', q: 'Por que o Institucional costuma ter vantagem no Google (SEO)?', ops: ['Porque tem menos conteúdo', 'Porque cada página pode ser otimizada para um termo diferente, ampliando as chances de ser encontrado', 'Porque o Google só indexa sites com muitas páginas', 'SEO não tem relação com número de páginas'], correta: 1, exp: 'Uma página por serviço ou por cidade, por exemplo, permite trabalhar palavras-chave específicas. Isso aumenta o alcance orgânico frente a um One Page.' },
        { nivel: 'intermediario', q: 'O que geralmente está incluso em um Site Institucional da OutBox?', ops: ['Só o texto, sem design', 'Várias páginas, layout responsivo, SEO básico, formulários de contato e integração com WhatsApp', 'Um sistema de estoque completo', 'Um aplicativo para celular'], correta: 1, exp: 'Além das páginas, entrega o essencial para converter e ser encontrado: responsivo, SEO básico, formulários e canais de contato.' },
        { nivel: 'intermediario', q: 'O que o cliente precisa fornecer para o projeto render bem?', ops: ['Nada, a OutBox cria tudo do zero sem informações', 'Conteúdo de cada área (textos, serviços, fotos), logo e o objetivo do site', 'O código pronto do site', 'Um servidor próprio'], correta: 1, exp: 'Como são várias páginas, o material de cada área faz diferença. Bom conteúdo e boas fotos deixam o site mais completo e profissional.' },
        { nivel: 'avancado', q: 'O cliente pergunta: "quantas páginas meu site vai ter?". Melhor conduta:', ops: ['Prometer um número enorme de páginas para impressionar', 'Entender o negócio e propor as páginas que fazem sentido para o objetivo dele, sem inflar à toa', 'Dizer que dá para fazer quantas ele quiser de graça', 'Falar que o número de páginas não importa'], correta: 1, exp: 'O certo é dimensionar pela necessidade real. Páginas demais sem conteúdo enfraquecem o site; o consultor orienta a estrutura ideal.' },
        { nivel: 'avancado', q: 'Cliente diz: "Institucional é caro, o One Page não resolve?". Melhor resposta:', ops: ['"Resolve, pode pegar o One Page mesmo", sem analisar nada', 'Analisar a necessidade: se ele tem muito conteúdo, várias áreas ou quer SEO mais forte, mostrar que o Institucional entrega mais retorno', '"É caro mesmo, melhor não fazer"', 'Dar um grande desconto na hora'], correta: 1, exp: 'Não empurre o mais barato nem o mais caro. Se o negócio pede o Institucional, mostre o valor (credibilidade, SEO, escala). Se não pede, o One Page serve.' },
        { nivel: 'avancado', q: 'Quando faz mais sentido migrar de um Institucional para um E-commerce?', ops: ['Nunca, são a mesma coisa', 'Quando o cliente quer vender produtos online com carrinho, pagamento e frete direto no site', 'Quando o cliente quer menos páginas', 'Quando o cliente não quer aparecer no Google'], correta: 1, exp: 'Institucional apresenta e gera contato; e-commerce processa a venda online. Se o objetivo é vender produtos pelo site, é hora do e-commerce.' },
        { nivel: 'avancado', q: 'Uma objeção comum é o prazo. Como conduzir?', ops: ['Prometer que fica pronto no mesmo dia', 'Explicar que, por ter mais páginas e conteúdo, o prazo é maior que um One Page, e que depende do envio do material pelo cliente', 'Dizer que não tem prazo', 'Falar que demora anos'], correta: 1, exp: 'Seja transparente: mais conteúdo, mais tempo. E lembre que o envio rápido do material pelo cliente acelera a entrega. Expectativa clara evita atrito.' },
        { nivel: 'avancado', q: 'Qual é um bom gatilho de fechamento para o Institucional?', ops: ['"Pensa e me avisa qualquer dia"', '"Vamos deixar sua empresa com uma presença completa e profissional. Me envia os conteúdos das áreas principais para já começarmos a montar?"', '"Se não fechar hoje o preço triplica"', '"Faz por sua conta e risco"'], correta: 1, exp: 'Fechamento por valor (presença completa) mais um próximo passo concreto (enviar conteúdo), sem pressão agressiva nem urgência falsa.' }
      ]
    },

    'institucional-blog': {
      titulo: 'Site Institucional + Blog',
      intro: 'O Institucional + Blog é para quem quer virar autoridade e atrair clientes pelo Google com conteúdo. Você vai aprender o valor do blog para SEO, como alinhar a expectativa de resultado e contornar a objeção do "não tenho tempo".',
      perguntas: [
        { nivel: 'basico', q: 'O que o Blog acrescenta a um Site Institucional?', ops: ['Um carrinho de compras', 'Uma área para publicar conteúdos e artigos com frequência', 'Um sistema de estoque', 'Um aplicativo'], correta: 1, exp: 'O blog é a seção onde a empresa publica artigos, notícias e dicas. É o motor de conteúdo do site.' },
        { nivel: 'basico', q: 'Para qual cliente o Institucional + Blog é mais indicado?', ops: ['Quem não quer produzir nenhum conteúdo', 'Quem quer virar autoridade no assunto e atrair visitantes pelo Google com conteúdo', 'Quem só quer um site de uma página', 'Quem só vende no balcão e não se importa com internet'], correta: 1, exp: 'O blog serve para quem quer marketing de conteúdo: educar o público, ganhar autoridade e atrair tráfego orgânico ao longo do tempo.' },
        { nivel: 'basico', q: 'Qual o principal benefício de um blog para o site?', ops: ['Deixar o site mais pesado', 'Melhorar o SEO e atrair visitantes com conteúdo relevante, gerando autoridade', 'Substituir o WhatsApp', 'Aumentar o preço da hospedagem'], correta: 1, exp: 'Conteúdo novo e útil ajuda o site a rankear para mais buscas e posiciona a empresa como referência, atraindo potenciais clientes.' },
        { nivel: 'intermediario', q: 'Como o blog costuma impactar o Google ao longo do tempo?', ops: ['Piora o posicionamento', 'Aumenta as chances de aparecer para muitas buscas, porque cada artigo pode rankear para um tema', 'Não tem efeito nenhum', 'Só funciona com anúncio pago'], correta: 1, exp: 'Cada post é uma nova porta de entrada no Google. Com consistência, o blog traz tráfego orgânico crescente e gratuito.' },
        { nivel: 'intermediario', q: 'Quem normalmente publica os conteúdos do blog depois de pronto?', ops: ['Ninguém, ele se atualiza sozinho', 'O cliente (ou quem ele designar) publica pelo painel; a OutBox entrega a estrutura pronta', 'Só o Google', 'Os próprios visitantes'], correta: 1, exp: 'A OutBox entrega o blog funcionando; a alimentação com posts é do cliente ou de quem ele contratar. Vale alinhar isso na venda.' },
        { nivel: 'intermediario', q: 'Diferença entre o Institucional simples e o Institucional + Blog?', ops: ['O blog troca as páginas institucionais por uma loja', 'O + Blog inclui a área de artigos e a estrutura para produzir conteúdo continuamente', 'O + Blog remove a página de contato', 'Não há diferença'], correta: 1, exp: 'É o Institucional completo mais o módulo de blog. Ideal para quem entende que conteúdo constante gera resultado no médio e longo prazo.' },
        { nivel: 'intermediario', q: 'O que reforçar sobre o resultado do blog?', ops: ['Que traz resultado imediato no primeiro dia', 'Que é uma estratégia de médio e longo prazo: os resultados de SEO crescem com consistência', 'Que substitui todas as outras ações de marketing', 'Que não precisa de constância'], correta: 1, exp: 'Blog é maratona, não corrida de 100 metros. Ajuste a expectativa: com constância, o tráfego orgânico se acumula e compensa muito.' },
        { nivel: 'avancado', q: 'Cliente diz: "não tenho tempo para escrever". Melhor resposta:', ops: ['"Então esquece o blog"', 'Mostrar opções: ele pode delegar, contratar produção de conteúdo, ou começar com poucos posts por mês; o importante é a constância possível', '"Escreve você mesmo todo dia, sem desculpa"', 'Prometer que a OutBox escreve tudo de graça para sempre'], correta: 1, exp: 'A objeção de tempo se resolve com plano realista: frequência que caiba na rotina ou terceirização. O blog só precisa ser constante, não diário.' },
        { nivel: 'avancado', q: 'Cliente pergunta: "blog dá resultado mesmo?". Melhor conduta:', ops: ['Garantir vendas imediatas', 'Explicar com honestidade que o blog melhora SEO e autoridade no médio prazo, e citar que grandes marcas usam conteúdo justamente por isso', 'Dizer que não dá resultado', 'Prometer primeiro lugar no Google em uma semana'], correta: 1, exp: 'Honestidade gera confiança. Blog é uma das estratégias de SEO mais sólidas, mas leva tempo. Prometer milagre queima a sua credibilidade.' },
        { nivel: 'avancado', q: 'Quando o + Blog NÃO é prioridade para o cliente?', ops: ['Quando ele quer autoridade e tráfego orgânico', 'Quando ele só precisa de uma presença simples e não pretende produzir conteúdo tão cedo', 'Quando ele já produz muito conteúdo', 'Quando ele quer aparecer no Google'], correta: 1, exp: 'Se o cliente não vai alimentar o blog nem tem foco em conteúdo agora, o Institucional simples pode bastar. Ofereça o blog quando fizer sentido.' },
        { nivel: 'avancado', q: 'Como o blog conversa com o Social Media?', ops: ['São inimigos, um cancela o outro', 'Se complementam: o conteúdo do blog pode virar posts nas redes, e as redes levam tráfego para o blog', 'Não têm relação nenhuma', 'O blog substitui as redes sociais'], correta: 1, exp: 'Ótima oportunidade de venda casada: o blog gera material para o Social Media, e as redes distribuem o conteúdo. Um potencializa o outro.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para o + Blog?', ops: ['"Depois você vê"', '"Vamos transformar seu site em uma máquina de atrair clientes pelo Google. Que tal já definirmos os primeiros temas de conteúdo?"', '"Se não fechar agora, nunca mais"', '"Não garanto nada"'], correta: 1, exp: 'Fechamento por visão de futuro (atrair clientes) mais um passo concreto (definir temas), sem pressão nem promessa exagerada.' }
      ]
    },

    hospedagem: {
      titulo: 'Hospedagem',
      intro: 'A Hospedagem é o que mantém o site no ar, e é recorrente, o que gera comissão contínua. Aqui você aprende a diferença entre domínio e hospedagem, por que ela é essencial e como responder ao "posso hospedar de graça?".',
      perguntas: [
        { nivel: 'basico', q: 'O que é a hospedagem de um site?', ops: ['O nome do site (o endereço digitado)', 'O espaço em um servidor onde os arquivos do site ficam para que ele fique no ar 24h', 'O design do site', 'O logo da empresa'], correta: 1, exp: 'Hospedagem é a "casa" do site: um servidor conectado à internet que mantém o site disponível o tempo todo para os visitantes.' },
        { nivel: 'basico', q: 'Sem hospedagem, o que acontece com o site?', ops: ['Ele funciona normalmente', 'Ele simplesmente não fica disponível na internet', 'Ele fica mais rápido', 'Ele vira um aplicativo'], correta: 1, exp: 'Sem hospedagem, não há onde o site "morar". Ele precisa de um servidor ativo para ser acessado por qualquer pessoa.' },
        { nivel: 'basico', q: 'Qual a diferença entre domínio e hospedagem?', ops: ['São a mesma coisa', 'O domínio é o endereço (ex.: suaempresa.com.br); a hospedagem é onde o site fica guardado e rodando', 'O domínio guarda os arquivos e a hospedagem é o endereço', 'Nenhum dos dois é necessário'], correta: 1, exp: 'Pense assim: o domínio é o endereço da casa; a hospedagem é a casa. Você precisa dos dois para o site funcionar.' },
        { nivel: 'intermediario', q: 'Por que a hospedagem costuma ser cobrada de forma recorrente (mensal ou anual)?', ops: ['Porque é um erro do sistema', 'Porque manter o servidor no ar, seguro e atualizado é um serviço contínuo', 'Porque o cliente pediu', 'Porque a internet é cobrada por clique'], correta: 1, exp: 'O servidor roda o tempo todo, com manutenção, segurança e atualizações. Por isso a cobrança é recorrente, o que também gera comissão recorrente para o consultor.' },
        { nivel: 'intermediario', q: 'O que uma boa hospedagem costuma oferecer além de manter o site no ar?', ops: ['Nada além do espaço', 'Certificado de segurança (SSL), boa velocidade, estabilidade e, em muitos casos, e-mail profissional', 'Um logo grátis', 'Gestão de redes sociais'], correta: 1, exp: 'Além do espaço, uma hospedagem de qualidade traz SSL (cadeado de segurança), desempenho, alta disponibilidade e recursos como e-mails com o domínio da empresa.' },
        { nivel: 'intermediario', q: 'O que é o SSL, associado à hospedagem e ao site?', ops: ['Um tipo de logo', 'O certificado que ativa o cadeado e o https, deixando o site seguro e confiável', 'Uma rede social', 'Um sistema de pagamento'], correta: 1, exp: 'O SSL criptografa os dados e mostra o cadeado no navegador. Sem ele, o navegador pode marcar o site como "não seguro", o que afasta visitantes.' },
        { nivel: 'intermediario', q: 'Por que a velocidade e a estabilidade da hospedagem importam?', ops: ['Não importam', 'Site lento ou fora do ar espanta visitantes e prejudica vendas e o Google', 'Só importam para lojas', 'Só importam de madrugada'], correta: 1, exp: 'Um site que demora a abrir ou cai perde clientes e posições no Google. Boa hospedagem protege o investimento feito no site.' },
        { nivel: 'avancado', q: 'Cliente diz: "achei hospedagem de graça na internet". Melhor resposta:', ops: ['"Então usa a de graça mesmo"', 'Explicar que gratuito costuma vir com instabilidade, propaganda, pouca segurança e nenhum suporte, o que sai caro em prejuízo', '"De graça é sempre melhor"', 'Concordar que a paga não vale a pena'], correta: 1, exp: 'Grátis quase sempre significa lento, inseguro e sem suporte. Mostre o risco: um site fora do ar em um dia de venda custa muito mais que a mensalidade.' },
        { nivel: 'avancado', q: 'Cliente reclama: "por que pagar hospedagem todo mês?". Melhor conduta:', ops: ['Dizer que é só uma taxa sem utilidade', 'Explicar que é o que mantém o site no ar, seguro e rápido o tempo todo, como a conta de luz da presença digital', 'Oferecer para tirar a hospedagem e deixar o site offline', 'Sugerir que ele não precisa de site'], correta: 1, exp: 'Compare com um custo fixo essencial (como luz ou aluguel). É barato perto do valor de estar sempre disponível e seguro para os clientes.' },
        { nivel: 'avancado', q: 'Por que a hospedagem é estratégica para o consultor?', ops: ['Porque não gera comissão', 'Porque é recorrente: gera relacionamento contínuo e comissão recorrente, além de manter o cliente próximo para novas vendas', 'Porque é a venda mais difícil de todas', 'Porque não tem relação com o site'], correta: 1, exp: 'Recorrência é ouro. A hospedagem cria receita contínua e mantém o cliente ativo, abrindo portas para upgrades e novos serviços.' },
        { nivel: 'avancado', q: 'O cliente já tem site e domínio em outro lugar. O que fazer?', ops: ['Recusar o cliente', 'Avaliar a migração para a nossa hospedagem, explicando os ganhos de segurança, velocidade e suporte', 'Dizer que não dá para fazer nada', 'Pedir para ele apagar o site atual'], correta: 1, exp: 'Migração é uma venda comum. Mostre os benefícios de centralizar tudo com quem dá suporte de verdade e cuida da segurança e do desempenho.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para hospedagem?', ops: ['"Depois você decide"', '"Vou deixar seu site no ar, seguro e rápido, sem você se preocupar com nada. Posso já ativar seu plano?"', '"Se não pagar, seu site cai amanhã"', '"Não me responsabilizo por quedas"'], correta: 1, exp: 'Fechamento por tranquilidade (site sempre no ar e seguro) mais um passo concreto (ativar o plano), sem ameaça nem urgência falsa.' }
      ]
    },

    identidade: {
      titulo: 'Identidade Visual',
      intro: 'A Identidade Visual é o rosto da marca e a porta de entrada para vender vários outros serviços. Aqui você aprende a diferença entre "um logo" e uma identidade completa, e como responder ao clássico "já fiz no Canva".',
      perguntas: [
        { nivel: 'basico', q: 'O que é uma Identidade Visual?', ops: ['Apenas um logo', 'O conjunto que dá cara à marca: logo, cores, tipografia e elementos que a representam', 'Um site de uma página', 'Um perfil no Instagram'], correta: 1, exp: 'Identidade Visual é bem mais que o logo. É o sistema visual (logo, paleta de cores, fontes e aplicações) que faz a marca ser reconhecida.' },
        { nivel: 'basico', q: 'Para qual cliente a Identidade Visual é indicada?', ops: ['Só para grandes indústrias', 'Para negócios novos ou que querem profissionalizar e padronizar a imagem da marca', 'Só para quem já tem site', 'Para quem não quer ser reconhecido'], correta: 1, exp: 'Serve para quem está começando e para quem quer parar de parecer amador. Uma boa identidade profissionaliza qualquer negócio.' },
        { nivel: 'basico', q: 'O que costuma estar incluso em uma Identidade Visual?', ops: ['Só um arquivo de logo em baixa qualidade', 'Logo e suas variações, paleta de cores, tipografia e orientações básicas de uso', 'Um sistema de vendas', 'A hospedagem do site'], correta: 1, exp: 'Além do logo, entrega variações (para fundos claros e escuros), as cores oficiais, as fontes e como aplicar tudo isso de forma consistente.' },
        { nivel: 'intermediario', q: 'Qual a diferença entre "um logo" e uma "Identidade Visual"?', ops: ['Nenhuma, é a mesma coisa', 'O logo é uma parte; a identidade é o sistema completo que garante consistência em todos os materiais', 'A identidade é mais barata que o logo', 'O logo inclui a identidade'], correta: 1, exp: 'Ter só um logo é ter uma peça solta. A identidade define como a marca se apresenta em tudo: cartão, post, site, embalagem, com coerência.' },
        { nivel: 'intermediario', q: 'Por que a consistência visual é tão importante?', ops: ['Não é importante', 'Marcas consistentes são mais lembradas, passam mais confiança e parecem maiores', 'Só importa para quem tem loja física', 'Atrapalha o reconhecimento'], correta: 1, exp: 'Quando a marca usa sempre as mesmas cores e o mesmo estilo, o público a reconhece rápido e confia mais. Consistência constrói memória e autoridade.' },
        { nivel: 'intermediario', q: 'Como a Identidade Visual conversa com o site e o Social Media?', ops: ['Não têm relação', 'Ela é a base: site, posts e materiais ficam alinhados e profissionais quando seguem a identidade', 'Ela substitui o site', 'Ela impede a criação de posts'], correta: 1, exp: 'A identidade é o ponto de partida. Com ela pronta, todo o resto (site, redes, materiais) fica coeso. É uma ótima porta para vender os demais serviços.' },
        { nivel: 'intermediario', q: 'O que o cliente precisa passar para o projeto de identidade?', ops: ['O logo já pronto', 'Informações do negócio: o que faz, o público, os valores, referências e preferências', 'O código de um site', 'Um servidor'], correta: 1, exp: 'Quanto mais o designer entende o negócio, o público e o estilo desejado, melhor a identidade. O briefing é a matéria-prima do trabalho.' },
        { nivel: 'avancado', q: 'Cliente diz: "já fiz um logo no Canva de graça". Melhor resposta:', ops: ['"Então está resolvido, não precisa"', 'Mostrar o valor de uma identidade profissional e exclusiva: originalidade, aplicações corretas e uma marca que transmite confiança', '"Canva é lixo"', 'Concordar que tanto faz'], correta: 1, exp: 'Não ataque a solução dele; mostre o ganho. Logo genérico ou repetido enfraquece a marca. Identidade profissional diferencia e valoriza o negócio.' },
        { nivel: 'avancado', q: 'Cliente pergunta: "pra que gastar com marca se o produto é bom?". Melhor conduta:', ops: ['Dar razão e desistir da venda', 'Explicar que a imagem é o primeiro contato: uma marca profissional faz o cliente confiar antes mesmo de conhecer o produto', 'Dizer que marca não importa', 'Prometer que a marca vende sozinha'], correta: 1, exp: 'Produto bom com imagem amadora perde vendas por desconfiança. A identidade abre a porta; o produto fecha. Uma coisa não anula a outra.' },
        { nivel: 'avancado', q: 'Quando faz sentido oferecer o BrandBook em vez de só a Identidade Visual?', ops: ['Nunca', 'Quando a marca quer padronização mais completa: regras de uso, tom de voz e um manual para toda a equipe seguir', 'Quando o cliente quer algo mais simples e barato', 'Quando o cliente não tem logo'], correta: 1, exp: 'Identidade resolve o essencial. Quando o cliente precisa de consistência em escala (equipe, franquias, muitos materiais), o BrandBook é o passo natural.' },
        { nivel: 'avancado', q: 'Cliente quer "só trocar a cor do logo antigo". Como conduzir?', ops: ['Fazer só isso e cobrar caro', 'Entender o objetivo: se ele quer profissionalizar de verdade, mostrar o valor de repensar a identidade como um todo, não só a cor', 'Recusar qualquer conversa', 'Dizer que cor não muda nada'], correta: 1, exp: 'Um retoque isolado costuma ser remendo. Se o objetivo é uma marca forte, vale apresentar o valor de uma identidade completa e coerente.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para Identidade Visual?', ops: ['"Pensa com calma"', '"Vamos dar a cara profissional que o seu negócio merece e deixar sua marca inesquecível. Me conta um pouco do seu negócio para começarmos o briefing?"', '"Se não fechar hoje, dobra"', '"Não garanto que vai gostar"'], correta: 1, exp: 'Fechamento por transformação (marca profissional) mais um passo concreto (briefing), com convite leve e sem pressão.' }
      ]
    },

    brandbook: {
      titulo: 'BrandBook',
      intro: 'O BrandBook é o manual completo da marca, um produto de ticket maior e mais estratégico. Aqui você aprende a diferenciá-lo da Identidade Visual, para quem ele vale a pena e como defender seu valor de longo prazo.',
      perguntas: [
        { nivel: 'basico', q: 'O que é um BrandBook?', ops: ['Um site institucional', 'O manual completo da marca, com as regras de uso da identidade e a personalidade da marca', 'Um catálogo de produtos', 'Uma hospedagem'], correta: 1, exp: 'O BrandBook é o livro da marca. Ele documenta como a marca deve ser usada e comunicada em qualquer situação, garantindo consistência total.' },
        { nivel: 'basico', q: 'Para qual cliente o BrandBook é mais indicado?', ops: ['Para quem só quer um logo rápido', 'Para marcas que querem crescer com consistência, ter equipe, franquias ou muitos materiais', 'Para quem não se importa com a imagem', 'Só para quem tem e-commerce'], correta: 1, exp: 'Quanto mais gente e mais materiais envolvidos, mais o BrandBook importa. Ele garante que todos usem a marca do mesmo jeito.' },
        { nivel: 'basico', q: 'Além do visual, o BrandBook costuma definir o quê?', ops: ['O preço dos produtos', 'O tom de voz, os valores e a personalidade da marca', 'O sistema de estoque', 'A hospedagem'], correta: 1, exp: 'O BrandBook vai além do visual: define como a marca fala, o que ela defende e a sensação que quer passar, orientando texto e comunicação também.' },
        { nivel: 'intermediario', q: 'Qual a diferença entre Identidade Visual e BrandBook?', ops: ['São a mesma coisa', 'A Identidade entrega os elementos visuais; o BrandBook é mais completo e estratégico, com regras de uso, tom de voz e aplicações', 'O BrandBook é mais barato e simples', 'A Identidade inclui o BrandBook'], correta: 1, exp: 'Identidade Visual é a base visual. BrandBook é o manual completo que rege o uso dessa identidade e a personalidade da marca. É um upgrade natural.' },
        { nivel: 'intermediario', q: 'O que costuma compor um BrandBook?', ops: ['Só o logo', 'Missão e valores, uso do logo, cores, tipografia, tom de voz, aplicações e exemplos do que fazer e do que evitar', 'Apenas uma tabela de preços', 'O código do site'], correta: 1, exp: 'É um documento robusto: propósito da marca, regras visuais detalhadas, tom de voz e exemplos práticos de uso certo e errado para toda aplicação.' },
        { nivel: 'intermediario', q: 'Por que os exemplos de "o que fazer e o que evitar" são importantes?', ops: ['Não são importantes', 'Evitam usos errados da marca (deformar o logo, cores fora do padrão) que enfraquecem a imagem', 'Servem só para enfeitar', 'Atrapalham a equipe'], correta: 1, exp: 'Sem regras claras, cada pessoa usa a marca de um jeito. Os exemplos de uso certo e errado protegem a consistência e a força da marca.' },
        { nivel: 'intermediario', q: 'Como o BrandBook ajuda uma empresa em crescimento?', ops: ['Deixa tudo mais confuso', 'Padroniza a marca entre equipes, parceiros e fornecedores, mantendo a identidade mesmo com muita gente envolvida', 'Impede a contratação de novos funcionários', 'Só serve para empresas pequenas'], correta: 1, exp: 'Ao crescer, muita gente passa a usar a marca. O BrandBook garante que todos, internos ou terceiros, mantenham o padrão e a qualidade.' },
        { nivel: 'avancado', q: 'Cliente diz: "a identidade visual não basta?". Melhor resposta:', ops: ['"Basta, esquece o BrandBook"', 'Depende do momento: se ele vai crescer, ter equipe ou muitos materiais, o BrandBook garante consistência e evita retrabalho', '"Identidade não serve para nada"', 'Dar um desconto enorme para convencer'], correta: 1, exp: 'Para quem está começando pequeno, a identidade pode bastar. Para quem vai escalar, o BrandBook previne descaracterização e retrabalho caro.' },
        { nivel: 'avancado', q: 'Como posicionar o valor de um BrandBook (ticket maior)?', ops: ['Focar só no preço alto', 'Mostrar que é um ativo estratégico: protege a marca, alinha a comunicação e economiza tempo e dinheiro no futuro', 'Dizer que é só um PDF bonito', 'Prometer que vende sozinho'], correta: 1, exp: 'BrandBook é investimento em consistência e escala. Venda o valor de longo prazo: menos erros, mais profissionalismo e uma marca sólida.' },
        { nivel: 'avancado', q: 'Para quem o BrandBook pode ser exagero no momento?', ops: ['Para uma franquia em expansão', 'Para um negócio muito pequeno e iniciante, que ainda precisa só do básico da identidade', 'Para uma empresa com muitas filiais', 'Para uma marca com grande equipe de marketing'], correta: 1, exp: 'Nem todo cliente precisa agora. Para o iniciante, comece pela Identidade Visual e ofereça o BrandBook quando o crescimento justificar.' },
        { nivel: 'avancado', q: 'O BrandBook combina bem com quais outros serviços?', ops: ['Com nenhum', 'Com Identidade Visual, Social Media e site: todos passam a seguir o mesmo padrão definido no manual', 'Só com hospedagem', 'Só com e-commerce'], correta: 1, exp: 'O BrandBook orienta tudo: redes, site e materiais. É uma âncora que valoriza e dá coerência a todos os outros serviços que você vende.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para BrandBook?', ops: ['"Vê com calma"', '"Vamos criar o manual que vai manter sua marca forte e consistente em tudo, do post ao contrato. Quer que eu já estruture o projeto?"', '"Se não fechar, acabou"', '"Não prometo consistência"'], correta: 1, exp: 'Fechamento por proteção e consistência da marca mais um passo concreto (estruturar o projeto), sem pressão nem urgência artificial.' }
      ]
    },

    social: {
      titulo: 'Social Media',
      intro: 'Social Media é a gestão profissional das redes e um serviço recorrente, ótimo para comissão contínua. Aqui você aprende a diferença para o tráfego pago, a importância da constância e como responder ao "eu mesmo posto".',
      perguntas: [
        { nivel: 'basico', q: 'O que é o serviço de Social Media?', ops: ['A criação de um site', 'A gestão das redes sociais: planejamento, criação de posts, design e legendas', 'A hospedagem do site', 'Um sistema de vendas'], correta: 1, exp: 'Social Media é cuidar das redes do cliente de forma profissional: o que postar, quando postar, com bom design e texto que engaja.' },
        { nivel: 'basico', q: 'Para qual cliente o Social Media é indicado?', ops: ['Para quem não quer aparecer nas redes', 'Para negócios que querem presença ativa e profissional nas redes sociais', 'Só para quem tem e-commerce', 'Para quem só usa e-mail'], correta: 1, exp: 'Serve para qualquer negócio que queira estar presente e bem apresentado nas redes, atraindo e se relacionando com o público com constância.' },
        { nivel: 'basico', q: 'O que costuma estar incluso em um plano de Social Media?', ops: ['Só um post por ano', 'Planejamento de conteúdo, artes dos posts, legendas e uma frequência combinada de publicações', 'A criação de um logo', 'A hospedagem'], correta: 1, exp: 'Um plano geralmente inclui calendário editorial, design dos posts, textos e uma quantidade de publicações por período, conforme o pacote.' },
        { nivel: 'intermediario', q: 'Qual a diferença entre Social Media (gestão) e Tráfego Pago (anúncios)?', ops: ['São a mesma coisa', 'Social Media cuida do conteúdo orgânico e da presença; o tráfego pago é o investimento em anúncios para alcançar mais pessoas', 'Social Media é sempre anúncio', 'Tráfego pago cria os posts'], correta: 1, exp: 'Uma coisa é produzir e publicar conteúdo (orgânico); outra é pagar para impulsionar. São complementares, mas não a mesma entrega.' },
        { nivel: 'intermediario', q: 'Por que a constância é essencial no Social Media?', ops: ['Não é essencial', 'O algoritmo e o público valorizam presença regular; postar de vez em quando gera pouco resultado', 'Porque é preciso postar só uma vez', 'Porque o cliente exige'], correta: 1, exp: 'Redes premiam quem aparece com frequência. Constância mantém a marca na mente do público e melhora o alcance ao longo do tempo.' },
        { nivel: 'intermediario', q: 'O que o cliente costuma precisar fornecer ou alinhar?', ops: ['Nada, nunca', 'Informações do negócio, materiais (fotos de produtos, novidades) e a aprovação do planejamento', 'O código do site', 'Um servidor de hospedagem'], correta: 1, exp: 'O social flui melhor com insumos do cliente (fotos reais, promoções, novidades) e com a aprovação do calendário. Parceria gera resultado.' },
        { nivel: 'intermediario', q: 'Como o Social Media conversa com a Identidade Visual?', ops: ['Não conversam', 'Os posts seguem a identidade da marca, ficando reconhecíveis e profissionais', 'O social substitui a identidade', 'A identidade atrapalha os posts'], correta: 1, exp: 'Posts alinhados à identidade reforçam a marca a cada publicação. Por isso, quem não tem identidade é um ótimo candidato a fechar os dois serviços.' },
        { nivel: 'avancado', q: 'Cliente diz: "eu mesmo posto, não preciso de agência". Melhor resposta:', ops: ['"Verdade, faz você mesmo"', 'Mostrar o valor de estratégia, constância e design profissional, e que delegar libera o tempo dele para tocar o negócio', '"Seus posts são ruins"', 'Concordar que não vale a pena'], correta: 1, exp: 'Muitos donos postam sem estratégia e sem tempo. Mostre o ganho: profissionalismo, regularidade e a economia de tempo dele, sem desmerecer o esforço.' },
        { nivel: 'avancado', q: 'Cliente pergunta: "Social Media dá retorno?". Melhor conduta:', ops: ['Garantir vendas explosivas imediatas', 'Explicar que fortalece marca, relacionamento e alcance no médio prazo, e que combina com tráfego pago para acelerar', 'Dizer que não dá retorno', 'Prometer viralizar toda semana'], correta: 1, exp: 'Seja honesto: social constrói autoridade e relacionamento com consistência. Para resultado mais rápido em vendas, some tráfego pago. Nada de milagre.' },
        { nivel: 'avancado', q: 'Por que o Social Media é interessante para o consultor?', ops: ['Porque é uma venda única sem retorno', 'Porque é recorrente (mensal), gerando comissão contínua e contato frequente com o cliente', 'Porque nunca gera comissão', 'Porque não tem relação com o cliente'], correta: 1, exp: 'Recorrência de novo: o social é mensal, cria receita contínua e mantém você próximo do cliente para novas oportunidades.' },
        { nivel: 'avancado', q: 'O cliente quer "bombar" nas redes rapidamente. Como alinhar expectativa?', ops: ['Prometer milhões de seguidores em uma semana', 'Explicar que crescimento saudável leva tempo e constância; conteúdo bom mais tráfego pago aceleram, mas sem atalhos mágicos', 'Dizer que é impossível crescer', 'Garantir viralização'], correta: 1, exp: 'Expectativa realista protege a relação. Crescimento consistente vem de estratégia e constância; comprar atalhos duvidosos prejudica a marca.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para Social Media?', ops: ['"Depois a gente vê"', '"Vamos deixar suas redes profissionais e constantes, atraindo mais clientes, enquanto você foca no seu negócio. Começamos com o planejamento deste mês?"', '"Se não fechar hoje, nunca mais"', '"Não garanto nada"'], correta: 1, exp: 'Fechamento por benefício (redes profissionais e tempo livre) mais um passo concreto (planejamento do mês), sem pressão nem promessa exagerada.' }
      ]
    },

    ecommerce: {
      titulo: 'E-commerce',
      intro: 'O E-commerce é a loja virtual completa, que vende no automático 24h. Aqui você aprende o que a compõe, a diferença para o Catálogo e para o marketplace, e como contornar o "já vendo pelo Instagram".',
      perguntas: [
        { nivel: 'basico', q: 'O que é um E-commerce?', ops: ['Um site institucional de apresentação', 'Uma loja virtual completa, com catálogo, carrinho, checkout, pagamento e frete', 'Um perfil no Instagram', 'Um blog'], correta: 1, exp: 'E-commerce é a loja online de verdade: o cliente escolhe o produto, coloca no carrinho, paga e recebe. Vende 24 horas por dia, sem depender de atendimento manual.' },
        { nivel: 'basico', q: 'Para qual cliente o E-commerce é indicado?', ops: ['Quem só presta serviço e não vende produtos', 'Quem vende produtos e quer vendê-los online, de forma automatizada, a qualquer hora', 'Quem não tem nenhum produto', 'Quem só quer um cartão de visitas digital'], correta: 1, exp: 'É para quem tem produtos para vender e quer escala: a loja processa pedidos e pagamentos sozinha, ampliando o alcance para além da região.' },
        { nivel: 'basico', q: 'O que normalmente compõe um E-commerce?', ops: ['Só uma foto de produto', 'Cadastro de produtos, carrinho, meios de pagamento, cálculo de frete e um painel de gestão de pedidos', 'Apenas um formulário de contato', 'Somente um blog'], correta: 1, exp: 'A loja envolve vitrine de produtos, carrinho, checkout com pagamento, frete e um painel onde o dono gerencia pedidos, estoque e clientes.' },
        { nivel: 'intermediario', q: 'Diferença entre E-commerce e Site Institucional?', ops: ['Nenhuma', 'O Institucional apresenta a empresa e gera contato; o E-commerce processa a venda online completa', 'O Institucional tem carrinho e o e-commerce não', 'O e-commerce não aparece no Google'], correta: 1, exp: 'Institucional informa e capta contato. E-commerce fecha a venda ali mesmo, com pagamento e frete. São objetivos diferentes.' },
        { nivel: 'intermediario', q: 'O que o cliente precisa ter organizado para a loja funcionar bem?', ops: ['Nada', 'Fotos e descrições dos produtos, preços, formas de pagamento e definição de frete e entrega', 'Só o logo', 'Um servidor próprio'], correta: 1, exp: 'Uma loja vive dos produtos bem cadastrados: boas fotos, descrições, preços, além de meios de pagamento e regras de entrega definidos.' },
        { nivel: 'intermediario', q: 'Por que boas fotos e descrições são decisivas no E-commerce?', ops: ['Não fazem diferença', 'Como o cliente não pega o produto na mão, foto e descrição vendem por ele e reduzem dúvidas', 'Só importam em loja física', 'Atrapalham a venda'], correta: 1, exp: 'No online, a percepção vem da imagem e do texto. Fotos ruins e descrições fracas geram dúvida e abandono do carrinho. É o vendedor da loja.' },
        { nivel: 'intermediario', q: 'O que é o painel de gestão de um E-commerce?', ops: ['O logo da loja', 'A área onde o dono gerencia produtos, estoque, pedidos e clientes', 'A hospedagem', 'A página de contato'], correta: 1, exp: 'É o backoffice da loja: por ali o cliente administra o catálogo, acompanha pedidos, controla estoque e cuida da operação.' },
        { nivel: 'avancado', q: 'Cliente diz: "já vendo pelo Instagram e WhatsApp, pra que loja?". Melhor resposta:', ops: ['"Tem razão, não precisa de loja"', 'Mostrar que a loja vende sozinha 24h, organiza pedidos e pagamentos, e complementa as redes em vez de substituí-las', '"Instagram não presta"', 'Concordar que loja é desnecessária'], correta: 1, exp: 'Não desmereça o que funciona. Posicione a loja como automação: enquanto o WhatsApp exige atendimento manual, o e-commerce processa pedidos sozinho, a qualquer hora.' },
        { nivel: 'avancado', q: 'Cliente pergunta: "e o Mercado Livre, não é melhor?". Melhor conduta:', ops: ['Dizer que marketplace é sempre pior', 'Explicar que no marketplace ele paga comissões altas e compete por preço; a loja própria fortalece a marca e não tem intermediário levando margem', 'Concordar que a loja própria não vale a pena', 'Recusar o assunto'], correta: 1, exp: 'Marketplaces cobram comissão e colocam o cliente numa guerra de preço. A loja própria constrói marca e retém a margem. Muitos usam os dois de forma estratégica.' },
        { nivel: 'avancado', q: 'Quando indicar o E-commerce estilo Catálogo em vez do completo?', ops: ['Quando o cliente quer processar pagamento no site', 'Quando ele quer só mostrar os produtos e finalizar o pedido pelo WhatsApp, com menos complexidade e custo', 'Quando ele tem milhares de produtos e alto volume', 'Nunca'], correta: 1, exp: 'Se o cliente não precisa de checkout e pagamento online agora, o Catálogo entrega a vitrine com pedido via WhatsApp, mais simples e acessível.' },
        { nivel: 'avancado', q: 'Objeção de preço no E-commerce. Melhor abordagem:', ops: ['Baixar o preço na hora', 'Mostrar o retorno: uma loja que vende 24h para todo o Brasil se paga com poucas vendas e escala o faturamento', 'Concordar que é caro demais', 'Dizer que é o mais barato'], correta: 1, exp: 'E-commerce é investimento com potencial de escala. Traga o retorno (vendas automáticas, alcance nacional) em vez de brigar só no preço.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para E-commerce?', ops: ['"Pensa aí e me fala"', '"Vamos montar sua loja para vender no automático, a qualquer hora, para todo lugar. Me envia a lista dos primeiros produtos para começarmos o cadastro?"', '"Se não fechar agora, dobra"', '"Não garanto vendas"'], correta: 1, exp: 'Fechamento por benefício (vender no automático) mais um passo concreto (enviar produtos), com convite claro e sem pressão.' }
      ]
    },

    'ecommerce-catalogo': {
      titulo: 'E-commerce estilo Catálogo',
      intro: 'O Catálogo é a vitrine online que finaliza a venda pelo WhatsApp, uma porta de entrada acessível para vender online. Aqui você aprende quando indicá-lo no lugar do e-commerce completo e como defender seu valor.',
      perguntas: [
        { nivel: 'basico', q: 'O que é um E-commerce estilo Catálogo?', ops: ['Uma loja completa com pagamento no site', 'Uma vitrine online dos produtos, onde o pedido é finalizado pelo WhatsApp, sem checkout no site', 'Um site institucional', 'Um blog'], correta: 1, exp: 'O Catálogo mostra os produtos de forma organizada e, ao escolher, o cliente é direcionado ao WhatsApp para fechar. Sem carrinho e pagamento online.' },
        { nivel: 'basico', q: 'Para qual cliente o Catálogo é mais indicado?', ops: ['Quem quer processar milhares de pedidos com pagamento automático', 'Quem quer mostrar os produtos e vender pelo WhatsApp, com menos custo e complexidade', 'Quem não tem produtos', 'Quem só presta serviço'], correta: 1, exp: 'É ideal para quem já vende pelo WhatsApp e quer uma vitrine profissional, sem a complexidade e o custo de um e-commerce completo.' },
        { nivel: 'basico', q: 'Qual a principal diferença do Catálogo para o E-commerce completo?', ops: ['O Catálogo tem carrinho e pagamento online', 'O Catálogo não tem checkout nem pagamento no site; o fechamento é pelo WhatsApp', 'O Catálogo não mostra produtos', 'Não há diferença'], correta: 1, exp: 'A grande diferença é o fechamento: no completo, paga-se no site; no Catálogo, o pedido vai para o WhatsApp. Mais simples e barato.' },
        { nivel: 'intermediario', q: 'Por que o Catálogo costuma ser mais acessível que o E-commerce completo?', ops: ['Porque é maior e mais complexo', 'Porque não envolve integração de pagamento, frete automático e toda a estrutura de checkout', 'Porque não mostra produtos', 'Porque não fica no ar'], correta: 1, exp: 'Menos módulos (sem gateway de pagamento e checkout) significam menor complexidade e custo. Por isso é uma porta de entrada acessível para vender online.' },
        { nivel: 'intermediario', q: 'Qual a vantagem de finalizar o pedido pelo WhatsApp?', ops: ['Nenhuma', 'Permite atendimento próximo, tirar dúvidas e negociar, algo que muitos clientes preferem', 'Impede o contato com o cliente', 'Deixa a venda mais lenta sempre'], correta: 1, exp: 'Muita gente gosta de conversar antes de comprar. O WhatsApp aproxima, resolve dúvidas na hora e ajuda a fechar, principalmente em nichos mais consultivos.' },
        { nivel: 'intermediario', q: 'O Catálogo funciona bem no celular?', ops: ['Não funciona no celular', 'Sim, é pensado para o mobile e integra direto com o WhatsApp, onde o público já está', 'Só funciona no computador', 'Só funciona com aplicativo instalado'], correta: 1, exp: 'Como a compra vai para o WhatsApp, o Catálogo brilha no celular, unindo a vitrine e o canal de venda no lugar onde o cliente já conversa.' },
        { nivel: 'intermediario', q: 'Como o cliente atualiza os produtos do Catálogo?', ops: ['Ele não pode atualizar', 'Por um painel simples, cadastrando e ajustando produtos e preços', 'Só a OutBox pode mexer para sempre', 'Trocando de hospedagem'], correta: 1, exp: 'O Catálogo entrega uma gestão simples para o cliente manter a vitrine atualizada, o que é parte do valor: autonomia com facilidade.' },
        { nivel: 'avancado', q: 'Cliente pergunta: "por que não já o e-commerce completo?". Melhor resposta:', ops: ['"Realmente, faça o completo sempre"', 'Avaliar o momento dele: se o volume ainda é baixo e ele vende bem pelo WhatsApp, o Catálogo entrega resultado com menos investimento, e dá para evoluir depois', '"Completo é perda de dinheiro"', 'Dizer que são iguais'], correta: 1, exp: 'Venda a solução do momento. Para quem está começando ou tem volume menor, o Catálogo resolve com menos custo e pode virar e-commerce completo quando crescer.' },
        { nivel: 'avancado', q: 'Quando o Catálogo deixa de ser ideal e o completo passa a valer mais?', ops: ['Quando o cliente tem poucos produtos', 'Quando o volume de pedidos cresce muito e o atendimento manual pelo WhatsApp vira gargalo', 'Quando o cliente não quer vender', 'Nunca'], correta: 1, exp: 'Se o WhatsApp não dá conta do volume, a automação do e-commerce completo (pagamento e checkout) passa a compensar. É a hora do upgrade.' },
        { nivel: 'avancado', q: 'Como usar o Catálogo como porta de entrada estratégica?', ops: ['Vender e nunca mais falar com o cliente', 'Entregar a vitrine agora e acompanhar o crescimento, oferecendo o e-commerce completo quando o volume justificar', 'Recusar clientes pequenos', 'Empurrar sempre o produto mais caro'], correta: 1, exp: 'O Catálogo inicia o relacionamento com baixo atrito. Conforme o cliente cresce, você evolui a solução, gerando novas vendas e fidelidade.' },
        { nivel: 'avancado', q: 'Objeção: "isso é só um site com fotos?". Melhor conduta:', ops: ['Concordar que não tem valor', 'Explicar que é uma vitrine profissional e organizada, integrada ao WhatsApp, que facilita a compra e valoriza os produtos', 'Dizer que sim, é só isso', 'Baixar o preço imediatamente'], correta: 1, exp: 'Mostre o valor: organização, profissionalismo e um caminho fácil da vitrine ao WhatsApp. Não é só fotos, é uma ferramenta de vendas simples e eficaz.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para o Catálogo?', ops: ['"Vê com calma"', '"Vamos deixar seus produtos numa vitrine profissional que leva direto para o seu WhatsApp. Me manda as fotos e os preços para começarmos?"', '"Se não fechar, some da lista"', '"Não prometo pedidos"'], correta: 1, exp: 'Fechamento por facilidade (vitrine que leva ao WhatsApp) mais um passo concreto (fotos e preços), com convite leve e direto.' }
      ]
    },

    sistemas: {
      titulo: 'Desenvolvimento de Sistemas',
      intro: 'O Sistema Personalizado é o produto de maior ticket: software sob medida para um problema específico. Aqui você aprende a identificar a oportunidade, conduzir pelo levantamento e nunca chutar preço nem prazo.',
      perguntas: [
        { nivel: 'basico', q: 'O que é um Sistema Personalizado?', ops: ['Um site institucional pronto', 'Um software feito sob medida para resolver um problema ou processo específico do negócio', 'Um perfil em rede social', 'Uma hospedagem'], correta: 1, exp: 'É software construído do zero para a necessidade do cliente: um sistema de gestão, uma automação, uma plataforma. Nada de molde pronto, é sob medida.' },
        { nivel: 'basico', q: 'Para qual cliente o Sistema Personalizado é indicado?', ops: ['Para quem só quer um site simples', 'Para quem tem um processo específico que as ferramentas prontas não atendem bem', 'Para quem não tem nenhum processo', 'Só para quem quer redes sociais'], correta: 1, exp: 'Quando o negócio tem uma necessidade particular (um fluxo, uma regra, uma operação própria) que nenhum sistema de prateleira resolve, entra o sob medida.' },
        { nivel: 'basico', q: 'Qual a diferença de um sistema sob medida para um sistema pronto?', ops: ['Nenhuma', 'O sob medida é feito exatamente para o processo do cliente; o pronto é genérico e nem sempre encaixa', 'O pronto é sempre melhor', 'O sob medida não pode ser alterado'], correta: 1, exp: 'Sistema pronto serve para necessidades comuns. Quando o processo é único ou exige exclusividade e controle, o sob medida encaixa como uma luva.' },
        { nivel: 'intermediario', q: 'Como costuma começar um projeto de sistema personalizado?', ops: ['Já programando sem entender nada', 'Com o levantamento de requisitos: entender a fundo o processo, as regras e o objetivo antes de desenvolver', 'Comprando um sistema pronto', 'Criando um logo'], correta: 1, exp: 'Tudo começa entendendo o problema: o que o sistema precisa fazer, quais regras seguir e qual resultado gerar. Sem esse mapa, o projeto se perde.' },
        { nivel: 'intermediario', q: 'Por que o escopo bem definido é tão importante nesse produto?', ops: ['Não é importante', 'Porque define o que será entregue, o prazo e o custo, evitando mal-entendidos', 'Porque enche o projeto de tarefas', 'Porque atrasa o projeto'], correta: 1, exp: 'O escopo alinha expectativas: o que entra, o que não entra, prazo e valor. É o que protege tanto o cliente quanto a OutBox de surpresas.' },
        { nivel: 'intermediario', q: 'Por que o ticket de um sistema personalizado costuma ser maior?', ops: ['Porque é um capricho', 'Porque envolve análise, desenvolvimento sob medida e mais horas de trabalho especializado', 'Porque é mais barato de fazer', 'Porque não dá trabalho'], correta: 1, exp: 'É engenharia sob medida: entender, projetar, programar e testar. Mais complexidade e especialização justificam o investimento maior, e a comissão também.' },
        { nivel: 'intermediario', q: 'O que o cliente precisa trazer para o levantamento?', ops: ['Nada', 'Como o processo funciona hoje, as dores, as regras e o resultado que espera do sistema', 'O código pronto', 'Um logo'], correta: 1, exp: 'O cliente é quem conhece o processo. Detalhar como funciona hoje e o que precisa melhorar é essencial para o sistema resolver de verdade.' },
        { nivel: 'avancado', q: 'Cliente diz: "achei um sistema pronto bem mais barato". Melhor resposta:', ops: ['"Então usa o pronto mesmo"', 'Avaliar com ele: se o pronto atende, ótimo; se ele precisa de algo específico que o pronto não faz, mostrar que o sob medida evita gambiarra e resolve de verdade', '"Pronto é sempre ruim"', 'Concordar que sob medida não vale a pena'], correta: 1, exp: 'Seja honesto e consultivo. Se um pronto resolve, não empurre o caro. Mas se o processo é único, o sob medida evita adaptações forçadas e entrega o que o cliente realmente precisa.' },
        { nivel: 'avancado', q: 'Cliente pergunta: "quanto custa um sistema?". Melhor conduta:', ops: ['Chutar um valor na hora para não perder o cliente', 'Explicar que depende do escopo e propor um levantamento para dimensionar a solução e o investimento com precisão', 'Dizer que é sempre o mesmo preço', 'Dar o menor preço possível para fechar'], correta: 1, exp: 'Preço sem escopo é armadilha. Conduza para o levantamento: entender a necessidade primeiro permite propor a solução certa e o valor justo, sem retrabalho.' },
        { nivel: 'avancado', q: 'Cliente com pressa: "consegue para semana que vem?". Melhor alinhamento:', ops: ['Prometer qualquer prazo para fechar', 'Explicar que sistema sob medida exige análise e desenvolvimento, e que o prazo sai do escopo; prometer o impossível gera frustração', 'Dizer que fica pronto na hora', 'Recusar o cliente'], correta: 1, exp: 'Prazo realista protege a entrega e a relação. Sob medida leva tempo. Defina o cronograma a partir do escopo, sem prometer milagres.' },
        { nivel: 'avancado', q: 'Como enxergar oportunidades de sistema em uma conversa comum?', ops: ['Ignorar as dores do cliente', 'Ouvir gargalos e tarefas manuais repetitivas: onde há retrabalho ou planilha bagunçada, pode haver um sistema para resolver', 'Falar só de site', 'Oferecer sempre o produto mais barato'], correta: 1, exp: 'Dores operacionais são pistas de ouro. Processos manuais, planilhas caóticas e retrabalho indicam que um sistema pode gerar eficiência, e uma venda de alto valor.' },
        { nivel: 'avancado', q: 'Bom gatilho de fechamento para Sistema Personalizado?', ops: ['"Pensa e volta ano que vem"', '"Vamos entender seu processo a fundo e montar uma solução sob medida que economiza tempo e dinheiro. Podemos agendar um levantamento sem compromisso?"', '"Se não fechar hoje, triplica"', '"Não garanto que funcione"'], correta: 1, exp: 'Como é um produto consultivo e de ticket maior, o fechamento ideal é agendar o levantamento (passo de baixo compromisso), avançando com segurança rumo à proposta.' }
      ]
    },

    spin: {
      titulo: 'Fundamentos de Vendas (SPIN)',
      intro: 'O SPIN Selling é a base de quem vende de verdade: você conduz o cliente com perguntas até ele mesmo perceber que precisa da solução. Aqui você aprende as 4 etapas (Situação, Problema, Implicação e Necessidade) e como aplicá-las na prática.',
      perguntas: [
        { nivel: 'basico', q: 'O que significa a sigla SPIN no SPIN Selling?', ops: ['Sistema Padrão de Indicação de Negócios', 'Situação, Problema, Implicação e Necessidade (de solução)', 'Serviço, Preço, Investimento e Negociação', 'É só um nome bonito, sem significado'], correta: 1, exp: 'SPIN são os 4 tipos de pergunta que conduzem o cliente: Situação, Problema, Implicação e Necessidade de solução. É a arte de vender perguntando, não empurrando.' },
        { nivel: 'basico', q: 'Qual a ideia central do SPIN Selling?', ops: ['Falar o máximo possível sobre o produto', 'Fazer as perguntas certas para o cliente perceber sozinho que precisa da solução', 'Dar o maior desconto logo de cara', 'Pressionar o cliente a decidir rápido'], correta: 1, exp: 'Vender bem é ouvir e perguntar. Com boas perguntas, o cliente chega à conclusão de que precisa resolver o problema, e você entra com a solução.' },
        { nivel: 'basico', q: 'As perguntas de "Situação" servem para quê?', ops: ['Fechar a venda na hora', 'Entender o contexto atual do cliente (como funciona o negócio dele hoje)', 'Falar do preço', 'Apresentar a empresa'], correta: 1, exp: 'As perguntas de Situação levantam o cenário: como o cliente trabalha hoje, o que ele já tem. É a base para identificar problemas depois. Use com moderação para não cansar.' },
        { nivel: 'intermediario', q: 'As perguntas de "Problema" buscam o quê?', ops: ['Elogiar o cliente', 'Revelar dificuldades, insatisfações e dores no cenário atual do cliente', 'Anunciar uma promoção', 'Encerrar a conversa'], correta: 1, exp: 'As perguntas de Problema fazem o cliente falar das dores: o que incomoda, o que não funciona bem. Sem problema reconhecido, não há motivo para comprar.' },
        { nivel: 'intermediario', q: 'As perguntas de "Implicação" servem para quê?', ops: ['Reduzir o valor percebido do problema', 'Ampliar a consciência do impacto do problema (o que ele custa se continuar assim)', 'Falar só de preço', 'Mudar de assunto'], correta: 1, exp: 'A Implicação mostra o tamanho do problema: quanto o cliente perde por não resolver. É aqui que o valor da solução cresce na cabeça dele.' },
        { nivel: 'intermediario', q: 'As perguntas de "Necessidade de solução" buscam o quê?', ops: ['Fazer o cliente falar dos benefícios de resolver o problema', 'Criticar o cliente', 'Empurrar o produto mais caro', 'Encerrar sem proposta'], correta: 0, exp: 'Nas perguntas de Necessidade, o cliente verbaliza o ganho de resolver ("seria ótimo aparecer no Google"). Quando ele mesmo diz o benefício, a venda praticamente se fecha.' },
        { nivel: 'intermediario', q: 'Por que perguntar é melhor do que só apresentar o produto?', ops: ['Porque toma menos tempo', 'Porque o cliente confia mais no que ele mesmo conclui do que no que você afirma', 'Porque evita falar de preço', 'Porque não precisa conhecer o produto'], correta: 1, exp: 'Argumento imposto gera resistência; conclusão própria gera convicção. Perguntando, você guia o cliente a enxergar a necessidade sem empurrar.' },
        { nivel: 'avancado', q: 'O cliente disse "hoje eu só uso o Instagram". Qual a melhor pergunta de Implicação?', ops: ['"Quer fechar o site agora?"', '"E quando um cliente te procura no Google e não te encontra, você imagina quantas vendas podem estar indo para o concorrente?"', '"Qual o seu orçamento?"', '"Você gosta de Instagram?"'], correta: 1, exp: 'A Implicação conecta a situação a uma perda concreta (vendas indo para o concorrente). Isso aumenta a urgência sem pressionar diretamente.' },
        { nivel: 'avancado', q: 'Qual é um erro comum ao usar o SPIN?', ops: ['Ouvir o cliente', 'Fazer perguntas demais de Situação, cansando o cliente sem chegar ao problema', 'Descobrir a dor do cliente', 'Deixar o cliente falar'], correta: 1, exp: 'Situação em excesso vira interrogatório chato. Pesquise o básico antes e foque energia nas perguntas de Problema e Implicação, que movem a venda.' },
        { nivel: 'avancado', q: 'Como o SPIN ajuda a contornar a objeção de preço?', ops: ['Ignorando o preço', 'Construindo o valor antes: quando o cliente já sentiu o custo do problema, o preço parece pequeno perto do ganho', 'Dando desconto imediato', 'Falando de preço logo no início'], correta: 1, exp: 'Preço só assusta quando o valor não foi construído. Com Implicação e Necessidade bem feitas, o investimento vira consequência natural, não obstáculo.' },
        { nivel: 'avancado', q: 'Qual a sequência lógica ideal do SPIN numa conversa?', ops: ['Necessidade, Implicação, Problema, Situação', 'Situação, Problema, Implicação, Necessidade de solução', 'Problema, Situação, Necessidade, Implicação', 'Tanto faz a ordem'], correta: 1, exp: 'A ordem faz sentido: entender o cenário, achar a dor, ampliar o impacto e levar o cliente a enxergar o ganho de resolver. Cada etapa prepara a seguinte.' },
        { nivel: 'avancado', q: 'Depois de um bom SPIN, qual é o passo natural?', ops: ['Encerrar sem propor nada', 'Apresentar a solução conectada exatamente às dores e aos ganhos que o cliente verbalizou', 'Falar de outro produto qualquer', 'Pedir para ele pensar por semanas'], correta: 1, exp: 'A proposta deve ser um espelho da conversa: você resolve o problema que ele reconheceu e entrega o ganho que ele mesmo citou. Aí o fechamento flui.' }
      ]
    },

    prospeccao: {
      titulo: 'Prospecção e Abordagem',
      intro: 'Sem prospecção não há vendas. Aqui você aprende a encontrar bons clientes, fazer um primeiro contato que gera interesse (sem parecer robô ou spam) e usar o Funil para não perder nenhuma oportunidade.',
      perguntas: [
        { nivel: 'basico', q: 'O que é prospecção?', ops: ['Fechar a venda', 'O processo de encontrar e iniciar contato com potenciais clientes', 'Entregar o projeto', 'Cobrar a comissão'], correta: 1, exp: 'Prospecção é a busca ativa por clientes: identificar quem pode precisar dos serviços e iniciar a conversa. É o começo de todo funil de vendas.' },
        { nivel: 'basico', q: 'Qual é um bom perfil de cliente para os produtos da OutBox?', ops: ['Qualquer pessoa aleatória', 'Negócios que precisam de presença digital: profissionais, lojas, prestadores de serviço, empresas', 'Só grandes indústrias', 'Só quem já tem site pronto'], correta: 1, exp: 'O cliente ideal é quem precisa vender e se apresentar melhor na internet. Quanto mais claro o perfil, mais certeira a prospecção.' },
        { nivel: 'basico', q: 'Onde encontrar potenciais clientes?', ops: ['Só esperando eles aparecerem', 'Instagram, Google Maps, indicações, comércio local, grupos e a própria rede de contatos', 'Apenas em anúncios pagos', 'Em lugar nenhum'], correta: 1, exp: 'Oportunidades estão em todo lugar: perfis sem site, negócios com presença fraca, indicações e sua rede. Olhe o mundo com olhos de consultor.' },
        { nivel: 'intermediario', q: 'Qual o objetivo do primeiro contato (abordagem)?', ops: ['Fechar o contrato imediatamente', 'Gerar interesse e conseguir uma conversa, não vender de cara', 'Falar o preço logo', 'Pedir os documentos do cliente'], correta: 1, exp: 'A abordagem abre a porta. O objetivo é despertar interesse e marcar uma conversa. Tentar fechar no primeiro contato costuma afastar o cliente.' },
        { nivel: 'intermediario', q: 'Como deve ser uma boa primeira mensagem?', ops: ['Longa, cheia de preços e termos técnicos', 'Curta, personalizada, focada no cliente e sem parecer robô', 'Igual para todo mundo, copiada e colada', 'Só um "oi" sem contexto'], correta: 1, exp: 'Mensagem boa é curta, fala do negócio da pessoa e mostra um ganho claro. Personalização mostra que você olhou para ela, e isso aumenta muito a resposta.' },
        { nivel: 'intermediario', q: 'Por que personalizar a abordagem faz diferença?', ops: ['Não faz diferença', 'Mostra que você pesquisou o negócio da pessoa, gerando conexão e mais respostas', 'Só serve para enrolar', 'Deixa a mensagem pior'], correta: 1, exp: 'Uma frase específica ("vi o perfil da sua loja e curti o trabalho") separa você dos spams. Conexão inicial abre espaço para a conversa acontecer.' },
        { nivel: 'intermediario', q: 'O que é o funil de vendas na prática do consultor?', ops: ['Um tipo de site', 'As etapas do contato até o fechamento (frio, morno, quente, reunião, proposta, ganho)', 'A tabela de comissão', 'Uma rede social'], correta: 1, exp: 'O funil organiza onde cada contato está: do primeiro toque (frio) até fechar (ganho). No sistema, o Funil de Vendas ajuda a acompanhar e não perder ninguém.' },
        { nivel: 'avancado', q: 'O potencial cliente não respondeu a primeira mensagem. Melhor conduta:', ops: ['Desistir na hora', 'Fazer um follow-up educado depois de alguns dias, agregando algo novo, sem insistir de forma chata', 'Mandar dez mensagens seguidas', 'Cobrar uma resposta'], correta: 1, exp: 'A maioria das vendas exige mais de um contato. Um follow-up gentil, com um novo ângulo ou material, recupera muitos clientes que só não responderam na hora.' },
        { nivel: 'avancado', q: 'Como usar indicações a seu favor?', ops: ['Nunca pedir indicações', 'Pedir a clientes satisfeitos que indiquem conhecidos, pois indicação já vem com confiança', 'Só prospectar desconhecidos', 'Esperar a indicação cair do céu'], correta: 1, exp: 'Indicação é o caminho mais quente: chega com confiança emprestada. Cliente feliz é sua melhor fonte. Peça sempre, de forma natural, ao entregar um bom trabalho.' },
        { nivel: 'avancado', q: 'Qual erro derruba a abordagem logo no início?', ops: ['Ser breve e simpático', 'Já jogar preço e proposta antes de gerar interesse ou entender a necessidade', 'Personalizar a mensagem', 'Perguntar sobre o negócio da pessoa'], correta: 1, exp: 'Preço no primeiro contato, sem contexto, mata o interesse. Primeiro conecte e desperte a necessidade; a proposta vem quando a porta já está aberta.' },
        { nivel: 'avancado', q: 'Como manter uma prospecção constante e organizada?', ops: ['Prospectar só quando não tem mais nada para fazer', 'Ter uma rotina de novos contatos e registrar tudo no Funil para dar seguimento', 'Anotar em papéis soltos', 'Confiar só na memória'], correta: 1, exp: 'Vendas é jogo de constância. Uma meta diária de novos contatos e o uso do Funil evitam a seca e garantem que nenhum cliente seja esquecido.' },
        { nivel: 'avancado', q: 'Um bom encerramento de abordagem (para marcar a conversa) é:', ops: ['"Compra agora ou perde"', '"Posso te mostrar rapidinho uma ideia de como melhorar sua presença digital? Prometo ser breve. Qual o melhor horário?"', '"Me manda seus dados bancários"', '"Pensa aí e some"'], correta: 1, exp: 'O convite é leve, promete pouco (uma ideia rápida) e pede um próximo passo concreto (horário). Facilita o sim e transforma o contato frio em conversa.' }
      ]
    },

    objecoes: {
      titulo: 'Objeções Gerais',
      intro: 'Objeção não é um não, é um "ainda não me convenci". Aqui você aprende a técnica para acolher e contornar as objeções que aparecem em qualquer produto: "vou pensar", "tá caro", "me manda no WhatsApp" e "já tenho quem faça".',
      perguntas: [
        { nivel: 'basico', q: 'O que é uma objeção na venda?', ops: ['Um pedido de compra', 'Uma dúvida, receio ou resistência do cliente antes de decidir', 'Um elogio ao produto', 'A comissão do consultor'], correta: 1, exp: 'Objeção é o cliente dizendo "ainda não me convenci". É natural e faz parte da venda. Bem tratada, vira oportunidade de esclarecer e avançar.' },
        { nivel: 'basico', q: 'Qual a melhor atitude diante de uma objeção?', ops: ['Discutir e provar que o cliente está errado', 'Ouvir com calma, entender o real motivo e responder com valor', 'Desistir na hora', 'Ignorar e falar de outra coisa'], correta: 1, exp: 'Objeção não é ataque. Ouça, valide o sentimento e responda mostrando valor. Brigar com o cliente fecha a porta; acolher e esclarecer abre caminho.' },
        { nivel: 'basico', q: 'A objeção "vou pensar" geralmente significa:', ops: ['Que o cliente já comprou', 'Que ainda falta valor, confiança ou uma dúvida não resolvida', 'Que ele odiou a proposta', 'Nada, é só educação'], correta: 1, exp: '"Vou pensar" costuma esconder algo: preço, insegurança ou uma dúvida. O bom consultor investiga com gentileza o que falta para decidir.' },
        { nivel: 'intermediario', q: 'Cliente diz "tá caro". Melhor caminho:', ops: ['Baixar o preço imediatamente', 'Reforçar o valor e o retorno, e entender se é falta de verba ou de valor percebido', 'Concordar que é caro', 'Encerrar a conversa'], correta: 1, exp: '"Caro" quase sempre é valor não percebido. Antes de mexer no preço, mostre o retorno e descubra se o problema é orçamento real ou percepção. Desconto na hora desvaloriza.' },
        { nivel: 'intermediario', q: 'Diante de "vou pensar", uma boa resposta é:', ops: ['"Tá bom, tchau"', '"Claro! Só para eu te ajudar melhor: ficou alguma dúvida específica ou é mais uma questão de momento?"', '"Você nunca vai decidir mesmo"', '"Então esquece"'], correta: 1, exp: 'A pergunta gentil revela a objeção real por trás do "vou pensar". Assim você resolve o ponto certo em vez de deixar o cliente sumir com a dúvida.' },
        { nivel: 'intermediario', q: 'Cliente pede "me manda tudo por WhatsApp". O que fazer?', ops: ['Mandar um textão e sumir', 'Enviar algo objetivo, mas buscar manter a conversa ou uma call para não virar orçamento perdido', 'Recusar mandar qualquer coisa', 'Ignorar o cliente'], correta: 1, exp: '"Manda por WhatsApp" pode ser uma fuga educada. Envie algo enxuto e proponha continuar a conversa, senão vira mais um orçamento esquecido no chat.' },
        { nivel: 'intermediario', q: 'Qual a diferença entre objeção e desinteresse total?', ops: ['São a mesma coisa', 'Objeção é dúvida de quem tem interesse; desinteresse é ausência de necessidade ou de perfil', 'Objeção significa que não há venda', 'Desinteresse é sempre falta de dinheiro'], correta: 1, exp: 'Quem objeta ainda está no jogo (tem interesse, falta algo). Quem não tem necessidade nem perfil é outra história. Saber diferenciar economiza energia.' },
        { nivel: 'avancado', q: 'Qual a melhor técnica geral para responder objeções?', ops: ['Ignorar e insistir na venda', 'Acolher, esclarecer e reconduzir ao valor, confirmando se a dúvida foi resolvida', 'Rebater com agressividade', 'Dar sempre um desconto'], correta: 1, exp: 'Um bom roteiro: acolha ("entendo"), esclareça o ponto, reconecte ao valor e confirme ("isso resolve sua dúvida?"). Estrutura simples que funciona em qualquer objeção.' },
        { nivel: 'avancado', q: 'Cliente diz "já tenho quem faça". Melhor conduta:', ops: ['Falar mal do concorrente', 'Respeitar, mostrar seu diferencial e se colocar à disposição para quando ele precisar', 'Insistir que o outro é ruim', 'Encerrar sem deixar porta aberta'], correta: 1, exp: 'Nunca ataque o concorrente. Mostre seu diferencial com elegância e deixe a porta aberta. Muitos clientes voltam quando o atual não entrega.' },
        { nivel: 'avancado', q: 'Como funciona a prevenção de objeções?', ops: ['Esperar todas as objeções para o final', 'Antecipar as dúvidas comuns ao longo da conversa, de forma que elas nem virem obstáculo', 'Nunca falar de preço', 'Esconder informações do cliente'], correta: 1, exp: 'A melhor objeção é a que não aparece. Trazendo antes os pontos que costumam gerar dúvida (prazo, valor, resultado), você desarma a resistência antes que ela cresça.' },
        { nivel: 'avancado', q: 'Objeção "estou sem tempo agora". Melhor resposta:', ops: ['Pressionar para decidir na hora', 'Respeitar o momento e agendar um retorno específico, mantendo o interesse vivo', 'Insistir sem parar', 'Desistir para sempre'], correta: 1, exp: 'Falta de tempo é real. Em vez de forçar, marque um retorno com data e horário. Isso respeita o cliente e mantém a oportunidade viva no seu funil.' },
        { nivel: 'avancado', q: 'Depois de resolver a objeção, qual é o passo certo?', ops: ['Ficar em silêncio esperando', 'Confirmar que a dúvida foi sanada e conduzir suavemente para o próximo passo ou fechamento', 'Levantar outra objeção você mesmo', 'Encerrar a conversa'], correta: 1, exp: 'Resolveu a dúvida? Confirme e avance: "ficou claro? então podemos dar o próximo passo?". Não deixe o momento esfriar depois de destravar a objeção.' }
      ]
    },

    'sistema-outbox': {
      titulo: 'Como usar o Sistema',
      intro: 'Este treinamento é o onboarding do consultor. Aqui você domina o próprio sistema OutBox: cadastrar clientes, lançar vendas, gerar orçamentos, entender a comissão, usar o Funil e começar com o pé direito.',
      perguntas: [
        { nivel: 'basico', q: 'Para que serve a tela "Vendas & Comissão"?', ops: ['Só para ver notícias', 'Para lançar vendas, acompanhar propostas e solicitar o pagamento da comissão', 'Para editar o site do cliente', 'Para trocar a senha'], correta: 1, exp: 'Em Vendas & Comissão você registra cada venda, acompanha o status das propostas e solicita o repasse da comissão. É o coração da operação do consultor.' },
        { nivel: 'basico', q: 'Onde o consultor cadastra e gerencia seus clientes?', ops: ['Na tela de Premiações', 'Na tela "Meus Clientes"', 'Na tela de Avisos', 'Somente no Funil'], correta: 1, exp: '"Meus Clientes" é onde você cadastra os dados completos do cliente. Um cliente bem cadastrado agiliza o lançamento de vendas e a geração de orçamentos.' },
        { nivel: 'basico', q: 'Para que serve a tela "Orçamentos"?', ops: ['Para pagar a comissão', 'Para criar propostas e acompanhar os aceites dos clientes', 'Para cadastrar um novo consultor', 'Para editar o perfil'], correta: 1, exp: 'Em Orçamentos você gera a proposta profissional, envia ao cliente e acompanha o aceite. O cliente pode inclusive aceitar pelo link, sem você precisar cobrar.' },
        { nivel: 'intermediario', q: 'O que é o "Funil de Vendas" no sistema?', ops: ['Uma tabela de preços', 'Um quadro para organizar os contatos por etapa, do frio ao ganho, arrastando os cartões', 'A lista de comissões pagas', 'A área de treinamentos'], correta: 1, exp: 'O Funil é o painel visual dos seus contatos. Você arrasta cada card entre as etapas (frio, morno, quente, reunião, proposta, ganho) e nunca perde uma oportunidade.' },
        { nivel: 'intermediario', q: 'Quando a comissão fica disponível para saque?', ops: ['Assim que a proposta é criada', 'Depois que o cliente paga e o administrador confirma o recebimento no sistema', 'Nunca', 'Só no fim do ano'], correta: 1, exp: 'A comissão só libera quando o pagamento do cliente é confirmado pelo admin. Até lá ela aparece como "em conferência". Isso protege todo mundo e mantém tudo transparente.' },
        { nivel: 'intermediario', q: 'O que significa a barra colorida que às vezes aparece no topo?', ops: ['Um erro do sistema', 'Um aviso ou comunicado da OutBox para os consultores', 'A comissão disponível', 'O nome do cliente'], correta: 1, exp: 'A barra colorida no topo é o canal de avisos da OutBox: novidades, atualizações e comunicados importantes. Fique de olho nela para não perder nada.' },
        { nivel: 'intermediario', q: 'Como o consultor solicita o pagamento da comissão?', ops: ['Ligando para o cliente', 'Pelo botão de solicitar comissão, quando o valor disponível atinge o mínimo para saque', 'Não é possível solicitar', 'Trocando de plano'], correta: 1, exp: 'Quando a comissão disponível atinge o mínimo para saque, você solicita pelo sistema e o administrador é notificado para fazer o repasse dentro do prazo.' },
        { nivel: 'avancado', q: 'Qual a boa prática antes de lançar uma venda de um produto?', ops: ['Nunca treinar', 'Ter concluído o treinamento daquele produto para vender com segurança', 'Ignorar os treinamentos', 'Chutar o preço'], correta: 1, exp: 'O próprio sistema lembra: treinar o produto antes ajuda a vender melhor e a passar segurança ao cliente. Consultor preparado fecha mais e erra menos.' },
        { nivel: 'avancado', q: 'Onde o consultor confere o valor certo para cobrar de cada cliente?', ops: ['Ele inventa o preço', 'Na Tabela de Preços por Porte, que ajusta o valor conforme o porte do cliente', 'No Funil de Vendas', 'Na tela de Avisos'], correta: 1, exp: 'Nunca chute preço. A Tabela de Preços por Porte mostra o valor certo conforme o porte do cliente (pequena, média, grande, indústria), passando segurança e padronização.' },
        { nivel: 'avancado', q: 'O que a tela "Premiações" mostra ao consultor?', ops: ['Os avisos da empresa', 'O progresso rumo às metas e o que ele pode conquistar batendo volume', 'A senha do sistema', 'A lista de clientes'], correta: 1, exp: 'Premiações mostra o quão perto você está das metas e das recompensas. É um mapa de motivação: bateu o volume, desbloqueia o benefício.' },
        { nivel: 'avancado', q: 'Por que manter o Funil sempre atualizado?', ops: ['Não faz diferença', 'Porque organiza o acompanhamento, mostra onde focar e evita perder vendas no meio do caminho', 'Só para enfeitar a tela', 'Porque o cliente exige'], correta: 1, exp: 'Um funil atualizado é o raio-X das suas vendas. Ele mostra quem precisa de follow-up, onde está a oportunidade quente e evita que negócios esfriem por esquecimento.' },
        { nivel: 'avancado', q: 'Um novo consultor quer começar com o pé direito. Por onde ir primeiro?', ops: ['Solicitar comissão sem ter vendas', 'Completar o perfil, fazer os treinamentos de produto e organizar os primeiros clientes no Funil', 'Ignorar o sistema', 'Esperar o cliente aparecer sozinho'], correta: 1, exp: 'Onboarding ideal: perfil completo (necessário para receber), treinamentos feitos (para vender com segurança) e Funil alimentado com os primeiros contatos. Base sólida gera resultado.' }
      ]
    }
  }
};
