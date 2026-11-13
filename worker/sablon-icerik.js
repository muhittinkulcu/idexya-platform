// Belge şablonlarının ilk sürüm metinleri (12 Kas 2026, Muhittin onayı: "web araştırması yap, en ideali nasılsa ona göre oluştur").
// Kaynak: belge şablonları araştırması (ortak ilkeler, değişken tabloları, taslak metinler). Biçim: src/scripts/yonetim/sablon-metin.js.
// Sözleşme ve tutanak metinleri hukuki görüş değildir; sözleşme "taslak" durumunda başlar ve PDF'in her sayfasında damga taşır.
// Faiz oranı, asgari giderim gibi her yıl değişen rakamlar metne gömülmez, değişkendir (panelde girilir).
const KAPAK = '/yonetim/veri/sablon/teklif/sayfa-1.jpg';
const kapak = (baslik) => ({ tip: 'kapak', ad: 'Kapak', gorsel: KAPAK, metinler: { baslik }, alanlar: { baslik: { x: 82, y: 2049, boyut: 33 }, tarih: { x: 80, y: 2218, boyut: 31 } } });
const metin = (ad, m, ek = {}) => ({ tip: 'metin', ad, gorsel: '', metinler: ek.paraf ? { paraf: 'evet' } : {}, alanlar: {}, metin: m.trim(), ...(ek.kosul ? { kosul: ek.kosul } : {}) });

const ERISIM_1 = `
# Erişim talebi
Tarih: {tarih}

Sayın {yetkili},

{baslangic} tarihinde başlayacak çalışmalarımız için aşağıdaki hesaplara erişim rica ediyoruz. Erişimler işin gerektirdiği yetkiyle sınırlıdır ve hesapların sahipliği her zaman {firma} adına kalır.

## İlkelerimiz
- Şifrenizi istemiyoruz. Erişimi ajansımızın kendi kullanıcısına ya da işletme hesabına verebilirsiniz.
- Yalnız işin gerektirdiği yetkiyi istiyoruz; her hesap için istenen yetki sonraki sayfadaki tabloda yazılıdır.
- Hesaplarınızda iki adımlı doğrulamayı açık tutmanızı öneririz.
- Çalışmamız sona erdiğinde erişimlerimizi kaldırırız ya da kaldırmanıza yardımcı oluruz.
- Erişim vermek hesabın sahipliğini değiştirmez; erişimi istediğiniz zaman geri alabilirsiniz.

## Ajans bilgilerimiz
Erişimleri aşağıdaki ajans hesaplarına vermeniz yeterlidir.

| Bilgi | Değer |
|---|---|
| Ajans | {ajans_unvan} |
?{erisim_meta=evet} | Meta işletme kimliği | {ajans_meta_isletme_id} |
?{erisim_google_ads=evet} | Google Ads yönetici hesabı | {ajans_mcc_id} |
?{google_urunu=evet} | Google ürünleri için e-posta | {ajans_google_eposta} |

## Son tarih ve iletişim
Erişimleri **{son_tarih}** tarihine kadar verebilirseniz çalışmalara planlandığı gibi başlayabiliriz. Adımlardan herhangi birinde takılırsanız {ajans_muhatap} ile kısa, ekran paylaşımlı bir görüşmeyle birlikte yapabiliriz.

> Güvenlik notu: Bu belgede şifre ya da doğrulama kodu istenmez. Sizden şifre isteyen bir mesaj alırsanız lütfen bizi telefonla arayarak doğrulayın.
`;

const ERISIM_2 = `
// Menü adları platformlar tarafından sık değişir; tabloyu çeyrekte bir platformların yardım sayfalarına göre gözden geçirin.
## Erişim listesi
Yalnız sizinle çalışacağımız hesaplar listelenmiştir. Erişimi verdiğinizde son sütunu işaretleyebilirsiniz.

| Platform | İstenen yetki | Nasıl verilir | Kim yapmalı | Verildi |
|---|---|---|---|---|
?{erisim_google_ads=evet} | Google Ads | Yönetici hesabı bağlantısı (standart erişim) | Ajans {ajans_mcc_id} numaralı yönetici hesabından bağlantı isteği gönderir; siz Yönetici → Erişim ve güvenlik → Yöneticiler sekmesinden onaylarsınız. | Hesapta yönetici yetkisi olan kişi | |
?{erisim_meta=evet} | Meta (Facebook, Instagram) | İş ortağı erişimi: reklam hesabı, sayfa, Instagram hesabı, piksel ve katalog | İşletme Ayarları → İş ortakları → Ekle; işletme kimliği {ajans_meta_isletme_id}; varlıkları seçip görev bazlı yetki verin. | İşletme portföyünde yönetici olan kişi | |
?{erisim_ga4=evet} | Google Analytics 4 | Mülk düzeyinde Düzenleyici | Yönetici → Mülk erişim yönetimi → + → Kullanıcı ekle → {ajans_google_eposta} | Mülkte Yönetici rolündeki kişi | |
?{erisim_gtm=evet} | Google Tag Manager | Kapsayıcı: Yayınlama; hesap: Kullanıcı | Yönetici → Kullanıcı yönetimi → + → e-posta ve kapsayıcı izni | Hesapta yönetici olan kişi | |
?{erisim_gsc=evet} | Search Console | Tam kullanıcı (sahiplik değil) | Ayarlar → Kullanıcılar ve izinler → Kullanıcı ekle → {ajans_google_eposta} | Mülk sahibi | |
?{erisim_merchant=evet} | Google Merchant Center | Standart erişim | Ayarlar → İnsanlar ve erişim → Kişi ekle → {ajans_google_eposta} | Hesap yöneticisi | |
?{erisim_hosting=evet} | Barındırma (hosting) | Ayrı alt kullanıcı ya da yalnız gerekli dosya ve veritabanı erişimi | Barındırma panelinde alt kullanıcı açın; bu yoksa kısa bir teknik görüşme planlarız. | Barındırma hesap sahibi | |
?{erisim_alan_adi=evet} | Alan adı | DNS kayıtlarını düzenleme yetkisi | Alan adı firmasında yetkili kişi ekleyin ya da DNS ayarını birlikte yapalım; alan adı firmanız adına kayıtlı kalmalıdır. | Alan adı hesap sahibi | |
?{erisim_pazaryeri=evet} | Pazaryeri satıcı paneli | Alt kullanıcı: ürün, kampanya, reklam (ödeme yetkisi yok) | Satıcı paneli → kullanıcı yönetimi | Mağaza yöneticisi | |

## Sizden rica ettiğimiz bilgiler
?{erisim_google_ads=evet} - Google Ads müşteri kimliği (biliyorsanız): ____________________
- Hesaplarda yönetici yetkisi olan kişinin adı ve e-postası: ____________________
?{alan_adi_hosting=evet} - Alan adının ve barındırmanın hangi firmada, kimin adına kayıtlı olduğu: ____________________

Saygılarımızla,
**{ajans_yetkili}** · {ajans_unvan}

@imza
| Talep eden (Ajans) | Erişimleri veren (Müşteri) |
| {ajans_unvan} | {firma} |
| {ajans_yetkili} | {yetkili} |
`;

