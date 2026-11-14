# Arayüz kabuğu: üç ürün, tek yazılım görünümü

Kaynak: Muhittin, 14 Kas 2026. Onaylanan taslak: https://claude.ai/artifact/XnT41QTDzv8vv4FjZwqLem
Örnek alınan düzen: Nebim ve Mikro Jump gibi ERP yazılımları. Marketing (IDOS), Website ve CRM (panel) ve
Creative, tek yazılımın modülleri gibi görünür. Kod tabanları ayrı kalır; ortak olan iskelet ve parçalardır.

## Sabit yerler (her modülde aynı)

| Sıra | Parça | İçerik |
|---|---|---|
| 1 | Paket çubuğu | En üst, tam genişlik, ~48 px, zemin `#15202B` (iki temada da). Solda Idexya X ve "Idexya" (ana ekrana döner), yanında modül sekmeleri: IDOS (ana sayfa), Marketing, Website ve CRM, Creative. Seçili modülün altında 3 px renk çizgisi. |
| 2 | Menü ağacı | Solda; üç düzey: katman (Marketing, Website ve CRM, Creative) › grup başlığı › modül › sayfa. Modüller açılıp kapanır, altında sayfaları girintili listelenir. Grup başlığında yalnız ilk harf büyük. Daraltılabilir; daraltınca simgeler kalır. |
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
| Paket çubuğu | `#15202B` | `#0E161E` |

**Zemin ızgarası (Muhittin, 14 Kas 2026):** her modülün ve Ana ekranın zemininde idexya.com ana sayfasındaki
gibi 64 px'lik hafif ızgara çizgileri bulunur. Çizgi rengi açıkta `rgba(0,37,89,.055)`, koyuda
`rgba(255,255,255,.04)`. Kartlar ve tablolar ızgaranın üstünde dolu yüzeyle durur; ızgara yalnız boşlukta görünür.
Ana ekranda ızgara fareyi izleyen turuncu ışıkla birlikte belirginleşir.

## Modül renkleri

Her modülün yalnız bir vurgu rengi vardır; ana düğme, seçili menü ve sekme çizgisi bu renktir.
Renk, modülün X işaretiyle aynı ailedendir.

| Modül | Vurgu (açık) | Paket çubuğunda nokta |
|---|---|---|
| Marketing | `#2F55D4` | `#7F9AF2` |
| Website ve CRM | `#B84406` | `#F29A62` |
| Creative | `#DC2626` | `#F87171` |

## Ortak parçalar

- Yazı: kullanıcı Görünüm panelinden (Ayarlar) yazı tipini ve kalınlığı seçer; seçim üç modülde birlikte geçerli olur.
  Yazı tipleri (hepsi Türkçe karakter destekli, değişken ağırlıklı, kendi sunucumuzdan): Inter (varsayılan), Manrope,
  Plus Jakarta Sans, DM Sans, Figtree, Outfit, Albert Sans, Onest. Kalınlık üç düzey: İnce (gövde 300, başlık 350),
  **Zarif (varsayılan: gövde 350, başlık 400, büyük başlık ve sayı 300, en kalın 500)**, Dengeli (gövde 400, başlık 450).
  Muhittin, 12 ve 14 Kas 2026: ince ve zarif, "incenin bir tık üstü"; aşırı ince ya da kalın değil; 600 ve üstü yok.
  Satır aralığı 1,6. Sayılar eşit genişlikte. Kabuk ağırlıkları CSS değişkeniyle verir (`--w-ince`, `--w-govde`,
  `--w-orta`, `--w-vurgu`); bileşenlerde sabit sayı yazılmaz.
- Kart: başlık solda; i (açıklama) ve ⋮ (seçenekler) sağ üstte; tek ana eylem sağ altta. Köşe 12 px.
- Düğme: köşe 8 px; ana düğme dolu vurgu rengi, diğerleri çerçeveli.
- Durum etiketi: yazı ve nokta birlikte; renk tek başına anlatmaz. Onaylandı, uygulandı ve etkisi doğrulandı ayrı etiketlerdir.
- Tema: açık, koyu, sistem, saate göre (dört seçenek) her modülde aynı yerde.

## Aşamalar

1. Görünüm: her modül bu kabuğa geçer (Website ve CRM, sonra Marketing, sonra Creative). Modül sekmeleri şimdiki adreslere gider.
2. Tek adres ve tek giriş: önerilen adres `os.idexya.com`. Kimlik ve oturum değişikliği olduğu için ayrı onay ve `guvenlik-onay` ister.

