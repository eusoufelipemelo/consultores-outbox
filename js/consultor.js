/* ============================================================
   OutBox Consultores — Painel do Consultor (consultor.js)
   ============================================================ */
const Consultor = {
  HOME: 'overview',
  /* atalhos da barra inferior no celular (o 5º item abre o menu completo) */
  TABS: ['overview', 'funil', 'orcamentos', 'comissao'],
  NAV: [
    // Dashboard
    { id: 'overview',   label: 'Visão Geral',      icon: 'overview', home: true },
    // Operação — na ordem do fluxo: cadastrar cliente -> reunião -> proposta -> venda -> contrato -> execução -> prêmios
    { id: 'produtos',   label: 'Produtos',         icon: 'quote',    sec: 'Operação' },
    { id: 'clientes',   label: 'Meus Clientes',    icon: 'clients',  sec: 'Operação' },
    { id: 'funil',      label: 'Funil de Vendas',  icon: 'kanban',   sec: 'Operação' },
    { id: 'orcamentos', label: 'Orçamentos',       icon: 'quote',    sec: 'Operação' },
    { id: 'comissao',   label: 'Vendas & Comissão',icon: 'money',    sec: 'Operação' },
    { id: 'fixo',       label: 'Fixo do Consultor',icon: 'target',   sec: 'Operação' },
    { id: 'contratos',  label: 'Contratos',        icon: 'contract', sec: 'Operação' },
    { id: 'projetos',   label: 'Projetos',         icon: 'briefcase',sec: 'Operação' },
    { id: 'briefings',  label: 'Briefings',        icon: 'docs',     sec: 'Operação' },
    { id: 'timeline',   label: 'Linha do Tempo',   icon: 'trend',    sec: 'Operação' },
    { id: 'premiacoes', label: 'Premiações',       icon: 'prize',    sec: 'Operação' },
    { id: 'loja',       label: 'Loja OutBox',      icon: 'cart',     sec: 'Operação' },
    { id: 'ranking',    label: 'Ranking',          icon: 'ranking',  sec: 'Operação' },
    // Aprendizado & materiais — separado dos demais
    { id: 'treinamentos', label: 'Treinamentos',   icon: 'academy',  sec: 'Cursos & Materiais' },
    { id: 'documentos', label: 'Documentos',       icon: 'docs',     sec: 'Cursos & Materiais' },
    { id: 'ebooks',     label: 'E-Books',          icon: 'book',     sec: 'Cursos & Materiais' },
    { id: 'criativos',  label: 'Criativos',        icon: 'creative', sec: 'Cursos & Materiais' },
    { id: 'portfolio',  label: 'Portfólio',        icon: 'gallery',  sec: 'Cursos & Materiais' },
    { id: 'ajuda',      label: 'Dúvidas & Guia',   icon: 'help',     sec: 'Cursos & Materiais' }
  ],

  titles: {
    overview:   ['Visão Geral', 'Acompanhe suas metas em tempo real'],
    funil:      ['Funil de Vendas', 'Arraste seus contatos entre as etapas'],
    produtos:   ['Produtos', 'Tudo o que você pode ofertar e o valor de cada serviço por porte de empresa'],
    clientes:   ['Meus Clientes', 'Cadastre e gerencie seus clientes'],
    orcamentos: ['Orçamentos', 'Crie propostas e acompanhe os aceites'],
    comissao:   ['Vendas & Comissão', 'Lance vendas, acompanhe propostas e solicite comissão'],
    fixo:       ['Fixo do Consultor', 'Chegue na régua do mês e feche com R$ 2.000 a mais'],
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
      ${this.fixoCard()}
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

    const fx = document.getElementById('fixo-card');
    if (fx) {
      const abrir = () => App.go('fixo');
      fx.onclick = abrir;
      fx.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } };
    }
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


  /* ====================== FIXO DO CONSULTOR ======================
     Régua mensal: fechou o volume em vendas PAGAS dentro do mês, entra o valor
     do Fixo somado à comissão. A tela mostra três estados: ainda não começou,
     falta chegar na régua, e chegou. Nada aqui fala de enquadramento: o valor
     é o mesmo para todo consultor, muda só a rubrica no fechamento do admin. */
  fixoBarra(r) {
    const pct = r.vale ? Math.round(r.pct) : 0;
    return `
      <div class="row between" style="margin-bottom:8px;font-size:13px;gap:12px">
        <span class="soft"><b style="color:var(--text)">${OB.fmt(r.volume)}</b> em vendas pagas</span>
        <span class="mut">Régua: ${OB.fmt(r.regua)}</span>
      </div>
      <div class="bar" style="height:14px"><i data-w="${pct}"></i></div>`;
  },

  /* faixa compacta que aparece no alto da Visão Geral */
  fixoCard() {
    const r = OB.fixoResumo(this.u().id);
    if (!OB.FIXO.ativo) return '';
    const titulo = !r.vale ? 'Começa em 1º de setembro'
      : r.bateu ? 'Régua batida. O Fixo entra neste fechamento.'
      : `Faltam ${OB.fmt(r.falta)} para o Fixo entrar`;
    return `
      <div class="card" id="fixo-card" role="button" tabindex="0"
           style="margin-bottom:18px;cursor:pointer;border-color:${r.bateu ? 'var(--brand)' : 'var(--border)'}">
        <div class="row between alc" style="gap:14px;flex-wrap:wrap;margin-bottom:14px">
          <div class="row alc" style="gap:10px">
            <span style="display:grid;place-items:center;width:34px;height:34px;border-radius:10px;
              background:var(--brand-soft);color:var(--brand)">${UI.icon('target',18)}</span>
            <div>
              <b style="display:block;font-size:15px">Fixo do Consultor</b>
              <span class="mut" style="font-size:13px">${titulo}</span>
            </div>
          </div>
          <div style="text-align:right">
            <span class="mut" style="display:block;font-size:12px">Fecha o mês com</span>
            <b style="font-size:20px;color:${r.bateu ? 'var(--brand)' : 'var(--text)'}">${OB.fmt(r.total)}</b>
          </div>
        </div>
        ${this.fixoBarra(r)}
      </div>`;
  },


  /* Regulamento do Fixo. Texto único: serve para qualquer consultor, porque o
     valor é o mesmo para todos. A cláusula de revisão é o que mantém a política
     como campanha comercial revisável, e não como obrigação permanente. */
  fixoRegulamentoHTML() {
    const cfg = OB.FIXO;
    const item = (t, d) => `<li style="margin-bottom:13px"><b style="color:var(--text)">${t}</b><br><span class="soft">${d}</span></li>`;
    return `
      <ol style="padding-left:18px;font-size:14px;line-height:1.6">
        ${item('O que é',
          `Todo consultor que fechar <b>${OB.fmt(cfg.regua)}</b> em vendas com pagamento confirmado dentro do mês recebe
           <b>${OB.fmt(cfg.valor)}</b> somados ao seu fechamento, além da comissão normal.`)}
        ${item('Quem participa',
          'Todos os consultores ativos da OutBox, sem exceção e sem inscrição. Basta chegar na régua.')}
        ${item('O que conta para a régua',
          `Vendas suas, aprovadas e com pagamento confirmado pela OutBox, dentro do mês. É o mesmo critério que já libera
           a sua comissão. Venda assinada mas ainda não paga não entra enquanto o pagamento não é confirmado.`)}
        ${item('Como é a contagem do mês',
          'Do dia 1 ao último dia de cada mês. Cada mês é independente: o que passou não acumula para o mês seguinte.')}
        ${item('Quando é pago',
          'Junto com o repasse da sua comissão, no fechamento do mês.')}
        ${item('O que não conta',
          'Vendas canceladas, estornadas ou com pagamento revertido. Se o estorno acontecer depois do fechamento, o valor é ajustado no repasse seguinte.')}
        ${item('A comissão continua igual',
          `Este valor é somado, não substitui nada. A sua comissão segue a tabela de faixas de sempre, chegando aos 20%.
           Acima de ${OB.fmt(cfg.regua)} ela continua subindo normalmente.`)}
        ${item('Vigência',
          `Vale para os meses fechados a partir de ${OB.dataBR(cfg.inicio + 'T12:00:00')}. A OutBox pode revisar os valores, a régua ou
           encerrar esta política a qualquer tempo, comunicando os consultores com 30 dias de antecedência. O valor é devido
           somente nos meses em que a régua for efetivamente atingida.`)}
      </ol>`;
  },
  fixoRegulamento() {
    UI.modal({
      size: 'lg',
      title: 'Regulamento do Fixo do Consultor',
      sub: `Régua de ${OB.fmt(OB.FIXO.regua)} em vendas pagas no mês`,
      body: this.fixoRegulamentoHTML(),
      footer: `<button class="btn brand" data-close>Entendi</button>`
    });
  },

  view_fixo() {
    const u = this.u();
    const r = OB.fixoResumo(u.id);
    const cfg = OB.FIXO;
    const pagas = OB.salesOf(u.id)
      .filter(s => s.statusProposta === 'aprovada' && s.statusPagamento === 'recebido' && OB.isSameMonth(s.data))
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    // três estados possíveis, cada um com a sua chamada
    let faixa;
    if (!r.vale) {
      faixa = `<span class="chip gray">Começa em 1º de setembro</span>
        <h2 style="font-size:26px;margin:14px 0 6px">A régua é ${OB.fmt(cfg.regua)}</h2>
        <p class="soft" style="max-width:60ch">A partir de setembro, todo mês que você fechar ${OB.fmt(cfg.regua)} em vendas
        pagas, entram <b style="color:var(--brand)">${OB.fmt(cfg.valor)}</b> a mais no seu fechamento. Suas vendas de agora
        já valem para aquecer o funil.</p>`;
    } else if (r.bateu) {
      faixa = `<span class="chip brand">${UI.icon('check',13)} Régua batida</span>
        <h2 style="font-size:26px;margin:14px 0 6px">Você garantiu ${OB.fmt(cfg.valor)} a mais</h2>
        <p class="soft" style="max-width:60ch">Já são <b style="color:var(--text)">${OB.fmt(r.volume)}</b> em vendas pagas neste mês.
        O Fixo entra somado à comissão no fechamento. Daqui para frente, cada venda nova só aumenta o seu total.</p>`;
    } else {
      faixa = `<span class="chip gray">Faltam ${OB.fmt(r.falta)}</span>
        <h2 style="font-size:26px;margin:14px 0 6px">Você fecha o mês com ${OB.fmt(r.total)}</h2>
        <p class="soft" style="max-width:60ch">Chegando em ${OB.fmt(cfg.regua)} em vendas pagas, esse número vira
        <b style="color:var(--brand)">${OB.fmt(OB.fixoFechamento(cfg.regua))}</b>. São ${OB.fmt(cfg.valor)} a mais no mesmo mês.</p>`;
    }

    const degraus = [...new Set([cfg.regua, 25000, 30000, 40000])].sort((a, b) => a - b);
    const projecao = degraus.map(vol => {
      return `<tr${vol === cfg.regua ? ' style="background:var(--brand-soft)"' : ''}>
          <td><b>${OB.fmt(vol)}</b></td>
          <td class="mut">${OB.fmt(Math.round(OB.comissaoMarginal(vol)))}</td>
          <td class="mut">${OB.fmt(vol >= cfg.regua ? cfg.valor : 0)}</td>
          <td><b style="color:var(--brand)">${OB.fmt(OB.fixoFechamento(vol))}</b></td>
        </tr>`;
    }).join('');

    const lista = pagas.length ? `
      <div class="table-wrap">
        <table><thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th style="text-align:right">Valor</th></tr></thead>
        <tbody>${pagas.map(s => {
          const c = OB.clientById(s.clientId);
          return `<tr><td class="mut">${OB.dataBR(s.data)}</td>
            <td>${c ? c.nome : '<span class="mut">Sem cliente</span>'}</td>
            <td class="mut">${(s.produtos || [s.produto]).map(id => OB.produtoNome(id)).join(', ')}</td>
            <td style="text-align:right"><b>${OB.fmt(s.valor)}</b></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : this.emptyMini('Nenhuma venda paga neste mês ainda. Assim que o pagamento for confirmado, ela aparece aqui.');

    const v = document.getElementById('main-view');
    v.innerHTML = `
      <div class="card" style="margin-bottom:18px">
        ${faixa}
        <div style="margin-top:20px">${this.fixoBarra(r)}</div>
        <button class="btn ghost sm" id="fixo-reg" style="margin-top:16px">${UI.icon('docs',15)} Ver regulamento</button>
      </div>

      <div class="cards cols-3" style="margin-bottom:18px">
        ${this.kpi('cart', OB.fmt(r.volume), 'Vendas pagas no mês', 'Só entra o que o cliente já pagou')}
        ${!r.vale
          ? this.kpi('target', OB.fmt(cfg.regua), 'Régua do mês', 'Vale a partir de 1º de setembro')
          : this.kpi('target', OB.fmt(r.falta), 'Falta para a régua', r.bateu ? 'Régua batida' : 'Régua de ' + OB.fmt(cfg.regua))}
        ${this.kpi('money', OB.fmt(r.total), 'Fecha o mês com', r.bateu ? 'Comissão + ' + OB.fmt(cfg.valor) : 'Comissão do mês')}
      </div>

      <div class="cards cols-2">
        <div class="card">
          <div class="card-head"><h3>Quanto você fecha</h3><span class="mut">Projeção</span></div>
          <div class="table-wrap">
            <table><thead><tr><th>Vendeu</th><th>Comissão</th><th>Fixo</th><th>Fecha com</th></tr></thead>
            <tbody>${projecao}</tbody></table>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Como funciona</h3></div>
          <ul style="list-style:none;display:grid;gap:12px;font-size:14px" class="soft">
            <li><b style="color:var(--text)">Conta venda paga.</b> O mesmo critério que já libera a sua comissão. Assim que o pagamento é confirmado, a venda entra na conta.</li>
            <li><b style="color:var(--text)">Do dia 1 ao último dia do mês.</b> Cada mês é um mês. Chegou na régua, o Fixo entra. Não chegou, comissão normal e vida que segue.</li>
            <li><b style="color:var(--text)">É a mais, não substitui nada.</b> A sua comissão continua igual, por faixa, chegando aos 20%.</li>
            <li><b style="color:var(--text)">Acima da régua segue valendo.</b> Passou dos ${OB.fmt(cfg.regua)}, a comissão continua subindo normalmente por cima.</li>
          </ul>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="card-head"><h3>Vendas que já contaram</h3><span class="mut">${pagas.length} venda(s) neste mês</span></div>
        ${lista}
      </div>`;

    document.getElementById('fixo-reg').onclick = () => this.fixoRegulamento();
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

  /* ====================== LOJA OUTBOX (consultor) ====================== */
  _carrinho: [],
  view_loja() {
    const v = document.getElementById('main-view');
    const prods = OB.lojaProdutosAtivos();
    const cats = OB.lojaCategorias().filter(c => c.ativo);
    const filtro = this._lojaCat || '';
    const lista = filtro ? prods.filter(p => p.categoriaId === filtro) : prods;
    const nCarr = this._carrinho.reduce((t, i) => t + i.qtd, 0);
    v.innerHTML = `
      <div class="row between alc" style="margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:2px">Loja OutBox</h2>
          <div class="mut" style="font-size:12.5px">Vista a marca e represente a OutBox com orgulho. Frete calculado pelo seu CEP.</div>
        </div>
        <button class="btn brand" id="lj-carrinho">${UI.icon('cart',16)} Carrinho${nCarr ? ` (${nCarr})` : ''}</button>
      </div>
      ${cats.length ? `<div class="seg" id="lj-cats" style="margin-bottom:16px">
        <button class="${!filtro ? 'on' : ''}" data-cat="">Todos</button>
        ${cats.map(c => `<button class="${filtro === c.id ? 'on' : ''}" data-cat="${c.id}">${c.nome}</button>`).join('')}
      </div>` : ''}
      ${lista.length ? `<div class="cards cols-3">${lista.map(p => this.lojaCard(p)).join('')}</div>`
        : this.empty('cart', 'Loja em preparação', 'Assim que a OutBox publicar os produtos, eles aparecem aqui.')}
      ${this.lojaMeusPedidos()}
      <button class="lj-fab ${nCarr ? '' : 'hidden'}" id="lj-fab" title="Ver carrinho">
        ${UI.icon('cart',22)}<span class="lj-fab-n" id="lj-fab-n">${nCarr}</span></button>`;
    v.querySelectorAll('#lj-cats button').forEach(b => b.onclick = () => { this._lojaCat = b.dataset.cat; this.view_loja(); });
    document.getElementById('lj-carrinho').onclick = () => this.carrinhoModal();
    document.getElementById('lj-fab').onclick = () => this.carrinhoModal();
    this.wireLojaCards(v);
  },

  /* atualiza o contador do carrinho sem re-renderizar a tela (mantém o contexto) */
  atualizarBadgeCarrinho() {
    const n = this._carrinho.reduce((t, i) => t + i.qtd, 0);
    const btn = document.getElementById('lj-carrinho');
    if (btn) btn.innerHTML = `${UI.icon('cart',16)} Carrinho${n ? ` (${n})` : ''}`;
    const fab = document.getElementById('lj-fab');
    if (fab) { fab.classList.toggle('hidden', !n); const el = document.getElementById('lj-fab-n'); if (el) el.textContent = n; }
  },

  /* card com carrossel de fotos 4:5 */
  lojaCard(p) {
    const fotos = p.fotos || [];
    const preco = OB.lojaPreco(p);
    const temPromo = p.precoPromo != null && p.precoPromo < p.preco;
    const est = OB.lojaEstoqueTotal(p);
    return `<div class="card lj-card" data-prod="${p.id}">
      <div class="lj-carrossel" data-carr="${p.id}">
        <div class="lj-slides" data-slides="${p.id}">
          ${fotos.map((f, i) => `<img src="${f}" alt="${p.titulo} ${i + 1}" data-zoom="${p.id}:${i}" loading="lazy">`).join('')}
        </div>
        ${fotos.length > 1 ? `
          <button class="lj-nav prev" data-carr-prev="${p.id}" aria-label="Foto anterior">${UI.icon('chevron',18)}</button>
          <button class="lj-nav next" data-carr-next="${p.id}" aria-label="Próxima foto">${UI.icon('chevron',18)}</button>
          <div class="lj-dots" data-dots="${p.id}">${fotos.map((_, i) => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('')}</div>` : ''}
        ${temPromo ? `<span class="lj-tag">-${Math.round((1 - p.precoPromo / p.preco) * 100)}%</span>` : ''}
        ${!est ? '<span class="lj-esgotado">Esgotado</span>' : ''}
      </div>
      <div class="lj-body">
        <b class="lj-titulo">${p.titulo}</b>
        ${p.descricao ? `<p class="lj-desc">${p.descricao}</p>` : ''}
        <div class="lj-preco">${temPromo ? `<s>${OB.fmt(p.preco)}</s>` : ''}<b>${OB.fmt(preco)}</b></div>
        <button class="btn brand block" data-comprar="${p.id}" ${!est ? 'disabled' : ''} style="margin-top:10px">
          ${UI.icon('cart',15)} ${est ? 'Comprar' : 'Sem estoque'}</button>
      </div>
    </div>`;
  },

  wireLojaCards(v) {
    // carrossel
    const irPara = (pid, dir) => {
      const slides = v.querySelector(`[data-slides="${pid}"]`); if (!slides) return;
      const n = slides.children.length; if (n < 2) return;
      const atual = Math.round(slides.scrollLeft / slides.clientWidth);
      const novo = (atual + dir + n) % n;
      slides.scrollTo({ left: novo * slides.clientWidth, behavior: 'smooth' });
    };
    v.querySelectorAll('[data-carr-prev]').forEach(b => b.onclick = e => { e.stopPropagation(); irPara(b.dataset.carrPrev, -1); });
    v.querySelectorAll('[data-carr-next]').forEach(b => b.onclick = e => { e.stopPropagation(); irPara(b.dataset.carrNext, 1); });
    // pontinhos acompanham a rolagem
    v.querySelectorAll('[data-slides]').forEach(sl => sl.onscroll = () => {
      const pid = sl.dataset.slides;
      const dots = v.querySelector(`[data-dots="${pid}"]`); if (!dots) return;
      const i = Math.round(sl.scrollLeft / sl.clientWidth);
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    });
    // zoom da foto
    v.querySelectorAll('[data-zoom]').forEach(img => img.onclick = () => {
      const [pid, idx] = img.dataset.zoom.split(':');
      this.lojaZoom(pid, parseInt(idx, 10));
    });
    v.querySelectorAll('[data-comprar]').forEach(b => b.onclick = () => this.produtoCompraModal(OB.lojaProdutoById(b.dataset.comprar)));
  },

  /* lightbox: foto ampliada, navegação e botão fechar */
  lojaZoom(prodId, idx) {
    const p = OB.lojaProdutoById(prodId); if (!p || !(p.fotos || []).length) return;
    let i = idx || 0;
    const host = document.createElement('div');
    host.className = 'lj-zoom';
    host.innerHTML = `
      <button class="lj-zoom-x" aria-label="Fechar">${UI.icon('x',22)}</button>
      <button class="lj-zoom-nav prev" aria-label="Anterior">${UI.icon('chevron',26)}</button>
      <figure class="lj-zoom-fig"><img id="lj-zoom-img" src="${p.fotos[i]}" alt="${p.titulo}"><figcaption>${p.titulo} · <span id="lj-zoom-n">${i + 1}/${p.fotos.length}</span></figcaption></figure>
      <button class="lj-zoom-nav next" aria-label="Próxima">${UI.icon('chevron',26)}</button>`;
    document.body.appendChild(host);
    const mostra = k => { i = (k + p.fotos.length) % p.fotos.length; host.querySelector('#lj-zoom-img').src = p.fotos[i]; host.querySelector('#lj-zoom-n').textContent = (i + 1) + '/' + p.fotos.length; };
    const fechar = () => { host.remove(); document.removeEventListener('keydown', tecla); };
    const tecla = ev => { if (ev.key === 'Escape') fechar(); if (ev.key === 'ArrowRight') mostra(i + 1); if (ev.key === 'ArrowLeft') mostra(i - 1); };
    host.querySelector('.lj-zoom-x').onclick = fechar;
    host.querySelector('.prev').onclick = () => mostra(i - 1);
    host.querySelector('.next').onclick = () => mostra(i + 1);
    host.onclick = ev => { if (ev.target === host) fechar(); };
    document.addEventListener('keydown', tecla);
    if (p.fotos.length < 2) host.querySelectorAll('.lj-zoom-nav').forEach(b => b.style.display = 'none');
  },

  /* escolha de cor, tamanho, gênero e quantidade */
  produtoCompraModal(p) {
    if (!p) return;
    const cores = OB.lojaCores(p);
    const generos = [...new Set((p.variacoes || []).map(v => v.genero))];
    let sel = { cor: cores[0] || '', genero: generos[0] || 'unissex', tam: '', qtd: 1 };
    UI.modal({
      title: p.titulo,
      sub: OB.fmt(OB.lojaPreco(p)) + ' · escolha as opções',
      body: `
        <div class="cm-topo">
          ${(p.fotos || [])[0] ? `<img class="cm-foto" src="${p.fotos[0]}" alt="${p.titulo}">` : ''}
          <div>${p.descricao ? `<p class="mut" style="font-size:13px;line-height:1.55">${p.descricao}</p>` : ''}</div>
        </div>
        ${generos.length > 1 ? `<div class="field"><label>Gênero</label><div class="cm-chips" id="cm-gen">
          ${generos.map((x, i) => `<button type="button" class="cm-chip ${i === 0 ? 'on' : ''}" data-gen="${x}">${OB.lojaGeneroNome(x)}</button>`).join('')}</div></div>` : ''}
        ${cores.length ? `<div class="field"><label>Cor</label><div class="cm-chips" id="cm-cor">
          ${cores.map((c, i) => `<button type="button" class="cm-chip ${i === 0 ? 'on' : ''}" data-cor="${c}">${c}</button>`).join('')}</div></div>` : ''}
        <div class="field"><label>Tamanho <span class="req">*</span></label><div class="cm-chips" id="cm-tam"></div>
          <div class="hint" id="cm-est"></div></div>
        <div class="field"><label>Quantidade</label>
          <div class="cm-qtd"><button type="button" id="cm-menos">−</button><input id="cm-q" type="number" value="1" min="1"><button type="button" id="cm-mais">+</button></div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="cm-add">${UI.icon('cart',16)} Adicionar ao carrinho</button>`
    });
    const renderTams = () => {
      const box = document.getElementById('cm-tam');
      box.innerHTML = OB.LOJA_TAMANHOS.map(t => {
        const q = OB.lojaEstoque(p, sel.cor, t, sel.genero);
        return `<button type="button" class="cm-chip ${sel.tam === t ? 'on' : ''} ${q ? '' : 'off'}" data-tam="${t}" ${q ? '' : 'disabled'}>${t}</button>`;
      }).join('');
      box.querySelectorAll('[data-tam]').forEach(b => b.onclick = () => { sel.tam = b.dataset.tam; renderTams(); });
      const est = sel.tam ? OB.lojaEstoque(p, sel.cor, sel.tam, sel.genero) : 0;
      document.getElementById('cm-est').textContent = sel.tam ? `${est} disponível(is) nesta combinação` : 'Selecione o tamanho';
    };
    renderTams();
    const troca = (grupo, campo) => {
      const box = document.getElementById(grupo); if (!box) return;
      box.querySelectorAll('button').forEach(b => b.onclick = () => {
        box.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); sel[campo] = b.dataset[campo === 'genero' ? 'gen' : 'cor']; sel.tam = ''; renderTams();
      });
    };
    troca('cm-gen', 'genero'); troca('cm-cor', 'cor');
    const q = document.getElementById('cm-q');
    document.getElementById('cm-menos').onclick = () => { q.value = Math.max(1, (parseInt(q.value, 10) || 1) - 1); };
    document.getElementById('cm-mais').onclick = () => { q.value = (parseInt(q.value, 10) || 1) + 1; };
    document.getElementById('cm-add').onclick = () => {
      if (!sel.tam) return UI.toast('Escolha o tamanho', 'Selecione um tamanho disponível.', 'err');
      const qtd = Math.max(1, parseInt(q.value, 10) || 1);
      const est = OB.lojaEstoque(p, sel.cor, sel.tam, sel.genero);
      if (qtd > est) return UI.toast('Estoque insuficiente', `Só temos ${est} unidade(s) desta combinação.`, 'err');
      const chave = `${p.id}|${sel.cor}|${sel.tam}|${sel.genero}`;
      const ex = this._carrinho.find(i => i.chave === chave);
      if (ex) ex.qtd = Math.min(est, ex.qtd + qtd);
      else this._carrinho.push({ chave, produtoId: p.id, titulo: p.titulo, foto: (p.fotos || [])[0] || '', preco: OB.lojaPreco(p), pesoG: p.pesoG || 300, cor: sel.cor, tam: sel.tam, genero: sel.genero, qtd });
      this.atualizarBadgeCarrinho();
      // checkout transparente: confirma dentro do próprio modal, com o caminho claro
      this.confirmadoNoCarrinho(p, sel, qtd);
    };
  },

  /* passo de confirmação: o consultor escolhe seguir comprando ou ir ao carrinho */
  confirmadoNoCarrinho(p, sel, qtd) {
    const body = document.querySelector('#modal-bg .modal-body');
    const foot = document.querySelector('#modal-bg .modal-foot');
    const head = document.querySelector('#modal-bg .modal-head h3');
    const sub = document.querySelector('#modal-bg .modal-head p');
    const total = this._carrinho.reduce((t, i) => t + i.preco * i.qtd, 0);
    const nItens = this._carrinho.reduce((t, i) => t + i.qtd, 0);
    if (head) head.textContent = 'Adicionado ao carrinho';
    if (sub) sub.textContent = 'Você pode continuar comprando ou finalizar agora';
    if (body) body.innerHTML = `
      <div class="ck-ok">
        <span class="ck-ic">${UI.icon('check', 26)}</span>
        <div class="ck-txt"><b>${qtd}x ${p.titulo}</b>
          <span>${[sel.cor, sel.tam, OB.lojaGeneroNome(sel.genero)].filter(Boolean).join(' · ')}</span></div>
        ${(p.fotos || [])[0] ? `<img class="ck-foto" src="${p.fotos[0]}" alt="${p.titulo}">` : ''}
      </div>
      <div class="ck-resumo">
        <div class="row between"><span>Itens no carrinho</span><b>${nItens}</b></div>
        <div class="row between"><span>Subtotal</span><b style="color:var(--brand)">${OB.fmt(total)}</b></div>
        ${total < OB.LOJA_FRETE_GRATIS ? `<div class="hint" style="margin-top:6px">Faltam <b>${OB.fmt(OB.LOJA_FRETE_GRATIS - total)}</b> para o frete sair de graça 🎉</div>`
          : '<div class="hint" style="margin-top:6px;color:#15803d"><b>Frete grátis liberado!</b> 🎉</div>'}
      </div>`;
    if (foot) {
      foot.innerHTML = `<button class="btn ghost" id="ck-continuar">${UI.icon('cart',15)} Continuar comprando</button>
        <button class="btn brand" id="ck-ir">${UI.icon('receipt',16)} Ir para o carrinho</button>`;
      document.getElementById('ck-continuar').onclick = () => UI.closeModal();
      document.getElementById('ck-ir').onclick = () => { UI.closeModal(); this.carrinhoModal(); };
    }
  },

  /* carrinho + frete por CEP + fechamento do pedido */
  carrinhoModal() {
    const u = this.u();
    if (!this._carrinho.length) return UI.toast('Carrinho vazio', 'Escolha um produto na loja para começar.', 'info');
    const cepSalvo = (u.cep || '').replace(/\D/g, '');
    let frete = null;
    UI.modal({
      title: 'Seu carrinho',
      sub: 'Confira os itens, calcule o frete e finalize',
      size: 'lg',
      body: `
        <div id="cr-itens"></div>
        <div class="nav-label" style="padding-left:0;margin-top:18px">Entrega</div>
        <div class="cr-endereco-topo">
          <span class="mut" style="font-size:12.5px" id="cr-onde">Enviando para o seu endereço cadastrado</span>
          <button type="button" class="btn ghost sm" id="cr-meu" hidden>${UI.icon('clients',14)} Usar meu endereço</button>
        </div>
        <div class="field"><label>CEP de entrega <span class="req">*</span></label>
          <div class="row" style="gap:8px">
            <input id="cr-cep" class="input" value="${cepSalvo}" placeholder="00000-000" maxlength="9" inputmode="numeric" style="max-width:170px"/>
            <button class="btn ghost sm" id="cr-calc">${UI.icon('map',15)} Buscar</button>
          </div>
          <div class="hint" id="cr-frete-hint">Digite o CEP: buscamos o endereço e calculamos o frete.</div>
        </div>
        <div class="grid-2">
          <div class="field" style="grid-column:1/-1"><label>Rua / logradouro</label><input id="cr-rua" class="input" value="${(u.logradouro || '').replace(/"/g, '&quot;')}"/></div>
          <div class="field"><label>Número <span class="req">*</span></label><input id="cr-num" class="input" value="${(u.numero || '').replace(/"/g, '&quot;')}"/><div class="err">Informe o número</div></div>
          <div class="field"><label>Complemento</label><input id="cr-comp" class="input" value="${(u.complemento || '').replace(/"/g, '&quot;')}" placeholder="Apto, bloco, referência"/></div>
          <div class="field"><label>Bairro</label><input id="cr-bairro" class="input" value="${(u.bairro || '').replace(/"/g, '&quot;')}"/></div>
          <div class="field"><label>Cidade / UF</label><input id="cr-cidade" class="input" value="${[u.cidade, u.uf].filter(Boolean).join(' / ').replace(/"/g, '&quot;')}"/></div>
        </div>
        <div class="field"><label>Forma de pagamento</label>
          <select id="cr-pag" class="input">
            <option value="pix">PIX</option>
            <option value="cartao">Cartão de crédito</option>
            <option value="comissao">Descontar da minha comissão</option>
          </select></div>
        <div id="cr-pag-box"></div>
        <div class="field"><label>Observações (opcional)</label><textarea id="cr-obs" rows="2" placeholder="Alguma instrução para a entrega?"></textarea></div>
        <div class="cr-resumo" id="cr-resumo"></div>`,
      footer: `<button class="btn ghost" data-close>Continuar comprando</button><button class="btn brand" id="cr-fechar">${UI.icon('check',16)} Finalizar pedido</button>`
    });

    const subtotal = () => this._carrinho.reduce((t, i) => t + i.preco * i.qtd, 0);
    const pesoTotal = () => this._carrinho.reduce((t, i) => t + (i.pesoG || 300) * i.qtd, 0);
    let renderPagamento = () => {}; // definido abaixo; declarado aqui para o resumo poder chamar
    const renderResumo = () => {
      const sub = subtotal();
      const f = frete ? frete.valor : 0;
      document.getElementById('cr-resumo').innerHTML = `
        <div class="row between"><span>Subtotal</span><b>${OB.fmt(sub)}</b></div>
        <div class="row between"><span>Frete${frete && frete.regiao ? ' · ' + frete.regiao : ''}</span><b>${frete ? (frete.gratis ? 'Grátis' : OB.fmt(f)) : '—'}</b></div>
        <div class="row between cr-total"><span>Total</span><b>${OB.fmt(sub + f)}</b></div>
        ${sub < OB.LOJA_FRETE_GRATIS ? `<div class="hint" style="margin-top:6px">Faltam <b>${OB.fmt(OB.LOJA_FRETE_GRATIS - sub)}</b> para o frete sair de graça 🎉</div>` : ''}`;
      if (document.getElementById('cr-pag-box')) renderPagamento(); // o total mudou: revalida o pagamento
    };
    const renderItens = () => {
      const el = document.getElementById('cr-itens');
      if (!this._carrinho.length) { el.innerHTML = '<div class="pf-vazio">Carrinho vazio</div>'; renderResumo(); return; }
      el.innerHTML = this._carrinho.map((i, k) => `<div class="cr-item">
        ${i.foto ? `<img src="${i.foto}" alt="${i.titulo}">` : '<span class="cr-sem"></span>'}
        <div class="cr-info"><b>${i.titulo}</b>
          <span>${[i.cor, i.tam, OB.lojaGeneroNome(i.genero)].filter(Boolean).join(' · ')}</span>
          <span class="cr-un">${OB.fmt(i.preco)} cada</span></div>
        <div class="cr-acoes">
          <div class="cm-qtd sm"><button type="button" data-cr-menos="${k}">−</button><input type="number" data-cr-q="${k}" value="${i.qtd}" min="1"><button type="button" data-cr-mais="${k}">+</button></div>
          <b>${OB.fmt(i.preco * i.qtd)}</b>
          <button class="iconbtn" data-cr-rm="${k}" title="Remover">${UI.icon('trash',15)}</button>
        </div></div>`).join('');
      el.querySelectorAll('[data-cr-rm]').forEach(b => b.onclick = () => { this._carrinho.splice(+b.dataset.crRm, 1); renderItens(); });
      const ajusta = (k, novo) => {
        const it = this._carrinho[k]; const p = OB.lojaProdutoById(it.produtoId);
        const est = p ? OB.lojaEstoque(p, it.cor, it.tam, it.genero) : it.qtd;
        it.qtd = Math.max(1, Math.min(est || 1, novo));
        renderItens();
      };
      el.querySelectorAll('[data-cr-menos]').forEach(b => b.onclick = () => ajusta(+b.dataset.crMenos, this._carrinho[+b.dataset.crMenos].qtd - 1));
      el.querySelectorAll('[data-cr-mais]').forEach(b => b.onclick = () => ajusta(+b.dataset.crMais, this._carrinho[+b.dataset.crMais].qtd + 1));
      el.querySelectorAll('[data-cr-q]').forEach(inp => inp.onchange = () => ajusta(+inp.dataset.crQ, parseInt(inp.value, 10) || 1));
      renderResumo();
    };
    renderItens();

    const calcular = () => {
      const cep = document.getElementById('cr-cep').value;
      const f = OB.calcFrete(cep, pesoTotal(), subtotal());
      const hint = document.getElementById('cr-frete-hint');
      if (!f.ok) { frete = null; hint.textContent = f.erro; hint.style.color = '#dc2626'; renderResumo(); return false; }
      frete = f;
      hint.innerHTML = f.gratis ? `<b style="color:#15803d">Frete grátis</b> para ${f.regiao} · entrega em ${f.prazo}`
        : `Envio para <b>${f.regiao}</b> · ${OB.fmt(f.valor)} · ${f.prazo}`;
      hint.style.color = '';
      renderResumo();
      return true;
    };

    /* busca o endereço pelo CEP (ViaCEP) e preenche os campos; depois calcula o frete */
    const setEnd = (o) => {
      document.getElementById('cr-rua').value = o.rua || '';
      document.getElementById('cr-bairro').value = o.bairro || '';
      document.getElementById('cr-cidade').value = [o.cidade, o.uf].filter(Boolean).join(' / ');
      if (o.numero !== undefined) document.getElementById('cr-num').value = o.numero || '';
      if (o.complemento !== undefined) document.getElementById('cr-comp').value = o.complemento || '';
    };
    const marcarOutro = (outro) => {
      const onde = document.getElementById('cr-onde');
      const btn = document.getElementById('cr-meu');
      onde.innerHTML = outro ? 'Enviando para <b>outro endereço</b>' : 'Enviando para o seu <b>endereço cadastrado</b>';
      btn.hidden = !outro || !cepSalvo;
    };
    const buscarCEP = async () => {
      const cep = document.getElementById('cr-cep').value.replace(/\D/g, '');
      if (cep.length !== 8) { calcular(); return; }
      const hint = document.getElementById('cr-frete-hint');
      // é o CEP do cadastro? então devolve o endereço do perfil (inclui número e complemento)
      if (cep === cepSalvo) {
        setEnd({ rua: u.logradouro, bairro: u.bairro, cidade: u.cidade, uf: u.uf, numero: u.numero, complemento: u.complemento });
        marcarOutro(false); calcular(); return;
      }
      hint.textContent = 'Buscando endereço...'; hint.style.color = '';
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const j = await r.json();
        if (j.erro) { hint.textContent = 'CEP não encontrado. Confira o número.'; hint.style.color = '#dc2626'; frete = null; renderResumo(); return; }
        setEnd({ rua: j.logradouro, bairro: j.bairro, cidade: j.localidade, uf: j.uf, numero: '', complemento: '' });
        marcarOutro(true);
        calcular();
        const num = document.getElementById('cr-num');
        if (!num.value) setTimeout(() => num.focus(), 80);
      } catch (e) {
        // sem internet para o ViaCEP: ainda assim calculamos o frete pela faixa do CEP
        calcular();
        const h = document.getElementById('cr-frete-hint');
        h.innerHTML += ' <span class="mut">(preencha o endereço manualmente)</span>';
      }
    };
    /* bloco da forma de pagamento: PIX/cartão geram cobrança; comissão exige autorização */
    const saldoCom = OB.saldoComissaoLoja(u.id);
    renderPagamento = () => {
      const forma = document.getElementById('cr-pag').value;
      const box = document.getElementById('cr-pag-box');
      const total = subtotal() + (frete ? frete.valor : 0);
      if (forma === 'comissao') {
        const suficiente = saldoCom >= total;
        box.innerHTML = `<div class="pg-box ${suficiente ? '' : 'no'}">
          <div class="row between alc" style="gap:10px;flex-wrap:wrap">
            <span>Sua comissão disponível</span><b style="font-size:16px;color:${suficiente ? '#15803d' : '#dc2626'}">${OB.fmt(saldoCom)}</b>
          </div>
          <div class="row between alc" style="gap:10px;flex-wrap:wrap;font-size:13px;color:var(--text-mut)">
            <span>Valor desta compra</span><span>${OB.fmt(total)}</span>
          </div>
          ${suficiente
            ? `<div class="row between alc" style="gap:10px;flex-wrap:wrap;font-size:13px;padding-top:7px;margin-top:5px;border-top:1px solid var(--border)">
                 <span>Saldo depois da compra</span><b>${OB.fmt(saldoCom - total)}</b></div>
               <label class="pg-check"><input type="checkbox" id="cr-autoriza">
                 <span>Autorizo descontar <b>${OB.fmt(total)}</b> da minha comissão disponível.</span></label>
               <div class="hint">O desconto é aplicado na hora e o pedido já entra como pago. Você pode usar a comissão mesmo sem atingir o mínimo de ${OB.fmt(OB.saqueMinimo())} para saque.</div>`
            : `<div class="pg-erro">${UI.icon('info',15)} <span>Saldo insuficiente: faltam <b>${OB.fmt(total - saldoCom)}</b>. Escolha PIX ou cartão, ou remova itens do carrinho.</span></div>`}
        </div>`;
        const chk = document.getElementById('cr-autoriza');
        if (chk) chk.onchange = () => {};
      } else {
        box.innerHTML = `<div class="pg-box">
          <div class="row alc" style="gap:9px"><span class="pg-ic">${UI.icon(forma === 'pix' ? 'money' : 'receipt',16)}</span>
            <div><b style="font-size:14px">${forma === 'pix' ? 'Pagamento via PIX' : 'Pagamento no cartão'}</b>
              <div class="mut" style="font-size:12.5px">Ao finalizar, geramos a cobrança de <b>${OB.fmt(total)}</b> e a OutBox confirma o pagamento no sistema.</div></div></div>
        </div>`;
      }
    };
    document.getElementById('cr-pag').onchange = renderPagamento;

    document.getElementById('cr-calc').onclick = buscarCEP;
    document.getElementById('cr-cep').oninput = () => {
      const el = document.getElementById('cr-cep');
      const d = el.value.replace(/\D/g, '').slice(0, 8);
      el.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;   // máscara 00000-000
      if (d.length === 8) buscarCEP();                                   // dispara sozinho ao completar
    };
    document.getElementById('cr-meu').onclick = () => {
      document.getElementById('cr-cep').value = cepSalvo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      setEnd({ rua: u.logradouro, bairro: u.bairro, cidade: u.cidade, uf: u.uf, numero: u.numero, complemento: u.complemento });
      marcarOutro(false); calcular();
    };
    if (cepSalvo.length === 8) {
      document.getElementById('cr-cep').value = cepSalvo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      calcular();
    }

    document.getElementById('cr-fechar').onclick = () => {
      if (!this._carrinho.length) return UI.toast('Carrinho vazio', '', 'err');
      if (!frete && !calcular()) return UI.toast('Informe o CEP', 'Precisamos do CEP para calcular o envio.', 'err');
      const val = id => (document.getElementById(id).value || '').trim();
      const rua = val('cr-rua'), num = val('cr-num');
      const campoNum = document.getElementById('cr-num');
      campoNum.closest('.field').classList.toggle('has-error', !num);
      campoNum.classList.toggle('invalid', !num);
      if (!rua) return UI.toast('Endereço incompleto', 'Informe a rua (ou busque pelo CEP).', 'err');
      if (!num) return UI.toast('Informe o número', 'O número da entrega é obrigatório.', 'err');
      const end = [rua + ', ' + num, val('cr-comp'), val('cr-bairro'), val('cr-cidade')].filter(Boolean).join(' · ');
      const sub = subtotal();
      const total = sub + frete.valor;
      const forma = document.getElementById('cr-pag').value;
      // pagamento com comissão: exige saldo e autorização explícita
      let debito = 0;
      if (forma === 'comissao') {
        if (saldoCom < total) return UI.toast('Saldo insuficiente', `A sua comissão disponível é de ${OB.fmt(saldoCom)}. Faltam ${OB.fmt(total - saldoCom)}.`, 'err');
        const chk = document.getElementById('cr-autoriza');
        if (!chk || !chk.checked) return UI.toast('Autorize o desconto', 'Marque a caixa autorizando o desconto na sua comissão.', 'err');
        debito = total;
      }
      const numero = OB.gerarNumeroPedido();
      const pedido = {
        id: OB.uid(), numero, consultorId: u.id,
        consultorNome: `${u.nome || ''} ${u.sobrenome || ''}`.trim(),
        itens: this._carrinho.map(i => ({ produtoId: i.produtoId, titulo: i.titulo, cor: i.cor, tam: i.tam, genero: i.genero, qtd: i.qtd, preco: i.preco })),
        subtotal: sub, frete: frete.valor, total,
        cep: document.getElementById('cr-cep').value, endereco: end,
        formaPagamento: forma,
        // comissão já é abatida na hora; PIX/cartão geram cobrança para o admin conferir
        status: forma === 'comissao' ? 'pago' : 'aguardando',
        pagamentoStatus: forma === 'comissao' ? 'confirmado' : 'pendente',
        cobrancaRef: forma === 'comissao' ? '' : 'COB-' + numero.replace('LJ-', ''),
        comissaoDebitada: debito,
        pagoEm: forma === 'comissao' ? new Date().toISOString() : null,
        obs: document.getElementById('cr-obs').value.trim(),
        criadoEm: new Date().toISOString()
      };
      OB.saveLojaPedido(pedido);
      OB.lojaBaixarEstoque(pedido.itens);
      this._carrinho = [];
      UI.closeModal();
      if (forma === 'comissao') {
        App.refreshCommission(true);
        UI.toast('Pedido confirmado! 🎉', `${numero} · ${OB.fmt(total)} descontados da sua comissão. Saldo restante: ${OB.fmt(saldoCom - total)}.`, 'ok');
      } else {
        UI.toast('Pedido registrado! 🎉', `${numero} · cobrança ${pedido.cobrancaRef} gerada. Assim que o pagamento for confirmado, separamos o seu pedido.`, 'ok');
      }
      this.view_loja();
    };
  },

  lojaMeusPedidos() {
    const meus = OB.lojaPedidosDe(this.u().id);
    if (!meus.length) return '';
    return `<div class="card" style="margin-top:20px">
      <div class="card-head"><h3>Meus pedidos</h3></div>
      <table class="tbl"><thead><tr><th>Pedido</th><th>Itens</th><th>Total</th><th>Status</th><th>Data</th></tr></thead><tbody>
        ${meus.map(p => {
          const st = OB.LOJA_STATUS.find(s => s.id === p.status) || { nome: p.status, cor: 'gray' };
          return `<tr><td><b>${p.numero}</b></td>
            <td>${(p.itens || []).reduce((t, i) => t + i.qtd, 0)} item(ns)</td>
            <td><b>${OB.fmt(p.total)}</b></td>
            <td><span class="chip ${st.cor} nowrap">${st.nome}</span></td>
            <td>${OB.dataBR(p.criadoEm)}</td></tr>`;
        }).join('')}
      </tbody></table></div>`;
  },

  /* ====================== VENDAS & COMISSÃO ====================== */
  view_comissao() {
    const u = this.u();
    const com = OB.comissaoDisponivel(u.id);
    const saldo = OB.saldoSacavel(u.id);
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
          <button class="btn green" id="req-com" ${!saldo.podeSacar ? 'disabled' : ''} title="${!saldo.podeSacar ? 'Valor mínimo para saque é de ' + OB.fmt(OB.saqueMinimo()) : ''}">${UI.icon('receipt',16)} Solicitar comissão (${OB.fmt(saldo.total)})</button>
        </div>
      </div>
      ${!saldo.podeSacar && saldo.total > 0 ? `<div class="hint" style="margin:-8px 0 14px;text-align:right">Valor mínimo para saque é de <b>${OB.fmt(OB.saqueMinimo())}</b></div>` : ''}

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

  /* editar desconto + forma de pagamento.
     Quem tem permissão de preço manual também ajusta o valor do serviço aqui. */
  editarVenda(s) {
    if (!s) return;
    const moeda = s.moeda || 'BRL';
    const podeManual = OB.podePrecoManual();
    const valorBase = s.valorBruto || s.valor; // valor original da venda
    const fmtJuros = j => (Number(j) || 0).toFixed(2).replace('.', ',') + '%';
    UI.modal({
      title: 'Editar venda',
      sub: podeManual ? 'Ajuste o valor, o desconto e a forma de pagamento.' : 'O valor dos serviços é fixo pela tabela. Ajuste desconto e pagamento.',
      body: `
        ${podeManual
          ? `<div class="field"><label>Valor dos serviços</label>
              <input id="ed-base" class="input" type="number" value="${valorBase}" min="0" step="0.01" inputmode="decimal">
              <div class="hint">Você pode digitar um valor fora da tabela. O desconto e o pagamento são recalculados sobre este número.</div></div>`
          : `<div class="notice" style="margin-bottom:14px"><div class="row between alc grow"><span>Valor de tabela ${UI.icon('lock',13)}</span><b style="font-size:16px">${OB.money(valorBase, moeda)}</b></div></div>`}
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
    const pfEdit = ((s.produtos || [s.produto]).length === 1) ? OB.produtoPrecoFixo(s.produto) : null;
    const edBoletoOpt = edPgto.querySelector('option[value="boleto"]');
    const edBase = document.getElementById('ed-base');
    const baseAtual = () => edBase ? Math.max(0, Number(edBase.value) || 0) : valorBase;
    const descAtual = (s.descontoTipo === 'percent' ? s.descontoValor : 0) || 0;
    // as faixas de desconto dependem do valor, então são refeitas quando ele muda
    const fillDescEd = () => {
      const perms = OB.descontosPermitidos(baseAtual());
      const cur = parseInt(edDesc.value, 10);
      const manter = Number.isNaN(cur) ? descAtual : cur;
      edDesc.innerHTML = perms.map(p => `<option value="${p}" ${p === manter ? 'selected' : ''}>${p ? p + '%' : 'Sem desconto'}</option>`).join('');
      if (!perms.includes(manter)) edDesc.value = '0';
      document.getElementById('ed-desc-hint').innerHTML = `Desconto de até <b>${perms[perms.length - 1]}%</b> para este valor de orçamento.`;
    };
    fillDescEd();
    const recalcular = () => {
      // plano de preço fixo (hospedagem anual): sem desconto, sem 5% extra, sem boleto
      if (pfEdit) {
        edDesc.closest('.field').hidden = true;
        edPixWrap.style.display = 'none'; edPixDesc.checked = false;
        if (edBoletoOpt) edBoletoOpt.disabled = true;
        if (edPgto.value === 'boleto') edPgto.value = 'pix';
        const forma = edPgto.value === 'cartao' ? 'cartao' : 'pix';
        edParcWrap.hidden = forma !== 'cartao';
        const calc = OB.calcPagamento(0, forma, { precoFixo: pfEdit, parcelas: parseInt(edParcelas.value, 10) || 1 });
        let linhas = `<div class="row"><span>Plano anual</span><b>${OB.money(calc.valorServico, moeda)}</b></div>`;
        if (forma === 'cartao') {
          linhas += `<div class="row"><span>Juros do cartão · ${calc.parcelas}x (${fmtJuros(calc.jurosPct)})</span><span class="pos">+ ${OB.money(calc.valorCliente - calc.valorServico, moeda)}</span></div>`;
          linhas += `<div class="row total"><span>Total no cartão</span><b>${OB.money(calc.valorCliente, moeda)}</b></div>`;
          linhas += `<div class="row parc"><span>${calc.parcelas}x de</span><b>${OB.money(calc.valorParcela, moeda)}</b></div>`;
        } else {
          linhas += `<div class="row total"><span>À vista no PIX</span><b>${OB.money(calc.valorCliente, moeda)}</b></div>`;
        }
        linhas += `<div class="pay-note">Comissão sobre ${OB.money(calc.valorServico, moeda)} (valor do serviço, sem juros).</div>`;
        payBox.innerHTML = linhas;
        payBox._calc = calc; payBox._desc = 0;
        return;
      }
      const base = baseAtual();
      const desc = parseInt(edDesc.value, 10) || 0;
      const negociado = Math.round(base * (1 - desc / 100));
      const forma = edPgto.value;
      edParcWrap.hidden = forma !== 'cartao';
      edPixWrap.style.display = forma === 'pix' ? '' : 'none';
      if (forma !== 'pix') edPixDesc.checked = false;
      const calc = OB.calcPagamento(negociado, forma, { pixDesconto: edPixDesc.checked, parcelas: parseInt(edParcelas.value, 10) || 1 });
      let linhas = `<div class="row"><span>${edBase && base !== valorBase ? 'Valor definido manualmente' : 'Valor de tabela'}</span><b>${OB.money(base, moeda)}</b></div>`;
      if (desc) linhas += `<div class="row"><span>Desconto comercial (${desc}%)</span><span class="neg">- ${OB.money(base - negociado, moeda)}</span></div>`;
      if (forma === 'pix' && calc.pixDesconto) linhas += `<div class="row"><span>Desconto PIX à vista (5%)</span><span class="neg">- ${OB.money(negociado - calc.valorServico, moeda)}</span></div>`;
      if (forma === 'cartao') {
        linhas += `<div class="row"><span>Juros do cartão · ${calc.parcelas}x (${fmtJuros(calc.jurosPct)})</span><span class="pos">+ ${OB.money(calc.valorCliente - negociado, moeda)}</span></div>`;
        linhas += `<div class="row total"><span>Total no cartão</span><b>${OB.money(calc.valorCliente, moeda)}</b></div>`;
        linhas += `<div class="row parc"><span>${calc.parcelas}x de</span><b>${OB.money(calc.valorParcela, moeda)}</b></div>`;
      } else {
        linhas += `<div class="row total"><span>À vista no PIX</span><b>${OB.money(calc.valorCliente, moeda)}</b></div>`;
      }
      linhas += `<div class="pay-note">Comissão sobre ${OB.money(calc.valorServico, moeda)} (valor do serviço).</div>`;
      payBox.innerHTML = linhas;
      payBox._calc = calc; payBox._desc = desc;
    };
    edDesc.onchange = recalcular;
    if (edBase) edBase.oninput = () => { fillDescEd(); recalcular(); };
    edPgto.onchange = () => { document.getElementById('ed-pgto-hint').textContent = (OB.FORMAS_PAGAMENTO.find(f => f.id === edPgto.value) || {}).detalhe || ''; recalcular(); };
    edParcelas.onchange = recalcular;
    edPixDesc.onchange = recalcular;
    recalcular();
    document.getElementById('ed-save').onclick = () => {
      const calc = payBox._calc; const desc = payBox._desc || 0;
      const baseSalva = baseAtual();
      if (edBase && !baseSalva) return UI.toast('Informe o valor', 'O valor dos serviços ficou zerado', 'err');
      Object.assign(s, {
        valorBruto: pfEdit ? calc.valorServico : baseSalva, descontoTipo: desc ? 'percent' : null, descontoValor: desc,
        precoModo: (edBase && baseSalva !== valorBase) ? 'manual' : (s.precoModo || 'tabela'),
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
        ${OB.podePrecoManual() ? `
        <div class="field" id="s-manual-wrap">
          <label class="pix-check" style="margin:0"><input type="checkbox" id="s-manual"/> <span>Definir o valor <b>manualmente</b>, fora da tabela</span></label>
          <div id="s-manual-box" hidden style="margin-top:10px"></div>
          <div class="hint" id="s-manual-hint" hidden>Você digita o valor de cada serviço. O desconto comercial fica desligado, porque o número digitado já é o valor negociado. PIX e juros do cartão continuam valendo por cima.</div>
        </div>` : ''}
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
        <div class="field"><label>Bônus / cortesia <span style="font-weight:400;color:var(--text-mut)">(opcional)</span></label>
          <div class="svc-multi" id="s-bonus">
            ${OB.PRODUTOS.map(p => `<label class="svc-opt bonus-opt"><input type="checkbox" value="${p.id}"><span>${p.nome}</span></label>`).join('')}
          </div>
          <input id="s-bonus-obs" class="input" placeholder="Observação do bônus (ex.: cliente fechou 2 serviços)" style="margin-top:8px"/>
          <div class="hint">Serviços de <b>brinde</b>: o valor deles é <b>zerado</b> (não soma no total) e aparecem como <b>Bônus (cortesia)</b> no orçamento. O envio ao cliente só libera <b>após o admin autorizar</b>.</div></div>
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
    // valor manual (só aparece para quem tem permissão)
    const sManual = document.getElementById('s-manual');
    const manualBox = document.getElementById('s-manual-box');
    const manualHint = document.getElementById('s-manual-hint');
    const manuais = {};                       // { produtoId: valor digitado }
    const manualOn = () => !!(sManual && sManual.checked);
    // serviços selecionados (múltipla escolha)
    const bonusSel = () => [...document.querySelectorAll('#s-bonus input:checked')].map(i => i.value);
    // serviços PAGOS = marcados em Serviços e que NÃO estão no bônus (bônus nunca é cobrado)
    const prodsSel = () => [...document.querySelectorAll('#s-prods input:checked')].map(i => i.value).filter(id => !bonusSel().includes(id));
    // sincroniza o porte com o cliente selecionado
    const sincPorteComCliente = () => {
      const cliente = OB.clientById(sCli.value);
      sPorte.value = cliente ? (cliente.porte || 'pequena') : 'pequena';
    };
    sincPorteComCliente();
    const fmtJuros = j => (Number(j) || 0).toFixed(2).replace('.', ',') + '%';
    /* monta um campo de valor para cada serviço marcado.
       Só é redesenhado quando muda a seleção ou o interruptor, para não
       roubar o foco de quem está digitando. */
    const montarManual = () => {
      if (!manualBox) return;
      const ligado = manualOn();
      manualBox.hidden = !ligado;
      if (manualHint) manualHint.hidden = !ligado;
      if (!ligado) return;
      const sel = prodsSel();
      if (!sel.length) { manualBox.innerHTML = `<div class="pay-empty">Marque os serviços para digitar os valores.</div>`; return; }
      manualBox.innerHTML = sel.map(id => {
        const nome = (OB.PRODUTOS.find(x => x.id === id) || {}).nome || id;
        const v = manuais[id] != null ? manuais[id] : (OB.precoTabela(id, sPorte.value) || 0);
        return `<div class="row between alc" style="gap:10px;margin-bottom:8px">
          <span style="font-size:13px;flex:1;min-width:0">${nome}</span>
          <input class="input" type="number" data-manual="${id}" value="${v}" min="0" step="0.01" inputmode="decimal" placeholder="0,00" style="max-width:160px;text-align:right">
        </div>`;
      }).join('');
      manualBox.querySelectorAll('[data-manual]').forEach(inp => {
        manuais[inp.dataset.manual] = Math.max(0, Number(inp.value) || 0);
        inp.oninput = () => { manuais[inp.dataset.manual] = Math.max(0, Number(inp.value) || 0); recalcular(); };
      });
    };
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
      const descField = sDesc.closest('.field');
      const porteField = sPorte.closest('.field');
      const boletoOpt = sPgto.querySelector('option[value="boleto"]');
      // valor manual: manda em tudo, inclusive nos planos de preço fixo
      if (manualOn()) {
        if (porteField) porteField.hidden = true;
        if (descField) descField.hidden = true;
        if (boletoOpt) boletoOpt.disabled = false;
        const valorBase = sel.reduce((t, id) => t + (Number(manuais[id]) || 0), 0);
        const forma = sPgto.value;
        sParcWrap.hidden = forma !== 'cartao';
        sPixWrap.style.display = forma === 'pix' ? '' : 'none';
        if (forma !== 'pix') sPixDesc.checked = false;
        const calc = OB.calcPagamento(valorBase, forma, { pixDesconto: sPixDesc.checked, parcelas: parseInt(sParcelas.value, 10) || 1 });
        if (!valorBase) { payBox.innerHTML = `<div class="pay-empty">Digite o valor dos serviços para calcular.</div>`; }
        else {
          let linhas = `<div class="row"><span>Valor definido manualmente${sel.length > 1 ? ` · ${sel.length} serviços` : ''}</span><b>${OB.money(valorBase, m)}</b></div>`;
          if (forma === 'pix' && calc.pixDesconto) linhas += `<div class="row"><span>Desconto PIX à vista (5%)</span><span class="neg">- ${OB.money(valorBase - calc.valorServico, m)}</span></div>`;
          if (forma === 'cartao') {
            linhas += `<div class="row"><span>Juros do cartão · ${calc.parcelas}x (${fmtJuros(calc.jurosPct)})</span><span class="pos">+ ${OB.money(calc.valorCliente - valorBase, m)}</span></div>`;
            linhas += `<div class="row total"><span>Total no cartão</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
            linhas += `<div class="row parc"><span>${calc.parcelas}x de</span><b>${OB.money(calc.valorParcela, m)}</b></div>`;
          } else {
            linhas += `<div class="row total"><span>À vista no PIX</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
          }
          linhas += `<div class="pay-note">Valor fora da tabela. Sua comissão é calculada sobre ${OB.money(calc.valorServico, m)} (valor do serviço, sem juros).</div>`;
          payBox.innerHTML = linhas;
        }
        payBox._valorBase = valorBase; payBox._negociado = valorBase; payBox._calc = calc;
        return;
      }
      // plano de preço fixo (hospedagem anual): sem porte, sem desconto comercial, sem 5% extra, sem boleto
      const pf = sel.length === 1 ? OB.produtoPrecoFixo(sel[0]) : null;
      if (pf) {
        if (porteField) porteField.hidden = true;
        if (descField) descField.hidden = true;
        sPixWrap.style.display = 'none'; sPixDesc.checked = false;
        if (boletoOpt) boletoOpt.disabled = true;
        if (sPgto.value === 'boleto') sPgto.value = 'pix';
        const forma = sPgto.value === 'cartao' ? 'cartao' : 'pix';
        sParcWrap.hidden = forma !== 'cartao';
        const calc = OB.calcPagamento(0, forma, { precoFixo: pf, parcelas: parseInt(sParcelas.value, 10) || 1 });
        const nome = (OB.PRODUTOS.find(x => x.id === sel[0]) || {}).nome || 'Plano';
        let linhas = `<div class="row"><span>${nome} · plano anual</span><b>${OB.money(calc.valorServico, m)}</b></div>`;
        if (forma === 'cartao') {
          linhas += `<div class="row"><span>Juros do cartão · ${calc.parcelas}x (${fmtJuros(calc.jurosPct)})</span><span class="pos">+ ${OB.money(calc.valorCliente - calc.valorServico, m)}</span></div>`;
          linhas += `<div class="row total"><span>Total no cartão</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
          linhas += `<div class="row parc"><span>${calc.parcelas}x de</span><b>${OB.money(calc.valorParcela, m)}</b></div>`;
        } else {
          linhas += `<div class="row total"><span>À vista no PIX</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
        }
        linhas += `<div class="pay-note">Preço único para todos os portes. Sua comissão é calculada sobre ${OB.money(calc.valorServico, m)} (valor do serviço, sem juros).</div>`;
        payBox.innerHTML = linhas;
        payBox._valorBase = calc.valorServico; payBox._negociado = calc.valorServico; payBox._calc = calc;
        return;
      }
      if (porteField) porteField.hidden = false;
      if (descField) descField.hidden = false;
      if (boletoOpt) boletoOpt.disabled = false;
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
          linhas += `<div class="row total"><span>À vista no PIX</span><b>${OB.money(calc.valorCliente, m)}</b></div>`;
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
    // hospedagem (plano anual) é vendida sozinha — exclusividade mútua com os demais serviços
    // todos os serviços são múltipla escolha e somam (inclusive hospedagem)
    document.querySelectorAll('#s-prods input').forEach(cb => cb.onchange = () => { montarManual(); recalcular(); updateTreinoAviso(); });
    // marcar/desmarcar bônus recalcula o total (serviço em bônus tem valor ZERADO)
    document.querySelectorAll('#s-bonus input').forEach(cb => cb.onchange = () => { montarManual(); recalcular(); });
    if (sManual) sManual.onchange = () => { montarManual(); recalcular(); };
    sCli.onchange = () => { sincPorteComCliente(); recalcular(); };
    sPorte.onchange = recalcular;
    sDesc.onchange = recalcular;
    sPgto.onchange = () => { document.getElementById('s-pgto-hint').textContent = (OB.FORMAS_PAGAMENTO.find(f => f.id === sPgto.value) || {}).detalhe || ''; recalcular(); };
    sParcelas.onchange = recalcular;
    sPixDesc.onchange = recalcular;
    sMoeda.onchange = recalcular;
    updateTreinoAviso();
    montarManual();
    recalcular();
    document.getElementById('s-save').onclick = () => {
      const moeda = sMoeda.value;
      const produtos = prodsSel(); // já exclui os serviços marcados como bônus
      const bonus = bonusSel();    // bônus NUNCA entra no valor (cortesia)
      if (!produtos.length) { const f = document.getElementById('s-prods').closest('.field'); if (f) f.classList.add('has-error'); return UI.toast('Selecione os serviços', 'Marque ao menos um serviço pago (o bônus não é cobrado)', 'err'); }
      const valorBase = payBox._valorBase || 0;
      const manual = manualOn();
      if (!valorBase) return UI.toast(manual ? 'Informe o valor' : 'Selecione os serviços', manual ? 'O valor digitado ficou zerado' : 'O valor de tabela ficou zerado', 'err');
      const pfSave = (!manual && produtos.length === 1) ? OB.produtoPrecoFixo(produtos[0]) : null;
      const desc = (manual || pfSave) ? 0 : (parseInt(sDesc.value, 10) || 0);
      const calc = payBox._calc;
      OB.addSale({
        id: OB.uid(), consultorId: u.id, clientId: sCli.value,
        produto: produtos[0], produtos,
        valor: calc.valorServico, valorBruto: valorBase, valorCliente: calc.valorCliente, moeda,
        descontoTipo: desc ? 'percent' : null, descontoValor: desc,
        precoModo: manual ? 'manual' : 'tabela',
        formaPagamento: calc.forma, parcelas: calc.parcelas, pixDesconto: calc.pixDesconto,
        linkPagamento: (document.getElementById('s-link').value || '').trim(),
        bonus, bonusStatus: bonus.length ? 'pendente' : null, bonusObs: (document.getElementById('s-bonus-obs').value || '').trim(),
        acceptToken: OB.uid().replace(/-/g, ''), // token p/ o link de aceite do cliente
        data: new Date().toISOString(), statusComissao: 'disponivel',
        statusProposta: document.getElementById('s-status').value
      });
      this.autoContrato(OB.db.sales[OB.db.sales.length - 1]); // formalizou a venda -> gera o contrato
      UI.closeModal();
      if (bonus.length) UI.toast('Bônus aguardando autorização', 'O admin precisa autorizar o bônus antes de você enviar o orçamento ao cliente.', 'info');
      else UI.toast(orcamento ? 'Orçamento criado!' : 'Venda lançada!', '', 'ok');
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
            <td class="strong">${OB.money(s.valor, s.moeda)}</td><td><span class="chip ${pr.chip}">${pr.nome}</span>${(s.bonus || []).length ? (s.bonusStatus === 'pendente' ? ' <span class="chip warn nowrap">Bônus: aguardando admin</span>' : (s.bonusStatus === 'aprovado' ? ' <span class="chip green nowrap">Bônus autorizado</span>' : ' <span class="chip gray nowrap">Bônus recusado</span>')) : ''}</td>
            <td class="row" style="gap:6px;justify-content:flex-end">
              <button class="iconbtn" data-view="${s.id}" title="Visualizar em nova aba">${UI.icon('external',16)}</button>
              <button class="iconbtn" data-pdf="${s.id}" title="Gerar orçamento (PDF)">${UI.icon('download',16)}</button>
              <button class="iconbtn" data-share="${s.id}" title="Compartilhar">${UI.icon('share',16)}</button>
              ${s.acceptToken && s.statusProposta === 'aguardando' ? `<button class="iconbtn" data-lk="${s.id}" title="Copiar link de aceite" style="color:var(--brand)">${UI.icon('docs',16)}</button>` : ''}
              ${s.statusProposta==='aguardando'?`<button class="iconbtn" data-ap="${s.id}" title="Marcar aprovada" style="color:#1fa855">${UI.icon('check',16)}</button>`:''}
              <button class="iconbtn" data-edit="${s.id}" title="Editar">${UI.icon('edit',16)}</button>
              <button class="iconbtn" data-del="${s.id}" title="Excluir">${UI.icon('trash',16)}</button>
            </td></tr>`; }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => this.visualizarOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.view)));
      el.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => this.baixarOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.pdf)));
      el.querySelectorAll('[data-share]').forEach(b => b.onclick = () => this.compartilharOrcamento(OB.salesOf(u.id).find(x => x.id === b.dataset.share)));
      el.querySelectorAll('[data-lk]').forEach(b => b.onclick = () => { const s = OB.salesOf(u.id).find(x => x.id === b.dataset.lk); if (!s || this.bonusBloqueado(s)) return; navigator.clipboard.writeText(`${OB.APP_URL}/?aceite=${encodeURIComponent(s.id)}&t=${encodeURIComponent(s.acceptToken)}`).then(() => UI.toast('Link de aceite copiado', 'Cole no WhatsApp: o cliente vê a proposta, escolhe o pagamento e aceita.', 'ok')); });
      el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { this.setStatusProposta(b.dataset.ap, 'aprovada'); });
      el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => this.editarVenda(OB.salesOf(u.id).find(x => x.id === b.dataset.edit)));
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const s = OB.salesOf(u.id).find(x => x.id === b.dataset.del); UI.confirm('Excluir orçamento', `Remover a proposta de ${OB.clientById(s.clientId)?.nome||'cliente'}?`, () => { OB.removeContratoDaVenda(s.id); OB.removeSale(s.id); UI.toast('Orçamento excluído','','ok'); this.render('orcamentos'); }, 'Excluir'); });
    }
    document.getElementById('novo-orc').onclick = () => this.saleModal({ orcamento: true });
  },

  /* gera o orçamento branded (HTML autossuficiente p/ baixar/imprimir em PDF) */
  buildOrcamentoHTML(s, opts = {}) {
    const u = opts.u || this.u() || {}; const cli = opts.cli || OB.clientById(s.clientId);
    const publico = !!opts.publico;
    // linhas de serviço: 1 por produto. Com vários, mostra o preço de tabela de cada um
    // (pelo porte do cliente) e uma linha de ajuste quando o total foi personalizado.
    const prodIds = OB.produtosDaVenda(s);
    const porteCli = cli ? (cli.porte || 'pequena') : 'pequena';
    const bruto = s.valorBruto || s.valor;
    // porte realmente usado no orçamento (o que faz a tabela bater com o total salvo)
    let porteOrc = null;
    for (const pt of OB.PORTES) { if (prodIds.reduce((t, id) => t + (OB.precoTabela(id, pt.id) || 0), 0) === bruto) { porteOrc = pt.id; break; } }
    const porteFinal = porteOrc || porteCli;
    let linhasSvc = '';
    const escopoDe = (p, id) => (p && p.incluso) ? p.incluso : 'Desenvolvido pela OutBox Soluções Digitais';
    if (prodIds.length <= 1) {
      const p0 = OB.PRODUTOS.find(x => x.id === prodIds[0]);
      linhasSvc = `<tr><td><b>${p0 ? p0.nome : (prodIds[0] || 'Serviço')}</b><br><span style="color:var(--mut);font-size:13px;line-height:1.55">${escopoDe(p0, prodIds[0])}</span></td><td style="text-align:right">${OB.money(bruto, s.moeda)}</td></tr>`;
    } else {
      // usa o porte inferido acima: mostra o preço REAL de tabela de cada serviço
      const itens = prodIds.map(id => { const p = OB.PRODUTOS.find(x => x.id === id); return { nome: p ? p.nome : id, escopo: escopoDe(p, id), val: OB.precoTabela(id, porteFinal) || 0 }; });
      const somaTab = itens.reduce((t, i) => t + i.val, 0);
      if (porteOrc || somaTab === bruto) {
        // soma bate: mostra o preço REAL de tabela de cada serviço (hospedagem sai 1.200 exato)
        itens.forEach(it => { it.mostra = it.val; });
      } else {
        // fallback (valores antigos/personalizados): distribui proporcionalmente, fechando no subtotal
        let acum = 0;
        itens.forEach((it, idx) => {
          const ultimo = idx === itens.length - 1;
          const v = ultimo ? bruto - acum : Math.round(bruto * (somaTab ? it.val / somaTab : 1 / itens.length));
          it.mostra = Math.max(0, v); acum += v;
        });
      }
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
      // Bônus / cortesia (só exibe se não recusado pelo admin)
      const bonus = (s.bonus || []).filter(id => s.produtos.indexOf(id) < 0);
      if (!bonus.length || s.bonusStatus === 'recusado') return '';
      let economia = 0;
      const linhas = bonus.map(id => { const p = OB.PRODUTOS.find(x => x.id === id) || {}; const valTab = OB.precoTabela(id, porteFinal) || 0; economia += valTab;
        return `<tr><td><b>${p.nome || id}</b><br><span style="color:var(--mut);font-size:13px;line-height:1.55">${p.incluso || 'Cortesia da OutBox'}</span></td><td style="text-align:right;white-space:nowrap"><span style="text-decoration:line-through;color:var(--mut);font-size:13px">${OB.money(valTab, s.moeda)}</span><br><b style="color:#16a34a">Cortesia</b></td></tr>`; }).join('');
      return `<div style="margin:6px 0 22px"><div style="display:inline-flex;align-items:center;gap:7px;background:#e7f7ee;color:#15803d;font-weight:800;font-size:12px;padding:6px 12px;border-radius:999px;margin-bottom:10px">&#127873; BÔNUS EXCLUSIVO</div>
        <table class="tbl"><thead><tr><th>Você também leva de brinde</th><th style="text-align:right">Valor</th></tr></thead><tbody>${linhas}</tbody></table>
        <div style="text-align:right;font-size:14px;color:#15803d;font-weight:800;margin-top:-6px">Você economiza ${OB.money(economia, s.moeda)} em bônus &#127881;</div></div>`;
    })()}
    ${(() => {
      const m = s.moeda;
      const base = s.valorBruto || s.valor;
      const desc = s.descontoTipo === 'percent' ? (s.descontoValor || 0) : 0;
      const negociado = Math.round(base * (1 - desc / 100));
      const pixCalc = OB.calcPagamento(negociado, 'pix', { pixDesconto: !!s.pixDesconto });
      const parcOpts = [1, 3, 6, 12].map(n => OB.calcPagamento(negociado, 'cartao', { parcelas: n }));
      const escolha = s.formaAceite ? (s.formaAceite === 'cartao' ? `Cartão de crédito em ${s.parcelasAceite || 1}x · ${OB.money((parcOpts.find(c => c.parcelas === (s.parcelasAceite || 1)) || {}).valorCliente || 0, m)}` : `PIX à vista · ${OB.money(pixCalc.valorCliente, m)}`) : '';
      return `<div class="tot"><div class="box" style="min-width:340px">
        <div style="font-weight:800;font-size:15px;margin-bottom:10px;color:var(--ink)">Formas de pagamento</div>
        <div class="row"><span>Valor dos serviços${desc ? ` (tabela ${OB.money(base, m)}, ${desc}% off)` : ''}</span><b>${OB.money(negociado, m)}</b></div>
        <div style="border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:15px"><b style="color:var(--brand)">PIX à vista${s.pixDesconto ? ' · 5% de desconto' : ''}</b><b>${OB.money(pixCalc.valorCliente, m)}</b></div>
        </div>
        <div style="border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-top:9px">
          <b style="color:var(--brand);font-size:15px">Cartão de crédito · em até 12x</b>
          ${parcOpts.map(c => `<div style="display:flex;justify-content:space-between;font-size:14px;color:var(--soft);margin-top:7px"><span>${c.parcelas}x de <b style="color:var(--ink)">${OB.money(c.valorParcela, m)}</b></span><span>total ${OB.money(c.valorCliente, m)}</span></div>`).join('')}
        </div>
        ${escolha ? `<div class="row grand" style="margin-top:12px"><span>Escolha do cliente</span><b>${escolha}</b></div>` : `<div style="font-size:12.5px;color:var(--mut);margin-top:12px">&#128073; Você escolhe a forma e o número de parcelas no momento do aceite.</div>`}
      </div></div>`;
    })()}
    ${(() => {
      if (publico) return '';
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
</div>${publico ? '<style>.page{min-height:0}body{background:#fff}</style>' : '<button class="print-hint" onclick="window.print()">Salvar como PDF / Imprimir</button>'}</body></html>`;
  },
  /* orçamento com bônus PENDENTE fica travado até o admin autorizar (admin pode ver) */
  bonusBloqueado(s) {
    const u = OB.session() || {};
    if (s && s.bonusStatus === 'pendente' && (s.bonus || []).length && u.role !== 'admin') {
      UI.toast('Aguardando autorização do bônus', 'O admin precisa autorizar o bônus antes de gerar e enviar este orçamento ao cliente.', 'err');
      return true;
    }
    return false;
  },
  /* abre o orçamento renderizado em uma nova aba (apenas visualização) */
  visualizarOrcamento(s) {
    if (!s || this.bonusBloqueado(s)) return;
    const blob = new Blob([this.buildOrcamentoHTML(s)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) { URL.revokeObjectURL(url); UI.toast('Não foi possível abrir', 'Permita pop-ups para visualizar em nova aba.', 'err'); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  baixarOrcamento(s) {
    if (!s || this.bonusBloqueado(s)) return;
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
    // confere que a linha entrou mesmo no banco: sem isso o contrato fica só no
    // navegador e o link entregue ao cliente abre como "Contrato não encontrado"
    OB.salvarContratoConfirmado(c).then(r => {
      if (!r.ok) UI.toast('Contrato não foi salvo', 'Abra a Biblioteca de Contratos e tente de novo antes de enviar ao cliente. (' + r.erro + ')', 'err');
    });
    return c;
  },

  /* Antes de entregar qualquer link de aceite, confirma que o contrato existe no
     BANCO, e não apenas no cache do navegador. Se faltar, grava na hora. */
  async garantirContratoEnviavel(c) {
    if (!c || !c.id) return { ok: false, erro: 'contrato inválido' };
    if (!c.acceptToken) c.acceptToken = OB.uid().replace(/-/g, '');
    const existe = await OB.contratoNoBanco(c.id);
    if (existe === true) return { ok: true };
    const r = await OB.salvarContratoConfirmado(c);
    return r.ok ? { ok: true, reparado: true } : r;
  },

  linkAceite(c) { return `${OB.APP_URL}/?contrato=${encodeURIComponent(c.id)}&t=${encodeURIComponent(c.acceptToken)}`; },
  /* HTML do contrato (branded, logo + marca d'água em todas as páginas, aceite virtual) */
  buildContratoHTML(c) {
    let d = c.dados || {};
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_e) { d = {}; } } // dados pode chegar como string (jsonb duplo-encodado, ex.: via RPC pública)
    const e = d.empresa || {}; const p = d.pagamento || {}; const cl = d.cliente || {};
    const m = p.moeda || 'BRL';
    const money = v => OB.money(v, m);
    // datas robustas: nunca renderiza "Invalid Date"/"NaN"
    const parseData = iso => { if (!iso) return null; const dt = new Date(iso); return isNaN(dt.getTime()) ? null : dt; };
    const dataBR = iso => { const dt = parseData(iso); return dt ? dt.toLocaleDateString('pt-BR') : ''; };
    // data do contrato: usa a do snapshot; se faltar/for inválida, cai para a data de criação do registro
    const dataDoc = parseData(d.data) || parseData(c.criadoEm) || new Date();
    const dataExtenso = () => `${dataDoc.getDate()} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][dataDoc.getMonth()]} de ${dataDoc.getFullYear()}`;
    const nomes = (d.servicos || []).map(x => x.nome).join(', ');
    const negociado = Math.round((p.valorBase || 0) * (1 - (p.desconto || 0) / 100));
    const forma = p.forma || 'pix';
    const formaTxt = forma === 'cartao' ? `Cartão de crédito em ${p.parcelas || 1}x` : 'PIX à vista';
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
    const temJuros = forma === 'cartao' && (p.valorCliente || 0) > negociado;
    if (temJuros) payRows += `<tr><td>Juros do parcelamento (${p.parcelas}x)</td><td class="r">+ ${money((p.valorCliente || 0) - negociado)}</td></tr>`;
    payRows += `<tr class="tot"><td><b>Total ${forma === 'cartao' ? 'no cartão' : 'à vista'}</b></td><td class="r"><b>${money(p.valorCliente)}</b></td></tr>`;
    if (forma === 'cartao') payRows += `<tr><td>Parcelamento</td><td class="r"><b>${p.parcelas}x de ${money(Math.round((p.valorCliente / (p.parcelas || 1)) * 100) / 100)}</b></td></tr>`;
    const condPagamento = forma === 'cartao'
      ? `O pagamento será realizado por cartão de crédito, parcelado em ${p.parcelas}x de ${money(Math.round((p.valorCliente / (p.parcelas || 1)) * 100) / 100)}, totalizando ${money(p.valorCliente)}.${temJuros ? ' Os juros do parcelamento são cobrados pela operadora do cartão e já estão incluídos no valor total.' : ''}`
      : `O pagamento será realizado à vista, via PIX, no valor de ${money(p.valorCliente)}${p.pixDesconto ? ' (já aplicado o desconto de 5% para pagamento à vista)' : ''}, em até 3 (três) dias úteis a contar da assinatura deste contrato.`;
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
    const runHead = `<div class="sheet-head"><div class="lg">${markHead}<div><b>OutBox</b><span>Soluções Digitais</span></div></div><span class="hnum">Contrato ${c.numero} · ${dataDoc.toLocaleDateString('pt-BR')}</span></div>`;
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
      <p class="local clause">${cidadeSede.replace('/', ' - ')}, ${dataExtenso()}.</p>
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
/* ---- MOBILE: folha A4 fixa vira coluna única legível (a paginação A4 fica só p/ impressão/PDF) ---- */
@media screen and (max-width:820px){
  html,body{background:#fff}
  .doc{gap:0;padding:0 0 88px}
  .sheet{width:100%;height:auto;min-height:0;box-shadow:none;border-radius:0;padding:20px 18px 10px;overflow:visible}
  .sheet+.sheet{border-top:8px solid #eef1f4}
  .sheet-body{overflow:visible}
  .sheet-head{position:sticky;top:0;background:#fff;z-index:2;padding-top:6px}
  .sheet:not(:first-child) .sheet-head{display:none}
  .sheet-foot{display:none}
  h1{font-size:22px}
  .sub{font-size:14px;margin-bottom:16px}
  p,li{font-size:15px;line-height:1.65;text-align:left}
  h2{font-size:16.5px;margin:16px 0 6px}
  .parties{grid-template-columns:1fr;gap:10px}
  .party{font-size:14px;overflow-wrap:anywhere;word-break:break-word}
  .paytbl td{font-size:14px;padding:10px 8px}
  .paytbl tr.tot td{font-size:15.5px}
  .aceite{font-size:14px}
  .cta .accept{display:flex;width:100%;justify-content:center;padding:16px 20px;font-size:15px}
  .sign{grid-template-columns:1fr;gap:26px}
  .local{font-size:14px}
  .print-hint{left:16px;right:16px;bottom:16px;padding:14px 18px;font-size:15px;text-align:center}
}
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
  async copiarLinkAceiteContrato(c) {
    if (!c) return;
    const g = await this.garantirContratoEnviavel(c);
    if (!g.ok) return UI.toast('Não foi possível gerar o link', 'O contrato não está salvo no servidor. (' + g.erro + ')', 'err');
    const url = this.linkAceite(c);
    const msg = `Olá! Segue o contrato dos serviços com a OutBox para leitura e aceite:\n${url}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => UI.toast('Link copiado', 'Cole no WhatsApp/e-mail do cliente', 'ok')).catch(() => {});
    else UI.toast('Link do contrato', url, 'ok');
    return msg;
  },
  async enviarContratoModal(c) {
    if (!c) return;
    UI.toast('Conferindo o contrato', 'Validando no servidor antes de gerar o link', 'info');
    const g = await this.garantirContratoEnviavel(c);
    if (!g.ok) {
      return UI.modal({
        title: 'Não foi possível liberar o link',
        sub: `Contrato nº ${c.numero || ''}`,
        body: `<div class="notice" style="margin-bottom:0"><div class="grow" style="font-size:13.5px">
          Este contrato ainda não está salvo no servidor, então o link abriria como <b>Contrato não encontrado</b> para o cliente.
          <br><br>Tente de novo em instantes. Se continuar, avise o suporte com esta mensagem: <b>${g.erro}</b>.</div></div>`,
        footer: `<button class="btn ghost" data-close>Fechar</button>`
      });
    }
    if (g.reparado) UI.toast('Contrato regravado', 'Ele não estava no servidor e foi salvo agora', 'ok');
    const url = this.linkAceite(c);
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
    if (!s || this.bonusBloqueado(s)) return;
    const u = this.u(); const cli = OB.clientById(s.clientId);
    const p = OB.PRODUTOS.find(x => x.id === s.produto);
    const nome = cli ? cli.nome : 'cliente';
    const titulo = `Orçamento OutBox — ${nome}`;
    const aceiteUrl = s.acceptToken ? `${OB.APP_URL}/?aceite=${encodeURIComponent(s.id)}&t=${encodeURIComponent(s.acceptToken)}` : '';
    const texto = `Olá${cli ? ', ' + cli.nome.split(' ')[0] : ''}! Segue o orçamento ${OB.produtosNomes(s) ? 'de ' + OB.produtosNomes(s) + ' ' : ''}no valor de ${OB.money(s.valor, s.moeda)}.${aceiteUrl ? ` Para ver as formas de pagamento e aceitar a proposta, é só abrir: ${aceiteUrl}` : ''} Qualquer dúvida estou à disposição. — ${u.nome || 'OutBox'}`;
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
      title: 'Sua comissão',
      sub: `Nível ${r.nivel.nome} · taxa marginal ${(r.rate*100)|0}% · volume ${OB.fmt(r.volume)}`,
      body: `
        <div class="card" style="background:linear-gradient(135deg,var(--brand),var(--brand-600));color:#fff;border:none;margin-bottom:16px">
          <div style="font-size:12px;opacity:.85;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Disponível para solicitar agora</div>
          <div style="font-size:32px;font-weight:800;letter-spacing:-.02em;margin:2px 0 4px">${OB.fmt(r.disponivel)}</div>
          <div style="font-size:12px;opacity:.9">Liberada só de vendas com <b>pagamento confirmado</b> · taxa efetiva ${(r.efetiva*100).toFixed(1)}%</div>
        </div>
        ${linha('Em conferência', r.emConferencia, 'color:#d97706', 'Vendas aprovadas aguardando o admin confirmar o pagamento do cliente')}
        ${linha('Em análise pelo admin', r.emAnalise, 'color:var(--text)', 'Comissão já solicitada · repasse em até 3 dias úteis')}
        ${linha('Já pago', r.jaPago, 'color:#1fa855', 'Total já repassado a você')}
        <div class="nav-label" style="padding-left:0;margin-top:8px">${UI.icon('lock',12)} Bloqueado pelo sistema — desbloqueie batendo metas</div>
        ${bloqueadoHTML}
        <div class="notice" style="margin-top:14px">${UI.icon('shield',16)}<div>A comissão só fica <b>disponível para saque</b> depois que o cliente paga e o <b>administrador confirma o recebimento</b> no sistema. Até lá ela aparece em <b style="color:#d97706">Em conferência</b>. O saldo <b>acumula</b>: ele não zera na virada do mês, e você solicita quando quiser, a partir de <b>${OB.fmt(OB.saqueMinimo())}</b>. O cálculo é progressivo por faixa (8% a 20%) conforme o volume de cada mês.</div></div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button><button class="btn brand" id="cp-sol" ${r.disponivel <= 0 ? 'disabled' : ''}>${UI.icon('receipt',16)} Solicitar ${OB.fmt(r.disponivel)}</button>`
    });
    const sol = document.getElementById('cp-sol');
    if (sol) sol.onclick = () => { UI.closeModal(); this.solicitarComissao(OB.comissaoDisponivel(u.id)); };
  },

  solicitarComissao(com) {
    const uAtual = this.u();
    const saldo = OB.saldoSacavel(uAtual.id);
    const total = saldo.total;
    const volumeIncluido = (com.vendas || []).reduce((t, s) => t + s.valor, 0);
    if (total <= 0) return UI.toast('Nada disponível', 'Você não tem comissão liberada para solicitar', 'err');
    if (total < OB.saqueMinimo()) return UI.toast('Abaixo do mínimo', 'Valor mínimo para saque é de ' + OB.fmt(OB.saqueMinimo()), 'err');
    UI.modal({
      title: 'Solicitar pagamento de comissão',
      sub: 'O administrador será notificado imediatamente',
      body: `
        <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>O pagamento é feito <b>em até 3 dias úteis</b>, mediante a comprovação do serviço e dos valores que entraram na conta da OutBox.</div></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Vendas incluídas</span><b>${com.vendas.length}</b></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Volume dessas vendas</span><b>${OB.fmt(volumeIncluido)}</b></div>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Cálculo</span><b>Progressivo por faixa</b></div>
        <hr style="border:none;border-top:1px solid var(--border);margin:14px 0"/>
        <div class="row between" style="font-size:15px;margin-bottom:8px"><span class="soft">Comissão</span><b>${OB.fmt(saldo.comissao)}</b></div>
        <div class="row between" style="font-size:20px"><b>Total a receber</b><b style="color:var(--brand)">${OB.fmt(total)}</b></div>
        <div class="field" style="margin-top:16px"><label>Dados / chave PIX para recebimento <span class="req">*</span></label><input id="rq-pix" placeholder="CPF, e-mail, telefone ou chave aleatória"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="rq-go">Confirmar solicitação</button>`
    });
    document.getElementById('rq-go').onclick = () => {
      const pix = document.getElementById('rq-pix').value.trim();
      if (!pix) return UI.toast('Informe a chave PIX', '', 'err');
      const u = this.u();
      OB.addRequest({
        id: OB.uid(), tipo: 'comissao', consultorId: u.id,
        consultorNome: u.nome + ' ' + u.sobrenome, valor: total,
        detalhe: `${com.vendas.length} venda(s) · volume ${OB.fmt(volumeIncluido)} · progressivo${bonus ? ` · inclui bônus de boas-vindas de ${OB.fmt(bonus)}` : ''}`,
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

  /* ====================== PRODUTOS (catálogo de serviços) ====================== */
  /* porte escolhido pelo consultor: destaca a coluna de preço em todos os cards */
  _pcPorte: 'pequena',
  _pcTipo: 'todos',
  _pcBusca: '',

  view_produtos() {
    const v = document.getElementById('main-view');
    const porte = this._pcPorte;
    const lista = OB.catalogo();
    const pontuais = lista.filter(p => p.tipo !== 'recorrente').length;
    const recorrentes = lista.length - pontuais;
    const entrada = Math.min.apply(null, lista.map(p => p.precos[porte] || 0).filter(n => n > 0));

    v.innerHTML = `
      <section class="pc-hero">
        <div class="pc-hero-txt">
          <span class="pc-kicker">${UI.icon('quote', 14)} Tabela oficial · valores sem desconto</span>
          <h2>Tudo o que você pode vender</h2>
          <p>Escolha o porte da empresa do seu cliente e a tabela inteira se ajusta. Estes são os valores de tabela: o desconto comercial você aplica na hora de montar o orçamento.</p>
        </div>
        <div class="pc-hero-num">
          <div><b>${lista.length}</b><span>serviços</span></div>
          <div><b>${pontuais}</b><span>pontuais</span></div>
          <div><b>${recorrentes}</b><span>recorrentes</span></div>
          <div><b>${isFinite(entrada) ? OB.brl(entrada).replace(/,\d\d$/, '') : '—'}</b><span>a partir de</span></div>
        </div>
      </section>

      <div class="pc-portes" role="tablist" aria-label="Porte da empresa do cliente">
        ${OB.PORTES.map(pt => `
          <button type="button" class="pc-porte-btn${pt.id === porte ? ' on' : ''}" data-porte="${pt.id}" role="tab" aria-selected="${pt.id === porte}">
            <b>${pt.nome}</b><small>${pt.faixa}</small>
          </button>`).join('')}
      </div>

      <div class="pc-bar">
        <div class="pc-filtros" role="tablist" aria-label="Tipo de serviço">
          ${[['todos', 'Todos'], ['pontual', 'Pontuais'], ['recorrente', 'Recorrentes']].map(([id, lb]) =>
            `<button type="button" class="pc-fil${this._pcTipo === id ? ' on' : ''}" data-tipo="${id}" role="tab" aria-selected="${this._pcTipo === id}">${lb}</button>`).join('')}
        </div>
        <div class="pc-busca">
          <label class="sr-only" for="pc-q">Buscar serviço</label>
          ${UI.icon('search', 16)}
          <input id="pc-q" type="search" placeholder="Buscar serviço..." value="${this._pcBusca.replace(/"/g, '&quot;')}"/>
        </div>
        <button class="btn ghost sm" id="pc-tabela">${UI.icon('docs', 15)} Tabela completa</button>
      </div>

      <div class="pc-grid" id="pc-grid"></div>

      <div class="notice" style="margin-top:20px">${UI.icon('info', 16)}<div>
        Os valores acima são de tabela. No orçamento você pode conceder os descontos liberados para a faixa da proposta e o sistema calcula sozinho o parcelamento e a sua comissão.
      </div></div>`;

    this._pcPintar();
    v.querySelectorAll('[data-porte]').forEach(b => b.onclick = () => { this._pcPorte = b.dataset.porte; this.view_produtos(); });
    v.querySelectorAll('[data-tipo]').forEach(b => b.onclick = () => { this._pcTipo = b.dataset.tipo; this.view_produtos(); });
    const q = document.getElementById('pc-q');
    q.oninput = () => { this._pcBusca = q.value; this._pcPintar(); };
    document.getElementById('pc-tabela').onclick = () => this.pcTabelaCompleta();
  },

  /* redesenha só a grade (busca não recarrega a tela toda, o foco fica no campo) */
  _pcPintar() {
    const g = document.getElementById('pc-grid'); if (!g) return;
    const porte = this._pcPorte;
    const semAcento = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const termo = semAcento(this._pcBusca).trim();
    const lista = OB.catalogo().filter(p => {
      if (this._pcTipo === 'pontual' && p.tipo === 'recorrente') return false;
      if (this._pcTipo === 'recorrente' && p.tipo !== 'recorrente') return false;
      if (!termo) return true;
      return semAcento((p.nome || '') + ' ' + (p.resumo || '') + ' ' + (p.incluso || '')).indexOf(termo) >= 0;
    });
    if (!lista.length) {
      g.innerHTML = `<div class="empty" style="grid-column:1/-1">${UI.icon('search', 26)}<b>Nenhum serviço encontrado</b><p>Tente outro termo ou volte para "Todos".</p></div>`;
      return;
    }
    g.innerHTML = lista.map(p => this.pcCard(p, porte)).join('');
    g.querySelectorAll('[data-det]').forEach(b => b.onclick = () => this.pcDetalhe(b.dataset.det));
    g.querySelectorAll('[data-pcporte]').forEach(b => b.onclick = () => { this._pcPorte = b.dataset.pcporte; this.view_produtos(); });
    g.querySelectorAll('[data-orc]').forEach(b => b.onclick = () => App.go('orcamentos'));
  },

  pcCard(p, porte) {
    const valor = p.precos[porte] || 0;
    const rec = p.tipo === 'recorrente';
    const periodo = OB.produtoPeriodo(p);
    const comissao = Math.round(valor * 0.08);
    return `
      <article class="pc-card${p.destaque ? ' destaque' : ''}">
        <header class="pc-card-head">
          <span class="pc-ico">${UI.icon(p.icone || 'briefcase', 20)}</span>
          <div class="grow">
            <h3>${p.nome}</h3>
            <span class="pc-tag ${rec ? 'rec' : 'pon'}">${rec ? 'Recorrente' : 'Pontual'}</span>
          </div>
        </header>
        <p class="pc-resumo">${p.resumo || (p.incluso || '').slice(0, 120)}</p>

        <div class="pc-destaque">
          <span class="pc-destaque-lb">${(OB.PORTES.find(x => x.id === porte) || {}).nome || ''}</span>
          <b class="pc-destaque-val">${OB.brl(valor)}</b>
          <span class="pc-destaque-per">${periodo}</span>
        </div>

        <div class="pc-precos" role="group" aria-label="Valores por porte">
          ${OB.PORTES.map(pt => `
            <button type="button" class="pc-preco${pt.id === porte ? ' on' : ''}" data-pcporte="${pt.id}" title="Ver este porte na tabela inteira">
              <span>${pt.nome.replace(' empresa', '')}</span><b>${OB.brl(p.precos[pt.id] || 0)}</b>
            </button>`).join('')}
        </div>

        <ul class="pc-meta">
          <li>${UI.icon('clock', 14)} ${p.entrega || 'prazo combinado no briefing'}</li>
          <li>${UI.icon('percent', 14)} Comissão a partir de ${OB.brl(comissao)}</li>
        </ul>

        <div class="pc-pgto">${(p.pagamentos || []).map(f => `<span class="pc-chip">${OB.pagamentoNome(f)}</span>`).join('')}</div>

        <footer class="pc-acts">
          <button class="btn ghost sm" data-det="${p.id}">${UI.icon('eye', 15)} Detalhes</button>
          <button class="btn brand sm" data-orc="${p.id}">${UI.icon('quote', 15)} Montar orçamento</button>
        </footer>
      </article>`;
  },

  pcDetalhe(id) {
    const p = OB.produtoById(id); if (!p) return;
    const porte = this._pcPorte;
    const valor = p.precos[porte] || 0;
    const nMax = p.parcelasMax || 12;
    const cartao = OB.calcPagamento(valor, 'cartao', { parcelas: nMax });
    const pix = OB.calcPagamento(valor, 'pix', { pixDesconto: true });
    UI.modal({
      title: p.nome,
      sub: (p.tipo === 'recorrente' ? 'Serviço recorrente · ' : 'Serviço pontual · ') + OB.produtoPeriodo(p),
      size: 'lg',
      body: `
        <p class="pd-lead">${p.resumo || ''}</p>

        <div class="pd-bloco">
          <h4>${UI.icon('check', 15)} O que está incluso</h4>
          <p>${p.incluso || 'Escopo detalhado no briefing do projeto.'}</p>
        </div>

        <div class="pd-bloco">
          <h4>${UI.icon('money', 15)} Valores de tabela</h4>
          <div class="pd-tab">
            ${OB.PORTES.map(pt => `
              <div class="pd-tab-l${pt.id === porte ? ' on' : ''}">
                <div><b>${pt.nome}</b><small>${pt.faixa}</small></div>
                <span>${OB.brl(p.precos[pt.id] || 0)}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="pd-bloco">
          <h4>${UI.icon('receipt', 15)} Como o cliente pode pagar</h4>
          <div class="pd-sim">
            <div class="pd-sim-c"><span>PIX à vista</span><b>${OB.brl(pix.valorCliente)}</b><small>já com os 5% de desconto que você pode conceder</small></div>
            <div class="pd-sim-c"><span>Cartão em ${nMax}x</span><b>${OB.brl(cartao.valorParcela)}</b><small>total de ${OB.brl(cartao.valorCliente)} com os juros da operadora</small></div>
          </div>
          <ul class="pd-forms">
            ${(p.pagamentos || []).map(f => { const fo = OB.PAGAMENTOS.find(x => x.id === f) || {}; return `<li><b>${fo.nome || f}</b><span>${fo.desc || ''}</span></li>`; }).join('')}
          </ul>
        </div>

        <div class="pd-bloco">
          <h4>${UI.icon('clock', 15)} Prazo de entrega</h4>
          <p>${p.entrega || 'Definido no briefing, conforme o escopo aprovado.'}</p>
        </div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button><button class="btn brand" id="pd-orc">${UI.icon('quote', 16)} Montar orçamento</button>`
    });
    document.getElementById('pd-orc').onclick = () => { UI.closeModal(); App.go('orcamentos'); };
  },

  pcTabelaCompleta() {
    const lista = OB.catalogo();
    UI.modal({
      title: 'Tabela completa de serviços',
      sub: 'Valores de tabela por porte da empresa, sem desconto comercial',
      size: 'lg',
      body: `
        <div class="table-wrap">
          <table class="pc-full">
            <thead><tr><th>Serviço</th>${OB.PORTES.map(pt => `<th>${pt.nome.replace(' empresa', '')}</th>`).join('')}<th>Cobrança</th></tr></thead>
            <tbody>
              ${lista.map(p => `<tr>
                <td><b>${p.nome}</b></td>
                ${OB.PORTES.map(pt => `<td>${OB.brl(p.precos[pt.id] || 0)}</td>`).join('')}
                <td><span class="pc-tag ${p.tipo === 'recorrente' ? 'rec' : 'pon'}">${OB.produtoPeriodo(p)}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button>`
    });
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
.sign .sig-img{display:block;height:86px;width:auto;max-width:100%;object-fit:contain;object-position:center bottom;margin:-16px auto 0}
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
      <div class="sign">${OB.ASSINATURA_OUTBOX ? `<img class="sig-img" src="${OB.ASSINATURA_OUTBOX}" alt="Assinatura de Felipe Melo Rocha"/>` : '<div class="sig">Felipe Melo Rocha</div>'}<div class="ln"><b>Felipe Melo Rocha</b><span>CEO · OutBox Group Soluções Digitais</span></div></div>
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
    const quiz = TREINOS.QUIZ[id]; const prod = TREINOS.buscar(id);
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
    const quiz = TREINOS.QUIZ[id]; const prod = TREINOS.buscar(id);
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
    const st = this._quiz; const quiz = TREINOS.QUIZ[st.id]; const prod = TREINOS.buscar(st.id);
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
    const steps = OB.ETAPAS_PROJETO;
    let html = '<div class="tl">';
    steps.forEach((e, i) => {
      if (i > 0) html += `<div class="tl-line${i <= atual ? ' fill' : ''}"></div>`;
      const cls = i < atual ? 'done' : (i === atual ? 'now' : 'todo');
      const data = proj[e.campo] ? OB.dataBR(proj[e.campo]) : '';
      const ic = i < atual ? 'check' : e.icon;
      html += `<div class="tl-step ${cls}" style="--d:${i * 60}ms">
        <div class="tl-dot">${i <= atual ? UI.icon(ic, 13) : (i + 1)}</div>
        <div class="tl-lbl">${e.nome}</div>
        <div class="tl-date">${data || '&nbsp;'}</div>
      </div>`;
    });
    return html + '</div>';
  },

  view_projetos() {
    const u = this.u();
    const v = document.getElementById('main-view');
    // Projetos = fase de INÍCIO (envio de briefing). O acompanhamento vive em "Linha do Tempo".
    const vendas = OB.salesOf(u.id).filter(s => s.statusProposta === 'aprovada').sort((a, b) => new Date(b.data) - new Date(a.data));
    const pagasSemBrief = vendas.filter(s => s.statusPagamento === 'recebido' && !OB.projetoDaVenda(s.id));
    const aguardando = vendas.filter(s => s.statusPagamento !== 'recebido');
    const emAcompanhamento = OB.projetosDe(u.id).length;

    v.innerHTML = `
      <div class="bf-cta card">
        <span class="tr-ic on">${UI.icon('send', 20)}</span>
        <div class="bf-cta__txt"><b>Compartilhar um briefing</b><span>Escolha o cliente e o serviço. Geramos um link que já salva as respostas em <b>Briefings</b>, em tempo real.</span></div>
        <button class="btn brand" data-compartilhar-briefing="">${UI.icon('send', 16)} Compartilhar briefing</button>
      </div>
      <div class="cards cols-3" style="margin:16px 0">
        ${this.kpi('docs', OB.projetosDe(u.id).filter(p => p.briefingRespostas).length, 'Briefings recebidos', 'Veja todos em Briefings')}
        ${this.kpi('clock', OB.projetosDe(u.id).filter(p => p.status === 'briefing_enviado').length, 'Aguardando o cliente', 'Briefings compartilhados')}
        ${this.kpi('trend', emAcompanhamento, 'Em acompanhamento', 'Veja tudo na Linha do Tempo')}
      </div>
      ${emAcompanhamento ? `<button class="btn ghost" id="ir-timeline" style="margin-bottom:16px">${UI.icon('trend',16)} Ir para a Linha do Tempo (${emAcompanhamento})</button>` : ''}
      ${this.bibliotecaBriefings()}
      ${pagasSemBrief.length ? `<div class="nav-label" style="padding-left:0">Serviços pagos, prontos para o briefing</div>${pagasSemBrief.map(s => this.projetoCard(s)).join('')}` : ''}
      ${aguardando.length ? `<div class="nav-label" style="padding-left:0;margin-top:18px">Aguardando confirmação de pagamento</div>${aguardando.map(s => this.projetoCard(s)).join('')}` : ''}`;

    const irTl = document.getElementById('ir-timeline'); if (irTl) irTl.onclick = () => App.go('timeline');
    v.querySelectorAll('[data-brief]').forEach(b => b.onclick = () => this.enviarBriefing(b.dataset.brief));
    v.querySelectorAll('[data-brief-recebido]').forEach(b => b.onclick = () => this.marcarBriefingRecebido(b.dataset.briefRecebido));
    v.querySelectorAll('[data-relatorio]').forEach(b => b.onclick = () => this.emitirRelatorio(b.dataset.relatorio));
    v.querySelectorAll('[data-aprovar-proj]').forEach(b => b.onclick = () => this.aprovarProjeto(b.dataset.aprovarProj));
    v.querySelectorAll('[data-share-final]').forEach(b => b.onclick = () => this.compartilharLinkFinal(b.dataset.shareFinal));
    this.wireArquivos(v, () => this.render('projetos'));
  },

  /* ====================== LINHA DO TEMPO (acompanhamento em tempo real) ====================== */
  view_timeline() {
    const u = this.u();
    const v = document.getElementById('main-view');
    const projs = OB.projetosDe(u.id).slice().sort((a, b) => OB.etapaIndex(a.status) - OB.etapaIndex(b.status) || new Date(b.criadoEm) - new Date(a.criadoEm));
    const ativos = projs.filter(p => p.status !== 'aprovado');
    const concluidos = projs.filter(p => p.status === 'aprovado');
    const aguardPag = OB.salesOf(u.id).filter(s => s.statusProposta === 'aprovada' && s.statusPagamento !== 'recebido').length;

    v.innerHTML = `
      <div class="cards cols-3" style="margin-bottom:16px">
        ${this.kpi('rocket', ativos.length, 'Serviços em andamento', 'Do briefing à entrega')}
        ${this.kpi('check', concluidos.length, 'Serviços concluídos', 'Aprovados pelo cliente')}
        ${this.kpi('clock', aguardPag, 'Aguardando pagamento', 'Envie o briefing em Projetos')}
      </div>
      <div class="notice" style="margin-bottom:16px">${UI.icon('info',16)}<div>Acompanhe cada serviço <b>em tempo real</b>: conforme a OutBox avança as etapas, a linha do tempo se move sozinha. Baixe as <b>entregas</b> e organize os <b>materiais</b> do projeto aqui. Compartilhe o andamento com o seu cliente pelo relatório.</div></div>
      ${ativos.length ? `<div class="nav-label" style="padding-left:0">Em andamento</div>${ativos.map(p => this.projetoWorkspaceCard(p)).join('')}` : ''}
      ${concluidos.length ? `<div class="nav-label" style="padding-left:0;margin-top:18px">Concluídos</div>${concluidos.map(p => this.projetoWorkspaceCard(p)).join('')}` : ''}
      ${!projs.length ? this.empty('trend', 'Nenhum serviço em andamento', 'Quando você enviar um briefing em Projetos, o serviço aparece aqui com a linha do tempo em tempo real.') : ''}`;

    v.querySelectorAll('[data-brief]').forEach(b => b.onclick = () => this.enviarBriefing(b.dataset.brief));
    v.querySelectorAll('[data-brief-recebido]').forEach(b => b.onclick = () => this.marcarBriefingRecebido(b.dataset.briefRecebido));
    v.querySelectorAll('[data-relatorio]').forEach(b => b.onclick = () => this.emitirRelatorio(b.dataset.relatorio));
    v.querySelectorAll('[data-aprovar-proj]').forEach(b => b.onclick = () => this.aprovarProjeto(b.dataset.aprovarProj));
    v.querySelectorAll('[data-share-final]').forEach(b => b.onclick = () => this.compartilharLinkFinal(b.dataset.shareFinal));
    this.wireArquivos(v, () => this.render('timeline'));
  },

  /* card completo de acompanhamento de um projeto (timeline + ações + arquivos) */
  projetoWorkspaceCard(proj) {
    const cli = OB.clientById(proj.clientId);
    const nomes = (proj.produtos || []).map(id => (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id).join(' + ');
    const et = OB.ETAPAS_PROJETO.find(e => e.id === proj.status) || {};
    return `<div class="card proj-card">
      <div class="row between alc" style="gap:12px;flex-wrap:wrap">
        <div class="row alc" style="gap:10px;min-width:0">
          <span class="tr-ic on">${UI.icon('briefcase',18)}</span>
          <div style="min-width:0"><b style="font-size:15px">${cli ? cli.nome : 'Cliente'}</b>
            <div class="mut" style="font-size:12.5px">${nomes}</div></div>
        </div>
        <span class="chip ${proj.status === 'aprovado' ? 'green' : 'brand'} nowrap">${et.nome || ''}</span>
      </div>
      <div style="margin-top:14px">${this.timelineHTML(proj)}</div>
      ${this.projetoAcoesHTML(proj)}
      ${this.projArquivosHTML(proj, { admin: false })}
    </div>`;
  },

  /* ====================== BRIEFINGS (arquivo dos briefings preenchidos) ====================== */
  _bfFiltro: { cliente: '', servico: '', de: '', ate: '' },
  view_briefings() {
    const u = this.u();
    const v = document.getElementById('main-view');
    const all = OB.projetosDe(u.id).filter(p => p.briefingRespostas).slice()
      .sort((a, b) => new Date(b.briefingRecebidoEm || b.criadoEm) - new Date(a.briefingRecebidoEm || a.criadoEm));
    if (!all.length) { v.innerHTML = this.empty('docs', 'Nenhum briefing recebido ainda', 'Quando o seu cliente finalizar e enviar o briefing, ele fica guardado aqui para você consultar e baixar quando quiser.'); return; }
    const servIds = [...new Set(all.flatMap(p => p.produtos || []))];
    const semana = Date.now() - 7 * 864e5;
    const novos = all.filter(p => new Date(p.briefingRecebidoEm || p.criadoEm).getTime() >= semana).length;
    const emAndamento = all.filter(p => p.status !== 'aprovado').length;
    const f = this._bfFiltro;
    v.innerHTML = `
      <div class="kpis-3" style="margin-bottom:16px">
        <div class="card kpi"><div class="ic">${UI.icon('docs', 20)}</div><div class="k-val">${all.length}</div><div class="k-lbl">Briefings recebidos</div></div>
        <div class="card kpi"><div class="ic ic-ok">${UI.icon('bell', 20)}</div><div class="k-val" style="color:#16a34a">${novos}</div><div class="k-lbl">Nos últimos 7 dias</div></div>
        <div class="card kpi"><div class="ic ic-warn">${UI.icon('rocket', 20)}</div><div class="k-val" style="color:var(--brand)">${emAndamento}</div><div class="k-lbl">Projetos em andamento</div></div>
      </div>
      <div class="lib-head"><b>Briefings recebidos</b><span class="lib-count" id="bf-count">${all.length} briefings</span></div>
      <div class="ctl-toolbar">
        <div class="ctl-search">${UI.icon('search', 16)}<input id="bf-cliente" placeholder="Buscar por cliente" value="${f.cliente}"/></div>
        <div class="ctl-selrow">
          <div class="ctl-sel"><label for="bf-servico">Tipo de serviço</label>
            <select id="bf-servico"><option value="">Todos os serviços</option>${OB.PRODUTOS.filter(p => servIds.includes(p.id)).map(p => `<option value="${p.id}" ${f.servico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></div>
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
        const dia = (p.briefingRecebidoEm || p.criadoEm || '').slice(0, 10);
        if (ff.de && dia < ff.de) return false;
        if (ff.ate && dia > ff.ate) return false;
        return true;
      });
      const cnt = document.getElementById('bf-count'); if (cnt) cnt.textContent = `${rows.length} de ${all.length} briefings`;
      const el = document.getElementById('bf-table');
      if (!rows.length) { el.innerHTML = this.empty('search', 'Nada neste filtro', 'Ajuste os filtros para ver os briefings.'); return; }
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>
        <th>Data</th><th>Cliente</th><th>Serviço(s)</th><th>Etapa</th><th></th></tr></thead><tbody>
        ${rows.map(p => {
          const cl = OB.clientById(p.clientId) || {};
          const svc = (p.produtos || []).map(id => (OB.PRODUTOS.find(x => x.id === id) || {}).nome || id).join(' + ');
          const et = OB.ETAPAS_PROJETO.find(e => e.id === p.status) || {};
          return `<tr><td class="nowrap">${OB.dataBR(p.briefingRecebidoEm || p.criadoEm)}</td>
            <td class="strong">${cl.nome || '-'}</td><td>${svc}</td>
            <td><span class="chip ${p.status === 'aprovado' ? 'green' : p.status === 'briefing_recebido' ? 'warn' : 'brand'} nowrap">${et.nome || ''}</span></td>
            <td class="row" style="justify-content:flex-end;gap:4px;flex-wrap:wrap">${this.briefingsDoProjeto(p).map(b => `<button class="btn ghost sm" data-ver-brief="${p.id}" data-brief-tipo="${b.tipo}" title="Ver o briefing de ${b.nome}">${UI.icon('eye',14)} ${b.nome}</button><button class="iconbtn" data-baixar-brief="${p.id}" data-brief-tipo="${b.tipo}" title="Baixar o briefing de ${b.nome}">${UI.icon('download',15)}</button>`).join('')}</td></tr>`;
        }).join('')}
      </tbody></table></div>`;
      el.querySelectorAll('[data-ver-brief]').forEach(b => b.onclick = () => this.visualizarBriefing(b.dataset.verBrief, b.dataset.briefTipo));
      el.querySelectorAll('[data-baixar-brief]').forEach(b => b.onclick = () => this.baixarBriefing(b.dataset.baixarBrief, b.dataset.briefTipo));
    };
    const capt = () => { this._bfFiltro = {
      cliente: document.getElementById('bf-cliente').value,
      servico: document.getElementById('bf-servico').value,
      de: document.getElementById('bf-de').value,
      ate: document.getElementById('bf-ate').value
    }; draw(); };
    ['bf-servico', 'bf-de', 'bf-ate'].forEach(id => { const el = document.getElementById(id); if (el) el.onchange = capt; });
    const busca = document.getElementById('bf-cliente'); let t; busca.oninput = () => { clearTimeout(t); t = setTimeout(capt, 300); };
    document.getElementById('bf-limpar').onclick = () => { this._bfFiltro = { cliente: '', servico: '', de: '', ate: '' }; this.view_briefings(); };
    draw();
  },

  /* ---------- ARQUIVOS do projeto (entregas da OutBox p/ baixar + materiais do consultor) ---------- */
  _fmtTam(b) { b = Number(b) || 0; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; },
  _arqIcone(a) { const m = a.mime || ''; if (a.categoria === 'link') return 'external'; if (m.indexOf('image/') === 0) return 'gallery'; if (m.indexOf('pdf') >= 0) return 'contract'; return 'docs'; },
  arqItemHTML(a, canDel) {
    const isLink = a.categoria === 'link';
    const meta = isLink ? (a.url || '') : this._fmtTam(a.tamanho);
    const nome = (a.nome || (isLink ? a.url : 'arquivo') || '').replace(/</g, '&lt;');
    return `<div class="arq-item">
      <span class="arq-ic">${UI.icon(this._arqIcone(a), 15)}</span>
      <div class="arq-meta"><b>${nome}</b><span>${(meta || '').replace(/</g, '&lt;')}</span></div>
      <button class="iconbtn" data-arq-get="${a.id}" title="${isLink ? 'Abrir' : 'Baixar'}">${UI.icon(isLink ? 'external' : 'download', 15)}</button>
      ${canDel ? `<button class="iconbtn danger" data-arq-del="${a.id}" title="Remover">${UI.icon('trash', 15)}</button>` : ''}
    </div>`;
  },
  projArquivosHTML(proj, opts) {
    opts = opts || {}; const isAdmin = !!opts.admin;
    const entregas = OB.entregasDoProjeto(proj.id);
    const uploads = OB.uploadsDoProjeto(proj.id);
    const solicitacoes = OB.solicitacoesDoProjeto(proj.id);
    // solicitações da OutBox (admin pede material ao consultor) — destaque âmbar, mensagem em tempo real
    const solBloco = solicitacoes.length ? `
      <div class="arq-group sol-group">
        <div class="arq-head">${UI.icon('bell', 14)} Solicitações da OutBox <i>${solicitacoes.length}</i></div>
        <div class="arq-list">${solicitacoes.map(a => `<div class="sol-item">
          <span class="arq-ic">${UI.icon('bell', 15)}</span>
          <div class="arq-meta"><b>${(a.nome || 'Material solicitado').replace(/</g, '&lt;')}</b><span>${isAdmin ? 'Enviada ao consultor' : 'Envie o material em "Materiais do projeto" abaixo'}</span></div>
          <button class="iconbtn" data-arq-del="${a.id}" title="${isAdmin ? 'Remover solicitação' : 'Marcar como atendida'}">${UI.icon('check', 15)}</button>
        </div>`).join('')}</div>
      </div>` : '';
    const entregaBloco = (entregas.length || isAdmin) ? `
      <div class="arq-group">
        <div class="arq-head">${UI.icon('download', 14)} Entregas da OutBox${entregas.length ? ` <i>${entregas.length}</i>` : ''}</div>
        ${entregas.length ? `<div class="arq-list">${entregas.map(a => this.arqItemHTML(a, isAdmin)).join('')}</div>` : `<div class="arq-empty">Nenhum arquivo de entrega ainda.</div>`}
      </div>` : '';
    const uploadBloco = `
      <div class="arq-group">
        <div class="arq-head">${UI.icon('gallery', 14)} Materiais do projeto${uploads.length ? ` <i>${uploads.length}</i>` : ''}
          ${!isAdmin ? `<span class="arq-add">
            <button type="button" class="btn ghost xs" data-arq-up="${proj.id}|imagem">${UI.icon('gallery', 13)} Imagem</button>
            <button type="button" class="btn ghost xs" data-arq-up="${proj.id}|copy">${UI.icon('docs', 13)} Copy</button>
            <button type="button" class="btn ghost xs" data-arq-link="${proj.id}">${UI.icon('external', 13)} Link</button>
          </span>` : ''}
        </div>
        ${uploads.length ? `<div class="arq-list">${uploads.map(a => this.arqItemHTML(a, !isAdmin)).join('')}</div>` : `<div class="arq-empty">${isAdmin ? 'O consultor ainda não enviou materiais.' : 'Suba imagens, textos de copy e links do projeto para deixar tudo organizado.'}</div>`}
      </div>`;
    return `<div class="proj-arqs">${solBloco}${entregaBloco}${uploadBloco}</div>`;
  },
  /* admin envia uma solicitação de material — vira mensagem em tempo real p/ o consultor */
  enviarSolicitacao(projId, texto) {
    const t = (texto || '').trim(); if (!t) return false;
    OB.addArquivo({ id: OB.uid(), projetoId: projId, autor: 'admin', categoria: 'solicitacao', nome: t, mime: '', tamanho: 0, url: '' });
    UI.toast('Solicitação enviada', 'O consultor foi avisado em tempo real.', 'ok');
    return true;
  },
  async subirArquivos(projId, categoria, autor, files) {
    const MAX = 8 * 1024 * 1024; let n = 0;
    for (const f of files) {
      if (f.size > MAX) { UI.toast('Arquivo grande', `${f.name} passa de 8 MB e foi ignorado.`, 'err'); continue; }
      const dados = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(f); });
      if (!dados) continue;
      OB.addArquivo({ id: OB.uid(), projetoId: projId, autor, categoria, nome: f.name, mime: f.type || '', tamanho: f.size, dados });
      n++;
    }
    if (n) UI.toast('Enviado', `${n} arquivo(s) adicionado(s).`, 'ok');
    return n;
  },
  anexarArquivosModal(projId, categoria, autor, onDone) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true;
    if (categoria === 'imagem') inp.accept = 'image/*';
    inp.style.display = 'none'; document.body.appendChild(inp);
    inp.onchange = async () => { if (inp.files.length) { await this.subirArquivos(projId, categoria, autor, [...inp.files]); if (onDone) onDone(); } inp.remove(); };
    inp.click();
  },
  adicionarLinkModal(projId, onDone) {
    UI.modal({ title: 'Adicionar link do projeto', sub: 'Figma, Drive, referência, site publicado...', body: `
      <div class="field"><label>Título <span style="font-weight:400;color:var(--text-mut)">(opcional)</span></label><input id="al-nome" placeholder="Ex.: Layout no Figma"/></div>
      <div class="field"><label>Link <span class="req">*</span></label><input id="al-url" type="url" placeholder="https://..."/><div class="err">Informe o link</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="al-ok">Adicionar</button>` });
    document.getElementById('al-ok').onclick = () => {
      const url = (document.getElementById('al-url').value || '').trim();
      if (!url) { document.getElementById('al-url').closest('.field').classList.add('has-error'); return; }
      const nome = (document.getElementById('al-nome').value || '').trim() || url;
      OB.addArquivo({ id: OB.uid(), projetoId: projId, autor: 'consultor', categoria: 'link', nome, url, mime: '', tamanho: 0 });
      UI.closeModal(); UI.toast('Link adicionado', '', 'ok'); if (onDone) onDone();
    };
  },
  async baixarArquivo(id) {
    const a = OB.arquivoById(id); if (!a) return;
    if (a.categoria === 'link') { if (a.url) window.open(a.url, '_blank', 'noopener'); return; }
    UI.toast('Baixando...', '', 'info');
    const dados = await OB.getArquivoDados(id);
    if (!dados) return UI.toast('Indisponível', 'Não foi possível baixar o arquivo.', 'err');
    const el = document.createElement('a'); el.href = dados; el.download = a.nome || 'arquivo'; document.body.appendChild(el); el.click(); el.remove();
  },
  wireArquivos(root, onDone) {
    root.querySelectorAll('[data-arq-get]').forEach(b => b.onclick = () => this.baixarArquivo(b.dataset.arqGet));
    root.querySelectorAll('[data-arq-del]').forEach(b => b.onclick = () => { const a = OB.arquivoById(b.dataset.arqDel); if (!a) return; UI.confirm('Remover arquivo', `Remover <b>${(a.nome || 'este item').replace(/</g, '&lt;')}</b>?`, () => { OB.removeArquivo(a.id); UI.toast('Removido', '', 'ok'); if (onDone) onDone(); }, 'Remover'); });
    root.querySelectorAll('[data-arq-up]').forEach(b => b.onclick = () => { const parts = b.dataset.arqUp.split('|'); this.anexarArquivosModal(parts[0], parts[1], 'consultor', onDone); });
    root.querySelectorAll('[data-arq-link]').forEach(b => b.onclick = () => this.adicionarLinkModal(b.dataset.arqLink, onDone));
    root.querySelectorAll('[data-ver-brief]').forEach(b => b.onclick = () => this.visualizarBriefing(b.dataset.verBrief, b.dataset.briefTipo));
    root.querySelectorAll('[data-baixar-brief]').forEach(b => b.onclick = () => this.baixarBriefing(b.dataset.baixarBrief, b.dataset.briefTipo));
    root.querySelectorAll('[data-compartilhar-proj]').forEach(b => b.onclick = () => this.compartilharLinkBriefing(b.dataset.compartilharProj));
    root.querySelectorAll('[data-compartilhar-briefing]').forEach(b => b.onclick = () => this.compartilharBriefingModal(b.dataset.compartilharBriefing || ''));
    root.querySelectorAll('[data-del-proj]').forEach(b => b.onclick = () => this.excluirProjeto(b.dataset.delProj, onDone));
  },
  /* exclui um briefing/projeto (ex.: enviado duplicado) */
  excluirProjeto(projId, onDone) {
    const proj = OB.projetoById(projId); if (!proj) return;
    const cli = OB.clientById(proj.clientId) || {};
    const nomes = (proj.produtos || []).map(id => (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id).join(' + ');
    UI.confirm('Excluir briefing', `Remover o briefing de <b>${nomes}</b> de <b>${(cli.nome || 'cliente').replace(/</g, '&lt;')}</b>?<br><br>O link enviado ao cliente deixa de funcionar e os materiais deste projeto também são removidos. Esta ação não pode ser desfeita.`, () => {
      OB.removeProjeto(projId);
      UI.toast('Briefing excluído', '', 'ok');
      App.refreshProjetosBadge();
      if (onDone) onDone(); else this.render(App.current || 'timeline');
    }, 'Excluir briefing');
  },

  /* Lista de briefings do projeto, um por serviço vendido.
     Projetos antigos, gravados antes da separação, viram um único item. */
  briefingsDoProjeto(proj) {
    if (!proj) return [];
    const porServico = proj.briefingPorServico || {};
    const chaves = Object.keys(porServico).filter(k => (porServico[k] || '').trim());
    if (chaves.length) {
      return chaves.map(tipo => ({
        tipo,
        nome: OB.briefingTipoNome(tipo),
        produtoId: OB.briefingProdutoDeTipo(tipo),
        texto: porServico[tipo]
      }));
    }
    if ((proj.briefingRespostas || '').trim()) {
      const prod = (proj.produtos || [])[0];
      const tipo = prod ? OB.briefingTipo(prod) : 'geral';
      return [{ tipo, nome: OB.briefingTipoNome(tipo), produtoId: prod, texto: proj.briefingRespostas }];
    }
    return [];
  },

  /* ---------- BRIEFING preenchido: documento branded (ver/baixar) ---------- */
  buildBriefingHTML(proj, tipoAlvo) {
    const cli = OB.clientById(proj.clientId) || (proj && proj.cliente) || {};
    const cons = OB.userById(proj.consultorId) || {};
    const lista = this.briefingsDoProjeto(proj);
    const alvo = tipoAlvo ? lista.find(x => x.tipo === tipoAlvo) : lista[0];
    const servicos = alvo ? alvo.nome : (proj.produtos || []).map(id => (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id).join(', ');
    const dataBR = OB.dataBR(proj.briefingRecebidoEm || proj.criadoEm);
    const texto = alvo ? alvo.texto : (proj.briefingRespostas || '');
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let corpo = '';
    /* Junta cada pergunta com a resposta inteira, mesmo com vários parágrafos.
       Antes, cada linha que não começasse com o marcador virava um título de
       seção, e as respostas longas apareciam soltas e em caixa alta. */
    const blocos = texto.replace(/@@SERVICO:[^@]+@@/g, '').split('\n');
    let perguntaAberta = null, respostaAberta = [];
    const fecharPergunta = () => {
      if (!perguntaAberta) return;
      const r = respostaAberta.join('\n').trim();
      corpo += `<div class="bd-item"><div class="bd-q">${esc(perguntaAberta)}</div><div class="bd-a">${esc(r)}</div></div>`;
      perguntaAberta = null; respostaAberta = [];
    };
    blocos.forEach(raw => {
      const l = raw.replace(/\s+$/, '');
      const t = l.trim();
      if (t.indexOf('## ') === 0) { fecharPergunta(); corpo += `<h2>${esc(t.slice(3))}</h2>`; return; }
      if (t.indexOf('• ') === 0) {
        fecharPergunta();
        const rest = t.slice(2);
        const idx = rest.indexOf(': ');           // formato antigo: pergunta e resposta na mesma linha
        if (idx >= 0) { perguntaAberta = rest.slice(0, idx); respostaAberta = [rest.slice(idx + 2)]; }
        else perguntaAberta = rest;
        return;
      }
      if (!t) { if (perguntaAberta) respostaAberta.push(''); return; }
      /* Formato antigo: a seção também é uma linha sem marcador. Distinguimos
         pelo formato: seção é curta, toda em caixa alta e sem ponto final.
         Uma resposta em caixa alta, como as da Boa Vista, é longa e pontuada,
         então continua sendo tratada como continuação da resposta. */
      const pareceSecao = t === t.toUpperCase() && t.length <= 40 && !/[.!?:,;]$/.test(t);
      if (pareceSecao) { fecharPergunta(); corpo += `<h2>${esc(t)}</h2>`; return; }
      if (perguntaAberta) respostaAberta.push(l);
      else corpo += `<h2>${esc(t)}</h2>`;
    });
    fecharPergunta();
    if (!corpo) corpo = '<p class="bd-empty">O cliente ainda não enviou as respostas do briefing.</p>';
    const mark = `<svg viewBox="0 0 439 439" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="439" height="439" rx="110" fill="#fff"/><path fill="#F15532" d="M211.531 155.988v86.854h17.765v-86.855l20.953 20.941 12.562-12.555L220.414 122l-42.397 42.373 12.562 12.555 20.952-20.94Z"/><path fill="#F15532" d="M385.827 214.342v103.68H55v-103.68h16.675v87.014h297.477v-87.014h16.675Z"/></svg>`;
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Briefing · ${(cli.nome || '').replace(/"/g, '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>:root{--brand:#F15532;--ink:#0A0A0A;--soft:#46505c;--mut:#8a96a3;--bg:#F5F7F9;--line:#e6eaef}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 10px 40px rgba(0,0,0,.06)}.cover{background:linear-gradient(135deg,#F15532,#e0431f);color:#fff;padding:38px 46px}.brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}.brand b{font-size:23px;font-weight:800}.cover h1{font-size:27px;font-weight:800;letter-spacing:-.02em}.cover p{color:rgba(255,255,255,.9);margin-top:4px;font-size:14px}.body{padding:34px 46px 60px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:26px;font-size:14px}.grid .lbl{color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.05em}.body h2{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--brand);margin:26px 0 12px;padding-bottom:7px;border-bottom:2px solid #f1e2dd}.bd-item{margin-bottom:14px}.bd-q{font-size:13px;font-weight:700;color:var(--ink)}.bd-a{font-size:14.5px;color:var(--soft);white-space:pre-wrap;margin-top:2px}.bd-empty{color:var(--mut);font-size:14px}.foot{border-top:1px solid var(--line);padding:22px 46px;color:var(--mut);font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}.foot b{color:var(--ink)}.print-hint{position:fixed;bottom:16px;right:16px;background:var(--brand);color:#fff;padding:11px 18px;border-radius:11px;font-weight:700;cursor:pointer;border:none;box-shadow:0 8px 20px rgba(241,85,50,.3);font-family:inherit;font-size:13px}@media print{.print-hint{display:none}.page{box-shadow:none}@page{margin:14mm}}</style></head>
<body><div class="page">
  <div class="cover"><div class="brand">${mark}<b>OutBox</b></div><h1>Briefing do Projeto</h1><p>${servicos || 'Serviço'} · ${cli.nome || 'Cliente'}</p></div>
  <div class="body">
    <div class="grid">
      <div><div class="lbl">Cliente</div>${cli.nome || '-'}</div>
      <div><div class="lbl">Serviço(s)</div>${servicos || '-'}</div>
      <div><div class="lbl">Consultor responsável</div>${(cons.nome || '') + ' ' + (cons.sobrenome || '') || '-'}</div>
      <div><div class="lbl">Briefing recebido em</div>${dataBR || '-'}</div>
    </div>
    ${corpo}
  </div>
  <div class="foot"><div>OutBox Soluções Digitais · Briefing do cliente</div><div>www.outboxgroup.com.br</div></div>
</div><button class="print-hint" onclick="window.print()">Salvar como PDF / Imprimir</button></body></html>`;
  },
  visualizarBriefing(projId, tipo) {
    const proj = OB.projetoById(projId); if (!proj) return;
    if (!proj.briefingRespostas) return UI.toast('Sem respostas', 'O cliente ainda não enviou o briefing.', 'err');
    const blob = new Blob([this.buildBriefingHTML(proj, tipo)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob); const w = window.open(url, '_blank', 'noopener');
    if (!w) { URL.revokeObjectURL(url); UI.toast('Não foi possível abrir', 'Permita pop-ups para visualizar.', 'err'); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
  baixarBriefing(projId, tipo) {
    const proj = OB.projetoById(projId); if (!proj) return;
    if (!proj.briefingRespostas) return UI.toast('Sem respostas', 'O cliente ainda não enviou o briefing.', 'err');
    const cli = OB.clientById(proj.clientId) || {};
    const blob = new Blob([this.buildBriefingHTML(proj, tipo)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; const alvo = this.briefingsDoProjeto(proj).find(x => !tipo || x.tipo === tipo);
    a.download = `Briefing ${alvo ? alvo.nome + ' - ' : ''}${(cli.nome || 'cliente')}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    UI.toast('Briefing baixado', 'Abra o arquivo para ler ou salvar em PDF.', 'ok');
  },

  /* Ranking de consultores (compartilhado com o admin via App.renderRanking) */
  view_ranking() { App.renderRanking(document.getElementById('main-view'), this.u().id); },

  /* biblioteca: cada briefing pronto vira um cartão estilo crachá (layout da referência Itaú) */
  bibliotecaBriefings() {
    const cards = OB.BRIEFINGS_PRONTOS.map(b => {
      const prod = OB.briefingProdutoDeTipo(b.tipo);
      const cid = 'cl-' + b.tipo;
      return `<div class="brief-cell">
        <div class="bcard" role="button" tabindex="0" data-compartilhar-briefing="${prod}" title="Compartilhar briefing · ${b.nome}" style="cursor:pointer">
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
        </div>
        <div class="brief-cell-actions">
          <button type="button" class="btn brand sm" data-compartilhar-briefing="${prod}" aria-label="Compartilhar briefing de ${b.nome}">${UI.icon('send',15)}<span>Compartilhar</span></button>
        </div>
      </div>`;
    }).join('');
    return `<div class="card" style="margin-bottom:18px">
      <div class="row alc" style="gap:8px;margin-bottom:4px">${UI.icon('briefcase',16)}<b>Biblioteca de briefings</b></div>
      <p class="mut" style="font-size:12.5px;margin-bottom:16px">Clique num briefing para <b>compartilhar com um cliente</b>. Você escolhe o cliente e pronto: o link já fica vinculado ao projeto e as respostas caem em <b>Briefings</b> automaticamente.</p>
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
    v.innerHTML = OB.portfolioCats().map(cat => this.portfolioCatHTML(cat)).join('');
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
      corpo = `<div style="margin-top:14px">${this.timelineHTML(proj)}</div>${this.projetoAcoesHTML(proj)}${this.projArquivosHTML(proj, { admin: false })}`;
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
      linhas.push(`<button class="btn ghost sm" data-compartilhar-proj="${proj.id}">${UI.icon('send',14)} Compartilhar link</button>`);
      linhas.push(`<button class="btn ghost sm" data-brief-recebido="${proj.id}">${UI.icon('check',14)} Registrar briefing recebido</button>`);
    } else if (proj.status === 'briefing_recebido') {
      linhas.push(`<span class="mut" style="font-size:12.5px">${UI.icon('check',12)} Briefing recebido. A OutBox vai analisar e iniciar a produção.</span>`);
    } else if (proj.status === 'entregue') {
      linhas.push(`<button class="btn green sm" data-share-final="${proj.id}">${UI.icon('whats',14)} Enviar projeto ao cliente</button>`);
      linhas.push(`<button class="btn brand sm" data-aprovar-proj="${proj.id}">${UI.icon('check',14)} Cliente aprovou</button>`);
    } else if (proj.status === 'aprovado') {
      linhas.push(`<span class="chip green">${UI.icon('prize',13)} Projeto aprovado e concluído</span>`);
    }
    // ver/baixar o briefing preenchido pelo cliente
    this.briefingsDoProjeto(proj).forEach(b => {
      linhas.push(`<button class="btn ghost sm" data-ver-brief="${proj.id}" data-brief-tipo="${b.tipo}">${UI.icon('docs',14)} Briefing · ${b.nome}</button>`);
      linhas.push(`<button class="btn ghost sm" data-baixar-brief="${proj.id}" data-brief-tipo="${b.tipo}">${UI.icon('download',14)} Baixar</button>`);
    });
    // excluir (ex.: briefing duplicado) — liberado enquanto a produção não começou
    if (['briefing_enviado', 'briefing_recebido'].includes(proj.status)) linhas.push(`<button class="btn danger sm" data-del-proj="${proj.id}">${UI.icon('trash',14)} Excluir briefing</button>`);
    // relatório sempre disponível a partir do briefing recebido
    if (OB.etapaIndex(proj.status) >= 1) linhas.push(`<button class="btn ghost sm" data-relatorio="${proj.id}">${UI.icon('receipt',14)} Emitir relatório</button>`);
    if (proj.linkFinal && (proj.status === 'entregue' || proj.status === 'aprovado')) {
      linhas.unshift(`<a class="btn ghost sm" href="${proj.linkFinal}" target="_blank" rel="noopener">${UI.icon('external',14)} Abrir projeto</a>`);
    }
    return `${respostas}<div class="proj-acoes">${linhas.join('')}</div>`;
  },

  /* ---------- COMPARTILHAR BRIEFING (fluxo único: cliente + serviço -> link vinculado que salva) ---------- */
  compartilharBriefingModal(preServico) {
    const u = this.u();
    const clientes = OB.clientsOf(u.id);
    if (!clientes.length) return UI.confirm('Cadastre um cliente', 'Você precisa de um cliente para compartilhar o briefing. Deseja cadastrar agora?', () => App.go('clientes'), 'Cadastrar cliente');
    UI.modal({
      title: 'Compartilhar briefing',
      sub: 'Escolha o cliente e o serviço — o link já salva as respostas no sistema',
      body: `
        <div class="field"><label>Cliente <span class="req">*</span></label>
          <select id="cb-cli">${clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}</select></div>
        <div class="field"><label>Serviço do briefing <span class="req">*</span></label>
          <select id="cb-serv">${OB.PRODUTOS.map(p => `<option value="${p.id}" ${preServico === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select>
          <div class="hint">O link fica vinculado a este cliente e serviço. Quando ele enviar, o briefing aparece em <b>Briefings</b> e na <b>Linha do Tempo</b>, em tempo real.</div></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="cb-ok">${UI.icon('send', 16)} Gerar link</button>`
    });
    document.getElementById('cb-ok').onclick = () => {
      const clientId = document.getElementById('cb-cli').value;
      const servico = document.getElementById('cb-serv').value;
      // reusa um projeto do mesmo cliente+serviço que ainda não recebeu briefing; senão cria (sem depender de venda)
      let proj = OB.projetosDe(u.id).find(p => p.clientId === clientId && (p.produtos || []).includes(servico) && !p.briefingRespostas);
      if (!proj) {
        proj = { id: OB.uid(), saleId: null, consultorId: u.id, clientId, produtos: [servico], status: 'briefing_enviado', briefingToken: OB.uid().replace(/-/g, ''), briefingEnviadoEm: new Date().toISOString(), criadoEm: new Date().toISOString() };
        OB.addProjeto(proj);
      }
      UI.closeModal();
      this._briefingLinkModal(proj);
      App.refreshProjetosBadge();
    };
  },
  /* Garante que existe um projeto salvo no banco com token de briefing.
     Devolve o projeto pronto, ou o motivo de não ter conseguido. */
  async garantirProjetoDoBriefing(s, prods) {
    let proj = OB.projetoDaVenda(s.id);
    if (!proj) {
      proj = { id: OB.uid(), saleId: s.id, consultorId: this.u().id, clientId: s.clientId, produtos: prods,
        status: 'briefing_enviado', briefingToken: OB.uid().replace(/-/g, ''), briefingLink: '',
        briefingEnviadoEm: new Date().toISOString(), criadoEm: new Date().toISOString() };
      OB.addProjeto(proj);
    }
    if (!proj.briefingToken) proj.briefingToken = OB.uid().replace(/-/g, '');
    proj.briefingLink = (prods || []).map(id => OB.briefingLink(id, proj.id, proj.briefingToken)).join(' ');
    const r = await OB.salvarProjetoConfirmado(proj);
    return r.ok ? { ok: true, projeto: proj } : r;
  },

  compartilharLinkBriefing(projId) { const p = OB.projetoById(projId); if (p) this._briefingLinkModal(p); },
  _briefingLinkModal(proj) {
    const cli = OB.clientById(proj.clientId) || {};
    if (!proj.briefingToken) { proj.briefingToken = OB.uid().replace(/-/g, ''); OB.updateProjeto(proj); }
    const links = (proj.produtos || []).map(id => ({ nome: (OB.PRODUTOS.find(p => p.id === id) || {}).nome || id, link: OB.briefingLink(id, proj.id, proj.briefingToken) }));
    const primeiro = cli.nome ? cli.nome.split(' ')[0] : '';
    const msg = `Olá${primeiro ? ' ' + primeiro : ''}! Para darmos início ao seu projeto com a OutBox, preencha o briefing (leva poucos minutos): ${links.map(l => l.link).join(' ')}`;
    const tel = (cli.telefone || '').replace(/\D/g, ''); const waTel = tel ? (tel.length <= 11 ? '55' + tel : tel) : '';
    UI.modal({
      title: 'Link do briefing', sub: cli.nome || '',
      body: `
        <div class="notice" style="margin-bottom:14px">${UI.icon('info',16)}<div>Link <b>vinculado ao projeto de ${cli.nome || 'este cliente'}</b>. Quando ele enviar, o briefing cai automaticamente em <b>Briefings</b> e na <b>Linha do Tempo</b>, em tempo real.</div></div>
        ${links.map(l => `<div class="field"><label>${l.nome}</label><div class="row" style="gap:8px"><input class="grow" value="${l.link}" readonly/><button type="button" class="btn ghost" data-copy="${l.link}">${UI.icon('docs',14)} Copiar</button></div></div>`).join('')}
        <div class="field"><label>Mensagem</label><textarea id="bf-msg" style="min-height:96px">${msg}</textarea></div>`,
      footer: `<button class="btn ghost" data-close>Fechar</button><button class="btn green" id="bf-wa">${UI.icon('whats',16)} Enviar no WhatsApp</button>`
    });
    document.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => UI.toast('Link copiado', '', 'ok')));
    document.getElementById('bf-wa').onclick = () => {
      const txt = encodeURIComponent(document.getElementById('bf-msg').value);
      window.open(waTel ? `https://wa.me/${waTel}?text=${txt}` : `https://wa.me/?text=${txt}`, '_blank');
      UI.closeModal(); UI.toast('Briefing compartilhado', 'O projeto entrou na esteira de entrega.', 'ok');
      App.refreshProjetosBadge(); this.render(App.current || 'projetos');
    };
  },

  async enviarBriefing(saleId) {
    const s = OB.salesOf(this.u().id).find(x => x.id === saleId); if (!s) return;
    if (s.statusPagamento !== 'recebido') return UI.toast('Ainda não liberado', 'O briefing libera após a confirmação do pagamento.', 'err');
    const cli = OB.clientById(s.clientId);
    const prods = OB.produtosDaVenda(s);
    /* O projeto precisa existir no BANCO antes de qualquer link sair daqui.
       Antes ele só era criado no clique do WhatsApp: quem copiava o link e
       mandava por outro canal entregava um endereço órfão, e o cliente via
       "Link inválido ou expirado" depois de preencher o briefing inteiro. */
    UI.toast('Preparando o briefing', 'Registrando o projeto antes de gerar o link', 'info');
    const g = await this.garantirProjetoDoBriefing(s, prods);
    if (!g.ok) return UI.toast('Não foi possível gerar o link', 'O projeto não foi salvo no servidor. (' + g.erro + ')', 'err');
    const pid = g.projeto.id;
    const token = g.projeto.briefingToken;
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
      const proj = OB.projetoDaVenda(s.id);
      if (proj && proj.status === 'briefing_enviado') OB.setEtapaProjeto(proj, 'briefing_enviado');
    };
    document.getElementById('bf-wa').onclick = () => {
      const txt = encodeURIComponent(document.getElementById('bf-msg').value);
      window.open(waTel ? `https://wa.me/${waTel}?text=${txt}` : `https://wa.me/?text=${txt}`, '_blank');
      registrar();
      UI.closeModal();
      UI.toast('Briefing enviado', 'O projeto entrou na esteira de entrega.', 'ok');
      App.refreshProjetosBadge();
      this.render(App.current || 'projetos');
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
      this.render(App.current || 'projetos');
    };
  },

  aprovarProjeto(projId) {
    const proj = OB.projetoById(projId); if (!proj) return;
    UI.confirm('Confirmar aprovação', 'O cliente aprovou o projeto final? Isso encerra a entrega.', () => {
      OB.setEtapaProjeto(proj, 'aprovado');
      UI.toast('Projeto aprovado! 🎉', 'Entrega concluída.', 'ok');
      App.refreshProjetosBadge();
      this.render(App.current || 'projetos');
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
