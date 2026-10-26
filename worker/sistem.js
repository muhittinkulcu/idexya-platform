// Yönetim paneli sistem modülleri: İşlem geçmişi, Bildirimler, Ayarlar, Entegrasyonlar / Veri eşitleme ve Medya kütüphanesi.
// Bildirimler ve entegrasyon durumları kayıtlı veriden ve ortam ayarlarından hesaplanır; gizli değerler asla döndürülmez.
import { envanterUyarilari } from './envanter.js';
import { yedekDurum } from './yedek.js';
import { json, hata, simdi, kimlik, kirp, islemYaz, EPOSTA_DESEN } from './ortak.js';
import { reklamKurulu } from './reklam.js';
import { akisKurulu } from './instagram.js';

// Ayarlar: yalnız bu anahtarlar kaydedilebilir (teklif çıktısı ve iletişim bilgisi gibi yerlerde kullanılır).
export const AYARLAR = [
  { k: 'firma_ad', ad: 'Firma adı', vars: 'Idexya | Good Things', sinir: 120 },
  { k: 'firma_unvan', ad: 'Resmî unvan', vars: '', sinir: 200 },
  { k: 'adres', ad: 'Adres', vars: 'Ankara', sinir: 300 },
  { k: 'telefon', ad: 'Telefon', vars: '0507 870 06 29', sinir: 40 },
  { k: 'eposta', ad: 'E-posta', vars: 'info@idexya.com', sinir: 160 },
  { k: 'vergi', ad: 'Vergi dairesi ve numarası', vars: '', sinir: 120 },
  { k: 'kdv', ad: 'Varsayılan KDV oranı (%)', vars: '20', sinir: 5 },
  { k: 'teklif_gecerlilik', ad: 'Teklif geçerlilik süresi (gün)', vars: '15', sinir: 4 },
  { k: 'teklif_notu', ad: 'Teklif alt notu', vars: 'Fiyatlara KDV dahil değildir. Reklam bütçesi hizmet bedeline dahil değildir.', sinir: 1000 }
];

export async function ayarlariOku(db) {
  const r = await db.prepare('SELECT anahtar, deger FROM ayarlar').all();
  const kayit = Object.fromEntries(r.results.map((x) => [x.anahtar, x.deger]));
  return Object.fromEntries(AYARLAR.map((a) => [a.k, kayit[a.k] ?? a.vars]));
}

