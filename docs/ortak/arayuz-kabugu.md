# Arayüz kabuğu: üç ürün, tek yazılım görünümü

Kaynak: Muhittin, 14 Kas 2026. Onaylanan taslak: https://claude.ai/artifact/XnT41QTDzv8vv4FjZwqLem
Örnek alınan düzen: Nebim ve Mikro Jump gibi ERP yazılımları. Marketing (IDOS), Website ve CRM (panel) ve
Creative, tek yazılımın modülleri gibi görünür. Kod tabanları ayrı kalır; ortak olan iskelet ve parçalardır.

## Sabit yerler (her modülde aynı)

| Sıra | Parça | İçerik |
|---|---|---|
| 1 | Üst alan | En üst, tam genişlik, ~52 px, yarı saydam buzlu cam, temaya uyan ("A, cam" seçeneği; talimat 4.2). Soldan sağa: IDOS kimliği (lacivert rozet içinde turuncu X ve "IDOS", ana ekrana döner), ürün yuvası (aktif müşteri seçimi, tarih aralığı), global arama (⌘K), veri eşitleme durumu, üst çubuğu sabitle, bildirimler, tema, kullanıcı menüsü. **Modül sekmesi ve mega menü yoktur**: modül gezinmesi yalnız sol menüdedir. Turuncu yalnız X logosunda ve sol menüdeki açık maddenin çizgisinde. |
| 2 | Sol menü | Tek menü, 11 madde (talimat 4.2): Genel bakış, Müşteriler, Görevler ve onaylar, Marketing, CRM, Web ve Commerce, Creative, Marketplace (verisi yok; bayrakla açılır, bugün gizli), AI Center, Raporlar, Ayarlar. Yalnız açık maddenin (adresin bulunduğu) grupları ve sayfaları onun altında açılır: madde › grup › modül › sayfa. Tek gruplu maddede grup başlığı çizilmez; çok gruplu maddede başta yalnız etkin sayfanın grubu açıktır. Daraltılabilir; daraltınca madde simgeleri kalır. Başlıkta "tüm grupları aç / kapat"; geniş menüde fareyle üzerine gelince kapalı grup açılır. Veri almayan öğe menüye konmaz. Sayfalar bulundukları uygulamada kalır; bağlantı os.idexya.com'da yol önekine çevrilir. |
| 3 | Sayfa sekmeleri | Açılan her sayfa sekme olur (en çok 8). Genel bakış ilk sırada ve kapatılamaz. × ile kapanır. |
| 4 | Sayfa başlığı ve eylem çubuğu | Solda konum yolu ve başlık; sağda sırayla Yenile, Dışa aktar, Yazdır ve tek ana eylem (vurgu renginde). |
| 5 | Süzgeç satırı | Müşteri, marka ya da site seçimi; dönem; süzgeç. Üst süzgeç sayfadaki her kartı etkiler. |
| 6 | Durum çubuğu | En alt, 28 px: bağlantı, kullanıcı, modül, son eşitleme, sağda "Idexya OS". |

## Ortak renkler

| Ad | Açık | Koyu |
|---|---|---|
| Zemin | `#F2F4F7` | `#15202B` |
| Yüzey (kart, menü) | `#FFFFFF` | `#1C2733` |
| Gömük yüzey (tablo başlığı, sekme satırı) | `#F7F8FA` | `#192734` |
| Çizgi | `#DCE1E8` | `#2F3D4A` |
| Yazı | `#17202B` | `#E7ECF1` |
| İkincil yazı | `#56606E` | `#A3AFBB` |
| Üst alan (cam) | `rgba(255,255,255,.85)` + bulanıklık (yazı `#17202B`) | `rgba(21,32,43,.66)` + bulanıklık (yazı `#E7ECF1`) |
| Turuncu çizgi (açık madde) | `#DE681B` | `#F07A23` |

**Zemin ızgarası (Muhittin, 14 Kas 2026):** her modülün ve Ana ekranın zemininde idexya.com ana sayfasındaki
gibi 64 px'lik hafif ızgara çizgileri bulunur. Çizgi rengi açıkta `rgba(0,37,89,.055)`, koyuda
`rgba(255,255,255,.04)`. Kartlar ve tablolar ızgaranın üstünde dolu yüzeyle durur; ızgara yalnız boşlukta görünür.
Ana ekranda ızgara fareyi izleyen turuncu ışıkla birlikte belirginleşir.