const ODEME_ORTAK_SON = `
Saygılarımızla,
**{ajans_yetkili}** · {ajans_unvan}
`;
const FATURA_TABLO = `
| Fatura no | Fatura tarihi | Vade | Tutar (KDV dahil) |
|---|---|---|---|
| {faturalar} |
| **Toplam** | | | **{toplam_borc}** |
`;
const ODEME_1 = `
// 1. hatırlatma: vadeden 3–7 gün sonra gönderilir. Kısa ve kibar; tehdit dili, büyük harf ve ünlem kullanılmaz.
# Ödeme hatırlatması
Tarih: {tarih}

Sayın {yetkili},

Aşağıdaki faturanın vadesi geçmiş görünüyor. Yoğunluk içinde gözden kaçmış olabileceğini düşünerek hatırlatmak istedik.
${FATURA_TABLO}
?{ajans_iban!=} Ödemeyi aşağıdaki hesaba, açıklamaya fatura numarasını yazarak yapabilirsiniz:
?{ajans_iban!=} **{ajans_unvan}** · IBAN: **{ajans_iban}**
?{ajans_iban=} Ödemeyi açıklamaya fatura numarasını yazarak yapabilirsiniz. Hesap bilgilerimiz faturada yer almaktadır.

Ödemeyi son günlerde yaptıysanız bu yazıyı dikkate almayınız; dekontu bizimle paylaşırsanız kayıtlarımızı güncelleriz. Faturayla ilgili bir sorunuz ya da farklı bir ödeme planı ihtiyacınız varsa {ajans_eposta} ya da {ajans_telefon} üzerinden bize ulaşabilirsiniz.

İyi çalışmalar dileriz.
${ODEME_ORTAK_SON}
> Bu yazı resmî ihtarname değildir; bilgilendirme ve hatırlatma amacıyla hazırlanmıştır.
`;
const ODEME_2 = `
// 2. hatırlatma: 1. hatırlatmadan 7–10 gün sonra; son ödeme tarihi en az 7 gün sonrası.
// Faiz dayanağı, oranı ve asgari giderim tutarı her yıl değişir; göndermeden önce avukatla teyit edin (bu not PDF'te görünmez).
// Askıya alma satırı yalnız sözleşmede askıya alma hakkı varsa seçilir.
# Ödeme hatırlatması — ikinci bildirim
Tarih: {tarih}

Sayın {yetkili},

{onceki_hatirlatma_tarihi} tarihli hatırlatmamıza rağmen aşağıdaki faturaların ödemesi henüz yapılmamıştır. En eski fatura {gecikme_gun} gündür gecikmededir.
${FATURA_TABLO}
?{ajans_iban!=} Toplam **{toplam_borc}** tutarın en geç **{son_odeme_tarihi}** tarihine kadar {ajans_unvan} adına kayıtlı **{ajans_iban}** numaralı hesabımıza ödenmesini rica ederiz.
?{ajans_iban=} Toplam **{toplam_borc}** tutarın en geç **{son_odeme_tarihi}** tarihine kadar ödenmesini rica ederiz. Hesap bilgilerimiz faturada yer almaktadır.

Bu tarihe kadar ödeme yapılmazsa:
- {faiz_dayanagi} uyarınca vade tarihinden itibaren {faiz_orani} oranında temerrüt faizi işletilecek ve {asgari_giderim} tutarındaki asgari giderim (tahsil masrafı) talep edilecektir;
?{askiya_alma=evet} - {sozlesme_no} numaralı sözleşmemizdeki hakkımıza dayanarak hizmetlerimizi {askiya_alma_tarihi} tarihinden itibaren ödeme yapılana kadar askıya alacağız. Bu durumda yayındaki reklamlarınız bütçe güvenliği için durdurulacak; hesaplarınız ve verileriniz silinmeyecektir;
- alacağın tahsili için yasal takip ve arabuluculuk sürecini başlatmak zorunda kalacağız.

Bu adımları atmak istemiyoruz. Ödemeyi bölmek ya da bir tarih üzerinde anlaşmak isterseniz {son_odeme_tarihi} tarihinden önce bizimle iletişime geçmeniz yeterli. Ödemeyi yaptıysanız dekontu paylaşmanızı rica ederiz.
${ODEME_ORTAK_SON}
> Bu yazı resmî ihtarname değildir. Hukuki sonuç doğurması istenen ihtar noter ya da KEP aracılığıyla ayrıca yapılır.
`;

