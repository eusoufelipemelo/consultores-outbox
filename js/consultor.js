/* ============================================================
   OutBox Consultores — Painel do Consultor (consultor.js)
   ============================================================ */
const Consultor = {
  NAV: [
    { id: 'overview',   label: 'Visão Geral',      icon: 'overview' },
    { id: 'funil',      label: 'Funil de Vendas',  icon: 'kanban' },
    { id: 'clientes',   label: 'Meus Clientes',    icon: 'clients' },
    { id: 'orcamentos', label: 'Orçamentos',       icon: 'quote' },
    { id: 'comissao',   label: 'Vendas & Comissão',icon: 'money' },
    { id: 'premiacoes', label: 'Premiações',       icon: 'prize' },
    { id: 'documentos', label: 'Documentos',       icon: 'docs' },
    { id: 'ajuda',      label: 'Dúvidas & Guia',   icon: 'help' },
    { id: 'perfil',     label: 'Editar Perfil',    icon: 'profile' }
  ],

  titles: {
    overview:   ['Visão Geral', 'Acompanhe suas metas em tempo real'],
    funil:      ['Funil de Vendas', 'Arraste seus contatos entre as etapas'],
    clientes:   ['Meus Clientes', 'Cadastre e gerencie seus clientes'],
    orcamentos: ['Orçamentos', 'Crie propostas e acompanhe os aceites'],
    comissao:   ['Vendas & Comissão', 'Lance vendas, acompanhe propostas e solicite comissão'],
    premiacoes: ['Premiações', 'Quão perto você está do próximo prêmio'],
    documentos: ['Documentos', 'Materiais e técnicas de venda SPIN Selling'],
    ajuda:      ['Dúvidas & Guia', 'Como usar o sistema'],
    perfil:     ['Editar Perfil', 'Mantenha seus dados sempre atualizados']
  },

  u() { return OB.session(); },

  render(id) {
    Charts.destroyAll();
    const fn = this['view_' + id];
    if (fn) fn.call(this);
  },

  /* opções do <select> de moeda (default = moeda atual do consultor) */
  moedaOptions(sel) {
    return Object.keys(OB.MOEDAS).map(k => `<option value="${k}" ${k === sel ? 'selected' : ''}>${OB.MOEDAS[k].nome}</option>`).join('');
  },

  /* ====================== VISÃO GERAL ====================== */
  view_overview() {
    const u = this.u();
    const clientes = OB.clientsOf(u.id);
    const vendas = OB.salesOf(u.id);
    const volMes = OB.volumeMes(u.id);
    const nivel = OB.nivelPorVolume(volMes);
    const prox = OB.proximoNivel(volMes);
    const com = OB.comissaoDisponivel(u.id);
    const rec = clientes.filter(c => c.tipo === 'recorrente').length;
    const pon = clientes.length - rec;

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-4" style="margin-bottom:18px">
        ${this.kpi('cart', OB.fmt(volMes), 'Vendido no mês', `Nível ${nivel.nome} · ${(nivel.rate*100)|0}% de comissão`)}
        ${this.kpi('money', OB.fmt(com.valor), 'Comissão disponível', com.vendas.length + ' venda(s) a solicitar')}
        ${this.kpi('clients', clientes.length, 'Clientes cadastrados', rec + ' recorrentes · ' + pon + ' pontuais')}
        ${this.kpi('prize', OB.fmt(OB.volumeTrimestre(u.id)), 'Volume no trimestre', 'Conta para os prêmios')}
      </div>

      <div class="cards cols-2" style="margin-bottom:18px">
        <div class="card">
          <div class="card-head"><h3>Meta de comissão do mês</h3><span class="tier-badge" style="background:${nivel.cor}">${UI.icon('shield',14)} ${nivel.nome}</span></div>
          ${this.metaLadder(volMes, nivel, prox)}
        </div>
        <div class="card">
          <div class="card-head"><h3>Clientes por tipo</h3><span class="mut">${clientes.length} total</span></div>
          <div style="height:240px">${clientes.length ? '<canvas id="ch-donut"></canvas>' : this.emptyMini('Nenhum cliente ainda')}</div>
        </div>
      </div>

      <div class="cards cols-2">
        <div class="card">
          <div class="card-head"><h3>Volume por produto</h3><span class="mut">Mês atual</span></div>
          <div style="height:260px">${vendas.length ? '<canvas id="ch-prod"></canvas>' : this.emptyMini('Lance sua primeira venda')}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Evolução de vendas</h3><span class="mut">Últimos meses</span></div>
          <div style="height:260px"><canvas id="ch-line"></canvas></div>
        </div>
      </div>`;

    // charts
    setTimeout(() => {
      if (clientes.length) Charts.donut('ch-donut', rec, pon);
      if (vendas.length) {
        const porProd = {};
        vendas.filter(s => OB.isSameMonth(s.data)).forEach(s => {
          const p = OB.PRODUTOS.find(x => x.id === s.produto); const n = p ? p.nome : s.produto;
          porProd[n] = (porProd[n] || 0) + s.valor;
        });
        Charts.barProdutos('ch-prod', Object.keys(porProd), Object.values(porProd));
      }
      Charts.line('ch-line', this.last6Labels(), this.last6Values(vendas));
    }, 50);
  },

  metaLadder(vol, nivel, prox) {
    const pct = prox ? Math.min(100, Math.round((vol / prox.meta) * 100)) : 100;
    const falta = prox ? prox.meta - vol : 0;
    return `
      <div class="row between" style="margin-bottom:8px;font-size:13px">
        <span class="soft">${OB.fmt(vol)}</span>
        <span class="mut">${prox ? 'Meta ' + prox.nome + ': ' + OB.fmt(prox.meta) : 'Nível máximo atingido 🎉'}</span>
      </div>
      <div class="bar"><i data-w="${pct}"></i></div>
      <div style="margin-top:12px;font-size:13px" class="soft">
        ${prox ? `Faltam <b style="color:var(--brand)">${OB.fmt(falta)}</b> para subir de <b>${nivel.nome}</b> (${(nivel.rate*100)|0}%) para <b>${prox.nome}</b> (${(prox.rate*100)|0}%)` : `Você está no nível <b>Black</b> com <b>20%</b> de comissão. Excelente!`}
      </div>
      <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
        ${[...OB.NIVEIS].reverse().map(n => `<span class="chip ${vol>=n.meta?'brand':'gray'}">${n.nome} · ${(n.rate*100)|0}%</span>`).join('')}
      </div>`;
  },

  /* ====================== CLIENTES ====================== */
  view_clientes() {
    const u = this.u();
    const list = OB.clientsOf(u.id);
    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="row between alc" style="margin-bottom:18px">
        <div class="seg" id="cli-filter">
          <button class="on" data-f="all">Todos (${list.length})</button>
          <button data-f="recorrente">Recorrentes</button>
          <button data-f="pontual">Pontuais</button>
        </div>
        <button class="btn brand" id="add-cli">${UI.icon('plus',16)} Novo cliente</button>
      </div>
      <div class="card" style="padding:0" id="cli-table"></div>`;

    const draw = (f) => {
      const rows = list.filter(c => f === 'all' || c.tipo === f);
      const el = document.getElementById('cli-table');
      if (!rows.length) { el.innerHTML = this.empty('clients', 'Nenhum cliente', 'Cadastre seu primeiro cliente para começar a controlar suas vendas.'); return; }
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Cliente</th><th>Contato</th><th>Serviço</th><th>Telefone</th><th>Tipo</th><th></th></tr></thead><tbody>
        ${rows.map(c => { const sv = OB.PRODUTOS.find(p => p.id === c.servico); return `<tr>
          <td><span class="strong">${c.nome}</span><br><span class="mut" style="font-size:12px">${c.cidade ? c.cidade + '/' + c.uf : ''}</span></td>
          <td>${c.contato || '-'}<br><span class="mut" style="font-size:12px">${c.email || ''}</span></td>
          <td>${sv ? `<span class="chip brand">${sv.nome}</span>` : '-'}</td>
          <td>${c.telefone || '-'}</td>
          <td><span class="chip ${c.tipo==='recorrente'?'green':'gray'}">${c.tipo==='recorrente'?'Recorrente':'Pontual'}</span></td>
          <td class="row" style="gap:6px;justify-content:flex-end">
            <button class="iconbtn" data-edit="${c.id}">${UI.icon('edit',16)}</button>
            <button class="iconbtn" data-del="${c.id}">${UI.icon('trash',16)}</button>
          </td></tr>`; }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => this.clienteModal(OB.clientById(b.dataset.edit)));
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const c = OB.clientById(b.dataset.del);
        UI.confirm('Excluir cliente', `Remover "${c.nome}"? Esta ação não pode ser desfeita.`, () => {
          OB.removeClient(c.id); UI.toast('Cliente removido', '', 'ok'); this.render('clientes');
        }, 'Excluir');
      });
    };
    draw('all');
    document.querySelectorAll('#cli-filter button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#cli-filter button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); draw(b.dataset.f);
    });
    document.getElementById('add-cli').onclick = () => this.clienteModal();
  },

  clienteModal(c) {
    const edit = !!c;
    const g = (k) => edit ? (c[k] || '') : '';
    const servicoOpts = OB.PRODUTOS.map(p => `<option value="${p.id}" ${edit && c.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('');
    UI.modal({
      size: 'lg',
      title: edit ? 'Editar cliente' : 'Novo cliente',
      sub: 'Cadastro completo — os dados ficam visíveis apenas para você',
      body: `
        <div class="nav-label" style="padding-left:0">Dados do cliente</div>
        <div class="field"><label>Nome / Empresa <span class="req">*</span></label><input id="c-nome" value="${g('nome')}"/><div class="err">Obrigatório</div></div>
        <div class="grid-2">
          <div class="field"><label>Pessoa de contato <span class="req">*</span></label><input id="c-contato" value="${g('contato')}"/><div class="err">Obrigatório</div></div>
          <div class="field"><label>CPF ou CNPJ <span class="req">*</span></label><input id="c-doc" value="${g('doc')}" placeholder="000.000.000-00"/><div class="err">CPF/CNPJ inválido</div></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Telefone (WhatsApp) <span class="req">*</span></label><input id="c-tel" value="${g('telefone')}" placeholder="(00) 00000-0000"/><div class="err">Obrigatório</div></div>
          <div class="field"><label>Instagram</label><input id="c-insta" value="${g('instagram')}" placeholder="@cliente"/></div>
        </div>
        <div class="field"><label>E-mail <span class="req">*</span></label><input id="c-email" value="${g('email')}"/><div class="err">E-mail inválido</div></div>

        <div class="nav-label" style="padding-left:0">Endereço</div>
        <div class="grid-3">
          <div class="field"><label>CEP <span class="req">*</span></label><input id="c-cep" value="${g('cep')}" placeholder="00000-000"/><div class="hint" id="c-cep-hint">Preenche automaticamente</div></div>
          <div class="field"><label>Número <span class="req">*</span></label><input id="c-num" value="${g('numero')}"/><div class="err">Obrigatório</div></div>
          <div class="field"><label>Complemento</label><input id="c-comp" value="${g('complemento')}"/></div>
        </div>
        <div class="field"><label>Logradouro <span class="req">*</span></label><input id="c-log" value="${g('logradouro')}"/><div class="err">Obrigatório</div></div>
        <div class="grid-3">
          <div class="field"><label>Bairro <span class="req">*</span></label><input id="c-bairro" value="${g('bairro')}"/><div class="err">Obrigatório</div></div>
          <div class="field"><label>Cidade <span class="req">*</span></label><input id="c-cidade" value="${g('cidade')}"/><div class="err">Obrigatório</div></div>
          <div class="field"><label>UF <span class="req">*</span></label><input id="c-uf" value="${g('uf')}" maxlength="2"/><div class="err">Obrigatório</div></div>
        </div>

        <div class="nav-label" style="padding-left:0">Negócio</div>
        <div class="grid-2">
          <div class="field"><label>Tipo de cliente <span class="req">*</span></label>
            <select id="c-tipo">
              <option value="pontual" ${edit && c.tipo === 'pontual' ? 'selected' : ''}>Pontual (compra única)</option>
              <option value="recorrente" ${edit && c.tipo === 'recorrente' ? 'selected' : ''}>Recorrente (gera comissão recorrente)</option>
            </select>
          </div>
          <div class="field"><label>Tipo de serviço <span class="req">*</span></label>
            <select id="c-servico">
              <option value="">Selecione o serviço</option>
              ${servicoOpts}
            </select>
            <div class="err">Selecione o serviço</div>
          </div>
        </div>
        <div class="field"><label>Observações</label><textarea id="c-obs">${g('obs')}</textarea></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="c-save">${edit ? 'Salvar' : 'Cadastrar'}</button>`
    });
    if (edit && c.servico) document.getElementById('c-servico').value = c.servico;
    document.getElementById('c-tel').oninput = e => e.target.value = UI.maskPhone(e.target.value);
    document.getElementById('c-doc').oninput = e => e.target.value = UI.maskDoc(e.target.value);
    const cep = document.getElementById('c-cep');
    cep.oninput = e => e.target.value = UI.maskCEP(e.target.value);
    cep.onblur = () => this.buscarCEPCliente(cep.value);

    document.getElementById('c-save').onclick = () => {
      const val = id => document.getElementById(id).value.trim();
      const req = [
        ['c-nome', v => !!v], ['c-contato', v => !!v], ['c-doc', v => UI.validCPFouCNPJ(v)],
        ['c-tel', v => !!v], ['c-email', v => UI.validEmail(v)], ['c-cep', v => !!v],
        ['c-num', v => !!v], ['c-log', v => !!v], ['c-bairro', v => !!v],
        ['c-cidade', v => !!v], ['c-uf', v => !!v], ['c-servico', v => !!v]
      ];
      let ok = true;
      req.forEach(([id, test]) => {
        const good = test(val(id));
        document.getElementById(id).closest('.field').classList.toggle('has-error', !good);
        if (!good) ok = false;
      });
      if (!ok) return UI.toast('Campos obrigatórios', 'Preencha todos os campos marcados', 'err');

      const obj = c || { id: OB.uid(), consultorId: this.u().id, criadoEm: new Date().toISOString() };
      Object.assign(obj, {
        nome: val('c-nome'), contato: val('c-contato'), doc: val('c-doc'), telefone: val('c-tel'),
        instagram: val('c-insta'), email: val('c-email'), cep: val('c-cep'), numero: val('c-num'),
        complemento: val('c-comp'), logradouro: val('c-log'), bairro: val('c-bairro'),
        cidade: val('c-cidade'), uf: val('c-uf').toUpperCase(), tipo: document.getElementById('c-tipo').value,
        servico: document.getElementById('c-servico').value, obs: val('c-obs')
      });
      OB.upsertClient(obj);
      UI.closeModal(); UI.toast(edit ? 'Cliente atualizado' : 'Cliente cadastrado', '', 'ok');
      this.render('clientes');
    };
  },

  buscarCEPCliente(cepVal) {
    const d = cepVal.replace(/\D/g, ''); if (d.length !== 8) return;
    const hint = document.getElementById('c-cep-hint');
    hint.textContent = 'Buscando endereço...';
    fetch(`https://viacep.com.br/ws/${d}/json/`).then(r => r.json()).then(j => {
      if (j.erro) { hint.textContent = 'CEP não encontrado'; return; }
      document.getElementById('c-log').value = j.logradouro || '';
      document.getElementById('c-bairro').value = j.bairro || '';
      document.getElementById('c-cidade').value = j.localidade || '';
      document.getElementById('c-uf').value = j.uf || '';
      hint.textContent = 'Endereço preenchido ✓';
      document.getElementById('c-num').focus();
    }).catch(() => { hint.textContent = 'Não foi possível buscar o CEP'; });
  },

  /* ====================== VENDAS & COMISSÃO ====================== */
  view_comissao() {
    const u = this.u();
    const com = OB.comissaoDisponivel(u.id);
    const vendas = OB.salesOf(u.id).sort((a, b) => new Date(b.data) - new Date(a.data));
    const reqs = OB.requestsOf(u.id).filter(r => r.tipo === 'comissao');
    const volMes = OB.volumeMes(u.id);
    const nivel = OB.nivelPorVolume(volMes);

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:18px">
        ${this.kpi('money', OB.fmt(com.valor), 'Comissão disponível', 'Taxa atual ' + ((nivel.rate*100)|0) + '%')}
        ${this.kpi('cart', OB.fmt(volMes), 'Vendido no mês', 'Nível ' + nivel.nome)}
        ${this.kpi('receipt', reqs.filter(r=>r.status!=='pago'&&r.status!=='recusado').length, 'Solicitações em aberto', 'Pagamento em até 3 dias úteis')}
      </div>

      <div class="row between alc" style="margin-bottom:14px;flex-wrap:wrap;gap:12px">
        <div class="seg" id="sale-filter">
          <button class="on" data-f="all">Todas (${vendas.length})</button>
          <button data-f="aguardando">Aguardando (${vendas.filter(s=>s.statusProposta==='aguardando').length})</button>
          <button data-f="aprovada">Aprovadas (${vendas.filter(s=>s.statusProposta==='aprovada').length})</button>
          <button data-f="recusada">Recusadas (${vendas.filter(s=>s.statusProposta==='recusada').length})</button>
        </div>
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <button class="btn brand" id="add-sale">${UI.icon('plus',16)} Lançar venda</button>
          <button class="btn ghost" id="req-com" ${com.valor<=0?'disabled':''}>${UI.icon('receipt',16)} Solicitar comissão (${OB.fmt(com.valor)})</button>
        </div>
      </div>

      <div class="card" style="padding:0;margin-bottom:18px" id="sale-table"></div>

      <div class="card">
        <div class="card-head"><h3>Histórico de solicitações</h3></div>
        ${this.reqList(reqs)}
      </div>`;

    const draw = (f) => {
      const rows = vendas.filter(s => f === 'all' || s.statusProposta === f);
      const el = document.getElementById('sale-table');
      if (!rows.length) { el.innerHTML = this.empty('cart', 'Nenhuma venda aqui', 'Lance uma venda ou ajuste o filtro de acompanhamento.'); return; }
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Data</th><th>Cliente</th><th>Produto</th><th>Valor</th><th>Proposta</th><th>Comissão</th><th></th></tr></thead><tbody>
        ${rows.map(s => {
          const cli = OB.clientById(s.clientId); const p = OB.PRODUTOS.find(x => x.id === s.produto);
          const stMap = { disponivel: ['warn', 'Disponível'], solicitada: ['gray', 'Solicitada'], paga: ['green', 'Paga'] };
          const st = stMap[s.statusComissao] || ['gray', s.statusComissao];
          const pr = OB.STATUS_PROPOSTA[s.statusProposta] || OB.STATUS_PROPOSTA.aprovada;
          const temDesc = s.descontoTipo && s.descontoValor > 0;
          return `<tr><td>${OB.dataBR(s.data)}</td><td class="strong">${cli?cli.nome:'-'}</td>
            <td>${p?p.nome:s.produto}</td>
            <td><span class="strong">${OB.money(s.valor, s.moeda)}</span>${temDesc?`<br><span class="mut" style="font-size:11px">de ${OB.money(s.valorBruto, s.moeda)} · -${s.descontoTipo==='percent'?s.descontoValor+'%':OB.money(s.descontoValor, s.moeda)}</span>`:''}</td>
            <td><span class="chip ${pr.chip}">${pr.nome}</span></td>
            <td>${s.statusProposta==='aprovada'?`<span class="chip ${st[0]}">${st[1]}</span>`:'<span class="mut" style="font-size:12px">—</span>'}</td>
            <td class="row" style="gap:6px;justify-content:flex-end">
              ${s.statusProposta!=='aprovada'?`<button class="iconbtn" data-aprovar="${s.id}" title="Marcar aprovada" style="color:#1fa855">${UI.icon('check',16)}</button>`:''}
              ${s.statusProposta==='aguardando'?`<button class="iconbtn" data-recusar="${s.id}" title="Marcar recusada">${UI.icon('x',16)}</button>`:''}
              <button class="iconbtn" data-edit="${s.id}" title="Editar / desconto" ${s.statusComissao!=='disponivel'?'disabled':''}>${UI.icon('edit',16)}</button>
              <button class="iconbtn" data-del="${s.id}" title="Excluir" ${s.statusComissao!=='disponivel'?'disabled':''}>${UI.icon('trash',16)}</button>
            </td></tr>`;
        }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-aprovar]').forEach(b => b.onclick = () => this.setStatusProposta(b.dataset.aprovar, 'aprovada'));
      el.querySelectorAll('[data-recusar]').forEach(b => b.onclick = () => this.setStatusProposta(b.dataset.recusar, 'recusada'));
      el.querySelectorAll('[data-edit]').forEach(b => { if (!b.disabled) b.onclick = () => this.editarVenda(OB.salesOf(u.id).find(x => x.id === b.dataset.edit)); });
      el.querySelectorAll('[data-del]').forEach(b => { if (!b.disabled) b.onclick = () => this.excluirVenda(OB.salesOf(u.id).find(x => x.id === b.dataset.del)); });
    };
    draw('all');
    document.querySelectorAll('#sale-filter button').forEach(b => b.onclick = () => {
      document.querySelectorAll('#sale-filter button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); draw(b.dataset.f);
    });

    document.getElementById('add-sale').onclick = () => this.saleModal();
    const rc = document.getElementById('req-com');
    if (rc) rc.onclick = () => this.solicitarComissao(com);
  },

  /* marca proposta aprovada/recusada/aguardando */
  setStatusProposta(saleId, status) {
    const s = OB.salesOf(this.u().id).find(x => x.id === saleId); if (!s) return;
    s.statusProposta = status;
    if (status !== 'aprovada' && s.statusComissao === 'disponivel') { /* mantém disponivel; só não conta */ }
    OB.updateSale(s);
    UI.toast('Proposta atualizada', OB.STATUS_PROPOSTA[status].nome, 'ok');
    App.refreshCommission(true);
    this.render('comissao');
  },

  /* editar valor + aplicar desconto (R$ ou %) */
  editarVenda(s) {
    if (!s) return;
    const u = this.u();
    UI.modal({
      title: 'Editar venda',
      sub: 'Ajuste o valor e aplique desconto se quiser',
      body: `
        <div class="grid-2">
          <div class="field"><label>Valor bruto <span class="req">*</span></label><input id="ed-bruto" type="text" inputmode="decimal"/></div>
          <div class="field"><label>Moeda</label><select id="ed-moeda">${this.moedaOptions(s.moeda||'BRL')}</select></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Tipo de desconto</label>
            <select id="ed-tipo"><option value="">Sem desconto</option><option value="reais" ${s.descontoTipo==='reais'?'selected':''}>Em dinheiro</option><option value="percent" ${s.descontoTipo==='percent'?'selected':''}>Em porcentagem (%)</option></select></div>
          <div class="field"><label>Valor do desconto</label><input id="ed-desc" type="number" min="0" step="1" value="${s.descontoValor||0}"/></div>
        </div>
        <div class="notice"><div class="row between alc grow"><span>Valor final</span><b id="ed-final" style="font-size:18px;color:var(--brand)">${OB.money(s.valor, s.moeda)}</b></div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="ed-save">Salvar</button>`
    });
    const edMoeda = document.getElementById('ed-moeda');
    UI.money.set(document.getElementById('ed-bruto'), s.valorBruto || s.valor, s.moeda);
    UI.money.bind(document.getElementById('ed-bruto'), () => edMoeda.value);
    const calc = () => {
      const moeda = edMoeda.value;
      const bruto = UI.money.parse(document.getElementById('ed-bruto').value);
      const tipo = document.getElementById('ed-tipo').value;
      const d = parseFloat(document.getElementById('ed-desc').value) || 0;
      let final = bruto;
      if (tipo === 'reais') final = Math.max(0, bruto - d);
      else if (tipo === 'percent') final = Math.max(0, bruto * (1 - Math.min(d, 100) / 100));
      document.getElementById('ed-final').textContent = OB.money(Math.round(final), moeda);
      return { bruto, tipo, d, final: Math.round(final), moeda };
    };
    document.getElementById('ed-bruto').addEventListener('input', calc);
    document.getElementById('ed-desc').oninput = calc;
    document.getElementById('ed-tipo').onchange = calc;
    edMoeda.onchange = () => { const eb = document.getElementById('ed-bruto'); UI.money.set(eb, UI.money.parse(eb.value), edMoeda.value); calc(); };
    document.getElementById('ed-save').onclick = () => {
      const c = calc();
      if (!c.bruto || c.bruto <= 0) return UI.toast('Informe o valor', '', 'err');
      Object.assign(s, { valorBruto: c.bruto, descontoTipo: c.tipo || null, descontoValor: c.tipo ? c.d : 0, valor: c.final, moeda: c.moeda });
      OB.updateSale(s);
      UI.closeModal(); UI.toast('Venda atualizada', '', 'ok');
      App.refreshCommission(true);
      this.render('comissao');
    };
  },

  /* excluir venda (só se a comissão ainda estiver disponível) */
  excluirVenda(s) {
    if (!s) return;
    if (s.statusComissao !== 'disponivel') return UI.toast('Não é possível excluir', 'Esta venda já entrou em uma solicitação de comissão', 'err');
    const cli = OB.clientById(s.clientId);
    UI.confirm('Excluir venda', `Remover a venda de ${cli ? cli.nome : 'cliente'} (${OB.money(s.valor, s.moeda)})? Esta ação não pode ser desfeita.`, () => {
      OB.removeSale(s.id);
      UI.toast('Venda excluída', '', 'ok');
      App.refreshCommission(true);
      this.render('comissao');
    }, 'Excluir');
  },

  saleModal(opts) {
    opts = opts || {};
    const u = this.u();
    const clientes = OB.clientsOf(u.id);
    if (!clientes.length) return UI.confirm('Cadastre um cliente', 'Você precisa ter ao menos um cliente para lançar uma venda. Deseja cadastrar agora?', () => App.go('clientes'), 'Cadastrar cliente');
    const orcamento = opts.orcamento; // se true, é uma proposta (aguardando)
    UI.modal({
      title: orcamento ? 'Novo orçamento' : 'Lançar venda',
      sub: orcamento ? 'Crie uma proposta para enviar ao cliente' : 'A comissão é atualizada automaticamente no topo da tela',
      body: `
        <div class="field"><label>Cliente <span class="req">*</span></label>
          <select id="s-cli">${clientes.map(c => `<option value="${c.id}" ${opts.clientId===c.id?'selected':''}>${c.nome} (${c.tipo})</option>`).join('')}</select></div>
        <div class="field"><label>Produto / serviço <span class="req">*</span></label>
          <select id="s-prod">${OB.PRODUTOS.map(p => `<option value="${p.id}" data-min="${p.ticketMin}" data-max="${p.ticketMax}">${p.nome} · ${OB.brl(p.ticketMin)} a ${OB.brl(p.ticketMax)}</option>`).join('')}</select></div>
        <div class="grid-2">
          <div class="field"><label>Valor <span class="req">*</span></label>
            <input id="s-val" type="text" inputmode="decimal" placeholder="0,00"/>
            <div class="hint" id="s-hint"></div></div>
          <div class="field"><label>Moeda</label>
            <select id="s-moeda">${this.moedaOptions(OB.moedaAtual())}</select></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Tipo de desconto</label>
            <select id="s-dtipo"><option value="">Sem desconto</option><option value="reais">Em dinheiro</option><option value="percent">Em %</option></select></div>
          <div class="field"><label>Desconto</label><input id="s-dval" type="number" min="0" step="1" value="0"/></div>
        </div>
        <div class="field"><label>Status da proposta</label>
          <select id="s-status">
            <option value="aprovada" ${!orcamento?'selected':''}>Aprovada (venda fechada)</option>
            <option value="aguardando" ${orcamento?'selected':''}>Aguardando aceite do cliente</option>
          </select>
          <div class="hint">Só propostas <b>aprovadas</b> contam para sua comissão.</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="s-save">${orcamento ? 'Criar orçamento' : 'Lançar'}</button>`
    });
    const hint = () => {
      const opt = document.getElementById('s-prod').selectedOptions[0];
      document.getElementById('s-hint').textContent = `Ticket de mercado: ${OB.brl(+opt.dataset.min)} a ${OB.brl(+opt.dataset.max)}`;
    };
    document.getElementById('s-prod').onchange = hint; hint();
    const sMoeda = document.getElementById('s-moeda');
    UI.money.bind(document.getElementById('s-val'), () => sMoeda.value);
    sMoeda.onchange = () => { const sv = document.getElementById('s-val'); UI.money.set(sv, UI.money.parse(sv.value), sMoeda.value); };
    document.getElementById('s-save').onclick = () => {
      const moeda = sMoeda.value;
      const bruto = UI.money.parse(document.getElementById('s-val').value);
      if (!bruto || bruto <= 0) return UI.toast('Informe o valor', 'O valor é obrigatório', 'err');
      const tipo = document.getElementById('s-dtipo').value;
      const d = parseFloat(document.getElementById('s-dval').value) || 0;
      let valor = bruto;
      if (tipo === 'reais') valor = Math.max(0, bruto - d);
      else if (tipo === 'percent') valor = Math.max(0, bruto * (1 - Math.min(d, 100) / 100));
      valor = Math.round(valor);
      OB.addSale({
        id: OB.uid(), consultorId: u.id, clientId: document.getElementById('s-cli').value,
        produto: document.getElementById('s-prod').value, valor, valorBruto: bruto, moeda,
        descontoTipo: tipo || null, descontoValor: tipo ? d : 0,
        data: new Date().toISOString(), statusComissao: 'disponivel',
        statusProposta: document.getElementById('s-status').value
      });
      UI.closeModal();
      UI.toast(orcamento ? 'Orçamento criado!' : 'Venda lançada!', '', 'ok');
      App.refreshCommission(true);
      this.render(orcamento ? 'orcamentos' : 'comissao');
    };
  },

  /* ====================== ORÇAMENTOS ====================== */
  view_orcamentos() {
    const u = this.u();
    const vendas = OB.salesOf(u.id).sort((a, b) => new Date(b.data) - new Date(a.data));
    const abertos = vendas.filter(s => s.statusProposta === 'aguardando');
    const aprov = vendas.filter(s => s.statusProposta === 'aprovada');
    const valorAberto = abertos.reduce((t, s) => t + s.valor, 0);
    const taxaConv = vendas.length ? Math.round(aprov.length / vendas.length * 100) : 0;

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:18px">
        ${this.kpi('quote', abertos.length, 'Propostas em aberto', OB.fmt(valorAberto) + ' aguardando aceite')}
        ${this.kpi('check', aprov.length, 'Propostas aprovadas', 'Viraram venda')}
        ${this.kpi('trend', taxaConv + '%', 'Taxa de conversão', 'Aprovadas ÷ total')}
      </div>
      <div class="row between alc" style="margin-bottom:14px">
        <h3 style="font-size:16px">Suas propostas</h3>
        <button class="btn brand" id="novo-orc">${UI.icon('plus',16)} Novo orçamento</button>
      </div>
      <div class="card" style="padding:0" id="orc-table"></div>`;

    const el = document.getElementById('orc-table');
    if (!vendas.length) { el.innerHTML = this.empty('quote', 'Nenhum orçamento', 'Crie uma proposta e gere um documento bonito para enviar ao seu cliente.'); }
    else {
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Data</th><th>Cliente</th><th>Serviço</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>
        ${vendas.map(s => { const cli = OB.clientById(s.clientId); const p = OB.PRODUTOS.find(x => x.id === s.produto); const pr = OB.STATUS_PROPOSTA[s.statusProposta] || OB.STATUS_PROPOSTA.aprovada;
          return `<tr><td>${OB.dataBR(s.data)}</td><td class="strong">${cli?cli.nome:'-'}</td><td>${p?p.nome:s.produto}</td>
            <td class="strong">${OB.money(s.valor, s.moeda)}</td><td><span class="chip ${pr.chip}">${pr.nome}</span></td>
            <td class="row" style="gap:6px;justify-content:flex-end">
              <button class="iconbtn" data-pdf="${s.id}" title="Gerar orçamento (PDF)">${UI.icon('download',16)}</button>
              ${s.statusProposta==='aguardando'?`<button class="iconbtn" data-ap="${s.id}" title="Marcar aprovada" style="color:#1fa855">${UI.icon('check',16)}</button>`:''}
              ${s.statusProposta!=='aprovada'?`<button class="iconbtn" data-del="${s.id}" title="Excluir">${UI.icon('trash',16)}</button>`:''}
            </td></tr>`; }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => this.baixarOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.pdf)));
      el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { this.setStatusProposta(b.dataset.ap, 'aprovada'); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const s = OB.salesOf(u.id).find(x => x.id === b.dataset.del); UI.confirm('Excluir orçamento', `Remover a proposta de ${OB.clientById(s.clientId)?.nome||'cliente'}?`, () => { OB.removeSale(s.id); UI.toast('Orçamento excluído','','ok'); this.render('orcamentos'); }, 'Excluir'); });
    }
    document.getElementById('novo-orc').onclick = () => this.saleModal({ orcamento: true });
  },

  /* gera o orçamento branded (HTML autossuficiente p/ baixar/imprimir em PDF) */
  buildOrcamentoHTML(s) {
    const u = this.u(); const cli = OB.clientById(s.clientId); const p = OB.PRODUTOS.find(x => x.id === s.produto);
    const mark = `<svg viewBox="0 0 439 439" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="219.5" fill="#fff"/><path fill="#F15532" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#F15532" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const temDesc = s.descontoTipo && s.descontoValor > 0;
    const hoje = new Date(); const val = new Date(hoje.getTime() + 7 * 864e5);
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Orçamento OutBox · ${cli ? cli.nome : ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>:root{--brand:#F15532;--ink:#0A0A0A;--soft:#46505c;--mut:#8a96a3;--bg:#F5F7F9;--line:#e6eaef}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 10px 40px rgba(0,0,0,.06)}.cover{background:linear-gradient(135deg,#F15532,#e0431f);color:#fff;padding:40px 48px}.brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}.brand b{font-size:24px;font-weight:800}.cover h1{font-size:30px;font-weight:800;letter-spacing:-.02em}.cover p{color:rgba(255,255,255,.9);margin-top:4px}.body{padding:38px 48px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:28px;font-size:14px}.grid .lbl{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.04em}.tbl{width:100%;border-collapse:collapse;margin-bottom:18px}.tbl th{text-align:left;padding:12px 14px;background:var(--bg);border-bottom:2px solid var(--line);font-size:12px;text-transform:uppercase;color:var(--mut)}.tbl td{padding:14px;border-bottom:1px solid var(--line)}.tot{display:flex;justify-content:flex-end}.tot .box{min-width:280px}.tot .row{display:flex;justify-content:space-between;padding:8px 0;font-size:15px;color:var(--soft)}.tot .grand{border-top:2px solid var(--line);margin-top:6px;padding-top:14px;font-size:22px;font-weight:800;color:var(--ink)}.tot .grand b{color:var(--brand)}.note{margin-top:26px;padding:16px 18px;background:var(--bg);border-radius:12px;font-size:13px;color:var(--soft);border:1px solid var(--line)}.foot{border-top:1px solid var(--line);padding:24px 48px;color:var(--mut);font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}.foot b{color:var(--ink)}.print-hint{position:fixed;bottom:16px;right:16px;background:var(--brand);color:#fff;padding:10px 16px;border-radius:10px;font-weight:600;cursor:pointer;border:none;box-shadow:0 8px 20px rgba(241,85,50,.3)}@media print{.print-hint{display:none}.page{box-shadow:none}}</style></head>
<body><div class="page">
  <div class="cover"><div class="brand">${mark}<b>OutBox</b></div><h1>Proposta de Orçamento</h1><p>Preparada por ${u.nome || ''} ${u.sobrenome || ''} · Consultor OutBox Group</p></div>
  <div class="body">
    <div class="grid">
      <div><div class="lbl">Cliente</div>${cli ? cli.nome : '-'}</div>
      <div><div class="lbl">Data</div>${hoje.toLocaleDateString('pt-BR')}</div>
      <div><div class="lbl">Contato</div>${cli ? (cli.contato || '-') : '-'}${cli && cli.telefone ? ' · ' + cli.telefone : ''}</div>
      <div><div class="lbl">Validade</div>${val.toLocaleDateString('pt-BR')}</div>
    </div>
    <table class="tbl"><thead><tr><th>Serviço</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody><tr><td><b>${p ? p.nome : s.produto}</b><br><span style="color:var(--mut);font-size:13px">Desenvolvido pela OutBox Group</span></td><td style="text-align:right">${OB.money(s.valorBruto || s.valor, s.moeda)}</td></tr></tbody></table>
    <div class="tot"><div class="box">
      <div class="row"><span>Subtotal</span><span>${OB.money(s.valorBruto || s.valor, s.moeda)}</span></div>
      ${temDesc ? `<div class="row"><span>Desconto ${s.descontoTipo === 'percent' ? '(' + s.descontoValor + '%)' : ''}</span><span>- ${OB.money((s.valorBruto || s.valor) - s.valor, s.moeda)}</span></div>` : ''}
      <div class="row grand"><span>Total</span><b>${OB.money(s.valor, s.moeda)}</b></div>
    </div></div>
    <div class="note">Esta proposta tem validade de 7 dias. Os valores podem ser parcelados conforme negociação. Ao aprovar, iniciamos o briefing e o cronograma do seu projeto.</div>
  </div>
  <div class="foot"><div>OutBox Group · Proposta comercial<br><b>${u.email || 'felipe@outboxgroup.com.br'}</b>${u.celular ? ' · ' + u.celular : ''}</div><div>www.outboxgroup.com.br<br>Santa Cruz do Rio Pardo · SP</div></div>
</div><button class="print-hint" onclick="window.print()">Salvar como PDF / Imprimir</button></body></html>`;
  },
  baixarOrcamento(s) {
    if (!s) return;
    const blob = new Blob([this.buildOrcamentoHTML(s)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const cli = OB.clientById(s.clientId);
    const a = document.createElement('a'); a.href = url; a.download = `Orcamento OutBox - ${cli ? cli.nome : 'cliente'}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    UI.toast('Orçamento gerado', 'Abra o arquivo para enviar ou imprimir em PDF', 'ok');
  },

  /* ====================== FUNIL (Kanban arrastável) ====================== */
  view_funil() {
    const u = this.u();
    const v = document.getElementById('main-view');
    v.classList.add('view-wide'); // ocupa a largura toda da tela
    v.innerHTML = `
      <div class="row between alc" style="margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <p class="mut" style="font-size:13px;max-width:560px">Arraste os cartões entre as colunas para organizar seus contatos. Tudo é salvo automaticamente.</p>
        <button class="btn brand" id="novo-lead">${UI.icon('plus',16)} Novo contato</button>
      </div>
      <div class="kanban" id="kanban">
        ${OB.ESTAGIOS.map(e => {
          const leads = OB.leadsOf(u.id).filter(l => l.estagio === e.id);
          const total = leads.reduce((t, l) => t + (l.valorEstimado || 0), 0);
          return `<div class="kan-col" data-estagio="${e.id}">
            <div class="kan-head"><span class="kan-dot" style="background:${e.cor}"></span><b>${e.emoji} ${e.nome}</b><span class="kan-count">${leads.length}</span></div>
            <div class="kan-sub">${total ? OB.fmt(total) : '&nbsp;'}</div>
            <div class="kan-list" data-estagio="${e.id}">
              ${leads.map(l => this.leadCard(l)).join('')}
            </div>
            <button class="kan-add" data-add="${e.id}" title="Adicionar contato em ${e.nome}">${UI.icon('plus',16)} Adicionar</button>
          </div>`;
        }).join('')}
      </div>`;
    document.getElementById('novo-lead').onclick = () => this.leadModal();
    v.querySelectorAll('[data-add]').forEach(b => b.onclick = () => this.leadModal(null, b.dataset.add));
    this.bindKanban();
  },

  leadCard(l) {
    const sv = OB.PRODUTOS.find(p => p.id === l.servico);
    return `<div class="kan-card" draggable="true" data-id="${l.id}">
      <div class="row between alc"><b>${l.nome || 'Sem nome'}</b><span class="kan-grip">${UI.icon('edit',13)}</span></div>
      ${sv ? `<div style="margin-top:5px"><span class="chip brand" style="font-size:11px">${sv.nome}</span></div>` : ''}
      ${l.valorEstimado ? `<div class="kan-val">${OB.money(l.valorEstimado, l.moeda)}</div>` : ''}
      ${l.telefone ? `<div class="kan-meta">${UI.icon('whats',12)} ${l.telefone}</div>` : ''}
      ${l.obs ? `<div class="kan-meta mut">${l.obs}</div>` : ''}
    </div>`;
  },

  bindKanban() {
    const u = this.u();
    let dragId = null;
    document.querySelectorAll('.kan-card').forEach(card => {
      card.addEventListener('dragstart', () => { dragId = card.dataset.id; card.classList.add('dragging'); });
      card.addEventListener('dragend', () => { dragId = null; card.classList.remove('dragging'); });
      card.addEventListener('click', (e) => { if (!card.classList.contains('dragging')) this.leadModal(OB.leadsOf(u.id).find(l => l.id === card.dataset.id)); });
    });
    document.querySelectorAll('.kan-list').forEach(list => {
      list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('over'); });
      list.addEventListener('dragleave', () => list.classList.remove('over'));
      list.addEventListener('drop', (e) => {
        e.preventDefault(); list.classList.remove('over');
        if (!dragId) return;
        const lead = OB.leadsOf(u.id).find(l => l.id === dragId);
        if (lead && lead.estagio !== list.dataset.estagio) {
          lead.estagio = list.dataset.estagio;
          OB.upsertLead(lead);
          this.render('funil');
        }
      });
    });
  },

  leadModal(l, estagioPreset) {
    const edit = !!l; const u = this.u(); const preEst = estagioPreset || 'frio';
    UI.modal({
      title: edit ? 'Editar contato' : 'Novo contato',
      body: `
        <div class="field"><label>Nome <span class="req">*</span></label><input id="l-nome" value="${edit ? (l.nome || '') : ''}"/></div>
        <div class="grid-2">
          <div class="field"><label>Telefone (WhatsApp)</label><input id="l-tel" value="${edit ? (l.telefone || '') : ''}" placeholder="(00) 00000-0000"/></div>
          <div class="field"><label>E-mail</label><input id="l-email" value="${edit ? (l.email || '') : ''}"/></div>
        </div>
        <div class="field"><label>Serviço de interesse</label>
          <select id="l-serv"><option value="">Selecione (opcional)</option>${OB.PRODUTOS.map(p => `<option value="${p.id}" ${edit && l.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select>
          <div class="hint">Ajuda a lembrar o que o contato precisa.</div></div>
        <div class="field"><label>Etapa</label><select id="l-est">${OB.ESTAGIOS.map(e => `<option value="${e.id}" ${(edit ? l.estagio === e.id : e.id === preEst) ? 'selected' : ''}>${e.emoji} ${e.nome}</option>`).join('')}</select></div>
        <div class="grid-2">
          <div class="field"><label>Valor estimado</label><input id="l-val" type="text" inputmode="decimal" placeholder="0,00"/></div>
          <div class="field"><label>Moeda</label><select id="l-moeda">${this.moedaOptions(edit ? (l.moeda || 'BRL') : OB.moedaAtual())}</select></div>
        </div>
        <div class="field"><label>Observações</label><textarea id="l-obs">${edit ? (l.obs || '') : ''}</textarea></div>
        <button type="button" class="btn ghost block" id="l-brief" style="border-style:dashed">${UI.icon('docs',16)} Compartilhar briefing com o cliente</button>
        <div class="hint" style="text-align:center">Use quando o cliente fechar, para coletar as informações do projeto.</div>`,
      footer: `${edit ? `<button class="btn danger" id="l-del">Excluir</button>` : ''}<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="l-save">${edit ? 'Salvar' : 'Adicionar'}</button>`
    });
    if (document.getElementById('l-tel')) document.getElementById('l-tel').oninput = e => e.target.value = UI.maskPhone(e.target.value);
    const lMoeda = document.getElementById('l-moeda');
    UI.money.set(document.getElementById('l-val'), edit ? (l.valorEstimado || 0) : 0, lMoeda.value);
    UI.money.bind(document.getElementById('l-val'), () => lMoeda.value);
    lMoeda.onchange = () => { const lv = document.getElementById('l-val'); UI.money.set(lv, UI.money.parse(lv.value), lMoeda.value); };
    document.getElementById('l-brief').onclick = () => this.compartilharBriefing({
      nome: document.getElementById('l-nome').value.trim() || (edit ? l.nome : ''),
      telefone: document.getElementById('l-tel').value.trim()
    });
    document.getElementById('l-save').onclick = () => {
      const nome = document.getElementById('l-nome').value.trim();
      if (!nome) return UI.toast('Informe o nome', '', 'err');
      const obj = l || { id: OB.uid(), consultorId: u.id, ordem: 0, criadoEm: new Date().toISOString() };
      Object.assign(obj, { nome, telefone: document.getElementById('l-tel').value.trim(), email: document.getElementById('l-email').value.trim(), servico: document.getElementById('l-serv').value, estagio: document.getElementById('l-est').value, valorEstimado: UI.money.parse(document.getElementById('l-val').value), moeda: lMoeda.value, obs: document.getElementById('l-obs').value.trim() });
      OB.upsertLead(obj);
      UI.closeModal(); UI.toast(edit ? 'Contato atualizado' : 'Contato adicionado', '', 'ok');
      this.render('funil');
    };
    const del = document.getElementById('l-del');
    if (del) del.onclick = () => UI.confirm('Excluir contato', `Remover "${l.nome}" do funil?`, () => { OB.removeLead(l.id); UI.closeModal(); UI.toast('Contato removido', '', 'ok'); this.render('funil'); }, 'Excluir');
  },

  /* compartilhar briefing — PREPARADO. Quando o usuário criar o modelo de
     briefing, basta definir OB.LINK_BRIEFING com o link do formulário. */
  compartilharBriefing(lead) {
    const temLink = !!OB.LINK_BRIEFING;
    const nome = (lead && lead.nome) ? lead.nome.split(' ')[0] : 'tudo bem';
    const linkTxt = temLink ? OB.LINK_BRIEFING : '[link do briefing]';
    const msg = `Olá ${nome}! Que ótimo fecharmos o projeto 🎉 Para começarmos, preencha o briefing com as informações do seu projeto: ${linkTxt}`;
    const tel = lead && lead.telefone ? lead.telefone.replace(/\D/g, '') : '';
    const waTel = tel ? (tel.length <= 11 ? '55' + tel : tel) : '';
    UI.modal({
      title: 'Compartilhar briefing',
      sub: 'Envie o formulário de briefing para o cliente',
      body: `${temLink ? '' : `<div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>O <b>modelo de briefing ainda não foi configurado</b>. Quando você criar o seu formulário (ex.: Google Forms), me envie o link que eu coloco aqui e o botão passa a enviar automaticamente. Por enquanto você pode editar a mensagem abaixo.</div></div>`}
        <div class="field"><label>Mensagem</label><textarea id="bf-msg" style="min-height:120px">${msg}</textarea></div>`,
      footer: `<button class="btn ghost" id="bf-copy">${UI.icon('docs',15)} Copiar</button><button class="btn green" id="bf-wa">${UI.icon('whats',16)} Enviar no WhatsApp</button>`
    });
    document.getElementById('bf-copy').onclick = () => { navigator.clipboard.writeText(document.getElementById('bf-msg').value).then(() => UI.toast('Mensagem copiada', '', 'ok')); };
    document.getElementById('bf-wa').onclick = () => {
      const txt = encodeURIComponent(document.getElementById('bf-msg').value);
      window.open(waTel ? `https://wa.me/${waTel}?text=${txt}` : `https://wa.me/?text=${txt}`, '_blank');
    };
  },

  /* pop-up da comissão (acionado pelo valor no topo) */
  comissaoPopup() {
    const u = this.u();
    const r = OB.comissaoResumo(u.id);
    const linha = (lbl, val, cls, sub) => `
      <div class="row between alc" style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div><div style="font-size:14px" class="soft">${lbl}</div>${sub ? `<div class="mut" style="font-size:12px">${sub}</div>` : ''}</div>
        <b style="font-size:16px;${cls || ''}">${OB.fmt(val)}</b>
      </div>`;

    const bloqueadoHTML = r.bloqueados.length ? r.bloqueados.map(b => `
      <div class="row between alc" style="padding:11px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--surface-2)">
        <div class="row alc" style="gap:10px">
          <span class="iconbtn" style="width:34px;height:34px;background:var(--surface-3)">${UI.icon('lock',15)}</span>
          <div><b style="font-size:14px">Nível ${b.nivel.nome} · ${(b.nivel.rate*100)|0}%</b>
          <div class="mut" style="font-size:12px">Faltam ${OB.fmt(b.faltaVolume)} em vendas no mês para desbloquear <b style="color:var(--brand)">+${b.extraPct}%</b></div></div>
        </div>
      </div>`).join('') : `<div class="chip green" style="margin-top:4px">🏆 Você já está no nível máximo (Black · 20%)</div>`;

    UI.modal({
      title: 'Sua comissão do mês',
      sub: `Nível ${r.nivel.nome} · taxa atual ${(r.rate*100)|0}% · volume ${OB.fmt(r.volume)}`,
      body: `
        <div class="card" style="background:linear-gradient(135deg,var(--brand),var(--brand-600));color:#fff;border:none;margin-bottom:16px">
          <div style="font-size:12px;opacity:.85;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Disponível para solicitar agora</div>
          <div style="font-size:32px;font-weight:800;letter-spacing:-.02em;margin:2px 0 4px">${OB.fmt(r.disponivel)}</div>
          <div style="font-size:12px;opacity:.9">${(r.rate*100)|0}% sobre ${OB.fmt(r.volume)} vendidos no mês</div>
        </div>
        ${linha('Em análise pelo admin', r.emAnalise, 'color:var(--text)', 'Aguardando repasse (até 3 dias úteis)')}
        ${linha('Já pago no mês', r.jaPago, 'color:#1fa855')}
        <div class="nav-label" style="padding-left:0;margin-top:8px">${UI.icon('lock',12)} Bloqueado pelo sistema — desbloqueie batendo metas</div>
        ${bloqueadoHTML}
        <div class="notice" style="margin-top:14px">${UI.icon('shield',16)}<div>A comissão é <b>progressiva de 10% a 20%</b> conforme o volume do mês. O pagamento é liberado pelo admin <b>mediante a comprovação</b> do serviço e do valor recebido pela OutBox.</div></div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button><button class="btn brand" id="cp-sol" ${r.disponivel <= 0 ? 'disabled' : ''}>${UI.icon('receipt',16)} Solicitar ${OB.fmt(r.disponivel)}</button>`
    });
    const sol = document.getElementById('cp-sol');
    if (sol) sol.onclick = () => { UI.closeModal(); this.solicitarComissao(OB.comissaoDisponivel(u.id)); };
  },

  solicitarComissao(com) {
    if (com.valor <= 0) return UI.toast('Nada disponível', 'Você não tem comissão liberada para solicitar', 'err');
    UI.modal({
      title: 'Solicitar pagamento de comissão',
      sub: 'O administrador será notificado imediatamente',
      body: `
        <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>O pagamento é feito <b>em até 3 dias úteis</b>, mediante a comprovação do serviço e dos valores que entraram na conta da OutBox.</div></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Vendas incluídas</span><b>${com.vendas.length}</b></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Base de cálculo</span><b>${OB.fmt(com.base)}</b></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Taxa do nível</span><b>${(com.rate*100)|0}%</b></div>
        <hr style="border:none;border-top:1px solid var(--border);margin:14px 0"/>
        <div class="row between" style="font-size:20px"><b>Total a receber</b><b style="color:var(--brand)">${OB.fmt(com.valor)}</b></div>
        <div class="field" style="margin-top:16px"><label>Dados / chave PIX para recebimento <span class="req">*</span></label><input id="rq-pix" placeholder="CPF, e-mail, telefone ou chave aleatória"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="rq-go">Confirmar solicitação</button>`
    });
    document.getElementById('rq-go').onclick = () => {
      const pix = document.getElementById('rq-pix').value.trim();
      if (!pix) return UI.toast('Informe a chave PIX', '', 'err');
      const u = this.u();
      OB.addRequest({
        id: OB.uid(), tipo: 'comissao', consultorId: u.id,
        consultorNome: u.nome + ' ' + u.sobrenome, valor: com.valor,
        detalhe: `${com.vendas.length} venda(s) · base ${OB.fmt(com.base)} · ${(com.rate*100)|0}%`,
        pix, status: 'solicitado', criadoEm: new Date().toISOString(),
        vendaIds: com.vendas.map(s => s.id)
      });
      // marca vendas como solicitadas (regra interna → vai para o admin)
      com.vendas.forEach(s => { s.statusComissao = 'solicitada'; OB.updateSale(s); });
      UI.closeModal();
      UI.toast('Solicitação enviada', 'O administrador foi notificado para análise e repasse', 'ok');
      App.refreshCommission(true);
      App.go(App.current || 'comissao');
    };
  },

  reqList(reqs) {
    if (!reqs.length) return this.emptyMini('Nenhuma solicitação ainda');
    const stMap = { solicitado: ['warn', 'Solicitado'], em_analise: ['gray', 'Em análise'], aprovado: ['green', 'Aprovado'], pago: ['green', 'Pago'], recusado: ['gray', 'Recusado'] };
    const tipoLabel = (r) => r.tipo === 'comissao' ? 'Comissão' : (r.modo === 'produto' ? 'Prêmio (produto)' : 'Prêmio (dinheiro)');
    return `<div class="table-wrap" style="border:none"><table><thead><tr><th>Data</th><th>Tipo</th><th>Detalhe</th><th>Valor</th><th>Status</th></tr></thead><tbody>
      ${reqs.map(r => { const st = stMap[r.status] || ['gray', r.status];
        // valor de prêmio não é exibido ao consultor
        const valorCel = r.tipo === 'comissao' ? `<span class="strong">${OB.fmt(r.valor)}</span>` : '<span class="mut">—</span>';
        return `<tr><td>${OB.dataBR(r.criadoEm)}</td><td>${tipoLabel(r)}</td>
        <td class="mut">${r.detalhe||'-'}</td><td>${valorCel}</td>
        <td><span class="chip ${st[0]}">${st[1]}</span></td></tr>`; }).join('')}
    </tbody></table></div>`;
  },

  /* ====================== PREMIAÇÕES ====================== */
  view_premiacoes() {
    const u = this.u();
    const vol = OB.volumeTrimestre(u.id);
    const alc = OB.premioAlcancado(u.id);
    const prox = OB.proximoPremio(u.id);
    const reqs = OB.requestsOf(u.id).filter(r => r.tipo === 'premio');

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-2" style="margin-bottom:18px">
        <div class="card">
          <div class="card-head"><h3>Progresso até o próximo prêmio</h3><span class="chip brand">${UI.icon('target',13)} Trimestre</span></div>
          <div style="position:relative;height:170px;margin-top:8px"><canvas id="ch-gauge"></canvas>
            <div style="position:absolute;left:0;right:0;bottom:18px;text-align:center">
              <div style="font-size:30px;font-weight:800">${prox ? Math.min(100,Math.round(vol/prox.meta*100)) : 100}%</div>
              <div class="mut" style="font-size:13px">${prox ? 'até ' + prox.nome : 'todos atingidos 🎉'}</div>
            </div>
          </div>
          <div class="center soft" style="font-size:13px;margin-top:6px">
            Volume no trimestre: <b style="color:var(--brand)">${OB.fmt(vol)}</b>
            ${prox ? ` · faltam <b>${OB.fmt(prox.meta - vol)}</b>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Prêmio conquistado</h3></div>
          ${alc ? `
            <div class="prize reached" style="border:none;box-shadow:none;padding:0">
              <img src="${alc.img}" alt="${alc.nome}"/>
              <b style="font-size:20px">${alc.nome}</b>
              <div class="meta">Meta de ${OB.fmt(alc.meta)} atingida</div>
              <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">
                <button class="btn brand sm" id="prize-produto">🎁 Receber o produto</button>
                <button class="btn green sm" id="prize-dinheiro">💵 Receber o dinheiro</button>
              </div>
              <div class="hint" style="margin-top:12px">Escolha receber o produto físico ou o valor equivalente em dinheiro. A solicitação vai para o administrador.</div>
            </div>` : this.empty('prize', 'Nenhum prêmio ainda', 'Continue vendendo! Ao atingir ' + (prox ? OB.fmt(prox.meta) + ' você ganha o ' + prox.nome : 'as metas você ganha prêmios') + '.')}
        </div>
      </div>

      <div class="card" style="margin-bottom:18px">
        <div class="card-head"><h3>Escada de prêmios trimestrais</h3><span class="mut">Resgate o degrau mais alto que alcançar</span></div>
        <div class="cards cols-4">
          ${OB.PREMIOS.map(p => {
            const reached = vol >= p.meta;
            return `<div class="prize card ${reached?'reached':'locked'}" style="padding:18px">
              <img src="${p.img}" alt="${p.nome}"/>
              <b>${p.nome}</b>
              <div class="meta">${OB.fmt(p.meta)}</div>
              <span class="chip ${reached?'green':'gray'}">${reached?'✓ Conquistado':'Bloqueado'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Solicitações de prêmio</h3></div>
        ${this.reqList(reqs)}
      </div>`;

    setTimeout(() => Charts.gauge('ch-gauge', vol, prox ? prox.meta : vol), 50);

    const bp = document.getElementById('prize-produto');
    const bd = document.getElementById('prize-dinheiro');
    if (bp) bp.onclick = () => this.resgatarPremio(alc, 'produto');
    if (bd) bd.onclick = () => this.resgatarPremio(alc, 'dinheiro');
  },

  /* modo: 'produto' (entrega do item) ou 'dinheiro' (valor equivalente, sem exibir o valor) */
  resgatarPremio(premio, modo) {
    const dinheiro = modo === 'dinheiro';
    UI.modal({
      title: dinheiro ? 'Receber o dinheiro' : 'Receber o produto',
      sub: 'O administrador será notificado para análise e repasse',
      body: `<div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>${dinheiro
          ? `Você optou por receber o <b>valor equivalente</b> ao prêmio <b>${premio.nome}</b> em dinheiro. O administrador confirma o valor e faz o repasse em até 3 dias úteis após a comprovação.`
          : `Você optou por receber o <b>${premio.nome}</b> (produto físico). O administrador combinará a entrega com você.`}</div></div>
        ${dinheiro
          ? `<div class="field"><label>Chave PIX para recebimento <span class="req">*</span></label><input id="tp-pix" placeholder="CPF, e-mail, telefone ou chave aleatória"/></div>`
          : `<div class="field"><label>Endereço/observação para entrega</label><input id="tp-end" placeholder="Confirme seu endereço ou ponto de retirada"/></div>`}`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="tp-go">Confirmar solicitação</button>`
    });
    document.getElementById('tp-go').onclick = () => {
      const u = this.u();
      let pix = '', detalhe = '';
      if (dinheiro) {
        pix = document.getElementById('tp-pix').value.trim();
        if (!pix) return UI.toast('Informe a chave PIX', '', 'err');
        detalhe = `Prêmio ${premio.nome} — receber valor em dinheiro`;
      } else {
        pix = document.getElementById('tp-end').value.trim();
        detalhe = `Prêmio ${premio.nome} — entrega do produto`;
      }
      OB.addRequest({
        id: OB.uid(), tipo: 'premio', modo, premioId: premio.id, premioNome: premio.nome,
        consultorId: u.id, consultorNome: u.nome + ' ' + u.sobrenome,
        valor: dinheiro ? premio.valor : 0, // valor interno p/ o admin; não é exibido ao consultor
        detalhe, pix, status: 'solicitado', criadoEm: new Date().toISOString()
      });
      UI.closeModal();
      UI.toast('Solicitação enviada', 'O administrador foi notificado', 'ok');
      this.render('premiacoes');
    };
  },

  /* ====================== DOCUMENTOS ====================== */
  view_documentos() {
    const docs = this.DOCS();
    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="card" style="margin-bottom:18px;background:linear-gradient(135deg,var(--brand),var(--brand-600));color:#fff;border:none">
        <div class="row between alc wrap" style="gap:16px">
          <div class="row alc" style="gap:14px">
            <span style="width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.18);display:grid;place-items:center">${UI.icon('external',22)}</span>
            <div><h3 style="color:#fff;font-size:18px">Apresentação de Vendas OutBox</h3>
            <p style="color:rgba(255,255,255,.85);margin-top:4px">Use o deck oficial para apresentar a OutBox aos seus clientes.</p></div>
          </div>
          <a class="btn" style="background:#fff;color:var(--brand)" href="${OB.LINK_APRESENTACAO}" target="_blank" rel="noopener">${UI.icon('external',16)} Abrir apresentação</a>
        </div>
      </div>

      <div class="row between alc" style="margin-bottom:14px">
        <h3 style="font-size:16px">Materiais para download</h3>
        <span class="mut" style="font-size:13px">Baixe, leia e use com seus clientes</span>
      </div>
      <div class="cards cols-2">
        ${docs.map(d => `
          <div class="card doc">
            <span class="thumb">${UI.icon(d.icon, 22)}</span>
            <div class="grow"><div class="row between alc"><b>${d.nome}</b><span class="chip brand">${d.tag}</span></div>
            <p>${d.desc}</p>
            <div class="row" style="gap:8px;margin-top:12px">
              <button class="btn ghost sm" data-open="${d.id}">${UI.icon('external',15)} Visualizar</button>
              <button class="btn brand sm" data-dl="${d.id}">${UI.icon('download',15)} Baixar</button>
            </div></div>
          </div>`).join('')}
      </div>`;
    v.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => this.baixarDoc(b.dataset.dl));
    v.querySelectorAll('[data-open]').forEach(b => b.onclick = () => this.abrirDoc(b.dataset.open));
  },

  /* ---------- conteúdo dos materiais ---------- */
  DOCS() {
    const cat = OB.PRODUTOS.map(p => `<tr><td><b>${p.nome}</b></td><td>${OB.brl(p.ticketMin)} a ${OB.brl(p.ticketMax)}</td><td>${OB.brl(Math.round(p.ticketMin*0.10))} a ${OB.brl(Math.round(p.ticketMax*0.20))}</td></tr>`).join('');
    return [
      {
        id: 'spin', nome: 'Guia SPIN Selling — Fundamentos', tag: 'SPIN Selling', icon: 'docs',
        desc: 'As 4 perguntas que conduzem o cliente à decisão: Situação, Problema, Implicação e Necessidade.',
        intro: 'O SPIN Selling é um método de vendas consultivas baseado em fazer as perguntas certas, na ordem certa. Em vez de empurrar o serviço, você guia o cliente a perceber sozinho que precisa dele.',
        secoes: [
          { icon: 'help', titulo: 'S — Situação', html: '<p>Entenda o contexto atual do cliente. Colete fatos, sem julgar.</p><ul><li>Como você divulga seu negócio hoje?</li><li>Você já tem site ou trabalha só pelo Instagram?</li><li>Quantos clientes novos chegam por mês pela internet?</li></ul>' },
          { icon: 'info', titulo: 'P — Problema', html: '<p>Revele as dores escondidas na situação atual.</p><ul><li>O que te incomoda na forma como capta clientes hoje?</li><li>Você sente que perde vendas por não ter uma presença profissional?</li><li>Seu material atual passa a imagem que seu negócio merece?</li></ul>' },
          { icon: 'trend', titulo: 'I — Implicação', html: '<p>Amplie o problema mostrando suas consequências. Aqui o cliente sente o custo de não agir.</p><ul><li>Quanto deixa de faturar por mês por não converter quem te procura?</li><li>Se um concorrente com site melhor aparece, para quem o cliente vai?</li><li>Quanto vale, em 1 ano, cada cliente que você perde hoje?</li></ul>' },
          { icon: 'check', titulo: 'N — Necessidade de solução', html: '<p>Faça o cliente verbalizar o valor da solução.</p><ul><li>Se você tivesse um site que vende 24h, o que mudaria?</li><li>Quanto valeria fechar 5 clientes a mais por mês?</li><li>Faz sentido investir uma vez para resolver isso de vez?</li></ul>' }
        ]
      },
      {
        id: 'abordagem', nome: 'Roteiro de Abordagem Inicial', tag: 'Abordagem', icon: 'whats',
        desc: 'Como iniciar a conversa, gerar conexão e marcar a reunião nos primeiros minutos.',
        intro: 'Os primeiros 30 segundos definem a venda. Este roteiro ajuda você a abrir a conversa com naturalidade, gerar conexão e conduzir para uma reunião.',
        secoes: [
          { icon: 'whats', titulo: 'Primeira mensagem (WhatsApp/DM)', html: '<p>Curta, personalizada e sem parecer robô:</p><blockquote>"Oi [Nome], tudo bem? Vi o [perfil/empresa] e curti muito o trabalho de vocês. Ajudo negócios como o seu a venderem mais pela internet com site e identidade profissional. Posso te mostrar rapidinho uma ideia?"</blockquote>' },
          { icon: 'clients', titulo: 'Gere conexão antes de vender', html: '<ul><li>Elogie algo específico e verdadeiro do negócio dele.</li><li>Mostre que pesquisou: cite um detalhe real.</li><li>Fale de resultado, não de tecnologia.</li></ul>' },
          { icon: 'target', titulo: 'Conduza para a reunião', html: '<p>O objetivo da abordagem não é vender, é marcar a conversa.</p><blockquote>"Topa uma call de 15 minutos? Te mostro exemplos e a gente vê se faz sentido, sem compromisso."</blockquote>' },
          { icon: 'clock', titulo: 'Follow-up (não some)', html: '<ul><li>Sem resposta? Aguarde 2 dias e mande um lembrete leve.</li><li>Traga novidade: um exemplo, um case, uma ideia.</li><li>No máximo 3 follow-ups educados.</li></ul>' }
        ]
      },
      {
        id: 'implicacao', nome: 'Perguntas de Implicação', tag: 'SPIN Selling', icon: 'trend',
        desc: 'Modelos prontos para fazer o cliente perceber o custo de não agir.',
        intro: 'A pergunta de implicação é a mais poderosa do SPIN: ela transforma um problema pequeno em uma prioridade. Use estes modelos adaptando ao contexto do cliente.',
        secoes: [
          { icon: 'money', titulo: 'Implicação financeira', html: '<ul><li>Quanto cada cliente novo vale para você por mês?</li><li>Se você perde 3 por mês por falta de presença online, quanto é isso no ano?</li><li>Quanto custa continuar como está por mais 12 meses?</li></ul>' },
          { icon: 'users', titulo: 'Implicação competitiva', html: '<ul><li>Seus concorrentes já têm site profissional?</li><li>Quando o cliente compara você com eles, quem passa mais confiança?</li><li>Para onde vai o cliente que não te encontra no Google?</li></ul>' },
          { icon: 'clock', titulo: 'Implicação de tempo', html: '<ul><li>Quanto tempo você gasta explicando o que já poderia estar no site?</li><li>Quantas vendas trava por responder tudo manualmente?</li></ul>' }
        ]
      },
      {
        id: 'objecoes', nome: 'Quebra de Objeções', tag: 'Negociação', icon: 'shield',
        desc: 'Respostas prontas para "está caro", "vou pensar" e "preciso ver com meu sócio".',
        intro: 'Objeção não é um não — é um pedido de mais informação ou segurança. Acolha, reformule e responda com valor.',
        secoes: [
          { icon: 'money', titulo: '"Está caro"', html: '<blockquote>"Entendo. Caro comparado a quê? Se esse site te trouxer 2 clientes a mais por mês, ele se paga em pouco tempo e segue vendendo por anos. É investimento, não custo."</blockquote>' },
          { icon: 'clock', titulo: '"Vou pensar"', html: '<blockquote>"Claro! Só pra eu te ajudar melhor: o que exatamente ficou em dúvida — o investimento, o prazo ou se vai funcionar pro seu caso?"</blockquote><p>Isso revela a objeção real por trás do "vou pensar".</p>' },
          { icon: 'users', titulo: '"Preciso ver com meu sócio"', html: '<blockquote>"Perfeito, faz todo sentido. Quer que eu prepare um resumo de 1 página com a proposta pra facilitar essa conversa? Posso até participar de uma call com vocês dois."</blockquote>' },
          { icon: 'shield', titulo: '"E se não funcionar?"', html: '<blockquote>"Justa preocupação. Por isso trabalhamos com etapas e aprovação em cada fase: você só avança quando estiver satisfeito com o que viu."</blockquote>' }
        ]
      },
      {
        id: 'catalogo', nome: 'Catálogo de Produtos e Tickets', tag: 'Catálogo', icon: 'cart',
        desc: 'Serviços da OutBox, faixas de preço de mercado e a comissão correspondente.',
        intro: 'Use este catálogo para precificar e apresentar os serviços. A comissão é progressiva de 10% a 20% conforme o seu volume no mês.',
        secoes: [
          { icon: 'cart', titulo: 'Serviços e faixas de preço', html: `<table class="doc-table"><thead><tr><th>Serviço</th><th>Ticket de mercado</th><th>Sua comissão (10% a 20%)</th></tr></thead><tbody>${cat}</tbody></table>` },
          { icon: 'money', titulo: 'Regra de comissão progressiva', html: '<ul><li><b>Bronze</b> — 10% (ponto de partida)</li><li><b>Prata</b> — 13% ao atingir R$ 5.000 no mês</li><li><b>Ouro</b> — 16% ao atingir R$ 15.000 no mês</li><li><b>Black</b> — 20% ao atingir R$ 30.000 no mês</li></ul><p>A taxa vale para todo o volume do mês e também na recorrência.</p>' }
        ]
      },
      {
        id: 'guia-sistema', nome: 'Guia Rápido do Sistema', tag: 'Passo a passo', icon: 'help',
        desc: 'Como usar o sistema de consultores do zero: perfil, clientes, vendas, comissão e prêmios.',
        intro: 'Em poucos minutos você domina o sistema. Siga a ordem abaixo.',
        secoes: [
          { icon: 'profile', titulo: '1. Complete seu perfil', html: '<p>Em "Editar Perfil", preencha todos os campos obrigatórios. Isso é exigido para solicitar pagamentos.</p>' },
          { icon: 'clients', titulo: '2. Cadastre seus clientes', html: '<p>Em "Meus Clientes", faça o cadastro completo e escolha o tipo de cliente e o tipo de serviço.</p>' },
          { icon: 'cart', titulo: '3. Lance suas vendas', html: '<p>Em "Vendas & Comissão", clique em "Lançar venda". Sua comissão atualiza no topo na hora.</p>' },
          { icon: 'money', titulo: '4. Solicite sua comissão', html: '<p>Clique no valor de "Comissão disponível" no topo para ver o que pode solicitar e o que ainda está bloqueado. Ao solicitar, o admin é notificado e paga em até 3 dias úteis após a comprovação.</p>' },
          { icon: 'prize', titulo: '5. Resgate seus prêmios', html: '<p>Em "Premiações", ao bater a meta do trimestre, escolha receber o produto ou o valor em dinheiro.</p>' }
        ]
      }
    ];
  },

  /* gera o HTML branded do documento (arquivo autossuficiente) */
  buildDocHTML(doc) {
    const mark = `<svg viewBox="0 0 439 439" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="219.5" fill="#fff"/><path fill="#F15532" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#F15532" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const secoes = doc.secoes.map(s => `
      <section class="sec">
        <div class="sec-h"><span class="sec-ic">${UI.icon(s.icon, 20)}</span><h2>${s.titulo}</h2></div>
        <div class="sec-b">${s.html}</div>
      </section>`).join('');
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>OutBox · ${doc.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{--brand:#F15532;--ink:#0A0A0A;--soft:#46505c;--mut:#8a96a3;--bg:#F5F7F9;--line:#e6eaef}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 10px 40px rgba(0,0,0,.06)}
  .cover{background:linear-gradient(135deg,#F15532,#e0431f);color:#fff;padding:44px 48px;position:relative;overflow:hidden}
  .cover::after{content:"";position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.10)}
  .brand{display:flex;align-items:center;gap:12px;margin-bottom:26px;position:relative;z-index:1}
  .brand b{font-size:24px;font-weight:800;letter-spacing:-.02em}
  .tag{display:inline-block;background:rgba(255,255,255,.2);padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;position:relative;z-index:1}
  .cover h1{font-size:34px;font-weight:800;letter-spacing:-.02em;margin:14px 0 8px;position:relative;z-index:1}
  .cover p{font-size:16px;color:rgba(255,255,255,.92);max-width:560px;position:relative;z-index:1}
  .body{padding:40px 48px}
  .intro{font-size:17px;color:var(--soft);border-left:4px solid var(--brand);padding:6px 0 6px 18px;margin-bottom:34px}
  .sec{margin-bottom:30px;page-break-inside:avoid}
  .sec-h{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .sec-ic{width:40px;height:40px;border-radius:11px;background:rgba(241,85,50,.12);color:var(--brand);display:grid;place-items:center;flex:none}
  .sec-h h2{font-size:20px;font-weight:800}
  .sec-b{padding-left:52px}
  .sec-b p{margin-bottom:10px;color:var(--soft)}
  .sec-b ul{margin:6px 0 6px 18px}
  .sec-b li{margin-bottom:7px;color:var(--soft)}
  .sec-b li::marker{color:var(--brand)}
  blockquote{background:var(--bg);border-radius:12px;padding:16px 18px;margin:10px 0;font-style:italic;color:var(--ink);border:1px solid var(--line)}
  .doc-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
  .doc-table th{text-align:left;padding:10px 12px;background:var(--bg);border-bottom:2px solid var(--line);font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut)}
  .doc-table td{padding:10px 12px;border-bottom:1px solid var(--line);color:var(--soft)}
  .foot{border-top:1px solid var(--line);padding:24px 48px;color:var(--mut);font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
  .foot b{color:var(--ink)}
  .print-hint{position:fixed;bottom:16px;right:16px;background:var(--brand);color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;box-shadow:0 8px 20px rgba(241,85,50,.3)}
  @media print{.print-hint{display:none}.page{box-shadow:none}}
</style></head>
<body>
  <div class="page">
    <div class="cover">
      <div class="brand">${mark}<b>OutBox</b></div>
      <span class="tag">${doc.tag} · Material do Consultor</span>
      <h1>${doc.nome}</h1>
      <p>${doc.desc}</p>
    </div>
    <div class="body">
      <p class="intro">${doc.intro}</p>
      ${secoes}
    </div>
    <div class="foot">
      <div>OutBox Group · Programa de Consultores<br><b>felipe@outboxgroup.com.br</b> · (47) 9.9659-7775</div>
      <div>www.outboxgroup.com.br<br>Santa Cruz do Rio Pardo · SP</div>
    </div>
  </div>
  <button class="print-hint" onclick="window.print()">Salvar como PDF / Imprimir</button>
</body></html>`;
  },

  baixarDoc(id) {
    const doc = this.DOCS().find(d => d.id === id); if (!doc) return;
    const blob = new Blob([this.buildDocHTML(doc)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `OutBox - ${doc.nome}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    UI.toast('Download iniciado', `"${doc.nome}" salvo. Abra para ler ou imprimir em PDF.`, 'ok');
  },

  abrirDoc(id) {
    const doc = this.DOCS().find(d => d.id === id); if (!doc) return;
    const blob = new Blob([this.buildDocHTML(doc)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },

  /* ====================== AJUDA / GUIA ====================== */
  view_ajuda() {
    const steps = [
      ['Complete seu perfil', 'Em "Editar Perfil", preencha todos os campos obrigatórios. É necessário para solicitar pagamentos.'],
      ['Cadastre seus clientes', 'Em "Meus Clientes", adicione cada cliente e marque se é pontual ou recorrente.'],
      ['Lance suas vendas', 'Em "Vendas & Comissão", clique em "Lançar venda". Sua comissão aparece no topo na hora.'],
      ['Acompanhe metas e prêmios', 'Em "Visão Geral" e "Premiações" veja o quanto falta para o próximo nível e o próximo prêmio.'],
      ['Solicite sua comissão', 'Quando tiver comissão disponível, clique em "Solicitar comissão". O admin recebe na hora e paga em até 3 dias úteis.']
    ];
    const faqs = [
      ['Como minha comissão é calculada?', 'A taxa é progressiva conforme o quanto você vende no mês: Bronze 10%, Prata 13% (R$5 mil), Ouro 16% (R$15 mil) e Black 20% (R$30 mil). Ela incide sobre o valor das vendas lançadas.'],
      ['Quando recebo o pagamento?', 'Em até 3 dias úteis após a solicitação, mediante a comprovação do serviço e dos valores que efetivamente entraram na conta da OutBox.'],
      ['Posso receber o prêmio em dinheiro?', 'Sim. Na aba Premiações, no prêmio conquistado, você tem dois botões: "Receber o produto" ou "Receber o dinheiro". Ao escolher, a solicitação vai para o administrador analisar e fazer o repasse.'],
      ['O que é cliente recorrente?', 'É o cliente que gera receita repetida (planos, manutenção). A comissão recorrente acompanha sua taxa de nível.'],
      ['Esqueci minha senha, e agora?', 'Na tela de login clique em "Esqueceu a senha?" e siga o passo a passo para redefinir pelo e-mail cadastrado.']
    ];
    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-2" style="margin-bottom:18px">
        <div class="card">
          <div class="card-head"><h3>Como usar o sistema</h3><span class="chip brand">5 passos</span></div>
          <div class="steps">${steps.map((s,i)=>`<div class="step-row"><span class="n">${i+1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div></div>`).join('')}</div>
        </div>
        <div>
          <div class="card" style="margin-bottom:18px">
            <div class="card-head"><h3>Precisa de ajuda?</h3></div>
            <p class="soft" style="font-size:14px;margin-bottom:16px">Fale direto com o time da OutBox Group. Respondemos em horário comercial.</p>
            <a class="btn green block" href="https://wa.me/5547996597775?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20sistema%20de%20consultores." target="_blank" rel="noopener" style="margin-bottom:10px">${UI.icon('whats',16)} Falar no WhatsApp</a>
            <a class="btn ghost block" href="mailto:felipe@outboxgroup.com.br">${UI.icon('mail',16)} felipe@outboxgroup.com.br</a>
          </div>
          <div class="card">
            <div class="card-head"><h3>Perguntas frequentes</h3></div>
            <div id="faq">${faqs.map((f,i)=>`<div class="faq-item"><button class="faq-q">${f[0]}<span class="arr">${UI.icon('chevron',18)}</span></button><div class="faq-a"><p>${f[1]}</p></div></div>`).join('')}</div>
          </div>
        </div>
      </div>`;
    v.querySelectorAll('.faq-q').forEach(q => q.onclick = () => q.closest('.faq-item').classList.toggle('open'));
  },

  /* ====================== PERFIL ====================== */
  view_perfil() {
    const u = this.u();
    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="card pad-lg" style="max-width:760px">
        <form id="form-perfil">
          <div class="avatar-up">
            <div class="pic" id="av-pic">${u.foto ? `<img src="${u.foto}"/>` : UI.icon('profile',32)}</div>
            <div>
              <label class="btn ghost sm" style="cursor:pointer">${UI.icon('edit',14)} Enviar foto<input type="file" id="p-foto" accept="image/*" hidden></label>
              <div class="hint" style="margin-top:6px">A foto é obrigatória. JPG ou PNG.</div>
            </div>
          </div>
          <input type="hidden" id="p-foto-data" value="${u.foto||''}">

          <div class="nav-label" style="padding-left:0">Dados pessoais</div>
          <div class="grid-2">
            <div class="field"><label>Nome <span class="req">*</span></label><input id="p-nome" value="${u.nome||''}"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Sobrenome <span class="req">*</span></label><input id="p-sobrenome" value="${u.sobrenome||''}"/><div class="err">Obrigatório</div></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Data de nascimento <span class="req">*</span></label><input type="date" id="p-nasc" value="${u.nascimento||''}"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>CPF ou CNPJ <span class="req">*</span></label><input id="p-doc" value="${u.doc||''}" placeholder="000.000.000-00"/><div class="err">CPF/CNPJ inválido</div></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Celular (WhatsApp) <span class="req">*</span></label><input id="p-cel" value="${u.celular||''}" placeholder="(00) 00000-0000"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Instagram <span class="req">*</span></label><input id="p-insta" value="${u.instagram||''}" placeholder="@seuperfil"/><div class="err">Obrigatório</div></div>
          </div>

          <div class="nav-label" style="padding-left:0">Endereço</div>
          <div class="grid-3">
            <div class="field"><label>CEP <span class="req">*</span></label><input id="p-cep" value="${u.cep||''}" placeholder="00000-000"/><div class="hint" id="cep-hint">Preenche o endereço automaticamente</div></div>
            <div class="field"><label>Número <span class="req">*</span></label><input id="p-num" value="${u.numero||''}"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Complemento</label><input id="p-comp" value="${u.complemento||''}"/></div>
          </div>
          <div class="field"><label>Logradouro <span class="req">*</span></label><input id="p-log" value="${u.logradouro||''}"/><div class="err">Obrigatório</div></div>
          <div class="grid-3">
            <div class="field"><label>Bairro <span class="req">*</span></label><input id="p-bairro" value="${u.bairro||''}"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Cidade <span class="req">*</span></label><input id="p-cidade" value="${u.cidade||''}"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>UF <span class="req">*</span></label><input id="p-uf" value="${u.uf||''}" maxlength="2"/><div class="err">Obrigatório</div></div>
          </div>

          <div class="nav-label" style="padding-left:0">Preferências</div>
          <div class="field"><label>Moeda padrão</label>
            <select id="p-moeda">${this.moedaOptions(u.moeda || 'BRL')}</select>
            <div class="hint">Usada nos valores e totais (vendas, comissão, funil). Escolha Real, Dólar ou Euro para vender no exterior.</div>
          </div>

          <div class="nav-label" style="padding-left:0">Conta e segurança</div>
          <div class="field"><label>E-mail <span class="req">*</span></label>
            <div class="row" style="gap:8px"><input id="p-email" value="${u.email||''}" class="grow" readonly/><button type="button" class="btn ghost" id="p-email-btn">Trocar</button></div>
            <div class="hint">Para alterar o e-mail clique em "Trocar" e confirme com a senha.</div>
          </div>
          <div class="field"><label>Senha</label>
            <div class="row" style="gap:8px"><input value="••••••••" disabled class="grow"/><button type="button" class="btn ghost" id="p-pwd-btn">${UI.icon('lock',14)} Alterar senha</button></div>
          </div>
          <div class="field">
            <div class="row between alc" style="padding:14px;border:1px solid var(--border);border-radius:12px">
              <div><b style="font-size:14px">${UI.icon('shield',14)} Autenticação de 2 fatores</b><div class="hint" style="margin-top:2px">Pede um código extra a cada login</div></div>
              <label class="seg" style="padding:3px"><button type="button" class="${u.twoFA?'':'on'}" id="fa-off">Off</button><button type="button" class="${u.twoFA?'on':''}" id="fa-on">On</button></label>
            </div>
          </div>

          <div class="notice" style="margin:16px 0">${UI.icon('info',16)}<div>Todos os campos marcados com <span class="req">*</span> são obrigatórios para salvar.</div></div>
          <button class="btn brand block" type="submit">Salvar perfil</button>
        </form>
      </div>`;

    this.bindPerfil(u);
  },

  bindPerfil(u) {
    let twoFA = u.twoFA;
    const fields = {
      doc: document.getElementById('p-doc'), cel: document.getElementById('p-cel'), cep: document.getElementById('p-cep')
    };
    fields.doc.oninput = e => e.target.value = UI.maskDoc(e.target.value);
    fields.cel.oninput = e => e.target.value = UI.maskPhone(e.target.value);
    fields.cep.oninput = e => e.target.value = UI.maskCEP(e.target.value);
    fields.cep.onblur = () => this.buscarCEP(fields.cep.value);

    // foto
    document.getElementById('p-foto').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { document.getElementById('p-foto-data').value = r.result; document.getElementById('av-pic').innerHTML = `<img src="${r.result}"/>`; };
      r.readAsDataURL(f);
    };

    // 2FA
    document.getElementById('fa-on').onclick = () => { twoFA = true; this.toggleSeg('fa-on', 'fa-off'); UI.toast('2FA ativado', 'Você receberá um código a cada login', 'ok'); };
    document.getElementById('fa-off').onclick = () => { twoFA = false; this.toggleSeg('fa-off', 'fa-on'); };

    // trocar email
    document.getElementById('p-email-btn').onclick = () => this.trocarEmail(u);
    // alterar senha
    document.getElementById('p-pwd-btn').onclick = () => this.alterarSenha(u);

    document.getElementById('form-perfil').onsubmit = (e) => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      const req = [
        ['p-foto-data', v => !!v], ['p-nome', v => !!v], ['p-sobrenome', v => !!v],
        ['p-nasc', v => !!v], ['p-doc', v => UI.validCPFouCNPJ(v)], ['p-cel', v => !!v],
        ['p-insta', v => !!v], ['p-cep', v => !!v], ['p-num', v => !!v], ['p-log', v => !!v],
        ['p-bairro', v => !!v], ['p-cidade', v => !!v], ['p-uf', v => !!v], ['p-email', v => UI.validEmail(v)]
      ];
      let ok = true, firstBad = null;
      req.forEach(([id, test]) => {
        const el = document.getElementById(id);
        const field = el.closest ? el.closest('.field') : null;
        const good = test(val(id) || el.value);
        if (field) field.classList.toggle('has-error', !good);
        if (!good && ok) { ok = false; firstBad = id; }
      });
      if (!document.getElementById('p-foto-data').value) { ok = false; if (!firstBad) firstBad = 'p-foto'; }
      if (!ok) { UI.toast('Campos obrigatórios', 'Preencha todos os campos marcados', 'err'); return; }

      Object.assign(u, {
        foto: document.getElementById('p-foto-data').value, nome: val('p-nome'), sobrenome: val('p-sobrenome'),
        nascimento: val('p-nasc'), doc: val('p-doc'), celular: val('p-cel'), instagram: val('p-insta'),
        cep: val('p-cep'), numero: val('p-num'), complemento: val('p-comp'), logradouro: val('p-log'),
        bairro: val('p-bairro'), cidade: val('p-cidade'), uf: val('p-uf').toUpperCase(), email: val('p-email'), twoFA,
        moeda: document.getElementById('p-moeda').value
      });
      OB.upsertUser(u);
      UI.toast('Perfil salvo!', 'Seus dados foram atualizados', 'ok');
      App.refreshSidebarUser();
      App.refreshCommission(true);
    };
  },

  toggleSeg(on, off) { document.getElementById(on).classList.add('on'); document.getElementById(off).classList.remove('on'); },

  buscarCEP(cep) {
    const d = cep.replace(/\D/g, ''); if (d.length !== 8) return;
    const hint = document.getElementById('cep-hint');
    hint.textContent = 'Buscando endereço...';
    fetch(`https://viacep.com.br/ws/${d}/json/`).then(r => r.json()).then(j => {
      if (j.erro) { hint.textContent = 'CEP não encontrado'; return; }
      document.getElementById('p-log').value = j.logradouro || '';
      document.getElementById('p-bairro').value = j.bairro || '';
      document.getElementById('p-cidade').value = j.localidade || '';
      document.getElementById('p-uf').value = j.uf || '';
      hint.textContent = 'Endereço preenchido ✓';
      document.getElementById('p-num').focus();
    }).catch(() => { hint.textContent = 'Não foi possível buscar o CEP'; });
  },

  trocarEmail(u) {
    UI.modal({
      title: 'Trocar e-mail',
      body: `<div class="field"><label>Novo e-mail</label><input id="te-email" placeholder="novo@email.com"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="te-go">Confirmar</button>`
    });
    document.getElementById('te-go').onclick = async () => {
      const email = document.getElementById('te-email').value.trim();
      if (!UI.validEmail(email)) return UI.toast('E-mail inválido', '', 'err');
      const { error } = await SB.auth.updateUser({ email });
      if (error) return UI.toast('Erro', error.message, 'err');
      u.email = email; OB.upsertUser(u);
      document.getElementById('p-email').value = email;
      UI.closeModal();
      UI.toast('E-mail atualizado', 'Pode ser necessário confirmar pelo novo e-mail', 'ok');
      App.refreshSidebarUser();
    };
  },

  alterarSenha(u) {
    UI.modal({
      title: 'Alterar senha',
      body: `<div class="field"><label>Nova senha</label><input type="password" id="ap-nova" placeholder="Mínimo 6 caracteres"/></div>
        <div class="field"><label>Confirmar nova senha</label><input type="password" id="ap-conf"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="ap-go">Salvar senha</button>`
    });
    document.getElementById('ap-go').onclick = async () => {
      const nova = document.getElementById('ap-nova').value, conf = document.getElementById('ap-conf').value;
      if (nova.length < 6) return UI.toast('Senha curta', 'Use ao menos 6 caracteres', 'err');
      if (nova !== conf) return UI.toast('Senhas diferentes', '', 'err');
      const { error } = await SB.auth.updateUser({ password: nova });
      if (error) return UI.toast('Erro', error.message, 'err');
      UI.closeModal(); UI.toast('Senha alterada', '', 'ok');
    };
  },

  /* ====================== helpers ====================== */
  kpi(icon, val, lbl, delta) {
    return `<div class="card kpi"><div class="ic">${UI.icon(icon,20)}</div>
      <div class="k-val">${val}</div><div class="k-lbl">${lbl}</div>
      ${delta ? `<div class="k-delta up">${delta}</div>` : ''}</div>`;
  },
  empty(icon, title, msg) {
    return `<div class="empty"><div class="ic">${UI.icon(icon,26)}</div><b style="display:block;font-size:16px;color:var(--text)">${title}</b><p style="max-width:340px;margin:6px auto 0">${msg}</p></div>`;
  },
  emptyMini(msg) { return `<div class="empty" style="padding:32px"><p>${msg}</p></div>`; },
  last6Labels() {
    const m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const out = []; const n = new Date();
    for (let i = 5; i >= 0; i--) { const d = new Date(n.getFullYear(), n.getMonth() - i, 1); out.push(m[d.getMonth()]); }
    return out;
  },
  last6Values(vendas) {
    const n = new Date(); const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
      const tot = vendas.filter(s => { const sd = new Date(s.data); return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth(); }).reduce((t, s) => t + s.valor, 0);
      out.push(tot);
    }
    return out;
  }
};
