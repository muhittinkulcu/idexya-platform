// Panel sayfa geçişi ölçümü (yan menü tıklamasıyla): tıklamadan "içerik görünür ve sayfa verisi dolu" anına kadar süre,
// geçiş sırasında beyaz ya da kabuksuz kare olup olmadığı ve aktarılan bayt. Yerel sunucu (sahte veriyle):
//   npx wrangler dev --local --port 8791 --var YEREL_GIRIS:evet --var PANEL_TEMEL_YOL:/website --var PANEL_OS_ALAN:os.localhost \
//     --var KAPI_ANAHTARI_WEBSITE:yerel-deneme --persist-to <klasör>
//   PW_KANAL=chrome PW_KOK=<playwright klasörü> node tools/olc-gecis.mjs http://panel.localhost:8791 <çıktı klasörü> [tur] [ag]
//   (os alanı: http://os.localhost:8791/website. Araç önüne yönlendiriciyi taklit eden yerel bir vekil kurar: her isteğe, tarayıcının
//   kendi başlattığı önceden yükleme istekleri dahil, kapı başlığını (KAPI, varsayılan yerel-deneme) ekler; canlıda bunu
//   idexya-os Worker'ı yapar. Playwright'ın ek başlığı önceden yükleme isteklerine eklenmediği için vekil gerekir.)
// ag: "yerel" (kısıtsız) ya da "gecikmeli" (her istekte 60 ms gecikme, 12 Mbit/sn; Chrome DevTools ağ öykünmesi).
// Çıktı: <çıktı klasörü>/olcum-<etiket>.json ve konsola tablo. Sunucu tarafı (Access JWT doğrulaması, yönlendirici Worker,
// gerçek D1 gecikmesi) bu ölçüme girmez.
import { createRequire } from 'module';
import fs from 'fs';
import zlib from 'zlib';
import http from 'http';
const { chromium } = createRequire(process.env.PW_KOK ? `${process.env.PW_KOK}/` : import.meta.url)('playwright');
const HEDEF = (process.argv[2] || 'http://panel.localhost:8791').replace(/\/$/, '');
const CIKTI = process.argv[3] || '.';
const TUR = Number(process.argv[4] || 3);
const AG = process.argv[5] || 'yerel';
const ONEK = new URL(HEDEF).pathname.replace(/\/$/, '');
// os alanı: yönlendirici vekili (aynı ana makine adı, başka kapı; Host başlığı aynen iletilir)
let KOK = HEDEF, vekil = null;
if (ONEK) {
  const h = new URL(HEDEF);
  vekil = http.createServer((ist, yan) => {
    const ic = http.request({ host: '127.0.0.1', port: h.port, path: ist.url, method: ist.method, headers: { ...ist.headers, 'x-idexya-kapi': process.env.KAPI || 'yerel-deneme' } }, (y) => { yan.writeHead(y.statusCode, y.headers); y.pipe(yan); });
    ic.on('error', () => { yan.writeHead(502); yan.end(); });
    ist.pipe(ic);
  });
  await new Promise((t) => vekil.listen(0, '127.0.0.1', t));
  KOK = `${h.protocol}//${h.hostname}:${vekil.address().port}${ONEK}`;
}
const SIRA = ['/leads', '/crm', '/proposals', '/dashboard'];
const ETIKET = `${new URL(HEDEF).hostname.split('.')[0]}-${AG}`;
fs.mkdirSync(CIKTI, { recursive: true });

// Sayfa hazır: kabuk kurulu ve sayfanın verisi çizilmiş (boş/yükleniyor değil).
const HAZIR = {
  '/dashboard': "document.querySelectorAll('[data-huni] li.hn-satir').length > 0 && document.querySelectorAll('[data-kpi] .kpi, [data-kpi] a').length > 0",
  '/leads': "!!document.querySelector('[data-liste] button')",
  '/crm': "(() => { const a = document.querySelector('[data-alan]'); return !!a && a.children.length > 0 && /Örnek|Deneme|Sahte|Test/.test(a.textContent); })()",
  '/proposals': "!!document.querySelector('[data-liste] tr td')"
};
// Her belgede ilk betikten önce (CSP eval'e izin vermez; koşullar betiğin içine işlev olarak yazılır): tıklama anı (önceki sayfada), hazır anı, görünüm geçişinin bitişi, ilk boyama.
const BASLANGIC = `(() => {
  const ONEK = ${JSON.stringify(ONEK)};
  const HAZIR = { ${Object.entries(HAZIR).map(([k, v]) => `${JSON.stringify(k)}: () => ${v}`).join(', ')} };
  addEventListener('click', (e) => { try { sessionStorage.setItem('__olc_t0', String(performance.timeOrigin + e.timeStamp)); } catch (x) {} }, true);
  const yol = location.pathname.slice(ONEK.length).replace(/\\/$/, '');
  const kosul = HAZIR[yol];
  window.__olc = { yol, vt: null, vtBitis: null, hazir: null, ilkBoyamaKabuk: null };
  addEventListener('pagereveal', (e) => {
    const vt = e.viewTransition; window.__olc.vt = !!vt; window.__olc.ilkBoyamaKabuk = !!document.querySelector('idexya-kabuk.ik .ik-ust');
    if (vt) vt.finished.then(() => { window.__olc.vtBitis = performance.timeOrigin + performance.now(); }, () => { window.__olc.vtBitis = performance.timeOrigin + performance.now(); });
  });
  if (!kosul) return;
  const bak = () => { let ok = false; try { ok = !!document.querySelector('idexya-kabuk.ik .ik-ust') && kosul(); } catch (x) {}
    if (ok) window.__olc.hazir = performance.timeOrigin + performance.now(); else requestAnimationFrame(bak); };
  requestAnimationFrame(bak);
})();`;