const FIYAT = `
// Bildirim ile yürürlük arası en az 30 gün olmalı; sözleşmede bildirim süresi yazılıysa o esas alınır.
# Fiyat güncelleme bildirimi
Tarih: {tarih}

Sayın {yetkili},

{firma} ile birlikte çalışmaya devam etmekten memnuniyet duyuyoruz. Bu yazıyla {yururluk_tarihi} tarihinden itibaren geçerli olacak aylık hizmet ücretlerimizi önceden bildirmek istiyoruz.

| Hizmet | Mevcut aylık ücret | Yeni aylık ücret | Değişim |
|---|---|---|---|
| {fiyat_satirlari} |
| **Toplam (KDV hariç)** | **{eski_toplam}** | **{yeni_toplam}** | **{toplam_degisim}** |

**Neden?** {gerekce_metni}

?{kapsam_degisikligi=} **Kapsamda değişiklik:** Hizmet kapsamı aynı kalmaktadır.
?{kapsam_degisikligi!=} **Kapsamda değişiklik:** {kapsam_degisikligi}
?{secenekler!=} **Seçenekler:** {secenekler}

?{sozlesme_maddesi_var=evet} {sozlesme_no} numaralı sözleşmemizin {sozlesme_maddesi} uyarınca bu bildirimi yürürlük tarihinden {bildirim_gun} gün önce yapıyoruz. Yeni ücreti uygun bulmazsanız, yürürlük tarihine kadar sözleşmeyi ek bir bedel ödemeden sona erdirme hakkınız saklıdır.
?{sozlesme_maddesi_var=evet} Sorularınızı ya da görüşmek istediğiniz noktaları {yanit_tarihi} tarihine kadar iletmenizi rica ederiz. Bu tarihe kadar bir görüş bildirmezseniz {yururluk_tarihi} tarihli faturamız yeni ücretle düzenlenecektir.
?{sozlesme_maddesi_var=hayir} Sorularınızı ya da görüşmek istediğiniz noktaları {yanit_tarihi} tarihine kadar iletmenizi rica ederiz. Yeni ücretleri kabul ettiğinizi bu belgeyi imzalayarak ya da e-postayla yazılı olarak bildirmenizi rica ederiz.

Saygılarımızla,
**{ajans_yetkili}** · {ajans_unvan}

- [ ] Yeni ücretleri kabul ediyorum.

@imza
| Ajans | Müşteri onayı |
| {ajans_unvan} | {firma} |
| {ajans_yetkili} | Ad soyad, imza ve tarih |
`;

const TESLIM = `
// Bu tutanak avukat incelemesinden geçmelidir; hukuki görüş değildir. Şifre ve doğrulama kodu bu belgeye yazılmaz.
# Teslim tutanağı
Belge no: {belge_no} · Tarih: {tarih}

## 1. Taraflar ve dayanak
Bu tutanak, {ajans_unvan} ("Ajans") ile {firma} ("Müşteri") arasındaki {sozlesme_no} numaralı sözleşme ve {teklif_no} numaralı teklif kapsamında yapılan **{proje_adi}** işinin teslimini kayda almak için düzenlenmiştir.

## 2. Proje özeti
| Yayın adresi | Yayın tarihi | Altyapı |
|---|---|---|
| {site_adresi} | {yayin_tarihi} | {altyapi} |

## 3. Teslim edilenler
| Kalem | Açıklama | Teslim yöntemi | Durum |
|---|---|---|---|
| {teslim_kalemleri} |

## 4. Hesaplar ve erişim
| Hesap | Kimin adına kayıtlı | Ajans erişimi sürüyor mu |
|---|---|---|
| {hesaplar} |

Yönetici kullanıcı bilgileri bu tutanakta yer almaz; {tarih} tarihinde ayrı ve güvenli bir kanaldan Müşteri yetkilisine iletilmiştir. Müşteri, ilk girişte şifreleri değiştirmeyi ve iki adımlı doğrulamayı açmayı kabul eder.

## 5. Yapılan kontroller
?{test_mobil=evet} - [x] Mobil uyum
?{test_mobil!=evet} - [ ] Mobil uyum
?{test_form=evet} - [x] Form gönderimi
?{test_form!=evet} - [ ] Form gönderimi
?{test_ssl=evet} - [x] SSL sertifikası ve güvenli bağlantı
?{test_ssl!=evet} - [ ] SSL sertifikası ve güvenli bağlantı
?{test_hiz=evet} - [x] Hız ölçümü
?{test_hiz!=evet} - [ ] Hız ölçümü
?{test_404=evet} - [x] 404 sayfası
?{test_404!=evet} - [ ] 404 sayfası
?{test_yonlendirme=evet} - [x] Eski adreslerden yönlendirmeler
?{test_yonlendirme!=evet} - [ ] Eski adreslerden yönlendirmeler
?{test_yedek=evet} - [x] Yedek alındı
?{test_yedek!=evet} - [ ] Yedek alındı

## 6. Açık işler ve çekinceler
| İş | Sorumlu | Hedef tarih |
|---|---|---|
| {acik_isler} |

?{acik_is_engel=hayir} Bu işler teslimin kabulüne engel değildir.
?{acik_is_engel=evet} Bu işler tamamlanmadan teslim kabul edilmiş sayılmaz.

## 7. Üçüncü taraf bileşenler
Sitede kullanılan tema, eklenti, yazı tipi ve görseller kendi lisans koşullarına tabidir; listesi ve yenileme tarihleri aşağıdadır. Yıllık lisans yenilemeleri, aksi yazılı kararlaştırılmadıkça Müşterinin sorumluluğundadır.

| Bileşen | Lisans | Yenileme tarihi |
|---|---|---|
| {bilesenler} |

## 8. Fikrî haklar ve kaynak kod
Sözleşmenin 12. maddesinde sayılan mali haklar, proje bedelinin tamamının ödendiği tarihte Müşteriye geçer. Ödeme durumu: **{odeme_durumu_metni}**.
?{odeme_durumu=odendi} Kaynak kod ve tasarım dosyaları bedelin tamamı ödendiği için teslim edilmiştir.
?{odeme_durumu=kalan} Kaynak kod ve tasarım dosyaları bedelin tamamı ödendiğinde teslim edilecektir.

## 9. Garanti ve destek
{garanti_bitis} tarihine kadar, teslim edilen kapsamdaki hatalar ücretsiz giderilir. Müşteri ya da üçüncü kişilerin müdahalesi, sunucu ve eklenti güncellemelerinden doğan sorunlar ve yeni özellik talepleri garanti kapsamı dışındadır. Bakım: {bakim_paketi}.

## 10. Yayın sonrası Müşteri sorumlulukları
Alan adı ve barındırma sürelerinin yenilenmesi; site içeriklerinin, fiyatların ve kampanya bilgilerinin doğruluğu; aydınlatma metni, çerez politikası ve mesafeli satış metinlerinin hukuka uygunluğu; barındırma paketinde yoksa düzenli yedek.

## 11. İnceleme ve kabul
Müşteri, işi bu tutanak tarihinden itibaren {kabul_suresi_gun} iş günü içinde inceleyerek fark ettiği hataları yazılı ve ayrıntılı olarak bildirebilir. Bu süre içinde bildirim yapılmazsa iş kabul edilmiş sayılır. Gizli kalmış hatalar ortaya çıktığında gecikmeden bildirilir.

Müşteri beyanı (birini işaretleyiniz):
- [ ] İşi eksiksiz teslim aldım ve kabul ediyorum.
- [ ] İşi 6. maddedeki açık işlerin tamamlanması koşuluyla kabul ediyorum.
- [ ] İşi kabul etmiyorum; gerekçeler ekte yazılıdır.

@imza
| Teslim eden (Ajans) | Teslim alan (Müşteri) |
| {ajans_unvan} | {firma} |
| {ajans_yetkili} | {yetkili} |
`;

