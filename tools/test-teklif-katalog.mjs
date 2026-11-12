// Teklif kalemlerinde hizmet kataloğundan seçim (Muhittin, 12 Kas 2026): seçici yardımcıları (src/scripts/yonetim/hizmet-secici.js)
// ve sunucuda kalem doğrulaması (worker/teklif.js: hizmet_id ve tur beyaz listesi, eski teklifle uyum).
// Sunucu gerekmez: D1 yerine node:sqlite. Kullanım: node tools/test-teklif-katalog.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { katalogHazirla, hizmetSuz, secimUygula, kalemSecimi, fiyatMetni, TUR_ADI, DISI } from '../src/scripts/yonetim/hizmet-secici.js';

const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'teklif-katalog-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;

const h = [];
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };

function sahteD1() {
  const s = new DatabaseSync(':memory:');
  const temiz = (p) => p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v));
  const duz = (r) => (r ? { ...r } : null);
  class Ifade {
    constructor(sql, p = []) { this.sql = sql; this.p = p; }
    bind(...p) { return new Ifade(this.sql, p); }
    async first() { return duz(s.prepare(this.sql).get(...temiz(this.p))); }
    async all() { return { results: s.prepare(this.sql).all(...temiz(this.p)).map(duz) }; }
    async run() { const r = s.prepare(this.sql).run(...temiz(this.p)); return { meta: { changes: Number(r.changes) } }; }
  }
  return {
    ham: s,
    prepare: (sql) => new Ifade(sql),
    async batch(l) {
      s.exec('BEGIN');
      try { const c = []; for (const i of l) c.push(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(i.sql) || /RETURNING/i.test(i.sql) ? await i.all() : await i.run()); s.exec('COMMIT'); return c; }
      catch (e) { s.exec('ROLLBACK'); throw e; }
    }
  };
}

const B = 'http://localhost';
const db = sahteD1();
const env = { DB: db, YEREL_GIRIS: 'evet' };
const istek = (yol, o = {}) => worker.fetch(new Request(B + '/api/yonetim/' + yol, o), env, {});
const post = (yol, govde) => istek(yol, { method: 'POST', headers: { origin: B, 'content-type': 'application/json' }, body: JSON.stringify(govde) });
const jsn = async (r) => ({ d: r.status, ...(await r.json()) });

// --- Katalog: tohum + bir pasif hizmet ---
let r = await jsn(await istek('hizmet-katalogu'));
k('katalog 200', r.d === 200 && Array.isArray(r.hizmetler));
k('pasife alma 200', (await post('hizmet-katalogu/pazaryeri', { aktif: false })).status === 200);
r = await jsn(await istek('hizmet-katalogu'));
const katalog = katalogHazirla(r.hizmetler);
k('seçici: pasif hizmet listede yok', !katalog.some((x) => x.id === 'pazaryeri') && r.hizmetler.some((x) => x.id === 'pazaryeri'));
k('seçici: sıraya göre (ilk Google Reklam Yönetimi)', katalog[0].ad === 'Google Reklam Yönetimi' && katalog.every((x, i) => !i || katalog[i - 1].sira <= x.sira));
k('seçici: bozuk yanıtta boş liste', katalogHazirla(null).length === 0 && katalogHazirla([{ ad: '', aktif: 1 }]).length === 0);

// Arama: Türkçe harf ve büyük/küçük duyarsız
k('arama: "google" bulur', hizmetSuz(katalog, 'google').map((x) => x.id).join() === 'google-reklam');
k('arama: "ICERIK" → İçerik', hizmetSuz(katalog, 'ICERIK').some((x) => x.id === 'sosyal-medya'));
k('arama: boş sorgu hepsini verir', hizmetSuz(katalog, '  ').length === katalog.length);

// Seçim
const g = katalog.find((x) => x.id === 'google-reklam'), seo = katalog.find((x) => x.id === 'seo');
let s = secimUygula(g);
k('seçim: katalog fiyatı birim fiyatı doldurur (20000)', s.ad === 'Google Reklam Yönetimi' && s.birim_fiyat === '20000' && s.tur === 'aylik' && s.hizmet_id === 'google-reklam');
s = secimUygula(seo);
k('seçim: fiyatı NULL hizmet birim fiyatı boş bırakır', s.birim_fiyat === '' && s.fiyatYok === true && s.tur === 'aylik');
s = secimUygula(DISI);
k('seçim: katalog dışı kalem → hizmet_id null, tur null', s.hizmet_id === null && s.tur === null && s.disi === true);
k('fiyat metni: 2000000 kuruş → "20.000 TL", null → "—"', fiyatMetni(2000000) === '20.000 TL' && fiyatMetni(null) === '—');
k('tür adları', TUR_ADI.aylik === 'Aylık' && TUR_ADI.tek_seferlik === 'Tek seferlik');