// En küçük PNG çözücü (8 bit RGB/RGBA, taramasız): yalnız ekran karelerini örneklemek için.
function pngCoz(buf) {
  let p = 8, en = 0, boy = 0, tur = 0; const idat = [];
  while (p < buf.length) {
    const n = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), v = buf.subarray(p + 8, p + 8 + n);
    if (t === 'IHDR') { en = v.readUInt32BE(0); boy = v.readUInt32BE(4); tur = v[9]; }
    if (t === 'IDAT') idat.push(v);
    p += 12 + n;
  }
  const bpp = tur === 6 ? 4 : 3, satir = en * bpp, ham = zlib.inflateSync(Buffer.concat(idat)), c = Buffer.alloc(boy * satir);
  for (let y = 0; y < boy; y++) {
    const f = ham[y * (satir + 1)], s = ham.subarray(y * (satir + 1) + 1, (y + 1) * (satir + 1));
    for (let x = 0; x < satir; x++) {
      const a = x >= bpp ? c[y * satir + x - bpp] : 0, b = y ? c[(y - 1) * satir + x] : 0, cc = x >= bpp && y ? c[(y - 1) * satir + x - bpp] : 0;
      let d = s[x];
      if (f === 1) d += a; else if (f === 2) d += b; else if (f === 3) d += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - cc, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - cc); d += pa <= pb && pa <= pc ? a : pb <= pc ? b : cc; }
      c[y * satir + x] = d & 255;
    }
  }
  return { en, boy, bpp, c };
}
// Kare sınıfı: üst paket çubuğu (koyu) var mı, kare neredeyse tümüyle beyaz mı.
function kareSinif(png) {
  const { en, boy, bpp, c } = pngCoz(png);
  const parlak = (x0, y0, x1, y1) => { let t = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * en + x) * bpp; t += 0.2126 * c[i] + 0.7152 * c[i + 1] + 0.0722 * c[i + 2]; n++; } return t / n; };
  const ust = parlak(0, Math.round(boy * 0.012), en, Math.round(boy * 0.04));
  const tum = parlak(0, 0, en, boy);
  return ust < 90 ? 'kabuklu' : tum > 238 ? 'beyaz' : 'kabuksuz';
}

const tarayici = await chromium.launch({ channel: process.env.PW_KANAL || undefined, headless: true });
const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 900 } });
await baglam.addInitScript(BASLANGIC);
const sayfa = await baglam.newPage();
const hatalar = [];
sayfa.on('pageerror', (e) => hatalar.push('JS: ' + e.message));
sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push('konsol: ' + m.text()); });
const cdp = await baglam.newCDPSession(sayfa);
await cdp.send('Network.enable');
if (AG === 'gecikmeli') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 1.5e6, uploadThroughput: 0.75e6 });
let ag = null; const istekTur = new Map();
cdp.on('Network.requestWillBeSent', (e) => { istekTur.set(e.requestId, { url: e.request.url, tur: e.type, on: /prefetch/i.test(e.request.headers['Sec-Purpose'] || e.request.headers['sec-purpose'] || '') }); });
cdp.on('Network.loadingFinished', (e) => { if (!ag) return; const r = istekTur.get(e.requestId) || {}; ag.istek++; ag.bayt += e.encodedDataLength; if (r.on || r.tur === 'Prefetch') { ag.onIstek++; ag.onBayt += e.encodedDataLength; } ag.liste.push([(r.url || '').replace(/^https?:\/\/[^/]+/, ''), r.tur, e.encodedDataLength]); });
let kareler = [];
cdp.on('Page.screencastFrame', (e) => { kareler.push({ t: e.metadata.timestamp * 1000, v: Buffer.from(e.data, 'base64') }); cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {}); });

const bekleHazir = async () => {
  await sayfa.waitForFunction(() => window.__olc && window.__olc.hazir && (window.__olc.vt === false || window.__olc.vt === null || window.__olc.vtBitis), null, { timeout: 20000, polling: 50 });
  return await sayfa.evaluate(() => ({ ...window.__olc, t0: Number(sessionStorage.getItem('__olc_t0')) || null, nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { tur: n.deliveryType || '', ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd) } : null; })(), fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0) }));
};

