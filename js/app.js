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
    // página pública de ACEITE do contrato (cliente lê e assina virtualmente)
    if (qs.get('contrato')) { return this.renderAceiteContrato(qs.get('contrato'), qs.get('t')); }

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
    if (session) {
      await OB.loadAll();
      if (OB.precisaAceitarTermos()) { this.showTermosGate(); }
      else { this.boot(); }
    }
    else Auth.render();
  },

  /* ---------- portão de aceite dos termos (novos e antigos consultores) ---------- */
  showTermosGate() {
    document.getElementById('auth').style.display = 'none';
    const app = document.getElementById('app'); app.style.display = 'none';
    const old = document.getElementById('termos-gate'); if (old) old.remove();
    const host = document.createElement('div');
    host.id = 'termos-gate';
    const abas = TERMOS.ABAS;
    host.innerHTML = `
      <div class="tg-card">
        <div class="tg-head">
          <div class="tg-mark">${UI.icon('shield', 22)}</div>
          <div>
            <h2>Termo de Adesão e Políticas</h2>
            <p>Para acessar o sistema, leia e aceite os documentos abaixo. O acesso só é liberado com o aceite.</p>
          </div>
        </div>
        <div class="tg-tabs" id="tg-tabs">
          ${abas.map((a, i) => `<button class="tg-tab ${i === 0 ? 'on' : ''}" data-doc="${a.id}">${a.nome}</button>`).join('')}
        </div>
        <div class="tg-doc doc-view" id="tg-doc">${TERMOS.docPorId(abas[0].id)}</div>
        <div class="tg-foot">
          <label class="tg-check">
            <input type="checkbox" id="tg-agree">
            <span>Declaro que li e concordo com o <b>Termo de Prestação de Serviços (não vínculo empregatício)</b>, os <b>Termos de Uso</b> e a <b>Política de Privacidade</b>, e que atuo por conta própria (CPF ou CNPJ), sem vínculo empregatício com a ${TERMOS.EMPRESA.razao}.</span>
          </label>
          <div class="tg-actions">
            <button class="btn ghost" id="tg-sair">${UI.icon('logout',16)} Sair</button>
            <button class="btn brand" id="tg-aceitar" disabled>${UI.icon('check',16)} Aceito e continuar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host);

    // troca de documento
    host.querySelectorAll('#tg-tabs .tg-tab').forEach(b => b.onclick = () => {
      host.querySelectorAll('#tg-tabs .tg-tab').forEach(x => x.classList.toggle('on', x === b));
      const doc = document.getElementById('tg-doc');
      doc.innerHTML = TERMOS.docPorId(b.dataset.doc);
      doc.scrollTop = 0;
    });
    // habilita o botão só com o aceite marcado
    const chk = document.getElementById('tg-agree');
    const btn = document.getElementById('tg-aceitar');
    chk.onchange = () => { btn.disabled = !chk.checked; };
    // sair
    document.getElementById('tg-sair').onclick = () => this.sairDoAceite();
    // aceitar
    btn.onclick = async () => {
      if (!chk.checked) return;
      btn.disabled = true; btn.innerHTML = 'Registrando aceite...';
      const meta = { userAgent: navigator.userAgent, ip: await this._buscarIP() };
      try {
        await OB.aceitarTermos(meta);
        host.remove();
        this._loginFlow = true; // acabou de logar + aceitar: libera o pop-up de propaganda
        this.boot();
        UI.toast('Tudo certo!', 'Aceite registrado. Bom trabalho!', 'ok');
      } catch (e) {
        console.error('Erro ao registrar aceite:', e);
        btn.disabled = false; btn.innerHTML = `${UI.icon('check',16)} Aceito e continuar`;
        UI.toast('Não foi possível registrar', 'Tente novamente em instantes.', 'err');
      }
    };
  },

  /* busca o IP público do usuário (best-effort, para a auditoria do aceite) */
  async _buscarIP() {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
      clearTimeout(to);
      const j = await r.json();
      return (j && j.ip) || null;
    } catch (e) { return null; }
  },

  sairDoAceite() {
    (async () => {
      try { await SB.auth.signOut(); } catch (e) {}
      OB.clearCache();
      const g = document.getElementById('termos-gate'); if (g) g.remove();
      const app = document.getElementById('app'); app.style.display = 'none'; app.innerHTML = '';
      this.current = null;
      Auth.mode = 'login';
      Auth.render();
    })();
  },

  /* abre um documento legal em modal (acesso pelo rodapé, a qualquer momento) */
  verDocumento(id) {
    UI.modal({
      title: 'Documentos legais',
      size: 'lg',
      body: `<div class="doc-view doc-modal">${TERMOS.docPorId(id)}</div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button>`
    });
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
          '<p style="margin-top:18px;font-size:13px;color:#8a96a3">OutBox Soluções Digitais · obrigado pela confiança</p>');
      } else {
        host.innerHTML = card(alert, '#dc2626', 'Não foi possível confirmar',
          (data && data.erro === 'token') ? 'Este link de aceite não confere. Peça ao seu consultor para reenviar a proposta.' : 'Proposta não encontrada. Fale com o seu consultor.');
      }
    } catch (e) {
      host.innerHTML = card(alert, '#dc2626', 'Erro ao confirmar', 'Tente novamente em instantes ou avise o seu consultor. (' + ((e && e.message) || 'falha de conexão') + ')');
    }
  },

  _ctMsg(cor, titulo, msg, extra) {
    return `<div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#F15532,#e0431f)">
      <div style="max-width:460px;width:100%;background:#fff;border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25)">
        <div style="width:72px;height:72px;border-radius:50%;background:${cor}1a;color:${cor};display:grid;place-items:center;margin:0 auto 20px;font-size:34px;font-weight:800">${cor === '#16a34a' ? '&#10003;' : '!'}</div>
        <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin-bottom:8px">${titulo}</h1>
        <p style="color:#46505c;font-size:15px;line-height:1.6">${msg}</p>${extra || ''}
        <p style="margin-top:18px;font-size:13px;color:#8a96a3">OutBox Soluções Digitais</p>
      </div></div>`;
  },
  /* página pública onde o cliente lê o contrato e confirma o aceite (assinatura virtual) */
  async renderAceiteContrato(id, token) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    const host = document.createElement('div');
    host.id = 'contrato-page';
    host.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#eef1f4;font-family:Inter,system-ui,sans-serif';
    document.body.appendChild(host);
    host.innerHTML = `<div style="text-align:center;padding:70px 20px;color:#8a96a3;font-size:15px">Carregando contrato…</div>`;
    if (!id || !token) { host.innerHTML = this._ctMsg('#dc2626', 'Link inválido', 'Este link de contrato está incompleto. Peça ao consultor para reenviar.'); return; }
    let info;
    try { const { data, error } = await SB.rpc('contrato_publico', { p_id: id, p_token: token }); if (error) throw error; info = data; }
    catch (e) { host.innerHTML = this._ctMsg('#dc2626', 'Erro ao carregar', 'Tente novamente em instantes. (' + ((e && e.message) || 'falha') + ')'); return; }
    if (!info) { host.innerHTML = this._ctMsg('#dc2626', 'Contrato não encontrado', 'Confira o link com o seu consultor.'); return; }
    const jaAceito = info.status === 'aceito';
    // dados pode vir como string (jsonb duplo-encodado) via RPC — normaliza para objeto
    let dados = info.dados; if (typeof dados === 'string') { try { dados = JSON.parse(dados); } catch (_e) { dados = {}; } }
    const c = { id, numero: info.numero, dados, status: info.status, acceptToken: '', aceiteNome: info.aceite_nome, aceiteDoc: info.aceite_doc, aceitoEm: info.aceito_em, aceiteIp: info.aceite_ip, criadoEm: info.criado_em };
    const docHtml = Consultor.buildContratoHTML(c);
    const cli = (dados && dados.cliente) || {};
    host.innerHTML = `
      <div style="max-width:900px;margin:0 auto;padding:16px 12px 150px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 4px;color:#0A0A0A">
          <b style="font-size:17px">Contrato ${info.numero || ''}</b>
          <span style="margin-left:auto;font-size:12px;color:#8a96a3">${jaAceito ? 'Aceito' : 'Leia o contrato e confirme o aceite abaixo'}</span>
        </div>
        <iframe id="ct-frame" style="width:100%;height:72vh;border:1px solid #e6eaef;border-radius:14px;background:#fff"></iframe>
      </div>
      <div id="ct-bar" style="position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e6eaef;box-shadow:0 -6px 24px rgba(0,0,0,.08);padding:14px 16px"></div>`;
    document.getElementById('ct-frame').srcdoc = docHtml;
    const bar = document.getElementById('ct-bar');
    if (jaAceito) {
      bar.innerHTML = `<div style="max-width:900px;margin:0 auto;text-align:center;color:#15803d;font-weight:700;font-size:14px">&#10003; Contrato aceito em ${info.aceito_em ? new Date(info.aceito_em).toLocaleString('pt-BR') : ''}</div>`;
      return;
    }
    bar.innerHTML = `<div style="max-width:900px;margin:0 auto;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <input id="ct-nome" placeholder="Seu nome completo" value="${cli.nome || ''}" style="flex:1;min-width:180px;padding:12px 14px;border:1px solid #e6eaef;border-radius:10px;font-size:14px">
      <input id="ct-doc" placeholder="CPF ou CNPJ" value="${cli.doc || ''}" style="flex:1;min-width:140px;padding:12px 14px;border:1px solid #e6eaef;border-radius:10px;font-size:14px">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#3c4652;flex:1 1 100%"><input type="checkbox" id="ct-agree" style="width:17px;height:17px;accent-color:#F15532"> Li e concordo com todos os termos deste contrato.</label>
      <button id="ct-accept" style="width:100%;padding:15px;background:#F15532;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer">Aceitar contrato</button>
    </div>`;
    document.getElementById('ct-accept').onclick = async () => {
      const nome = (document.getElementById('ct-nome').value || '').trim();
      const doc = (document.getElementById('ct-doc').value || '').trim();
      if (!document.getElementById('ct-agree').checked) return alert('Marque que você leu e concorda com o contrato.');
      if (!nome) return alert('Informe o seu nome completo.');
      const btn = document.getElementById('ct-accept'); btn.disabled = true; btn.textContent = 'Registrando…';
      let ip = ''; try { ip = await fetch('https://api.ipify.org').then(r => r.text()); } catch (e) {}
      try {
        const { data, error } = await SB.rpc('aceitar_contrato', { p_id: id, p_token: token, p_nome: nome, p_doc: doc, p_ip: ip });
        if (error) throw error;
        if (data && data.ok) { document.getElementById('contrato-page').innerHTML = this._ctMsg('#16a34a', data.ja ? 'Contrato já aceito' : 'Contrato aceito! 🎉', 'Seu aceite foi registrado com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020). O consultor foi notificado e dará seguimento ao seu projeto.'); }
        else { btn.disabled = false; btn.textContent = 'Aceitar contrato'; alert('Não foi possível confirmar: ' + ((data && data.erro) || 'erro')); }
      } catch (e) { btn.disabled = false; btn.textContent = 'Aceitar contrato'; alert('Erro ao registrar: ' + ((e && e.message) || 'falha')); }
    };
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
            <img data-logo src="assets/logo-${this.theme === 'dark' ? 'branca' : 'preta'}.svg" alt="OutBox Soluções Digitais"/>
            <span class="side-tag">${isAdmin ? 'Admin' : 'Consultor'}</span>
          </div>
          <div class="brand-desc">Soluções Digitais</div>
          <nav class="nav" id="nav">
            ${nav.map(n => `<button class="nav-item" data-view="${n.id}">${UI.icon(n.icon)}<span>${n.label}</span>${n.soon ? '<span class="soon-badge">em breve</span>' : ''}${n.id === 'financeiro' ? '<span class="badge hidden" id="fin-badge"></span>' : ''}${n.id === 'funil' ? '<span class="badge hidden" id="fu-badge"></span>' : ''}${n.id === 'projetos' ? '<span class="badge hidden" id="proj-badge"></span>' : ''}${n.id === 'atendimento' ? '<span class="badge hidden" id="atend-badge"></span>' : ''}</button>${n.home ? '<div class="nav-sep" aria-hidden="true"></div>' : ''}`).join('')}
          </nav>
          ${!isAdmin ? `<a class="side-whats" href="https://chat.whatsapp.com/Bv5EM9xjqNkLiQiP3cUfKd" target="_blank" rel="noopener" title="Entrar no grupo de consultores da OutBox no WhatsApp">
            <span class="wa-ico"><svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true"><path fill="#fff" d="M16.003 5.333c-5.888 0-10.667 4.779-10.667 10.667 0 1.88.494 3.72 1.432 5.341L5.333 26.667l5.464-1.433a10.63 10.63 0 0 0 5.203 1.325h.004c5.884 0 10.663-4.779 10.666-10.665a10.6 10.6 0 0 0-3.124-7.545 10.6 10.6 0 0 0-7.543-3.021zm0 19.2h-.003a8.85 8.85 0 0 1-4.51-1.235l-.323-.192-3.351.879.894-3.266-.21-.335a8.83 8.83 0 0 1-1.354-4.716c.002-4.889 3.982-8.868 8.874-8.868a8.81 8.81 0 0 1 6.27 2.599 8.82 8.82 0 0 1 2.597 6.276c-.002 4.889-3.982 8.868-8.874 8.868zm4.867-6.641c-.267-.134-1.578-.779-1.823-.868-.245-.089-.423-.134-.601.134-.178.267-.69.868-.846 1.046-.156.178-.311.2-.578.067-.267-.134-1.126-.415-2.145-1.324-.793-.707-1.328-1.58-1.484-1.847-.156-.267-.017-.411.117-.545.12-.12.267-.311.401-.467.134-.156.178-.267.267-.445.089-.178.045-.334-.022-.467-.067-.134-.601-1.449-.824-1.983-.217-.521-.437-.45-.601-.458l-.512-.009a.98.98 0 0 0-.712.334c-.245.267-.935.913-.935 2.226 0 1.313.957 2.582 1.09 2.76.134.178 1.884 2.876 4.564 4.032.638.276 1.135.44 1.523.563.64.204 1.223.175 1.683.106.514-.077 1.578-.645 1.801-1.269.223-.623.223-1.157.156-1.269-.067-.111-.245-.178-.512-.311z"/></svg></span>
            <span class="wa-txt"><b>Grupo no WhatsApp</b><small>Comunidade de consultores OutBox</small></span>
          </a>` : ''}
          <div id="side-user-box"></div>
          <button class="nav-item" id="logout-btn" style="margin-top:6px;color:#e0573f">${UI.icon('logout')}<span>Sair</span></button>
          <div class="side-legal">
            <button data-doc="termo">Termo de Não Vínculo</button>
            <button data-doc="uso">Termos de Uso</button>
            <button data-doc="privacidade">Política de Privacidade</button>
          </div>
        </aside>

        <div class="main">
          <div id="aviso-host"></div>
          <header class="topbar">
            <button class="iconbtn menu-btn" id="menu-btn">${UI.icon('menu',18)}</button>
            <div class="topbar-title"><h1 id="page-title"></h1><div class="sub" id="page-sub"></div></div>
            <div class="spacer"></div>
            ${isAdmin
              ? `<button class="commission-pill pending hidden" id="pay-alert" title="Vendas aguardando confirmação de pagamento — clique para conferir"><div style="text-align:left"><div class="lbl">Pagamentos a conferir</div><div class="val" id="pay-alert-n">0</div></div>${UI.icon('clock',18)}</button>
                 <button class="iconbtn" id="notif-btn" style="position:relative" title="Notificações"><span class="notif-dot hidden" id="notif-dot"></span>${UI.icon('bell',18)}</button>`
              : `<div class="com-pills">
                  <button class="commission-pill pending hidden" id="conf-pill" title="Comissão de vendas aprovadas aguardando a confirmação do pagamento pelo administrador"><div style="text-align:left"><div class="lbl">Em conferência</div><div class="val" id="conf-val">R$ 0,00</div></div>${UI.icon('clock',18)}</button>
                  <button class="commission-pill locked" id="bloq-pill"><div style="text-align:left"><div class="lbl">Mínimo p/ saque</div><div class="val" id="bloq-val">R$ 500,00</div></div>${UI.icon('lock',18)}</button>
                  <button class="commission-pill" id="com-pill" title="Ver o que você pode solicitar"><div style="text-align:left"><div class="lbl">Comissão disponível</div><div class="val" id="com-val">R$ 0,00</div></div>${UI.icon('chevron',18)}</button>
                </div>
                <button class="rank-badge" id="rank-badge" title="Seu ranking · clique para ver o Top 10">
                  <span class="rank-badge__av" id="rankb-av"></span>
                  <span class="rank-badge__txt"><b id="rankb-pts">0 pts</b><small id="rankb-pos">#—</small></span>
                </button>`}
            ${this.themeBtnHTML()}
          </header>
          <div id="main-view" class="view"></div>
        </div>
      </div>`;

    // binds
    this.bindThemeBtn(app);
    this.refreshSidebarUser();
    if (!isAdmin) { this.refreshCommission(); this.refreshRankBadge(); const rb = document.getElementById('rank-badge'); if (rb) rb.onclick = () => this.go('ranking'); }
    this.refreshBadge();

    document.querySelectorAll('#nav .nav-item').forEach(b => b.onclick = () => this.go(b.dataset.view));
    document.querySelectorAll('.side-legal [data-doc]').forEach(b => b.onclick = () => this.verDocumento(b.dataset.doc));
    document.getElementById('logout-btn').onclick = () => this.logout();
    document.getElementById('menu-btn').onclick = () => this.drawer(true);
    document.getElementById('scrim').onclick = () => this.drawer(false);
    const pill = document.getElementById('com-pill');
    if (pill) pill.onclick = () => Consultor.comissaoPopup();
    const confPill = document.getElementById('conf-pill');
    if (confPill) confPill.onclick = () => Consultor.comissaoPopup();
    const bloqPill = document.getElementById('bloq-pill');
    if (bloqPill) bloqPill.onclick = () => Consultor.comissaoPopup();
    const notif = document.getElementById('notif-btn');
    if (notif) notif.onclick = () => Admin.notificacoesPopup();
    const payAlert = document.getElementById('pay-alert');
    if (payAlert) payAlert.onclick = () => Admin.pagamentosPopup();

    this.renderAviso();
    this.subscribeAviso();
    this.refreshProjetosBadge();
    this.subscribeProjetos();
    // chat Manu: widget flutuante (consultor) + tempo real + som
    if (!isAdmin) this.mountChatWidget();
    this.subscribeChat();
    this.refreshChatBadges();
    if (!this._audioUnlock) { this._audioUnlock = true; const unlock = () => { this._ensureAudio(); document.removeEventListener('pointerdown', unlock, true); }; document.addEventListener('pointerdown', unlock, true); }
    // presença (quem está logado) + lembretes de follow-up
    OB.pingPresenca();
    if (this._presTimer) clearInterval(this._presTimer);
    this._presTimer = setInterval(() => OB.pingPresenca(), 4 * 60 * 1000);
    if (!isAdmin) {
      Consultor.checkFollowups();
      if (this._fuTimer) clearInterval(this._fuTimer);
      this._fuTimer = setInterval(() => Consultor.checkFollowups(), 60 * 1000);
    }
    // portão de perfil: consultor precisa completar e salvar o perfil antes de usar o sistema
    this.perfilLock = OB.precisaCompletarPerfil();
    const shell = document.querySelector('.shell');
    if (shell) shell.classList.toggle('perfil-lock', this.perfilLock);
    if (this.perfilLock) { this.go('perfil'); }
    else { this.go(goProfile ? 'perfil' : nav[0].id); }
    // propaganda/pop-up: aparece a CADA login (não em refresh) enquanto a campanha estiver no ar.
    // Se estiver preso no portão de perfil, mantém o flag e mostra ao liberar o perfil.
    if (!isAdmin && this._loginFlow && !this.perfilLock) { this._loginFlow = false; this.showCampanha(); }
  },

  /* ---------- propaganda/pop-up de marketing (arte 4:5 agendada pelo admin) ---------- */
  async showCampanha() {
    try {
      if (!OB.campanhaAtivaAgora()) return;   // respeita período + dias + horário
      const img = await OB.getCampanhaImagem();
      if (!img) return;
      this.campanhaModal(img);                // sem "já viu": mostra em todo login
    } catch (e) {}
  },
  // pop-up centralizado, cabe na tela (não é tela cheia); fecha só quando o consultor decide
  campanhaModal(img, dismissKey) {
    if (document.querySelector('.camp-pop')) return;
    const host = document.createElement('div');
    host.className = 'camp-pop';
    host.innerHTML = `
      <div class="camp-pop__box" role="dialog" aria-modal="true" aria-label="Comunicado da OutBox">
        <button class="camp-pop__close" type="button" aria-label="Fechar">${UI.icon('x', 20)}</button>
        <img class="camp-pop__img" src="${img}" alt="Comunicado da OutBox"/>
      </div>`;
    document.body.appendChild(host);
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const close = () => {
      host.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (dismissKey) { try { sessionStorage.setItem(dismissKey, '1'); } catch (e) {} }
      setTimeout(() => host.remove(), 200);
    };
    host.querySelector('.camp-pop__close').onclick = close;
    host.addEventListener('click', (e) => { if (e.target === host) close(); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => host.classList.add('show'));
  },

  /* libera o sistema depois que o consultor completa e salva o perfil */
  liberarPerfil() {
    this.perfilLock = false;
    const shell = document.querySelector('.shell');
    if (shell) shell.classList.remove('perfil-lock');
    this.go(this.mod().HOME || this.mod().NAV[0].id);
    // se o pop-up ficou pendente por causa do portão de perfil, mostra agora
    if (this._loginFlow) { this._loginFlow = false; this.showCampanha(); }
  },

  /* ---------- barra de aviso/comunicado no topo (definida pelo admin) ---------- */
  // HTML da barra (texto em loop infinito). preview=true => cantos arredondados, sem animação de entrada
  avisoBarHTML(a, preview) {
    const t = (OB.TIPOS_AVISO.find(x => x.id === a.tipo) || OB.TIPOS_AVISO[0]);
    const txt = (a.texto || '').replace(/</g, '&lt;');
    const dur = Math.max(10, Math.round((a.texto || '').length * 0.32)); // velocidade constante ~ tamanho do texto
    return `<div class="aviso-bar ${a.tipo}${preview ? ' no-anim' : ''}"${preview ? ' style="border-radius:12px"' : ''}>
      <span class="ico">${UI.icon(t.icon, 18)}</span>
      <div class="aviso-marquee"><div class="aviso-marquee-inner" style="animation-duration:${dur}s">
        <span class="aviso-seg">${txt}</span><span class="aviso-seg" aria-hidden="true">${txt}</span>
      </div></div>
    </div>`;
  },
  renderAviso() {
    const host = document.getElementById('aviso-host');
    if (!host) return;
    const u = OB.session();
    if (u && u.role === 'admin') { host.innerHTML = ''; return; } // admin não vê a barra, só os consultores
    const a = OB.avisoAtivo();
    host.innerHTML = a ? this.avisoBarHTML(a) : '';
  },

  /* Realtime: o aviso muda na hora para quem já está logado (sem recarregar) */
  _avisoChannel: null,
  subscribeAviso() {
    if (typeof SB === 'undefined' || !SB.channel) return;
    if (this._avisoChannel) { try { SB.removeChannel(this._avisoChannel); } catch (e) {} this._avisoChannel = null; }
    this._avisoChannel = SB.channel('avisos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, (payload) => {
        const row = payload.new && payload.new.id ? payload.new : payload.old;
        OB.db.aviso = row ? OB._avIn(row) : null;
        this.renderAviso();
      })
      .subscribe();
  },
  unsubscribeAviso() {
    if (this._avisoChannel) { try { SB.removeChannel(this._avisoChannel); } catch (e) {} this._avisoChannel = null; }
  },

  /* ---------- badge de projetos (briefings/entregas que pedem atenção) ---------- */
  refreshProjetosBadge() {
    const u = OB.session(); if (!u) return;
    const badge = document.getElementById('proj-badge'); if (!badge) return;
    let n = 0;
    if (u.role === 'admin') n = OB.briefingsPendentesAdmin().length; // briefings recebidos a iniciar
    else n = OB.projetosDe(u.id).filter(p => p.status === 'briefing_recebido' || p.status === 'entregue').length;
    badge.textContent = n; badge.classList.toggle('hidden', n === 0);
  },

  /* Realtime dos projetos: atualiza o cache, o badge, a tela e avisa por toast */
  _projChannel: null,
  subscribeProjetos() {
    if (typeof SB === 'undefined' || !SB.channel) return;
    if (this._projChannel) { try { SB.removeChannel(this._projChannel); } catch (e) {} this._projChannel = null; }
    this._projChannel = SB.channel('projetos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, (payload) => {
        const u = OB.session(); if (!u) return;
        const row = payload.new && payload.new.id ? payload.new : payload.old;
        if (!row) return;
        const proj = payload.new && payload.new.id ? OB._prIn(payload.new) : null;
        const arr = OB.db.projetos || (OB.db.projetos = []);
        if (payload.eventType === 'DELETE') {
          OB.db.projetos = arr.filter(p => p.id !== row.id);
        } else if (proj) {
          const i = arr.findIndex(p => p.id === proj.id);
          const antes = i >= 0 ? arr[i].status : null;
          if (i >= 0) arr[i] = proj; else arr.push(proj);
          // avisos por mudança de etapa
          if (antes !== proj.status) {
            if (u.role === 'admin' && proj.status === 'briefing_recebido') {
              UI.toast('Novo briefing recebido', 'Um cliente preencheu o briefing. Abra Projetos para iniciar.', 'info');
            } else if (u.role !== 'admin' && proj.consultorId === u.id) {
              const et = OB.ETAPAS_PROJETO.find(e => e.id === proj.status);
              if (et) UI.toast('Atualização de projeto', 'Seu projeto avançou para: ' + et.nome + '.', 'ok');
            }
          }
        }
        this.refreshProjetosBadge();
        if (this.current === 'projetos') this.mod().render('projetos');
      })
      .subscribe();
  },
  unsubscribeProjetos() {
    if (this._projChannel) { try { SB.removeChannel(this._projChannel); } catch (e) {} this._projChannel = null; }
  },

  drawer(open) {
    document.getElementById('sidebar').classList.toggle('open', open);
    document.getElementById('scrim').classList.toggle('show', open);
  },

  /* ---------- navegação ---------- */
  go(viewId) {
    // enquanto o perfil não estiver completo, o consultor fica preso na tela de perfil
    if (this.perfilLock && OB.session() && OB.session().role !== 'admin' && viewId !== 'perfil') {
      UI.toast('Complete seu perfil', 'Preencha e salve todos os dados para liberar o sistema.', 'info');
      viewId = 'perfil';
    }
    this.current = viewId;
    document.getElementById('main-view').classList.remove('view-wide'); // funil reativa abaixo
    document.querySelectorAll('#nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    const t = this.mod().titles[viewId] || ['', ''];
    document.getElementById('page-title').textContent = t[0];
    document.getElementById('page-sub').textContent = t[1];
    this.mod().render(viewId);
    this.drawer(false);
    this.refreshProjetosBadge();
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
    // botão do mínimo p/ saque: bloqueado até o disponível atingir o mínimo
    const bloq = document.getElementById('bloq-pill');
    if (bloq) {
      const min = OB.saqueMinimo();
      const liberado = r.disponivel >= min;
      bloq.classList.toggle('locked', !liberado);
      bloq.classList.toggle('unlocked', liberado);
      bloq.querySelector('.lbl').textContent = liberado ? 'Saque liberado' : 'Mínimo p/ saque';
      document.getElementById('bloq-val').textContent = OB.fmt(min);
      bloq.querySelector('svg').outerHTML = UI.icon(liberado ? 'check' : 'lock', 18);
      bloq.title = liberado
        ? `Você já pode solicitar: o disponível atingiu o mínimo de ${OB.fmt(min)}.`
        : `O saque só é liberado quando a comissão disponível atingir ${OB.fmt(min)}. Faltam ${OB.fmt(Math.max(0, min - r.disponivel))}.`;
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
    const av = u.foto ? `<img src="${u.foto}" alt="">` : (u.nome ? u.nome[0].toUpperCase() : '?');
    box.innerHTML = `<button type="button" class="side-user" id="side-user-btn" title="Editar meu perfil" aria-label="Editar meu perfil"><div class="av">${av}</div><div class="grow" style="min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.nome} ${u.sobrenome||''}</b><span>${u.role === 'admin' ? 'Administrador' : 'Consultor'}</span></div><span class="side-user-edit">${UI.icon('edit',16)}</span></button>`;
    const btn = document.getElementById('side-user-btn');
    if (btn) btn.onclick = () => this.go('perfil');
  },

  /* ---------- Ranking de consultores (vendas + treinamentos) — visão premium ---------- */
  renderRanking(v, highlightId) {
    const top = OB.rankingGeral().slice(0, 10);
    if (!top.length) {
      v.innerHTML = `<div class="card"><div class="port-soon">${UI.icon('ranking',30)}<b>Ranking em formação</b><p>Assim que os consultores registrarem vendas aprovadas e concluírem treinamentos, o Top 10 aparece aqui.</p></div></div>`;
      return;
    }
    const nomeDe = r => ((r.nome || '') + ' ' + (r.sobrenome || '')).trim() || 'Consultor';
    const ini = r => (r.nome ? r.nome[0].toUpperCase() : '?');
    const isMe = r => highlightId && r.consultor_id === highlightId;
    const max = Math.max(1, Number(top[0].pontos) || 1);
    const sub = r => `${r.treinos_concluidos || 0} treino${(r.treinos_concluidos || 0) !== 1 ? 's' : ''} · ${OB.fmt(Number(r.volume || 0))}`;
    const av = r => { const f = OB.fotos[r.consultor_id]; return f ? `<img src="${f}" alt="">` : ini(r); };

    // pódio (top 3) exibido na ordem 2 · 1 · 3
    const podium = [[top[1], 2, 0], [top[0], 1, 1], [top[2], 3, 2]];
    const podHTML = podium.map(([r, rank, i]) => {
      if (!r) return '<div></div>';
      return `<div class="rk-pod rk-pod--${rank}${isMe(r) ? ' me' : ''}" style="--i:${i}">
        <div class="rk-pod__crown">${rank === 1 ? UI.icon('crown', 24) : ''}</div>
        <div class="rk-pod__ph" data-av="${r.consultor_id}">${av(r)}<span class="rk-pod__badge">${rank}</span></div>
        <b class="rk-pod__nm">${nomeDe(r)}${isMe(r) ? ' <span class="rank-you">você</span>' : ''}</b>
        <div class="rk-pod__pts"><b data-count="${r.pontos}">0</b><small>pts</small></div>
        <div class="rk-pod__base"><span>${rank}º</span></div>
      </div>`;
    }).join('');

    // lista 4..10 com barra de progresso
    const restHTML = top.slice(3).map((r, i) => {
      const pos = i + 4;
      const w = Math.round((Number(r.pontos) / max) * 100);
      return `<div class="rk-row${isMe(r) ? ' me' : ''}" style="--i:${i}">
        <span class="rk-row__pos">${pos}</span>
        <span class="rk-row__ph" data-av="${r.consultor_id}">${av(r)}</span>
        <div class="rk-row__meta">
          <b>${nomeDe(r)}${isMe(r) ? ' <span class="rank-you">você</span>' : ''}</b>
          <span class="rk-row__sub">${sub(r)}</span>
          <div class="rk-bar"><i data-w="${w}"></i></div>
        </div>
        <div class="rk-row__pts"><b data-count="${r.pontos}">0</b><small>pts</small></div>
      </div>`;
    }).join('');

    v.innerHTML = `
      <div class="rk-legend">${UI.icon('info',15)}<span>Pontuação: <b>1 pt a cada R$ 10 vendidos</b> + <b>100 pts por treinamento concluído</b>. Suba vendendo e treinando mais.</span></div>
      <div class="rk-podium">${podHTML}</div>
      ${restHTML ? `<div class="rk-list">${restHTML}</div>` : ''}`;

    // fotos lazy via RPC (funciona também para o consultor ver os demais) — preserva o badge do pódio
    OB.fotosDe(top.map(r => r.consultor_id)).then(() => v.querySelectorAll('[data-av]').forEach(el => {
      const f = OB.fotos[el.dataset.av]; if (!f) return;
      const badge = el.querySelector('.rk-pod__badge');
      el.innerHTML = `<img src="${f}" alt="">` + (badge ? badge.outerHTML : '');
    })).catch(() => {});
    // movimento: contagem crescente + barras enchendo
    const reduce = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    v.querySelectorAll('[data-count]').forEach(el => this._countUp(el, +el.dataset.count, reduce));
    requestAnimationFrame(() => v.querySelectorAll('.rk-bar i[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; }));
  },
  _countUp(el, target, reduce) {
    target = Number(target) || 0;
    if (reduce || !target) { el.textContent = OB.fmtNum(target); return; }
    const dur = 1100, start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = OB.fmtNum(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  /* widget no canto superior direito (consultor): foto + pontos + posição */
  refreshRankBadge() {
    const el = document.getElementById('rank-badge'); if (!el) return;
    const u = OB.session(); const r = OB.meuRankingPos(u.id);
    const pts = el.querySelector('#rankb-pts'); if (pts) pts.textContent = OB.fmtNum(r.pontos) + ' pts';
    const pos = el.querySelector('#rankb-pos'); if (pos) pos.textContent = r.posicao ? ('#' + r.posicao + ' de ' + r.total) : 'sem pontos';
    const av = el.querySelector('#rankb-av'); if (av) av.innerHTML = u.foto ? `<img src="${u.foto}" alt="">` : ((u.nome || '?')[0].toUpperCase());
  },

  /* ============================================================
     Chat "Manu" — atendimento consultor ↔ admin (tempo real + som)
     ============================================================ */
  manuAvatar(cls) {
    return `<span class="manu-av ${cls || ''}"><b>M</b>${OB.MANU.foto ? `<img src="${OB.MANU.foto}" alt="Manu" onerror="this.remove()">` : ''}</span>`;
  },
  _ensureAudio() {
    try {
      if (!this._audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this._audioCtx = new AC(); }
      if (this._audioCtx && this._audioCtx.state === 'suspended') this._audioCtx.resume();
    } catch (e) {}
  },
  playPing(urgente) {
    try {
      this._ensureAudio(); const ctx = this._audioCtx; if (!ctx) return;
      const beep = (freq, start, dur) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime + start;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.start(t); o.stop(t + dur + 0.03);
      };
      beep(880, 0, 0.17);
      if (urgente) { beep(1180, 0.20, 0.15); beep(1180, 0.40, 0.15); }
    } catch (e) {}
  },
  _chatChannel: null,
  subscribeChat() {
    if (typeof SB === 'undefined' || !SB.channel) return;
    const u = OB.session(); if (!u) return;
    const isAdmin = u.role === 'admin';
    if (this._chatChannel) { try { SB.removeChannel(this._chatChannel); } catch (e) {} this._chatChannel = null; }
    this._chatChannel = SB.channel('chat-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_mensagens' }, (payload) => {
        const row = payload.new || payload.old; if (!row) return;
        const m = OB._msgIn(row);
        const arr = OB.db.chat || (OB.db.chat = []);
        const i = arr.findIndex(x => x.id === m.id);
        if (payload.eventType === 'DELETE') { if (i >= 0) arr.splice(i, 1); }
        else if (i >= 0) arr[i] = m; else arr.push(m);
        if (payload.eventType === 'INSERT') {
          if (isAdmin && m.autor === 'consultor') {
            this.playPing(m.urgente);
            UI.toast(m.urgente ? 'Mensagem URGENTE' : 'Nova mensagem no atendimento', 'Um consultor te enviou algo. Abra o Atendimento.', m.urgente ? 'err' : 'ok');
          } else if (!isAdmin && m.autor === 'admin' && m.consultorId === u.id) {
            this.playPing(false);
            const p = document.getElementById('chat-panel');
            if (!p || p.hasAttribute('hidden')) UI.toast('Manu respondeu', 'Você recebeu uma nova mensagem no atendimento', 'ok');
          }
        }
        this.refreshChatBadges();
        if (isAdmin && this.current === 'atendimento') Admin.render('atendimento');
        if (!isAdmin) { const p = document.getElementById('chat-panel'); if (p && !p.hasAttribute('hidden')) { this.renderChatPanel(); OB.marcarChatLido(u.id, 'admin').then(() => this.refreshChatBadges()); } }
      })
      .subscribe();
  },
  unsubscribeChat() { if (this._chatChannel) { try { SB.removeChannel(this._chatChannel); } catch (e) {} this._chatChannel = null; } },
  refreshChatBadges() {
    const u = OB.session(); if (!u) return;
    if (u.role === 'admin') {
      const b = document.getElementById('atend-badge'); if (!b) return;
      const n = OB.chatNaoLidasAdmin();
      b.textContent = n; b.classList.toggle('hidden', !n); b.classList.toggle('badge-urgent', OB.chatUrgentesAdmin() && n > 0);
    } else {
      const b = document.getElementById('chat-fab-badge'); if (!b) return;
      const n = OB.chatNaoLidasConsultor(u.id);
      b.textContent = n; b.classList.toggle('hidden', !n);
    }
  },
  mountChatWidget() {
    const old = document.getElementById('chat-widget'); if (old) old.remove();
    const host = document.createElement('div'); host.id = 'chat-widget';
    host.innerHTML = `
      <div class="chat-panel" id="chat-panel" hidden>
        <div class="chat-head">
          <div class="chat-head__id">${this.manuAvatar('chat-head__av')}<div class="chat-head__nm"><b>${OB.MANU.nome}</b><span>${OB.MANU.cargo}</span></div></div>
          <div class="chat-head__acts">
            <button class="chat-close" id="chat-close" type="button" aria-label="Fechar">${UI.icon('x',18)}</button>
          </div>
        </div>
        <div class="chat-msgs" id="chat-msgs"></div>
        <div class="chat-confirm" id="chat-confirm" hidden>
          <span>Encerrar esta conversa e começar uma nova? O histórico fica salvo com a OutBox.</span>
          <button type="button" class="btn brand sm" id="chat-do">Encerrar</button>
        </div>
        <div class="chat-inputbar">
          <label class="chat-urg"><input type="checkbox" id="chat-urg"><span>Marcar como urgente</span></label>
          <div class="chat-inputrow">
            <textarea id="chat-text" rows="1" placeholder="Tire dúvidas, peça algo ou dê sugestões..."></textarea>
            <button class="chat-send" id="chat-send" type="button" aria-label="Enviar">${UI.icon('send',18)}</button>
          </div>
        </div>
      </div>
      <button class="chat-fab" id="chat-fab" type="button" title="Tirar dúvidas e sugestões com a Manu">
        ${this.manuAvatar('chat-fab__av')}
        <span class="chat-fab__txt">Dúvidas e sugestões</span>
        <span class="chat-fab__badge hidden" id="chat-fab-badge"></span>
      </button>`;
    document.body.appendChild(host);
    document.getElementById('chat-fab').onclick = () => this.toggleChat();
    document.getElementById('chat-close').onclick = () => this.toggleChat(false);
    document.getElementById('chat-send').onclick = () => this.sendChatMsg();
    // encerrar a conversa atual (some para o consultor, fica salva com o admin) e começar uma nova
    document.getElementById('chat-do').onclick = async () => {
      const cf = document.getElementById('chat-confirm'); if (cf) cf.hidden = true;
      await OB.encerrarConversa(OB.session().id);
      this.renderChatPanel(); this.refreshChatBadges();
      UI.toast('Conversa encerrada', 'Pode iniciar uma nova quando quiser', 'ok');
    };
    const ta = document.getElementById('chat-text');
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendChatMsg(); } });
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px'; });
    this.refreshChatBadges();
  },
  toggleChat(force) {
    const p = document.getElementById('chat-panel'); if (!p) return;
    const w = document.getElementById('chat-widget');
    const open = force !== undefined ? force : p.hasAttribute('hidden');
    if (open) {
      if (w) w.classList.add('open');           // esconde o FAB, o painel toma o lugar
      p.removeAttribute('hidden'); requestAnimationFrame(() => p.classList.add('show'));
      this.renderChatPanel(); this._ensureAudio();
      OB.marcarChatLido(OB.session().id, 'admin').then(() => this.refreshChatBadges());
      setTimeout(() => { const t = document.getElementById('chat-text'); if (t) t.focus(); }, 60);
    } else {
      if (w) w.classList.remove('open');
      p.classList.remove('show'); setTimeout(() => p.setAttribute('hidden', ''), 200);
    }
  },
  chatBubble(m, mine, themAv, arch) {
    const hora = new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const txt = (m.texto || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    return `<div class="chat-b ${mine ? 'me' : 'them'}${arch ? ' arch' : ''}">${!mine ? (themAv || this.manuAvatar('chat-b__av')) : ''}<div class="chat-b__body">${m.urgente ? '<span class="chat-urg-tag">Urgente</span>' : ''}<p>${txt}</p><time>${hora}</time></div></div>`;
  },
  renderChatPanel() {
    const box = document.getElementById('chat-msgs'); if (!box) return;
    const u = OB.session(); const msgs = OB.chatDoConsultor(u.id);
    box.innerHTML = msgs.length ? msgs.map(m => this.chatBubble(m, m.autor === 'consultor')).join('')
      : `<div class="chat-empty">${this.manuAvatar('chat-empty__av')}<p>Oi! Eu sou a <b>Manu</b> 👋<br>Me conta sua dúvida, peça algo ou mande uma sugestão. Se for urgente, marque a caixinha antes de enviar.</p></div>`;
    const cf = document.getElementById('chat-confirm'); if (cf) cf.hidden = !msgs.length;
    box.scrollTop = box.scrollHeight;
  },
  async sendChatMsg() {
    const ta = document.getElementById('chat-text'), urg = document.getElementById('chat-urg');
    const texto = (ta.value || '').trim(); if (!texto) return;
    const urgente = urg.checked; const u = OB.session();
    ta.value = ''; ta.style.height = 'auto'; urg.checked = false;
    await OB.enviarMensagem({ consultorId: u.id, autor: 'consultor', texto, urgente });
    this.renderChatPanel();
  },

  logout() {
    UI.confirm('Sair da conta', 'Deseja realmente sair?', async () => {
      try {
        this.unsubscribeAviso();
        this.unsubscribeProjetos();
        this.unsubscribeChat();
        { const w = document.getElementById('chat-widget'); if (w) w.remove(); }
        if (this._presTimer) { clearInterval(this._presTimer); this._presTimer = null; }
        if (this._fuTimer) { clearInterval(this._fuTimer); this._fuTimer = null; }
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