const tabloVar = async (db, ad) => !!(await db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").bind(ad).first());
const once = (saat) => new Date(Date.now() - saat * 3600000).toISOString();

const MEDYA_GORSEL = /^data:image\/(jpeg|webp|png);base64,([A-Za-z0-9+/=]+)$/;

export async function medyaApi(istek, env, yol) {
  if (istek.method !== 'GET') return hata('Yöntem desteklenmiyor', 405);
  const m = yol.match(/^([\w-]{8,40})$/);
  const k = m && await env.DB.prepare('SELECT veri FROM medya WHERE id = ?').bind(m[1]).first();
  const g = k && MEDYA_GORSEL.exec(k.veri);
  if (!g) return hata('Bulunamadı', 404);
  return new Response(Uint8Array.from(atob(g[2]), (c) => c.charCodeAt(0)), { headers: { 'Content-Type': 'image/' + g[1], 'Cache-Control': 'public, max-age=604800', 'X-Content-Type-Options': 'nosniff' } });
}

export async function yonetimSistemApi(db, env, yontem, yol, govde, kim) {
  // --- İşlem geçmişi ---
  if (yol === 'gecmis' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, zaman, kim, islem, hedef, detay FROM islem_kaydi ORDER BY zaman DESC LIMIT 1000').all();
    return json({ ok: true, kayitlar: r.results });
  }

  // --- Bildirimler: onay bekleyenler ve sistem uyarıları ---
  if (yol === 'bildirimler' && yontem === 'GET') {
    const onay = [], uyari = [];
    const [talep, uye, yorum, cekim] = await db.batch([
      db.prepare("SELECT COUNT(*) AS n, MIN(olusturma) AS en_eski, SUM(CASE WHEN olusturma < ? THEN 1 ELSE 0 END) AS gec FROM talepler WHERE durum = 'yeni'").bind(once(24)),
      db.prepare("SELECT COUNT(*) AS n, MIN(olusturma) AS en_eski FROM uyeler WHERE durum = 'bekliyor'"),
      db.prepare("SELECT COUNT(*) AS n, MIN(zaman) AS en_eski FROM yorumlar WHERE durum = 'bekliyor'"),
      db.prepare('SELECT zaman, durum, mesaj FROM reklam_cekim ORDER BY zaman DESC LIMIT 1')
    ]);
    const t = talep.results[0], u = uye.results[0], y = yorum.results[0];
    if (t.n) onay.push({ tur: 'talep', baslik: `${t.n} yeni talep yanıt bekliyor`, detay: t.gec ? `${t.gec} talep 24 saatten eski; 1 iş günü içinde dönüş sözü veriliyor.` : 'Hepsi son 24 saat içinde geldi.', zaman: t.en_eski, href: '/yonetim/talepler/?sekme=yeni', onem: t.gec ? 'kritik' : 'normal' });
    if (u.n) onay.push({ tur: 'uye', baslik: `${u.n} üyelik başvurusu onay bekliyor`, detay: 'Başvuruyu onaylayın ya da reddedin.', zaman: u.en_eski, href: '/yonetim/uyeler/', onem: 'normal' });
    if (y.n) onay.push({ tur: 'yorum', baslik: `${y.n} yorum yayın onayı bekliyor`, detay: 'Yorumlar onaylanmadan sitede görünmez.', zaman: y.en_eski, href: '/yonetim/icerikler/', onem: 'normal' });
    // Diğer modüllerin tabloları varsa onlardan da bildirim üret (modüller ayrı ayrı kurulabilir).
    if (await tabloVar(db, 'gorevler')) {
      const g = await db.prepare("SELECT COUNT(*) AS n FROM gorevler WHERE durum = 'acik' AND tarih < ?").bind(new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10)).first();
      if (g && g.n) onay.push({ tur: 'gorev', baslik: `${g.n} görevin tarihi geçti`, detay: 'Tamamlayın ya da yeni tarih verin.', href: '/yonetim/gorevler/', onem: 'kritik' });
    }
    if (await tabloVar(db, 'teklifler')) {
      const g = await db.prepare("SELECT COUNT(*) AS n FROM teklifler WHERE durum = 'gonderildi' AND gecerlilik IS NOT NULL AND gecerlilik < ?").bind(new Date().toISOString().slice(0, 10)).first();
      if (g && g.n) onay.push({ tur: 'teklif', baslik: `${g.n} gönderilen teklifin geçerlilik süresi doldu`, detay: 'Müşteriyle görüşüp kabul ya da red olarak işaretleyin.', href: '/yonetim/teklifler/?sekme=gonderildi', onem: 'normal' });
    }
    if (await tabloVar(db, 'hesap_envanteri')) {
      const u = await envanterUyarilari(db);
      const kritik = u.filter((x) => x.onem === 'kritik').length;
      if (u.length) onay.push({ tur: 'envanter', baslik: `Hesap envanterinde ${u.length} uyarı`, detay: kritik ? `${kritik} kritik: biten müşteride açık erişim ya da IDOS ile çelişen hesap.` : 'Uzun süredir bekleyen erişim istekleri var.', href: '/yonetim/hesaplar/', onem: kritik ? 'kritik' : 'normal' });
    }
    if (await tabloVar(db, 'destek_talepleri')) {
      const g = await db.prepare("SELECT COUNT(*) AS n, MIN(guncelleme) AS en_eski FROM destek_talepleri WHERE durum = 'acik'").first();
      if (g && g.n) onay.push({ tur: 'destek', baslik: `${g.n} destek talebi yanıt bekliyor`, detay: 'Müşteri alanından gelen talepleri yanıtlayın.', zaman: g.en_eski, href: '/yonetim/destek/', onem: 'normal' });
    }
    if (await tabloVar(db, 'muhasebe')) {
      const g = await db.prepare("SELECT COUNT(*) AS n FROM muhasebe WHERE tur = 'gelir' AND durum = 'bekliyor' AND vade IS NOT NULL AND vade < ?").bind(new Date().toISOString().slice(0, 10)).first();
      if (g && g.n) onay.push({ tur: 'muhasebe', baslik: `${g.n} alacağın vadesi geçti`, detay: 'Tahsilatı takip edin.', href: '/yonetim/muhasebe/', onem: 'kritik' });
    }
    // Sistem uyarıları
    if (!env.TURNSTILE_SECRET) uyari.push({ baslik: 'Robot doğrulaması (Turnstile) kapalı', detay: 'Formlar yalnız hız sınırıyla korunuyor. Cloudflare Turnstile anahtarlarını tanımlayın.', href: '/yonetim/entegrasyonlar/', onem: 'uyari' });
    if (!env.IP_TUZ) uyari.push({ baslik: 'IP_TUZ gizli değeri tanımlı değil', detay: 'IP adresleri varsayılan tuzla özetleniyor. Cloudflare’de rastgele bir IP_TUZ gizli değeri girin.', href: '/yonetim/entegrasyonlar/', onem: 'uyari' });
    if (!reklamKurulu(env)) uyari.push({ baslik: 'IDOS reklam verisi bağlı değil', detay: 'Genel bakıştaki reklam grafikleri boş kalır. IDOS_BQ_GORUNUM ve IDOS_BQ_ANAHTAR tanımlanmalı.', href: '/yonetim/entegrasyonlar/', onem: 'bilgi' });
    if (akisKurulu(env)) {
      const ih = await db.prepare("SELECT deger, guncelleme FROM ayarlar WHERE anahtar = 'instagram_son_hata'").first();
      if (ih && ih.deger) uyari.push({ baslik: 'Instagram akışı güncellenemedi', detay: ih.deger, zaman: ih.guncelleme, href: '/yonetim/instagram/', onem: 'uyari' });
    }
    const yd = await yedekDurum(env);
    if (!yd.kurulu) uyari.push({ baslik: 'Otomatik veritabanı yedeği kapalı', detay: 'Cloudflare R2 deposu (YEDEK) bağlı değil. Şimdilik Yedekler sayfasından elle yedek indirebilirsiniz.', href: '/yonetim/yedekler/', onem: 'bilgi' });
    else if (!yd.son || Date.parse(yd.son.zaman) < Date.now() - 36 * 3600000) uyari.push({ baslik: 'Son 36 saatte veritabanı yedeği alınmadı', detay: yd.son ? `Son yedek: ${yd.son.anahtar}` : 'Henüz hiç yedek yok.', zaman: yd.son ? yd.son.zaman : null, href: '/yonetim/yedekler/', onem: 'uyari' });
    const c = cekim.results[0];
    if (c && c.durum !== 'tamam') uyari.push({ baslik: 'Son IDOS veri çekimi başarısız', detay: c.mesaj || 'Ayrıntı için Veri eşitleme sayfasına bakın.', zaman: c.zaman, href: '/yonetim/veri-esitleme/', onem: 'kritik' });
    if (await tabloVar(db, 'denetimler')) {
      const d = await db.prepare('SELECT zaman, ozet FROM denetimler ORDER BY zaman DESC LIMIT 1').first();
      if (d) { try { const o = JSON.parse(d.ozet || '{}'); const kritik = (o.agirlik && o.agirlik.kritik) || 0; if (kritik) uyari.push({ baslik: 'Site denetiminde kritik sorunlar var', detay: `${kritik} kritik sorun · site puanı ${o.puan}`, zaman: d.zaman, href: '/yonetim/seo/', onem: 'uyari' }); } catch (e) { /* özet okunamadı */ } }
    }
    return json({ ok: true, onay, uyari });
  }

  // --- Ayarlar ---
  if (yol === 'ayarlar' && yontem === 'GET') return json({ ok: true, alanlar: AYARLAR.map(({ k, ad, sinir }) => ({ k, ad, sinir })), degerler: await ayarlariOku(db) });
  if (yol === 'ayarlar' && yontem === 'POST') {
    const z = simdi(), sorgular = [], degisen = [];
    for (const a of AYARLAR) {
      if (!(a.k in govde)) continue;
      const v = kirp(String(govde[a.k] ?? ''), a.sinir);
      if (a.k === 'eposta' && v && !EPOSTA_DESEN.test(v)) return hata('E-posta adresi geçersiz', 422);
      if ((a.k === 'kdv' || a.k === 'teklif_gecerlilik') && v && !/^\d{1,3}$/.test(v)) return hata(`${a.ad} sayı olmalı`, 422);
      sorgular.push(db.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = excluded.guncelleyen').bind(a.k, v, z, kim.eposta));
      degisen.push(a.k);
    }
    if (!sorgular.length) return hata('Değişiklik yok', 422);
    await db.batch(sorgular);
    await islemYaz(db, kim.eposta, 'ayar_degisti', null, degisen.join(', '));
    return json({ ok: true });
  }

  // --- Entegrasyonlar ve veri eşitleme: yalnız "tanımlı mı" bilgisi; değerlerin kendisi döndürülmez ---
  if (yol === 'entegrasyonlar' && yontem === 'GET') {
    const var_ = (x) => !!(x && String(x).trim());
    const yoneticiSayisi = (env.YONETICILER || '').split(',').map((x) => x.trim()).filter(Boolean).length;
    const cekimler = await db.prepare('SELECT zaman, durum, satir, baslangic, mesaj, tetikleyen FROM reklam_cekim ORDER BY zaman DESC LIMIT 30').all();
    const asistanAy = await db.prepare("SELECT COUNT(*) AS n FROM asistan_mesajlari WHERE rol = 'asistan' AND zaman >= ?").bind(new Date().toISOString().slice(0, 7) + '-01').first();
    return json({ ok: true, cekimler: cekimler.results, liste: [
      { k: 'access', ad: 'Cloudflare Access (panel girişi)', durum: var_(env.TEAM_DOMAIN) && var_(env.POLICY_AUD) && yoneticiSayisi ? 'bagli' : 'eksik', detay: `${yoneticiSayisi} yönetici e-postası tanımlı`, ayar: 'TEAM_DOMAIN, POLICY_AUD, YONETICILER' },
      { k: 'd1', ad: 'Veritabanı (Cloudflare D1)', durum: 'bagli', detay: 'Talepler, CRM, üyeler ve içerikler burada saklanır.' },
      { k: 'turnstile', ad: 'Robot doğrulaması (Cloudflare Turnstile)', durum: var_(env.TURNSTILE_SECRET) ? 'bagli' : 'eksik', detay: 'Formları ve üyelik sayfalarını robotlara karşı korur.', ayar: 'TURNSTILE_SECRET (gizli) ve derleme değişkeni PUBLIC_TURNSTILE_SITE_KEY' },
      { k: 'idos', ad: 'IDOS reklam verisi (BigQuery)', durum: reklamKurulu(env) ? 'bagli' : 'eksik', detay: reklamKurulu(env) ? `Konum: ${env.IDOS_BQ_KONUM || 'europe-west1'}` : 'Genel bakıştaki reklam özetleri için gerekli.', ayar: 'IDOS_BQ_GORUNUM, IDOS_BQ_ANAHTAR (gizli)' },
      { k: 'asistan', ad: 'Yapay zekâ asistanı (Claude)', durum: var_(env.ANTHROPIC_API_KEY) ? 'bagli' : 'eksik', detay: `Bu ay ${asistanAy ? asistanAy.n : 0} yanıt · aylık sınır ${Number(env.ASISTAN_AYLIK_SINIR || 3000)}`, ayar: 'ANTHROPIC_API_KEY (gizli), ASISTAN_AYLIK_SINIR' },
      { k: 'yedek', ad: 'Veritabanı yedeği (R2)', durum: env.YEDEK ? 'bagli' : 'eksik', detay: 'Panel verisi her gün sıkıştırılmış JSON olarak R2 deposuna yazılır; son 30 gün saklanır.', ayar: 'YEDEK (R2 deposu bağlantısı, wrangler.json)' },
      { k: 'instagram', ad: 'Instagram otomatik akışı', durum: akisKurulu(env) ? 'bagli' : 'eksik', detay: 'Sitedeki Instagram bölümü hesabın son gönderilerini kendiliğinden gösterir.', ayar: 'INSTAGRAM_TOKEN (gizli, Instagram profesyonel hesabının uzun ömürlü erişim anahtarı)' },
      { k: 'iptuz', ad: 'IP özetleme tuzu', durum: var_(env.IP_TUZ) ? 'bagli' : 'eksik', detay: 'IP adresleri saklanmaz; hız sınırı için tuzlanmış özeti tutulur.', ayar: 'IP_TUZ (gizli)' },
      { k: 'arama', ad: 'Üye içeriklerinin aramaya açılması', durum: env.ARAMA_ACIK === 'evet' ? 'bagli' : 'kapali', detay: 'Açıkken, “herkese açık” ve “aramaya açık” işaretli içerikler arama motorlarına gösterilir.', ayar: 'ARAMA_ACIK=evet' }
    ] });
  }

  // --- Medya kütüphanesi (görseller D1'de; R2 depolama tanımlı değil) ---
  if (yol === 'medya' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, ad, alt, tur, boyut, genislik, yukseklik, olusturma, ekleyen FROM medya ORDER BY olusturma DESC LIMIT 500').all();
    return json({ ok: true, medya: r.results });
  }
  if (yol === 'medya' && yontem === 'POST') {
    const veri = typeof govde.veri === 'string' ? govde.veri : '', g = MEDYA_GORSEL.exec(veri);
    if (!g) return hata('Görsel gerekli (JPEG, WebP veya PNG)', 422);
    if (veri.length > 280 * 1024) return hata('Görsel çok büyük; daha küçük bir görsel seçin', 413);
    const say = await db.prepare('SELECT COUNT(*) AS n FROM medya').first();
    if (say.n >= 500) return hata('Kütüphane sınırı (500 görsel) doldu; kullanılmayanları silin', 422);
    const id = kimlik(), ad = kirp(govde.ad, 120) || 'görsel';
    await db.prepare('INSERT INTO medya (id, ad, alt, tur, boyut, genislik, yukseklik, veri, olusturma, ekleyen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, ad, kirp(govde.alt, 200) || null, 'image/' + g[1], Math.round(g[2].length * 0.75), Math.min(10000, Number(govde.genislik) || 0), Math.min(10000, Number(govde.yukseklik) || 0), veri, simdi(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'medya_eklendi', id, ad);
    return json({ ok: true, id, url: `/api/medya/${id}` });
  }
  let m = yol.match(/^medya\/([\w-]+)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id FROM medya WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Görsel bulunamadı', 404);
    await db.prepare('UPDATE medya SET ad = ?, alt = ? WHERE id = ?').bind(kirp(govde.ad, 120) || 'görsel', kirp(govde.alt, 200) || null, k.id).run();
    return json({ ok: true });
  }
  m = yol.match(/^medya\/([\w-]+)\/sil$/);
  if (m && yontem === 'POST') {
    // İçeriklerde kullanılıyorsa uyar (zorla silmek için govde.zorla)
    const kullanan = await db.prepare('SELECT baslik FROM icerikler WHERE govde LIKE ? LIMIT 5').bind(`%/api/medya/${m[1]}%`).all();
    if (kullanan.results.length && govde.zorla !== true) return json({ ok: false, hata: 'Bu görsel içeriklerde kullanılıyor', kullanan: kullanan.results.map((x) => x.baslik) }, 409);
    const r = await db.prepare('DELETE FROM medya WHERE id = ?').bind(m[1]).run();
    if (!r.meta || !r.meta.changes) return hata('Görsel bulunamadı', 404);
    await islemYaz(db, kim.eposta, 'medya_silindi', m[1]);
    return json({ ok: true });
  }
  return null;
}