await sayfa.goto(KOK + '/dashboard');
await bekleHazir();
const sonuc = [];
for (let tur = 1; tur <= TUR; tur++) {
  for (const hedef of SIRA) {
    const onceki = await sayfa.evaluate(() => location.pathname);
    const baglanti = sayfa.locator(`.ik-yan a[href="${ONEK}${hedef}"]`).first();
    await baglanti.scrollIntoViewIfNeeded();
    const kutu = await baglanti.boundingBox();
    ag = { istek: 0, bayt: 0, onIstek: 0, onBayt: 0, liste: [] };
    kareler = [];
    await cdp.send('Page.startScreencast', { format: 'png', maxWidth: 360, maxHeight: 225, everyNthFrame: 1 });
    await sayfa.mouse.move(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2, { steps: 4 });
    await sayfa.waitForTimeout(300); // insan gibi: imleç bağlantının üzerinde kısa süre durur
    await sayfa.mouse.down(); await sayfa.mouse.up();
    await sayfa.waitForURL((u) => u.pathname.replace(/\/$/, '') === ONEK + hedef, { timeout: 20000 });
    const o = await bekleHazir();
    await sayfa.waitForTimeout(250);
    await cdp.send('Page.stopScreencast');
    const bitis = Math.max(o.hazir, o.vtBitis || 0);
    const pencere = kareler.filter((k) => k.t >= o.t0 - 5 && k.t <= bitis + 100);
    const siniflar = pencere.map((k) => kareSinif(k.v));
    // Kareler: ilk turda ve kabuksuz/beyaz kare görülen her geçişte diske yazılır (göz denetimi için).
    if (tur === 1 || siniflar.some((x) => x !== 'kabuklu')) pencere.forEach((k, i) => fs.writeFileSync(`${CIKTI}/${ETIKET}-t${tur}-${hedef.slice(1)}-${String(i).padStart(2, '0')}-${siniflar[i]}.png`, k.v));
    // Önceden yüklenmiş belge DevTools'ta iki kez görünür (Prefetch + Document); aktarılan bayta bir kez sayılır.
    if (o.nav && o.nav.tur === 'navigational-prefetch') ag.liste.filter((x) => x[1] === 'Document').forEach((x) => { ag.bayt -= x[2]; ag.istek--; x[2] = 0; });
    const kayit = { tur, adim: `${onceki.slice(ONEK.length)} → ${hedef}`, ilkBoyamaKabuk: o.ilkBoyamaKabuk, sure: Math.round(o.hazir - o.t0), gorselSure: Math.round(bitis - o.t0), vt: !!o.vt,
      teslim: o.nav && o.nav.tur, ttfb: o.nav && o.nav.ttfb, fcp: o.fcp, kare: pencere.length, beyaz: siniflar.filter((s) => s === 'beyaz').length, kabuksuz: siniflar.filter((s) => s === 'kabuksuz').length,
      istek: ag.istek, kB: Math.round(ag.bayt / 102.4) / 10, onIstek: ag.onIstek, onkB: Math.round(ag.onBayt / 102.4) / 10, istekler: ag.liste };
    ag = null;
    sonuc.push(kayit);
    console.log(`${ETIKET} tur ${tur} ${kayit.adim.padEnd(24)} ${String(kayit.sure).padStart(5)} ms (görsel ${kayit.gorselSure}) ilkBoyamadaKabuk=${kayit.ilkBoyamaKabuk} teslim=${kayit.teslim || 'ağ'} ttfb=${kayit.ttfb} fcp=${kayit.fcp} kare=${kayit.kare} beyaz=${kayit.beyaz} kabuksuz=${kayit.kabuksuz} istek=${kayit.istek} ${kayit.kB} kB (önyükleme ${kayit.onIstek}/${kayit.onkB} kB)`);
  }
}
const ortanca = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const ozet = SIRA.map((h) => { const r = sonuc.filter((x) => x.adim.endsWith('→ ' + h)); return { hedef: h, ilkTur: r[0] && r[0].sure, ortanca: ortanca(r.map((x) => x.sure)), gorselOrtanca: ortanca(r.map((x) => x.gorselSure)), beyaz: r.reduce((s, x) => s + x.beyaz, 0), kabuksuz: r.reduce((s, x) => s + x.kabuksuz, 0), kBOrtanca: ortanca(r.map((x) => x.kB)) }; });
console.table(ozet);
if (hatalar.length) console.log('Konsol/JS hataları:\n' + [...new Set(hatalar)].join('\n'));
fs.writeFileSync(`${CIKTI}/olcum-${ETIKET}.json`, JSON.stringify({ kok: HEDEF, ag: AG, tur: TUR, ozet, sonuc, hatalar: [...new Set(hatalar)] }, null, 1));
await tarayici.close();
if (vekil) vekil.close();
