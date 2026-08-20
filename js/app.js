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
    // página pública do BRIEFING (cliente preenche; ao enviar cai em tempo real no painel do admin)
    if (qs.get('briefing')) { return this.renderBriefingPublico(qs.get('briefing'), qs.get('t'), qs.get('p')); }

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
  /* ---------- portão do grupo de consultores no WhatsApp ----------
     Aparece depois do aceite dos termos: o consultor abre o grupo e confirma a entrada.
     Só libera o "Já entrei" depois que ele clicou em abrir (evita pular sem ver o grupo). */
  showGrupoGate() {
    document.getElementById('auth').style.display = 'none';
    const app = document.getElementById('app'); if (app) app.style.display = 'none';
    const old = document.getElementById('grupo-gate'); if (old) old.remove();
    const host = document.createElement('div');
    host.id = 'grupo-gate';
    host.innerHTML = `
      <div class="gg-card">
        <div class="gg-mark">${UI.icon('whats', 30)}</div>
        <h2>Entre no grupo dos consultores</h2>
        <p>É no grupo do WhatsApp que a OutBox solta as <b>novidades</b>, os <b>materiais novos</b> e as <b>oportunidades</b>. É lá também que rola o <b>networking</b> entre consultores e onde você manda suas <b>sugestões</b>. Participar é parte do programa.</p>
        <ul class="gg-list">
          <li>${UI.icon('megaphone',16)}<span>Avisos e novidades em primeira mão</span></li>
          <li>${UI.icon('clients',16)}<span>Networking com os outros consultores</span></li>
          <li>${UI.icon('creative',16)}<span>Materiais, campanhas e dicas de venda</span></li>
        </ul>
        <a class="btn brand block gg-open" id="gg-abrir" href="${OB.GRUPO_WHATS}" target="_blank" rel="noopener">${UI.icon('whats',18)} Abrir o grupo no WhatsApp</a>
        <button class="btn green block" id="gg-ok" disabled>${UI.icon('check',16)} Já entrei no grupo, continuar</button>
        <div class="gg-hint" id="gg-hint">Toque em <b>“Abrir o grupo no WhatsApp”</b> para liberar o botão de continuar.</div>
        <button class="gg-sair" id="gg-sair">Sair da conta</button>
      </div>`;
    document.body.appendChild(host);
    const ok = document.getElementById('gg-ok');
    const hint = document.getElementById('gg-hint');
    document.getElementById('gg-abrir').onclick = () => {
      ok.disabled = false;
      hint.innerHTML = 'Depois de entrar no grupo, volte aqui e confirme para continuar.';
      hint.classList.add('on');
    };
    ok.onclick = () => {
      OB.confirmarGrupoWhats();
      host.remove();
      this.boot();
      UI.toast('Bem-vindo ao grupo!', 'Fique de olho: as novidades e oportunidades saem por lá.', 'ok');
    };
    document.getElementById('gg-sair').onclick = () => Auth.logout();
  },

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
    host.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#F15532,#e0431f);font-family:Inter,system-ui,sans-serif;overflow:auto';
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
    document.body.appendChild(host);
    if (!saleId || !token) { host.innerHTML = card(alert, '#dc2626', 'Link inválido', 'Este link de aceite está incompleto. Peça ao seu consultor para reenviar a proposta.'); return; }

    // carrega o resumo da proposta (RPC pública) e mostra tudo: serviços, bônus e valores por forma
    host.innerHTML = card(spinner, '#F15532', 'Carregando proposta...', 'Um instante, estamos buscando os detalhes.');
    let info = null;
    try { const { data, error } = await SB.rpc('proposta_publica', { p_sale: saleId, p_token: token }); if (error) throw error; info = data; } catch (e) { info = null; }
    if (!info || !info.ok) { host.innerHTML = card(alert, '#dc2626', 'Link inválido', 'Este link de aceite não confere ou expirou. Peça ao seu consultor para reenviar a proposta.'); return; }
    if (info.status_proposta === 'aprovada') {
      host.innerHTML = card(check, '#16a34a', 'Proposta já aceita',
        'Esta proposta já estava confirmada' + (info.forma_aceite ? ' (' + (info.forma_aceite === 'cartao' ? 'Cartão em ' + (info.parcelas_aceite || 1) + 'x' : 'PIX à vista') + ')' : '') + '. Seu consultor foi avisado e dará seguimento ao projeto.',
        '<p style="margin-top:18px;font-size:13px;color:#8a96a3">OutBox Soluções Digitais</p>');
      return;
    }
    const m = info.moeda || 'BRL';
    let produtosAc = []; try { produtosAc = JSON.parse(info.produtos || '[]'); } catch (e) { produtosAc = []; }
    if (!Array.isArray(produtosAc)) produtosAc = [];
    const bonusAc = info.bonus_status === 'recusado' ? [] : (info.bonus || '').split(',').map(x => x.trim()).filter(Boolean);
    const bruto = Number(info.valor_bruto) || 0;
    const desc = info.desconto_tipo === 'percent' ? Number(info.desconto_valor || 0) : 0;
    const negociado = Math.round(bruto * (1 - desc / 100));
    const pixCalc = OB.calcPagamento(negociado, 'pix', { pixDesconto: !!info.pix_desconto });
    const cartaoCalc = n => OB.calcPagamento(negociado, 'cartao', { parcelas: n });
    // cartões de parcela (toque grande, valor por parcela + total) em vez de <select>
    const parcChips = Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
      const c = cartaoCalc(n);
      const semJuros = c.valorCliente <= negociado + 1;
      return `<button type="button" class="ac-chip" data-n="${n}" role="radio" aria-checked="false" aria-label="${n} vezes de ${OB.money(c.valorParcela, m)}, total ${OB.money(c.valorCliente, m)}">
        <b>${n}x</b><span>${OB.money(c.valorParcela, m)}</span><i class="ac-chip-tag ${semJuros ? 'sj' : 'cj'}">${semJuros ? 'sem juros' : 'total ' + OB.money(c.valorCliente, m)}</i>
      </button>`;
    }).join('');

    // documento COMPLETO da proposta (mesmo layout do orçamento) dentro de um iframe isolado
    const saleObj = {
      id: saleId, acceptToken: token,
      produtos: produtosAc, bonus: bonusAc, bonusStatus: info.bonus_status,
      valorBruto: bruto, valor: Number(info.valor) || bruto, moeda: m,
      descontoTipo: info.desconto_tipo, descontoValor: Number(info.desconto_valor) || 0,
      pixDesconto: !!info.pix_desconto, formaAceite: info.forma_aceite,
      parcelasAceite: info.parcelas_aceite, statusProposta: info.status_proposta, linkPagamento: '',
    };
    const cliObj = { nome: info.cliente || '', contato: info.cliente_contato || '', telefone: info.cliente_telefone || '', porte: 'pequena' };
    const uObj = { nome: info.consultor || '', sobrenome: '', email: info.consultor_email || '', celular: info.consultor_celular || '' };
    let docHTML = '';
    try { docHTML = Consultor.buildOrcamentoHTML(saleObj, { cli: cliObj, u: uObj, publico: true }); } catch (e) { docHTML = ''; }

    host.style.background = '#e9edf1';
    host.style.display = 'block';
    host.style.padding = '0';
    host.innerHTML = `
      <style>
        #aceite-page .ac-wrap{width:100%;max-width:860px;margin:0 auto;padding:24px 16px 160px}
        #aceite-page .ac-doc{width:100%;border:none;border-radius:16px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.12);display:block;min-height:70vh}
        #aceite-page .ac-bar{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid #e2e7ec;box-shadow:0 -8px 30px rgba(0,0,0,.1);z-index:5}
        #aceite-page .ac-bi{max-width:860px;margin:0 auto;padding:16px}
        #aceite-page .ac-lbl{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#8a96a3;margin:0 0 9px}
        #aceite-page .ac-forms{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
        #aceite-page .ac-opt{flex:1;min-width:200px;display:flex;align-items:center;gap:11px;border:1.5px solid #e2e7ec;border-radius:13px;padding:13px 15px;cursor:pointer;background:#fff;text-align:left;font-family:inherit;transition:border-color .18s,background .18s,box-shadow .18s}
        #aceite-page .ac-opt:hover{border-color:#f7b6a5}
        #aceite-page .ac-opt[aria-pressed="true"]{border-color:#F15532;background:#fff5f2;box-shadow:0 4px 14px rgba(241,85,50,.14)}
        #aceite-page .ac-opt:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(241,85,50,.28)}
        #aceite-page .ac-radio{width:20px;height:20px;border-radius:50%;border:2px solid #cdd5dd;flex:none;position:relative;transition:border-color .18s}
        #aceite-page .ac-opt[aria-pressed="true"] .ac-radio{border-color:#F15532}
        #aceite-page .ac-opt[aria-pressed="true"] .ac-radio::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#F15532}
        #aceite-page .ac-otxt{flex:1;min-width:0}
        #aceite-page .ac-opt b{font-size:14.5px;color:#0A0A0A;display:block;line-height:1.3}
        #aceite-page .ac-opt .ac-sub{font-size:12px;color:#8a96a3;font-weight:400}
        #aceite-page .ac-oval{font-size:15px;font-weight:800;color:#0A0A0A;white-space:nowrap}
        #aceite-page .ac-opt[data-forma="pix"][aria-pressed="true"] .ac-oval{color:#16a34a}
        #aceite-page .ac-parc{margin:0 0 12px;animation:acfade .22s ease both}
        @keyframes acfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        #aceite-page .ac-parc-h{font-size:12.5px;font-weight:700;color:#46505c;margin:0 0 9px}
        #aceite-page .ac-chips{display:flex;gap:9px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
        #aceite-page .ac-chips::-webkit-scrollbar{height:5px}
        #aceite-page .ac-chips::-webkit-scrollbar-thumb{background:#d6dde3;border-radius:99px}
        #aceite-page .ac-chip{flex:0 0 auto;min-width:92px;scroll-snap-align:start;display:flex;flex-direction:column;align-items:flex-start;gap:1px;border:1.5px solid #e2e7ec;border-radius:12px;padding:10px 13px;background:#fff;cursor:pointer;font-family:inherit;transition:border-color .16s,background .16s,box-shadow .16s}
        #aceite-page .ac-chip:hover{border-color:#f7b6a5}
        #aceite-page .ac-chip[aria-checked="true"]{border-color:#F15532;background:#fff5f2;box-shadow:0 4px 12px rgba(241,85,50,.16)}
        #aceite-page .ac-chip:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(241,85,50,.28)}
        #aceite-page .ac-chip b{font-size:16px;font-weight:800;color:#0A0A0A;line-height:1.1}
        #aceite-page .ac-chip span{font-size:12.5px;color:#46505c;font-weight:600}
        #aceite-page .ac-chip-tag{font-style:normal;font-size:10.5px;font-weight:700;margin-top:2px;white-space:nowrap}
        #aceite-page .ac-chip-tag.sj{color:#15803d}
        #aceite-page .ac-chip-tag.cj{color:#8a96a3}
        #aceite-page .ac-plan{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#f6f8fa;border:1px solid #e6eaef;border-radius:11px;padding:11px 14px;font-size:13.5px;color:#46505c}
        #aceite-page .ac-plan b{color:#0A0A0A;font-size:15px;font-weight:800}
        #aceite-page .ac-btn{width:100%;background:#F15532;color:#fff;border:none;border-radius:13px;padding:16px;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 10px 26px rgba(241,85,50,.3);transition:filter .15s,transform .08s;display:flex;align-items:center;justify-content:center;gap:8px}
        #aceite-page .ac-btn:hover{filter:brightness(1.04)}
        #aceite-page .ac-btn:active{transform:translateY(1px)}
        #aceite-page .ac-btn:disabled{opacity:.7;cursor:default}
        #aceite-page .ac-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:13px;padding:11px 14px;border-radius:10px;margin-bottom:10px}
        @media(max-width:560px){#aceite-page .ac-forms{flex-direction:column}#aceite-page .ac-opt{min-width:0;width:100%}#aceite-page .ac-bi{padding:14px}}
        @media(prefers-reduced-motion:reduce){#aceite-page .ac-parc,#aceite-page .ac-btn,#aceite-page .ac-chip,#aceite-page .ac-opt{animation:none;transition:none}}
      </style>
      <div class="ac-wrap">
        <iframe id="ac-doc" class="ac-doc" title="Proposta OutBox"></iframe>
      </div>
      <div class="ac-bar"><div class="ac-bi">
        <div class="ac-lbl">Escolha como prefere pagar</div>
        <div class="ac-forms" role="radiogroup" aria-label="Forma de pagamento">
          <button type="button" class="ac-opt" data-forma="pix" role="radio" aria-checked="true" aria-pressed="true">
            <span class="ac-radio"></span>
            <span class="ac-otxt"><b>PIX à vista${info.pix_desconto ? ' · 5% off' : ''}</b><span class="ac-sub">Pagamento integral, na hora</span></span>
            <span class="ac-oval">${OB.money(pixCalc.valorCliente, m)}</span>
          </button>
          <button type="button" class="ac-opt" data-forma="cartao" role="radio" aria-checked="false" aria-pressed="false">
            <span class="ac-radio"></span>
            <span class="ac-otxt"><b>Cartão de crédito</b><span class="ac-sub">Parcele em até 12x</span></span>
            <span class="ac-oval" id="ac-cval">até 12x</span>
          </button>
        </div>
        <div class="ac-parc" id="ac-parc" hidden>
          <div class="ac-parc-h">Em quantas vezes quer parcelar?</div>
          <div class="ac-chips" id="ac-chips" role="radiogroup" aria-label="Número de parcelas">${parcChips}</div>
          <div class="ac-plan" id="ac-plan"><span>Escolha o número de parcelas acima</span></div>
        </div>
        <div class="ac-err" id="ac-err" hidden></div>
        <button class="ac-btn" id="ac-ok">Aceitar com PIX · ${OB.money(pixCalc.valorCliente, m)}</button>
      </div></div>`;
    const iframe = document.getElementById('ac-doc');
    iframe.srcdoc = docHTML;
    iframe.onload = () => { try { const h = iframe.contentWindow.document.documentElement.scrollHeight; if (h > 100) iframe.style.height = (h + 6) + 'px'; } catch (e) {} };
    // estado da escolha
    let forma = 'pix';
    let parcelas = 0; // 0 = nenhuma parcela escolhida ainda
    const parcWrap = document.getElementById('ac-parc');
    const okBtn = document.getElementById('ac-ok');
    const cval = document.getElementById('ac-cval');
    const plan = document.getElementById('ac-plan');
    const optBtns = host.querySelectorAll('.ac-opt');
    const chipBtns = host.querySelectorAll('.ac-chip');
    const money = v => OB.money(v, m);
    const atualizarBotao = () => {
      if (forma === 'pix') { okBtn.textContent = `Aceitar com PIX · ${money(pixCalc.valorCliente)}`; return; }
      if (!parcelas) { okBtn.textContent = 'Escolha o número de parcelas'; return; }
      const c = cartaoCalc(parcelas);
      okBtn.textContent = parcelas === 1 ? `Aceitar · à vista no cartão · ${money(c.valorCliente)}` : `Aceitar · ${parcelas}x de ${money(c.valorParcela)}`;
    };
    const selParcela = n => {
      parcelas = n;
      chipBtns.forEach(ch => ch.setAttribute('aria-checked', String(Number(ch.dataset.n) === n)));
      const c = cartaoCalc(n);
      const semJuros = c.valorCliente <= negociado + 1;
      cval.textContent = `${n}x`;
      plan.innerHTML = `<span>${n === 1 ? 'À vista no cartão' : n + 'x de ' + money(c.valorParcela)}${semJuros ? ' · sem juros' : ' · juros do cartão inclusos'}</span><b>${money(c.valorCliente)}</b>`;
      atualizarBotao();
    };
    const setForma = f => {
      forma = f;
      optBtns.forEach(b => { const on = b.dataset.forma === f; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-checked', String(on)); });
      parcWrap.hidden = f !== 'cartao';
      if (f === 'cartao' && !parcelas) selParcela(1);
      atualizarBotao();
    };
    optBtns.forEach(b => b.onclick = () => setForma(b.dataset.forma));
    chipBtns.forEach(ch => ch.onclick = () => selParcela(Number(ch.dataset.n)));
    okBtn.onclick = async () => {
      const parcelasFinal = forma === 'cartao' ? (parcelas || 1) : 1;
      const btn = okBtn; const err = document.getElementById('ac-err');
      btn.disabled = true; btn.textContent = 'Confirmando...';
      const restaura = () => { btn.disabled = false; atualizarBotao(); };
      try {
        const { data, error } = await SB.rpc('aceitar_proposta', { p_sale: saleId, p_token: token, p_forma: forma, p_parcelas: parcelasFinal });
        if (error) throw error;
        if (data && data.ok) {
          host.innerHTML = card(check, '#16a34a', data.ja ? 'Proposta já aceita' : 'Proposta aceita! 🎉',
            data.ja ? 'Esta proposta já estava confirmada. O seu consultor foi avisado e dará seguimento ao projeto.'
              : 'Obrigado! Registramos o seu aceite e a forma de pagamento escolhida. O consultor já foi notificado e em breve iniciamos o seu projeto.',
            '<p style="margin-top:18px;font-size:13px;color:#8a96a3">OutBox Soluções Digitais · obrigado pela confiança</p>');
        } else {
          err.textContent = (data && data.erro === 'token') ? 'Este link de aceite não confere. Peça ao consultor para reenviar.' : 'Proposta não encontrada. Fale com o seu consultor.';
          err.hidden = false; restaura();
        }
      } catch (e) {
        err.textContent = 'Não foi possível confirmar agora. Tente novamente. (' + ((e && e.message) || 'falha') + ')';
        err.hidden = false; restaura();
      }
    };
  },

  /* ---------- página pública do briefing (tela cheia, capa por tipo + etapas) ---------- */
  async renderBriefingPublico(pid, token, tipo) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    const host = document.createElement('div'); host.id = 'briefing-page';
    host.style.cssText = 'position:fixed;inset:0;overflow:hidden;background:#f5f7f9;font-family:Inter,system-ui,sans-serif;z-index:200';
    document.body.appendChild(host);
    if (!pid || !token) { host.innerHTML = this._ctMsg('#dc2626', 'Link inválido', 'Este link de briefing está incompleto. Peça ao seu consultor para reenviar.'); return; }
    const self = this;
    const tipoNome = OB.briefingTipoNome(tipo);
    const intro = OB.briefingIntro(tipo);
    const secs = OB.briefingCampos(tipo);
    const total = secs.length;
    const answers = {};
    const markW = `<svg viewBox="0 0 439 439" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="120" fill="#fff"/><path fill="#F15532" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#F15532" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const markB = `<svg viewBox="0 0 439 439" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="120" fill="#F15532"/><path fill="#fff" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#fff" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const style = `<style>
      #briefing-page *{box-sizing:border-box}
      #briefing-page .bfx-cover{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:28px;background:radial-gradient(120% 90% at 50% -10%,#ff6f4d 0%,#F15532 45%,#d83f1e 100%);overflow:auto}
      #briefing-page .bfx-ci{max-width:560px;width:100%;text-align:center;color:#fff}
      #briefing-page .bfx-brand{display:inline-flex;align-items:center;gap:9px;margin-bottom:34px;font-weight:700;font-size:13.5px;letter-spacing:.03em}
      #briefing-page .bfx-emoji{font-size:54px;line-height:1;margin-bottom:16px}
      #briefing-page .bfx-cover h1{font-size:33px;line-height:1.14;font-weight:800;letter-spacing:-.02em;margin:0 0 12px}
      #briefing-page .bfx-frase{font-size:16px;line-height:1.6;color:rgba(255,255,255,.93);margin:0 0 26px}
      #briefing-page .bfx-prev{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px}
      #briefing-page .bfx-chip{font-size:12.5px;font-weight:600;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.26);border-radius:999px;padding:7px 14px;color:#fff}
      #briefing-page .bfx-start{background:#fff;color:#F15532;border:none;border-radius:14px;padding:17px 42px;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 14px 36px rgba(0,0,0,.2);transition:transform .12s,box-shadow .2s}
      #briefing-page .bfx-start:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(0,0,0,.26)}
      #briefing-page .bfx-mini{font-size:12.5px;color:rgba(255,255,255,.82);margin-top:16px}
      #briefing-page .bfx-form{position:fixed;inset:0;display:flex;flex-direction:column;background:#f5f7f9}
      #briefing-page .bfx-top{background:#fff;border-bottom:1px solid #e6eaef;flex:0 0 auto}
      #briefing-page .bfx-bar{height:4px;background:#eef1f4}
      #briefing-page .bfx-bar-fill{height:100%;background:#F15532;transition:width .35s ease}
      #briefing-page .bfx-toprow{display:flex;align-items:center;gap:10px;padding:13px 20px;max-width:660px;margin:0 auto;width:100%}
      #briefing-page .bfx-toprow b{font-size:14px;font-weight:800}
      #briefing-page .bfx-count{font-size:12.5px;font-weight:700;color:#8a96a3;margin-left:auto}
      #briefing-page .bfx-main{flex:1 1 auto;overflow:auto;padding:28px 20px 40px}
      #briefing-page .bfx-mi{max-width:660px;margin:0 auto;width:100%;animation:bfxin .35s ease both}
      @keyframes bfxin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      #briefing-page .bfx-eyebrow{font-size:12.5px;font-weight:700;color:#F15532;margin-bottom:6px}
      #briefing-page .bfx-main h2{font-size:25px;font-weight:800;color:#0A0A0A;letter-spacing:-.01em;margin:0 0 22px}
      #briefing-page .bfx-field{margin-bottom:18px}
      #briefing-page .bfx-field label{display:block;font-size:14px;font-weight:600;color:#0A0A0A;margin-bottom:7px}
      #briefing-page .bfx-req{color:#F15532}
      #briefing-page .bfx-field input,#briefing-page .bfx-field textarea{width:100%;box-sizing:border-box;border:1px solid #e2e7ec;border-radius:12px;padding:14px 15px;font-size:16px;font-family:inherit;color:#0A0A0A;background:#fff;transition:border-color .15s,box-shadow .15s;resize:vertical}
      #briefing-page .bfx-field input:focus,#briefing-page .bfx-field textarea:focus{outline:none;border-color:#F15532;box-shadow:0 0 0 3px rgba(241,85,50,.14)}
      #briefing-page .bfx-field .inv{border-color:#dc2626;background:#fef2f2}
      #briefing-page .bfx-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:13.5px;padding:12px 14px;border-radius:10px;margin-top:8px}
      #briefing-page .bfx-bottom{background:#fff;border-top:1px solid #e6eaef;flex:0 0 auto}
      #briefing-page .bfx-bi{display:flex;align-items:center;gap:12px;padding:14px 20px;max-width:660px;margin:0 auto;width:100%}
      #briefing-page .bfx-btn{border:none;border-radius:12px;padding:15px 28px;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:filter .15s}
      #briefing-page .bfx-btn.brand{background:#F15532;color:#fff;box-shadow:0 8px 20px rgba(241,85,50,.26);margin-left:auto}
      #briefing-page .bfx-btn.brand:hover{filter:brightness(1.05)}
      #briefing-page .bfx-btn.brand:disabled{opacity:.7;cursor:default}
      #briefing-page .bfx-btn.ghost{background:#eef1f4;color:#46505c}
      #briefing-page .bfx-chips{display:flex;flex-wrap:wrap;gap:8px;padding:2px;border-radius:12px}
      #briefing-page .bfx-chips.inv{outline:2px solid #dc2626;outline-offset:3px}
      #briefing-page .bfx-chip2{border:1.5px solid #e2e7ec;background:#fff;color:#46505c;border-radius:999px;padding:9px 15px;font-size:13.5px;font-family:inherit;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s,color .15s,transform .08s}
      #briefing-page .bfx-chip2:hover{border-color:#f7b6a5}
      #briefing-page .bfx-chip2:active{transform:scale(.97)}
      #briefing-page .bfx-chip2.on{background:#F15532;border-color:#F15532;color:#fff;box-shadow:0 4px 12px rgba(241,85,50,.28)}
      #briefing-page .bfx-sel{font-size:12.5px;color:#8a96a3;margin-top:9px;line-height:1.5}
      @media(max-width:520px){#briefing-page .bfx-cover h1{font-size:28px}#briefing-page .bfx-btn{padding:14px 20px}#briefing-page .bfx-chip2{padding:8px 13px;font-size:13px}}
    </style>`;
    // guarda o que foi digitado; chips/radio já gravam direto em `answers`
    const saveInputs = () => host.querySelectorAll('[data-b]').forEach(el => { answers[el.getAttribute('data-b')] = el.value; });
    const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const selecionados = id => (answers[id] || '').split(' · ').map(x => x.trim()).filter(Boolean);
    const fieldHTML = c => {
      const lbl = `<label>${c.label}${c.req ? ' <span class="bfx-req">*</span>' : ''}</label>`;
      // múltipla escolha (chips) e escolha única: clicáveis, sem digitação
      if (c.tipo === 'chips' || c.tipo === 'radio') {
        const ops = OB.briefingOps(c.ops);
        const sel = selecionados(c.id);
        const chips = ops.map(o => `<button type="button" class="bfx-chip2${sel.indexOf(o) >= 0 ? ' on' : ''}" data-chip="${c.id}" data-val="${esc(o)}">${o}</button>`).join('');
        return `<div class="bfx-field" data-multi="${c.tipo === 'chips' ? 1 : 0}">${lbl}
          <div class="bfx-chips" data-chipgroup="${c.id}">${chips}</div>
          <div class="bfx-sel" id="sel-${c.id}">${sel.length ? sel.join(' · ') : 'Nenhuma opção selecionada'}</div></div>`;
      }
      if (c.tipo === 'textarea') return `<div class="bfx-field">${lbl}<textarea data-b="${c.id}" rows="3">${esc(answers[c.id])}</textarea></div>`;
      return `<div class="bfx-field">${lbl}<input data-b="${c.id}" type="text" value="${esc(answers[c.id])}"/></div>`;
    };
    // liga os chips depois de cada render de etapa
    const wireChips = () => host.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => {
      const id = b.dataset.chip, val = b.dataset.val;
      const multi = b.closest('.bfx-field').dataset.multi === '1';
      let sel = selecionados(id);
      if (multi) sel = sel.indexOf(val) >= 0 ? sel.filter(x => x !== val) : sel.concat([val]);
      else sel = sel.indexOf(val) >= 0 ? [] : [val];
      answers[id] = sel.join(' · ');
      salvarRascunho();
      host.querySelectorAll(`[data-chipgroup="${id}"] .bfx-chip2`).forEach(x => x.classList.toggle('on', sel.indexOf(x.dataset.val) >= 0));
      const box = document.getElementById('sel-' + id);
      if (box) box.textContent = sel.length ? sel.join(' · ') : 'Nenhuma opção selecionada';
    });
    /* Rascunho local. Antes, as respostas viviam só na memória da página:
       qualquer erro de envio, recarregamento ou toque em Voltar apagava tudo
       que o cliente tinha digitado. Agora cada resposta é guardada no próprio
       aparelho dele e devolvida quando ele reabre o link. */
    const RASCUNHO = 'ob_briefing_' + pid;
    const salvarRascunho = () => { try { localStorage.setItem(RASCUNHO, JSON.stringify({ respostas: answers, etapa: step, em: Date.now() })); } catch (e) {} };
    const limparRascunho = () => { try { localStorage.removeItem(RASCUNHO); } catch (e) {} };
    let retomando = 0;
    try {
      const bruto = localStorage.getItem(RASCUNHO);
      if (bruto) { const r = JSON.parse(bruto);
        if (r && r.respostas) { Object.keys(r.respostas).forEach(k => { answers[k] = r.respostas[k]; }); retomando = r.etapa || 0; } }
    } catch (e) {}
    /* fechar a aba, girar o telefone ou trocar de aplicativo no celular
       também precisa gravar: é quando mais se perde preenchimento */
    const gravarAoSair = () => { try { saveInputs(); } catch (e) {} salvarRascunho(); };
    window.addEventListener('beforeunload', gravarAoSair);
    window.addEventListener('pagehide', gravarAoSair);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') gravarAoSair(); });
    let step = 0;
    const renderCover = () => {
      host.innerHTML = style + `
        <div class="bfx-cover"><div class="bfx-ci">
          <div class="bfx-brand">${markW}<span>Briefing OutBox</span></div>
          <div class="bfx-emoji">${intro.emoji}</div>
          <h1>${intro.titulo}</h1>
          <p class="bfx-frase">${intro.frase}</p>
          <div class="bfx-prev">${secs.map((s, i) => `<span class="bfx-chip">${i + 1}. ${s.sec}</span>`).join('')}</div>
          <button class="bfx-start" id="bfx-start">${retomando ? 'Continuar o briefing' : 'Começar o briefing'}</button>
          <p class="bfx-mini">${retomando ? 'Encontramos o seu preenchimento salvo. Você volta na etapa ' + retomando + '.' : 'Leva poucos minutos · ' + total + ' etapa' + (total > 1 ? 's' : '')}</p>
        </div></div>`;
      document.getElementById('bfx-start').onclick = () => { step = retomando && retomando <= total ? retomando : 1; renderStep(); };
    };
    const submit = async () => {
      const linhas = [];
      secs.forEach(s => { const parts = []; s.campos.forEach(c => { const val = (answers[c.id] || '').trim(); if (val) parts.push('• ' + c.label + ': ' + val); }); if (parts.length) { linhas.push(s.sec.toUpperCase()); linhas.push(parts.join('\n')); linhas.push(''); } });
      const texto = linhas.join('\n').trim();
      const btn = document.getElementById('bfx-next'); const err = document.getElementById('bfx-err');
      btn.disabled = true; btn.textContent = 'Enviando...';
      try {
        const { data, error } = await SB.rpc('salvar_briefing', { p_pid: pid, p_token: token, p_respostas: texto });
        if (error) throw error;
        if (data && data.ok) { limparRascunho(); host.innerHTML = self._ctMsg('#16a34a', 'Briefing enviado! 🎉', 'Recebemos as suas respostas. A OutBox já foi notificada e vai iniciar a produção do seu projeto. Em breve o seu consultor entra em contato.'); }
        else {
          salvarRascunho();
          err.innerHTML = 'Este link não está mais válido. <b>Suas respostas foram salvas neste aparelho</b>, nada se perdeu: peça um link novo ao seu consultor e abra nele, que o formulário volta preenchido.';
          err.hidden = false; btn.disabled = false; btn.textContent = 'Tentar enviar de novo';
        }
      } catch (e) {
        salvarRascunho();
        err.innerHTML = 'Não foi possível enviar agora. <b>Suas respostas estão salvas neste aparelho</b>, pode tentar de novo em instantes. (' + ((e && e.message) || 'erro') + ')';
        err.hidden = false; btn.disabled = false; btn.textContent = 'Tentar enviar de novo';
      }
    };
    const renderStep = () => {
      const sec = secs[step - 1];
      const pct = Math.round((step / total) * 100);
      host.innerHTML = style + `
        <div class="bfx-form">
          <div class="bfx-top">
            <div class="bfx-bar"><div class="bfx-bar-fill" style="width:${pct}%"></div></div>
            <div class="bfx-toprow">${markB}<b>OutBox</b><span class="bfx-count">Etapa ${step} de ${total}</span></div>
          </div>
          <div class="bfx-main"><div class="bfx-mi">
            <div class="bfx-eyebrow">${intro.emoji} Briefing · ${tipoNome}</div>
            <h2>${sec.sec}</h2>
            ${sec.campos.map(fieldHTML).join('')}
            <div class="bfx-err" id="bfx-err" hidden></div>
          </div></div>
          <div class="bfx-bottom"><div class="bfx-bi">
            ${step > 1 ? `<button class="bfx-btn ghost" id="bfx-prev">Voltar</button>` : '<span></span>'}
            <button class="bfx-btn brand" id="bfx-next">${step === total ? 'Enviar briefing' : 'Próximo'}</button>
          </div></div>
        </div>`;
      wireChips();
      // cada tecla digitada já entra no rascunho, com uma folga para não gravar a cada letra
      let aguardando = null;
      host.querySelectorAll('[data-b]').forEach(el => {
        el.addEventListener('input', () => {
          answers[el.getAttribute('data-b')] = el.value;
          clearTimeout(aguardando);
          aguardando = setTimeout(salvarRascunho, 400);
        });
      });
      const prev = document.getElementById('bfx-prev'); if (prev) prev.onclick = () => { saveInputs(); salvarRascunho(); step--; renderStep(); };
      document.getElementById('bfx-next').onclick = async () => {
        let ok = true;
        sec.campos.forEach(c => {
          if (!c.req) return;
          if (c.tipo === 'chips' || c.tipo === 'radio') { // obrigatório = ao menos uma opção marcada
            const grupo = host.querySelector('[data-chipgroup="' + c.id + '"]');
            const vazio = !(answers[c.id] || '').trim();
            if (grupo) grupo.classList.toggle('inv', vazio);
            if (vazio) ok = false;
            return;
          }
          const el = host.querySelector('[data-b="' + c.id + '"]'); if (el && !el.value.trim()) { ok = false; el.classList.add('inv'); } else if (el) el.classList.remove('inv');
        });
        // grava o que já foi digitado ANTES de julgar a etapa: se a validação
        // barrasse primeiro, tudo que o cliente escreveu nesta tela se perdia
        saveInputs();
        salvarRascunho();
        if (!ok) { const e = document.getElementById('bfx-err'); e.textContent = 'Preencha os campos obrigatórios (*).'; e.hidden = false; return; }
        if (step < total) { step++; renderStep(); salvarRascunho(); document.querySelector('.bfx-main').scrollTop = 0; }
        else await submit();
      };
      const first = host.querySelector('[data-b]'); if (first) setTimeout(() => first.focus(), 80);
    };
    renderCover();
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
  /* ---------- barra de abas inferior (só no celular, estilo app) ----------
     Monta a partir de mod().TABS + um botão "Mais" que abre o menu completo. */
  tabBarHTML(nav) {
    const tabs = (this.mod().TABS || []).map(id => nav.find(n => n.id === id)).filter(Boolean);
    if (!tabs.length) return '';
    const curto = { 'Visão Geral': 'Início', 'Painel Geral': 'Início', 'Meus Clientes': 'Clientes',
      'Funil de Vendas': 'Funil', 'Vendas & Comissão': 'Comissão', 'Loja OutBox': 'Loja' };
    return `<nav class="tabbar" id="tabbar" aria-label="Navegação principal">
      ${tabs.map(t => `<button class="tab-item" data-tab="${t.id}" aria-label="${t.label}">
        ${UI.icon(t.icon, 22)}<span>${curto[t.label] || t.label}</span>
        ${t.id === 'funil' ? '<i class="tab-dot hidden" id="tab-fu"></i>' : ''}
        ${t.id === 'financeiro' ? '<i class="tab-dot hidden" id="tab-fin"></i>' : ''}</button>`).join('')}
      <button class="tab-item" data-tab-mais aria-label="Mais opções">${UI.icon('menu', 22)}<span>Mais</span></button>
    </nav>`;
  },
  /* marca a aba ativa (e destaca "Mais" quando a tela atual não está nas abas) */
  syncTabBar(viewId) {
    const bar = document.getElementById('tabbar'); if (!bar) return;
    const tabs = this.mod().TABS || [];
    bar.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === viewId));
    const mais = bar.querySelector('[data-tab-mais]');
    if (mais) mais.classList.toggle('on', tabs.indexOf(viewId) < 0);
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

  mod() { return OB.painelAtual() === 'admin' ? Admin : Consultor; },

  /* ---------- boot do app logado ---------- */
  boot(goProfile) {
    const u = OB.session();
    const isAdmin = OB.painelAtual() === 'admin';
    // portão do grupo: o consultor precisa entrar no grupo do WhatsApp antes de usar o sistema
    if (!isAdmin && OB.precisaEntrarGrupo()) { this.showGrupoGate(); return; }
    // o menu do admin respeita o cargo do colaborador (dono do sistema vê tudo)
    const nav = this.mod().NAV.filter(n => !isAdmin || OB.podeVer(n.id));
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
            ${nav.map((n, i) => { const prevSec = i > 0 ? (nav[i - 1].sec || '') : ''; const grp = (n.sec && n.sec !== prevSec) ? `<div class="nav-group">${n.sec}</div>` : ''; return `${n.home ? '' : grp}<button class="nav-item" data-view="${n.id}">${UI.icon(n.icon)}<span>${n.label}</span>${n.soon ? '<span class="soon-badge">em breve</span>' : ''}${n.id === 'financeiro' ? '<span class="badge hidden" id="fin-badge"></span>' : ''}${n.id === 'bonus' ? '<span class="badge hidden" id="bonus-badge"></span>' : ''}${n.id === 'funil' ? '<span class="badge hidden" id="fu-badge"></span>' : ''}${n.id === 'projetos' ? '<span class="badge hidden" id="proj-badge"></span>' : ''}${n.id === 'timeline' ? '<span class="badge hidden" id="tl-badge"></span>' : ''}${n.id === 'atendimento' ? '<span class="badge hidden" id="atend-badge"></span>' : ''}</button>${n.home ? '<div class="nav-sep" aria-hidden="true"></div>' : ''}`; }).join('')}
          </nav>
          ${!isAdmin ? `<a class="side-whats" href="https://chat.whatsapp.com/Bv5EM9xjqNkLiQiP3cUfKd" target="_blank" rel="noopener" title="Entrar no grupo de consultores da OutBox no WhatsApp">
            <span class="wa-ico"><svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true"><path fill="#fff" d="M16.003 5.333c-5.888 0-10.667 4.779-10.667 10.667 0 1.88.494 3.72 1.432 5.341L5.333 26.667l5.464-1.433a10.63 10.63 0 0 0 5.203 1.325h.004c5.884 0 10.663-4.779 10.666-10.665a10.6 10.6 0 0 0-3.124-7.545 10.6 10.6 0 0 0-7.543-3.021zm0 19.2h-.003a8.85 8.85 0 0 1-4.51-1.235l-.323-.192-3.351.879.894-3.266-.21-.335a8.83 8.83 0 0 1-1.354-4.716c.002-4.889 3.982-8.868 8.874-8.868a8.81 8.81 0 0 1 6.27 2.599 8.82 8.82 0 0 1 2.597 6.276c-.002 4.889-3.982 8.868-8.874 8.868zm4.867-6.641c-.267-.134-1.578-.779-1.823-.868-.245-.089-.423-.134-.601.134-.178.267-.69.868-.846 1.046-.156.178-.311.2-.578.067-.267-.134-1.126-.415-2.145-1.324-.793-.707-1.328-1.58-1.484-1.847-.156-.267-.017-.411.117-.545.12-.12.267-.311.401-.467.134-.156.178-.267.267-.445.089-.178.045-.334-.022-.467-.067-.134-.601-1.449-.824-1.983-.217-.521-.437-.45-.601-.458l-.512-.009a.98.98 0 0 0-.712.334c-.245.267-.935.913-.935 2.226 0 1.313.957 2.582 1.09 2.76.134.178 1.884 2.876 4.564 4.032.638.276 1.135.44 1.523.563.64.204 1.223.175 1.683.106.514-.077 1.578-.645 1.801-1.269.223-.623.223-1.157.156-1.269-.067-.111-.245-.178-.512-.311z"/></svg></span>
            <span class="wa-txt"><b>Grupo no WhatsApp</b><small>Comunidade de consultores OutBox</small></span>
          </a>` : ''}
          ${OB.podeAlternarPainel() ? `<button class="nav-item vm-btn" id="vm-btn" title="Trocar de painel sem sair da conta (${OB.emailDoPainel(OB.outroPainel())})">${UI.icon(isAdmin ? 'clients' : 'admin')}<span>${isAdmin ? 'Ir para o painel de consultor' : 'Ir para o painel admin'}</span></button>` : ''}
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
                  <button class="commission-pill bv-pill hidden" id="bv-pill" title="Seu bônus de boas-vindas"><span class="bv-pill__ring"></span><div style="text-align:left"><div class="lbl" id="bv-pill-lbl">Bônus de boas-vindas</div><div class="val" id="bv-pill-val">R$ 100,00</div></div>${UI.icon('prize',18)}</button>
                  <button class="commission-pill" id="com-pill" title="Ver o que você pode solicitar"><div style="text-align:left"><div class="lbl" id="com-lbl">Comissão disponível</div><div class="val" id="com-val">R$ 0,00</div></div>${UI.icon('chevron',18)}</button>
                </div>
                <button class="rank-badge" id="rank-badge" title="Seu ranking · clique para ver o Top 10">
                  <span class="rank-badge__av" id="rankb-av"></span>
                  <span class="rank-badge__txt"><b id="rankb-pts">0 pts</b><small id="rankb-pos">#—</small></span>
                </button>`}
            ${OB.podeAlternarPainel() ? `<button class="iconbtn vm-top${isAdmin ? '' : ' on'}" id="vm-top" title="Trocar de painel sem sair da conta (${OB.emailDoPainel(OB.outroPainel())})" aria-label="${isAdmin ? 'Ir para o painel de consultor' : 'Ir para o painel admin'}">${UI.icon(isAdmin ? 'clients' : 'admin', 18)}${isAdmin ? '<span class="vm-top-lb">Painel do consultor</span>' : ''}</button>` : ''}
            ${this.themeBtnHTML()}
          </header>
          <div id="main-view" class="view"></div>
        </div>
        ${this.tabBarHTML(nav)}
      </div>`;

    // binds
    this.bindThemeBtn(app);
    this.refreshSidebarUser();
    if (!isAdmin) { this.refreshCommission(); this.refreshRankBadge(); const rb = document.getElementById('rank-badge'); if (rb) rb.onclick = () => this.go('ranking'); }
    this.refreshBadge();

    document.querySelectorAll('#nav .nav-item').forEach(b => b.onclick = () => this.go(b.dataset.view));
    document.querySelectorAll('.side-legal [data-doc]').forEach(b => b.onclick = () => this.verDocumento(b.dataset.doc));
    document.getElementById('logout-btn').onclick = () => this.logout();
    ['vm-btn', 'vm-top'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.onclick = () => this.trocarPainel();
    });
    document.getElementById('menu-btn').onclick = () => this.drawer(true);
    document.getElementById('scrim').onclick = () => this.drawer(false);
    // abas inferiores (celular)
    document.querySelectorAll('#tabbar [data-tab]').forEach(b => b.onclick = () => this.go(b.dataset.tab));
    const maisBtn = document.querySelector('#tabbar [data-tab-mais]');
    if (maisBtn) maisBtn.onclick = () => this.drawer(true);
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
    this.subscribeCatalogo();
    this.subscribePortfolio();
    // chat Manu: widget flutuante (consultor) + tempo real + som
    if (!isAdmin) this.mountChatWidget();
    this.subscribeChat();
    this.refreshChatBadges();
    if (!this._audioUnlock) { this._audioUnlock = true; const unlock = () => { this._ensureAudio(); document.removeEventListener('pointerdown', unlock, true); }; document.addEventListener('pointerdown', unlock, true); }
    // presença (quem está logado) + lembretes de follow-up
    OB.pingPresenca();
    if (this._presTimer) clearInterval(this._presTimer);
    this._presTimer = setInterval(() => OB.pingPresenca(), 4 * 60 * 1000);
    if (this._fuTimer) { clearInterval(this._fuTimer); this._fuTimer = null; }
    if (!isAdmin) {
      Consultor.checkFollowups();
      this._fuTimer = setInterval(() => Consultor.checkFollowups(), 60 * 1000);
    }
    // portão de perfil: consultor precisa completar e salvar o perfil antes de usar o sistema
    this.perfilLock = OB.precisaCompletarPerfil();
    // consultor já com perfil completo (inclusive os antigos) ativa o bônus de boas-vindas
    if (!this.perfilLock) OB.ativarBonusBV();
    const shell = document.querySelector('.shell');
    if (shell) shell.classList.toggle('perfil-lock', this.perfilLock);
    if (this.perfilLock) { this.go('perfil'); }
    else { this.go(goProfile ? 'perfil' : nav[0].id); }
    // propaganda/pop-up: aparece a CADA login (não em refresh) enquanto a campanha estiver no ar.
    // Se estiver preso no portão de perfil, mantém o flag e mostra ao liberar o perfil.
    if (!isAdmin && this._loginFlow && !this.perfilLock) { this._loginFlow = false; this.showCampanha(); }
  },

  /* ============================================================
     TROCA DE PAINEL (contas vinculadas)
     Muda de admin para consultor e de volta sem sair da conta.
     Com o par configurado, cada painel usa a sua própria conta.
     ============================================================ */
  trocarPainel() {
    if (!OB.podeAlternarPainel()) return;
    const destino = OB.outroPainel();
    // troca instantânea: o cache é da sessão de login e vale para as duas contas do par
    if (!OB.usarPainel(destino)) return UI.toast('Não foi possível trocar', 'Conta do outro painel não encontrada.', 'err');
    this._loginFlow = false;
    this.boot();
    const email = OB.emailDoPainel(destino);
    UI.toast(destino === 'admin' ? 'Painel do administrador' : 'Painel do consultor', email ? 'Usando a conta ' + email : '', 'ok');
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
    OB.ativarBonusBV(); // perfil completo = ativação: começa o prazo do bônus de boas-vindas
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

  /* Realtime do catálogo: produto cadastrado pelo admin aparece na hora para o consultor */
  _catChannel: null,
  subscribeCatalogo() {
    if (typeof SB === 'undefined' || !SB.channel) return;
    if (this._catChannel) { try { SB.removeChannel(this._catChannel); } catch (e) {} this._catChannel = null; }
    this._catChannel = SB.channel('catalogo-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalogo_produtos' }, (payload) => {
        const row = payload.new && payload.new.id ? payload.new : payload.old;
        if (!row) return;
        if (payload.eventType === 'DELETE') {
          const i = OB.PRODUTOS.findIndex(p => p.id === row.id);
          if (i >= 0) OB.PRODUTOS.splice(i, 1);
        } else {
          const p = OB._cpIn(payload.new);
          const i = OB.PRODUTOS.findIndex(x => x.id === p.id);
          const semente = (OB.PRODUTOS_SEMENTE || []).find(x => x.id === p.id);
          const final = semente ? Object.assign({}, semente, p) : p;
          if (i >= 0) OB.PRODUTOS[i] = final; else OB.PRODUTOS.push(final);
          OB.PRODUTOS.sort((a, b) => (a.ordem || 900) - (b.ordem || 900) || a.nome.localeCompare(b.nome));
        }
        if (this.current === 'produtos') this.mod().render('produtos');
      })
      .subscribe();
  },
  unsubscribeCatalogo() {
    if (this._catChannel) { try { SB.removeChannel(this._catChannel); } catch (e) {} this._catChannel = null; }
  },

  /* Realtime do portfólio: o que o admin muda aparece na hora para o consultor */
  _ptChannel: null,
  subscribePortfolio() {
    if (typeof SB === 'undefined' || !SB.channel) return;
    if (this._ptChannel) { try { SB.removeChannel(this._ptChannel); } catch (e) {} this._ptChannel = null; }
    this._ptChannel = SB.channel('portfolio-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_itens' }, (payload) => {
        const row = payload.new && payload.new.id ? payload.new : payload.old;
        if (!row) return;
        const arr = OB.db.portfolio || (OB.db.portfolio = []);
        if (payload.eventType === 'DELETE') {
          OB.db.portfolio = arr.filter(x => x.id !== row.id);
        } else {
          const it = OB._ptIn(payload.new);
          const i = arr.findIndex(x => x.id === it.id);
          if (i >= 0) arr[i] = it; else arr.push(it);
        }
        if (this.current === 'portfolio') this.mod().render('portfolio');
      })
      .subscribe();
  },
  unsubscribePortfolio() {
    if (this._ptChannel) { try { SB.removeChannel(this._ptChannel); } catch (e) {} this._ptChannel = null; }
  },

  /* ---------- badge de projetos (briefings/entregas que pedem atenção) ---------- */
  refreshProjetosBadge() {
    const u = OB.session(); if (!u) return;
    const badge = document.getElementById('proj-badge'); if (!badge) return;
    let n = 0;
    if (u.role === 'admin') n = OB.briefingsPendentesAdmin().length; // briefings recebidos a iniciar
    else n = OB.projetosDe(u.id).filter(p => p.status === 'briefing_recebido' || p.status === 'entregue').length;
    badge.textContent = n; badge.classList.toggle('hidden', n === 0);
    this.refreshTimelineBadge();
  },
  /* badge da Linha do Tempo: solicitações de material em aberto (consultor) / briefings a iniciar (admin) */
  refreshTimelineBadge() {
    const u = OB.session(); if (!u) return;
    const badge = document.getElementById('tl-badge'); if (!badge) return;
    const n = u.role === 'admin' ? OB.briefingsPendentesAdmin().length : OB.solicitacoesAbertas(u.id);
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
        if (this.current === 'projetos' || this.current === 'timeline' || this.current === 'briefings') this.mod().render(this.current);
      })
      // arquivos do projeto (entregas do admin + uploads do consultor) em tempo real
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projeto_arquivos' }, (payload) => {
        const u = OB.session(); if (!u) return;
        const row = payload.new && payload.new.id ? payload.new : payload.old;
        if (!row) return;
        const arr = OB.db.projetoArquivos || (OB.db.projetoArquivos = []);
        if (payload.eventType === 'DELETE') {
          OB.db.projetoArquivos = arr.filter(a => a.id !== row.id);
        } else {
          const a = OB._paIn(payload.new);
          const i = arr.findIndex(x => x.id === a.id);
          if (i >= 0) arr[i] = a; else arr.unshift(a);
          // avisa o consultor quando o admin publica uma entrega ou uma solicitação
          if (payload.eventType === 'INSERT' && a.autor === 'admin' && u.role !== 'admin') {
            const proj = OB.projetoById(a.projetoId);
            if (proj && proj.consultorId === u.id) {
              if (a.categoria === 'solicitacao') UI.toast('Solicitação da OutBox', a.nome || 'A OutBox precisa de um material para o seu projeto.', 'info');
              else UI.toast('Nova entrega disponível', 'O admin disponibilizou um arquivo do seu projeto.', 'ok');
            }
          }
        }
        this.refreshTimelineBadge();
        if (this.current === 'projetos' || this.current === 'timeline' || this.current === 'briefings') this.mod().render(this.current);
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
    // colaborador interno só acessa as seções liberadas para o cargo dele
    const s = OB.session();
    if (s && s.role === 'admin' && viewId !== 'perfil' && !OB.podeVer(viewId)) {
      UI.toast('Sem acesso', 'Seu cargo não tem permissão para esta seção.', 'err');
      viewId = OB.podeVer('painel') ? 'painel' : (this.mod().NAV.filter(n => OB.podeVer(n.id))[0] || {}).id || 'perfil';
    }
    this.current = viewId;
    document.getElementById('main-view').classList.remove('view-wide'); // funil reativa abaixo
    document.querySelectorAll('#nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    this.syncTabBar(viewId);
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
  /* pill do bônus no topo: pulsa enquanto está valendo, comemora quando libera */
  _refreshBonusPill(bv, disponivel) {
    const pill = document.getElementById('bv-pill');
    if (!pill) return;
    const lbl = document.getElementById('bv-pill-lbl');
    const val = document.getElementById('bv-pill-val');
    // só aparece enquanto o bônus está vivo (pendente ou liberado e ainda não sacado)
    if (!bv || !bv.ativo || bv.status === 'resgatado' || bv.status === 'expirado') {
      pill.classList.add('hidden'); pill.classList.remove('bv-on', 'bv-urg');
      return;
    }
    pill.classList.remove('hidden');
    if (bv.status === 'liberado') {
      pill.classList.add('bv-on'); pill.classList.remove('bv-urg');
      lbl.textContent = 'Bônus liberado! 🎉';
      val.textContent = '+ ' + OB.fmt(bv.valor);
      pill.title = 'Seu bônus de boas-vindas já está somado no valor disponível';
    } else {
      const urg = bv.diasRestantes != null && bv.diasRestantes <= 15;
      pill.classList.toggle('bv-urg', urg); pill.classList.remove('bv-on');
      lbl.textContent = `Bônus · faltam ${OB.fmt(bv.falta)}`;
      val.textContent = OB.fmt(bv.valor);
      pill.title = `Chegue a ${OB.fmt(bv.meta)} e o bônus de ${OB.fmt(bv.valor)} é seu` + (bv.diasRestantes != null ? ` · ${bv.diasRestantes} dia(s) restantes` : '');
    }
    pill.style.setProperty('--bv-prog', (bv.progresso || 0) + '%');
    pill.onclick = () => this.go('overview');
  },

  refreshCommission(bump) {
    const u = OB.session();
    if (!u || u.role === 'admin') return;
    const pill = document.getElementById('com-pill');
    if (!pill) return;
    const r = OB.comissaoResumo(u.id);
    // o bônus de boas-vindas entra SOMADO no topo, para o consultor ver o valor cheio
    const bv = OB.bonusBV(u.id);
    const bonusVale = bv && bv.status === 'liberado' ? bv.valor : 0;
    document.getElementById('com-val').textContent = OB.fmt(r.disponivel + bonusVale);
    const comLbl = document.getElementById('com-lbl');
    if (comLbl) comLbl.textContent = bonusVale ? 'Disponível (com bônus)' : 'Comissão disponível';
    this._refreshBonusPill(bv, r.disponivel);
    const confPill = document.getElementById('conf-pill');
    if (confPill) {
      document.getElementById('conf-val').textContent = OB.fmt(r.emConferencia);
      confPill.classList.remove('hidden'); // sempre visível, mesmo zerado
    }
    // botão do mínimo p/ saque: bloqueado até o disponível atingir o mínimo
    const bloq = document.getElementById('bloq-pill');
    if (bloq) {
      const min = OB.saqueMinimo();
      const liberado = (r.disponivel + bonusVale) >= min; // o bônus conta para o mínimo
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
    // badge de bônus aguardando autorização
    const nb = OB.sales().filter(s => s.bonusStatus === 'pendente' && (s.bonus || []).length).length;
    const bb = document.getElementById('bonus-badge');
    if (bb) { bb.textContent = nb; bb.classList.toggle('hidden', nb === 0); }
  },

  /* ---------- card de usuário na sidebar ---------- */
  refreshSidebarUser() {
    const u = OB.session();
    const box = document.getElementById('side-user-box');
    if (!box) return;
    const av = u.foto ? `<img src="${u.foto}" alt="">` : (u.nome ? u.nome[0].toUpperCase() : '?');
    box.innerHTML = `<button type="button" class="side-user" id="side-user-btn" title="Editar meu perfil" aria-label="Editar meu perfil"><div class="av">${av}</div><div class="grow" style="min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.nome} ${u.sobrenome||''}</b><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${OB.podeAlternarPainel() ? (u.email || '') : (OB.painelAtual() === 'admin' ? 'Administrador' : 'Consultor')}</span></div><span class="side-user-edit">${UI.icon('edit',16)}</span></button>`;
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
    // detalhamento: de onde vieram os pontos (treinamentos concluídos + volume vendido)
    const brk = r => {
      const tr = Number(r.treinos_concluidos) || 0;
      const ptsTre = tr * 100;
      const ptsVen = Math.max(0, (Number(r.pontos) || 0) - ptsTre);
      return `<div class="rk-brk">
        <span class="rk-brk__i"><i>${UI.icon('book', 13)}</i><b>${tr} treino${tr !== 1 ? 's' : ''}</b><small>${OB.fmtNum(ptsTre)} pts</small></span>
        <span class="rk-brk__i"><i>${UI.icon('money', 13)}</i><b>${OB.fmt(Number(r.volume || 0))}</b><small>${OB.fmtNum(ptsVen)} pts</small></span>
      </div>`;
    };
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
        ${brk(r)}
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
          ${brk(r)}
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
        this.unsubscribeCatalogo();
        this.unsubscribePortfolio();
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
