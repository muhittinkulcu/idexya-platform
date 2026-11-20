// Panel menüsü (src/data/panel-menu.js) tutarlılık testi; tarayıcı gerekmez: node tools/test-panel-menu.mjs
// Her menü adresi gerçek bir panel sayfasına gider, ad tekrarı yok, sayfa başlıkları menüden gelir, eski adlar kalmadı.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
const kok = new URL('..', import.meta.url).pathname;
let kalan = 0;
const kontrol = (ad, kosul) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad); if (!kosul) kalan++; };
const yolu = join(kok, 'src/data/panel-menu.js');
kontrol('menü tek kaynakta (src/data/panel-menu.js)', existsSync(yolu));
if (!existsSync(yolu)) { console.log(kalan + ' KALDI'); process.exit(1); }
const { MENU } = await import(yolu);
const ogeler = MENU.flatMap((g) => g.ogeler.map((o) => ({ ...o, grup: g.grup })));
const oge = (k) => ogeler.find((o) => o.k === k);

// 1. Sistem › Eşitleme üç alt öğeyle; CRM altında eşitleme yok
const es = oge('esitle');
kontrol('Sistem grubunda "Eşitleme"', es && es.grup === 'Sistem' && es.ad === 'Eşitleme' && es.href === '/data-sync' && es.i === 'esitle');
kontrol('Eşitleme altları: Reklam verisi çekimi, Reklam hesabı eşleştirme, IDOS’a müşteri taşıma', JSON.stringify((es?.altlar || []).map((a) => [a.ad, a.href])) === JSON.stringify([['Reklam verisi çekimi', '/data-sync'], ['Reklam hesabı eşleştirme', '/crm-sync'], ['IDOS’a müşteri taşıma', '/crm-migrate']]));
const crm = oge('crm');
kontrol('CRM altları: Satış panosu, Mükerrer kartlar', JSON.stringify((crm?.altlar || []).map((a) => [a.ad, a.href])) === JSON.stringify([['Satış panosu', '/crm'], ['Mükerrer kartlar', '/crm-conflicts']]));
kontrol('grup başlıkları yalnız ilk harf büyük ve adla aynı (SATIŞ değil Satış)', MENU.every((g) => g.grup === g.ad && g.ad !== g.ad.toLocaleUpperCase('tr') && g.ad[0] === g.ad[0].toLocaleUpperCase('tr')));
kontrol('Haftalık bülten (TDK)', oge('haftalik-bulten')?.ad === 'Haftalık bülten');

// 2. Her menü adresi gerçek bir sayfaya gider; anahtarlar tekil
const sayfalar = new Set(readdirSync(join(kok, 'src/pages/yonetim')).filter((f) => f.endsWith('.astro')).map((f) => f.replace(/\.astro$/, '')));
const hrefler = ogeler.flatMap((o) => [o.href, ...(o.altlar || []).map((a) => a.href)]).filter(Boolean);
const olu = hrefler.filter((h) => !sayfalar.has(new URL(h, 'http://x').pathname.slice(1)));
kontrol(`${hrefler.length} menü adresinin hepsi gerçek sayfa` + (olu.length ? ': ölü ' + olu.join(', ') : ''), olu.length === 0);
const anahtar = ogeler.map((o) => o.k);
kontrol('menü anahtarları tekil', new Set(anahtar).size === anahtar.length);

