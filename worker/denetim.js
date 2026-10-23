// Site denetimi (SEO, GEO, hız ve güvenlik). Sitenin kendi sayfaları dış internete çıkmadan, Workers Static Assets
// bağlantısı (env.ASSETS) üzerinden okunur: önce robots.txt ve sitemap.xml, sonra sitemap'teki sayfalar, kalan istek
// hakkıyla da sitemap'te olmayan iç bağlantılar. Cloudflare ücretsiz planında bir çalıştırmada en çok 50 alt istek
// yapılabildiği için denetim varsayılan olarak 45 istekle sınırlıdır (DENETIM_ISTEK_SINIRI değişkeniyle, ücretli planda
// en çok 500'e kadar yükseltilebilir). Her çalıştırma "denetimler" tablosuna yazılır; son 20 çalıştırma saklanır.
import { json, hata, simdi, kimlik, islemYaz } from './ortak.js';

const SITE = 'idexya.com';
const VARSAYILAN_SINIR = 45;
const SAKLANAN = 20;
// Denetlenmeyen dinamik adresler: sunucu (worker) üretir, dosya sunucusunda karşılıkları yoktur.
const DINAMIK = /^\/(api|yonetim|uye|kabuk|cdn-cgi)(\/|$)|^\/icerik\/[^/]+/;
// public/_headers dosyasındaki güvenlik başlıkları (beklenen değerler).
const BEKLENEN_BASLIKLAR = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};
// Puan: her sayfa 100'den başlar; sorunun ağırlığına göre düşülür.
const AGIRLIK = { kritik: 25, onemli: 10, oneri: 3 };
const SORUN_AGIRLIK = {
  durum_hata: 'kritik', noindex_sitemapte: 'kritik', kirik_baglanti: 'kritik', baslik_yok: 'kritik',
  aciklama_yok: 'onemli', h1_yok: 'onemli', kanonik_yok: 'onemli', dil_yok: 'onemli', alt_eksik: 'onemli', guvenlik_basligi: 'onemli', cok_agir: 'onemli',
  baslik_kisa: 'oneri', baslik_uzun: 'oneri', aciklama_kisa: 'oneri', aciklama_uzun: 'oneri', h1_coklu: 'oneri', kanonik_farkli: 'oneri',
  og_eksik: 'oneri', jsonld_yok: 'oneri', yonlenen_baglanti: 'oneri', agir: 'oneri', cok_betik: 'oneri', cok_stil: 'oneri'
};
const SORU = /\?\s*$|^(nasıl|neden|niçin|niye|ne |nedir|ne zaman|nerede|kim|kaç|hangi|how|what|why|when|where|which|who)/i;

const yolDuzelt = (p) => { try { return decodeURI(p); } catch (e) { return p; } };

