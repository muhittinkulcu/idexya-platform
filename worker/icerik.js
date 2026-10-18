// İçerikler ve görünürlük ayarı: kim görür, kim etkileşime geçer, arama motorları görür mü.
import { json, hata, simdi, kimlik, kirp, ozet, islemYaz, EPOSTA_DESEN, ayniKaynak, govdeOku, ipAl, robotDogrula, GUVENLIK_BASLIKLARI } from './ortak.js';
import { oturumUyesi, uyeModulleri } from './uye.js';
import { metinHtml, kacis } from './metin.js';

export const GORUNURLUK = {
  herkes: 'Herkese açık',
  uyeler: 'Yalnız üyeler',
  secili: 'Seçili üyeler ve gruplar',
  liste_disi: 'Bağlantıyı bilenler (liste dışı)',
  gizli: 'Gizli (yalnız yönetici)'
};
export const ETKILESIM = { kimse: 'Kimse yorum yapamaz', uyeler: 'Yalnız üyeler yorum yapabilir', herkes: 'Herkes yorum yapabilir (onaydan sonra yayınlanır)' };
const AYRILMIS = new Set(['yazi', 'liste', 'yeni']);

export const kisaAd = (t) => String(t || '').toLocaleLowerCase('tr-TR').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
export const yayinda = (ic, an = simdi()) => !ic.arsiv && ic.gorunurluk !== 'gizli' && (!ic.yayin_zamani || ic.yayin_zamani <= an);
export function durumAdi(ic) {
  if (ic.arsiv) return 'Arşivde';
  if (ic.gorunurluk === 'gizli') return 'Gizli';
  if (ic.yayin_zamani && ic.yayin_zamani > simdi()) return 'Zamanlanmış';
  return 'Yayında';
}

// İzleyici: onaylı üye ise modülleri ve grupları ile döner; değilse null.
async function izleyiciAl(istek, db) {
  const u = await oturumUyesi(istek, db);
  if (!u || u.durum !== 'onayli') return null;
  const [m, g] = await db.batch([
    db.prepare('SELECT modul, yetki FROM uye_moduller WHERE uye_id = ?').bind(u.id),
    db.prepare('SELECT grup_id FROM uye_gruplar WHERE uye_id = ?').bind(u.id)
  ]);
  return { id: u.id, ad: u.ad, eposta: u.eposta, moduller: Object.fromEntries(m.results.map((x) => [x.modul, x.yetki])), gruplar: g.results.map((x) => x.grup_id) };
}
const listede = (iz, erisim) => !!iz && erisim.some((e) => (e.tur === 'uye' && e.hedef_id === iz.id) || (e.tur === 'grup' && iz.gruplar.includes(e.hedef_id)));

// 'tam' içerik görünür · 'tanitim' yalnız başlık ve özet (giriş çağrısıyla) · 'yok' içerik hiç yokmuş gibi davranılır
export function erisimDuzeyi(ic, iz, erisim) {
  if (!yayinda(ic)) return 'yok';
  if (ic.gorunurluk === 'herkes' || ic.gorunurluk === 'liste_disi') return 'tam';
  if (ic.gorunurluk === 'uyeler') return iz && iz.moduller['uye-icerik'] ? 'tam' : 'tanitim';
  if (ic.gorunurluk === 'secili') return listede(iz, erisim) ? 'tam' : 'yok';
  return 'yok';
}
export function yorumYapabilir(ic, iz, erisim) {
  if (erisimDuzeyi(ic, iz, erisim) !== 'tam' || ic.etkilesim === 'kimse') return false;
  if (ic.etkilesim === 'herkes') return true;
  return !!iz && (iz.moduller['uye-icerik'] === 'kullan' || listede(iz, erisim));
}
const aramayaAcik = (ic, env) => env.ARAMA_ACIK === 'evet' && ic.arama === 1 && ic.gorunurluk === 'herkes' && yayinda(ic);

async function icerikGetir(db, kisa) {
  const ic = await db.prepare('SELECT * FROM icerikler WHERE kisa_ad = ?').bind(kisa).first();
  if (!ic) return { ic: null, erisim: [] };
  const e = await db.prepare('SELECT tur, hedef_id FROM icerik_erisim WHERE icerik_id = ?').bind(ic.id).all();
  return { ic, erisim: e.results };
}

