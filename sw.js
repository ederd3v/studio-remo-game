/* Service worker do Studio Remo Game — o que faz o site virar app no celular.
   Sempre tenta a rede primeiro (o site novo chega na hora, sem ficar preso em versão velha);
   sem internet, abre o que já foi visto. Subir VERSAO quando mudar a lista de arquivos. */
const VERSAO = "srg-v2";
const ARQUIVOS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/styles.css", "assets/app.js", "assets/logo.js",
  "assets/icones/icone-192.png", "assets/icones/icone-512.png", "assets/icones/apple-touch-icon.png", "assets/icones/icone.svg",
  "assets/fontes/anton-400.woff2", "assets/fontes/bebas-neue-400.woff2", "assets/fontes/kaushan-script-400.woff2", "assets/fontes/ibm-plex-sans.woff2",
  "assets/fontes/ibm-plex-mono-400.woff2", "assets/fontes/ibm-plex-mono-500.woff2", "assets/fontes/ibm-plex-mono-600.woff2", "assets/fontes/ibm-plex-mono-700.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // as letras não mudam: guardadas, abrem direto do celular
  if (url.pathname.includes("/assets/fontes/")) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const c = res.clone(); caches.open(VERSAO).then((k) => k.put(req, c)); return res; })));
    return;
  }
  if (url.origin !== location.origin || url.pathname.includes("/dev/")) return;
  // rede primeiro; guarda a cópia; sem rede, usa a guardada (o "?v=N" dos arquivos é ignorado na busca)
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })
    .then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
