// Site denetimi sonuçlarının açıklamaları (worker/denetim.js sorun kodları). SEO ve GEO ile Hız ve güvenlik sayfaları kullanır.
import { api, el, tarih, once, genelHata } from './ortak.js';

export const AGIRLIK_AD = { kritik: 'Kritik', onemli: 'Önemli', oneri: 'Öneri' };
export const AGIRLIK_CIP = { kritik: 'kaybedildi', onemli: 'gorusme', oneri: 'yeni' };

// alan: seo | geo | hiz | guvenlik (sayfalar hangi sorunları göstereceğini buna göre süzer)
export const SORUN = {
  durum_hata: { ad: 'Sayfa açılmıyor', agirlik: 'kritik', alan: 'seo', aciklama: 'Sitemap\'te yer alan bu adres 200 (başarılı) yanıtı vermiyor. Arama motorları açılmayan sayfayı dizinden çıkarır.', cozum: 'Sayfa taşındıysa yeni adrese 301 yönlendirmesi ekleyin (public/_redirects), kaldırıldıysa sitemap\'ten çıkarın.' },
  noindex_sitemapte: { ad: 'Sitemap\'te ama dizine kapalı', agirlik: 'kritik', alan: 'seo', aciklama: 'Sayfa "noindex" etiketi taşıyor, yani arama motorlarına "beni listeleme" diyor; ama sitemap\'te "beni listele" diye duruyor. Çelişkili sinyal.', cozum: 'Sayfa aranabilir olmalıysa noindex etiketini kaldırın; olmamalıysa sitemap\'ten çıkarın.' },
  kirik_baglanti: { ad: 'Kırık iç bağlantı', agirlik: 'kritik', alan: 'seo', aciklama: 'Sayfadaki bir bağlantı sitede olmayan bir adrese gidiyor (404). Ziyaretçi boş sayfaya düşer, arama motoru da sitenin bakımsız olduğunu düşünür.', cozum: 'Bağlantıyı doğru adresle değiştirin ya da eski adres için yönlendirme ekleyin.' },
  baslik_yok: { ad: 'Sayfa başlığı yok', agirlik: 'kritik', alan: 'seo', aciklama: '<title> etiketi boş ya da yok. Arama sonuçlarında görünen mavi başlık budur.', cozum: 'Sayfaya içeriğini anlatan, 30–60 karakterlik bir başlık yazın.' },
  baslik_kisa: { ad: 'Başlık kısa', agirlik: 'oneri', alan: 'seo', aciklama: 'Başlık 30 karakterden kısa. Kısa başlık aranan kelimeleri ve markayı birlikte taşıyamaz.', cozum: 'Ana anahtar kelimeyi ve hizmeti içeren 30–60 karakterlik bir başlık yazın.' },
  baslik_uzun: { ad: 'Başlık uzun', agirlik: 'oneri', alan: 'seo', aciklama: 'Başlık 60 karakterden uzun; Google sonuçlarında sonu "…" ile kesilir. (Sitedeki başlıklara " | Idexya | Good Things" eki otomatik eklenir, bu da uzunluğa dahildir.)', cozum: 'En önemli kelimeleri başa alın; gerekirse sayfa başlığını kısaltın ya da marka ekini sadeleştirin.' },
  aciklama_yok: { ad: 'Meta açıklama yok', agirlik: 'onemli', alan: 'seo', aciklama: 'Arama sonucunda başlığın altında görünen kısa açıklama yazılmamış; Google sayfadan rastgele bir parça seçer.', cozum: 'Sayfanın ne sunduğunu anlatan, 70–160 karakterlik bir açıklama yazın.' },
  aciklama_kisa: { ad: 'Meta açıklama kısa', agirlik: 'oneri', alan: 'seo', aciklama: 'Açıklama 70 karakterden kısa; arama sonucundaki alanı iyi kullanmıyor.', cozum: 'Faydayı ve harekete geçirici bir cümleyi ekleyerek 70–160 karaktere çıkarın.' },
  aciklama_uzun: { ad: 'Meta açıklama uzun', agirlik: 'oneri', alan: 'seo', aciklama: 'Açıklama 160 karakterden uzun; arama sonucunda kesilir.', cozum: 'En önemli bilgiyi başa alıp 160 karakterin altına indirin.' },
  h1_yok: { ad: 'Ana başlık (H1) yok', agirlik: 'onemli', alan: 'seo', aciklama: 'Sayfada H1 etiketi yok. H1, arama motoruna ve ekran okuyuculara sayfanın konusunu söyler.', cozum: 'Sayfanın en üstündeki ana başlığı H1 olarak işaretleyin.' },
  h1_coklu: { ad: 'Birden çok H1', agirlik: 'oneri', alan: 'seo', aciklama: 'Sayfada birden fazla H1 var; hangisinin ana konu olduğu belirsizleşir.', cozum: 'Tek bir H1 bırakın, diğerlerini H2 yapın.' },
  kanonik_yok: { ad: 'Kanonik adres yok', agirlik: 'onemli', alan: 'seo', aciklama: 'Sayfa kendi asıl adresini (canonical) bildirmiyor. Aynı içerik farklı adreslerden açılırsa arama motoru hangisini göstereceğini bilemez.', cozum: 'Sayfaya <link rel="canonical" href="https://idexya.com/…/"> ekleyin.' },
  kanonik_farkli: { ad: 'Kanonik adres başka sayfayı gösteriyor', agirlik: 'oneri', alan: 'seo', aciklama: 'Sayfanın kanonik etiketi kendi adresinden farklı bir adresi gösteriyor; Google bu sayfa yerine o adresi listeler.', cozum: 'Bilerek yapılmadıysa kanonik adresi sayfanın kendi adresi yapın; sitemap\'te yalnız kanonik adresler olsun.' },
  dil_yok: { ad: 'Sayfa dili belirtilmemiş', agirlik: 'onemli', alan: 'seo', aciklama: '<html lang> özelliği yok. Arama motorları ve ekran okuyucular sayfanın dilini tahmin etmek zorunda kalır.', cozum: '<html lang="tr"> (İngilizce sayfalarda "en") ekleyin.' },
  og_eksik: { ad: 'Sosyal medya önizlemesi eksik', agirlik: 'oneri', alan: 'seo', aciklama: 'og:title veya og:description etiketi yok. Bağlantı WhatsApp, LinkedIn gibi yerlerde paylaşıldığında önizleme zayıf görünür.', cozum: 'Sayfaya og:title ve og:description etiketlerini ekleyin (genelde başlık ve açıklamayla aynı).' },
  jsonld_yok: { ad: 'Yapılandırılmış veri yok', agirlik: 'oneri', alan: 'geo', aciklama: 'Sayfada JSON-LD (schema.org) verisi yok. Google ve yapay zekâ arama motorları (ChatGPT, Gemini, Perplexity) sayfanın ne olduğunu bu veriden daha kolay anlar.', cozum: 'Hizmet sayfalarına Service, sık sorulan sorulara FAQPage, ana sayfaya Organization verisi ekleyin.' },
  alt_eksik: { ad: 'Görselde alternatif metin yok', agirlik: 'onemli', alan: 'seo', aciklama: 'Bazı görsellerde alt özelliği hiç yok. Görme engelli ziyaretçiler ve Google Görseller görselin ne olduğunu bilemez.', cozum: 'Her görsele ne gösterdiğini anlatan alt metni yazın; süs amaçlı görsellere alt="" ekleyin.' },
  yonlenen_baglanti: { ad: 'Yönlendirmeli iç bağlantı', agirlik: 'oneri', alan: 'seo', aciklama: 'Bağlantı, sonunda "/" olmayan bir adrese gidiyor; site ziyaretçiyi önce doğru adrese yönlendiriyor. Her tıklamada fazladan bir istek olur ve arama motorunun tarama bütçesi harcanır.', cozum: 'Bağlantıları doğrudan kanonik adrese verin (ör. /tr/hizmetler yerine /tr/hizmetler/).' },
  agir: { ad: 'Sayfa ağır', agirlik: 'oneri', alan: 'hiz', aciklama: 'Sayfanın HTML\'i 100 KB\'tan büyük (sıkıştırılmadan). Mobilde ilk açılışı yavaşlatabilir.', cozum: 'Tekrarlanan menü ve satır içi SVG\'leri azaltın; uzun içerikleri ayrı sayfalara bölün.' },
  cok_agir: { ad: 'Sayfa çok ağır', agirlik: 'onemli', alan: 'hiz', aciklama: 'Sayfanın HTML\'i 200 KB\'tan büyük (sıkıştırılmadan). Zayıf bağlantıda ilk görüntü belirgin biçimde gecikir.', cozum: 'Satır içi büyük blokları (SVG, JSON, stil) dosyaya taşıyın, görünmeyen içeriği sonradan yükleyin.' },
  cok_betik: { ad: 'Çok sayıda betik', agirlik: 'oneri', alan: 'hiz', aciklama: 'Sayfada 10\'dan fazla <script> var. Her betik tarayıcının işini artırır, etkileşim gecikebilir (INP).', cozum: 'Betikleri birleştirin, kullanılmayanları kaldırın, gerekmeyenleri sonradan yükleyin.' },
  cok_stil: { ad: 'Çok sayıda stil dosyası', agirlik: 'oneri', alan: 'hiz', aciklama: 'Sayfa 5\'ten fazla stil dosyası yüklüyor; her biri ilk görüntüyü bekletir.', cozum: 'Stil dosyalarını birleştirin.' },
  guvenlik_basligi: { ad: 'Güvenlik başlığı eksik', agirlik: 'onemli', alan: 'guvenlik', aciklama: 'Sayfa yanıtında public/_headers dosyasındaki güvenlik başlıklarından biri yok.', cozum: 'public/_headers kuralının bu adresi kapsadığını kontrol edin.' }
};
export const SITE_SORUN = {
  robots_yok: { ad: 'robots.txt açılmıyor', agirlik: 'onemli', aciklama: 'Arama motorları tarama kurallarını ve sitemap adresini robots.txt\'ten okur.', cozum: 'public/robots.txt dosyasının yayında olduğunu kontrol edin.' },
  robots_kapali: { ad: 'robots.txt tüm siteyi kapatıyor', agirlik: 'kritik', aciklama: '"Disallow: /" kuralı tüm siteyi arama motorlarına kapatır.', cozum: 'Bu satırı kaldırın; yalnız gizli kalması gereken yolları kapatın.' },
  robots_sitemap_yok: { ad: 'robots.txt sitemap adresi vermiyor', agirlik: 'oneri', aciklama: 'robots.txt\'te "Sitemap:" satırı yok.', cozum: 'Sitemap: https://idexya.com/sitemap.xml satırını ekleyin.' },
  sitemap_yok: { ad: 'sitemap.xml açılmıyor', agirlik: 'kritik', aciklama: 'Arama motorları sitedeki sayfaları sitemap\'ten öğrenir.', cozum: 'npm run build sonrası dist/sitemap.xml üretildiğini kontrol edin (tools/sitemap.mjs).' },
  sitemap_gecersiz: { ad: 'sitemap.xml biçimi bozuk', agirlik: 'onemli', aciklama: 'Dosya geçerli bir <urlset> yapısı içermiyor.', cozum: 'tools/sitemap.mjs çıktısını kontrol edin.' },
  sitemap_bos: { ad: 'sitemap.xml boş', agirlik: 'kritik', aciklama: 'Sitemap\'te hiç adres yok.', cozum: 'Sayfaların kanonik etiketi taşıdığını ve noindex olmadığını kontrol edin.' },
  sitemap_yabanci: { ad: 'Sitemap\'te başka alan adı', agirlik: 'onemli', aciklama: 'Sitemap\'te https://idexya.com dışında adresler var.', cozum: 'Tüm adresler https://idexya.com ile başlamalı.' },
  sitemap_tekrar: { ad: 'Sitemap\'te tekrarlanan adres', agirlik: 'oneri', aciklama: 'Aynı adres sitemap\'te birden çok kez geçiyor.', cozum: 'Tekrarları kaldırın.' }
};

