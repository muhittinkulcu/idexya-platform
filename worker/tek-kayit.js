// Müşteri tek kayıt, 2. adım (IDOS deposu docs/tasarim/musteri-tek-kayit.md §6-§8, §12; kararlar K2, K7, K8, K10, K11).
// · Panelde açılan müşteri kartı anında IDOS'ta "aday" olur: `POST /api/ortak/v2/musteriler` (imzalı). Dönen IDOS kimliği
//   `musteriler.ana_kayit_id`'ye yazılır. Eski "Müşteri yap" onay kuyruğu artık kullanılmaz.
// · İmza (IDOS app/core/ortak_jeton.py ile birebir): HMAC-SHA256(ORTAK_YAZMA_JETON_PANEL,
//   YÖNTEM \n yol \n zaman \n tek \n kullanıcı \n sha256hex(gövde)). Başlıklar: Authorization: Bearer <IDOS_ORTAK_JETON> (okuma
//   jetonu, ürünü tanıtır), X-Idexya-Kullanici, X-Idexya-Zaman (Unix sn), X-Idexya-Tek (her istekte yeni), X-Idexya-Imza.
//   Yazma jetonu istekte hiç gönderilmez.
// · Tekrar güvenliği: oluşturmada her kart için SABİT `Idempotency-Key` (panel- + sha256(kart id) ilk 32 hane); yeniden denemede IDOS aynı kaydı döner.
// · Sır yoksa, yazan yönetici listesinde (YONETICILER, K8) değilse ya da IDOS reddederse (403 anahtar kapalı, 401, 429, 5xx, ağ):
//   kart yerelde kalır, durum "bekliyor" ve hata metni görünür. Kendiliğinden yeniden gönderilmez; kartta "Yeniden dene" düğmesi var.
// · Aday → aktif (K7) yalnız süper yönetici: IDOS'taki SÜPER_ADMİNLER ile aynı liste (app/services/access_control.py).
// · KVKK: TCKN, kart numarası, IBAN içeren alan gönderilmez (IDOS ortak_yazma.yasakli_veri ile aynı kural); şahıs VKN alanı yok.
// · Bu modül e-posta, bildirim ya da mesaj göndermez.
import { json, hata, simdi, kimlik, islemYaz } from './ortak.js';
import { taban } from './ana-kayit.js';
import { adNormal, benzerlik, telefonNormal } from './crm.js';

export const SUPER_YONETICILER = new Set(['info@idexya.com']);
const ZAMAN_ASIMI_MS = 8000;
const KIMLIK = /^[\w-]{1,100}$/;
const EPOSTA = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const TELEFON = /^[0-9 +()-]{6,40}$/;
const EN_KISA_JETON = 32;
const v2 = '/api/ortak/v2/musteriler';

const yazi = (v, n) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
export const idempotencyAnahtari = async (kartId) => 'panel-' + hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(kartId)))).slice(0, 32);
const jetonu = (v) => { const s = String(v || '').trim(); return s.length >= EN_KISA_JETON ? s : ''; };

export const yazmaKurulu = (env) => !!(env.IDOS_ORTAK_URL && jetonu(env.IDOS_ORTAK_JETON) && jetonu(env.ORTAK_YAZMA_JETON_PANEL));
export const superMi = (kim) => SUPER_YONETICILER.has(String((kim && kim.eposta) || '').toLowerCase());
const yoneticiMi = (env, eposta) => (env.YONETICILER || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).includes(String(eposta || '').toLowerCase());