## Yapım kuralları (yama yok)

Kaynak: Muhittin, 14 Kas 2026: "IDOS'un eski versiyonlarındaki gibi yamalar şeklinde olmasın; güvenlik, hız ve
performans en önemli hususlar."

1. **Tek kaynak, üç kopya değil.** Kabuk (paket çubuğu, mega menü, sayfa sekmeleri, durum çubuğu, görünüm paneli,
   asistan düğmesi) bir kez yazılır: çatıdan bağımsız, bağımlılıksız bir web bileşeni (`<idexya-kabuk>`) ve ona ait
   tek CSS dosyası. Bu depoda tutulur, `ortak_esitle.sh` ile üç projeye birebir kopyalanır; projede elle düzenlenmez.
   Var olan kabuk kodunun üstüne ek katman yapılmaz; eski parça yenisi gelince silinir.
2. **Güvenlik.** Satır içi betik ve `eval` yok; içerik güvenlik politikası (CSP) gevşetilmez. Dış kaynaktan yazı tipi,
   betik ya da görsel yüklenmez: Inter ve görseller her projede kendi sunucusundan gelir. Kullanıcıya görünen her veri
   metin olarak basılır (`innerHTML` yok). Kabuk yetki kararı vermez; menüde ne görüneceğini sunucunun döndürdüğü yetki
   belirler.
3. **Hız bütçesi.** Kabuğun JS'i sıkıştırılmış hâlde 15 kB'ı, CSS'i 10 kB'ı geçmez. Ana ekran telefonda
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

## Mega menü (Muhittin, 14 Kas 2026)

Paket çubuğunda modül adına tıklamak modülün ana sayfasına götürür; yanındaki ok mega menüyü açar. Mega menü
yarı saydam buzlu camdır (arkadaki sayfa bulanık görünür). Solda modülün adı ve açıklaması; yanında gruplar ve
modüller. Bir modüle tıklayınca sayfaları akordeon gibi hemen altında açılır (aynı anda bir modül açık); ilk satır
modülün ana sayfasıdır. Her sayfaya tek tıkla gidilir.
Mega menü açıkken paket çubuğu etkin kalır (perde çubuğun altından başlar); başka bir modülün üzerine gelince mega
menü o modüle geçer; Esc ve dışarı tıklama kapatır. Bir açılır panel (mega menü, arama, görünüm) açılınca diğerleri kapanır.

## Sayfa hareketleri (Muhittin, 14 Kas 2026)

Her modül ve sayfa geçişinde içerik aynı sahne düzeniyle açılır: başlık soldan kayar, kartlar sırayla süzülür,
sayılar sıfırdan sayar, kart içi çizgi grafikler kendini çizer, tablo satırları akarak gelir. Uyarı ve hata
durumlarının noktası yavaşça atar. Kartın üzerine gelince kart yükselir ve solunda modül renginde çizgi belirir.
Hepsi `transform`/`opacity` ile ve bir kez çalışır; "hareketi azalt" açıksa kapalıdır.
Giriş hareketleri ve sayaçlar sekmedeki ilk açılışta oynar; aynı oturumda sonraki sayfa yüklemelerinde kabuk ve içerik
hemen son hâliyle çizilir. Çok sayfalı üründe sayfalar arası geçişte paket çubuğu, yan menü ve sekme satırı yerinde
kalır, yalnız içerik alanı kısa (150 ms) çapraz geçişle değişir (çapraz belge View Transitions; Muhittin, 14 Kas 2026:
"tasarımdaki gibi hızlı geçsin"). Ayrıntı `kabuk/README.md`.

## Daraltılmış yan menü (Muhittin, 14 Kas 2026)

Daraltınca her grup kendi simgesiyle durur (kısaltma ya da nokta yok); bulunulan grubun solunda modül renginde
işaret vardır. Simgenin üzerine gelince (ya da klavyeyle odaklanınca) sağa yarı saydam bir panel kayarak açılır:
grup adı, modüller ve her modülün sayfaları. Başka simgeye geçince panel o hizaya kayar ve içerik sırayla yenilenir.
Fare panele geçerken kapanmaz (kısa bekleme); dışarı çıkınca ya da Esc ile kapanır. Geniş menüde de grup
başlıkları aynı simgeleri taşır.
