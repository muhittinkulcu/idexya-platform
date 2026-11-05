// Çatı site ortak içeriği. Yalnız gerçek bilgi: deneyim yılı, proje ve marka sayısı yazılmaz.
export const GRUPLAR = [
  { k: 'sosyal', ad: 'Sosyal medya ve reklam', kisa: 'Doğru kanalda, doğru bütçeyle, ölçülebilir reklam ve düzenli içerik.' },
  { k: 'web', ad: 'Web ve e-ticaret', kisa: 'Kurumsal siteden mağazaya, pazaryerine kadar satışın altyapısı.' },
  { k: 'gorunur', ad: 'Görünürlük ve otomasyon', kisa: 'Arama motorlarında görünürlük, tekrar eden işlerde otomasyon.' },
  { k: 'prod', ad: 'Prodüksiyon', kisa: 'Havadan görüntü ile markanızın mekânını ve işini gösterin.' }
];
// Menü sırası. Ayrıntılı metinler hizmet şablonuyla birlikte gelir.
export const HIZMET_MENU = [
  { s: 'sosyal-medya-icerik-yonetimi', ad: 'Sosyal Medya İçerik Yönetimi', g: 'sosyal', m: 'icerik' },
  { s: 'sosyal-medya-reklam-yonetimi', ad: 'Sosyal Medya Reklam Yönetimi', g: 'sosyal', m: 'reklam' },
  { s: 'google-ads-reklam-yonetimi', ad: 'Google Ads Reklam Yönetimi', g: 'sosyal', m: 'google' },
  { s: 'kurumsal-web-site-tasarimi', ad: 'Kurumsal Web Site Tasarımı', g: 'web', m: 'kurumsal' },
  { s: 'e-ticaret-web-site-tasarimi', ad: 'E-Ticaret Web Site Tasarımı', g: 'web', m: 'eticaret' },
  { s: 'e-ticaret-pazaryeri-yonetimi', ad: 'E-Ticaret Pazaryeri Yönetimi', g: 'web', m: 'pazaryeri' },
  { s: 'seo-geo-yonetimi', ad: 'SEO & GEO Yönetimi', g: 'gorunur', m: 'seo' },
  { s: 'ai-agent-otomasyon-yonetimi', ad: 'AI Agent Otomasyon Yönetimi', g: 'gorunur', m: 'ai' },
  { s: 'dron-cekimi', ad: 'Dron Çekimi', g: 'prod', m: 'dron' }
];
export const ILKELER = [
  ['Hesaplar sizin adınıza', 'Reklam hesabı, analiz ve mağaza hesapları size aittir. Biz yönetici olarak erişiriz; çalışma bitince erişimimiz kaldırılır, veriler sizde kalır.'],
  ['Onayınız olmadan değişiklik yok', 'Bütçe, teklif stratejisi ve kampanya açma-kapatma gibi kararlar önce size gerekçesiyle sunulur, onayınızla uygulanır.'],
  ['Önce ölçüm, sonra büyüme', 'Satış, form, arama ve mesaj ayrı ölçülmeden bütçe büyütmeyi önermeyiz. Doğru ölçüm, doğru kararın ön koşuludur.'],
  ['Şeffaf raporlama', 'Bütün hesaplarınızın sonuçlarını IDOS panelinde görürsünüz. Neyin işe yaradığını ve bir sonraki adımı açıkça paylaşırız.'],
  ['1 iş günü içinde dönüş', 'Form ve sorularınıza en geç 1 iş günü içinde dönüş yaparız. Hafta içi 09.00–18.00 arasında ulaşabilirsiniz.'],
  ['Kişisel verilere özen', 'Verileriniz KVKK’ya uygun işlenir; yalnızca işin gerektirdiği kadar yetki isteriz, erişim bilgilerini güvenli saklarız.']
];
export const PLATFORMLAR = ['Google Ads', 'Meta', 'Google Analytics 4', 'Search Console', 'Tag Manager', 'ikas', 'Ticimax', 'Trendyol', 'Hepsiburada', 'Amazon', 'N11', 'Shopify', 'WooCommerce', 'BigQuery'];
// Giriş menüsü: IDOS bağlantısı bilerek yok (Muhittin kararı).
export const GIRISLER = [
  { ad: 'Üye girişi', alt: 'Hesabım, belgelerim, destek', href: '/giris/' },
  { ad: 'Creative', alt: 'İçerik üretim ve onay paneli', href: 'https://creative.idexya.com' }
];
export const MOTIF = {
  icerik: '<rect x="14" y="14" width="72" height="72" rx="6"/><path d="M14 38h72M14 62h72M38 14v72M62 14v72"/><rect class="d" x="38" y="38" width="24" height="24"/><rect class="d" x="62" y="14" width="24" height="24"/><rect class="d" x="14" y="62" width="24" height="24"/>',
  reklam: '<circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="23"/><circle class="d" cx="50" cy="50" r="9"/><path d="M50 50 86 14M74 14h12v12"/>',
  google: '<circle cx="40" cy="40" r="25"/><path d="m58 58 28 28"/><path d="M28 50V40M40 50V30M52 50V35" stroke-width="5"/>',
  ai: '<circle class="d" cx="50" cy="50" r="10"/><circle cx="16" cy="22" r="7"/><circle cx="84" cy="22" r="7"/><circle cx="16" cy="78" r="7"/><circle cx="84" cy="78" r="7"/><circle cx="50" cy="10" r="4"/><circle cx="50" cy="90" r="4"/><path d="m22 26 21 17M78 26 57 43M22 74l21-17M78 74 57 57M50 14v26M50 60v26"/>',
  kurumsal: '<rect x="10" y="18" width="80" height="64" rx="6"/><path d="M10 34h80"/><circle class="d" cx="20" cy="26" r="2.5"/><circle class="d" cx="29" cy="26" r="2.5"/><rect class="d" x="20" y="44" width="28" height="28"/><path d="M58 46h22M58 58h22M58 70h14"/>',
  eticaret: '<path d="M20 34h60l6 52H14z"/><path d="M36 44V26a14 14 0 0 1 28 0v18"/><circle class="d" cx="36" cy="46" r="3.5"/><circle class="d" cx="64" cy="46" r="3.5"/><path d="M34 70h32"/>',
  pazaryeri: '<path d="M14 40 22 14h56l8 26"/><path d="M14 40a12 12 0 0 0 24 0 12 12 0 0 0 24 0 12 12 0 0 0 24 0"/><path d="M20 54v32h60V54"/><rect class="d" x="42" y="62" width="16" height="24"/>',
  seo: '<circle cx="50" cy="50" r="36"/><ellipse cx="50" cy="50" rx="15" ry="36"/><path d="M14 50h72M20 30h60M20 70h60"/><path class="d" d="M80 6l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>',
  dron: '<path d="m28 28 44 44M72 28 28 72"/><rect class="d" x="40" y="40" width="20" height="20" rx="4"/><circle cx="24" cy="24" r="15"/><circle cx="76" cy="24" r="15"/><circle cx="24" cy="76" r="15"/><circle cx="76" cy="76" r="15"/><path class="pervane" d="M14 24h20"/><path class="pervane" d="M66 24h20"/><path class="pervane" d="M14 76h20"/><path class="pervane" d="M66 76h20"/>'
};
export const LOGO = 'M805.5 941.0C789.5 939.6 773.1 936.9 764.5 934.3C756.7 931.9 756.3 931.6 746.0 921.1C720.9 895.7 667.2 833.4 568.0 714.7C530.9 670.3 500.2 634.0 499.9 634.0C497.9 634.0 368.7 785.5 284.0 887.0L239.0 941.0L164.7 941.0C123.9 941.0 85.5 940.5 79.4 940.0C63.6 938.6 56.3 936.2 51.0 930.4C40.2 918.6 33.5 891.3 39.1 882.0C43.7 874.4 70.2 843.0 241.0 642.0C332.3 534.6 409.4 443.6 475.3 365.5C505.5 329.8 577.5 245.7 635.2 178.8L740.3 57.0L784.4 57.0C881.2 57.1 907.3 59.5 922.5 69.4C931.9 75.6 943.7 87.6 947.1 94.5L950.2 100.9L947.5 105.6C938.4 121.1 872.8 202.1 816.0 268.0C775.4 315.1 659.1 452.8 640.6 475.8C631.9 486.6 630.8 488.3 631.7 490.3C632.8 492.5 666.2 532.8 697.4 569.5C734.7 613.3 800.8 690.6 817.0 709.5C880.9 783.6 951.0 872.7 961.4 892.7C963.7 897.3 963.4 900.9 960.0 907.6C955.9 915.9 943.1 930.3 937.5 933.0C932.5 935.4 919.2 938.3 905.0 940.1C893.5 941.5 819.7 942.2 805.5 941.0ZM208.3 288.3C124.9 190.0 109.8 171.6 92.2 146.6C59.9 100.5 56.7 78.3 80.8 67.3C88.5 63.7 102.8 61.1 119.7 60.2C137.8 59.1 266.0 59.9 266.0 61.1C266.0 63.5 318.9 126.0 381.0 197.0C446.5 271.9 463.4 293.0 471.3 309.8C474.0 315.5 474.5 317.6 474.5 324.0C474.5 330.7 474.1 332.4 470.6 339.4C465.6 349.8 459.5 356.3 452.2 359.0C439.2 363.9 432.8 364.3 350.5 364.7L273.5 365.0L208.3 288.3Z';