## Modül renkleri

Tek gezinmede (talimat 4.2) maddelerin vurgusu IDOS mavisidir: açıkta `#2F55D4`, koyuda `#7F9AF2` (ana düğme, seçili
menü öğesi, sekme çizgisi). Creative kendi kırmızısını korur (`#DC2626` / `#F87171`). Renk `katmanlar.json`'da madde
başına yazılır.

Madde simgeleri (`katmanlar.json` `simge`): Genel bakış `ev`, Müşteriler `kisiler`, Görevler ve onaylar `onay`, Marketing
`megafon`, CRM `huni`, Web ve Commerce `dunya`, Creative `palet`, Marketplace `magaza`, AI Center `yildiz`, Raporlar `belge`,
Ayarlar `ayar`.
Asistan düğmesinde IDOS'un kedisi (Ankara kedisi, `kabuk/kedi.webp`) görünür; görsel kabuğun parçasıdır, üç üründe aynıdır.

## Ortak parçalar

- Yazı: Inter (kendi sunucumuzdan), kalınlık sabit **Zarif: gövde 350, başlık 400, büyük başlık ve sayı 300, en kalın 500**.
  Yazı tipi ve kalınlık seçimi yoktur (Muhittin, 15 Kas 2026: "font vs seçimi olmasın").
  Muhittin, 12 ve 14 Kas 2026: ince ve zarif, "incenin bir tık üstü"; aşırı ince ya da kalın değil; 600 ve üstü yok.
  Satır aralığı 1,6. Sayılar eşit genişlikte. Kabuk ağırlıkları CSS değişkeniyle verir (`--w-ince`, `--w-govde`,
  `--w-orta`, `--w-vurgu`); bileşenlerde sabit sayı yazılmaz.
- Kart: başlık solda; i (açıklama) ve ⋮ (seçenekler) sağ üstte; tek ana eylem sağ altta. Köşe 12 px.
- Düğme: köşe 8 px; ana düğme dolu vurgu rengi, diğerleri çerçeveli.
- Durum etiketi: yazı ve nokta birlikte; renk tek başına anlatmaz. Onaylandı, uygulandı ve etkisi doğrulandı ayrı etiketlerdir.
- Tema: açık, koyu, sistem, zaman (gündüz açık, gece koyu; varsayılan 07.00–19.00 açık) dört seçenek. Üst çubuktaki tema
  düğmesi açılır pencere açmaz, tıklayınca dört seçenek arasında sırayla geçer; simge seçimi gösterir (Muhittin, 15 Kas 2026).
- Ayarlar: sol menünün "Ayarlar" maddesi ve profil menüsündeki "Ayarlar" ayrı bir sayfaya gider (her üründe temel yolun altında `/settings`); sayfanın
  içeriği ortak `<idexya-ayarlar>` bileşenidir (görünüm, arayüz, bölge, hesap, klavye kısayolları, modül ayarları;
  yalnız gerçekten çalışan ayarlar). Ayrıntı: `kabuk/README.md` "Tema ve Ayarlar sayfası".

## Aşamalar

1. Görünüm: her modül bu kabuğa geçer (Website ve CRM, sonra Marketing, sonra Creative). Modül sekmeleri şimdiki adreslere gider.
2. Tek adres ve tek giriş: önerilen adres `os.idexya.com`. Kimlik ve oturum değişikliği olduğu için ayrı onay ve `guvenlik-onay` ister.

## Yapım kuralları (yama yok)

Kaynak: Muhittin, 14 Kas 2026: "IDOS'un eski versiyonlarındaki gibi yamalar şeklinde olmasın; güvenlik, hız ve
performans en önemli hususlar."

1. **Tek kaynak, üç kopya değil.** Kabuk (üst alan, sol menü, sayfa sekmeleri, durum çubuğu, tema düğmesi, Ayarlar sayfası içeriği,
   asistan düğmesi) bir kez yazılır: çatıdan bağımsız, bağımlılıksız bir web bileşeni (`<idexya-kabuk>`) ve ona ait
   tek CSS dosyası. Bu depoda tutulur, `ortak_esitle.sh` ile üç projeye birebir kopyalanır; projede elle düzenlenmez.
   Var olan kabuk kodunun üstüne ek katman yapılmaz; eski parça yenisi gelince silinir.