export const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n);
export const kb = (b) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(b / 1024) + ' KB';
export const puanRenk = (p) => (p >= 90 ? 'var(--ok)' : p >= 70 ? 'var(--warn)' : 'var(--err)');
export const puanAd = (p) => (p >= 90 ? 'İyi' : p >= 70 ? 'Geliştirilmeli' : 'Zayıf');

// Denetim çalıştırma düğmesi ve son çalıştırma bilgisi
export function calistirKur(dugme, bilgi, yenile) {
  dugme.addEventListener('click', async () => {
    dugme.disabled = true; const eski = dugme.textContent; dugme.textContent = 'Denetleniyor…';
    try { await api('denetim/calistir', {}); genelHata(''); await yenile(); }
    catch (h) { genelHata('Denetim çalıştırılamadı: ' + h.message); }
    finally { dugme.disabled = false; dugme.textContent = eski; }
  });
  return (son, sinir) => {
    if (!son) { bilgi.textContent = 'Henüz denetim çalışmadı.'; return; }
    const o = son.ozet;
    bilgi.textContent = `Son denetim: ${tarih(son.zaman)} (${once(son.zaman)}) · ${son.tetikleyen} · ${o.sayfa} sayfa, ${o.istek}/${o.sinir} istek, ${sayi(Math.round(o.sure / 100) / 10)} sn`;
  };
}