// --- Herkese açık uçlar: /api/icerik ---
export async function icerikApi(istek, env, yol) {
  const db = env.DB;
  const iz = await izleyiciAl(istek, db);
  if (yol === '' && istek.method === 'GET') {
    const r = await db.prepare("SELECT id, baslik, kisa_ad, ozet, kategori, gorunurluk, yayin_zamani, olusturma, arsiv FROM icerikler WHERE arsiv = 0 AND gorunurluk IN ('herkes', 'uyeler', 'secili') AND (yayin_zamani IS NULL OR yayin_zamani <= ?) ORDER BY COALESCE(yayin_zamani, olusturma) DESC LIMIT 200").bind(simdi()).all();
    const secili = r.results.filter((x) => x.gorunurluk === 'secili').map((x) => x.id);
    const erisimler = secili.length ? (await db.prepare(`SELECT icerik_id, tur, hedef_id FROM icerik_erisim WHERE icerik_id IN (${secili.map(() => '?').join(',')})`).bind(...secili).all()).results : [];
    const liste = r.results.map((x) => ({ x, d: erisimDuzeyi(x, iz, erisimler.filter((e) => e.icerik_id === x.id)) })).filter((o) => o.d !== 'yok')
      .map(({ x, d }) => ({ baslik: x.baslik, kisa_ad: x.kisa_ad, ozet: x.ozet, kategori: x.kategori, tarih: x.yayin_zamani || x.olusturma, kilitli: d === 'tanitim', ozel: x.gorunurluk !== 'herkes' }));
    return json({ ok: true, uye: iz ? { ad: iz.ad } : null, icerikler: liste });
  }
  const m = yol.match(/^([a-z0-9-]{1,80})\/yorum$/);
  if (m && istek.method === 'POST') {
    if (!ayniKaynak(istek)) return hata('Geçersiz kaynak', 403);
    const { g, hata: h } = await govdeOku(istek, 8000);
    if (h) return h;
    const { ic, erisim } = await icerikGetir(db, m[1]);
    if (!ic || erisimDuzeyi(ic, iz, erisim) !== 'tam') return hata('İçerik bulunamadı', 404);
    if (!yorumYapabilir(ic, iz, erisim)) return hata('Bu içeriğe yorum yapılamıyor.', 403);
    if (g.web_adresi_tekrar) return json({ ok: true, durum: 'bekliyor' });
    const metin = kirp(g.metin, 2000);
    if (metin.length < 2) return hata('Yorumunuzu yazın.', 422);
    const ip = ipAl(istek), ipOzet = await ozet(ip + (env.IP_TUZ || 'idexya'));
    const son = await db.prepare('SELECT COUNT(*) AS n FROM yorumlar WHERE ip_ozet = ? AND zaman > ?').bind(ipOzet, new Date(Date.now() - 10 * 60 * 1000).toISOString()).first();
    if (son.n >= 5) return hata('Çok fazla yorum gönderdiniz. Biraz sonra tekrar deneyin.', 429);
    let ad, eposta, durum;
    // Üye yorumu yalnız 'kullan' yetkisi veya erişim listesi varsa hemen yayınlanır; diğerleri onay bekler.
    if (iz) { ad = iz.ad; eposta = iz.eposta; durum = iz.moduller['uye-icerik'] === 'kullan' || listede(iz, erisim) ? 'yayinda' : 'bekliyor'; }
    else {
      ad = kirp(g.ad, 80); eposta = kirp(g.eposta, 160).toLowerCase();
      if (!ad) return hata('Adınızı yazın.', 422);
      if (!EPOSTA_DESEN.test(eposta)) return hata('Geçerli bir e-posta adresi yazın. Sitede gösterilmez.', 422);
      if (g.kvkk !== true) return hata('KVKK aydınlatma metnini onaylayın.', 422);
      if ((await robotDogrula(env, g.turnstile, ip)) === 'kaldi') return hata('Robot doğrulaması başarısız.', 403);
      durum = 'bekliyor';
    }
    await db.prepare('INSERT INTO yorumlar (id, icerik_id, zaman, uye_id, ad, eposta, metin, durum, ip_ozet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), ic.id, simdi(), iz ? iz.id : null, ad, eposta, metin, durum, ipOzet).run();
    return json({ ok: true, durum });
  }
  return hata('Bulunamadı', 404);
}

// --- Sayfa: /icerik/<kisa-ad> (sunucuda erişim denetlenir, içerik kabuk sayfaya yerleştirilir) ---
export async function icerikSayfasi(istek, env, kisa) {
  const db = env.DB;
  const url = new URL(istek.url);
  const kabuk = await env.ASSETS.fetch(new Request(url.origin + '/kabuk/icerik/'));
  const iz = await izleyiciAl(istek, db);
  const { ic, erisim } = kisa && !AYRILMIS.has(kisa) ? await icerikGetir(db, kisa) : { ic: null, erisim: [] };
  const duzey = ic ? erisimDuzeyi(ic, iz, erisim) : 'yok';
  let baslik, govde, durum = 200, aciklama = '';
  if (duzey === 'yok') {
    durum = 404; baslik = 'İçerik bulunamadı';
    govde = `<h1>İçerik bulunamadı</h1><p>Aradığınız içerik kaldırılmış, taşınmış veya görüntüleme izniniz olmayabilir.</p><p><a class="icerik-dugme" href="/icerik/">Tüm içerikler</a></p>`;
  } else {
    baslik = ic.baslik; aciklama = ic.ozet || '';
    const tarih = new Date(ic.yayin_zamani || ic.olusturma);
    const ust = `<p class="icerik-ust">${ic.kategori ? kacis(ic.kategori) + ' · ' : ''}<time datetime="${kacis(tarih.toISOString())}">${tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })}</time>${ic.gorunurluk !== 'herkes' ? ` · <span class="icerik-etiket">${kacis({ uyeler: 'Üyelere özel', secili: 'Size özel', liste_disi: 'Liste dışı' }[ic.gorunurluk] || '')}</span>` : ''}</p>`;
    if (duzey === 'tanitim') {
      govde = `${ust}<h1>${kacis(ic.baslik)}</h1>${ic.ozet ? `<p class="icerik-ozet">${kacis(ic.ozet)}</p>` : ''}<div class="icerik-kilit" role="note"><strong>Bu içerik üyelere özel</strong><p>Okumak için giriş yapın. Üye değilseniz üyelik talebi gönderebilirsiniz; onaylandığında bu içerik size açılır.</p><p><a class="icerik-dugme" href="/giris">Giriş yap</a> <a class="icerik-dugme ikincil" href="/uye-ol">Üye ol</a></p></div>`;
    } else {
      const y = await db.prepare("SELECT ad, metin, zaman FROM yorumlar WHERE icerik_id = ? AND durum = 'yayinda' ORDER BY zaman ASC LIMIT 300").bind(ic.id).all();
      const yapabilir = yorumYapabilir(ic, iz, erisim);
      let yorum = '';
      if (ic.etkilesim !== 'kimse' || y.results.length) {
        yorum = `<section class="icerik-yorumlar" aria-label="Yorumlar"><h2>Yorumlar${y.results.length ? ` (${y.results.length})` : ''}</h2>` +
          (y.results.length ? y.results.map((x) => `<article class="icerik-yorum"><p class="icerik-yorum-ust"><strong>${kacis(x.ad)}</strong> · ${kacis(new Date(x.zaman).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }))}</p><p>${kacis(x.metin).replace(/\n/g, '<br>')}</p></article>`).join('') : '<p class="icerik-sessiz">Henüz yorum yok.</p>') +
          (yapabilir ? `<form class="icerik-yorum-form" data-yorum-form data-kisa="${kacis(ic.kisa_ad)}" data-uye="${iz ? '1' : ''}" novalidate>` +
            (iz ? `<p class="icerik-sessiz">${kacis(iz.ad)} olarak yorum yapıyorsunuz.</p>` : `<label>Adınız<input name="ad" autocomplete="name" maxlength="80"></label><label>E-posta <small>(sitede gösterilmez)</small><input name="eposta" type="email" autocomplete="email" maxlength="160"></label>`) +
            `<label>Yorumunuz<textarea name="metin" rows="4" maxlength="2000"></textarea></label>` +
            (iz ? '' : `<label class="icerik-onay"><input type="checkbox" name="kvkk"> <span><a href="/tr/sayfa/kvkk-aydinlatma-metni" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label><label aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden">Boş bırakın<input name="web_adresi_tekrar" tabindex="-1" autocomplete="off"></label><div data-turnstile></div>`) +
            `<p data-form-durum role="status" aria-live="polite" hidden></p><button type="submit" class="icerik-dugme">Yorumu gönder</button></form>`
            : ic.etkilesim === 'uyeler' ? `<p class="icerik-sessiz">Yorum yapmak için <a href="/giris">giriş yapın</a>.</p>` : '') + '</section>';
      }
      govde = `${ust}<h1>${kacis(ic.baslik)}</h1>${ic.ozet ? `<p class="icerik-ozet">${kacis(ic.ozet)}</p>` : ''}<div class="icerik-metin">${metinHtml(ic.govde)}</div>${yorum}`;
    }
  }
  const ac = ic && duzey === 'tam' && aramayaAcik(ic, env);
  const rw = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(`${baslik} | Idexya | Good Things`); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', aciklama); } })
    .on('meta[name="robots"]', { element(e) { if (ac) e.remove(); } })
    .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', `${url.origin}/icerik/${ic && duzey !== 'yok' ? ic.kisa_ad : ''}`); } })
    .on('[data-icerik-alan]', { element(e) { e.setInnerContent(govde, { html: true }); } });
  const y = rw.transform(new Response(kabuk.body, { status: durum, headers: kabuk.headers }));
  const yanit = new Response(y.body, y);
  Object.entries(GUVENLIK_BASLIKLARI).forEach(([k, v]) => yanit.headers.set(k, v));
  if (ac) yanit.headers.delete('X-Robots-Tag');
  // Üyeye özel içerik paylaşılan önbelleklerde tutulmaz.
  yanit.headers.set('Cache-Control', 'private, no-store');
  yanit.headers.set('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return yanit;
}

// --- Yönetim uçları: /api/yonetim/icerikler*, /yorumlar* ---
const SATIR = 'id, baslik, kisa_ad, kategori, gorunurluk, etkilesim, arama, arsiv, yayin_zamani, olusturma, guncelleme, yazar';
export async function yonetimIcerikApi(db, yontem, yol, govde, kim) {
  if (yol === 'icerikler' && yontem === 'GET') {
    const r = await db.prepare(`SELECT ${SATIR}, (SELECT COUNT(*) FROM yorumlar y WHERE y.icerik_id = i.id AND y.durum = 'bekliyor') AS bekleyen_yorum FROM icerikler i ORDER BY guncelleme DESC LIMIT 500`).all();
    return json({ ok: true, icerikler: r.results.map((x) => ({ ...x, durum: durumAdi(x) })), gorunurluk: GORUNURLUK, etkilesim: ETKILESIM });
  }
  let m = yol.match(/^icerikler\/([\w-]+)$/);
  if (m && yontem === 'GET') {
    const ic = await db.prepare('SELECT * FROM icerikler WHERE id = ?').bind(m[1]).first();
    if (!ic) return hata('İçerik bulunamadı', 404);
    const [e, y, k] = await db.batch([
      db.prepare('SELECT tur, hedef_id FROM icerik_erisim WHERE icerik_id = ?').bind(ic.id),
      db.prepare('SELECT id, zaman, ad, eposta, metin, durum, uye_id FROM yorumlar WHERE icerik_id = ? ORDER BY zaman DESC LIMIT 300').bind(ic.id),
      db.prepare('SELECT zaman, kim, islem, detay FROM islem_kaydi WHERE hedef = ? ORDER BY zaman DESC LIMIT 100').bind(ic.id)
    ]);
    return json({ ok: true, icerik: { ...ic, durum: durumAdi(ic) }, erisim: e.results, yorumlar: y.results, kayitlar: k.results });
  }
  if ((yol === 'icerikler' || m) && yontem === 'POST') {
    const eski = m ? await db.prepare('SELECT * FROM icerikler WHERE id = ?').bind(m[1]).first() : null;
    if (m && !eski) return hata('İçerik bulunamadı', 404);
    const baslik = kirp(govde.baslik, 200);
    if (!baslik) return hata('Başlık gerekli', 422);
    const ka = kisaAd(govde.kisa_ad || baslik);
    if (!ka || AYRILMIS.has(ka)) return hata('Bu kısa ad kullanılamaz; başka bir kısa ad yazın.', 422);
    const cakisan = await db.prepare('SELECT id FROM icerikler WHERE kisa_ad = ? AND id != ?').bind(ka, eski ? eski.id : '').first();
    if (cakisan) return hata('Bu kısa adla başka bir içerik var.', 409);
    const gor = GORUNURLUK[govde.gorunurluk] ? govde.gorunurluk : 'gizli';
    const etk = ETKILESIM[govde.etkilesim] ? govde.etkilesim : 'kimse';
    let yz = null;
    if (govde.yayin_zamani) { const d = new Date(govde.yayin_zamani); if (isNaN(d)) return hata('Yayın zamanı geçersiz', 422); yz = d.toISOString(); }
    const arama = govde.arama === true && gor === 'herkes' ? 1 : 0;
    const hedefler = gor === 'secili' ? [...(Array.isArray(govde.uyeler) ? govde.uyeler : []).slice(0, 500).map((h) => ['uye', h]), ...(Array.isArray(govde.gruplar) ? govde.gruplar : []).slice(0, 100).map((h) => ['grup', h])].filter(([, h]) => typeof h === 'string' && /^[\w-]{1,64}$/.test(h)) : [];
    if (gor === 'secili' && !hedefler.length) return hata('“Seçili üyeler ve gruplar” için en az bir üye veya grup seçin.', 422);
    const z = simdi(), id = eski ? eski.id : kimlik();
    const deger = [baslik, ka, kirp(govde.ozet, 500) || null, typeof govde.govde === 'string' ? govde.govde.slice(0, 200000) : '', kirp(govde.kategori, 60) || null, gor, etk, arama, yz];
    const q = [eski
      ? db.prepare('UPDATE icerikler SET baslik = ?, kisa_ad = ?, ozet = ?, govde = ?, kategori = ?, gorunurluk = ?, etkilesim = ?, arama = ?, yayin_zamani = ?, guncelleme = ? WHERE id = ?').bind(...deger, z, id)
      : db.prepare('INSERT INTO icerikler (baslik, kisa_ad, ozet, govde, kategori, gorunurluk, etkilesim, arama, yayin_zamani, guncelleme, olusturma, yazar, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(...deger, z, z, kim.eposta, id),
      db.prepare('DELETE FROM icerik_erisim WHERE icerik_id = ?').bind(id),
      ...hedefler.map(([t, h]) => db.prepare('INSERT OR IGNORE INTO icerik_erisim (icerik_id, tur, hedef_id) VALUES (?, ?, ?)').bind(id, t, h))];
    await db.batch(q);
    const deg = [];
    if (!eski) deg.push('Oluşturuldu');
    else {
      if (eski.gorunurluk !== gor) deg.push(`Görünürlük: ${GORUNURLUK[eski.gorunurluk]} → ${GORUNURLUK[gor]}`);
      if (eski.etkilesim !== etk) deg.push(`Etkileşim: ${ETKILESIM[eski.etkilesim]} → ${ETKILESIM[etk]}`);
      if (eski.arama !== arama) deg.push(`Arama motorları: ${eski.arama ? 'açık' : 'kapalı'} → ${arama ? 'açık' : 'kapalı'}`);
      if ((eski.yayin_zamani || '') !== (yz || '')) deg.push('Yayın zamanı değişti');
      if (eski.baslik !== baslik || eski.govde !== deger[3] || eski.ozet !== deger[2]) deg.push('Metin güncellendi');
      if (eski.kisa_ad !== ka) deg.push(`Adres: /icerik/${eski.kisa_ad} → /icerik/${ka}`);
      if (gor === 'secili') deg.push(`Erişim listesi: ${hedefler.length} kayıt`);
    }
    await islemYaz(db, kim.eposta, eski ? 'icerik_guncelle' : 'icerik_olustur', id, deg.join(' · ') || 'Değişiklik yok');
    return json({ ok: true, id, kisa_ad: ka });
  }
  m = yol.match(/^icerikler\/([\w-]+)\/arsiv$/);
  if (m && yontem === 'POST') {
    const ic = await db.prepare('SELECT id, arsiv FROM icerikler WHERE id = ?').bind(m[1]).first();
    if (!ic) return hata('İçerik bulunamadı', 404);
    const a = govde.arsiv === true ? 1 : 0;
    await db.prepare('UPDATE icerikler SET arsiv = ?, guncelleme = ? WHERE id = ?').bind(a, simdi(), ic.id).run();
    await islemYaz(db, kim.eposta, a ? 'icerik_arsiv' : 'icerik_arsivden', ic.id);
    return json({ ok: true });
  }
  m = yol.match(/^yorumlar\/([\w-]+)\/(yayinla|gizle)$/);
  if (m && yontem === 'POST') {
    const y = await db.prepare('SELECT id, icerik_id FROM yorumlar WHERE id = ?').bind(m[1]).first();
    if (!y) return hata('Yorum bulunamadı', 404);
    await db.prepare('UPDATE yorumlar SET durum = ?, karar_veren = ?, karar_zamani = ? WHERE id = ?').bind(m[2] === 'yayinla' ? 'yayinda' : 'gizlendi', kim.eposta, simdi(), y.id).run();
    await islemYaz(db, kim.eposta, m[2] === 'yayinla' ? 'yorum_yayinla' : 'yorum_gizle', y.icerik_id, y.id);
    return json({ ok: true });
  }
  if (yol === 'uye-secim' && yontem === 'GET') {
    const r = await db.prepare("SELECT id, ad, eposta FROM uyeler WHERE durum = 'onayli' ORDER BY ad LIMIT 2000").all();
    return json({ ok: true, uyeler: r.results });
  }
  return null;
}
