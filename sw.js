/* Service worker do Studio Remo Game — o que faz o site virar app no celular.
   Sempre tenta a rede primeiro (o site novo chega na hora, sem ficar preso em versão velha);
   sem internet, abre o que já foi visto. Subir VERSAO quando mudar a lista de arquivos. */
const VERSAO = "srg-v1";
const ARQUIVOS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/styles.css", "assets/app.js", "assets/logo.js",
  "assets/icones/icone-192.png", "assets/icones/icone-512.png", "assets/icones/apple-touch-icon.png", "assets/icones/icone.svg",
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
  // as letras do Google: guardadas na primeira vez e usadas direto depois (não mudam)
  if (url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com") {
    e.respondWith(caches.open(VERSAO).then((c) => c.match(req).then((r) => r || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
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