const SOZLESME = `
// TASLAK: Bu metin avukat incelemesinden geçmelidir; hukuki görüş değildir. Faiz, damga vergisi ve süreler avukat ve mali müşavirle teyit edilmelidir.
// Müşteri tacir değilse 1.3 ikinci cümlesi ve 23.3 basılmaz ("Müşteri tacir mi?" seçimi).
# Hizmet sözleşmesi
Sözleşme no: {belge_no} · Tarih: {tarih}

## Madde 1 – Taraflar
1.1. {ajans_unvan}, {ajans_adres}, {ajans_vergi}, MERSİS {ajans_mersis} (bundan sonra "Ajans").
1.2. {firma}, {firma_adres}, {firma_vergi_dairesi} V.D. {firma_vkn} (bundan sonra "Müşteri").
?{musteri_tacir=evet} 1.3. Taraflar bu sözleşmede birlikte "Taraflar" olarak anılır. Taraflar ticari işletmeleriyle ilgili olarak hareket ettiklerini beyan eder.
?{musteri_tacir=hayir} 1.3. Taraflar bu sözleşmede birlikte "Taraflar" olarak anılır.

## Madde 2 – Tanımlar
- **Hizmet:** Ek-1A ve/veya Ek-1B'de kapsamı yazılı işler.
- **Ajans ücreti:** Ajansın emeği karşılığı aldığı bedel. Reklam bütçesi bu bedele dahil değildir.
- **Reklam bütçesi:** Reklam platformlarına (Google, Meta, pazaryerleri vb.) reklam gösterimi için ödenen tutar.
- **Platform:** Google Ads, Google Analytics, Meta (Facebook, Instagram), pazaryerleri ve benzeri üçüncü taraf hizmetler.
- **Teslim edilen iş:** Ajansın bu sözleşme kapsamında ürettiği ve Müşteriye sunduğu tasarım, metin, görsel, kod ve raporlar.
- **Yazılı bildirim:** İmzalı yazı, KEP ya da Madde 21'de yazılı e-posta adreslerinden gönderilen e-posta.

## Madde 3 – Sözleşmenin konusu ve ekleri
3.1. Bu sözleşme, Ajansın Ek-1A ve/veya Ek-1B'de yazılı hizmetleri vermesine ve Müşterinin bunların bedelini ödemesine ilişkin koşulları düzenler.
3.2. Ekler sözleşmenin ayrılmaz parçasıdır. Çelişki hâlinde öncelik sırası: (1) bu ana metin, (2) Ek-2 KVKK veri işleme eki (kişisel veri konularında ana metne göre önceliklidir), (3) Ek-1A / Ek-1B, (4) imzalı fiyat teklifi.
3.3. Eklerde yazılı olmayan işler kapsam dışıdır; Madde 11'e göre ayrıca fiyatlandırılır.

## Madde 4 – Süre ve yürürlük
4.1. Sözleşme {baslangic} tarihinde yürürlüğe girer.
?{ek_1a=evet} 4.2. Aylık hizmetler için sözleşme {asgari_sure_ay} aylık ilk dönem için yapılmıştır. Taraflardan biri dönem sonundan en az {ihbar_suresi_gun} gün önce yazılı bildirimde bulunmazsa sözleşme birer aylık dönemlerle kendiliğinden uzar.
?{ek_1b=evet} 4.3. Proje işi, Ek-1B'deki teslim ve kabul tamamlanınca ve garanti süresi bitince sona erer.

## Madde 5 – Ajansın yükümlülükleri
5.1. Ajans hizmetleri, mesleğin gerektirdiği özen ve dürüstlükle, platformların yürürlükteki kurallarına ve mevzuata uygun olarak yürütür.
5.2. Ajans, Ek-1A'da yazılı sıklıkta raporlama yapar. Raporlarda reklam harcaması, platformların bildirdiği sonuçlar ve ajansın değerlendirmesi ayrı ayrı gösterilir.
5.3. Ajans, Müşteri adına yayımlanacak reklam ve içerikleri Madde 11'deki onay süreci tamamlanmadan yayımlamaz; acil durumlarda (ör. bütçe aşımı, hatalı reklam) reklamı durdurma yetkisi saklıdır ve durumu aynı gün bildirir.
5.4. Ajans, Müşteri hesaplarında yaptığı önemli değişiklikleri (bütçe, hedefleme, kampanya açma ve kapama) kayıt altına alır ve Müşteri istediğinde paylaşır.

## Madde 6 – Müşterinin yükümlülükleri
6.1. Müşteri, hizmet için gereken bilgi, belge, görsel, ürün bilgisi ve hesap erişimlerini zamanında sağlar. Gecikmeden doğan aksamalardan Ajans sorumlu değildir; teslim tarihleri gecikme kadar uzar.
6.2. Müşteri, kendisinin verdiği ya da onayladığı içeriklerdeki (fiyat, kampanya, ürün özelliği, sağlık ve çevre beyanı, karşılaştırma vb.) iddiaların doğru ve ispatlanabilir olduğunu, üçüncü kişilerin haklarını ihlal etmediğini ve gerekli izinlere sahip olduğunu kabul eder; istendiğinde dayanak belgeleri verir.
6.3. Müşteri, Ajansın Müşteri adına yürüttüğü hesapların sahibidir; hesapların ödeme yöntemi, vergi bilgisi ve yasal yükümlülükleri Müşteriye aittir.
6.4. Müşteri, mevzuata ya da platform kurallarına aykırı bir reklamı veya içeriği Ajanstan isteyemez. Ajans böyle bir talebi gerekçesini yazarak reddedebilir; bu ret sözleşmeye aykırılık sayılmaz.

## Madde 7 – Reklam bütçesi ve platform ödemeleri
7.1. Reklam bütçesi Ajans ücretinden ayrıdır ve Ajans ücretine dahil değildir.
?{butce_odeme=musteri} 7.2. Reklam bütçesi, platformlara doğrudan Müşterinin kendi ödeme yöntemiyle ödenir; platform faturaları Müşteri adına düzenlenir.
?{butce_odeme=ajans} 7.2. Ajans, reklam bütçesini ancak Müşteri bütçeyi önceden Ajansa ödedikten sonra platforma yükler; Ajans kendi kaynağından bütçe ödemesi yapmakla yükümlü değildir. Kullanılmayan bütçe sözleşme sonunda {iade_suresi_gun} gün içinde iade edilir.
7.3. Müşterinin onayladığı aylık bütçe {reklam_butcesi} olup Ajans bu tutarı Müşterinin yazılı onayı olmadan artırmaz. Platformların günlük harcama dağıtımı nedeniyle aylık toplamda küçük sapmalar olabilir; Ajans aylık toplamın onaylı bütçeyi aşmaması için gerekli ayarları yapar.
7.4. Ödeme yöntemi reddi, kart limiti ya da platform borcu nedeniyle reklamların durmasından Ajans sorumlu değildir; Ajans durumu öğrendiğinde Müşteriye bildirir.

## Madde 8 – Hizmet bedeli, faturalama ve ödeme
?{ek_1a=evet} 8.1. Aylık ajans ücreti {aylik_tutar} ({aylik_tutar_yazi}) + KDV'dir.
?{ek_1b=evet} 8.1-B. Proje bedeli {proje_tutar} ({proje_tutar_yazi}) + KDV olup Ek-1B'deki ödeme planına göre ödenir.
8.2. Tüm tutarlara KDV dahil değildir; KDV yürürlükteki oranla ayrıca faturalanır.
?{ek_1a=evet} 8.3. Aylık ücret, her ayın {fatura_gunu}. günü o ay için peşin faturalanır.
8.4. Faturalar elektronik ortamda (e-fatura ya da e-arşiv fatura) düzenlenir ve Müşterinin bildirdiği adrese iletilir.
8.5. Fatura bedeli, fatura tarihinden itibaren {vade} gün içinde {ajans_iban} numaralı hesaba ödenir. Ödeme açıklamasına fatura numarası yazılır. Banka masrafları ödeyene aittir.
8.6. Fatura içeriğine itiraz, fatura tarihinden itibaren 8 gün içinde yazılı yapılır.

## Madde 9 – Gecikme ve hizmetin askıya alınması
9.1. Madde 8.5'teki vade belirli bir gün olduğundan, vadede ödenmeyen tutar için Müşteri ayrıca ihtara gerek kalmadan temerrüde düşer.
9.2. Geciken tutara, vade tarihinden ödeme tarihine kadar {gecikme_faizi} temerrüt faizi uygulanır. Ajansın kanundaki asgari giderim (tahsil masrafı) hakkı saklıdır.
9.3. Ödeme vadeden itibaren {askiya_alma_gun} gün gecikirse Ajans, yazılı bildirimde bulunarak hizmetleri ödeme yapılana kadar askıya alabilir. Askıya alma, Müşteri hesaplarının kapatılması ya da Müşteri verilerinin silinmesi anlamına gelmez; Ajans yalnız kendi çalışmasını durdurur. Yayındaki reklamlar, Müşteri aksini yazılı istemedikçe bütçe kontrolü kaybolmaması için durdurulur.
9.4. Askıya alma süresince aylık ücret işlemeye devam eder; askıdan doğan sonuçlardan (ör. kampanyanın durması) Ajans sorumlu değildir.

## Madde 10 – Fiyat güncelleme
10.1. Ajans, aylık ücreti en fazla {fiyat_guncelleme_sikligi} bir kez, en az {fiyat_bildirim_gun} gün önceden yazılı bildirimde bulunarak güncelleyebilir.
10.2. Müşteri yeni fiyatı kabul etmezse, yeni fiyatın yürürlük tarihine kadar sözleşmeyi ek bedel ödemeden feshedebilir; bu durumda asgari süre ve cayma hükümleri uygulanmaz.

## Madde 11 – Onay süreci, revizyon ve kapsam dışı işler
11.1. Ajans, yayımlanacak içerik ve reklam taslaklarını Müşterinin {yetkili_eposta} adresine ya da Taraflarca belirlenen ortak çalışma ortamına iletir. Müşteri {onay_suresi_gun} iş günü içinde onaylar ya da düzeltme ister.
11.2. Her teslim için {revizyon_hakki} tur ücretsiz düzeltme hakkı vardır. Onaylanmış bir işin yeniden yapılması ya da kapsamın değişmesi yeni iştir.
11.3. Kapsam dışı işler, Ajansın yazılı fiyat teklifini Müşteri yazılı olarak kabul etmeden başlatılmaz.

## Madde 12 – Fikrî mülkiyet
12.1. **Müşteri malzemeleri:** Müşterinin verdiği logo, marka, görsel, metin ve verilerin hakları Müşteride kalır. Müşteri, bunları hizmet süresince ve hizmet amacıyla kullanması için Ajansa ücretsiz kullanım izni verir.
?{hak_devri=devir} 12.2. **Ajansın ürettiği işler:** Ajans, sözleşme kapsamında ürettiği ve bedeli tamamen ödenmiş teslim edilen işler üzerindeki 5846 sayılı Fikir ve Sanat Eserleri Kanunu'ndan doğan işleme (m. 21), çoğaltma (m. 22), yayma (m. 23), temsil (m. 24) ve işaret, ses ve/veya görüntü nakline yarayan araçlarla umuma iletim (m. 25) haklarını, süre ve yer sınırı olmaksızın Müşteriye devreder. Devir, ilgili bedelin ödendiği tarihte hüküm doğurur.
?{hak_devri=lisans} 12.2. **Ajansın ürettiği işler:** Ajans, sözleşme kapsamında ürettiği ve bedeli tamamen ödenmiş teslim edilen işler üzerindeki 5846 sayılı Fikir ve Sanat Eserleri Kanunu'ndan doğan işleme (m. 21), çoğaltma (m. 22), yayma (m. 23), temsil (m. 24) ve umuma iletim (m. 25) haklarını, süre ve yer sınırı olmaksızın Müşteriye süresiz, münhasır olmayan kullanma yetkisi olarak verir. Yetki, ilgili bedelin ödendiği tarihte hüküm doğurur.
?{ek_1b=evet} 12.3. **Kaynak kod:** Bedelin tamamı ödendiğinde Ajans, projeye özel yazılmış kaynak kodunu ve tasarım dosyalarını Müşteriye teslim eder.
12.4. **Ajansın genel araçları:** Ajansın birden çok projede kullandığı kendi kod kütüphaneleri, şablonları, iş yöntemleri ve bilgi birikimi Ajansta kalır; Müşteri, teslim edilen işte yer aldıkları ölçüde bunları süresiz kullanabilir.
12.5. **Üçüncü taraf bileşenler:** Tema, eklenti, yazı tipi, stok görsel ve açık kaynak yazılım gibi bileşenler kendi lisans koşullarına tabidir ve devredilmez. Ücretli lisanslar Müşteri adına alınır ya da Müşteriye devredilir.
12.6. **Ödenmemiş işler:** Bedeli ödenmemiş işlerin kullanımı Ajansın yazılı iznine bağlıdır.
12.7. **Referans kullanımı:** Ajans, Müşterinin yazılı itirazı yoksa Müşteri adını, logosunu ve yayımlanmış işleri kendi referans listesinde kullanabilir; gizli bilgi ve performans verisi paylaşılmaz.

## Madde 13 – Hesap sahipliği ve erişim
13.1. Reklam hesapları, Analytics, Search Console, Tag Manager, Meta işletme hesabı, pazaryeri mağazası, alan adı ve barındırma hesapları Müşteri adına açılır ve Müşteriye aittir. Ajans bu hesaplara kendi kullanıcısı ya da iş ortağı hesabı üzerinden, işin gerektirdiği yetkiyle erişir.
13.2. Ajans Müşterinin şifresini istemez ve kullanmaz. Müşteri hesaplarında iki adımlı doğrulama açık tutulur.
13.3. Ajans tarafından açılması gereken bir hesap olursa, sahipliği sözleşme sona erdiğinde Müşteriye devredilir.

## Madde 14 – Gizlilik
14.1. Taraflar, sözleşme nedeniyle öğrendikleri ticari sır, fiyat, müşteri listesi, satış ve performans verisi, strateji ve hesap bilgilerini gizli tutar; yalnız sözleşmenin ifası için ve bilmesi gereken çalışanlarıyla paylaşır.
14.2. Kamuya açık bilgi, karşı taraftan bağımsız olarak elde edilen bilgi ve yasal zorunlulukla açıklanması gereken bilgi gizlilik kapsamı dışındadır.
14.3. Gizlilik yükümlülüğü sözleşme bittikten sonra {gizlilik_suresi_yil} yıl daha sürer.

## Madde 15 – Kişisel verilerin korunması
15.1. Ajans, hizmet sırasında Müşteri adına ve Müşterinin talimatıyla kişisel veri işlediği ölçüde 6698 sayılı Kanun bakımından veri işleyen, Müşteri veri sorumlusudur.
?{ek_2=evet} 15.2. Veri işlemeye ilişkin ayrıntılar Ek-2'dedir.
15.3. Müşteri, Ajansa aktardığı ya da reklam platformlarına yüklenmesini istediği kişisel verilerin hukuka uygun toplandığını, aydınlatma yükümlülüğünü yerine getirdiğini ve gerekiyorsa açık rızayı aldığını taahhüt eder.
15.4. Müşterinin internet sitesindeki çerez yönetimi, aydınlatma metni ve gizlilik politikası Müşterinin sorumluluğundadır; Ajans teknik uygulamayı eklerde yazılıysa yapar.

## Madde 16 – Sonuç garantisi verilmemesi ve platform kararları
16.1. Ajans, hizmetleri özenle yürütmeyi üstlenir; belirli bir satış, ciro, tıklama, takipçi, sıralama ya da reklam getirisi sonucunu garanti etmez. Ek-1A'da yazılı hedefler ölçüm ve değerlendirme içindir, taahhüt değildir.
16.2. Reklam onayı, ret, kısıtlama, hesap askıya alma, algoritma ve fiyat değişiklikleri, arama motoru sıralama güncellemeleri ve platform arızaları Ajansın kontrolü dışındadır; Ajans bu durumlarda itiraz ve düzeltme sürecini Müşteri adına makul çabayla yürütür.
16.3. Platformların ölçtüğü ve raporladığı sonuçlar platformun kendi yöntemiyle hesaplanır; farklı platformların rakamları birbirini tutmayabilir.

## Madde 17 – Sorumluluğun sınırı
17.1. Ajansın bu sözleşmeden doğan toplam sorumluluğu, kast ve ağır ihmal hâlleri dışında, zararın doğduğu tarihten önceki son {sorumluluk_ay} ayda Müşterinin Ajansa ödediği ajans ücreti toplamı ile sınırlıdır. Reklam bütçesi bu hesaba katılmaz.
17.2. Ajans dolaylı zararlardan (kâr kaybı, itibar kaybı, veri kaybı sonucu iş kaybı) kast ve ağır ihmal dışında sorumlu değildir.
17.3. Kast ve ağır ihmalden doğan sorumluluk önceden kaldırılamaz (TBK m. 115/1).

## Madde 18 – Mücbir sebep
Doğal afet, salgın, savaş, genel grev, yetkili makam kararı, geniş çaplı internet ya da platform kesintisi gibi tarafların kontrolü dışındaki olaylar süresince etkilenen yükümlülükler askıya alınır. Durum 30 günü aşarsa taraflar sözleşmeyi tazminatsız feshedebilir.

## Madde 19 – Fesih
?{ek_1a=evet} 19.1. Taraflardan her biri, {ihbar_suresi_gun} gün önceden yazılı bildirimde bulunarak sözleşmeyi feshedebilir. İhbar süresi içinde hizmet ve ücret devam eder.
?{ek_1a=evet} 19.2. Asgari süre ({asgari_sure_ay} ay) dolmadan haklı bir neden olmaksızın feshedilmesi uygun olmayan zamanda fesih sayılır; bu durumda fesheden taraf, karşı tarafın bu yüzden uğradığı zararın karşılığı olarak bir aylık ajans ücretini öder.
19.3. Taraflardan biri esaslı bir yükümlülüğünü ihlal eder ve yazılı bildirime rağmen 10 gün içinde düzeltmezse, karşı taraf sözleşmeyi bildirimle hemen feshedebilir. İki aylık ücretin ödenmemesi esaslı ihlaldir.
?{ek_1b=evet} 19.4. Müşteri projeyi teslimden önce sona erdirirse, o tarihe kadar yapılan işin bedelini ve Ajansın üstlendiği masrafları öder. Ajans, bedeli ödenen ara çıktıları teslim eder.

## Madde 20 – Sözleşme sona erdiğinde yapılacaklar
20.1. Ajans, sona erme tarihinden itibaren 15 gün içinde: Müşteri hesaplarındaki kendi erişimini kaldırır ya da Müşterinin kaldırmasına yardımcı olur; Ajansın açtığı hesapları Müşteriye devreder; bedeli ödenmiş çalışma dosyalarını teslim eder; kişisel verileri iade eder ya da siler.
20.2. Devir işlemleri bir hesap devir tutanağıyla kayda alınır.
20.3. Ödenmemiş bedeller sona ermeyle muaccel olur.

## Madde 21 – Bildirimler
Taraflar, sözleşmede yazılı adreslerini ve {ajans_eposta} / {yetkili_eposta} e-posta adreslerini bildirim adresi olarak kabul eder. Adres değişikliği yazılı bildirilmedikçe eski adrese yapılan bildirim geçerlidir. Fesih ve temerrüt bildirimleri KEP ya da noter aracılığıyla da yapılabilir.

## Madde 22 – Delil sözleşmesi
Taraflar, bu sözleşmeden doğacak uyuşmazlıklarda tarafların ticari defter ve kayıtlarının, Madde 21'deki e-posta yazışmalarının, platform kayıtlarının ve ortak çalışma ortamı kayıtlarının 6100 sayılı HMK m. 193 uyarınca delil olduğunu kabul eder.

## Madde 23 – Uyuşmazlık çözümü ve yetkili mahkeme
23.1. Taraflar uyuşmazlığı önce görüşerek çözmeye çalışır.
23.2. Kanunen zorunlu olduğu hâllerde dava açılmadan önce arabulucuya başvurulur (TTK m. 5/A).
?{musteri_tacir=evet} 23.3. Bu sözleşmeden doğan uyuşmazlıklarda {sehir} Mahkemeleri ve İcra Daireleri yetkilidir.
23.4. Sözleşmeye Türk hukuku uygulanır.

## Madde 24 – Çeşitli hükümler
24.1. Sözleşme ve ekleri, taraflar arasındaki önceki tüm yazışma ve görüşmelerin yerine geçer.
24.2. Değişiklikler yalnız yazılı ve iki tarafça imzalı ek protokolle yapılır.
24.3. Bir hükmün geçersiz olması diğer hükümleri etkilemez.
24.4. Taraflar, karşı tarafın yazılı izni olmadan sözleşmeden doğan haklarını üçüncü kişilere devredemez.
24.5. Ajans, işin bir bölümü için alt yüklenici kullanabilir; alt yüklenicinin işinden Müşteriye karşı kendisi sorumludur.
24.6. Damga vergisi Taraflarca yarı yarıya ödenir.
24.7. Bu sözleşme 24 madde ve {ek_sayisi} ekten oluşur; {tarih} tarihinde {sehir}'da {nusha} olarak düzenlenip imzalanmıştır. Taraflar imzadan önce metni inceleme imkânı bulduklarını beyan eder.

@imza
| Ajans | Müşteri |
| {ajans_unvan} | {firma} |
| {ajans_yetkili} · {ajans_yetkili_unvan} | {yetkili} · {yetkili_unvan} |
| İmza / kaşe | İmza / kaşe |
`;

