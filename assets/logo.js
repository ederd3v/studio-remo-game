/* ============================================================
   LOGO — "STUDIO REMO" branco · "GAME" verde rachado · "REMO INDOOR · SC" verde
   ------------------------------------------------------------
   Toda <svg data-logo> da página vira o logo, desenhado em SVG:
   · data-logo=""      → logo completo (topo do site)
   · data-logo="game"  → só a palavra GAME (telão)
   O GAME segue a arte de referência do Eder: letra pesada e larga, verde vivo
   manchado, com uma rede de rachaduras finas e escuras (tinta seca rachada).
   Sempre igual: a rede usa semente fixa.
   ============================================================ */
(function () {
  "use strict";
  const PILHA = { marca: '"Anton",Impact,sans-serif', sub: '"IBM Plex Mono",ui-monospace,monospace' };
  const LARGO = 1.28;   // o GAME é o Anton alargado — a proporção da referência
  const CEL = 21;       // tamanho médio de cada placa rachada (altura da letra = 100)

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
  function medir(texto, pilha, tam, espaco) {
    cv.font = tam + "px " + pilha;
    const m = cv.measureText(texto), extra = (espaco || 0) * (texto.length - 1);
    return { esq: m.actualBoundingBoxLeft, dir: m.actualBoundingBoxRight + extra, alto: m.actualBoundingBoxAscent, baixo: m.actualBoundingBoxDescent };
  }

  // rede de rachaduras: placas de Voronoi com bordas tortas, algumas abertas,
  // e trincas finas saindo delas. Cada placa ganha um leve tom mais claro ou mais escuro.
  function rachaduras(X, Y, W, H) {
    const r = semente("studio-remo-game"), C = CEL, pts = [];
    for (let y = Y - C; y < Y + H + C; y += C * 0.86) for (let x = X - C; x < X + W + C; x += C) {
      pts.push([x + (r() - 0.5) * C * 0.9, y + (r() - 0.5) * C * 0.9]);
    }
    // corta um polígono pelo semiplano mais perto de "s" do que de "o"
    function recorta(poly, s, o) {
      const mx = (s[0] + o[0]) / 2, my = (s[1] + o[1]) / 2, nx = o[0] - s[0], ny = o[1] - s[1], out = [];
      const f = (q) => (q[0] - mx) * nx + (q[1] - my) * ny;
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length], fa = f(a), fb = f(b);
        if (fa <= 0) out.push(a);
        if ((fa <= 0) !== (fb <= 0)) { const u = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
      }
      return out;
    }
    let placas = "", linhas = "", trincas = "";
    const feitas = new Set();
    pts.forEach((s) => {
      let poly = [[s[0] - C * 2, s[1] - C * 2], [s[0] + C * 2, s[1] - C * 2], [s[0] + C * 2, s[1] + C * 2], [s[0] - C * 2, s[1] + C * 2]];
      pts.forEach((o) => {
        if (o === s || Math.abs(o[0] - s[0]) > C * 2.5 || Math.abs(o[1] - s[1]) > C * 2.5) return;
        poly = recorta(poly, s, o);
      });
      if (poly.length < 3) return;
      const t = r();
      placas += '<polygon points="' + poly.map((q) => n1(q[0]) + "," + n1(q[1])).join(" ") + '" fill="' + (t < 0.5 ? "#000" : "#B6F25A") +
        '" opacity="' + (t < 0.5 ? r() * 0.28 : r() * 0.14).toFixed(2) + '"/>';
      // cada borda é desenhada uma vez só (a placa vizinha tem a mesma borda)
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length];
        const ka = a[0].toFixed(0) + "_" + a[1].toFixed(0), kb = b[0].toFixed(0) + "_" + b[1].toFixed(0), chave = ka < kb ? ka + "|" + kb : kb + "|" + ka;
        if (feitas.has(chave)) continue;
        feitas.add(chave);
        const rr = semente(chave);
        if (rr() < 0.28) continue; // rachadura que não fechou
        const n = 2 + Math.floor(rr() * 3), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
        let d = "M" + n1(a[0]) + " " + n1(a[1]);
        for (let i = 1; i < n; i++) { const u = i / n, j = (rr() - 0.5) * len * 0.35; d += "L" + n1(a[0] + dx * u + px * j) + " " + n1(a[1] + dy * u + py * j); }
        linhas += '<path d="' + d + "L" + n1(b[0]) + " " + n1(b[1]) + '" stroke-width="' + (1.15 * (0.55 + rr() * 0.9)).toFixed(2) + '"/>';
        if (rr() < 0.3) {
          let x = a[0] + dx * 0.5, y = a[1] + dy * 0.5, ang = Math.atan2(py, px) + (rr() - 0.5);
          trincas += "M" + n1(x) + " " + n1(y);
          for (let q = 0; q < 3; q++) { ang += (rr() - 0.5) * 0.8; x += Math.cos(ang) * C * 0.22; y += Math.sin(ang) * C * 0.22; trincas += "L" + n1(x) + " " + n1(y); }
        }
      }
    });
    return "<g>" + placas + '</g><g fill="none" stroke="#0C2206" stroke-linejoin="round" stroke-linecap="round" opacity=".92">' + linhas +
      '</g><path d="' + trincas + '" fill="none" stroke="#0C2206" stroke-width=".6" opacity=".8"/>';
  }

  let seq = 0;
  function desenhar(svg) {
    const soGame = svg.getAttribute("data-logo") === "game", id = "lg" + ++seq + "-";

    // tudo medido com a altura das maiúsculas = 100
    const CAP = 100, sr = medir("STUDIO REMO", PILHA.marca, 100), tamS = (100 * CAP) / sr.alto;
    const g0 = medir("GAME", PILHA.marca, 100), tamG = (100 * CAP) / g0.alto, k = tamG / 100;
    const larS = soGame ? 0 : ((sr.esq + sr.dir) * tamS) / 100, vao = soGame ? 0 : CAP * 0.26;
    const gx = larS + vao, gw = (g0.esq + g0.dir) * k * LARGO;   // caixa da tinta do GAME
    const sub = { tam: CAP * 0.31, esp: CAP * 0.31 * 0.2 }, subY = CAP + CAP * 0.52;
    const ms = soGame ? null : medir("REMO INDOOR · SC", PILHA.sub, sub.tam, sub.esp);
    const PAD = 4, W = Math.max(gx + gw, ms ? ms.esq + ms.dir : 0), H = soGame ? CAP : subY + ms.baixo;
    const A = { x: gx - 4, y: -4, w: gw + 8, h: CAP + 8 }, caixa = 'x="' + n1(A.x) + '" y="' + n1(A.y) + '" width="' + n1(A.w) + '" height="' + n1(A.h) + '"';

    const txtGame = '<text x="' + n1(gx / LARGO + g0.esq * k) + '" y="' + CAP + '" transform="scale(' + LARGO + ' 1)" font-family=\'' + PILHA.marca + '\' font-size="' + n1(tamG) + '">GAME</text>';
    svg.setAttribute("viewBox", [-PAD, -PAD, W + PAD * 2, H + PAD * 2].map(n1).join(" "));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", soGame ? "Game" : "Studio Remo Game — Remo indoor · SC");
    svg.innerHTML =
      "<defs>" +
        '<clipPath id="' + id + 'letras">' + txtGame + "</clipPath>" +
        // o verde manchado do fundo da letra
        '<filter id="' + id + 'verde" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
          '<feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="5"/>' +
          '<feColorMatrix type="matrix" values="3 0 0 0 -1  3 0 0 0 -1  3 0 0 0 -1  0 0 0 0 1"/>' +
          '<feComponentTransfer><feFuncR type="table" tableValues=".22 .34 .42 .49 .58"/>' +
          '<feFuncG type="table" tableValues=".46 .62 .71 .79 .86"/><feFuncB type="table" tableValues=".07 .11 .13 .16 .2"/></feComponentTransfer></filter>' +
        // veios miúdos entre as rachaduras
        '<filter id="' + id + 'veio" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
          '<feTurbulence type="turbulence" baseFrequency=".1" numOctaves="1" seed="23"/>' +
          '<feColorMatrix type="matrix" values="0 0 0 0 .08  0 0 0 0 .2  0 0 0 0 .05  -22 0 0 0 1.3"/></filter>' +
        // bordas levemente gastas
        '<filter id="' + id + 'borda" x="-3%" y="-6%" width="106%" height="112%">' +
          '<feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="3" result="r"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="r" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>' +
        '<filter id="' + id + 'sombra"><feGaussianBlur stdDeviation="2.5"/></filter>' +
      "</defs>" +
      (soGame ? "" :
        '<text x="' + n1((sr.esq * tamS) / 100) + '" y="' + CAP + '" style="fill:var(--ink,#fff)" font-family=\'' + PILHA.marca + '\' font-size="' + n1(tamS) + '">STUDIO REMO</text>' +
        '<text x="0" y="' + n1(subY) + '" style="fill:var(--accent,#00FC27)" font-family=\'' + PILHA.sub + '\' font-weight="500" font-size="' + n1(sub.tam) + '" letter-spacing="' + n1(sub.esp) + '">REMO INDOOR · SC</text>') +
      '<g class="logo__game" filter="url(#' + id + 'borda)"><g clip-path="url(#' + id + 'letras)">' +
        "<rect " + caixa + ' filter="url(#' + id + 'verde)"/>' +
        rachaduras(A.x, A.y, A.w, A.h) +
        "<rect " + caixa + ' filter="url(#' + id + 'veio)" opacity=".35"/>' +
        // sombra por dentro da borda da letra
        '<g filter="url(#' + id + 'sombra)" opacity=".35">' + txtGame.replace("<text ", '<text fill="none" stroke="#0E2A06" stroke-width="7" ') + "</g>" +
      "</g></g>";
  }

  function desenharTodos(raiz) {
    (raiz || document).querySelectorAll("svg[data-logo]").forEach(desenhar);
  }
  window.SRGLogo = { desenhar, desenharTodos };

  // só desenha com as fontes carregadas (a medida depende delas)
  const fontes = document.fonts ? [document.fonts.load("100px " + PILHA.marca, "STUDIO REMO GAME"), document.fonts.load("500 100px " + PILHA.sub, "REMO INDOOR · SC")] : [];
  Promise.all(fontes).catch(() => {}).then(() => desenharTodos());
})();