export function sinirNotu(son, sinir) {
  const o = son && son.ozet;
  const parcalar = [`Denetim sitenin kendi sayfalarını Cloudflare dosya sunucusundan okur (dış internete çıkmaz). Cloudflare ücretsiz planında bir çalıştırma en çok 50 alt istek yapabildiği için denetim en çok ${sinir} istekle sınırlıdır: önce robots.txt ve sitemap.xml, sonra sitemap'teki sayfalar, kalan hakla da sitemap'te olmayan iç bağlantılar denetlenir.`];
  if (o && o.atlananSayfa) parcalar.push(`Son çalıştırmada ${o.atlananSayfa} sayfa sınır nedeniyle denetlenemedi.`);
  if (o && o.baglanti && o.baglanti.denetlenemedi) parcalar.push(`${o.baglanti.denetlenemedi} iç bağlantı sınır nedeniyle denetlenemedi.`);
  parcalar.push('Denetim her pazartesi kendiliğinden de çalışır; son 20 çalıştırma saklanır.');
  return parcalar.join(' ');
}

// Basit SVG çizgi grafiği: puanın çalıştırmalara göre değişimi
export function puanTrendi(kutu, gecmis) {
  const liste = gecmis.slice().reverse();
  if (liste.length < 2) { kutu.replaceChildren(el('div', { class: 'bos', style: 'padding: 12px' }, liste.length ? 'Eğilim için en az iki denetim gerekir. Bir sonraki denetimden sonra çizgi görünür.' : 'Henüz denetim yok.')); return; }
  const ns = 'http://www.w3.org/2000/svg', w = 100, h = 40;
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('style', 'width: 100%; height: 120px; display: block');
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', `Son ${liste.length} denetimin puanları: ${liste.map((g) => g.ozet.puan).join(', ')}`);
  [0, 50, 100].forEach((v) => { const c = document.createElementNS(ns, 'line'); c.setAttribute('x1', 0); c.setAttribute('x2', w); c.setAttribute('y1', h - (v / 100) * h); c.setAttribute('y2', h - (v / 100) * h); c.setAttribute('stroke', 'var(--track)'); c.setAttribute('vector-effect', 'non-scaling-stroke'); s.append(c); });
  const nok = liste.map((g, i) => `${(i / (liste.length - 1)) * w},${h - (g.ozet.puan / 100) * (h - 2) - 1}`);
  const pl = document.createElementNS(ns, 'polyline');
  pl.setAttribute('points', nok.join(' ')); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', 'var(--brand)'); pl.setAttribute('stroke-width', '2.5'); pl.setAttribute('vector-effect', 'non-scaling-stroke'); pl.setAttribute('stroke-linejoin', 'round');
  s.append(pl);
  const etiket = el('div', { style: 'display: flex; justify-content: space-between; font-size: 12px; color: var(--tx2)' }, el('span', {}, tarih(liste[0].zaman, false) + ' · ' + liste[0].ozet.puan), el('span', {}, tarih(liste[liste.length - 1].zaman, false) + ' · ' + liste[liste.length - 1].ozet.puan));
  kutu.replaceChildren(s, etiket);
}

export const hucre = 'padding: 9px 12px; border-top: 1px solid rgb(var(--line)); text-align: left; vertical-align: top';
export const bas = (b, ek = '') => el('th', { scope: 'col', style: 'padding: 9px 12px; text-align: left; font-size: 12px; color: var(--tx2); white-space: nowrap' + ek }, b);
