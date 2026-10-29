// Haftalık Bülten (Muhittin, 29 Eki 2026): AI ve dijital pazarlama gelişmeleri, kategori › konu › haftalık sayı › madde.
// Maddeler taslak olarak girer (elle ya da haftalık araştırma oturumundan /ice-aktar ile); yalnız onaylanan maddeler
// sayı yayınlandığında sitede görünür. Sayfalar /kabuk/bulten/ kabuğuna sunucuda yerleştirilir (arama motorları için tam HTML).
import { json, hata, simdi, kimlik, kirp, islemYaz, GUVENLIK_BASLIKLARI } from './ortak.js';
import { kacis } from './metin.js';

const KATEGORILER = [
  { id: 'ai', ad: 'AI dünyası', aciklama: 'Yapay zekâ modelleri, asistanlar ve geliştirici araçları', sira: 1 },
  { id: 'pazarlama', ad: 'Dijital pazarlama', aciklama: 'Reklam, ölçüm, arama ve e-ticaret platformları', sira: 2 }
];
const KONULAR = [
  ['chatgpt', 'ai', 'ChatGPT', 'OpenAI, ChatGPT ve API', '#0E8C6C'], ['claude', 'ai', 'Claude', 'Anthropic, Claude ve Claude Code', '#B8552F'],
  ['gemini', 'ai', 'Gemini', 'Google Gemini ve AI Mode', '#2B6FD6'], ['cursor', 'ai', 'Cursor', 'Yapay zekâ destekli kod editörü', '#3D4450'],
  ['google-ads', 'pazarlama', 'Google Ads', 'Arama, Performance Max, Demand Gen ve Merchant Center', '#C98A00'], ['meta-ads', 'pazarlama', 'Meta Ads', 'Facebook ve Instagram reklamları, Advantage+ ve CAPI', '#1460E0'],
  ['ga4', 'pazarlama', 'GA4 ve ölçüm', 'Google Analytics 4, Tag Manager ve izin modu', '#D2600A'], ['search-console', 'pazarlama', 'Search Console ve SEO', 'Google Arama güncellemeleri ve Search Console', '#1E8E4A'],
  ['tiktok', 'pazarlama', 'TikTok', 'TikTok reklamları ve TikTok Shop', '#E0244B'], ['shopify', 'pazarlama', 'Shopify', 'Shopify platformu ve uygulamaları', '#4E7D33'],
  ['ikas', 'pazarlama', 'ikas', 'Türkiye’nin e-ticaret altyapısı ikas', '#4F46E5']
].map(([id, kategori, ad, aciklama, renk], i) => ({ id, kategori, ad, aciklama, renk, sira: i + 1 }));
const ETKI = { yuksek: 'Yüksek etki', orta: 'Orta etki', dusuk: 'Düşük etki' };
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TARIH_DESEN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_DESEN = /^[a-z0-9-]{2,40}$/;

async function tohumla(db) {
  const v = await db.prepare("SELECT 1 FROM ayarlar WHERE anahtar = 'bulten_tohum'").first();
  if (v) return;
  const z = simdi();
  await db.batch([
    ...KATEGORILER.map((k) => db.prepare('INSERT OR IGNORE INTO bulten_kategori (id, ad, aciklama, sira) VALUES (?, ?, ?, ?)').bind(k.id, k.ad, k.aciklama, k.sira)),
    ...KONULAR.map((k) => db.prepare('INSERT OR IGNORE INTO bulten_konu (id, kategori, ad, aciklama, renk, sira, aktif) VALUES (?, ?, ?, ?, ?, ?, 1)').bind(k.id, k.kategori, k.ad, k.aciklama, k.renk, k.sira)),
    db.prepare("INSERT OR IGNORE INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES ('bulten_tohum', '1', ?, 'sistem')").bind(z)
  ]);
}

// ISO hafta: pazartesi başlangıcı ve "YYYY-WW" kısa adı
function haftaBilgi(gun) {
  const t = new Date(gun + 'T00:00:00Z');
  const pzt = new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * 86400000);
  const per = new Date(pzt.getTime() + 3 * 86400000);
  const yil = per.getUTCFullYear(), ilk = new Date(Date.UTC(yil, 0, 4));
  const no = 1 + Math.round(((per - ilk) / 86400000 - 3 + ((ilk.getUTCDay() + 6) % 7)) / 7);
  return { bas: pzt.toISOString().slice(0, 10), bit: new Date(pzt.getTime() + 6 * 86400000).toISOString().slice(0, 10), slug: `${yil}-${String(no).padStart(2, '0')}` };
}
const gunYaz = (g) => { const [y, a, d] = g.split('-').map(Number); return `${d} ${AYLAR[a - 1]} ${y}`; };
function aralik(bas, bit) {
  const [y1, a1, d1] = bas.split('-').map(Number), [y2, a2, d2] = bit.split('-').map(Number);
  if (y1 === y2 && a1 === a2) return `${d1}–${d2} ${AYLAR[a2 - 1]} ${y2}`;
  if (y1 === y2) return `${d1} ${AYLAR[a1 - 1]} – ${d2} ${AYLAR[a2 - 1]} ${y2}`;
  return `${gunYaz(bas)} – ${gunYaz(bit)}`;
}
const alanAdi = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const kaynakListe = (v) => { try { const l = JSON.parse(v || '[]'); return Array.isArray(l) ? l : []; } catch { return []; } };