export async function imzaHesapla(jeton, yontem, yol, zaman, tek, kullanici, govdeMetni) {
  const kod = new TextEncoder();
  const ozet = hex(await crypto.subtle.digest('SHA-256', kod.encode(govdeMetni)));
  const metin = [String(yontem).toUpperCase(), yol, zaman, tek, kullanici, ozet].join('\n');
  const anahtar = await crypto.subtle.importKey('raw', kod.encode(jeton), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', anahtar, kod.encode(metin)));
}

// --- KVKK (IDOS app/services/ortak_yazma.py yasakli_veri ile aynı) ---
const tcknMi = (r) => {
  if (r.length !== 11 || r[0] === '0') return false;
  const d = [...r].map(Number);
  const tek = d[0] + d[2] + d[4] + d[6] + d[8], cift = d[1] + d[3] + d[5] + d[7];
  return ((tek * 7 - cift) % 10 + 10) % 10 === d[9] && d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
};
const luhn = (r) => { let t = 0; [...r].reverse().forEach((c, i) => { let n = Number(c); if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; }); return t % 10 === 0; };
export function yasakliVeri(metin) {
  if (typeof metin !== 'string' || !metin) return null;
  if (/TR\s?\d{2}(?:\s?\d){22}/i.test(metin)) return 'iban';
  const adaylar = new Set([...(metin.match(/\d(?:[\s\-./_,]?\d)*/g) || []).map((p) => p.replace(/\D/g, '')), ...(metin.match(/\d+/g) || [])]);
  for (const r of adaylar) {
    if (tcknMi(r)) return 'tckn';
    if (r.length >= 13 && r.length <= 19 && luhn(r)) return 'kart';
  }
  return null;
}

// --- Gövdeler (yalnız IDOS beyaz listesi: ortak_yazma.ORTAK_YAZILIR_ALANLAR, KİŞİ_ALANLARI) ---
export function musteriGovdesi(m) {
  const marka = yazi(m.firma, 200) || yazi(m.ad, 200);
  if (!marka) return { hata: 'Kartta firma ya da ad yok' };
  const g = { marka };
  if (yazi(m.sektor, 100)) g.sektor = yazi(m.sektor, 100);
  if (yazi(m.sorumlu, 200)) g.sorumlu = yazi(m.sorumlu, 200);
  if (yazi(m.kaynak, 100)) g.kaynak = yazi(m.kaynak, 100);
  const ad = yazi(m.ad, 120);
  if (ad) {
    const kisi = { ad, birincil: true };
    const e = yazi(m.eposta, 254);
    if (e && EPOSTA.test(e)) kisi.eposta = e.toLowerCase();
    if (TELEFON.test(m.telefon || '')) kisi.telefon = m.telefon.trim();
    g.kisiler = [kisi];
  }
  const tur = [g.marka, g.sektor, g.sorumlu, g.kaynak, ...(g.kisiler || []).flatMap((k) => [k.ad, k.eposta, k.telefon]), m.telefon, m.eposta].map(yasakliVeri).find(Boolean);
  if (tur) return { hata: `Kartta saklanamayacak kişisel veri var (${tur}); kartı düzeltip yeniden deneyin` };
  return { govde: g };
}

const ASAMA_FIRSAT = { yeni: 'yeni', gorusme: 'gorusme', teklif: 'teklif', goruldu: 'teklif', kazanildi: 'kazanildi', kaybedildi: 'kaybedildi' };
// K11: paket ve değer fırsat olarak gider; birimi belirsiz değer yalnız nota yazılır, tutar alanları boş ("—"). K10: kaybedildi fırsatı.
export function firsatGovdesi(m) {
  const paket = yazi(m.paket, 160), deger = m.deger === null || m.deger === undefined || m.deger === '' ? null : String(m.deger);
  const kayip = m.asama === 'kaybedildi';
  if (!paket && deger === null && !kayip) return null;
  const not = ['Panelden taşındı.', paket ? 'Panel paketi: ' + paket + '.' : null, deger !== null ? `Panel değeri: ${deger} (birimi belirsiz; tutar alanı boş bırakıldı).` : null, kayip ? 'Etiket: kaybedildi.' : null].filter(Boolean).join(' ');
  const g = { ad: paket || 'Panelden taşınan fırsat', asama: ASAMA_FIRSAT[m.asama] || 'yeni', not_metni: not.slice(0, 2000) };
  if (kayip) g.kayip_nedeni = 'Belirtilmedi (panelde kaybedildi)';
  return g;
}

// --- IDOS isteği ---
async function idosYaz(env, yontem, yol, govde, kullanici, ek = {}) {
  const metin = JSON.stringify(govde);
  const zaman = String(Math.floor(Date.now() / 1000));
  const tek = hex(crypto.getRandomValues(new Uint8Array(16)));
  const imza = await imzaHesapla(jetonu(env.ORTAK_YAZMA_JETON_PANEL), yontem, yol, zaman, tek, kullanici, metin);
  return fetch(taban(env) + yol, {
    method: yontem, body: metin, signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
    headers: { Authorization: 'Bearer ' + jetonu(env.IDOS_ORTAK_JETON), 'Content-Type': 'application/json', Accept: 'application/json',
      'X-Idexya-Kullanici': kullanici, 'X-Idexya-Zaman': zaman, 'X-Idexya-Tek': tek, 'X-Idexya-Imza': imza, ...ek }
  });
}
async function idosOku(env, yol) {
  const r = await fetch(taban(env) + yol, { headers: { Authorization: 'Bearer ' + jetonu(env.IDOS_ORTAK_JETON), Accept: 'application/json' }, signal: AbortSignal.timeout(ZAMAN_ASIMI_MS) });
  return { durum: r.status, veri: await r.json().catch(() => null) };
}
const ayrinti = (v) => { const d = v && v.detail; return typeof d === 'string' ? d.slice(0, 200) : d && typeof d.mesaj === 'string' ? d.mesaj.slice(0, 200) : ''; };
function idosHatasi(durum, v) {
  const a = ayrinti(v);
  if (durum === 403) return `IDOS yazmayı kabul etmedi (403): ${a || 'yazma kapısı kapalı ya da kullanıcı yetkisiz'}`;
  if (durum === 401) return `IDOS imzayı kabul etmedi (401)${a ? ': ' + a : ''}`;
  if (durum === 422) return `IDOS kart bilgilerini kabul etmedi (422)${a ? ': ' + a : ''}`;
  if (durum === 429) return 'IDOS yazma sınırı aşıldı (429); bir dakika sonra yeniden deneyin';
  if (durum === 409) return `IDOS kaydı siz işlem yaparken değişti (409)${a ? ': ' + a : ''}`;
  return `IDOS geçici olarak yazamıyor (${durum})`;
}
const agHatasi = (e) => (e && (e.name === 'TimeoutError' || e.name === 'AbortError') ? 'IDOS\'a ulaşılamadı (zaman aşımı); kayıt yapılmadı' : 'IDOS\'a ulaşılamadı; kayıt yapılmadı');

// --- Gönderim durumu ---
async function durumYaz(db, kartId, alan) {
  const z = simdi();
  await db.prepare(`INSERT INTO idos_gonderim (kart_id, anahtar, durum, ana_kayit_id, deneme, son_deneme, son_hata, gonderen, firsat_durum)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
    ON CONFLICT(kart_id) DO UPDATE SET durum = excluded.durum, ana_kayit_id = COALESCE(excluded.ana_kayit_id, idos_gonderim.ana_kayit_id),
      deneme = idos_gonderim.deneme + 1, son_deneme = excluded.son_deneme, son_hata = excluded.son_hata, gonderen = excluded.gonderen,
      firsat_durum = COALESCE(excluded.firsat_durum, idos_gonderim.firsat_durum)`)
    .bind(kartId, await idempotencyAnahtari(kartId), alan.durum, alan.ana_kayit_id || null, z, alan.hata || null, alan.gonderen || null, alan.firsat_durum || null).run();
}
const bekliyor = async (db, kartId, kim, mesaj, ilk) => {
  await durumYaz(db, kartId, { durum: 'bekliyor', hata: mesaj, gonderen: kim.eposta });
  if (ilk) await db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), kartId, simdi(), 'sistem', 'IDOS\'a gönderilemedi — bekliyor', mesaj, kim.eposta).run();
  await islemYaz(db, kim.eposta, 'idos_gonder', kartId, 'bekliyor: ' + mesaj);
  return { durum: 'bekliyor', hata: mesaj };
};

