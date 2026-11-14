// Temel yol uçtan uca: panel os alanında /website önekiyle, panel alanında öneksiz (bugünkü gibi). Yerel sunucu:
//   npx wrangler dev --local --port 8791 --var YEREL_GIRIS:evet --var PANEL_TEMEL_YOL:/website --var PANEL_OS_ALAN:os.localhost \
//     --var KAPI_ANAHTARI_WEBSITE:yerel-deneme --persist-to <boş klasör>
//   KAPI=yerel-deneme PW_KANAL=chrome PW_KOK=<playwright klasörü> node tools/test-temel-yol-sunucu.mjs 8791 <ekran klasörü>
// Tarayıcı *.localhost adlarını yerel makineye çözer: os.localhost = os alanı, panel.localhost = bugünkü panel.
import { createRequire } from 'module';
import http from 'http';
const { chromium } = createRequire(process.env.PW_KOK ? `${process.env.PW_KOK}/` : import.meta.url)('playwright');
const PORT = process.argv[2] || '8791';
const SS = process.argv[3] || '.';
const KAPI = process.env.KAPI || 'yerel-deneme';
const OS = `http://os.localhost:${PORT}`, PANEL = `http://panel.localhost:${PORT}`;
let kalan = 0, gecen = 0;
const kontrol = (ad, kosul) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad); if (kosul) gecen++; else kalan++; };

// Host başlığıyla doğrudan istek (fetch Host başlığını değiştirmeye izin vermez).
// os alanına giden isteğe yönlendiricinin kapı anahtarı eklenir (kapi: false ise eklenmez).
const iste = (host, yol, { method = 'GET', headers = {}, body, kapi = true } = {}) => new Promise((tamam, red) => {
  const ek = kapi && host.startsWith('os.') ? { 'x-idexya-kapi': typeof kapi === 'string' ? kapi : KAPI } : {};
  const r = http.request({ host: '127.0.0.1', port: PORT, path: yol, method, headers: { host: `${host}:${PORT}`, ...ek, ...headers } }, (y) => {
    let g = ''; y.on('data', (p) => { g += p; }); y.on('end', () => tamam({ durum: y.statusCode, konum: y.headers.location || '', govde: g, basliklar: y.headers }));
  });
  r.on('error', red); if (body) r.write(body); r.end();
});