const EK_1A = `
# Ek-1A · Aylık hizmet kapsamı
Sözleşme no: {belge_no}

| Hizmet | Kapsam (dahil) | Dahil değil | Raporlama |
|---|---|---|---|
?{h_google=evet} | Google Ads yönetimi | Hesap kurulumu ve denetimi, kampanya yapısı, anahtar kelime ve negatif liste, reklam metinleri, teklif stratejisi, dönüşüm ölçümünün kontrolü, haftalık iyileştirme | Reklam bütçesi; görsel ve video üretimi; site içi geliştirme | Aylık rapor ve toplantı |
?{h_meta=evet} | Meta reklam yönetimi | Kampanya kurulumu, hedef kitle, reklam seti, A/B testi, piksel ve olay kontrolü | Reklam bütçesi; fotoğraf ve video çekimi | Aylık rapor |
?{h_sosyal=evet} | Sosyal medya içerik yönetimi | Aylık {gonderi_sayisi} gönderi, {hikaye_sayisi} hikâye, içerik takvimi, metin ve tasarım, yayınlama | Yorum ve mesaj yanıtlama, çekim, etkileyici iş birliği | Aylık özet |
?{h_seo=evet} | SEO | Teknik denetim, anahtar kelime çalışması, sayfa içi düzenleme önerileri, aylık {icerik_sayisi} içerik | Bağlantı satın alma; sıralama garantisi | Aylık rapor |
?{h_pazaryeri=evet} | Pazaryeri yönetimi | Ürün listeleme ve içerik iyileştirme, kampanya takvimi, pazaryeri reklamları | Stok, kargo, iade ve müşteri hizmetleri; komisyon ve reklam bedelleri | Aylık rapor |

**Aylık ajans ücreti:** {aylik_tutar} + KDV
**Hedefler (taahhüt değildir):** {hedefler}
**Toplantı sıklığı:** {toplanti_sikligi}
`;