// Kartı IDOS'a aday olarak gönderir. Dönüş: { durum: 'gonderildi' | 'bagli' | 'bekliyor', ana_kayit_id?, hata?, kod? }
export async function tekKayitGonder(env, kartId, kim, { firsat = false } = {}) {
  const db = env.DB;
  const m = await db.prepare('SELECT * FROM musteriler WHERE id = ?').bind(kartId).first();
  if (!m) return { durum: 'yok', hata: 'Müşteri bulunamadı' };
  const once = await db.prepare('SELECT * FROM idos_gonderim WHERE kart_id = ?').bind(kartId).first();
  const ilk = !once;
  let anaId = m.ana_kayit_id;
  if (anaId && !(firsat && once && once.firsat_durum === 'bekliyor')) return { durum: 'bagli', ana_kayit_id: anaId };
  if (!yazmaKurulu(env)) return bekliyor(db, kartId, kim, 'IDOS yazma bağlantısı kurulu değil (IDOS_ORTAK_URL, IDOS_ORTAK_JETON, ORTAK_YAZMA_JETON_PANEL)', ilk);
  if (!yoneticiMi(env, kim.eposta)) return bekliyor(db, kartId, kim, 'Yazan e-posta panel yönetici listesinde değil (YONETICILER); IDOS\'a gönderilmedi', ilk);
  const fg = firsat ? firsatGovdesi(m) : null;
  const ft = fg ? [fg.ad, fg.not_metni].map(yasakliVeri).find(Boolean) : null;
  if (ft) return bekliyor(db, kartId, kim, `Paket ya da değer alanında saklanamayacak kişisel veri var (${ft}); kartı düzeltip yeniden deneyin`, ilk);
  if (!anaId) {
    const { govde, hata: gh } = musteriGovdesi(m);
    if (gh) return bekliyor(db, kartId, kim, gh, ilk);
    let r, v;
    try { r = await idosYaz(env, 'POST', v2, govde, kim.eposta, { 'Idempotency-Key': await idempotencyAnahtari(kartId) }); v = await r.json().catch(() => null); }
    catch (e) { return bekliyor(db, kartId, kim, agHatasi(e), ilk); }
    if (r.status !== 201 && r.status !== 200) return { ...(await bekliyor(db, kartId, kim, idosHatasi(r.status, v), ilk)), kod: r.status };
    if (!v || !KIMLIK.test(String(v.musteri_id || ''))) return bekliyor(db, kartId, kim, 'IDOS yanıtı beklenen biçimde değil', ilk);
    anaId = String(v.musteri_id);
    const z = simdi();
    await db.batch([
      db.prepare('UPDATE musteriler SET ana_kayit_id = ?, guncelleme = ? WHERE id = ? AND ana_kayit_id IS NULL').bind(anaId, z, kartId),
      db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), kartId, z, 'sistem', 'IDOS\'ta aday olarak açıldı', 'IDOS ana kayıt: ' + anaId, kim.eposta)
    ]);
    await durumYaz(db, kartId, { durum: 'gonderildi', ana_kayit_id: anaId, gonderen: kim.eposta, firsat_durum: fg ? 'bekliyor' : null });
    await islemYaz(db, kim.eposta, 'idos_gonder', kartId, 'aday ' + anaId);
  }
  // Fırsat (K10, K11): müşteri açıldıktan sonra ayrı istek; başarısızsa yalnız fırsat yeniden denenir.
  if (fg) {
    try {
      const r = await idosYaz(env, 'POST', `${v2}/${encodeURIComponent(anaId)}/firsatlar`, fg, kim.eposta);
      if (r.status !== 201 && r.status !== 200) {
        const v = await r.json().catch(() => null);
        await durumYaz(db, kartId, { durum: 'gonderildi', hata: 'Fırsat gönderilemedi: ' + idosHatasi(r.status, v), gonderen: kim.eposta, firsat_durum: 'bekliyor' });
        return { durum: 'gonderildi', ana_kayit_id: anaId, firsat: 'bekliyor', kod: r.status, hata: 'Fırsat gönderilemedi: ' + idosHatasi(r.status, v) };
      }
    } catch (e) {
      await durumYaz(db, kartId, { durum: 'gonderildi', hata: 'Fırsat gönderilemedi: ' + agHatasi(e), gonderen: kim.eposta, firsat_durum: 'bekliyor' });
      return { durum: 'gonderildi', ana_kayit_id: anaId, firsat: 'bekliyor', hata: 'Fırsat gönderilemedi: ' + agHatasi(e) };
    }
    await durumYaz(db, kartId, { durum: 'gonderildi', gonderen: kim.eposta, firsat_durum: 'gonderildi' });
    await db.prepare('UPDATE idos_gonderim SET son_hata = NULL WHERE kart_id = ?').bind(kartId).run();
  }
  return { durum: 'gonderildi', ana_kayit_id: anaId, firsat: fg ? 'gonderildi' : null };
}