// 3. Sayfaların aktif= değeri menüde var; başlığı menüden gelen sayfalar elle başlık yazmıyor
const aktifler = [...sayfalar].map((s) => [s, readFileSync(join(kok, 'src/pages/yonetim', s + '.astro'), 'utf8')]);
const bilinmeyen = aktifler.filter(([, m]) => /<Yonetim /.test(m)).map(([s, m]) => [s, (m.match(/<Yonetim[^>]*aktif="([^"]*)"/) || [])[1]]).filter(([, a]) => a && !oge(a));
kontrol('her sayfanın aktif= değeri menüde var' + (bilinmeyen.length ? ': ' + bilinmeyen.map((x) => x.join('=')).join(', ') : ''), bilinmeyen.length === 0);
for (const [s, k] of [['data-sync', 'esitle'], ['crm-sync', 'esitle'], ['crm-migrate', 'esitle'], ['crm-conflicts', 'crm'], ['weekly-newsletter', 'haftalik-bulten']]) {
  const m = aktifler.find(([x]) => x === s)[1];
  kontrol(`${s}: aktif="${k}", başlık menüden (elle baslik= yok)`, new RegExp(`<Yonetim[^>]*aktif="${k}"`).test(m) && !/<Yonetim[^>]*\sbaslik=/.test(m));
}

// 4. Eski adlar src ve worker'da kalmadı
const ESKI = ['IDOS eşitleme', 'Veri eşitleme', 'Çakışmalar', 'Haftalık Bülten'];
const tara = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? tara(p) : [p]; });
const panelDosya = [...tara(join(kok, 'src/pages/yonetim')), ...tara(join(kok, 'src/scripts/yonetim')), join(kok, 'src/layouts/Yonetim.astro'), join(kok, 'src/data/panel-menu.js'), ...tara(join(kok, 'worker'))];
for (const ad of ESKI) {
  const bul = panelDosya.filter((p) => readFileSync(p, 'utf8').includes(ad)).filter((p) => !(ad === 'Haftalık Bülten' && /haftalik-bulten\.js$|bulten-kreatif\.js$/.test(p)));
  kontrol(`eski ad "${ad}" panelde yok` + (bul.length ? ': ' + bul.map((p) => p.slice(kok.length)).join(', ') : ''), bul.length === 0);
}
// 5. Tek gezinme (talimat 4.2): sol menü ortak katmanlar.json'dur; panel menüsündeki her adres sol menüde bir yerde, panel
// sayfaları göreli, öteki ürünlerinki tam adres; Marketplace bayrakla gizli (verisi yok).
const ORTAK = JSON.parse(readFileSync(join(kok, 'src/idexya-kabuk/katmanlar.json'), 'utf8'));
const { ortakMenu, eksikAdresler, PANEL_KOKEN } = await import(join(kok, 'src/data/ortak-menu.js'));
const sol = ortakMenu(ORTAK.katmanlar, MENU);
const eksik = eksikAdresler(ORTAK.katmanlar, MENU);
kontrol('panel menüsündeki her adres sol menüde' + (eksik.length ? ': eksik ' + eksik.join(', ') : ''), eksik.length === 0);
kontrol('sol menü 12 madde (Marketplace bayraklı; Web Site Yönetimi ve E-Ticaret ayrı)', sol.map((k) => k.anahtar).join() === 'genel,musteriler,gorevler,marketing,crm,web,eticaret,creative,marketplace,ai,raporlar,ayarlar' && sol.find((k) => k.anahtar === 'marketplace').bayrak === 'marketplace');
const adr = sol.flatMap((k) => k.gruplar.flatMap((g) => g.moduller.flatMap((m) => [m.url, ...m.sayfalar.map((x) => x.url)])));
kontrol('panel sayfaları göreli, panel kökeninde tam adres kalmadı', !adr.some((u) => u.startsWith(PANEL_KOKEN)) && adr.some((u) => u === '/leads'));
kontrol('öteki ürünlerin sayfaları tam adres (Marketing, Creative)', adr.includes('https://marketing.idexya.com/crm') && adr.includes('https://creative.idexya.com/calendar'));
kontrol('Web Site Yönetimi maddesinin adresi panelin genel bakışı', sol.find((k) => k.anahtar === 'web').url === '/dashboard');
const lay = readFileSync(join(kok, 'src/layouts/Yonetim.astro'), 'utf8');
kontrol('Yonetim.astro: ayar katmanı web, katmanlar ortak menüden', lay.includes("katman: 'web'") && lay.includes('ortakMenu(ORTAK.katmanlar, MENU)'));
console.log(kalan ? kalan + ' KALDI' : 'hepsi geçti');
process.exit(kalan ? 1 : 0);