// Düzenlemede eski kalemler
let ks = kalemSecimi({ ad: 'Eski kalem', adet: 1, birim_fiyat: 5 }, katalog);
k('eski hizmet_id’siz kalem katalog dışı olarak, adıyla açılır', ks.disi === true && ks.ad === 'Eski kalem');
ks = kalemSecimi({ ad: 'Google Reklam Yönetimi', hizmet_id: 'google-reklam', tur: 'aylik' }, katalog);
k('katalog kalemi seçili açılır', !ks.disi && ks.hizmet_id === 'google-reklam' && ks.ad === 'Google Reklam Yönetimi');
ks = kalemSecimi({ ad: 'Pazaryeri (özel ad)', hizmet_id: 'pazaryeri', tur: 'aylik' }, katalog);
k('sonradan pasife alınan hizmet: kayıtlı ad ve tür korunur', !ks.disi && ks.hizmet_id === 'pazaryeri' && ks.ad === 'Pazaryeri (özel ad)' && ks.tur === 'aylik');
ks = kalemSecimi({}, []);
k('katalog boşsa yeni satır katalog dışı başlar', ks.disi === true);
ks = kalemSecimi({}, katalog);
k('katalog doluyken yeni satır seçimsiz başlar', ks === null);

// --- Sunucu: kalem doğrulaması ---
const z = new Date().toISOString();
db.ham.prepare("INSERT INTO musteriler (id, olusturma, guncelleme, kaynak, firma, asama) VALUES ('m1', ?, ?, 'elle', 'Örnek Ltd', 'yeni')").run(z, z);
const govde = (kalemler) => ({ musteri_id: 'm1', baslik: 'Dijital paket', kdv_orani: 20, kalemler });
r = await jsn(await post('teklifler', govde([
  { ad: 'Google Reklam Yönetimi', adet: 1, birim_fiyat: 20000, hizmet_id: 'google-reklam', tur: 'aylik' },
  { ad: 'Logo çizimi', adet: 1, birim_fiyat: 5000, hizmet_id: null, tur: null }
])));
k('katalog + katalog dışı kalemli teklif kaydedilir', r.d === 200 && r.id);
const id = r.id;
r = await jsn(await istek('teklifler/' + id));
const [k1, k2] = r.teklif.kalemler;
k('kayıt: katalog kalemi hizmet_id ve tur taşır', k1.hizmet_id === 'google-reklam' && k1.tur === 'aylik' && k1.tutar === 20000);
k('kayıt: katalog dışı kalem hizmet_id null', k2.ad === 'Logo çizimi' && (k2.hizmet_id ?? null) === null && (k2.tur ?? null) === null);
k('kayıt: toplam sunucuda (25.000 + %20 KDV = 30.000)', r.teklif.toplam === 30000);

const red = async (ad, kalem) => { const x = await post('teklifler', govde([{ ad: 'X', adet: 1, birim_fiyat: 1, ...kalem }])); k(ad, x.status === 422); };
await red('geçersiz tur → 422', { tur: 'haftalik' });
await red('tur dizi değil metin olmalı → 422', { tur: ['aylik'] });
await red('aşırı uzun hizmet_id → 422', { hizmet_id: 'a'.repeat(65) });
await red('hizmet_id yasak karakter → 422', { hizmet_id: 'x"; DROP' });
await red('hizmet_id sayı → 422', { hizmet_id: 42 });
r = await jsn(await post('teklifler', govde([{ ad: 'X', adet: 1, birim_fiyat: 1, tur: 'tek_seferlik', fazla: 'y'.repeat(5000) }])));
k('beyaz liste: bilinmeyen alan saklanmaz', r.d === 200 && !('fazla' in (await jsn(await istek('teklifler/' + r.id))).teklif.kalemler[0]));

// Eski teklif (hizmet_id yok) açılır, düzenlenir ve kopyalanır
db.ham.prepare(`INSERT INTO teklifler (id, no, musteri_id, baslik, kalemler, kdv_orani, indirim, para, gecerlilik, notlar, durum, ara_toplam, kdv, toplam, olusturma, guncelleme, olusturan)
  VALUES ('eski', 'IDX-2026-0900', 'm1', 'Eski teklif', ?, 20, 0, 'TRY', NULL, NULL, 'taslak', 100, 20, 120, ?, ?, 'test')`).run(JSON.stringify([{ ad: 'Eski kalem', aciklama: '', adet: 1, birim_fiyat: 100, tutar: 100 }]), z, z);
r = await jsn(await istek('teklifler/eski'));
k('eski teklif açılır', r.d === 200 && r.teklif.kalemler[0].ad === 'Eski kalem');
const eskiKalem = r.teklif.kalemler[0];
r = await jsn(await post('teklifler/eski', govde([{ ...eskiKalem, hizmet_id: null, tur: null }])));
k('eski teklif katalog dışı kalemle yeniden kaydedilir', r.d === 200);
r = await jsn(await post(`teklifler/${id}/kopyala`, {}));
const kopya = (await jsn(await istek('teklifler/' + r.id))).teklif.kalemler[0];
k('kopyalamada hizmet_id ve tur korunur', kopya.hizmet_id === 'google-reklam' && kopya.tur === 'aylik');

if (h.length) { console.error(`\n${h.length} kontrol KALDI`); process.exit(1); }
console.log('\nTüm kontroller geçti.');