// HTML'i HTMLRewriter ile tek geçişte okur.
async function sayfaOku(yanit, sayfaUrl) {
  const v = { baslik: '', aciklama: null, h1: 0, kanonik: null, dil: null, noindex: false, ogBaslik: false, ogAciklama: false,
    jsonld: [], jsonldHata: 0, altsiz: [], gorsel: 0, betik: 0, stil: 0, baglantilar: new Set(), sorular: [], basliklar: 0 };
  let baslikAc = false, ldMetin = null, hMetin = null;
  const metinBit = (el, f) => el.onEndTag && el.onEndTag(f);
  const rw = new HTMLRewriter()
    .on('html', { element(e) { v.dil = e.getAttribute('lang'); } })
    .on('head > title', { element(e) { baslikAc = true; metinBit(e, () => { baslikAc = false; }); }, text(t) { if (baslikAc) v.baslik += t.text; } })
    .on('meta', { element(e) {
      const ad = (e.getAttribute('name') || '').toLowerCase(), ozellik = (e.getAttribute('property') || '').toLowerCase(), icerik = e.getAttribute('content') || '';
      if (ad === 'description') v.aciklama = icerik;
      if (ad === 'robots' && /noindex/i.test(icerik)) v.noindex = true;
      if (ozellik === 'og:title' && icerik) v.ogBaslik = true;
      if (ozellik === 'og:description' && icerik) v.ogAciklama = true;
    } })
    .on('h1', { element() { v.h1++; } })
    .on('h2, h3', { element(e) { v.basliklar++; hMetin = ''; metinBit(e, () => { const m = hMetin.replace(/\s+/g, ' ').trim(); if (m && SORU.test(m) && v.sorular.length < 30) v.sorular.push(m.slice(0, 140)); hMetin = null; }); }, text(t) { if (hMetin !== null) hMetin += t.text; } })
    .on('link', { element(e) {
      const rel = (e.getAttribute('rel') || '').toLowerCase();
      if (rel === 'canonical') v.kanonik = e.getAttribute('href');
      if (rel.split(/\s+/).includes('stylesheet')) v.stil++;
    } })
    .on('script', { element(e) {
      const tur = (e.getAttribute('type') || '').toLowerCase();
      if (tur === 'application/ld+json') { ldMetin = ''; metinBit(e, () => { ldTur(ldMetin); ldMetin = null; }); return; }
      if (!tur || tur === 'module' || tur.includes('javascript')) v.betik++;
    }, text(t) { if (ldMetin !== null) ldMetin += t.text; } })
    .on('img', { element(e) { v.gorsel++; if (!e.hasAttribute('alt') && v.altsiz.length < 50) v.altsiz.push((e.getAttribute('src') || '(kaynak yok)').slice(0, 160)); } })
    .on('a[href]', { element(e) {
      const h = (e.getAttribute('href') || '').trim();
      if (!h || h.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(h)) return;
      try {
        const u = new URL(h, sayfaUrl);
        if (!/^https?:$/.test(u.protocol)) return;
        if (u.host !== new URL(sayfaUrl).host && u.hostname !== SITE && u.hostname !== 'www.' + SITE) return;
        v.baglantilar.add(u.pathname);
      } catch (e2) { /* geçersiz adres yok sayılır */ }
    } });
  function ldTur(metin) {
    try {
      const gez = (o) => {
        if (Array.isArray(o)) return o.forEach(gez);
        if (!o || typeof o !== 'object') return;
        const t = o['@type'];
        (Array.isArray(t) ? t : t ? [t] : []).forEach((x) => { if (typeof x === 'string' && !v.jsonld.includes(x)) v.jsonld.push(x); });
        Object.values(o).forEach((x) => { if (x && typeof x === 'object') gez(x); });
      };
      gez(JSON.parse(metin));
    } catch (e) { v.jsonldHata++; }
  }
  const metin = await rw.transform(yanit).text();
  v.boyut = new TextEncoder().encode(metin).length;
  v.baslik = v.baslik.replace(/\s+/g, ' ').trim();
  return v;
}

function sitemapOku(xml) {
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  return { gecerli: /<urlset[\s>]/.test(xml) && /<\/urlset>\s*$/.test(xml.trim()), locs };
}

