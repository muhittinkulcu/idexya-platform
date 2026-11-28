# Arayüz kabuğu: üç ürün, tek yazılım görünümü

Kaynak: Muhittin, 14 Kas 2026. Onaylanan taslak: https://claude.ai/artifact/XnT41QTDzv8vv4FjZwqLem
Örnek alınan düzen: Nebim ve Mikro Jump gibi ERP yazılımları. Marketing (IDOS), Website ve CRM (panel) ve
Creative, tek yazılımın modülleri gibi görünür. Kod tabanları ayrı kalır; ortak olan iskelet ve parçalardır.

## Sabit yerler (her modülde aynı)

| Sıra | Parça | İçerik |
|---|---|---|
| 1 | Üst alan | En üst, tam genişlik, 64 px, yarı saydam buzlu cam, temaya uyan ("A, cam" seçeneği; talimat 4.2). Soldan sağa: IDOS kimliği (turuncu `#F07A23` rozet içinde beyaz X; favicon da aynı görünüm ve "IDOS", ana ekrana döner), ürün yuvası (aktif müşteri seçimi, tarih aralığı), global arama (⌘K), veri eşitleme durumu, üst çubuğu sabitle, bildirimler, tema, kullanıcı menüsü. **Modül sekmesi ve mega menü yoktur**: modül gezinmesi yalnız sol menüdedir. Turuncu yalnız X logosunun rozetinde, sayfanın ana eyleminde (`--ik-eylem`) ve karar bekleyen işte (24 Kas 2026). |
| 2 | Sol menü | Tek menü, 13 madde (talimat 4.2; 20 Kas 2026'da Web ve Commerce ikiye ayrıldı): Genel bakış, Müşteriler, Görevler ve onaylar, Marketing (Meta, Google Ads, Google Analytics, Search Console, Tag Manager), CRM, Web Site Yönetimi (idexya.com), E-Ticaret, Creative, Marketplace (verisi yok; bayrakla açılır, bugün gizli), AI Center, Akademi (25 Kas 2026), Raporlar, Ayarlar. Sol menüde yalnız maddeler durur; maddenin üzerine gelince **mega menü** açılır (22 Kas 2026, aşağıda): en üstte madde adı, altında grup sütunları (bölümler ve sayfaları). Daraltılabilir; daraltınca madde simgeleri kalır ve simgenin üzerinde sütunlu mega menü açılır. Veri almayan öğe menüye konmaz. Sayfalar bulundukları uygulamada kalır; bağlantı os.idexya.com'da yol önekine çevrilir. |
| 3 | Sayfa sekmeleri | Açılan her sayfa sekme olur (en çok 16; taşınca en eski sabit olmayan düşer). Genel bakış ilk sırada ve kapatılamaz. 36 px yüksek, 14 punto (Meta ölçeği; Muhittin, 25 Kas 2026). Soldaki modül simgesi üzerine gelince raptiye olur (sabitle); sabit sekme solda kalır, raptiyesi görünür, × taşımaz. Sürükleyerek ya da Alt + ok ile taşınır; tek satırda kayar; sağdaki düğme modüle göre gruplar (25 Kas 2026). Chrome gibi (27 Kas 2026): sekme açıldıkça hepsi eşit daralır (en çok 200, en az 120 px), seçili sekme daralmaz, sığmayınca satır kayar; dar sekmede × yalnız seçili ve üzerine gelinen sekmede; sürüklenen sekme tutma imleciyle, bırakılacak yer solunda çizgiyle belli olur. |
| 4 | Sayfa başlığı ve eylem çubuğu | Solda konum yolu ve başlık; sağda sırayla Yenile, Dışa aktar, Yazdır ve tek ana eylem (vurgu renginde). |
| 5 | Süzgeç satırı | Müşteri, marka ya da site seçimi; dönem; süzgeç. Üst süzgeç sayfadaki her kartı etkiler. |
| 6 | Durum çubuğu | En alt, 28 px: bağlantı, kullanıcı, modül, son eşitleme, sağda "Idexya OS". |

## Ortak renkler

| Ad | Açık | Koyu |
|---|---|---|
| Zemin | `#F6F7F9` | `#15202B` |
| Yüzey (kart, menü) | `#FFFFFF` | `#1C2733` |
| Gömük yüzey (tablo başlığı, seçici) | `#F3F5F8` | `#192734` |
| Çizgi | `#E6E9EE` | `#2F3D4A` |
| Yazı | `#17202B` | `#E7ECF1` |
| İkincil yazı | `#56606E` | `#A3AFBB` |
| Üst alan (cam) | `rgba(255,255,255,.94)` + bulanıklık (yazı `#17202B`) | `rgba(21,32,43,.66)` + bulanıklık (yazı `#E7ECF1`) |
| Açık madde çizgisi | vurgu rengi | vurgu rengi |
| Ana eylem düğmesi (beyaz yazı) | `#B84406` | `#B84406` |

**Birebir görünüm ve ferahlık (Muhittin, 24 Kas 2026):** "önizlemede gördüğüm temanın aynısı olacak şekilde yap"; "dar
satırlar ve sıkıcı bir çalışma alanı yerine daha ferah ve kolay bir arayüz". Tasarım tuvalinin 8. turu esastır. Zemin düzdür:
14 Kas 2026 tarihli zemin ızgarası kabuktan kalktı. Menü satırı 44 px, düğme 40 px, kart iç boşluğu 24 px, tablo satırı
46 px (Meta ölçeği, 25 Kas 2026; kişi Ayarlar’dan değiştirir), kartlar arası 20–24 px.

## Modül renkleri

Tek gezinmede (talimat 4.2) maddelerin vurgusu IDOS mavisidir: açıkta `#2F55D4`, koyuda `#7F9AF2` (ana düğme, seçili
menü öğesi, sekme çizgisi). Creative kendi kırmızısını korur (`#DC2626` / `#F87171`). Renk `katmanlar.json`'da madde
başına yazılır.

Madde simgeleri (`katmanlar.json` `simge`): Genel bakış `ev`, Müşteriler `kisiler`, Görevler ve onaylar `onay`, Marketing
`megafon`, CRM `huni`, Web Site Yönetimi `dunya`, E-Ticaret `sepet`, Creative `palet`, Marketplace `magaza`, AI Center `yildiz`, Raporlar `belge`,
Ayarlar `ayar`.
Asistan düğmesinde IDOS'un kedisi (Ankara kedisi, `kabuk/kedi.webp`) görünür; görsel kabuğun parçasıdır, üç üründe aynıdır.

## Ortak parçalar

- Yazı: Inter (kendi sunucumuzdan), kalınlık sabit: **gövde 400, etiket ve düğme 500, başlık ve sayı 600** (24 Kas 2026; 12–15 Kas'taki Zarif 350/400/500'ün yerine).
  Yazı tipi ve kalınlık seçimi yoktur (Muhittin, 15 Kas 2026: "font vs seçimi olmasın").
  600'ün üstü yok.
  Satır aralığı 1,6. Sayılar eşit genişlikte. Kabuk ağırlıkları CSS değişkeniyle verir (`--w-ince`, `--w-govde`,
  `--w-orta`, `--w-vurgu`); bileşenlerde sabit sayı yazılmaz.
- Kart: başlık solda; i (açıklama) ve ⋮ (seçenekler) sağ üstte; tek ana eylem sağ altta. Köşe 12 px (`--ik-yaricap-kart`; Muhittin, 24 Kas 2026).
- İmzalı görünüm, 1. adım (Muhittin, 22 Kas 2026; tasarım tuvali 8. tur): kart, tablo ve ayar kartında yumuşak gölge
  (`--ik-golge`); sol menüde açık madde ve bulunulan sayfa dolu mavi değil, yumuşak vurgu zemini ve vurgu renginde yazı
  (turuncu çizgi yerinde); mega menüsü açık madde açık gri; menüdeki sayı rozeti yumuşak turuncu (`--ik-rozet-z`,
  `--ik-rozet-y`), çünkü turuncu karar bekleyen işi gösterir; sayfa sekmeleri beyaz şeritte, seçili sekmenin altında vurgu
  çizgisi; eşitleme uyarısı yumuşak sarı zeminli. 24 Kas 2026'da turuncu çizgi, zemin ızgarası ve 5 px köşe de çizime uydu.
- Düğme: köşe 8 px (`--ik-yaricap`; girdi, açılır liste ve sekme de), küçük parça 6 px (`--ik-yaricap-kucuk`), sayı rozeti tam yuvarlak; ana düğme dolu turuncu (`--ik-eylem`), diğerleri çerçeveli.
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
3. **Hız bütçesi.** Kabuğun JS'i küçültülmüş ve sıkıştırılmış (minify + gzip; ürünlerin sunduğu boyut) hâlde 17 kB'ı (20 Kas 2026'ya kadar 15 kB),
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

## Mega menü (Muhittin, 22 Kas 2026)

"Sidebar hover durumunda megamenü gibi açılsın; en üstte katman adı, alttaki sütunlarda modüller ve alt sayfalar." Aynı gün
canlıya çıkan sütun gezgininin (F2, `docs/kararlar/2026-11-22-yeni-arayuz-sutun-gezgini.md`) ve önizleme kartının yerini
alır. Geniş ve daraltılmış menüde madde üzerine gelince menünün sağından ekranın sağına açılır: en üstte madde adı, altında
her grup bir sütun (bölümler ve sayfaları). Madde satırına tık maddenin sayfasına gider; dokunmatikte ilk dokunuş menüyü
açar. Telefonda tam ekran, sütunlar alt alta. Ayrıntı ve ürün arayüzü: `kabuk/README.md` "Mega menü".

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

## Sık kullanılanlar (27 Kas 2026)

Açılan her sayfa bu tarayıcıda sayılır (`idx-sik`, en çok 40 kayıt; ana ekran sayılmaz; çıkışta silinir). En çok açılan
8 sayfa sol menünün sonunda, ince çizginin altındaki "Sık kullanılanlar" maddesinde durur; üzerine gelince öteki maddeler gibi
mega menü açılır (önizleme kartı dahil). Aynı adlı iki sayfa bölüm adıyla ayrılır ("Meta › Genel bakış"). Hiç sayfa
açılmadıysa madde görünmez. Maddelerin sırası değişmez.
