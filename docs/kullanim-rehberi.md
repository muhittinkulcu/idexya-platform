# Website Yönetim kullanım rehberi

Adres: **panel.idexya.com**. Giriş Cloudflare Access ile yapılır; yalnız yönetici listesindeki e-postalar girer.
Son güncelleme: 14 Kasım 2026.

## Ekranın düzeni

- **Ortak kabuk:** Marketing, Website ve CRM ve Creative aynı iskeleti kullanır (idexya-ortak `<idexya-kabuk>`).
  - **Paket çubuğu (en üst):** Idexya, katmanlar (IDOS, Marketing, Website ve CRM, Creative); katman adının yanındaki ok o
    katmanın bütün modüllerini mega menüde açar. Tüm katmanlarda arama (⌘K): sayfa, modül ve "Yeni …" eylemleri.
    Sağda bağlantı ve son eşitleme, bildirimler, Görünüm (tema: açık, koyu, otomatik; yazı kalınlığı; yazı tipi) ve hesap (Çıkış yap).
  - **Sol menü:** modüller sekiz grupta durur (Özet, Satış, Pazarlama ve iletişim, Web sitesi, Analiz, Üyelik ve erişim, Finans,
    Sistem). Daraltılınca grup simgeleri kalır; üzerine gelince grubun modülleri ve sayfaları yanda açılır. Talep, yorum, üye
    ve destek sayıları rozet olarak görünür.
  - **Sayfa sekmeleri:** açılan sayfalar sekme olur (en çok 8); Genel bakış ilk sırada ve kapatılamaz.
  - **Sayfa başlığı:** konum, başlık ve eylemler (Yenile, Yazdır, Siteyi aç, "+ Yeni oluştur").
- **Tablolar:** her tabloda "Satır sayısı" seçimi var (varsayılan 5). Müşteriler, Siteler ve Reklam tablolarında satırları seçince
  üstte işlem çubuğu açılır: durum değiştir, etiket, CSV indir, arşivle.
- **Silme yok:** müşteri ve site kayıtları silinmez, **arşivlenir**. Arşivlenen kayıt "Arşivi göster" ile görülür ve geri alınır.
- **Kartlardaki "i" simgesi:** kartın neyi, hangi dönemi gösterdiğini bir cümleyle anlatır.
- Telefondan kullanılabilir; tarayıcının "Ana ekrana ekle" seçeneğiyle uygulama gibi açılır.

## Hazır modüller

| Grup | Modül | Ne işe yarar |
|---|---|---|
| Özet | Genel bakış | Yeni talepler, satış hunisi, talep kaynakları, reklam harcaması tek ekranda |
| Özet | Bildirimler | Sizi bekleyen işler (yanıt bekleyen talep, onay bekleyen üye, geciken görev) ve sistem uyarıları |
| Satış | Talepler | Siteden gelen formlar; "CRM'e al" ya da "Spam olarak ayır" |
| Satış | Müşteriler (CRM) | Pano ve liste görünümü, aşama, not, görüşme kaydı; müşteri kartı |
| Satış | Müşteriler (CRM) › Mükerrer kartlar | Mükerrer müşteri kartlarını birleştirme |
| Satış | Hesap envanteri | Müşterinin Google Ads, Meta, GA4, GTM hesapları ve erişim durumu (şifre tutulmaz) |
| Satış | Teklifler | Kalem kalem teklif, yazdır / PDF; gönderildi, kabul, red durumu |
| Satış | Görevler ve takvim | Ekip görevleri, takvime aktarma |
| Pazarlama | Asistan sohbetleri | Sitedeki yapay zekâ asistanıyla yapılan sohbetler |
| Pazarlama | Bülten listesi | Bülten aboneleri, CSV |
| Pazarlama | Instagram gönderileri | Sitedeki Instagram şeridi (elle ya da otomatik akış) |
| Web sitesi | Site içeriği | Hizmetler, paketler, ürünler, referanslar, SSS, menü, yasal sayfalar |
| Web sitesi | Yazılar ve kaynaklar | Blog ve üye içerikleri; görünürlük ve yorumlar |
| Web sitesi | Tema düzenleyici, Haftalık bülten, Banner stüdyosu, Medya | Menü/üst alan/altbilgi, haftalık bülten sayıları, duyuru bannerları, görseller |
| Analiz | Ziyaretçiler, SEO ve GEO, Hız ve güvenlik | Sitenin kendi ölçümü (çerezsiz), haftalık SEO denetimi, Core Web Vitals |
| Analiz | Müşteri siteleri | Müşteri sitelerinin günlük sağlık kontrolü (açılıyor mu, etiketler yerinde mi, alan adı süresi) |
| Analiz | Reklam dönüşümleri | Reklamdan gelip kazanılan müşterileri Google Ads ve Meta'ya yüklemek için CSV |
| Üyelik | Üyeler ve yetkiler, Müşteri alanı, Destek talepleri | Üyelik onayı, müşteriye davet, müşterinin destek talepleri |
| Finans | Muhasebe, Belgeler | Basit gelir-gider defteri (resmî değil), belge bağlantıları |
| Sistem | Ayarlar, Entegrasyonlar, Eşitleme (Reklam verisi çekimi, Reklam hesabı eşleştirme), Yedekler, İşlem geçmişi | Firma bilgileri, bağlı servisler, IDOS reklam çekimi ve reklam hesabını CRM müşterisine bağlama, günlük yedek, kim ne yaptı |