function robotsOku(metin) {
  const satirlar = metin.split(/\r?\n/).map((s) => s.replace(/#.*/, '').trim()).filter(Boolean);
  let ajan = null; const herkes = [];
  const sitemaplar = [];
  for (const s of satirlar) {
    const [k, ...d] = s.split(':'); const deger = d.join(':').trim(); const anahtar = k.trim().toLowerCase();
    if (anahtar === 'user-agent') ajan = deger;
    else if (anahtar === 'disallow' && ajan === '*') herkes.push(deger);
    else if (anahtar === 'sitemap') sitemaplar.push(deger);
  }
  return { engelli: herkes, sitemaplar, tumuKapali: herkes.includes('/') };
}

export async function denetimCalistir(env, host, tetikleyen) {
  const sinir = Math.min(500, Math.max(10, Number(env.DENETIM_ISTEK_SINIRI) || VARSAYILAN_SINIR));
  let istek = 0;
  const kok = 'https://' + (host || SITE);
  const getir = async (yol, yontem = 'GET') => {
    if (istek >= sinir) return null;
    istek++;
    try { return await env.ASSETS.fetch(new Request(kok + yol, { method: yontem, redirect: 'manual' })); }
    catch (e) { return { status: 0, hata: e && e.message, headers: new Headers() }; }
  };
  const baslangic = Date.now();
  const site = { robots: {}, sitemap: {}, sorunlar: [] };

  // robots.txt
  const r = await getir('/robots.txt');
  if (!r || r.status !== 200) { site.robots = { durum: r ? r.status : 0 }; site.sorunlar.push('robots_yok'); }
  else {
    const ro = robotsOku(await r.text());
    site.robots = { durum: 200, engelli: ro.engelli.slice(0, 20), sitemaplar: ro.sitemaplar };
    if (ro.tumuKapali) site.sorunlar.push('robots_kapali');
    if (!ro.sitemaplar.length) site.sorunlar.push('robots_sitemap_yok');
  }

  // sitemap.xml
  const s = await getir('/sitemap.xml');
  let adresler = [];
  if (!s || s.status !== 200) { site.sitemap = { durum: s ? s.status : 0 }; site.sorunlar.push('sitemap_yok'); }
  else {
    const so = sitemapOku(await s.text());
    const yollar = [];
    let yabanci = 0;
    for (const l of so.locs) {
      try { const u = new URL(l); if (u.hostname !== SITE || u.protocol !== 'https:') yabanci++; yollar.push(u.pathname); } catch (e) { yabanci++; }
    }
    const tekrar = yollar.length - new Set(yollar).size;
    adresler = [...new Set(yollar)];
    site.sitemap = { durum: 200, gecerli: so.gecerli, adres: so.locs.length, yabanci, tekrar };
    if (!so.gecerli) site.sorunlar.push('sitemap_gecersiz');
    if (!so.locs.length) site.sorunlar.push('sitemap_bos');
    if (yabanci) site.sorunlar.push('sitemap_yabanci');
    if (tekrar) site.sorunlar.push('sitemap_tekrar');
  }
  if (!adresler.length) adresler = ['/'];
  // Ana sayfa önce; kalan sitemap sırasıyla. Bağlantı denetimi için en az 3 istek ayrılır.
  adresler.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : 0));
  const sayfaHakki = Math.max(1, sinir - istek - 3);
  const denetlenecek = adresler.slice(0, sayfaHakki);
  const atlananSayfa = adresler.length - denetlenecek.length;

  // Sayfalar (aynı anda en çok 6 istek)
  const sayfalar = [];
  const basliklar = { kontrol: 0, eksik: {}, yanlis: {}, ornek: null };
  for (let i = 0; i < denetlenecek.length; i += 6) {
    await Promise.all(denetlenecek.slice(i, i + 6).map(async (yol) => {
      const y = await getir(yol);
      const kayit = { yol: yolDuzelt(yol), durum: y ? y.status : 0, sorunlar: [] };
      sayfalar.push(kayit);
      if (!y || y.status !== 200) { kayit.sorunlar.push({ k: 'durum_hata', d: String(kayit.durum) }); return; }
      // Güvenlik başlıkları: dosya sunucusunun verdiği yanıt üzerinden (public/_headers kuralları uygulanmış hâli).
      const eksik = [];
      basliklar.kontrol++;
      for (const [b, beklenen] of Object.entries(BEKLENEN_BASLIKLAR)) {
        const deger = y.headers.get(b);
        if (!deger) { eksik.push(b); basliklar.eksik[b] = (basliklar.eksik[b] || 0) + 1; }
        else if (deger.toLowerCase().replace(/\s+/g, '') !== beklenen.toLowerCase().replace(/\s+/g, '')) basliklar.yanlis[b] = deger;
      }
      if (!basliklar.ornek) basliklar.ornek = Object.fromEntries(Object.keys(BEKLENEN_BASLIKLAR).map((b) => [b, y.headers.get(b)]));
      const v = await sayfaOku(y, kok + yol);
      Object.assign(kayit, {
        baslik: v.baslik, baslikUzunluk: [...v.baslik].length, aciklama: v.aciklama, aciklamaUzunluk: v.aciklama === null ? null : [...v.aciklama].length,
        h1: v.h1, kanonik: v.kanonik, dil: v.dil, noindex: v.noindex, og: v.ogBaslik && v.ogAciklama, jsonld: v.jsonld, sorular: v.sorular, altBaslik: v.basliklar,
        gorsel: v.gorsel, altsiz: v.altsiz.length, boyut: v.boyut, betik: v.betik, stil: v.stil, baglanti: v.baglantilar.size, _baglantilar: [...v.baglantilar]
      });
      const ekle = (k, d) => kayit.sorunlar.push(d === undefined ? { k } : { k, d });
      if (!v.baslik) ekle('baslik_yok'); else if (kayit.baslikUzunluk < 30) ekle('baslik_kisa', String(kayit.baslikUzunluk)); else if (kayit.baslikUzunluk > 60) ekle('baslik_uzun', String(kayit.baslikUzunluk));
      if (!v.aciklama) ekle('aciklama_yok'); else if (kayit.aciklamaUzunluk < 70) ekle('aciklama_kisa', String(kayit.aciklamaUzunluk)); else if (kayit.aciklamaUzunluk > 160) ekle('aciklama_uzun', String(kayit.aciklamaUzunluk));
      if (!v.h1) ekle('h1_yok'); else if (v.h1 > 1) ekle('h1_coklu', String(v.h1));
      if (!v.kanonik) ekle('kanonik_yok');
      else { try { const ku = new URL(v.kanonik, kok + yol); if (ku.pathname !== yol || ku.hostname !== SITE) ekle('kanonik_farkli', ku.hostname === SITE ? yolDuzelt(ku.pathname) : ku.href.slice(0, 160)); } catch (e) { ekle('kanonik_yok'); } }
      if (!v.dil) ekle('dil_yok');
      if (v.noindex) ekle('noindex_sitemapte');
      if (!(v.ogBaslik && v.ogAciklama)) ekle('og_eksik', [!v.ogBaslik && 'og:title', !v.ogAciklama && 'og:description'].filter(Boolean).join(', '));
      if (!v.jsonld.length) ekle('jsonld_yok', v.jsonldHata ? 'çözümlenemeyen JSON-LD var' : undefined);
      if (v.altsiz.length) ekle('alt_eksik', v.altsiz.slice(0, 10).join(' · '));
      if (v.boyut > 200 * 1024) ekle('cok_agir', String(v.boyut)); else if (v.boyut > 100 * 1024) ekle('agir', String(v.boyut));
      if (v.betik > 10) ekle('cok_betik', String(v.betik));
      if (v.stil > 5) ekle('cok_stil', String(v.stil));
      if (eksik.length) ekle('guvenlik_basligi', eksik.join(', '));
    }));
  }
  sayfalar.sort((a, b) => adresler.indexOf(a.yol) - adresler.indexOf(b.yol));

  // İç bağlantılar: sitemap'te olan ve 200 dönen sayfalar var kabul edilir; sonda "/" eksikse yönlenir.
  const bilinen = new Set(sayfalar.filter((x) => x.durum === 200).map((x) => x.yol));
  const sitemapte = new Set(adresler.map(yolDuzelt));
  const onbellek = new Map();
  const hedefler = new Set();
  sayfalar.forEach((x) => (x._baglantilar || []).forEach((h) => hedefler.add(h)));
  const durumBul = async (ham) => {
    const yol = yolDuzelt(ham);
    if (onbellek.has(yol)) return onbellek.get(yol);
    let d;
    if (DINAMIK.test(yol)) d = 'dinamik';
    else if (bilinen.has(yol)) d = 'var';
    else if (!yol.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(yol) && (bilinen.has(yol + '/') || sitemapte.has(yol + '/'))) d = 'yonlenir';
    else {
      const y = await getir(ham, 'HEAD');
      if (!y) d = 'denetlenemedi';
      else if (y.status >= 200 && y.status < 300) d = 'var';
      else if (y.status >= 300 && y.status < 400) d = 'yonlenir';
      else if (y.status === 404 || y.status === 410) d = 'kirik';
      else d = 'denetlenemedi';
    }
    onbellek.set(yol, d);
    return d;
  };
  for (const h of hedefler) await durumBul(h);
  const baglantiOzet = { toplam: hedefler.size, var: 0, yonlenir: 0, kirik: 0, dinamik: 0, denetlenemedi: 0 };
  for (const d of onbellek.values()) baglantiOzet[d]++;
  for (const x of sayfalar) {
    const kirik = [], yon = [];
    for (const h of x._baglantilar || []) { const d = onbellek.get(yolDuzelt(h)); if (d === 'kirik') kirik.push(yolDuzelt(h)); if (d === 'yonlenir') yon.push(yolDuzelt(h)); }
    if (kirik.length) x.sorunlar.push({ k: 'kirik_baglanti', d: kirik.slice(0, 15).join(' · '), n: kirik.length });
    if (yon.length) x.sorunlar.push({ k: 'yonlenen_baglanti', d: yon.slice(0, 15).join(' · '), n: yon.length });
    delete x._baglantilar;
    x.puan = Math.max(0, 100 - x.sorunlar.reduce((t, s) => t + AGIRLIK[SORUN_AGIRLIK[s.k]], 0));
  }

  // Genel puan: sayfa puanlarının ortalaması; site düzeyindeki sorunlar ayrıca düşülür.
  const SITE_AGIRLIK = { robots_yok: 10, robots_kapali: 40, robots_sitemap_yok: 3, sitemap_yok: 15, sitemap_gecersiz: 10, sitemap_bos: 15, sitemap_yabanci: 5, sitemap_tekrar: 3 };
  const ort = sayfalar.length ? sayfalar.reduce((t, x) => t + x.puan, 0) / sayfalar.length : 0;
  const puan = Math.max(0, Math.round(ort - site.sorunlar.reduce((t, k) => t + (SITE_AGIRLIK[k] || 0), 0)));
  const sorunSayisi = {};
  sayfalar.forEach((x) => x.sorunlar.forEach((so) => { sorunSayisi[so.k] = (sorunSayisi[so.k] || 0) + 1; }));
  const ag = { kritik: 0, onemli: 0, oneri: 0 };
  Object.entries(sorunSayisi).forEach(([k, n]) => { ag[SORUN_AGIRLIK[k]] += n; });
  const geo = {
    faq: sayfalar.filter((x) => (x.jsonld || []).includes('FAQPage')).length,
    hizmet: sayfalar.filter((x) => (x.jsonld || []).includes('Service')).length,
    kurulus: sayfalar.filter((x) => (x.jsonld || []).some((t) => ['Organization', 'LocalBusiness', 'ProfessionalService', 'MarketingAgency'].includes(t))).length,
    soru: sayfalar.filter((x) => (x.sorular || []).length).length
  };
  const ozet = {
    puan, sayfa: sayfalar.length, sitemapAdres: adresler.length, atlananSayfa, istek, sinir, sure: Date.now() - baslangic,
    agirlik: ag, sorunSayisi, siteSorunlari: site.sorunlar, baglanti: baglantiOzet, geo,
    basliklar: { kontrol: basliklar.kontrol, eksik: basliklar.eksik, yanlis: basliklar.yanlis, beklenen: BEKLENEN_BASLIKLAR }
  };
  const sonuc = { site, sayfalar, basliklarOrnek: basliklar.ornek };
  const id = kimlik(), zaman = simdi();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO denetimler (id, zaman, tetikleyen, ozet, sonuc) VALUES (?, ?, ?, ?, ?)').bind(id, zaman, tetikleyen, JSON.stringify(ozet), JSON.stringify(sonuc)),
    env.DB.prepare('DELETE FROM denetimler WHERE id NOT IN (SELECT id FROM denetimler ORDER BY zaman DESC LIMIT ?)').bind(SAKLANAN)
  ]);
  return { id, zaman, tetikleyen, ozet, sonuc };
}

