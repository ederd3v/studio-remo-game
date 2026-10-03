/* ============================================================
   LOGO — "STUDIO REMO" branco · "GAME" camuflado · "REMO INDOOR · SC" verde
   ------------------------------------------------------------
   Toda <svg data-logo> da página vira o logo, desenhado em SVG:
   · data-logo=""      → logo completo (topo do site)
   · data-logo="game"  → só a palavra GAME (telão)
   O GAME é um mosaico de manchas de camuflagem em vários verdes, com bordas
   gastas, falhas de impressão e riscos — sempre igual (semente fixa).
   Variações da camuflagem: ?camo=a|b|c na URL, ou data-camo="b" no elemento.
   ============================================================ */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const F_MARCA = "Anton", F_GAME = "Black Ops One", F_SUB = "IBM Plex Mono";
  const PILHA = { [F_MARCA]: '"Anton",Impact,sans-serif', [F_GAME]: '"Black Ops One","Anton",Impact,sans-serif', [F_SUB]: '"IBM Plex Mono",ui-monospace,monospace' };

  // camadas de manchas, de baixo para cima: [cor, raio, densidade (manchas por 100×100)]
  const CAMO = {
    // A — padrão: manchas grandes, verde-oliva com toques de neon
    a: { base: "#2D4716", desgaste: 0.5, manchas: [["#4E7F25", 22, 2.2], ["#172A0B", 15, 2.4], ["#7BCB36", 12, 2.6], ["#2BF04A", 6, 1.6]] },
    // B — manchas miúdas, mais verde-claro e neon
    b: { base: "#335619", desgaste: 0.45, manchas: [["#56902A", 14, 4], ["#1A2E0C", 10, 4.5], ["#86DA3C", 8, 4.5], ["#2BF04A", 5, 3]] },
    // C — mais escura e mais gasta
    c: { base: "#243B11", desgaste: 0.85, manchas: [["#3F6A1E", 24, 2], ["#101D07", 17, 2.4], ["#6AB72F", 12, 2.2], ["#2BF04A", 6, 1.1]] },
  };

  function semente(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
  const n1 = (v) => v.toFixed(1);

  // medidas da tinta (não da caixa da fonte): a altura de verdade das maiúsculas
  const cv = document.createElement("canvas").getContext("2d");
  function medir(texto, fonte, tam, espaco) {
    cv.font = tam + "px " + PILHA[fonte];
    const m = cv.measureText(texto), extra = (espaco || 0) * (texto.length - 1);
    return { esq: m.actualBoundingBoxLeft, dir: m.actualBoundingBoxRight + extra, alto: m.actualBoundingBoxAscent, baixo: m.actualBoundingBoxDescent };
  }

  // mancha de camuflagem: contorno fechado e irregular, alongado na horizontal
  function mancha(r, cx, cy, raio) {
    const n = 7 + Math.floor(r() * 4), alonga = 1.3 + r() * 0.7, giro = (r() - 0.5) * 0.7, pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + (r() - 0.5) * 0.5, rr = raio * (0.55 + r() * 0.6);
      const x = Math.cos(a) * rr * alonga, y = Math.sin(a) * rr;
      pts.push([cx + x * Math.cos(giro) - y * Math.sin(giro), cy + x * Math.sin(giro) + y * Math.cos(giro)]);
    }
    // curva suave passando pelos pontos (Catmull-Rom → Bézier)
    let d = "M" + n1(pts[0][0]) + " " + n1(pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + n1(p1[0] + (p2[0] - p0[0]) / 6) + " " + n1(p1[1] + (p2[1] - p0[1]) / 6) + " " +
        n1(p2[0] - (p3[0] - p1[0]) / 6) + " " + n1(p2[1] - (p3[1] - p1[1]) / 6) + " " + n1(p2[0]) + " " + n1(p2[1]);
    }
    return d + "Z";
  }

  // riscos finos e levemente curvos, como arranhões na tinta
  function riscos(r, x0, y0, w, h, qtd, comp) {
    let d = "";
    for (let i = 0; i < qtd; i++) {
      let x = x0 + r() * w, y = y0 + r() * h, ang = (r() - 0.5) * 1.2 + (r() < 0.3 ? Math.PI / 2 : 0);
      d += "M" + n1(x) + " " + n1(y);
      const passos = 2 + Math.floor(r() * 3);
      for (let k = 0; k < passos; k++) {
        ang += (r() - 0.5) * 0.5; const p = comp * (0.4 + r() * 0.8) / passos;
        x += Math.cos(ang) * p; y += Math.sin(ang) * p; d += "L" + n1(x) + " " + n1(y);
      }
    }
    return d;
  }

  let seq = 0;
  function desenhar(svg) {
    const soGame = svg.getAttribute("data-logo") === "game";
    const vq = (svg.getAttribute("data-camo") || new URLSearchParams(location.search).get("camo") || "a").toLowerCase();
    const V = CAMO[vq] || CAMO.a, id = "lg" + ++seq + "-", r = semente("studio-remo-game-" + vq);

    // tudo medido com a altura das maiúsculas = 100
    const CAP = 100, sr = medir("STUDIO REMO", F_MARCA, 100), tamS = (100 * CAP) / sr.alto;
    const g0 = medir("GAME", F_GAME, 100), tamG = (100 * CAP) / g0.alto, k = tamG / 100;
    const larS = soGame ? 0 : ((sr.esq + sr.dir) * tamS) / 100, vao = soGame ? 0 : CAP * 0.3;
    const gx = larS + vao, gw = (g0.esq + g0.dir) * k;           // caixa da tinta do GAME
    const sub = { tam: CAP * 0.31, esp: CAP * 0.31 * 0.2 }, subY = CAP + CAP * 0.52;
    const ms = soGame ? null : medir("REMO INDOOR · SC", F_SUB, sub.tam, sub.esp);
    const PAD = 4, W = Math.max(gx + gw, ms ? ms.esq + ms.dir : 0), H = soGame ? CAP : subY + ms.baixo;
    const area = { x: gx - 2, y: -2, w: gw + 4, h: CAP + 4 };

    // manchas, camada por camada
    let camadas = "";
    V.manchas.forEach(([cor, raio, dens]) => {
      const qtd = Math.max(3, Math.round((dens * area.w * area.h) / 10000));
      let d = "";
      for (let i = 0; i < qtd; i++) d += mancha(r, area.x + r() * area.w, area.y + r() * area.h, raio * (0.7 + r() * 0.6));
      camadas += '<path d="' + d + '" fill="' + cor + '"/>';
    });
    const riscoEscuro = riscos(r, area.x, area.y, area.w, area.h, Math.round(gw / 14), 26);
    const riscoClaro = riscos(r, area.x, area.y, area.w, area.h, Math.round(gw / 22), 20);
    const falhas = riscos(r, area.x, area.y, area.w, area.h, Math.round(gw / 16 * V.desgaste), 30);
    const limiar = 0.75 - V.desgaste * 0.08;

    const txtGame = '<text x="' + n1(gx + g0.esq * k) + '" y="' + CAP + '" font-family=\'' + PILHA[F_GAME] + '\' font-size="' + n1(tamG) + '">GAME</text>';
    svg.setAttribute("viewBox", [-PAD, -PAD, W + PAD * 2, H + PAD * 2].map(n1).join(" "));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", soGame ? "Game" : "Studio Remo Game — Remo indoor · SC");
    svg.innerHTML =
      "<defs>" +
        '<clipPath id="' + id + 'letras">' + txtGame + "</clipPath>" +
        // bordas gastas
        '<filter id="' + id + 'borda" x="-5%" y="-10%" width="110%" height="120%">' +
          '<feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="7" result="r"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="r" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>' +
        // falhas de impressão (pontinhos que somem)
        '<filter id="' + id + 'pontos" filterUnits="userSpaceOnUse" x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '">' +
          '<feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="' + (vq.charCodeAt(0) % 9) + '"/>' +
          '<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  12 0 0 0 ' + n1(-12 * limiar) + '"/>' +
          '<feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer></filter>' +
        // granulado claro por cima das manchas
        '<filter id="' + id + 'grao" filterUnits="userSpaceOnUse" x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '">' +
          '<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/>' +
          '<feColorMatrix type="matrix" values="0 0 0 0 .85  0 0 0 0 1  0 0 0 0 .7  1.6 0 0 0 -.95"/></filter>' +
        '<mask id="' + id + 'gasto" maskUnits="userSpaceOnUse" x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '">' +
          '<rect x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '" fill="#fff"/>' +
          '<rect x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '" filter="url(#' + id + 'pontos)"/>' +
          '<path d="' + falhas + '" stroke="#000" stroke-width="1.6" fill="none" stroke-linecap="round"/></mask>' +
      "</defs>" +
      (soGame ? "" :
        '<text x="' + n1((sr.esq * tamS) / 100) + '" y="' + CAP + '" style="fill:var(--ink,#fff)" font-family=\'' + PILHA[F_MARCA] + '\' font-size="' + n1(tamS) + '">STUDIO REMO</text>' +
        '<text x="0" y="' + n1(subY) + '" style="fill:var(--accent,#00FC27)" font-family=\'' + PILHA[F_SUB] + '\' font-weight="500" font-size="' + n1(sub.tam) + '" letter-spacing="' + n1(sub.esp) + '">REMO INDOOR · SC</text>') +
      '<g class="logo__game" filter="url(#' + id + 'borda)"><g mask="url(#' + id + 'gasto)"><g clip-path="url(#' + id + 'letras)">' +
        '<rect x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '" fill="' + V.base + '"/>' +
        camadas +
        '<rect x="' + n1(area.x) + '" y="' + n1(area.y) + '" width="' + n1(area.w) + '" height="' + n1(area.h) + '" filter="url(#' + id + 'grao)" opacity=".16"/>' +
        '<path d="' + riscoEscuro + '" stroke="#081205" stroke-width="1.3" stroke-opacity=".7" fill="none" stroke-linecap="round"/>' +
        '<path d="' + riscoClaro + '" stroke="#CFFFA0" stroke-width=".9" stroke-opacity=".35" fill="none" stroke-linecap="round"/>' +
        // filete claro por dentro da letra: o desenho do GAME continua legível mesmo onde a mancha é escura
        txtGame.replace("<text ", '<text fill="none" stroke="#7FE04A" stroke-width="4" stroke-opacity=".6" ') +
      "</g></g></g>";
  }

  function desenharTodos(raiz) {
    (raiz || document).querySelectorAll("svg[data-logo]").forEach(desenhar);
  }
  window.SRGLogo = { desenhar, desenharTodos, variantes: Object.keys(CAMO) };

  // só desenha com as fontes carregadas (a medida depende delas)
  const fontes = [F_MARCA, F_GAME, F_SUB].map((f) => document.fonts ? document.fonts.load((f === F_SUB ? "500 " : "") + "100px " + PILHA[f], f === F_SUB ? "REMO INDOOR · SC" : "STUDIO REMO GAME") : null);
  Promise.all(fontes).catch(() => {}).then(() => desenharTodos());
})();
