/* ============================================================
   OutBox Consultores — Camada de dados (data.js)
   Fase 2: persistência no Supabase (PostgreSQL + RLS).
   Estratégia: cache em memória (OB.db) hidratado do Supabase em
   loadAll(); leituras são síncronas a partir do cache; escritas
   atualizam o cache na hora e persistem no Supabase em segundo plano.
   ============================================================ */
const OB = {
  KEYS: { theme: 'ob_theme' },

  /* ---------- catálogo de produtos ---------- */
  PRODUTOS: [
    { id: 'identidade',   nome: 'Identidade Visual',     ticketMin: 2500,  ticketMax: 9000 },
    { id: 'lp',           nome: 'Landing Page',          ticketMin: 1500,  ticketMax: 4500 },
    { id: 'onepage',      nome: 'Site OnePage',          ticketMin: 2500,  ticketMax: 6000 },
    { id: 'institucional',nome: 'Site Institucional',    ticketMin: 5000,  ticketMax: 15000 },
    { id: 'ecommerce',    nome: 'E-commerce',            ticketMin: 9000,  ticketMax: 30000 },
    { id: 'sistemas',     nome: 'Sistemas Sob Medida',   ticketMin: 18000, ticketMax: 120000 }
  ],

  /* ---------- escada de comissão progressiva ---------- */
  NIVEIS: [
    { id: 'black',  nome: 'Black',  rate: 0.20, meta: 30000, cor: '#111111' },
    { id: 'ouro',   nome: 'Ouro',   rate: 0.16, meta: 15000, cor: '#C9A227' },
    { id: 'prata',  nome: 'Prata',  rate: 0.13, meta: 5000,  cor: '#9AA3AD' },
    { id: 'bronze', nome: 'Bronze', rate: 0.10, meta: 0,     cor: '#B07B4F' }
  ],

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

  LINK_APRESENTACAO: 'https://consultoroutbox.vercel.app',

  /* ---------- estágios do funil (Kanban) ---------- */
  ESTAGIOS: [
    { id: 'frio',     nome: 'Frio',              cor: '#64748b', emoji: '🧊' },
    { id: 'morno',    nome: 'Morno',             cor: '#d97706', emoji: '🌤️' },
    { id: 'quente',   nome: 'Quente',            cor: '#dc2626', emoji: '🔥' },
    { id: 'reuniao',  nome: 'Reunião marcada',   cor: '#2563eb', emoji: '📅' },
    { id: 'aberto',   nome: 'Proposta em aberto',cor: '#7c3aed', emoji: '📤' },
    { id: 'ganho',    nome: 'Ganho',             cor: '#16a34a', emoji: '✅' },
    { id: 'perdido',  nome: 'Perdido',           cor: '#94a3b8', emoji: '🚫' }
  ],

  /* ---------- status da proposta (venda) ---------- */
  STATUS_PROPOSTA: {
    aguardando: { nome: 'Aguardando aceite', chip: 'warn' },
    aprovada:   { nome: 'Aprovada',          chip: 'green' },
    recusada:   { nome: 'Recusada',          chip: 'gray' }
  },

  /* ---------- cache em memória ---------- */
  db: { profile: null, profiles: [], clients: [], sales: [], requests: [], leads: [] },

  /* ---------- theme (único uso de localStorage) ---------- */
  _get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  uid() { return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36); },

  /* ============================================================
     MAPPERS  (camelCase no app  <->  snake_case no banco)
     ============================================================ */
  _pIn(r)  { return r && { id: r.id, role: r.role, email: r.email, nome: r.nome, sobrenome: r.sobrenome, nascimento: r.nascimento, doc: r.doc, celular: r.celular, instagram: r.instagram, cep: r.cep, logradouro: r.logradouro, numero: r.numero, complemento: r.complemento, bairro: r.bairro, cidade: r.cidade, uf: r.uf, foto: r.foto, twoFA: r.two_fa, provider: r.provider }; },
  _pOut(u) { return { id: u.id, role: u.role, email: u.email, nome: u.nome, sobrenome: u.sobrenome, nascimento: u.nascimento || null, doc: u.doc, celular: u.celular, instagram: u.instagram, cep: u.cep, logradouro: u.logradouro, numero: u.numero, complemento: u.complemento, bairro: u.bairro, cidade: u.cidade, uf: u.uf, foto: u.foto, two_fa: !!u.twoFA, provider: u.provider }; },

  _cIn(r)  { return { id: r.id, consultorId: r.consultor_id, nome: r.nome, contato: r.contato, doc: r.doc, telefone: r.telefone, instagram: r.instagram, email: r.email, cep: r.cep, logradouro: r.logradouro, numero: r.numero, complemento: r.complemento, bairro: r.bairro, cidade: r.cidade, uf: r.uf, tipo: r.tipo, servico: r.servico, obs: r.obs, criadoEm: r.criado_em }; },
  _cOut(c) { return { id: c.id, consultor_id: c.consultorId, nome: c.nome, contato: c.contato, doc: c.doc, telefone: c.telefone, instagram: c.instagram, email: c.email, cep: c.cep, logradouro: c.logradouro, numero: c.numero, complemento: c.complemento, bairro: c.bairro, cidade: c.cidade, uf: c.uf, tipo: c.tipo, servico: c.servico, obs: c.obs, criado_em: c.criadoEm }; },

  _sIn(r)  { return { id: r.id, consultorId: r.consultor_id, clientId: r.client_id, produto: r.produto, valor: Number(r.valor), data: r.data, statusComissao: r.status_comissao, statusProposta: r.status_proposta || 'aprovada', valorBruto: r.valor_bruto != null ? Number(r.valor_bruto) : Number(r.valor), descontoTipo: r.desconto_tipo, descontoValor: Number(r.desconto_valor || 0) }; },
  _sOut(s) { return { id: s.id, consultor_id: s.consultorId, client_id: s.clientId, produto: s.produto, valor: s.valor, data: s.data, status_comissao: s.statusComissao, status_proposta: s.statusProposta || 'aprovada', valor_bruto: s.valorBruto != null ? s.valorBruto : s.valor, desconto_tipo: s.descontoTipo || null, desconto_valor: s.descontoValor || 0 }; },

  _lIn(r)  { return { id: r.id, consultorId: r.consultor_id, nome: r.nome, telefone: r.telefone, email: r.email, estagio: r.estagio, valorEstimado: Number(r.valor_estimado || 0), obs: r.obs, ordem: r.ordem, criadoEm: r.criado_em }; },
  _lOut(l) { return { id: l.id, consultor_id: l.consultorId, nome: l.nome, telefone: l.telefone, email: l.email, estagio: l.estagio, valor_estimado: l.valorEstimado || 0, obs: l.obs, ordem: l.ordem || 0, criado_em: l.criadoEm }; },

  _rIn(r)  { return { id: r.id, tipo: r.tipo, modo: r.modo, premioId: r.premio_id, premioNome: r.premio_nome, consultorId: r.consultor_id, consultorNome: r.consultor_nome, valor: Number(r.valor), detalhe: r.detalhe, pix: r.pix, status: r.status, criadoEm: r.criado_em, vendaIds: r.venda_ids, pagoEm: r.pago_em, comprovante: r.comprovante }; },
  _rOut(r) { return { id: r.id, tipo: r.tipo, modo: r.modo, premio_id: r.premioId, premio_nome: r.premioNome, consultor_id: r.consultorId, consultor_nome: r.consultorNome, valor: r.valor, detalhe: r.detalhe, pix: r.pix, status: r.status, criado_em: r.criadoEm, venda_ids: r.vendaIds || null, pago_em: r.pagoEm || null, comprovante: r.comprovante || null }; },

  /* ============================================================
     CARGA  (hidrata o cache do Supabase) — RLS já filtra o escopo
     ============================================================ */
  async loadAll() {
    const { data: { user } } = await SB.auth.getUser();
    if (!user) { this.db = { profile: null, profiles: [], clients: [], sales: [], requests: [] }; return; }
    const [prof, profs, cli, sal, req, lds] = await Promise.all([
      SB.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      SB.from('profiles').select('*'),
      SB.from('clients').select('*'),
      SB.from('sales').select('*'),
      SB.from('requests').select('*'),
      SB.from('leads').select('*')
    ]);
    let profile = prof.data ? this._pIn(prof.data) : null;
    // fallback: se o trigger ainda não criou o perfil, cria agora
    if (!profile) {
      const role = ADMIN_EMAILS.includes((user.email || '').toLowerCase()) ? 'admin' : 'consultor';
      profile = { id: user.id, role, email: user.email, nome: (user.user_metadata && user.user_metadata.nome) || '', sobrenome: (user.user_metadata && user.user_metadata.sobrenome) || '', provider: 'email', twoFA: false };
      await SB.from('profiles').upsert(this._pOut(profile));
    }
    this.db.profile = profile;
    this.db.profiles = (profs.data || []).map(r => this._pIn(r));
    if (!this.db.profiles.find(p => p.id === profile.id)) this.db.profiles.push(profile);
    this.db.clients = (cli.data || []).map(r => this._cIn(r));
    this.db.sales = (sal.data || []).map(r => this._sIn(r));
    this.db.requests = (req.data || []).map(r => this._rIn(r)).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    this.db.leads = (lds.data || []).map(r => this._lIn(r));
  },

  clearCache() { this.db = { profile: null, profiles: [], clients: [], sales: [], requests: [], leads: [] }; },

  _err(e) { console.error('[OB] erro Supabase:', e); if (window.UI) UI.toast('Erro ao salvar', (e && e.message) || 'Tente novamente', 'err'); },
  async _save(table, row) { const { error } = await SB.from(table).upsert(row); if (error) this._err(error); },
  async _delete(table, id) { const { error } = await SB.from(table).delete().eq('id', id); if (error) this._err(error); },

  /* ============================================================
     SESSÃO / USUÁRIOS (a partir do cache)
     ============================================================ */
  session() { return this.db.profile; },
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
  addSale(s) { this.db.sales.push(s); this._save('sales', this._sOut(s)); return s; },
  updateSale(s) { const i = this.db.sales.findIndex(x => x.id === s.id); if (i >= 0) this.db.sales[i] = s; this._save('sales', this._sOut(s)); return s; },
  removeSale(id) { this.db.sales = this.db.sales.filter(s => s.id !== id); this._delete('sales', id); },

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

  comissaoResumo(consultorId) {
    const month = this.salesOf(consultorId).filter(s => s.statusProposta === 'aprovada' && this.isSameMonth(s.data));
    const volume = month.reduce((t, s) => t + s.valor, 0);
    const nivel = this.nivelPorVolume(volume);
    const rate = nivel.rate;
    const totalDevido = Math.round(volume * rate);
    const reqs = this.requestsOf(consultorId).filter(r => r.tipo === 'comissao' && r.status !== 'recusado' && this.isSameMonth(r.criadoEm));
    const jaPago = reqs.filter(r => r.status === 'pago').reduce((t, r) => t + r.valor, 0);
    const emAnalise = reqs.filter(r => r.status !== 'pago').reduce((t, r) => t + r.valor, 0);
    const disponivel = Math.max(0, totalDevido - jaPago - emAnalise);
    const bloqueados = this.NIVEIS.filter(n => n.meta > volume).sort((a, b) => a.meta - b.meta).map(n => ({
      nivel: n, faltaVolume: n.meta - volume, extraPct: Math.round((n.rate - rate) * 100),
      ganhoSobreAtual: Math.max(0, Math.round(volume * n.rate) - totalDevido)
    }));
    const vendasDisp = month.filter(s => s.statusComissao === 'disponivel');
    return { volume, nivel, rate, totalDevido, jaPago, emAnalise, disponivel, bloqueados, vendasDisp, reqs };
  },
  comissaoDisponivel(consultorId) { const r = this.comissaoResumo(consultorId); return { valor: r.disponivel, base: r.volume, rate: r.rate, vendas: r.vendasDisp, resumo: r }; },

  premioAlcancado(consultorId) { const vol = this.volumeTrimestre(consultorId); let alc = null; for (const p of this.PREMIOS) if (vol >= p.meta) alc = p; return alc; },
  proximoPremio(consultorId) { const vol = this.volumeTrimestre(consultorId); for (const p of this.PREMIOS) if (vol < p.meta) return p; return null; },

  brl(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },
  dataBR(d) { return new Date(d).toLocaleDateString('pt-BR'); }
};
