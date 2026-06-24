/* ============================================================
   OutBox Consultores — App / Roteador (app.js)
   ============================================================ */
const App = {
  theme: 'light',
  current: null,

  async init() {
    // padrão: modo light (a escolha manual do usuário é lembrada em ob_theme)
    this.theme = OB._get(OB.KEYS.theme, 'light');
    document.documentElement.setAttribute('data-theme', this.theme);

    // página pública de ACEITE da proposta (cliente clica no link do orçamento)
    const qs = new URLSearchParams(location.search);
    if (qs.get('aceite')) { return this.renderAceite(qs.get('aceite'), qs.get('t')); }

    // link de recuperação de senha vindo do e-mail
    SB.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        document.getElementById('app').style.display = 'none';
        Auth.mode = 'login'; Auth.render(); Auth.showSetNewPassword();
      }
    });
    if (/type=recovery/.test(location.hash) || /type=recovery/.test(location.search)) {
      Auth.mode = 'login'; Auth.render();
      setTimeout(() => Auth.showSetNewPassword(), 300);
      return;
    }

    const { data: { session } } = await SB.auth.getSession();
    if (session) { await OB.loadAll(); this.boot(); }
    else Auth.render();
  },

  /* ---------- página pública de aceite da proposta ---------- */
  async renderAceite(saleId, token) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    const host = document.createElement('div');
    host.id = 'aceite-page';
    host.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#F15532,#e0431f);font-family:Inter,system-ui,sans-serif';
    const card = (icon, cor, titulo, msg, extra) => `
      <div style="max-width:440px;width:100%;background:#fff;border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25)">
        <div style="width:72px;height:72px;border-radius:50%;background:${cor}1a;color:${cor};display:grid;place-items:center;margin:0 auto 20px">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></div>
        <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin-bottom:8px">${titulo}</h1>
        <p style="color:#46505c;font-size:15px;line-height:1.6">${msg}</p>${extra || ''}
      </div>`;
    const spinner = '<circle cx="12" cy="12" r="9" stroke-opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9"/>';
    const check = '<path d="M20 6 9 17l-5-5"/>';
    const alert = '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    host.innerHTML = card(spinner, '#F15532', 'Confirmando...', 'Estamos registrando o seu aceite, um instante.');
    document.body.appendChild(host);

    if (!saleId || !token) { host.innerHTML = card(alert, '#dc2626', 'Link inválido', 'Este link de aceite está incompleto. Peça ao seu consultor para reenviar a proposta.'); return; }
    try {
      const { data, error } = await SB.rpc('aceitar_proposta', { p_sale: saleId, p_token: token });
      if (error) throw error;
      if (data && data.ok) {
        host.innerHTML = card(check, '#16a34a',
          data.ja ? 'Proposta já aceita' : 'Proposta aceita! 🎉',
          data.ja
            ? 'Esta proposta já estava confirmada. Seu consultor foi avisado e dará seguimento ao projeto.'
            : 'Obrigado! Seu aceite foi registrado e o consultor já foi notificado. Em breve iniciamos o briefing do seu projeto.',
          '<p style="margin-top:18px;font-size:13px;color:#8a96a3">OutBox Group · obrigado pela confiança</p>');
      } else {
        host.innerHTML = card(alert, '#dc2626', 'Não foi possível confirmar',
          (data && data.erro === 'token') ? 'Este link de aceite não confere. Peça ao seu consultor para reenviar a proposta.' : 'Proposta não encontrada. Fale com o seu consultor.');
      }
    } catch (e) {
      host.innerHTML = card(alert, '#dc2626', 'Erro ao confirmar', 'Tente novamente em instantes ou avise o seu consultor. (' + ((e && e.message) || 'falha de conexão') + ')');
    }
  },

  /* ---------- tema ---------- */
  themeBtnHTML() {
    return `<button class="iconbtn" id="theme-btn" title="Alternar tema">${UI.icon(this.theme === 'dark' ? 'sun' : 'moon', 18)}</button>`;
  },
  bindThemeBtn(root) {
    const btn = (root || document).querySelector('#theme-btn');
    if (btn) btn.onclick = () => this.toggleTheme();
  },
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    OB._set(OB.KEYS.theme, this.theme);
    document.querySelectorAll('#theme-btn').forEach(b => b.innerHTML = UI.icon(this.theme === 'dark' ? 'sun' : 'moon', 18));
    // redesenha gráficos e logos com as novas cores
    document.querySelectorAll('[data-logo]').forEach(img => img.src = `assets/logo-${this.theme === 'dark' ? 'branca' : 'preta'}.svg`);
    if (this.current && document.getElementById('app').style.display !== 'none') {
      this.mod().render(this.current);
      this.animateBars();
    }
    // atualiza logo da tela de login se estiver aberta
    if (document.getElementById('auth').style.display === 'grid') {
      document.querySelectorAll('.mob-logo').forEach(img => img.src = `assets/logo-${this.theme === 'dark' ? 'branca' : 'preta'}.svg`);
    }
  },

  mod() { return OB.session().role === 'admin' ? Admin : Consultor; },

  /* ---------- boot do app logado ---------- */
  boot(goProfile) {
    const u = OB.session();
    const isAdmin = u.role === 'admin';
    const nav = this.mod().NAV;
    document.getElementById('auth').style.display = 'none';
    const app = document.getElementById('app');
    app.style.display = 'block';

    app.innerHTML = `
      <div class="scrim" id="scrim"></div>
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand-row">
            <img data-logo src="assets/logo-${this.theme === 'dark' ? 'branca' : 'preta'}.svg" alt="OutBox"/>
            <span class="side-tag">${isAdmin ? 'Admin' : 'Consultor'}</span>
          </div>
          <nav class="nav" id="nav">
            ${nav.map(n => `<button class="nav-item" data-view="${n.id}">${UI.icon(n.icon)}<span>${n.label}</span>${n.id === 'financeiro' ? '<span class="badge hidden" id="fin-badge"></span>' : ''}</button>`).join('')}
          </nav>
          <div id="side-user-box"></div>
          <button class="nav-item" id="logout-btn" style="margin-top:6px;color:#e0573f">${UI.icon('logout')}<span>Sair</span></button>
        </aside>

        <div class="main">
          <header class="topbar">
            <button class="iconbtn menu-btn" id="menu-btn">${UI.icon('menu',18)}</button>
            <div><h1 id="page-title"></h1><div class="sub" id="page-sub"></div></div>
            <div class="spacer"></div>
            ${isAdmin
              ? `<button class="commission-pill pending hidden" id="pay-alert" title="Vendas aguardando confirmação de pagamento — clique para conferir"><div style="text-align:left"><div class="lbl">Pagamentos a conferir</div><div class="val" id="pay-alert-n">0</div></div>${UI.icon('clock',18)}</button>
                 <button class="iconbtn" id="notif-btn" style="position:relative" title="Notificações"><span class="notif-dot hidden" id="notif-dot"></span>${UI.icon('bell',18)}</button>`
              : `<div class="com-pills">
                  <button class="commission-pill pending hidden" id="conf-pill" title="Comissão de vendas aprovadas aguardando a confirmação do pagamento pelo administrador"><div style="text-align:left"><div class="lbl">Em conferência</div><div class="val" id="conf-val">R$ 0,00</div></div>${UI.icon('clock',18)}</button>
                  <button class="commission-pill" id="com-pill" title="Ver o que você pode solicitar"><div style="text-align:left"><div class="lbl">Comissão disponível</div><div class="val" id="com-val">R$ 0,00</div></div>${UI.icon('chevron',18)}</button>
                </div>`}
            ${this.themeBtnHTML()}
          </header>
          <div id="main-view" class="view"></div>
        </div>
      </div>`;

    // binds
    this.bindThemeBtn(app);
    this.refreshSidebarUser();
    if (!isAdmin) this.refreshCommission();
    this.refreshBadge();

    document.querySelectorAll('#nav .nav-item').forEach(b => b.onclick = () => this.go(b.dataset.view));
    document.getElementById('logout-btn').onclick = () => this.logout();
    document.getElementById('menu-btn').onclick = () => this.drawer(true);
    document.getElementById('scrim').onclick = () => this.drawer(false);
    const pill = document.getElementById('com-pill');
    if (pill) pill.onclick = () => Consultor.comissaoPopup();
    const confPill = document.getElementById('conf-pill');
    if (confPill) confPill.onclick = () => Consultor.comissaoPopup();
    const notif = document.getElementById('notif-btn');
    if (notif) notif.onclick = () => Admin.notificacoesPopup();
    const payAlert = document.getElementById('pay-alert');
    if (payAlert) payAlert.onclick = () => Admin.pagamentosPopup();

    this.go(goProfile ? 'perfil' : nav[0].id);
  },

  drawer(open) {
    document.getElementById('sidebar').classList.toggle('open', open);
    document.getElementById('scrim').classList.toggle('show', open);
  },

  /* ---------- navegação ---------- */
  go(viewId) {
    this.current = viewId;
    document.getElementById('main-view').classList.remove('view-wide'); // funil reativa abaixo
    document.querySelectorAll('#nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    const t = this.mod().titles[viewId] || ['', ''];
    document.getElementById('page-title').textContent = t[0];
    document.getElementById('page-sub').textContent = t[1];
    this.mod().render(viewId);
    this.drawer(false);
    if (!OB.session().role || OB.session().role === 'consultor') this.refreshCommission();
    this.animateBars();
    document.getElementById('main-view').scrollTop = 0;
    window.scrollTo(0, 0);
  },

  // anima barras de progresso após render
  animateBars() {
    setTimeout(() => document.querySelectorAll('.bar > i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; }), 80);
  },

  /* ---------- topbar comissão (sempre atualizada) ---------- */
  refreshCommission(bump) {
    const u = OB.session();
    if (!u || u.role === 'admin') return;
    const pill = document.getElementById('com-pill');
    if (!pill) return;
    const r = OB.comissaoResumo(u.id);
    document.getElementById('com-val').textContent = OB.fmt(r.disponivel);
    const confPill = document.getElementById('conf-pill');
    if (confPill) {
      document.getElementById('conf-val').textContent = OB.fmt(r.emConferencia);
      confPill.classList.remove('hidden'); // sempre visível, mesmo zerado
    }
    if (bump) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  },

  /* ---------- badge de pendências (admin) ---------- */
  refreshBadge() {
    const u = OB.session();
    if (!u || u.role !== 'admin') return;
    const n = Admin.pendentes().length;
    const badge = document.getElementById('fin-badge');
    if (badge) { badge.textContent = n; badge.classList.toggle('hidden', n === 0); }
    const dot = document.getElementById('notif-dot');
    if (dot) dot.classList.toggle('hidden', n === 0);
    // alerta de pagamentos a confirmar (vendas aprovadas ainda não recebidas)
    const pendPag = OB.sales().filter(s => s.statusProposta === 'aprovada' && s.statusPagamento !== 'recebido').length;
    const pa = document.getElementById('pay-alert');
    if (pa) {
      document.getElementById('pay-alert-n').textContent = pendPag;
      pa.classList.toggle('hidden', pendPag === 0);
    }
  },

  /* ---------- card de usuário na sidebar ---------- */
  refreshSidebarUser() {
    const u = OB.session();
    const box = document.getElementById('side-user-box');
    if (!box) return;
    const av = u.foto ? `<img src="${u.foto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : (u.nome ? u.nome[0].toUpperCase() : '?');
    box.innerHTML = `<div class="side-user"><div class="av">${av}</div><div class="grow" style="min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.nome} ${u.sobrenome||''}</b><span>${u.role === 'admin' ? 'Administrador' : 'Consultor'}</span></div></div>`;
  },

  logout() {
    UI.confirm('Sair da conta', 'Deseja realmente sair?', async () => {
      try {
        await SB.auth.signOut();
        OB.clearCache();
        Charts.destroyAll();
        // fecha qualquer modal e remove o drawer/scrim para não travar a tela
        UI.closeModal();
        this.drawer(false);
        const app = document.getElementById('app');
        app.style.display = 'none';
        app.innerHTML = '';          // limpa o shell antigo (sidebar, scrim, overlays)
        this.current = null;
        Auth.mode = 'login';
        Auth.render();
      } catch (e) {
        // fallback infalível: recarrega na tela de login
        console.error('Erro ao sair:', e);
        location.reload();
      }
    }, 'Sair');
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
