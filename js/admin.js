/* ============================================================
   OutBox Consultores — Painel do Administrador (admin.js)
   Acesso a todos os dados · gestão financeira de comissões e prêmios.
   ============================================================ */
const Admin = {
  NAV: [
    { id: 'painel',     label: 'Painel Geral',     icon: 'overview' },
    { id: 'financeiro', label: 'Financeiro',       icon: 'money' },
    { id: 'consultores',label: 'Consultores',      icon: 'users' },
    { id: 'vendas',     label: 'Vendas',           icon: 'cart' },
    { id: 'treinamentos', label: 'Treinamentos',   icon: 'academy' },
    { id: 'avisos',     label: 'Avisos',           icon: 'bell' },
    { id: 'perfil',     label: 'Editar Perfil',    icon: 'profile' }
  ],
  titles: {
    painel:      ['Painel Geral', 'Visão consolidada de toda a operação'],
    financeiro:  ['Gestão Financeira', 'Comissões e prêmios — pague mediante comprovação'],
    consultores: ['Consultores', 'Todos os consultores e seus números'],
    vendas:      ['Vendas', 'Todas as vendas lançadas no sistema'],
    treinamentos:['Treinamentos da equipe', 'Progresso e certificados de cada consultor'],
    avisos:      ['Avisos aos consultores', 'Barra de comunicado no topo — novidades e atualizações'],
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

      <div class="card">
        <div class="card-head"><h3>Solicitações pendentes</h3>${pend.length?`<span class="chip warn">${pend.length} aguardando</span>`:'<span class="chip green">tudo em dia</span>'}</div>
        ${this.reqTable(pend, true)}
      </div>`;

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
  view_consultores() {
    const cons = this.consultores();
    const v = document.getElementById('main-view');
    if (!cons.length) { v.innerHTML = Consultor.empty('users', 'Nenhum consultor', 'Os consultores aparecem aqui após criarem conta.'); return; }
    v.innerHTML = `<div class="cards cols-3">
      ${cons.map(c => {
        const volMes = OB.volumeMes(c.id), volTri = OB.volumeTrimestre(c.id);
        const nivel = OB.nivelPorVolume(volMes);
        const com = OB.comissaoDisponivel(c.id);
        const nClientes = OB.clientsOf(c.id).length;
        const completo = c.foto && c.doc && c.celular && c.cep;
        return `<div class="card">
          <div class="row alc" style="gap:12px;margin-bottom:14px">
            <div class="side-user av" style="width:46px;height:46px;font-size:16px">${c.foto?`<img src="${c.foto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`:(c.nome[0]||'?')}</div>
            <div class="grow"><b style="font-size:15px">${c.nome} ${c.sobrenome}</b><div class="mut" style="font-size:12px">${c.email}</div></div>
            <span class="tier-badge" style="background:${nivel.cor};font-size:11px;padding:4px 10px">${nivel.nome}</span>
          </div>
          <div class="row between" style="font-size:13px;margin-bottom:6px"><span class="soft">Vendido no mês</span><b>${OB.brl(volMes)}</b></div>
          <div class="row between" style="font-size:13px;margin-bottom:6px"><span class="soft">No trimestre</span><b>${OB.brl(volTri)}</b></div>
          <div class="row between" style="font-size:13px;margin-bottom:6px"><span class="soft">Comissão disponível</span><b style="color:var(--brand)">${OB.brl(com.valor)}</b></div>
          <div class="row between" style="font-size:13px;margin-bottom:12px"><span class="soft">Clientes</span><b>${nClientes}</b></div>
          <div class="row between alc">
            <span class="chip ${completo?'green':'warn'}">${completo?'Perfil completo':'Perfil incompleto'}</span>
            <button class="btn sm ghost" data-view-cons="${c.id}">Ver detalhes</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
    v.querySelectorAll('[data-view-cons]').forEach(b => b.onclick = () => this.detalheConsultor(b.dataset.viewCons));
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
          <div><span class="mut">Cidade:</span> ${c.cidade?c.cidade+'/'+c.uf:'-'}</div>
          <div style="grid-column:1/-1"><span class="mut">Endereço:</span> ${c.logradouro?`${c.logradouro}, ${c.numero} ${c.complemento||''} — ${c.bairro}, CEP ${c.cep}`:'-'}</div>
        </div>
        <div class="nav-label" style="padding-left:0">Vendas (${vendas.length})</div>
        ${vendas.length?`<div class="table-wrap" style="margin-bottom:14px"><table><thead><tr><th>Data</th><th>Produto</th><th>Valor</th><th>Comissão</th></tr></thead><tbody>
          ${vendas.slice().sort((a,b)=>new Date(b.data)-new Date(a.data)).map(s=>{const p=OB.PRODUTOS.find(x=>x.id===s.produto);return `<tr><td>${OB.dataBR(s.data)}</td><td>${p?p.nome:s.produto}</td><td>${OB.brl(s.valor)}</td><td><span class="chip ${s.statusComissao==='paga'?'green':s.statusComissao==='solicitada'?'gray':'warn'}">${s.statusComissao}</span></td></tr>`}).join('')}
        </tbody></table></div>`:'<p class="mut" style="font-size:13px;margin-bottom:14px">Sem vendas.</p>'}
        <div class="nav-label" style="padding-left:0">Solicitações (${reqs.length})</div>
        ${reqs.length?Consultor.reqList(reqs):'<p class="mut" style="font-size:13px">Sem solicitações.</p>'}`,
      footer: `<button class="btn brand" data-close>Fechar</button>`
    });
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
          <div class="mut" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p ? p.nome : s.produto} · ${cons ? cons.nome + ' ' + (cons.sobrenome || '') : '-'} · ${OB.dataBR(s.data)}</div>
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
            <td>${cli ? cli.nome : '-'}</td><td>${p ? p.nome : s.produto}</td><td class="strong nowrap">${OB.brl(s.valor)}</td>
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

  /* ====================== TREINAMENTOS DA EQUIPE ====================== */
  view_treinamentos() {
    const v = document.getElementById('main-view');
    const consultores = this.consultores();
    const disp = TREINOS.PRODUTOS.filter(p => p.disponivel);
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