## Yakında ya da bağlantı bekleyenler

- **IDOS müşteri ana kaydı:** müşteri kartında IDOS'taki ana kayıt bilgisi ve "Müşteri yap" düğmesi. IDOS tarafı ve iki ayar
  (`IDOS_ORTAK_URL`, `IDOS_ORTAK_JETON`) gelince açılır. O zamana kadar Entegrasyonlar'da "Tanımlı değil" görünür; panelin geri kalanı etkilenmez.
- **Ürünler menüsü:** "AI Agency" ve "Marketplace" soluk ve "Yakında" etiketli; henüz açılmaz.
- **E-posta ile gönderim:** panel teklif ve davetleri e-postayla göndermez; bağlantıyı siz iletirsiniz.

## İlk gün yapılacaklar

1. **Entegrasyonlar** sayfasını açın; "Tanımlı değil" olanlara bakın (ör. robot doğrulaması, IP tuzu). Gerekenleri Cloudflare'de tanımlayın.
2. **Ayarlar:** firma adı, unvan, vergi bilgisi, adres ve bildirim e-postasını doldurup kaydedin (teklif çıktısında kullanılır).
3. **Müşteriler (CRM):** aktif müşterileri "+ Yeni müşteri" ile ekleyin; aşamalarını seçin.
4. **Hesap envanteri:** her müşterinin reklam ve ölçüm hesaplarını ekleyin (yalnız ad, kimlik ve erişim; şifre yazmayın).
5. **Müşteri siteleri:** müşteri sitelerinin adreslerini ekleyin; ilk kontrolü "Şimdi kontrol et" ile yapın.
6. **Eşitleme › Reklam hesabı eşleştirme:** reklam hesaplarını müşterilere bağlayın; genel bakıştaki reklam tablosu müşteri adıyla görünür.
7. **Yedekler:** son yedeğin alındığını görün (her gün 10.00'da, İstanbul saati).
8. **Site içeriği:** "Yayınlama kapalı" uyarısı görürseniz Cloudflare'de `GITHUB_TOKEN` tanımlanmalı.

## Günlük düzen (öneri)

- Sabah: **Bildirimler** → yanıt bekleyen talepler → **Talepler**'de ayıklama.
- Gün içinde: görüşmeleri müşteri kartının **Günlük** bölümüne yazın; aşamayı güncelleyin.
- Haftada bir: **SEO ve GEO** denetimi (pazartesi kendiliğinden), **Müşteri siteleri** uyarıları, **Muhasebe** kayıtları.

## Takılırsanız

- Kırmızı kutudaki hata metni ne olduğunu ve nasıl düzeleceğini söyler.
- **İşlem geçmişi** her değişikliği kim ve ne zaman ile tutar.
- Veri her gün yedeklenir; arşivlenen kayıt geri alınabilir.
