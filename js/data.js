/* ============================================================
   OutBox Consultores — Camada de dados (data.js)
   Fase 2: persistência no Supabase (PostgreSQL + RLS).
   Estratégia: cache em memória (OB.db) hidratado do Supabase em
   loadAll(); leituras são síncronas a partir do cache; escritas
   atualizam o cache na hora e persistem no Supabase em segundo plano.
   ============================================================ */
const OB = {
  KEYS: { theme: 'ob_theme' },

  /* ---------- portes de empresa (classificação p/ a tabela de preços) ---------- */
  PORTES: [
    { id: 'pequena',   nome: 'Pequena empresa', faixa: 'Faturamento até R$4,8 mi/ano (MEI, ME, EPP)' },
    { id: 'media',     nome: 'Média empresa',   faixa: 'Faturamento de R$4,8 mi a R$50 mi/ano' },
    { id: 'grande',    nome: 'Grande empresa',  faixa: 'Faturamento de R$50 mi a R$300 mi/ano' },
    { id: 'industria', nome: 'Indústria',       faixa: 'Faturamento acima de R$300 mi/ano ou setor industrial' }
  ],

  /* ---------- formas de pagamento aceitas (usadas na seção Produtos) ---------- */
  PAGAMENTOS: [
    { id: 'pix',           nome: 'PIX à vista',        desc: 'Pagamento imediato, com desconto de até 5% concedido pelo consultor.' },
    { id: 'cartao',        nome: 'Cartão de crédito',  desc: 'Em até 12x, com os juros da operadora repassados ao cliente.' },
    { id: 'boleto',        nome: 'Boleto bancário',    desc: 'À vista ou em parcelas combinadas com a OutBox.' },
    { id: 'transferencia', nome: 'Transferência',      desc: 'TED ou depósito à vista na conta da OutBox.' }
  ],
  pagamentoNome(id) { const f = this.PAGAMENTOS.find(x => x.id === id); return f ? f.nome : id; },

  /* natureza do serviço: cobrado uma vez ou renovado periodicamente */
  PRODUTO_TIPOS: [
    { id: 'pontual',    nome: 'Pontual',    desc: 'Cobrado uma única vez na contratação' },
    { id: 'recorrente', nome: 'Recorrente', desc: 'Renovado periodicamente enquanto o cliente usar' }
  ],
  RECORRENCIAS: { unica: 'Pagamento único', mensal: 'por mês', anual: 'por ano' },

  /* ---------- catálogo de produtos + tabela de preços fixos por porte (R$) ----------
     Este array é a semente do catálogo. Em loadAll() ele é sincronizado com a tabela
     catalogo_produtos do Supabase, onde o admin cadastra e edita os serviços. */
  PRODUTOS: [
    { id: 'identidade',   nome: 'Identidade Visual',   icone: 'creative',  tipo: 'pontual', recorrencia: 'unica', ordem: 10,
      precos: { pequena: 2500,  media: 4200,  grande: 6400,  industria: 9000 },
      resumo: 'A marca completa: logotipo, cores, tipografia e arquivos para usar em tudo.',
      entrega: '10 a 20 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Criação de logotipo profissional com variações, paleta de cores, tipografia da marca, manual básico de aplicação e entrega dos arquivos em alta resolução para uso digital e impresso.' },
    { id: 'lp',           nome: 'Landing Page',        icone: 'target',    tipo: 'pontual', recorrencia: 'unica', ordem: 20,
      precos: { pequena: 1900,  media: 2900,  grande: 4200,  industria: 5500 },
      resumo: 'Página única de conversão para campanhas, lançamentos e captação de contatos.',
      entrega: '7 a 12 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Página única focada em conversão: texto persuasivo, chamada para ação, botão de WhatsApp, formulário de contato, otimização para celular e publicação no ar.' },
    { id: 'onepage',      nome: 'Site OnePage',        icone: 'rocket',    tipo: 'pontual', recorrencia: 'unica', ordem: 30,
      precos: { pequena: 2900,  media: 4500,  grande: 6200,  industria: 8000 },
      resumo: 'Site inteiro em uma página só: rápido de aprovar e rápido de colocar no ar.',
      entrega: '10 a 15 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Site completo em página única: apresentação da empresa, serviços, diferenciais, depoimentos, mapa de localização, botão de WhatsApp, otimização para celular e para o Google.' },
    { id: 'institucional',nome: 'Site Institucional',  icone: 'briefcase', tipo: 'pontual', recorrencia: 'unica', ordem: 40,
      precos: { pequena: 5500,  media: 8900,  grande: 12500, industria: 16500 },
      resumo: 'Site com várias páginas para empresas que precisam de presença completa.',
      entrega: '15 a 25 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Site com múltiplas páginas (início, sobre, serviços, contato), formulário de contato, botão de WhatsApp, otimização para celular e SEO básico para ser encontrado no Google.' },
    { id: 'apresentacao', nome: 'Apresentação de Negócios Interativa', icone: 'gallery', tipo: 'pontual', recorrencia: 'unica', ordem: 45,
      precos: { pequena: 5500,  media: 8900,  grande: 12500, industria: 16500 },
      resumo: 'A empresa apresentada em uma experiência navegável, para reunião e para enviar por WhatsApp.',
      entrega: '15 a 25 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Apresentação de negócios navegável no celular e no computador: roteiro comercial, design de todas as telas, animações, gráficos com os números da empresa, portfólio, depoimentos, botão de WhatsApp e link próprio para apresentar em reunião ou enviar ao cliente. Funciona como um site de apresentação, sem depender de PowerPoint ou PDF.' },
    { id: 'ecommerce',    nome: 'E-commerce',          icone: 'cart',      tipo: 'pontual', recorrencia: 'unica', ordem: 50,
      precos: { pequena: 9500,  media: 16900, grande: 24500, industria: 33000 },
      resumo: 'Loja virtual completa, do cadastro do produto ao pagamento e ao frete.',
      entrega: '25 a 40 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Loja virtual completa: cadastro de produtos, carrinho de compras, integração com meios de pagamento, cálculo de frete, área do cliente e treinamento para gerenciar pedidos.' },
    { id: 'sistemas',     nome: 'Sistemas Sob Medida', icone: 'admin',     tipo: 'pontual', recorrencia: 'unica', ordem: 60,
      precos: { pequena: 19000, media: 45000, grande: 82000, industria: 130000 },
      resumo: 'Software feito para o processo do cliente, quando nenhuma ferramenta pronta resolve.',
      entrega: 'conforme cronograma aprovado', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Sistema desenvolvido para o seu processo: levantamento de requisitos, telas personalizadas, controle de acesso por usuário, relatórios gerenciais e suporte na implantação.' },
    { id: 'hospedagem',   nome: 'Hospedagem de Site',  icone: 'shield',    tipo: 'recorrente', recorrencia: 'anual', ordem: 70, anual: true,
      precos: { pequena: 1200, media: 1200, grande: 1200, industria: 1200 }, // R$ 1.200 (preço único p/ todos os portes)
      resumo: 'O site no ar o ano inteiro: servidor, domínio, e-mail, segurança e suporte.',
      entrega: 'ativação em até 3 dias úteis', pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      incluso: 'Hospedagem anual do site em servidor de alta disponibilidade: domínio conectado, certificado de segurança (SSL/HTTPS), e-mail profissional, backups periódicos e suporte técnico. Renovação anual.' }
  ],
  /* produto do catálogo pelo id */
  produtoById(id) { return this.PRODUTOS.find(p => p.id === id) || null; },
  produtoNome(id) { const p = this.produtoById(id); return p ? p.nome : id; },
  /* catálogo visível ao consultor (só os ativos), já na ordem de exibição */
  catalogo() {
    return this.PRODUTOS.filter(p => p.ativo !== false)
      .slice().sort((a, b) => (a.ordem || 999) - (b.ordem || 999) || a.nome.localeCompare(b.nome));
  },
  /* como o preço é cobrado: uma vez, por mês ou por ano */
  produtoPeriodo(p) { return this.RECORRENCIAS[(p && p.recorrencia) || 'unica'] || 'Pagamento único'; },

  /* ---------- catálogo no banco (tabela catalogo_produtos) ----------
     A semente acima continua valendo como fallback; o que estiver no banco
     manda, e produtos novos cadastrados pelo admin entram no fim da lista. */
  PRODUTOS_SEMENTE: null, // preenchido na inicialização (cópia da semente acima)
  _cpIn(r) {
    let pg = []; try { pg = typeof r.pagamentos === 'string' ? JSON.parse(r.pagamentos) : (r.pagamentos || []); } catch (e) { pg = []; }
    return { id: r.id, nome: r.nome || '', icone: r.icone || 'briefcase',
      tipo: r.tipo || 'pontual', recorrencia: r.recorrencia || 'unica',
      resumo: r.resumo || '', incluso: r.incluso || '', entrega: r.entrega || '',
      precos: { pequena: Number(r.preco_pequena) || 0, media: Number(r.preco_media) || 0,
                grande: Number(r.preco_grande) || 0, industria: Number(r.preco_industria) || 0 },
      pagamentos: Array.isArray(pg) && pg.length ? pg : ['pix', 'cartao', 'boleto'],
      parcelasMax: r.parcelas_max != null ? Number(r.parcelas_max) : 12,
      contratoObjeto: r.contrato_objeto || '', contratoPrazo: r.contrato_prazo || '', contratoRevisoes: r.contrato_revisoes || '',
      destaque: !!r.destaque, ativo: r.ativo !== false, ordem: r.ordem != null ? Number(r.ordem) : 900,
      anual: r.recorrencia === 'anual', criadoEm: r.criado_em };
  },
  _cpOut(p) { return { id: p.id, nome: p.nome, icone: p.icone || 'briefcase',
    tipo: p.tipo || 'pontual', recorrencia: p.recorrencia || 'unica',
    resumo: p.resumo || null, incluso: p.incluso || null, entrega: p.entrega || null,
    preco_pequena: (p.precos && p.precos.pequena) || 0, preco_media: (p.precos && p.precos.media) || 0,
    preco_grande: (p.precos && p.precos.grande) || 0, preco_industria: (p.precos && p.precos.industria) || 0,
    pagamentos: p.pagamentos || ['pix', 'cartao', 'boleto'], parcelas_max: p.parcelasMax != null ? p.parcelasMax : 12,
    contrato_objeto: p.contratoObjeto || null, contrato_prazo: p.contratoPrazo || null, contrato_revisoes: p.contratoRevisoes || null,
    destaque: !!p.destaque, ativo: p.ativo !== false, ordem: p.ordem != null ? p.ordem : 900,
    atualizado_em: new Date().toISOString() }; },

  /* reconstrói OB.PRODUTOS no lugar (o array é referenciado em todo o sistema):
     semente + o que veio do banco por cima, e os produtos novos no fim. */
  _syncCatalogo(rows) {
    if (!this.PRODUTOS_SEMENTE) this.PRODUTOS_SEMENTE = this.PRODUTOS.map(p => JSON.parse(JSON.stringify(p)));
    const lista = this.PRODUTOS_SEMENTE.map(p => JSON.parse(JSON.stringify(p)));
    (rows || []).forEach(r => {
      const p = this._cpIn(r);
      const i = lista.findIndex(x => x.id === p.id);
      if (i >= 0) lista[i] = Object.assign({}, lista[i], p); else lista.push(p);
    });
    lista.sort((a, b) => (a.ordem || 900) - (b.ordem || 900) || a.nome.localeCompare(b.nome));
    this.PRODUTOS.length = 0;
    lista.forEach(p => this.PRODUTOS.push(p));
  },
  /* slug estável a partir do nome (id de produto novo) */
  slugProduto(nome) {
    const base = (nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'produto';
    let id = base, n = 2;
    while (this.PRODUTOS.find(p => p.id === id)) { id = base + '-' + n; n++; }
    return id;
  },
  saveCatalogoProduto(p) {
    const i = this.PRODUTOS.findIndex(x => x.id === p.id);
    if (i >= 0) this.PRODUTOS[i] = p; else this.PRODUTOS.push(p);
    this.PRODUTOS.sort((a, b) => (a.ordem || 900) - (b.ordem || 900) || a.nome.localeCompare(b.nome));
    this._save('catalogo_produtos', this._cpOut(p));
    return p;
  },
  /* produtos da semente não são apagados, apenas desativados (o histórico de vendas
     e contratos continua apontando para eles). */
  removeCatalogoProduto(id) {
    const daSemente = (this.PRODUTOS_SEMENTE || []).some(p => p.id === id);
    if (daSemente) { const p = this.produtoById(id); if (p) { p.ativo = false; this.saveCatalogoProduto(p); } return false; }
    const i = this.PRODUTOS.findIndex(p => p.id === id);
    if (i >= 0) this.PRODUTOS.splice(i, 1);
    this._delete('catalogo_produtos', id);
    return true;
  },
  /* preço de tabela conforme produto + porte do cliente */
  precoTabela(produtoId, porteId) {
    const p = this.PRODUTOS.find(x => x.id === produtoId);
    if (!p || !p.precos) return 0;
    return p.precos[porteId] || p.precos.pequena || 0;
  },
  /* produto com preço único/plano anual (independe do porte) */
  produtoPrecoFixo(produtoId) {
    const p = this.PRODUTOS.find(x => x.id === produtoId);
    return (p && p.precoFixo) ? p.precoFixo : null;
  },
  /* ---------- tabela FIXA de descontos comerciais (o consultor escolhe, o sistema limita) ---------- */
  DESC_LIMIAR: 15000, // a partir deste valor de orçamento libera a faixa maior de desconto
  DESC_ATE:   [0, 2, 3, 5],   // orçamentos até R$ 14.999
  DESC_ACIMA: [0, 5, 8, 10],  // orçamentos a partir de R$ 15.000
  /* opções de desconto permitidas conforme o valor de tabela do orçamento */
  descontosPermitidos(valorBase) {
    return (Number(valorBase) || 0) >= this.DESC_LIMIAR ? this.DESC_ACIMA : this.DESC_ATE;
  },
  PIX_DESCONTO: 5, // % de desconto adicional no PIX à vista (se o consultor conceder)
  /* ---------- juros do cartão por nº de parcelas (repasse/grossup) ---------- */
  JUROS_CARTAO: { 1: 5.99, 2: 11.39, 3: 12.49, 4: 13.09, 5: 13.79, 6: 14.49, 7: 15.49, 8: 16.09, 9: 16.69, 10: 17.39, 11: 18.39, 12: 18.79 },
  jurosCartao(parcelas) { return this.JUROS_CARTAO[parcelas] || this.JUROS_CARTAO[1]; },
  /* cálculo do pagamento a partir do valor NEGOCIADO (já com o desconto comercial aplicado).
     retorna { forma, valorServico (base de comissão/receita), valorCliente (total que o cliente paga), parcelas, valorParcela, jurosPct, pixDesconto } */
  calcPagamento(valorNegociado, forma, opts) {
    opts = opts || {};
    const base = Math.max(0, Number(valorNegociado) || 0);
    // plano de preço fixo (ex.: hospedagem anual) — valor base por forma; no cartão aplica o grossup dos juros
    if (opts.precoFixo) {
      const pf = opts.precoFixo;
      if (forma === 'cartao') {
        const n = Math.min(12, Math.max(1, parseInt(opts.parcelas, 10) || 1));
        const j = this.jurosCartao(n);
        const total = Math.round(pf.cartao / (1 - j / 100)); // repassa os juros do parcelamento ao cliente
        return { forma, valorServico: pf.cartao, valorCliente: total, parcelas: n, valorParcela: Math.round((total / n) * 100) / 100, jurosPct: j, pixDesconto: false, precoFixo: true };
      }
      // qualquer outra forma cai no valor à vista (PIX)
      return { forma: 'pix', valorServico: pf.pix, valorCliente: pf.pix, parcelas: 1, valorParcela: pf.pix, jurosPct: 0, pixDesconto: false, precoFixo: true };
    }
    if (forma === 'pix') {
      const pixOn = !!opts.pixDesconto;
      const servico = pixOn ? Math.round(base * (1 - this.PIX_DESCONTO / 100)) : base;
      return { forma, valorServico: servico, valorCliente: servico, parcelas: 1, valorParcela: servico, jurosPct: 0, pixDesconto: pixOn };
    }
    if (forma === 'cartao') {
      const n = Math.min(12, Math.max(1, parseInt(opts.parcelas, 10) || 1));
      const j = this.jurosCartao(n);
      const total = Math.round(base / (1 - j / 100));
      return { forma, valorServico: base, valorCliente: total, parcelas: n, valorParcela: Math.round((total / n) * 100) / 100, jurosPct: j, pixDesconto: false };
    }
    // fallback à vista (PIX sem o desconto)
    return { forma: 'pix', valorServico: base, valorCliente: base, parcelas: 1, valorParcela: base, jurosPct: 0, pixDesconto: false };
  },
  /* grupo oficial de consultores no WhatsApp (networking, novidades e sugestões).
     Para trocar o convite, basta alterar esta URL. */
  GRUPO_WHATS: 'https://chat.whatsapp.com/Bv5EM9xjqNkLiQiP3cUfKd',

  /* valor mínimo para solicitar o saque da comissão (regra fixa) */
  SAQUE_MINIMO: 500,
  saqueMinimo() { return this.SAQUE_MINIMO; },

  /* ---------- comissão progressiva MARGINAL (cada faixa, sua taxa) ---------- */
  NIVEIS: [
    { id: 'black',  nome: 'Black',  rate: 0.20, meta: 30000, cor: '#111111' },
    { id: 'ouro',   nome: 'Ouro',   rate: 0.12, meta: 15000, cor: '#C9A227' },
    { id: 'prata',  nome: 'Prata',  rate: 0.10, meta: 5000,  cor: '#9AA3AD' },
    { id: 'bronze', nome: 'Bronze', rate: 0.08, meta: 0,     cor: '#B07B4F' }
  ],
  /* faixas marginais (ordem crescente) p/ o cálculo da comissão */
  FAIXAS: [
    { ate: 5000,     rate: 0.08 },
    { ate: 15000,    rate: 0.10 },
    { ate: 30000,    rate: 0.12 },
    { ate: Infinity, rate: 0.20 }
  ],
  /* comissão marginal sobre um volume: soma cada faixa com sua taxa */
  comissaoMarginal(volume) {
    let prev = 0, total = 0;
    for (const f of this.FAIXAS) {
      const naFaixa = Math.max(0, Math.min(volume, f.ate) - prev);
      total += naFaixa * f.rate;
      prev = f.ate;
      if (volume <= f.ate) break;
    }
    return total;
  },
  /* taxa marginal da faixa em que o volume está (p/ exibição) */
  taxaMarginal(volume) {
    for (const f of this.FAIXAS) if (volume <= f.ate) return f.rate;
    return this.FAIXAS[this.FAIXAS.length - 1].rate;
  },

  /* ---------- Fixo do Consultor ----------
     Quem fechar a régua em vendas COM PAGAMENTO CONFIRMADO dentro do mês recebe
     o valor abaixo somado ao fechamento. Duas observações que valem ouro aqui:

     1. A base é venda paga, não venda assinada. É o mesmo critério que já libera
        a comissão (statusPagamento === 'recebido'), então o consultor não precisa
        aprender regra nova e a OutBox não paga sobre contrato que não entrou.
     2. O valor é idêntico nos dois enquadramentos: para PJ sai como parcela fixa,
        para PF entra dentro da comissão. Muda a rubrica, nunca o que cai na conta,
        por isso nada disso aparece na tela do consultor. */
  FIXO: {
    ativo: true,
    nome: 'Fixo do Consultor',
    regua: 20000,          // vendas pagas no mês que destravam
    valor: 2000,           // quanto entra a mais no fechamento
    inicio: '2026-09-01'   // primeiro mês em que a regra vale
  },
  /* mês de referência: 'AAAA-MM' ou vazio para o mês corrente */
  _mesRef(ref) {
    const d = ref ? new Date(ref + '-01T12:00:00') : new Date();
    return { ano: d.getFullYear(), mes: d.getMonth() };
  },
  /* o Fixo só vale a partir do mês de início */
  fixoValeNoMes(ref) {
    const { ano, mes } = this._mesRef(ref);
    const i = new Date(this.FIXO.inicio + 'T12:00:00');
    return this.FIXO.ativo && (ano > i.getFullYear() || (ano === i.getFullYear() && mes >= i.getMonth()));
  },
  /* volume que conta para o Fixo: venda aprovada E com pagamento confirmado */
  volumeFixo(consultorId, ref) {
    const { ano, mes } = this._mesRef(ref);
    return this.salesOf(consultorId)
      .filter(s => s.statusProposta === 'aprovada' && s.statusPagamento === 'recebido')
      .filter(s => { const d = new Date(s.data); return d.getFullYear() === ano && d.getMonth() === mes; })
      .reduce((t, s) => t + s.valor, 0);
  },
  /* situação do Fixo no mês: quanto já entrou, quanto falta e como fecha */
  fixoResumo(consultorId, ref) {
    const cfg = this.FIXO;
    const vale = this.fixoValeNoMes(ref);
    const volume = this.volumeFixo(consultorId, ref);
    const bateu = vale && volume >= cfg.regua;
    const comissao = Math.round(this.comissaoMarginal(volume));
    const valor = bateu ? cfg.valor : 0;
    return {
      vale, regua: cfg.regua, volume, bateu, valor, comissao,
      falta: Math.max(0, cfg.regua - volume),
      pct: cfg.regua > 0 ? Math.min(100, (volume / cfg.regua) * 100) : 0,
      total: comissao + valor
    };
  },
  /* quanto o consultor fecha o mês com um volume qualquer (usado nas projeções) */
  fixoFechamento(volume) {
    const c = Math.round(this.comissaoMarginal(volume));
    return c + (this.FIXO.ativo && volume >= this.FIXO.regua ? this.FIXO.valor : 0);
  },

  /* enquadramento do consultor: só o admin altera, e só muda a rubrica do Fixo
     no fechamento (PJ recebe como parcela fixa, PF dentro da comissão).

     Lido sob demanda, e não na lista de perfis, porque aquela lista carrega o
     sistema inteiro: pedir uma coluna que ainda não existe derrubaria o app.
     Aqui o erro fica contido e devolve null, que a tela lê como migração pendente. */
  async getEnquadramento(consultorId) {
    try {
      const { data, error } = await SB.from('profiles').select('enquadramento').eq('id', consultorId).maybeSingle();
      if (error) throw error;
      const v = (data && data.enquadramento) === 'pj' ? 'pj' : 'pf';
      const alvo = this.userById(consultorId);
      if (alvo) alvo.enquadramento = v;
      return v;
    } catch (e) { return null; }
  },

  async setEnquadramento(consultorId, valor) {
    const v = valor === 'pj' ? 'pj' : 'pf';
    const alvo = this.userById(consultorId);
    if (!alvo) return { ok: false, erro: 'Consultor não encontrado.' };
    try {
      const { error } = await SB.from('profiles').update({ enquadramento: v }).eq('id', consultorId);
      if (error) throw error;
      alvo.enquadramento = v;
      return { ok: true, valor: v };
    } catch (e) {
      return { ok: false, erro: (e && e.message) || 'Não foi possível salvar.' };
    }
  },

  /* bônus de campanha trimestral = 3% sobre o volume acima de R$30 mil */
  BONUS_PCT: 0.03,
  BONUS_PISO: 30000,
  bonusCampanha(consultorId) {
    const excedente = Math.max(0, this.volumeTrimestre(consultorId) - this.BONUS_PISO);
    return Math.round(excedente * this.BONUS_PCT);
  },

  /* ---------- escada de prêmios trimestrais ---------- */
  PREMIOS: [
    { id: 'airpods', nome: 'AirPods',      meta: 30000,  valor: 1800,  img: 'assets/premios/airpods.png' },
    { id: 'beats',   nome: 'Beats',        meta: 45000,  valor: 2200,  img: 'assets/premios/beats.png' },
    { id: 'watch',   nome: 'Apple Watch',  meta: 55000,  valor: 3200,  img: 'assets/premios/watch.png' },
    { id: 'ipad',    nome: 'iPad',         meta: 70000,  valor: 4500,  img: 'assets/premios/ipad.png' },
    { id: 'iphone16',nome: 'iPhone 16',    meta: 100000, valor: 6500,  img: 'assets/premios/iphone16.png' },
    { id: 'iphone17',nome: 'iPhone 17',    meta: 125000, valor: 8500,  img: 'assets/premios/iphone17.png' },
    { id: 'macbook', nome: 'MacBook',      meta: 200000, valor: 14000, img: 'assets/premios/macbook.png' }
  ],

  LINK_APRESENTACAO: 'https://vendaoutbox.vercel.app/',
  /* link do formulário de briefing (a definir — o usuário vai criar o modelo) */
  LINK_BRIEFING: '',

  /* URL pública do app (usada nos links de aceite dentro do orçamento) */
  APP_URL: 'https://consultores.outboxgroup.com.br',
  /* links de pagamento por forma (o usuário envia e a gente preenche aqui) */
  LINKS_PAGAMENTO: {
    pix:    '',
    boleto: '',
    cartao: ''
  },
  linkPagamento(formaId) { return this.LINKS_PAGAMENTO[formaId || 'pix'] || ''; },

  /* ---------- moedas (formatação multi-moeda) ---------- */
  MOEDAS: {
    BRL: { code: 'BRL', nome: 'Real brasileiro (R$)', symbol: 'R$', loc: 'pt-BR', t: '.', d: ',' },
    USD: { code: 'USD', nome: 'Dólar americano (US$)', symbol: 'US$', loc: 'en-US', t: ',', d: '.' },
    EUR: { code: 'EUR', nome: 'Euro (€)', symbol: '€', loc: 'pt-PT', t: '.', d: ',' }
  },
  money(v, m) {
    const M = this.MOEDAS[m] || this.MOEDAS.BRL;
    try { return (v || 0).toLocaleString(M.loc, { style: 'currency', currency: M.code }); }
    catch (e) { return M.symbol + ' ' + (v || 0).toFixed(2); }
  },
  moedaAtual() { return (this.db.profile && this.db.profile.moeda) || 'BRL'; },
  /* fmt = moeda do consultor logado · brl = sempre Real (ticket de mercado) */
  fmt(v) { return this.money(v, this.moedaAtual()); },

  /* ---------- estágios do funil (Kanban) ---------- */
  ESTAGIOS: [
    { id: 'frio',     nome: 'Frio',              cor: '#64748b' },
    { id: 'morno',    nome: 'Morno',             cor: '#d97706' },
    { id: 'quente',   nome: 'Quente',            cor: '#dc2626' },
    { id: 'reuniao',  nome: 'Reunião marcada',   cor: '#2563eb' },
    { id: 'aberto',   nome: 'Proposta em aberto',cor: '#7c3aed' },
    { id: 'ganho',    nome: 'Ganho',             cor: '#16a34a' },
    { id: 'perdido',  nome: 'Perdido',           cor: '#94a3b8' }
  ],

  /* ---------- status da proposta (venda) ---------- */
  STATUS_PROPOSTA: {
    aguardando: { nome: 'Aguardando aceite', chip: 'warn' },
    aprovada:   { nome: 'Aprovada',          chip: 'green' },
    recusada:   { nome: 'Recusada',          chip: 'gray' }
  },

  /* ---------- formas de pagamento ---------- */
  FORMAS_PAGAMENTO: [
    { id: 'pix',     nome: 'PIX à vista', detalhe: 'Pagamento integral · pode conceder 5% de desconto à vista' },
    { id: 'cartao',  nome: 'Cartão de crédito', detalhe: 'Em até 12x · juros do parcelamento repassados ao cliente' }
  ],

  /* ---------- atendente virtual "Manu" (chat consultor ↔ admin) ---------- */
  MANU: { nome: 'Manu', cargo: 'Atendimento OutBox', foto: 'assets/manu.jpg' },

  /* ---------- propaganda/pop-up de marketing (arte 4:5 gerida pelo admin) ---------- */
  CAMPANHA_ID: '00000000-0000-0000-0000-0000000000c1',

  /* ---------- aviso/comunicado (barra colorida no topo, gerido pelo admin) ---------- */
  AVISO_ID: '00000000-0000-0000-0000-0000000000a1',
  TIPOS_AVISO: [
    { id: 'info',    nome: 'Informativo (azul)',  icon: 'info' },
    { id: 'sucesso', nome: 'Novidade (verde)',    icon: 'check' },
    { id: 'alerta',  nome: 'Atenção (âmbar)',     icon: 'bell' },
    { id: 'critico', nome: 'Urgente (vermelho)',  icon: 'shield' }
  ],

  /* ---------- Briefings por produto (link do formulário) ----------
     ATENÇÃO: os links abaixo são localhost (só abrem no seu computador).
     Troque pela URL publicada do app de briefing quando estiver no ar.
     Produtos sem link específico caem no HUB (formulário geral). */
  /* App de briefing publicado (dentro do próprio sistema). Cada serviço tem seu formulário (?p=...);
     quando enviado por um projeto, o link leva pid+token e o preenchimento volta sozinho para a tabela projetos. */
  BRIEFING_BASE: 'https://consultores.outboxgroup.com.br/briefing/',
  BRIEFING_TIPOS: { onepage: 'onepage', lp: 'landing', institucional: 'site', apresentacao: 'apresentacao', identidade: 'identidade', ecommerce: 'ecommerce', sistemas: 'sistemas' },
  briefingTipo(produtoId) { return this.BRIEFING_TIPOS[produtoId] || 'site'; },
  briefingLink(produtoId, pid, token) {
    /* formulário público DENTRO do próprio sistema: ao enviar, cai em tempo real no painel do admin.
       O link passa por /b/<tipo>/ porque o robô do WhatsApp não roda JavaScript: era tudo a mesma
       página com a query mudando, então o preview saía igual para todos os briefings e o cliente
       não sabia qual tinha recebido. Cada tipo tem OpenGraph e imagem próprios nesse caminho, e a
       página redireciona sozinha para o formulário. */
    return this.APP_URL + '/b/' + this.briefingTipo(produtoId) + '/?briefing=' + encodeURIComponent(pid) + '&t=' + encodeURIComponent(token);
  },
  /* ---------- BRIEFING (público) ----------
     Estrutura vinda dos formulários oficiais da OutBox (forms.app), agora nativa e interativa:
     `chips` = múltipla escolha, `radio` = escolha única, além de text/textarea. */
  BRIEF_PERSONA: ['Acadêmica','Acessível','Agressiva','Analítica','Antiga','Arrojada','Artística','Atrevida','Atual','Aventureira','Básica','Calma','Casual','Científica','Complexa','Confiável','Convencional','Criativa','Curiosa','Deslumbrante','Determinada','Diferente','Disciplinada','Divertida','Emocional','Energética','Enigmática','Esperta','Estável','Exclusiva','Extrovertida','Formal','Futurista','Idealista','Industrial','Inocente','Intuitiva','Irreverente','Líder','Livre','Madura','Mente aberta','Moderna','Modesta','Multifacetada','Nostálgica','Ousada','Persistente','Profissional','Promissora','Racional','Radical','Rebelde','Refinada','Relaxada','Reservada','Respeitadora','Rigorosa','Romântica','Rústica','Sábia','Sensível','Séria','Simples','Sóbria','Sonhadora','Sutil','Técnica','Tradicional','Tranquila'],
  BRIEF_VISUAL: ['Séria','Extrovertida','Conservadora','Alegre','Aconchegante','Delicada','Moderna','Orgânica','Sofisticada','Elegante','Vibrante','Tradicional','Retrô','Digital','Pesada','Leve','Rústica','Discreta','Extravagante','Nobre','Popular','Romântica','Formal','Ousada','Humana','Rebelde','Irreverente'],
  BRIEF_APN_USO: ['Reunião presencial com o cliente','Reunião online','Enviada por WhatsApp','Enviada por e-mail','Apresentação em palco/evento','Feira ou stand','Treinamento de equipe','Captação de investidor'],
  BRIEF_APN_SECOES: ['Quem somos','O problema do cliente','A solução','Como funciona (passo a passo)','Portfólio / cases','Depoimentos','Números e resultados','Diferenciais','Comparativo com concorrentes','Linha do tempo da empresa','Equipe','Processo de trabalho','Prazos','Garantias','Tabela de preços','Condições de pagamento','Perguntas frequentes','Próximos passos'],
  BRIEF_APN_QTD: ['Até 8 slides','De 9 a 15 slides','De 16 a 25 slides','Mais de 25 slides','Deixo a OutBox definir'],
  BRIEF_ESTILO_SITE: ['Sério','Conservador','Elegante','Ecológico','Hightech','Moderno','Amigável','Divertido','Clean','Colorido','Escuro','Simples','Tradicional','Vintage','Instagramável','Minimalista','Sofisticado','Jovem'],
  BRIEF_GENERO: ['Feminino','Masculino','Feminino predominante','Masculino predominante','Ambos os gêneros'],
  BRIEF_CLASSE: ['A','B','C','D/E','Todas as classes'],
  BRIEF_IDADE: ['Até 17 anos','18 a 24','25 a 34','35 a 44','45 a 59','60+','Todas as idades'],

  /* base comum a todos os briefings */
  BRIEFING_FORM: [
    { sec: 'Sobre o seu negócio', campos: [
      { id: 'empresa', label: 'Nome da empresa ou marca', tipo: 'text', req: true },
      { id: 'segmento', label: 'Segmento / nicho de atuação', tipo: 'text', req: true },
      { id: 'sobre', label: 'Descreva resumidamente do que se trata a sua empresa', tipo: 'textarea', req: true },
      { id: 'tempo', label: 'Há quanto tempo a empresa existe?', tipo: 'text' },
      { id: 'produtos', label: 'Quais produtos ou serviços você oferece?', tipo: 'textarea', req: true },
      { id: 'diferenciais', label: 'O que faz a sua empresa ser especial? (diferenciais)', tipo: 'textarea', req: true },
      { id: 'slogan', label: 'A empresa tem algum slogan? Qual?', tipo: 'text' }
    ] },
    { sec: 'Concorrência', campos: [
      { id: 'concorrentes', label: 'Cite 3 concorrentes principais (nomes e links, se puder)', tipo: 'textarea', req: true },
      { id: 'conc_gap', label: 'Seus concorrentes oferecem algo que você ainda não oferece?', tipo: 'textarea' }
    ] },
    { sec: 'Público-alvo', campos: [
      { id: 'publico', label: 'Quem é o seu público-alvo? Descreva com detalhes', tipo: 'textarea', req: true },
      { id: 'classe', label: 'Qual a classe social do seu público?', tipo: 'chips', ops: 'BRIEF_CLASSE' },
      { id: 'idade', label: 'Qual a faixa etária?', tipo: 'chips', ops: 'BRIEF_IDADE' },
      { id: 'genero', label: 'Gênero predominante', tipo: 'radio', ops: 'BRIEF_GENERO' },
      { id: 'descrever', label: 'Como você gostaria que os clientes descrevessem a sua empresa?', tipo: 'textarea', req: true }
    ] },
    { sec: 'Objetivo do projeto', campos: [
      { id: 'objetivo', label: 'Qual o principal objetivo deste projeto?', tipo: 'textarea', req: true },
      { id: 'acao', label: 'O que o cliente deve fazer? (chamar no WhatsApp, comprar, agendar...)', tipo: 'text', req: true }
    ] },
    { sec: 'Materiais e contato', campos: [
      { id: 'materiais', label: 'Onde estão as imagens, logos e materiais? (link do Drive, WeTransfer...)', tipo: 'text' },
      { id: 'whatsapp', label: 'WhatsApp para contato', tipo: 'text', req: true },
      { id: 'email', label: 'E-mail', tipo: 'text', req: true },
      { id: 'redes', label: 'Redes sociais (@)', tipo: 'text' },
      { id: 'historia', label: 'A empresa ou algum produto tem uma história? Conte resumidamente', tipo: 'textarea' },
      { id: 'obs', label: 'Considerações finais e prazo desejado', tipo: 'textarea' }
    ] }
  ],

  /* blocos específicos por tipo de serviço */
  BRIEF_BLOCO_SITE: [
    { id: 'nome_site', label: 'O nome do site/página a ser desenvolvido será:', tipo: 'text', req: true },
    { id: 'dominio', label: 'Endereço (domínio), caso já tenha', tipo: 'text' },
    { id: 'secoes', label: 'Seções ou páginas que não podem faltar', tipo: 'textarea', req: true },
    { id: 'estilo', label: 'Quais atributos devem descrever o projeto? Marque quantos quiser', tipo: 'chips', ops: 'BRIEF_ESTILO_SITE', req: true },
    { id: 'aparencia', label: 'Já tem em mente alguma aparência? Descreva e cole links de referência', tipo: 'textarea', req: true },
    { id: 'referencias', label: 'Cite no mínimo 3 sites que você gosta do layout e da navegação (com links)', tipo: 'textarea', req: true },
    { id: 'evitar', label: 'O que você definitivamente NÃO quer ver no seu site?', tipo: 'textarea', req: true },
    { id: 'padrao', label: 'Existe um padrão a seguir? (cores, tipografias, manual da marca)', tipo: 'textarea' },
    { id: 'cores', label: 'Tem preferência de cores? A marca já tem identidade visual?', tipo: 'textarea', req: true },
    { id: 'textos', label: 'Você já tem os textos (copy) prontos ou precisa da nossa redação?', tipo: 'text', req: true },
    { id: 'copy_link', label: 'Se já tem a copy pronta, cole aqui o link do arquivo', tipo: 'text' }
  ],
  BRIEF_BLOCO_APN: [
    { id: 'apn_nome', label: 'Qual o título da apresentação?', tipo: 'text', req: true },
    { id: 'apn_objetivo', label: 'Qual o objetivo desta apresentação? O que ela precisa provocar em quem assiste?', tipo: 'textarea', req: true },
    { id: 'apn_uso', label: 'Onde ela será usada? Marque quantos quiser', tipo: 'chips', ops: 'BRIEF_APN_USO', req: true },
    { id: 'apn_quem', label: 'Quem vai apresentar? (você, um vendedor, a equipe toda)', tipo: 'text', req: true },
    { id: 'apn_tempo', label: 'Quanto tempo dura a apresentação, em média?', tipo: 'text' },
    { id: 'apn_momento', label: 'Em que momento da negociação ela entra? (primeiro contato, depois do orçamento, no fechamento)', tipo: 'textarea', req: true },
    { id: 'apn_objecoes', label: 'Quais objeções o cliente costuma levantar? A apresentação precisa derrubar quais delas?', tipo: 'textarea', req: true },
    { id: 'apn_estilo', label: 'Quais atributos devem descrever a apresentação? Marque quantos quiser', tipo: 'chips', ops: 'BRIEF_ESTILO_SITE', req: true },
    { id: 'apn_cores', label: 'Tem preferência de cores? A marca já tem identidade visual?', tipo: 'textarea', req: true },
    { id: 'apn_padrao', label: 'Existe um padrão a seguir? (manual de marca, tipografia, apresentação anterior)', tipo: 'textarea' },
    { id: 'apn_refs', label: 'Cite apresentações ou materiais que você admira, com links se possível', tipo: 'textarea', req: true },
    { id: 'apn_evitar', label: 'O que você definitivamente NÃO quer ver na apresentação?', tipo: 'textarea', req: true }
  ],
  BRIEF_BLOCO_MARCA: [
    { id: 'nome_marca', label: 'Nome da marca que será desenvolvida (ou sugestões, se ainda não tem)', tipo: 'text', req: true },
    { id: 'significado', label: 'Por que a empresa tem esse nome? O que ele significa para você?', tipo: 'textarea', req: true },
    { id: 'carro', label: 'Se dinheiro não fosse problema, qual seria o carro dos seus sonhos?', tipo: 'text' },
    { id: 'persona_sim', label: 'Se a sua empresa fosse uma pessoa, como ela SERIA?', tipo: 'chips', ops: 'BRIEF_PERSONA', req: true },
    { id: 'persona_top', label: 'Dessas palavras, cite as 3 mais fortes', tipo: 'text', req: true },
    { id: 'persona_nao', label: 'E como ela NÃO seria?', tipo: 'chips', ops: 'BRIEF_PERSONA' },
    { id: 'visual', label: 'Pensando só no visual, quais atributos têm relação com a sua marca?', tipo: 'chips', ops: 'BRIEF_VISUAL', req: true },
    { id: 'cor_sim', label: 'Tem alguma SUGESTÃO de cor para a marca?', tipo: 'text', req: true },
    { id: 'cor_nao', label: 'Qual cor você NÃO quer na sua marca?', tipo: 'text', req: true },
    { id: 'aplicacoes', label: 'Onde o cliente mais verá o seu logotipo? Liste por ordem de importância', tipo: 'textarea', req: true },
    { id: 'refs_marca', label: 'Marcas que você admira o visual (com links, mesmo de outros nichos)', tipo: 'textarea' }
  ],

  BRIEFING_EXTRA: {
    apresentacao: 'BRIEF_BLOCO_APN',
    onepage: 'BRIEF_BLOCO_SITE',
    site: 'BRIEF_BLOCO_SITE',
    'site-blog': 'BRIEF_BLOCO_SITE',
    landing: 'BRIEF_BLOCO_SITE',
    vendas: 'BRIEF_BLOCO_SITE',
    ecommerce: 'BRIEF_BLOCO_SITE',
    marketplace: 'BRIEF_BLOCO_SITE',
    identidade: 'BRIEF_BLOCO_MARCA',
    brandbook: 'BRIEF_BLOCO_MARCA',
    sistemas: null
  },
  /* perguntas exclusivas de cada serviço, somadas ao bloco acima */
  BRIEFING_ESPECIFICO: {
    apresentacao: [
      { id: 'apn_qtd', label: 'Quantos slides a apresentação deve ter?', tipo: 'chips', ops: 'BRIEF_APN_QTD', req: true },
      { id: 'apn_secoes', label: 'Quais seções não podem faltar? Marque quantas quiser', tipo: 'chips', ops: 'BRIEF_APN_SECOES', req: true },
      { id: 'apn_capa', label: 'O que precisa aparecer na CAPA? (título, logo, frase de efeito, foto, nome do cliente)', tipo: 'textarea', req: true },
      { id: 'apn_roteiro', label: 'Descreva o conteúdo de cada slide, na ordem que imagina. Pode escrever livremente, um por linha', tipo: 'textarea', req: true },
      { id: 'apn_textos', label: 'Você já tem os textos prontos ou precisa da nossa redação?', tipo: 'text', req: true },
      { id: 'apn_copy_link', label: 'Se já tem os textos, cole aqui o link do arquivo', tipo: 'text' },
      { id: 'apn_imagens', label: 'Quantas imagens por slide, em média? Descreva o tipo de imagem que imagina (foto de obra, ambiente, equipe, produto, ilustração)', tipo: 'textarea', req: true },
      { id: 'apn_banco_imagens', label: 'As imagens são suas ou podemos usar banco de imagens?', tipo: 'text', req: true },
      { id: 'apn_graficos', label: 'A apresentação vai ter gráficos ou tabelas? Se sim, quais dados eles mostram?', tipo: 'textarea', req: true },
      { id: 'apn_numeros', label: 'Quais números da empresa merecem destaque? (anos de mercado, obras entregues, clientes, prazo médio, garantia)', tipo: 'textarea', req: true },
      { id: 'apn_prova', label: 'Tem depoimentos, avaliações ou logos de clientes para incluir? Cole aqui ou diga onde estão', tipo: 'textarea' },
      { id: 'apn_portfolio', label: 'Quais trabalhos entram no portfólio da apresentação? Quantos e quais?', tipo: 'textarea', req: true },
      { id: 'apn_preco', label: 'A apresentação mostra preços ou condições? Se sim, quais?', tipo: 'textarea', req: true },
      { id: 'apn_final', label: 'O que precisa aparecer no SLIDE FINAL? (chamada para ação, contato, QR Code, redes, agradecimento)', tipo: 'textarea', req: true },
      { id: 'apn_cta', label: 'Qual a única ação que o cliente deve tomar ao final?', tipo: 'text', req: true },
      { id: 'apn_pdf', label: 'Além do link, precisa da versão em PDF para enviar no WhatsApp?', tipo: 'text' },
      { id: 'apn_anim', label: 'Prefere animações e transições ou algo mais sóbrio e estático?', tipo: 'text' }
    ],
    'site-blog': [
      { id: 'blog_temas', label: 'Sobre quais temas o blog vai falar?', tipo: 'textarea', req: true },
      { id: 'blog_freq', label: 'Com que frequência pretende publicar?', tipo: 'text' },
      { id: 'blog_quem', label: 'Quem vai escrever os artigos: você ou a OutBox?', tipo: 'text', req: true }
    ],
    ecommerce: [
      { id: 'qtd_produtos', label: 'Quantos produtos, aproximadamente?', tipo: 'text', req: true },
      { id: 'variacoes', label: 'Os produtos têm variações? (tamanho, cor, sabor...)', tipo: 'text' },
      { id: 'pagamento', label: 'Meios de pagamento desejados', tipo: 'text', req: true },
      { id: 'frete', label: 'Como funciona o frete? (Correios, transportadora, retirada, entrega própria)', tipo: 'textarea', req: true },
      { id: 'estoque', label: 'Já usa algum sistema de estoque ou ERP? Qual?', tipo: 'text' }
    ],
    marketplace: [
      { id: 'mkt_modelo', label: 'Qual o modelo do marketplace? (produtos, serviços, aluguel, assinatura)', tipo: 'textarea', req: true },
      { id: 'mkt_vendedores', label: 'Como os vendedores entram na plataforma? Haverá aprovação?', tipo: 'textarea', req: true },
      { id: 'mkt_comissao', label: 'Como será a comissão ou taxa por venda?', tipo: 'text', req: true },
      { id: 'mkt_repasse', label: 'Como será o repasse aos vendedores? (prazo e forma)', tipo: 'text' },
      { id: 'mkt_categorias', label: 'Quais categorias a plataforma vai ter?', tipo: 'textarea' }
    ],
    brandbook: [
      { id: 'bb_itens', label: 'O que o manual precisa cobrir? (uso do logo, cores, tipografia, tom de voz, papelaria, redes)', tipo: 'textarea', req: true },
      { id: 'bb_equipe', label: 'Quem vai usar o manual no dia a dia?', tipo: 'text' },
      { id: 'bb_tom', label: 'Como a marca fala com o cliente? (formal, próxima, divertida, técnica)', tipo: 'textarea', req: true }
    ],
    sistemas: [
      { id: 'processo', label: 'Descreva o processo ou rotina que o sistema deve atender', tipo: 'textarea', req: true },
      { id: 'usuarios', label: 'Quem vai usar o sistema? (perfis de acesso)', tipo: 'textarea', req: true },
      { id: 'hoje', label: 'Como isso é feito hoje? (planilha, papel, outro sistema)', tipo: 'textarea', req: true },
      { id: 'integra', label: 'Precisa integrar com algo? (ERP, WhatsApp, pagamento, nota fiscal)', tipo: 'text' }
    ]
  },
  /* resolve uma lista de opções declarada por nome */
  briefingOps(nome) { return (typeof nome === 'string' ? this[nome] : nome) || []; },
  briefingCampos(tipo) {
    const secs = this.BRIEFING_FORM.slice();
    const blocoNome = this.BRIEFING_EXTRA[tipo];
    const bloco = blocoNome ? this[blocoNome] : null;
    const espec = this.BRIEFING_ESPECIFICO[tipo];
    const extras = [];
    if (bloco) extras.push({ sec: bloco === this.BRIEF_BLOCO_MARCA ? 'Personalidade da marca' : (bloco === this.BRIEF_BLOCO_APN ? 'A apresentação' : 'O projeto e o estilo'), campos: bloco });
    if (espec) extras.push({ sec: tipo === 'apresentacao' ? 'Estrutura e slides' : 'Detalhes do serviço', campos: espec });
    if (!extras.length) return secs;
    // entra antes da última seção (materiais e contato)
    return secs.slice(0, -1).concat(extras, secs.slice(-1));
  },
  briefingTipoNome(tipo) { return ({ onepage: 'Site OnePage', landing: 'Landing Page', site: 'Site Institucional', 'site-blog': 'Site Institucional + Blog', identidade: 'Identidade Visual', brandbook: 'BrandBook', ecommerce: 'E-commerce', marketplace: 'Marketplace', sistemas: 'Sistema Sob Medida', vendas: 'Página de Vendas', apresentacao: 'Apresentação de Negócios' }[tipo]) || 'Projeto'; },
  /* produto correspondente a um tipo de briefing (biblioteca) */
  briefingProdutoDeTipo(tipo) { return ({ site: 'institucional', 'site-blog': 'institucional-blog', landing: 'lp', vendas: 'lp', onepage: 'onepage', identidade: 'identidade', brandbook: 'brandbook', ecommerce: 'ecommerce', marketplace: 'ecommerce', sistemas: 'sistemas', apresentacao: 'apresentacao' }[tipo]) || 'onepage'; },
  /* tela de início (capa) exclusiva por tipo de briefing */
  BRIEFING_INTRO: {
    onepage:     { emoji: '🚀', titulo: 'Vamos criar o seu Site OnePage', frase: 'Uma página única, direta e persuasiva, feita para transformar visitantes em clientes.' },
    landing:     { emoji: '🎯', titulo: 'Vamos criar a sua Landing Page', frase: 'Uma página focada em uma única ação: capturar e converter o seu cliente.' },
    site:        { emoji: '🌐', titulo: 'Vamos criar o seu Site', frase: 'Um site institucional completo para posicionar a sua marca com autoridade.' },
    'site-blog': { emoji: '📝', titulo: 'Vamos criar o seu Site + Blog', frase: 'Site institucional com blog para gerar conteúdo, autoridade e tráfego no Google.' },
    identidade:  { emoji: '🎨', titulo: 'Vamos criar a sua Identidade Visual', frase: 'Logo, cores e a personalidade que vão dar cara à sua marca.' },
    brandbook:   { emoji: '📘', titulo: 'Vamos criar o seu BrandBook', frase: 'O manual que garante que a sua marca seja usada com consistência em todo lugar.' },
    ecommerce:   { emoji: '🛒', titulo: 'Vamos criar a sua Loja Virtual', frase: 'Sua loja online pronta para vender 24 horas por dia, 7 dias por semana.' },
    marketplace: { emoji: '🏬', titulo: 'Vamos criar o seu Marketplace', frase: 'Uma plataforma onde vários vendedores anunciam e você fica com a comissão.' },
    sistemas:    { emoji: '⚙️', titulo: 'Vamos criar o seu Sistema', frase: 'Um sistema sob medida, desenhado para o processo do seu negócio.' },
    vendas:      { emoji: '💥', titulo: 'Vamos criar a sua Página de Vendas', frase: 'Uma página construída com técnica para vender o seu produto ou serviço.' },
    apresentacao:{ emoji: '📊', titulo: 'Vamos criar a sua Apresentação de Negócios', frase: 'A sua reunião de vendas em um link: roteiro, design e argumento, slide a slide.' }
  },
  briefingIntro(tipo) { return this.BRIEFING_INTRO[tipo] || { emoji: '✨', titulo: 'Vamos começar o seu projeto', frase: 'Preencha o briefing para darmos início com tudo alinhado.' }; },
  /* briefings prontos (biblioteca): formulário publicado por serviço */
  BRIEFINGS_PRONTOS: [
    { tipo: 'onepage', nome: 'Site OnePage' },
    { tipo: 'site', nome: 'Site Institucional' },
    { tipo: 'site-blog', nome: 'Site Institucional + Blog' },
    { tipo: 'landing', nome: 'Landing Page' },
    { tipo: 'vendas', nome: 'Página de Vendas' },
    { tipo: 'ecommerce', nome: 'E-commerce' },
    { tipo: 'marketplace', nome: 'Marketplace' },
    { tipo: 'identidade', nome: 'Identidade Visual' },
    { tipo: 'brandbook', nome: 'BrandBook' },
    { tipo: 'sistemas', nome: 'Sistema Sob Medida' }
  ],
  briefingLinkTipo(tipo) { return this.APP_URL + '/b/' + tipo + '/'; },  // mesmo caminho com preview por serviço; sem pid, cai no formulário avulso

  /* ---------- portfólio: cases entregues, por serviço (prova social) ---------- */
  PORTFOLIO_CATS: [
    { id: 'sites', nome: 'Sites e Landing Pages', filtravel: true, itens: [
      { id: 'angelica-chiarariavercelapp', nome: 'Dra. Angélica Chiararia', link: 'https://angelica-chiararia.vercel.app/', img: 'assets/portfolio/angelica-chiarariavercelapp.jpg', nicho: 'Saúde' },
      { id: 'bellucciplanejadoscombr', nome: 'Bellucci Planejados', link: 'https://bellucciplanejados.com.br/', img: 'assets/portfolio/bellucciplanejadoscombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'cardiopediatrabrasiliacombr', nome: 'Cardiopediatra Brasília', link: 'https://www.cardiopediatrabrasilia.com.br/', img: 'assets/portfolio/cardiopediatrabrasiliacombr.jpg', nicho: 'Saúde' },
      { id: 'casa46combr', nome: 'Casa 46', link: 'https://www.casa46.com.br/', img: 'assets/portfolio/casa46combr.jpg', nicho: 'Mentoria & Negócios' },
      { id: 'clinicaaureaplenuscombr', nome: 'Clínica Áurea Plenus', link: 'https://www.clinicaaureaplenus.com.br/', img: 'assets/portfolio/clinicaaureaplenuscombr.jpg', nicho: 'Saúde' },
      { id: 'dentsitecombr', nome: 'DentSite', link: 'https://dentsite.com.br/', img: 'assets/portfolio/dentsitecombr.jpg', nicho: 'Saúde' },
      { id: 'jonaspastorecombr-doutor-das-vendas', nome: 'Doutor das Vendas', link: 'https://www.jonaspastore.com.br/doutor-das-vendas', img: 'assets/portfolio/jonaspastorecombr-doutor-das-vendas.jpg', nicho: 'Mentoria & Negócios' },
      { id: 'escoladeplanejadoscombr', nome: 'Escola de Planejados', link: 'https://www.escoladeplanejados.com.br/', img: 'assets/portfolio/escoladeplanejadoscombr.jpg', nicho: 'Educação' },
      { id: 'espacobellocombr', nome: 'Espaço Bello', link: 'https://www.espacobello.com.br/', img: 'assets/portfolio/espacobellocombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'incasaprojetospt', nome: 'In.casa Projetos', link: 'https://www.incasaprojetos.pt/', img: 'assets/portfolio/incasaprojetospt.jpg', nicho: 'Móveis Planejados' },
      { id: 'jearomascombr', nome: 'Je Aromas', link: 'https://www.jearomas.com.br/', img: 'assets/portfolio/jearomascombr.jpg', nicho: 'Cosméticos & Aromas' },
      { id: 'jonaspastorecombr', nome: 'Jônas Pastore', link: 'https://www.jonaspastore.com.br/', img: 'assets/portfolio/jonaspastorecombr.jpg', nicho: 'Mentoria & Negócios' },
      { id: 'josuealvescom', nome: 'Josué Alves', link: 'https://www.josuealves.com/', img: 'assets/portfolio/josuealvescom.jpg', nicho: 'Mentoria & Negócios' },
      { id: 'magarecombr', nome: 'Magare Planejados', link: 'https://www.magare.com.br/', img: 'assets/portfolio/magarecombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'mayramaximianocombr', nome: 'Mayra Maximiano', link: 'https://mayramaximiano.com.br/', img: 'assets/portfolio/mayramaximianocombr.jpg', nicho: 'Mentoria & Negócios' },
      { id: 'mobidmarcenariacombr', nome: 'MOBID Marcenaria', link: 'https://www.mobidmarcenaria.com.br/', img: 'assets/portfolio/mobidmarcenariacombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'modiniplanejadoscombr', nome: 'Modini Planejados', link: 'https://www.modiniplanejados.com.br/', img: 'assets/portfolio/modiniplanejadoscombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'moveisplanejadositajaicombr', nome: 'Móveis Planejados Itajaí', link: 'https://www.moveisplanejadositajai.com.br/', img: 'assets/portfolio/moveisplanejadositajaicombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'pazpediatriacombr', nome: 'Paz Pediatria', link: 'https://www.pazpediatria.com.br/', img: 'assets/portfolio/pazpediatriacombr.jpg', nicho: 'Saúde' },
      { id: 'pneumomedcombr', nome: 'PneumoMed', link: 'https://www.pneumomed.com.br/', img: 'assets/portfolio/pneumomedcombr.jpg', nicho: 'Saúde' },
      { id: 'solidplanejadoscombr', nome: 'Solid Planejados', link: 'https://www.solidplanejados.com.br/', img: 'assets/portfolio/solidplanejadoscombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'stopadesingcombr', nome: 'Stopa Design', link: 'https://www.stopadesing.com.br/', img: 'assets/portfolio/stopadesingcombr.jpg', nicho: 'Móveis Planejados' },
      { id: 'veobusmayramaximianocombr', nome: 'Vida em ORDEM Business', link: 'https://www.veobus.mayramaximiano.com.br/', img: 'assets/portfolio/veobusmayramaximianocombr.jpg', nicho: 'Mentoria & Negócios' },
      { id: 'werteengbr', nome: 'Werte Engenharia', link: 'https://www.werte.eng.br/', img: 'assets/portfolio/werteengbr.jpg', nicho: 'Engenharia & Construção' }
    ] },
    { id: 'ecommerce',  nome: 'E-commerce',           filtravel: false, itens: [] },
    { id: 'identidade', nome: 'Identidades Visuais',  filtravel: false, itens: [] },
    { id: 'brandbook',  nome: 'Brandbook',            filtravel: false, itens: [] },
    { id: 'sistemas',   nome: 'Sistemas Sob Medida',  filtravel: false, itens: [] }
  ],

  /* ---------- portfólio no banco (tabela portfolio_itens) ----------
     A lista acima é a SEMENTE. O que o admin cadastrar ou editar no painel
     entra por cima dela, e sair do ar é desativar (nunca some do histórico). */
  PORTFOLIO_CATS_IDS() { return this.PORTFOLIO_CATS.map(c => c.id); },
  portfolioCatNome(id) { const c = this.PORTFOLIO_CATS.find(x => x.id === id); return c ? c.nome : id; },

  _ptIn(r) {
    return { id: r.id, categoria: r.categoria || 'sites', nome: r.nome || '', link: r.link || '',
      img: r.img || '', nicho: r.nicho || '', ativo: r.ativo !== false,
      ordem: r.ordem != null ? Number(r.ordem) : 0, criadoEm: r.criado_em || null };
  },
  _ptOut(p) { return { id: p.id, categoria: p.categoria || 'sites', nome: p.nome, link: p.link || null,
    img: p.img || null, nicho: p.nicho || null, ativo: p.ativo !== false,
    ordem: p.ordem != null ? p.ordem : 0, atualizado_em: new Date().toISOString() }; },

  /* item da semente (usado para saber o que pode ser excluído de verdade) */
  _portfolioSemente(id) {
    for (const cat of this.PORTFOLIO_CATS) {
      const it = (cat.itens || []).find(x => x.id === id);
      if (it) return Object.assign({}, it, { categoria: cat.id });
    }
    return null;
  },
  ehPortfolioSemente(id) { return !!this._portfolioSemente(id); },

  /* todos os itens: semente + o que veio do banco por cima + os novos do admin */
  portfolioItens() {
    const doBanco = {};
    (this.db.portfolio || []).forEach(x => { doBanco[x.id] = x; });
    const out = [];
    this.PORTFOLIO_CATS.forEach(cat => {
      (cat.itens || []).forEach(it => {
        const base = Object.assign({ ativo: true, ordem: 0, categoria: cat.id }, it);
        out.push(doBanco[it.id] ? Object.assign(base, doBanco[it.id]) : base);
        delete doBanco[it.id];
      });
    });
    Object.keys(doBanco).forEach(k => out.push(doBanco[k]));
    return out;
  },
  /* agrupado por categoria, como as telas esperam. opts.todos inclui os desativados (admin) */
  portfolioCats(opts) {
    const todos = this.portfolioItens();
    const incluirOff = !!(opts && opts.todos);
    return this.PORTFOLIO_CATS.map(cat => Object.assign({}, cat, {
      itens: todos
        .filter(i => i.categoria === cat.id && (incluirOff || i.ativo !== false))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || String(a.nome).localeCompare(String(b.nome), 'pt', { sensitivity: 'base' }))
    }));
  },
  portfolioItemById(id) { return this.portfolioItens().find(i => i.id === id) || null; },

  savePortfolioItem(item) {
    const arr = this.db.portfolio || (this.db.portfolio = []);
    const i = arr.findIndex(x => x.id === item.id);
    if (i >= 0) arr[i] = item; else arr.push(item);
    this._save('portfolio_itens', this._ptOut(item));
    return item;
  },
  /* item da semente não é apagado, só desativado (o arquivo da imagem continua no projeto).
     Item cadastrado pelo admin some de vez. Devolve true se foi exclusão de verdade. */
  removePortfolioItem(id) {
    if (this.ehPortfolioSemente(id)) {
      const atual = this.portfolioItemById(id) || {};
      this.savePortfolioItem(Object.assign({}, atual, { id, ativo: false }));
      return false;
    }
    this.db.portfolio = (this.db.portfolio || []).filter(x => x.id !== id);
    this._delete('portfolio_itens', id);
    return true;
  },
  /* id novo a partir do nome, sem colidir com o que já existe */
  slugPortfolio(nome) {
    const base = (nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'case';
    let id = base, n = 2;
    while (this.portfolioItemById(id)) { id = base + '-' + n; n++; }
    return id;
  },

  /* etapas da timeline de entrega (ordem = progresso do projeto) */
  ETAPAS_PROJETO: [
    { id: 'briefing_enviado',  nome: 'Briefing enviado',   icon: 'share',    campo: 'briefingEnviadoEm',  quem: 'Consultor enviou o formulário ao cliente' },
    { id: 'briefing_recebido', nome: 'Briefing recebido',  icon: 'check',    campo: 'briefingRecebidoEm', quem: 'Cliente preencheu e enviou o briefing' },
    { id: 'em_producao',       nome: 'Em produção',        icon: 'edit',     campo: 'emProducaoEm',       quem: 'OutBox iniciou os trabalhos' },
    { id: 'em_revisao',        nome: 'Em revisão',         icon: 'eye',      campo: 'emRevisaoEm',        quem: 'Projeto em ajustes finais' },
    { id: 'entregue',          nome: 'Entregue',           icon: 'external', campo: 'entregueEm',         quem: 'Link do projeto disponível' },
    { id: 'aprovado',          nome: 'Aprovado',           icon: 'prize',    campo: 'aprovadoEm',         quem: 'Cliente aprovou o projeto final' }
  ],
  etapaIndex(status) { const i = this.ETAPAS_PROJETO.findIndex(e => e.id === status); return i < 0 ? 0 : i; },

  /* ---------- cache em memória ---------- */
  db: { profile: null, profiles: [], clients: [], sales: [], requests: [], leads: [], aviso: null, campanha: null, treinos: {}, treinosAll: [], ranking: [], rankingGeral: [], projetos: [], chat: [], contratos: [], criativos: [], projetoArquivos: [], equipe: [], lojaCategorias: [], lojaProdutos: [], lojaPedidos: [], portfolio: [] },

  /* ---------- theme (único uso de localStorage) ---------- */
  _get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  uid() { return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36); },

  /* ============================================================
     MAPPERS  (camelCase no app  <->  snake_case no banco)
     ============================================================ */
  _pIn(r)  { return r && { id: r.id, role: r.role, email: r.email, nome: r.nome, sobrenome: r.sobrenome, nascimento: r.nascimento, doc: r.doc, celular: r.celular, instagram: r.instagram, cep: r.cep, logradouro: r.logradouro, numero: r.numero, complemento: r.complemento, bairro: r.bairro, cidade: r.cidade, uf: r.uf, pais: r.pais || '', foto: r.foto, twoFA: r.two_fa, provider: r.provider, moeda: r.moeda || 'BRL', termosVersao: r.termos_versao || null, termosAceitoEm: r.termos_aceito_em || null, banco: r.banco || '', agencia: r.agencia || '', conta: r.conta || '', contaTipo: r.conta_tipo || 'corrente', pix: r.pix || '', criadoEm: r.criado_em || null, lastSeenEm: r.last_seen_em || null, bvValor: r.bonus_bv_valor != null ? Number(r.bonus_bv_valor) : null, bvStatus: r.bonus_bv_status || 'pendente', bvInicio: r.bonus_bv_inicio || null, bvExpira: r.bonus_bv_expira || null, whatsGrupoEm: r.whats_grupo_em || null, equipeCargo: r.equipe_cargo || null, equipeNivel: r.equipe_nivel != null ? Number(r.equipe_nivel) : null, contaVinculada: r.conta_vinculada || null, enquadramento: r.enquadramento || 'pf', _full: Object.prototype.hasOwnProperty.call(r, 'foto') }; },
  _pOut(u) {
    const o = this._pOutBase(u);
    // linha reduzida (sem a coluna foto): omite o campo para o upsert não apagar a foto no banco
    if (u.foto === undefined || u._full === false) delete o.foto;
    return o;
  },
  _pOutBase(u) { return { id: u.id, role: u.role, email: u.email, nome: u.nome, sobrenome: u.sobrenome, nascimento: u.nascimento || null, doc: u.doc, celular: u.celular, instagram: u.instagram, cep: u.cep, logradouro: u.logradouro, numero: u.numero, complemento: u.complemento, bairro: u.bairro, cidade: u.cidade, uf: u.uf, pais: u.pais || null, foto: u.foto, two_fa: !!u.twoFA, provider: u.provider, moeda: u.moeda || 'BRL', termos_versao: u.termosVersao || null, termos_aceito_em: u.termosAceitoEm || null, banco: u.banco || null, agencia: u.agencia || null, conta: u.conta || null, conta_tipo: u.contaTipo || null, pix: u.pix || null, bonus_bv_valor: u.bvValor != null ? u.bvValor : null, bonus_bv_status: u.bvStatus || 'pendente', bonus_bv_inicio: u.bvInicio || null, bonus_bv_expira: u.bvExpira || null, whats_grupo_em: u.whatsGrupoEm || null, equipe_cargo: u.equipeCargo || null, equipe_nivel: u.equipeNivel != null ? u.equipeNivel : null, enquadramento: u.enquadramento || 'pf' }; },

  _cIn(r)  { return { id: r.id, consultorId: r.consultor_id, nome: r.nome, contato: r.contato, doc: r.doc, telefone: r.telefone, instagram: r.instagram, email: r.email, cep: r.cep, logradouro: r.logradouro, numero: r.numero, complemento: r.complemento, bairro: r.bairro, cidade: r.cidade, uf: r.uf, tipo: r.tipo, recorrenciaMeses: r.recorrencia_meses != null ? Number(r.recorrencia_meses) : null, servico: r.servico, porte: r.porte || 'pequena', obs: r.obs, criadoEm: r.criado_em }; },
  _cOut(c) { return { id: c.id, consultor_id: c.consultorId, nome: c.nome, contato: c.contato, doc: c.doc, telefone: c.telefone, instagram: c.instagram, email: c.email, cep: c.cep, logradouro: c.logradouro, numero: c.numero, complemento: c.complemento, bairro: c.bairro, cidade: c.cidade, uf: c.uf, tipo: c.tipo, recorrencia_meses: c.recorrenciaMeses != null ? c.recorrenciaMeses : null, servico: c.servico, porte: c.porte || 'pequena', obs: c.obs, criado_em: c.criadoEm }; },

  _sIn(r)  { let prods = []; try { prods = r.produtos ? (typeof r.produtos === 'string' ? JSON.parse(r.produtos) : r.produtos) : []; } catch (e) { prods = []; } if (!Array.isArray(prods) || !prods.length) prods = r.produto ? [r.produto] : []; return { id: r.id, consultorId: r.consultor_id, clientId: r.client_id, produto: r.produto, produtos: prods, valor: Number(r.valor), data: r.data, statusComissao: r.status_comissao, statusProposta: r.status_proposta || 'aprovada', valorBruto: r.valor_bruto != null ? Number(r.valor_bruto) : Number(r.valor), descontoTipo: r.desconto_tipo, descontoValor: Number(r.desconto_valor || 0), moeda: r.moeda || 'BRL', precoModo: r.preco_modo || 'tabela', formaPagamento: r.forma_pagamento || 'pix', parcelas: Number(r.parcelas || 1), pixDesconto: !!r.pix_desconto, valorCliente: r.valor_cliente != null ? Number(r.valor_cliente) : Number(r.valor), acceptToken: r.accept_token || null, aceitoEm: r.aceito_em || null, linkPagamento: r.link_pagamento || '', statusPagamento: r.status_pagamento || 'pendente', bonus: (r.bonus || '').split(',').map(x => x.trim()).filter(Boolean), bonusStatus: r.bonus_status || null, bonusObs: r.bonus_obs || '', formaAceite: r.forma_aceite || null, parcelasAceite: r.parcelas_aceite != null ? Number(r.parcelas_aceite) : null }; },
  _sOut(s) { const prods = (Array.isArray(s.produtos) && s.produtos.length) ? s.produtos : (s.produto ? [s.produto] : []); return { id: s.id, consultor_id: s.consultorId, client_id: s.clientId, produto: s.produto || prods[0] || null, produtos: JSON.stringify(prods), valor: s.valor, data: s.data, status_comissao: s.statusComissao, status_proposta: s.statusProposta || 'aprovada', valor_bruto: s.valorBruto != null ? s.valorBruto : s.valor, desconto_tipo: s.descontoTipo || null, desconto_valor: s.descontoValor || 0, moeda: s.moeda || 'BRL', preco_modo: s.precoModo || 'tabela', forma_pagamento: s.formaPagamento || 'pix', parcelas: s.parcelas || 1, pix_desconto: !!s.pixDesconto, valor_cliente: s.valorCliente != null ? s.valorCliente : s.valor, accept_token: s.acceptToken || null, link_pagamento: s.linkPagamento || null, status_pagamento: s.statusPagamento || 'pendente', bonus: (Array.isArray(s.bonus) && s.bonus.length) ? s.bonus.join(',') : null, bonus_status: s.bonusStatus || null, bonus_obs: s.bonusObs || null, forma_aceite: s.formaAceite || null, parcelas_aceite: s.parcelasAceite != null ? s.parcelasAceite : null }; },

  _avIn(r)  { return r && { id: r.id, texto: r.texto || '', tipo: r.tipo || 'info', ativo: !!r.ativo, inicio: r.inicio || null, fim: r.fim || null }; },
  _avOut(a) { return { id: this.AVISO_ID, texto: a.texto || '', tipo: a.tipo || 'info', ativo: !!a.ativo, inicio: a.inicio || null, fim: a.fim || null, atualizado_em: new Date().toISOString() }; },

  /* campanha/propaganda: metadados (sem imagem, para o load ser leve) */
  _campIn(r) { return r && { id: r.id, ativo: !!r.ativo, inicio: r.inicio || null, fim: r.fim || null, diasSemana: r.dias_semana || [], horaInicio: r.hora_inicio || '', horaFim: r.hora_fim || '', atualizadoEm: r.atualizado_em, imagem: (typeof r.imagem === 'string' ? r.imagem : undefined) }; },
  _campOut(c) { return { id: this.CAMPANHA_ID, imagem: c.imagem || null, ativo: !!c.ativo, inicio: c.inicio || null, fim: c.fim || null, dias_semana: Array.isArray(c.diasSemana) ? c.diasSemana : [], hora_inicio: c.horaInicio || null, hora_fim: c.horaFim || null, atualizado_em: new Date().toISOString() }; },
  /* chat Manu: mensagens */
  _msgIn(r) { return { id: r.id, consultorId: r.consultor_id, autor: r.autor || 'consultor', texto: r.texto || '', urgente: !!r.urgente, lido: !!r.lido, arquivada: !!r.arquivada, criadoEm: r.criado_em }; },
  _msgOut(m) { return { id: m.id, consultor_id: m.consultorId, autor: m.autor || 'consultor', texto: m.texto || '', urgente: !!m.urgente, lido: !!m.lido, arquivada: !!m.arquivada, criado_em: m.criadoEm || new Date().toISOString() }; },

  /* comprime a arte enviada (máx 1080px de largura; PNG, cai p/ JPEG se ficar pesado) */
  _comprimirArte(dataUrl) {
    return new Promise((res) => {
      try {
        const img = new Image();
        img.onload = () => {
          const MAXW = 1080; let w = img.width, h = img.height;
          if (w > MAXW) { h = Math.round(h * MAXW / w); w = MAXW; }
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          let out; try { out = cv.toDataURL('image/png'); } catch (e) { return res(dataUrl); }
          if (out.length > 1200000) { try { const j = cv.toDataURL('image/jpeg', 0.9); if (j.length < out.length) out = j; } catch (e) {} }
          res(out);
        };
        img.onerror = () => res(dataUrl);
        img.src = dataUrl;
      } catch (e) { res(dataUrl); }
    });
  },

  _lIn(r)  { return { id: r.id, consultorId: r.consultor_id, nome: r.nome, telefone: r.telefone, email: r.email, servico: r.servico, estagio: r.estagio, valorEstimado: Number(r.valor_estimado || 0), moeda: r.moeda || 'BRL', obs: r.obs, ordem: r.ordem, criadoEm: r.criado_em, followupEm: r.followup_em || null }; },
  _lOut(l) { return { id: l.id, consultor_id: l.consultorId, nome: l.nome, telefone: l.telefone, email: l.email, servico: l.servico || null, estagio: l.estagio, valor_estimado: l.valorEstimado || 0, moeda: l.moeda || 'BRL', obs: l.obs, ordem: l.ordem || 0, criado_em: l.criadoEm, followup_em: l.followupEm || null }; },

  _prIn(r) { let prods = []; try { prods = r.produtos ? (typeof r.produtos === 'string' ? JSON.parse(r.produtos) : r.produtos) : []; } catch (e) { prods = []; } if (!Array.isArray(prods)) prods = []; return { id: r.id, saleId: r.sale_id, consultorId: r.consultor_id, clientId: r.client_id, produtos: prods, status: r.status || 'briefing_enviado', briefingLink: r.briefing_link || '', briefingToken: r.briefing_token || '', briefingRespostas: r.briefing_respostas || '', briefingPorServico: (r.briefing_por_servico && typeof r.briefing_por_servico === 'object') ? r.briefing_por_servico : {}, linkFinal: r.link_final || '', obs: r.obs || '', briefingEnviadoEm: r.briefing_enviado_em, briefingRecebidoEm: r.briefing_recebido_em, emProducaoEm: r.em_producao_em, emRevisaoEm: r.em_revisao_em, entregueEm: r.entregue_em, aprovadoEm: r.aprovado_em, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em }; },
  _prOut(p) { return { id: p.id, sale_id: p.saleId || null, consultor_id: p.consultorId, client_id: p.clientId || null, produtos: JSON.stringify(p.produtos || []), status: p.status || 'briefing_enviado', briefing_link: p.briefingLink || null, briefing_token: p.briefingToken || null, briefing_respostas: p.briefingRespostas || null, briefing_por_servico: p.briefingPorServico || {}, link_final: p.linkFinal || null, obs: p.obs || null, briefing_enviado_em: p.briefingEnviadoEm || null, briefing_recebido_em: p.briefingRecebidoEm || null, em_producao_em: p.emProducaoEm || null, em_revisao_em: p.emRevisaoEm || null, entregue_em: p.entregueEm || null, aprovado_em: p.aprovadoEm || null, atualizado_em: new Date().toISOString() }; },

  _rIn(r)  { return { id: r.id, tipo: r.tipo, modo: r.modo, premioId: r.premio_id, premioNome: r.premio_nome, consultorId: r.consultor_id, consultorNome: r.consultor_nome, valor: Number(r.valor), detalhe: r.detalhe, pix: r.pix, status: r.status, criadoEm: r.criado_em, vendaIds: r.venda_ids, pagoEm: r.pago_em, comprovante: r.comprovante }; },
  _rOut(r) { return { id: r.id, tipo: r.tipo, modo: r.modo, premio_id: r.premioId, premio_nome: r.premioNome, consultor_id: r.consultorId, consultor_nome: r.consultorNome, valor: r.valor, detalhe: r.detalhe, pix: r.pix, status: r.status, criado_em: r.criadoEm, venda_ids: r.vendaIds || null, pago_em: r.pagoEm || null, comprovante: r.comprovante || null }; },

  /* ============================================================
     CARGA  (hidrata o cache do Supabase) — RLS já filtra o escopo
     ============================================================ */
  async loadAll() {
    const { data: { user } } = await SB.auth.getUser();
    if (!user) { this.db = { profile: null, profiles: [], clients: [], sales: [], requests: [] }; return; }
    // lista de perfis SEM a coluna foto (base64 pesado): o admin baixava MBs de fotos a cada load.
    // A foto do próprio usuário vem na 1ª query (perfil individual); as demais mostram iniciais.
    const COLS_PERFIL = 'id,role,email,nome,sobrenome,nascimento,doc,celular,instagram,cep,logradouro,numero,complemento,bairro,cidade,uf,pais,two_fa,provider,moeda,termos_versao,termos_aceito_em,banco,agencia,conta,conta_tipo,pix,criado_em,last_seen_em,bonus_bv_valor,bonus_bv_status,bonus_bv_inicio,bonus_bv_expira,whats_grupo_em,equipe_cargo,equipe_nivel';
    const [prof, profs, cli, sal, req, lds, avi, tp, rk, prj, cmp, rgl, cht, ctr, cri, parq, eqp, lcat, lprd, lped, cat, prt] = await Promise.all([
      SB.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      SB.from('profiles').select(COLS_PERFIL),
      SB.from('clients').select('*'),
      SB.from('sales').select('*'),
      SB.from('requests').select('*'),
      SB.from('leads').select('*'),
      SB.from('avisos').select('*').eq('id', this.AVISO_ID).maybeSingle(),
      SB.from('training_progress').select('*'),
      SB.rpc('ranking_treinamentos'),
      SB.from('projetos').select('*'),
      SB.from('campanhas').select('id,ativo,inicio,fim,dias_semana,hora_inicio,hora_fim,atualizado_em').eq('id', this.CAMPANHA_ID).maybeSingle(),
      SB.rpc('ranking_geral'),
      SB.from('chat_mensagens').select('*').order('criado_em'),
      SB.from('contratos').select('*').order('criado_em', { ascending: false }),
      SB.from('criativos').select('id,titulo,formato,categoria,legenda,hashtags,ativo,criado_em').order('criado_em', { ascending: false }),
      SB.from('projeto_arquivos').select('id,projeto_id,autor,categoria,nome,mime,tamanho,url,criado_em').order('criado_em', { ascending: false }),
      SB.from('equipe').select('*').order('nivel'),
      SB.from('loja_categorias').select('*').order('ordem'),
      SB.from('loja_produtos').select('*').order('ordem'),
      SB.from('loja_pedidos').select('*').order('criado_em', { ascending: false }),
      SB.from('catalogo_produtos').select('*').order('ordem'),
      SB.from('portfolio_itens').select('*').order('ordem')
    ]);
    this.db.portfolio = (prt && prt.data) ? prt.data.map(r => this._ptIn(r)) : [];
    // catálogo de serviços: a semente do código é sobreposta pelo que o admin cadastrou
    this._syncCatalogo((cat && cat.data) ? cat.data : []);
    let profile = prof.data ? this._pIn(prof.data) : null;
    // fallback: se o trigger ainda não criou o perfil, cria agora
    if (!profile) {
      const role = ADMIN_EMAILS.includes((user.email || '').toLowerCase()) ? 'admin' : 'consultor';
      profile = { id: user.id, role, email: user.email, nome: (user.user_metadata && user.user_metadata.nome) || '', sobrenome: (user.user_metadata && user.user_metadata.sobrenome) || '', provider: 'email', twoFA: false };
      await SB.from('profiles').upsert(this._pOut(profile));
    }
    this.db.profile = profile;
    this.db.equipe = (eqp && eqp.data) ? eqp.data.map(r => this._eqIn(r)) : [];
    this.db.lojaCategorias = (lcat && lcat.data) ? lcat.data.map(r => this._lcIn(r)) : [];
    this.db.lojaProdutos = (lprd && lprd.data) ? lprd.data.map(r => this._lpIn(r)) : [];
    this.db.lojaPedidos = (lped && lped.data) ? lped.data.map(r => this._loIn(r)) : [];
    this.db.profiles = (profs.data || []).map(r => this._pIn(r));
    // A lista geral vem sem a coluna foto (base64 pesado), mas a linha do próprio usuário
    // veio completa na 1ª consulta. Ela TEM de substituir a reduzida: é este objeto que
    // vira o perfil ativo, e sem a foto o formulário de perfil se recusa a salvar.
    const iEu = this.db.profiles.findIndex(p => p.id === profile.id);
    if (iEu >= 0) this.db.profiles[iEu] = profile; else this.db.profiles.push(profile);
    this.db.clients = (cli.data || []).map(r => this._cIn(r));
    this.db.sales = (sal.data || []).map(r => this._sIn(r));
    this.db.requests = (req.data || []).map(r => this._rIn(r)).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    this.db.leads = (lds.data || []).map(r => this._lIn(r));
    this.db.aviso = avi && avi.data ? this._avIn(avi.data) : null;
    this.db.campanha = cmp && cmp.data ? this._campIn(cmp.data) : null;
    this.db.rankingGeral = (rgl && rgl.data) ? rgl.data : [];
    this.db.chat = (cht && cht.data) ? cht.data.map(r => this._msgIn(r)) : [];
    // progresso de treinamentos: todas as linhas visíveis (RLS: consultor vê as suas, admin vê todas)
    const tprows = (tp && tp.data) ? tp.data : [];
    const objTr = (typeof TREINOS !== 'undefined' ? TREINOS.OBJETIVO : 90);
    // "concluído" é derivado da nota (>= OBJETIVO), garantindo consistência mesmo em registros salvos com regra antiga
    this.db.treinosAll = tprows.map(r => ({ consultorId: r.consultor_id, treinoId: r.treino_id, melhorNota: r.melhor_nota || 0, tentativas: r.tentativas || 0, concluido: (r.melhor_nota || 0) >= objTr }));
    this.db.treinos = {};
    this.db.treinosAll.filter(r => r.consultorId === user.id).forEach(r => { this.db.treinos[r.treinoId] = { melhorNota: r.melhorNota, tentativas: r.tentativas, concluido: r.concluido }; });
    this.db.ranking = (rk && rk.data) ? rk.data : [];
    // contas vinculadas: consulta à parte e tolerante, para o sistema seguir
    // funcionando mesmo antes da migração que cria a coluna
    await this._carregarVinculos();
    this._restaurarPainel(profile);
    this.db.projetos = (prj && prj.data) ? prj.data.map(r => this._prIn(r)) : [];
    this.db.contratos = (ctr && ctr.data) ? ctr.data.map(r => this._ctIn(r)) : [];
    this.db.criativos = (cri && cri.data) ? cri.data.map(r => this._criIn(r)) : [];
    this.db.projetoArquivos = (parq && parq.data) ? parq.data.map(r => this._paIn(r)) : [];
  },

  clearCache() { this.painel = null; this.contaAuthId = null; this.db = { profile: null, profiles: [], clients: [], sales: [], requests: [], leads: [], aviso: null, campanha: null, treinos: {}, treinosAll: [], ranking: [], rankingGeral: [], projetos: [], chat: [], contratos: [], criativos: [], projetoArquivos: [], equipe: [], lojaCategorias: [], lojaProdutos: [], lojaPedidos: [], portfolio: [] }; },

  _err(e) { console.error('[OB] erro Supabase:', e); if (window.UI) UI.toast('Erro ao salvar', (e && e.message) || 'Tente novamente', 'err'); },
  async _save(table, row) { const { error } = await SB.from(table).upsert(row); if (error) this._err(error); },
  async _delete(table, id) { const { error } = await SB.from(table).delete().eq('id', id); if (error) this._err(error); },

  /* ============================================================
     SESSÃO / USUÁRIOS (a partir do cache)
     ============================================================ */
  session() { return this.db.profile; },

  /* ============================================================
     CONTAS VINCULADAS
     A conta de admin e a de consultor da mesma pessoa formam um par.
     Quem entra por qualquer uma das duas alterna entre os painéis com
     um clique, usando o sistema por inteiro, sem sair e entrar de novo.
     Quem é admin e não tem par usa o painel de consultor na própria conta.
     ============================================================ */
  PAINEL_KEY: 'ob_painel',
  contaAuthId: null,      // id de quem realmente fez login (não muda durante a sessão)
  painel: null,           // painel em uso: 'admin' | 'consultor'

  contaAuth() { return (this.contaAuthId && this.userById(this.contaAuthId)) || this.db.profile; },
  /* a outra conta do par, se houver */
  contaPar(u) {
    const p = u || this.contaAuth();
    return (p && p.contaVinculada) ? this.userById(p.contaVinculada) : null;
  },
  /* qual perfil responde por cada painel */
  perfilDoPainel(painel) {
    const eu = this.contaAuth(); if (!eu) return null;
    const par = this.contaPar(eu);
    if (painel === 'admin') {
      if (eu.role === 'admin') return eu;
      return (par && par.role === 'admin') ? par : null;
    }
    // painel do consultor: a conta de consultor vinculada; sem par, a própria conta
    if (par && par.role === 'consultor') return par;
    return eu;
  },
  painelAtual() { return this.painel || ((this.db.profile && this.db.profile.role === 'admin') ? 'admin' : 'consultor'); },
  /* Quem vê o botão de trocar de painel:
       - contas de administrador (as que você criar);
       - contas de consultor VINCULADAS a uma conta de administrador (o seu par).
     Consultor comum nunca vê: não existe lado admin para ele. */
  podeAlternarPainel() {
    const eu = this.contaAuth(); if (!eu) return false;
    const par = this.contaPar(eu);
    const temLadoAdmin = eu.role === 'admin' || !!(par && par.role === 'admin');
    if (!temLadoAdmin) return false;
    return !!this.perfilDoPainel('admin') && !!this.perfilDoPainel('consultor');
  },
  /* Quem pode digitar o valor do serviço na mão, fora da tabela:
       - contas de administrador;
       - a conta de consultor VINCULADA a um administrador (o par do Felipe).
     Consultor comum continua preso à tabela de preços. */
  podePrecoManual() {
    const eu = this.contaAuth(); if (!eu) return false;
    if (eu.role === 'admin') return true;
    const par = this.contaPar(eu);
    return !!(par && par.role === 'admin');
  },
  outroPainel() { return this.painelAtual() === 'admin' ? 'consultor' : 'admin'; },
  /* nome/e-mail da conta que responde por um painel (para mostrar na tela) */
  contaDoPainel(painel) {
    const p = this.perfilDoPainel(painel);
    return p ? (((p.nome || '') + ' ' + (p.sobrenome || '')).trim() || p.email || '') : '';
  },
  emailDoPainel(painel) { const p = this.perfilDoPainel(painel); return p ? (p.email || '') : ''; },

  /* lê os vínculos sem derrubar a carga caso a coluna ainda não exista no banco */
  async _carregarVinculos() {
    try {
      const { data, error } = await SB.from('profiles').select('id,conta_vinculada');
      if (error || !data) return;
      const mapa = {};
      data.forEach(r => { mapa[r.id] = r.conta_vinculada || null; });
      (this.db.profiles || []).forEach(p => { if (mapa[p.id] !== undefined) p.contaVinculada = mapa[p.id]; });
      if (this.db.profile && mapa[this.db.profile.id] !== undefined) this.db.profile.contaVinculada = mapa[this.db.profile.id];
      // a conta do par passa a ser o perfil ativo quando você troca de painel, então
      // precisa vir completa (com a foto), senão o sistema a julga incompleta e tranca.
      const parId = this.db.profile && this.db.profile.contaVinculada;
      if (parId) {
        const r2 = await SB.from('profiles').select('*').eq('id', parId).maybeSingle();
        if (r2 && r2.data) {
          const cheio = this._pIn(r2.data);
          const i = (this.db.profiles || []).findIndex(p => p.id === cheio.id);
          if (i >= 0) this.db.profiles[i] = cheio; else this.db.profiles.push(cheio);
        }
      }
    } catch (e) { /* coluna ainda não criada: segue sem par de contas */ }
  },

  usarPainel(painel) {
    const p = this.perfilDoPainel(painel);
    if (!p) return false;
    this.painel = painel;
    this.db.profile = p;
    try { sessionStorage.setItem(this.PAINEL_KEY, painel); } catch (e) {}
    return true;
  },
  /* decide o painel na carga: respeita a última escolha da sessão */
  _restaurarPainel(perfilAuth) {
    this.contaAuthId = perfilAuth.id;
    let escolhido = null;
    try { escolhido = sessionStorage.getItem(this.PAINEL_KEY); } catch (e) {}
    const padrao = perfilAuth.role === 'admin' ? 'admin' : 'consultor';
    if (!escolhido || !this.usarPainel(escolhido)) this.usarPainel(padrao);
  },

  /* vincula (ou desvincula) a conta de consultor à conta de admin.
     Grava nos dois lados; o banco só aceita se quem pede for admin de verdade. */
  async vincularContas(adminId, consultorId) {
    const adm = this.userById(adminId);
    if (!adm || adm.role !== 'admin') return { ok: false, erro: 'Conta de administrador inválida.' };
    const antigo = adm.contaVinculada && this.userById(adm.contaVinculada);
    const alvo = consultorId ? this.userById(consultorId) : null;
    if (consultorId && (!alvo || alvo.role !== 'consultor')) return { ok: false, erro: 'Conta de consultor inválida.' };
    if (alvo && alvo.contaVinculada && alvo.contaVinculada !== adminId) {
      return { ok: false, erro: 'Esta conta de consultor já está vinculada a outro administrador.' };
    }
    const grava = async (id, valor) => {
      const { error } = await SB.from('profiles').update({ conta_vinculada: valor }).eq('id', id);
      if (error) throw error;
    };
    try {
      if (antigo && (!alvo || antigo.id !== alvo.id)) { await grava(antigo.id, null); antigo.contaVinculada = null; }
      await grava(adminId, consultorId || null);
      adm.contaVinculada = consultorId || null;
      if (alvo) { await grava(alvo.id, adminId); alvo.contaVinculada = adminId; }
      return { ok: true };
    } catch (e) {
      this._err(e);
      return { ok: false, erro: (e && e.message) || 'Não foi possível salvar o vínculo.' };
    }
  },

  /* precisa aceitar os termos? (consultor que ainda não aceitou a versão vigente) */
  precisaAceitarTermos() {
    const u = this.db.profile;
    if (!u || u.role === 'admin') return false;               // admin não passa pelo aceite
    if (typeof TERMOS === 'undefined') return false;
    return u.termosVersao !== TERMOS.VERSAO;
  },

  /* registra o aceite: atualiza o perfil e grava um registro imutável de auditoria */
  async aceitarTermos(meta) {
    const u = this.db.profile;
    if (!u) return { ok: false };
    const agora = new Date().toISOString();
    // 1) perfil (usado como portão rápido no login)
    u.termosVersao = TERMOS.VERSAO;
    u.termosAceitoEm = agora;
    if (this.db.profile && this.db.profile.id === u.id) this.db.profile = u;
    const idx = this.db.profiles.findIndex(p => p.id === u.id);
    if (idx >= 0) this.db.profiles[idx] = u;
    await this._save('profiles', this._pOut(u));
    // 2) trilha de auditoria (append-only). Best-effort: falha aqui não bloqueia o acesso.
    try {
      const digs = (u.doc || '').replace(/\D/g, '');
      await SB.from('aceites_termos').insert({
        consultor_id: u.id,
        versao: TERMOS.VERSAO,
        documentos: TERMOS.DOCUMENTOS,
        tipo_doc: digs.length > 11 ? 'CNPJ' : 'CPF',
        documento: u.doc || null,
        nome: `${u.nome || ''} ${u.sobrenome || ''}`.trim() || null,
        ip: (meta && meta.ip) || null,
        user_agent: (meta && meta.userAgent) || null,
        aceito_em: agora
      });
    } catch (e) { console.error('[OB] falha ao gravar auditoria de aceite:', e); }
    return { ok: true };
  },

  /* perfil está completo? (mesmos obrigatórios da validação do formulário de perfil) */
  _perfilCompleto(u) {
    if (!u) return false;
    const obrig = [u.foto, u.nome, u.sobrenome, u.nascimento, u.celular, u.instagram, u.cep, u.numero, u.logradouro, u.bairro, u.cidade, u.uf, u.banco, u.agencia, u.conta, u.pix];
    if (obrig.some(v => !String(v == null ? '' : v).trim())) return false;
    const doc = String(u.doc || '').replace(/\D/g, '');
    if (doc.length !== 11 && doc.length !== 14) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(u.email || '').trim())) return false;
    return true;
  },
  /* consultor precisa completar o perfil antes de acessar o sistema? (admin nunca) */
  precisaCompletarPerfil() {
    const u = this.db.profile;
    if (!u || u.role === 'admin') return false;
    // a lista geral de perfis não traz a foto (base64 pesado). Julgar por ela trancaria
    // a tela de um cadastro que na verdade está completo, então só decide com a linha cheia.
    if (!u._full) return false;
    // conta que faz par com uma de admin não passa pelo portão de onboarding: o portão
    // existe para consultor novo, e aqui ele prenderia o dono do sistema fora do painel.
    if (this.podeAlternarPainel()) return false;
    return !this._perfilCompleto(u);
  },

  /* ---------- presença (quem está logado agora) ---------- */
  ONLINE_JANELA_MIN: 5,
  async pingPresenca() {
    const u = this.db.profile; if (!u) return;
    const agora = new Date().toISOString();
    u.lastSeenEm = agora;
    try { await SB.from('profiles').update({ last_seen_em: agora }).eq('id', u.id); } catch (e) {}
  },
  online(u) {
    if (!u || !u.lastSeenEm) return false;
    return (Date.now() - new Date(u.lastSeenEm).getTime()) < this.ONLINE_JANELA_MIN * 60 * 1000;
  },

  /* ---------- fotos (avatares) carregadas sob demanda + auto-compressão ----------
     A lista de profiles NÃO traz a foto (base64 pesado). As fotos são buscadas em
     2º plano; se alguma estiver grande, o sistema encolhe e salva a miniatura de volta,
     então a partir daí tudo fica leve. Admin pode salvar de qualquer um (RPC set_foto). */
  fotos: {},
  _comprimirFoto(dataUrl) {
    return new Promise((res) => {
      try {
        const img = new Image();
        img.onload = () => {
          const MAX = 300; let w = img.width, h = img.height;
          if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
          else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          let out; try { out = cv.toDataURL('image/jpeg', 0.8); } catch (e) { out = dataUrl; }
          res(out && out.length < dataUrl.length ? out : dataUrl);
        };
        img.onerror = () => res(dataUrl);
        img.src = dataUrl;
      } catch (e) { res(dataUrl); }
    });
  },
  async _salvarFotoEncolhida(id, foto) {
    if (!foto || foto.length <= 120000) return foto; // já é leve
    const thumb = await this._comprimirFoto(foto);
    if (thumb && thumb.length < foto.length * 0.9) {
      try { await SB.rpc('set_foto', { p_id: id, p_foto: thumb }); } catch (e) {}
      if (this.db.profile && this.db.profile.id === id) this.db.profile.foto = thumb;
      return thumb;
    }
    return foto;
  },
  /* fotos de ids específicos via RPC SECURITY DEFINER (funciona p/ consultor ver os outros no ranking, driblando o RLS) */
  async fotosDe(ids) {
    const faltam = [...new Set(ids || [])].filter(id => id && this.fotos[id] === undefined);
    if (!faltam.length) return this.fotos;
    try {
      const { data } = await SB.rpc('fotos_consultores', { p_ids: faltam });
      (data || []).forEach(row => { this.fotos[row.id] = row.foto || null; });
    } catch (e) {}
    faltam.forEach(id => { if (this.fotos[id] === undefined) this.fotos[id] = null; });
    return this.fotos;
  },
  /* busca as fotos que faltam no cache e encolhe as grandes; devolve o mapa id->foto */
  async carregarFotos() {
    const own = this.db.profile;
    if (own && own.foto && this.fotos[own.id] === undefined) {
      this.fotos[own.id] = own.foto;
      this.fotos[own.id] = await this._salvarFotoEncolhida(own.id, own.foto);
    }
    const faltam = (this.db.profiles || []).map(p => p.id).filter(id => this.fotos[id] === undefined);
    if (faltam.length) {
      const { data } = await SB.from('profiles').select('id,foto').in('id', faltam);
      for (const row of (data || [])) {
        this.fotos[row.id] = row.foto || null;
        if (row.foto) this.fotos[row.id] = await this._salvarFotoEncolhida(row.id, row.foto);
      }
      faltam.forEach(id => { if (this.fotos[id] === undefined) this.fotos[id] = null; });
    }
    return this.fotos;
  },

  /* ---------- serviços de uma venda (compat: antigas têm só 1) ---------- */
  produtosDaVenda(s) {
    if (Array.isArray(s.produtos) && s.produtos.length) return s.produtos;
    return s.produto ? [s.produto] : [];
  },
  produtosNomes(s) {
    return this.produtosDaVenda(s).map(id => { const p = this.PRODUTOS.find(x => x.id === id); return p ? p.nome : id; }).join(' + ');
  },

  users() { return this.db.profiles; },
  userById(id) { return this.db.profiles.find(u => u.id === id) || null; },
  userByEmail(email) { return this.db.profiles.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase()) || null; },
  upsertUser(user) {
    const i = this.db.profiles.findIndex(u => u.id === user.id);
    if (i >= 0) this.db.profiles[i] = user; else this.db.profiles.push(user);
    if (this.db.profile && this.db.profile.id === user.id) this.db.profile = user;
    this._save('profiles', this._pOut(user));
    return user;
  },

  /* ---------- clientes ---------- */
  clients() { return this.db.clients; },
  clientsOf(consultorId) { return this.db.clients.filter(c => c.consultorId === consultorId); },
  clientById(id) { return this.db.clients.find(c => c.id === id) || null; },
  upsertClient(c) {
    const i = this.db.clients.findIndex(x => x.id === c.id);
    if (i >= 0) this.db.clients[i] = c; else this.db.clients.push(c);
    this._save('clients', this._cOut(c));
    return c;
  },
  removeClient(id) { this.db.clients = this.db.clients.filter(c => c.id !== id); this._delete('clients', id); },

  /* ---------- vendas ---------- */
  sales() { return this.db.sales; },
  salesOf(consultorId) { return this.db.sales.filter(s => s.consultorId === consultorId); },
  /* consultor fez a primeira venda? (≥1 proposta aprovada) — libera os e-books */
  fezPrimeiraVenda(consultorId) { return this.salesOf(consultorId).some(s => s.statusProposta === 'aprovada'); },
  addSale(s) { this.db.sales.push(s); this._save('sales', this._sOut(s)); return s; },
  updateSale(s) { const i = this.db.sales.findIndex(x => x.id === s.id); if (i >= 0) this.db.sales[i] = s; this._save('sales', this._sOut(s)); return s; },
  removeSale(id) { this.db.sales = this.db.sales.filter(s => s.id !== id); this._delete('sales', id); },
  /* admin confirma/desfaz o recebimento do pagamento do cliente (libera comissão).
     A RLS permite o admin gravar (policies sales_insert_admin/is_admin). */
  setPagamento(saleId, status) { const s = this.db.sales.find(x => x.id === saleId); if (!s) return null; s.statusPagamento = status; this.updateSale(s); return s; },

  /* ---------- projetos / briefings / entrega ---------- */
  projetos() { return this.db.projetos || []; },
  projetosDe(consultorId) { return (this.db.projetos || []).filter(p => p.consultorId === consultorId); },
  projetoDaVenda(saleId) { return (this.db.projetos || []).find(p => p.saleId === saleId) || null; },
  projetoById(id) { return (this.db.projetos || []).find(p => p.id === id) || null; },
  addProjeto(p) { this.db.projetos.push(p); this._save('projetos', this._prOut(p)); return p; },
  updateProjeto(p) { const i = this.db.projetos.findIndex(x => x.id === p.id); if (i >= 0) this.db.projetos[i] = p; else this.db.projetos.push(p); this._save('projetos', this._prOut(p)); return p; },
  /* exclui o projeto/briefing (os arquivos vão junto pelo ON DELETE CASCADE) */
  removeProjeto(id) {
    this.db.projetos = (this.db.projetos || []).filter(p => p.id !== id);
    this.db.projetoArquivos = (this.db.projetoArquivos || []).filter(a => a.projetoId !== id);
    this._delete('projetos', id);
  },
  /* move o projeto para uma etapa, carimbando a data (não regride datas já existentes) */
  setEtapaProjeto(p, status) {
    const idx = this.etapaIndex(status);
    p.status = status;
    const campo = (this.ETAPAS_PROJETO[idx] || {}).campo;
    if (campo && !p[campo]) p[campo] = new Date().toISOString();
    return this.updateProjeto(p);
  },
  /* briefings recebidos que ainda não entraram em produção (alerta do admin) */
  briefingsPendentesAdmin() { return (this.db.projetos || []).filter(p => p.status === 'briefing_recebido'); },

  /* ---------- ARQUIVOS do projeto (entregas do admin + uploads do consultor) ----------
     dados (base64) NÃO vêm no loadAll (só metadados); baixa sob demanda via getArquivoDados. */
  ARQ_CATEGORIAS: {
    entrega:     { nome: 'Entrega', quem: 'admin' },
    solicitacao: { nome: 'Solicitação de material', quem: 'admin' },
    imagem:      { nome: 'Imagem do projeto', quem: 'consultor' },
    copy:        { nome: 'Copy / texto', quem: 'consultor' },
    link:        { nome: 'Link', quem: 'consultor' }
  },
  _paIn(r) { return { id: r.id, projetoId: r.projeto_id, autor: r.autor || 'consultor', categoria: r.categoria || 'imagem', nome: r.nome || '', mime: r.mime || '', tamanho: r.tamanho || 0, url: r.url || '', criadoEm: r.criado_em }; },
  _paOut(a) { return { id: a.id, projeto_id: a.projetoId, autor: a.autor || 'consultor', categoria: a.categoria || 'imagem', nome: a.nome || null, mime: a.mime || null, tamanho: a.tamanho || 0, url: a.url || null, dados: a.dados || null }; },
  arquivosDoProjeto(projetoId) { return (this.db.projetoArquivos || []).filter(a => a.projetoId === projetoId); },
  entregasDoProjeto(projetoId) { return this.arquivosDoProjeto(projetoId).filter(a => a.autor === 'admin' && a.categoria === 'entrega'); },
  uploadsDoProjeto(projetoId) { return this.arquivosDoProjeto(projetoId).filter(a => a.autor === 'consultor' && a.categoria !== 'solicitacao'); },
  solicitacoesDoProjeto(projetoId) { return this.arquivosDoProjeto(projetoId).filter(a => a.categoria === 'solicitacao'); },
  /* projetos do consultor com solicitação em aberto (badge da Linha do Tempo) */
  solicitacoesAbertas(consultorId) { return this.projetosDe(consultorId).reduce((n, p) => n + this.solicitacoesDoProjeto(p.id).length, 0); },
  arquivoById(id) { return (this.db.projetoArquivos || []).find(a => a.id === id) || null; },
  addArquivo(a) { const meta = { id: a.id, projetoId: a.projetoId, autor: a.autor, categoria: a.categoria, nome: a.nome, mime: a.mime, tamanho: a.tamanho, url: a.url || '', criadoEm: new Date().toISOString() };
    (this.db.projetoArquivos || (this.db.projetoArquivos = [])).unshift(meta);
    if (a.dados) this._paDados = Object.assign(this._paDados || {}, { [a.id]: a.dados }); // cache local do base64 recém-enviado
    this._save('projeto_arquivos', this._paOut(a)); return meta; },
  removeArquivo(id) { this.db.projetoArquivos = (this.db.projetoArquivos || []).filter(a => a.id !== id); if (this._paDados) delete this._paDados[id]; this._delete('projeto_arquivos', id); },
  /* baixa o base64 do arquivo sob demanda (cache em memória) */
  async getArquivoDados(id) {
    this._paDados = this._paDados || {};
    if (this._paDados[id] != null) return this._paDados[id];
    const { data, error } = await SB.from('projeto_arquivos').select('dados,url').eq('id', id).maybeSingle();
    if (error || !data) return null;
    this._paDados[id] = data.dados || '';
    return this._paDados[id];
  },

  /* ---------- CONTRATOS por serviço (aceite virtual) ---------- */
  CONTRATO_FORO: 'Comarca de Santa Cruz do Rio Pardo, Estado de São Paulo',
  ASSINATURA_OUTBOX: 'data:image/png;base64,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', // assinatura da OutBox (Felipe) embutida em base64
  /* cláusula do objeto + prazo por tipo de serviço (contrato-base) */
  CONTRATO_MODELOS: {
    identidade:   { objeto: 'criação de identidade visual, compreendendo logotipo com variações, paleta de cores, tipografia da marca, manual básico de aplicação e entrega dos arquivos em alta resolução para uso digital e impresso', prazo: '10 a 20 dias úteis', revisoes: '2 (duas) rodadas de revisão do conceito aprovado' },
    lp:           { objeto: 'desenvolvimento de uma landing page (página única focada em conversão), contemplando texto persuasivo, chamada para ação, botão de WhatsApp, formulário de contato, otimização para dispositivos móveis e publicação no ar', prazo: '7 a 15 dias úteis', revisoes: '2 (duas) rodadas de revisão' },
    onepage:      { objeto: 'desenvolvimento de site em página única (one page), contemplando apresentação da empresa, serviços, diferenciais, depoimentos, mapa de localização, botão de WhatsApp e otimização para dispositivos móveis e para mecanismos de busca', prazo: '10 a 20 dias úteis', revisoes: '2 (duas) rodadas de revisão' },
    institucional:{ objeto: 'desenvolvimento de site institucional com múltiplas páginas (início, sobre, serviços e contato), formulário de contato, botão de WhatsApp, otimização para dispositivos móveis e SEO básico', prazo: '20 a 35 dias úteis', revisoes: '3 (três) rodadas de revisão' },
    ecommerce:    { objeto: 'desenvolvimento de loja virtual (e-commerce) com cadastro de produtos, carrinho de compras, integração com meios de pagamento, cálculo de frete, área do cliente e treinamento para gestão de pedidos', prazo: '30 a 45 dias úteis', revisoes: '3 (três) rodadas de revisão' },
    sistemas:     { objeto: 'desenvolvimento de sistema sob medida, contemplando levantamento de requisitos, telas personalizadas, controle de acesso por usuário, relatórios gerenciais e suporte na implantação', prazo: 'conforme cronograma aprovado no levantamento de requisitos', revisoes: 'as previstas no escopo aprovado' },
    apresentacao: { objeto: 'desenvolvimento de apresentação de negócios interativa, navegável em computador e dispositivos móveis, contemplando roteiro comercial, design das telas, animações, gráficos institucionais, portfólio, depoimentos, botão de WhatsApp e publicação em link exclusivo para uso em reuniões e envio a clientes', prazo: '15 a 25 dias úteis', revisoes: '2 (duas) rodadas de revisão do layout aprovado' },
    hospedagem:   { objeto: 'prestação de serviço de hospedagem anual do site em servidor de alta disponibilidade, contemplando conexão do domínio, certificado de segurança (SSL/HTTPS), e-mail profissional, backups periódicos e suporte técnico durante a vigência', prazo: 'vigência de 12 (doze) meses, com ativação em até 3 (três) dias úteis a contar da confirmação do pagamento', revisoes: 'não se aplica (serviço de hospedagem)' }
  },
  contratoModelo(produtoId) {
    // produto cadastrado pelo admin pode trazer sua própria cláusula de objeto
    const p = this.produtoById(produtoId);
    if (p && p.contratoObjeto) {
      return { objeto: p.contratoObjeto, prazo: p.contratoPrazo || p.entrega || 'conforme cronograma aprovado',
               revisoes: p.contratoRevisoes || '2 (duas) rodadas de revisão do escopo aprovado' };
    }
    if (this.CONTRATO_MODELOS[produtoId]) return this.CONTRATO_MODELOS[produtoId];
    // produto novo sem cláusula própria: monta a partir do que está no catálogo
    if (p) {
      return { objeto: 'prestação do serviço de ' + p.nome.toLowerCase() + (p.incluso ? ', compreendendo ' + p.incluso.replace(/\.$/, '') : ''),
               prazo: p.entrega || 'conforme cronograma aprovado', revisoes: '2 (duas) rodadas de revisão do escopo aprovado' };
    }
    return this.CONTRATO_MODELOS.institucional;
  },
  _ctIn(r) { let dados = {}; try { dados = r.dados ? (typeof r.dados === 'string' ? JSON.parse(r.dados) : r.dados) : {}; } catch (e) { dados = {}; }
    return { id: r.id, numero: r.numero || '', saleId: r.sale_id, consultorId: r.consultor_id, clientId: r.client_id, dados, status: r.status || 'pendente', acceptToken: r.accept_token || '', aceiteNome: r.aceite_nome || '', aceiteDoc: r.aceite_doc || '', aceiteIp: r.aceite_ip || '', aceitoEm: r.aceito_em || null, criadoEm: r.criado_em }; },
  _ctOut(c) { return { id: c.id, numero: c.numero || null, sale_id: c.saleId || null, consultor_id: c.consultorId, client_id: c.clientId || null, dados: c.dados || {}, status: c.status || 'pendente', accept_token: c.acceptToken || null, aceite_nome: c.aceiteNome || null, aceite_doc: c.aceiteDoc || null, aceite_ip: c.aceiteIp || null, aceito_em: c.aceitoEm || null, criado_em: c.criadoEm }; },
  contratos() { return this.db.contratos || []; },
  contratosDe(consultorId) { return (this.db.contratos || []).filter(c => c.consultorId === consultorId); },
  contratoDaVenda(saleId) { return (this.db.contratos || []).find(c => c.saleId === saleId) || null; },
  contratoById(id) { return (this.db.contratos || []).find(c => c.id === id) || null; },
  addContrato(c) { this.db.contratos.unshift(c); this._save('contratos', this._ctOut(c)); return c; },
  /* Grava o contrato ESPERANDO a resposta do banco e conferindo que a linha existe.
     O addContrato dispara e esquece, e foi assim que um contrato ficou só no cache
     do navegador: o consultor via o contrato e mandava um link que o cliente abria
     como "Contrato não encontrado". Aqui a gravação é confirmada antes de seguir. */
  async salvarContratoConfirmado(c) {
    if (!c || !c.id) return { ok: false, erro: 'contrato inválido' };
    const i = this.db.contratos.findIndex(x => x.id === c.id);
    if (i >= 0) this.db.contratos[i] = c; else this.db.contratos.unshift(c);
    try {
      const { error } = await SB.from('contratos').upsert(this._ctOut(c));
      if (error) return { ok: false, erro: error.message || 'falha ao gravar' };
      const { data, error: e2 } = await SB.from('contratos').select('id').eq('id', c.id).maybeSingle();
      if (e2) return { ok: false, erro: e2.message || 'falha ao conferir' };
      if (!data) return { ok: false, erro: 'o contrato não apareceu no banco' };
      return { ok: true };
    } catch (e) { return { ok: false, erro: (e && e.message) || 'falha de rede' }; }
  },
  /* Mesma proteção do contrato, agora para o projeto que sustenta o link do
     briefing: grava esperando a resposta e confere que a linha existe. */
  async salvarProjetoConfirmado(p) {
    if (!p || !p.id) return { ok: false, erro: 'projeto inválido' };
    const i = this.db.projetos.findIndex(x => x.id === p.id);
    if (i >= 0) this.db.projetos[i] = p; else this.db.projetos.unshift(p);
    try {
      const { error } = await SB.from('projetos').upsert(this._prOut(p));
      if (error) return { ok: false, erro: error.message || 'falha ao gravar' };
      const { data, error: e2 } = await SB.from('projetos').select('id,briefing_token').eq('id', p.id).maybeSingle();
      if (e2) return { ok: false, erro: e2.message || 'falha ao conferir' };
      if (!data) return { ok: false, erro: 'o projeto não apareceu no banco' };
      if (!data.briefing_token) return { ok: false, erro: 'o token do briefing não foi gravado' };
      return { ok: true };
    } catch (e) { return { ok: false, erro: (e && e.message) || 'falha de rede' }; }
  },
  /* confere no banco, e não no cache, se o contrato realmente existe */
  async contratoNoBanco(id) {
    try { const { data, error } = await SB.from('contratos').select('id').eq('id', id).maybeSingle();
      if (error) return null; return !!data; } catch (e) { return null; }
  },
  updateContrato(c) { const i = this.db.contratos.findIndex(x => x.id === c.id); if (i >= 0) this.db.contratos[i] = c; else this.db.contratos.unshift(c); this._save('contratos', this._ctOut(c)); return c; },
  removeContrato(id) { this.db.contratos = (this.db.contratos || []).filter(c => c.id !== id); this._delete('contratos', id); },
  /* remove o contrato vinculado a uma venda (ao excluir a venda) */
  removeContratoDaVenda(saleId) { const c = this.contratoDaVenda(saleId); if (c) this.removeContrato(c.id); return !!c; },
  /* número sequencial do contrato: OB-AAAA-NNNN */
  gerarNumeroContrato() {
    const ano = new Date().getFullYear();
    const doAno = (this.db.contratos || []).filter(c => (c.numero || '').includes('-' + ano + '-'));
    const seq = String(doAno.length + 1).padStart(4, '0');
    return `OB-${ano}-${seq}`;
  },

  /* ---------- CRIATIVOS (artes p/ os consultores baixarem e postarem) ---------- */
  CRIATIVO_FORMATOS: [
    { id: '4:5',  nome: 'Feed',      desc: 'Arte para feed',              ratio: '4 / 5'  },
    { id: '9:16', nome: 'Stories',   desc: 'Arte para stories e reels',   ratio: '9 / 16' },
    { id: '1:1',  nome: 'Quadrado',  desc: 'Arte quadrada para feed',     ratio: '1 / 1'  },
    { id: '16:9', nome: 'Horizontal',desc: 'Arte horizontal / capa',      ratio: '16 / 9' }
  ],
  criativoFormato(id) { return this.CRIATIVO_FORMATOS.find(f => f.id === id) || { id: id || '4:5', nome: 'Feed', desc: 'Arte para feed', ratio: '4 / 5' }; },
  /* categorias predefinidas (múltipla escolha no admin) */
  CRIATIVO_CATEGORIAS: ['Institucional', 'Promoções e ofertas', 'Serviços', 'Provas sociais', 'Dicas e conteúdo', 'Datas comemorativas', 'Cases e resultados', 'Captação de clientes'],
  /* categorias de um criativo (armazenadas como texto separado por vírgula) */
  criativoCategorias(c) { return String((c && c.categoria) || '').split(',').map(s => s.trim()).filter(Boolean); },
  /* comprime a arte mantendo boa qualidade p/ download (lado maior até 1600px, JPEG 0.86) */
  _comprimirCriativo(dataUrl) {
    return new Promise((res) => {
      try {
        const img = new Image();
        img.onload = () => {
          const MAX = 1600; let w = img.width, h = img.height;
          if (Math.max(w, h) > MAX) { const k = MAX / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          let out; try { out = cv.toDataURL('image/jpeg', 0.86); } catch (e) { return res(dataUrl); }
          if (/^data:image\/png/.test(dataUrl) && dataUrl.length < 700000) out = dataUrl; // PNG pequeno (transparência) preserva
          res(out);
        };
        img.onerror = () => res(dataUrl);
        img.src = dataUrl;
      } catch (e) { res(dataUrl); }
    });
  },
  _criIn(r) { return { id: r.id, titulo: r.titulo || '', categoria: r.categoria || '', legenda: r.legenda || '', hashtags: r.hashtags || '', ativo: r.ativo !== false, criadoEm: r.criado_em }; },
  _criOut(c) { return { id: c.id, titulo: c.titulo || null, categoria: c.categoria || null, legenda: c.legenda || null, hashtags: c.hashtags || null, imagem_feed: c.imagemFeed || null, imagem_stories: c.imagemStories || null, ativo: c.ativo !== false, criado_em: c.criadoEm }; },
  criativos() { return this.db.criativos || []; },
  criativosAtivos() { return (this.db.criativos || []).filter(c => c.ativo); },
  criativoById(id) { return (this.db.criativos || []).find(c => c.id === id) || null; },
  _criImg: {}, // cache das imagens (chave `${id}|feed` ou `${id}|stories`)
  _criCol(tipo) { return tipo === 'stories' ? 'imagem_stories' : 'imagem_feed'; },
  async getCriativoImagem(id, tipo) {
    tipo = tipo === 'stories' ? 'stories' : 'feed';
    const key = id + '|' + tipo;
    if (this._criImg[key] !== undefined) return this._criImg[key];
    try {
      const col = this._criCol(tipo);
      const { data } = await SB.from('criativos').select(col + ', imagem').eq('id', id).maybeSingle();
      const img = (data && (data[col] || (tipo === 'feed' ? data.imagem : ''))) || ''; // fallback p/ coluna antiga 'imagem'
      this._criImg[key] = img; return img;
    } catch (e) { this._criImg[key] = ''; return ''; }
  },
  addCriativo(c) { const meta = this._criIn(this._criOut(c)); this.db.criativos.unshift(meta); if (c.imagemFeed) this._criImg[c.id + '|feed'] = c.imagemFeed; if (c.imagemStories) this._criImg[c.id + '|stories'] = c.imagemStories; this._save('criativos', this._criOut(c)); return meta; },
  /* atualiza SÓ os metadados (não toca nas imagens) — usado em editar/ativar-desativar */
  async updateCriativoMeta(c) {
    const i = this.db.criativos.findIndex(x => x.id === c.id); const meta = this._criIn({ id: c.id, titulo: c.titulo, categoria: c.categoria, legenda: c.legenda, hashtags: c.hashtags, ativo: c.ativo, criado_em: c.criadoEm });
    if (i >= 0) this.db.criativos[i] = meta;
    try { await SB.from('criativos').update({ titulo: c.titulo || null, categoria: c.categoria || null, legenda: c.legenda || null, hashtags: c.hashtags || null, ativo: c.ativo !== false }).eq('id', c.id); } catch (e) { this._err(e); }
    return meta;
  },
  /* troca uma das imagens (feed|stories) de um criativo existente */
  async setCriativoImagem(id, tipo, imagem) {
    tipo = tipo === 'stories' ? 'stories' : 'feed';
    this._criImg[id + '|' + tipo] = imagem;
    const col = this._criCol(tipo);
    try { await SB.from('criativos').update({ [col]: imagem || null }).eq('id', id); } catch (e) { this._err(e); }
  },
  removeCriativo(id) { this.db.criativos = (this.db.criativos || []).filter(c => c.id !== id); delete this._criImg[id + '|feed']; delete this._criImg[id + '|stories']; this._delete('criativos', id); },

  /* ---------- aviso/comunicado ---------- */
  getAviso() { return this.db.aviso || { id: this.AVISO_ID, texto: '', tipo: 'info', ativo: false, inicio: null, fim: null }; },
  saveAviso(a) { this.db.aviso = { id: this.AVISO_ID, texto: a.texto || '', tipo: a.tipo || 'info', ativo: !!a.ativo, inicio: a.inicio || null, fim: a.fim || null }; this._save('avisos', this._avOut(this.db.aviso)); return this.db.aviso; },
  /* aviso a exibir agora (ativo + dentro da janela de início/fim), ou null */
  avisoAtivo() {
    const a = this.db.aviso;
    if (!a || !a.ativo || !a.texto || !a.texto.trim()) return null;
    const agora = new Date();
    if (a.inicio && agora < new Date(a.inicio)) return null;
    if (a.fim && agora > new Date(a.fim)) return null;
    return a;
  },

  /* ---------- propaganda/pop-up (arte 4:5 agendada pelo admin) ---------- */
  getCampanha() { return this.db.campanha || { id: this.CAMPANHA_ID, ativo: false, inicio: null, fim: null, diasSemana: [], horaInicio: '', horaFim: '', atualizadoEm: null }; },
  /* a campanha deve aparecer agora? (ativa + dentro do período + dia da semana + faixa de horário) */
  campanhaAtivaAgora() {
    const c = this.db.campanha;
    if (!c || !c.ativo) return false;
    const agora = new Date();
    if (c.inicio && agora < new Date(c.inicio)) return false;
    if (c.fim && agora > new Date(c.fim)) return false;
    const dias = c.diasSemana || [];
    if (dias.length && !dias.includes(agora.getDay())) return false; // getDay: 0=domingo ... 6=sábado
    if (c.horaInicio || c.horaFim) {
      const toM = (t) => { const p = (t || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
      const mins = agora.getHours() * 60 + agora.getMinutes();
      if (c.horaInicio && mins < toM(c.horaInicio)) return false;
      if (c.horaFim && mins > toM(c.horaFim)) return false;
    }
    return true;
  },
  /* busca só a imagem (base64) sob demanda — não vem no load pra não pesar */
  async getCampanhaImagem() {
    try { const { data } = await SB.from('campanhas').select('imagem').eq('id', this.CAMPANHA_ID).maybeSingle(); return (data && data.imagem) || ''; }
    catch (e) { return ''; }
  },
  /* linha completa (com imagem) para o admin editar */
  async getCampanhaFull() {
    try { const { data } = await SB.from('campanhas').select('*').eq('id', this.CAMPANHA_ID).maybeSingle(); return data ? this._campIn(data) : this.getCampanha(); }
    catch (e) { return this.getCampanha(); }
  },
  saveCampanha(c) {
    const out = this._campOut(c);
    this._save('campanhas', out);
    // mantém no cache só os metadados (sem a imagem pesada)
    this.db.campanha = { id: this.CAMPANHA_ID, ativo: !!c.ativo, inicio: c.inicio || null, fim: c.fim || null, diasSemana: Array.isArray(c.diasSemana) ? c.diasSemana : [], horaInicio: c.horaInicio || '', horaFim: c.horaFim || '', atualizadoEm: out.atualizado_em };
    return this.db.campanha;
  },

  /* ---------- treinamentos (quiz) ---------- */
  treinoProgress(id) { return this.db.treinos[id] || { melhorNota: 0, tentativas: 0, concluido: false }; },
  /* progresso de um consultor específico (para o admin) */
  treinosDoConsultor(consultorId) {
    const m = {};
    (this.db.treinosAll || []).filter(r => r.consultorId === consultorId).forEach(r => { m[r.treinoId] = r; });
    return m;
  },
  /* certificados (treinamentos concluídos) de um consultor */
  certificados(consultorId) {
    return (this.db.treinosAll || []).filter(r => r.consultorId === consultorId && r.concluido);
  },
  rankingTreinos() { return this.db.ranking || []; },

  /* ---------- ranking geral (vendas + treinamentos) ---------- */
  rankingGeral() { return this.db.rankingGeral || []; },
  meuRankingPos(id) {
    const arr = this.db.rankingGeral || [];
    const i = arr.findIndex(r => r.consultor_id === id);
    return { posicao: i >= 0 ? i + 1 : null, pontos: i >= 0 ? (arr[i].pontos || 0) : 0, total: arr.length, row: i >= 0 ? arr[i] : null };
  },
  fmtNum(n) { return Number(n || 0).toLocaleString('pt-BR'); },

  /* ---------- chat Manu (atendimento consultor ↔ admin) ---------- */
  /* conversa ATUAL do consultor (não arquivada) — usada no widget do consultor */
  chatDoConsultor(id) { return (this.db.chat || []).filter(m => m.consultorId === id && !m.arquivada).sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm)); },
  /* histórico COMPLETO (arquivadas + atual) — usado pelo admin e na exportação */
  chatHistorico(id) { return (this.db.chat || []).filter(m => m.consultorId === id).sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm)); },
  chatTemAberta(id) { return (this.db.chat || []).some(m => m.consultorId === id && !m.arquivada); },
  chatThreads() {
    const by = {};
    (this.db.chat || []).forEach(m => { (by[m.consultorId] = by[m.consultorId] || []).push(m); });
    return Object.keys(by).map(cid => {
      const msgs = by[cid].sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));
      const abertas = msgs.filter(m => !m.arquivada);
      const ultima = msgs[msgs.length - 1];
      const naoLidas = abertas.filter(m => m.autor === 'consultor' && !m.lido).length;
      const urgente = abertas.some(m => m.autor === 'consultor' && !m.lido && m.urgente);
      const c = this.userById(cid);
      return { consultorId: cid, nome: c ? ((c.nome || '') + ' ' + (c.sobrenome || '')).trim() || 'Consultor' : 'Consultor', ultima, naoLidas, urgente, aberta: abertas.length > 0, msgs };
    }).sort((a, b) => (b.aberta - a.aberta) || (b.urgente - a.urgente) || (new Date(b.ultima.criadoEm) - new Date(a.ultima.criadoEm)));
  },
  chatNaoLidasAdmin() { return (this.db.chat || []).filter(m => m.autor === 'consultor' && !m.lido && !m.arquivada).length; },
  chatUrgentesAdmin() { return (this.db.chat || []).some(m => m.autor === 'consultor' && !m.lido && !m.arquivada && m.urgente); },
  chatNaoLidasConsultor(id) { return (this.db.chat || []).filter(m => m.consultorId === id && m.autor === 'admin' && !m.lido && !m.arquivada).length; },
  async enviarMensagem({ consultorId, autor, texto, urgente }) {
    const m = { id: this.uid(), consultorId, autor: autor || 'consultor', texto: (texto || '').trim(), urgente: !!urgente, lido: false, arquivada: false, criadoEm: new Date().toISOString() };
    if (!this.db.chat) this.db.chat = [];
    this.db.chat.push(m);
    await this._save('chat_mensagens', this._msgOut(m));
    return m;
  },
  async marcarChatLido(consultorId, autorDasMsgs) {
    const alvo = (this.db.chat || []).filter(m => m.consultorId === consultorId && m.autor === autorDasMsgs && !m.lido);
    if (!alvo.length) return;
    alvo.forEach(m => m.lido = true);
    try { await SB.from('chat_mensagens').update({ lido: true }).eq('consultor_id', consultorId).eq('autor', autorDasMsgs).eq('lido', false); } catch (e) {}
  },
  /* encerra o atendimento: arquiva a conversa atual (some p/ o consultor, fica salva p/ o admin) */
  async encerrarConversa(consultorId) {
    const abertas = (this.db.chat || []).filter(m => m.consultorId === consultorId && !m.arquivada);
    if (!abertas.length) return 0;
    abertas.forEach(m => { m.arquivada = true; });
    try { await SB.from('chat_mensagens').update({ arquivada: true }).eq('consultor_id', consultorId).eq('arquivada', false); } catch (e) { this._err(e); }
    return abertas.length;
  },
  /* transcrição completa da conversa (para exportar em caso de contestação) */
  chatExportTexto(consultorId) {
    const c = this.userById(consultorId);
    const nome = c ? (((c.nome || '') + ' ' + (c.sobrenome || '')).trim() || 'Consultor') : 'Consultor';
    const msgs = this.chatHistorico(consultorId);
    const linhas = msgs.map(m => {
      const dt = new Date(m.criadoEm).toLocaleString('pt-BR');
      const quem = m.autor === 'admin' ? 'OutBox (Manu)' : nome;
      return `[${dt}] ${quem}${m.urgente ? ' [URGENTE]' : ''}: ${m.texto || ''}`;
    });
    return `Atendimento OutBox | Consultor: ${nome}\nExportado em: ${new Date().toLocaleString('pt-BR')}\nTotal de mensagens: ${msgs.length}\n${'='.repeat(48)}\n\n${linhas.join('\n')}\n`;
  },
  saveTreino(id, nota) {
    const cur = this.treinoProgress(id);
    const melhor = Math.max(cur.melhorNota, nota);
    const obj = (typeof TREINOS !== 'undefined' ? TREINOS.OBJETIVO : 70);
    const rec = { melhorNota: melhor, tentativas: cur.tentativas + 1, concluido: melhor >= obj };
    this.db.treinos[id] = rec;
    const uid = this.db.profile && this.db.profile.id;
    if (uid) this._save('training_progress', { consultor_id: uid, treino_id: id, melhor_nota: melhor, tentativas: rec.tentativas, concluido: rec.concluido, atualizado_em: new Date().toISOString() });
    return rec;
  },

  /* ---------- leads (funil / Kanban) ---------- */
  leads() { return this.db.leads; },
  leadsOf(consultorId) { return this.db.leads.filter(l => l.consultorId === consultorId); },
  upsertLead(l) {
    const i = this.db.leads.findIndex(x => x.id === l.id);
    if (i >= 0) this.db.leads[i] = l; else this.db.leads.push(l);
    this._save('leads', this._lOut(l));
    return l;
  },
  removeLead(id) { this.db.leads = this.db.leads.filter(l => l.id !== id); this._delete('leads', id); },

  /* ---------- solicitações ---------- */
  requests() { return this.db.requests; },
  requestsOf(consultorId) { return this.db.requests.filter(r => r.consultorId === consultorId); },
  addRequest(r) { this.db.requests.unshift(r); this._save('requests', this._rOut(r)); return r; },
  updateRequest(r) { const i = this.db.requests.findIndex(x => x.id === r.id); if (i >= 0) this.db.requests[i] = r; this._save('requests', this._rOut(r)); return r; },
  removeRequest(id) { this.db.requests = this.db.requests.filter(r => r.id !== id); this._delete('requests', id); },

  /* ============================================================
     REGRAS DE NEGÓCIO (idênticas — só leem do cache agora)
     ============================================================ */
  isSameMonth(dateStr) { const d = new Date(dateStr), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); },
  isSameQuarter(dateStr) { const d = new Date(dateStr), n = new Date(); return d.getFullYear() === n.getFullYear() && Math.floor(d.getMonth() / 3) === Math.floor(n.getMonth() / 3); },

  nivelPorVolume(vol) { for (const n of this.NIVEIS) if (vol >= n.meta) return n; return this.NIVEIS[this.NIVEIS.length - 1]; },
  proximoNivel(vol) { const ord = [...this.NIVEIS].sort((a, b) => a.meta - b.meta); for (const n of ord) if (n.meta > vol) return n; return null; },

  /* comissão e prêmios contam SÓ propostas APROVADAS (sem inflar valor a receber) */
  volumeMes(consultorId) { return this.salesOf(consultorId).filter(s => s.statusProposta === 'aprovada' && this.isSameMonth(s.data)).reduce((t, s) => t + s.valor, 0); },
  volumeTrimestre(consultorId) { return this.salesOf(consultorId).filter(s => s.statusProposta === 'aprovada' && this.isSameQuarter(s.data)).reduce((t, s) => t + s.valor, 0); },

  /* comissão apurada sobre um conjunto de vendas: agrupa por MÊS e aplica a progressão
     marginal de cada mês (a faixa é mensal), depois soma. Base de todo o cálculo abaixo. */
  comissaoDeVendas(vendas) {
    const porMes = {};
    (vendas || []).forEach(s => {
      const d = new Date(s.data);
      const k = d.getFullYear() + '-' + d.getMonth();
      porMes[k] = (porMes[k] || 0) + s.valor;
    });
    return Object.keys(porMes).reduce((t, k) => t + Math.round(this.comissaoMarginal(porMes[k])), 0);
  },

  comissaoResumo(consultorId) {
    const todas = this.salesOf(consultorId).filter(s => s.statusProposta === 'aprovada');
    const pagas = todas.filter(s => s.statusPagamento === 'recebido'); // pagamento confirmado pelo admin
    // NÍVEL e TAXA continuam sendo do MÊS (a faixa é performance mensal)
    const month = todas.filter(s => this.isSameMonth(s.data));
    const volume = month.reduce((t, s) => t + s.valor, 0);
    const nivel = this.nivelPorVolume(volume);
    const rate = this.taxaMarginal(volume);
    // SALDO é ACUMULADO (não zera na virada do mês). Cada venda tem seu próprio status
    // (disponivel → solicitada → paga), então o saldo desconta sozinho quando entra num saque.
    const volumeRecebido = pagas.reduce((t, s) => t + s.valor, 0);
    const vendasDisp = pagas.filter(s => s.statusComissao === 'disponivel');
    // compras na loja pagas com comissão saem do saldo (o pedido é o próprio lançamento do débito)
    const debitoLoja = this.comissaoDebitadaLoja(consultorId);
    const disponivel = Math.max(0, this.comissaoDeVendas(vendasDisp) - debitoLoja);         // pode sacar agora
    const emConferencia = this.comissaoDeVendas(todas.filter(s => s.statusPagamento !== 'recebido')); // cliente ainda não pagou
    const emAnalise = this.comissaoDeVendas(pagas.filter(s => s.statusComissao === 'solicitada'));    // saque pedido, admin analisando
    const jaPago = this.comissaoDeVendas(pagas.filter(s => s.statusComissao === 'paga'));            // já repassado
    const totalDevido = this.comissaoDeVendas(todas);
    const comissaoRecebivel = this.comissaoDeVendas(pagas);
    const reqs = this.requestsOf(consultorId).filter(r => r.tipo === 'comissao' && r.status !== 'recusado');
    const efetiva = volume > 0 ? Math.round(this.comissaoMarginal(volume)) / volume : rate; // taxa efetiva do mês
    const bloqueados = this.NIVEIS.filter(n => n.meta > volume).sort((a, b) => a.meta - b.meta).map(n => ({
      nivel: n, faltaVolume: n.meta - volume, extraPct: Math.round((n.rate - rate) * 100),
      ganhoSobreAtual: 0
    }));
    return { volume, volumeRecebido, nivel, rate, efetiva, totalDevido, comissaoRecebivel, emConferencia, jaPago, emAnalise, disponivel, debitoLoja, bloqueados, vendasDisp, reqs };
  },
  comissaoDisponivel(consultorId) { const r = this.comissaoResumo(consultorId); return { valor: r.disponivel, base: r.volume, rate: r.rate, vendas: r.vendasDisp, resumo: r }; },

  /* ---------- LOJA DA OUTBOX (produtos para os consultores) ----------
     Cada produto tem até 5 fotos 4:5 e uma grade de variações (cor × tamanho × gênero),
     cada uma com o seu estoque. O frete é calculado por faixa de CEP + peso. */
  LOJA_TAMANHOS: ['P', 'M', 'G', 'GG'],
  LOJA_GENEROS: [
    { id: 'masculino', nome: 'Masculino' },
    { id: 'feminino', nome: 'Feminino' },
    { id: 'unissex', nome: 'Unissex' }
  ],
  LOJA_TIPOS: [
    { id: 'camiseta', nome: 'Camiseta' },
    { id: 'camisa', nome: 'Camisa polo' },
    { id: 'moletom', nome: 'Moletom' },
    { id: 'bone', nome: 'Boné' },
    { id: 'caneca', nome: 'Caneca' },
    { id: 'brinde', nome: 'Brinde' },
    { id: 'outro', nome: 'Outro' }
  ],
  LOJA_MAX_FOTOS: 5,
  LOJA_STATUS: [
    { id: 'novo', nome: 'Novo', cor: 'warn' },
    { id: 'aguardando', nome: 'Aguardando pagamento', cor: 'warn' },
    { id: 'pago', nome: 'Pagamento confirmado', cor: 'green' },
    { id: 'separacao', nome: 'Em separação', cor: 'gray' },
    { id: 'enviado', nome: 'Enviado', cor: 'green' },
    { id: 'entregue', nome: 'Entregue', cor: 'green' },
    { id: 'cancelado', nome: 'Cancelado', cor: 'gray' }
  ],
  lojaStatusNome(id) { const s = this.LOJA_STATUS.find(x => x.id === id); return s ? s.nome : (id || 'Novo'); },
  lojaTipoNome(id) { const t = this.LOJA_TIPOS.find(x => x.id === id); return t ? t.nome : (id || 'Produto'); },
  lojaGeneroNome(id) { const g = this.LOJA_GENEROS.find(x => x.id === id); return g ? g.nome : (id || ''); },

  /* --- frete: faixa por região do CEP + adicional por peso --- */
  LOJA_FRETE: [
    { uf: 'SP', ini: 1000000, fim: 19999999, base: 18, kg: 4, prazo: '2 a 4 dias úteis' },
    { uf: 'RJ/ES/MG', ini: 20000000, fim: 39999999, base: 24, kg: 5, prazo: '3 a 6 dias úteis' },
    { uf: 'Sul', ini: 80000000, fim: 99999999, base: 26, kg: 5, prazo: '4 a 7 dias úteis' },
    { uf: 'Centro-Oeste', ini: 70000000, fim: 79999999, base: 30, kg: 6, prazo: '5 a 9 dias úteis' },
    { uf: 'Nordeste', ini: 40000000, fim: 65999999, base: 34, kg: 7, prazo: '6 a 12 dias úteis' },
    { uf: 'Norte', ini: 66000000, fim: 69999999, base: 42, kg: 9, prazo: '8 a 15 dias úteis' }
  ],
  LOJA_FRETE_GRATIS: 400, // acima disso o frete é por nossa conta
  /* calcula o frete pelo CEP e pelo peso total (g). Devolve valor, prazo e região. */
  calcFrete(cep, pesoTotalG, subtotal) {
    const d = String(cep || '').replace(/\D/g, '');
    if (d.length !== 8) return { ok: false, erro: 'CEP incompleto', valor: 0, prazo: '', regiao: '' };
    const n = parseInt(d, 10);
    const faixa = this.LOJA_FRETE.find(f => n >= f.ini && n <= f.fim) || this.LOJA_FRETE[this.LOJA_FRETE.length - 1];
    const kg = Math.max(1, Math.ceil((pesoTotalG || 300) / 1000));
    let valor = faixa.base + (kg - 1) * faixa.kg;
    const gratis = (subtotal || 0) >= this.LOJA_FRETE_GRATIS;
    if (gratis) valor = 0;
    return { ok: true, valor: Math.round(valor), prazo: faixa.prazo, regiao: faixa.uf, gratis, peso: kg };
  },

  _lcIn(r) { return { id: r.id, nome: r.nome, slug: r.slug, ordem: r.ordem || 0, ativo: r.ativo !== false, criadoEm: r.criado_em }; },
  _lcOut(c) { return { id: c.id, nome: c.nome, slug: c.slug, ordem: c.ordem || 0, ativo: c.ativo !== false }; },
  _lpIn(r) {
    let fotos = []; try { fotos = typeof r.fotos === 'string' ? JSON.parse(r.fotos) : (r.fotos || []); } catch (e) { fotos = []; }
    let vars = []; try { vars = typeof r.variacoes === 'string' ? JSON.parse(r.variacoes) : (r.variacoes || []); } catch (e) { vars = []; }
    return { id: r.id, titulo: r.titulo, descricao: r.descricao || '', categoriaId: r.categoria_id || null,
      tipo: r.tipo || 'camiseta', preco: Number(r.preco) || 0, precoPromo: r.preco_promo != null ? Number(r.preco_promo) : null,
      pesoG: r.peso_g != null ? Number(r.peso_g) : 300, fotos: Array.isArray(fotos) ? fotos : [],
      generos: r.generos || ['unissex'], variacoes: Array.isArray(vars) ? vars : [],
      destaque: !!r.destaque, ativo: r.ativo !== false, ordem: r.ordem || 0, criadoEm: r.criado_em };
  },
  _lpOut(p) { return { id: p.id, titulo: p.titulo, descricao: p.descricao || null, categoria_id: p.categoriaId || null,
    tipo: p.tipo || 'camiseta', preco: p.preco || 0, preco_promo: p.precoPromo != null ? p.precoPromo : null,
    peso_g: p.pesoG != null ? p.pesoG : 300, fotos: p.fotos || [], generos: p.generos || ['unissex'],
    variacoes: p.variacoes || [], destaque: !!p.destaque, ativo: p.ativo !== false, ordem: p.ordem || 0,
    atualizado_em: new Date().toISOString() }; },
  _loIn(r) {
    let itens = []; try { itens = typeof r.itens === 'string' ? JSON.parse(r.itens) : (r.itens || []); } catch (e) { itens = []; }
    return { id: r.id, numero: r.numero, consultorId: r.consultor_id, consultorNome: r.consultor_nome || '',
      itens: Array.isArray(itens) ? itens : [], subtotal: Number(r.subtotal) || 0, frete: Number(r.frete) || 0,
      total: Number(r.total) || 0, cep: r.cep || '', endereco: r.endereco || '', formaPagamento: r.forma_pagamento || '',
      status: r.status || 'novo', obs: r.obs || '', criadoEm: r.criado_em,
      pagamentoStatus: r.pagamento_status || 'pendente', cobrancaRef: r.cobranca_ref || '',
      comissaoDebitada: Number(r.comissao_debitada) || 0, pagoEm: r.pago_em || null };
  },
  _loOut(p) { return { id: p.id, numero: p.numero, consultor_id: p.consultorId, consultor_nome: p.consultorNome || null,
    itens: p.itens || [], subtotal: p.subtotal || 0, frete: p.frete || 0, total: p.total || 0,
    cep: p.cep || null, endereco: p.endereco || null, forma_pagamento: p.formaPagamento || null,
    status: p.status || 'novo', obs: p.obs || null,
    pagamento_status: p.pagamentoStatus || 'pendente', cobranca_ref: p.cobrancaRef || null,
    comissao_debitada: p.comissaoDebitada || 0, pago_em: p.pagoEm || null,
    atualizado_em: new Date().toISOString() }; },

  lojaCategorias() { return (this.db.lojaCategorias || []).slice().sort((a, b) => a.ordem - b.ordem); },
  lojaCategoriaById(id) { return this.lojaCategorias().find(c => c.id === id) || null; },
  lojaProdutos() { return (this.db.lojaProdutos || []).slice().sort((a, b) => (a.ordem - b.ordem) || a.titulo.localeCompare(b.titulo)); },
  lojaProdutosAtivos() { return this.lojaProdutos().filter(p => p.ativo); },
  lojaProdutoById(id) { return (this.db.lojaProdutos || []).find(p => p.id === id) || null; },
  lojaPedidos() { return (this.db.lojaPedidos || []).slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)); },
  /* total já descontado da comissão em compras da loja (pedidos cancelados não contam) */
  comissaoDebitadaLoja(consultorId) {
    return (this.db.lojaPedidos || [])
      .filter(p => p.consultorId === consultorId && p.formaPagamento === 'comissao' && p.status !== 'cancelado')
      .reduce((t, p) => t + (Number(p.comissaoDebitada) || Number(p.total) || 0), 0);
  },
  /* saldo de comissão que pode ser usado na loja.
     ATENÇÃO: aqui NÃO vale o mínimo de saque (R$500) — comprar na loja é um abatimento
     interno, então o consultor pode usar o que tiver, mesmo abaixo do mínimo. */
  saldoComissaoLoja(consultorId) { return this.comissaoResumo(consultorId).disponivel; },
  lojaPedidosDe(consultorId) { return this.lojaPedidos().filter(p => p.consultorId === consultorId); },
  /* estoque de uma variação específica */
  lojaEstoque(prod, cor, tam, genero) {
    const v = (prod.variacoes || []).find(x => x.cor === cor && x.tam === tam && (!genero || x.genero === genero));
    return v ? (Number(v.qtd) || 0) : 0;
  },
  lojaEstoqueTotal(prod) { return (prod.variacoes || []).reduce((t, v) => t + (Number(v.qtd) || 0), 0); },
  lojaCores(prod) { const s = []; (prod.variacoes || []).forEach(v => { if (v.cor && s.indexOf(v.cor) < 0) s.push(v.cor); }); return s; },
  lojaPreco(prod) { return (prod.precoPromo != null && prod.precoPromo > 0 && prod.precoPromo < prod.preco) ? prod.precoPromo : prod.preco; },

  saveLojaCategoria(c) {
    const i = (this.db.lojaCategorias || []).findIndex(x => x.id === c.id);
    if (i >= 0) this.db.lojaCategorias[i] = c; else this.db.lojaCategorias.push(c);
    this._save('loja_categorias', this._lcOut(c)); return c;
  },
  removeLojaCategoria(id) { this.db.lojaCategorias = (this.db.lojaCategorias || []).filter(c => c.id !== id); this._delete('loja_categorias', id); },
  saveLojaProduto(p) {
    const i = (this.db.lojaProdutos || []).findIndex(x => x.id === p.id);
    if (i >= 0) this.db.lojaProdutos[i] = p; else this.db.lojaProdutos.push(p);
    this._save('loja_produtos', this._lpOut(p)); return p;
  },
  removeLojaProduto(id) { this.db.lojaProdutos = (this.db.lojaProdutos || []).filter(p => p.id !== id); this._delete('loja_produtos', id); },
  saveLojaPedido(p) {
    const i = (this.db.lojaPedidos || []).findIndex(x => x.id === p.id);
    if (i >= 0) this.db.lojaPedidos[i] = p; else this.db.lojaPedidos.unshift(p);
    this._save('loja_pedidos', this._loOut(p)); return p;
  },
  gerarNumeroPedido() {
    const ano = new Date().getFullYear();
    const n = (this.db.lojaPedidos || []).length + 1;
    return 'LJ-' + ano + '-' + String(n).padStart(4, '0');
  },
  /* baixa o estoque das variações compradas (chamado ao fechar o pedido) */
  lojaBaixarEstoque(itens) {
    (itens || []).forEach(it => {
      const p = this.lojaProdutoById(it.produtoId); if (!p) return;
      const v = (p.variacoes || []).find(x => x.cor === it.cor && x.tam === it.tam && x.genero === it.genero);
      if (v) { v.qtd = Math.max(0, (Number(v.qtd) || 0) - (it.qtd || 1)); this.saveLojaProduto(p); }
    });
  },

  /* ---------- EQUIPE INTERNA (colaboradores da OutBox) ----------
     Cada cargo tem um NÍVEL de hierarquia (1 = mais alto) e as SEÇÕES do admin que enxerga.
     `secoes: '*'` libera tudo. O cargo fica no perfil (equipe_cargo) e filtra o menu. */
  CARGOS: [
    { id: 'admin_geral', nome: 'Administrador Geral', nivel: 1, cor: '#0A0A0A',
      desc: 'Acesso total ao sistema, inclusive gestão da equipe.', secoes: '*' },
    { id: 'gerente', nome: 'Gerente', nivel: 2, cor: '#2563EB',
      desc: 'Acompanha toda a operação e a rede de consultores.',
      secoes: ['painel','consultores','vendas','financeiro','bonus','contratos','projetos','briefings','timeline','atendimento','produtos','portfolio','criativos','campanha','avisos','treinamentos','mapa','ranking'] },
    { id: 'supervisor', nome: 'Supervisor', nivel: 3, cor: '#7c3aed',
      desc: 'Cuida da rede de consultores e do acompanhamento das entregas.',
      secoes: ['painel','consultores','vendas','projetos','briefings','timeline','atendimento','produtos','portfolio','avisos','treinamentos','mapa','ranking'] },
    { id: 'financeiro', nome: 'Financeiro', nivel: 3, cor: '#15803d',
      desc: 'Comissões, pagamentos, contratos e autorização de bônus.',
      secoes: ['painel','financeiro','vendas','bonus','contratos','consultores','produtos','portfolio'] },
    { id: 'producao', nome: 'Produção', nivel: 4, cor: '#d97706',
      desc: 'Executa os projetos: briefings, linha do tempo e entregas.',
      secoes: ['painel','projetos','briefings','timeline','criativos','produtos','portfolio'] },
    { id: 'marketing', nome: 'Marketing', nivel: 4, cor: '#db2777',
      desc: 'Criativos, campanhas, avisos e conteúdo de treinamento.',
      secoes: ['painel','criativos','campanha','avisos','treinamentos','ranking','produtos','portfolio'] },
    { id: 'suporte', nome: 'Suporte', nivel: 5, cor: '#0891b2',
      desc: 'Atende os consultores no chat e acompanha o básico da operação.',
      secoes: ['painel','atendimento','consultores','avisos','produtos','portfolio'] }
  ],
  cargoById(id) { return this.CARGOS.find(c => c.id === id) || null; },
  cargoNome(id) { const c = this.cargoById(id); return c ? c.nome : (id || 'Sem cargo'); },
  /* seções que o usuário logado pode ver no admin (dono/admin sem cargo vê tudo) */
  secoesPermitidas() {
    const u = this.db.profile;
    if (!u || u.role !== 'admin') return '*';
    const c = this.cargoById(u.equipeCargo);
    if (!c || c.secoes === '*') return '*';
    return c.secoes;
  },
  podeVer(secao) {
    const s = this.secoesPermitidas();
    return s === '*' || s.indexOf(secao) >= 0;
  },
  /* só o topo da hierarquia mexe na equipe */
  podeGerirEquipe() {
    const u = this.db.profile;
    if (!u || u.role !== 'admin') return false;
    const c = this.cargoById(u.equipeCargo);
    return !c || c.nivel <= 1; // sem cargo = dono do sistema
  },

  _eqIn(r) { return { id: r.id, userId: r.user_id || null, nome: r.nome || '', sobrenome: r.sobrenome || '', email: r.email || '', doc: r.doc || '', celular: r.celular || '', nascimento: r.nascimento || null, cargo: r.cargo || 'suporte', nivel: r.nivel != null ? Number(r.nivel) : 3, foto: r.foto || '', cep: r.cep || '', logradouro: r.logradouro || '', numero: r.numero || '', complemento: r.complemento || '', bairro: r.bairro || '', cidade: r.cidade || '', uf: r.uf || '', obs: r.obs || '', ativo: r.ativo !== false, criadoEm: r.criado_em || null, vinculadoEm: r.vinculado_em || null }; },
  _eqOut(m) { return { id: m.id, user_id: m.userId || null, nome: m.nome || null, sobrenome: m.sobrenome || null, email: (m.email || '').toLowerCase(), doc: m.doc || null, celular: m.celular || null, nascimento: m.nascimento || null, cargo: m.cargo || 'suporte', nivel: m.nivel != null ? m.nivel : 3, foto: m.foto || null, cep: m.cep || null, logradouro: m.logradouro || null, numero: m.numero || null, complemento: m.complemento || null, bairro: m.bairro || null, cidade: m.cidade || null, uf: m.uf || null, obs: m.obs || null, ativo: m.ativo !== false }; },

  equipe() { return this.db.equipe || []; },
  membroById(id) { return this.equipe().find(m => m.id === id) || null; },
  saveMembro(m) {
    const i = this.db.equipe.findIndex(x => x.id === m.id);
    if (i >= 0) this.db.equipe[i] = m; else this.db.equipe.push(m);
    this._save('equipe', this._eqOut(m));
    return m;
  },
  removeMembro(id) {
    this.db.equipe = this.db.equipe.filter(m => m.id !== id);
    this._delete('equipe', id);
  },
  /* chamado no login: se o e-mail está cadastrado na equipe, promove e aplica o cargo */
  async vincularEquipe() {
    try {
      const { data, error } = await SB.rpc('vincular_equipe');
      if (error || !data || !data.ok) return null;
      const u = this.db.profile;
      if (u) { u.role = 'admin'; u.equipeCargo = data.cargo; u.equipeNivel = data.nivel; }
      return data;
    } catch (e) { return null; }
  },

  /* ---------- GRUPO DE CONSULTORES NO WHATSAPP ----------
     Entrar no grupo é obrigatório: é por lá que saem novidades, networking e sugestões.
     O portão aparece uma vez, logo depois do aceite dos termos. */
  /* Só os consultores NOVOS passam pelo portão. Quem já estava no sistema antes do
     lançamento da regra não é incomodado (presume-se que já está no grupo). */
  GRUPO_REGRA_DESDE: '2026-07-20T00:00:00Z',
  precisaEntrarGrupo() {
    const u = this.db.profile;
    if (!u || u.role === 'admin' || u.whatsGrupoEm) return false;
    if (!u.criadoEm) return false;                       // cadastro antigo sem data: não incomoda
    return new Date(u.criadoEm) >= new Date(this.GRUPO_REGRA_DESDE);
  },
  confirmarGrupoWhats() {
    const u = this.db.profile;
    if (!u || u.whatsGrupoEm) return u;
    u.whatsGrupoEm = new Date().toISOString();
    this.upsertUser(u);
    return u;
  },

  /* saldo sacável = comissão liberada */
  saldoSacavel(consultorId) {
    const com = this.comissaoDisponivel(consultorId);
    return { comissao: com.valor, total: com.valor, podeSacar: com.valor >= this.saqueMinimo(), com };
  },

  premioAlcancado(consultorId) { const vol = this.volumeTrimestre(consultorId); let alc = null; for (const p of this.PREMIOS) if (vol >= p.meta) alc = p; return alc; },
  proximoPremio(consultorId) { const vol = this.volumeTrimestre(consultorId); for (const p of this.PREMIOS) if (vol < p.meta) return p; return null; },

  brl(v) { return this.money(v, 'BRL'); },
  dataBR(d) { return new Date(d).toLocaleDateString('pt-BR'); }
};