const EK_1B = `
# Ek-1B · Web projesi kapsamı
Sözleşme no: {belge_no}

## 1. Proje
**{proje_adi}**
{proje_kapsami}

## 2. Teknik altyapı
| Altyapı | Barındırma sorumlusu | Alan adı sahibi |
|---|---|---|
| {cms} | {hosting_sorumlusu} | {firma} |

## 3. Takvim
Keşif → tasarım → onay → geliştirme → test → yayın. Tahmini teslim tarihi: **{proje_teslim_tarihi}**. Müşterinin vereceği içerikler gecikirse teslim tarihi gecikme kadar uzar.

## 4. Ödeme planı
Proje bedeli: **{proje_tutar}** ({proje_tutar_yazi}) + KDV

| Aşama | Oran | Tutar (KDV hariç) |
|---|---|---|
| {odeme_plani} |

## 5. Teslim ve kabul
Ajans işi teslim ettiğini yazılı bildirir. Müşteri {kabul_suresi_gun} iş günü içinde inceleyip varsa hataları yazılı ve ayrıntılı bildirir. Bu süre içinde bildirim yapılmazsa ya da site Müşteri tarafından yayına alınırsa iş kabul edilmiş sayılır. Bildirilen hatalar makul sürede giderilir.

## 6. Garanti
{garanti_suresi} boyunca teslim edilen kapsamdaki hatalar ücretsiz giderilir. Müşteri ya da üçüncü kişilerin müdahalesi, eklenti ve sunucu güncellemeleri ve yeni özellikler garanti dışıdır. Bakım isteğe bağlıdır ve ayrı aylık ücrete tabidir.

## 7. Üçüncü taraf bileşenler
{ucuncu_taraf_bilesenler}
`;

