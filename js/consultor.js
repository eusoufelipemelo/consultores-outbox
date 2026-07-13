/* ============================================================
   OutBox Consultores — Painel do Consultor (consultor.js)
   ============================================================ */
const Consultor = {
  HOME: 'overview',
  NAV: [
    { id: 'overview',   label: 'Visão Geral',      icon: 'overview', home: true },
    { id: 'projetos',   label: 'Briefings',        icon: 'briefcase' },
    { id: 'contratos',  label: 'Contratos',        icon: 'contract' },
    { id: 'criativos',  label: 'Criativos',        icon: 'creative' },
    { id: 'documentos', label: 'Documentos',       icon: 'docs' },
    { id: 'ajuda',      label: 'Dúvidas & Guia',   icon: 'help' },
    { id: 'ebooks',     label: 'E-Books',          icon: 'book' },
    { id: 'funil',      label: 'Funil de Vendas',  icon: 'kanban' },
    { id: 'clientes',   label: 'Meus Clientes',    icon: 'clients' },
    { id: 'orcamentos', label: 'Orçamentos',       icon: 'quote' },
    { id: 'portfolio',  label: 'Portfólio',        icon: 'gallery' },
    { id: 'premiacoes', label: 'Premiações',       icon: 'prize' },
    { id: 'ranking',    label: 'Ranking de Consultores', icon: 'ranking' },
    { id: 'treinamentos', label: 'Treinamentos',   icon: 'academy' },
    { id: 'comissao',   label: 'Vendas & Comissão',icon: 'money' }
  ],

  titles: {
    overview:   ['Visão Geral', 'Acompanhe suas metas em tempo real'],
    funil:      ['Funil de Vendas', 'Arraste seus contatos entre as etapas'],
    clientes:   ['Meus Clientes', 'Cadastre e gerencie seus clientes'],
    orcamentos: ['Orçamentos', 'Crie propostas e acompanhe os aceites'],
    comissao:   ['Vendas & Comissão', 'Lance vendas, acompanhe propostas e solicite comissão'],
    projetos:   ['Briefings', 'Envie o briefing e acompanhe a entrega de cada serviço vendido'],
    portfolio:  ['Portfólio de entregas', 'Projetos já entregues pela OutBox para você usar como prova social'],
    premiacoes: ['Premiações', 'Quão perto você está do próximo prêmio'],
    ranking:    ['Ranking de Consultores', 'Os 10 primeiros em pontos (vendas + treinamentos)'],
    documentos: ['Documentos', 'Materiais e técnicas de venda SPIN Selling'],
    ebooks:     ['E-Books', 'Materiais exclusivos para baixar, estudar e compartilhar conhecimento'],
    treinamentos: ['Treinamentos', 'Trilha de como vender os produtos da OutBox'],
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
        <span class="mut">${prox ? 'Meta ' + prox.nome + ': ' + OB.fmt(prox.meta) : 'Nível máximo atingido'}</span>
      </div>
      <div class="bar"><i data-w="${pct}"></i></div>
      <div style="margin-top:12px;font-size:13px" class="soft">
        ${prox ? `Faltam <b style="color:var(--brand)">${OB.fmt(falta)}</b> para subir de <b>${nivel.nome}</b> (${(nivel.rate*100)|0}%) para <b>${prox.nome}</b> (${(prox.rate*100)|0}%)` : `Você está no nível <b>${nivel.nome}</b> com <b>${(nivel.rate*100)|0}%</b> na faixa mais alta. Excelente!`}
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
      <div class="row between alc" style="margin-bottom:18px;flex-wrap:wrap;gap:12px">
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
        <th>Cliente</th><th>Contato</th><th>Porte</th><th>Telefone</th><th>Tipo</th><th></th></tr></thead><tbody>
        ${rows.map(c => { const pt = OB.PORTES.find(p => p.id === c.porte); return `<tr>
          <td><span class="strong">${c.nome}</span><br><span class="mut" style="font-size:12px">${c.cidade ? c.cidade + '/' + c.uf : ''}</span></td>
          <td>${c.contato || '-'}<br><span class="mut" style="font-size:12px">${c.email || ''}</span></td>
          <td>${pt ? `<span class="chip gray">${pt.nome}</span>` : '-'}</td>
          <td>${c.telefone || '-'}</td>
          <td><span class="chip ${c.tipo==='recorrente'?'green':'gray'}">${c.tipo==='recorrente'?('Recorrente'+(c.recorrenciaMeses?' · '+c.recorrenciaMeses+'m':'')):'Pontual'}</span></td>
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
        <div class="field"><label>Tipo de cliente <span class="req">*</span></label>
          ${UI.segp('c-tipo', [{ v: 'pontual', label: 'Pontual', sub: 'compra única' }, { v: 'recorrente', label: 'Recorrente', sub: 'comissão recorrente' }], edit ? (c.tipo || 'pontual') : 'pontual')}
        </div>
        <div class="field" id="c-rec-wrap"${edit && c.tipo === 'recorrente' ? '' : ' hidden'}><label>Duração da recorrência <span class="req">*</span></label>
          ${UI.segp('c-rec', [{ v: '3', label: '3 meses' }, { v: '6', label: '6 meses' }, { v: '12', label: '12 meses' }, { v: '24', label: '24 meses' }], String((edit && c.recorrenciaMeses) || 12))}
          <div class="hint">Por quantos meses este cliente gera comissão recorrente.</div>
        </div>
        <div class="field"><label>Porte da empresa <span class="req">*</span></label>
          <select id="c-porte">${OB.PORTES.map(p => `<option value="${p.id}" ${edit ? (c.porte === p.id ? 'selected' : '') : (p.id === 'pequena' ? 'selected' : '')}>${p.nome}</option>`).join('')}</select>
          <div class="hint" id="c-porte-hint">${(OB.PORTES.find(p => p.id === (edit ? c.porte : 'pequena')) || OB.PORTES[0]).faixa}</div>
          <div class="hint">Define o preço de tabela aplicado nos orçamentos deste cliente.</div>
        </div>
        <div class="field"><label>Observações</label><textarea id="c-obs">${g('obs')}</textarea></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="c-save">${edit ? 'Salvar' : 'Cadastrar'}</button>`
    });
    document.getElementById('c-tel').oninput = e => e.target.value = UI.maskPhone(e.target.value);
    document.getElementById('c-doc').oninput = e => e.target.value = UI.maskDoc(e.target.value);
    const cep = document.getElementById('c-cep');
    cep.oninput = e => e.target.value = UI.maskCEP(e.target.value);
    cep.onblur = () => this.buscarCEPCliente(cep.value);
    const cPorte = document.getElementById('c-porte');
    cPorte.onchange = () => { document.getElementById('c-porte-hint').textContent = (OB.PORTES.find(p => p.id === cPorte.value) || OB.PORTES[0]).faixa; };
    // recorrência: mostra a duração só quando o cliente é recorrente
    const cTipo = document.getElementById('c-tipo');
    cTipo.addEventListener('segpchange', e => { document.getElementById('c-rec-wrap').hidden = e.detail !== 'recorrente'; });

    document.getElementById('c-save').onclick = () => {
      const val = id => document.getElementById(id).value.trim();
      const req = [
        ['c-nome', v => !!v], ['c-contato', v => !!v], ['c-doc', v => UI.validCPFouCNPJ(v)],
        ['c-tel', v => !!v], ['c-email', v => UI.validEmail(v)], ['c-cep', v => !!v],
        ['c-num', v => !!v], ['c-log', v => !!v], ['c-bairro', v => !!v],
        ['c-cidade', v => !!v], ['c-uf', v => !!v]
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
        cidade: val('c-cidade'), uf: val('c-uf').toUpperCase(), tipo: document.getElementById('c-tipo').dataset.value,
        recorrenciaMeses: document.getElementById('c-tipo').dataset.value === 'recorrente' ? (parseInt(document.getElementById('c-rec').dataset.value, 10) || 12) : null,
        porte: document.getElementById('c-porte').value, obs: val('c-obs')
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
          <button class="btn green" id="req-com" ${com.valor < OB.saqueMinimo() ? 'disabled' : ''} title="${com.valor < OB.saqueMinimo() ? 'Valor mínimo para saque é de ' + OB.fmt(OB.saqueMinimo()) : ''}">${UI.icon('receipt',16)} Solicitar comissão (${OB.fmt(com.valor)})</button>
        </div>
      </div>
      ${com.valor < OB.saqueMinimo() && com.valor > 0 ? `<div class="hint" style="margin:-8px 0 14px;text-align:right">Valor mínimo para saque é de <b>${OB.fmt(OB.saqueMinimo())}</b></div>` : ''}

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
            <td>${OB.produtosNomes(s)}</td>
            <td><span class="strong">${OB.money(s.valor, s.moeda)}</span>${temDesc?`<br><span class="mut" style="font-size:11px">de ${OB.money(s.valorBruto, s.moeda)} · -${s.descontoTipo==='percent'?s.descontoValor+'%':OB.money(s.descontoValor, s.moeda)}</span>`:''}</td>
            <td><span class="chip ${pr.chip}">${pr.nome}</span></td>
            <td>${s.statusProposta==='aprovada' ? (s.statusPagamento==='recebido' ? `<span class="chip ${st[0]}">${st[1]}</span>` : `<span class="chip warn" title="Aguardando o admin confirmar o pagamento do cliente">Em conferência</span>`) : '<span class="mut" style="font-size:12px">—</span>'}</td>
            <td class="row" style="gap:6px;justify-content:flex-end">
              ${s.statusProposta!=='aprovada'?`<button class="iconbtn" data-aprovar="${s.id}" title="Marcar aprovada" style="color:#1fa855">${UI.icon('check',16)}</button>`:''}
              ${s.statusProposta==='aguardando'?`<button class="iconbtn" data-recusar="${s.id}" title="Marcar recusada">${UI.icon('x',16)}</button>`:''}
              <button class="iconbtn" data-edit="${s.id}" title="Editar / desconto" ${s.statusComissao!=='disponivel'?'disabled':''}>${UI.icon('edit',16)}</button>
              <button class="iconbtn" data-del="${s.id}" title="Excluir venda">${UI.icon('trash',16)}</button>
            </td></tr>`;
        }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-aprovar]').forEach(b => b.onclick = () => this.setStatusProposta(b.dataset.aprovar, 'aprovada'));
      el.querySelectorAll('[data-recusar]').forEach(b => b.onclick = () => this.setStatusProposta(b.dataset.recusar, 'recusada'));
      el.querySelectorAll('[data-edit]').forEach(b => { if (!b.disabled) b.onclick = () => this.editarVenda(OB.salesOf(u.id).find(x => x.id === b.dataset.edit)); });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => this.excluirVenda(OB.salesOf(u.id).find(x => x.id === b.dataset.del)));
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
    this.autoContrato(s); // formalizou a venda -> gera o contrato
    UI.toast('Proposta atualizada', OB.STATUS_PROPOSTA[status].nome, 'ok');
    App.refreshCommission(true);
    this.render('comissao');
  },
  /* gera o contrato automaticamente ao formalizar a venda (aprovada, sem contrato ainda) */
  autoContrato(s) {
    if (s && s.statusProposta === 'aprovada' && !OB.contratoDaVenda(s.id)) { try { this.gerarContrato(s); } catch (e) {} }
  },

  /* editar apenas desconto + forma de pagamento (o valor de tabela é fixo) */
  editarVenda(s) {
    if (!s) return;
    const moeda = s.moeda || 'BRL';
    const valorBase = s.valorBruto || s.valor; // valor de tabela travado
    const fmtJuros = j => (Number(j) || 0).toFixed(2).replace('.', ',') + '%';
    UI.modal({
      title: 'Editar venda',
      sub: 'O valor dos serviços é fixo pela tabela. Ajuste desconto e pagamento.',
      body: `
        <div class="notice" style="margin-bottom:14px"><div class="row between alc grow"><span>Valor de tabela ${UI.icon('lock',13)}</span><b style="font-size:16px">${OB.money(valorBase, moeda)}</b></div></div>
        <div class="field"><label>Desconto comercial</label>
          <select id="ed-desc"></select>
          <div class="hint" id="ed-desc-hint"></div></div>
        <div class="field"><label>Forma de pagamento</label>
          <select id="ed-pgto">${OB.FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${s.formaPagamento === f.id ? 'selected' : ''}>${f.nome}</option>`).join('')}</select>
          <div class="hint" id="ed-pgto-hint">${(OB.FORMAS_PAGAMENTO.find(f => f.id === (s.formaPagamento || 'pix')) || {}).detalhe || ''}</div></div>
        <label class="pix-check" id="ed-pix-wrap"><input type="checkbox" id="ed-pixdesc" ${s.pixDesconto ? 'checked' : ''}/> <span>Conceder <b>5% de desconto</b> no PIX à vista</span></label>
        <div class="field" id="ed-parc-wrap" hidden><label>Parcelas no cartão</label>
          <select id="ed-parcelas">${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}" ${s.parcelas === n ? 'selected' : ''}>${n}x</option>`).join('')}</select></div>
        <div class="pay-summary" id="ed-paybox"></div>
        <div class="field" style="margin-top:14px"><label>Link de pagamento <span style="font-weight:400;color:var(--text-mut)">(opcional)</span></label>
          <input id="ed-link" type="url" value="${s.linkPagamento || ''}" placeholder="https://... cole o link da cobrança"/>
          <div class="hint">Gera o botão verde "Ir para o pagamento" no orçamento deste cliente.</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="ed-save">Salvar</button>`
    });
    const edDesc = document.getElementById('ed-desc');
    const edPgto = document.getElementById('ed-pgto');
    const edPixWrap = document.getElementById('ed-pix-wrap');
    const edPixDesc = document.getElementById('ed-pixdesc');
    const edParcWrap = document.getElementById('ed-parc-wrap');
    const edParcelas = document.getElementById('ed-parcelas');
    const payBox = document.getElementById('ed-paybox');
    const perms = OB.descontosPermitidos(valorBase);
    const descAtual = (s.descontoTipo === 'percent' ? s.descontoValor : 0) || 0;
    edDesc.innerHTML = perms.map(p => `<option value="${p}" ${p === descAtual ? 'selected' : ''}>${p ? p + '%' : 'Sem desconto'}</option>`).join('');
    document.getElementById('ed-desc-hint').innerHTML = `Desconto de até <b>${perms[perms.length - 1]}%</b> para este valor de orçamento.`;
    const recalcular = () => {
      const desc = parseInt(edDesc.value, 10) || 0;
      const negociado = Math.round(valorBase * (1 - desc / 100));
      const forma = edPgto.value;
      edParcWrap.hidden = forma !== 'cartao';
      edPixWrap.style.display = forma === 'pix' ? '' : 'none';
      if (forma !== 'pix') edPixDesc.checked = false;
      const calc = OB.calcPagamento(negociado, forma, { pixDesconto: edPixDesc.checked, parcelas: parseInt(edParcelas.value, 10) || 1 });
      let linhas = `<div class="row"><span>Valor de tabela</span><b>${OB.money(valorBase, moeda)}</b></div>`;
      if (desc) linhas += `<div class="row"><span>Desconto comercial (${desc}%)</span><span class="neg">- ${OB.money(valorBase - negociado, moeda)}</span></div>`;
      if (forma === 'pix' && calc.pixDesconto) linhas += `<div class="row"><span>Desconto PIX à vista (5%)</span><span class="neg">- ${OB.money(negociado - calc.valorServico, moeda)}</span></div>`;
      if (forma === 'cartao') {
        linhas += `<div class="row"><span>Juros do cartão · ${calc.parcelas}x (${fmtJuros(calc.jurosPct)})</span><span class="pos">+ ${OB.money(calc.valorCliente - negociado, moeda)}</span></div>`;
        linhas += `<div class="row total"><span>Total no cartão</span><b>${OB.money(calc.valorCliente, moeda)}</b></div>`;
        linhas += `<div class="row parc"><span>${calc.parcelas}x de</span><b>${OB.money(calc.valorParcela, moeda)}</b></div>`;
      } else {
        linhas += `<div class="row total"><span>${forma === 'pix' ? 'À vista no PIX' : 'À vista no boleto'}</span><b>${OB.money(calc.valorCliente, moeda)}</b></div>`;
      }
      linhas += `<div class="pay-note">Comissão sobre ${OB.money(calc.valorServico, moeda)} (valor do serviço).</div>`;
      payBox.innerHTML = linhas;
      payBox._calc = calc; payBox._desc = desc;
    };
    edDesc.onchange = recalcular;
    edPgto.onchange = () => { document.getElementById('ed-pgto-hint').textContent = (OB.FORMAS_PAGAMENTO.find(f => f.id === edPgto.value) || {}).detalhe || ''; recalcular(); };
    edParcelas.onchange = recalcular;
    edPixDesc.onchange = recalcular;
    recalcular();
    document.getElementById('ed-save').onclick = () => {
      const calc = payBox._calc; const desc = payBox._desc || 0;
      Object.assign(s, {
        valorBruto: valorBase, descontoTipo: desc ? 'percent' : null, descontoValor: desc,
        valor: calc.valorServico, valorCliente: calc.valorCliente,
        formaPagamento: calc.forma, parcelas: calc.parcelas, pixDesconto: calc.pixDesconto,
        linkPagamento: (document.getElementById('ed-link').value || '').trim()
      });
      OB.updateSale(s);
      UI.closeModal(); UI.toast('Venda atualizada', '', 'ok');
      App.refreshCommission(true);
      this.render(App.current === 'orcamentos' ? 'orcamentos' : 'comissao');
    };
  },

  /* excluir venda (sempre permitido; se já está em solicitação, remove da request) */
  excluirVenda(s) {
    if (!s) return;
    if (s.statusComissao === 'paga') {
      return UI.toast('Não é possível excluir', 'A comissão desta venda já foi paga. Solicite ao administrador.', 'err');
    }
    const cli = OB.clientById(s.clientId);
    const u = this.u();
    const emReq = OB.requestsOf(u.id).find(r => r.tipo === 'comissao' && r.status !== 'recusado' && Array.isArray(r.vendaIds) && r.vendaIds.includes(s.id));
    const aviso = emReq
      ? `<div class="notice" style="margin-bottom:12px">${UI.icon('info',16)}<div>Esta venda está em uma <b>solicitação de comissão em aberto</b>. Ao excluir, ela é <b>removida da solicitação</b> e o valor recalculado. Se for a única venda da solicitação, ela é <b>cancelada</b>.</div></div>`
      : '';
    UI.modal({
      title: 'Excluir venda',
      sub: cli ? cli.nome : 'cliente',
      body: `${aviso}<p class="soft">Remover esta venda de <b>${OB.money(s.valor, s.moeda)}</b>? Esta ação não pode ser desfeita.</p>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="del-go">Excluir venda</button>`
    });
    document.getElementById('del-go').onclick = () => {
      // remove a venda da request, se houver
      if (emReq) {
        emReq.vendaIds = (emReq.vendaIds || []).filter(id => id !== s.id);
        if (emReq.vendaIds.length === 0) {
          // sem vendas — cancela a solicitação
          emReq.status = 'recusado';
          emReq.detalhe = (emReq.detalhe || '') + ' · cancelada (venda excluída pelo consultor)';
        } else {
          // recalcula o valor da solicitação
          const restantes = OB.sales().filter(x => emReq.vendaIds.includes(x.id));
          const baseRestante = restantes.reduce((t, x) => t + x.valor, 0);
          emReq.valor = Math.round(baseRestante * (emReq.valor / (s.valor + baseRestante)));
          emReq.detalhe = `${restantes.length} venda(s) restante(s) · recalculado após exclusão`;
        }
        OB.updateRequest(emReq);
      }
      OB.removeContratoDaVenda(s.id); // remove o contrato gerado por esta venda
      OB.removeSale(s.id);
      UI.closeModal();
      UI.toast('Venda excluída', emReq ? 'Solicitação ajustada automaticamente' : '', 'ok');
      App.refreshCommission(true);
      this.render('comissao');
    };
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
        <div class="field"><label>Serviços <span class="req">*</span></label>
          <div class="svc-multi" id="s-prods">
            ${OB.PRODUTOS.map(p => `<label class="svc-opt"><input type="checkbox" value="${p.id}"><span>${p.nome}</span></label>`).join('')}
          </div>
          <div class="hint">Marque um ou mais serviços. O preço de tabela soma todos automaticamente.</div>
          <div class="err">Selecione ao menos um serviço</div></div>
        <div class="field"><label>Porte da empresa</label>
          <select id="s-porte">${OB.PORTES.map(pt => `<option value="${pt.id}">${pt.nome}</option>`).join('')}</select>
          <div class="hint">Define o preço de tabela. Inicia com o porte do cliente.</div></div>
        <div id="s-treino-aviso"></div>
        <div class="field"><label>Moeda</label>
          <select id="s-moeda">${this.moedaOptions(OB.moedaAtual())}</select></div>
        <div class="field"><label>Desconto comercial</label>
          <select id="s-desc"></select>
          <div class="hint" id="s-desc-hint">O valor dos serviços é fixo pela tabela da OutBox. Você escolhe apenas o desconto permitido.</div></div>
        <div class="field"><label>Forma de pagamento</label>
          <select id="s-pgto">${OB.FORMAS_PAGAMENTO.map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}</select>
          <div class="hint" id="s-pgto-hint">${OB.FORMAS_PAGAMENTO[0].detalhe}</div></div>
        <label class="pix-check" id="s-pix-wrap"><input type="checkbox" id="s-pixdesc"/> <span>Conceder <b>5% de desconto</b> no PIX à vista</span></label>
        <div class="field" id="s-parc-wrap" hidden><label>Parcelas no cartão</label>
          <select id="s-parcelas">${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}">${n}x</option>`).join('')}</select></div>
        <div class="pay-summary" id="s-paybox"></div>
        <div class="field"><label>Link de pagamento <span style="font-weight:400;color:var(--text-mut)">(opcional)</span></label>
          <input id="s-link" type="url" placeholder="https://... cole o link da cobrança"/>
          <div class="hint">Vira o botão verde "Ir para o pagamento" no orçamento. Pode colar depois, editando a proposta.</div></div>
        <div class="field"><label>Status da proposta</label>
          <select id="s-status">
            <option value="aprovada" ${!orcamento?'selected':''}>Aprovada (venda fechada)</option>
            <option value="aguardando" ${orcamento?'selected':''}>Aguardando aceite do cliente</option>
          </select>
          <div class="hint">Só propostas <b>aprovadas</b> contam para sua comissão.</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="s-save">${orcamento ? 'Criar orçamento' : 'Lançar'}</button>`
    });
    const sMoeda = document.getElementById('s-moeda');
    const sCli = document.getElementById('s-cli');
    const sPorte = document.getElementById('s-porte');
    const sDesc = document.getElementById('s-desc');
    const sPgto = document.getElementById('s-pgto');
    const sPixWrap = document.getElementById('s-pix-wrap');
    const sPixDesc = document.getElementById('s-pixdesc');
    const sParcWrap = document.getElementById('s-parc-wrap');
    const sParcelas = document.getElementById('s-parcelas');
    const payBox = document.getElementById('s-paybox');
    // serviços selecionados (múltipla escolha)
    const prodsSel = () => [...document.querySelectorAll('#s-prods input:checked')].map(i => i.value);
    // sincroniza o porte com o cliente selecionado
    const sincPorteComCliente = () => {
      const cliente = OB.clientById(sCli.value);
      sPorte.value = cliente ? (cliente.porte || 'pequena') : 'pequena';
    };
    sincPorteComCliente();
    const fmtJuros = j => (Number(j) || 0).toFixed(2).replace('.', ',') + '%';
    // preenche as opções de desconto conforme a faixa do valor de tabela
    const fillDescontos = (valorBase) => {
      const perms = OB.descontosPermitidos(valorBase);
      const cur = parseInt(sDesc.value, 10) || 0;
      sDesc.innerHTML = perms.map(p => `<option value="${p}">${p ? p + '%' : 'Sem desconto'}</option>`).join('');
      sDesc.value = perms.includes(cur) ? String(cur) : '0';
      const teto = perms[perms.length - 1];
      document.getElementById('s-desc-hint').innerHTML = `Valor fixo pela tabela da OutBox. ${valorBase >= OB.DESC_LIMIAR ? `Orçamento a partir de ${OB.money(OB.DESC_LIMIAR, sMoeda.value)}: desconto de até <b>${teto}%</b>.` : `Orçamento até ${OB.money(OB.DESC_LIMIAR - 1, sMoeda.value)}: desconto de até <b>${teto}%</b>.`}`;
    };
    // recalcula tudo: valor de tabela -> desconto comercial -> forma de pagamento
    const recalcular = () => {
      const porte = sPorte.value;
      const m = sMoeda.value;
      const sel = prodsSel();
      const valorBase = sel.reduce((t, id) => t + (OB.precoTabela(id, porte) || 0), 0);
      fillDescontos(valorBase);
      const desc = parseInt(sDesc.value, 10) || 0;
      const negociado = Math.round(valorBase * (1 - desc / 100));
      const forma = sPgto.value;
      sParcWrap.hidden = forma !== 'cartao';
      sPixWrap.style.display = forma === 'pix' ? '' : 'none';
      if (forma !== 'pix') sPixDesc.checked = false;
      const calc = OB.calcPagamento(negociado, forma, { pixDesconto: sPixDesc.checked, parcelas: parseInt(sParcelas.value, 10) || 1 });
      if (!valorBase) { payBox.innerHTML = `<div class="pay-empty">Marque os serviços para calcular o valor.</div>`; }
      else {
        let linhas = `<div class="row"><span>Valor de tabela${sel.length > 1 ? ` · ${sel.length} serviços` : ''}</span><b>${OB.money(valorBase, m)}</b></div>`;
        if (desc) linhas += `<div class="row"><span>Desconto comercial (${desc}%)</span><span class="neg">- ${OB.money(valorBase - negociado, m)}</span></div>`;
        if (forma === 'pix' && calc.pixDesconto) linhas += `<div class="row"><span>Desconto PIX à vista (5%)</span><span class="neg">- ${OB.money(negociado - calc.valorServico, m)}</span></div>`;
        if (forma === 'cartao') {
          linhas += `<div class="row"><span>Juros do cartão · ${calc.parcelas}x (${fmtJuros(calc.jurosPct)})</span><span class="pos">+ ${OB.money(calc.valorCliente - negociado, m)}</span></div>`;
          linhas += `<div class="row total"><span>Total no cartão</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
          linhas += `<div class="row parc"><span>${calc.parcelas}x de</span><b>${OB.money(calc.valorParcela, m)}</b></div>`;
        } else {
          linhas += `<div class="row total"><span>${forma === 'pix' ? 'À vista no PIX' : 'À vista no boleto'}</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
        }
        linhas += `<div class="pay-note">Sua comissão é calculada sobre ${OB.money(calc.valorServico, m)} (valor do serviço, sem juros).</div>`;
        payBox.innerHTML = linhas;
      }
      payBox._valorBase = valorBase; payBox._negociado = negociado; payBox._calc = calc;
    };
    // lembrete de treinamento: primeiro serviço marcado cujo treino ainda não foi concluído
    const updateTreinoAviso = () => {
      const box = document.getElementById('s-treino-aviso'); if (!box) return;
      const pend = prodsSel().map(id => TREINOS.treinoDoProduto(id)).find(t => t && t.disponivel && !OB.treinoProgress(t.id).concluido);
      if (pend) {
        box.innerHTML = `<div class="notice" style="margin-bottom:16px;align-items:center">${UI.icon('academy',16)}<div class="grow" style="font-size:12.5px">Você ainda não concluiu o treinamento de <b>${pend.nome}</b>. Treinar antes ajuda a vender melhor.</div><button type="button" class="btn ghost" id="s-ir-treino" style="white-space:nowrap;padding:7px 12px;font-size:12px">Treinar</button></div>`;
        const b = document.getElementById('s-ir-treino');
        if (b) b.onclick = () => { UI.closeModal(); App.go('treinamentos'); setTimeout(() => this.treinoIntro(pend.id), 60); };
      } else { box.innerHTML = ''; }
    };
    document.querySelectorAll('#s-prods input').forEach(cb => cb.onchange = () => { recalcular(); updateTreinoAviso(); });
    sCli.onchange = () => { sincPorteComCliente(); recalcular(); };
    sPorte.onchange = recalcular;
    sDesc.onchange = recalcular;
    sPgto.onchange = () => { document.getElementById('s-pgto-hint').textContent = (OB.FORMAS_PAGAMENTO.find(f => f.id === sPgto.value) || {}).detalhe || ''; recalcular(); };
    sParcelas.onchange = recalcular;
    sPixDesc.onchange = recalcular;
    sMoeda.onchange = recalcular;
    updateTreinoAviso();
    recalcular();
    document.getElementById('s-save').onclick = () => {
      const moeda = sMoeda.value;
      const produtos = prodsSel();
      if (!produtos.length) { const f = document.getElementById('s-prods').closest('.field'); if (f) f.classList.add('has-error'); return UI.toast('Selecione os serviços', 'Marque ao menos um serviço', 'err'); }
      const valorBase = payBox._valorBase || 0;
      if (!valorBase) return UI.toast('Selecione os serviços', 'O valor de tabela ficou zerado', 'err');
      const desc = parseInt(sDesc.value, 10) || 0;
      const calc = payBox._calc;
      OB.addSale({
        id: OB.uid(), consultorId: u.id, clientId: sCli.value,
        produto: produtos[0], produtos,
        valor: calc.valorServico, valorBruto: valorBase, valorCliente: calc.valorCliente, moeda,
        descontoTipo: desc ? 'percent' : null, descontoValor: desc,
        precoModo: 'tabela',
        formaPagamento: calc.forma, parcelas: calc.parcelas, pixDesconto: calc.pixDesconto,
        linkPagamento: (document.getElementById('s-link').value || '').trim(),
        acceptToken: OB.uid().replace(/-/g, ''), // token p/ o link de aceite do cliente
        data: new Date().toISOString(), statusComissao: 'disponivel',
        statusProposta: document.getElementById('s-status').value
      });
      this.autoContrato(OB.db.sales[OB.db.sales.length - 1]); // formalizou a venda -> gera o contrato
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
        ${vendas.map(s => { const cli = OB.clientById(s.clientId); const pr = OB.STATUS_PROPOSTA[s.statusProposta] || OB.STATUS_PROPOSTA.aprovada;
          return `<tr><td>${OB.dataBR(s.data)}</td><td class="strong">${cli?cli.nome:'-'}</td><td>${OB.produtosNomes(s)}</td>
            <td class="strong">${OB.money(s.valor, s.moeda)}</td><td><span class="chip ${pr.chip}">${pr.nome}</span></td>
            <td class="row" style="gap:6px;justify-content:flex-end">
              <button class="iconbtn" data-view="${s.id}" title="Visualizar em nova aba">${UI.icon('external',16)}</button>
              <button class="iconbtn" data-pdf="${s.id}" title="Gerar orçamento (PDF)">${UI.icon('download',16)}</button>
              <button class="iconbtn" data-share="${s.id}" title="Compartilhar">${UI.icon('share',16)}</button>
              ${s.statusProposta==='aguardando'?`<button class="iconbtn" data-ap="${s.id}" title="Marcar aprovada" style="color:#1fa855">${UI.icon('check',16)}</button>`:''}
              <button class="iconbtn" data-edit="${s.id}" title="Editar">${UI.icon('edit',16)}</button>
              <button class="iconbtn" data-del="${s.id}" title="Excluir">${UI.icon('trash',16)}</button>
            </td></tr>`; }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => this.visualizarOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.view)));
      el.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => this.baixarOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.pdf)));
      el.querySelectorAll('[data-share]').forEach(b => b.onclick = () => this.compartilharOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.share)));
      el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { this.setStatusProposta(b.dataset.ap, 'aprovada'); });
      el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => this.editarVenda(OB.salesOf(u.id).find(x => x.id === b.dataset.edit)));
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const s = OB.salesOf(u.id).find(x => x.id === b.dataset.del); UI.confirm('Excluir orçamento', `Remover a proposta de ${OB.clientById(s.clientId)?.nome||'cliente'}?`, () => { OB.removeContratoDaVenda(s.id); OB.removeSale(s.id); UI.toast('Orçamento excluído','','ok'); this.render('orcamentos'); }, 'Excluir'); });
    }
    document.getElementById('novo-orc').onclick = () => this.saleModal({ orcamento: true });
  },

  /* gera o orçamento branded (HTML autossuficiente p/ baixar/imprimir em PDF) */
  buildOrcamentoHTML(s) {
    const u = this.u(); const cli = OB.clientById(s.clientId);
    // linhas de serviço: 1 por produto. Com vários, mostra o preço de tabela de cada um
    // (pelo porte do cliente) e uma linha de ajuste quando o total foi personalizado.
    const prodIds = OB.produtosDaVenda(s);
    const porteCli = cli ? (cli.porte || 'pequena') : 'pequena';
    const bruto = s.valorBruto || s.valor;
    let linhasSvc = '';
    const escopoDe = (p, id) => (p && p.incluso) ? p.incluso : 'Desenvolvido pela OutBox Soluções Digitais';
    if (prodIds.length <= 1) {
      const p0 = OB.PRODUTOS.find(x => x.id === prodIds[0]);
      linhasSvc = `<tr><td><b>${p0 ? p0.nome : (prodIds[0] || 'Serviço')}</b><br><span style="color:var(--mut);font-size:13px;line-height:1.55">${escopoDe(p0, prodIds[0])}</span></td><td style="text-align:right">${OB.money(bruto, s.moeda)}</td></tr>`;
    } else {
      // distribui o valor do orçamento entre os serviços, proporcional ao preço de tabela
      // (as linhas sempre somam exatamente o subtotal, sem linha de ajuste)
      const itens = prodIds.map(id => { const p = OB.PRODUTOS.find(x => x.id === id); return { nome: p ? p.nome : id, escopo: escopoDe(p, id), val: OB.precoTabela(id, porteCli) || 0 }; });
      const somaTab = itens.reduce((t, i) => t + i.val, 0);
      let acum = 0;
      itens.forEach((it, idx) => {
        const ultimo = idx === itens.length - 1;
        const v = ultimo ? bruto - acum : Math.round(bruto * (somaTab ? it.val / somaTab : 1 / itens.length));
        it.mostra = Math.max(0, v); acum += v;
      });
      linhasSvc = itens.map(i => `<tr><td><b>${i.nome}</b><br><span style="color:var(--mut);font-size:13px;line-height:1.55">${i.escopo}</span></td><td style="text-align:right">${OB.money(i.mostra, s.moeda)}</td></tr>`).join('');
    }
    const mark = `<svg viewBox="0 0 439 439" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="219.5" fill="#fff"/><path fill="#F15532" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#F15532" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const temDesc = s.descontoTipo && s.descontoValor > 0;
    const hoje = new Date(); const val = new Date(hoje.getTime() + 7 * 864e5);
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Orçamento OutBox · ${cli ? cli.nome : ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>:root{--brand:#F15532;--ink:#0A0A0A;--soft:#46505c;--mut:#8a96a3;--bg:#F5F7F9;--line:#e6eaef}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 10px 40px rgba(0,0,0,.06)}.cover{background:linear-gradient(135deg,#F15532,#e0431f);color:#fff;padding:40px 48px}.brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}.brand b{font-size:24px;font-weight:800}.cover h1{font-size:30px;font-weight:800;letter-spacing:-.02em}.cover p{color:rgba(255,255,255,.9);margin-top:4px}.body{padding:38px 48px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:28px;font-size:14px}.grid .lbl{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.04em}.tbl{width:100%;border-collapse:collapse;margin-bottom:18px}.tbl th{text-align:left;padding:12px 14px;background:var(--bg);border-bottom:2px solid var(--line);font-size:12px;text-transform:uppercase;color:var(--mut)}.tbl td{padding:14px;border-bottom:1px solid var(--line)}.tot{display:flex;justify-content:flex-end}.tot .box{min-width:280px}.tot .row{display:flex;justify-content:space-between;padding:8px 0;font-size:15px;color:var(--soft)}.tot .grand{border-top:2px solid var(--line);margin-top:6px;padding-top:14px;font-size:22px;font-weight:800;color:var(--ink)}.tot .grand b{color:var(--brand)}.note{margin-top:26px;padding:16px 18px;background:var(--bg);border-radius:12px;font-size:13px;color:var(--soft);border:1px solid var(--line)}.foot{border-top:1px solid var(--line);padding:24px 48px;color:var(--mut);font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}.foot b{color:var(--ink)}.print-hint{position:fixed;bottom:16px;right:16px;background:var(--brand);color:#fff;padding:10px 16px;border-radius:10px;font-weight:600;cursor:pointer;border:none;box-shadow:0 8px 20px rgba(241,85,50,.3)}.cta{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0 4px}.cta a,.cta span{flex:1;min-width:200px;text-align:center;padding:16px 20px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .1s,box-shadow .2s}.cta a:active{transform:translateY(1px)}.cta .accept{background:var(--brand);color:#fff;box-shadow:0 8px 20px rgba(241,85,50,.28)}.cta .pay{background:#16a34a;color:#fff;box-shadow:0 8px 20px rgba(22,163,74,.26)}.cta .done{background:#e8f7ee;color:#15803d;border:1px solid #b7e4c7;box-shadow:none}@media print{.print-hint{display:none}.cta{display:none}.page{box-shadow:none}}</style></head>
<body><div class="page">
  <div class="cover"><div class="brand">${mark}<b>OutBox</b></div><h1>Proposta de Orçamento</h1><p>Preparada por ${u.nome || ''} ${u.sobrenome || ''} · Consultor OutBox Soluções Digitais</p></div>
  <div class="body">
    <div class="grid">
      <div><div class="lbl">Cliente</div>${cli ? cli.nome : '-'}</div>
      <div><div class="lbl">Data</div>${hoje.toLocaleDateString('pt-BR')}</div>
      <div><div class="lbl">Contato</div>${cli ? (cli.contato || '-') : '-'}${cli && cli.telefone ? ' · ' + cli.telefone : ''}</div>
      <div><div class="lbl">Validade</div>${val.toLocaleDateString('pt-BR')}</div>
    </div>
    <table class="tbl"><thead><tr><th>Serviço${prodIds.length > 1 ? 's' : ''}</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${linhasSvc}</tbody></table>
    ${(() => {
      const m = s.moeda;
      const base = s.valorBruto || s.valor;
      const desc = s.descontoTipo === 'percent' ? (s.descontoValor || 0) : 0;
      const negociado = Math.round(base * (1 - desc / 100));
      const forma = s.formaPagamento || 'pix';
      const cliente = s.valorCliente != null ? s.valorCliente : s.valor;
      const parcelas = s.parcelas || 1;
      let rows = `<div class="row"><span>Valor de tabela</span><span>${OB.money(base, m)}</span></div>`;
      if (desc) rows += `<div class="row"><span>Desconto comercial (${desc}%)</span><span>- ${OB.money(base - negociado, m)}</span></div>`;
      if (forma === 'pix' && s.pixDesconto) rows += `<div class="row"><span>Desconto PIX à vista (5%)</span><span>- ${OB.money(negociado - s.valor, m)}</span></div>`;
      if (forma === 'cartao') rows += `<div class="row"><span>Juros do cartão (${parcelas}x)</span><span>+ ${OB.money(cliente - negociado, m)}</span></div>`;
      rows += `<div class="row grand"><span>Total ${forma === 'cartao' ? 'no cartão' : 'à vista'}</span><b>${OB.money(cliente, m)}</b></div>`;
      if (forma === 'cartao') rows += `<div class="row"><span>Parcelamento</span><b>${parcelas}x de ${OB.money(Math.round((cliente / parcelas) * 100) / 100, m)}</b></div>`;
      return `<div class="tot"><div class="box">${rows}</div></div>`;
    })()}
    ${(() => {
      const fp = OB.FORMAS_PAGAMENTO.find(f => f.id === (s.formaPagamento || 'pix')) || OB.FORMAS_PAGAMENTO[0];
      let extra = fp.detalhe;
      if ((s.formaPagamento || 'pix') === 'cartao') extra = `Em ${s.parcelas || 1}x · juros do parcelamento já incluídos no total`;
      else if ((s.formaPagamento) === 'pix' && s.pixDesconto) extra = 'Pagamento integral via PIX · 5% de desconto à vista aplicado';
      return `<div class="note" style="margin-bottom:14px"><b style="color:var(--ink)">Forma de pagamento:</b> ${fp.nome}<br><span style="font-size:12px">${extra}</span></div>`;
    })()}
    ${(() => {
      const aceito = s.statusProposta === 'aprovada';
      const aceiteUrl = s.acceptToken ? `${OB.APP_URL}/?aceite=${encodeURIComponent(s.id)}&t=${encodeURIComponent(s.acceptToken)}` : '';
      const payUrl = s.linkPagamento || OB.linkPagamento(s.formaPagamento);
      const accept = aceito
        ? `<span class="accept done">&#10003; Proposta aprovada</span>`
        : (aceiteUrl ? `<a class="accept" href="${aceiteUrl}" target="_blank" rel="noopener">&#10003; Aceitar proposta</a>` : '');
      const pay = payUrl ? `<a class="pay" href="${payUrl}" target="_blank" rel="noopener">Ir para o pagamento &rarr;</a>` : '';
      return (accept || pay) ? `<div class="cta">${accept}${pay}</div>` : '';
    })()}
    <div class="note">Esta proposta tem validade de 7 dias. Ao aprovar, iniciamos o briefing e o cronograma do seu projeto.</div>
  </div>
  <div class="foot"><div>OutBox Soluções Digitais · Proposta comercial<br><b>${u.email || 'felipe@outboxgroup.com.br'}</b>${u.celular ? ' · ' + u.celular : ''}</div><div>www.outboxgroup.com.br<br>Santa Cruz do Rio Pardo · SP</div></div>
</div><button class="print-hint" onclick="window.print()">Salvar como PDF / Imprimir</button></body></html>`;
  },
  /* abre o orçamento renderizado em uma nova aba (apenas visualização) */
  visualizarOrcamento(s) {
    if (!s) return;
    const blob = new Blob([this.buildOrcamentoHTML(s)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) { URL.revokeObjectURL(url); UI.toast('Não foi possível abrir', 'Permita pop-ups para visualizar em nova aba.', 'err'); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
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

  /* ====================== CONTRATOS ====================== */
  /* snapshot dos dados do contrato a partir da venda (fica estável no registro) */
  montarContratoDados(s) {
    const cli = OB.clientById(s.clientId) || {};
    const u = this.u();
    const prodIds = OB.produtosDaVenda(s);
    const porte = cli.porte || 'pequena';
    const base = s.valorBruto || s.valor;
    const desc = s.descontoTipo === 'percent' ? (s.descontoValor || 0) : 0;
    const servicos = prodIds.map(id => {
      const p = OB.PRODUTOS.find(x => x.id === id) || {};
      const mod = OB.contratoModelo(id);
      return { id, nome: p.nome || id, incluso: p.incluso || '', objeto: mod.objeto, prazo: mod.prazo, revisoes: mod.revisoes, valor: OB.precoTabela(id, porte) || 0 };
    });
    return {
      numero: '', data: new Date().toISOString(), foro: OB.CONTRATO_FORO, empresa: TERMOS.EMPRESA,
      consultor: { nome: `${u.nome || ''} ${u.sobrenome || ''}`.trim(), email: u.email || '' },
      cliente: {
        nome: cli.nome || '', contato: cli.contato || '', doc: cli.doc || '', tipo: cli.tipo || '', email: cli.email || '', telefone: cli.telefone || '', uf: cli.uf || '', cidade: cli.cidade || '',
        endereco: [cli.logradouro && (cli.logradouro + (cli.numero ? ', ' + cli.numero : '')), cli.bairro, (cli.cidade ? cli.cidade + (cli.uf ? '/' + cli.uf : '') : ''), cli.cep && ('CEP ' + cli.cep)].filter(Boolean).join(' · ')
      },
      servicos,
      pagamento: { moeda: s.moeda || 'BRL', valorBase: base, desconto: desc, valorServico: s.valor, valorCliente: s.valorCliente != null ? s.valorCliente : s.valor, forma: s.formaPagamento || 'pix', parcelas: s.parcelas || 1, pixDesconto: !!s.pixDesconto }
    };
  },
  /* cria o contrato da venda (uma vez); retorna o existente se já houver */
  gerarContrato(s) {
    let c = OB.contratoDaVenda(s.id);
    if (c) return c;
    const dados = this.montarContratoDados(s);
    dados.numero = OB.gerarNumeroContrato();
    c = { id: OB.uid(), numero: dados.numero, saleId: s.id, consultorId: this.u().id, clientId: s.clientId, dados, status: 'pendente', acceptToken: OB.uid().replace(/-/g, ''), aceiteNome: '', aceiteDoc: '', aceiteIp: '', aceitoEm: null, criadoEm: new Date().toISOString() };
    OB.addContrato(c);
    return c;
  },
  /* HTML do contrato (branded, logo + marca d'água em todas as páginas, aceite virtual) */
  buildContratoHTML(c) {
    const d = c.dados || {}; const e = d.empresa || {}; const p = d.pagamento || {}; const cl = d.cliente || {};
    const m = p.moeda || 'BRL';
    const money = v => OB.money(v, m);
    const dataBR = iso => { try { return new Date(iso).toLocaleDateString('pt-BR'); } catch (x) { return ''; } };
    const dataExtenso = iso => { try { const dt = new Date(iso); return `${dt.getDate()} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][dt.getMonth()]} de ${dt.getFullYear()}`; } catch (x) { return dataBR(iso); } };
    const nomes = (d.servicos || []).map(x => x.nome).join(', ');
    const negociado = Math.round((p.valorBase || 0) * (1 - (p.desconto || 0) / 100));
    const forma = p.forma || 'pix';
    const formaTxt = forma === 'cartao' ? `Cartão de crédito em ${p.parcelas || 1}x` : (forma === 'boleto' ? 'Boleto bancário à vista' : 'PIX à vista');
    const contratantePessoa = (cl.tipo || '').toUpperCase().includes('PJ') || (cl.doc || '').replace(/\D/g, '').length > 11 ? 'pessoa jurídica' : 'pessoa física';
    const cidadeSede = (e.cidade || 'Santa Cruz do Rio Pardo/SP');
    const assin = (typeof OB !== 'undefined' && OB.ASSINATURA_OUTBOX) ? OB.ASSINATURA_OUTBOX : '';
    const markHead = `<svg viewBox="0 0 439 439" width="34" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="90" fill="#F15532"/><path fill="#fff" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#fff" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const aceiteUrl = c.acceptToken ? `${OB.APP_URL}/?contrato=${encodeURIComponent(c.id)}&t=${encodeURIComponent(c.acceptToken)}` : '';
    const objetos = (d.servicos || []).map(x => `<li><b>${x.nome}.</b> ${x.objeto}. <span class="mut">Prazo estimado de entrega: ${x.prazo}.</span></li>`).join('');
    const revisoes = (d.servicos || []).map(x => `<li><b>${x.nome}:</b> ${x.revisoes}.</li>`).join('');
    // linhas de pagamento
    let payRows = `<tr><td>Valor dos serviços (tabela)</td><td class="r">${money(p.valorBase)}</td></tr>`;
    if (p.desconto) payRows += `<tr><td>Desconto comercial (${p.desconto}%)</td><td class="r">- ${money((p.valorBase || 0) - negociado)}</td></tr>`;
    if (forma === 'pix' && p.pixDesconto) payRows += `<tr><td>Desconto PIX à vista (5%)</td><td class="r">- ${money(negociado - p.valorServico)}</td></tr>`;
    if (forma === 'cartao') payRows += `<tr><td>Juros do parcelamento (${p.parcelas}x)</td><td class="r">+ ${money((p.valorCliente || 0) - negociado)}</td></tr>`;
    payRows += `<tr class="tot"><td><b>Total ${forma === 'cartao' ? 'no cartão' : 'à vista'}</b></td><td class="r"><b>${money(p.valorCliente)}</b></td></tr>`;
    if (forma === 'cartao') payRows += `<tr><td>Parcelamento</td><td class="r"><b>${p.parcelas}x de ${money(Math.round((p.valorCliente / (p.parcelas || 1)) * 100) / 100)}</b></td></tr>`;
    const condPagamento = forma === 'cartao'
      ? `O pagamento será realizado por cartão de crédito, parcelado em ${p.parcelas}x de ${money(Math.round((p.valorCliente / (p.parcelas || 1)) * 100) / 100)}, totalizando ${money(p.valorCliente)}. Os juros do parcelamento são cobrados pela operadora do cartão e já estão incluídos no valor total.`
      : (forma === 'boleto'
        ? `O pagamento será realizado à vista, por boleto bancário, no valor de ${money(p.valorCliente)}, com vencimento em até 3 (três) dias úteis a contar da assinatura deste contrato.`
        : `O pagamento será realizado à vista, via PIX, no valor de ${money(p.valorCliente)}${p.pixDesconto ? ' (já aplicado o desconto de 5% para pagamento à vista)' : ''}, em até 3 (três) dias úteis a contar da assinatura deste contrato.`);
    const aceiteBloco = c.status === 'aceito'
      ? `<div class="aceite ok clause"><b>&#10003; Contrato aceito eletronicamente</b><div>Aceito por <b>${c.aceiteNome || cl.nome}</b>${c.aceiteDoc ? ' · Documento: ' + c.aceiteDoc : ''}<br>Data e hora: ${new Date(c.aceitoEm).toLocaleString('pt-BR')}${c.aceiteIp ? ' · IP ' + c.aceiteIp : ''}</div><div class="mut">Assinatura eletrônica com validade jurídica nos termos da MP 2.200-2/2001 e da Lei 14.063/2020.</div></div>`
      : (aceiteUrl ? `<div class="cta"><a class="accept" href="${aceiteUrl}" target="_blank" rel="noopener">&#10003; Ler e aceitar o contrato</a></div><p class="mut" style="text-align:center;font-size:12px">O aceite eletrônico tem validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).</p>` : '');
    // bloco de assinatura da CONTRATANTE (cliente): aceite eletrônico substitui a assinatura manual
    const assinCliente = c.status === 'aceito'
      ? `<div class="sig-e">assinado eletronicamente<br>${c.aceitoEm ? dataBR(c.aceitoEm) : ''}</div>`
      : `<div class="sig-ph"></div>`;
    const assinContratada = assin
      ? `<img class="sig-img" src="${assin}" alt="Assinatura OutBox"/>`
      : `<div class="sig-ph"></div>`;
    const runHead = `<div class="sheet-head"><div class="lg">${markHead}<div><b>OutBox</b><span>Soluções Digitais</span></div></div><span class="hnum">Contrato ${c.numero} · ${dataBR(d.data)}</span></div>`;
    const runFoot = `<div class="sheet-foot"><span>${e.razao || 'OutBox Group Soluções Digitais'} · ${e.dpo || 'felipe@outboxgroup.com.br'}</span><span class="pg"></span></div>`;
    const blocosHTML = `
      <h1>Contrato de Prestação de Serviços</h1>
      <div class="sub">${nomes}</div>
      <div class="parties clause">
        <div class="party"><div class="tag">Contratada</div><b>${e.razao || 'OutBox Group Soluções Digitais'}</b><br>CNPJ ${e.cnpj || ''}<br>${e.endereco || ''}<br>${e.dpo || ''}</div>
        <div class="party"><div class="tag">Contratante</div><b>${cl.nome || '—'}</b><br>${cl.doc ? (contratantePessoa === 'pessoa jurídica' ? 'CNPJ ' : 'CPF ') + cl.doc + '<br>' : ''}${cl.endereco || ''}${cl.email ? '<br>' + cl.email : ''}${cl.telefone ? ' · ' + cl.telefone : ''}</div>
      </div>
      <p class="clause">Pelo presente instrumento particular de prestação de serviços, de um lado <b>${e.razao || 'OutBox Group Soluções Digitais'}</b>, inscrita no CNPJ sob o nº ${e.cnpj || ''}, com sede na ${e.endereco || ''}, doravante denominada <b>CONTRATADA</b>, e de outro lado <b>${cl.nome || ''}</b>, ${contratantePessoa}${cl.doc ? ', inscrita no ' + (contratantePessoa === 'pessoa jurídica' ? 'CNPJ' : 'CPF') + ' sob o nº ' + cl.doc : ''}${cl.endereco ? ', com endereço em ' + cl.endereco : ''}, doravante denominada <b>CONTRATANTE</b>, têm entre si, de forma justa e acordada, o presente contrato, que se regerá pelas cláusulas e condições a seguir:</p>
      <div class="clause"><h2>Cláusula 1ª — Do objeto</h2>
      <p>O presente contrato tem por objeto a prestação, pela CONTRATADA à CONTRATANTE, dos seguintes serviços de desenvolvimento digital:</p>
      <ul>${objetos}</ul>
      <p>O escopo detalhado de cada serviço é o descrito acima e o complementado pelo briefing preenchido e aprovado pela CONTRATANTE, que passa a integrar este contrato para todos os fins.</p></div>
      <div class="clause"><h2>Cláusula 2ª — Do valor</h2>
      <p>Pela prestação dos serviços descritos na Cláusula 1ª, a CONTRATANTE pagará à CONTRATADA o valor total conforme discriminado abaixo:</p>
      <table class="paytbl">${payRows}</table></div>
      <div class="clause"><h2>Cláusula 3ª — Da forma e das condições de pagamento</h2>
      <p>${condPagamento}</p>
      <p>O início da execução dos serviços fica condicionado à confirmação do pagamento (ou da primeira parcela, no caso de parcelamento) e ao recebimento do material necessário ao briefing.</p></div>
      <div class="clause"><h2>Cláusula 4ª — Do prazo de execução</h2>
      <p>Os prazos estimados de entrega de cada serviço são os indicados na Cláusula 1ª, contados em dias úteis a partir da confirmação do pagamento e do recebimento, pela CONTRATADA, de todo o conteúdo, textos, imagens, acessos e informações necessárias (briefing). Atrasos no fornecimento desse material pela CONTRATANTE prorrogam automaticamente os prazos, na mesma proporção.</p></div>
      <div class="clause"><h2>Cláusula 5ª — Das revisões e aprovações</h2>
      <p>Estão incluídas as seguintes rodadas de revisão, por serviço:</p>
      <ul>${revisoes}</ul>
      <p>Alterações solicitadas após o esgotamento das revisões incluídas, ou que representem mudança de escopo, serão orçadas à parte e dependem de aprovação prévia da CONTRATANTE. A ausência de manifestação da CONTRATANTE em até 5 (cinco) dias úteis após o envio de uma entrega implica aprovação tácita da etapa.</p></div>
      <div class="clause"><h2>Cláusula 6ª — Das obrigações da CONTRATADA</h2>
      <p>Compete à CONTRATADA: (a) executar os serviços com zelo, técnica e qualidade profissional; (b) cumprir os prazos ajustados, ressalvados os atrasos causados pela CONTRATANTE ou por caso fortuito e força maior; (c) realizar as rodadas de revisão previstas; (d) manter a CONTRATANTE informada sobre o andamento; e (e) entregar os arquivos e acessos correspondentes ao serviço contratado após a quitação.</p></div>
      <div class="clause"><h2>Cláusula 7ª — Das obrigações da CONTRATANTE</h2>
      <p>Compete à CONTRATANTE: (a) fornecer, em tempo hábil, todo o conteúdo, textos, imagens, logotipos, acessos e aprovações necessárias; (b) efetuar os pagamentos nas condições pactuadas; (c) responsabilizar-se pela veracidade, licitude e titularidade do material entregue à CONTRATADA; e (d) indicar um responsável para aprovar as entregas.</p></div>
      <div class="clause"><h2>Cláusula 8ª — Da propriedade intelectual e da entrega</h2>
      <p>Após a quitação integral dos valores, a CONTRATANTE passa a deter os direitos de uso do resultado final entregue, para os fins a que se destina. Ferramentas, bibliotecas, códigos de terceiros, fontes e licenças permanecem regidos por suas próprias condições. A CONTRATADA reserva-se o direito de exibir o trabalho em seu portfólio e materiais de divulgação, salvo manifestação expressa em contrário da CONTRATANTE.</p></div>
      <div class="clause"><h2>Cláusula 9ª — Da confidencialidade</h2>
      <p>As partes obrigam-se a manter sigilo sobre as informações confidenciais a que tiverem acesso em razão deste contrato, não as divulgando a terceiros sem autorização, obrigação que subsiste mesmo após o término da relação contratual.</p></div>
      <div class="clause"><h2>Cláusula 10ª — Da proteção de dados (LGPD)</h2>
      <p>As partes comprometem-se a tratar os dados pessoais eventualmente acessados em conformidade com a Lei nº 13.709/2018 (LGPD), utilizando-os exclusivamente para a execução deste contrato e adotando medidas de segurança adequadas. O Encarregado de Dados (DPO) da CONTRATADA pode ser contatado pelo e-mail ${e.dpo || 'felipe@outboxgroup.com.br'}.</p></div>
      <div class="clause"><h2>Cláusula 11ª — Do inadimplemento</h2>
      <p>O atraso no pagamento sujeitará a CONTRATANTE a multa de 2% (dois por cento) sobre o valor em aberto, juros de mora de 1% (um por cento) ao mês e correção monetária, além de facultar à CONTRATADA a suspensão dos serviços até a regularização.</p></div>
      <div class="clause"><h2>Cláusula 12ª — Da rescisão</h2>
      <p>Este contrato poderá ser rescindido por qualquer das partes mediante comunicação escrita com antecedência de 10 (dez) dias, ou imediatamente em caso de descumprimento de cláusula pela outra parte. Havendo serviços já executados, será devida à CONTRATADA a remuneração proporcional à etapa concluída, não havendo devolução de valores referentes a serviços já entregues ou em execução.</p></div>
      <div class="clause"><h2>Cláusula 13ª — Das disposições gerais</h2>
      <p>Qualquer alteração a este contrato somente terá validade se formalizada por escrito entre as partes. A tolerância de uma parte quanto ao descumprimento de qualquer obrigação pela outra não implica novação ou renúncia. As comunicações entre as partes poderão ser feitas por e-mail ou aplicativo de mensagens (WhatsApp), reconhecidas como válidas para os fins deste contrato.</p></div>
      <div class="clause"><h2>Cláusula 14ª — Do aceite eletrônico e do foro</h2>
      <p>As partes reconhecem a validade da contratação e do aceite por meio eletrônico, nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020, produzindo os mesmos efeitos da assinatura manuscrita. Fica eleito o foro da <b>${d.foro || OB.CONTRATO_FORO}</b>, sede da CONTRATADA, para dirimir eventuais controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p></div>
      ${aceiteBloco}
      <p class="local clause">${cidadeSede.replace('/', ' - ')}, ${dataExtenso(d.data)}.</p>
      <div class="sign clause">
        <div class="col">${assinContratada}<div class="l"><b>${e.razao || 'OutBox Group Soluções Digitais'}</b>CONTRATADA · CNPJ ${e.cnpj || ''}</div></div>
        <div class="col">${assinCliente}<div class="l"><b>${cl.nome || ''}</b>CONTRATANTE${cl.doc ? ' · ' + cl.doc : ''}</div></div>
      </div>`;
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Contrato ${c.numero} · ${cl.nome || ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>:root{--brand:#F15532;--ink:#0A0A0A;--soft:#3c4652;--mut:#8a96a3;--line:#e6eaef}*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
html,body{background:#e9edf1}
body{font-family:'Inter',sans-serif;color:var(--ink);line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.doc{display:flex;flex-direction:column;align-items:center;gap:18px;padding:24px 12px 90px}
.sheet{width:210mm;height:297mm;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.10);display:flex;flex-direction:column;padding:13mm 18mm 10mm;overflow:hidden}
.sheet-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;border-bottom:2px solid var(--brand);margin-bottom:12px}
.sheet-head .lg{display:flex;align-items:center;gap:10px}.sheet-head .lg b{font-size:16px;font-weight:800}.sheet-head .lg span{display:block;font-size:10px;color:var(--mut);font-weight:600;letter-spacing:.02em}
.sheet-head .hnum{font-size:10.5px;color:var(--mut);text-align:right}
.sheet-body{flex:1 1 auto;overflow:hidden}
.sheet-foot{flex:0 0 auto;border-top:1px solid var(--line);padding-top:7px;margin-top:8px;display:flex;justify-content:space-between;gap:10px;font-size:9.5px;color:var(--mut)}
.sheet-foot .pg{font-weight:700}
h1{font-size:20px;font-weight:800;text-align:center;letter-spacing:-.01em;margin-bottom:3px}
.sub{text-align:center;color:var(--mut);font-size:12px;margin-bottom:18px}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.party{border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:12px;color:var(--soft)}
.party .tag{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--brand);font-weight:700;margin-bottom:5px}
.party b{color:var(--ink)}
.clause{break-inside:avoid;margin-bottom:4px}
h2{font-size:13px;font-weight:800;margin:13px 0 5px;color:var(--ink)}
p,li{font-size:11.8px;color:var(--soft);text-align:justify}
ul{margin:5px 0 5px 18px}li{margin-bottom:4px}
.mut{color:var(--mut)}
.paytbl{width:100%;border-collapse:collapse;margin:6px 0 4px}
.paytbl td{padding:8px 12px;border-bottom:1px solid var(--line);font-size:12px;color:var(--soft)}
.paytbl td.r{text-align:right}.paytbl tr.tot td{border-top:2px solid var(--line);border-bottom:none;color:var(--ink);font-size:13.5px}
.paytbl tr.tot td b{color:var(--brand)}
.aceite{margin:16px 0 6px;padding:14px 16px;border-radius:10px;font-size:12px}
.aceite.ok{background:#e8f7ee;border:1px solid #b7e4c7;color:#15803d}.aceite.ok b{display:block;font-size:13.5px;margin-bottom:4px}
.cta{margin:16px 0 6px;text-align:center}.cta .accept{display:inline-flex;align-items:center;gap:8px;background:var(--brand);color:#fff;padding:14px 28px;border-radius:11px;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 8px 20px rgba(241,85,50,.28)}
.local{margin:22px 0 6px;font-size:12px;color:var(--soft)}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:8px 0 6px}
.sign .col{text-align:center}
.sign .sig-img{height:66px;object-fit:contain;margin:0 auto 2px;display:block}
.sign .sig-e{height:66px;display:flex;align-items:flex-end;justify-content:center;color:#15803d;font-size:11px;font-weight:600;line-height:1.3}
.sign .sig-ph{height:66px}
.sign .l{border-top:1.5px solid var(--ink);padding-top:6px;font-size:11px;color:var(--soft)}.sign .l b{display:block;color:var(--ink);font-size:12px}
.print-hint{position:fixed;bottom:16px;right:16px;background:var(--brand);color:#fff;padding:11px 18px;border-radius:11px;font-weight:700;cursor:pointer;border:none;box-shadow:0 8px 20px rgba(241,85,50,.3);z-index:5;font-family:inherit;font-size:13px}
@media print{.print-hint,.cta{display:none}html,body{background:#fff}.doc{gap:0;padding:0}.sheet{box-shadow:none;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}}</style></head>
<body>
<div class="doc" id="doc"></div>
<template id="tpl-head">${runHead}</template>
<template id="tpl-foot">${runFoot}</template>
<template id="tpl-blocks">${blocosHTML}</template>
<button class="print-hint" onclick="window.print()">Salvar como PDF / Imprimir</button>
<script>
(function(){
  function build(){
    var doc=document.getElementById('doc');
    if(!doc||doc.getAttribute('data-done'))return; doc.setAttribute('data-done','1');
    var headT=document.getElementById('tpl-head'), footT=document.getElementById('tpl-foot');
    var blocks=[].slice.call(document.getElementById('tpl-blocks').content.children);
    function newSheet(){
      var s=document.createElement('div'); s.className='sheet';
      s.appendChild(headT.content.cloneNode(true));
      var b=document.createElement('div'); b.className='sheet-body'; s.appendChild(b);
      s.appendChild(footT.content.cloneNode(true));
      doc.appendChild(s); return b;
    }
    var body=newSheet();
    for(var i=0;i<blocks.length;i++){
      var blk=blocks[i].cloneNode(true);
      body.appendChild(blk);
      if(body.scrollHeight>body.clientHeight+1){
        body.removeChild(blk);
        if(body.children.length===0){ body.appendChild(blk); continue; }
        body=newSheet(); body.appendChild(blk);
      }
    }
    var sheets=doc.querySelectorAll('.sheet');
    for(var j=0;j<sheets.length;j++){ var pg=sheets[j].querySelector('.pg'); if(pg) pg.textContent='Página '+(j+1)+' de '+sheets.length; }
  }
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(build);setTimeout(build,700);}
  else{window.addEventListener('load',build);setTimeout(build,300);}
})();
</script>
</body></html>`;
  },
  visualizarContrato(c) {
    if (!c) return;
    const blob = new Blob([this.buildContratoHTML(c)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) { URL.revokeObjectURL(url); UI.toast('Não foi possível abrir', 'Permita pop-ups para visualizar em nova aba.', 'err'); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
  baixarContrato(c) {
    if (!c) return;
    const blob = new Blob([this.buildContratoHTML(c)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Contrato ${c.numero} - ${(c.dados && c.dados.cliente && c.dados.cliente.nome) || 'cliente'}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    UI.toast('Contrato gerado', 'Abra o arquivo para enviar ou imprimir em PDF', 'ok');
  },
  copiarLinkAceiteContrato(c) {
    if (!c || !c.acceptToken) return;
    const url = `${OB.APP_URL}/?contrato=${encodeURIComponent(c.id)}&t=${encodeURIComponent(c.acceptToken)}`;
    const msg = `Olá! Segue o contrato dos serviços com a OutBox para leitura e aceite:\n${url}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => UI.toast('Link copiado', 'Cole no WhatsApp/e-mail do cliente', 'ok')).catch(() => {});
    else UI.toast('Link do contrato', url, 'ok');
    return msg;
  },
  enviarContratoModal(c) {
    if (!c) return;
    const url = `${OB.APP_URL}/?contrato=${encodeURIComponent(c.id)}&t=${encodeURIComponent(c.acceptToken)}`;
    const cli = (c.dados && c.dados.cliente) || {};
    const zap = (cli.telefone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Segue o contrato dos serviços com a OutBox para leitura e aceite: ${url}`);
    UI.modal({
      title: 'Enviar contrato para aceite', sub: `Contrato nº ${c.numero} · ${cli.nome || ''}`,
      body: `
        <div class="field"><label>Link de aceite do cliente</label>
          <input id="ct-url" readonly value="${url}"/>
          <div class="hint">O cliente abre o link, lê o contrato e confirma o aceite. A assinatura eletrônica fica registrada com data, hora e IP.</div></div>
        <button class="btn ghost" id="ct-ver-modal" style="width:100%">${UI.icon('eye',15)} Visualizar o contrato</button>`,
      footer: `<button class="btn ghost" data-close>Fechar</button>
        <a class="btn ghost" href="https://wa.me/${zap ? '55' + zap : ''}?text=${msg}" target="_blank" rel="noopener">${UI.icon('chat',15)} WhatsApp</a>
        <button class="btn brand" id="ct-copy">${UI.icon('share',15)} Copiar link</button>`
    });
    document.getElementById('ct-copy').onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(url); UI.toast('Link copiado', 'Cole para o cliente', 'ok'); };
    document.getElementById('ct-ver-modal').onclick = () => this.visualizarContrato(c);
  },
  /* card de um contrato na biblioteca */
  contratoLibCard(c) {
    const cli = OB.clientById(c.clientId) || (c.dados && c.dados.cliente) || {};
    const servicos = (c.dados && c.dados.servicos) || [];
    const svc = servicos.map(x => x.nome).join(' + ');
    const val = (c.dados && c.dados.pagamento) ? OB.money(c.dados.pagamento.valorCliente, c.dados.pagamento.moeda) : '';
    const aceito = c.status === 'aceito';
    const badge = aceito ? `<span class="ctl-badge ok">${UI.icon('check',12)} Aceito</span>` : `<span class="ctl-badge wait">Aguardando</span>`;
    return `<div class="ctl-card" data-cli="${(cli.nome || '').toLowerCase()}" data-num="${(c.numero || '').toLowerCase()}" data-svc="${servicos.map(x => x.id).join(',')}" data-per="${(c.criadoEm || '').slice(0, 7)}" data-status="${aceito ? 'aceito' : 'pendente'}">
      <div class="ctl-ic">${UI.icon('contract',20)}</div>
      <div class="ctl-info">
        <div class="ctl-top"><b>${cli.nome || 'Cliente'}</b><span class="ctl-num">${c.numero}</span></div>
        <div class="ctl-svc">${svc || 'Serviço'}</div>
        <div class="ctl-meta"><span class="ctl-val">${val}</span><span class="ctl-dot">·</span>${OB.dataBR(c.criadoEm)}${aceito && c.aceitoEm ? ` <span class="ctl-dot">·</span> aceito ${OB.dataBR(c.aceitoEm)}` : ''}</div>
      </div>
      <div class="ctl-right">
        ${badge}
        <div class="ctl-acts">
          <button class="icob" data-ct-ver="${c.id}" title="Visualizar" aria-label="Visualizar contrato">${UI.icon('eye',16)}</button>
          <button class="icob" data-ct-bx="${c.id}" title="Baixar em PDF" aria-label="Baixar contrato">${UI.icon('download',16)}</button>
          ${!aceito ? `<button class="icob brand" data-ct-link="${c.id}" title="Enviar para aceite" aria-label="Enviar para aceite">${UI.icon('share',16)}</button>` : ''}
          <button class="icob danger" data-ct-del="${c.id}" title="Excluir contrato" aria-label="Excluir contrato">${UI.icon('trash',16)}</button>
        </div>
      </div>
    </div>`;
  },
  _ctLibFiltro: { periodo: '', servico: '', cliente: '', status: '' },
  view_contratos() {
    const u = this.u();
    const v = document.getElementById('main-view');
    // garante o contrato de toda venda formalizada (inclui as aprovadas pelo próprio cliente)
    OB.salesOf(u.id).filter(s => s.statusProposta === 'aprovada').forEach(s => this.autoContrato(s));
    const contratos = OB.contratosDe(u.id).slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    const aceitos = contratos.filter(c => c.status === 'aceito').length;
    const pend = contratos.length - aceitos;
    const kpis = `<div class="kpis kpis-3">
      <div class="kpi"><div class="kpi-v">${contratos.length}</div><div class="kpi-l">Contratos gerados</div></div>
      <div class="kpi"><div class="kpi-v" style="color:#16a34a">${aceitos}</div><div class="kpi-l">Aceitos</div></div>
      <div class="kpi"><div class="kpi-v" style="color:var(--brand)">${pend}</div><div class="kpi-l">Aguardando aceite</div></div>
    </div>`;
    if (!contratos.length) { v.innerHTML = kpis + this.empty('contract', 'Nenhum contrato ainda', 'Assim que você formalizar uma venda (proposta aprovada), o contrato do serviço é gerado automaticamente e aparece aqui na sua biblioteca.'); return; }
    const periodos = [...new Set(contratos.map(c => (c.criadoEm || '').slice(0, 7)).filter(Boolean))].sort().reverse();
    const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const perLabel = ym => { const [a, mo] = ym.split('-'); return `${MES[parseInt(mo, 10) - 1]}/${a}`; };
    const servs = [...new Set(contratos.flatMap(c => ((c.dados && c.dados.servicos) || []).map(x => x.id)))];
    const f = this._ctLibFiltro;
    v.innerHTML = kpis + `
      <div class="lib-head"><b>Biblioteca de contratos</b><span class="lib-count" id="ctl-count">${contratos.length} contratos</span></div>
      <div class="ctl-toolbar">
        <div class="ctl-search">${UI.icon('search',16)}<input id="ctl-cliente" placeholder="Buscar por cliente ou nº do contrato" value="${f.cliente}"/></div>
        <div class="ctl-seg" id="ctl-seg">
          <button type="button" data-st="" class="${!f.status ? 'on' : ''}">Todos <i>${contratos.length}</i></button>
          <button type="button" data-st="pendente" class="${f.status === 'pendente' ? 'on' : ''}">Aguardando <i>${pend}</i></button>
          <button type="button" data-st="aceito" class="${f.status === 'aceito' ? 'on' : ''}">Aceitos <i>${aceitos}</i></button>
        </div>
        <div class="ctl-selrow">
          <div class="ctl-sel"><label for="ctl-servico">Serviço</label>
            <select id="ctl-servico"><option value="">Todos os serviços</option>${OB.PRODUTOS.filter(p => servs.includes(p.id)).map(p => `<option value="${p.id}" ${f.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></div>
          <div class="ctl-sel"><label for="ctl-periodo">Período</label>
            <select id="ctl-periodo"><option value="">Todos os períodos</option>${periodos.map(ym => `<option value="${ym}" ${f.periodo === ym ? 'selected' : ''}>${perLabel(ym)}</option>`).join('')}</select></div>
          <button type="button" class="ctl-clear" id="ctl-limpar">${UI.icon('x',14)} Limpar filtros</button>
        </div>
      </div>
      <div class="ctl-list" id="ctl-list">${contratos.map(c => this.contratoLibCard(c)).join('')}</div>
      <div id="ctl-empty" hidden>${this.empty('contract', 'Nenhum contrato encontrado', 'Ajuste a busca ou os filtros para encontrar o contrato.')}</div>`;
    const aplicar = () => {
      const q = (document.getElementById('ctl-cliente').value || '').toLowerCase().trim();
      const sv = document.getElementById('ctl-servico').value;
      const per = document.getElementById('ctl-periodo').value;
      const st = (v.querySelector('#ctl-seg button.on') || {}).dataset ? v.querySelector('#ctl-seg button.on').dataset.st : '';
      this._ctLibFiltro = { cliente: q, servico: sv, periodo: per, status: st };
      let vis = 0;
      v.querySelectorAll('#ctl-list .ctl-card').forEach(card => {
        const okCli = !q || (card.dataset.cli || '').includes(q) || (card.dataset.num || '').includes(q);
        const okSvc = !sv || (card.dataset.svc || '').split(',').includes(sv);
        const okPer = !per || card.dataset.per === per;
        const okSt = !st || card.dataset.status === st;
        const show = okCli && okSvc && okPer && okSt; card.style.display = show ? '' : 'none'; if (show) vis++;
      });
      const cnt = document.getElementById('ctl-count'); if (cnt) cnt.textContent = `${vis} de ${contratos.length} contratos`;
      document.getElementById('ctl-empty').hidden = vis > 0;
      document.getElementById('ctl-list').hidden = vis === 0;
    };
    v.querySelectorAll('#ctl-seg button').forEach(b => b.onclick = () => { v.querySelectorAll('#ctl-seg button').forEach(x => x.classList.remove('on')); b.classList.add('on'); aplicar(); });
    document.getElementById('ctl-servico').onchange = aplicar;
    document.getElementById('ctl-periodo').onchange = aplicar;
    let t; document.getElementById('ctl-cliente').oninput = () => { clearTimeout(t); t = setTimeout(aplicar, 250); };
    document.getElementById('ctl-limpar').onclick = () => { this._ctLibFiltro = { periodo: '', servico: '', cliente: '', status: '' }; this.render('contratos'); };
    v.querySelectorAll('[data-ct-ver]').forEach(b => b.onclick = () => this.visualizarContrato(OB.contratoById(b.dataset.ctVer)));
    v.querySelectorAll('[data-ct-bx]').forEach(b => b.onclick = () => this.baixarContrato(OB.contratoById(b.dataset.ctBx)));
    v.querySelectorAll('[data-ct-link]').forEach(b => b.onclick = () => this.enviarContratoModal(OB.contratoById(b.dataset.ctLink)));
    v.querySelectorAll('[data-ct-del]').forEach(b => b.onclick = () => this.excluirContrato(OB.contratoById(b.dataset.ctDel)));
    if (f.cliente || f.servico || f.periodo || f.status) aplicar();
  },
  excluirContrato(c) {
    if (!c) return;
    const cli = OB.clientById(c.clientId) || (c.dados && c.dados.cliente) || {};
    UI.confirm('Excluir contrato', `Remover definitivamente o contrato <b>${c.numero}</b> de <b>${cli.nome || 'cliente'}</b>? Esta ação não pode ser desfeita.`, () => {
      OB.removeContrato(c.id);
      UI.toast('Contrato excluído', c.numero, 'ok');
      this.render('contratos');
    }, 'Excluir contrato');
  },

  /* compartilha o orçamento: Web Share API nativa (mobile) com fallback p/ WhatsApp */
  async compartilharOrcamento(s) {
    if (!s) return;
    const u = this.u(); const cli = OB.clientById(s.clientId);
    const p = OB.PRODUTOS.find(x => x.id === s.produto);
    const nome = cli ? cli.nome : 'cliente';
    const titulo = `Orçamento OutBox — ${nome}`;
    const texto = `Olá${cli ? ', ' + cli.nome.split(' ')[0] : ''}! Segue o orçamento ${OB.produtosNomes(s) ? 'de ' + OB.produtosNomes(s) + ' ' : ''}no valor de ${OB.money(s.valor, s.moeda)}. Qualquer dúvida estou à disposição. — ${u.nome || 'OutBox'}`;
    const arquivo = new File([this.buildOrcamentoHTML(s)], `Orcamento OutBox - ${nome}.html`, { type: 'text/html' });

    // 1) Web Share API com arquivo (ideal no celular)
    try {
      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({ title: titulo, text: texto, files: [arquivo] });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    // 2) Web Share API só com texto
    try {
      if (navigator.share) { await navigator.share({ title: titulo, text: texto }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    // 3) Fallback desktop: baixa o orçamento e abre o WhatsApp com a mensagem
    this.baixarOrcamento(s);
    const tel = (cli && cli.telefone ? cli.telefone.replace(/\D/g, '') : '');
    const waNum = tel ? (tel.length <= 11 ? '55' + tel : tel) : '';
    const waUrl = (waNum ? `https://wa.me/${waNum}` : 'https://wa.me/') + `?text=${encodeURIComponent(texto)}`;
    window.open(waUrl, '_blank', 'noopener');
    UI.toast('Pronto para compartilhar', 'Anexe o arquivo do orçamento que acabou de baixar na conversa.', 'ok');
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
      ${this.followupsStrip()}
      <div class="kanban" id="kanban">
        ${OB.ESTAGIOS.map(e => {
          const leads = OB.leadsOf(u.id).filter(l => l.estagio === e.id);
          const total = leads.reduce((t, l) => t + (l.valorEstimado || 0), 0);
          return `<div class="kan-col" data-estagio="${e.id}">
            <div class="kan-head"><span class="kan-dot" style="background:${e.cor}"></span><b>${e.nome}</b><span class="kan-count">${leads.length}</span></div>
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
    v.querySelectorAll('[data-fu]').forEach(b => b.onclick = () => this.leadModal(OB.leadsOf(u.id).find(l => l.id === b.dataset.fu)));
    this.bindKanban();
  },

  leadCard(l) {
    const sv = OB.PRODUTOS.find(p => p.id === l.servico);
    return `<div class="kan-card" draggable="true" data-id="${l.id}">
      <div class="row between alc"><b>${l.nome || 'Sem nome'}</b><span class="kan-grip">${UI.icon('edit',13)}</span></div>
      ${sv ? `<div style="margin-top:5px"><span class="chip brand" style="font-size:11px">${sv.nome}</span></div>` : ''}
      ${this.followupChip(l)}
      ${l.valorEstimado ? `<div class="kan-val">${OB.money(l.valorEstimado, l.moeda)}</div>` : ''}
      ${l.telefone ? `<div class="kan-meta">${UI.icon('whats',12)} ${l.telefone}</div>` : ''}
      ${l.obs ? `<div class="kan-meta mut">${l.obs}</div>` : ''}
    </div>`;
  },

  /* ---------- follow-up: chip, lista e alertas ---------- */
  followupChip(l) {
    if (!l.followupEm) return '';
    const d = new Date(l.followupEm);
    const hoje = new Date(); const ehHoje = d.toDateString() === hoje.toDateString();
    const vencido = d.getTime() < Date.now();
    const txt = `${ehHoje ? 'Hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${d.toTimeString().slice(0, 5)}`;
    const cls = vencido ? 'fu-late' : (ehHoje ? 'fu-today' : 'fu-ok');
    return `<div class="fu-chip ${cls}">${UI.icon('bell',11)} ${txt}</div>`;
  },

  followupsOrdenados() {
    const u = this.u();
    return OB.leadsOf(u.id).filter(l => l.followupEm && l.estagio !== 'ganho' && l.estagio !== 'perdido')
      .sort((a, b) => new Date(a.followupEm) - new Date(b.followupEm));
  },

  /* checa lembretes vencidos: badge no menu Funil + toast (1x por lembrete) */
  checkFollowups() {
    const u = OB.session(); if (!u || u.role === 'admin') return;
    const agora = Date.now();
    const due = this.followupsOrdenados().filter(l => new Date(l.followupEm).getTime() <= agora);
    const badge = document.getElementById('fu-badge');
    if (badge) { badge.textContent = due.length; badge.classList.toggle('hidden', !due.length); }
    this._fuAvisados = this._fuAvisados || new Set();
    due.forEach(l => {
      const key = l.id + l.followupEm;
      // só avisa lembretes das últimas 24h (os mais antigos ficam no badge/na lista)
      if (!this._fuAvisados.has(key) && agora - new Date(l.followupEm).getTime() < 24 * 3600 * 1000) {
        this._fuAvisados.add(key);
        UI.toast(`Follow-up: ${l.nome}`, `Hora de falar com este cliente (${new Date(l.followupEm).toTimeString().slice(0, 5)}). Veja no Funil de Vendas.`, 'info');
      }
    });
  },

  /* faixa de próximos follow-ups no topo do funil */
  followupsStrip() {
    const fus = this.followupsOrdenados().slice(0, 8);
    if (!fus.length) return '';
    return `<div class="fu-strip">
      <div class="fu-strip-head">${UI.icon('bell',14)} <b>Próximos follow-ups</b><span class="mut" style="font-size:12px">clique para abrir o contato</span></div>
      <div class="fu-strip-list">
        ${fus.map(l => { const d = new Date(l.followupEm); const vencido = d.getTime() < Date.now();
          return `<button class="fu-item ${vencido ? 'late' : ''}" data-fu="${l.id}">
            <b>${l.nome || 'Contato'}</b>
            <span>${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toTimeString().slice(0, 5)}${vencido ? ' · atrasado' : ''}</span>
          </button>`; }).join('')}
      </div>
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
    const fu = edit && l.followupEm ? new Date(l.followupEm) : null;
    const fuData = fu ? `${fu.getFullYear()}-${String(fu.getMonth() + 1).padStart(2, '0')}-${String(fu.getDate()).padStart(2, '0')}` : '';
    const fuHora = fu ? fu.toTimeString().slice(0, 5) : '';
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
        <div class="field"><label>Etapa</label><select id="l-est">${OB.ESTAGIOS.map(e => `<option value="${e.id}" ${(edit ? l.estagio === e.id : e.id === preEst) ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></div>
        <div class="grid-2">
          <div class="field"><label>Valor estimado</label><input id="l-val" type="text" inputmode="decimal" placeholder="0,00"/></div>
          <div class="field"><label>Moeda</label><select id="l-moeda">${this.moedaOptions(edit ? (l.moeda || 'BRL') : OB.moedaAtual())}</select></div>
        </div>
        <div class="nav-label" style="padding-left:0">${UI.icon('bell',13)} Lembrete de follow-up</div>
        <div class="grid-2">
          <div class="field"><label>Data</label><input type="date" id="l-fu-data" value="${fuData}"/></div>
          <div class="field"><label>Hora</label><input type="time" id="l-fu-hora" value="${fuHora}"/></div>
        </div>
        <div class="hint" style="margin-top:-6px;margin-bottom:12px">Defina quando falar com este cliente de novo: você recebe um alerta no sistema na data e hora marcadas. Deixe em branco para remover o lembrete.</div>
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
      // lembrete de follow-up: data obrigatória; hora padrão 09:00 se vazia
      const fuD = document.getElementById('l-fu-data').value;
      const fuH = document.getElementById('l-fu-hora').value;
      const followupEm = fuD ? new Date(`${fuD}T${fuH || '09:00'}`).toISOString() : null;
      Object.assign(obj, { nome, telefone: document.getElementById('l-tel').value.trim(), email: document.getElementById('l-email').value.trim(), servico: document.getElementById('l-serv').value, estagio: document.getElementById('l-est').value, valorEstimado: UI.money.parse(document.getElementById('l-val').value), moeda: lMoeda.value, obs: document.getElementById('l-obs').value.trim(), followupEm });
      if (followupEm) this._fuAvisados && this._fuAvisados.delete(obj.id + followupEm);
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
      </div>`).join('') : `<div class="chip green" style="margin-top:4px">Você já está no nível máximo (Black · 20%)</div>`;

    UI.modal({
      title: 'Sua comissão do mês',
      sub: `Nível ${r.nivel.nome} · taxa marginal ${(r.rate*100)|0}% · volume ${OB.fmt(r.volume)}`,
      body: `
        <div class="card" style="background:linear-gradient(135deg,var(--brand),var(--brand-600));color:#fff;border:none;margin-bottom:16px">
          <div style="font-size:12px;opacity:.85;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Disponível para solicitar agora</div>
          <div style="font-size:32px;font-weight:800;letter-spacing:-.02em;margin:2px 0 4px">${OB.fmt(r.disponivel)}</div>
          <div style="font-size:12px;opacity:.9">Liberada só de vendas com <b>pagamento confirmado</b> · taxa efetiva ${(r.efetiva*100).toFixed(1)}%</div>
        </div>
        ${linha('Em conferência', r.emConferencia, 'color:#d97706', 'Vendas aprovadas aguardando o admin confirmar o pagamento do cliente')}
        ${linha('Em análise pelo admin', r.emAnalise, 'color:var(--text)', 'Comissão já solicitada · repasse em até 3 dias úteis')}
        ${linha('Já pago no mês', r.jaPago, 'color:#1fa855')}
        <div class="nav-label" style="padding-left:0;margin-top:8px">${UI.icon('lock',12)} Bloqueado pelo sistema — desbloqueie batendo metas</div>
        ${bloqueadoHTML}
        <div class="notice" style="margin-top:14px">${UI.icon('shield',16)}<div>A comissão só fica <b>disponível para saque</b> depois que o cliente paga e o <b>administrador confirma o recebimento</b> no sistema. Até lá ela aparece em <b style="color:#d97706">Em conferência</b>. O cálculo é progressivo por faixa (8% a 20%) conforme o volume do mês.</div></div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button><button class="btn brand" id="cp-sol" ${r.disponivel <= 0 ? 'disabled' : ''}>${UI.icon('receipt',16)} Solicitar ${OB.fmt(r.disponivel)}</button>`
    });
    const sol = document.getElementById('cp-sol');
    if (sol) sol.onclick = () => { UI.closeModal(); this.solicitarComissao(OB.comissaoDisponivel(u.id)); };
  },

  solicitarComissao(com) {
    if (com.valor <= 0) return UI.toast('Nada disponível', 'Você não tem comissão liberada para solicitar', 'err');
    if (com.valor < OB.saqueMinimo()) return UI.toast('Abaixo do mínimo', 'Valor mínimo para saque é de ' + OB.fmt(OB.saqueMinimo()), 'err');
    UI.modal({
      title: 'Solicitar pagamento de comissão',
      sub: 'O administrador será notificado imediatamente',
      body: `
        <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>O pagamento é feito <b>em até 3 dias úteis</b>, mediante a comprovação do serviço e dos valores que entraram na conta da OutBox.</div></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Vendas incluídas</span><b>${com.vendas.length}</b></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Volume do mês</span><b>${OB.fmt(com.base)}</b></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Cálculo</span><b>Progressivo por faixa</b></div>
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
        detalhe: `${com.vendas.length} venda(s) · volume ${OB.fmt(com.base)} · progressivo`,
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
    // só permite excluir solicitações já finalizadas (recusadas / pagas)
    const podeExcluir = (r) => r.status === 'recusado' || r.status === 'pago';
    const html = `<div class="table-wrap" style="border:none"><table><thead><tr><th>Data</th><th>Tipo</th><th>Detalhe</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>
      ${reqs.map(r => { const st = stMap[r.status] || ['gray', r.status];
        const valorCel = r.tipo === 'comissao' ? `<span class="strong">${OB.fmt(r.valor)}</span>` : '<span class="mut">—</span>';
        return `<tr><td>${OB.dataBR(r.criadoEm)}</td><td>${tipoLabel(r)}</td>
        <td class="mut">${r.detalhe||'-'}</td><td>${valorCel}</td>
        <td><span class="chip ${st[0]}">${st[1]}</span></td>
        <td style="text-align:right">${podeExcluir(r) ? `<button class="iconbtn" data-del-req="${r.id}" title="Excluir do histórico">${UI.icon('trash',15)}</button>` : '<span class="mut" style="font-size:12px">em andamento</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>`;
    // delega os clicks após render
    setTimeout(() => {
      document.querySelectorAll('[data-del-req]').forEach(b => b.onclick = () => this.excluirSolicitacao(b.dataset.delReq));
    }, 0);
    return html;
  },

  /* excluir solicitação do histórico (só se já finalizada — recusada ou paga) */
  excluirSolicitacao(id) {
    const r = OB.requests().find(x => x.id === id); if (!r) return;
    if (r.status !== 'recusado' && r.status !== 'pago') return UI.toast('Não é possível excluir', 'Solicitação ainda em andamento', 'err');
    UI.confirm('Excluir do histórico', `Remover esta ${r.tipo === 'comissao' ? 'solicitação de comissão' : 'solicitação de prêmio'} do histórico? Esta ação não pode ser desfeita.`, () => {
      OB.removeRequest(id);
      UI.toast('Removido do histórico', '', 'ok');
      this.render(App.current || 'comissao');
    }, 'Excluir');
  },

  /* ====================== PREMIAÇÕES (bônus de campanha capado) ====================== */
  view_premiacoes() {
    const u = this.u();
    const vol = OB.volumeTrimestre(u.id);
    const bonus = OB.bonusCampanha(u.id);
    const reqs = OB.requestsOf(u.id).filter(r => r.tipo === 'premio');
    // bônus já solicitado/resgatado neste trimestre (consome o saldo)
    const claimed = reqs.filter(r => r.status !== 'recusado' && OB.isSameQuarter(r.criadoEm)).reduce((t, r) => t + (r.valor || 0), 0);
    const disp = Math.max(0, bonus - claimed);
    const faltaPiso = Math.max(0, OB.BONUS_PISO - vol);

    // próximo marco (alvo do gauge): se ainda não atingiu o piso, mostra até R$30k;
    // se já passou, mostra até o próximo prêmio que ainda não dá pra resgatar.
    const proxPremio = OB.PREMIOS.find(p => p.valor > disp);
    const usaPiso = faltaPiso > 0;
    const marcoNome = usaPiso ? 'destravar o bônus' : (proxPremio ? proxPremio.nome : 'todos os prêmios');
    const marcoValor = usaPiso ? OB.BONUS_PISO : (proxPremio ? proxPremio.valor : disp);
    const marcoAtual = usaPiso ? vol : disp;
    const pct = marcoValor > 0 ? Math.min(100, Math.round(marcoAtual / marcoValor * 100)) : 100;

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="cards cols-2" style="margin-bottom:18px">
        <div class="card">
          <div class="card-head"><h3>Bônus de campanha</h3><span class="chip brand">${UI.icon('target',13)} Trimestre</span></div>
          <div style="position:relative;height:170px;margin-top:4px"><canvas id="ch-gauge"></canvas>
            <div style="position:absolute;left:0;right:0;bottom:18px;text-align:center">
              <div style="font-size:30px;font-weight:800;color:var(--brand)">${pct}%</div>
              <div class="mut" style="font-size:13px">${usaPiso ? 'até destravar' : (proxPremio ? 'até ' + proxPremio.nome : 'completo')}</div>
            </div>
          </div>
          <div class="center" style="font-size:13px;margin-top:4px">
            <div class="soft">Disponível para resgatar</div>
            <div style="font-size:24px;font-weight:800;color:var(--brand);letter-spacing:-.01em">${OB.fmt(disp)}</div>
            <div class="mut" style="font-size:12px;margin-top:4px">
              ${usaPiso
                ? `Faltam <b style="color:var(--brand)">${OB.fmt(faltaPiso)}</b> em vendas para destravar`
                : (proxPremio
                  ? `Faltam <b style="color:var(--brand)">${OB.fmt(proxPremio.valor - disp)}</b> de bônus para o ${proxPremio.nome}`
                  : `Você pode resgatar qualquer prêmio da loja`)}
            </div>
          </div>
          <button class="btn green block" id="bonus-cash" style="margin-top:14px" ${disp < OB.saqueMinimo() ? 'disabled' : ''} title="${disp < OB.saqueMinimo() ? 'Valor mínimo para saque é de ' + OB.fmt(OB.saqueMinimo()) : ''}">${UI.icon('money',16)} Receber ${OB.fmt(disp)} em dinheiro</button>
          ${disp > 0 && disp < OB.saqueMinimo() ? `<div class="hint" style="text-align:center;margin-top:8px">Valor mínimo para saque é de <b>${OB.fmt(OB.saqueMinimo())}</b></div>` : ''}
        </div>
        <div class="card">
          <div class="card-head"><h3>Como funciona</h3></div>
          <div class="steps">
            <div class="step-row"><span class="n">1</span><div><b>Venda no trimestre</b><p>A cada venda aprovada, seu volume do trimestre cresce.</p></div></div>
            <div class="step-row"><span class="n">2</span><div><b>Acumule bônus</b><p>Tudo que passar de ${OB.fmt(OB.BONUS_PISO)} vira <b>${(OB.BONUS_PCT * 100)}% de bônus</b> de campanha.</p></div></div>
            <div class="step-row"><span class="n">3</span><div><b>Resgate</b><p>Troque o bônus por dinheiro ou por um prêmio da loja abaixo.</p></div></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px">
        <div class="card-head"><h3>Loja de prêmios</h3><span class="mut">Troque seu bônus por um destes itens</span></div>
        <div class="cards cols-4">
          ${OB.PREMIOS.map(p => {
            const ok = p.valor <= disp;
            return `<div class="prize card ${ok ? 'reached' : 'locked'}" style="padding:18px">
              <img src="${p.img}" alt="${p.nome}"/>
              <b>${p.nome}</b>
              <div style="margin:8px 0">${ok
                ? `<button class="btn brand sm" data-resgatar="${p.id}">${UI.icon('prize',14)} Resgatar</button>`
                : `<span class="chip gray">Continue vendendo</span>`}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Meus resgates</h3></div>
        ${this.reqList(reqs)}
      </div>`;

    // gauge meia-rosca animado (cresce até o marco atual)
    setTimeout(() => Charts.gauge('ch-gauge', marcoAtual, marcoValor || marcoAtual || 1), 50);

    document.getElementById('bonus-cash').onclick = () => this.resgatarBonus(disp);
    v.querySelectorAll('[data-resgatar]').forEach(b => b.onclick = () => {
      const premio = OB.PREMIOS.find(p => p.id === b.dataset.resgatar);
      if (premio && premio.valor <= disp) this.resgatarPremio(premio, disp);
    });
  },

  /* resgatar o bônus em dinheiro */
  resgatarBonus(disp) {
    if (disp <= 0) return;
    if (disp < OB.saqueMinimo()) return UI.toast('Abaixo do mínimo', 'Valor mínimo para saque é de ' + OB.fmt(OB.saqueMinimo()), 'err');
    UI.modal({
      title: 'Receber bônus em dinheiro',
      sub: 'O administrador será notificado para análise e repasse',
      body: `<div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Você vai resgatar <b>${OB.fmt(disp)}</b> de bônus de campanha. Pagamento em até 3 dias úteis após a comprovação.</div></div>
        <div class="field"><label>Chave PIX para recebimento <span class="req">*</span></label><input id="tp-pix" placeholder="CPF, e-mail, telefone ou chave aleatória"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="tp-go">Confirmar resgate</button>`
    });
    document.getElementById('tp-go').onclick = () => {
      const pix = document.getElementById('tp-pix').value.trim();
      if (!pix) return UI.toast('Informe a chave PIX', '', 'err');
      const u = this.u();
      OB.addRequest({
        id: OB.uid(), tipo: 'premio', modo: 'dinheiro', consultorId: u.id, consultorNome: u.nome + ' ' + u.sobrenome,
        valor: disp, detalhe: 'Bônus de campanha em dinheiro', pix, status: 'solicitado', criadoEm: new Date().toISOString()
      });
      UI.closeModal(); UI.toast('Resgate enviado', 'O administrador foi notificado', 'ok');
      this.render('premiacoes');
    };
  },

  /* resgatar um prêmio da loja (custa o valor do prêmio, descontado do bônus) */
  resgatarPremio(premio, disp) {
    UI.modal({
      title: 'Resgatar ' + premio.nome,
      sub: 'O administrador será notificado para análise e entrega',
      body: `<div class="prize reached" style="border:none;box-shadow:none;padding:0;margin-bottom:14px"><img src="${premio.img}" style="height:90px"/><b style="display:block;text-align:center;margin-top:8px">${premio.nome}</b></div>
        <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Você vai trocar parte do seu bônus de campanha pelo <b>${premio.nome}</b>. O administrador combinará a entrega com você.</div></div>
        <div class="field"><label>Endereço / observação para entrega</label><input id="tp-end" placeholder="Confirme seu endereço ou ponto de retirada"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="tp-go">Confirmar resgate</button>`
    });
    document.getElementById('tp-go').onclick = () => {
      const u = this.u();
      OB.addRequest({
        id: OB.uid(), tipo: 'premio', modo: 'produto', premioId: premio.id, premioNome: premio.nome,
        consultorId: u.id, consultorNome: u.nome + ' ' + u.sobrenome,
        valor: premio.valor, // custo p/ o admin (consome o bônus); não é exibido ao consultor
        detalhe: `Resgate do prêmio ${premio.nome}`, pix: document.getElementById('tp-end').value.trim(),
        status: 'solicitado', criadoEm: new Date().toISOString()
      });
      UI.closeModal(); UI.toast('Resgate enviado', 'O administrador foi notificado', 'ok');
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
    const cat = OB.PRODUTOS.map(p => `<tr><td><b>${p.nome}</b></td>${OB.PORTES.map(pt => `<td>${OB.brl(p.precos[pt.id])}</td>`).join('')}</tr>`).join('');
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
        id: 'catalogo', nome: 'Tabela de Preços por Porte', tag: 'Preços', icon: 'cart',
        desc: 'Preços fixos de cada serviço conforme o porte da empresa do cliente.',
        intro: 'Cada empresa paga conforme seu porte (classificação por faturamento). Cadastre o porte do cliente e o sistema já aplica o preço certo no orçamento.',
        secoes: [
          { icon: 'cart', titulo: 'Preços por porte', html: `<table class="doc-table"><thead><tr><th>Serviço</th>${OB.PORTES.map(p => `<th>${p.nome}</th>`).join('')}</tr></thead><tbody>${cat}</tbody></table>` },
          { icon: 'clients', titulo: 'Como classificar o porte', html: `<ul>${OB.PORTES.map(p => `<li><b>${p.nome}:</b> ${p.faixa}</li>`).join('')}</ul><p>Use o CNPJ/faturamento informado pela empresa. Na dúvida, comece pelo porte menor.</p>` },
          { icon: 'money', titulo: 'Sua comissão (progressiva por faixa, no mês)', html: '<ul><li><b>Bronze</b> — 8% até R$5.000</li><li><b>Prata</b> — 10% na faixa de R$5.000 a 15.000</li><li><b>Ouro</b> — 12% na faixa de R$15.000 a 30.000</li><li><b>Black</b> — 20% acima de R$30.000</li></ul><p>Cada faixa rende sua própria taxa (estilo imposto de renda). Além disso, tudo que passar de R$30.000 no trimestre vira 3% de bônus de campanha, resgatável em dinheiro ou prêmio.</p>' }
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
      <div>OutBox Soluções Digitais · Programa de Consultores<br><b>felipe@outboxgroup.com.br</b> · (47) 9.9659-7775</div>
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

  /* ====================== TREINAMENTOS (quiz gamificado) ====================== */
  view_treinamentos() {
    const v = document.getElementById('main-view');
    const u = this.u();
    const disp = TREINOS.disponiveis();
    const concluidos = disp.filter(p => OB.treinoProgress(p.id).melhorNota >= TREINOS.OBJETIVO).length;
    const pct = disp.length ? Math.round(concluidos / disp.length * 100) : 0;
    v.innerHTML = `
      <div class="card tr-hero" style="margin-bottom:18px">
        <div class="tr-hero-glow"></div>
        <div class="tr-hero-in">
          <div class="tr-hero-mark">${UI.icon('academy',30)}</div>
          <div class="grow">
            <span class="chip" style="background:rgba(255,255,255,.18);color:#fff;font-weight:700;border:none">OutBox Academy</span>
            <h2 style="font-size:24px;font-weight:800;letter-spacing:-.02em;margin:10px 0 4px;color:#fff">Treinamento de Produtos</h2>
            <p style="opacity:.92;font-size:14px;line-height:1.55;color:#fff;max-width:520px">Aprenda vendendo. Cada produto é um quiz, do básico ao avançado, com explicação em toda questão. Mire nos <b>${TREINOS.OBJETIVO}%</b> para ser aprovado e evoluir.</p>
          </div>
          <div class="tr-hero-stat">
            <div class="tr-ring" style="--p:${pct}"><span>${pct}%</span></div>
            <div class="tr-hero-stat-lbl">${concluidos} de ${disp.length} concluídos</div>
          </div>
        </div>
      </div>
      ${this.certificadosStrip(u.id)}
      <div class="nav-label" style="padding-left:0;margin-bottom:10px">Treinamentos de produto</div>
      <div class="cards cols-2" id="tr-grid">
        ${TREINOS.PRODUTOS.map(p => this.treinoCard(p)).join('')}
      </div>
      <div class="nav-label" style="padding-left:0;margin:22px 0 10px">Fundamentos de venda e sistema</div>
      <div class="cards cols-2">
        ${TREINOS.HABILIDADES.map(p => this.treinoCard(p)).join('')}
      </div>
      ${this.rankingHTML(u.id)}`;
    v.querySelectorAll('[data-treino]').forEach(el => el.onclick = () => this.treinoIntro(el.dataset.treino));
    this.bindCertificados(v);
    App.animateBars();
  },

  /* faixa de certificados: o certificado libera ao concluir o treinamento com aprovação (>= OBJETIVO) */
  certificadosStrip(consultorId) {
    const disp = TREINOS.disponiveis();
    const obj = TREINOS.OBJETIVO;
    const ok = disp.filter(p => OB.treinoProgress(p.id).melhorNota >= obj);
    const total = disp.length;
    const todos = total > 0 && ok.length === total;
    const hTot = TREINOS.horasTotais();
    return `<div class="card cert-card" style="margin-bottom:18px">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div class="row alc" style="gap:10px">
          <span class="tr-ic on">${UI.icon('shield',18)}</span>
          <div><b style="font-size:15px">Seus certificados</b><div class="mut" style="font-size:12px">${ok.length} de ${total} treinamentos concluídos · o certificado exige <b>${obj}%</b> de aproveitamento</div></div>
        </div>
        <button class="btn ${todos ? 'brand' : 'ghost'}" id="cert-geral" ${todos ? '' : 'disabled'} title="${todos ? 'Emitir o certificado geral da OutBox Academy (' + hTot + 'h)' : 'Conclua os ' + total + ' treinamentos com no mínimo ' + obj + '% em cada um para liberar o certificado geral'}">${UI.icon('prize',16)} Certificado geral${todos ? ' · ' + hTot + 'h' : ''}</button>
      </div>
      ${ok.length
        ? `<div class="cert-list" style="margin-top:12px">${ok.map(p => `<button class="cert-badge dl" data-cert="${p.id}" style="--mc:#C9A227" title="Emitir certificado de ${p.nome} (${TREINOS.horasDe(p.id)}h)">${UI.icon('download',13)} ${p.nome}</button>`).join('')}</div>`
        : ''}
      <div class="mut" style="font-size:12.5px;margin-top:10px;line-height:1.55">${UI.icon('info',12)} O certificado de cada treinamento é liberado ao concluí-lo com <b>${obj}%</b> ou mais de aproveitamento. O <b>certificado geral</b> só é emitido quando <b>100% dos ${total} treinamentos</b> estiverem concluídos, cada um com no mínimo <b>${obj}% de aprovação</b> (carga total de ${hTot} horas).</div>
    </div>`;
  },

  /* liga os botões de certificado (usado no hub e no perfil) */
  bindCertificados(root) {
    const r = root || document;
    const g = r.querySelector('#cert-geral');
    if (g && !g.disabled) g.onclick = () => this.emitirCertificadoGeral();
    r.querySelectorAll('[data-cert]').forEach(b => b.onclick = () => this.emitirCertificado(b.dataset.cert));
  },

  /* checa perfil (nome + doc) antes de emitir; retorna true se ok */
  _certPerfilOk() {
    const u = this.u();
    if (u.nome && u.doc) return true;
    UI.confirm('Complete seu perfil', 'Para emitir o certificado precisamos do seu <b>nome</b> e <b>CPF/CNPJ</b> preenchidos no perfil. Deseja completar agora?', () => App.go('perfil'), 'Ir ao perfil');
    return false;
  },

  emitirCertificado(treinoId) {
    const obj = TREINOS.OBJETIVO;
    const nota = OB.treinoProgress(treinoId).melhorNota;
    if (nota < obj) return UI.toast('Ainda não liberado', `Conclua este treinamento com no mínimo ${obj}% de aproveitamento para emitir o certificado.`, 'err');
    if (!this._certPerfilOk()) return;
    const t = TREINOS.buscar(treinoId);
    this._abrirCertificado(this.buildCertificadoHTML({ curso: t.nome, horas: TREINOS.horasDe(treinoId), nota, consultor: this.u() }));
  },

  emitirCertificadoGeral() {
    const obj = TREINOS.OBJETIVO;
    const disp = TREINOS.disponiveis();
    const faltam = disp.filter(p => OB.treinoProgress(p.id).melhorNota < obj);
    if (faltam.length) return UI.toast('Ainda não liberado', `Faltam ${faltam.length} treinamento(s) concluído(s) com no mínimo ${obj}% para o certificado geral.`, 'err');
    if (!this._certPerfilOk()) return;
    const media = Math.round(disp.reduce((s, p) => s + OB.treinoProgress(p.id).melhorNota, 0) / disp.length);
    this._abrirCertificado(this.buildCertificadoHTML({ geral: true, horas: TREINOS.horasTotais(), qtd: disp.length, media, consultor: this.u() }));
  },

  _abrirCertificado(html) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) { URL.revokeObjectURL(url); return UI.toast('Permita pop-ups', 'Libere pop-ups para abrir o certificado.', 'err'); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  /* certificado branded (HTML autossuficiente, paisagem, imprimir em PDF) */
  buildCertificadoHTML(o) {
    const u = o.consultor;
    const nome = `${u.nome || ''} ${u.sobrenome || ''}`.trim() || 'Consultor';
    const digs = (u.doc || '').replace(/\D/g, '');
    const docLabel = digs.length > 11 ? 'CNPJ' : 'CPF';
    const docFmt = (typeof UI !== 'undefined' && UI.maskDoc) ? UI.maskDoc(u.doc || '') : (u.doc || '');
    const hoje = new Date().toLocaleDateString('pt-BR');
    const mark = `<svg class="mk" viewBox="0 0 439 439" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="120" fill="#F15532"/><path fill="#fff" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#fff" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    const notaPct = o.geral ? (o.media != null ? o.media : 100) : (o.nota != null ? o.nota : 100);
    const sub = o.geral ? 'De Conclusão da Trilha' : 'De Conclusão';
    const desc = o.geral
      ? `concluiu integralmente a trilha de treinamentos da <b>OutBox Academy</b>, composta por <b>${o.qtd} treinamentos</b> e carga horária total de <b>${o.horas} horas</b>, com aproveitamento médio de <b>${notaPct}%</b> e nota mínima de 90% em cada treinamento, dominando os produtos e os fundamentos de venda da OutBox Soluções Digitais.`
      : `concluiu com aproveitamento de <b>${notaPct}%</b> o treinamento <b>${o.curso}</b> da OutBox Academy, com carga horária de <b>${o.horas} horas</b>, demonstrando domínio do produto e dos argumentos de venda.`;
    const selo = o.geral ? 'TRILHA' : 'APROVADO';
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Certificado OutBox Academy · ${nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700;800&family=Pinyon+Script&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet">
<style>@page{size:A4 landscape;margin:0}*{margin:0;padding:0;box-sizing:border-box}
:root{--brand:#F15532;--brand-dk:#C0371C;--ink:#241708;--ink-soft:#6b5d4d;--cream:#F7F1E7;--paper:#FFFDFA}
body{font-family:'Inter',sans-serif;background:#d9d2c6;color:var(--ink);display:flex;justify-content:center;padding:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cert{position:relative;width:1060px;max-width:100%;aspect-ratio:1.414/1;background:var(--cream);box-shadow:0 30px 80px rgba(60,40,20,.28);overflow:hidden}
.art{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.paper{position:absolute;inset:26px;background:var(--paper);z-index:2;overflow:hidden}
.paper::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(241,85,50,.028) 0 1px,transparent 1px 9px);opacity:.9}
.paper::after{content:'';position:absolute;inset:14px;border:1.5px solid rgba(36,23,8,.14)}
.in{position:absolute;inset:26px;z-index:4;display:flex;flex-direction:column;text-align:center;padding:30px 68px 20px}
.brand{display:flex;align-items:center;justify-content:center;gap:11px;flex:none}
.brand .mk{width:38px;height:38px;border-radius:11px;box-shadow:0 6px 16px rgba(241,85,50,.35)}
.brand b{font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1}
.brand span{display:block;font-size:8.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink-soft);font-weight:700;margin-top:2px}
.brand .bt{text-align:left}
.hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0}
h1{font-family:'Playfair Display',serif;font-size:60px;font-weight:900;letter-spacing:-.01em;line-height:.92;color:var(--ink)}
.subt{font-size:13.5px;font-weight:800;letter-spacing:.4em;text-transform:uppercase;color:var(--brand);margin-top:10px;padding-left:.4em}
.pres{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--ink-soft);margin-top:22px;letter-spacing:.02em}
.nome{font-family:'Pinyon Script',cursive;font-size:52px;line-height:1.05;color:var(--brand-dk);margin:0 0 4px;padding:0 20px;white-space:nowrap;max-width:100%}
.rule{width:min(540px,72%);height:1.5px;background:linear-gradient(90deg,transparent,rgba(36,23,8,.35),transparent);margin:2px auto 16px}
.desc{font-family:'Cormorant Garamond',serif;font-size:16.5px;line-height:1.5;color:#5a4c3c;max-width:620px;margin:0 auto;font-weight:600}.desc b{color:var(--ink);font-weight:700}
.horas{display:inline-flex;align-items:center;gap:8px;margin-top:14px;background:rgba(241,85,50,.1);color:var(--brand-dk);font-weight:800;font-size:11.5px;letter-spacing:.02em;padding:7px 17px;border-radius:999px;text-transform:uppercase}
.foot{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:26px;padding-top:16px}
.sign{min-width:0}
.sign .sig{font-family:'Pinyon Script',cursive;font-size:30px;line-height:1;color:var(--ink);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sign .ln{border-top:1.5px solid rgba(36,23,8,.55);padding-top:7px;margin-top:2px}
.sign b{font-size:13px;font-weight:800;color:var(--ink);display:block}
.sign span{display:block;font-size:9.5px;letter-spacing:.06em;color:var(--ink-soft);font-weight:600;margin-top:2px;text-transform:uppercase}
.seal{position:relative;width:112px;height:112px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
.seal svg{position:absolute;inset:0;width:100%;height:100%}
.seal .sc{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center}
.seal .pct{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;line-height:1}
.seal .sl{font-size:8px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;margin-top:2px;opacity:.95}
.seal .rib{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);display:flex;gap:5px}
.seal .rib i{display:block;width:11px;height:20px;background:var(--brand-dk);clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)}
.seal .rib i:last-child{background:var(--brand)}
.emit{flex:none;text-align:center;font-size:9px;letter-spacing:.05em;color:#b7a893;margin-top:12px}
.ph{position:fixed;bottom:16px;right:16px;background:var(--brand);color:#fff;padding:11px 18px;border-radius:10px;font-weight:700;cursor:pointer;border:none;box-shadow:0 8px 20px rgba(241,85,50,.35)}
@media print{body{background:#fff;padding:0}.cert{box-shadow:none;width:100%;height:100vh;aspect-ratio:auto}.ph{display:none}}</style></head>
<body><div class="cert">
  <svg class="art" viewBox="0 0 1414 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB454"/><stop offset="1" stop-color="#F15532"/></linearGradient>
      <linearGradient id="gB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7A18"/><stop offset="1" stop-color="#E8431C"/></linearGradient>
      <linearGradient id="gC" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#C0371C"/><stop offset="1" stop-color="#FF7A18"/></linearGradient>
      <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC978"/><stop offset="1" stop-color="#FF8A2B"/></linearGradient>
      <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3.4" fill="#F15532"/></pattern>
    </defs>
    <polygon points="1010,120 1414,0 1414,150" fill="url(#gL)"/>
    <polygon points="1414,0 1414,430 1010,120" fill="url(#gA)"/>
    <polygon points="1210,235 1414,165 1414,430" fill="url(#gB)"/>
    <polygon points="1160,0 1414,0 1250,150" fill="url(#gC)" opacity=".85"/>
    <polygon points="1250,470 1414,438 1414,470" fill="url(#gL)"/>
    <polygon points="1250,470 1414,438 1414,600" fill="url(#gB)"/>
    <polygon points="1414,1000 1414,690 1060,1000" fill="url(#gA)"/>
    <polygon points="1414,690 1414,1000 1250,1000" fill="url(#gB)"/>
    <polygon points="1060,1000 1250,845 1414,1000" fill="url(#gC)" opacity=".9"/>
    <polygon points="0,590 490,1000 0,1000" fill="url(#gA)"/>
    <polygon points="0,590 0,1000 250,1000" fill="url(#gB)"/>
    <polygon points="250,1000 490,1000 300,835" fill="url(#gL)"/>
    <polygon points="0,760 0,1000 210,1000" fill="url(#gC)" opacity=".9"/>
    <polygon points="60,430 300,360 150,600" fill="url(#gA)"/>
    <polygon points="60,430 150,600 30,560" fill="url(#gB)"/>
    <polygon points="0,0 300,0 0,215" fill="url(#gA)"/>
    <polygon points="0,0 175,0 0,120" fill="url(#gL)"/>
    <polygon points="0,120 0,215 175,0" fill="url(#gB)" opacity=".55"/>
    <rect x="600" y="40" width="150" height="72" fill="url(#dots)" opacity=".5"/>
    <rect x="770" y="330" width="120" height="96" fill="url(#dots)" opacity=".45"/>
    <rect x="470" y="560" width="120" height="72" fill="url(#dots)" opacity=".4"/>
    <rect x="150" y="235" width="96" height="72" fill="url(#dots)" opacity=".35"/>
  </svg>
  <div class="paper"></div>
  <div class="in">
    <div class="brand">${mark}<div class="bt"><b>OutBox Academy</b><span>Soluções Digitais</span></div></div>
    <div class="hero">
      <h1>Certificado</h1>
      <div class="subt">${sub}</div>
      <div class="pres">Certificamos com orgulho que</div>
      <div class="nome">${nome}</div>
      <div class="rule"></div>
      <div class="desc">${desc}</div>
      <div class="horas">Carga horária: ${o.horas} horas</div>
    </div>
    <div class="foot">
      <div class="sign"><div class="sig">Felipe Melo Rocha</div><div class="ln"><b>Felipe Melo Rocha</b><span>CEO · OutBox Group Soluções Digitais</span></div></div>
      <div class="seal">
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="sealg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A18"/><stop offset="1" stop-color="#E8431C"/></linearGradient></defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E0431C" stroke-width="12" stroke-dasharray="5.1 7.35"/>
          <circle cx="60" cy="60" r="47" fill="url(#sealg)"/>
          <circle cx="60" cy="60" r="47" fill="none" stroke="#fff" stroke-width="1.3" opacity=".45"/>
          <circle cx="60" cy="60" r="39" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="1.5 4" opacity=".85"/>
        </svg>
        <div class="sc"><span class="pct">${notaPct}%</span><span class="sl">${selo}</span></div>
        <div class="rib"><i></i><i></i></div>
      </div>
      <div class="sign"><div class="sig">${nome}</div><div class="ln"><b>${nome}</b><span>${docLabel}: ${docFmt || 'não informado'}</span></div></div>
    </div>
    <div class="emit">Emitido em ${hoje} · OutBox Academy · consultores.outboxgroup.com.br</div>
  </div>
</div><button class="ph" onclick="window.print()">Salvar como PDF / Imprimir</button></body></html>`;
  },

  /* ranking da equipe (RPC agregada) */
  rankingHTML(meId) {
    const rk = OB.rankingTreinos();
    if (!rk.length) return '';
    const medalPos = ['#C9A227', '#9AA3AD', '#B07B4F'];
    return `<div class="nav-label" style="padding-left:0;margin:22px 0 10px">${UI.icon('trend',13)} Ranking de treinamentos da equipe</div>
      <div class="card" style="padding:6px 4px">
        ${rk.slice(0, 8).map((r, i) => `
          <div class="rank-row ${r.consultor_id === meId ? 'me' : ''}">
            <span class="rank-pos" style="${i < 3 ? 'color:' + medalPos[i] + ';font-weight:800' : ''}">${i + 1}</span>
            <span class="rank-nome grow">${(r.nome || '').trim() || 'Consultor'}${r.consultor_id === meId ? ' <span class="chip brand" style="font-size:10px;padding:1px 6px">você</span>' : ''}</span>
            <span class="rank-stat"><b>${r.concluidos}</b> ${r.concluidos == 1 ? 'certificado' : 'certificados'}</span>
            <span class="rank-media">${r.media}%</span>
          </div>`).join('')}
      </div>
      <div class="hint" style="margin-top:8px">Ranking por certificados conquistados e média das notas. Treine mais para subir!</div>`;
  },

  treinoCard(p) {
    if (!p.disponivel) {
      return `<div class="card tr-card locked">
        <div class="row alc" style="gap:12px">
          <span class="tr-ic">${UI.icon(p.icon,20)}</span>
          <div class="grow"><b style="font-size:15px">${p.nome}</b><div class="mut" style="font-size:12px">Treinamento em produção</div></div>
          <span class="chip gray nowrap">Em breve</span>
        </div>
      </div>`;
    }
    const pr = OB.treinoProgress(p.id);
    const feito = pr.tentativas > 0;
    const aprovado = pr.melhorNota >= TREINOS.OBJETIVO;
    const med = feito ? TREINOS.medalha(pr.melhorNota) : null;
    const nq = (TREINOS.QUIZ[p.id] || { perguntas: [] }).perguntas.length;
    const status = !feito
      ? `<span class="chip brand nowrap">Novo</span>`
      : `<span class="chip ${aprovado ? 'green' : 'warn'} nowrap">${aprovado ? 'Aprovado' : 'Continue'} · ${pr.melhorNota}%</span>`;
    return `<div class="card tr-card avail" data-treino="${p.id}">
      <div class="row alc" style="gap:12px">
        <span class="tr-ic on">${UI.icon(p.icon,20)}</span>
        <div class="grow" style="min-width:0"><b style="font-size:15px">${p.nome}</b>
          <div class="mut tr-resumo" style="font-size:12px">${p.resumo || ''}</div></div>
        ${status}
      </div>
      <div class="row between alc" style="margin-top:12px">
        <span class="mut" style="font-size:12px">${nq} perguntas · básico ao avançado</span>
        <span class="tr-go">${feito ? 'Refazer' : 'Começar'} ${UI.icon('chevron',15)}</span>
      </div>
      ${feito ? `<div class="tr-medal-mini" style="--mc:${med.cor}">${UI.icon('prize',13)} ${med.nome}</div>` : ''}
    </div>`;
  },

  /* tela inicial do treinamento */
  treinoIntro(id) {
    const quiz = TREINOS.QUIZ[id]; const prod = TREINOS.PRODUTOS.find(p => p.id === id);
    if (!quiz || !prod) return;
    const pr = OB.treinoProgress(id);
    const v = document.getElementById('main-view'); v.scrollTop = 0; window.scrollTo(0, 0);
    v.innerHTML = `
      <button class="tr-back" id="tr-voltar">${UI.icon('chevron',16)} Voltar aos treinamentos</button>
      <div class="card quiz-card" style="max-width:640px;margin:0 auto">
        <div class="quiz-intro-mark">${UI.icon(prod.icon,28)}</div>
        <span class="chip brand" style="margin:0 auto;display:table">Treinamento de Produto</span>
        <h2 style="text-align:center;font-size:26px;font-weight:800;letter-spacing:-.02em;margin:12px 0 8px">${quiz.titulo}</h2>
        <p style="text-align:center;color:var(--text-soft);font-size:14px;line-height:1.6;max-width:520px;margin:0 auto 20px">${quiz.intro}</p>
        <div class="quiz-meta">
          <div><b>${quiz.perguntas.length}</b><span>perguntas</span></div>
          <div><b>${TREINOS.OBJETIVO}%</b><span>para aprovar</span></div>
          <div><b>${pr.tentativas ? pr.melhorNota + '%' : '—'}</b><span>sua melhor</span></div>
        </div>
        <button class="btn brand block" id="tr-start" style="margin-top:20px;height:52px;font-size:16px">${UI.icon('academy',18)} ${pr.tentativas ? 'Treinar de novo' : 'Começar treinamento'}</button>
        <button class="btn ghost block" id="tr-obj" style="margin-top:10px">${UI.icon('shield',16)} Revisão rápida de objeções</button>
        <div class="hint" style="text-align:center;margin-top:10px">Sem pressa. Cada resposta vem com uma explicação para você aprender.</div>
      </div>`;
    document.getElementById('tr-voltar').onclick = () => this.render('treinamentos');
    document.getElementById('tr-start').onclick = () => this.iniciarTreino(id);
    document.getElementById('tr-obj').onclick = () => this.treinoObjecoes(id);
  },

  /* modo objeções: flashcards só das questões avançadas (objeções/venda), sem nota */
  treinoObjecoes(id) {
    const quiz = TREINOS.QUIZ[id]; const prod = TREINOS.PRODUTOS.find(p => p.id === id);
    if (!quiz) return;
    const objs = quiz.perguntas.filter(p => p.nivel === 'avancado');
    const v = document.getElementById('main-view'); v.scrollTop = 0; window.scrollTo(0, 0);
    v.innerHTML = `
      <button class="tr-back" id="tr-voltar">${UI.icon('chevron',16)} Voltar ao treinamento</button>
      <div style="max-width:660px;margin:0 auto">
        <div class="card" style="text-align:center;padding:22px 20px;margin-bottom:14px;background:linear-gradient(135deg,#1a1207,var(--brand-600));color:#fff;border:none">
          <span class="chip" style="background:rgba(255,255,255,.18);color:#fff;font-weight:700;border:none">Revisão rápida</span>
          <h2 style="font-size:20px;font-weight:800;margin:10px 0 4px;color:#fff">Objeções de ${prod.nome}</h2>
          <p style="opacity:.9;font-size:13px;color:#fff;max-width:440px;margin:0 auto">Bata o olho antes da reunião. Cada card traz a objeção do cliente e a melhor resposta.</p>
        </div>
        ${objs.map((p, i) => `
          <div class="card obj-card" style="margin-bottom:12px">
            <div class="obj-q">${UI.icon('help',16)} <span>${p.q}</span></div>
            <div class="obj-a"><b>Melhor resposta:</b> ${p.ops[p.correta]}</div>
            <div class="obj-e">${p.exp}</div>
          </div>`).join('')}
      </div>`;
    document.getElementById('tr-voltar').onclick = () => this.treinoIntro(id);
  },

  iniciarTreino(id) {
    this._quiz = { id, i: 0, respostas: [], ordem: [] };
    this.treinoPergunta();
  },

  /* Fisher-Yates: retorna [0..n-1] em ordem aleatória (embaralha alternativas) */
  _embaralhar(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  treinoPergunta() {
    const st = this._quiz; const quiz = TREINOS.QUIZ[st.id];
    const total = quiz.perguntas.length; const p = quiz.perguntas[st.i];
    const niv = TREINOS.NIVEIS[p.nivel] || TREINOS.NIVEIS.basico;
    const pct = Math.round(st.i / total * 100);
    // ordem embaralhada das alternativas (estável durante a tentativa)
    let ordem = st.ordem[st.i];
    if (!ordem) { ordem = this._embaralhar(p.ops.length); st.ordem[st.i] = ordem; }
    const v = document.getElementById('main-view'); v.scrollTop = 0; window.scrollTo(0, 0);
    v.innerHTML = `
      <div class="quiz-top">
        <button class="tr-back" id="tr-sair">${UI.icon('x',15)} Sair</button>
        <span class="quiz-count">Pergunta ${st.i + 1} de ${total}</span>
        <span class="chip ${niv.chip} nowrap">${niv.nome}</span>
      </div>
      <div class="qbar"><i data-w="${pct}"></i></div>
      <div class="card quiz-card" style="max-width:660px;margin:16px auto 0" id="quiz-q">
        <h2 class="quiz-q">${p.q}</h2>
        <div class="quiz-ops" id="quiz-ops">
          ${ordem.map((orig, disp) => `<button class="opt" data-op="${orig}"><span class="opt-k">${String.fromCharCode(65 + disp)}</span><span class="opt-t">${p.ops[orig]}</span></button>`).join('')}
        </div>
        <div id="quiz-fb"></div>
      </div>`;
    App.animateBars();
    document.getElementById('tr-sair').onclick = () => UI.confirm('Sair do treinamento', 'Seu progresso nesta rodada será perdido. Deseja sair?', () => this.render('treinamentos'), 'Sair');
    document.querySelectorAll('#quiz-ops .opt').forEach(b => b.onclick = () => this.treinoResponder(parseInt(b.dataset.op)));
  },

  treinoResponder(idx) {
    const st = this._quiz; const quiz = TREINOS.QUIZ[st.id]; const p = quiz.perguntas[st.i];
    if (st.respostas[st.i] != null) return; // já respondeu
    st.respostas[st.i] = idx;
    const acertou = idx === p.correta;
    const ops = document.querySelectorAll('#quiz-ops .opt');
    ops.forEach((b) => {
      const opIdx = parseInt(b.dataset.op);
      b.classList.add('done');
      if (opIdx === p.correta) b.classList.add('correct');
      else if (opIdx === idx) b.classList.add('wrong');
    });
    const total = quiz.perguntas.length; const ultima = st.i === total - 1;
    document.getElementById('quiz-fb').innerHTML = `
      <div class="exp-box ${acertou ? 'ok' : 'no'}">
        <div class="exp-head">${UI.icon(acertou ? 'check' : 'info', 18)} ${acertou ? 'Boa! Resposta certa.' : 'Quase. Veja o porquê:'}</div>
        <p>${p.exp}</p>
      </div>
      <button class="btn brand block" id="quiz-next" style="margin-top:16px;height:48px">${ultima ? 'Ver meu resultado' : 'Próxima pergunta'} ${UI.icon('chevron',16)}</button>`;
    document.getElementById('quiz-fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('quiz-next').onclick = () => {
      if (ultima) { this.treinoResultado(); }
      else { st.i++; this.treinoPergunta(); }
    };
  },

  treinoResultado() {
    const st = this._quiz; const quiz = TREINOS.QUIZ[st.id]; const prod = TREINOS.PRODUTOS.find(p => p.id === st.id);
    const total = quiz.perguntas.length;
    const acertos = quiz.perguntas.reduce((n, p, k) => n + (st.respostas[k] === p.correta ? 1 : 0), 0);
    const nota = Math.round(acertos / total * 100);
    const aprovado = nota >= TREINOS.OBJETIVO;
    const med = TREINOS.medalha(nota);
    const antes = OB.treinoProgress(st.id).melhorNota;
    const recorde = nota > antes;
    OB.saveTreino(st.id, nota); // persiste melhor nota + tentativa
    App.refreshCommission && App.refreshCommission();
    const v = document.getElementById('main-view'); v.scrollTop = 0; window.scrollTo(0, 0);
    v.innerHTML = `
      <div class="card quiz-card quiz-result ${aprovado ? 'ok' : ''}" style="max-width:640px;margin:0 auto">
        <div class="medal" style="--mc:${med.cor}">${UI.icon('prize',40)}</div>
        <div class="quiz-score">${nota}<span>%</span></div>
        <h2 style="text-align:center;font-size:22px;font-weight:800;margin:2px 0 4px">${med.nome}</h2>
        <p style="text-align:center;color:var(--text-soft);font-size:14px;max-width:420px;margin:0 auto 4px">${med.sub}</p>
        ${recorde ? `<div class="chip green" style="margin:8px auto 0;display:table">${UI.icon('trend',13)} Novo recorde pessoal!</div>` : ''}
        <div class="quiz-meta" style="margin-top:18px">
          <div><b>${acertos}/${total}</b><span>acertos</span></div>
          <div><b>${aprovado ? 'Sim' : 'Ainda não'}</b><span>aprovado</span></div>
          <div><b>${Math.max(nota, antes)}%</b><span>melhor nota</span></div>
        </div>
        ${Math.max(nota, antes) >= TREINOS.OBJETIVO
          ? `<button class="btn block" id="tr-cert" style="margin-top:16px;height:50px;background:linear-gradient(135deg,#C9A227,#b8901f);color:#fff;box-shadow:0 8px 20px rgba(201,162,39,.3)">${UI.icon('prize',18)} Emitir certificado deste treinamento</button>`
          : `<div class="hint" style="text-align:center;margin-top:14px">${UI.icon('prize',13)} Alcance <b>${TREINOS.OBJETIVO}%</b> de aproveitamento para emitir o certificado deste treinamento.</div>`}
        <div class="row" style="gap:10px;margin-top:16px;flex-wrap:wrap">
          <button class="btn brand grow" id="tr-refazer" style="height:48px">${UI.icon('academy',16)} Treinar de novo</button>
          <button class="btn ghost" id="tr-revisar" style="height:48px">${UI.icon('eye',16)} Revisar respostas</button>
        </div>
        <button class="btn ghost block" id="tr-home" style="margin-top:10px">Voltar aos treinamentos</button>
      </div>
      <div id="tr-review" style="max-width:640px;margin:16px auto 0"></div>`;
    document.getElementById('tr-refazer').onclick = () => this.treinoIntro(st.id);
    document.getElementById('tr-home').onclick = () => this.render('treinamentos');
    document.getElementById('tr-revisar').onclick = () => this.treinoRevisar();
    const cbtn = document.getElementById('tr-cert');
    if (cbtn) cbtn.onclick = () => this.emitirCertificado(st.id);
  },

  treinoRevisar() {
    const st = this._quiz; const quiz = TREINOS.QUIZ[st.id];
    const box = document.getElementById('tr-review');
    if (box.dataset.open === '1') { box.innerHTML = ''; box.dataset.open = '0'; return; }
    box.dataset.open = '1';
    box.innerHTML = `<div class="nav-label" style="padding-left:0;margin-bottom:10px">Revisão das respostas</div>` +
      quiz.perguntas.map((p, k) => {
        const resp = st.respostas[k]; const acertou = resp === p.correta;
        return `<div class="card" style="margin-bottom:10px">
          <div class="row alc" style="gap:10px;align-items:flex-start">
            <span class="rev-ic ${acertou ? 'ok' : 'no'}">${UI.icon(acertou ? 'check' : 'x', 14)}</span>
            <div class="grow"><b style="font-size:14px">${k + 1}. ${p.q}</b>
              <div style="font-size:13px;margin-top:6px;color:var(--text-soft)">Resposta certa: <b style="color:#1fa855">${p.ops[p.correta]}</b></div>
              ${!acertou && resp != null ? `<div style="font-size:13px;color:var(--text-mut)">Você marcou: ${p.ops[resp]}</div>` : ''}
              <div class="mut" style="font-size:12.5px;margin-top:6px;line-height:1.5">${p.exp}</div>
            </div>
          </div>
        </div>`;
      }).join('');
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /* ====================== E-BOOKS ====================== */
  /* catálogo: para publicar um novo e-book, adicione o PDF + capa em
     assets/ebooks/ e inclua um item aqui. Entra sozinho na tela. */
  EBOOKS: [
    { id: 'energia-dinheiro', titulo: 'Libere a energia do dinheiro dentro de você', autor: 'Mayra Maximiano', categoria: 'Dinheiro & Prosperidade', desc: 'Entenda o processo emocional que atrai e afasta sua prosperidade.', paginas: 79, capa: 'assets/ebooks/energia-dinheiro-capa.jpg', arquivo: 'assets/ebooks/libere-a-energia-do-dinheiro.pdf' },
    { id: '4-armas', titulo: '4 Armas Para Ir Pra Guerra', autor: 'Pablo Marçal', categoria: 'Mentalidade & Superação', desc: 'As armas mentais para encarar qualquer batalha da vida.', paginas: 16, capa: 'assets/ebooks/4-armas-capa.jpg', arquivo: 'assets/ebooks/4-armas.pdf' },
    { id: 'antimedo', titulo: 'Antimedo: Ative a Invencibilidade', autor: 'Pablo Marçal', categoria: 'Inteligência Emocional', desc: 'Transforme o medo em combustível e ative a sua invencibilidade.', paginas: 119, capa: 'assets/ebooks/antimedo-capa.jpg', arquivo: 'assets/ebooks/antimedo.pdf' },
    { id: 'biblia-nao-leu', titulo: 'A Bíblia Que Você Não Leu', autor: 'Pablo Marçal · Eduardo Reis', categoria: 'Espiritualidade', desc: 'Uma leitura provocadora das escrituras. Proibido para religiosos.', paginas: 93, capa: 'assets/ebooks/biblia-nao-leu-capa.jpg', arquivo: 'assets/ebooks/biblia-nao-leu.pdf' },
    { id: 'chave-mestra-universo', titulo: 'A Chave Mestra do Universo', autor: 'Pablo Marçal', categoria: 'Mentalidade & Superação', desc: '85% dos seus resultados dependem das suas conexões humanas.', paginas: 150, capa: 'assets/ebooks/chave-mestra-universo-capa.jpg', arquivo: 'assets/ebooks/chave-mestra-universo.pdf' },
    { id: 'codigos-do-milhao', titulo: 'Os Códigos do Milhão', autor: 'Pablo Marçal', categoria: 'Dinheiro & Prosperidade', desc: 'Como desbloquear as vias neurais da riqueza.', paginas: 161, capa: 'assets/ebooks/codigos-do-milhao-capa.jpg', arquivo: 'assets/ebooks/codigos-do-milhao.pdf' },
    { id: 'cuidar-da-sua-vida', titulo: 'Vá Cuidar da Sua Vida', autor: 'Pablo Marçal', categoria: 'Mentalidade & Superação', desc: 'Assuma o controle e pare de terceirizar a sua própria vida.', paginas: 173, capa: 'assets/ebooks/cuidar-da-sua-vida-capa.jpg', arquivo: 'assets/ebooks/cuidar-da-sua-vida.pdf' },
    { id: 'destravar-digital', titulo: 'Destravar Digital', autor: 'Pablo Marçal', categoria: 'Mundo Digital', desc: 'Os caminhos para crescer e monetizar no mundo digital.', paginas: 65, capa: 'assets/ebooks/destravar-digital-capa.jpg', arquivo: 'assets/ebooks/destravar-digital.pdf' },
    { id: 'destravar-ie', titulo: 'O Destravar da Inteligência Emocional', autor: 'Pablo Marçal', categoria: 'Inteligência Emocional', desc: 'Domine suas emoções e tome decisões melhores todos os dias.', paginas: 202, capa: 'assets/ebooks/destravar-ie-capa.jpg', arquivo: 'assets/ebooks/destravar-ie.pdf' },
    { id: 'lavagem-cerebral', titulo: 'Lavagem Cerebral', autor: 'Pablo Marçal', categoria: 'Inteligência Emocional', desc: 'Uso diário para a gestão das emoções negativas.', paginas: 125, capa: 'assets/ebooks/lavagem-cerebral-capa.jpg', arquivo: 'assets/ebooks/lavagem-cerebral.pdf' },
    { id: 'saia-do-caixao', titulo: 'Saia do Caixão', autor: 'Pablo Marçal', categoria: 'Mentalidade & Superação', desc: 'Quebre as regras dos zumbis e ative os princípios do criador.', paginas: 90, capa: 'assets/ebooks/saia-do-caixao-capa.jpg', arquivo: 'assets/ebooks/saia-do-caixao.pdf' },
    { id: 'saia-do-deserto', titulo: 'Saia do Deserto', autor: 'Pablo Marçal', categoria: 'Dinheiro & Prosperidade', desc: 'Os códigos para vencer a crise financeira.', paginas: 212, capa: 'assets/ebooks/saia-do-deserto-capa.jpg', arquivo: 'assets/ebooks/saia-do-deserto.pdf' },
    { id: 'sete-camadas-identidade', titulo: 'As Sete Camadas da Identidade', autor: 'Pablo Marçal', categoria: 'Mentalidade & Superação', desc: 'Descubra e reconstrua quem você realmente é.', paginas: 76, capa: 'assets/ebooks/sete-camadas-identidade-capa.jpg', arquivo: 'assets/ebooks/sete-camadas-identidade.pdf' }
  ],

  view_ebooks() {
    const v = document.getElementById('main-view');
    const itens = this.EBOOKS.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt', { sensitivity: 'base' }));
    if (!itens.length) { v.innerHTML = this.empty('book', 'Nenhum e-book ainda', 'Os e-books disponibilizados pela OutBox aparecem aqui.'); return; }
    // regra: o catálogo fica SEMPRE à mostra (gera desejo), mas só libera ler/baixar após a primeira venda aprovada
    const liberado = OB.fezPrimeiraVenda(this.u().id);
    const cats = [...new Set(itens.map(e => e.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
    const aviso = liberado ? '' : `
      <div class="ebook-aviso">
        <span class="ebook-aviso__ic">${UI.icon('lock',20)}</span>
        <div class="ebook-aviso__txt">
          <b>Sua biblioteca está a uma venda de distância</b>
          <span>Todos os e-books abaixo liberam para leitura e download assim que você registra a sua primeira venda.</span>
        </div>
        <button class="btn brand" id="eb-vender">${UI.icon('cart',15)} Lançar minha primeira venda</button>
      </div>`;
    const acoes = e => liberado
      ? `<a class="btn ghost" href="${e.arquivo}" target="_blank" rel="noopener" title="Ler agora em nova aba">${UI.icon('eye',15)} Ler</a>
         <a class="btn brand grow" href="${e.arquivo}" download title="Baixar o PDF">${UI.icon('download',15)} Baixar e-book</a>`
      : `<button class="btn ghost" disabled title="Liberado após a sua primeira venda">${UI.icon('eye',15)} Ler</button>
         <button class="btn brand grow" disabled title="Liberado após a sua primeira venda">${UI.icon('lock',15)} Baixar e-book</button>`;
    v.innerHTML = `
      ${aviso}
      <div class="port-filtros" id="eb-filtros">
        <button type="button" class="port-chip on" data-cat="">Todos</button>
        ${cats.map(c => `<button type="button" class="port-chip" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="ebook-grid${liberado ? '' : ' is-locked'}">
        ${itens.map(e => `
          <div class="card ebook-card${liberado ? '' : ' locked'}" data-cat="${e.categoria || ''}">
            <div class="ebook-capa">
              <img src="${e.capa}" alt="Capa do e-book ${e.titulo}" loading="lazy"/>
              ${e.categoria ? `<span class="ebook-tag">${e.categoria}</span>` : ''}
            </div>
            <div class="ebook-info">
              <b>${e.titulo}</b>
              <span class="ebook-autor">${e.autor}${e.paginas ? ' · ' + e.paginas + ' páginas' : ''}</span>
              <p>${e.desc || ''}</p>
              <div class="row" style="gap:8px;margin-top:auto">
                ${acoes(e)}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    const bar = document.getElementById('eb-filtros');
    const grid = v.querySelector('.ebook-grid');
    bar.querySelectorAll('.port-chip').forEach(chip => chip.onclick = () => {
      bar.querySelectorAll('.port-chip').forEach(c => c.classList.toggle('on', c === chip));
      const cat = chip.dataset.cat;
      grid.querySelectorAll('.ebook-card').forEach(card => { card.style.display = (!cat || card.dataset.cat === cat) ? '' : 'none'; });
    });
    if (!liberado) {
      const b = document.getElementById('eb-vender'); if (b) b.onclick = () => App.go('comissao');
    }
  },

  /* ====================== PROJETOS / BRIEFING / ENTREGA ====================== */
  /* timeline horizontal das 6 etapas */
  timelineHTML(proj) {
    const atual = OB.etapaIndex(proj.status);
    return `<div class="tl">
      ${OB.ETAPAS_PROJETO.map((e, i) => {
        const feito = i <= atual;
        const data = proj[e.campo] ? OB.dataBR(proj[e.campo]) : '';
        const cls = i < atual ? 'done' : (i === atual ? 'now' : 'todo');
        return `<div class="tl-step ${cls}">
          <div class="tl-dot">${feito ? UI.icon(i === atual ? e.icon : 'check', 13) : (i + 1)}</div>
          <div class="tl-lbl">${e.nome}</div>
          <div class="tl-date">${data || '&nbsp;'}</div>
        </div>`;
      }).join('<div class="tl-line"></div>')}
    </div>`;
  },

  view_projetos() {
    const u = this.u();
    const v = document.getElementById('main-view');
    // serviços vendidos e pagos = entregáveis (1 venda aprovada e recebida = 1 projeto)
    const vendas = OB.salesOf(u.id).filter(s => s.statusProposta === 'aprovada').sort((a, b) => new Date(b.data) - new Date(a.data));
    const pagas = vendas.filter(s => s.statusPagamento === 'recebido');
    const aguardando = vendas.filter(s => s.statusPagamento !== 'recebido');
    const projs = OB.projetosDe(u.id);
    const emAndamento = projs.filter(p => p.status !== 'aprovado').length;
    const concluidos = projs.filter(p => p.status === 'aprovado').length;

    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:16px">
        ${this.kpi('rocket', emAndamento, 'Projetos em andamento', 'Do briefing à entrega')}
        ${this.kpi('check', concluidos, 'Projetos concluídos', 'Aprovados pelo cliente')}
        ${this.kpi('clock', aguardando.length, 'Aguardando pagamento', 'Briefing libera após o pagamento')}
      </div>
      <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Assim que o cliente <b>paga o serviço</b>, envie o briefing. O cliente preenche, a OutBox produz e você acompanha cada etapa aqui, podendo emitir relatórios para o seu cliente.</div></div>
      ${this.bibliotecaBriefings()}
      ${pagas.length ? `<div class="nav-label" style="padding-left:0">Serviços pagos, prontos para o briefing</div>${pagas.map(s => this.projetoCard(s)).join('')}` : ''}
      ${aguardando.length ? `<div class="nav-label" style="padding-left:0;margin-top:18px">Aguardando confirmação de pagamento</div>${aguardando.map(s => this.projetoCard(s)).join('')}` : ''}
      ${!vendas.length ? this.empty('briefcase', 'Nenhum projeto ainda', 'Lance uma venda aprovada. Quando o pagamento for confirmado, você envia o briefing por aqui.') : ''}`;

    v.querySelectorAll('[data-brief]').forEach(b => b.onclick = () => this.enviarBriefing(b.dataset.brief));
    v.querySelectorAll('[data-brief-recebido]').forEach(b => b.onclick = () => this.marcarBriefingRecebido(b.dataset.briefRecebido));
    v.querySelectorAll('[data-relatorio]').forEach(b => b.onclick = () => this.emitirRelatorio(b.dataset.relatorio));
    v.querySelectorAll('[data-aprovar-proj]').forEach(b => b.onclick = () => this.aprovarProjeto(b.dataset.aprovarProj));
    v.querySelectorAll('[data-share-final]').forEach(b => b.onclick = () => this.compartilharLinkFinal(b.dataset.shareFinal));
    v.querySelectorAll('[data-copylink]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.copylink).then(() => UI.toast('Link copiado', '', 'ok')));
  },

  /* Ranking de consultores (compartilhado com o admin via App.renderRanking) */
  view_ranking() { App.renderRanking(document.getElementById('main-view'), this.u().id); },

  /* biblioteca: cada briefing pronto vira um cartão estilo crachá (layout da referência Itaú) */
  bibliotecaBriefings() {
    const cards = OB.BRIEFINGS_PRONTOS.map(b => {
      const link = OB.briefingLinkTipo(b.tipo);
      const cid = 'cl-' + b.tipo;
      return `<div class="brief-cell">
        <a class="bcard" href="${link}" target="_blank" rel="noopener" title="Abrir briefing · ${b.nome}">
          <svg class="bcard__shape" viewBox="0 0 210 340" preserveAspectRatio="none" aria-hidden="true">
            <defs><clipPath id="${cid}" clipPathUnits="userSpaceOnUse"><path d="${this.BCARD_SHAPE}"/></clipPath></defs>
            <g clip-path="url(#${cid})">
              <image href="assets/briefings/${b.tipo}.jpg" x="0" y="0" width="210" height="340" preserveAspectRatio="xMidYMid slice"/>
            </g>
          </svg>
          <span class="bcard__hash">#TudoPassa.AVendaNão</span>
          <div class="bcard__foot">
            <img class="bcard__mark" src="assets/logo-mark.svg" alt="OutBox"/>
            <div class="bcard__id"><span class="bcard__kicker">Briefing</span><b>${b.nome}</b></div>
          </div>
        </a>
        <div class="brief-cell-actions">
          <button type="button" class="btn ghost sm" data-copylink="${link}" aria-label="Copiar link do briefing de ${b.nome}">${UI.icon('docs',15)}<span>Copiar</span></button>
          <a class="btn ghost sm" href="${link}" target="_blank" rel="noopener" aria-label="Abrir briefing de ${b.nome} em nova guia">${UI.icon('external',15)}<span>Abrir</span></a>
        </div>
      </div>`;
    }).join('');
    return `<div class="card" style="margin-bottom:18px">
      <div class="row alc" style="gap:8px;margin-bottom:4px">${UI.icon('briefcase',16)}<b>Biblioteca de briefings</b></div>
      <p class="mut" style="font-size:12.5px;margin-bottom:16px">Todos os briefings prontos. Clique no cartão para abrir ou copie o link para enviar ao cliente. Para receber as respostas aqui dentro, use <b>Enviar briefing</b> no serviço pago.</p>
      <div class="brief-cards">${cards}</div>
    </div>`;
  },

  /* ====================== CRIATIVOS (artes p/ redes sociais) ====================== */
  _attr(s) { return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
  criCopyRow(label, text, lines) {
    if (!text) return '';
    const a = this._attr(text);
    return `<button type="button" class="cri-copy" data-copy="${a}" data-label="${this._attr(label)}" title="Copiar ${label.toLowerCase()}">
      <span class="cri-copy-txt"><span class="cri-copy-lbl">${label}</span><span class="cri-copy-val" style="--l:${lines || 2}">${a}</span></span>
      <span class="cri-copy-ic">${UI.icon('docs',14)}</span></button>`;
  },
  criativoCard(c) {
    const novo = c.criadoEm && (Date.now() - new Date(c.criadoEm).getTime()) < 7 * 864e5;
    const cats = OB.criativoCategorias(c);
    return `<div class="cri-card" data-cat="${cats.map(x => x.toLowerCase()).join('|')}">
      ${novo ? '<span class="cri-novo">Novo</span>' : ''}
      <div class="cri-info">
        <div class="cri-head"><b>${c.titulo || 'Criativo OutBox'}</b></div>
        <div class="cri-cats">${cats.map(x => `<span class="cri-cat">${x}</span>`).join('')}</div>
      </div>
      <div class="cri-slot">
        <div class="cri-thumb loading" style="aspect-ratio:4 / 5">
          <img data-cri="${c.id}|feed" alt="Arte de feed ${c.titulo || ''}" loading="lazy"/>
          <span class="cri-badge">4:5 · Feed</span>
        </div>
        <button class="btn brand grow" data-cri-dl="${c.id}|feed">${UI.icon('download',15)} Baixar arte do feed</button>
        <div class="cri-copies">
          ${this.criCopyRow('Título', c.titulo, 1)}
          ${this.criCopyRow('Legenda', c.legenda, 2)}
          ${this.criCopyRow('Hashtags', c.hashtags, 2)}
        </div>
      </div>
      <div class="cri-slot cri-slot-stories">
        <div class="cri-thumb loading" style="aspect-ratio:9 / 16">
          <img data-cri="${c.id}|stories" alt="Arte de stories ${c.titulo || ''}" loading="lazy"/>
          <span class="cri-badge">9:16 · Stories</span>
        </div>
        <button class="btn brand grow" data-cri-dl="${c.id}|stories">${UI.icon('download',15)} Baixar arte de stories</button>
      </div>
    </div>`;
  },
  view_criativos() {
    const v = document.getElementById('main-view');
    const itens = OB.criativosAtivos();
    if (!itens.length) { v.innerHTML = this.empty('creative', 'Nenhum criativo ainda', 'Assim que a OutBox publicar novas artes para você postar, elas aparecem aqui prontas para baixar em cada formato (feed, stories e mais).'); return; }
    const cats = OB.CRIATIVO_CATEGORIAS.filter(ct => itens.some(c => OB.criativoCategorias(c).includes(ct)));
    v.innerHTML = `
      <div class="cri-hero">
        <div class="cri-hero-ic">${UI.icon('creative',22)}</div>
        <div><b>Criativos para as suas redes</b><p>Baixe as artes oficiais da OutBox nos formatos feed (4:5) e stories (9:16) e publique no seu Instagram, WhatsApp e demais canais.</p></div>
      </div>
      ${cats.length > 1 ? `<div class="port-filtros" id="cri-cat"><button type="button" class="port-chip on" data-cat="">Todas as categorias</button>${cats.map(ct => `<button type="button" class="port-chip" data-cat="${ct.toLowerCase()}">${ct}</button>`).join('')}</div>` : ''}
      <div class="cri-grid" id="cri-grid">${itens.map(c => this.criativoCard(c)).join('')}</div>
      <div id="cri-empty" hidden>${this.empty('creative', 'Nada neste filtro', 'Ajuste os filtros para ver os criativos.')}</div>`;
    // carrega as imagens (feed + stories) sob demanda
    const carregarImg = (id, tipo) => OB.getCriativoImagem(id, tipo).then(src => {
      if (!src) return;
      const img = v.querySelector(`img[data-cri="${id}|${tipo}"]`);
      if (img) { img.src = src; const t = img.closest('.cri-thumb'); if (t) t.classList.remove('loading'); }
    });
    itens.forEach(c => { carregarImg(c.id, 'feed'); carregarImg(c.id, 'stories'); });
    // filtro por categoria
    const aplicar = () => {
      const catEl = v.querySelector('#cri-cat .port-chip.on');
      const cat = catEl ? catEl.dataset.cat : '';
      let vis = 0;
      v.querySelectorAll('#cri-grid .cri-card').forEach(card => {
        const ok = (!cat || (card.dataset.cat || '').split('|').includes(cat));
        card.style.display = ok ? '' : 'none'; if (ok) vis++;
      });
      const emp = document.getElementById('cri-empty'); if (emp) emp.hidden = vis > 0;
      const grid = document.getElementById('cri-grid'); if (grid) grid.hidden = vis === 0;
    };
    v.querySelectorAll('#cri-cat .port-chip').forEach(b => b.onclick = () => { v.querySelectorAll('#cri-cat .port-chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); aplicar(); });
    // baixar + copiar (título / legenda / hashtags)
    v.querySelectorAll('[data-cri-dl]').forEach(b => b.onclick = () => this.baixarCriativo(b.dataset.criDl));
    v.querySelectorAll('.cri-copy').forEach(b => b.onclick = () => {
      const txt = b.dataset.copy || ''; const label = b.dataset.label || 'Texto';
      const done = () => { UI.toast(label + ' copiado', 'Cole na sua publicação', 'ok'); b.classList.add('copied'); setTimeout(() => b.classList.remove('copied'), 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => {});
      else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
    });
  },
  async baixarCriativo(ref) {
    const [id, tipoRaw] = String(ref).split('|');
    const tipo = tipoRaw === 'stories' ? 'stories' : 'feed';
    const c = OB.criativoById(id); if (!c) return;
    let src = OB._criImg[id + '|' + tipo]; if (!src) src = await OB.getCriativoImagem(id, tipo);
    if (!src) return UI.toast('Imagem indisponível', 'Tente novamente em instantes', 'err');
    const ext = /^data:image\/png/.test(src) ? 'png' : 'jpg';
    const fmt = tipo === 'stories' ? '9x16' : '4x5';
    const nome = `OutBox - ${(c.titulo || 'criativo').replace(/[\\/:*?"<>|]/g, '')} - ${fmt}.${ext}`;
    const a = document.createElement('a'); a.href = src; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    UI.toast('Arte baixada', 'Agora é só compartilhar nas suas redes', 'ok');
  },

  /* formato do bloco laranja (referência Itaú): topo-esquerda + swoosh branco no canto inferior direito (viewBox 210x340) */
  BCARD_SHAPE: 'M0 0 H150 C150 70 150 120 130 152 C105 188 70 182 40 197 C22 205 10 208 0 210 Z',

  /* Portfólio de entregas: cases por serviço (prova social). Sites/LP com OG + filtro por nicho; demais serviços "Em breve". */
  view_portfolio() {
    const v = document.getElementById('main-view');
    v.innerHTML = (OB.PORTFOLIO_CATS || []).map(cat => this.portfolioCatHTML(cat)).join('');
    v.querySelectorAll('[data-copylink]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.copylink).then(() => UI.toast('Link copiado', '', 'ok')));
    // filtro por nicho
    v.querySelectorAll('.port-filtros').forEach(bar => {
      const grid = bar.parentElement.querySelector('.port-grid');
      bar.querySelectorAll('.port-chip').forEach(chip => chip.onclick = () => {
        bar.querySelectorAll('.port-chip').forEach(c => c.classList.toggle('on', c === chip));
        const nicho = chip.dataset.nicho;
        grid.querySelectorAll('.port-cell').forEach(cell => { cell.style.display = (!nicho || cell.dataset.nicho === nicho) ? '' : 'none'; });
      });
    });
  },
  portfolioCatHTML(cat) {
    const itens = (cat.itens || []).slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));
    const cont = itens.length ? `<span class="mut" style="font-weight:600">· ${itens.length} projeto${itens.length > 1 ? 's' : ''}</span>` : '';
    const body = itens.length
      ? `${cat.filtravel ? this.portfolioFiltros(itens) : ''}<div class="port-grid">${itens.map(p => this.portCard(p)).join('')}</div>`
      : `<div class="port-soon">${UI.icon('rocket',28)}<b>Em breve</b><p>Estamos reunindo os cases de <b>${cat.nome}</b> já entregues pela OutBox. Assim que estiverem prontos, aparecem aqui para você mostrar aos clientes.</p></div>`;
    return `<div class="card" style="margin-bottom:18px">
      <div class="row alc" style="gap:8px;margin-bottom:14px">${UI.icon('gallery',16)}<b>${cat.nome}</b> ${cont}</div>
      ${body}
    </div>`;
  },
  portfolioFiltros(itens) {
    const nichos = [...new Set(itens.map(p => p.nicho).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
    return `<div class="port-filtros">
      <button type="button" class="port-chip on" data-nicho="">Todos</button>
      ${nichos.map(n => `<button type="button" class="port-chip" data-nicho="${n}">${n}</button>`).join('')}
    </div>`;
  },
  portCard(p) {
    return `<div class="port-cell" data-nicho="${p.nicho || ''}">
      <a class="port-thumb" href="${p.link}" target="_blank" rel="noopener" title="Abrir ${p.nome}"><img src="${p.img}" alt="Prévia do site ${p.nome}" loading="lazy"/></a>
      <div class="port-body"><b>${p.nome}</b>${p.nicho ? `<span class="port-tag">${p.nicho}</span>` : ''}</div>
      <div class="port-actions">
        <button type="button" class="btn ghost sm" data-copylink="${p.link}" aria-label="Copiar link de ${p.nome}">${UI.icon('docs',15)}<span>Copiar</span></button>
        <a class="btn ghost sm" href="${p.link}" target="_blank" rel="noopener" aria-label="Abrir ${p.nome} em nova guia">${UI.icon('external',15)}<span>Abrir</span></a>
      </div>
    </div>`;
  },

  projetoCard(s) {
    const cli = OB.clientById(s.clientId);
    const proj = OB.projetoDaVenda(s.id);
    const pago = s.statusPagamento === 'recebido';
    const servicos = OB.produtosNomes(s);
    let corpo = '';
    if (!pago) {
      corpo = `<div class="hint" style="margin-top:10px">${UI.icon('lock',13)} O envio do briefing libera assim que o admin confirmar o pagamento desta venda.</div>`;
    } else if (!proj) {
      corpo = `<div class="row between alc" style="margin-top:12px;flex-wrap:wrap;gap:10px">
        <span class="mut" style="font-size:12.5px">Pagamento confirmado. Envie o briefing ao cliente para começar.</span>
        <button class="btn brand" data-brief="${s.id}">${UI.icon('send',15)} Enviar briefing</button>
      </div>`;
    } else {
      corpo = `<div style="margin-top:14px">${this.timelineHTML(proj)}</div>${this.projetoAcoesHTML(proj)}`;
    }
    return `<div class="card proj-card">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div class="row alc" style="gap:10px;min-width:0">
          <span class="tr-ic on">${UI.icon('briefcase',18)}</span>
          <div style="min-width:0"><b style="font-size:15px">${cli ? cli.nome : 'Cliente'}</b>
            <div class="mut" style="font-size:12.5px">${servicos} · ${OB.money(s.valor, s.moeda)}</div></div>
        </div>
        ${proj ? `<span class="chip ${proj.status === 'aprovado' ? 'green' : 'brand'} nowrap">${(OB.ETAPAS_PROJETO.find(e => e.id === proj.status) || {}).nome || ''}</span>` : (pago ? '<span class="chip warn nowrap">Sem briefing</span>' : '<span class="chip gray nowrap">Aguardando pagamento</span>')}
      </div>
      ${corpo}
    </div>`;
  },

  projetoAcoesHTML(proj) {
    const respostas = proj.briefingRespostas ? `<div class="proj-brief-box"><b>${UI.icon('docs',13)} Briefing do cliente</b><p>${(proj.briefingRespostas || '').replace(/</g, '&lt;')}</p></div>` : '';
    const linhas = [];
    if (proj.status === 'briefing_enviado') {
      linhas.push(`<span class="mut" style="font-size:12.5px">${UI.icon('clock',12)} Aguardando o cliente preencher o briefing.</span>`);
      linhas.push(`<button class="btn ghost sm" data-brief="${proj.saleId}">${UI.icon('send',14)} Reenviar link</button>`);
      linhas.push(`<button class="btn ghost sm" data-brief-recebido="${proj.id}">${UI.icon('check',14)} Registrar briefing recebido</button>`);
    } else if (proj.status === 'briefing_recebido') {
      linhas.push(`<span class="mut" style="font-size:12.5px">${UI.icon('check',12)} Briefing recebido. A OutBox vai analisar e iniciar a produção.</span>`);
    } else if (proj.status === 'entregue') {
      linhas.push(`<button class="btn green sm" data-share-final="${proj.id}">${UI.icon('whats',14)} Enviar projeto ao cliente</button>`);
      linhas.push(`<button class="btn brand sm" data-aprovar-proj="${proj.id}">${UI.icon('check',14)} Cliente aprovou</button>`);
    } else if (proj.status === 'aprovado') {
      linhas.push(`<span class="chip green">${UI.icon('prize',13)} Projeto aprovado e concluído</span>`);
    }
    // relatório sempre disponível a partir do briefing recebido
    if (OB.etapaIndex(proj.status) >= 1) linhas.push(`<button class="btn ghost sm" data-relatorio="${proj.id}">${UI.icon('receipt',14)} Emitir relatório</button>`);
    if (proj.linkFinal && (proj.status === 'entregue' || proj.status === 'aprovado')) {
      linhas.unshift(`<a class="btn ghost sm" href="${proj.linkFinal}" target="_blank" rel="noopener">${UI.icon('external',14)} Abrir projeto</a>`);
    }
    return `${respostas}<div class="proj-acoes">${linhas.join('')}</div>`;
  },

  enviarBriefing(saleId) {
    const s = OB.salesOf(this.u().id).find(x => x.id === saleId); if (!s) return;
    if (s.statusPagamento !== 'recebido') return UI.toast('Ainda não liberado', 'O briefing libera após a confirmação do pagamento.', 'err');
    const cli = OB.clientById(s.clientId);
    const prods = OB.produtosDaVenda(s);
    // o link carrega o id do projeto + token: quando o cliente preenche, o briefing volta sozinho para a esteira
    const proj0 = OB.projetoDaVenda(s.id);
    const pid = proj0 ? proj0.id : OB.uid();
    const token = (proj0 && proj0.briefingToken) ? proj0.briefingToken : OB.uid().replace(/-/g, '');
    const links = prods.map(id => ({ nome: (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id, link: OB.briefingLink(id, pid, token) }));
    const primeiro = (cli && cli.nome) ? cli.nome.split(' ')[0] : '';
    const msg = `Olá${primeiro ? ' ' + primeiro : ''}! Que ótimo dar início ao seu projeto com a OutBox 🎉 Para começarmos, preencha o briefing (leva poucos minutos): ${links.map(l => l.link).join(' ')}`;
    const tel = cli && cli.telefone ? cli.telefone.replace(/\D/g, '') : '';
    const waTel = tel ? (tel.length <= 11 ? '55' + tel : tel) : '';
    UI.modal({
      title: 'Enviar briefing ao cliente',
      sub: cli ? cli.nome : '',
      body: `
        <div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>Envie o link pelo WhatsApp. O cliente preenche online e o briefing <b>volta automaticamente</b> para esta esteira, avisando a OutBox para iniciar a produção.</div></div>
        ${links.map(l => `<div class="field"><label>${l.nome}</label><div class="row" style="gap:8px"><input class="grow" value="${l.link}" readonly/><button type="button" class="btn ghost" data-copy="${l.link}">${UI.icon('docs',14)} Copiar</button></div></div>`).join('')}
        <div class="field"><label>Mensagem</label><textarea id="bf-msg" style="min-height:96px">${msg}</textarea></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn green" id="bf-wa">${UI.icon('whats',16)} Enviar no WhatsApp</button>`
    });
    document.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => UI.toast('Link copiado', '', 'ok')));
    const registrar = () => {
      let proj = OB.projetoDaVenda(s.id);
      if (!proj) {
        proj = { id: pid, saleId: s.id, consultorId: this.u().id, clientId: s.clientId, produtos: prods, status: 'briefing_enviado', briefingToken: token, briefingLink: links.map(l => l.link).join(' '), briefingEnviadoEm: new Date().toISOString(), criadoEm: new Date().toISOString() };
        OB.addProjeto(proj);
      } else {
        if (!proj.briefingToken) { proj.briefingToken = token; OB.updateProjeto(proj); }
        if (proj.status === 'briefing_enviado') OB.setEtapaProjeto(proj, 'briefing_enviado');
      }
    };
    document.getElementById('bf-wa').onclick = () => {
      const txt = encodeURIComponent(document.getElementById('bf-msg').value);
      window.open(waTel ? `https://wa.me/${waTel}?text=${txt}` : `https://wa.me/?text=${txt}`, '_blank');
      registrar();
      UI.closeModal();
      UI.toast('Briefing enviado', 'O projeto entrou na esteira de entrega.', 'ok');
      App.refreshProjetosBadge();
      this.render('projetos');
    };
  },

  marcarBriefingRecebido(projId) {
    const proj = OB.projetoById(projId); if (!proj) return;
    UI.modal({
      title: 'Registrar briefing recebido',
      sub: 'Use quando o cliente já preencheu (por ora, manual)',
      body: `
        <div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>Normalmente isto é <b>automático</b>: quando o cliente preenche o briefing online, ele já cai aqui sozinho. Use este atalho só se o cliente respondeu por fora (WhatsApp, ligação): cole um resumo e confirme.</div></div>
        <div class="field"><label>Resumo do briefing (opcional)</label><textarea id="br-resp" style="min-height:120px" placeholder="Cole ou resuma as respostas do cliente..."></textarea></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="br-ok">${UI.icon('check',16)} Confirmar recebimento</button>`
    });
    document.getElementById('br-ok').onclick = () => {
      proj.briefingRespostas = document.getElementById('br-resp').value.trim();
      OB.setEtapaProjeto(proj, 'briefing_recebido');
      UI.closeModal();
      UI.toast('Briefing recebido!', 'A OutBox foi avisada para iniciar a produção.', 'ok');
      App.refreshProjetosBadge();
      this.render('projetos');
    };
  },

  aprovarProjeto(projId) {
    const proj = OB.projetoById(projId); if (!proj) return;
    UI.confirm('Confirmar aprovação', 'O cliente aprovou o projeto final? Isso encerra a entrega.', () => {
      OB.setEtapaProjeto(proj, 'aprovado');
      UI.toast('Projeto aprovado! 🎉', 'Entrega concluída.', 'ok');
      App.refreshProjetosBadge();
      this.render('projetos');
    }, 'Sim, aprovado');
  },

  compartilharLinkFinal(projId) {
    const proj = OB.projetoById(projId); if (!proj || !proj.linkFinal) return UI.toast('Sem link', 'O projeto final ainda não foi entregue.', 'err');
    const cli = OB.clientById(proj.clientId);
    const primeiro = (cli && cli.nome) ? cli.nome.split(' ')[0] : '';
    const msg = `Olá${primeiro ? ' ' + primeiro : ''}! Seu projeto está pronto 🎉 Confira aqui: ${proj.linkFinal} . Qualquer ajuste, me avise. Se estiver tudo certo, é só confirmar a aprovação!`;
    const tel = cli && cli.telefone ? cli.telefone.replace(/\D/g, '') : '';
    const waTel = tel ? (tel.length <= 11 ? '55' + tel : tel) : '';
    window.open(waTel ? `https://wa.me/${waTel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  },

  emitirRelatorio(projId) {
    const proj = OB.projetoById(projId); if (!proj) return;
    const s = OB.salesOf(this.u().id).find(x => x.id === proj.saleId);
    const html = this.buildRelatorioHTML(proj, s);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) { URL.revokeObjectURL(url); return UI.toast('Permita pop-ups', 'Libere pop-ups para abrir o relatório.', 'err'); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  buildRelatorioHTML(proj, s) {
    const u = this.u(); const cli = OB.clientById(proj.clientId);
    const servicos = s ? OB.produtosNomes(s) : (proj.produtos || []).map(id => (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id).join(' + ');
    const atual = OB.etapaIndex(proj.status);
    const mark = `<svg viewBox="0 0 439 439" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="219.5" fill="#fff"/><path fill="#F15532" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#F15532" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Relatório do Projeto · ${cli ? cli.nome : ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>@page{margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;color:#0A0A0A;background:#F5F7F9;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 10px 40px rgba(0,0,0,.06)}
.cover{background:linear-gradient(135deg,#F15532,#e0431f);color:#fff;padding:40px 48px}.brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}.brand b{font-size:22px;font-weight:800}
.cover h1{font-size:28px;font-weight:800;letter-spacing:-.02em}.cover p{color:rgba(255,255,255,.9);margin-top:4px}
.body{padding:36px 48px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:26px;font-size:14px}.lbl{color:#8a96a3;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
.status{display:inline-block;background:#fbe9e4;color:#c0371c;font-weight:800;font-size:13px;padding:8px 16px;border-radius:999px;margin-bottom:22px}
.tl2{list-style:none}.tl2 li{position:relative;padding:0 0 20px 34px;border-left:2px solid #e6eaef;margin-left:10px}.tl2 li:last-child{border-left-color:transparent}
.tl2 .d{position:absolute;left:-11px;top:0;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;background:#e6eaef;color:#8a96a3}
.tl2 li.ok .d{background:#F15532;color:#fff}.tl2 li.ok b{color:#0A0A0A}.tl2 b{font-size:14px;display:block;color:#8a96a3}.tl2 span{font-size:12px;color:#8a96a3}
.note{margin-top:24px;padding:16px 18px;background:#F5F7F9;border:1px solid #e6eaef;border-radius:12px;font-size:13px;color:#46505c}
.foot{border-top:1px solid #e6eaef;padding:22px 48px;color:#8a96a3;font-size:13px}.foot b{color:#0A0A0A}
.ph{position:fixed;bottom:16px;right:16px;background:#F15532;color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;cursor:pointer;border:none}@media print{.ph{display:none}.page{box-shadow:none}body{background:#fff}}</style></head>
<body><div class="page">
  <div class="cover"><div class="brand">${mark}<b>OutBox</b></div><h1>Relatório do Projeto</h1><p>Acompanhamento preparado por ${u.nome || ''} ${u.sobrenome || ''} · Consultor OutBox Soluções Digitais</p></div>
  <div class="body">
    <div class="grid">
      <div><div class="lbl">Cliente</div>${cli ? cli.nome : '-'}</div>
      <div><div class="lbl">Data do relatório</div>${new Date().toLocaleDateString('pt-BR')}</div>
      <div><div class="lbl">Serviço</div>${servicos}</div>
      <div><div class="lbl">Etapa atual</div>${(OB.ETAPAS_PROJETO[atual] || {}).nome || '-'}</div>
    </div>
    <div class="status">Status: ${(OB.ETAPAS_PROJETO[atual] || {}).nome || '-'}</div>
    <ul class="tl2">
      ${OB.ETAPAS_PROJETO.map((e, i) => `<li class="${i <= atual ? 'ok' : ''}"><span class="d">${i <= atual ? '&#10003;' : (i + 1)}</span><b>${e.nome}</b><span>${proj[e.campo] ? OB.dataBR(proj[e.campo]) : (i <= atual ? '' : 'a fazer')} · ${e.quem}</span></li>`).join('')}
    </ul>
    ${proj.linkFinal ? `<div class="note"><b style="color:#0A0A0A">Projeto entregue:</b> <a href="${proj.linkFinal}" style="color:#F15532">${proj.linkFinal}</a></div>` : ''}
    <div class="note">Este relatório reflete o andamento do seu projeto na data acima. A OutBox mantém você informado a cada etapa.</div>
  </div>
  <div class="foot"><div>OutBox Soluções Digitais · Relatório de acompanhamento<br><b>${u.email || 'felipe@outboxgroup.com.br'}</b>${u.celular ? ' · ' + u.celular : ''}</div></div>
</div><button class="ph" onclick="window.print()">Salvar como PDF / Imprimir</button></body></html>`;
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
      ['Como minha comissão é calculada?', 'É progressiva por faixa (estilo imposto de renda): cada parte do volume do mês rende sua própria taxa — 8% até R$5 mil, 10% de R$5 a 15 mil, 12% de R$15 a 30 mil e 20% acima de R$30 mil. Só vendas aprovadas contam.'],
      ['Quando recebo o pagamento?', 'Em até 3 dias úteis após a solicitação, mediante a comprovação do serviço e dos valores que efetivamente entraram na conta da OutBox.'],
      ['Como funcionam os prêmios?', 'Tudo que você vender acima de R$30 mil no trimestre vira 3% de bônus de campanha. Na aba Premiações você resgata esse bônus em dinheiro ou troca por um prêmio da loja, até o valor do seu bônus.'],
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
            <p class="soft" style="font-size:14px;margin-bottom:16px">Fale direto com o time da OutBox Soluções Digitais. Respondemos em horário comercial.</p>
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
    const bloqueado = !!(typeof App !== 'undefined' && App.perfilLock);
    v.innerHTML = `
      ${bloqueado ? `<div class="perfil-lock-banner" style="max-width:760px">${UI.icon('lock',18)}<div><b>Complete seu cadastro para liberar o sistema</b><span>Preencha todos os campos obrigatórios e clique em <b>Salvar perfil</b>. Só assim o restante do sistema é liberado. Leva menos de 2 minutos.</span></div></div>` : ''}
      ${(u.role !== 'admin' && !bloqueado) ? `<div style="max-width:760px">${this.certificadosStrip(u.id)}</div>` : ''}
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
          <div class="field"><label>País</label><input id="p-pais" value="${u.pais||'Brasil'}"/></div>

          <div class="nav-label" style="padding-left:0">Dados de pagamento</div>
          <div class="hint" style="margin-top:-4px;margin-bottom:10px">Conta usada pela OutBox para depositar suas comissões e prêmios. Obrigatória para receber. Você pode alterar quando precisar.</div>
          <div class="grid-2">
            <div class="field"><label>Banco <span class="req">*</span></label><input id="p-banco" value="${u.banco||''}" placeholder="Ex.: Nubank, Itaú, Caixa"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Tipo de conta <span class="req">*</span></label>
              <select id="p-conta-tipo">
                <option value="corrente" ${(u.contaTipo||'corrente')==='corrente'?'selected':''}>Conta corrente</option>
                <option value="poupanca" ${u.contaTipo==='poupanca'?'selected':''}>Poupança</option>
                <option value="pagamento" ${u.contaTipo==='pagamento'?'selected':''}>Conta de pagamento</option>
              </select></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Agência <span class="req">*</span></label><input id="p-agencia" value="${u.agencia||''}" placeholder="0000"/><div class="err">Obrigatório</div></div>
            <div class="field"><label>Conta (com dígito) <span class="req">*</span></label><input id="p-conta" value="${u.conta||''}" placeholder="00000-0"/><div class="err">Obrigatório</div></div>
          </div>
          <div class="field"><label>Chave Pix <span class="req">*</span></label><input id="p-pix" value="${u.pix||''}" placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"/>
            <div class="err">Obrigatório</div>
            <div class="hint">Preferimos Pix para pagar mais rápido.</div></div>

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
    const v = document.getElementById('main-view');
    const fields = {
      doc: document.getElementById('p-doc'), cel: document.getElementById('p-cel'), cep: document.getElementById('p-cep')
    };
    fields.doc.oninput = e => e.target.value = UI.maskDoc(e.target.value);
    fields.cel.oninput = e => e.target.value = UI.maskPhone(e.target.value);
    fields.cep.oninput = e => e.target.value = UI.maskCEP(e.target.value);
    fields.cep.onblur = () => this.buscarCEP(fields.cep.value);
    this.bindCertificados(v);

    // foto: comprime automaticamente até ficar bem abaixo de 500KB (nunca bloqueia o consultor)
    const TETO_FOTO = 480 * 1024; // teto do arquivo final ~480KB (bem abaixo de 1MB)
    const bytesDataUrl = (d) => Math.round((d.length - (d.indexOf(',') + 1)) * 3 / 4);
    document.getElementById('p-foto').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!/^image\//.test(f.type)) { UI.toast('Arquivo inválido', 'Envie uma imagem (JPG ou PNG).', 'err'); e.target.value = ''; return; }
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          let data = r.result, maxPx = 400, q = 0.85;
          try {
            for (let t = 0; t < 8; t++) {
              let w = img.width, h = img.height;
              if (w > h && w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
              else if (h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; }
              const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
              cv.getContext('2d').drawImage(img, 0, 0, w, h);
              data = cv.toDataURL('image/jpeg', q);
              if (bytesDataUrl(data) <= TETO_FOTO) break;
              if (q > 0.5) q -= 0.12; else maxPx = Math.round(maxPx * 0.85); // 1º baixa qualidade, depois tamanho
            }
          } catch (err) { data = r.result; }
          document.getElementById('p-foto-data').value = data;
          document.getElementById('av-pic').innerHTML = `<img src="${data}"/>`;
          UI.toast('Foto otimizada', `Ajustada para ~${Math.max(1, Math.round(bytesDataUrl(data) / 1024))} KB, carrega mais rápido.`, 'ok');
        };
        img.onerror = () => { document.getElementById('p-foto-data').value = r.result; document.getElementById('av-pic').innerHTML = `<img src="${r.result}"/>`; };
        img.src = r.result;
      };
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
        ['p-bairro', v => !!v], ['p-cidade', v => !!v], ['p-uf', v => !!v], ['p-email', v => UI.validEmail(v)],
        ['p-banco', v => !!v], ['p-agencia', v => !!v], ['p-conta', v => !!v], ['p-pix', v => !!v]
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
        bairro: val('p-bairro'), cidade: val('p-cidade'), uf: val('p-uf').toUpperCase(), pais: val('p-pais') || 'Brasil',
        email: val('p-email'), twoFA,
        banco: val('p-banco'), agencia: val('p-agencia'), conta: val('p-conta'),
        contaTipo: document.getElementById('p-conta-tipo').value, pix: val('p-pix'),
        moeda: document.getElementById('p-moeda').value
      });
      OB.upsertUser(u);
      App.refreshSidebarUser();
      App.refreshCommission(true);
      if (App.perfilLock) {
        // perfil completo: libera o sistema e leva o consultor para a Visão Geral
        UI.toast('Tudo pronto!', 'Perfil completo. Sistema liberado, boas vendas!', 'ok');
        App.liberarPerfil();
      } else {
        UI.toast('Perfil salvo!', 'Seus dados foram atualizados', 'ok');
      }
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
