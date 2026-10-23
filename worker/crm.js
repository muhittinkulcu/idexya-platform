// CRM yardımcı modülleri (23 Eki 2026):
// · IDOS eşitleme: reklam_ozet'teki reklam hesapları (platform + hesap) IDP CRM müşterisiyle elle eşleştirilir (reklam_eslesme).
//   IDOS'un müşteri tablosu (kişisel veri) hiçbir zaman okunmaz; yalnız D1'deki reklam özeti kullanılır.
// · Çakışmalar: aynı e-posta, telefon veya firma adına sahip olası mükerrer müşteri kartları bulunur ve tek işlemde birleştirilir.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';
import { reklamKurulu } from './reklam.js';

const GUN = 28;
// İstanbul saatine göre son 28 günün ilk günü (reklam_ozet.gun YYYY-AA-GG).
const baslangicGunu = () => new Date(Date.now() + 3 * 3600000 - GUN * 86400000).toISOString().slice(0, 10);

// Firma/marka adı karşılaştırma biçimi: Türkçe küçük harf, aksansız, noktalama yok, sondaki şirket türü ekleri atılmış.
const EKLER = new Set(['ltd', 'sti', 'limited', 'sirketi', 'sirket', 'as', 'a', 's', 'anonim', 'san', 'sanayi', 'tic', 'ticaret', 've', 'inc', 'llc', 'gmbh', 'co', 'corp', 'company', 'pazarlama', 'dis', 'ith', 'ihr']);
export function adNormal(metin) {
  let t = String(metin || '').toLocaleLowerCase('tr-TR');
  t = t.replace(/a\.\s*ş\.?/g, ' as ').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const p = t.replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  while (p.length > 1 && EKLER.has(p[p.length - 1])) p.pop();
  return p.join(' ');
}
const ikili = (s) => { const t = s.replace(/ /g, ''), b = []; for (let i = 0; i < t.length - 1; i++) b.push(t.slice(i, i + 2)); return b; };
// 0–1 arası benzerlik (Dice katsayısı; biri ötekini tümüyle içeriyorsa en az 0,85).
export function benzerlik(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const kisa = a.length < b.length ? a : b, uzun = a.length < b.length ? b : a;
  const icerir = kisa.length >= 4 && (` ${uzun} `.includes(` ${kisa} `) || uzun.replace(/ /g, '').includes(kisa.replace(/ /g, '')));
  const x = ikili(a), y = ikili(b);
  if (!x.length || !y.length) return icerir ? 0.85 : 0;
  const say = new Map(); x.forEach((g) => say.set(g, (say.get(g) || 0) + 1));
  let ortak = 0; y.forEach((g) => { const n = say.get(g); if (n) { ortak++; say.set(g, n - 1); } });
  const d = (2 * ortak) / (x.length + y.length);
  return icerir ? Math.max(d, 0.85) : d;
}
// Telefon: yalnız rakam; +90 / 0090 / 0 öneki atılır (Türkiye numarası 10 hane kalır).
export function telefonNormal(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (d.startsWith('0090')) d = d.slice(4);
  else if (d.startsWith('90') && d.length === 12) d = d.slice(2);
  else if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  return d.length >= 7 ? d : '';
}
const epostaNormal = (e) => String(e || '').trim().toLowerCase();
const musteriAdi = (m) => m.firma || m.ad || m.eposta || m.telefon || 'Adsız müşteri';

