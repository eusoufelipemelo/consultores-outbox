/* Gera uma pagina de entrada por tipo de briefing em /b/<tipo>/.
   Motivo: o robo do WhatsApp nao roda JavaScript. Todos os links de briefing
   eram a mesma pagina com a query mudando, entao o preview saia sempre igual
   e o cliente nao sabia qual briefing tinha recebido. Cada tipo passa a ter
   um caminho proprio, com OpenGraph e imagem so dele, e a pagina redireciona
   para o formulario assim que abre. */
import { writeFileSync, mkdirSync } from 'node:fs';

const RAIZ = new URL('../', import.meta.url);
const APP = 'https://consultores.outboxgroup.com.br';

/* icones de linha desenhados para a marca: um por servico, mesma familia
   (viewBox 24, traco 1.5, sem preenchimento) */
const ICONES = {
  onepage: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8.5 7h7M8.5 10.5h7M8.5 14h7"/><path d="M9.8 17.4L12 19.6l2.2-2.2"/>',
  landing: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  site: '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 9h19"/><circle cx="6" cy="6.5" r=".85" fill="currentColor" stroke="none"/><circle cx="8.9" cy="6.5" r=".85" fill="currentColor" stroke="none"/><circle cx="11.8" cy="6.5" r=".85" fill="currentColor" stroke="none"/>',
  'site-blog': '<rect x="3" y="6" width="14" height="15" rx="2.5"/><path d="M7 3.5h11a2.5 2.5 0 0 1 2.5 2.5v11"/><path d="M6.8 11h6.4M6.8 14.5h6.4M6.8 18h4"/>',
  vendas: '<path d="M3 18.5l5.5-5.5 3.5 3.5L20.5 7"/><path d="M15.5 7h5v5"/>',
  ecommerce: '<path d="M5.5 8h13l-1.1 12.2a1.6 1.6 0 0 1-1.6 1.3H8.2a1.6 1.6 0 0 1-1.6-1.3z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
  marketplace: '<path d="M4.5 10.5V20.5h15V10.5"/><path d="M2.5 10.5l2.2-5h14.6l2.2 5z"/><path d="M10 20.5v-6h4v6"/>',
  identidade: '<circle cx="9.5" cy="9.5" r="5.5"/><circle cx="14.5" cy="14.5" r="5.5"/>',
  brandbook: '<path d="M12 6.8C10 5.2 7 4.6 3.5 5.2v13.2c3.5-.6 6.5 0 8.5 1.6"/><path d="M12 6.8c2-1.6 5-2.2 8.5-1.6v13.2c-3.5-.6-6.5 0-8.5 1.6"/><path d="M12 6.8v13.2"/>',
  sistemas: '<rect x="2.5" y="3" width="6.5" height="6" rx="2"/><rect x="2.5" y="15" width="6.5" height="6" rx="2"/><rect x="15" y="9" width="6.5" height="6" rx="2"/><path d="M9 6h3a2 2 0 0 1 2 2v2M9 18h3a2 2 0 0 0 2-2v-2"/>',
  apresentacao: '<rect x="2.5" y="3.5" width="19" height="13" rx="2.5"/><path d="M12 16.5v3.5M8 20h8"/><path d="M7.5 13V10M12 13V7.5M16.5 13v-5"/>'
};

/* nome e frase saem dos mesmos textos que o cliente ve na capa do formulario */
const TIPOS = [
  { t: 'onepage',     n: 'Site OnePage',              f: 'Uma página única, direta e persuasiva, feita para transformar visitantes em clientes.' },
  { t: 'landing',     n: 'Landing Page',              f: 'Uma página focada em uma única ação: capturar e converter o seu cliente.' },
  { t: 'site',        n: 'Site Institucional',        f: 'Um site institucional completo para posicionar a sua marca com autoridade.' },
  { t: 'site-blog',   n: 'Site Institucional + Blog', f: 'Site institucional com blog para gerar conteúdo, autoridade e tráfego no Google.' },
  { t: 'vendas',      n: 'Página de Vendas',          f: 'Uma página construída com técnica para vender o seu produto ou serviço.' },
  { t: 'ecommerce',   n: 'E-commerce',                f: 'Sua loja online pronta para vender 24 horas por dia, 7 dias por semana.' },
  { t: 'marketplace', n: 'Marketplace',               f: 'Uma plataforma onde vários vendedores anunciam e você fica com a comissão.' },
  { t: 'identidade',  n: 'Identidade Visual',         f: 'Logo, cores e a personalidade que vão dar cara à sua marca.' },
  { t: 'brandbook',   n: 'BrandBook',                 f: 'O manual que garante que a sua marca seja usada com consistência em todo lugar.' },
  { t: 'sistemas',    n: 'Sistema Sob Medida',        f: 'Um sistema sob medida, desenhado para o processo do seu negócio.' },
  { t: 'apresentacao',n: 'Apresentação de Negócios',  f: 'A sua reunião de vendas em um link: roteiro, design e argumento, slide a slide.' }
];

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ---------- fonte da imagem de compartilhamento (1200x630, modo claro) ---------- */
function ogHTML({ t, n, f }) {
  const grande = n.length <= 18;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#fff;color:#1f1f1f;font-family:"Geist",sans-serif;
  display:flex;align-items:center;position:relative;overflow:hidden}
