// Reklam dönüşümü kapalı döngüsü (Muhittin, 26 Eki 2026). Ziyaretçi pazarlama çerezlerine izin verdiyse site, reklam tıklama
// kimliklerini (gclid, gbraid, wbraid, fbclid) ve UTM bilgisini tarayıcıda saklar; form gönderilirse talebe eklenir (talep_reklam).
// Talep CRM'de "Kazanıldı" olduğunda Google Ads çevrimdışı dönüşüm ve Meta çevrimdışı etkinlik CSV'si üretilir.
// Dışa aktarılan dosyada e-posta ve telefon YOKTUR; eşleşme yalnız tıklama kimliğiyle yapılır. Platforma yükleme elle yapılır.
import { json, hata, simdi, kirp, islemYaz } from './ortak.js';

const KIMLIK = /^[A-Za-z0-9_\-.]{10,300}$/;
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const GUN = 86400000, GOOGLE_PENCERE = 90 * GUN;

// İstemciden gelen reklam bilgisini doğrular; geçerli alan yoksa null.
export function reklamTemizle(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const v = {};
  for (const k of ['gclid', 'gbraid', 'wbraid', 'fbclid']) if (typeof r[k] === 'string' && KIMLIK.test(r[k])) v[k] = r[k];
  for (const k of UTM) if (typeof r[k] === 'string' && r[k].trim()) v[k] = kirp(r[k], 150);
  const z = Number(r.zaman);
  v.zaman = Number.isFinite(z) && z > Date.now() - 100 * GUN && z <= Date.now() + 60000 ? new Date(z).toISOString() : simdi();
  return v.gclid || v.gbraid || v.wbraid || v.fbclid || v.utm_source ? v : null;
}

export const talepReklamSorgu = (db, talepId, v) => db.prepare(`INSERT INTO talep_reklam (talep_id, gclid, gbraid, wbraid, fbclid, utm_source, utm_medium, utm_campaign, utm_term, utm_content, tiklama_zamani)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(talepId, v.gclid || null, v.gbraid || null, v.wbraid || null, v.fbclid || null, v.utm_source || null, v.utm_medium || null, v.utm_campaign || null, v.utm_term || null, v.utm_content || null, v.zaman);

// Kazanılan müşterilere bağlı, tıklama kimliği olan talepler. Dönüşüm zamanı: kabul edilen son teklifin kararı, yoksa
// aşamanın "Kazanıldı" olduğu kayıt, yoksa müşterinin son güncellemesi. Değer: kabul edilen tekliflerin KDV hariç toplamı, yoksa CRM değeri.
async function adaylar(db) {
  const r = await db.prepare(`SELECT t.id AS talep_id, t.olusturma AS talep_zamani, t.kaynak, m.id AS musteri_id, m.firma, m.ad, m.deger, m.guncelleme,
      r.gclid, r.gbraid, r.wbraid, r.fbclid, r.utm_source, r.utm_medium, r.utm_campaign, r.tiklama_zamani,
      (SELECT MAX(karar_zamani) FROM teklifler x WHERE x.musteri_id = m.id AND x.durum = 'kabul') AS kabul_zamani,
      (SELECT SUM(ara_toplam - indirim) FROM teklifler x WHERE x.musteri_id = m.id AND x.durum = 'kabul') AS teklif_degeri,
      (SELECT MAX(zaman) FROM kayitlar k WHERE k.musteri_id = m.id AND k.baslik = 'Aşama değişti' AND k.detay LIKE '%→ Kazanıldı%') AS asama_zamani,
      (SELECT zaman FROM donusum_aktarim a WHERE a.talep_id = t.id AND a.platform = 'google') AS google_aktarim,
      (SELECT zaman FROM donusum_aktarim a WHERE a.talep_id = t.id AND a.platform = 'meta') AS meta_aktarim
    FROM talep_reklam r JOIN talepler t ON t.id = r.talep_id LEFT JOIN musteriler m ON m.id = t.musteri_id
    ORDER BY t.olusturma DESC LIMIT 2000`).all();
  return r.results.map((x) => {
    const kazanildi = !!x.musteri_id && (x.kabul_zamani || x.asama_zamani) ? true : false;
    const donusum = x.kabul_zamani || x.asama_zamani || null;
    const deger = x.teklif_degeri ? Math.round(x.teklif_degeri * 100) / 100 : x.deger || null;
    const pencereDisi = !!(donusum && x.gclid && Date.parse(donusum) - Date.parse(x.tiklama_zamani) > GOOGLE_PENCERE);
    return { ...x, kazanildi, donusum_zamani: donusum, deger, pencere_disi: pencereDisi };
  });
}

// "yyyy-MM-dd HH:mm:ss" İstanbul saati (Google Ads şablonu, Parameters:TimeZone=Europe/Istanbul).
const istSaat = (iso) => new Date(Date.parse(iso) + 3 * 3600000).toISOString().replace('T', ' ').slice(0, 19);
const csvHucre = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s; };
const csv = (satirlar) => satirlar.map((s) => s.map(csvHucre).join(',')).join('\r\n') + '\r\n';
const dosya = (ad, govde) => new Response('﻿' + govde, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${ad}"`, 'Cache-Control': 'no-store' } });