// Aday → aktif (K7). Sürüm IDOS'tan okunur; iyimser kilit IDOS'tadır (409).
export async function kazanildi(env, kartId, kim) {
  if (!superMi(kim)) return { kod: 403, hata: 'Adayı müşteriye yalnız süper yönetici çevirebilir' };
  if (!yazmaKurulu(env)) return { kod: 409, hata: 'IDOS yazma bağlantısı kurulu değil' };
  const m = await env.DB.prepare('SELECT ana_kayit_id FROM musteriler WHERE id = ?').bind(kartId).first();
  if (!m) return { kod: 404, hata: 'Müşteri bulunamadı' };
  if (!m.ana_kayit_id) return { kod: 409, hata: 'Kart IDOS\'a bağlı değil' };
  try {
    const o = await idosOku(env, `${v2}/${encodeURIComponent(m.ana_kayit_id)}`);
    if (o.durum !== 200 || !o.veri || !o.veri.guncelleme) return { kod: o.durum === 404 ? 404 : 502, hata: idosHatasi(o.durum, o.veri) };
    if (o.veri.durum !== 'aday') return { kod: 409, hata: 'IDOS\'taki kayıt aday değil (' + (o.veri.durum || '—') + ')' };
    const r = await idosYaz(env, 'POST', `${v2}/${encodeURIComponent(m.ana_kayit_id)}/kazanildi`, { surum: o.veri.guncelleme }, kim.eposta);
    const v = await r.json().catch(() => null);
    if (r.status !== 200) return { kod: r.status === 403 || r.status === 409 ? r.status : 502, hata: idosHatasi(r.status, v) };
  } catch (e) { return { kod: 502, hata: agHatasi(e) }; }
  await env.DB.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), kartId, simdi(), 'sistem', 'IDOS\'ta müşteriye çevrildi (aktif)', 'IDOS ana kayıt: ' + m.ana_kayit_id, kim.eposta).run();
  await islemYaz(env.DB, kim.eposta, 'idos_kazanildi', kartId, m.ana_kayit_id);
  return { kod: 200, durum: 'aktif' };
}

