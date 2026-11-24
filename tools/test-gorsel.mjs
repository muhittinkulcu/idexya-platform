// Zengin görünüm (9. tur): her panel sayfasının bandı ortak menüdeki maddesinin renginde; renkler beyaz yazıyla okunur;
// konu ve baş harf kuralları Türkçe harfle doğru.
import { readFileSync } from 'node:fs';
import { modulGorseli, uclu } from '../src/data/modul-gorsel.js';
import { MENU } from '../src/data/panel-menu.js';
import { konu, basHarfler } from '../src/scripts/yonetim/gorsel.js';
let hata = 0;
const k = (ad, kosul) => { if (!kosul) { hata++; console.error('KALDI', ad); } else console.log('GEÇTİ', ad); };
const katmanlar = JSON.parse(readFileSync(new URL('../src/idexya-kabuk/katmanlar.json', import.meta.url), 'utf8')).katmanlar;
const isik = (s) => { const [r, g, b] = s.split(' ').map((x) => { const v = x / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const beyazla = (s) => 1.05 / (isik(s) + 0.05);
k('crm sayfası CRM renginde', modulGorseli(katmanlar, '/crm').anahtar === 'crm' && modulGorseli(katmanlar, '/leads').anahtar === 'crm');
k('görevler, web, ayarlar kendi maddesinde', ['/tasks:gorevler', '/seo:web', '/settings:ayarlar', '/assistant:ai'].every((x) => { const [y, a] = x.split(':'); return modulGorseli(katmanlar, y).anahtar === a; }));
k('menüde olmayan sayfa Web Site Yönetimi', modulGorseli(katmanlar, '/yok').anahtar === 'web' && modulGorseli(katmanlar, null).anahtar === 'web');
k('her menü sayfasının rengi ve simgesi var', MENU.flatMap((g) => g.ogeler).every((o) => { const g = modulGorseli(katmanlar, o.href); return /^\d+ \d+ \d+$/.test(g.ton) && g.yollar.length > 0; }));
k('madde renkleri beyaz yazıyla en az 4,5:1', katmanlar.every((x) => beyazla(uclu(x.ton)) >= 4.5));
const duzen = readFileSync(new URL('../src/layouts/Yonetim.astro', import.meta.url), 'utf8');
const renkler = [...duzen.matchAll(/--k-([a-z]+):(\d+ \d+ \d+)/g)];
k('konu renkleri beyaz yazıyla en az 4,5:1', renkler.length === 8 && renkler.every((r) => beyazla(r[2]) >= 4.5));
k('her konu renginin belirteci var', ['Satış hunisi', 'Bekleyen talepler', 'Hızlı işlemler', 'İçerik yayınla', 'Üyeleri onayla', 'bilinmeyen'].every((t) => renkler.some((r) => r[1] === konu(t).renk)));
k('konu: büyük İ eşleşir, hızlı işlem hız değildir', konu('İçerik yayınla').simge === 'belge' && konu('Hızlı işlemler').simge === 'is' && konu('Site hızı').simge === 'hiz');
k('baş harf: Türkçe ve boş ad', basHarfler('idil kaya') === 'İK' && basHarfler('şule') === 'ŞU' && basHarfler('') === '—' && basHarfler('—') === '—');
if (hata) { console.error(hata + ' kontrol kaldı'); process.exit(1); }
console.log('Tüm kontroller geçti.');
