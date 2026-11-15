// Yönetim paneli adresleri (Muhittin, 29 Eki 2026): panel yalnız panel.idexya.com'da, İngilizce yollarla açılır
// (panel.idexya.com/dashboard, /leads, /proposals…). Sayfa dosyaları derlemede /yonetim/<yol>/ altında durur; Worker
// İngilizce adresi bu dosyaya bağlar. ESKI tablosu eski Türkçe bağlantıları (yer imleri, e-postalar, kayıtlı bildirimler) yeni adrese taşır.
export const PANEL_ALAN = 'panel.idexya.com';

export const ESKI = {
  '': 'dashboard', asistan: 'assistant', ayarlar: 'settings', bannerlar: 'banners', belgeler: 'documents',
  bildirimler: 'notifications', bulten: 'subscribers', 'crm-cakisma': 'crm-conflicts', 'crm-tasima': 'crm-migrate', 'crm-idos': 'crm-sync', crm: 'crm',
  destek: 'support', donusum: 'conversions', entegrasyonlar: 'integrations', gecmis: 'activity-log', gorevler: 'tasks',
  'haftalik-bulten': 'weekly-newsletter', hesaplar: 'accounts', hiz: 'performance', icerikler: 'articles', instagram: 'instagram',
  medya: 'media', muhasebe: 'accounting', musteri: 'customer', portal: 'client-portal', seo: 'seo', 'site-icerik': 'site-content',
  'site-saglik': 'client-sites', sablonlar: 'templates', talepler: 'leads', 'teklif-yazdir': 'proposal-print', teklifler: 'proposals', tema: 'theme',
  uyeler: 'members', 'veri-esitleme': 'data-sync', yedekler: 'backups', ziyaretciler: 'visitors'
};
export const SAYFALAR = new Set(Object.values(ESKI));

// Yerel geliştirmede (YEREL_GIRIS=evet) panel http://panel.localhost:<port> adresinde açılır.
export const panelAlani = (url, env) => url.hostname === PANEL_ALAN || (env.YEREL_GIRIS === 'evet' && url.hostname === 'panel.localhost');
export function panelKoku(url, env) {
  if (env.YEREL_GIRIS === 'evet' && ['localhost', '127.0.0.1', 'panel.localhost'].includes(url.hostname)) return `${url.protocol}//panel.localhost${url.port ? ':' + url.port : ''}`;
  return `https://${PANEL_ALAN}`;
}
// /yonetim/talepler/ → /leads; bilinmeyen eski sayfa → /dashboard
export function eskiYol(yol) {
  const ad = yol.replace(/^\/yonetim\/?/, '').replace(/\/.*$/, '');
  return '/' + (ESKI[ad] || (SAYFALAR.has(ad) ? ad : 'dashboard'));
}
// E-posta bağlantıları: panel yolu ise panel alan adı, değilse site
export const panelYoluMu = (yol) => SAYFALAR.has(String(yol).replace(/^\//, '').replace(/[/?#].*$/, ''));

// Tek adres (idexya-ortak tek-adres-plani.md adım 6, 15 Kas 2026): panel.idexya.com'daki YÖNETİM ARAYÜZÜ sayfaları
// os.idexya.com/website/... adresine kalıcı (301) gider; yol ve sorgu korunur. Yalnız şu üçü birlikte tutarsa:
// OS_YONLENDIRME_KOKU geçerli https kökü (ör. https://os.idexya.com), PANEL_TEMEL_YOL geçerli önek (/website) ve istek
// TAM OLARAK panel.idexya.com'a gelen GET/HEAD. Hedefin kökü her zaman ayardaki sabit değerdir (açık yönlendirme yok).
// Yönlenmeyenler: /api/* (yönetim API'si dahil: eski adresteki betikler ve dış çağıranlar), site sayfaları, üye alanı
// (/uye, /icerik), bülten, varlıklar, /yonetim/veri/*, tema önizlemesi (/?tema=…) ve idexya.com'un tamamı.
const OS_KOK_DESEN = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/;
export function eskiPanelOsHedefi(url, env, yontem = 'GET') {
  const kok = String((env && env.OS_YONLENDIRME_KOKU) || '').trim().replace(/\/+$/, '').toLowerCase();
  const temel = String((env && env.PANEL_TEMEL_YOL) || '').trim();
  if (!OS_KOK_DESEN.test(kok) || !/^(\/[a-z0-9-]+)+$/.test(temel)) return null;
  if (url.hostname !== PANEL_ALAN || (yontem !== 'GET' && yontem !== 'HEAD')) return null;
  const yol = url.pathname;
  let hedef = null;
  if (yol === '/') hedef = url.searchParams.has('tema') ? null : '/';
  else if (yol === '/yonetim' || (yol.startsWith('/yonetim/') && !yol.startsWith('/yonetim/veri/'))) hedef = eskiYol(yol);
  else {
    const m = yol.match(/^\/([a-z-]+)\/?$/);
    if (m && SAYFALAR.has(m[1])) hedef = '/' + m[1];
  }
  return hedef === null ? null : kok + temel + hedef + url.search;
}
