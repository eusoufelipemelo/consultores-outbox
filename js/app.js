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
              ? `<button class="iconbtn" id="notif-btn" style="position:relative" title="Notificações"><span class="notif-dot hidden" id="notif-dot"></span>${UI.icon('bell',18)}</button>`
              : `<button class="commission-pill" id="com-pill" title="Ver o que você pode solicitar"><div style="text-align:left"><div class="lbl">Comissão disponível</div><div class="val" id="com-val">R$ 0,00</div></div>${UI.icon('chevron',18)}</button>`}
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
    const notif = document.getElementById('notif-btn');
    if (notif) notif.onclick = () => Admin.notificacoesPopup();

    this.go(goProfile ? 'perfil' : nav[0].id);
  },

  drawer(open) {
    document.getElementById('sidebar').classList.toggle('open', open);
    document.getElementById('scrim').classList.toggle('show', open);
  },

  /* ---------- navegação ---------- */
  go(viewId) {
    this.current = viewId;
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
    const com = OB.comissaoDisponivel(u.id);
    document.getElementById('com-val').textContent = OB.brl(com.valor);
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
