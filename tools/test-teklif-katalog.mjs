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

// --- Aylık ve tek seferlik tutarlar toplanmaz ---
const { teklifHesapla, teklifBloklari, bloklarMetni } = await import('../src/scripts/yonetim/teklif-toplam.js');
const KARISIK = [
  { ad: 'Google Reklam Yönetimi', adet: 1, birim_fiyat: 20000, hizmet_id: 'google-reklam', tur: 'aylik' },
  { ad: 'Kurumsal Website Tasarımı', adet: 1, birim_fiyat: 5000, hizmet_id: 'kurumsal-web', tur: 'tek_seferlik' }
];
let on = teklifHesapla(KARISIK, 0, 20);
k('önizleme: karışık teklif iki blok (aylık 24.000, tek seferlik 6.000)', on.karisik && on.bloklar.length === 2 && on.bloklar[0].tur === 'aylik' && on.bloklar[0].toplam === 2400000 && on.bloklar[1].toplam === 600000 && !on.hata);
k('önizleme: karışıkta indirim reddedilir', !!teklifHesapla(KARISIK, 100, 20).hata);
k('önizleme: karışıkta türü belirsiz kalem reddedilir', !!teklifHesapla([...KARISIK, { ad: 'X', adet: 1, birim_fiyat: 1 }], 0, 20).hata);
on = teklifHesapla([KARISIK[0]], 1000, 20);
k('önizleme: tek tür → tek blok, tür etiketi, indirim uygulanır', on.bloklar.length === 1 && on.bloklar[0].tur === 'aylik' && on.bloklar[0].toplam === 2280000);
on = teklifHesapla([{ ad: 'Eski', adet: 2, birim_fiyat: 50 }], 0, 20);
k('önizleme: türü bilinmeyen (eski) → tek blok, tür yok', on.bloklar.length === 1 && on.bloklar[0].tur === null && on.bloklar[0].toplam === 12000);

r = await jsn(await post('teklifler', govde(KARISIK)));
k('karışık teklif kaydedilir', r.d === 200);
const kid = r.id;
let kt = (await jsn(await istek('teklifler/' + kid))).teklif;
const kb = teklifBloklari(kt);
k('sunucu: iki ayrı toplam (aylık 24.000 / tek seferlik 6.000)', kb.length === 2 && kb[0].toplam === 24000 && kb[1].toplam === 6000 && kt.ara_aylik === 20000 && kt.kdv_tek === 1000);
k('sunucu: ikisinin toplamı (30.000) hiçbir sütunda yok', !Object.values(kt).some((x) => x === 30000 || x === 25000) && !JSON.stringify(kt).includes('30000'));
const onK = teklifHesapla(KARISIK, 0, 20);
k('sunucu toplamları önizlemeyle aynı', kb.every((b, i) => Math.round(b.toplam * 100) === onK.bloklar[i].toplam && Math.round(b.kdv * 100) === onK.bloklar[i].kdv && Math.round(b.ara * 100) === onK.bloklar[i].ara));
k('metin: "24.000,00 TL / ay (aylık) · 6.000,00 TL (tek seferlik)"', bloklarMetni(kb) === '24.000,00 TL / ay (aylık) · 6.000,00 TL (tek seferlik)');
r = await jsn(await istek('teklifler'));
const lk = r.teklifler.find((x) => x.id === kid);
k('liste: karışık teklifte tür sütunları gelir', lk && lk.toplam_aylik === 24000 && lk.toplam_tek === 6000);
k('sunucu: karışıkta indirim → 422', (await post('teklifler', { ...govde(KARISIK), indirim: 100 })).status === 422);
k('sunucu: karışıkta türsüz kalem → 422', (await post('teklifler', govde([...KARISIK, { ad: 'X', adet: 1, birim_fiyat: 1 }]))).status === 422);
r = await jsn(await post('teklifler', { ...govde([KARISIK[0]]), indirim: 1000 }));
kt = (await jsn(await istek('teklifler/' + r.id))).teklif;
k('sunucu: tek tür → tek blok, indirimli (22.800)', teklifBloklari(kt).length === 1 && teklifBloklari(kt)[0].tur === 'aylik' && kt.toplam === 22800 && kt.indirim === 1000);
kt = (await jsn(await istek('teklifler/eski'))).teklif;
k('eski teklif tek blok, tür yok, toplam korunur', teklifBloklari(kt).length === 1 && teklifBloklari(kt)[0].tur === null && kt.toplam === 120);
// Kabul akışı: karışık teklifte müşteri günlüğü iki tutarı ayrı yazar; gelir kaydı tek tutarla açılmaz.
await post(`teklifler/${kid}/gonderildi`, {});
await post(`teklifler/${kid}/kabul`, {});
const gunluk = db.ham.prepare("SELECT detay FROM kayitlar WHERE musteri_id = 'm1' AND tur = 'teklif' ORDER BY zaman DESC LIMIT 1").get();
k('günlük: iki tutar ayrı, toplam yok', gunluk && gunluk.detay.includes('24.000,00 TL / ay') && gunluk.detay.includes('6.000,00 TL') && !gunluk.detay.includes('30.000'));