// 1. Yönlendirme (sunucu)
for (const [yol, durum, konum] of [['/website', 302, `${OS}/website/dashboard`], ['/website/', 302, `${OS}/website/dashboard`], ['/website/leads/', 301, `${OS}/website/leads`],
  ['/website/yonetim/talepler/', 301, `${OS}/website/leads`], ['/website/leads?sekme=yeni', 301, `${OS}/website/leads?tab=new`]]) {
  const y = await iste('os.localhost', yol);
  kontrol(`os ${yol} → ${durum} ${konum}`, y.durum === durum && y.konum === konum);
}
for (const yol of ['/dashboard', '/api/yonetim/ozet', '/', '/websitex', '/leads']) {
  const y = await iste('os.localhost', yol);
  kontrol(`os ${yol} → 404 (yalnız /website)`, y.durum === 404);
}
// Site ve herkese açık uçlar os alanında sunulmaz
for (const [yol, yontem] of [['/website/tr/', 'GET'], ['/website/tr/iletisim', 'GET'], ['/website/api/talep', 'POST'], ['/website/api/talep', 'GET'], ['/website/uye/', 'GET'], ['/website/uye/hesap', 'GET'],
  ['/website/api/uye/giris', 'POST'], ['/website/?tema=onizleme', 'GET'], ['/website/api/icerik', 'GET'], ['/website/arama.json', 'GET'], ['/website/icerik/x', 'GET'], ['/website/referans', 'GET']]) {
  const y = await iste('os.localhost', yol, { method: yontem, headers: yontem === 'POST' ? { 'content-type': 'application/json', origin: OS } : {}, body: yontem === 'POST' ? '{}' : undefined });
  kontrol(`os ${yontem} ${yol} → 404 (yalnız panel)`, y.durum === 404);
}
// Yönlendirici kapısı
kontrol('os: kapı başlığı yok → 404', (await iste('os.localhost', '/website/dashboard', { kapi: false })).durum === 404);
kontrol('os: yanlış kapı anahtarı → 404', (await iste('os.localhost', '/website/dashboard', { kapi: KAPI + 'x' })).durum === 404);
kontrol('panel alanında kapı aranmaz', (await iste('panel.localhost', '/dashboard')).durum === 200);
const pk = await iste('panel.localhost', '/');
kontrol('panel / → 302 /dashboard (bugünkü gibi, öneksiz)', pk.durum === 302 && pk.konum === `${PANEL}/dashboard`);
const pd = await iste('panel.localhost', '/dashboard');
kontrol('panel sayfasında önek yok', pd.durum === 200 && !pd.govde.includes('idexya-temel-yol') && !pd.govde.includes('/website/'));
const od = await iste('os.localhost', '/website/dashboard');
kontrol('os sayfasında önek meta etiketi', od.durum === 200 && od.govde.includes('<meta name="idexya-temel-yol" content="/website">'));
kontrol('os sayfasında çift önek yok', !od.govde.includes('/website/website'));
const kokGoreli = [...od.govde.matchAll(/\s(?:href|src|action|srcset)="(\/[^"]*)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('/website/') && !u.startsWith('/cdn-cgi/'));
kontrol('os sayfasında öneksiz kök adres yok' + (kokGoreli.length ? ': ' + kokGoreli.slice(0, 5).join(', ') : ''), kokGoreli.length === 0);
// Önek yalnız veri olarak (meta) eklenir: satır içi betik gövdesi yok (JSON veri bloğu hariç); panel alanıyla aynı sayıda <script>.
const satirIci = (h) => [...h.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => !/application\/json/.test(m[1]) && m[2].trim()).length;
kontrol('os HTML\'inde satır içi betik yok (dashboard)', satirIci(od.govde) === 0);
const ot = await iste('os.localhost', '/website/theme');
kontrol('os HTML\'inde satır içi betik yok (tema)', ot.durum === 200 && satirIci(ot.govde) === 0);
kontrol('os ve panel HTML\'inde <script> sayısı aynı', (od.govde.match(/<script/g) || []).length === (pd.govde.match(/<script/g) || []).length);
console.log('  os CSP: ' + od.basliklar['content-security-policy']);
const betikKurali = (h) => ((h || '').match(/script-src ([^;]*)/) || [])[1] || '';
kontrol('CSP script-src yalnız \'self\' (os ve panel)', betikKurali(od.basliklar['content-security-policy']) === "'self'" && betikKurali(pd.basliklar['content-security-policy']) === "'self'");
kontrol('os sayfasında güvenlik başlıkları', /frame-ancestors 'none'/.test(od.basliklar['content-security-policy'] || '') && od.basliklar['x-frame-options'] === 'DENY');
const cssYol = (od.govde.match(/href="(\/website\/_astro\/Yonetim[^"]+\.css)"/) || [])[1];
const css = cssYol ? await iste('os.localhost', cssYol) : { govde: '' };
kontrol('CSS yazı tipi adresleri önekli', css.govde.includes('url(/website/fonts/') && !/url\(\/fonts\//.test(css.govde));

// 2. Yazma kaynağı (CSRF)
const yaz = (host, yol, origin) => iste(host, yol, { method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: '{}' });
kontrol('os: aynı köken yazma kabul (422 = iş kuralı)', (await yaz('os.localhost', '/website/api/yonetim/musteriler/toplu', OS)).durum === 422);
kontrol('os: yabancı köken 403', (await yaz('os.localhost', '/website/api/yonetim/musteriler/toplu', 'https://kotu.ornek')).durum === 403);
kontrol('os: Origin yok 403', (await yaz('os.localhost', '/website/api/yonetim/musteriler/toplu')).durum === 403);
kontrol('panel: os kökeni kabul edilmez (izinli liste yalnız os alanında) 403', (await yaz('panel.localhost', '/api/yonetim/musteriler/toplu', OS)).durum === 403);
kontrol('panel: aynı köken kabul (422)', (await yaz('panel.localhost', '/api/yonetim/musteriler/toplu', PANEL)).durum === 422);

// Deneme talebi (site formu ucu; panel alanında bugünkü adres)
await iste('panel.localhost', '/api/talep', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ad: 'Önek Deneme', eposta: 'onek@ornek.com', kvkk: true, kaynak: 'iletisim' }) });