// --- Tek seferlik taşıma (§8) ---
const epostaNormal = (e) => String(e || '').trim().toLowerCase();
async function idosAdaylari(env) {
  if (yazmaKurulu(env)) {
    try {
      const liste = [];
      for (let sayfa = 1; sayfa <= 20; sayfa++) {
        const o = await idosOku(env, `${v2}?boyut=500&sayfa=${sayfa}`);
        if (o.durum !== 200 || !o.veri || !Array.isArray(o.veri.musteriler)) throw new Error(idosHatasi(o.durum, o.veri));
        liste.push(...o.veri.musteriler);
        if (liste.length >= (Number(o.veri.toplam) || 0) || !o.veri.musteriler.length) break;
      }
      return { kaynak: 'idos', liste: liste.filter((c) => c && KIMLIK.test(String(c.musteri_id || ''))) };
    } catch (e) { var hataMetni = String((e && e.message) || e).slice(0, 200); }
  }
  const r = await env.DB.prepare('SELECT musteri_id, marka FROM ana_musteri').all();
  return { kaynak: r.results.length ? 'onbellek' : 'yok', liste: r.results, hata: hataMetni || (yazmaKurulu(env) ? null : 'IDOS yazma bağlantısı kurulu değil; eşler yalnız önbellekteki markalardan') };
}