// --- Muhasebe: karışık teklifte iki ayrı gelir kaydı (Muhittin, 12 Kas 2026) ---
const gelirler = (no) => db.ham.prepare("SELECT tutar, aciklama, belge_no FROM muhasebe WHERE tur = 'gelir' AND belge_no = ? ORDER BY aciklama").all(no).map((x) => ({ ...x }));
const kno = (await jsn(await istek('teklifler/' + kid))).teklif.no;
r = await jsn(await post(`teklifler/${kid}/gelir`, {}));
let gl = gelirler(kno);
const glA = gl.find((x) => x.aciklama.includes('aylık (ilk ay)')), glT = gl.find((x) => x.aciklama.includes('tek seferlik'));
k('karışık teklifte gelir kaydı 200', r.d === 200);
k('karışık: iki gelir kaydı açılır', gl.length === 2);
k('karışık: aylık (ilk ay) kaydı 24.000 TL (KDV dahil)', glA && glA.tutar === 2400000 && glA.aciklama.startsWith(kno + ' · aylık (ilk ay)'));
k('karışık: tek seferlik kaydı 6.000 TL (KDV dahil)', glT && glT.tutar === 600000 && glT.aciklama.startsWith(kno + ' · tek seferlik'));
k('karışık: 30.000 TL tutarlı kayıt yok', !gl.some((x) => x.tutar === 3000000));
k('karışık: ikinci istek 409, mükerrer kayıt açılmaz', (await post(`teklifler/${kid}/gelir`, {})).status === 409 && gelirler(kno).length === 2);
r = await jsn(await istek('teklifler/' + kid));
k('teklif ayrıntısı iki gelir kaydını döner', Array.isArray(r.gelirler) && r.gelirler.length === 2 && !!r.gelir);

// Tek türlü teklif: tek kayıt (indirimli aylık: 22.800 TL)
const kabulEt = async (musteri, kalemler, indirim = 0) => {
  const x = await jsn(await post('teklifler', { ...govde(kalemler), musteri_id: musteri, indirim }));
  await post(`teklifler/${x.id}/gonderildi`, {}); await post(`teklifler/${x.id}/kabul`, {});
  return x;
};
const z2 = new Date().toISOString();
for (const [mid, gc, fb] of [['d1', 'gclid_karisik_0001', null], ['d2', 'gclid_aylik_00001', null], ['d3', null, 'fbclid_tek_000001'], ['d4', 'gclid_eski_000001', null]]) {
  db.ham.prepare("INSERT INTO musteriler (id, olusturma, guncelleme, kaynak, firma, asama) VALUES (?, ?, ?, 'elle', ?, 'yeni')").run(mid, z2, z2, 'Firma ' + mid);
  db.ham.prepare("INSERT INTO talepler (id, olusturma, kaynak, dogrulama, musteri_id) VALUES (?, ?, 'iletisim', 'test', ?)").run('t-' + mid, z2, mid);
  db.ham.prepare('INSERT INTO talep_reklam (talep_id, gclid, fbclid, tiklama_zamani) VALUES (?, ?, ?, ?)').run('t-' + mid, gc, fb, z2);
}
const tekAylik = await kabulEt('d2', [KARISIK[0]], 1000);
const tekNo = (await jsn(await istek('teklifler/' + tekAylik.id))).teklif.no;
r = await jsn(await post(`teklifler/${tekAylik.id}/gelir`, {}));
gl = gelirler(tekNo);
k('tek türlü teklif: tek gelir kaydı, 22.800 TL', r.d === 200 && gl.length === 1 && gl[0].tutar === 2280000);
k('tek türlü teklif: ikinci istek 409', (await post(`teklifler/${tekAylik.id}/gelir`, {})).status === 409 && gelirler(tekNo).length === 1);

// --- Reklam dönüşüm değeri: yıllık değer = aylık net × 12 + tek seferlik net (KDV hariç, indirim düşülmüş) ---
await kabulEt('d1', KARISIK);
await kabulEt('d3', [KARISIK[1]], 500);
db.ham.prepare(`INSERT INTO teklifler (id, no, musteri_id, baslik, kalemler, kdv_orani, indirim, para, durum, ara_toplam, kdv, toplam, olusturma, guncelleme, karar_zamani, olusturan)
  VALUES ('eski-kabul', 'IDX-2026-0950', 'd4', 'Eski kabul', '[]', 20, 10, 'TRY', 'kabul', 100, 18, 108, ?, ?, ?, 'test')`).run(z2, z2, z2);
r = await jsn(await istek('donusum'));
const dd = (mid) => r.adaylar.find((x) => x.musteri_id === mid) || {};
k('dönüşüm: karışık teklif değeri = 20.000 × 12 + 5.000 = 245.000', dd('d1').deger === 245000);
k('dönüşüm: yalnız aylık (indirimli) = 19.000 × 12 = 228.000', dd('d2').deger === 228000);
k('dönüşüm: yalnız tek seferlik (indirimli) = 4.500', dd('d3').deger === 4500);
k('dönüşüm: eski türsüz teklif eskisi gibi (100 − 10 = 90)', dd('d4').deger === 90);
k('dönüşüm: aylık kalemli değer yıllık olarak işaretli, diğerleri değil', dd('d1').deger_yillik === 1 && dd('d2').deger_yillik === 1 && !dd('d3').deger_yillik && !dd('d4').deger_yillik);
const csvG = await (await istek('donusum/csv/google')).text();
k('Google CSV: karışık teklif değeri 245000', csvG.includes('gclid_karisik_0001') && /gclid_karisik_0001,[^\r\n]*,245000,TRY/.test(csvG));

if (h.length) { console.error(`\n${h.length} kontrol KALDI`); process.exit(1); }
console.log('\nTüm kontroller geçti.');
