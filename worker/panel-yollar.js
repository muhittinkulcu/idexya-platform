// Yönetim paneli adresleri (Muhittin, 29 Eki 2026): panel yalnız panel.idexya.com'da, İngilizce yollarla açılır
// (panel.idexya.com/dashboard, /leads, /proposals…). Sayfa dosyaları derlemede /yonetim/<yol>/ altında durur; Worker
// İngilizce adresi bu dosyaya bağlar. ESKI tablosu eski Türkçe bağlantıları (yer imleri, e-postalar, kayıtlı bildirimler) yeni adrese taşır.
export const PANEL_ALAN = 'panel.idexya.com';

export const ESKI = {
  '': 'dashboard', asistan: 'assistant', ayarlar: 'settings', bannerlar: 'banners', belgeler: 'documents',
  bildirimler: 'notifications', bulten: 'subscribers', 'crm-cakisma': 'crm-conflicts', 'crm-idos': 'crm-sync', crm: 'crm',
  destek: 'support', donusum: 'conversions', entegrasyonlar: 'integrations', gecmis: 'activity-log', gorevler: 'tasks',
  'haftalik-bulten': 'weekly-newsletter', hesaplar: 'accounts', hiz: 'performance', icerikler: 'articles', instagram: 'instagram',
  medya: 'media', muhasebe: 'accounting', musteri: 'customer', portal: 'client-portal', seo: 'seo', 'site-icerik': 'site-content',
  'site-saglik': 'client-sites', talepler: 'leads', 'teklif-yazdir': 'proposal-print', teklifler: 'proposals', tema: 'theme',
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
