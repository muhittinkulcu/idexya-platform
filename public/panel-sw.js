// Panel (panel.idexya.com) service worker — yalnız kabuk varlıkları (Muhittin, 30 Eki 2026).
// Önbelleğe giren: derlenmiş JS/CSS (/_astro/), yazı tipleri (/fonts/), panel simgeleri. Bunlar müşteri verisi içermez.
// Önbelleğe GİRMEYEN: sayfalar (gezinme istekleri), /api/* ve diğer her şey; bunlar her zaman ağdan gelir, böylece
// Cloudflare Access oturumu yoksa giriş ekranı çıkar ve veri görünmez. Yönlendirilen ya da başarısız yanıt saklanmaz.
const SURUM = 'panel-kabuk-v1';
const VARLIK = /^\/(_astro\/|fonts\/|favicon-panel|panel-ikon-)/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (olay) => {
  olay.waitUntil((async () => {
    for (const ad of await caches.keys()) if (ad.startsWith('panel-kabuk-') && ad !== SURUM) await caches.delete(ad);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  if (istek.method !== 'GET' || istek.mode === 'navigate') return;
  const adres = new URL(istek.url);
  if (adres.origin !== self.location.origin || adres.pathname.startsWith('/api/') || !VARLIK.test(adres.pathname)) return;
  olay.respondWith((async () => {
    const onbellek = await caches.open(SURUM);
    const eldeki = await onbellek.match(istek);
    if (eldeki) return eldeki;
    const yanit = await fetch(istek);
    if (yanit.ok && yanit.type === 'basic' && !yanit.redirected) await onbellek.put(istek, yanit.clone());
    return yanit;
  })());
});
