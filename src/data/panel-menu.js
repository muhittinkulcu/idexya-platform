// Yönetim paneli menüsü: tek kaynak. Yan menü, sayfa yolu (ekmek kırıntısı), sayfa başlıkları ve "Panelde ara" buradan beslenir
// (src/layouts/Yonetim.astro; arama menünün çizilmiş hâlini okur). Test: tools/test-panel-menu.mjs.
// href'i olmayan modül veya alt sayfa henüz yapılmadı ("Yakında" görünür, tıklanmaz). Adresler worker/panel-yollar.js ile aynıdır.
export const MENU = [
  { grup: 'Özet', ad: 'Özet', ogeler: [
    { k: 'genel', ad: 'Genel bakış', href: '/dashboard', sabit: true },
    { k: 'bildirim', ad: 'Bildirimler', href: '/notifications', i: 'bildirim', altlar: [{ ad: 'Onay bekleyenler', href: '/notifications#approvals' }, { ad: 'Sistem uyarıları', href: '/notifications#alerts' }] }
  ] },
  // Satış: talep gelir → müşteri olur → teklif verilir → işler planlanır
  { grup: 'Satış', ad: 'Satış', ogeler: [
    { k: 'talepler', ad: 'Talepler', href: '/leads', i: 'talep', sayac: 'talep', altlar: [
      { ad: 'Yeni', href: '/leads?tab=new' }, { ad: 'CRM’e alınan', href: '/leads?tab=crm' },
      { ad: 'Spam', href: '/leads?tab=spam' }, { ad: 'Tümü', href: '/leads?tab=all' }] },
    { k: 'crm', ad: 'Müşteriler (CRM)', href: '/crm', i: 'crm', altlar: [
      { ad: 'Satış panosu', href: '/crm' }, { ad: 'Mükerrer kartlar', href: '/crm-conflicts' }] },
    { k: 'hesaplar', ad: 'Hesap envanteri', href: '/accounts', i: 'anahtar' },
    { k: 'teklif', ad: 'Teklifler', href: '/proposals', i: 'teklif', altlar: [
      { ad: 'Taslaklar', href: '/proposals?tab=draft' }, { ad: 'Gönderilenler', href: '/proposals?tab=sent' },
      { ad: 'Kabul edilenler', href: '/proposals?tab=accepted' }] },
    { k: 'sablonlar', ad: 'Belge şablonları', href: '/templates', i: 'belge', altlar: [
      { ad: 'Şablonlar', href: '/templates' }, { ad: 'Müşteriye belge oluştur', href: '/templates?tab=create' },
      { ad: 'Hizmet kataloğu', href: '/templates?tab=catalog' }] },
    { k: 'gorev', ad: 'Görevler ve takvim', href: '/tasks', i: 'gorev' }
  ] },
  // Pazarlama ve iletişim: ziyaretçiyle ve abonelerle temas
  { grup: 'Pazarlama ve iletişim', ad: 'Pazarlama ve iletişim', ogeler: [
    { k: 'asistan', ad: 'Asistan sohbetleri', href: '/assistant', i: 'asistan' },
    { k: 'eposta', ad: 'Bülten listesi', href: '/subscribers', i: 'eposta' },
    { k: 'instagram', ad: 'Instagram gönderileri', href: '/instagram', i: 'medya' }
  ] },
  // Web sitesi: sitede görünen her şey
  { grup: 'Web sitesi', ad: 'Web sitesi', ogeler: [
    { k: 'site', ad: 'Site içeriği', href: '/site-content', i: 'icerik', altlar: [
      { ad: 'Hizmetler', href: '/site-content?file=services' }, { ad: 'Paketler', href: '/site-content?file=packages' },
      { ad: 'Ürünler', href: '/site-content?file=products#products' }, { ad: 'Kategoriler', href: '/site-content?file=products#categories' },
      { ad: 'Referanslar', href: '/site-content?file=references' }, { ad: 'Blog yazıları', href: '/site-content?file=posts' }, { ad: 'Menüler', href: '/site-content?file=site-menu' },
      { ad: 'Sık sorulan sorular', href: '/site-content?file=faq' }, { ad: 'Yasal sayfalar', href: '/site-content?file=legal' }] },
    { k: 'icerikler', ad: 'Yazılar ve kaynaklar', href: '/articles', i: 'belge', sayac: 'yorum' },
    { k: 'tema', ad: 'Tema düzenleyici', href: '/theme', i: 'tema' },
    { k: 'haftalik-bulten', ad: 'Haftalık bülten', href: '/weekly-newsletter', i: 'radar' },
    { k: 'bannerlar', ad: 'Banner stüdyosu', href: '/banners', i: 'banner' },
    { k: 'medya', ad: 'Medya kütüphanesi', href: '/media', i: 'medya' }
  ] },
  // Analiz: sitenin nasıl performans gösterdiği
  { grup: 'Analiz', ad: 'Analiz', ogeler: [
    { k: 'ziyaret', ad: 'Ziyaretçiler', href: '/visitors', i: 'ziyaret' },
    { k: 'seo', ad: 'SEO ve GEO', href: '/seo', i: 'seo' },
    { k: 'hiz', ad: 'Hız ve güvenlik', href: '/performance', i: 'hiz' },
    { k: 'siteler', ad: 'Müşteri siteleri', href: '/client-sites', i: 'nabiz' },
    { k: 'donusum', ad: 'Reklam dönüşümleri', href: '/conversions', i: 'hedef' }
  ] },
  // Üyelik: kimin neye erişebildiği
  { grup: 'Üyelik ve erişim', ad: 'Üyelik ve erişim', ogeler: [
    { k: 'uyeler', ad: 'Üyeler ve yetkiler', href: '/members', i: 'uye', sayac: 'uye' },
    { k: 'portal', ad: 'Müşteri alanı', href: '/client-portal', i: 'portal', altlar: [{ ad: 'Erişimler', href: '/client-portal?tab=access' }, { ad: 'Davetler', href: '/client-portal?tab=invites' }] },
    { k: 'destek', ad: 'Destek talepleri', href: '/support', i: 'destek', sayac: 'destek' }
  ] },
  { grup: 'Finans', ad: 'Finans', ogeler: [
    { k: 'muhasebe', ad: 'Muhasebe', href: '/accounting', i: 'muhasebe' },
    { k: 'belge', ad: 'Belgeler', href: '/documents', i: 'belge' }
  ] },
  // Sistem: panelin kendisi ve bağlantıları
  { grup: 'Sistem', ad: 'Sistem', ogeler: [
    { k: 'ayar', ad: 'Ayarlar', href: '/settings', i: 'ayar' },
    { k: 'entegre', ad: 'Entegrasyonlar', href: '/integrations', i: 'entegre' },
    // Eşitleme (Muhittin, 13 Kas 2026): IDOS'la iki yönlü bağ tek başlıkta; reklam verisi çekimi ve reklam hesabı ↔ CRM müşterisi eşleştirmesi ve eski kartların IDOS'a tek seferlik taşınması.
    { k: 'esitle', ad: 'Eşitleme', href: '/data-sync', i: 'esitle', altlar: [
      { ad: 'Reklam verisi çekimi', href: '/data-sync' }, { ad: 'Reklam hesabı eşleştirme', href: '/crm-sync' },
      { ad: 'IDOS’a müşteri taşıma', href: '/crm-migrate' }] },
    { k: 'yedek', ad: 'Yedekler', href: '/backups', i: 'yedek' },
    { k: 'gecmis', ad: 'İşlem geçmişi', href: '/activity-log', i: 'gecmis' }
  ] }
];

// Bir panel adresinin menüdeki adı (alt öğe önce, sonra modül). Başlığı verilmeyen sayfalar adını buradan alır.
export function menuAdi(yol) {
  for (const g of MENU) for (const o of g.ogeler) {
    const alt = (o.altlar || []).find((a) => a.href === yol);
    if (alt) return alt.ad;
    if (o.href === yol) return o.ad;
  }
  return '';
}
