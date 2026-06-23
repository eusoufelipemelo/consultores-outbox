/* ============================================================
   OutBox Consultores — Gráficos (charts.js) · Chart.js
   ============================================================ */
const Charts = {
  _instances: [],
  brand: '#F15532',

  css(v) { return getComputedStyle(document.body).getPropertyValue(v).trim(); },
  destroyAll() { this._instances.forEach(c => { try { c.destroy(); } catch (e) {} }); this._instances = []; },

  baseOpts() {
    const grid = this.css('--border');
    const text = this.css('--text-mut');
    return {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1100, easing: 'easeOutQuart' },
      plugins: { legend: { labels: { color: text, font: { family: 'Inter', size: 12 }, usePointStyle: true, boxWidth: 8, padding: 16 } } },
      scales: undefined, _grid: grid, _text: text
    };
  },

  /* rosca — clientes recorrentes vs pontuais */
  donut(canvasId, recorrente, pontual) {
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    const o = this.baseOpts();
    const c = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Recorrentes', 'Pontuais'],
        datasets: [{ data: [recorrente, pontual], backgroundColor: [this.brand, this.css('--border-strong')], borderWidth: 0, hoverOffset: 8 }]
      },
      options: { ...o, cutout: '68%', plugins: { ...o.plugins, legend: { ...o.plugins.legend, position: 'bottom' } } }
    });
    this._instances.push(c); return c;
  },

  /* barras horizontais — volume por produto */
  barProdutos(canvasId, labels, valores) {
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    const o = this.baseOpts();
    const c = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Volume (R$)', data: valores, backgroundColor: this.brand, borderRadius: 8, barThickness: 18 }] },
      options: {
        ...o, indexAxis: 'y',
        plugins: { ...o.plugins, legend: { display: false } },
        scales: {
          x: { grid: { color: o._grid }, ticks: { color: o._text, font: { family: 'Inter' }, callback: v => 'R$ ' + (v / 1000) + 'k' }, border: { display: false } },
          y: { grid: { display: false }, ticks: { color: o._text, font: { family: 'Inter', size: 12 } }, border: { display: false } }
        }
      }
    });
    this._instances.push(c); return c;
  },

  /* linha — evolução de vendas (movimento) */
  line(canvasId, labels, valores) {
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    const o = this.baseOpts();
    const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(241,85,50,.32)'); grad.addColorStop(1, 'rgba(241,85,50,0)');
    const c = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Vendas', data: valores, borderColor: this.brand, backgroundColor: grad, fill: true, tension: .4, borderWidth: 3, pointBackgroundColor: this.brand, pointRadius: 4, pointHoverRadius: 6 }] },
      options: {
        ...o, plugins: { ...o.plugins, legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: o._text, font: { family: 'Inter' } }, border: { display: false } },
          y: { grid: { color: o._grid }, ticks: { color: o._text, font: { family: 'Inter' }, callback: v => 'R$ ' + (v / 1000) + 'k' }, border: { display: false } }
        }
      }
    });
    this._instances.push(c); return c;
  },

  /* gauge (meia rosca) — progresso até a próxima meta */
  gauge(canvasId, atual, meta) {
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    const pct = meta > 0 ? Math.min(atual / meta, 1) : 1;
    const o = this.baseOpts();
    const c = new Chart(ctx, {
      type: 'doughnut',
      data: { datasets: [{ data: [pct, 1 - pct], backgroundColor: [this.brand, this.css('--surface-3')], borderWidth: 0 }] },
      options: { ...o, rotation: -90, circumference: 180, cutout: '76%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
    this._instances.push(c); return c;
  },

  /* barras verticais — comissões pagas vs a receber por mês (admin) */
  barStack(canvasId, labels, pagas, pendentes) {
    const ctx = document.getElementById(canvasId); if (!ctx) return;
    const o = this.baseOpts();
    const c = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Pago', data: pagas, backgroundColor: this.css('--border-strong'), borderRadius: 6, stack: 's' },
          { label: 'A pagar', data: pendentes, backgroundColor: this.brand, borderRadius: 6, stack: 's' }
        ]
      },
      options: {
        ...o,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: o._text, font: { family: 'Inter' } }, border: { display: false } },
          y: { stacked: true, grid: { color: o._grid }, ticks: { color: o._text, font: { family: 'Inter' }, callback: v => 'R$ ' + (v / 1000) + 'k' }, border: { display: false } }
        }
      }
    });
    this._instances.push(c); return c;
  }
};
