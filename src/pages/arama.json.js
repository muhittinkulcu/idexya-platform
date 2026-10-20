// Site içi arama dizini (derlemede üretilir). Yalnız herkese açık sayfalar; üyelik ve yönetim sayfaları girmez.
import gruplar from '../data/hizmetler.json';
import yazilar from '../data/yazilar.json';
export function GET() {
  const sayfalar = [
    { t: 'Ana sayfa', u: '/', d: '360° dijital performans ajansı: reklam, e-ticaret, SEO ve yazılım tek ekipte.', k: 'Sayfa' },
    { t: 'Hizmetler', u: '/tr/hizmetler', d: 'E-ticaret, dijital reklam, SEO, web ve yazılım, tasarım ve içerik hizmetlerinin tamamı.', k: 'Sayfa' },
    { t: 'Paketler', u: '/tr/paketler', d: 'İhtiyacınıza göre paketler ve paket seçme sihirbazı. Teklif isteyin.', k: 'Sayfa' },
    { t: 'IDOS', u: '/tr/idos', d: 'Reklam hesaplarınız, raporlarınız ve onaylı değişiklikler tek panelde.', k: 'Sayfa' },
    { t: 'Blog', u: '/tr/haberler', d: 'Reklam, e-ticaret ve ölçüm üzerine notlar.', k: 'Sayfa' },
    { t: 'İçerikler', u: '/icerik/', d: 'Yazılar, rehberler ve üyelere özel kaynaklar.', k: 'Sayfa' },
    { t: 'Hakkımızda', u: '/tr/sayfa/hakkimizda', d: 'Idexya | Good Things: kim olduğumuz ve nasıl çalıştığımız.', k: 'Sayfa' },
    { t: 'İletişim', u: '/tr/iletisim', d: 'Ücretsiz analiz isteyin, WhatsApp veya e-postayla ulaşın.', k: 'Sayfa' },
    { t: 'Üye olun', u: '/uye-ol', d: 'Üyelik talebi gönderin; onaylanınca size açılan bölümleri görün.', k: 'Üyelik' },
    { t: 'Giriş yapın', u: '/giris', d: 'Üye hesabınıza giriş yapın.', k: 'Üyelik' },
    { t: 'KVKK aydınlatma metni', u: '/tr/sayfa/kvkk-aydinlatma-metni', d: 'Kişisel verilerin işlenmesi hakkında bilgilendirme.', k: 'Yasal' },
    { t: 'Çerez politikası', u: '/tr/sayfa/cerez-politikasi', d: 'Sitede kullanılan çerezler ve tercihleriniz.', k: 'Yasal' },
    { t: 'Gizlilik politikası', u: '/tr/sayfa/gizlilik-politikasi', d: 'Gizlilik ilkelerimiz.', k: 'Yasal' }
  ];
  const hizmetler = gruplar.flatMap((g) => g.hizmetler.map((h) => ({ t: h.ad, u: '/tr/hizmet/' + h.slug, d: h.ozet, k: 'Hizmet · ' + g.ad })));
  const blog = yazilar.map((y) => ({ t: y.baslik, u: '/tr/haber/' + y.slug, d: 'Blog yazısı', k: 'Blog · ' + y.kategori }));
  return new Response(JSON.stringify([...sayfalar, ...hizmetler, ...blog]), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
