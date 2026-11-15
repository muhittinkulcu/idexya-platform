// Eski panel adresinden os.idexya.com/website'e kalıcı yönlendirme (idexya-ortak tek-adres-plani.md adım 6):
//   node tools/test-os-yonlendirme.mjs
import { readFileSync } from 'fs';
import { eskiPanelOsHedefi, SAYFALAR } from '../worker/panel-yollar.js';

let kalan = 0, gecen = 0;
const kontrol = (ad, kosul, ek = '') => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad + (kosul ? '' : ' → ' + ek)); if (kosul) gecen++; else kalan++; };
const ENV = { OS_YONLENDIRME_KOKU: 'https://os.idexya.com', PANEL_TEMEL_YOL: '/website' };
const h = (adres, env = ENV, y = 'GET') => eskiPanelOsHedefi(new URL(adres), env, y);

// 1. Tablo: her eski yol → beklenen hedef (yol ve sorgu korunur)
const TABLO = [
  ['https://panel.idexya.com/', 'https://os.idexya.com/website/'],
  ['https://panel.idexya.com/dashboard', 'https://os.idexya.com/website/dashboard'],
  ['https://panel.idexya.com/leads?tab=new', 'https://os.idexya.com/website/leads?tab=new'],
  ['https://panel.idexya.com/leads/', 'https://os.idexya.com/website/leads'],
  ['https://panel.idexya.com/crm?musteri=abc&x=1', 'https://os.idexya.com/website/crm?musteri=abc&x=1'],
  ['https://panel.idexya.com/client-portal', 'https://os.idexya.com/website/client-portal'],
  ['https://panel.idexya.com/settings', 'https://os.idexya.com/website/settings'],
  ['https://panel.idexya.com/yonetim', 'https://os.idexya.com/website/dashboard'],
  ['https://panel.idexya.com/yonetim/talepler/?sekme=yeni', 'https://os.idexya.com/website/leads?sekme=yeni'],
];
for (const [eski, yeni] of TABLO) kontrol(`${eski} → ${yeni}`, h(eski) === yeni, h(eski));
for (const s of SAYFALAR) kontrol(`her panel sayfası yönlenir: /${s}`, h(`https://panel.idexya.com/${s}`) === `https://os.idexya.com/website/${s}`);
kontrol('HEAD da yönlenir', h('https://panel.idexya.com/leads', ENV, 'HEAD') === 'https://os.idexya.com/website/leads');

// 2. Yönlenmeyenler: API, üye/site uçları, varlıklar, tema önizlemesi, yazma istekleri, başka alan adları
for (const adres of ['https://panel.idexya.com/api/yonetim/ozet', 'https://panel.idexya.com/api/talep', 'https://panel.idexya.com/api/uye/giris',
  'https://panel.idexya.com/api/medya/x', 'https://panel.idexya.com/api/instagram/a/gorsel', 'https://panel.idexya.com/uye/giris',
  'https://panel.idexya.com/icerik/yazi', 'https://panel.idexya.com/tr/bulten', 'https://panel.idexya.com/yonetim/veri/x.json',
  'https://panel.idexya.com/_astro/a.js', 'https://panel.idexya.com/panel-kabuk.js', 'https://panel.idexya.com/panel-onyukleme.json',
  'https://panel.idexya.com/?tema=koyu', 'https://panel.idexya.com/bilinmeyen', 'https://panel.idexya.com/leads/x',
  'https://panel.idexya.com/website/leads', 'https://idexya.com/', 'https://idexya.com/dashboard', 'https://www.idexya.com/leads',
  'https://os.idexya.com/leads', 'https://panel.idexya.com.kotu.com/leads', 'http://panel.localhost:8787/leads'])
  kontrol(`yönlenmez: ${adres}`, h(adres) === null, h(adres));
for (const y of ['POST', 'PUT', 'PATCH', 'DELETE']) kontrol(`yazma yönlenmez: ${y}`, h('https://panel.idexya.com/leads', ENV, y) === null);

// 3. Ayar kapalı ya da geçersizse hiçbir şey
for (const env of [{}, { PANEL_TEMEL_YOL: '/website' }, { OS_YONLENDIRME_KOKU: 'https://os.idexya.com' },
  { ...ENV, OS_YONLENDIRME_KOKU: 'http://os.idexya.com' }, { ...ENV, OS_YONLENDIRME_KOKU: 'https://os.idexya.com/x' },
  { ...ENV, OS_YONLENDIRME_KOKU: 'https://a@os.idexya.com' }, { ...ENV, OS_YONLENDIRME_KOKU: '//os.idexya.com' },
  { ...ENV, PANEL_TEMEL_YOL: 'website' }, { ...ENV, PANEL_TEMEL_YOL: '/../x' }])
  kontrol(`ayar geçersiz: ${JSON.stringify(env)}`, h('https://panel.idexya.com/leads', env) === null);
kontrol('sondaki eğik çizgi ve büyük harf kök normalleşir', h('https://panel.idexya.com/leads', { ...ENV, OS_YONLENDIRME_KOKU: 'https://OS.idexya.com/' }) === 'https://os.idexya.com/website/leads');

// 4. Açık yönlendirme yok: hedef her zaman sabit kök + /website
for (const adres of ['https://panel.idexya.com/leads?next=https://kotu.com', 'https://panel.idexya.com//kotu.com', 'https://panel.idexya.com/yonetim//kotu.com',
  'https://panel.idexya.com/yonetim/%2F%2Fkotu.com', 'https://panel.idexya.com/leads?@kotu.com', 'https://panel.idexya.com/%5Ckotu.com']) {
  const x = h(adres);
  kontrol(`hedef sabit kökte: ${adres}`, x === null || (new URL(x).host === 'os.idexya.com' && new URL(x).pathname.startsWith('/website/')), x);
}

// 5. Worker bağlantısı: os isteği yönlenmez, kural isle() başında (kimlik kapısından önce)
const kaynak = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
kontrol('isle() kuralı os isteğinde çalışmaz', /const osHedef = os \? null : eskiPanelOsHedefi\(url, env, istek\.method\);/.test(kaynak));
kontrol('301 ve kısa önbellek', kaynak.includes("status: 301, headers: { Location: osHedef, 'Cache-Control': 'public, max-age=3600'"));
kontrol('kural kimlik kapısından önce', kaynak.indexOf('eskiPanelOsHedefi(url') < kaynak.indexOf('const kim = await yonetici('));

console.log(`\n${gecen} geçti, ${kalan} kaldı`);
if (kalan) process.exit(1);
