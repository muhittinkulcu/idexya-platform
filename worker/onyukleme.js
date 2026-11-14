// Panel sayfaları arası önceden yükleme (Speculation Rules; Chrome ve Edge). İmleç bir panel bağlantısının üzerinde kısa süre
// durunca (eagerness "moderate": yaklaşık 200 ms ya da basma anı) bağlantının HTML'i önceden alınır; tıklayınca sayfa ağ
// beklemeden açılır. Önceden yükleme yalnız HTML'i alır; betik çalıştırmaz, veri (API) istemez, hiçbir şey yazmaz.
// Kural dosyası HTTP başlığıyla bildirilir (Speculation-Rules): panelin CSP'si script-src 'self' olduğu için satır içi
// <script type="speculationrules"> engellenir. Astro'nun <link rel="prefetch">'i kullanılmaz: panel HTML'i Cache-Control:
// no-store taşır (güvenlik), tarayıcı böyle bir yanıtı önbellekten yeniden kullanamaz; Speculation Rules ise yanıtı ayrı
// önceden yükleme belleğinde tutar.
// Kapsam: yalnız aynı kökende ve panelin kendi öneki altındaki (os alanında /website/…) bağlantılar. ASLA önceden
// yüklenmez: /api/* (veri ve yazma uçları), /cdn-cgi/* (Cloudflare Access, çıkış dahil), eski /yonetim/* adresleri (yönlendirme,
// /yonetim/veri/* indirmeleri), indirme ve yeni pencere bağlantıları, kabuğun "Çıkış yap" bağlantısı, data-onyukleme-yok işaretliler.
export const ONYUKLEME_YOL = '/panel-onyukleme.json';

export function onyuklemeKurallari(temel = '') {
  const yol = (p) => ({ href_matches: { pathname: p }, relative_to: 'document' });
  return {
    prefetch: [{
      source: 'document',
      eagerness: 'moderate',
      where: { and: [
        yol(`${temel}/*`),
        { not: yol(`${temel}/api/*`) },
        { not: yol('/api/*') },
        { not: yol('/cdn-cgi/*') },
        { not: yol(`${temel}/yonetim/*`) },
        { not: { selector_matches: '[download], [target], [data-onyukleme-yok], .ik-profil-cikis' } }
      ] }
    }]
  };
}

export const onyuklemeYaniti = (temel = '') => new Response(JSON.stringify(onyuklemeKurallari(temel)), {
  headers: { 'Content-Type': 'application/speculationrules+json', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' }
});

// Panel sayfası yanıtındaki başlık değeri (yapılandırılmış alan: tırnaklı adres listesi).
export const onyuklemeBasligi = (temel = '') => `"${temel}${ONYUKLEME_YOL}"`;