const EK_2 = `
// Kurum'un "Veri sorumlusu ve veri işleyen" rehberiyle karşılaştırılmalıdır; avukat teyidi gerekir.
# Ek-2 · KVKK veri işleme eki
Sözleşme no: {belge_no}

1. **Roller:** Müşteri veri sorumlusu, Ajans veri işleyendir. Ajans verileri yalnız Müşterinin yazılı talimatı ve bu sözleşme amacıyla işler; kendi amacı için kullanmaz.
2. **İşlenen veri kategorileri:** kimlik (ad soyad), iletişim (telefon, e-posta), müşteri işlem (sipariş, form başvurusu), pazarlama (çerez kimliği, reklam etkileşimi). Özel nitelikli veri işlenmez.
3. **İlgili kişi grupları:** Müşterinin potansiyel ve mevcut müşterileri, site ziyaretçileri, sosyal medya takipçileri.
4. **Amaç:** reklam hedefleme ve ölçüm, form başvurularının iletilmesi, raporlama.
5. **Güvenlik tedbirleri:** erişimin yetkili çalışanlarla sınırlanması, iki adımlı doğrulama, şifreli aktarım, listelerin platforma yüklenmeden önce karma (hash) yöntemiyle anonimleştirilmesi, iş bitince yerel kopyaların silinmesi, erişim kayıtları.
6. **Alt işleyenler:** Ajansın kullandığı hizmetler (bulut depolama, proje yönetimi, e-posta) Müşteriye bildirilir; yeni alt işleyen önceden bildirilir, Müşteri makul gerekçeyle itiraz edebilir.
7. **Yurt dışına aktarım:** Reklam ve ölçüm platformları yurt dışında olabilir. Müşteri listesinin bu platformlara yüklenmesi Müşterinin talimatıyla yapılır; KVKK m. 9'daki aktarım şartlarının sağlanması veri sorumlusu olarak Müşterinin sorumluluğundadır; Ajans gerekli teknik bilgiyi verir.
8. **Veri ihlali:** Ajans, öğrendiği ihlali gecikmeksizin, en geç 24 saat içinde Müşteriye bildirir; Müşterinin Kurul'a ve ilgili kişilere bildirimine destek olur.
9. **İlgili kişi başvuruları:** Ajansa gelen başvurular 3 iş günü içinde Müşteriye iletilir.
10. **Denetim:** Müşteri, makul önceden bildirimle uyum bilgisini yazılı isteyebilir.
11. **Sona erme:** Sözleşme bitince Ajans, Müşterinin tercihine göre verileri iade eder ya da siler ve bunu yazılı teyit eder; kanunen saklanması gereken kayıtlar hariç.

@imza
| Veri işleyen (Ajans) | Veri sorumlusu (Müşteri) |
| {ajans_unvan} | {firma} |
| İmza / kaşe | İmza / kaşe |
`;