// 3. Tarayıcı
const t = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: process.env.PW_KANAL || undefined });
const bag = await t.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'x-idexya-kapi': KAPI } });
const s = await bag.newPage();
const hatalar = [], istekler = [], kotu = [];
s.on('pageerror', (e) => hatalar.push('JS: ' + e.message));
s.on('console', (m) => { if (m.type() === 'error') hatalar.push('konsol: ' + m.text()); });
s.on('request', (r) => { const u = new URL(r.url()); if (u.origin === OS) istekler.push(u.pathname + u.search); });
s.on('response', (r) => { const u = new URL(r.url()); if (u.origin === OS && r.status() >= 400) kotu.push(r.status() + ' ' + u.pathname); });

await s.goto(OS + '/website/dashboard');
await s.waitForFunction(() => document.querySelector('idexya-kabuk .ik-yan a'), null, { timeout: 10000 });
await s.waitForTimeout(1200);
kontrol('os genel bakış açıldı', (await s.title()).includes('Website Yönetim'));
kontrol('API çağrısı önekli (/website/api/yonetim/ozet)', istekler.includes('/website/api/yonetim/ozet'));
const oneksiz = istekler.filter((u) => !u.startsWith('/website/') && !u.startsWith('/cdn-cgi/'));
kontrol('tüm istekler önekli' + (oneksiz.length ? ': ' + oneksiz.slice(0, 5).join(', ') : ''), oneksiz.length === 0);
const menu = await s.$$eval('idexya-kabuk a[href]', (l) => l.map((a) => a.getAttribute('href')));
const menuKotu = menu.filter((h) => h.startsWith('/') && !h.startsWith('/website/') && !h.startsWith('/cdn-cgi/'));
kontrol(`kabuk menüsünde ${menu.length} bağlantı, öneksiz kök adres yok` + (menuKotu.length ? ': ' + menuKotu.slice(0, 5).join(', ') : ''), menu.length > 10 && menuKotu.length === 0);
kontrol('çıkış öneksiz /cdn-cgi/access/logout', (await s.$$eval('idexya-kabuk a.ik-profil-cikis, idexya-kabuk a[href*="logout"]', (l) => l.map((a) => a.getAttribute('href')))).every((h) => h === '/cdn-cgi/access/logout'));
kontrol('menü rozeti önekli adreste (Talepler ≥ 1)', !!(await s.waitForFunction(() => { const r = document.querySelector('.ik-yan .ik-rozet[data-r="/website/leads"]'); return r && !r.hidden && Number(r.textContent) >= 1; }, null, { timeout: 5000 }).catch(() => null)));
await s.screenshot({ path: SS + '/os-dashboard.png' });

await s.click('.ik-yan a[href="/website/leads"]');
await s.waitForURL(OS + '/website/leads', { timeout: 8000 }).catch(() => {});
kontrol('menüden Talepler: /website/leads', s.url() === OS + '/website/leads');
await s.waitForSelector('[data-ayrinti] strong', { timeout: 8000 }).catch(() => {});
kontrol('talepler listesi geldi', (await s.textContent('.sayfa')).includes('Önek Deneme'));
await s.screenshot({ path: SS + '/os-leads.png' });
await s.click('[data-ayrinti] >> text="CRM’e al"');
await s.waitForSelector('text=Müşteri kartı oluşturuldu', { timeout: 8000 }).catch(() => {});
kontrol('CRM’e al (POST, os kökeni) çalıştı', (await s.$('text=Müşteri kartı oluşturuldu')) !== null);
const kartAc = await s.$eval('[data-ayrinti] a >> text="Müşteri kartını aç"', (a) => a.getAttribute('href')).catch(() => '');
kontrol('"Müşteri kartını aç" önekli: ' + kartAc, kartAc.startsWith('/website/customer?id='));
await s.click('[data-ayrinti] >> text="Müşteri kartını aç"');
await s.waitForSelector('[data-gunluk] li strong', { timeout: 8000 }).catch(() => {});
kontrol('müşteri kartı önekli adreste açıldı', s.url().startsWith(OS + '/website/customer?id=') && (await s.textContent('[data-gunluk]').catch(() => '')).includes('Talep geldi'));
await s.screenshot({ path: SS + '/os-customer.png' });