export async function yonetimDonusumApi(db, yontem, yol, govde, kim, istek) {
  if (!(yol === 'donusum' || yol.startsWith('donusum/'))) return null;
  if (yol === 'donusum' && yontem === 'GET') {
    const a = await adaylar(db);
    const ozet = await db.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN gclid IS NOT NULL OR gbraid IS NOT NULL OR wbraid IS NOT NULL THEN 1 ELSE 0 END) AS google, SUM(CASE WHEN fbclid IS NOT NULL THEN 1 ELSE 0 END) AS meta FROM talep_reklam").first();
    return json({ ok: true, adaylar: a, ozet });
  }
  const m = yol.match(/^donusum\/csv\/(google|meta)$/);
  if (m && yontem === 'GET') {
    const u = new URL(istek.url), tumu = u.searchParams.get('tumu') === '1';
    const ad = kirp(u.searchParams.get('ad') || '', 100) || (m[1] === 'google' ? 'Müşteri kazanıldı' : 'Purchase');
    const a = (await adaylar(db)).filter((x) => x.kazanildi && x.donusum_zamani && (tumu || !(m[1] === 'google' ? x.google_aktarim : x.meta_aktarim)));
    let govdeCsv;
    if (m[1] === 'google') {
      const satir = a.filter((x) => x.gclid && !x.pencere_disi && Date.parse(x.donusum_zamani) >= Date.parse(x.tiklama_zamani));
      govdeCsv = 'Parameters:TimeZone=Europe/Istanbul\r\n' + csv([['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency'],
        ...satir.map((x) => [x.gclid, ad, istSaat(x.donusum_zamani), x.deger ?? '', x.deger ? 'TRY' : ''])]);
    } else {
      const satir = a.filter((x) => x.fbclid);
      govdeCsv = csv([['event_name', 'event_time', 'value', 'currency', 'fbc'],
        ...satir.map((x) => [ad, Math.floor(Date.parse(x.donusum_zamani) / 1000), x.deger ?? '', x.deger ? 'TRY' : '', `fb.1.${Date.parse(x.tiklama_zamani)}.${x.fbclid}`])]);
    }
    await islemYaz(db, kim.eposta, 'donusum_csv', m[1], `${m[1] === 'google' ? 'Google Ads' : 'Meta'} CSV indirildi${tumu ? ' (tümü)' : ''}`);
    return dosya(`idexya-donusum-${m[1]}-${new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10)}.csv`, govdeCsv);
  }
  // Platforma yüklenen satırlar işaretlenir; bir sonraki CSV'ye yeniden girmez.
  if (yol === 'donusum/isaretle' && yontem === 'POST') {
    const platform = govde.platform;
    if (!['google', 'meta'].includes(platform)) return hata('Platform geçersiz', 422);
    const idler = Array.isArray(govde.talepler) ? govde.talepler.filter((x) => typeof x === 'string' && /^[\w-]{1,64}$/.test(x)).slice(0, 2000) : [];
    if (!idler.length) return hata('İşaretlenecek talep yok', 422);
    const z = simdi();
    await db.batch(idler.map((id) => db.prepare('INSERT INTO donusum_aktarim (talep_id, platform, zaman, kim) VALUES (?, ?, ?, ?) ON CONFLICT(talep_id, platform) DO NOTHING').bind(id, platform, z, kim.eposta)));
    await islemYaz(db, kim.eposta, 'donusum_isaretlendi', platform, `${idler.length} dönüşüm yüklendi olarak işaretlendi`);
    return json({ ok: true, adet: idler.length });
  }
  return hata('Bulunamadı', 404);
}