export async function yonetimDenetimApi(db, env, istek, yontem, yol, kim) {
  if (yol === 'denetim' && yontem === 'GET') {
    const [son, gecmis] = await db.batch([
      db.prepare('SELECT id, zaman, tetikleyen, ozet, sonuc FROM denetimler ORDER BY zaman DESC LIMIT 1'),
      db.prepare('SELECT id, zaman, tetikleyen, ozet FROM denetimler ORDER BY zaman DESC LIMIT ?').bind(SAKLANAN)
    ]);
    const s = son.results[0];
    return json({ ok: true, son: s ? { ...s, ozet: JSON.parse(s.ozet), sonuc: JSON.parse(s.sonuc) } : null,
      gecmis: gecmis.results.map((g) => ({ ...g, ozet: JSON.parse(g.ozet) })), sinir: Math.min(500, Math.max(10, Number(env.DENETIM_ISTEK_SINIRI) || VARSAYILAN_SINIR)) });
  }
  if (yol === 'denetim/calistir' && yontem === 'POST') {
    const son = await db.prepare('SELECT zaman FROM denetimler ORDER BY zaman DESC LIMIT 1').first();
    if (son && Date.now() - new Date(son.zaman).getTime() < 2 * 60000) return hata('Son denetim 2 dakikadan kısa süre önce çalıştı. Biraz sonra tekrar deneyin.', 429);
    const sonuc = await denetimCalistir(env, new URL(istek.url).host, kim.eposta);
    await islemYaz(db, kim.eposta, 'denetim_calistir', sonuc.id, `Puan ${sonuc.ozet.puan}`);
    return json({ ok: true, id: sonuc.id, ozet: sonuc.ozet });
  }
  return null;
}
