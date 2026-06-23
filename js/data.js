/* ============================================================
   OutBox Consultores — Camada de dados (data.js)
   Protótipo front-end: persistência via localStorage.
   ============================================================ */
const OB = {
  /* ---------- chaves de storage ---------- */
  KEYS: {
    users: 'ob_users',
    session: 'ob_session',
    clients: 'ob_clients',
    sales: 'ob_sales',
    requests: 'ob_requests',
    theme: 'ob_theme',
    seeded: 'ob_seeded_v2'
  },

  /* ---------- catálogo de produtos (mesmos valores da apresentação) ----------
     comissão é progressiva (10% a 20%) sobre o ticket negociado.            */
  PRODUTOS: [
    { id: 'identidade',   nome: 'Identidade Visual',     ticketMin: 2500,  ticketMax: 9000 },
    { id: 'lp',           nome: 'Landing Page',          ticketMin: 1500,  ticketMax: 4500 },
    { id: 'onepage',      nome: 'Site OnePage',          ticketMin: 2500,  ticketMax: 6000 },
    { id: 'institucional',nome: 'Site Institucional',    ticketMin: 5000,  ticketMax: 15000 },
    { id: 'ecommerce',    nome: 'E-commerce',            ticketMin: 9000,  ticketMax: 30000 },
    { id: 'sistemas',     nome: 'Sistemas Sob Medida',   ticketMin: 18000, ticketMax: 120000 }
  ],

  /* ---------- escada de comissão progressiva (volume no mês) ---------- */
  NIVEIS: [
    { id: 'black',  nome: 'Black',  rate: 0.20, meta: 30000, cor: '#111111' },
    { id: 'ouro',   nome: 'Ouro',   rate: 0.16, meta: 15000, cor: '#C9A227' },
    { id: 'prata',  nome: 'Prata',  rate: 0.13, meta: 5000,  cor: '#9AA3AD' },
    { id: 'bronze', nome: 'Bronze', rate: 0.10, meta: 0,     cor: '#B07B4F' }
  ],

  /* ---------- escada de prêmios trimestrais (volume no trimestre) ---------- */
  PREMIOS: [
    { id: 'airpods', nome: 'AirPods',      meta: 30000,  valor: 1800,  img: 'assets/premios/airpods.png' },
    { id: 'beats',   nome: 'Beats',        meta: 45000,  valor: 2200,  img: 'assets/premios/beats.png' },
    { id: 'watch',   nome: 'Apple Watch',  meta: 55000,  valor: 3200,  img: 'assets/premios/watch.png' },
    { id: 'ipad',    nome: 'iPad',         meta: 70000,  valor: 4500,  img: 'assets/premios/ipad.png' },
    { id: 'iphone16',nome: 'iPhone 16',    meta: 100000, valor: 6500,  img: 'assets/premios/iphone16.png' },
    { id: 'iphone17',nome: 'iPhone 17',    meta: 125000, valor: 8500,  img: 'assets/premios/iphone17.png' },
    { id: 'macbook', nome: 'MacBook',      meta: 200000, valor: 14000, img: 'assets/premios/macbook.png' }
  ],

  LINK_APRESENTACAO: 'https://consultoroutbox.vercel.app',

  /* ============================================================
     STORAGE helpers
     ============================================================ */
  _get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  uid() { return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); },

  /* ---------- usuários ---------- */
  users() { return this._get(this.KEYS.users, []); },
  saveUsers(list) { this._set(this.KEYS.users, list); },
  userById(id) { return this.users().find(u => u.id === id) || null; },
  userByEmail(email) {
    return this.users().find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
  },
  upsertUser(user) {
    const list = this.users();
    const i = list.findIndex(u => u.id === user.id);
    if (i >= 0) list[i] = user; else list.push(user);
    this.saveUsers(list);
    return user;
  },

  /* ---------- sessão ---------- */
  session() {
    const id = this._get(this.KEYS.session, null);
    return id ? this.userById(id) : null;
  },
  setSession(id) { this._set(this.KEYS.session, id); },
  logout() { localStorage.removeItem(this.KEYS.session); },

  /* ---------- clientes ---------- */
  clients() { return this._get(this.KEYS.clients, []); },
  saveClients(l) { this._set(this.KEYS.clients, l); },
  clientsOf(consultorId) { return this.clients().filter(c => c.consultorId === consultorId); },
  clientById(id) { return this.clients().find(c => c.id === id) || null; },
  upsertClient(c) {
    const l = this.clients();
    const i = l.findIndex(x => x.id === c.id);
    if (i >= 0) l[i] = c; else l.push(c);
    this.saveClients(l);
    return c;
  },
  removeClient(id) { this.saveClients(this.clients().filter(c => c.id !== id)); },

  /* ---------- vendas ---------- */
  sales() { return this._get(this.KEYS.sales, []); },
  saveSales(l) { this._set(this.KEYS.sales, l); },
  salesOf(consultorId) { return this.sales().filter(s => s.consultorId === consultorId); },
  addSale(s) { const l = this.sales(); l.push(s); this.saveSales(l); return s; },
  updateSale(s) {
    const l = this.sales(); const i = l.findIndex(x => x.id === s.id);
    if (i >= 0) { l[i] = s; this.saveSales(l); } return s;
  },

  /* ---------- solicitações (comissão / prêmio) ---------- */
  requests() { return this._get(this.KEYS.requests, []); },
  saveRequests(l) { this._set(this.KEYS.requests, l); },
  requestsOf(consultorId) { return this.requests().filter(r => r.consultorId === consultorId); },
  addRequest(r) { const l = this.requests(); l.unshift(r); this.saveRequests(l); return r; },
  updateRequest(r) {
    const l = this.requests(); const i = l.findIndex(x => x.id === r.id);
    if (i >= 0) { l[i] = r; this.saveRequests(l); } return r;
  },

  /* ============================================================
     REGRAS DE NEGÓCIO
     ============================================================ */

  /* período atual (mês) */
  isSameMonth(dateStr) {
    const d = new Date(dateStr), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
  },
  isSameQuarter(dateStr) {
    const d = new Date(dateStr), n = new Date();
    return d.getFullYear() === n.getFullYear() &&
      Math.floor(d.getMonth() / 3) === Math.floor(n.getMonth() / 3);
  },

  /* nível de comissão pelo volume */
  nivelPorVolume(vol) {
    for (const n of this.NIVEIS) if (vol >= n.meta) return n;
    return this.NIVEIS[this.NIVEIS.length - 1];
  },
  proximoNivel(vol) {
    // retorna o próximo nível acima do atual, ou null se já é Black
    const ordenado = [...this.NIVEIS].sort((a, b) => a.meta - b.meta);
    for (const n of ordenado) if (n.meta > vol) return n;
    return null;
  },

  /* volume vendido no mês corrente */
  volumeMes(consultorId) {
    return this.salesOf(consultorId)
      .filter(s => this.isSameMonth(s.data))
      .reduce((t, s) => t + s.valor, 0);
  },
  /* volume vendido no trimestre corrente */
  volumeTrimestre(consultorId) {
    return this.salesOf(consultorId)
      .filter(s => this.isSameQuarter(s.data))
      .reduce((t, s) => t + s.valor, 0);
  },

  /* ============================================================
     REGRA DE COMISSÃO PROGRESSIVA (10% -> 20%) — à prova de falhas
     ------------------------------------------------------------
     A taxa do mês depende do VOLUME vendido no mês:
       Bronze 10% (>= R$0) · Prata 13% (>= R$5k) · Ouro 16% (>= R$15k) · Black 20% (>= R$30k)
     Comissão TOTAL devida no mês = volume do mês x taxa do nível.
     O que já foi solicitado/pago é descontado, então NUNCA se paga
     além de (volume x taxa atingida). O valor é sempre >= 0 (monotônico,
     pois o volume só cresce ao longo do mês). Sem dupla contagem.
     ============================================================ */
  comissaoResumo(consultorId) {
    const month = this.salesOf(consultorId).filter(s => this.isSameMonth(s.data));
    const volume = month.reduce((t, s) => t + s.valor, 0);
    const nivel = this.nivelPorVolume(volume);
    const rate = nivel.rate;
    const totalDevido = Math.round(volume * rate);

    // solicitações de comissão do mês que não foram recusadas
    const reqs = this.requestsOf(consultorId)
      .filter(r => r.tipo === 'comissao' && r.status !== 'recusado' && this.isSameMonth(r.criadoEm));
    const jaPago = reqs.filter(r => r.status === 'pago').reduce((t, r) => t + r.valor, 0);
    const emAnalise = reqs.filter(r => r.status !== 'pago').reduce((t, r) => t + r.valor, 0);

    // disponível para solicitar agora = devido - (em análise + já pago), nunca negativo
    const disponivel = Math.max(0, totalDevido - jaPago - emAnalise);

    // níveis acima do atual = comissão extra "bloqueada" até bater a meta
    const bloqueados = this.NIVEIS
      .filter(n => n.meta > volume)
      .sort((a, b) => a.meta - b.meta)
      .map(n => ({
        nivel: n,
        faltaVolume: n.meta - volume,
        extraPct: Math.round((n.rate - rate) * 100),
        // ganho adicional imediato sobre o volume atual se já estivesse nesse nível
        ganhoSobreAtual: Math.max(0, Math.round(volume * n.rate) - totalDevido)
      }));

    const vendasDisp = month.filter(s => s.statusComissao === 'disponivel');
    return { volume, nivel, rate, totalDevido, jaPago, emAnalise, disponivel, bloqueados, vendasDisp, reqs };
  },

  /* compatível com o restante do app: { valor, base, rate, vendas } + resumo completo */
  comissaoDisponivel(consultorId) {
    const r = this.comissaoResumo(consultorId);
    return { valor: r.disponivel, base: r.volume, rate: r.rate, vendas: r.vendasDisp, resumo: r };
  },

  /* prêmio do degrau mais alto alcançado no trimestre */
  premioAlcancado(consultorId) {
    const vol = this.volumeTrimestre(consultorId);
    let alc = null;
    for (const p of this.PREMIOS) if (vol >= p.meta) alc = p;
    return alc;
  },
  proximoPremio(consultorId) {
    const vol = this.volumeTrimestre(consultorId);
    for (const p of this.PREMIOS) if (vol < p.meta) return p;
    return null;
  },

  /* formatações */
  brl(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },
  dataBR(d) { return new Date(d).toLocaleDateString('pt-BR'); },

  /* ============================================================
     SEED — dados de demonstração
     ============================================================ */
  seed() {
    if (this._get(this.KEYS.seeded, false)) return;

    const admin = {
      id: this.uid(), role: 'admin', provider: 'email',
      email: 'admin@outboxgroup.com.br', senha: 'admin123',
      nome: 'Felipe', sobrenome: 'Melo', nascimento: '1990-01-01',
      doc: '00.000.000/0001-00', celular: '(47) 9.9659-7775',
      instagram: '@outboxgroup', cep: '18900-000', logradouro: 'Centro',
      numero: '100', complemento: '', bairro: 'Centro',
      cidade: 'Santa Cruz do Rio Pardo', uf: 'SP',
      foto: '', twoFA: false, createdAt: new Date().toISOString()
    };

    const consultor = {
      id: this.uid(), role: 'consultor', provider: 'email',
      email: 'consultor@outboxgroup.com.br', senha: 'consultor123',
      nome: 'Renata', sobrenome: 'Rocha', nascimento: '1995-05-12',
      doc: '123.456.789-00', celular: '(47) 9.8888-0000',
      instagram: '@renata.outbox', cep: '01310-100',
      logradouro: 'Av. Paulista', numero: '1000', complemento: 'Sala 5',
      bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP',
      foto: '', twoFA: false, createdAt: new Date().toISOString()
    };

    this.saveUsers([admin, consultor]);

    /* clientes de exemplo (cadastro completo) */
    const c1 = { id: this.uid(), consultorId: consultor.id, nome: 'Padaria Pão Quente', contato: 'João Silva', doc: '12.345.678/0001-90', email: 'joao@paoquente.com', telefone: '(11) 90000-0001', instagram: '@paoquente', cep: '01001-000', logradouro: 'Praça da Sé', numero: '50', complemento: '', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP', tipo: 'recorrente', servico: 'institucional', obs: 'Plano anual de manutenção', criadoEm: new Date().toISOString() };
    const c2 = { id: this.uid(), consultorId: consultor.id, nome: 'Studio Bella', contato: 'Isabella Nunes', doc: '987.654.321-00', email: 'contato@studiobella.com', telefone: '(11) 90000-0002', instagram: '@studiobella', cep: '04538-132', logradouro: 'Av. Brigadeiro Faria Lima', numero: '3477', complemento: 'Conj. 12', bairro: 'Itaim Bibi', cidade: 'São Paulo', uf: 'SP', tipo: 'pontual', servico: 'lp', obs: '', criadoEm: new Date().toISOString() };
    const c3 = { id: this.uid(), consultorId: consultor.id, nome: 'TechNova', contato: 'Marcos Dias', doc: '45.678.901/0001-23', email: 'marcos@technova.io', telefone: '(11) 90000-0003', instagram: '@technova', cep: '04711-130', logradouro: 'Av. Santo Amaro', numero: '1200', complemento: '', bairro: 'Brooklin', cidade: 'São Paulo', uf: 'SP', tipo: 'recorrente', servico: 'ecommerce', obs: 'E-commerce + sistema', criadoEm: new Date().toISOString() };
    this.saveClients([c1, c2, c3]);

    /* vendas de exemplo (no mês/trimestre atual) */
    const hoje = new Date().toISOString();
    const mk = (cli, prod, valor, status) => ({
      id: this.uid(), consultorId: consultor.id, clientId: cli,
      produto: prod, valor, data: hoje, statusComissao: status
    });
    this.saveSales([
      mk(c1.id, 'institucional', 8000, 'disponivel'),
      mk(c2.id, 'lp', 3500, 'disponivel'),
      mk(c3.id, 'ecommerce', 14000, 'disponivel'),
      mk(c1.id, 'identidade', 4500, 'disponivel')
    ]);

    this.saveRequests([]);
    this._set(this.KEYS.seeded, true);
  }
};

OB.seed();