function esBul(m, adaylar) {
  const e = epostaNormal(m.eposta), t = telefonNormal(m.telefon), n = adNormal(m.firma || m.ad);
  const esler = [];
  for (const c of adaylar) {
    let neden = null, puan = 0, sinif = null;
    if (e && e === epostaNormal(c.fatura_eposta)) { neden = 'eposta'; puan = 1; sinif = 'kesin'; }
    else if (t && t === telefonNormal(c.telefon)) { neden = 'telefon'; puan = 1; sinif = 'kesin'; }
    else {
      const b = n ? benzerlik(n, adNormal(c.marka)) : 0;
      if (b === 1) { neden = 'ad'; puan = 1; sinif = 'kesin'; }
      else if (b >= 0.85) { neden = 'ad'; puan = b; sinif = 'olasi'; }
      else if (b >= 0.7) { neden = 'ad'; puan = b; sinif = 'zayif'; }
    }
    if (sinif) esler.push({ musteri_id: String(c.musteri_id), marka: c.marka || null, durum: c.durum || null, neden, puan: Math.round(puan * 100) / 100, sinif });
  }
  const sira = { kesin: 0, olasi: 1, zayif: 2 };
  return esler.sort((a, b) => sira[a.sinif] - sira[b.sinif] || b.puan - a.puan).slice(0, 3);
}

export async function tasimaOnizleme(env) {
  const db = env.DB;
  const [kr, dr] = await db.batch([
    db.prepare('SELECT id, firma, ad, eposta, telefon, sektor, kaynak, asama, deger, paket, sorumlu, ana_kayit_id FROM musteriler WHERE arsiv IS NULL ORDER BY COALESCE(firma, ad, eposta)'),
    db.prepare('SELECT t.kart_id, t.karar, t.hedef, t.durum, t.sonuc, g.durum AS gonderim, g.son_hata FROM idos_tasima t LEFT JOIN idos_gonderim g ON g.kart_id = t.kart_id')
  ]);
  const onceki = new Map(dr.results.map((x) => [x.kart_id, x]));
  const { kaynak, liste, hata: kaynakHata } = await idosAdaylari(env);
  const sayilar = { toplam: kr.results.length, bagli: 0, kesin: 0, olasi: 0, zayif: 0, eslesmesiz: 0, hatali: 0, kaybedildi: 0, firsat: 0 };
  const satirlar = [];
  for (const m of kr.results) {
    if (m.ana_kayit_id) { sayilar.bagli++; continue; }
    const { hata: gh } = musteriGovdesi(m);
    const esler = gh ? [] : esBul(m, liste);
    const sinif = gh ? 'hatali' : esler.length ? esler[0].sinif : 'eslesmesiz';
    sayilar[sinif]++;
    const f = firsatGovdesi(m);
    if (f) sayilar.firsat++;
    if (m.asama === 'kaybedildi') sayilar.kaybedildi++;
    const karar = sinif === 'kesin' ? 'esle' : sinif === 'eslesmesiz' || sinif === 'zayif' ? 'yeni' : 'atla';
    const o = onceki.get(m.id);
    satirlar.push({ id: m.id, firma: m.firma, ad: m.ad, eposta: m.eposta, telefon: m.telefon, asama: m.asama, sinif, hata: gh || null, esler, karar,
      kaybedildi: m.asama === 'kaybedildi', firsat: f ? { ad: f.ad, asama: f.asama, not_metni: f.not_metni, tutar: '—' } : null,
      tasima: o ? { karar: o.karar, durum: o.durum, sonuc: o.sonuc } : null });
  }
  return { ok: true, kaynak, kaynak_hata: kaynakHata || null, zaman: simdi(), yazma_kurulu: yazmaKurulu(env), sayilar, satirlar };
}

