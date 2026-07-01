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

  /* medalhas por faixa de nota final */
  medalha(nota) {
    if (nota >= 100) return { id: 'perfeito', nome: 'Especialista', cor: '#111111', sub: 'Gabaritou! Você domina esse produto.' };
    if (nota >= 90)  return { id: 'ouro',     nome: 'Ouro',        cor: '#C9A227', sub: 'Excelente! Você está pronto para vender com segurança.' };
    if (nota >= TREINOS.OBJETIVO) return { id: 'prata', nome: 'Prata', cor: '#9AA3AD', sub: 'Aprovado! Boa base para vender esse produto.' };
    return { id: 'treinar', nome: 'Continue treinando', cor: '#e0573f', sub: 'Quase lá. Revise as explicações e tente de novo.' };
  },

  /* catálogo de treinamentos de produto (ordem de exibição) */
  PRODUTOS: [
    { id: 'onepage',            nome: 'Site One Page',                        icon: 'quote',   disponivel: true,  resumo: 'O cartão de visitas digital: presença profissional em uma página, focada em conversão.' },
    { id: 'institucional',      nome: 'Site Institucional',                   icon: 'docs',    disponivel: false },
    { id: 'institucional-blog', nome: 'Site Institucional + Blog',            icon: 'docs',    disponivel: false },
    { id: 'hospedagem',         nome: 'Hospedagem',                           icon: 'shield',  disponivel: false },
    { id: 'identidade',         nome: 'Identidade Visual',                    icon: 'edit',    disponivel: false },
    { id: 'brandbook',          nome: 'BrandBook',                            icon: 'receipt', disponivel: false },
    { id: 'social',             nome: 'Social Media',                         icon: 'share',   disponivel: false },
    { id: 'ecommerce',          nome: 'E-commerce',                           icon: 'cart',    disponivel: false },
    { id: 'ecommerce-catalogo', nome: 'E-commerce estilo Catálogo',          icon: 'cart',    disponivel: false },
    { id: 'sistemas',           nome: 'Desenvolvimento de Sistemas',          icon: 'kanban',  disponivel: false }
  ],

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
    }
  }
};