// --- Birleştirme: musteri_id sütunu olan tablolar çalışma anında bulunur (başka modüllerin tabloları olsa da olmasa da çalışır).
// reklam_ozet.musteri_id IDOS'un kendi müşteri numarasıdır, IDP kimliği değildir: taşınmaz.
const TASINMAZ = new Set(['musteriler', 'reklam_ozet']);
async function musteriTablolari(db) {
  const r = await db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
  return r.results.filter((t) => !TASINMAZ.has(t.name) && /^[A-Za-z_][A-Za-z0-9_]*$/.test(t.name) && /[\s(,]musteri_id\s/i.test(t.sql || '')).map((t) => t.name);
}
const DOLDURULAN = { firma: 'Firma', ad: 'Yetkili kişi', eposta: 'E-posta', telefon: 'Telefon', sektor: 'Sektör', kaynak: 'Kaynak', deger: 'Tahmini değer', paket: 'Paket', sorumlu: 'Sorumlu' };
const bosMu = (v) => v === null || v === undefined || v === '';
const ciftAnahtar = (a, b) => (a < b ? [a, b] : [b, a]);

export async function yonetimCrmApi(db, env, yontem, yol, govde, kim) {
  // --- IDOS eşitleme ---
  if (yol === 'crm/idos' && yontem === 'GET') {
    const [h, e, m] = await db.batch([
      db.prepare(`SELECT platform, hesap, para, MAX(marka) AS marka, SUM(harcama) AS harcama, MAX(gun) AS son_gun
        FROM reklam_ozet WHERE gun >= ? GROUP BY platform, hesap, para ORDER BY platform, hesap`).bind(baslangicGunu()),
      db.prepare('SELECT platform, hesap, musteri_id, eslestiren, zaman FROM reklam_eslesme'),
      db.prepare('SELECT id, firma, ad, eposta FROM musteriler ORDER BY COALESCE(firma, ad, eposta)')
    ]);
    const esles = new Map(e.results.map((x) => [x.platform + '|' + x.hesap, x]));
    const musAd = new Map(m.results.map((x) => [x.id, musteriAdi(x)]));
    const adaylar = m.results.map((x) => ({ id: x.id, n: [adNormal(x.firma), adNormal(x.ad)].filter(Boolean) }));
    const hesaplar = new Map();
    for (const x of h.results) {
      const k = x.platform + '|' + x.hesap;
      const o = hesaplar.get(k) || { platform: x.platform, hesap: x.hesap, marka: null, son_gun: null, paralar: [] };
      o.marka = o.marka || x.marka; o.son_gun = !o.son_gun || x.son_gun > o.son_gun ? x.son_gun : o.son_gun;
      o.paralar.push({ para: x.para, harcama: x.harcama });
      hesaplar.set(k, o);
    }
    const liste = [...hesaplar.values()].map((o) => {
      const es = esles.get(o.platform + '|' + o.hesap);
      let oneri = null;
      const n = adNormal(o.marka);
      if (!es && n) {
        for (const a of adaylar) {
          const puan = Math.max(0, ...a.n.map((x) => benzerlik(n, x)));
          if (puan >= 0.6 && (!oneri || puan > oneri.puan)) oneri = { musteri_id: a.id, ad: musAd.get(a.id), puan: Math.round(puan * 100) / 100 };
        }
      }
      return { ...o, musteri_id: es ? es.musteri_id : null, musteri_ad: es ? musAd.get(es.musteri_id) || null : null, eslestiren: es ? es.eslestiren : null, eslesme_zamani: es ? es.zaman : null, oneri };
    });
    // reklam_ozet'te artık görünmeyen ama eşleşmesi duran hesaplar da listelenir (çözülebilsin diye).
    for (const [k, es] of esles) if (!hesaplar.has(k)) liste.push({ platform: es.platform, hesap: es.hesap, marka: null, son_gun: null, paralar: [], musteri_id: es.musteri_id, musteri_ad: musAd.get(es.musteri_id) || null, eslestiren: es.eslestiren, eslesme_zamani: es.zaman, oneri: null, eski: true });
    return json({ ok: true, kurulu: reklamKurulu(env), gun: GUN, hesaplar: liste, musteriler: m.results.map((x) => ({ id: x.id, ad: musteriAdi(x), alt: x.firma && x.ad ? x.ad : x.eposta || '' })) });
  }
  if ((yol === 'crm/idos/esle' || yol === 'crm/idos/coz') && yontem === 'POST') {
    const platform = kirp(govde.platform, 40), hesap = kirp(govde.hesap, 120);
    if (!platform || !hesap) return hata('Reklam hesabı seçilmedi', 422);
    const z = simdi();
    if (yol === 'crm/idos/coz') {
      const es = await db.prepare('SELECT musteri_id FROM reklam_eslesme WHERE platform = ? AND hesap = ?').bind(platform, hesap).first();
      if (!es) return hata('Bu hesap zaten eşleşmemiş', 404);
      await db.batch([
        db.prepare('DELETE FROM reklam_eslesme WHERE platform = ? AND hesap = ?').bind(platform, hesap),
        db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) SELECT ?, id, ?, ?, ?, ?, ? FROM musteriler WHERE id = ?').bind(kimlik(), z, 'sistem', 'IDOS reklam hesabı eşleşmesi kaldırıldı', `${platform} · ${hesap}`, kim.eposta, es.musteri_id)
      ]);
      await islemYaz(db, kim.eposta, 'idos_coz', es.musteri_id, `${platform} · ${hesap}`);
      return json({ ok: true });
    }
    const musteriId = kirp(govde.musteri_id, 64);
    const [hs, mu] = await db.batch([
      db.prepare('SELECT 1 AS v FROM reklam_ozet WHERE platform = ? AND hesap = ? LIMIT 1').bind(platform, hesap),
      db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteriId)
    ]);
    if (!hs.results.length) return hata('Bu reklam hesabı IDOS özetinde yok', 404);
    if (!mu.results.length) return hata('Müşteri bulunamadı', 404);
    await db.batch([
      db.prepare(`INSERT INTO reklam_eslesme (platform, hesap, musteri_id, eslestiren, zaman) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (platform, hesap) DO UPDATE SET musteri_id = excluded.musteri_id, eslestiren = excluded.eslestiren, zaman = excluded.zaman`).bind(platform, hesap, musteriId, kim.eposta, z),
      db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), musteriId, z, 'sistem', 'IDOS reklam hesabı eşleştirildi', `${platform} · ${hesap}`, kim.eposta),
      db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, musteriId)
    ]);
    await islemYaz(db, kim.eposta, 'idos_esle', musteriId, `${platform} · ${hesap}`);
    return json({ ok: true });
  }
  // Müşteri kartındaki "Reklam özeti (IDOS)": eşleşen hesapların son 28 günü, platform + para birimi ayrı (kura çevrilmez).
  let m = yol.match(/^musteriler\/([\w-]+)\/reklam$/);
  if (m && yontem === 'GET') {
    const [h, o] = await db.batch([
      db.prepare('SELECT platform, hesap, zaman FROM reklam_eslesme WHERE musteri_id = ? ORDER BY platform, hesap').bind(m[1]),
      db.prepare(`SELECT r.platform, r.para, SUM(r.harcama) AS harcama, SUM(r.gosterim) AS gosterim, SUM(r.tiklama) AS tiklama, MAX(r.gun) AS son_gun
        FROM reklam_ozet r JOIN reklam_eslesme e ON e.platform = r.platform AND e.hesap = r.hesap
        WHERE e.musteri_id = ? AND r.gun >= ? GROUP BY r.platform, r.para ORDER BY r.platform, r.para`).bind(m[1], baslangicGunu())
    ]);
    return json({ ok: true, gun: GUN, hesaplar: h.results, ozet: o.results });
  }

  // --- Çakışmalar ---
  if (yol === 'crm/cakisma' && yontem === 'GET') {
    const [mr, ar] = await db.batch([
      db.prepare('SELECT id, firma, ad, eposta, telefon, asama, kaynak, deger, olusturma, guncelleme FROM musteriler'),
      db.prepare('SELECT a, b FROM cakisma_ayri')
    ]);
    const ayri = new Set(ar.results.map((x) => x.a + '|' + x.b));
    const anahtar = new Map(); // "tur:deger" -> [id]
    const ekle = (tur, deger, id) => { if (!deger) return; const k = tur + ':' + deger; anahtar.set(k, [...(anahtar.get(k) || []), id]); };
    for (const x of mr.results) {
      ekle('eposta', epostaNormal(x.eposta), x.id);
      ekle('telefon', telefonNormal(x.telefon), x.id);
      const f = adNormal(x.firma); if (f.length >= 3) ekle('firma', f, x.id);
    }
    const ciftler = new Map(); // "a|b" -> Set(neden)
    for (const [k, ids] of anahtar) {
      if (ids.length < 2) continue;
      const tur = k.split(':')[0];
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const c = ciftAnahtar(ids[i], ids[j]).join('|');
        if (ayri.has(c)) continue;
        ciftler.set(c, (ciftler.get(c) || new Set()).add(tur));
      }
    }
    // Birbirine bağlı kartlar tek grupta (birleşim-bul).
    const ata = new Map(); const bul = (x) => { while (ata.get(x) !== x) { ata.set(x, ata.get(ata.get(x))); x = ata.get(x); } return x; };
    for (const c of ciftler.keys()) { const [a, b] = c.split('|'); [a, b].forEach((x) => { if (!ata.has(x)) ata.set(x, x); }); ata.set(bul(a), bul(b)); }
    const gruplar = new Map();
    for (const id of ata.keys()) { const k = bul(id); gruplar.set(k, [...(gruplar.get(k) || []), id]); }
    const kart = new Map(mr.results.map((x) => [x.id, x]));
    const liste = [...gruplar.values()].map((ids) => {
      const nedenler = new Set();
      const iliski = [];
      for (const [c, n] of ciftler) { const [a, b] = c.split('|'); if (ids.includes(a)) { n.forEach((t) => nedenler.add(t)); iliski.push({ a, b, nedenler: [...n] }); } }
      return { musteriler: ids.map((id) => kart.get(id)).sort((a, b) => (a.olusturma < b.olusturma ? -1 : 1)), nedenler: [...nedenler], ciftler: iliski };
    }).sort((a, b) => b.musteriler.length - a.musteriler.length);
    return json({ ok: true, gruplar: liste, ayriSayisi: ayri.size });
  }
  if (yol === 'crm/cakisma/ayri' && yontem === 'POST') {
    const ids = Array.isArray(govde.idler) ? [...new Set(govde.idler.filter((x) => typeof x === 'string' && /^[\w-]{1,64}$/.test(x)))].slice(0, 50) : [];
    if (ids.length < 2) return hata('En az iki müşteri seçilmeli', 422);
    const z = simdi(), q = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = ciftAnahtar(ids[i], ids[j]);
      q.push(db.prepare('INSERT OR IGNORE INTO cakisma_ayri (a, b, isaretleyen, zaman) VALUES (?, ?, ?, ?)').bind(a, b, kim.eposta, z));
    }
    await db.batch(q);
    await islemYaz(db, kim.eposta, 'cakisma_ayri', ids[0], ids.join(', '));
    return json({ ok: true });
  }
  if (yol === 'crm/cakisma/birlestir' && yontem === 'POST') {
    const tutId = kirp(govde.tut, 64);
    const kaynaklar = Array.isArray(govde.birlestir) ? [...new Set(govde.birlestir.filter((x) => typeof x === 'string' && x !== tutId))].slice(0, 20) : [];
    if (!tutId || !kaynaklar.length) return hata('Tutulacak kart ve birleştirilecek kart seçilmeli', 422);
    const kartlar = (await db.prepare(`SELECT * FROM musteriler WHERE id IN (${[tutId, ...kaynaklar].map(() => '?').join(',')})`).bind(tutId, ...kaynaklar).all()).results;
    const tut = kartlar.find((x) => x.id === tutId);
    if (!tut || kartlar.length !== kaynaklar.length + 1) return hata('Kartlardan biri bulunamadı; sayfayı yenileyin', 404);
    const tablolar = await musteriTablolari(db);
    const ph = kaynaklar.map(() => '?').join(',');
    // Taşınacak satır sayıları (günlük notu için)
    const sayim = await db.batch(tablolar.map((t) => db.prepare(`SELECT COUNT(*) AS n FROM "${t}" WHERE musteri_id IN (${ph})`).bind(...kaynaklar)));
    const tasinan = tablolar.map((t, i) => [t, sayim[i].results[0].n]).filter(([, n]) => n > 0);
    // Tutulan kartın boş alanları birleştirilen kartlardan (en eskiden başlayarak) doldurulur.
    const yeni = {}, dolan = [];
    const sirali = kartlar.filter((x) => x.id !== tutId).sort((a, b) => (a.olusturma < b.olusturma ? -1 : 1));
    for (const a of Object.keys(DOLDURULAN)) {
      if (!bosMu(tut[a])) continue;
      const k = sirali.find((x) => !bosMu(x[a]));
      if (k) { yeni[a] = k[a]; dolan.push(DOLDURULAN[a]); }
    }
    const enEski = kartlar.reduce((e, x) => (x.olusturma < e ? x.olusturma : e), tut.olusturma);
    const z = simdi();
    const set = Object.keys(yeni).map((a) => `${a} = ?`).concat(['olusturma = ?', 'guncelleme = ?']).join(', ');
    const tabloAdi = { kayitlar: 'günlük kaydı', talepler: 'talep', reklam_eslesme: 'reklam hesabı', uye_musteri: 'üye bağlantısı', davetler: 'davet' };
    const detay = sirali.map((x) => `${musteriAdi(x)}${x.eposta ? ' <' + x.eposta + '>' : ''}${x.telefon ? ' · ' + x.telefon : ''}`).join('; ') + ' kartı bu karta birleştirildi.'
      + (tasinan.length ? ' Taşınan: ' + tasinan.map(([t, n]) => `${n} ${tabloAdi[t] || t}`).join(', ') + '.' : '')
      + (dolan.length ? ' Doldurulan alanlar: ' + dolan.join(', ') + '.' : '');
    const q = [
      ...tablolar.map((t) => db.prepare(`UPDATE "${t}" SET musteri_id = ? WHERE musteri_id IN (${ph})`).bind(tutId, ...kaynaklar)),
      db.prepare(`UPDATE musteriler SET ${set} WHERE id = ?`).bind(...Object.values(yeni), enEski, z, tutId),
      db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), tutId, z, 'sistem', 'Mükerrer kart birleştirildi', detay, kim.eposta),
      db.prepare(`DELETE FROM cakisma_ayri WHERE a IN (${ph}) OR b IN (${ph})`).bind(...kaynaklar, ...kaynaklar),
      db.prepare(`DELETE FROM musteriler WHERE id IN (${ph})`).bind(...kaynaklar)
    ];
    try { await db.batch(q); }
    catch (e) { console.error('birlestir', e && e.message); return hata('Birleştirilemedi; hiçbir değişiklik yapılmadı. Bağlı kayıtlardan biri taşınamadı.', 409); }
    await islemYaz(db, kim.eposta, 'musteri_birlestir', tutId, `${kaynaklar.join(', ')} → ${tutId}`);
    return json({ ok: true, tasinan: Object.fromEntries(tasinan), doldurulan: dolan });
  }
  return null;
}