const KARARLAR = new Set(['esle', 'yeni', 'atla']);
// Kararlar kaydedilir; ardından en çok `parca` bekleyen satır işlenir. Tamamlanan satır yeniden işlenmez (idempotent, kaldığı yerden).
export async function tasimaUygula(env, govde, kim) {
  if (!superMi(kim)) return { kod: 403, hata: 'Taşımayı yalnız süper yönetici onaylar' };
  const db = env.DB, z = simdi();
  const parca = Math.max(1, Math.min(Number(govde && govde.parca) || 10, 25));
  const kararlar = Array.isArray(govde && govde.kararlar) ? govde.kararlar.slice(0, 2000) : [];
  const q = [];
  for (const k of kararlar) {
    const id = String((k && k.id) || ''), karar = k && k.karar, hedef = k && k.hedef ? String(k.hedef) : null;
    if (!KIMLIK.test(id) || !KARARLAR.has(karar) || (karar === 'esle' && !KIMLIK.test(hedef || ''))) continue;
    // Tamamlanmış satırın kararı değişmez; yalnız bekleyen / hatalı / atlanan satır güncellenir.
    q.push(db.prepare(`INSERT INTO idos_tasima (kart_id, karar, hedef, durum, sonuc, karar_veren, zaman) VALUES (?, ?, ?, ?, NULL, ?, ?)
      ON CONFLICT(kart_id) DO UPDATE SET karar = excluded.karar, hedef = excluded.hedef, durum = excluded.durum, sonuc = NULL, karar_veren = excluded.karar_veren, zaman = excluded.zaman
      WHERE idos_tasima.durum != 'tamam'`).bind(id, karar, karar === 'esle' ? hedef : null, karar === 'atla' ? 'atlandi' : 'bekliyor', kim.eposta, z));
  }
  for (let i = 0; i < q.length; i += 50) await db.batch(q.slice(i, i + 50));
  if (kararlar.length) await islemYaz(db, kim.eposta, 'idos_tasima_karar', null, `${q.length} karar kaydedildi`);
  const bekleyen = await db.prepare(`SELECT t.kart_id, t.karar, t.hedef FROM idos_tasima t JOIN musteriler m ON m.id = t.kart_id WHERE t.durum = 'bekliyor' ORDER BY t.kart_id LIMIT ?`).bind(parca).all();
  const islenen = [];
  let bekle = 0;
  for (const s of bekleyen.results) {
    let durum = 'tamam', sonuc;
    if (s.karar === 'esle') {
      const m = await db.prepare('SELECT ana_kayit_id FROM musteriler WHERE id = ?').bind(s.kart_id).first();
      if (m && m.ana_kayit_id) sonuc = 'Zaten bağlı: ' + m.ana_kayit_id;
      else {
        let o = null;
        try { o = yazmaKurulu(env) ? await idosOku(env, `${v2}/${encodeURIComponent(s.hedef)}`) : null; } catch (e) { o = { durum: 0 }; }
        if (!o) { durum = 'hata'; sonuc = 'IDOS yazma bağlantısı kurulu değil; eş doğrulanamadı'; }
        else if (o.durum === 404) { durum = 'hata'; sonuc = 'Eşlenecek IDOS kaydı bulunamadı'; }
        else if (o.durum !== 200) { durum = 'hata'; sonuc = 'IDOS kaydı doğrulanamadı'; }
        else {
          await db.batch([
            db.prepare('UPDATE musteriler SET ana_kayit_id = ?, guncelleme = ? WHERE id = ? AND ana_kayit_id IS NULL').bind(s.hedef, simdi(), s.kart_id),
            db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), s.kart_id, simdi(), 'sistem', 'Taşıma: mevcut IDOS kaydına bağlandı', 'IDOS ana kayıt: ' + s.hedef, kim.eposta)
          ]);
          sonuc = 'Eşlendi: ' + s.hedef;
        }
      }
    } else {
      const r = await tekKayitGonder(env, s.kart_id, kim, { firsat: true });
      if (r.kod === 429) { bekle = 60; islenen.push({ id: s.kart_id, durum: 'bekliyor', sonuc: r.hata }); break; }
      if (r.durum === 'gonderildi' || r.durum === 'bagli') sonuc = (r.durum === 'bagli' ? 'Zaten bağlı: ' : 'Aday açıldı: ') + r.ana_kayit_id + (r.firsat === 'bekliyor' ? ' · fırsat bekliyor' : r.firsat ? ' · fırsat eklendi' : '');
      else { durum = 'hata'; sonuc = r.hata || 'Gönderilemedi'; }
    }
    await db.prepare('UPDATE idos_tasima SET durum = ?, sonuc = ?, zaman = ? WHERE kart_id = ?').bind(durum, String(sonuc).slice(0, 300), simdi(), s.kart_id).run();
    islenen.push({ id: s.kart_id, durum, sonuc });
  }
  const [kalan, tum] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS n FROM idos_tasima t JOIN musteriler m ON m.id = t.kart_id WHERE t.durum = 'bekliyor'`),
    db.prepare('SELECT t.kart_id AS id, t.karar, t.hedef, t.durum, t.sonuc, m.firma, m.ad FROM idos_tasima t LEFT JOIN musteriler m ON m.id = t.kart_id ORDER BY t.kart_id')
  ]);
  const ozet = {};
  for (const x of tum.results) ozet[x.durum] = (ozet[x.durum] || 0) + 1;
  if (islenen.length) await islemYaz(db, kim.eposta, 'idos_tasima_uygula', null, `${islenen.length} kayıt işlendi · kalan ${kalan.results[0].n}`);
  return { kod: 200, ok: true, islenen, kalan: kalan.results[0].n, bekle, ozet, sonuclar: tum.results };
}

export async function yonetimTekKayitApi(db, env, yontem, yol, govde, kim) {
  let m = yol.match(/^musteriler\/([\w-]+)\/idos-gonder$/);
  if (m && yontem === 'POST') {
    const r = await tekKayitGonder(env, m[1], kim, { firsat: true });
    if (r.durum === 'yok') return hata('Müşteri bulunamadı', 404);
    return json({ ok: true, idos: r });
  }
  m = yol.match(/^musteriler\/([\w-]+)\/kazanildi$/);
  if (m && yontem === 'POST') {
    const r = await kazanildi(env, m[1], kim);
    return r.kod === 200 ? json({ ok: true, durum: r.durum }) : hata(r.hata, r.kod);
  }
  if (yol === 'tek-kayit/tasima/onizleme' && yontem === 'GET') return json({ ...(await tasimaOnizleme(env)), super: superMi(kim) });
  if (yol === 'tek-kayit/tasima/uygula' && yontem === 'POST') {
    const r = await tasimaUygula(env, govde, kim);
    if (r.kod !== 200) return hata(r.hata, r.kod);
    const { kod, ...geri } = r;
    return json(geri);
  }
  return null;
}
