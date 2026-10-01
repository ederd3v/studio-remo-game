/* ============================================================
   STUDIO REMO GAME — app
   Ranking · Meu progresso · Área do professor · Escopo
   Tudo roda no navegador; dados fictícios, determinísticos por nome
   (recarregar a página não reembaralha o ranking).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- utilidades ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const DIA = 864e5;
  const REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AGORA = new Date();
  const HOJE = new Date(AGORA); HOJE.setHours(0, 0, 0, 0);
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const r1 = (v) => Math.round(v * 10) / 10;
  function fmt(sec) {
    sec = r1(sec);
    const m = Math.floor(sec / 60), r = r1(sec - m * 60);
    return m + ":" + (r < 10 ? "0" : "") + r.toFixed(1);
  }
  const split = (t, dist) => fmt(t / (dist / 500));
  const watts = (t, dist) => { const p = t / dist; return Math.round(2.8 / (p * p * p)); };
  const distLbl = (d) => (d === 500 ? "500m" : d === 1000 ? "1.000m" : "2.000m");
  const dd = (n) => ("0" + n).slice(-2);
  const dataCurta = (d) => dd(d.getDate()) + "/" + dd(d.getMonth() + 1) + "/" + String(d.getFullYear()).slice(-2);
  const hora = (d) => dd(d.getHours()) + ":" + dd(d.getMinutes());
  const quando = (d) => (d >= HOJE ? "hoje " + hora(d) : dd(d.getDate()) + "/" + dd(d.getMonth() + 1) + " " + hora(d));
  const iniciais = (n) => { const p = n.replace(/^Prof\.ª?\s/, "").split(" "); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); };
  const primeiro = (n) => n.split(" ")[0];
  function parseTempo(str) {
    str = String(str).trim().replace(",", ".");
    let m = str.match(/^(\d{1,2}):([0-5]?\d(?:\.\d)?)$/);
    if (m) return r1(+m[1] * 60 + parseFloat(m[2]));
    m = str.match(/^(\d{1,3}(?:\.\d)?)$/);
    return m ? r1(parseFloat(m[1])) : null;
  }
  // PRNG com semente — o mesmo nome gera sempre o mesmo histórico
  function semente(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    let a = h >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- ícones ---------- */
  const ICON = {
    star: '<path d="M12 2.8 14.9 9l6.6.6-5 4.4 1.5 6.5L12 17.2 6 20.5l1.5-6.5-5-4.4L9.1 9z"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-2.6L17 22l-1.5-8"/>',
    podium: '<path d="M3 21V13h6v8M9 21V8h6v13M15 21v-6h6v6M2 21h20"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1.4"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.3-6-4-8 0 2.5-1.5 4-3 4 0-3-1-6-4-9 0 4-4 7-4 13 0 4.3 3 7 8 7z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
    check: '<path d="M5 12.5 10 17 19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    tablet: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M11 18h2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const ic = (n, cls) => '<svg class="' + (cls || "ic") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + "</svg>";
  const BARCO = '<svg viewBox="0 0 26 12" aria-hidden="true"><path d="M1 7.2Q13 9.6 25 6.2Q13 5.4 1 7.2Z" fill="currentColor"/><path d="M8.5 1.8 14 11M12.5 1.2 17.5 10.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity=".75"/><circle cx="11.6" cy="4.6" r="1.7" fill="currentColor"/></svg>';

  /* ---------- configuração (o cliente edita isto) ----------
     Cada unidade tem SIGLA (para quem não distingue cor) + COR (para bater o olho). */
  const UNIDADES = [
    { nome: "Itajaí", sigla: "ITJ", cor: "var(--u-itj)", prof: "Prof. Maurício Lenzi" },
    { nome: "Navegantes", sigla: "NAV", cor: "var(--u-nav)", prof: "Prof.ª Daniela Hoepers" },
    { nome: "Joinville", sigla: "JOI", cor: "var(--u-joi)", prof: "Prof. Rogério Zanella" },
    { nome: "Balneário Camboriú", sigla: "BC", cor: "var(--u-bc)", prof: "Prof.ª Bianca Tomio" },
  ];
  const UMAP = {}; UNIDADES.forEach((u) => (UMAP[u.nome] = u));
  const curto = (p) => p.split(" ").slice(0, 2).join(" ");

  const FAIXAS = [
    { id: "20-24", label: "20–24 anos", min: 20, max: 24 },
    { id: "25-29", label: "25–29 anos", min: 25, max: 29 },
    { id: "30-39", label: "30–39 anos", min: 30, max: 39 },
    { id: "40-49", label: "40–49 anos", min: 40, max: 49 },
    { id: "50+", label: "50 anos ou mais", min: 50, max: 120 },
  ];
  const FMAP = {}; FAIXAS.forEach((f) => (FMAP[f.id] = f));
  const faixaDe = (a) => FAIXAS.find((f) => a.i >= f.min && a.i <= f.max);

  const NIVEIS = [
    { min: 0, n: "Estreante" }, { min: 400, n: "Remador" }, { min: 900, n: "Voga" },
    { min: 1600, n: "Capitão de raia" }, { min: 2500, n: "Lenda da casa" },
  ];

  const PERIODOS = {
    geral: { rot: "Classificação geral", curto: "Geral", rec: "Recorde da casa", dias: 0 },
    "12m": { rot: "Últimos 12 meses", curto: "12 meses", rec: "Melhor em 12 meses", dias: 365 },
    "30d": { rot: "Últimos 30 dias", curto: "30 dias", rec: "Melhor em 30 dias", dias: 30 },
  };

  /* ---------- atletas (b = melhor tempo de 500m em segundos) ---------- */
  const ATLETAS = [
    { n: "Lucas Boabaid", s: "M", i: 22, u: "Itajaí", b: 98.0 },
    { n: "Pedro Hoffmann", s: "M", i: 21, u: "Joinville", b: 99.4 },
    { n: "Gabriel Sviatopolk", s: "M", i: 24, u: "Itajaí", b: 101.2 },
    { n: "Vinícius Amorim", s: "M", i: 20, u: "Balneário Camboriú", b: 103.7 },
    { n: "Murilo Fischer", s: "M", i: 23, u: "Navegantes", b: 104.9 },
    { n: "Otávio Zimmer", s: "M", i: 22, u: "Joinville", b: 106.3 },
    { n: "Enzo Cardoso", s: "M", i: 24, u: "Itajaí", b: 108.1 },
    { n: "Bruno Tavares", s: "M", i: 21, u: "Navegantes", b: 109.8 },
    { n: "Léo Marcondes", s: "M", i: 23, u: "Balneário Camboriú", b: 111.5 },
    { n: "Thiago Bertoldi", s: "M", i: 22, u: "Navegantes", b: null }, // chegou agora: o primeiro tempo está na fila
    { n: "Eder Rodrigues", s: "M", i: 25, u: "Navegantes", b: 100.0, me: true },
    { n: "Rafael Meurer", s: "M", i: 27, u: "Itajaí", b: 97.6 },
    { n: "Diego Sansão", s: "M", i: 29, u: "Joinville", b: 99.1 },
    { n: "André Baumgarten", s: "M", i: 26, u: "Itajaí", b: 102.8 },
    { n: "Fábio Lentz", s: "M", i: 28, u: "Balneário Camboriú", b: 105.4 },
    { n: "Henrique Volz", s: "M", i: 27, u: "Navegantes", b: 107.9 },
    { n: "Marcelo Deschamps", s: "M", i: 34, u: "Itajaí", b: 99.8 },
    { n: "Rodrigo Kremer", s: "M", i: 37, u: "Navegantes", b: 103.2 },
    { n: "Sandro Bianchini", s: "M", i: 31, u: "Joinville", b: 106.9 },
    { n: "Tiago Abreu", s: "M", i: 35, u: "Balneário Camboriú", b: 108.6 },
    { n: "Paulo Nienkötter", s: "M", i: 38, u: "Itajaí", b: 110.4 },
    { n: "Alexandre Poffo", s: "M", i: 44, u: "Itajaí", b: 104.6 },
    { n: "Cláudio Wippel", s: "M", i: 47, u: "Joinville", b: 109.3 },
    { n: "Gilmar Réus", s: "M", i: 41, u: "Navegantes", b: 112.0 },
    { n: "Osmar Delfes", s: "M", i: 46, u: "Balneário Camboriú", b: 115.7 },
    { n: "Jorge Tzachel", s: "M", i: 53, u: "Itajaí", b: 112.7 },
    { n: "Nelson Fronza", s: "M", i: 58, u: "Navegantes", b: 118.4 },
    { n: "Ivo Bittencourt", s: "M", i: 61, u: "Joinville", b: 124.1 },
    { n: "Marina Kuhnen", s: "F", i: 23, u: "Itajaí", b: 112.4 },
    { n: "Isabela Recife", s: "F", i: 21, u: "Joinville", b: 114.8 },
    { n: "Camila Boabaid", s: "F", i: 24, u: "Itajaí", b: 116.1 },
    { n: "Larissa Steil", s: "F", i: 20, u: "Navegantes", b: 119.5 },
    { n: "Bruna Cavalcanti", s: "F", i: 22, u: "Balneário Camboriú", b: 121.0 },
    { n: "Manuela Petry", s: "F", i: 24, u: "Joinville", b: 123.4 },
    { n: "Sofia Menegotto", s: "F", i: 21, u: "Navegantes", b: 125.9 },
    { n: "Juliana Mafra", s: "F", i: 26, u: "Itajaí", b: 113.9 },
    { n: "Ana Beatriz Klein", s: "F", i: 28, u: "Joinville", b: 117.2 },
    { n: "Letícia Bornhausen", s: "F", i: 27, u: "Balneário Camboriú", b: 120.8 },
    { n: "Patrícia Sell", s: "F", i: 33, u: "Itajaí", b: 115.6 },
    { n: "Renata Voigt", s: "F", i: 36, u: "Navegantes", b: 120.3 },
    { n: "Cristiane Hulse", s: "F", i: 31, u: "Joinville", b: 122.7 },
    { n: "Silvana Duarte", s: "F", i: 42, u: "Itajaí", b: 123.8 },
    { n: "Márcia Feldmann", s: "F", i: 45, u: "Navegantes", b: 127.5 },
    { n: "Vera Lúcia Amaral", s: "F", i: 55, u: "Joinville", b: 131.2 },
  ];
  const AMAP = {};
  const EU = ATLETAS.find((a) => a.me);

  /* ---------- histórico simulado ----------
     A academia roda dia de teste uma vez por mês. Cada atleta tem de 5 a 12 meses
     de testes, melhorando aos poucos até o melhor tempo (b). O 1.000m e o 2.000m
     derivam do 500m com um fator de resistência. */
  const base = (b, dist) => (dist === 500 ? b : dist === 1000 ? b * 2 * 1.055 : b * 4 * 1.115);
  const ME500 = [106.2, 105.4, 104.1, 104.6, 102.3, 101.4, 100.0];
  const SEED = [];
  let seq = 0;
  ATLETAS.forEach((a) => {
    a.id = slug(a.n); AMAP[a.id] = a;
    if (a.b == null) return;
    const r = semente(a.n);
    const meses = a.me ? ME500.length : 5 + Math.floor(r() * 8);
    const g = 0.035 + r() * 0.055;
    const cal = { 500: [], 1000: [], 2000: [] };
    for (let k = meses - 1; k >= 0; k--) {
      const vai = a.me || k === meses - 1 || r() < (k === 0 ? 0.78 : 0.82);
      if (!vai) continue;
      const d = new Date(HOJE.getTime() - (k * 30 + 1 + Math.floor(r() * 19)) * DIA);
      d.setHours(7 + Math.floor(r() * 11), Math.floor(r() * 60));
      cal[500].push(d);
      if (r() < 0.42) cal[1000].push(new Date(d.getTime() + 40 * 6e4));
      if (r() < 0.3) cal[2000].push(new Date(d.getTime() + 75 * 6e4));
    }
    [1000, 2000].forEach((dist) => {
      if (cal[dist].length) return;
      const src = cal[500][Math.floor(r() * cal[500].length)];
      cal[dist].push(new Date(src.getTime() + (dist === 1000 ? 40 : 75) * 6e4));
    });
    [500, 1000, 2000].forEach((dist) => {
      const ds = cal[dist].sort((x, y) => x - y), n = ds.length, bt = base(a.b, dist);
      let vals;
      if (a.me && dist === 500) vals = ME500.slice();
      else {
        vals = ds.map((_, i) => { const p = n > 1 ? i / (n - 1) : 1; return bt * (1 + g * Math.pow(1 - p, 1.25)) + (r() - 0.5) * bt * 0.01; });
        const bi = n > 2 && r() < 0.35 ? n - 2 : n - 1;
        vals = vals.map((v, i) => (i === bi ? bt : Math.max(v, bt + 0.3 + r() * 0.9)));
      }
      ds.forEach((d, i) => SEED.push({ id: "s" + ++seq, a: a.id, dist, t: r1(vals[i]), d, prof: UMAP[a.u].prof, via: "Tablet · " + a.u }));
    });
  });

  /* ---------- estado salvo no navegador (lançamentos do professor) ---------- */
  const CHAVE = "srg-demo-v1";
  function estadoInicial() {
    const ago = (min) => new Date(AGORA.getTime() - min * 6e4).toISOString();
    // o tempo do Thiago derruba o recorde de 1.000m (3:26.8) — o momento do confete na demo
    return {
      v: 2, n: 0, log: [],
      added: [
        { id: "p1", a: "marina-kuhnen", dist: 500, t: 113.0, d: ago(24), via: "Tablet · Itajaí", status: "pendente" },
        { id: "p2", a: "thiago-bertoldi", dist: 1000, t: 204.6, d: ago(57), via: "Tablet · Navegantes", status: "pendente" },
        { id: "p3", a: "larissa-steil", dist: 1000, t: 249.6, d: ago(101), via: "Tablet · Navegantes", status: "pendente" },
      ],
    };
  }
  function carregar() {
    try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === 2 ? s : null; } catch (e) { return null; }
  }
  let state = carregar() || estadoInicial();
  let _testes = null;
  function mudou() { _testes = null; try { localStorage.setItem(CHAVE, JSON.stringify(state)); } catch (e) {} }

  function testes() {
    if (_testes) return _testes;
    const extra = state.added.filter((x) => x.status === "validado")
      .map((x) => ({ id: x.id, a: x.a, dist: x.dist, t: x.t, d: new Date(x.d), prof: x.by, via: x.via }));
    return (_testes = SEED.concat(extra));
  }

  /* ---------- consultas ---------- */
  const corte = (dias) => new Date(HOJE.getTime() - dias * DIA);
  function classificar(o) {
    const fx = FMAP[o.faixa], P = PERIODOS[o.periodo || "geral"], lim = P.dias ? corte(P.dias) : null;
    const best = {};
    testes().forEach((t) => {
      if (t.dist !== o.dist || t.id === o.excluir) return;
      const a = AMAP[t.a];
      if (a.s !== o.s || a.i < fx.min || a.i > fx.max) return;
      if (lim && t.d < lim) return;
      const c = best[t.a];
      if (!c || t.t < c.t || (t.t === c.t && t.d < c.d)) best[t.a] = t;
    });
    return Object.keys(best).map((id) => {
      const t = best[id];
      return { a: AMAP[id], t: t.t, d: t.d, sp: split(t.t, o.dist), w: watts(t.t, o.dist) };
    }).sort((x, y) => x.t - y.t || x.d - y.d);
  }

  // o que acontece se esse tempo entrar agora?
  function avaliar(aId, dist, t, excluir) {
    const a = AMAP[aId], fx = faixaDe(a);
    const cat = classificar({ s: a.s, faixa: fx.id, dist, excluir });
    const rec = cat[0] || null;
    const meus = testes().filter((x) => x.a === aId && x.dist === dist && x.id !== excluir);
    const pb = meus.length ? Math.min.apply(null, meus.map((x) => x.t)) : null;
    const outros = cat.filter((r) => r.a.id !== aId);
    const melhorQue = pb == null || t < pb;
    const minhaMarca = melhorQue ? t : pb;
    return {
      a, fx, dist, t, pb,
      recorde: !rec || t < rec.t,
      destronado: rec && rec.a.id !== aId && t < rec.t ? rec : null,
      pr: melhorQue && pb != null,
      primeira: pb == null,
      pos: outros.filter((r) => r.t <= minhaMarca).length + 1,
      total: outros.length + 1,
    };
  }

  function evolucao30() {
    const lim = corte(30), por = {};
    testes().forEach((t) => {
      if (t.dist !== 500) return;
      const o = por[t.a] || (por[t.a] = { antes: Infinity, agora: Infinity });
      if (t.d < lim) o.antes = Math.min(o.antes, t.t); else o.agora = Math.min(o.agora, t.t);
    });
    return Object.keys(por)
      .map((id) => ({ a: AMAP[id], d: por[id].antes - por[id].agora, t: por[id].agora }))
      .filter((x) => isFinite(x.d) && x.d > 0.05)
      .sort((x, y) => y.d - x.d).slice(0, 5);
  }

  /* ---------- peças de interface ---------- */
  const selo = (nome) => { const u = UMAP[nome]; return '<span class="usel" style="--u:' + u.cor + '"><span class="usel__key">' + u.sigla + '</span><span class="usel__n">' + esc(u.nome) + "</span></span>"; };
  const linkAtleta = (a, txt) => '<a class="alink" href="#/progresso/' + a.id + '">' + esc(txt || a.n) + "</a>";
  const rankLink = (s, faixa, dist, txt) => '<a href="#/ranking" data-rank="' + s + "|" + faixa + "|" + dist + '">' + txt + "</a>";

  const FORMATOS = {
    tempo: (v) => fmt(v),
    int: (v) => Math.round(v).toLocaleString("pt-BR"),
    menos: (v) => "−" + v.toFixed(1) + "s",
    pos: (v) => Math.round(v) + "º",
  };
  function contar(root) {
    $$("[data-count]", root).forEach((el) => {
      const alvo = parseFloat(el.dataset.count), f = FORMATOS[el.dataset.fmt || "int"];
      if (REDUZ || !isFinite(alvo)) { el.textContent = f(alvo); return; }
      // tempo conta de cima pra baixo, como um cronômetro chegando
      const de = el.dataset.fmt === "tempo" ? alvo * 1.18 : el.dataset.fmt === "pos" ? Math.max(alvo + 6, 10) : 0;
      const t0 = performance.now(), dur = 1100;
      (function passo(now) {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = f(de + (alvo - de) * e);
        if (p < 1) requestAnimationFrame(passo);
      })(t0);
    });
  }

  function toast(html, tipo) {
    const box = $("#toasts"), el = document.createElement("div");
    el.className = "toast" + (tipo === "rec" ? " toast--rec" : "");
    el.innerHTML = '<span class="toast__ico">' + ic(tipo === "rec" ? "trophy" : tipo === "pr" ? "trend" : tipo === "info" ? "reset" : "check") + "</span><div>" + html + "</div>";
    box.appendChild(el);
    const sai = () => { el.classList.add("is-out"); setTimeout(() => el.remove(), 380); };
    setTimeout(sai, tipo === "rec" ? 7500 : 4500);
    el.addEventListener("click", (e) => { if (!e.target.closest("a")) sai(); });
  }

  /* ---------- confete (só quando um recorde cai) ---------- */
  const cv = $("#confetti"), cx = cv.getContext("2d");
  let pecas = [], raf = 0;
  function confete() {
    if (REDUZ) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cores = ["#E3A84F", "#F6D28E", "#8CE04E", "#3FD9C9", "#FFFFFF"];
    // dois canhões nos cantos de baixo, atirando para o centro
    [[0.06, 1], [0.94, -1]].forEach(([fx, lado]) => {
      for (let i = 0; i < 80; i++) {
        const ang = (58 + Math.random() * 28) * (Math.PI / 180), v = 13 + Math.random() * 12;
        pecas.push({
          x: W * fx, y: H + 10, vx: Math.cos(ang) * v * lado, vy: -Math.sin(ang) * v,
          w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
          c: cores[(Math.random() * cores.length) | 0], vida: 0, max: 150 + Math.random() * 80,
        });
      }
    });
    if (!raf) raf = requestAnimationFrame(quadro);
  }
  function quadro() {
    const W = innerWidth, H = innerHeight;
    cx.clearRect(0, 0, W, H);
    pecas.forEach((p) => {
      p.vida++; p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.32; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      cx.save(); cx.globalAlpha = Math.max(0, 1 - p.vida / p.max);
      cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.vida * 0.2)) + 1);
      cx.restore();
    });
    pecas = pecas.filter((p) => p.vida < p.max && p.y < H + 60);
    if (pecas.length) raf = requestAnimationFrame(quadro);
    else { raf = 0; cx.clearRect(0, 0, W, H); }
  }

  /* ============================================================ RANKING */
  const F = { s: "M", faixa: "20-24", dist: 500, uni: "__all", periodo: "geral" };
  const TOP = 5;
  // no celular o ranking é uma lista única e simples (sem raias, barras e tabela)
  const CELULAR = matchMedia("(max-width: 640px)");

  function listaSimples(lista, categoria) {
    const lider = lista[0].t;
    return '<ol class="rlist">' + lista.map((r, i) => {
      const gap = r.t - lider, ehRec = i === 0 && r === categoria[0];
      // dourado só para quem tem o recorde da categoria; líder de um recorte por unidade fica neutro
      return '<li><a class="rrow' + (ehRec ? " rrow--lead" : "") + (r.a.me ? " rrow--me" : "") + '" href="#/progresso/' + r.a.id + '" style="--u:' + UMAP[r.a.u].cor + ";--i:" + Math.min(i, 12) + '">' +
        '<span class="rrow__pos">' + (i + 1) + "</span>" +
        '<span class="rrow__who"><b>' + esc(r.a.n) + (r.a.me ? " <em>você</em>" : "") + "</b>" +
        "<small><i></i>" + esc(r.a.u) + (gap > 0 ? " · +" + gap.toFixed(1) + "s" : "") + "</small></span>" +
        '<span class="rrow__t"><b>' + fmt(r.t) + "</b>" + (ehRec ? "<small>" + (F.periodo === "geral" ? "Recorde" : "Melhor") + "</small>" : i === 0 ? '<small class="is-lider">Líder</small>' : "") + "</span></a></li>";
    }).join("") + "</ol>";
  }

  function montarFiltros() {
    $("#f-faixa").innerHTML = FAIXAS.map((f) => '<option value="' + f.id + '">' + f.label + "</option>").join("");
    $("#f-uni").innerHTML = '<option value="__all">Todas as unidades</option>' +
      UNIDADES.map((u) => '<option value="' + esc(u.nome) + '">' + esc(u.nome) + " (" + u.sigla + ")</option>").join("");
  }
  function lerFiltros() {
    F.s = $("#f-sexo").value; F.faixa = $("#f-faixa").value; F.dist = +$("#f-dist").value; F.uni = $("#f-uni").value;
  }

  /* filtros do celular: tudo a um toque. Espelham os selects do desktop,
     que continuam sendo a fonte da verdade. */
  function montarFiltrosCelular() {
    $("#mf-faixa").innerHTML = FAIXAS.map((f) =>
      '<button type="button" class="chip-btn" data-mf-f="' + f.id + '">' + (f.id === "50+" ? "50+ anos" : f.label) + "</button>").join("");
    $("#mf-uni").innerHTML = '<button type="button" class="chip-btn" data-mf-u="__all">Todas as unidades</button>' +
      UNIDADES.map((u) => '<button type="button" class="chip-btn" data-mf-u="' + esc(u.nome) + '"><i style="--u:' + u.cor + '"></i>' + esc(u.nome) + "</button>").join("");
    $("#mf").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.mfS) $("#f-sexo").value = b.dataset.mfS;
      else if (b.dataset.mfD) $("#f-dist").value = b.dataset.mfD;
      else if (b.dataset.mfF) $("#f-faixa").value = b.dataset.mfF;
      else if (b.dataset.mfU) $("#f-uni").value = b.dataset.mfU;
      else return;
      renderRanking();
    });
  }
  // o botão escolhido sempre fica à vista na fileira
  function trazerParaVista(fila, btn) {
    if (!btn) return;
    const esq = btn.offsetLeft - 16, dir = btn.offsetLeft + btn.offsetWidth + 16;
    if (esq < fila.scrollLeft || dir > fila.scrollLeft + fila.clientWidth) {
      fila.scrollTo({ left: Math.max(0, esq), behavior: REDUZ ? "auto" : "smooth" });
    }
  }
  function sincronizarFiltrosCelular() {
    $$("[data-mf-s]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mfS === F.s)));
    $$("[data-mf-d]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.mfD === F.dist)));
    $$("[data-mf-f]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mfF === F.faixa)));
    $$("[data-mf-u]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mfU === F.uni)));
    trazerParaVista($("#mf-faixa"), $('#mf-faixa [aria-pressed="true"]'));
    trazerParaVista($("#mf-uni"), $('#mf-uni [aria-pressed="true"]'));
  }
  function aplicarFiltros(o) {
    Object.assign(F, o);
    // o ranking só tem as distâncias do select (500 e 1.000m); outra distância cai no 500m
    if (!$$("#f-dist option").some((op) => +op.value === F.dist)) F.dist = 500;
    $("#f-sexo").value = F.s; $("#f-faixa").value = F.faixa; $("#f-dist").value = String(F.dist); $("#f-uni").value = F.uni;
    $$("#periodo button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === F.periodo)));
  }

  let rankingNoCelular = null; // em qual modo o ranking foi desenhado por último
  function renderRanking() {
    lerFiltros();
    sincronizarFiltrosCelular();
    rankingNoCelular = CELULAR.matches;
    const per = PERIODOS[F.periodo], fx = FMAP[F.faixa];
    const categoria = classificar({ s: F.s, faixa: F.faixa, dist: F.dist, periodo: F.periodo });
    const lista = F.uni === "__all" ? categoria : categoria.filter((r) => r.a.u === F.uni);

    $("#ctx-eyebrow").textContent = per.rot;
    // cada pedaço fica inteiro na quebra de linha ("20–24 anos" não parte no traço)
    $("#ctx-title").innerHTML = [F.s === "M" ? "Masculino" : "Feminino", fx.label, distLbl(F.dist)].concat(F.uni === "__all" ? [] : [F.uni])
      .map((p) => '<span class="nw">' + esc(p) + "</span>").join(" · ");
    $("#chip-n").innerHTML = "<b>" + lista.length + "</b> atleta" + (lista.length === 1 ? "" : "s");
    $("#chip-rec").innerHTML = per.rec + " <b>" + (categoria.length ? fmt(categoria[0].t) : "—") + "</b>";

    /* disputa entre unidades: legenda, distribuição e filtro num controle só */
    const bar = $("#duel-bar");
    bar.innerHTML = UNIDADES.map((u) => {
      const q = categoria.filter((r) => r.a.u === u.nome).length;
      return '<button type="button" class="duel__seg' + (q ? "" : " duel__seg--vazio") + '" style="--u:' + u.cor + ";flex:" + q + ' 1 46px" data-unidade="' + esc(u.nome) +
        '" aria-pressed="' + (F.uni === u.nome) + '"' + (q ? "" : " disabled") + ' title="' + esc(u.nome) + ": " + q + " de " + categoria.length + ' na categoria"><span>' + u.sigla + " " + q + "</span></button>";
    }).join("");
    bar.classList.toggle("duel__bar--filtrado", F.uni !== "__all");
    $("#duel-all").setAttribute("aria-pressed", String(F.uni === "__all"));
    $("#duel-sub").textContent = F.uni === "__all" ? "Clique numa cidade para ver só ela" : "Mostrando só " + F.uni + " — toque em Todos para voltar";
    $("#duel-lead").innerHTML = categoria.length ? "Melhor tempo: <b>" + fmt(categoria[0].t) + "</b> · " + UMAP[categoria[0].a.u].sigla : "";

    /* raias — top 5 */
    const lanes = $("#lanes"), host = $("#tablehost");
    lanes.innerHTML = "";
    if (!lista.length) {
      host.innerHTML = '<div class="empty"><b>Nenhum tempo nesse recorte</b>Ainda não há resultado para essa combinação. Mude o período ou peça ao professor para lançar.</div>';
      renderLateral(); return;
    }
    if (CELULAR.matches) {
      lanes.innerHTML = listaSimples(lista, categoria);
      host.innerHTML = "";
      renderLateral(); return;
    }
    const lider = lista[0].t;
    lanes.innerHTML = lista.slice(0, TOP).map((r, i) => {
      const gap = r.t - lider, pct = Math.max(22, 100 - (gap / lider) * 320);
      const ehRec = i === 0 && r === categoria[0];
      return '<article class="lane lane--' + (i + 1) + ' spot" style="--u:' + UMAP[r.a.u].cor + ";--i:" + i + '" data-atleta="' + r.a.id + '">' +
        (i === 0 ? '<span class="lane__shine" aria-hidden="true"></span>' : "") +
        '<div class="lane__pos">' + (i + 1) + "<small>RAIA</small></div>" +
        '<div class="lane__body"><div class="lane__name">' + linkAtleta(r.a) +
        (i === 0 ? (ehRec ? ' <span class="tag tag--rec">' + (F.periodo === "geral" ? "Recorde" : "Melhor") + "</span>" : ' <span class="tag tag--lead">Líder</span>') : "") +
        (r.a.me ? ' <span class="tag tag--pr">Você</span>' : "") + "</div>" +
        '<div class="lane__meta">' + selo(r.a.u) +
        '<span class="mi"><i></i>' + r.a.i + " anos</span>" +
        '<span class="mi"><i></i>' + r.w + " W médios</span>" +
        '<span class="mi"><i></i>' + dataCurta(r.d) + "</span>" +
        (gap > 0 ? '<span class="mi mi--gap"><i></i>+' + gap.toFixed(1) + "s do líder</span>" : "") + "</div>" +
        '<div class="gap"><span class="gap__fill" style="--w:' + pct.toFixed(1) + '%"><span class="boat">' + BARCO + "</span></span></div></div>" +
        '<div class="lane__time"><b>' + fmt(r.t) + "</b><em>" + r.sp + " /500m</em></div></article>";
    }).join("");

    /* tabela — do 6º em diante */
    const resto = lista.slice(TOP);
    if (!resto.length) {
      host.innerHTML = '<div class="empty"><b>Todo mundo está no pódio</b>Essa categoria tem ' + lista.length + " atleta(s) — cabem todos nas raias.</div>";
    } else {
      host.innerHTML = "<table><thead><tr><th>Pos</th><th>Atleta</th><th>Tempo</th><th>Split /500m</th>" +
        '<th class="num">Watts</th><th class="num">Idade</th><th>Data</th><th>Unidade</th><th class="num">Dif.</th></tr></thead><tbody>' +
        resto.map((r, k) =>
          '<tr class="' + (r.a.me ? "me" : "") + '" style="--u:' + UMAP[r.a.u].cor + ";--i:" + k + '">' +
          '<td class="pos" data-l="Posição">' + (k + TOP + 1) + "º</td>" +
          '<td class="nome" data-l="Atleta">' + linkAtleta(r.a) + (r.a.me ? ' <span class="tag tag--pr">Você</span>' : "") + "</td>" +
          '<td class="t" data-l="Tempo">' + fmt(r.t) + "</td>" +
          '<td class="sec" data-l="Split /500m">' + r.sp + "</td>" +
          '<td class="sec num" data-l="Watts">' + r.w + "</td>" +
          '<td class="sec num" data-l="Idade">' + r.a.i + "</td>" +
          '<td class="sec" data-l="Data">' + dataCurta(r.d) + "</td>" +
          '<td class="uni" data-l="Unidade">' + selo(r.a.u) + "</td>" +
          '<td class="num dif" data-l="Dif. do líder"><span class="delta">+' + (r.t - lider).toFixed(1) + "s</span></td></tr>"
        ).join("") + "</tbody></table>";
    }
    renderLateral();
  }

  function renderLateral() {
    const fx = FMAP[F.faixa];
    const recs = [500, 1000].map((dist) => ({ dist, r: classificar({ s: F.s, faixa: F.faixa, dist })[0] }));
    const evo = evolucao30();
    $("#rk-side").innerHTML =
      '<section class="card spot"><h3>Recordes da casa</h3><p class="card__hint">' + (F.s === "M" ? "Masculino" : "Feminino") + " · " + fx.label + " · toque para ver a distância</p>" +
      '<div class="reclist">' + recs.map((x) =>
        '<button type="button" class="rec" data-dist="' + x.dist + '" aria-pressed="' + (x.dist === F.dist) + '">' +
        '<span class="rec__d">' + distLbl(x.dist) + "</span>" +
        '<span class="rec__who">' + (x.r ? "<b>" + esc(x.r.a.n) + "</b><span>" + UMAP[x.r.a.u].sigla + " · " + dataCurta(x.r.d) + "</span>" : "<b>—</b><span>sem tempo ainda</span>") + "</span>" +
        '<span class="rec__t">' + (x.r ? fmt(x.r.t) : "—") + "</span></button>").join("") + "</div></section>" +
      '<section class="card spot"><h3>Quem mais evoluiu</h3><p class="card__hint">500m · últimos 30 dias contra o melhor anterior</p>' +
      (evo.length ? '<ol class="evo">' + evo.map((x, i) =>
        '<li><span class="evo__n">' + (i + 1) + '</span><span class="avatar" style="--u:' + UMAP[x.a.u].cor + '">' + iniciais(x.a.n) + "</span>" +
        '<span class="evo__who">' + linkAtleta(x.a) + "<span>" + UMAP[x.a.u].sigla + " · agora " + fmt(x.t) + "</span></span>" +
        '<span class="evo__d">−' + x.d.toFixed(1) + "s</span></li>").join("") + "</ol>" : '<p class="card__hint">Ninguém melhorou nos últimos 30 dias.</p>') +
      "</section>" +
      '<div class="cta-card"><b>Tempo novo?</b><p>O professor lança pelo tablet e o ranking atualiza na hora.</p><a class="btn btn--sm" href="#/professor">Área do professor ' + ic("arrow") + "</a></div>";
  }

  function ligarRanking() {
    ["f-sexo", "f-faixa", "f-dist", "f-uni"].forEach((id) => $("#" + id).addEventListener("change", renderRanking));
    $("#go").addEventListener("click", () => { renderRanking(); $(".ctx").scrollIntoView({ behavior: REDUZ ? "auto" : "smooth", block: "start" }); });
    $("#duel-bar").addEventListener("click", (ev) => {
      const seg = ev.target.closest(".duel__seg");
      if (!seg || seg.disabled) return;
      const cidade = seg.dataset.unidade;
      $("#f-uni").value = $("#f-uni").value === cidade ? "__all" : cidade; // reclicar desmarca
      renderRanking();
    });
    $("#duel-all").addEventListener("click", () => { $("#f-uni").value = "__all"; renderRanking(); });
    $("#periodo").addEventListener("click", function (ev) {
      const b = ev.target.closest("button[data-p]");
      if (!b) return;
      F.periodo = b.dataset.p;
      $$("button[data-p]", this).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderRanking();
    });
    $("#lanes").addEventListener("click", (ev) => {
      if (ev.target.closest("a")) return;
      const lane = ev.target.closest(".lane");
      if (lane) location.hash = "#/progresso/" + lane.dataset.atleta;
    });
    $("#rk-side").addEventListener("click", (ev) => {
      const b = ev.target.closest(".rec[data-dist]");
      if (!b) return;
      $("#f-dist").value = b.dataset.dist; renderRanking();
    });
  }

  /* ============================================================ MEU PROGRESSO */
  function perfil(a) {
    const ts = testes().filter((t) => t.a === a.id).sort((x, y) => x.d - y.d);
    const P = { a, ts, n: ts.length, prs: 0, prIds: {}, best: {}, porDist: { 500: [], 1000: [], 2000: [] }, fx: faixaDe(a), lider: [], rk: {} };
    ts.forEach((t) => {
      const mb = P.best[t.dist];
      if (mb != null && t.t < mb) { P.prs++; P.prIds[t.id] = 1; }
      if (mb == null || t.t < mb) P.best[t.dist] = t.t;
      P.porDist[t.dist].push(t);
    });
    P.dists = Object.keys(P.best).length;
    P.meses = new Set(ts.map((t) => t.d.getFullYear() + "-" + t.d.getMonth())).size;
    [500, 1000, 2000].forEach((dist) => {
      const rk = classificar({ s: a.s, faixa: P.fx.id, dist });
      const i = rk.findIndex((r) => r.a.id === a.id);
      P.rk[dist] = { rk, i };
      if (i === 0) P.lider.push(dist);
    });
    P.pos = P.rk[500].i >= 0 ? P.rk[500].i + 1 : null;
    P.total = P.rk[500].rk.length;
    const ano = P.porDist[500].filter((t) => t.d >= corte(365));
    P.evo = ano.length > 1 ? Math.max(0, r1(ano[0].t - Math.min.apply(null, ano.map((t) => t.t)))) : 0;
    P.conq = conquistas(P);
    P.nConq = P.conq.filter((c) => c.ok).length;
    P.xp = P.n * 40 + P.prs * 90 + P.nConq * 150;
    let li = NIVEIS.length - 1;
    while (li > 0 && P.xp < NIVEIS[li].min) li--;
    P.nivel = li + 1; P.nivelNome = NIVEIS[li].n; P.prox = NIVEIS[li + 1] || null;
    P.xpPct = P.prox ? (P.xp - NIVEIS[li].min) / (P.prox.min - NIVEIS[li].min) : 1;
    return P;
  }

  function conquistas(P) {
    const M = P.a.s === "M";
    const sub = M ? 100 : 115, subL = M ? "1:40" : "1:55";
    const dois = M ? 420 : 480, doisL = M ? "7:00" : "8:00";
    const b5 = P.best[500], b2 = P.best[2000];
    const cl = (v) => Math.max(0, Math.min(1, v));
    return [
      { nome: "Primeira remada", desc: "Primeiro teste validado", ico: "star", ok: P.n >= 1, prog: cl(P.n), st: P.n ? P.n + " testes no total" : "0/1" },
      { nome: "Superação", desc: "Bater o próprio recorde", ico: "trend", ok: P.prs >= 1, prog: cl(P.prs), st: P.prs + " recorde" + (P.prs === 1 ? "" : "s") + " pessoa" + (P.prs === 1 ? "l" : "is") },
      { nome: "Três distâncias", desc: "500, 1.000 e 2.000m testados", ico: "layers", ok: P.dists === 3, prog: P.dists / 3, st: P.dists + "/3 distâncias" },
      { nome: "Constância", desc: "Testes em 6 meses diferentes", ico: "calendar", ok: P.meses >= 6, prog: cl(P.meses / 6), st: Math.min(P.meses, 6) + "/6 meses" },
      { nome: "Top 5 da faixa", desc: "Entre os 5 melhores no 500m", ico: "medal", ok: !!P.pos && P.pos <= 5, prog: P.pos ? cl(5 / P.pos) : 0, st: P.pos ? "Hoje: " + P.pos + "º de " + P.total : "Sem 500m" },
      { nome: "Pódio", desc: "Top 3 da faixa no 500m", ico: "podium", ok: !!P.pos && P.pos <= 3, prog: P.pos ? cl(3 / P.pos) : 0, st: P.pos ? "Hoje: " + P.pos + "º" : "Sem 500m", gold: true },
      { nome: "Recordista da casa", desc: "1º da faixa em alguma distância", ico: "crown", ok: P.lider.length > 0, prog: P.lider.length ? 1 : 0, st: P.lider.length ? "Recorde no " + P.lider.map(distLbl).join(", ") : "Ainda não", gold: true },
      { nome: "Sub-" + subL, desc: "500m abaixo de " + subL, ico: "bolt", ok: b5 != null && b5 < sub, prog: b5 ? cl(sub / b5) : 0, st: b5 == null ? "Sem 500m" : b5 < sub ? "Melhor: " + fmt(b5) : "Faltam " + r1(b5 - sub + 0.1).toFixed(1) + "s" },
      { nome: "Motor de 2.000m", desc: "2.000m abaixo de " + doisL, ico: "gauge", ok: b2 != null && b2 < dois, prog: b2 ? cl(dois / b2) : 0, st: b2 == null ? "Sem 2.000m" : b2 < dois ? "Melhor: " + fmt(b2) : "Faltam " + r1(b2 - dois + 0.1).toFixed(1) + "s" },
      { nome: "Evolução relâmpago", desc: "−5s no 500m em 12 meses", ico: "flame", ok: P.evo >= 5, prog: cl(P.evo / 5), st: "−" + P.evo.toFixed(1) + "s de 5s" },
    ];
  }

  let pgDist = 500, pgAtleta = null;

  function montarSeletorAtleta() {
    $("#pg-atleta").innerHTML = UNIDADES.map((u) =>
      '<optgroup label="' + esc(u.nome) + '">' + ATLETAS.filter((a) => a.u === u.nome)
        .map((a) => '<option value="' + a.id + '">' + esc(a.n) + (a.me ? " (você)" : "") + "</option>").join("") + "</optgroup>").join("");
    $("#pg-atleta").addEventListener("change", (e) => { location.hash = "#/progresso/" + e.target.value; });
  }

  function renderProgresso(id) {
    const a = AMAP[id] || EU;
    if (pgAtleta !== a.id) pgDist = 500;
    pgAtleta = a.id;
    $("#pg-atleta").value = a.id;
    const P = perfil(a), u = UMAP[a.u], voce = a.me ? "Você" : primeiro(a.n);
    const desde = P.ts.length ? MESES[P.ts[0].d.getMonth()] + "/" + P.ts[0].d.getFullYear() : null;

    let html =
      '<section class="profile spot rise" style="--u:' + u.cor + '">' +
      '<div class="ring" style="--p:' + P.xpPct.toFixed(3) + '"><div class="ring__in"><span class="ring__av">' + iniciais(a.n) + '</span></div><span class="ring__lvl">NÍVEL ' + P.nivel + "</span></div>" +
      '<div class="profile__id"><p class="eyebrow">' + (a.s === "M" ? "Masculino" : "Feminino") + " · " + P.fx.label + "</p>" +
      "<h2>" + esc(a.n) + "</h2>" +
      '<div class="profile__meta">' + selo(a.u) + '<span class="dot"></span><span>' + a.i + " anos</span>" +
      (desde ? '<span class="dot"></span><span>no studio desde ' + desde + "</span>" : "") + "</div>" +
      '<div class="xp"><div class="xp__top"><b>' + P.nivelNome + "</b><span>" + P.xp.toLocaleString("pt-BR") + (P.prox ? " / " + P.prox.min.toLocaleString("pt-BR") : "") + " XP</span></div>" +
      '<div class="xp__bar"><i style="--w:' + (P.xpPct * 100).toFixed(1) + '%"></i></div>' +
      '<p class="xp__hint">' + (P.prox ? "Faltam <b>" + (P.prox.min - P.xp).toLocaleString("pt-BR") + " XP</b> para <b>" + P.prox.n + '</b><span class="xp__rules"> · teste = 40 · recorde pessoal = 90 · conquista = 150</span>'
        : "Nível máximo. Agora é defender o posto.") + "</p></div></div>";

    if (!P.n) {
      html += '<div class="ptiles"><div class="ptile"><span>Testes</span><b>0</b></div><div class="ptile"><span>Na faixa</span><b>—</b></div></div></section>' +
        '<div class="stack"><section class="card rise" style="--d:1"><div class="empty"><b>Nenhum teste validado ainda</b>' +
        esc(primeiro(a.n)) + " acabou de chegar. Assim que o professor validar o primeiro tempo, o painel ganha vida.<br>" +
        '<a class="btn" href="#/professor">Ir para a área do professor ' + ic("arrow") + "</a></div></section></div>";
      $("#pg").innerHTML = html;
      return;
    }

    html += '<div class="ptiles">' +
      '<div class="ptile ptile--brass"><span>Recorde 500m</span><b data-count="' + (P.best[500] || 0) + '" data-fmt="tempo">' + (P.best[500] ? fmt(P.best[500]) : "—") + "</b></div>" +
      '<div class="ptile"><span>Na faixa · 500m</span><b data-count="' + (P.pos || 0) + '" data-fmt="pos">' + (P.pos ? P.pos + "º" : "—") + "</b><small>de " + P.total + "</small></div>" +
      '<div class="ptile ptile--up"><span>Evolução 12 meses</span><b data-count="' + P.evo + '" data-fmt="menos">−' + P.evo.toFixed(1) + "s</b></div>" +
      '<div class="ptile"><span>Testes validados</span><b data-count="' + P.n + '" data-fmt="int">' + P.n + "</b></div>" +
      "</div></section>";

    /* gráfico + alvo + posições */
    html += '<div class="pgrid"><section class="card spot rise" style="--d:1">' +
      '<div class="card__head"><div><h3>Evolução</h3><p class="card__hint">Mais alto = mais rápido · dourado = recorde pessoal</p></div>' +
      '<div class="seg" id="pg-dist" role="group" aria-label="Distância do gráfico">' +
      [500, 1000, 2000].map((d) => '<button type="button" data-d="' + d + '" aria-pressed="' + (d === pgDist) + '"' + (P.porDist[d].length ? "" : " disabled") + ">" + distLbl(d) + "</button>").join("") +
      '</div></div><div class="chart" id="pg-chart" style="--u:' + u.cor + '"></div>' +
      '<div class="chart__legend"><span><i style="background:' + u.cor + '"></i>Teste validado</span><span><i style="background:var(--brass)"></i>Recorde pessoal</span></div></section><div>';

    html += alvoCard(P, voce, u) + posicoesCard(P) + "</div></div>";

    /* conquistas */
    html += '<div class="stack"><section class="card rise" style="--d:3"><div class="card__head"><div><h3>Conquistas</h3><p class="card__hint">' +
      P.nConq + " de " + P.conq.length + ' desbloqueadas · cada uma vale 150 XP</p></div></div><div class="bgrid">' +
      P.conq.map((c, i) => {
        const cls = c.ok ? (c.gold ? "bdg bdg--gold" : "bdg bdg--on") : "bdg";
        return '<div class="' + cls + '" style="--i:' + i + '"><span class="bdg__ico">' + ic(c.ico) + (c.ok ? "" : '<span class="bdg__lock">' + ic("lock") + "</span>") + "</span>" +
          "<b>" + esc(c.nome) + "</b><p>" + esc(c.desc) + "</p>" +
          (c.ok ? "" : '<div class="bdg__prog"><i style="--w:' + (c.prog * 100).toFixed(0) + '%"></i></div>') +
          '<span class="bdg__st">' + (c.ok ? "✓ " : "") + esc(c.st) + "</span></div>";
      }).join("") + "</div></section>";

    /* histórico */
    const hist = P.ts.slice().reverse();
    html += '<section class="card rise" style="--d:4"><div class="card__head"><div><h3>Histórico de testes</h3><p class="card__hint">' + P.n + " testes · todos validados por professor</p></div></div>" +
      '<div class="tablewrap tablewrap--flat" style="box-shadow:none"><table class="hist" id="pg-hist"><thead><tr><th>Data</th><th>Distância</th><th>Tempo</th><th>Split /500m</th><th class="num">Watts</th><th>Marca</th><th>Validado por</th></tr></thead><tbody>' +
      hist.map((t, k) => '<tr class="' + (k >= 5 ? "xtra" : "") + '" style="--u:' + u.cor + ";--i:" + Math.min(k, 12) + '">' +
        '<td class="pos" data-l="Data">' + dataCurta(t.d) + "</td>" +
        '<td class="nome" data-l="Distância">' + distLbl(t.dist) + "</td>" +
        '<td class="t" data-l="Tempo">' + fmt(t.t) + "</td>" +
        '<td class="sec" data-l="Split /500m">' + split(t.t, t.dist) + "</td>" +
        '<td class="sec num" data-l="Watts">' + watts(t.t, t.dist) + "</td>" +
        '<td class="marca" data-l="Marca">' + (P.prIds[t.id] ? '<span class="tag tag--pr">Recorde pessoal</span>' : t.t === P.best[t.dist] ? '<span class="tag tag--pr">Melhor marca</span>' : '<span class="tag tag--muted">—</span>') + "</td>" +
        '<td class="sec" data-l="Validado por">' + esc(curto(t.prof || "")) + "</td></tr>").join("") +
      "</tbody></table></div>" +
      (hist.length > 5 ? '<button type="button" class="btn btn--ghost btn--block histmore" data-hist>Ver os ' + hist.length + " testes</button>" : "") +
      "</section></div>";

    $("#pg").innerHTML = html;
    contar($("#pg"));
    desenharGrafico(P);
  }

  function alvoCard(P, voce, u) {
    const R = P.rk[500];
    if (R.i < 0) return '<section class="card spot rise" style="--d:2"><h3>Próximo alvo</h3><p class="card__hint">Sem tempo de 500m ainda.</p></section>';
    const eu = R.rk[R.i];
    let a, b, txt, sub, xa, xb;
    if (R.i === 0) {
      const seg = R.rk[1];
      if (!seg) {
        return '<section class="card spot rise" style="--d:2"><h3>Próximo alvo</h3><p class="card__hint">500m · ' + P.fx.label + "</p>" +
          '<p class="target__txt">' + voce + " é o único na faixa. Qualquer tempo novo é recorde.</p></section>";
      }
      const gap = seg.t - eu.t;
      a = { r: eu, me: true }; b = { r: seg };
      xa = 88; xb = Math.max(18, 88 - gap * 13);
      txt = (P.a.me ? "Você é" : esc(primeiro(P.a.n)) + " é") + " <b>1º da faixa</b>. " + linkAtleta(seg.a) + " vem atrás, a <b>" + gap.toFixed(1) + "s</b>.";
      sub = "Missão: defender o recorde de <b>" + fmt(eu.t) + "</b> no próximo dia de teste.";
    } else {
      const alvo = R.rk[R.i - 1], gap = eu.t - alvo.t;
      a = { r: alvo }; b = { r: eu, me: true };
      xa = 88; xb = Math.max(18, 88 - gap * 13);
      txt = "Faltam <b>" + gap.toFixed(1) + "s</b> para passar " + linkAtleta(alvo.a) + " e assumir o <b>" + R.i + "º lugar</b>.";
      sub = "Meta do próximo teste: fechar o 500m em <b>" + fmt(alvo.t - 0.1) + "</b> (" + watts(alvo.t - 0.1, 500) + " W médios).";
    }
    const barco = (o, x, cls) => '<div class="tboat ' + cls + (o.me ? " tboat--me" : "") + '" style="--x:' + x + "%;--u:" + UMAP[o.r.a.u].cor + '">' + BARCO +
      "<small>" + (o.me ? voce : esc(primeiro(o.r.a.n))) + " · " + fmt(o.r.t) + "</small></div>";
    return '<section class="card spot rise" style="--d:2"><h3>Próximo alvo</h3><p class="card__hint">500m · ' + P.fx.label + " · classificação geral</p>" +
      '<div class="tlane" aria-hidden="true"><span class="tlane__finish"></span>' + barco(a, xa, "tboat--a") + barco(b, xb, "tboat--b") + "</div>" +
      '<p class="target__txt">' + txt + '</p><p class="target__sub">' + sub + "</p></section>";
  }

  function posicoesCard(P) {
    return '<section class="card spot rise" style="--d:3"><h3>Posição por distância</h3><p class="card__hint">' + P.fx.label + ' · toque para abrir no ranking</p><div class="poslist">' +
      [500, 1000, 2000].map((dist) => {
        const R = P.rk[dist];
        if (R.i < 0) return '<button type="button" class="posrow" disabled><span class="posrow__d">' + distLbl(dist) + '</span><span class="posrow__p">—<small>sem teste</small></span><span class="posrow__t">—</span></button>';
        return '<button type="button" class="posrow' + (R.i === 0 ? " posrow--lead" : "") + '" data-rank="' + P.a.s + "|" + P.fx.id + "|" + dist + '">' +
          '<span class="posrow__d">' + distLbl(dist) + '</span><span class="posrow__p">' + (R.i + 1) + "º<small>de " + R.rk.length + "</small></span>" +
          '<span class="posrow__t">' + fmt(R.rk[R.i].t) + "</span></button>";
      }).join("") + "</div></section>";
  }

  function desenharGrafico(P) {
    const box = $("#pg-chart");
    if (!box) return;
    const lista = P.porDist[pgDist];
    if (lista.length < 2) {
      box.innerHTML = '<p class="chart__msg">' + (lista.length ? "Só um teste de " + distLbl(pgDist) + " até agora (" + fmt(lista[0].t) + "). O gráfico aparece a partir do segundo." : "Sem testes nessa distância.") + "</p>";
      return;
    }
    // desenha na largura real do cartão: no celular os rótulos não encolhem
    const W = Math.max(280, Math.round(box.clientWidth || 640)), H = W < 520 ? 220 : Math.round(W * 0.45), pl = 50, pr = 18, pt = 18, pb = 30;
    const ts = lista.map((t) => t.t), tmin = Math.min.apply(null, ts), tmax = Math.max.apply(null, ts);
    const pad = Math.max(0.6, (tmax - tmin) * 0.18), lo = tmin - pad, hi = tmax + pad;
    const x0 = lista[0].d.getTime(), x1 = Math.max(lista[lista.length - 1].d.getTime(), x0 + DIA);
    const X = (d) => pl + ((d.getTime() - x0) / (x1 - x0)) * (W - pl - pr);
    const Y = (t) => pt + ((t - lo) / (hi - lo)) * (H - pt - pb); // tempo menor fica mais alto
    let g = "";
    for (let k = 0; k <= 4; k++) {
      const v = lo + ((hi - lo) * k) / 4, y = Y(v);
      g += '<line class="gl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="lab" x="' + (pl - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + fmt(v) + "</text>";
    }
    let ultimoMes = "";
    lista.forEach((t) => {
      const m = MESES[t.d.getMonth()] + (t.d.getMonth() === 0 ? "/" + String(t.d.getFullYear()).slice(-2) : "");
      if (m === ultimoMes) return; ultimoMes = m;
      g += '<text class="lab" x="' + X(t.d).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + m + "</text>";
    });
    const pts = lista.map((t) => [X(t.d), Y(t.t)]);
    const linha = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = linha + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (H - pb) + " L" + pts[0][0].toFixed(1) + " " + (H - pb) + " Z";
    box.innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Evolução no ' + distLbl(pgDist) + ": de " + fmt(lista[0].t) + " para " + fmt(lista[lista.length - 1].t) + '">' +
      '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--u);stop-opacity:.32"/><stop offset="1" style="stop-color:var(--u);stop-opacity:0"/></linearGradient></defs>' +
      g + '<path class="area" d="' + area + '" fill="url(#cg)"/>' +
      '<line class="guide" x1="0" x2="0" y1="' + pt + '" y2="' + (H - pb) + '"/>' +
      '<path class="line" d="' + linha + '"/>' +
      lista.map((t, i) => '<circle class="pt' + (P.prIds[t.id] ? " pt--pr" : "") + '" cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="4.5" style="transition-delay:' + (0.25 + i * 0.06).toFixed(2) + 's"/>').join("") +
      '<rect x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent" class="hit"/>' +
      '</svg><div class="tip" id="pg-tip"></div>';

    const path = $(".line", box), L = path.getTotalLength();
    if (!REDUZ) {
      path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
      path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)";
      requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; box.classList.add("is-drawn"); });
    } else box.classList.add("is-drawn");

    const svg = $("svg", box), tip = $("#pg-tip"), guide = $(".guide", box), circles = $$(".pt", box);
    function mostrar(ev) {
      const rect = svg.getBoundingClientRect(), esc_ = rect.width / W;
      const xv = (ev.clientX - rect.left) / esc_;
      let k = 0, dmin = Infinity;
      pts.forEach((p, i) => { const d = Math.abs(p[0] - xv); if (d < dmin) { dmin = d; k = i; } });
      const t = lista[k];
      circles.forEach((c, i) => c.setAttribute("r", i === k ? "7" : "4.5"));
      guide.setAttribute("x1", pts[k][0]); guide.setAttribute("x2", pts[k][0]); guide.classList.add("is-on");
      tip.innerHTML = "<b>" + fmt(t.t) + (P.prIds[t.id] ? '<span class="tag tag--rec">PR</span>' : "") + "</b><span>" + dataCurta(t.d) + " · " + split(t.t, t.dist) + "/500m · " + watts(t.t, t.dist) + " W</span>";
      tip.style.left = svg.offsetLeft + pts[k][0] * esc_ + "px"; tip.style.top = svg.offsetTop + pts[k][1] * esc_ + "px";
      tip.classList.add("is-on");
    }
    function esconder() { tip.classList.remove("is-on"); guide.classList.remove("is-on"); circles.forEach((c) => c.setAttribute("r", "4.5")); }
    svg.addEventListener("pointermove", mostrar);
    svg.addEventListener("pointerdown", mostrar);
    svg.addEventListener("pointerleave", esconder);
  }

  function ligarProgresso() {
    $("#pg").addEventListener("click", (ev) => {
      const mais = ev.target.closest("[data-hist]");
      if (mais) {
        const aberto = $("#pg-hist").classList.toggle("is-open");
        mais.textContent = aberto ? "Mostrar menos" : "Ver os " + $$("#pg-hist tbody tr").length + " testes";
        return;
      }
      const b = ev.target.closest("#pg-dist button[data-d]");
      if (!b || b.disabled) return;
      pgDist = +b.dataset.d;
      $$("#pg-dist button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      desenharGrafico(perfil(AMAP[pgAtleta]));
    });
  }

  /* ============================================================ ÁREA DO PROFESSOR */
  let sessao = null, profSel = 1, pin = "", lDist = 500, sessaoDesde = null;
  try { const s = sessionStorage.getItem("srg-prof"); if (s != null) { sessao = +s; sessaoDesde = new Date(); } } catch (e) {}

  function renderProfessor() { sessao == null ? renderGate() : renderDash(); }

  function renderGate() {
    pin = "";
    $("#pf").innerHTML =
      '<div class="gate rise" style="--d:3" id="gate">' +
      '<div class="gate__lock">' + ic("lock") + "</div>" +
      "<h2>Entrar com PIN</h2>" +
      '<p class="card__hint">Demonstração: qualquer PIN de 4 dígitos entra.</p>' +
      '<div class="profsel" role="radiogroup" aria-label="Professor">' +
      UNIDADES.map((u, i) => '<button type="button" class="profopt" role="radio" aria-checked="' + (i === profSel) + '" data-p="' + i + '" style="--u:' + u.cor + '">' +
        '<span class="avatar" style="--u:' + u.cor + '">' + iniciais(u.prof) + "</span><span><b>" + esc(curto(u.prof)) + "</b><small>" + esc(u.nome) + "</small></span></button>").join("") +
      "</div>" +
      '<div class="dots" id="dots" role="img" aria-label="0 de 4 dígitos"><i></i><i></i><i></i><i></i></div>' +
      '<div class="keypad" id="keypad">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button type="button" class="key" data-k="' + n + '">' + n + "</button>").join("") +
      '<button type="button" class="key key--muted" data-k="c">Limpar</button><button type="button" class="key" data-k="0">0</button>' +
      '<button type="button" class="key key--go" data-k="ok">Entrar</button></div>' +
      '<p class="msg" id="pinmsg" role="status"></p></div>';
  }

  function teclar(k) {
    const gate = $("#gate");
    if (!gate || gate.classList.contains("is-ok")) return;
    const btn = $('.key[data-k="' + k + '"]');
    if (btn) { btn.classList.add("is-press"); setTimeout(() => btn.classList.remove("is-press"), 110); }
    if (k === "c") pin = "";
    else if (k === "back") pin = pin.slice(0, -1);
    else if (k === "ok") return entrar();
    else if (pin.length < 4) pin += k;
    $$("#dots i").forEach((d, i) => d.classList.toggle("on", i < pin.length));
    $("#dots").setAttribute("aria-label", pin.length + " de 4 dígitos");
    $("#pinmsg").textContent = ""; $("#pinmsg").className = "msg";
    if (pin.length === 4) setTimeout(entrar, 160);
  }
  function entrar() {
    const dots = $("#dots");
    if (pin.length < 4) {
      dots.classList.remove("is-err"); void dots.offsetWidth; dots.classList.add("is-err");
      $("#pinmsg").className = "msg msg--no"; $("#pinmsg").textContent = "Digite os 4 dígitos do seu PIN.";
      return;
    }
    $("#gate").classList.add("is-ok");
    $("#pinmsg").className = "msg msg--ok"; $("#pinmsg").textContent = "PIN aceito · abrindo sessão…";
    setTimeout(() => {
      sessao = profSel; sessaoDesde = new Date();
      try { sessionStorage.setItem("srg-prof", String(sessao)); } catch (e) {}
      renderDash();
    }, REDUZ ? 0 : 520);
  }

  const profAtual = () => UNIDADES[sessao];

  function renderDash() {
    const u = profAtual();
    $("#pf").innerHTML =
      '<div class="dash__head rise" style="--u:' + u.cor + '"><span class="avatar avatar--lg" style="--u:' + u.cor + '">' + iniciais(u.prof) + "</span>" +
      '<div class="dash__who"><b>' + esc(u.prof) + "</b><span>" + selo(u.nome) + '<span class="live">Sessão aberta · ' + hora(sessaoDesde || new Date()) + "</span></span></div>" +
      '<div class="dash__actions"><button type="button" class="btn btn--ghost btn--sm" id="pf-reset">' + ic("reset") + 'Restaurar demo</button><button type="button" class="btn btn--ghost btn--sm" id="pf-sair">' + ic("logout") + "Sair</button></div></div>" +
      '<div class="kpis rise" style="--d:1" id="pf-kpis"></div>' +
      '<div class="dgrid">' +
      '<section class="card spot rise" style="--d:2"><div class="card__head"><div><h3>Lançar tempo</h3><p class="card__hint">Entra direto no ranking, assinado por você.</p></div></div>' +
      '<form class="launch" id="launch" autocomplete="off" novalidate>' +
      '<div class="field"><label class="eyebrow" for="l-atleta">Atleta</label><select class="input" id="l-atleta"><option value="">Escolha o atleta…</option>' +
      UNIDADES.slice().sort((x, y) => (x === u ? -1 : y === u ? 1 : 0)).map((un) => '<optgroup label="' + esc(un.nome) + '">' +
        ATLETAS.filter((a) => a.u === un.nome).map((a) => '<option value="' + a.id + '">' + esc(a.n) + " · " + a.i + " anos</option>").join("") + "</optgroup>").join("") +
      "</select></div>" +
      '<div class="field"><span class="eyebrow">Distância</span><div class="seg seg--lg" id="l-dist" role="group" aria-label="Distância">' +
      [500, 1000, 2000].map((d) => '<button type="button" data-d="' + d + '" aria-pressed="' + (d === lDist) + '">' + distLbl(d) + "</button>").join("") + "</div></div>" +
      '<div class="field"><label class="eyebrow" for="l-tempo">Tempo final</label><div class="timebox">' +
      '<input class="input input--time" id="l-tempo" inputmode="decimal" placeholder="' + (lDist === 500 ? "1:42.5" : lDist === 1000 ? "3:35.0" : "7:20.0") + '" aria-describedby="l-hint">' +
      '<div class="timebox__aux"><span>Split <b id="l-split">—</b></span><span>Watts <b id="l-watts">—</b></span></div></div>' +
      '<p class="hint" id="l-hint">Formato m:ss.d — do jeito que aparece no monitor do ergômetro.</p></div>' +
      '<div class="preview" id="l-prev">Escolha o atleta e digite o tempo para ver onde ele entra.</div>' +
      '<button class="btn btn--block" type="submit" id="l-go" disabled>' + ic("check") + "Lançar e validar</button></form></section>" +
      '<section class="card spot rise" style="--d:3"><div class="card__head"><div><h3>Fila de validação</h3><p class="card__hint">Tempos registrados no tablet da sala</p></div></div><div id="pf-queue"></div></section>' +
      "</div>" +
      '<div class="stack"><section class="card rise" style="--d:4"><div class="card__head"><div><h3>Registro de lançamentos</h3><p class="card__hint">Quem lançou, o quê e quando — nada some daqui.</p></div></div><ol class="log" id="pf-log"></ol></section></div>';
    renderKpis(); renderFila(); renderLog();
  }

  function renderKpis() {
    const box = $("#pf-kpis");
    if (!box) return;
    const hojeVal = state.added.filter((x) => x.status === "validado" && new Date(x.d) >= HOJE).length;
    const fila = state.added.filter((x) => x.status === "pendente").length;
    const recs = state.log.filter((x) => x.rec && new Date(x.d) >= HOJE).length;
    const ativos = new Set(testes().filter((t) => t.d >= corte(30)).map((t) => t.a)).size;
    box.innerHTML =
      '<div class="kpi kpi--accent"><span>Validados hoje</span><b data-count="' + hojeVal + '">' + hojeVal + "</b></div>" +
      '<div class="kpi"><span>Na fila</span><b data-count="' + fila + '">' + fila + "</b></div>" +
      '<div class="kpi kpi--brass"><span>Recordes hoje</span><b data-count="' + recs + '">' + recs + "</b></div>" +
      '<div class="kpi"><span>Ativos · 30 dias</span><b data-count="' + ativos + '">' + ativos + "</b></div>";
    contar(box);
  }

  function renderFila() {
    const box = $("#pf-queue");
    if (!box) return;
    const fila = state.added.filter((x) => x.status === "pendente").sort((x, y) => new Date(y.d) - new Date(x.d));
    if (!fila.length) {
      box.innerHTML = '<div class="qempty"><b>Fila zerada</b>Novos tempos do tablet da sala aparecem aqui.</div>' +
        '<div class="queue__foot"><button type="button" class="btn btn--ghost btn--sm" id="pf-sim">' + ic("tablet") + "Simular tempo do tablet</button></div>";
      return;
    }
    box.innerHTML = '<div class="queue">' + fila.map((x, i) => {
      const a = AMAP[x.a];
      const origem = /^Tablet/.test(x.via) ? "Tablet " + UMAP[a.u].sigla : esc(x.via);
      return '<div class="qitem" style="--u:' + UMAP[a.u].cor + ";--i:" + i + '" data-id="' + x.id + '"><div><b>' + esc(a.n) + "</b><span>" + distLbl(x.dist) + " · " + origem + " · " + quando(new Date(x.d)) + "</span></div>" +
        '<span class="t">' + fmt(x.t) + "</span>" +
        '<div class="qitem__act"><button type="button" class="ibtn ibtn--ok" data-ok="' + x.id + '" aria-label="Validar ' + esc(a.n) + '" title="Validar">' + ic("check") + "</button>" +
        '<button type="button" class="ibtn ibtn--no" data-no="' + x.id + '" aria-label="Recusar ' + esc(a.n) + '" title="Recusar">' + ic("x") + "</button></div></div>";
    }).join("") + "</div>" +
      '<div class="queue__foot"><button type="button" class="btn btn--sm" id="pf-all">' + ic("check") + "Validar os " + fila.length + '</button><button type="button" class="btn btn--ghost btn--sm" id="pf-sim">' + ic("tablet") + "Simular tablet</button></div>";
  }

  function renderLog() {
    const box = $("#pf-log");
    if (!box) return;
    const semeado = SEED.slice().sort((x, y) => y.d - x.d).slice(0, 8)
      .map((t) => ({ d: t.d.toISOString(), prof: t.prof, acao: "validou", a: t.a, dist: t.dist, t: t.t }));
    const itens = state.log.concat(semeado).sort((x, y) => new Date(y.d) - new Date(x.d)).slice(0, 14);
    box.innerHTML = itens.map((x, i) => {
      const a = AMAP[x.a], d = new Date(x.d);
      return '<li style="--u:' + (x.acao === "recusou" ? "var(--danger)" : x.rec ? "var(--brass)" : UMAP[a.u].cor) + ";--i:" + i + '"><time>' + (d >= HOJE ? "hoje<br>" + hora(d) : dd(d.getDate()) + "/" + dd(d.getMonth() + 1) + "<br>" + hora(d)) + "</time>" +
        "<p><b>" + esc(curto(x.prof)) + "</b> " + x.acao + ' <span class="mono">' + fmt(x.t) + "</span> de " + linkAtleta(a) + " · " + distLbl(x.dist) +
        (x.rec ? '<span class="tag tag--rec">Recorde</span>' : x.pr ? '<span class="tag tag--pr">PR</span>' : "") + "</p></li>";
    }).join("");
  }

  function atualizarPreview() {
    const prev = $("#l-prev"), go = $("#l-go"), inp = $("#l-tempo");
    if (!prev) return;
    const id = $("#l-atleta").value, raw = inp.value.trim(), t = parseTempo(raw);
    const lim = { 500: [70, 240], 1000: [150, 480], 2000: [330, 900] }[lDist];
    const ok = t != null && t >= lim[0] && t <= lim[1];
    inp.classList.toggle("is-bad", !!raw && !ok);
    $("#l-split").textContent = ok ? split(t, lDist) : "—";
    $("#l-watts").textContent = ok ? watts(t, lDist) + " W" : "—";
    go.disabled = true;
    prev.className = "preview";
    if (!raw) { prev.textContent = "Escolha o atleta e digite o tempo para ver onde ele entra."; return; }
    if (!ok) { prev.className = "preview preview--bad"; prev.textContent = "Tempo fora do padrão para " + distLbl(lDist) + ". Exemplo: " + (lDist === 500 ? "1:42.5" : lDist === 1000 ? "3:35.0" : "7:20.0") + "."; return; }
    if (!id) { prev.textContent = "Agora escolha o atleta para simular a posição."; return; }
    const ev = avaliar(id, lDist, t);
    go.disabled = false;
    prev.className = "preview preview--live" + (ev.recorde ? " preview--rec" : "");
    const cat = (ev.a.s === "M" ? "Masculino" : "Feminino") + " · " + ev.fx.label + " · " + distLbl(lDist);
    prev.innerHTML =
      (ev.recorde ? '<div class="prev__rec">' + ic("trophy") + "<div>Novo recorde da casa<small>" + (ev.destronado ? "Destrona " + esc(ev.destronado.a.n) + " (" + fmt(ev.destronado.t) + ")" : "Primeiro tempo da categoria") + "</small></div></div>" : "") +
      '<div class="prev__pos"><b>' + ev.pos + "º</b><span>de " + ev.total + " · " + cat + "</span></div>" +
      '<div class="prev__tags">' +
      (ev.primeira ? '<span class="tag tag--pr">Primeiro tempo nessa distância</span>' :
        ev.pr ? '<span class="tag tag--pr">Recorde pessoal −' + (ev.pb - t).toFixed(1) + "s</span>" :
          '<span class="tag tag--muted">Recorde pessoal segue ' + fmt(ev.pb) + "</span>") + "</div>";
  }

  function celebrar(ev, nome) {
    const link = rankLink(ev.a.s, ev.fx.id, ev.dist, "Ver no ranking →");
    if (ev.recorde) {
      confete();
      toast("<b>Recorde da casa caiu!</b> " + esc(nome) + " fez <b>" + fmt(ev.t) + "</b> nos " + distLbl(ev.dist) + " (" + ev.fx.label + ")." +
        (ev.destronado ? " Destronou " + esc(ev.destronado.a.n) + " (" + fmt(ev.destronado.t) + ")." : "") + "<br>" + link, "rec");
    } else if (ev.pr) {
      toast("<b>Recorde pessoal!</b> " + esc(nome) + ": " + fmt(ev.t) + " nos " + distLbl(ev.dist) + " (−" + (ev.pb - ev.t).toFixed(1) + "s). Agora " + ev.pos + "º na faixa.<br>" + link, "pr");
    } else {
      toast("<b>Tempo validado.</b> " + esc(nome) + " · " + fmt(ev.t) + " nos " + distLbl(ev.dist) + " — " + ev.pos + "º na faixa.<br>" + link);
    }
  }

  function validar(id, quieto) {
    const x = state.added.find((y) => y.id === id && y.status === "pendente");
    if (!x) return null;
    const ev = avaliar(x.a, x.dist, x.t, x.id);
    x.status = "validado"; x.by = profAtual().prof;
    state.log.push({ d: new Date().toISOString(), prof: x.by, acao: "validou", a: x.a, dist: x.dist, t: x.t, rec: ev.recorde, pr: ev.pr });
    mudou();
    if (!quieto) celebrar(ev, AMAP[x.a].n);
    return ev;
  }

  function sumir(id, depois) {
    const el = $('.qitem[data-id="' + id + '"]');
    if (!el || REDUZ) return depois();
    el.classList.add("is-out");
    setTimeout(depois, 300);
  }

  function simularTablet() {
    const elegiveis = ATLETAS.filter((a) => a.b != null), a = elegiveis[(Math.random() * elegiveis.length) | 0];
    const dist = [500, 500, 1000, 2000][(Math.random() * 4) | 0];
    const meus = testes().filter((t) => t.a === a.id && t.dist === dist).map((t) => t.t);
    const pb = meus.length ? Math.min.apply(null, meus) : base(a.b, dist);
    state.n = (state.n || 0) + 1;
    state.added.push({ id: "t" + Date.now(), a: a.id, dist, t: r1(pb * (1 + (Math.random() * 0.03 - 0.009))), d: new Date().toISOString(), via: "Tablet · " + a.u, status: "pendente" });
    mudou(); renderFila(); renderKpis();
    toast("<b>Novo tempo no tablet.</b> " + esc(a.n) + " · " + distLbl(dist) + " — aguardando validação.", "info");
  }

  function ligarProfessor() {
    const pf = $("#pf");
    pf.addEventListener("click", (ev) => {
      const t = ev.target;
      const opt = t.closest(".profopt");
      if (opt) { profSel = +opt.dataset.p; $$(".profopt").forEach((o) => o.setAttribute("aria-checked", String(o === opt))); return; }
      const key = t.closest(".key");
      if (key) return teclar(key.dataset.k);
      if (t.closest("#pf-sair")) {
        sessao = null; try { sessionStorage.removeItem("srg-prof"); } catch (e) {}
        renderGate(); return;
      }
      if (t.closest("#pf-reset")) {
        state = estadoInicial(); mudou(); renderDash();
        toast("<b>Demonstração restaurada.</b> A fila voltou com 3 tempos do tablet.", "info"); return;
      }
      if (t.closest("#pf-sim")) return simularTablet();
      const okb = t.closest("[data-ok]");
      if (okb) { const id = okb.dataset.ok; return sumir(id, () => { validar(id); renderFila(); renderKpis(); renderLog(); atualizarPreview(); }); }
      const nob = t.closest("[data-no]");
      if (nob) {
        const id = nob.dataset.no, x = state.added.find((y) => y.id === id);
        return sumir(id, () => {
          x.status = "recusado"; x.by = profAtual().prof;
          state.log.push({ d: new Date().toISOString(), prof: x.by, acao: "recusou", a: x.a, dist: x.dist, t: x.t });
          mudou(); renderFila(); renderKpis(); renderLog();
          toast("<b>Tempo recusado.</b> " + esc(AMAP[x.a].n) + " · " + fmt(x.t) + " não entra no ranking, mas fica no registro.", "info");
        });
      }
      if (t.closest("#pf-all")) {
        const ids = state.added.filter((x) => x.status === "pendente").map((x) => x.id);
        let rec = null, n = 0;
        ids.forEach((id) => { const ev = validar(id, true); if (ev) { n++; if (ev.recorde && !rec) rec = ev; } });
        renderFila(); renderKpis(); renderLog(); atualizarPreview();
        if (rec) celebrar(rec, rec.a.n);
        toast("<b>" + n + " tempo" + (n === 1 ? "" : "s") + " validado" + (n === 1 ? "" : "s") + ".</b> O ranking já foi atualizado.");
        return;
      }
      const db = t.closest("#l-dist button[data-d]");
      if (db) {
        lDist = +db.dataset.d;
        $$("#l-dist button").forEach((x) => x.setAttribute("aria-pressed", String(x === db)));
        $("#l-tempo").placeholder = lDist === 500 ? "1:42.5" : lDist === 1000 ? "3:35.0" : "7:20.0";
        atualizarPreview();
      }
    });
    pf.addEventListener("input", (ev) => { if (ev.target.id === "l-tempo") atualizarPreview(); });
    pf.addEventListener("change", (ev) => { if (ev.target.id === "l-atleta") atualizarPreview(); });
    pf.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const id = $("#l-atleta").value, t = parseTempo($("#l-tempo").value);
      if (!id || t == null || $("#l-go").disabled) return;
      const evl = avaliar(id, lDist, t), prof = profAtual().prof;
      state.n = (state.n || 0) + 1;
      const nid = "n" + Date.now();
      state.added.push({ id: nid, a: id, dist: lDist, t, d: new Date().toISOString(), via: "Lançado pelo professor", status: "validado", by: prof });
      state.log.push({ d: new Date().toISOString(), prof, acao: "lançou", a: id, dist: lDist, t, rec: evl.recorde, pr: evl.pr });
      mudou();
      celebrar(evl, AMAP[id].n);
      $("#l-tempo").value = "";
      atualizarPreview(); renderKpis(); renderLog();
      $("#l-tempo").focus();
    });
    document.addEventListener("keydown", (ev) => {
      if (rotaAtual !== "professor" || sessao != null || !$("#gate")) return;
      if (ev.target.closest && ev.target.closest("input,select,textarea")) return;
      if (/^[0-9]$/.test(ev.key)) { teclar(ev.key); ev.preventDefault(); }
      else if (ev.key === "Backspace") { teclar("back"); ev.preventDefault(); }
      else if (ev.key === "Enter") { teclar("ok"); ev.preventDefault(); }
    });
  }

  /* ============================================================ ROTEADOR */
  const ROTAS = ["ranking", "progresso", "professor", "escopo"];
  const TITULOS = { ranking: "Ranking", progresso: "Meu progresso", professor: "Área do professor", escopo: "Escopo" };
  let rotaAtual = null, primeiraVez = true;

  function lerRota() {
    const p = location.hash.replace(/^#\/?/, "").split("/");
    return { r: ROTAS.indexOf(p[0]) >= 0 ? p[0] : "ranking", param: p[1] ? decodeURIComponent(p[1]) : null };
  }
  function moverIndicador(instant) {
    const a = $('.nav a[aria-current="page"]'), ind = $("#nav-ind");
    if (!a || !ind || !a.offsetWidth) return;
    ind.classList.toggle("is-instant", !!instant);
    ind.style.width = a.offsetWidth + "px";
    ind.style.transform = "translateX(" + a.offsetLeft + "px)";
  }
  function navegar() {
    const { r, param } = lerRota();
    const trocou = r !== rotaAtual;
    rotaAtual = r;
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === r));
    $$("[data-route]").forEach((a) => (a.dataset.route === r ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    moverIndicador(primeiraVez);
    document.title = "Studio Remo Game · " + TITULOS[r];
    if (r === "ranking") renderRanking();
    else if (r === "progresso") renderProgresso(param);
    else if (r === "professor") renderProfessor();
    if (!primeiraVez && (trocou || r === "progresso")) window.scrollTo({ top: 0, behavior: "instant" });
    primeiraVez = false;
    if (r === "escopo") { revelar(); setTimeout(revelar, 350); }
  }

  function revelar() {
    if (rotaAtual !== "escopo") return;
    const lim = innerHeight * 0.88;
    $$(".reveal:not(.is-in)").forEach((el) => { if (el.getBoundingClientRect().top < lim) el.classList.add("is-in"); });
  }

  /* ---------- ligações globais ---------- */
  function ligarGlobais() {
    // brilho que segue o ponteiro nos cartões
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    }, { passive: true });

    // atalhos "ver no ranking" com a categoria já filtrada
    document.addEventListener("click", (e) => {
      const el = e.target.closest && e.target.closest("[data-rank]");
      if (!el) return;
      e.preventDefault();
      const [s, faixa, dist] = el.dataset.rank.split("|");
      aplicarFiltros({ s, faixa, dist: +dist, uni: "__all", periodo: "geral" });
      if (rotaAtual === "ranking") { renderRanking(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else location.hash = "#/ranking";
    });

    $("#theme").addEventListener("click", () => {
      let cur = document.documentElement.getAttribute("data-theme");
      if (!cur) cur = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      const nx = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nx);
      try { localStorage.setItem("srg-theme", nx); } catch (e) {}
    });

    // escopo: revela passos e regras quando entram na tela
    window.addEventListener("scroll", revelar, { passive: true });
    // virou celular ↔ desktop (girar o aparelho, redimensionar): troca lista ↔ raias
    function trocouTamanho() {
      if (rotaAtual === "ranking" && rankingNoCelular !== CELULAR.matches) renderRanking();
    }
    window.addEventListener("resize", () => { moverIndicador(true); revelar(); trocouTamanho(); });
    CELULAR.addEventListener("change", trocouTamanho);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moverIndicador(true));
    window.addEventListener("hashchange", navegar);
  }

  /* ---------- início ---------- */
  montarFiltros();
  montarFiltrosCelular();
  montarSeletorAtleta();
  ligarRanking();
  ligarProgresso();
  ligarProfessor();
  ligarGlobais();
  navegar();
})();