2. **Güvenlik.** Satır içi betik ve `eval` yok; içerik güvenlik politikası (CSP) gevşetilmez. Dış kaynaktan yazı tipi,
   betik ya da görsel yüklenmez: Inter ve görseller her projede kendi sunucusundan gelir. Kullanıcıya görünen her veri
   metin olarak basılır (`innerHTML` yok). Kabuk yetki kararı vermez; menüde ne görüneceğini sunucunun döndürdüğü yetki
   belirler.
3. **Hız bütçesi.** Kabuğun JS'i küçültülmüş ve sıkıştırılmış (minify + gzip; ürünlerin sunduğu boyut) hâlde 15 kB'ı,
   CSS'i 10 kB'ı geçmez. Kaynaktaki yorumlar bütçeye sayılmaz (karar 14 Kas 2026). Ana ekran telefonda
   Lighthouse performans puanı en az 90; ilk boyama 1,5 sn altında. Galaksi arka planı sayfa içeriği çizildikten
   sonra, boşta kalan zamanda bir kez çizilir; ekran dışındayken çizim ve animasyon durur.
4. **Hareket.** Animasyonlar yalnız `transform` ve `opacity` ile yapılır (ekran kartında çalışır, sayfayı yeniden
   dizmez). Sayaç gibi betikli hareketler bir kez çalışır ve biter; sürekli zamanlayıcı yok. Cihazda "hareketi azalt"
   açıksa bütün hareket durur.
5. **Ölçmeden birleştirme yok.** Her kabuk PR'ında önce ve sonra Lighthouse (masaüstü ve telefon) ile paket boyutu
   yazılır; bütçeyi aşan PR birleştirilmez.
6. **Ayar bloğu kaçışı** (güvenlik incelemesi, 14 Kas 2026). Sunucu kabuk ayarını `<script type="application/json">`
   içine yazarken JSON'daki her `<` karakterini `\u003c` olarak yazar (JS: `JSON.stringify(x).replace(/</g, '\\u003c')`,
   Python: `json.dumps(x).replace('<', '\\u003c')`). `&lt;` işe yaramaz; betik içinde HTML varlıkları çözülmez.

## Mega menü (kaldırıldı)

14 Kas 2026'da gelen mega menü ve üst çubuktaki modül sekmeleri tek gezinme kararıyla (talimat 4.2) kaldırıldı: modüller
yalnız sol menüdedir. Açılır paneller (arama, profil) birbirini kapatır; Esc ve dışarı tıklama kapatır.

## Sayfa hareketleri (Muhittin, 14 Kas 2026)

Her modül ve sayfa geçişinde içerik aynı sahne düzeniyle açılır: başlık soldan kayar, kartlar sırayla süzülür,
sayılar sıfırdan sayar, kart içi çizgi grafikler kendini çizer, tablo satırları akarak gelir. Uyarı ve hata
durumlarının noktası yavaşça atar. Kartın üzerine gelince kart yükselir ve solunda modül renginde çizgi belirir.
Hepsi `transform`/`opacity` ile ve bir kez çalışır; "hareketi azalt" açıksa kapalıdır.
Giriş hareketleri ve sayaçlar sekmedeki ilk açılışta oynar; aynı oturumda sonraki sayfa yüklemelerinde kabuk ve içerik
hemen son hâliyle çizilir. Çok sayfalı üründe sayfalar arası geçişte üst alan, yan menü ve sekme satırı yerinde
kalır, yalnız içerik alanı kısa (150 ms) çapraz geçişle değişir (çapraz belge View Transitions; Muhittin, 14 Kas 2026:
"tasarımdaki gibi hızlı geçsin"). Ayrıntı `kabuk/README.md`.

## Daraltılmış yan menü (Muhittin, 14 Kas 2026)

Daraltınca her madde kendi simgesiyle durur (kısaltma ya da nokta yok); bulunulan maddenin solunda turuncu
işaret vardır. Simgenin üzerine gelince (ya da klavyeyle odaklanınca) sağa yarı saydam bir panel kayarak açılır:
madde adı (maddeye bağlantı), grup başlıkları, modüller ve her modülün sayfaları. Başka simgeye geçince panel o hizaya kayar ve içerik sırayla yenilenir.
Fare panele geçerken kapanmaz (kısa bekleme); dışarı çıkınca ya da Esc ile kapanır. Geniş menüde de grup
başlıkları aynı simgeleri taşır.