/* faixa de marca a esquerda e halo quente a direita: a mesma atmosfera do sistema, em claro */
body::before{content:"";position:absolute;left:0;top:0;bottom:0;width:14px;background:#F15532}
body::after{content:"";position:absolute;right:-150px;top:-200px;width:720px;height:720px;border-radius:50%;
  background:radial-gradient(circle,#FEF2ED 0%,rgba(254,242,237,0) 70%)}
.col{position:relative;z-index:1;padding:0 0 0 86px;width:730px}
.logo{height:34px;display:block}
.chip{display:inline-flex;align-items:center;gap:10px;margin-top:44px;font-size:16px;font-weight:600;
  letter-spacing:.15em;text-transform:uppercase;color:#B8330F;background:#FEF2ED;
  border:1px solid rgba(241,85,50,.28);border-radius:999px;padding:10px 20px}
.chip b{width:8px;height:8px;border-radius:50%;background:#F15532;display:block}
h1{font-family:"Clash Display",sans-serif;font-weight:600;color:#000;
  font-size:${grande ? 78 : 62}px;line-height:1.03;letter-spacing:-.028em;margin:24px 0 0}
p{font-size:24px;line-height:1.45;color:#6b6b6b;margin-top:20px;max-width:640px}
.pe{position:absolute;left:86px;bottom:52px;font-size:18px;color:#9a9a9a;z-index:1}
.disco{position:absolute;right:96px;top:50%;transform:translateY(-50%);width:274px;height:274px;
  border-radius:50%;background:#FEF2ED;border:1px solid rgba(241,85,50,.22);
  display:grid;place-items:center;z-index:1}
.disco svg{width:142px;height:142px;color:#F15532}
</style></head><body>
<div class="col">
  <img class="logo" src="../../assets/logo-preta.svg" alt="">
  <span class="chip"><b></b>Briefing</span>
  <h1>${esc(n)}</h1>
  <p>${esc(f)}</p>
</div>
<div class="disco"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round">${ICONES[t]}</svg></div>
<span class="pe">OutBox Soluções Digitais · consultores.outboxgroup.com.br</span>
</body></html>`;
}

/* ---------- pagina de entrada: le o OpenGraph e manda o cliente para o formulario ---------- */
function entradaHTML({ t, n, f }) {
  const titulo = `Briefing · ${n}`;
  const img = `${APP}/b/${t}/og.png`;
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · OutBox</title>
<meta name="description" content="${esc(f)}">
<meta name="theme-color" content="#F15532">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/assets/logo-mark.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OutBox Soluções Digitais">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${APP}/b/${t}/">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(f)}">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Briefing de ${esc(n)} · OutBox Soluções Digitais">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(f)}">
<meta name="twitter:image" content="${img}">
<script>
  (function () {
    // o link do projeto traz pid + token; o link avulso da biblioteca nao traz
    var q = new URLSearchParams(location.search);
    var pid = q.get('briefing'), tk = q.get('t');
    var destino = (pid && tk)
      ? '/?briefing=' + encodeURIComponent(pid) + '&t=' + encodeURIComponent(tk) + '&p=${t}'
      : '/briefing/?p=${t}';
    location.replace(destino);
  })();
</script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100dvh;display:grid;place-items:center;padding:24px;background:#fff;
    font-family:Inter,system-ui,-apple-system,sans-serif;color:#1f1f1f}
  .c{text-align:center;max-width:360px}
  img{height:30px;margin:0 auto 26px;display:block}
  .a{width:34px;height:34px;margin:0 auto 18px;border-radius:50%;
    border:3px solid #fef2ed;border-top-color:#F15532;animation:g .8s linear infinite}
  @keyframes g{to{transform:rotate(360deg)}}
  h1{font-size:18px;font-weight:700;margin-bottom:6px}
  p{font-size:14px;color:#6b6b6b;line-height:1.6}
  a{display:inline-block;margin-top:20px;background:#F15532;color:#fff;text-decoration:none;
    font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px}
  @media(prefers-reduced-motion:reduce){.a{animation:none}}
</style>
</head><body>
  <div class="c">
    <img src="/assets/logo-preta.svg" alt="OutBox Soluções Digitais">
    <div class="a" aria-hidden="true"></div>
    <h1>Abrindo o seu briefing</h1>
    <p>${esc(n)}. Se a página não abrir sozinha, toque no botão abaixo.</p>
    <noscript><p style="margin-top:14px;color:#d93b2b">Ative o JavaScript do navegador para abrir o formulário.</p></noscript>
    <a href="/briefing/?p=${t}">Abrir o formulário</a>
  </div>
</body></html>`;
}

for (const d of TIPOS) {
  mkdirSync(new URL('b/' + d.t + '/', RAIZ), { recursive: true });
  writeFileSync(new URL('b/' + d.t + '/index.html', RAIZ), entradaHTML(d));
  writeFileSync(new URL('tools/_og/' + d.t + '.html', RAIZ), ogHTML(d));
}
console.log(TIPOS.length + ' tipos gerados:', TIPOS.map(x => x.t).join(', '));