await s.goto(OS + '/website/crm');
await s.waitForSelector('[data-alan] article a', { timeout: 8000 }).catch(() => {});
const kart = await s.$eval('[data-alan] article a', (a) => a.getAttribute('href')).catch(() => '');
kontrol('CRM kart bağlantısı önekli: ' + kart, kart.startsWith('/website/customer?id='));
await s.screenshot({ path: SS + '/os-crm.png' });

// Tema düzenleyici: os alanında canlı önizleme kapalı (site sayfası panelle aynı kökende açılmaz), panel.idexya.com'a yönlendirir.
await s.goto(OS + '/website/theme');
await s.waitForTimeout(1500);
kontrol('tema: os alanında önizleme çerçevesi yok', (await s.$('[data-iframe]')) === null);
const not = await s.$eval('[data-onizleme-kapali]', (e) => ({ metin: e.textContent, href: (e.querySelector('a') || {}).href || '' })).catch(() => null);
kontrol('tema: "önizleme panel.idexya.com’da" notu ve bağlantısı', !!not && not.metin.includes('panel.idexya.com') && not.href === PANEL + '/theme');
kontrol('tema: site önizlemesi isteği yok', !istekler.some((u) => u.includes('tema=onizleme')));
await s.screenshot({ path: SS + '/os-theme.png' });

kontrol('os sayfalarında 4xx/5xx yok' + (kotu.length ? ': ' + [...new Set(kotu)].slice(0, 6).join(', ') : ''), kotu.length === 0);
kontrol('os sayfalarında konsol hatası yok' + (hatalar.length ? ': ' + hatalar.slice(0, 4).join(' | ') : ''), hatalar.length === 0);

// 4. Panel alanı bugünkü gibi (öneksiz)
hatalar.length = 0;
const pIstek = [];
s.on('request', (r) => { const u = new URL(r.url()); if (u.origin === PANEL) pIstek.push(u.pathname); });
await s.goto(PANEL + '/dashboard');
await s.waitForFunction(() => document.querySelector('idexya-kabuk .ik-yan a'), null, { timeout: 10000 });
await s.waitForTimeout(800);
kontrol('panel: API öneksiz /api/yonetim/ozet', pIstek.includes('/api/yonetim/ozet') && !pIstek.some((u) => u.startsWith('/website')));
kontrol('panel: menü bağlantıları öneksiz', (await s.$$eval('.ik-yan a[href]', (l) => l.map((a) => a.getAttribute('href')))).every((h) => !h.startsWith('/website')));
await s.goto(PANEL + '/theme');
await s.waitForTimeout(3000);
kontrol('panel: tema önizlemesi çalışıyor (çerçeve açık, öneksiz)', ((await s.$eval('[data-iframe]', (f) => f.getAttribute('src')).catch(() => '')) || '').startsWith('/?tema=onizleme'));
kontrol('panel: konsol hatası yok (CSP ihlali dahil)' + (hatalar.length ? ': ' + hatalar.slice(0, 4).join(' | ') : ''), hatalar.length === 0);
await s.screenshot({ path: SS + '/panel-dashboard.png' });
await t.close();

console.log(`${gecen} GEÇTİ, ${kalan} KALDI`);
process.exit(kalan ? 1 : 0);