// id → { durum, sayfalar }
export const SABLON_ICERIK = {
  erisim: { durum: 'hazir', sayfalar: [metin('Açıklama ve ilkeler', ERISIM_1), metin('Erişim listesi', ERISIM_2)] },
  odeme_hatirlatma: { durum: 'hazir', sayfalar: [metin('1. hatırlatma (kibar)', ODEME_1, { kosul: 'ton=1' }), metin('2. hatırlatma (kesin)', ODEME_2, { kosul: 'ton=2' })] },
  fiyat_guncelleme: { durum: 'hazir', sayfalar: [metin('Bildirim', FIYAT)] },
  teslim: { durum: 'hazir', sayfalar: [kapak('{FIRMA} - TESLİM TUTANAĞI'), metin('Tutanak', TESLIM, { paraf: true })] },
  sozlesme: { durum: 'taslak', sayfalar: [kapak('{FIRMA} - HİZMET SÖZLEŞMESİ'), metin('Genel hükümler', SOZLESME, { paraf: true }),
    metin('Ek-1A Aylık hizmet kapsamı', EK_1A, { paraf: true, kosul: 'ek_1a=evet' }), metin('Ek-1B Web projesi kapsamı', EK_1B, { paraf: true, kosul: 'ek_1b=evet' }),
    metin('Ek-2 KVKK veri işleme eki', EK_2, { paraf: true, kosul: 'ek_2=evet' })] }
};