function maddeTemizle(g, eski = {}) {
  const k = { ...eski };
  if ('konu' in g) k.konu = kirp(g.konu, 40);
  if ('tarih' in g) k.tarih = TARIH_DESEN.test(g.tarih || '') ? g.tarih : null;
  if ('baslik' in g) k.baslik = kirp(g.baslik, 160);
  if ('ne_oldu' in g) k.ne_oldu = kirp(g.ne_oldu, 1500);
  if ('ne_anlama' in g) k.ne_anlama = kirp(g.ne_anlama, 1500);
  if ('etki' in g) k.etki = ETKI[g.etki] ? g.etki : 'orta';
  if ('durum' in g) k.durum = ['taslak', 'onayli', 'cikarildi'].includes(g.durum) ? g.durum : 'taslak';
  if ('sira' in g) k.sira = Number.isFinite(Number(g.sira)) ? Math.round(Number(g.sira)) : 0;
  if ('guven' in g) k.guven = kirp(g.guven, 30) || null;
  if ('not' in g) k.not_ = kirp(g.not, 600) || null;
  if ('kaynaklar' in g) k.kaynaklar = JSON.stringify((Array.isArray(g.kaynaklar) ? g.kaynaklar : []).slice(0, 6)
    .map((x) => ({ ad: kirp(x && x.ad, 80), url: kirp(x && x.url, 500) })).filter((x) => /^https?:\/\/[^\s]+$/i.test(x.url)));
  return k;
}
const maddeEksik = (k) => !k.konu ? 'Konu seçin.' : !k.baslik ? 'Başlık yazın.' : !k.ne_oldu ? '“Ne oldu?” alanını doldurun.' : !kaynakListe(k.kaynaklar).length ? 'En az bir kaynak bağlantısı ekleyin (https://…).' : null;

async function surumArttir(db) {
  await db.prepare(`INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES ('bulten_surum', '1', ?, 'sistem')
    ON CONFLICT(anahtar) DO UPDATE SET deger = CAST(CAST(deger AS INTEGER) + 1 AS TEXT), guncelleme = excluded.guncelleme`).bind(simdi()).run();
}

// ---------- Herkese açık sayfalar ----------
const DIS_OK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path></svg>';
const rozet = (k) => `<span class="hb-rozet" style="--r:${kacis(k.renk)}"><i aria-hidden="true">${kacis(k.ad.slice(0, 1))}</i>${kacis(k.ad)}</span>`;

function maddeHtml(m, konu, sayiSlug) {
  const kaynak = kaynakListe(m.kaynaklar);
  return `<article class="hb-madde" id="m-${kacis(m.id.slice(0, 8))}">
<div class="hb-madde-ust">${konu ? rozet(konu) : ''}${m.tarih ? `<time datetime="${kacis(m.tarih)}">${gunYaz(m.tarih)}</time>` : ''}<span class="hb-etki hb-etki-${kacis(m.etki)}">${ETKI[m.etki] || ''}</span></div>
<h3>${kacis(m.baslik)}</h3>
<div class="hb-ikili"><div><b>Ne oldu?</b><p>${kacis(m.ne_oldu)}</p></div>${m.ne_anlama ? `<div class="hb-anlam"><b>Ne anlama geliyor?</b><p>${kacis(m.ne_anlama)}</p></div>` : ''}</div>
<div class="hb-kaynaklar"><span>Kaynak</span>${kaynak.map((x) => `<a href="${kacis(x.url)}" target="_blank" rel="noopener">${kacis(x.ad || alanAdi(x.url))}<small>${kacis(alanAdi(x.url))}</small>${DIS_OK}</a>`).join('')}${sayiSlug ? `<a class="hb-sayi-bag" href="/tr/bulten/${kacis(sayiSlug)}/#m-${kacis(m.id.slice(0, 8))}">Sayıda görün</a>` : ''}</div>
</article>`;
}

// Abonelik formu kabukta (/kabuk/bulten/, #abone) durur; sunucu içeriğe ayrıca kutu eklemez.
async function aboneKutu() { return ''; }

