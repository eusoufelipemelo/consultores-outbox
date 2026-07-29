/* ============================================================
   OutBox Consultores — Painel do Administrador (admin.js)
   Acesso a todos os dados · gestão financeira de comissões e prêmios.
   ============================================================ */
const Admin = {
  HOME: 'painel',
  /* atalhos da barra inferior no celular (o 5º item abre o menu completo) */
  TABS: ['painel', 'consultores', 'vendas', 'financeiro'],
  NAV: [
    // Dashboard
    { id: 'painel',     label: 'Painel Geral',     icon: 'overview', home: true },
    // Operação — fluxo de acompanhamento da rede e entrega
    { id: 'consultores',label: 'Consultores',      icon: 'users',    sec: 'Operação' },
    { id: 'vendas',     label: 'Vendas',           icon: 'cart',     sec: 'Operação' },
    { id: 'financeiro', label: 'Financeiro',       icon: 'money',    sec: 'Operação' },
    { id: 'bonus',      label: 'Bônus',            icon: 'prize',    sec: 'Operação' },
    { id: 'contratos',  label: 'Contratos',        icon: 'contract', sec: 'Operação' },
    { id: 'projetos',   label: 'Projetos',         icon: 'briefcase',sec: 'Operação' },
    { id: 'briefings',  label: 'Briefings',        icon: 'docs',     sec: 'Operação' },
    { id: 'timeline',   label: 'Linha do Tempo',   icon: 'trend',    sec: 'Operação' },
    { id: 'atendimento',label: 'Atendimento',      icon: 'chat',     sec: 'Operação' },
    // Gestão & conteúdo
    { id: 'produtos',   label: 'Produtos',         icon: 'quote',    sec: 'Gestão & Conteúdo' },
    { id: 'criativos',  label: 'Criativos',        icon: 'creative', sec: 'Gestão & Conteúdo' },
    { id: 'campanha',   label: 'Propaganda',       icon: 'megaphone',sec: 'Gestão & Conteúdo' },
    { id: 'avisos',     label: 'Avisos',           icon: 'bell',     sec: 'Gestão & Conteúdo' },
    { id: 'treinamentos', label: 'Treinamentos',   icon: 'academy',  sec: 'Gestão & Conteúdo' },
    { id: 'mapa',       label: 'Mapa da Rede',     icon: 'map',      sec: 'Gestão & Conteúdo' },
    { id: 'ranking',    label: 'Ranking',          icon: 'ranking',  sec: 'Gestão & Conteúdo' },
    // Administração do próprio time interno
    { id: 'loja',       label: 'Loja',             icon: 'cart',     sec: 'Administração' },
    { id: 'equipe',     label: 'Equipe',           icon: 'clients',  sec: 'Administração' }
  ],
  titles: {
    painel:      ['Painel Geral', 'Visão consolidada de toda a operação'],
    financeiro:  ['Gestão Financeira', 'Comissões e prêmios — pague mediante comprovação'],
    consultores: ['Consultores', 'Todos os consultores e seus números'],
    ranking:     ['Ranking de Consultores', 'Os 10 primeiros em pontos (vendas + treinamentos)'],
    mapa:        ['Mapa da Rede', 'Consultores por estado do Brasil — clique para ver as cidades'],
    vendas:      ['Vendas', 'Todas as vendas lançadas no sistema'],
    produtos:    ['Produtos', 'Catálogo de serviços: cadastre, precifique e publique para os consultores'],
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
    v.querySelectorAll('[data-add-entrega]').forEach(b => b.onclick = () => Consultor.anexarArquivosModal(b.dataset.addEntrega, 'entrega', 'admin', () => this.render('projetos')));
    Consultor.wireArquivos(v, () => this.render('projetos'));
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
    if (p.briefingRespostas) acoes.push(`<button class="btn ghost sm" data-ver-brief="${p.id}">${UI.icon('docs',14)} Ver briefing</button>`, `<button class="btn ghost sm" data-baixar-brief="${p.id}">${UI.icon('download',14)} Baixar briefing</button>`);
    // botão de anexar arquivos de entrega (docs, artes finais) disponível a partir da produção
    const podeEntregarArq = ['em_producao', 'em_revisao', 'entregue', 'aprovado'].includes(p.status);
    if (podeEntregarArq) acoes.push(`<button class="btn ghost sm" data-add-entrega="${p.id}">${UI.icon('download',14)} Anexar arquivos</button>`);
    return `<div class="card proj-card">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div style="min-width:0"><b style="font-size:15px">${cli ? cli.nome : 'Cliente'}</b>
          <div class="mut" style="font-size:12.5px">${this._prodNomes(p.produtos)} · Consultor: ${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}</div></div>
        <span class="chip ${p.status === 'aprovado' ? 'green' : p.status === 'briefing_recebido' ? 'warn' : 'brand'} nowrap">${et.nome || ''}</span>
      </div>
      <div style="margin-top:14px">${Consultor.timelineHTML(p)}</div>
      ${respostas}
      ${Consultor.projArquivosHTML(p, { admin: true })}
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
      sub: 'Por link, por arquivos, ou os dois',
      body: `
        <div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>Entregue o projeto por <b>link</b> (site publicado, Drive, protótipo) e/ou anexando os <b>arquivos</b> (artes finais, documentos, PDFs). O consultor recebe em tempo real e compartilha com o cliente.</div></div>
        <div class="field"><label>Link do projeto <span style="font-weight:400;color:var(--text-mut)">(opcional)</span></label><input id="pj-link" type="url" value="${p.linkFinal || ''}" placeholder="https://..."/></div>
        <div class="field"><label>Arquivos de entrega <span style="font-weight:400;color:var(--text-mut)">(opcional)</span></label>
          <label class="arq-drop" for="pj-files">${UI.icon('download',18)}<span>Escolher arquivos (até 8 MB cada)</span></label>
          <input id="pj-files" type="file" multiple hidden/>
          <div class="arq-pre" id="pj-pre"></div></div>
        <div class="err" id="pj-err" style="display:none">Informe um link ou anexe ao menos um arquivo.</div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="pj-ok">${UI.icon('check',16)} Entregar</button>`
    });
    const fInput = document.getElementById('pj-files'); const pre = document.getElementById('pj-pre');
    let files = [];
    fInput.onchange = () => { files = [...fInput.files]; pre.innerHTML = files.map(f => `<span class="arq-chip">${UI.icon('docs',12)} ${f.name}</span>`).join(''); };
    document.getElementById('pj-ok').onclick = async () => {
      const link = (document.getElementById('pj-link').value || '').trim();
      if (!link && !files.length) { document.getElementById('pj-err').style.display = 'block'; return; }
      const btn = document.getElementById('pj-ok'); btn.disabled = true; btn.textContent = 'Enviando...';
      if (files.length) await Consultor.subirArquivos(projId, 'entrega', 'admin', files);
      if (link) p.linkFinal = link;
      OB.setEtapaProjeto(p, 'entregue');
      UI.closeModal();
      UI.toast('Projeto entregue!', 'O consultor já pode ver e compartilhar.', 'ok');
      App.refreshProjetosBadge();
      this.render(App.current || 'projetos');
    };
  },

  /* ====================== LINHA DO TEMPO (admin: edita status + solicita material) ====================== */
  view_timeline() {
    const v = document.getElementById('main-view');
    const projs = OB.projetos().slice().sort((a, b) => OB.etapaIndex(a.status) - OB.etapaIndex(b.status) || new Date(b.criadoEm) - new Date(a.criadoEm));
    const novos = projs.filter(p => p.status === 'briefing_recebido');
    const ativos = projs.filter(p => p.status !== 'aprovado' && p.status !== 'briefing_recebido');
    const concluidos = projs.filter(p => p.status === 'aprovado');

    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:16px">
        ${Consultor.kpi('bell', novos.length, 'Briefings recebidos', 'Prontos para iniciar a leitura')}
        ${Consultor.kpi('rocket', ativos.length, 'Em andamento', 'Produção, revisão e entrega')}
        ${Consultor.kpi('check', concluidos.length, 'Concluídos', 'Aprovados pelo cliente')}
      </div>
      <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Edite o <b>status da produção</b> de cada serviço: a linha do tempo se atualiza <b>em tempo real</b> para você e para o consultor. Precisa de algum material para dar sequência? Use <b>Solicitar material</b> — chega como mensagem para o consultor na hora.</div></div>
      ${novos.length ? `<div class="nav-label" style="padding-left:0">Briefings recebidos, iniciar leitura</div>${novos.map(p => this.timelineProjetoCard(p)).join('')}` : ''}
      ${ativos.length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Em andamento</div>${ativos.map(p => this.timelineProjetoCard(p)).join('')}` : ''}
      ${concluidos.length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Concluídos</div>${concluidos.map(p => this.timelineProjetoCard(p)).join('')}` : ''}
      ${!projs.length ? Consultor.empty('trend', 'Nenhum serviço em andamento', 'Quando um consultor enviar um briefing, o serviço aparece aqui para você acompanhar e produzir.') : ''}`;

    // editar status da produção (atualiza em tempo real p/ os dois lados)
    v.querySelectorAll('[data-set-status]').forEach(sel => sel.onchange = () => {
      const p = OB.projetoById(sel.dataset.setStatus); if (!p) return;
      OB.setEtapaProjeto(p, sel.value);
      UI.toast('Status atualizado', 'Etapa: ' + ((OB.ETAPAS_PROJETO.find(e => e.id === sel.value) || {}).nome || sel.value), 'ok');
      App.refreshProjetosBadge();
      this.render('timeline');
    });
    // enviar solicitação de material
    v.querySelectorAll('[data-sol-send]').forEach(b => b.onclick = () => {
      const inp = v.querySelector('#sol-' + b.dataset.solSend);
      if (inp && Consultor.enviarSolicitacao(b.dataset.solSend, inp.value)) { inp.value = ''; this.render('timeline'); }
    });
    v.querySelectorAll('[data-entregar]').forEach(b => b.onclick = () => this.entregarProjeto(b.dataset.entregar));
    v.querySelectorAll('[data-add-entrega]').forEach(b => b.onclick = () => Consultor.anexarArquivosModal(b.dataset.addEntrega, 'entrega', 'admin', () => this.render('timeline')));
    Consultor.wireArquivos(v, () => this.render('timeline'));
    App.refreshProjetosBadge();
  },

  timelineProjetoCard(p) {
    const cons = OB.userById(p.consultorId);
    const cli = OB.clientById(p.clientId);
    const et = OB.ETAPAS_PROJETO.find(e => e.id === p.status) || {};
    const respostas = p.briefingRespostas ? `<div class="proj-brief-box"><b>${UI.icon('docs',13)} Briefing do cliente</b><p>${(p.briefingRespostas).replace(/</g, '&lt;')}</p></div>` : '';
    const statusSel = `<div class="tl-editor">
      <label>${UI.icon('edit',13)} Status da produção</label>
      <select class="input" data-set-status="${p.id}">${OB.ETAPAS_PROJETO.map(e => `<option value="${e.id}" ${p.status === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
    </div>`;
    const solForm = `<div class="sol-form">
      <input type="text" id="sol-${p.id}" placeholder="Solicitar material ao consultor (ex.: logo em alta, textos, acessos)..."/>
      <button type="button" class="btn brand sm" data-sol-send="${p.id}">${UI.icon('send',14)} Solicitar</button>
    </div>`;
    const acoes = [];
    if (p.briefingRespostas) acoes.push(`<button class="btn ghost sm" data-ver-brief="${p.id}">${UI.icon('docs',14)} Ver briefing</button>`, `<button class="btn ghost sm" data-baixar-brief="${p.id}">${UI.icon('download',14)} Baixar briefing</button>`);
    if (['em_producao', 'em_revisao', 'entregue', 'aprovado'].includes(p.status)) acoes.push(`<button class="btn ghost sm" data-entregar="${p.id}">${UI.icon('external',14)} Entregar (link/arquivos)</button>`, `<button class="btn ghost sm" data-add-entrega="${p.id}">${UI.icon('download',14)} Anexar arquivos</button>`);
    acoes.push(`<button class="btn danger sm" data-del-proj="${p.id}">${UI.icon('trash',14)} Excluir</button>`);
    return `<div class="card proj-card">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div style="min-width:0"><b style="font-size:15px">${cli ? cli.nome : 'Cliente'}</b>
          <div class="mut" style="font-size:12.5px">${this._prodNomes(p.produtos)} · Consultor: ${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}</div></div>
        <span class="chip ${p.status === 'aprovado' ? 'green' : p.status === 'briefing_recebido' ? 'warn' : 'brand'} nowrap">${et.nome || ''}</span>
      </div>
      <div style="margin-top:14px">${Consultor.timelineHTML(p)}</div>
      ${statusSel}
      ${solForm}
      ${respostas}
      ${Consultor.projArquivosHTML(p, { admin: true })}
      ${acoes.length ? `<div class="proj-acoes">${acoes.join('')}</div>` : ''}
    </div>`;
  },

  /* ====================== BRIEFINGS (recebidos dos clientes) ====================== */
  _bfFiltro: { cliente: '', servico: '', consultor: '', de: '', ate: '' },
  view_briefings() {
    const v = document.getElementById('main-view');
    const all = OB.projetos().filter(p => p.briefingRespostas).slice()
      .sort((a, b) => new Date(b.briefingRecebidoEm || b.criadoEm) - new Date(a.briefingRecebidoEm || a.criadoEm));
    if (!all.length) { v.innerHTML = Consultor.empty('docs', 'Nenhum briefing recebido ainda', 'Quando um cliente finalizar e enviar o briefing, ele aparece aqui em tempo real para você baixar e iniciar a produção.'); return; }
    const consultores = (OB.profiles || []).filter(p => p.role !== 'admin').sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const servIds = [...new Set(all.flatMap(p => p.produtos || []))];
    const semana = Date.now() - 7 * 864e5;
    const novos = all.filter(p => new Date(p.briefingRecebidoEm || p.criadoEm).getTime() >= semana).length;
    const f = this._bfFiltro;
    v.innerHTML = `
      <div class="kpis-3" style="margin-bottom:16px">
        <div class="card kpi"><div class="ic">${UI.icon('docs', 20)}</div><div class="k-val">${all.length}</div><div class="k-lbl">Briefings recebidos</div></div>
        <div class="card kpi"><div class="ic ic-ok">${UI.icon('bell', 20)}</div><div class="k-val" style="color:#16a34a">${novos}</div><div class="k-lbl">Nos últimos 7 dias</div></div>
        <div class="card kpi"><div class="ic ic-warn">${UI.icon('rocket', 20)}</div><div class="k-val" style="color:var(--brand)">${OB.briefingsPendentesAdmin().length}</div><div class="k-lbl">A iniciar produção</div></div>
      </div>
      <div class="lib-head"><b>Briefings recebidos</b><span class="lib-count" id="bf-count">${all.length} briefings</span></div>
      <div class="ctl-toolbar">
        <div class="ctl-search">${UI.icon('search', 16)}<input id="bf-cliente" placeholder="Buscar por cliente" value="${f.cliente}"/></div>
        <div class="ctl-selrow">
          <div class="ctl-sel"><label for="bf-servico">Tipo de serviço</label>
            <select id="bf-servico"><option value="">Todos os serviços</option>${OB.PRODUTOS.filter(p => servIds.includes(p.id)).map(p => `<option value="${p.id}" ${f.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></div>
          <div class="ctl-sel"><label for="bf-cons">Consultor</label>
            <select id="bf-cons"><option value="">Todos os consultores</option>${consultores.map(c => `<option value="${c.id}" ${f.consultor === c.id ? 'selected' : ''}>${c.nome} ${c.sobrenome || ''}</option>`).join('')}</select></div>
          <div class="ctl-sel"><label>Período (data)</label>
            <div class="ctl-daterange"><input type="date" id="bf-de" value="${f.de}" aria-label="Data inicial"/><span>até</span><input type="date" id="bf-ate" value="${f.ate}" aria-label="Data final"/></div></div>
          <button type="button" class="ctl-clear" id="bf-limpar">${UI.icon('x', 14)} Limpar filtros</button>
        </div>
      </div>
      <div class="card" style="padding:0" id="bf-table"></div>`;
    const draw = () => {
      const ff = this._bfFiltro;
      const q = (ff.cliente || '').toLowerCase();
      const rows = all.filter(p => {
        const cl = OB.clientById(p.clientId) || {};
        if (q && !((cl.nome || '').toLowerCase().includes(q))) return false;
        if (ff.servico && !(p.produtos || []).includes(ff.servico)) return false;
        if (ff.consultor && p.consultorId !== ff.consultor) return false;
        const dia = (p.briefingRecebidoEm || p.criadoEm || '').slice(0, 10);
        if (ff.de && dia < ff.de) return false;
        if (ff.ate && dia > ff.ate) return false;
        return true;
      });
      const cnt = document.getElementById('bf-count'); if (cnt) cnt.textContent = `${rows.length} de ${all.length} briefings`;
      const el = document.getElementById('bf-table');
      if (!rows.length) { el.innerHTML = Consultor.empty('search', 'Nada neste filtro', 'Ajuste os filtros para ver os briefings.'); return; }
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Data</th><th>Cliente</th><th>Serviço(s)</th><th>Consultor</th><th>Etapa</th><th></th></tr></thead><tbody>
        ${rows.map(p => {
          const cl = OB.clientById(p.clientId) || {};
          const cons = OB.userById(p.consultorId);
          const svc = this._prodNomes(p.produtos);
          const et = OB.ETAPAS_PROJETO.find(e => e.id === p.status) || {};
          return `<tr><td class="nowrap">${OB.dataBR(p.briefingRecebidoEm || p.criadoEm)}</td>
            <td class="strong">${cl.nome || '-'}</td><td>${svc}</td>
            <td class="nowrap">${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}</td>
            <td><span class="chip ${p.status === 'aprovado' ? 'green' : p.status === 'briefing_recebido' ? 'warn' : 'brand'} nowrap">${et.nome || ''}</span></td>
            <td class="row" style="justify-content:flex-end;gap:4px"><button class="iconbtn" data-ver-brief="${p.id}" title="Ver briefing">${UI.icon('eye',15)}</button><button class="iconbtn" data-baixar-brief="${p.id}" title="Baixar briefing">${UI.icon('download',15)}</button></td></tr>`;
        }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-ver-brief]').forEach(b => b.onclick = () => Consultor.visualizarBriefing(b.dataset.verBrief));
      el.querySelectorAll('[data-baixar-brief]').forEach(b => b.onclick = () => Consultor.baixarBriefing(b.dataset.baixarBrief));
    };
    const capt = () => { this._bfFiltro = {
      cliente: document.getElementById('bf-cliente').value,
      servico: document.getElementById('bf-servico').value,
      consultor: document.getElementById('bf-cons').value,
      de: document.getElementById('bf-de').value,
      ate: document.getElementById('bf-ate').value
    }; draw(); };
    ['bf-servico', 'bf-cons', 'bf-de', 'bf-ate'].forEach(id => { const el = document.getElementById(id); if (el) el.onchange = capt; });
    const busca = document.getElementById('bf-cliente'); let t; busca.oninput = () => { clearTimeout(t); t = setTimeout(capt, 300); };
    document.getElementById('bf-limpar').onclick = () => { this._bfFiltro = { cliente: '', servico: '', consultor: '', de: '', ate: '' }; this.view_briefings(); };
    draw();
  },

  /* ====================== BÔNUS (cortesias a autorizar) ====================== */
  /* ====================== LOJA (admin) ====================== */
  view_loja() {
    const v = document.getElementById('main-view');
    const aba = this._lojaAba || 'produtos';
    const prods = OB.lojaProdutos();
    const peds = OB.lojaPedidos();
    const aguardandoPg = peds.filter(p => p.formaPagamento !== 'comissao' && p.pagamentoStatus !== 'confirmado' && p.status !== 'cancelado').length;
    const semEstoque = prods.filter(p => p.ativo && OB.lojaEstoqueTotal(p) === 0).length;
    v.innerHTML = `
      <div class="cards cols-4" style="margin-bottom:16px">
        ${Consultor.kpi('cart', prods.filter(p => p.ativo).length, 'Produtos na loja', prods.length + ' cadastrado(s)')}
        ${Consultor.kpi('receipt', aguardandoPg, 'Cobranças em aberto', 'Confirme o pagamento')}
        ${Consultor.kpi('money', OB.fmt(peds.filter(p => p.status !== 'cancelado').reduce((t, p) => t + p.total, 0)), 'Vendido na loja', peds.length + ' pedido(s)')}
        ${Consultor.kpi('clock', semEstoque, 'Sem estoque', 'Ativos e zerados')}
      </div>
      <div class="seg" id="loja-abas" style="margin-bottom:16px">
        <button class="${aba === 'produtos' ? 'on' : ''}" data-aba="produtos">Produtos (${prods.length})</button>
        <button class="${aba === 'pedidos' ? 'on' : ''}" data-aba="pedidos">Pedidos (${peds.length})</button>
        <button class="${aba === 'categorias' ? 'on' : ''}" data-aba="categorias">Categorias (${OB.lojaCategorias().length})</button>
      </div>
      <div id="loja-conteudo">${aba === 'produtos' ? this.lojaProdutosHTML() : aba === 'pedidos' ? this.lojaPedidosHTML() : this.lojaCategoriasHTML()}</div>`;
    v.querySelectorAll('#loja-abas button').forEach(b => b.onclick = () => { this._lojaAba = b.dataset.aba; this.view_loja(); });
    this.wireLoja(v);
  },

  wireLoja(v) {
    const q = (sel, fn) => v.querySelectorAll(sel).forEach(fn);
    q('[data-prod-novo]', b => b.onclick = () => this.produtoModal(null));
    q('[data-prod-edit]', b => b.onclick = () => this.produtoModal(OB.lojaProdutoById(b.dataset.prodEdit)));
    q('[data-prod-del]', b => b.onclick = () => {
      const p = OB.lojaProdutoById(b.dataset.prodDel); if (!p) return;
      UI.confirm('Excluir produto', `Remover <b>${p.titulo}</b> da loja? Os pedidos já feitos continuam no histórico.`,
        () => { OB.removeLojaProduto(p.id); UI.toast('Produto removido', '', 'ok'); this.view_loja(); }, 'Excluir');
    });
    q('[data-prod-toggle]', b => b.onclick = () => {
      const p = OB.lojaProdutoById(b.dataset.prodToggle); if (!p) return;
      p.ativo = !p.ativo; OB.saveLojaProduto(p);
      UI.toast(p.ativo ? 'Produto publicado' : 'Produto ocultado', p.ativo ? 'Já aparece na loja dos consultores.' : 'Não aparece mais na loja.', 'ok');
      this.view_loja();
    });
    q('[data-cat-nova]', b => b.onclick = () => this.categoriaModal(null));
    q('[data-cat-edit]', b => b.onclick = () => this.categoriaModal(OB.lojaCategoriaById(b.dataset.catEdit)));
    q('[data-cat-del]', b => b.onclick = () => {
      const c = OB.lojaCategoriaById(b.dataset.catDel); if (!c) return;
      const usados = OB.lojaProdutos().filter(p => p.categoriaId === c.id).length;
      UI.confirm('Excluir categoria', `Remover <b>${c.nome}</b>?${usados ? ` <b>${usados} produto(s)</b> ficam sem categoria.` : ''}`,
        () => { OB.removeLojaCategoria(c.id); UI.toast('Categoria removida', '', 'ok'); this.view_loja(); }, 'Excluir');
    });
    q('[data-ped-pago]', b => b.onclick = () => {
      const p = OB.lojaPedidos().find(x => x.id === b.dataset.pedPago); if (!p) return;
      UI.confirm('Confirmar pagamento', `Confirmar o recebimento de <b>${OB.fmt(p.total)}</b> do pedido <b>${p.numero}</b>?`,
        () => {
          p.pagamentoStatus = 'confirmado'; p.pagoEm = new Date().toISOString();
          if (p.status === 'aguardando' || p.status === 'novo') p.status = 'pago';
          OB.saveLojaPedido(p);
          UI.toast('Pagamento confirmado', `${p.numero} liberado para separação.`, 'ok');
          this.view_loja();
        }, 'Confirmar');
    });
    q('[data-ped-status]', s => s.onchange = () => {
      const p = OB.lojaPedidos().find(x => x.id === s.dataset.pedStatus); if (!p) return;
      p.status = s.value; OB.saveLojaPedido(p);
      UI.toast('Status atualizado', `Pedido ${p.numero}: ${OB.lojaStatusNome(p.status)}`, 'ok');
    });
  },

  lojaProdutosHTML() {
    const prods = OB.lojaProdutos();
    const head = `<div class="row between alc" style="margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div class="mut" style="font-size:12.5px">Publique um produto e ele aparece <b>na hora</b> na loja dos consultores.</div>
      <button class="btn brand" data-prod-novo>${UI.icon('plus',16)} Novo produto</button></div>`;
    if (!prods.length) return head + Consultor.empty('cart', 'Nenhum produto ainda', 'Cadastre o primeiro produto da loja da OutBox.');
    return head + `<div class="cards cols-3">${prods.map(p => {
      const cat = OB.lojaCategoriaById(p.categoriaId);
      const est = OB.lojaEstoqueTotal(p);
      const preco = OB.lojaPreco(p);
      const capa = (p.fotos || [])[0];
      return `<div class="card lp-card">
        <div class="lp-thumb">${capa ? `<img src="${capa}" alt="${p.titulo}">` : UI.icon('gallery', 26)}
          ${!p.ativo ? '<span class="lp-off">Oculto</span>' : ''}
          ${(p.fotos || []).length > 1 ? `<span class="lp-n">${p.fotos.length} fotos</span>` : ''}</div>
        <div class="lp-body">
          <b>${p.titulo}</b>
          <div class="lp-meta">${cat ? cat.nome : 'Sem categoria'} · ${OB.lojaTipoNome(p.tipo)}</div>
          <div class="lp-preco">${p.precoPromo && p.precoPromo < p.preco ? `<s>${OB.fmt(p.preco)}</s> ` : ''}<b>${OB.fmt(preco)}</b></div>
          <div class="lp-est ${est ? '' : 'zero'}">${est ? est + ' em estoque · ' + (p.variacoes || []).length + ' variações' : 'Sem estoque'}</div>
        </div>
        <div class="row" style="gap:7px;margin-top:10px;flex-wrap:wrap">
          <button class="btn ghost sm" data-prod-edit="${p.id}">${UI.icon('edit',14)} Editar</button>
          <button class="btn ghost sm" data-prod-toggle="${p.id}">${UI.icon(p.ativo ? 'lock' : 'check',14)} ${p.ativo ? 'Ocultar' : 'Publicar'}</button>
          <button class="btn ghost sm danger" data-prod-del="${p.id}">${UI.icon('trash',14)}</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  },

  lojaCategoriasHTML() {
    const cats = OB.lojaCategorias();
    const head = `<div class="row between alc" style="margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div class="mut" style="font-size:12.5px">As categorias organizam a vitrine e viram filtros para o consultor.</div>
      <button class="btn brand" data-cat-nova>${UI.icon('plus',16)} Nova categoria</button></div>`;
    if (!cats.length) return head + Consultor.empty('docs', 'Nenhuma categoria', 'Crie a primeira categoria da loja.');
    return head + `<div class="card" style="padding:0"><table class="tbl"><thead><tr><th>Categoria</th><th>Produtos</th><th>Status</th><th></th></tr></thead><tbody>
      ${cats.map(c => {
        const n = OB.lojaProdutos().filter(p => p.categoriaId === c.id).length;
        return `<tr><td><b>${c.nome}</b><div class="mut" style="font-size:11.5px">/${c.slug}</div></td>
          <td>${n}</td>
          <td><span class="chip ${c.ativo ? 'green' : 'gray'} nowrap">${c.ativo ? 'Ativa' : 'Inativa'}</span></td>
          <td style="text-align:right;white-space:nowrap">
            <button class="iconbtn" data-cat-edit="${c.id}" title="Editar">${UI.icon('edit',15)}</button>
            <button class="iconbtn" data-cat-del="${c.id}" title="Excluir">${UI.icon('trash',15)}</button></td></tr>`;
      }).join('')}</tbody></table></div>`;
  },

  lojaPedidosHTML() {
    const peds = OB.lojaPedidos();
    if (!peds.length) return Consultor.empty('receipt', 'Nenhum pedido ainda', 'Quando um consultor comprar na loja, o pedido aparece aqui.');
    const formaNome = { pix: 'PIX', cartao: 'Cartão de crédito', comissao: 'Descontado da comissão' };
    return `<div class="cards cols-2">${peds.map(p => `
      <div class="card">
        <div class="row between alc" style="gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <div><b style="font-size:15px">${p.numero || 'Pedido'}</b>
            <div class="mut" style="font-size:12px">${p.consultorNome || ''} · ${OB.dataBR(p.criadoEm)}</div></div>
          <select class="input" data-ped-status="${p.id}" style="max-width:190px;height:38px">
            ${OB.LOJA_STATUS.map(s => `<option value="${s.id}" ${p.status === s.id ? 'selected' : ''}>${s.nome}</option>`).join('')}
          </select>
        </div>
        <div class="pg-linha ${p.pagamentoStatus === 'confirmado' ? 'ok' : 'pend'}">
          <span>${UI.icon(p.formaPagamento === 'comissao' ? 'money' : 'receipt', 15)}</span>
          <div><b>${formaNome[p.formaPagamento] || p.formaPagamento || 'Pagamento'}</b>
            <span>${p.formaPagamento === 'comissao'
              ? `${OB.fmt(p.comissaoDebitada || p.total)} abatidos da comissão do consultor`
              : (p.pagamentoStatus === 'confirmado'
                  ? `Pagamento confirmado${p.pagoEm ? ' em ' + OB.dataBR(p.pagoEm) : ''}`
                  : `Cobrança ${p.cobrancaRef || ''} · aguardando confirmação`)}</span></div>
          ${p.formaPagamento !== 'comissao' && p.pagamentoStatus !== 'confirmado'
            ? `<button class="btn green sm" data-ped-pago="${p.id}">${UI.icon('check',14)} Confirmar pagamento</button>` : ''}
        </div>
        <div class="ped-itens">${(p.itens || []).map(i => `<div class="ped-item">
          <span>${i.qtd}x ${i.titulo}</span>
          <span class="mut">${[i.cor, i.tam, OB.lojaGeneroNome(i.genero)].filter(Boolean).join(' · ')}</span>
          <b>${OB.fmt((i.preco || 0) * (i.qtd || 1))}</b></div>`).join('')}</div>
        <div class="row between" style="font-size:13px;margin-top:10px;color:var(--text-mut)"><span>Subtotal</span><span>${OB.fmt(p.subtotal)}</span></div>
        <div class="row between" style="font-size:13px;color:var(--text-mut)"><span>Frete${p.cep ? ' · CEP ' + p.cep : ''}</span><span>${p.frete ? OB.fmt(p.frete) : 'Grátis'}</span></div>
        <div class="row between" style="font-size:16px;font-weight:800;margin-top:6px;padding-top:8px;border-top:1px solid var(--border)"><span>Total</span><span style="color:var(--brand)">${OB.fmt(p.total)}</span></div>
        ${p.endereco ? `<div class="mut" style="font-size:12px;margin-top:8px">${UI.icon('map',12)} ${p.endereco}</div>` : ''}
        ${p.obs ? `<div class="mut" style="font-size:12px;margin-top:4px">Obs: ${p.obs}</div>` : ''}
      </div>`).join('')}</div>`;
  },

  /* cadastro do produto: fotos 4:5, dados e grade de variações (cor × tamanho × gênero) */
  produtoModal(p) {
    const e = p || { id: OB.uid(), titulo: '', descricao: '', categoriaId: (OB.lojaCategorias()[0] || {}).id || null,
      tipo: 'camiseta', preco: 0, precoPromo: null, pesoG: 300, fotos: [], generos: ['unissex'], variacoes: [], ativo: true, ordem: 0, destaque: false };
    const g = k => (e[k] == null ? '' : String(e[k]).replace(/"/g, '&quot;'));
    let fotos = (e.fotos || []).slice();
    let vars = (e.variacoes || []).slice();

    UI.modal({
      title: p ? 'Editar produto' : 'Novo produto',
      sub: 'Fotos no formato 4:5 · grade de tamanhos e cores com estoque',
      size: 'lg',
      body: `
        <div class="nav-label" style="padding-left:0">Fotos do produto (até ${OB.LOJA_MAX_FOTOS} · formato 4:5)</div>
        <div class="pf-grid" id="pf-grid"></div>
        <label class="btn ghost sm" style="cursor:pointer;margin-bottom:18px">${UI.icon('gallery',15)} Adicionar fotos
          <input type="file" id="pf-input" accept="image/*" multiple hidden></label>
        <div class="hint" style="margin:-12px 0 18px">As imagens são recortadas automaticamente em 4:5 (proporção do card). A primeira foto é a capa.</div>

        <div class="nav-label" style="padding-left:0">Dados do produto</div>
        <div class="field"><label>Título <span class="req">*</span></label><input id="pr-titulo" value="${g('titulo')}" placeholder="Ex.: Camiseta OutBox Preta"/><div class="err">Obrigatório</div></div>
        <div class="field"><label>Descrição</label><textarea id="pr-desc" rows="3" placeholder="Tecido, modelagem, cuidados...">${e.descricao || ''}</textarea></div>
        <div class="grid-2">
          <div class="field"><label>Categoria</label><select id="pr-cat">${OB.lojaCategorias().map(c => `<option value="${c.id}" ${e.categoriaId === c.id ? 'selected' : ''}>${c.nome}</option>`).join('') || '<option value="">Sem categoria</option>'}</select></div>
          <div class="field"><label>Tipo de produto</label><select id="pr-tipo">${OB.LOJA_TIPOS.map(t => `<option value="${t.id}" ${e.tipo === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}</select></div>
          <div class="field"><label>Preço (R$) <span class="req">*</span></label><input id="pr-preco" type="number" step="0.01" value="${e.preco || ''}"/><div class="err">Informe o preço</div></div>
          <div class="field"><label>Preço promocional (opcional)</label><input id="pr-promo" type="number" step="0.01" value="${e.precoPromo != null ? e.precoPromo : ''}"/></div>
          <div class="field"><label>Peso unitário (g)</label><input id="pr-peso" type="number" value="${e.pesoG || 300}"/><div class="hint">Usado no cálculo do frete</div></div>
          <div class="field"><label>Ordem na vitrine</label><input id="pr-ordem" type="number" value="${e.ordem || 0}"/></div>
        </div>

        <div class="nav-label" style="padding-left:0">Grade: tamanhos, cores, gênero e estoque</div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
          <input class="input" id="pv-cor" placeholder="Cor (ex.: Preto)" style="max-width:170px"/>
          <select class="input" id="pv-genero" style="max-width:150px">${OB.LOJA_GENEROS.map(x => `<option value="${x.id}">${x.nome}</option>`).join('')}</select>
          <input class="input" id="pv-qtd" type="number" placeholder="Qtd por tamanho" value="10" style="max-width:150px"/>
          <button class="btn ghost sm" id="pv-add">${UI.icon('plus',15)} Gerar P/M/G/GG</button>
        </div>
        <div id="pv-lista"></div>
        <div class="hint" style="margin-top:8px">Adicione uma cor por vez: o sistema cria as 4 linhas de tamanho. Depois é só ajustar o estoque de cada uma.</div>

        <label class="row alc" style="gap:10px;margin-top:16px;cursor:pointer">
          <input type="checkbox" id="pr-ativo" ${e.ativo !== false ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--brand)">
          <span style="font-size:14px">Publicar na loja (os consultores veem imediatamente)</span></label>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="pr-save">${UI.icon('check',16)} ${p ? 'Salvar alterações' : 'Cadastrar produto'}</button>`
    });

    const renderFotos = () => {
      const el = document.getElementById('pf-grid');
      el.innerHTML = fotos.map((f, i) => `<div class="pf-item">
        <img src="${f}" alt="Foto ${i + 1}">
        ${i === 0 ? '<span class="pf-capa">Capa</span>' : ''}
        <div class="pf-acts">
          ${i > 0 ? `<button type="button" data-pf-up="${i}" title="Mover para frente">${UI.icon('chevron',13)}</button>` : ''}
          <button type="button" data-pf-rm="${i}" title="Remover">${UI.icon('x',13)}</button>
        </div></div>`).join('') || '<div class="pf-vazio">Nenhuma foto ainda</div>';
      el.querySelectorAll('[data-pf-rm]').forEach(b => b.onclick = () => { fotos.splice(+b.dataset.pfRm, 1); renderFotos(); });
      el.querySelectorAll('[data-pf-up]').forEach(b => b.onclick = () => { const i = +b.dataset.pfUp; const t = fotos[i - 1]; fotos[i - 1] = fotos[i]; fotos[i] = t; renderFotos(); });
    };
    renderFotos();

    // recorta a imagem em 4:5 (mesma proporção do card) antes de guardar
    const corta45 = (dataUrl) => new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const LARG = 800, ALT = 1000; // 4:5
        const cv = document.createElement('canvas'); cv.width = LARG; cv.height = ALT;
        const ctx = cv.getContext('2d');
        const escala = Math.max(LARG / img.width, ALT / img.height);
        const w = img.width * escala, h = img.height * escala;
        ctx.drawImage(img, (LARG - w) / 2, (ALT - h) / 2, w, h);
        try { res(cv.toDataURL('image/jpeg', 0.85)); } catch (err) { res(dataUrl); }
      };
      img.onerror = () => res(dataUrl);
      img.src = dataUrl;
    });
    document.getElementById('pf-input').onchange = async ev => {
      const files = [...ev.target.files];
      for (const f of files) {
        if (fotos.length >= OB.LOJA_MAX_FOTOS) { UI.toast('Limite de fotos', `Máximo de ${OB.LOJA_MAX_FOTOS} fotos por produto.`, 'err'); break; }
        const dataUrl = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.onerror = () => r(null); rd.readAsDataURL(f); });
        if (dataUrl) fotos.push(await corta45(dataUrl));
      }
      ev.target.value = ''; renderFotos();
    };

    const renderVars = () => {
      const el = document.getElementById('pv-lista');
      if (!vars.length) { el.innerHTML = '<div class="pf-vazio">Nenhuma variação. Informe uma cor acima e clique em gerar.</div>'; return; }
      const porCor = {};
      vars.forEach((v, i) => { const k = v.cor + '|' + v.genero; (porCor[k] = porCor[k] || []).push({ v, i }); });
      el.innerHTML = Object.keys(porCor).map(k => {
        const [cor, gen] = k.split('|');
        return `<div class="pv-grupo">
          <div class="pv-head"><b>${cor}</b><span class="chip gray nowrap">${OB.lojaGeneroNome(gen)}</span>
            <button type="button" class="iconbtn" data-pv-rmcor="${k}" title="Remover esta cor">${UI.icon('trash',14)}</button></div>
          <div class="pv-tams">${porCor[k].map(({ v, i }) => `<label class="pv-tam"><span>${v.tam}</span>
            <input type="number" min="0" data-pv-qtd="${i}" value="${v.qtd || 0}"></label>`).join('')}</div>
        </div>`;
      }).join('');
      el.querySelectorAll('[data-pv-qtd]').forEach(inp => inp.onchange = () => { vars[+inp.dataset.pvQtd].qtd = Math.max(0, parseInt(inp.value, 10) || 0); });
      el.querySelectorAll('[data-pv-rmcor]').forEach(b => b.onclick = () => {
        const [cor, gen] = b.dataset.pvRmcor.split('|');
        vars = vars.filter(v => !(v.cor === cor && v.genero === gen)); renderVars();
      });
    };
    renderVars();
    document.getElementById('pv-add').onclick = () => {
      const cor = document.getElementById('pv-cor').value.trim();
      const gen = document.getElementById('pv-genero').value;
      const qtd = Math.max(0, parseInt(document.getElementById('pv-qtd').value, 10) || 0);
      if (!cor) return UI.toast('Informe a cor', 'Digite a cor antes de gerar os tamanhos.', 'err');
      if (vars.some(v => v.cor.toLowerCase() === cor.toLowerCase() && v.genero === gen)) return UI.toast('Já existe', `A cor ${cor} (${OB.lojaGeneroNome(gen)}) já foi adicionada.`, 'err');
      OB.LOJA_TAMANHOS.forEach(t => vars.push({ cor, tam: t, genero: gen, qtd }));
      document.getElementById('pv-cor').value = ''; renderVars();
    };

    document.getElementById('pr-save').onclick = () => {
      const val = id => (document.getElementById(id).value || '').trim();
      const titulo = val('pr-titulo');
      const preco = parseFloat(val('pr-preco')) || 0;
      const inval = (id, bad) => { const el = document.getElementById(id); el.closest('.field').classList.toggle('has-error', bad); el.classList.toggle('invalid', bad); };
      inval('pr-titulo', !titulo); inval('pr-preco', preco <= 0);
      if (!titulo || preco <= 0) return UI.toast('Confira os campos', 'Título e preço são obrigatórios.', 'err');
      if (!fotos.length) return UI.toast('Adicione ao menos 1 foto', 'O card da loja precisa de uma imagem.', 'err');
      if (!vars.length) return UI.toast('Adicione as variações', 'Informe ao menos uma cor com os tamanhos.', 'err');
      const promo = parseFloat(val('pr-promo'));
      const generos = [...new Set(vars.map(v => v.genero))];
      OB.saveLojaProduto({
        id: e.id, titulo, descricao: val('pr-desc'),
        categoriaId: document.getElementById('pr-cat').value || null,
        tipo: document.getElementById('pr-tipo').value,
        preco, precoPromo: (!isNaN(promo) && promo > 0) ? promo : null,
        pesoG: parseInt(val('pr-peso'), 10) || 300,
        fotos, generos, variacoes: vars,
        destaque: !!e.destaque, ativo: document.getElementById('pr-ativo').checked,
        ordem: parseInt(val('pr-ordem'), 10) || 0, criadoEm: e.criadoEm || new Date().toISOString()
      });
      UI.closeModal();
      UI.toast(p ? 'Produto atualizado' : 'Produto cadastrado',
        document.getElementById ? 'Já está disponível na loja dos consultores.' : '', 'ok');
      this.view_loja();
    };
  },

  categoriaModal(c) {
    const e = c || { id: OB.uid(), nome: '', slug: '', ordem: OB.lojaCategorias().length + 1, ativo: true };
    UI.modal({
      title: c ? 'Editar categoria' : 'Nova categoria',
      body: `<div class="field"><label>Nome <span class="req">*</span></label><input id="ct-nome" value="${(e.nome || '').replace(/"/g, '&quot;')}" placeholder="Ex.: Camisetas"/><div class="err">Obrigatório</div></div>
        <div class="grid-2">
          <div class="field"><label>Ordem na vitrine</label><input id="ct-ordem" type="number" value="${e.ordem}"/></div>
          <div class="field"><label>Status</label><select id="ct-ativo"><option value="1" ${e.ativo ? 'selected' : ''}>Ativa</option><option value="0" ${!e.ativo ? 'selected' : ''}>Inativa</option></select></div>
        </div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="ct-save">${UI.icon('check',16)} Salvar</button>`
    });
    document.getElementById('ct-save').onclick = () => {
      const nome = document.getElementById('ct-nome').value.trim();
      if (!nome) { document.getElementById('ct-nome').closest('.field').classList.add('has-error'); return UI.toast('Informe o nome', '', 'err'); }
      const slug = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      OB.saveLojaCategoria({ id: e.id, nome, slug: slug || ('cat-' + Date.now()), ordem: parseInt(document.getElementById('ct-ordem').value, 10) || 0, ativo: document.getElementById('ct-ativo').value === '1' });
      UI.closeModal(); UI.toast(c ? 'Categoria atualizada' : 'Categoria criada', '', 'ok'); this.view_loja();
    };
  },

  /* ====================== PRODUTOS (catálogo de serviços) ====================== */
  _cpFiltro: { q: '', tipo: '' },

  view_produtos() {
    const v = document.getElementById('main-view');
    const f = this._cpFiltro;
    const todos = OB.PRODUTOS;
    const ativos = todos.filter(p => p.ativo !== false).length;

    v.innerHTML = `
      <div class="row between alc wrap" style="gap:12px;margin-bottom:16px">
        <div class="pc-kpis">
          <div class="pc-kpi"><b>${todos.length}</b><span>serviços no catálogo</span></div>
          <div class="pc-kpi"><b>${ativos}</b><span>visíveis ao consultor</span></div>
          <div class="pc-kpi"><b>${todos.filter(p => p.tipo === 'recorrente').length}</b><span>recorrentes</span></div>
        </div>
        <button class="btn brand" id="cp-novo">${UI.icon('plus', 16)} Novo produto</button>
      </div>

      <div class="pc-bar">
        <div class="pc-filtros" role="tablist" aria-label="Filtrar catálogo">
          ${[['', 'Todos'], ['pontual', 'Pontuais'], ['recorrente', 'Recorrentes'], ['inativo', 'Desativados']].map(([id, lb]) =>
            `<button type="button" class="pc-fil${f.tipo === id ? ' on' : ''}" data-tipo="${id}" role="tab" aria-selected="${f.tipo === id}">${lb}</button>`).join('')}
        </div>
        <div class="pc-busca">
          <label class="sr-only" for="cp-q">Buscar produto</label>
          ${UI.icon('search', 16)}
          <input id="cp-q" type="search" placeholder="Buscar produto..." value="${(f.q || '').replace(/"/g, '&quot;')}"/>
        </div>
      </div>

      <div class="notice" style="margin:0 0 16px">${UI.icon('info', 16)}<div>
        O que você salvar aqui aparece na hora na seção <b>Produtos</b> dos consultores e fica disponível para orçamento, contrato e briefing.
      </div></div>

      <div class="pc-grid admin" id="cp-grid"></div>`;

    this._cpPintar();
    document.getElementById('cp-novo').onclick = () => this.cpModal(null);
    v.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { this._cpFiltro.tipo = b.dataset.tipo; this.view_produtos(); });
    const q = document.getElementById('cp-q');
    q.oninput = () => { this._cpFiltro.q = q.value; this._cpPintar(); };
  },

  /* repinta só a grade: a busca não recarrega a tela e o foco fica no campo */
  _cpPintar() {
    const g = document.getElementById('cp-grid'); if (!g) return;
    const f = this._cpFiltro;
    const semAcento = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const termo = semAcento(f.q).trim();
    const lista = OB.PRODUTOS.slice()
      .sort((a, b) => (a.ordem || 900) - (b.ordem || 900) || a.nome.localeCompare(b.nome))
      .filter(p => {
        if (f.tipo === 'pontual' && p.tipo === 'recorrente') return false;
        if (f.tipo === 'recorrente' && p.tipo !== 'recorrente') return false;
        if (f.tipo === 'inativo' && p.ativo !== false) return false;
        if (termo && semAcento(p.nome + ' ' + (p.resumo || '')).indexOf(termo) < 0) return false;
        return true;
      });
    if (!lista.length) {
      g.innerHTML = `<div style="grid-column:1/-1">${Consultor.empty('search', 'Nenhum produto encontrado', 'Ajuste a busca ou cadastre um novo servico.')}</div>`;
      return;
    }
    g.innerHTML = lista.map(p => this.cpCard(p)).join('');
    g.querySelectorAll('[data-cp-edit]').forEach(b => b.onclick = () => this.cpModal(OB.produtoById(b.dataset.cpEdit)));
    g.querySelectorAll('[data-cp-tog]').forEach(b => b.onclick = () => {
      const p = OB.produtoById(b.dataset.cpTog); if (!p) return;
      p.ativo = p.ativo === false;
      OB.saveCatalogoProduto(p);
      UI.toast(p.ativo ? 'Produto ativado' : 'Produto desativado', p.ativo ? 'Ja aparece para os consultores' : 'Saiu da lista dos consultores', 'ok');
      this.view_produtos();
    });
    g.querySelectorAll('[data-cp-del]').forEach(b => b.onclick = () => this.cpExcluir(b.dataset.cpDel));
  },

  cpCard(p) {
    const rec = p.tipo === 'recorrente';
    const daSemente = (OB.PRODUTOS_SEMENTE || []).some(x => x.id === p.id);
    return `
      <article class="pc-card${p.ativo === false ? ' off' : ''}">
        <header class="pc-card-head">
          <span class="pc-ico">${UI.icon(p.icone || 'briefcase', 20)}</span>
          <div class="grow">
            <h3>${p.nome}</h3>
            <span class="pc-tag ${rec ? 'rec' : 'pon'}">${rec ? 'Recorrente' : 'Pontual'}</span>
            ${p.ativo === false ? '<span class="pc-tag off">Desativado</span>' : ''}
          </div>
        </header>
        <p class="pc-resumo">${p.resumo || (p.incluso || '').slice(0, 120)}</p>
        <div class="pc-precos">
          ${OB.PORTES.map(pt => `<div class="pc-preco"><span>${pt.nome.replace(' empresa', '')}</span><b>${OB.brl(p.precos[pt.id] || 0)}</b></div>`).join('')}
        </div>
        <ul class="pc-meta">
          <li>${UI.icon('clock', 14)} ${p.entrega || 'prazo a combinar'}</li>
          <li>${UI.icon('receipt', 14)} ${(p.pagamentos || []).map(x => OB.pagamentoNome(x)).join(', ') || 'sem forma definida'}</li>
        </ul>
        <footer class="pc-acts">
          <button class="btn ghost sm" data-cp-edit="${p.id}">${UI.icon('edit', 15)} Editar</button>
          <button class="btn ghost sm" data-cp-tog="${p.id}">${UI.icon(p.ativo === false ? 'eye' : 'eyeoff', 15)} ${p.ativo === false ? 'Ativar' : 'Ocultar'}</button>
          ${daSemente ? '' : `<button class="btn ghost sm danger" data-cp-del="${p.id}" aria-label="Excluir ${p.nome}">${UI.icon('trash', 15)}</button>`}
        </footer>
      </article>`;
  },

  cpExcluir(id) {
    const p = OB.produtoById(id); if (!p) return;
    UI.modal({
      title: 'Excluir ' + p.nome,
      sub: 'Esta ação não pode ser desfeita',
      body: `<div class="notice warn">${UI.icon('info', 16)}<div>O produto sai do catálogo dos consultores. Vendas e contratos já lançados com ele continuam no histórico. Se preferir apenas tirá-lo da vitrine, use <b>Ocultar</b>.</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="cp-del-go">${UI.icon('trash', 16)} Excluir</button>`
    });
    document.getElementById('cp-del-go').onclick = () => {
      OB.removeCatalogoProduto(id);
      UI.closeModal(); UI.toast('Produto excluído', '', 'ok'); this.view_produtos();
    };
  },

  /* ícones disponíveis para representar o serviço no card */
  CP_ICONES: ['briefcase', 'rocket', 'target', 'gallery', 'creative', 'cart', 'admin', 'shield', 'academy', 'megaphone', 'quote', 'trend'],

  cpModal(p) {
    const novo = !p;
    const e = p || { id: '', nome: '', icone: 'briefcase', tipo: 'pontual', recorrencia: 'unica', resumo: '', incluso: '',
      entrega: '', precos: { pequena: 0, media: 0, grande: 0, industria: 0 },
      pagamentos: ['pix', 'cartao', 'boleto'], parcelasMax: 12,
      contratoObjeto: '', contratoPrazo: '', contratoRevisoes: '', destaque: false, ativo: true, ordem: 900 };
    const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

    UI.modal({
      title: novo ? 'Novo produto' : 'Editar ' + e.nome,
      sub: 'Ao salvar, o serviço aparece imediatamente na seção Produtos dos consultores',
      size: 'lg',
      body: `
        <div class="cp-form">
          <div class="nav-label" style="padding-left:0">Identificação</div>
          <div class="grid-2">
            <div class="field"><label>Nome do produto <span class="req">*</span></label><input id="cp-nome" value="${esc(e.nome)}" placeholder="Ex.: Apresentação de Negócios Interativa"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Ordem na lista</label><input id="cp-ordem" type="number" value="${e.ordem != null ? e.ordem : 900}"/><div class="hint">Menor número aparece primeiro.</div></div>
          </div>
          <div class="field"><label>Resumo (uma linha que o consultor lê no card)</label><input id="cp-resumo" value="${esc(e.resumo)}" placeholder="Em poucas palavras, o que o cliente ganha com este serviço"/></div>
          <div class="field"><label>Ícone do card</label>
            <div class="cp-icones" id="cp-icones">
              ${this.CP_ICONES.map(ic => `<button type="button" class="cp-ico${ic === (e.icone || 'briefcase') ? ' on' : ''}" data-ic="${ic}" aria-label="Ícone ${ic}">${UI.icon(ic, 18)}</button>`).join('')}
            </div>
          </div>

          <div class="nav-label" style="padding-left:0">Como é cobrado</div>
          <div class="grid-2">
            <div class="field"><label>Natureza</label>
              <select id="cp-tipo">${OB.PRODUTO_TIPOS.map(t => `<option value="${t.id}" ${e.tipo === t.id ? 'selected' : ''}>${t.nome} — ${t.desc}</option>`).join('')}</select></div>
            <div class="field"><label>Periodicidade</label>
              <select id="cp-rec">
                <option value="unica" ${e.recorrencia === 'unica' ? 'selected' : ''}>Pagamento único</option>
                <option value="mensal" ${e.recorrencia === 'mensal' ? 'selected' : ''}>Por mês</option>
                <option value="anual" ${e.recorrencia === 'anual' ? 'selected' : ''}>Por ano</option>
              </select></div>
          </div>

          <div class="nav-label" style="padding-left:0">Tabela de valores por porte</div>
          <div class="cp-precos">
            ${OB.PORTES.map(pt => `
              <div class="field"><label>${pt.nome}</label>
                <input id="cp-p-${pt.id}" type="number" min="0" step="50" value="${(e.precos && e.precos[pt.id]) || 0}"/>
                <div class="hint">${pt.faixa}</div></div>`).join('')}
          </div>
          <label class="cp-check"><input type="checkbox" id="cp-mesmo"> <span>Cobrar o mesmo valor em todos os portes</span></label>

          <div class="nav-label" style="padding-left:0">Formas de pagamento aceitas</div>
          <div class="cp-pgtos" id="cp-pgtos">
            ${OB.PAGAMENTOS.map(fo => `
              <label class="cp-pgto${(e.pagamentos || []).indexOf(fo.id) >= 0 ? ' on' : ''}" data-pg="${fo.id}">
                <input type="checkbox" value="${fo.id}" ${(e.pagamentos || []).indexOf(fo.id) >= 0 ? 'checked' : ''}>
                <span><b>${fo.nome}</b><small>${fo.desc}</small></span>
              </label>`).join('')}
          </div>
          <div class="field" style="max-width:260px"><label>Máximo de parcelas no cartão</label>
            <select id="cp-parc">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<option value="${n}" ${(e.parcelasMax || 12) === n ? 'selected' : ''}>${n}x</option>`).join('')}</select></div>

          <div class="nav-label" style="padding-left:0">Escopo e prazo</div>
          <div class="field"><label>O que está incluso <span class="req">*</span></label>
            <textarea id="cp-incluso" rows="4" placeholder="Descreva tudo o que o cliente recebe. Este texto vai para o card, para a proposta e para o contrato.">${esc(e.incluso)}</textarea><div class="err">Obrigatório</div></div>
          <div class="field"><label>Prazo de entrega</label><input id="cp-entrega" value="${esc(e.entrega)}" placeholder="Ex.: 15 a 25 dias úteis"/></div>

          <div class="nav-label" style="padding-left:0">Contrato (opcional)</div>
          <div class="hint" style="margin:-6px 0 10px">Se deixar em branco, o sistema monta a cláusula a partir do escopo acima.</div>
          <div class="field"><label>Cláusula do objeto</label><textarea id="cp-cobj" rows="3" placeholder="prestação do serviço de ..., compreendendo ...">${esc(e.contratoObjeto)}</textarea></div>
          <div class="grid-2">
            <div class="field"><label>Prazo no contrato</label><input id="cp-cprazo" value="${esc(e.contratoPrazo)}" placeholder="15 a 25 dias úteis"/></div>
            <div class="field"><label>Revisões previstas</label><input id="cp-crev" value="${esc(e.contratoRevisoes)}" placeholder="2 (duas) rodadas de revisão"/></div>
          </div>

          <div class="cp-flags">
            <label class="cp-check"><input type="checkbox" id="cp-destaque" ${e.destaque ? 'checked' : ''}> <span>Destacar no catálogo do consultor</span></label>
            <label class="cp-check"><input type="checkbox" id="cp-ativo" ${e.ativo !== false ? 'checked' : ''}> <span>Visível para os consultores</span></label>
          </div>
        </div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="cp-save">${UI.icon('check', 16)} ${novo ? 'Cadastrar produto' : 'Salvar alterações'}</button>`
    });

    // ícone
    let icone = e.icone || 'briefcase';
    document.querySelectorAll('#cp-icones .cp-ico').forEach(b => b.onclick = () => {
      icone = b.dataset.ic;
      document.querySelectorAll('#cp-icones .cp-ico').forEach(x => x.classList.toggle('on', x === b));
    });
    // formas de pagamento (visual do card acompanha o checkbox)
    document.querySelectorAll('#cp-pgtos .cp-pgto').forEach(l => {
      const cb = l.querySelector('input');
      cb.onchange = () => l.classList.toggle('on', cb.checked);
    });
    // atalho: replicar o valor da pequena empresa nos demais portes
    document.getElementById('cp-mesmo').onchange = (ev) => {
      if (!ev.target.checked) return;
      const base = document.getElementById('cp-p-pequena').value;
      OB.PORTES.forEach(pt => { document.getElementById('cp-p-' + pt.id).value = base; });
    };
    // periodicidade acompanha a natureza escolhida
    const selTipo = document.getElementById('cp-tipo'), selRec = document.getElementById('cp-rec');
    selTipo.onchange = () => {
      if (selTipo.value === 'pontual') selRec.value = 'unica';
      else if (selRec.value === 'unica') selRec.value = 'anual';
    };

    document.getElementById('cp-save').onclick = () => {
      const nome = document.getElementById('cp-nome').value.trim();
      const incluso = document.getElementById('cp-incluso').value.trim();
      document.querySelectorAll('.cp-form .has-error').forEach(x => x.classList.remove('has-error'));
      if (!nome) { document.getElementById('cp-nome').closest('.field').classList.add('has-error'); return UI.toast('Informe o nome do produto', '', 'err'); }
      if (!incluso) { document.getElementById('cp-incluso').closest('.field').classList.add('has-error'); return UI.toast('Descreva o que está incluso', '', 'err'); }
      const pagamentos = Array.from(document.querySelectorAll('#cp-pgtos input:checked')).map(i => i.value);
      if (!pagamentos.length) return UI.toast('Escolha ao menos uma forma de pagamento', '', 'err');
      const precos = {};
      OB.PORTES.forEach(pt => { precos[pt.id] = Math.max(0, parseFloat(document.getElementById('cp-p-' + pt.id).value) || 0); });
      if (!Object.keys(precos).some(k => precos[k] > 0)) return UI.toast('Informe pelo menos um valor', '', 'err');

      const rec = selRec.value;
      const prod = Object.assign({}, e, {
        id: novo ? OB.slugProduto(nome) : e.id,
        nome, icone, resumo: document.getElementById('cp-resumo').value.trim(),
        tipo: selTipo.value, recorrencia: rec, anual: rec === 'anual',
        precos, pagamentos, parcelasMax: parseInt(document.getElementById('cp-parc').value, 10) || 12,
        incluso, entrega: document.getElementById('cp-entrega').value.trim(),
        contratoObjeto: document.getElementById('cp-cobj').value.trim(),
        contratoPrazo: document.getElementById('cp-cprazo').value.trim(),
        contratoRevisoes: document.getElementById('cp-crev').value.trim(),
        destaque: document.getElementById('cp-destaque').checked,
        ativo: document.getElementById('cp-ativo').checked,
        ordem: parseInt(document.getElementById('cp-ordem').value, 10) || 900
      });
      OB.saveCatalogoProduto(prod);
      UI.closeModal();
      UI.toast(novo ? 'Produto cadastrado' : 'Produto atualizado', 'Já está disponível para os consultores', 'ok');
      this.view_produtos();
    };
  },

  /* ====================== EQUIPE INTERNA ====================== */
  view_equipe() {
    const v = document.getElementById('main-view');
    if (!OB.podeGerirEquipe()) {
      v.innerHTML = Consultor.empty('lock', 'Acesso restrito', 'Só o Administrador Geral pode gerir a equipe interna.');
      return;
    }
    const todos = OB.equipe().slice().sort((a, b) => (a.nivel - b.nivel) || (a.nome || '').localeCompare(b.nome || ''));
    const f = this._eqFiltro || { q: '', cargo: '', status: '' };
    const lista = todos.filter(m => {
      if (f.cargo && m.cargo !== f.cargo) return false;
      if (f.status === 'ativo' && !m.ativo) return false;
      if (f.status === 'inativo' && m.ativo) return false;
      if (f.status === 'pendente' && m.userId) return false;
      if (f.q) { const t = `${m.nome} ${m.sobrenome} ${m.email} ${OB.cargoNome(m.cargo)}`.toLowerCase(); if (t.indexOf(f.q.toLowerCase()) < 0) return false; }
      return true;
    });
    const ativos = todos.filter(m => m.ativo).length;
    const pend = todos.filter(m => !m.userId).length;
    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:16px">
        ${Consultor.kpi('clients', todos.length, 'Colaboradores', ativos + ' ativo(s)')}
        ${Consultor.kpi('shield', OB.CARGOS.length, 'Cargos disponíveis', 'Com níveis de acesso')}
        ${Consultor.kpi('clock', pend, 'Aguardando 1º acesso', 'Ainda não criaram a conta')}
      </div>
      <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Cadastre o colaborador com o <b>e-mail que ele vai usar</b>. Quando ele criar a conta no sistema com esse mesmo e-mail, o acesso e o <b>cargo</b> são aplicados automaticamente.</div></div>
      <div class="row between alc" style="margin-bottom:14px;flex-wrap:wrap;gap:12px">
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <input class="input" id="eq-q" placeholder="Buscar por nome, e-mail ou cargo" value="${f.q}" style="min-width:240px"/>
          <select class="input" id="eq-cargo"><option value="">Todos os cargos</option>${OB.CARGOS.map(c => `<option value="${c.id}" ${f.cargo === c.id ? 'selected' : ''}>${c.nome}</option>`).join('')}</select>
          <select class="input" id="eq-status">
            <option value="" ${!f.status ? 'selected' : ''}>Todos</option>
            <option value="ativo" ${f.status === 'ativo' ? 'selected' : ''}>Ativos</option>
            <option value="inativo" ${f.status === 'inativo' ? 'selected' : ''}>Inativos</option>
            <option value="pendente" ${f.status === 'pendente' ? 'selected' : ''}>Aguardando 1º acesso</option>
          </select>
        </div>
        <button class="btn brand" id="eq-novo">${UI.icon('plus',16)} Cadastrar colaborador</button>
      </div>
      ${lista.length ? `<div class="cards cols-2">${lista.map(m => this.membroCard(m)).join('')}</div>`
        : Consultor.empty('clients', 'Nenhum colaborador', todos.length ? 'Nenhum resultado para esse filtro.' : 'Cadastre o primeiro membro da sua equipe interna.')}`;
    const setF = (k, val) => { this._eqFiltro = Object.assign({ q: '', cargo: '', status: '' }, f, { [k]: val }); this.view_equipe(); };
    const q = document.getElementById('eq-q');
    q.oninput = () => { clearTimeout(this._eqT); this._eqT = setTimeout(() => setF('q', q.value), 350); };
    document.getElementById('eq-cargo').onchange = e => setF('cargo', e.target.value);
    document.getElementById('eq-status').onchange = e => setF('status', e.target.value);
    document.getElementById('eq-novo').onclick = () => this.membroModal(null);
    v.querySelectorAll('[data-eq-edit]').forEach(b => b.onclick = () => this.membroModal(OB.membroById(b.dataset.eqEdit)));
    v.querySelectorAll('[data-eq-del]').forEach(b => b.onclick = () => this.excluirMembro(b.dataset.eqDel));
  },

  membroCard(m) {
    const c = OB.cargoById(m.cargo) || { nome: m.cargo, cor: '#8a96a3', desc: '', nivel: m.nivel };
    const ini = (m.nome || '?')[0].toUpperCase();
    const av = m.foto ? `<img src="${m.foto}" alt="">` : ini;
    const chip = !m.ativo ? '<span class="chip gray nowrap">Inativo</span>'
      : (m.userId ? '<span class="chip green nowrap">Acesso ativo</span>' : '<span class="chip warn nowrap">Aguardando 1º acesso</span>');
    return `<div class="card eq-card">
      <div class="eq-top">
        <span class="eq-av">${av}</span>
        <div class="eq-id">
          <b>${(m.nome + ' ' + m.sobrenome).trim() || m.email}</b>
          <span>${m.email}</span>
          ${m.celular ? `<span>${m.celular}</span>` : ''}
        </div>
        ${chip}
      </div>
      <div class="eq-cargo" style="--cc:${c.cor}">
        <span class="eq-badge">${UI.icon('shield',13)} ${c.nome}</span>
        <span class="eq-nivel">Nível ${c.nivel}</span>
      </div>
      <p class="eq-desc">${c.desc || ''}</p>
      ${m.cidade ? `<div class="eq-loc">${UI.icon('map',13)} ${m.cidade}${m.uf ? '/' + m.uf : ''}</div>` : ''}
      <div class="row" style="gap:8px;margin-top:12px">
        <button class="btn ghost sm" data-eq-edit="${m.id}">${UI.icon('edit',15)} Editar</button>
        <button class="btn ghost sm danger" data-eq-del="${m.id}">${UI.icon('trash',15)} Excluir</button>
      </div>
    </div>`;
  },

  membroModal(m) {
    const e = m || { id: OB.uid(), nome: '', sobrenome: '', email: '', doc: '', celular: '', nascimento: '', cargo: 'suporte', nivel: 5, foto: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', obs: '', ativo: true };
    const g = k => (e[k] == null ? '' : String(e[k]).replace(/"/g, '&quot;'));
    UI.modal({
      title: m ? 'Editar colaborador' : 'Cadastrar colaborador',
      sub: 'Dados cadastrais, cargo e nível de acesso',
      size: 'lg',
      body: `
        <div class="eq-form">
          <div class="eq-foto-wrap">
            <div class="eq-foto" id="eq-foto-prev">${e.foto ? `<img src="${e.foto}" alt="">` : UI.icon('clients', 26)}</div>
            <label class="btn ghost sm" style="cursor:pointer">${UI.icon('gallery',15)} Foto<input type="file" id="eq-foto" accept="image/*" hidden></label>
            ${e.foto ? '<button class="btn ghost sm danger" id="eq-foto-rm">Remover</button>' : ''}
          </div>

          <div class="nav-label" style="padding-left:0">Dados pessoais</div>
          <div class="grid-2">
            <div class="field"><label>Nome <span class="req">*</span></label><input id="eq-nome" value="${g('nome')}"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Sobrenome</label><input id="eq-sobre" value="${g('sobrenome')}"/></div>
            <div class="field"><label>CPF / CNPJ</label><input id="eq-doc" value="${g('doc')}" placeholder="000.000.000-00"/></div>
            <div class="field"><label>Nascimento</label><input id="eq-nasc" type="date" value="${g('nascimento')}"/></div>
          </div>

          <div class="nav-label" style="padding-left:0">Contato</div>
          <div class="grid-2">
            <div class="field"><label>E-mail de acesso <span class="req">*</span></label><input id="eq-email" type="email" value="${g('email')}" placeholder="nome@outboxgroup.com.br" ${m && m.userId ? 'readonly' : ''}/><div class="err">Informe um e-mail válido</div>
              <div class="hint">${m && m.userId ? 'Já vinculado a uma conta, não pode ser alterado.' : 'É com este e-mail que ele vai criar a conta.'}</div></div>
            <div class="field"><label>Celular / WhatsApp</label><input id="eq-cel" value="${g('celular')}" placeholder="(00) 00000-0000"/></div>
          </div>

          <div class="nav-label" style="padding-left:0">Endereço</div>
          <div class="grid-2">
            <div class="field"><label>CEP</label><input id="eq-cep" value="${g('cep')}" placeholder="00000-000"/><div class="hint" id="eq-cep-hint"></div></div>
            <div class="field"><label>Logradouro</label><input id="eq-log" value="${g('logradouro')}"/></div>
            <div class="field"><label>Número</label><input id="eq-num" value="${g('numero')}"/></div>
            <div class="field"><label>Complemento</label><input id="eq-comp" value="${g('complemento')}"/></div>
            <div class="field"><label>Bairro</label><input id="eq-bairro" value="${g('bairro')}"/></div>
            <div class="field"><label>Cidade</label><input id="eq-cidade" value="${g('cidade')}"/></div>
            <div class="field"><label>UF</label><input id="eq-uf" value="${g('uf')}" maxlength="2" style="text-transform:uppercase"/></div>
          </div>

          <div class="nav-label" style="padding-left:0">Função e nível de acesso</div>
          <div class="eq-cargos" id="eq-cargos">
            ${OB.CARGOS.map(c => `
              <label class="eq-opt ${e.cargo === c.id ? 'on' : ''}" data-cargo="${c.id}">
                <input type="radio" name="eq-cargo" value="${c.id}" ${e.cargo === c.id ? 'checked' : ''}>
                <span class="eq-opt-dot" style="background:${c.cor}"></span>
                <span class="eq-opt-txt"><b>${c.nome}</b><small>Nível ${c.nivel} · ${c.desc}</small>
                  <em>${c.secoes === '*' ? 'Vê todas as seções do sistema' : c.secoes.length + ' seções liberadas'}</em></span>
              </label>`).join('')}
          </div>

          <div class="field" style="margin-top:14px"><label>Observações internas</label><textarea id="eq-obs" rows="2">${e.obs || ''}</textarea></div>
          <label class="row alc" style="gap:10px;margin-top:6px;cursor:pointer">
            <input type="checkbox" id="eq-ativo" ${e.ativo !== false ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--brand)">
            <span style="font-size:14px">Colaborador ativo (desmarque para bloquear o acesso)</span>
          </label>
        </div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="eq-save">${UI.icon('check',16)} ${m ? 'Salvar alterações' : 'Cadastrar'}</button>`
    });

    // foto
    const prev = document.getElementById('eq-foto-prev');
    let fotoAtual = e.foto || '';
    document.getElementById('eq-foto').onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = async () => {
        try { fotoAtual = await OB._comprimirArte(rd.result); } catch (err) { fotoAtual = rd.result; }
        prev.innerHTML = `<img src="${fotoAtual}" alt="">`;
      };
      rd.readAsDataURL(f);
    };
    const rm = document.getElementById('eq-foto-rm');
    if (rm) rm.onclick = () => { fotoAtual = ''; prev.innerHTML = UI.icon('clients', 26); };
    // CEP
    const cep = document.getElementById('eq-cep');
    cep.onblur = () => {
      const d = cep.value.replace(/\D/g, ''); if (d.length !== 8) return;
      const hint = document.getElementById('eq-cep-hint'); hint.textContent = 'Buscando endereço...';
      fetch(`https://viacep.com.br/ws/${d}/json/`).then(r => r.json()).then(j => {
        if (j.erro) { hint.textContent = 'CEP não encontrado'; return; }
        document.getElementById('eq-log').value = j.logradouro || '';
        document.getElementById('eq-bairro').value = j.bairro || '';
        document.getElementById('eq-cidade').value = j.localidade || '';
        document.getElementById('eq-uf').value = j.uf || '';
        hint.textContent = 'Endereço preenchido ✓';
        document.getElementById('eq-num').focus();
      }).catch(() => { hint.textContent = 'Não foi possível buscar o CEP'; });
    };
    // destaque visual do cargo escolhido
    document.querySelectorAll('#eq-cargos .eq-opt').forEach(l => l.onclick = () => {
      document.querySelectorAll('#eq-cargos .eq-opt').forEach(x => x.classList.remove('on'));
      l.classList.add('on');
    });

    document.getElementById('eq-save').onclick = () => {
      const val = id => (document.getElementById(id).value || '').trim();
      const nome = val('eq-nome'), email = val('eq-email').toLowerCase();
      const inval = (id, bad) => { const el = document.getElementById(id); el.closest('.field').classList.toggle('has-error', bad); el.classList.toggle('invalid', bad); };
      inval('eq-nome', !nome);
      const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      inval('eq-email', !emailOk);
      if (!nome || !emailOk) return UI.toast('Confira os campos', 'Nome e e-mail válido são obrigatórios', 'err');
      // e-mail único na equipe
      const dup = OB.equipe().find(x => x.email.toLowerCase() === email && x.id !== e.id);
      if (dup) return UI.toast('E-mail já cadastrado', 'Já existe um colaborador com esse e-mail.', 'err');
      const cargo = (document.querySelector('#eq-cargos input[name="eq-cargo"]:checked') || {}).value || 'suporte';
      const c = OB.cargoById(cargo);
      const membro = {
        id: e.id, userId: e.userId || null, nome, sobrenome: val('eq-sobre'), email,
        doc: val('eq-doc'), celular: val('eq-cel'), nascimento: val('eq-nasc') || null,
        cargo, nivel: c ? c.nivel : 5, foto: fotoAtual,
        cep: val('eq-cep'), logradouro: val('eq-log'), numero: val('eq-num'), complemento: val('eq-comp'),
        bairro: val('eq-bairro'), cidade: val('eq-cidade'), uf: val('eq-uf').toUpperCase(),
        obs: val('eq-obs'), ativo: document.getElementById('eq-ativo').checked,
        criadoEm: e.criadoEm || new Date().toISOString(), vinculadoEm: e.vinculadoEm || null
      };
      OB.saveMembro(membro);
      UI.closeModal();
      UI.toast(m ? 'Colaborador atualizado' : 'Colaborador cadastrado',
        m ? 'As alterações foram salvas.' : `Peça para ${nome} criar a conta com o e-mail ${email}. O acesso de ${c ? c.nome : 'colaborador'} é aplicado automaticamente.`, 'ok');
      this.view_equipe();
    };
  },

  excluirMembro(id) {
    const m = OB.membroById(id); if (!m) return;
    UI.confirm('Excluir colaborador',
      `Remover <b>${(m.nome + ' ' + m.sobrenome).trim() || m.email}</b> da equipe? ${m.userId ? 'A conta dele continua existindo, mas perde o cargo no próximo login.' : 'Ele ainda não criou a conta.'}`,
      () => { OB.removeMembro(id); UI.toast('Colaborador removido', '', 'ok'); this.view_equipe(); },
      'Excluir');
  },

  view_bonus() {
    const v = document.getElementById('main-view');
    const all = OB.sales().filter(s => s.bonusStatus && (s.bonus || []).length).slice().sort((a, b) => new Date(b.data) - new Date(a.data));
    const pend = all.filter(s => s.bonusStatus === 'pendente');
    const aprov = all.filter(s => s.bonusStatus === 'aprovado');
    const rec = all.filter(s => s.bonusStatus === 'recusado');
    const cortesiaHTML = all.length ? `
      <div class="cards cols-3" style="margin-bottom:16px">
        ${Consultor.kpi('clock', pend.length, 'Aguardando autorização', 'Bônus pendentes de aprovação')}
        ${Consultor.kpi('check', aprov.length, 'Autorizados', 'Cortesias liberadas')}
        ${Consultor.kpi('x', rec.length, 'Recusados', 'Cortesias negadas')}
      </div>
      <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>O consultor sinaliza um <b>bônus (cortesia)</b> no orçamento. Aqui você <b>autoriza ou recusa</b>. Se recusar, o bônus deixa de aparecer no orçamento do cliente.</div></div>
      ${pend.length ? `<div class="nav-label" style="padding-left:0">Aguardando autorização</div>${pend.map(s => this.bonusCard(s)).join('')}` : ''}
      ${aprov.length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Autorizados</div>${aprov.map(s => this.bonusCard(s)).join('')}` : ''}
      ${rec.length ? `<div class="nav-label" style="padding-left:0;margin-top:16px">Recusados</div>${rec.map(s => this.bonusCard(s)).join('')}` : ''}`
      : Consultor.empty('prize', 'Nenhuma cortesia solicitada', 'Quando um consultor incluir um bônus (cortesia) num orçamento, ele aparece aqui para você autorizar ou recusar.');
    v.innerHTML = `
      ${this.bonusBVBloco()}
      <div class="nav-label" style="padding-left:0;margin-top:22px">${UI.icon('prize',12)} Cortesias em orçamentos</div>
      ${cortesiaHTML}`;
    v.querySelectorAll('[data-bonus-ok]').forEach(b => b.onclick = () => this.setBonus(b.dataset.bonusOk, 'aprovado'));
    v.querySelectorAll('[data-bonus-no]').forEach(b => b.onclick = () => this.setBonus(b.dataset.bonusNo, 'recusado'));
    App.refreshBadge();
  },

  /* acompanhamento do bônus de boas-vindas (R$100 na ativação, 60 dias para converter) */
  bonusBVBloco() {
    const todos = this.consultores().map(c => ({ c, bv: OB.bonusBV(c.id) })).filter(x => x.bv);
    const linhas = todos.filter(x => x.bv.ativo);
    const aguardando = todos.filter(x => !x.bv.ativo); // ainda não fizeram o 1º acesso desde o lançamento
    const por = st => linhas.filter(x => x.bv.status === st);
    const pend = por('pendente').sort((a, b) => a.bv.falta - b.bv.falta); // mais perto de converter primeiro
    const lib = por('liberado'), resg = por('resgatado'), exp = por('expirado');
    const custoAberto = (lib.length + pend.length) * OB.bonusBVValor();
    const nome = c => ((c.nome || '') + ' ' + (c.sobrenome || '')).trim() || c.email;
    const row = (x, extra) => {
      const urg = x.bv.diasRestantes != null && x.bv.diasRestantes <= 15;
      return `<div class="row between alc" style="padding:11px 13px;border:1px solid var(--border);border-radius:11px;margin-bottom:8px;background:var(--surface-2);gap:12px;flex-wrap:wrap">
        <div style="min-width:0"><b style="font-size:14px">${nome(x.c)}</b>
          <div class="mut" style="font-size:12px">${extra}</div></div>
        ${x.bv.status === 'pendente' ? `<div class="row alc" style="gap:12px">
          <div style="min-width:120px"><div class="bv-bar" style="margin:0 0 4px"><i style="width:${x.bv.progresso}%"></i></div>
            <div class="mut" style="font-size:11px">${OB.fmt(x.bv.comissao + x.bv.valor)} de ${OB.fmt(x.bv.meta)}</div></div>
          <span class="chip ${urg ? 'warn' : 'gray'} nowrap">${x.bv.diasRestantes} ${x.bv.diasRestantes === 1 ? 'dia' : 'dias'}</span>
        </div>` : ''}
      </div>`;
    };
    return `
      <div class="nav-label" style="padding-left:0">${UI.icon('rocket',12)} Bônus de boas-vindas (ativação)</div>
      <div class="cards cols-4" style="margin-bottom:16px">
        ${Consultor.kpi('clock', pend.length, 'Correndo o prazo', 'Ainda podem converter')}
        ${Consultor.kpi('check', lib.length + resg.length, 'Converteram', 'Bateram a meta e ganharam o bônus')}
        ${Consultor.kpi('users', aguardando.length, 'Aguardando 1º acesso', 'O bônus liga quando entrarem')}
        ${Consultor.kpi('money', OB.fmt(custoAberto), 'Exposição em aberto', 'Se todos converterem agora')}
      </div>
      <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Cada consultor recebe <b>${OB.fmt(OB.bonusBVValor())}</b> ao concluir o perfil. O valor só vira saque quando ele soma <b>${OB.fmt(OB.saqueMinimo())}</b> (o bônus conta, então bastam <b>${OB.fmt(OB.saqueMinimo() - OB.bonusBVValor())}</b> de comissão). Se não converter em <b>${OB.BONUS_BV.dias} dias</b>, o sistema zera automaticamente.</div></div>
      ${pend.length ? `<div class="nav-label" style="padding-left:0">Correndo o prazo (mais perto primeiro)</div>${pend.map(x => row(x, `Faltam <b style="color:var(--brand)">${OB.fmt(x.bv.falta)}</b> em comissão`)).join('')}` : ''}
      ${lib.length ? `<div class="nav-label" style="padding-left:0;margin-top:14px">Liberados (aguardando o saque)</div>${lib.map(x => row(x, `Bateu a meta · ${OB.fmt(x.bv.valor)} entram no próximo saque`)).join('')}` : ''}
      ${resg.length ? `<div class="nav-label" style="padding-left:0;margin-top:14px">Já pagos no saque</div>${resg.map(x => row(x, `Bônus de ${OB.fmt(x.bv.valor)} incluído numa solicitação`)).join('')}` : ''}
      ${exp.length ? `<div class="nav-label" style="padding-left:0;margin-top:14px">Expirados (zerados pelo sistema)</div>${exp.map(x => row(x, `Não atingiu ${OB.fmt(x.bv.meta)} em ${OB.BONUS_BV.dias} dias`)).join('')}` : ''}
      ${aguardando.length ? `<div class="nav-label" style="padding-left:0;margin-top:14px">Aguardando o primeiro acesso</div>${aguardando.map(x => row(x, `O bônus de ${OB.fmt(OB.bonusBVValor())} é ativado assim que ${(x.c.nome || 'o consultor').split(' ')[0]} entrar no sistema (o prazo de ${OB.BONUS_BV.dias} dias começa a contar aí)`)).join('')}` : ''}
      ${!todos.length ? `<div class="hint">Nenhum consultor cadastrado ainda.</div>` : ''}`;
  },
  bonusCard(s) {
    const cli = OB.clientById(s.clientId) || {};
    const cons = OB.userById(s.consultorId);
    const porte = cli.porte || 'pequena';
    const pagos = (s.produtos || []).map(id => (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id).join(' + ');
    const bonusItens = (s.bonus || []).map(id => ({ nome: (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id, val: OB.precoTabela(id, porte) || 0 }));
    const custo = bonusItens.reduce((t, b) => t + b.val, 0);
    const chip = s.bonusStatus === 'aprovado' ? '<span class="chip green nowrap">Autorizado</span>' : (s.bonusStatus === 'recusado' ? '<span class="chip gray nowrap">Recusado</span>' : '<span class="chip warn nowrap">Aguardando</span>');
    return `<div class="card proj-card">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div style="min-width:0"><b style="font-size:15px">${cli.nome || 'Cliente'}</b>
          <div class="mut" style="font-size:12.5px">Consultor: ${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'}${pagos ? ' · Contratou: ' + pagos : ''}</div></div>
        ${chip}
      </div>
      <div class="bonus-box">
        <div class="bonus-head">${UI.icon('prize',15)} Bônus solicitado (cortesia)</div>
        <div class="arq-list">${bonusItens.map(b => `<div class="arq-item"><span class="arq-ic" style="background:#e7f7ee;color:#15803d">${UI.icon('prize',15)}</span><div class="arq-meta"><b>${b.nome}</b><span>Valor de tabela: ${OB.money(b.val, s.moeda)}</span></div></div>`).join('')}</div>
        ${s.bonusObs ? `<div class="hint" style="margin-top:8px">${UI.icon('info',12)} ${s.bonusObs.replace(/</g, '&lt;')}</div>` : ''}
        <div class="bonus-cost">Custo total da cortesia: <b>${OB.money(custo, s.moeda)}</b></div>
      </div>
      ${s.bonusStatus === 'pendente' ? `<div class="proj-acoes">
        <button class="btn brand sm" data-bonus-ok="${s.id}">${UI.icon('check',14)} Autorizar bônus</button>
        <button class="btn danger sm" data-bonus-no="${s.id}">${UI.icon('x',14)} Recusar</button>
      </div>` : `<div class="proj-acoes"><button class="btn ghost sm" data-bonus-${s.bonusStatus === 'aprovado' ? 'no' : 'ok'}="${s.id}">${s.bonusStatus === 'aprovado' ? 'Reverter para recusado' : 'Autorizar mesmo assim'}</button></div>`}
    </div>`;
  },
  setBonus(saleId, status) {
    const s = OB.sales().find(x => x.id === saleId); if (!s) return;
    s.bonusStatus = status;
    OB.updateSale(s);
    UI.toast(status === 'aprovado' ? 'Bônus autorizado' : 'Bônus recusado', '', status === 'aprovado' ? 'ok' : 'info');
    App.refreshBadge();
    this.render('bonus');
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
    const pend = all.length - aceitos;
    v.innerHTML = `
      <div class="kpis-3" style="margin-bottom:16px">
        <div class="card kpi"><div class="ic">${UI.icon('contract', 20)}</div><div class="k-val">${all.length}</div><div class="k-lbl">Contratos</div></div>
        <div class="card kpi"><div class="ic ic-ok">${UI.icon('check', 20)}</div><div class="k-val" style="color:#16a34a">${aceitos}</div><div class="k-lbl">Aceitos</div></div>
        <div class="card kpi"><div class="ic ic-warn">${UI.icon('clock', 20)}</div><div class="k-val" style="color:var(--brand)">${pend}</div><div class="k-lbl">Aguardando aceite</div></div>
      </div>
      <div class="lib-head"><b>Contratos</b><span class="lib-count" id="ctf-count">${all.length} contratos</span></div>
      <div class="ctl-toolbar">
        <div class="ctl-search">${UI.icon('search', 16)}<input id="ctf-cliente" placeholder="Buscar por cliente ou nº do contrato" value="${f.cliente}"/></div>
        <div class="ctl-seg" id="ctf-seg">
          <button type="button" data-st="todos" class="${f.status === 'todos' ? 'on' : ''}">Todos <i>${all.length}</i></button>
          <button type="button" data-st="pendente" class="${f.status === 'pendente' ? 'on' : ''}">Aguardando <i>${pend}</i></button>
          <button type="button" data-st="aceito" class="${f.status === 'aceito' ? 'on' : ''}">Aceitos <i>${aceitos}</i></button>
        </div>
        <div class="ctl-selrow">
          <div class="ctl-sel"><label for="ctf-servico">Serviço</label>
            <select id="ctf-servico"><option value="">Todos os serviços</option>${OB.PRODUTOS.map(p => `<option value="${p.id}" ${f.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></div>
          <div class="ctl-sel"><label for="ctf-uf">Região</label>
            <select id="ctf-uf"><option value="">Todas as regiões</option>${ufs.map(u => `<option value="${u}" ${f.uf === u ? 'selected' : ''}>${this.UF_NOMES[u] || u}</option>`).join('')}</select></div>
          <div class="ctl-sel"><label for="ctf-cons">Consultor</label>
            <select id="ctf-cons"><option value="">Todos os consultores</option>${consultores.map(c => `<option value="${c.id}" ${f.consultor === c.id ? 'selected' : ''}>${c.nome} ${c.sobrenome || ''}</option>`).join('')}</select></div>
          <div class="ctl-sel"><label>Período (data)</label>
            <div class="ctl-daterange"><input type="date" id="ctf-de" value="${f.de}" aria-label="Data inicial"/><span>até</span><input type="date" id="ctf-ate" value="${f.ate}" aria-label="Data final"/></div></div>
          <button type="button" class="ctl-clear" id="ctf-limpar">${UI.icon('x', 14)} Limpar filtros</button>
        </div>
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
      const cnt = document.getElementById('ctf-count'); if (cnt) cnt.textContent = `${rows.length} de ${all.length} contratos`;
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
    const capt = () => { const st = (v.querySelector('#ctf-seg button.on') || {}).dataset; this._ctFiltro = {
      cliente: document.getElementById('ctf-cliente').value,
      servico: document.getElementById('ctf-servico').value,
      uf: document.getElementById('ctf-uf').value,
      consultor: document.getElementById('ctf-cons').value,
      status: st ? st.st : 'todos',
      de: document.getElementById('ctf-de').value,
      ate: document.getElementById('ctf-ate').value
    }; draw(); };
    ['ctf-servico', 'ctf-uf', 'ctf-cons', 'ctf-de', 'ctf-ate'].forEach(id => { const el = document.getElementById(id); if (el) el.onchange = capt; });
    v.querySelectorAll('#ctf-seg button').forEach(b => b.onclick = () => { v.querySelectorAll('#ctf-seg button').forEach(x => x.classList.remove('on')); b.classList.add('on'); capt(); });
    const busca = document.getElementById('ctf-cliente'); let t; busca.oninput = () => { clearTimeout(t); t = setTimeout(capt, 300); };
    document.getElementById('ctf-limpar').onclick = () => { this._ctFiltro = { cliente: '', servico: '', uf: '', consultor: '', de: '', ate: '', status: 'todos' }; this.view_contratos(); };
    draw();
  },

  /* ====================== CRIATIVOS (admin publica as artes) ====================== */
  criativoAdminCard(c) {
    const cats = OB.criativoCategorias(c);
    return `<div class="card cri-admin-card">
      <div class="cri-thumb loading" style="aspect-ratio:4 / 5">
        <img data-cri="${c.id}|feed" alt="Criativo ${c.titulo || ''}"/>
        <span class="cri-badge">4:5 + 9:16</span>
        ${!c.ativo ? '<span class="cri-off">Oculto</span>' : ''}
      </div>
      <div class="cri-info">
        <b>${c.titulo || 'Criativo'}</b>
        ${cats.length ? `<div class="cri-cats">${cats.map(x => `<span class="cri-cat">${x}</span>`).join('')}</div>` : ''}
        <div class="cri-acts">
          <button class="btn ghost sm" data-cri-toggle="${c.id}" title="${c.ativo ? 'Ocultar dos consultores' : 'Mostrar aos consultores'}">${UI.icon(c.ativo ? 'eye' : 'eyeoff', 15)}<span>${c.ativo ? 'Ativo' : 'Oculto'}</span></button>
          <button class="btn ghost sm" data-cri-edit="${c.id}" title="Editar">${UI.icon('edit',15)}</button>
          <button class="btn ghost sm danger" data-cri-del="${c.id}" title="Excluir">${UI.icon('trash',15)}</button>
        </div>
      </div>
    </div>`;
  },
  view_criativos() {
    const v = document.getElementById('main-view');
    const itens = OB.criativos();
    const ativos = itens.filter(c => c.ativo).length;
    v.innerHTML = `
      <div class="row between alc" style="gap:10px;flex-wrap:wrap;margin-bottom:14px">
        <div><b style="font-size:16px">Criativos</b><p class="mut" style="font-size:12.5px;margin-top:2px">Publique artes (feed 4:5 + stories 9:16) para os consultores baixarem e postarem. ${ativos} ativo(s) de ${itens.length}.</p></div>
        <button class="btn brand" id="cri-add">${UI.icon('plus',16)} Novo criativo</button>
      </div>
      ${itens.length ? `<div class="cri-admin-grid">${itens.map(c => this.criativoAdminCard(c)).join('')}</div>` : Consultor.empty('creative', 'Nenhum criativo publicado', 'Clique em "Novo criativo" para enviar as artes (feed e stories) que os consultores vão baixar.')}`;
    document.getElementById('cri-add').onclick = () => this.criativoModal();
    itens.forEach(c => OB.getCriativoImagem(c.id, 'feed').then(src => { if (!src) return; const img = v.querySelector(`img[data-cri="${c.id}|feed"]`); if (img) { img.src = src; const t = img.closest('.cri-thumb'); if (t) t.classList.remove('loading'); } }));
    v.querySelectorAll('[data-cri-edit]').forEach(b => b.onclick = () => this.criativoModal(OB.criativoById(b.dataset.criEdit)));
    v.querySelectorAll('[data-cri-toggle]').forEach(b => b.onclick = async () => { const c = OB.criativoById(b.dataset.criToggle); if (!c) return; await OB.updateCriativoMeta(Object.assign({}, c, { ativo: !c.ativo })); this.view_criativos(); });
    v.querySelectorAll('[data-cri-del]').forEach(b => b.onclick = () => { const c = OB.criativoById(b.dataset.criDel); if (!c) return; UI.confirm('Excluir criativo', `Remover <b>${c.titulo || 'criativo'}</b>? Os consultores deixam de ver esta arte.`, () => { OB.removeCriativo(c.id); UI.toast('Criativo excluído', '', 'ok'); this.view_criativos(); }, 'Excluir'); });
  },
  _criDrop(id, label, req) {
    return `<div class="field"><label>${label} ${req ? '<span class="req">*</span>' : '<span style="font-weight:400;color:var(--text-mut)">(deixe como está para manter)</span>'}</label>
      <div class="cri-drop" data-drop="${id}"><div class="cri-drop-ph">${UI.icon('creative',20)}<span>Clique para enviar (PNG ou JPG)</span></div><img data-prev="${id}" alt="" hidden/></div>
      <input type="file" data-file="${id}" accept="image/png,image/jpeg" hidden/></div>`;
  },
  criativoModal(existing) {
    const c = existing || null;
    this._criUp = { feed: undefined, stories: undefined }; // novas imagens (data URL); undefined = não trocou
    UI.modal({
      title: c ? 'Editar criativo' : 'Novo criativo',
      sub: c ? 'Atualize os dados ou troque as artes' : 'Envie as artes de feed e stories',
      body: `
        <div class="grid-2 cri-drop-2">
          ${this._criDrop('feed', 'Arte para Feed (4:5)', !c)}
          ${this._criDrop('stories', 'Arte para Stories (9:16)', !c)}
        </div>
        <div class="field"><label>Título <span class="req">*</span></label><input id="cri-tit" maxlength="80" placeholder="Ex.: Promo de fim de ano" value="${c ? (c.titulo || '').replace(/"/g, '&quot;') : ''}"/></div>
        <div class="field"><label>Categorias <span style="font-weight:400;color:var(--text-mut)">(múltipla escolha)</span></label>
          <div class="chips-pick" id="cri-cats">${OB.CRIATIVO_CATEGORIAS.map(ct => { const sel = c ? OB.criativoCategorias(c).includes(ct) : false; return `<label class="chip-opt"><input type="checkbox" value="${ct}" ${sel ? 'checked' : ''}/><span>${ct}</span></label>`; }).join('')}</div></div>
        <div class="field"><label>Legenda sugerida <span style="font-weight:400;color:var(--text-mut)">(feed)</span></label>
          <textarea id="cri-leg" rows="3" placeholder="Texto pronto para o consultor colar na publicação do feed">${c ? (c.legenda || '') : ''}</textarea></div>
        <div class="field"><label>Hashtags <span style="font-weight:400;color:var(--text-mut)">(feed)</span></label>
          <textarea id="cri-hash" rows="2" placeholder="#outbox #sitesprofissionais #marketingdigital">${c ? (c.hashtags || '') : ''}</textarea></div>
        <label class="pix-check"><input type="checkbox" id="cri-ativo" ${!c || c.ativo ? 'checked' : ''}/> <span>Visível para os consultores</span></label>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="cri-save">${c ? 'Salvar' : 'Publicar criativo'}</button>`
    });
    ['feed', 'stories'].forEach(tipo => {
      const drop = document.querySelector(`[data-drop="${tipo}"]`);
      const file = document.querySelector(`[data-file="${tipo}"]`);
      const prev = document.querySelector(`[data-prev="${tipo}"]`);
      if (c) OB.getCriativoImagem(c.id, tipo).then(src => { if (src) { prev.src = src; prev.hidden = false; const ph = drop.querySelector('.cri-drop-ph'); if (ph) ph.style.display = 'none'; } });
      drop.onclick = () => file.click();
      file.onchange = () => {
        const f = file.files && file.files[0]; if (!f) return;
        if (!/image\/(png|jpeg)/.test(f.type)) return UI.toast('Formato inválido', 'Envie um PNG ou JPG', 'err');
        const rd = new FileReader();
        // sem compressão: a arte é guardada no formato e tamanho ORIGINAIS (qualidade máxima)
        rd.onload = () => { const src = rd.result; this._criUp[tipo] = src; prev.src = src; prev.hidden = false; const ph = drop.querySelector('.cri-drop-ph'); if (ph) ph.style.display = 'none'; };
        rd.readAsDataURL(f);
      };
    });
    document.getElementById('cri-save').onclick = async () => {
      const titulo = (document.getElementById('cri-tit').value || '').trim();
      const categoria = [...document.querySelectorAll('#cri-cats input:checked')].map(i => i.value).join(', ');
      const legenda = (document.getElementById('cri-leg').value || '').trim();
      const hashtags = (document.getElementById('cri-hash').value || '').trim();
      const ativo = document.getElementById('cri-ativo').checked;
      if (!titulo) return UI.toast('Informe o título', '', 'err');
      if (!c && (!this._criUp.feed || !this._criUp.stories)) return UI.toast('Envie as duas artes', 'Feed (4:5) e Stories (9:16) são obrigatórias', 'err');
      const btn = document.getElementById('cri-save'); btn.disabled = true; btn.textContent = 'Salvando…';
      try {
        if (!c) {
          OB.addCriativo({ id: OB.uid(), titulo, categoria, legenda, hashtags, ativo, imagemFeed: this._criUp.feed, imagemStories: this._criUp.stories, criadoEm: new Date().toISOString() });
        } else {
          await OB.updateCriativoMeta({ id: c.id, titulo, categoria, legenda, hashtags, ativo, criadoEm: c.criadoEm });
          if (this._criUp.feed) await OB.setCriativoImagem(c.id, 'feed', this._criUp.feed);
          if (this._criUp.stories) await OB.setCriativoImagem(c.id, 'stories', this._criUp.stories);
        }
        UI.closeModal(); UI.toast(c ? 'Criativo atualizado' : 'Criativo publicado', '', 'ok'); this.view_criativos();
      } catch (e) { btn.disabled = false; btn.textContent = c ? 'Salvar' : 'Publicar criativo'; UI.toast('Erro ao salvar', (e && e.message) || '', 'err'); }
    };
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
      return `<button type="button" class="atend-item${t.consultorId === this._atendSel ? ' on' : ''}${!t.aberta ? ' fechado' : ''}" data-thread="${t.consultorId}">
        ${this._consAv(t.consultorId, t.nome)}
        <span class="atend-info"><b>${t.nome}${t.urgente ? ' <span class="atend-urg">urgente</span>' : ''}${!t.aberta ? ' <span class="atend-fechado">encerrado</span>' : ''}</b><span>${quem}${prev}</span></span>
        ${t.naoLidas ? `<span class="atend-count">${t.naoLidas}</span>` : ''}
      </button>`;
    }).join('');
    // conversa completa (histórico + atual); mensagens arquivadas ficam esmaecidas, com divisória antes da conversa atual
    const firstOpen = sel.msgs.findIndex(m => !m.arquivada);
    let conv = '';
    sel.msgs.forEach((m, idx) => {
      if (idx === firstOpen && firstOpen > 0) conv += `<div class="atend-divider"><span>Conversa atual</span></div>`;
      conv += App.chatBubble(m, m.autor === 'admin', consAv, m.arquivada);
    });
    if (firstOpen === -1) conv += `<div class="atend-divider"><span>Atendimento encerrado</span></div>`;

    v.innerHTML = `<div class="atend-grid">
      <div class="atend-list">${listHTML}</div>
      <div class="atend-conv">
        <div class="atend-conv__head">${consAv}<div class="atend-conv__nm"><b>${sel.nome}</b><span>Você responde como <b>Manu</b></span></div>
          <div class="atend-conv__acts">
            <button class="btn ghost sm" id="atend-export" title="Baixar a conversa completa (registro)">${UI.icon('download',15)}<span>Exportar</span></button>
            ${sel.aberta ? `<button class="btn ghost sm" id="atend-close" title="Encerrar: a conversa some para o consultor e fica salva aqui">${UI.icon('check',15)}<span>Encerrar</span></button>` : '<span class="atend-encerrado-tag">Encerrado</span>'}
          </div>
        </div>
        <div class="atend-msgs" id="atend-msgs">${conv}</div>
        <div class="atend-reply">
          <textarea id="atend-text" rows="1" placeholder="Responder como Manu..."></textarea>
          <button class="btn brand" id="atend-send" type="button">${UI.icon('send',16)} Enviar</button>
        </div>
      </div>
    </div>`;

    document.getElementById('atend-export').onclick = () => {
      const txt = OB.chatExportTexto(sel.consultorId);
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Atendimento OutBox - ${sel.nome}.txt`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      UI.toast('Conversa exportada', 'Arquivo salvo para o seu registro', 'ok');
    };
    const closeBtn = document.getElementById('atend-close');
    if (closeBtn) closeBtn.onclick = () => UI.confirm('Encerrar atendimento', `Encerrar a conversa com <b>${sel.nome}</b>? Ela some para o consultor (que poderá iniciar uma nova) e <b>fica salva aqui</b> para o seu registro.`, async () => { await OB.encerrarConversa(sel.consultorId); UI.toast('Atendimento encerrado', 'A conversa foi arquivada', 'ok'); App.refreshChatBadges(); this.render('atendimento'); }, 'Encerrar');

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
