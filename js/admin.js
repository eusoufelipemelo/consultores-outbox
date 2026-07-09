/* ============================================================
   OutBox Consultores — Painel do Administrador (admin.js)
   Acesso a todos os dados · gestão financeira de comissões e prêmios.
   ============================================================ */
const Admin = {
  HOME: 'painel',
  NAV: [
    { id: 'painel',     label: 'Painel Geral',     icon: 'overview', home: true },
    { id: 'atendimento',label: 'Atendimento',      icon: 'chat' },
    { id: 'avisos',     label: 'Avisos',           icon: 'bell' },
    { id: 'projetos',   label: 'Briefings',        icon: 'briefcase' },
    { id: 'consultores',label: 'Consultores',      icon: 'users' },
    { id: 'contratos',  label: 'Contratos',        icon: 'contract' },
    { id: 'financeiro', label: 'Financeiro',       icon: 'money' },
    { id: 'mapa',       label: 'Mapa da Rede',     icon: 'map' },
    { id: 'campanha',   label: 'Propaganda',       icon: 'megaphone' },
    { id: 'ranking',    label: 'Ranking de Consultores', icon: 'ranking' },
    { id: 'treinamentos', label: 'Treinamentos',   icon: 'academy' },
    { id: 'vendas',     label: 'Vendas',           icon: 'cart' }
  ],
  titles: {
    painel:      ['Painel Geral', 'Visão consolidada de toda a operação'],
    financeiro:  ['Gestão Financeira', 'Comissões e prêmios — pague mediante comprovação'],
    consultores: ['Consultores', 'Todos os consultores e seus números'],
    ranking:     ['Ranking de Consultores', 'Os 10 primeiros em pontos (vendas + treinamentos)'],
    mapa:        ['Mapa da Rede', 'Consultores por estado do Brasil — clique para ver as cidades'],
    vendas:      ['Vendas', 'Todas as vendas lançadas no sistema'],
    projetos:    ['Briefings & Entregas', 'Leia os briefings e conduza a produção até a entrega'],
    treinamentos:['Treinamentos da equipe', 'Progresso e certificados de cada consultor'],
    avisos:      ['Avisos aos consultores', 'Barra de comunicado no topo — novidades e atualizações'],
    campanha:    ['Propaganda / Pop-up', 'Suba uma arte 4:5 e agende quando ela aparece para os consultores no login'],
    atendimento: ['Atendimento (Manu)', 'Dúvidas, urgências e sugestões dos consultores — você responde como Manu'],
    perfil:      ['Editar Perfil', 'Seus dados de administrador']
  },

  consultores() { return OB.users().filter(u => u.role === 'consultor'); },
  pendentes() { return OB.requests().filter(r => r.status === 'solicitado' || r.status === 'em_analise'); },

  /* notificações: solicitações que chegaram dos consultores */
  notificacoesPopup() {
    const pend = OB.requests()
      .filter(r => r.status === 'solicitado' || r.status === 'em_analise')
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    const item = (r) => {
      const isCom = r.tipo === 'comissao';
      const ic = isCom ? 'money' : 'prize';
      const titulo = isCom ? 'Solicitação de comissão' : (r.modo === 'produto' ? 'Resgate de prêmio (produto)' : 'Resgate de prêmio (dinheiro)');
      const val = isCom || r.modo === 'dinheiro' ? OB.brl(r.valor) : (r.premioNome || 'Produto');
      return `<div class="row alc" style="gap:12px;padding:12px;border:1px solid var(--border);border-radius:12px;margin-bottom:10px">
        <span class="iconbtn" style="background:var(--brand-soft);color:var(--brand);border:none">${UI.icon(ic, 18)}</span>
        <div class="grow"><b style="font-size:14px">${titulo}</b>
          <div class="mut" style="font-size:12px">${r.consultorNome} · ${OB.dataBR(r.criadoEm)}</div></div>
        <b style="font-size:14px;color:var(--brand)">${val}</b>
      </div>`;
    };
    UI.modal({
      title: 'Notificações',
      sub: pend.length ? `${pend.length} solicitação(ões) aguardando sua análise` : 'Nenhuma solicitação pendente',
      body: pend.length
        ? `<div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>Analise e faça o repasse em <b>Financeiro</b>, sempre <b>mediante comprovação</b> do serviço e do valor recebido pela OutBox.</div></div>${pend.map(item).join('')}`
        : Consultor.emptyMini('Tudo em dia ✓ Nenhuma solicitação pendente.'),
      footer: pend.length
        ? `<button class="btn ghost" data-close>Fechar</button><button class="btn brand" id="nt-fin">Ir para o Financeiro</button>`
        : `<button class="btn brand" data-close>Fechar</button>`
    });
    const go = document.getElementById('nt-fin');
    if (go) go.onclick = () => { UI.closeModal(); App.go('financeiro'); };
  },

  render(id) {
    Charts.destroyAll();
    const fn = this['view_' + id];
    if (fn) fn.call(this);
  },

  /* ====================== PAINEL GERAL ====================== */
  view_painel() {
    const cons = this.consultores();
    const sales = OB.sales();
    const totalVendido = sales.reduce((t, s) => t + s.valor, 0);
    const reqs = OB.requests();
    const aPagar = reqs.filter(r => r.status === 'solicitado' || r.status === 'em_analise' || r.status === 'aprovado').reduce((t, r) => t + r.valor, 0);
    const pago = reqs.filter(r => r.status === 'pago').reduce((t, r) => t + r.valor, 0);
    const pend = this.pendentes();

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-4" style="margin-bottom:18px">
        ${Consultor.kpi('cart', OB.brl(totalVendido), 'Volume total vendido', sales.length + ' vendas')}
        ${Consultor.kpi('users', cons.length, 'Consultores ativos', '')}
        ${Consultor.kpi('money', OB.brl(aPagar), 'A pagar (comissão+prêmio)', pend.length + ' solicitação(ões)')}
        ${Consultor.kpi('receipt', OB.brl(pago), 'Já pago', '')}
      </div>

      <div class="cards cols-2" style="margin-bottom:18px">
        <div class="card">
          <div class="card-head"><h3>Comissões por mês</h3><span class="mut">Pago vs a pagar</span></div>
          <div style="height:260px"><canvas id="ch-stack"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Ranking de consultores</h3><span class="mut">Por volume vendido</span></div>
          ${this.ranking(cons, sales)}
        </div>
      </div>

      ${this.mapaResumoHTML()}

      <div class="card">
        <div class="card-head"><h3>Solicitações pendentes</h3>${pend.length?`<span class="chip warn">${pend.length} aguardando</span>`:'<span class="chip green">tudo em dia</span>'}</div>
        ${this.reqTable(pend, true)}
      </div>`;

    this.paintPainelMapa();
    setTimeout(() => {
      const labels = Consultor.last6Labels();
      const pagas = [], pend2 = [];
      const n = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
        const mr = reqs.filter(r => { const rd = new Date(r.criadoEm); return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth(); });
        pagas.push(mr.filter(r => r.status === 'pago').reduce((t, r) => t + r.valor, 0));
        pend2.push(mr.filter(r => r.status !== 'pago' && r.status !== 'recusado').reduce((t, r) => t + r.valor, 0));
      }
      Charts.barStack('ch-stack', labels, pagas, pend2);
    }, 50);
  },

  ranking(cons, sales) {
    const arr = cons.map(c => ({ c, vol: OB.volumeTrimestre(c.id) })).sort((a, b) => b.vol - a.vol).slice(0, 6);
    if (!arr.length || arr.every(a => a.vol === 0)) return Consultor.emptyMini('Sem vendas no trimestre');
    const max = arr[0].vol || 1;
    return `<div style="display:flex;flex-direction:column;gap:14px;margin-top:4px">
      ${arr.map((a, i) => `<div>
        <div class="row between" style="font-size:13px;margin-bottom:5px"><span class="strong">${i+1}. ${a.c.nome} ${a.c.sobrenome}</span><span class="soft">${OB.brl(a.vol)}</span></div>
        <div class="bar"><i data-w="${Math.round(a.vol/max*100)}"></i></div>
      </div>`).join('')}</div>`;
  },

  /* ====================== FINANCEIRO ====================== */
  view_financeiro() {
    const reqs = OB.requests();
    const v = document.getElementById('main-view');
    const sum = (st) => reqs.filter(r => st.includes(r.status)).reduce((t, r) => t + r.valor, 0);
    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:18px">
        ${Consultor.kpi('clock', OB.brl(sum(['solicitado','em_analise'])), 'Aguardando análise', '')}
        ${Consultor.kpi('check', OB.brl(sum(['aprovado'])), 'Aprovado a pagar', 'Em até 3 dias úteis')}
        ${Consultor.kpi('money', OB.brl(sum(['pago'])), 'Total pago', '')}
      </div>
      <div class="notice" style="margin-bottom:18px">${UI.icon('shield',16)}<div>Regra de pagamento: libere o valor <b>somente mediante a comprovação do serviço</b> e dos valores que efetivamente entraram na conta da OutBox. O prazo de pagamento é de <b>até 3 dias úteis</b> após a aprovação.</div></div>

      <div class="row between alc" style="margin-bottom:14px">
        <div class="seg" id="fin-filter">
          <button class="on" data-f="pend">Pendentes</button>
          <button data-f="all">Todas</button>
          <button data-f="pago">Pagas</button>
        </div>
      </div>
      <div class="card" style="padding:0" id="fin-table"></div>`;

    const draw = (f) => {
      let list = reqs;
      if (f === 'pend') list = reqs.filter(r => r.status === 'solicitado' || r.status === 'em_analise' || r.status === 'aprovado');
      else if (f === 'pago') list = reqs.filter(r => r.status === 'pago');
      document.getElementById('fin-table').innerHTML = this.reqTable(list, true);
      this.bindReqActions();
    };
    draw('pend');
    document.querySelectorAll('#fin-filter button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#fin-filter button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); draw(b.dataset.f);
    });
  },

  reqTable(list, actions) {
    if (!list.length) return Consultor.empty('receipt', 'Nenhuma solicitação', 'Quando um consultor solicitar comissão ou troca de prêmio, aparece aqui.');
    const stMap = { solicitado: ['warn', 'Solicitado'], em_analise: ['gray', 'Em análise'], aprovado: ['brand', 'Aprovado'], pago: ['green', 'Pago'], recusado: ['gray', 'Recusado'] };
    return `<div class="table-wrap"><table><thead><tr>
      <th>Data</th><th>Consultor</th><th>Tipo</th><th>Detalhe</th><th>Valor</th><th>PIX</th><th>Status</th>${actions?'<th></th>':''}</tr></thead><tbody>
      ${list.map(r => { const st = stMap[r.status] || ['gray', r.status];
        return `<tr>
          <td>${OB.dataBR(r.criadoEm)}</td>
          <td class="strong">${r.consultorNome}</td>
          <td>${r.tipo==='comissao'?'Comissão':(r.modo==='produto'?'Prêmio (produto)':'Prêmio (dinheiro)')}</td>
          <td class="mut" style="max-width:200px">${r.detalhe||'-'}</td>
          <td class="strong">${r.tipo==='premio'&&r.modo==='produto'?'<span class="chip brand">'+(r.premioNome||'Produto')+'</span>':OB.brl(r.valor)}</td>
          <td class="mut" style="font-size:12px">${r.pix||'-'}</td>
          <td><span class="chip ${st[0]}">${st[1]}</span></td>
          ${actions?`<td class="row" style="gap:6px;justify-content:flex-end">${this.reqActions(r)}</td>`:''}
        </tr>`; }).join('')}
    </tbody></table></div>`;
  },

  reqActions(r) {
    if (r.status === 'pago') return `<span class="chip green">${UI.icon('check',13)} Concluído</span>`;
    if (r.status === 'recusado') return `<span class="mut" style="font-size:12px">Recusado</span>`;
    let btns = '';
    if (r.status === 'solicitado') btns += `<button class="btn sm ghost" data-act="analise" data-id="${r.id}">Em análise</button>`;
    btns += `<button class="btn sm brand" data-act="pagar" data-id="${r.id}">Confirmar pagamento</button>`;
    btns += `<button class="iconbtn" data-act="recusar" data-id="${r.id}" title="Recusar">${UI.icon('x',16)}</button>`;
    return btns;
  },

  bindReqActions() {
    document.querySelectorAll('[data-act]').forEach(b => {
      b.onclick = () => {
        const r = OB.requests().find(x => x.id === b.dataset.id);
        if (!r) return;
        if (b.dataset.act === 'analise') { r.status = 'em_analise'; OB.updateRequest(r); UI.toast('Marcado em análise', '', 'ok'); this.refreshFin(); }
        else if (b.dataset.act === 'recusar') {
          UI.confirm('Recusar solicitação', `Recusar a solicitação de ${r.consultorNome} (${OB.brl(r.valor)})?`, () => {
            r.status = 'recusado'; OB.updateRequest(r);
            if (r.vendaIds) r.vendaIds.forEach(id => { const s = OB.sales().find(x => x.id === id); if (s) { s.statusComissao = 'disponivel'; OB.updateSale(s); } });
            UI.toast('Solicitação recusada', '', 'ok'); this.refreshFin();
          }, 'Recusar');
        }
        else if (b.dataset.act === 'pagar') this.confirmarPagamento(r);
      };
    });
  },

  confirmarPagamento(r) {
    UI.modal({
      title: 'Confirmar pagamento',
      sub: `${r.consultorNome} · ${OB.brl(r.valor)}`,
      body: `<div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Confirme apenas após a <b>comprovação do serviço</b> e da entrada do valor na conta da OutBox.</div></div>
        <div class="field"><label><input type="checkbox" id="pg-check" style="width:auto;margin-right:8px;vertical-align:middle">Confirmo que o serviço foi comprovado e os valores acordados entraram na conta da OutBox.</label></div>
        <div class="field"><label>Comprovante / referência do pagamento</label><input id="pg-ref" placeholder="Ex: PIX e2e... ou observação"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="pg-go">Marcar como pago</button>`
    });
    document.getElementById('pg-go').onclick = () => {
      if (!document.getElementById('pg-check').checked) return UI.toast('Confirme a comprovação', 'Marque a caixa de confirmação', 'err');
      r.status = 'pago'; r.pagoEm = new Date().toISOString(); r.comprovante = document.getElementById('pg-ref').value.trim();
      OB.updateRequest(r);
      if (r.vendaIds) r.vendaIds.forEach(id => { const s = OB.sales().find(x => x.id === id); if (s) { s.statusComissao = 'paga'; OB.updateSale(s); } });
      UI.closeModal();
      UI.toast('Pagamento confirmado', `${r.consultorNome} foi pago`, 'ok');
      this.refreshFin();
    };
  },

  refreshFin() {
    App.refreshBadge();
    const active = document.querySelector('.nav-item.active');
    if (active) Admin.render(active.dataset.view);
  },

  /* ====================== CONSULTORES ====================== */
  /* filtros da lista de consultores (persistem enquanto navega na view) */
  _consFiltro: { nome: '', online: 'todos', de: '', ate: '', cidade: '', uf: '', pais: '' },

  view_consultores() {
    const cons = this.consultores();
    const v = document.getElementById('main-view');
    if (!cons.length) { v.innerHTML = Consultor.empty('users', 'Nenhum consultor', 'Os consultores aparecem aqui após criarem conta.'); return; }
    const f = this._consFiltro;
    const ufs = [...new Set(cons.map(c => (c.uf || '').toUpperCase()).filter(Boolean))].sort();
    const paises = [...new Set(cons.map(c => c.pais || 'Brasil'))].sort();

    // aplica filtros
    const lista = cons.filter(c => {
      if (f.nome && !(`${c.nome} ${c.sobrenome || ''} ${c.email || ''}`.toLowerCase().includes(f.nome.toLowerCase()))) return false;
      if (f.online === 'online' && !OB.online(c)) return false;
      if (f.de && (!c.criadoEm || c.criadoEm.slice(0, 10) < f.de)) return false;
      if (f.ate && (!c.criadoEm || c.criadoEm.slice(0, 10) > f.ate)) return false;
      if (f.cidade && !(c.cidade || '').toLowerCase().includes(f.cidade.toLowerCase())) return false;
      if (f.uf && (c.uf || '').toUpperCase() !== f.uf) return false;
      if (f.pais && (c.pais || 'Brasil') !== f.pais) return false;
      return true;
    });
    const nOnline = cons.filter(c => OB.online(c)).length;

    v.innerHTML = `
      <div class="card cons-filtros" style="margin-bottom:16px">
        <div class="cons-filtros-grid">
          <div class="field"><label>Nome ou e-mail</label><input id="cf-nome" value="${f.nome}" placeholder="Buscar consultor..."/></div>
          <div class="field"><label>Status</label>
            <select id="cf-online">
              <option value="todos" ${f.online === 'todos' ? 'selected' : ''}>Todos</option>
              <option value="online" ${f.online === 'online' ? 'selected' : ''}>Logados agora (${nOnline})</option>
            </select></div>
          <div class="field"><label>1º acesso de</label><input type="date" id="cf-de" value="${f.de}"/></div>
          <div class="field"><label>até</label><input type="date" id="cf-ate" value="${f.ate}"/></div>
          <div class="field"><label>Cidade</label><input id="cf-cidade" value="${f.cidade}" placeholder="Qualquer"/></div>
          <div class="field"><label>Estado</label>
            <select id="cf-uf"><option value="">Todos</option>${ufs.map(u2 => `<option value="${u2}" ${f.uf === u2 ? 'selected' : ''}>${u2}</option>`).join('')}</select></div>
          <div class="field"><label>País</label>
            <select id="cf-pais"><option value="">Todos</option>${paises.map(p => `<option value="${p}" ${f.pais === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
          <button class="btn ghost" id="cf-limpar" title="Limpar filtros">${UI.icon('x',14)} Limpar</button>
        </div>
        <div class="mut" style="font-size:12px;margin-top:8px">${lista.length} de ${cons.length} consultor(es) · ${nOnline} online agora</div>
      </div>
      ${lista.length ? `<div class="cons-grid">
        ${lista.map(c => {
          const volMes = OB.volumeMes(c.id);
          const nivel = OB.nivelPorVolume(volMes);
          const com = OB.comissaoDisponivel(c.id);
          const on = OB.online(c);
          const completo = c.doc && c.celular && c.cep && c.pix; // foto não vem na lista (perf)
          const fotoCache = OB.fotos[c.id];
          // progresso de treinamentos (concluído = nota >= objetivo)
          const disp = TREINOS.disponiveis();
          const prog = OB.treinosDoConsultor(c.id);
          const nTr = disp.filter(p => prog[p.id] && prog[p.id].concluido).length;
          const pctTr = disp.length ? Math.round(nTr / disp.length * 100) : 0;
          return `<div class="card cons-card" data-view-cons="${c.id}" title="Ver detalhes de ${c.nome}">
            <div class="row alc" style="gap:10px">
              <div class="av-box cons-av ${on ? 'on' : ''}" data-av="${c.id}">${fotoCache ? `<img src="${fotoCache}">` : (c.nome ? c.nome[0] : '?')}</div>
              <div class="grow" style="min-width:0">
                <b class="cons-nome">${c.nome} ${c.sobrenome || ''}</b>
                <div class="mut cons-sub">${c.cidade ? `${c.cidade}/${c.uf || ''}` : 'Sem cidade'}${c.pais && c.pais !== 'Brasil' ? ' · ' + c.pais : ''}</div>
              </div>
              <span class="tier-badge" style="background:${nivel.cor}">${nivel.nome}</span>
            </div>
            <div class="cons-nums">
              <div><span>Mês</span><b>${OB.brl(volMes)}</b></div>
              <div><span>Comissão</span><b style="color:var(--brand)">${OB.brl(com.valor)}</b></div>
            </div>
            <div class="cons-trein" title="${nTr} de ${disp.length} treinamentos concluídos (aprovação de ${TREINOS.OBJETIVO}% ou mais)">
              <div class="row between alc"><span>Treinamentos</span><b class="${pctTr === 100 ? 'done' : ''}">${nTr}/${disp.length}</b></div>
              <div class="cons-trein-bar ${pctTr === 100 ? 'done' : ''}"><i style="width:${pctTr}%"></i></div>
            </div>
            <div class="row between alc cons-foot">
              <span class="cons-status ${on ? 'on' : ''}">${on ? 'Online agora' : (c.lastSeenEm ? 'Visto ' + OB.dataBR(c.lastSeenEm) : 'Nunca acessou')}</span>
              <span class="mut" style="font-size:10.5px">1º acesso ${c.criadoEm ? OB.dataBR(c.criadoEm) : '-'}</span>
            </div>
            ${completo ? '' : '<span class="chip warn cons-incompleto">Perfil incompleto</span>'}
          </div>`;
        }).join('')}
      </div>` : Consultor.empty('users', 'Nenhum resultado', 'Nenhum consultor bate com os filtros. Ajuste ou limpe os filtros.')}`;

    // binds dos filtros (re-render mantendo estado)
    const aplicar = () => {
      const focoId = document.activeElement && document.activeElement.id;
      this._consFiltro = {
        nome: document.getElementById('cf-nome').value, online: document.getElementById('cf-online').value,
        de: document.getElementById('cf-de').value, ate: document.getElementById('cf-ate').value,
        cidade: document.getElementById('cf-cidade').value, uf: document.getElementById('cf-uf').value,
        pais: document.getElementById('cf-pais').value
      };
      this.view_consultores();
      // devolve o foco ao campo que estava sendo digitado
      if (focoId) { const el = document.getElementById(focoId); if (el) { el.focus(); const n = (el.value || '').length; try { el.setSelectionRange(n, n); } catch (e) {} } }
    };
    let deb;
    ['cf-nome', 'cf-cidade'].forEach(id => document.getElementById(id).oninput = () => { clearTimeout(deb); deb = setTimeout(aplicar, 350); });
    ['cf-online', 'cf-de', 'cf-ate', 'cf-uf', 'cf-pais'].forEach(id => document.getElementById(id).onchange = aplicar);
    document.getElementById('cf-limpar').onclick = () => { this._consFiltro = { nome: '', online: 'todos', de: '', ate: '', cidade: '', uf: '', pais: '' }; this.view_consultores(); };
    v.querySelectorAll('[data-view-cons]').forEach(b => b.onclick = () => this.detalheConsultor(b.dataset.viewCons));

    // fotos em 2º plano: a tela já abriu com iniciais; as fotos entram assim que chegam
    OB.carregarFotos().then(() => {
      document.querySelectorAll('.cons-av[data-av]').forEach(el => {
        const f = OB.fotos[el.dataset.av];
        if (f) el.innerHTML = `<img src="${f}">`;
      });
    }).catch(() => {});
  },

  detalheConsultor(id) {
    const c = OB.userById(id);
    const clientes = OB.clientsOf(id);
    const vendas = OB.salesOf(id);
    const reqs = OB.requestsOf(id);
    UI.modal({
      size: 'lg',
      title: `${c.nome} ${c.sobrenome}`,
      sub: c.email + ' · ' + (c.celular || 'sem telefone'),
      body: `
        <div class="cards cols-3" style="margin-bottom:18px">
          ${Consultor.kpi('cart', OB.brl(OB.volumeTrimestre(id)), 'Trimestre', '')}
          ${Consultor.kpi('clients', clientes.length, 'Clientes', '')}
          ${Consultor.kpi('money', OB.brl(OB.comissaoDisponivel(id).valor), 'Comissão disp.', '')}
        </div>
        <div class="nav-label" style="padding-left:0">Dados cadastrais</div>
        <div class="grid-2" style="font-size:13px;gap:6px 16px;margin-bottom:14px">
          <div><span class="mut">CPF/CNPJ:</span> ${c.doc||'-'}</div>
          <div><span class="mut">Instagram:</span> ${c.instagram||'-'}</div>
          <div><span class="mut">Nascimento:</span> ${c.nascimento?OB.dataBR(c.nascimento):'-'}</div>
          <div><span class="mut">Cidade:</span> ${c.cidade?c.cidade+'/'+c.uf:'-'}${c.pais&&c.pais!=='Brasil'?' · '+c.pais:''}</div>
          <div><span class="mut">1º acesso:</span> ${c.criadoEm?OB.dataBR(c.criadoEm):'-'}</div>
          <div><span class="mut">Último acesso:</span> ${OB.online(c)?'<b style="color:#1fa855">Online agora</b>':(c.lastSeenEm?OB.dataBR(c.lastSeenEm):'-')}</div>
          <div style="grid-column:1/-1"><span class="mut">Endereço:</span> ${c.logradouro?`${c.logradouro}, ${c.numero} ${c.complemento||''} — ${c.bairro}, CEP ${c.cep}`:'-'}</div>
        </div>
        <div class="nav-label" style="padding-left:0">Dados de pagamento</div>
        <div class="grid-2" style="font-size:13px;gap:6px 16px;margin-bottom:14px">
          <div><span class="mut">Chave Pix:</span> ${c.pix||'-'}</div>
          <div><span class="mut">Banco:</span> ${c.banco||'-'}</div>
          <div><span class="mut">Agência:</span> ${c.agencia||'-'}</div>
          <div><span class="mut">Conta:</span> ${c.conta?`${c.conta} (${c.contaTipo==='poupanca'?'poupança':c.contaTipo==='pagamento'?'pagamento':'corrente'})`:'-'}</div>
        </div>
        <div class="nav-label" style="padding-left:0">Vendas (${vendas.length})</div>
        ${vendas.length?`<div class="table-wrap" style="margin-bottom:14px"><table><thead><tr><th>Data</th><th>Produto</th><th>Valor</th><th>Comissão</th></tr></thead><tbody>
          ${vendas.slice().sort((a,b)=>new Date(b.data)-new Date(a.data)).map(s=>{const p=OB.PRODUTOS.find(x=>x.id===s.produto);return `<tr><td>${OB.dataBR(s.data)}</td><td>${OB.produtosNomes(s)}</td><td>${OB.brl(s.valor)}</td><td><span class="chip ${s.statusComissao==='paga'?'green':s.statusComissao==='solicitada'?'gray':'warn'}">${s.statusComissao}</span></td></tr>`}).join('')}
        </tbody></table></div>`:'<p class="mut" style="font-size:13px;margin-bottom:14px">Sem vendas.</p>'}
        <div class="nav-label" style="padding-left:0">Solicitações (${reqs.length})</div>
        ${reqs.length?Consultor.reqList(reqs):'<p class="mut" style="font-size:13px">Sem solicitações.</p>'}`,
      footer: `<button class="btn brand" data-close>Fechar</button>`
    });
  },

  /* ====================== MAPA DA REDE ====================== */
  UF_NOMES: { AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará', DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão', MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará', PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro', RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima', SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins' },
  REGIOES: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
  UF_REGIAO: { AC:'Norte', AM:'Norte', AP:'Norte', PA:'Norte', RO:'Norte', RR:'Norte', TO:'Norte', MA:'Nordeste', PI:'Nordeste', CE:'Nordeste', RN:'Nordeste', PB:'Nordeste', PE:'Nordeste', AL:'Nordeste', SE:'Nordeste', BA:'Nordeste', MT:'Centro-Oeste', MS:'Centro-Oeste', GO:'Centro-Oeste', DF:'Centro-Oeste', MG:'Sudeste', ES:'Sudeste', RJ:'Sudeste', SP:'Sudeste', PR:'Sul', SC:'Sul', RS:'Sul' },

  /* dados agregados por estado (reuso: mapa completo + resumo do painel) */
  _mapaDados() {
    const cons = this.consultores();
    const ehBR = c => (c.pais || 'Brasil') === 'Brasil';
    const porUF = {}; const exterior = []; const semUF = [];
    cons.forEach(c => {
      const uf = (c.uf || '').toUpperCase();
      if (!ehBR(c)) exterior.push(c);
      else if (this.UF_NOMES[uf]) (porUF[uf] = porUF[uf] || []).push(c);
      else semUF.push(c);
    });
    const vendidoDe = id => OB.salesOf(id).filter(s => s.statusProposta === 'aprovada').reduce((t, s) => t + (s.valor || 0), 0);
    const statUF = {};
    Object.keys(porUF).forEach(uf => { const a = porUF[uf]; statUF[uf] = { n: a.length, vol: a.reduce((t, c) => t + vendidoDe(c.id), 0), clientes: a.reduce((t, c) => t + OB.clientsOf(c.id).length, 0) }; });
    const reg = {}; this.REGIOES.forEach(r => reg[r] = { n: 0, vol: 0 });
    Object.keys(statUF).forEach(uf => { const r = this.UF_REGIAO[uf]; if (r) { reg[r].n += statUF[uf].n; reg[r].vol += statUF[uf].vol; } });
    return { cons, porUF, exterior, semUF, vendidoDe, statUF, reg };
  },

  /* card compacto do mapa para o Painel Geral (resumo por região + mini-mapa por vendas) */
  mapaResumoHTML() {
    const { reg } = this._mapaDados();
    return `<div class="card" style="margin-bottom:18px">
      <div class="card-head"><h3>Mapa da rede</h3><button class="btn ghost sm" id="ir-mapa">${UI.icon('map',14)} Ver mapa completo</button></div>
      <div class="mapa-regioes" style="margin:8px 0 14px">
        ${this.REGIOES.map(r => `<div class="mapa-reg"><span>${r}</span><b>${reg[r].n}</b><small>${reg[r].vol ? OB.brl(reg[r].vol) : '—'}</small></div>`).join('')}
      </div>
      <div class="mapa-svg mapa-mini" id="painel-mapa" title="Abrir o mapa completo">${MAPA_BR}</div>
      <div class="hint" style="text-align:center;margin-top:10px">Intensidade da cor por vendas aprovadas em cada estado. Clique para abrir o mapa completo.</div>
    </div>`;
  },
  paintPainelMapa() {
    const box = document.getElementById('painel-mapa'); if (!box) return;
    const { statUF } = this._mapaDados();
    const maxVol = Math.max(1, ...Object.keys(statUF).map(u => statUF[u].vol));
    box.querySelectorAll('path[data-uf]').forEach(p => {
      const s = statUF[p.dataset.uf];
      const alpha = s && s.vol ? (0.28 + 0.72 * (s.vol / maxVol)) : (s ? 0.22 : 0);
      p.style.fill = s ? `rgba(241,85,50,${alpha.toFixed(2)})` : 'var(--surface-3)';
    });
    box.onclick = () => App.go('mapa');
    const btn = document.getElementById('ir-mapa'); if (btn) btn.onclick = (e) => { e.stopPropagation(); App.go('mapa'); };
  },

  view_mapa() {
    const v = document.getElementById('main-view');
    const cons = this.consultores();
    // agrupa: estados do BR (UF válida) · exterior (país != Brasil) · sem estado (BR sem UF)
    const ehBR = c => (c.pais || 'Brasil') === 'Brasil';
    const porUF = {}; const exterior = []; const semUF = [];
    cons.forEach(c => {
      const uf = (c.uf || '').toUpperCase();
      if (!ehBR(c)) exterior.push(c);
      else if (this.UF_NOMES[uf]) (porUF[uf] = porUF[uf] || []).push(c);
      else semUF.push(c);
    });
    // estatísticas por estado: consultores, volume vendido (aprovado) e clientes
    const vendidoDe = id => OB.salesOf(id).filter(s => s.statusProposta === 'aprovada').reduce((t, s) => t + (s.valor || 0), 0);
    const statUF = {};
    Object.keys(porUF).forEach(uf => {
      const a = porUF[uf];
      statUF[uf] = { n: a.length, vol: a.reduce((t, c) => t + vendidoDe(c.id), 0), clientes: a.reduce((t, c) => t + OB.clientsOf(c.id).length, 0) };
    });
    const nEstados = Object.keys(porUF).length;
    const totalVol = Object.values(statUF).reduce((t, s) => t + s.vol, 0);
    // métrica ativa do mapa: 'cons' (consultores) ou 'vendas' (R$)
    const metrica = this._mapaMetrica || 'cons';
    const valM = uf => statUF[uf] ? (metrica === 'vendas' ? statUF[uf].vol : statUF[uf].n) : 0;
    const maxM = Math.max(1, ...Object.keys(statUF).map(valM));
    const rank = Object.keys(porUF).map(uf => ({ uf, ...statUF[uf] })).sort((a, b) => metrica === 'vendas' ? b.vol - a.vol : b.n - a.n);
    // resumo por região
    const reg = {}; this.REGIOES.forEach(r => reg[r] = { n: 0, vol: 0 });
    Object.keys(statUF).forEach(uf => { const r = this.UF_REGIAO[uf]; if (r) { reg[r].n += statUF[uf].n; reg[r].vol += statUF[uf].vol; } });
    const topRank = rank[0];

    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:14px">
        ${Consultor.kpi('users', cons.length, 'Consultores', nEstados + ' estado(s)' + (exterior.length ? ' · ' + exterior.length + ' no exterior' : ''))}
        ${Consultor.kpi('cart', OB.brl(totalVol), 'Vendido pela rede', 'Somando propostas aprovadas')}
        ${Consultor.kpi('pin', topRank ? this.UF_NOMES[topRank.uf] : '—', metrica === 'vendas' ? 'Estado que mais vende' : 'Estado com mais gente', topRank ? (metrica === 'vendas' ? OB.brl(topRank.vol) : topRank.n + ' consultor(es)') : 'sem dados')}
      </div>
      <div class="mapa-regioes">
        ${this.REGIOES.map(r => `<div class="mapa-reg"><span>${r}</span><b>${reg[r].n}</b><small>${reg[r].vol ? OB.brl(reg[r].vol) : '—'}</small></div>`).join('')}
      </div>
      <div class="mapa-toggle seg">
        <button type="button" data-m="cons" class="${metrica === 'cons' ? 'on' : ''}">${UI.icon('users',14)} Colorir por consultores</button>
        <button type="button" data-m="vendas" class="${metrica === 'vendas' ? 'on' : ''}">${UI.icon('cart',14)} Colorir por vendas (R$)</button>
      </div>
      <div class="mapa-wrap">
        <div class="card mapa-box">
          <div class="mapa-svg" id="mapa-svg">${MAPA_BR}</div>
          <div class="mapa-legenda">
            <span class="mut" style="font-size:11px">${metrica === 'vendas' ? 'Vende menos' : 'Menos'}</span>
            <span class="lg-scale"></span>
            <span class="mut" style="font-size:11px">${metrica === 'vendas' ? 'Vende mais' : 'Mais'}</span>
            <span class="lg-vazio"></span><span class="mut" style="font-size:11px">Sem consultor</span>
          </div>
          <div class="mapa-tip" id="mapa-tip"></div>
        </div>
        <div class="card mapa-painel" id="mapa-painel"></div>
      </div>`;

    // alterna a métrica do mapa
    v.querySelectorAll('.mapa-toggle [data-m]').forEach(b => b.onclick = () => { this._mapaMetrica = b.dataset.m; this.view_mapa(); });

    const painel = document.getElementById('mapa-painel');
    const tip = document.getElementById('mapa-tip');
    const svg = document.getElementById('mapa-svg');

    // pinta os estados conforme a métrica ativa
    svg.querySelectorAll('path[data-uf]').forEach(p => {
      const uf = p.dataset.uf, s = statUF[uf];
      const alpha = s ? (0.28 + 0.72 * (valM(uf) / maxM)) : 0;
      p.style.fill = s ? `rgba(241,85,50,${alpha.toFixed(2)})` : 'var(--surface-3)';
      p.classList.toggle('tem', !!s);
      p.setAttribute('data-n', s ? s.n : 0);
      p.setAttribute('data-vol', s ? s.vol : 0);
    });

    // painel: lista de estados (padrão) e lista de consultores de um estado (ao clicar)
    const painelEstados = () => {
      painel.innerHTML = `
        <div class="mapa-painel-head"><b>Consultores por estado</b><span class="mut" style="font-size:12px">clique no mapa ou na lista</span></div>
        ${rank.length ? rank.map(r => `
          <button class="mapa-uf-row" data-uf="${r.uf}">
            <span class="mapa-uf-sigla">${r.uf}</span>
            <span class="grow" style="min-width:0"><b>${this.UF_NOMES[r.uf] || r.uf}</b><small class="mapa-uf-sub">${r.n} consultor(es) · ${r.vol ? OB.brl(r.vol) : 'sem vendas'}</small></span>
            <span class="mapa-uf-n">${metrica === 'vendas' ? OB.brl(r.vol) : r.n}</span>
          </button>`).join('') : '<p class="mut" style="font-size:13px;padding:6px 2px">Nenhum consultor com estado cadastrado ainda.</p>'}
        ${exterior.length ? `<button class="mapa-uf-row" data-uf="__ext"><span class="mapa-uf-sigla" style="background:rgba(37,211,102,.14);color:#1fa855">🌎</span><span class="grow" style="min-width:0"><b>Exterior</b></span><span class="mapa-uf-n">${exterior.length}</span></button>` : ''}
        ${semUF.length ? `<div class="hint" style="margin-top:10px">${UI.icon('info',12)} ${semUF.length} consultor(es) ainda sem estado no cadastro.</div>` : ''}`;
      painel.querySelectorAll('[data-uf]').forEach(b => b.onclick = () => selecionar(b.dataset.uf));
    };
    const painelEstado = (uf) => {
      const lista = (porUF[uf] || []).slice().sort((a, b) => vendidoDe(b.id) - vendidoDe(a.id) || (a.nome || '').localeCompare(b.nome || ''));
      const st = statUF[uf] || { n: 0, vol: 0, clientes: 0 };
      painel.innerHTML = `
        <button class="mapa-voltar" id="mapa-voltar">${UI.icon('chevron',15)} Todos os estados</button>
        <div class="mapa-painel-head" style="margin-top:8px"><b>${this.UF_NOMES[uf] || uf}</b><span class="chip brand">${this.UF_REGIAO[uf] || ''}</span></div>
        <div class="mapa-estado-stats">
          <div><span>Consultores</span><b>${st.n}</b></div>
          <div><span>Vendido</span><b style="color:var(--brand)">${OB.brl(st.vol)}</b></div>
          <div><span>Clientes</span><b>${st.clientes}</b></div>
        </div>
        ${lista.map(c => `
          <div class="mapa-cons" data-view-cons="${c.id}" title="Ver detalhes de ${c.nome}">
            <div class="av-box mapa-av">${OB.fotos[c.id] ? `<img src="${OB.fotos[c.id]}">` : (c.nome ? c.nome[0] : '?')}</div>
            <div class="grow" style="min-width:0">
              <b>${c.nome} ${c.sobrenome || ''}</b>
              <div class="mut" style="font-size:12px">${UI.icon('pin',11)} ${c.cidade || 'Cidade não informada'} · ${uf} · ${c.pais || 'Brasil'}</div>
            </div>
            ${UI.icon('chevron',15)}
          </div>`).join('')}`;
      document.getElementById('mapa-voltar').onclick = () => { selecionar(null); };
      painel.querySelectorAll('[data-view-cons]').forEach(b => b.onclick = () => this.detalheConsultor(b.dataset.viewCons));
      // fotos em 2º plano
      OB.carregarFotos().then(() => painel.querySelectorAll('.mapa-av').forEach((el, i) => {
        const id = lista[i] && lista[i].id; const f = id && OB.fotos[id]; if (f) el.innerHTML = `<img src="${f}">`;
      })).catch(() => {});
    };
    const painelExterior = () => {
      const lista = exterior.slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      painel.innerHTML = `
        <button class="mapa-voltar" id="mapa-voltar">${UI.icon('chevron',15)} Todos os estados</button>
        <div class="mapa-painel-head" style="margin-top:8px"><b>🌎 Exterior</b><span class="chip green">${lista.length} consultor(es)</span></div>
        ${lista.map(c => `
          <div class="mapa-cons" data-view-cons="${c.id}" title="Ver detalhes de ${c.nome}">
            <div class="av-box mapa-av">${OB.fotos[c.id] ? `<img src="${OB.fotos[c.id]}">` : (c.nome ? c.nome[0] : '?')}</div>
            <div class="grow" style="min-width:0"><b>${c.nome} ${c.sobrenome || ''}</b>
              <div class="mut" style="font-size:12px">${UI.icon('pin',11)} ${c.cidade || 'Cidade não informada'}${c.uf ? ' · ' + c.uf : ''} · ${c.pais || '-'}</div></div>
            ${UI.icon('chevron',15)}
          </div>`).join('')}`;
      document.getElementById('mapa-voltar').onclick = () => selecionar(null);
      painel.querySelectorAll('[data-view-cons]').forEach(b => b.onclick = () => this.detalheConsultor(b.dataset.viewCons));
      OB.carregarFotos().then(() => painel.querySelectorAll('.mapa-av').forEach((el, i) => { const id = lista[i] && lista[i].id; const f = id && OB.fotos[id]; if (f) el.innerHTML = `<img src="${f}">`; })).catch(() => {});
    };
    const selecionar = (uf) => {
      svg.querySelectorAll('path[data-uf]').forEach(p => p.classList.toggle('sel', p.dataset.uf === uf));
      if (uf === '__ext') painelExterior();
      else if (uf && porUF[uf]) painelEstado(uf);
      else painelEstados();
    };

    // interações do mapa
    svg.querySelectorAll('path[data-uf]').forEach(p => {
      p.onmouseenter = () => {
        const uf = p.dataset.uf, n = +p.dataset.n, vol = +p.dataset.vol;
        tip.innerHTML = `<b>${this.UF_NOMES[uf] || uf}</b> · ${n} consultor(es)${vol ? ' · ' + OB.brl(vol) : ''}`;
        tip.classList.add('show');
      };
      p.onmousemove = (e) => {
        const box = svg.getBoundingClientRect();
        tip.style.left = (e.clientX - box.left + 12) + 'px';
        tip.style.top = (e.clientY - box.top + 12) + 'px';
      };
      p.onmouseleave = () => tip.classList.remove('show');
      p.onclick = () => selecionar(p.dataset.uf);
    });

    painelEstados();
  },

  /* ====================== PROJETOS & ENTREGAS (admin) ====================== */
  _prodNomes(ids) { return (ids || []).map(id => (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id).join(' + '); },

  view_projetos() {
    const v = document.getElementById('main-view');
    const projs = OB.projetos().slice().sort((a, b) => OB.etapaIndex(a.status) - OB.etapaIndex(b.status) || new Date(b.criadoEm) - new Date(a.criadoEm));
    const novos = projs.filter(p => p.status === 'briefing_recebido');
    const producao = projs.filter(p => p.status === 'em_producao' || p.status === 'em_revisao');
    const entregues = projs.filter(p => p.status === 'entregue' || p.status === 'aprovado');

    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:16px">
        ${Consultor.kpi('send', novos.length, 'Briefings a iniciar', 'Recebidos, aguardando você')}
        ${Consultor.kpi('rocket', producao.length, 'Em produção', 'Trabalhos em andamento')}
        ${Consultor.kpi('check', entregues.length, 'Entregues', 'Enviados ao cliente')}
      </div>
      ${novos.length ? `<div class="notice" style="margin-bottom:16px;border-color:rgba(241,85,50,.3);background:var(--brand-soft)">${UI.icon('bell',16)}<div><b>${novos.length} briefing(s) recebido(s)</b> aguardando leitura. Analise e inicie a produção.</div></div>` : ''}
      ${projs.length ? `
        ${novos.length ? `<div class="nav-label" style="padding-left:0">Briefings recebidos, para iniciar</div>${novos.map(p => this.adminProjetoCard(p)).join('')}` : ''}
        ${producao.length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Em produção</div>${producao.map(p => this.adminProjetoCard(p)).join('')}` : ''}
        ${entregues.length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Entregues / concluídos</div>${entregues.map(p => this.adminProjetoCard(p)).join('')}` : ''}
        ${projs.filter(p => p.status === 'briefing_enviado').length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Aguardando o cliente preencher</div>${projs.filter(p => p.status === 'briefing_enviado').map(p => this.adminProjetoCard(p)).join('')}` : ''}
      ` : Consultor.empty('briefcase', 'Nenhum projeto ainda', 'Quando um consultor enviar um briefing, o projeto aparece aqui.')}`;

    v.querySelectorAll('[data-iniciar]').forEach(b => b.onclick = () => this.iniciarProducao(b.dataset.iniciar));
    v.querySelectorAll('[data-revisao]').forEach(b => b.onclick = () => this.avancarProjeto(b.dataset.revisao, 'em_revisao'));
    v.querySelectorAll('[data-entregar]').forEach(b => b.onclick = () => this.entregarProjeto(b.dataset.entregar));
    v.querySelectorAll('[data-concluir]').forEach(b => b.onclick = () => this.avancarProjeto(b.dataset.concluir, 'aprovado'));
    App.refreshProjetosBadge();
  },

  adminProjetoCard(p) {
    const cons = OB.userById(p.consultorId);
    const cli = OB.clientById(p.clientId);
    const et = OB.ETAPAS_PROJETO.find(e => e.id === p.status) || {};
    const respostas = p.briefingRespostas ? `<div class="proj-brief-box"><b>${UI.icon('docs',13)} Briefing do cliente</b><p>${(p.briefingRespostas).replace(/</g, '&lt;')}</p></div>` : (p.status === 'briefing_recebido' ? `<div class="hint" style="margin-top:8px">${UI.icon('info',12)} O consultor não anexou um resumo. Alinhe o briefing com ele${cons ? ' (' + cons.nome + ')' : ''}.</div>` : '');
    const acoes = [];
    if (p.status === 'briefing_recebido') acoes.push(`<button class="btn brand sm" data-iniciar="${p.id}">${UI.icon('rocket',14)} Iniciar produção</button>`);
    else if (p.status === 'em_producao') acoes.push(`<button class="btn ghost sm" data-revisao="${p.id}">${UI.icon('eye',14)} Enviar para revisão</button>`, `<button class="btn brand sm" data-entregar="${p.id}">${UI.icon('external',14)} Entregar (link)</button>`);
    else if (p.status === 'em_revisao') acoes.push(`<button class="btn brand sm" data-entregar="${p.id}">${UI.icon('external',14)} Entregar projeto (link)</button>`);
    else if (p.status === 'entregue') { if (p.linkFinal) acoes.push(`<a class="btn ghost sm" href="${p.linkFinal}" target="_blank" rel="noopener">${UI.icon('external',14)} Abrir projeto</a>`); acoes.push(`<button class="btn ghost sm" data-concluir="${p.id}">${UI.icon('check',14)} Marcar aprovado</button>`); }
    else if (p.status === 'aprovado' && p.linkFinal) acoes.push(`<a class="btn ghost sm" href="${p.linkFinal}" target="_blank" rel="noopener">${UI.icon('external',14)} Abrir projeto</a>`);
    return `<div class="card proj-card">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div style="min-width:0"><b style="font-size:15px">${cli ? cli.nome : 'Cliente'}</b>
          <div class="mut" style="font-size:12.5px">${this._prodNomes(p.produtos)} · Consultor: ${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}</div></div>
        <span class="chip ${p.status === 'aprovado' ? 'green' : p.status === 'briefing_recebido' ? 'warn' : 'brand'} nowrap">${et.nome || ''}</span>
      </div>
      <div style="margin-top:14px">${Consultor.timelineHTML(p)}</div>
      ${respostas}
      <div class="proj-acoes">${acoes.join('')}</div>
    </div>`;
  },

  iniciarProducao(projId) {
    const p = OB.projetoById(projId); if (!p) return;
    OB.setEtapaProjeto(p, 'em_producao');
    UI.toast('Produção iniciada', 'O consultor foi avisado. Bom trabalho!', 'ok');
    App.refreshProjetosBadge();
    this.render('projetos');
  },
  avancarProjeto(projId, status) {
    const p = OB.projetoById(projId); if (!p) return;
    OB.setEtapaProjeto(p, status);
    UI.toast('Projeto atualizado', 'Etapa: ' + ((OB.ETAPAS_PROJETO.find(e => e.id === status) || {}).nome || status), 'ok');
    App.refreshProjetosBadge();
    this.render('projetos');
  },
  entregarProjeto(projId) {
    const p = OB.projetoById(projId); if (!p) return;
    UI.modal({
      title: 'Entregar projeto',
      sub: 'Cole o link do projeto pronto',
      body: `
        <div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>Cole o link do projeto finalizado (site publicado, pasta do Drive, protótipo, etc.). O consultor vai compartilhar com o cliente para a aprovação final.</div></div>
        <div class="field"><label>Link do projeto <span class="req">*</span></label><input id="pj-link" type="url" value="${p.linkFinal || ''}" placeholder="https://..."/><div class="err">Informe o link</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="pj-ok">${UI.icon('external',16)} Entregar</button>`
    });
    document.getElementById('pj-ok').onclick = () => {
      const link = (document.getElementById('pj-link').value || '').trim();
      if (!link) { document.getElementById('pj-link').closest('.field').classList.add('has-error'); return; }
      p.linkFinal = link;
      OB.setEtapaProjeto(p, 'entregue');
      UI.closeModal();
      UI.toast('Projeto entregue!', 'O consultor pode compartilhar com o cliente.', 'ok');
      App.refreshProjetosBadge();
      this.render('projetos');
    };
  },

  /* ====================== VENDAS ====================== */
  /* vendas aprovadas aguardando o admin confirmar o recebimento do pagamento */
  pagamentosPendentes() { return OB.sales().filter(s => s.statusProposta === 'aprovada' && s.statusPagamento !== 'recebido'); },

  /* chip de status da comissão (admin) — claro e em PT */
  comLabel(s) {
    if (s.statusProposta !== 'aprovada') return '<span class="mut" style="font-size:12px">—</span>';
    if (s.statusPagamento !== 'recebido') return '<span class="chip warn nowrap">Em conferência</span>';
    const map = { disponivel: ['green', 'Disponível'], solicitada: ['gray', 'Solicitada'], paga: ['green', 'Paga'] };
    const m = map[s.statusComissao] || ['gray', s.statusComissao];
    return `<span class="chip ${m[0]} nowrap">${m[1]}</span>`;
  },

  confirmarRecebimentoVenda(saleId, after) {
    const s = OB.sales().find(x => x.id === saleId); if (!s) return;
    const cli = OB.clientById(s.clientId);
    UI.confirm('Confirmar recebimento', `Confirma que o pagamento de <b>${OB.brl(s.valor)}</b> do cliente <b>${cli ? cli.nome : '-'}</b> caiu na conta da OutBox? Isso <b>libera a comissão</b> do consultor.`, () => {
      OB.setPagamento(s.id, 'recebido');
      UI.toast('Pagamento confirmado', 'Comissão liberada para o consultor.', 'ok');
      App.refreshBadge(); if (after) after();
    }, 'Confirmar recebimento');
  },

  /* popup de conferência rápida (atalho do alerta no topo) */
  pagamentosPopup() {
    const pend = this.pagamentosPendentes().sort((a, b) => new Date(b.data) - new Date(a.data));
    const body = pend.length ? pend.map(s => {
      const cons = OB.userById(s.consultorId); const cli = OB.clientById(s.clientId); const p = OB.PRODUTOS.find(x => x.id === s.produto);
      return `<div class="row between alc" style="padding:12px 0;border-bottom:1px solid var(--border);gap:12px">
        <div style="min-width:0">
          <b style="font-size:14px">${cli ? cli.nome : '-'} · ${OB.brl(s.valor)}</b>
          <div class="mut" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${OB.produtosNomes(s)} · ${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'} · ${OB.dataBR(s.data)}</div>
        </div>
        <button class="btn green" data-conf="${s.id}" style="white-space:nowrap;padding:8px 14px;font-size:13px">${UI.icon('check',15)} Recebido</button>
      </div>`;
    }).join('') : `<div class="notice">${UI.icon('check',16)}<div>Tudo em dia — nenhuma venda aguardando confirmação de pagamento.</div></div>`;
    UI.modal({
      title: 'Pagamentos a confirmar',
      sub: pend.length ? `${pend.length} venda(s) aguardando o recebimento ser confirmado` : 'Nenhuma pendência',
      body,
      footer: `<button class="btn ghost" data-close>Fechar</button>${pend.length > 1 ? `<button class="btn brand" id="pp-all">${UI.icon('check',16)} Confirmar todas</button>` : ''}`
    });
    const refresh = () => { App.refreshBadge(); if (App.current === 'vendas') this.render('vendas'); this.pagamentosPopup(); };
    document.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => {
      OB.setPagamento(b.dataset.conf, 'recebido');
      UI.toast('Pagamento confirmado', 'Comissão liberada.', 'ok');
      refresh();
    });
    const all = document.getElementById('pp-all');
    if (all) all.onclick = () => UI.confirm('Confirmar todas', `Confirmar o recebimento de <b>${pend.length}</b> vendas de uma vez? Isso libera todas as comissões correspondentes.`, () => {
      pend.forEach(s => OB.setPagamento(s.id, 'recebido'));
      UI.toast('Tudo confirmado', `${pend.length} pagamentos confirmados.`, 'ok');
      refresh();
    }, 'Confirmar todas');
  },

  view_vendas() {
    const all = OB.sales().slice().sort((a, b) => new Date(b.data) - new Date(a.data));
    const v = document.getElementById('main-view');
    if (!all.length) { v.innerHTML = Consultor.empty('cart', 'Nenhuma venda', 'As vendas lançadas pelos consultores aparecem aqui.'); return; }
    const pend = this.pagamentosPendentes().length;
    v.innerHTML = `
      ${pend ? `<div class="notice" style="margin-bottom:14px;align-items:center">${UI.icon('info',16)}<div style="flex:1"><b>${pend} venda(s) aguardando confirmação de pagamento.</b> Confirme o recebimento para liberar a comissão do consultor.</div><button class="btn green" id="vd-conf-all" style="white-space:nowrap">${UI.icon('check',16)} Conferir agora</button></div>` : ''}
      <div class="seg" id="vd-filter" style="margin-bottom:14px">
        <button data-f="all" class="on">Todas (${all.length})</button>
        <button data-f="pend">A confirmar (${pend})</button>
      </div>
      <div class="card" style="padding:0" id="vd-table"></div>`;
    const draw = (f) => {
      const rows = f === 'pend' ? all.filter(s => s.statusProposta === 'aprovada' && s.statusPagamento !== 'recebido') : all;
      const el = document.getElementById('vd-table');
      if (!rows.length) { el.innerHTML = Consultor.empty('check', 'Nada por aqui', 'Nenhuma venda neste filtro.'); return; }
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Data</th><th>Consultor</th><th>Cliente</th><th>Produto</th><th>Valor</th><th>Pagamento</th><th>Comissão</th><th></th></tr></thead><tbody>
        ${rows.map(s => {
          const cons = OB.userById(s.consultorId); const cli = OB.clientById(s.clientId); const p = OB.PRODUTOS.find(x => x.id === s.produto);
          const aprovada = s.statusProposta === 'aprovada';
          const recebido = s.statusPagamento === 'recebido';
          const pag = !aprovada ? '<span class="mut" style="font-size:12px">—</span>'
            : (recebido ? '<span class="chip green nowrap">Pago confirmado</span>' : '<span class="chip warn nowrap">Aguardando pagamento</span>');
          const acao = aprovada
            ? (recebido
                ? `<button class="iconbtn" data-desfazer="${s.id}" title="Desfazer confirmação de pagamento">${UI.icon('x',15)}</button>`
                : `<button class="btn green" data-confirmar="${s.id}" style="padding:7px 14px;font-size:13px;white-space:nowrap">${UI.icon('check',15)} Confirmar</button>`)
            : '';
          return `<tr><td class="nowrap">${OB.dataBR(s.data)}</td><td class="strong">${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}</td>
            <td>${cli ? cli.nome : '-'}</td><td>${OB.produtosNomes(s)}</td><td class="strong nowrap">${OB.brl(s.valor)}</td>
            <td>${pag}</td><td>${this.comLabel(s)}</td>
            <td class="row" style="justify-content:flex-end">${acao}</td></tr>`;
        }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-confirmar]').forEach(b => b.onclick = () => this.confirmarRecebimentoVenda(b.dataset.confirmar, () => this.render('vendas')));
      el.querySelectorAll('[data-desfazer]').forEach(b => b.onclick = () => {
        const s = OB.sales().find(x => x.id === b.dataset.desfazer); if (!s) return;
        UI.confirm('Desfazer confirmação', 'Marcar este pagamento como <b>não recebido</b> novamente? A comissão volta para "em conferência".', () => {
          OB.setPagamento(s.id, 'pendente'); UI.toast('Confirmação desfeita', '', 'ok'); App.refreshBadge(); this.render('vendas');
        }, 'Desfazer');
      });
    };
    draw('all');
    document.querySelectorAll('#vd-filter button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#vd-filter button').forEach(x => x.classList.remove('on')); b.classList.add('on'); draw(b.dataset.f);
    });
    const ca = document.getElementById('vd-conf-all'); if (ca) ca.onclick = () => this.pagamentosPopup();
  },

  /* ====================== CONTRATOS (controle + filtros) ====================== */
  _ctFiltro: { cliente: '', servico: '', uf: '', consultor: '', de: '', ate: '', status: 'todos' },
  view_contratos() {
    const v = document.getElementById('main-view');
    const all = OB.contratos().slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    if (!all.length) { v.innerHTML = Consultor.empty('contract', 'Nenhum contrato ainda', 'Quando os consultores gerarem contratos a partir das vendas, eles aparecem aqui com filtros e controle de aceite.'); return; }
    const consultores = (OB.profiles || []).filter(p => p.role !== 'admin').sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const ufs = [...new Set(all.map(c => (c.dados && c.dados.cliente && c.dados.cliente.uf) || '').filter(Boolean))].sort();
    const f = this._ctFiltro;
    const aceitos = all.filter(c => c.status === 'aceito').length;
    v.innerHTML = `
      <div class="kpis kpis-3" style="margin-bottom:14px">
        <div class="kpi"><div class="kpi-v">${all.length}</div><div class="kpi-l">Contratos</div></div>
        <div class="kpi"><div class="kpi-v" style="color:#16a34a">${aceitos}</div><div class="kpi-l">Aceitos</div></div>
        <div class="kpi"><div class="kpi-v" style="color:var(--brand)">${all.length - aceitos}</div><div class="kpi-l">Aguardando aceite</div></div>
      </div>
      <div class="cons-filtros" id="ct-filtros">
        <input id="ctf-cliente" placeholder="Buscar cliente / nº" value="${f.cliente}"/>
        <select id="ctf-servico"><option value="">Todos os serviços</option>${OB.PRODUTOS.map(p => `<option value="${p.id}" ${f.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select>
        <select id="ctf-uf"><option value="">Todas as regiões</option>${ufs.map(u => `<option value="${u}" ${f.uf === u ? 'selected' : ''}>${this.UF_NOMES[u] || u}</option>`).join('')}</select>
        <select id="ctf-cons"><option value="">Todos os consultores</option>${consultores.map(c => `<option value="${c.id}" ${f.consultor === c.id ? 'selected' : ''}>${c.nome} ${c.sobrenome || ''}</option>`).join('')}</select>
        <select id="ctf-status"><option value="todos">Todos os status</option><option value="aceito" ${f.status === 'aceito' ? 'selected' : ''}>Aceitos</option><option value="pendente" ${f.status === 'pendente' ? 'selected' : ''}>Aguardando</option></select>
        <label class="ctf-date">De <input type="date" id="ctf-de" value="${f.de}"/></label>
        <label class="ctf-date">Até <input type="date" id="ctf-ate" value="${f.ate}"/></label>
        <button class="btn ghost" id="ctf-limpar">Limpar</button>
      </div>
      <div class="card" style="padding:0" id="ct-table"></div>`;
    const draw = () => {
      const ff = this._ctFiltro;
      const q = (ff.cliente || '').toLowerCase();
      const rows = all.filter(c => {
        const cl = (c.dados && c.dados.cliente) || {};
        if (q && !((cl.nome || '').toLowerCase().includes(q) || (c.numero || '').toLowerCase().includes(q))) return false;
        if (ff.servico && !((c.dados && c.dados.servicos) || []).some(s => s.id === ff.servico)) return false;
        if (ff.uf && cl.uf !== ff.uf) return false;
        if (ff.consultor && c.consultorId !== ff.consultor) return false;
        if (ff.status !== 'todos' && (ff.status === 'aceito' ? c.status !== 'aceito' : c.status === 'aceito')) return false;
        const dia = (c.criadoEm || '').slice(0, 10);
        if (ff.de && dia < ff.de) return false;
        if (ff.ate && dia > ff.ate) return false;
        return true;
      });
      const el = document.getElementById('ct-table');
      if (!rows.length) { el.innerHTML = Consultor.empty('contract', 'Nada neste filtro', 'Ajuste os filtros para ver os contratos.'); return; }
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Nº</th><th>Data</th><th>Cliente</th><th>Serviços</th><th>Consultor</th><th>Região</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map(c => {
          const cl = (c.dados && c.dados.cliente) || {};
          const cons = OB.userById(c.consultorId);
          const svc = ((c.dados && c.dados.servicos) || []).map(s => s.nome).join(' + ');
          const val = (c.dados && c.dados.pagamento) ? OB.money(c.dados.pagamento.valorCliente, c.dados.pagamento.moeda) : '';
          const st = c.status === 'aceito' ? `<span class="chip green nowrap">Aceito</span>` : `<span class="chip warn nowrap">Aguardando</span>`;
          return `<tr><td class="strong nowrap">${c.numero || '-'}</td><td class="nowrap">${OB.dataBR(c.criadoEm)}</td>
            <td>${cl.nome || '-'}</td><td>${svc}</td><td>${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}</td>
            <td class="nowrap">${cl.uf ? (this.UF_NOMES[cl.uf] || cl.uf) : '-'}</td><td class="strong nowrap">${val}</td><td>${st}</td>
            <td class="row" style="justify-content:flex-end;gap:4px"><button class="iconbtn" data-ct-ver="${c.id}" title="Visualizar">${UI.icon('eye',15)}</button><button class="iconbtn" data-ct-bx="${c.id}" title="Baixar">${UI.icon('download',15)}</button><button class="iconbtn danger" data-ct-del="${c.id}" title="Excluir contrato">${UI.icon('trash',15)}</button></td></tr>`;
        }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-ct-ver]').forEach(b => b.onclick = () => Consultor.visualizarContrato(OB.contratoById(b.dataset.ctVer)));
      el.querySelectorAll('[data-ct-bx]').forEach(b => b.onclick = () => Consultor.baixarContrato(OB.contratoById(b.dataset.ctBx)));
      el.querySelectorAll('[data-ct-del]').forEach(b => b.onclick = () => { const c = OB.contratoById(b.dataset.ctDel); if (!c) return; const cli = OB.clientById(c.clientId) || (c.dados && c.dados.cliente) || {}; UI.confirm('Excluir contrato', `Remover definitivamente o contrato <b>${c.numero}</b> de <b>${cli.nome || 'cliente'}</b>?`, () => { OB.removeContrato(c.id); UI.toast('Contrato excluído', c.numero, 'ok'); this.view_contratos(); }, 'Excluir contrato'); });
    };
    const capt = () => { this._ctFiltro = {
      cliente: document.getElementById('ctf-cliente').value,
      servico: document.getElementById('ctf-servico').value,
      uf: document.getElementById('ctf-uf').value,
      consultor: document.getElementById('ctf-cons').value,
      status: document.getElementById('ctf-status').value,
      de: document.getElementById('ctf-de').value,
      ate: document.getElementById('ctf-ate').value
    }; draw(); };
    ['ctf-servico', 'ctf-uf', 'ctf-cons', 'ctf-status', 'ctf-de', 'ctf-ate'].forEach(id => { const el = document.getElementById(id); if (el) el.onchange = capt; });
    const busca = document.getElementById('ctf-cliente'); let t; busca.oninput = () => { clearTimeout(t); t = setTimeout(capt, 300); };
    document.getElementById('ctf-limpar').onclick = () => { this._ctFiltro = { cliente: '', servico: '', uf: '', consultor: '', de: '', ate: '', status: 'todos' }; this.view_contratos(); };
    draw();
  },

  /* ====================== AVISOS (barra de comunicado) ====================== */
  // datas <-> input datetime-local (mantém no fuso local do navegador)
  _toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  },
  _fromLocalInput(v) { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString(); },

  view_avisos() {
    const a = OB.getAviso();
    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="avisos-grid">
        <div class="card">
          <div class="card-head"><h3>Mensagem do aviso</h3></div>
          <div class="field"><label>Texto que aparecerá na barra</label>
            <textarea id="av-texto" rows="3" placeholder="Ex.: Nova tabela de comissões vale a partir de segunda-feira. Confira em Vendas & Comissão!">${a.texto || ''}</textarea>
            <div class="hint">Aparece no topo da tela de todos os consultores enquanto estiver ativo e dentro do período.</div></div>
          <div class="grid-2">
            <div class="field"><label>Cor / tipo do alerta</label>
              <select id="av-tipo">${OB.TIPOS_AVISO.map(t => `<option value="${t.id}" ${a.tipo === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}</select></div>
            <div class="field"><label>Exibir para os consultores</label>
              <label class="seg" style="padding:3px;width:100%"><button type="button" class="${a.ativo ? '' : 'on'}" id="av-off" style="flex:1">Desligado</button><button type="button" class="${a.ativo ? 'on' : ''}" id="av-on" style="flex:1">Ligado</button></label></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Início (opcional)</label>
              <input id="av-inicio" type="datetime-local" value="${this._toLocalInput(a.inicio)}"/>
              <div class="hint">Deixe vazio para começar imediatamente.</div></div>
            <div class="field"><label>Fim (opcional)</label>
              <input id="av-fim" type="datetime-local" value="${this._toLocalInput(a.fim)}"/>
              <div class="hint">Deixe vazio para não expirar automaticamente.</div></div>
          </div>
          <div class="row" style="gap:10px;margin-top:6px">
            <button class="btn brand" id="av-save">${UI.icon('check',16)} Salvar aviso</button>
            <button class="btn ghost" id="av-remove">${UI.icon('trash',16)} Remover da tela</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Pré-visualização</h3></div>
          <div class="hint" style="margin-bottom:10px">É assim que a barra aparece no topo do consultor:</div>
          <div id="av-preview"></div>
          <div class="notice" style="margin-top:16px">${UI.icon('info',16)}<div>O consultor vê a barra ao <b>abrir ou recarregar</b> o sistema. Fora do período de início/fim, ela não aparece mesmo estando ligada.</div></div>
        </div>
      </div>`;

    const get = () => ({
      texto: document.getElementById('av-texto').value,
      tipo: document.getElementById('av-tipo').value,
      ativo: document.getElementById('av-on').classList.contains('on'),
      inicio: this._fromLocalInput(document.getElementById('av-inicio').value),
      fim: this._fromLocalInput(document.getElementById('av-fim').value)
    });
    const drawPreview = () => {
      const cur = get();
      const prev = document.getElementById('av-preview');
      if (!cur.texto.trim()) { prev.innerHTML = `<div class="hint">Digite um texto para ver a prévia.</div>`; return; }
      prev.innerHTML = App.avisoBarHTML(cur, true);
    };
    drawPreview();
    ['av-texto', 'av-tipo', 'av-inicio', 'av-fim'].forEach(id => { const el = document.getElementById(id); el.oninput = drawPreview; el.onchange = drawPreview; });
    const on = document.getElementById('av-on'), off = document.getElementById('av-off');
    on.onclick = () => { on.classList.add('on'); off.classList.remove('on'); };
    off.onclick = () => { off.classList.add('on'); on.classList.remove('on'); };

    document.getElementById('av-save').onclick = () => {
      const cur = get();
      if (cur.ativo && !cur.texto.trim()) return UI.toast('Escreva o texto', 'O aviso precisa de um texto para ser exibido', 'err');
      if (cur.inicio && cur.fim && new Date(cur.fim) <= new Date(cur.inicio)) return UI.toast('Datas invertidas', 'O fim precisa ser depois do início', 'err');
      OB.saveAviso(cur);
      App.renderAviso();
      UI.toast(cur.ativo ? 'Aviso publicado' : 'Aviso salvo', cur.ativo ? 'Já aparece no topo dos consultores' : 'Salvo, mas desligado', 'ok');
    };
    document.getElementById('av-remove').onclick = () => {
      UI.confirm('Remover aviso', 'Tirar a barra de aviso da tela dos consultores? O texto será apagado.', () => {
        OB.saveAviso({ texto: '', tipo: document.getElementById('av-tipo').value, ativo: false, inicio: null, fim: null });
        App.renderAviso();
        this.render('avisos');
        UI.toast('Aviso removido', '', 'ok');
      }, 'Remover');
    };
  },

  /* Ranking de consultores (compartilhado via App.renderRanking) */
  view_ranking() { App.renderRanking(document.getElementById('main-view'), null); },

  /* ====================== ATENDIMENTO / CHAT MANU ====================== */
  _consAv(id, nome) { const f = OB.fotos[id]; return `<span class="atend-av" data-av="${id}">${f ? `<img src="${f}" alt="">` : ((nome || '?')[0] || '?').toUpperCase()}</span>`; },
  view_atendimento() {
    const v = document.getElementById('main-view');
    const threads = OB.chatThreads();
    App.refreshChatBadges();
    if (!threads.length) {
      v.innerHTML = `<div class="card"><div class="port-soon">${UI.icon('chat',30)}<b>Nenhuma conversa ainda</b><p>Quando um consultor enviar dúvidas, urgências ou sugestões pelo chat da <b>Manu</b>, as conversas aparecem aqui para você responder.</p></div></div>`;
      return;
    }
    if (!this._atendSel || !threads.find(t => t.consultorId === this._atendSel)) this._atendSel = threads[0].consultorId;
    const sel = threads.find(t => t.consultorId === this._atendSel);
    const consAv = this._consAv(sel.consultorId, sel.nome);

    const listHTML = threads.map(t => {
      const prev = (t.ultima.texto || '').slice(0, 46).replace(/</g, '&lt;') || '...';
      const quem = t.ultima.autor === 'admin' ? 'Você: ' : '';
      return `<button type="button" class="atend-item${t.consultorId === this._atendSel ? ' on' : ''}" data-thread="${t.consultorId}">
        ${this._consAv(t.consultorId, t.nome)}
        <span class="atend-info"><b>${t.nome}${t.urgente ? ' <span class="atend-urg">urgente</span>' : ''}</b><span>${quem}${prev}</span></span>
        ${t.naoLidas ? `<span class="atend-count">${t.naoLidas}</span>` : ''}
      </button>`;
    }).join('');
    const conv = sel.msgs.map(m => App.chatBubble(m, m.autor === 'admin', consAv)).join('');

    v.innerHTML = `<div class="atend-grid">
      <div class="atend-list">${listHTML}</div>
      <div class="atend-conv">
        <div class="atend-conv__head">${consAv}<div class="atend-conv__nm"><b>${sel.nome}</b><span>Você responde como <b>Manu</b></span></div></div>
        <div class="atend-msgs" id="atend-msgs">${conv}</div>
        <div class="atend-reply">
          <textarea id="atend-text" rows="1" placeholder="Responder como Manu..."></textarea>
          <button class="btn brand" id="atend-send" type="button">${UI.icon('send',16)} Enviar</button>
        </div>
      </div>
    </div>`;

    OB.marcarChatLido(sel.consultorId, 'consultor').then(() => App.refreshChatBadges());
    OB.carregarFotos().then(() => v.querySelectorAll('.atend-av[data-av]').forEach(el => { const f = OB.fotos[el.dataset.av]; if (f) el.innerHTML = `<img src="${f}" alt="">`; })).catch(() => {});
    const mb = document.getElementById('atend-msgs'); if (mb) mb.scrollTop = mb.scrollHeight;

    v.querySelectorAll('[data-thread]').forEach(b => b.onclick = () => { this._atendSel = b.dataset.thread; this.render('atendimento'); });
    const ta = document.getElementById('atend-text');
    const send = async () => { const txt = (ta.value || '').trim(); if (!txt) return; ta.value = ''; ta.style.height = 'auto'; await OB.enviarMensagem({ consultorId: sel.consultorId, autor: 'admin', texto: txt, urgente: false }); this.render('atendimento'); };
    document.getElementById('atend-send').onclick = send;
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
  },

  /* ====================== PROPAGANDA / POP-UP (arte 4:5 agendada) ====================== */
  _DOW: [[0, 'Dom'], [1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb']],
  view_campanha() {
    const v = document.getElementById('main-view');
    const c = OB.getCampanha();
    this._campImg = ''; // imagem atual carrega async
    const dias = c.diasSemana || [];
    v.innerHTML = `
      <div class="avisos-grid">
        <div class="card">
          <div class="card-head"><h3>Arte da propaganda</h3></div>
          <div class="field"><label>Imagem (PNG, formato 4:5)</label>
            <input id="cp-file" type="file" accept="image/png,image/jpeg" hidden/>
            <button type="button" class="btn ghost" id="cp-pick" style="width:100%">${UI.icon('external',16)} Escolher arte no computador</button>
            <div class="hint">Envie a arte em <b>4:5</b> (ex.: 1080 × 1350 px). Ela é comprimida automaticamente para carregar rápido.</div></div>
          <div class="field"><label>Exibir para os consultores</label>
            <label class="seg" style="padding:3px;width:100%"><button type="button" class="${c.ativo ? '' : 'on'}" id="cp-off" style="flex:1">Desligado</button><button type="button" class="${c.ativo ? 'on' : ''}" id="cp-on" style="flex:1">Ligado</button></label></div>
          <div class="grid-2">
            <div class="field"><label>Início (opcional)</label>
              <input id="cp-inicio" type="datetime-local" value="${this._toLocalInput(c.inicio)}"/>
              <div class="hint">Vazio = começa já.</div></div>
            <div class="field"><label>Fim (opcional)</label>
              <input id="cp-fim" type="datetime-local" value="${this._toLocalInput(c.fim)}"/>
              <div class="hint">Vazio = não expira.</div></div>
          </div>
          <div class="field"><label>Dias da semana (opcional)</label>
            <div class="dow-row">${this._DOW.map(([n, lbl]) => `<button type="button" class="dow ${dias.includes(n) ? 'on' : ''}" data-dow="${n}">${lbl}</button>`).join('')}</div>
            <div class="hint">Nenhum marcado = todos os dias.</div></div>
          <div class="grid-2">
            <div class="field"><label>A partir das (opcional)</label>
              <input id="cp-hi" type="time" value="${c.horaInicio || ''}"/></div>
            <div class="field"><label>Até as (opcional)</label>
              <input id="cp-hf" type="time" value="${c.horaFim || ''}"/></div>
          </div>
          <div class="row" style="gap:10px;margin-top:6px">
            <button class="btn brand" id="cp-save">${UI.icon('check',16)} Salvar e publicar</button>
            <button class="btn ghost" id="cp-remove">${UI.icon('trash',16)} Remover arte</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Pré-visualização (4:5)</h3></div>
          <div class="hint" style="margin-bottom:12px">É a arte que o consultor vê no pop-up ao logar:</div>
          <div class="camp-frame" id="cp-frame"><div class="camp-frame__empty">${UI.icon('gallery',30)}<span>Nenhuma arte enviada</span></div></div>
          <div class="row" style="gap:10px;margin-top:14px">
            <button class="btn ghost" id="cp-preview" disabled>${UI.icon('external',16)} Ver como pop-up</button>
          </div>
          <div class="notice" style="margin-top:16px">${UI.icon('info',16)}<div>O pop-up aparece <b>centralizado</b> (cabe em qualquer tela, não ocupa tudo) <b>toda vez que o consultor loga</b>, dentro do período/dias/horário definidos. Ele fecha no <b>X</b>, quando o consultor quiser.</div></div>
        </div>
      </div>`;

    const frame = document.getElementById('cp-frame');
    const drawFrame = () => {
      frame.innerHTML = this._campImg
        ? `<img src="${this._campImg}" alt="Arte da propaganda"/>`
        : `<div class="camp-frame__empty">${UI.icon('gallery',30)}<span>Nenhuma arte enviada</span></div>`;
      document.getElementById('cp-preview').disabled = !this._campImg;
    };
    // carrega a arte atual (async, sem travar)
    OB.getCampanhaImagem().then(img => { if (img) { this._campImg = img; drawFrame(); } });

    // upload
    const file = document.getElementById('cp-file');
    document.getElementById('cp-pick').onclick = () => file.click();
    file.onchange = () => {
      const f = file.files && file.files[0]; if (!f) return;
      if (!/image\/(png|jpeg)/.test(f.type)) return UI.toast('Formato inválido', 'Envie um PNG (ou JPG)', 'err');
      const rd = new FileReader();
      rd.onload = async () => {
        const comp = await OB._comprimirArte(rd.result);
        this._campImg = comp; drawFrame();
        UI.toast('Arte carregada', 'Confira a prévia e clique em Salvar', 'ok');
      };
      rd.readAsDataURL(f);
    };

    // toggle e dias
    const on = document.getElementById('cp-on'), off = document.getElementById('cp-off');
    on.onclick = () => { on.classList.add('on'); off.classList.remove('on'); };
    off.onclick = () => { off.classList.add('on'); on.classList.remove('on'); };
    v.querySelectorAll('.dow').forEach(b => b.onclick = () => b.classList.toggle('on'));

    const get = () => ({
      imagem: this._campImg || '',
      ativo: on.classList.contains('on'),
      inicio: this._fromLocalInput(document.getElementById('cp-inicio').value),
      fim: this._fromLocalInput(document.getElementById('cp-fim').value),
      diasSemana: Array.from(v.querySelectorAll('.dow.on')).map(b => +b.dataset.dow),
      horaInicio: document.getElementById('cp-hi').value || '',
      horaFim: document.getElementById('cp-hf').value || ''
    });

    document.getElementById('cp-preview').onclick = () => { if (this._campImg) App.campanhaModal(this._campImg, null); };
    document.getElementById('cp-save').onclick = () => {
      const cur = get();
      if (cur.ativo && !cur.imagem) return UI.toast('Falta a arte', 'Envie uma imagem para publicar o pop-up', 'err');
      if (cur.inicio && cur.fim && new Date(cur.fim) <= new Date(cur.inicio)) return UI.toast('Datas invertidas', 'O fim precisa ser depois do início', 'err');
      if (cur.horaInicio && cur.horaFim && cur.horaFim <= cur.horaInicio) return UI.toast('Horário invertido', 'O horário final precisa ser depois do inicial', 'err');
      OB.saveCampanha(cur);
      UI.toast(cur.ativo ? 'Propaganda publicada' : 'Propaganda salva', cur.ativo ? 'Aparece no próximo login dos consultores' : 'Salva, mas desligada', 'ok');
    };
    document.getElementById('cp-remove').onclick = () => {
      UI.confirm('Remover propaganda', 'Tirar o pop-up da tela dos consultores? A arte será apagada.', () => {
        this._campImg = '';
        OB.saveCampanha({ imagem: '', ativo: false, inicio: null, fim: null, diasSemana: [], horaInicio: '', horaFim: '' });
        this.render('campanha');
        UI.toast('Propaganda removida', '', 'ok');
      }, 'Remover');
    };
  },

  /* ====================== TREINAMENTOS DA EQUIPE ====================== */
  view_treinamentos() {
    const v = document.getElementById('main-view');
    const consultores = this.consultores();
    const disp = TREINOS.disponiveis();
    // KPIs
    const totalCert = OB.db.treinosAll.filter(r => r.concluido).length;
    const comAlgum = new Set(OB.db.treinosAll.filter(r => r.concluido).map(r => r.consultorId)).size;
    const rk = OB.rankingTreinos();
    const mediaGeral = rk.length ? Math.round(rk.reduce((t, r) => t + Number(r.media || 0), 0) / rk.length) : 0;
    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:18px">
        ${Consultor.kpi('shield', totalCert, 'Certificados emitidos', 'Treinamentos concluídos no total')}
        ${Consultor.kpi('users', comAlgum + '/' + consultores.length, 'Consultores certificados', 'Com ao menos 1 treinamento')}
        ${Consultor.kpi('trend', mediaGeral + '%', 'Média geral', 'Média das melhores notas')}
      </div>
      <div class="nav-label" style="padding-left:0;margin-bottom:10px">Progresso por consultor</div>
      <div class="card" style="padding:0"><div class="table-wrap"><table><thead><tr>
        <th>Consultor</th><th>Certificados</th><th>Progresso</th><th>Produtos</th></tr></thead><tbody>
        ${consultores.map(c => {
          const prog = OB.treinosDoConsultor(c.id);
          const feitos = disp.filter(p => prog[p.id] && prog[p.id].concluido);
          const pct = disp.length ? Math.round(feitos.length / disp.length * 100) : 0;
          const chips = disp.map(p => {
            const pr = prog[p.id];
            const ok = pr && pr.concluido;
            return `<span class="chip ${ok ? 'green' : 'gray'} nowrap" title="${p.nome}${pr ? ' · ' + pr.melhorNota + '%' : ' · não iniciado'}">${ok ? UI.icon('check',11) + ' ' : ''}${p.nome}${pr ? ' ' + pr.melhorNota + '%' : ''}</span>`;
          }).join(' ');
          return `<tr>
            <td class="strong">${c.nome} ${c.sobrenome || ''}</td>
            <td class="strong">${feitos.length}/${disp.length}</td>
            <td style="min-width:120px"><div class="bar" style="margin:0"><i data-w="${pct}"></i></div></td>
            <td><div class="row" style="gap:6px;flex-wrap:wrap">${chips}</div></td>
          </tr>`;
        }).join('')}
      </tbody></table></div></div>
      <div class="hint" style="margin-top:10px">Conforme novos treinamentos de produto forem lançados, eles aparecem aqui automaticamente para toda a equipe.</div>`;
    App.animateBars();
  },

  /* ====================== PERFIL ADMIN ====================== */
  view_perfil() { Consultor.view_perfil(); }
};