async function sayfaOlustur(db, yol, onizleme) {
  const [kat, kon] = await db.batch([
    db.prepare('SELECT * FROM bulten_kategori ORDER BY sira'),
    db.prepare('SELECT * FROM bulten_konu WHERE aktif = 1 ORDER BY sira')
  ]);
  const konular = new Map(kon.results.map((k) => [k.id, k]));
  const kategoriler = kat.results;
  const yayinda = onizleme ? "durum IN ('yayinda', 'taslak')" : "durum = 'yayinda'";

  // Konu sayfası
  const ku = yol.match(/^konu\/([a-z0-9-]+)$/);
  if (ku) {
    const konu = konular.get(ku[1]);
    if (!konu) return null;
    const r = await db.prepare(`SELECT m.*, s.slug, s.no, s.hafta_bas, s.hafta_bit FROM bulten_madde m JOIN bulten_sayi s ON s.id = m.sayi_id
      WHERE m.konu = ? AND m.durum = 'onayli' AND s.durum = 'yayinda' ORDER BY COALESCE(m.tarih, s.hafta_bit) DESC LIMIT 200`).bind(konu.id).all();
    const kategori = kategoriler.find((x) => x.id === konu.kategori);
    const gruplar = [];
    for (const m of r.results) { const g = gruplar.find((x) => x.slug === m.slug) || (gruplar.push({ slug: m.slug, no: m.no, bas: m.hafta_bas, bit: m.hafta_bit, l: [] }), gruplar[gruplar.length - 1]); g.l.push(m); }
    const govde = `<nav class="hb-iz" aria-label="Konum"><a href="/tr/bulten/">Haftalık Bülten</a><span>›</span><span>${kacis(kategori?.ad || '')}</span><span>›</span><span aria-current="page">${kacis(konu.ad)}</span></nav>
<header class="hb-konu-bas" style="--r:${kacis(konu.renk)}"><span class="hb-monogram" aria-hidden="true">${kacis(konu.ad.slice(0, 1))}</span><div><small>${kacis(kategori?.ad || '')}</small><h1>${kacis(konu.ad)}</h1><p>${kacis(konu.aciklama || '')}</p></div><span class="hb-sayac"><b>${r.results.length}</b> gelişme</span></header>
${gruplar.length ? gruplar.map((g) => `<section class="hb-zaman"><h2><a href="/tr/bulten/${kacis(g.slug)}/">Sayı #${g.no}</a><span>${aralik(g.bas, g.bit)}</span></h2>${g.l.map((m) => maddeHtml(m, null, g.slug)).join('')}</section>`).join('')
  : `<div class="hb-bos"><b>Bu konuda henüz yayınlanmış gelişme yok.</b><p>Yeni sayılar her pazartesi yayınlanır.</p></div>`}
${await aboneKutu()}`;
    return { baslik: `${konu.ad} gelişmeleri · Haftalık Bülten`, aciklama: `${konu.ad}: ${konu.aciklama}. Haftalık, kaynaklı ve Türkçe özetler.`, govde, kanonik: `/tr/bulten/konu/${konu.id}/` };
  }

  // Sayı sayfası
  const su = yol.match(/^(\d{4}-\d{2})$/);
  if (su) {
    const sayi = await db.prepare(`SELECT * FROM bulten_sayi WHERE slug = ? AND ${yayinda}`).bind(su[1]).first();
    if (!sayi) return null;
    const [md, kom] = await db.batch([
      db.prepare(`SELECT * FROM bulten_madde WHERE sayi_id = ? AND durum ${onizleme ? "!= 'cikarildi'" : "= 'onayli'"} ORDER BY sira, tarih`).bind(sayi.id),
      db.prepare(`SELECT slug, no, baslik, hafta_bas, hafta_bit FROM bulten_sayi WHERE durum = 'yayinda' AND slug != ? ORDER BY hafta_bas DESC LIMIT 40`).bind(sayi.slug)
    ]);
    const maddeler = md.results;
    const onceki = kom.results.find((x) => x.hafta_bas < sayi.hafta_bas), sonraki = [...kom.results].reverse().find((x) => x.hafta_bas > sayi.hafta_bas);
    const one = maddeler.filter((m) => m.etki === 'yuksek').slice(0, 3);
    const bolumler = kategoriler.map((k) => ({ k, konular: [...konular.values()].filter((x) => x.kategori === k.id).map((x) => ({ x, l: maddeler.filter((m) => m.konu === x.id) })).filter((g) => g.l.length) })).filter((b) => b.konular.length);
    const adres = `/tr/bulten/${sayi.slug}/`;
    const paylas = (u) => encodeURIComponent('https://idexya.com' + u);
    const govde = `${onizleme && sayi.durum !== 'yayinda' ? '<div class="hb-onizleme">Önizleme · Bu sayı henüz yayında değil; taslak maddeler de gösteriliyor.</div>' : ''}
<nav class="hb-iz" aria-label="Konum"><a href="/tr/bulten/">Haftalık Bülten</a><span>›</span><span aria-current="page">Sayı #${sayi.no}</span></nav>
<header class="hb-sayi-bas">
<small>Sayı #${sayi.no} · ${aralik(sayi.hafta_bas, sayi.hafta_bit)}</small>
<h1>${kacis(sayi.baslik)}</h1>
${sayi.ozet ? `<p class="hb-ozet">${kacis(sayi.ozet)}</p>` : ''}
<div class="hb-sayi-meta"><span><b>${maddeler.length}</b> gelişme</span><span><b>${new Set(maddeler.map((m) => m.konu)).size}</b> konu</span>${sayi.yayin_zamani ? `<span>Yayın: ${gunYaz(sayi.yayin_zamani.slice(0, 10))}</span>` : ''}
<span class="hb-paylas" aria-label="Paylaş"><a href="https://www.linkedin.com/sharing/share-offsite/?url=${paylas(adres)}" target="_blank" rel="noopener">LinkedIn</a><a href="https://wa.me/?text=${paylas(adres)}" target="_blank" rel="noopener">WhatsApp</a><a href="https://x.com/intent/post?url=${paylas(adres)}" target="_blank" rel="noopener">X</a><button type="button" data-baglanti-kopyala>Bağlantıyı kopyala</button></span></div>
</header>
${one.length ? `<section class="hb-one" aria-label="Öne çıkanlar"><h2>Bu haftanın öne çıkanları</h2><div class="hb-one-izgara">${one.map((m) => { const k = konular.get(m.konu); return `<a href="#m-${kacis(m.id.slice(0, 8))}" class="hb-one-kart" style="--r:${kacis(k?.renk || '#B84406')}">${k ? rozet(k) : ''}<b>${kacis(m.baslik)}</b><span>${kacis((m.ne_anlama || m.ne_oldu).slice(0, 160))}${(m.ne_anlama || m.ne_oldu).length > 160 ? '…' : ''}</span></a>`; }).join('')}</div></section>` : ''}
<div class="hb-govde">
<aside class="hb-yan" aria-label="Bu sayıdaki konular"><b>Bu sayıda</b>${bolumler.map((b) => `<span class="hb-yan-kat">${kacis(b.k.ad)}</span>${b.konular.map((g) => `<a href="#konu-${kacis(g.x.id)}"><i style="--r:${kacis(g.x.renk)}"></i>${kacis(g.x.ad)}<small>${g.l.length}</small></a>`).join('')}`).join('')}</aside>
<div class="hb-akis">${bolumler.map((b) => `<section class="hb-kategori"><h2>${kacis(b.k.ad)}</h2>${b.konular.map((g) => `<div class="hb-konu" id="konu-${kacis(g.x.id)}"><h3 class="hb-konu-baslik">${rozet(g.x)}<a href="/tr/bulten/konu/${kacis(g.x.id)}/">Bütün ${kacis(g.x.ad)} gelişmeleri →</a></h3>${g.l.map((m) => maddeHtml({ ...m }, null, null).replace('<h3>', '<h4>').replace('</h3>', '</h4>')).join('')}</div>`).join('')}</section>`).join('') || '<div class="hb-bos"><b>Bu sayıda henüz onaylı madde yok.</b></div>'}</div>
</div>
<nav class="hb-sayfalama" aria-label="Sayılar">${onceki ? `<a href="/tr/bulten/${kacis(onceki.slug)}/"><small>← Önceki sayı</small><b>Sayı #${onceki.no} · ${aralik(onceki.hafta_bas, onceki.hafta_bit)}</b></a>` : '<span></span>'}${sonraki ? `<a href="/tr/bulten/${kacis(sonraki.slug)}/" class="sag"><small>Sonraki sayı →</small><b>Sayı #${sonraki.no} · ${aralik(sonraki.hafta_bas, sonraki.hafta_bit)}</b></a>` : ''}</nav>
${await aboneKutu()}`;
    const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: sayi.baslik, description: sayi.ozet || '', datePublished: sayi.yayin_zamani || undefined, dateModified: sayi.guncelleme, inLanguage: 'tr-TR', mainEntityOfPage: 'https://idexya.com' + adres,
      publisher: { '@type': 'Organization', name: 'Idexya', url: 'https://idexya.com' }, citation: maddeler.flatMap((m) => kaynakListe(m.kaynaklar).map((x) => x.url)).slice(0, 40) };
    return { baslik: `${sayi.baslik} · Haftalık Bülten #${sayi.no}`, aciklama: sayi.ozet || `${aralik(sayi.hafta_bas, sayi.hafta_bit)} haftasında AI ve dijital pazarlamada öne çıkan gelişmeler.`, govde, kanonik: adres, ld, makale: true, taslak: sayi.durum !== 'yayinda' };
  }

  // Ana sayfa
  if (yol !== '') return null;
  const [sy, say] = await db.batch([
    db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM bulten_madde m WHERE m.sayi_id = s.id AND m.durum = 'onayli') AS n FROM bulten_sayi s WHERE s.durum = 'yayinda' ORDER BY s.hafta_bas DESC LIMIT 60`),
    db.prepare(`SELECT m.konu, COUNT(*) AS n, MAX(COALESCE(m.tarih, s.hafta_bit)) AS son FROM bulten_madde m JOIN bulten_sayi s ON s.id = m.sayi_id WHERE m.durum = 'onayli' AND s.durum = 'yayinda' GROUP BY m.konu`)
  ]);
  const sayilar = sy.results, sayac = new Map(say.results.map((x) => [x.konu, x]));
  const son = sayilar[0];
  let one = [];
  if (son) one = (await db.prepare("SELECT * FROM bulten_madde WHERE sayi_id = ? AND durum = 'onayli' ORDER BY (etki = 'yuksek') DESC, sira LIMIT 4").bind(son.id).all()).results;
  const toplam = say.results.reduce((a, x) => a + x.n, 0);
  const govde = `<header class="hb-ana-bas">
<div><small>Her pazartesi · Türkçe · Kaynaklı</small><h1>Haftalık Bülten</h1><p>AI ve dijital pazarlamada geçen hafta neler değişti? Resmî duyuruları ve birincil kaynakları tarıyor, her gelişmenin işiniz için ne anlama geldiğini kısa ve anlaşılır biçimde özetliyoruz.</p>
<span class="hb-eylem"><a class="hb-dugme" href="${son ? `/tr/bulten/${kacis(son.slug)}/` : '#abone'}">${son ? 'Son sayıyı okuyun' : 'İlk sayıdan haberdar olun'}</a><a class="hb-ikincil" href="#abone">E-postayla alın</a></span></div>
<dl class="hb-istatistik"><div><dt>Sayı</dt><dd>${sayilar.length}</dd></div><div><dt>Gelişme</dt><dd>${toplam}</dd></div><div><dt>Konu</dt><dd>${konular.size}</dd></div></dl>
</header>
${son ? `<section class="hb-son" aria-label="Son sayı"><a href="/tr/bulten/${kacis(son.slug)}/" class="hb-son-bas"><small>Son sayı · #${son.no} · ${aralik(son.hafta_bas, son.hafta_bit)}</small><b>${kacis(son.baslik)}</b>${son.ozet ? `<span>${kacis(son.ozet)}</span>` : ''}<em>${son.n} gelişme · Sayıyı okuyun →</em></a>
<ul class="hb-son-liste">${one.map((m) => { const k = konular.get(m.konu); return `<li><a href="/tr/bulten/${kacis(son.slug)}/#m-${kacis(m.id.slice(0, 8))}">${k ? rozet(k) : ''}<b>${kacis(m.baslik)}</b></a></li>`; }).join('')}</ul></section>`
  : `<div class="hb-bos"><b>İlk sayı hazırlanıyor.</b><p>Yayınlandığında haberdar olmak için e-postanızı bırakın.</p></div>`}
${kategoriler.map((k) => `<section class="hb-kat-blok"><div class="hb-kat-bas"><h2>${kacis(k.ad)}</h2><p>${kacis(k.aciklama || '')}</p></div><div class="hb-konu-izgara">${[...konular.values()].filter((x) => x.kategori === k.id).map((x) => { const s = sayac.get(x.id); return `<a href="/tr/bulten/konu/${kacis(x.id)}/" class="hb-konu-kart" style="--r:${kacis(x.renk)}"><span class="hb-monogram" aria-hidden="true">${kacis(x.ad.slice(0, 1))}</span><b>${kacis(x.ad)}</b><span>${kacis(x.aciklama || '')}</span><small>${s ? `${s.n} gelişme · son ${gunYaz(s.son)}` : 'Henüz gelişme yok'}</small></a>`; }).join('')}</div></section>`).join('')}
${sayilar.length > 1 ? `<section class="hb-arsiv"><h2>Bütün sayılar</h2><ol>${sayilar.map((s) => `<li><a href="/tr/bulten/${kacis(s.slug)}/"><small>#${s.no} · ${aralik(s.hafta_bas, s.hafta_bit)}</small><b>${kacis(s.baslik)}</b><span>${s.n} gelişme</span></a></li>`).join('')}</ol></section>` : ''}
${await aboneKutu()}`;
  return { baslik: 'Haftalık Bülten: AI ve dijital pazarlama gelişmeleri', aciklama: 'ChatGPT, Claude, Gemini, Google Ads, Meta, GA4 ve SEO’da her hafta neler değişti? Kaynaklı ve Türkçe özetler.', govde, kanonik: '/tr/bulten/' };
}

export async function bultenSayfasi(istek, env, ctx, yoneticiMi) {
  const db = env.DB, url = new URL(istek.url);
  await tohumla(db);
  const yol = url.pathname.replace(/^\/tr\/bulten\/?/, '').replace(/\/$/, '');
  if (!url.pathname.endsWith('/')) return Response.redirect(url.origin + url.pathname + '/' + url.search, 301);
  const onizleme = url.searchParams.get('onizleme') === '1' && (await yoneticiMi());
  const surum = (await db.prepare("SELECT deger FROM ayarlar WHERE anahtar = 'bulten_surum'").first())?.deger || '0';
  // Önbellek anahtarı içerik sürümü ve kabuğun ETag'i: yeni dağıtımda eski CSS/JS adreslerine bağlı sayfa sunulmaz.
  const kabuk = await env.ASSETS.fetch(new Request(url.origin + '/kabuk/bulten/'));
  const etiket = (kabuk.headers.get('etag') || '').replace(/[^\w-]/g, '').slice(0, 40);
  const onbellek = caches.default, anahtar = new Request(`${url.origin}${url.pathname}?v=${surum}-${etiket}`);
  if (!onizleme) { const var_ = await onbellek.match(anahtar); if (var_) { kabuk.body?.cancel(); return var_; } }
  const s = await sayfaOlustur(db, yol, onizleme);
  const veri = s || { baslik: 'Sayfa bulunamadı · Haftalık Bülten', aciklama: '', kanonik: '/tr/bulten/', govde: `<div class="hb-bos"><b>Aradığınız sayfa bulunamadı.</b><p><a href="/tr/bulten/">Haftalık Bülten’e dönün</a></p></div>` };
  const acik = !!s && !onizleme && !s.taslak;
  const tam = 'https://idexya.com' + veri.kanonik;
  const rw = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(`${veri.baslik} | Idexya`); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', veri.aciklama); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', veri.aciklama); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', `${veri.baslik} | Idexya`); } })
    .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', tam); } })
    .on('meta[property="og:type"]', { element(e) { e.setAttribute('content', veri.makale ? 'article' : 'website'); } })
    .on('meta[name="robots"]', { element(e) { if (acik) e.remove(); } })
    .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', tam); } })
    .on('head', { element(e) { if (veri.ld) e.append(`<script type="application/ld+json">${JSON.stringify(veri.ld).replace(/</g, '\\u003c')}</script>`, { html: true }); } })
    .on('[data-bulten-alan]', { element(e) { e.setInnerContent(veri.govde, { html: true }); } });
  const y = rw.transform(new Response(kabuk.body, { status: s ? 200 : 404, headers: kabuk.headers }));
  const yanit = new Response(y.body, y);
  Object.entries(GUVENLIK_BASLIKLARI).forEach(([k, v]) => yanit.headers.set(k, v));
  if (acik) yanit.headers.delete('X-Robots-Tag');
  yanit.headers.set('Cache-Control', onizleme ? 'private, no-store' : 'public, max-age=300');
  yanit.headers.set('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (s && !onizleme) { const kopya = yanit.clone(); if (ctx) ctx.waitUntil(onbellek.put(anahtar, kopya)); else await onbellek.put(anahtar, kopya); }
  return yanit;
}

export async function bultenSitemap(env) {
  await tohumla(env.DB);
  const [s, k] = await env.DB.batch([
    env.DB.prepare("SELECT slug, guncelleme FROM bulten_sayi WHERE durum = 'yayinda' ORDER BY hafta_bas DESC"),
    env.DB.prepare('SELECT id FROM bulten_konu WHERE aktif = 1')
  ]);
  const u = (yol, t) => `<url><loc>https://idexya.com${yol}</loc>${t ? `<lastmod>${t.slice(0, 10)}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u('/tr/bulten/', s.results[0]?.guncelleme)}${s.results.map((x) => u(`/tr/bulten/${x.slug}/`, x.guncelleme)).join('')}${k.results.map((x) => u(`/tr/bulten/konu/${x.id}/`)).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

// ---------- Yönetim: /api/yonetim/haftalik-bulten* ----------
async function sayiOzet(db) {
  return (await db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM bulten_madde m WHERE m.sayi_id = s.id AND m.durum != 'cikarildi') AS madde, (SELECT COUNT(*) FROM bulten_madde m WHERE m.sayi_id = s.id AND m.durum = 'onayli') AS onayli FROM bulten_sayi s ORDER BY s.hafta_bas DESC LIMIT 200`).all()).results;
}
async function sayiOlustur(db, hafta, kim) {
  const h = haftaBilgi(hafta);
  const var_ = await db.prepare('SELECT * FROM bulten_sayi WHERE slug = ?').bind(h.slug).first();
  if (var_) return var_;
  const no = ((await db.prepare('SELECT MAX(no) AS n FROM bulten_sayi').first())?.n || 0) + 1, z = simdi(), id = kimlik();
  await db.prepare(`INSERT INTO bulten_sayi (id, slug, no, baslik, ozet, hafta_bas, hafta_bit, durum, yayin_zamani, olusturma, guncelleme, guncelleyen) VALUES (?, ?, ?, ?, NULL, ?, ?, 'taslak', NULL, ?, ?, ?)`)
    .bind(id, h.slug, no, `AI ve dijital pazarlamada ${aralik(h.bas, h.bit)} haftası`, h.bas, h.bit, z, z, kim).run();
  return db.prepare('SELECT * FROM bulten_sayi WHERE id = ?').bind(id).first();
}

export async function yonetimHaftalikBultenApi(db, yontem, yol, govde, kim) {
  if (!(yol === 'haftalik-bulten' || yol.startsWith('haftalik-bulten/'))) return null;
  await tohumla(db);
  const g = govde || {};
  const alt = yol.slice('haftalik-bulten'.length).replace(/^\//, '');
  if (alt === '' && yontem === 'GET') {
    const [kat, kon] = await db.batch([db.prepare('SELECT * FROM bulten_kategori ORDER BY sira'), db.prepare('SELECT * FROM bulten_konu ORDER BY sira')]);
    return json({ ok: true, kategoriler: kat.results, konular: kon.results, sayilar: await sayiOzet(db), bugun: new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10) });
  }
  if (alt === 'sayi' && yontem === 'POST') {
    const gun = TARIH_DESEN.test(g.hafta || '') ? g.hafta : new Date(Date.now() + 3 * 3600000 - 7 * 86400000).toISOString().slice(0, 10);
    const s = await sayiOlustur(db, gun, kim.eposta);
    await islemYaz(db, kim.eposta, 'bulten_sayi_olustur', s.slug, s.baslik);
    return json({ ok: true, sayi: s });
  }
  let m = alt.match(/^sayi\/([\w-]{8,64})(?:\/(durum|madde|ice-aktar))?$/);
  if (m) {
    const sayi = await db.prepare('SELECT * FROM bulten_sayi WHERE id = ?').bind(m[1]).first();
    if (!sayi) return hata('Sayı bulunamadı', 404);
    if (!m[2] && yontem === 'GET') {
      const md = await db.prepare('SELECT * FROM bulten_madde WHERE sayi_id = ? ORDER BY sira, tarih, olusturma').bind(sayi.id).all();
      return json({ ok: true, sayi, maddeler: md.results });
    }
    if (!m[2] && yontem === 'POST') {
      const baslik = kirp(g.baslik, 160), ozet = kirp(g.ozet, 600);
      if (!baslik) return hata('Sayı başlığı boş olamaz', 400);
      await db.prepare('UPDATE bulten_sayi SET baslik = ?, ozet = ?, guncelleme = ?, guncelleyen = ? WHERE id = ?').bind(baslik, ozet || null, simdi(), kim.eposta, sayi.id).run();
      if (sayi.durum === 'yayinda') await surumArttir(db);
      return json({ ok: true });
    }
    if (m[2] === 'durum' && yontem === 'POST') {
      const d = g.durum === 'yayinda' ? 'yayinda' : 'taslak';
      if (d === 'yayinda') {
        const n = await db.prepare("SELECT COUNT(*) AS n FROM bulten_madde WHERE sayi_id = ? AND durum = 'onayli'").bind(sayi.id).first();
        if (!n.n) return hata('Yayınlamak için en az bir maddeyi onaylayın', 400);
      }
      await db.prepare('UPDATE bulten_sayi SET durum = ?, yayin_zamani = COALESCE(yayin_zamani, ?), guncelleme = ?, guncelleyen = ? WHERE id = ?').bind(d, d === 'yayinda' ? simdi() : null, simdi(), kim.eposta, sayi.id).run();
      await surumArttir(db);
      await islemYaz(db, kim.eposta, d === 'yayinda' ? 'bulten_yayinla' : 'bulten_yayindan_kaldir', sayi.slug, sayi.baslik);
      return json({ ok: true });
    }
    if (m[2] === 'madde' && yontem === 'POST') {
      const k = maddeTemizle({ durum: 'taslak', etki: 'orta', kaynaklar: [], ...g });
      const eksik = maddeEksik(k);
      if (eksik) return hata(eksik, 400);
      const z = simdi(), id = kimlik();
      await db.prepare(`INSERT INTO bulten_madde (id, sayi_id, konu, tarih, baslik, ne_oldu, ne_anlama, etki, kaynaklar, durum, sira, guven, not_, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, sayi.id, k.konu, k.tarih || null, k.baslik, k.ne_oldu, k.ne_anlama || null, k.etki, k.kaynaklar, k.durum, k.sira || 0, k.guven || null, k.not_ || null, z, z).run();
      if (sayi.durum === 'yayinda') await surumArttir(db);
      return json({ ok: true, id });
    }
    // Toplu taslak yükleme (haftalık araştırma oturumu): her madde taslak girer, yayınlanmaz.
    if (m[2] === 'ice-aktar' && yontem === 'POST') {
      const liste = (Array.isArray(g.maddeler) ? g.maddeler : []).slice(0, 80).map((x, i) => maddeTemizle({ etki: 'orta', kaynaklar: [], ...x, durum: 'taslak', sira: (i + 1) * 10 }));
      const kotu = liste.map((k, i) => [i, maddeEksik(k)]).filter(([, e]) => e);
      if (!liste.length || kotu.length) return hata(liste.length ? `Madde ${kotu[0][0] + 1}: ${kotu[0][1]}` : 'Madde yok', 400);
      const z = simdi();
      await db.batch(liste.map((k) => db.prepare(`INSERT INTO bulten_madde (id, sayi_id, konu, tarih, baslik, ne_oldu, ne_anlama, etki, kaynaklar, durum, sira, guven, not_, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'taslak', ?, ?, ?, ?, ?)`)
        .bind(kimlik(), sayi.id, k.konu, k.tarih || null, k.baslik, k.ne_oldu, k.ne_anlama || null, k.etki, k.kaynaklar, k.sira, k.guven || null, k.not_ || null, z, z)));
      await islemYaz(db, kim.eposta, 'bulten_ice_aktar', sayi.slug, `${liste.length} taslak madde`);
      return json({ ok: true, eklenen: liste.length });
    }
  }
  m = alt.match(/^madde\/([\w-]{8,64})(\/sil)?$/);
  if (m && yontem === 'POST') {
    const eski = await db.prepare('SELECT m.*, s.durum AS sayi_durum FROM bulten_madde m JOIN bulten_sayi s ON s.id = m.sayi_id WHERE m.id = ?').bind(m[1]).first();
    if (!eski) return hata('Madde bulunamadı', 404);
    if (m[2]) {
      await db.prepare('DELETE FROM bulten_madde WHERE id = ?').bind(eski.id).run();
    } else {
      const k = maddeTemizle(g, eski);
      const eksik = k.durum === 'onayli' ? maddeEksik(k) : null;
      if (eksik) return hata(eksik, 400);
      await db.prepare('UPDATE bulten_madde SET konu = ?, tarih = ?, baslik = ?, ne_oldu = ?, ne_anlama = ?, etki = ?, kaynaklar = ?, durum = ?, sira = ?, not_ = ?, guncelleme = ? WHERE id = ?')
        .bind(k.konu, k.tarih || null, k.baslik, k.ne_oldu, k.ne_anlama || null, k.etki, k.kaynaklar, k.durum, k.sira || 0, k.not_ || null, simdi(), eski.id).run();
    }
    if (eski.sayi_durum === 'yayinda') await surumArttir(db);
    return json({ ok: true });
  }
  if (alt === 'konu' && yontem === 'POST') {
    const id = kirp(g.id, 40).toLowerCase(), kategori = kirp(g.kategori, 40), ad = kirp(g.ad, 60);
    if (!SLUG_DESEN.test(id) || !ad) return hata('Konu kimliği (küçük harf, rakam, tire) ve adı gerekli', 400);
    if (!(await db.prepare('SELECT 1 FROM bulten_kategori WHERE id = ?').bind(kategori).first())) return hata('Kategori bulunamadı', 400);
    const renk = /^#[0-9a-f]{6}$/i.test(g.renk || '') ? g.renk : '#B84406';
    await db.prepare(`INSERT INTO bulten_konu (id, kategori, ad, aciklama, renk, sira, aktif) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET kategori = excluded.kategori, ad = excluded.ad, aciklama = excluded.aciklama, renk = excluded.renk, sira = excluded.sira, aktif = excluded.aktif`)
      .bind(id, kategori, ad, kirp(g.aciklama, 200) || null, renk, Number(g.sira) || 99, g.aktif === false ? 0 : 1).run();
    await surumArttir(db);
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}
