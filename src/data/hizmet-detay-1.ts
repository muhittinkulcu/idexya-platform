// Hizmet sayfası içerikleri: E-ticaret ve dijital reklam (Google Ads kendi sayfasında).
// Kurallar: sonuç garantisi ve uydurma rakam yok; yalnızca yaptığımız işi ve neden önemli olduğunu anlatır.
import type { HizmetDetay } from './hizmet-detay';

export const DETAY_1: Record<string, HizmetDetay> = {
  'e-ticaret-yonetimi': {
    giris: 'Mağazanızın günlük işleyişini tek ekip olarak yürütüyoruz: ürün, stok, kampanya, sipariş ve raporlama aynı elden, birbirine bağlı ilerler.',
    neden: 'E-ticarette sorunlar genellikle tek bir yerde değil, parçalar arasındaki boşluklarda çıkar: reklam ekibi stokta olmayan ürünü öne çıkarır, kampanya fiyatı pazaryerine yansımaz, kargo gecikmesi yorumlara düşer. Tüm parçaları aynı ekibin yönetmesi bu boşlukları kapatır ve kararları tek bir gerçek veriye dayandırır.',
    yap: [
      ['Mağaza sağlık kontrolü', 'Ürün sayfaları, ödeme adımları, hız ve ölçüm altyapısı düzenli kontrol edilir; satış kaybettiren sorunlar önceliklendirilir.'],
      ['Kampanya ve indirim takvimi', 'Özel günler, sezon geçişleri ve stok durumuna göre yıllık kampanya planı hazırlanır.'],
      ['Ürün ve içerik yönetimi', 'Yeni ürünler satışa hazır içerikle yayına alınır; satmayan ürünlerin sayfaları iyileştirilir.'],
      ['Kanallar arası koordinasyon', 'Web mağaza, pazaryerleri ve reklamlar aynı stok ve fiyat bilgisiyle çalışır.'],
      ['Sipariş ve müşteri deneyimi', 'Sipariş, iade ve müşteri soruları takip edilir; tekrar eden şikâyetlerin kökü bulunur.'],
      ['Aylık değerlendirme', 'Satış, kârlılık ve operasyon göstergeleri birlikte değerlendirilir; bir sonraki ayın öncelikleri belirlenir.']
    ],
    olc: ['Satış ve ciro (kanal bazında)', 'Dönüşüm oranı ve sepet terk', 'Brüt kâr ve iade oranı', 'Sipariş hazırlama ve teslim süresi'],
    kim: ['Mağazası olan ama günlük yönetimine vakit ayıramayan işletmeler', 'Web mağaza ve pazaryerinde birlikte satan markalar', 'Ajans, yazılımcı ve kargo firması arasında koordinasyonu tek elde toplamak isteyenler'],
    sss: [
      ['Hangi e-ticaret altyapılarıyla çalışıyorsunuz?', 'ikas, Ticimax, Shopify, WooCommerce, IdeaSoft ve T-Soft başta olmak üzere yaygın altyapılarla çalışıyoruz. Mevcut altyapınızı değiştirmeden başlamayı tercih ederiz.'],
      ['Mağaza hesapları kime ait olur?', 'Mağaza, pazaryeri ve reklam hesapları sizin adınıza açılır ve size aittir. Biz yetkili kullanıcı olarak çalışırız.'],
      ['Hizmete reklam yönetimi dahil mi?', 'Kapsamı ihtiyacınıza göre birlikte belirleriz. Reklam yönetimi pakete eklenebilir ya da ayrı hizmet olarak alınabilir.']
    ]
  },
  'e-ticaret-pazaryeri-yonetimi': {
    giris: 'Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti ve Pazarama’da mağazanızı günlük olarak yönetiyoruz: ürün, fiyat, stok, kampanya, sipariş ve mağaza puanı.',
    neden: 'Pazaryerlerinde görünürlük; doğru kategori, eksiksiz ürün bilgisi, rekabetçi fiyat ve mağaza performansıyla belirlenir. Geciken gönderimler, cevapsız sorular ve stok hataları mağaza puanını düşürür ve ürünleri arama sonuçlarında geriye iter. Düzenli takip, satışın sürdürülebilir olmasını sağlar.',
    yap: [
      ['Mağaza kurulumu ve kategori eşleştirme', 'Ürünler her pazaryerinin kategori ve özellik yapısına doğru eşleştirilir.'],
      ['Ürün içeriği', 'Başlık, açıklama, görsel ve varyantlar pazaryerinin kurallarına ve arama alışkanlıklarına göre hazırlanır.'],
      ['Fiyat ve stok takibi', 'Rakip fiyatları ve stok durumu izlenir; komisyon ve kargo hesaba katılarak fiyat önerisi yapılır.'],
      ['Kampanya katılımı', 'Pazaryeri kampanyalarına kârlılık hesabı yapılarak katılınır; zarar ettiren kampanyalar önerilmez.'],
      ['Soru, yorum ve iade takibi', 'Müşteri soruları zamanında cevaplanır; iade nedenleri raporlanır.'],
      ['Mağaza performansı', 'Gönderim süresi, iptal oranı ve mağaza puanı izlenir; düşüş nedenleri bulunur.']
    ],
    olc: ['Pazaryeri bazında satış ve ciro', 'Komisyon ve kargo sonrası kâr', 'Mağaza puanı ve gönderim performansı', 'İade ve iptal oranı'],
    kim: ['Pazaryerinde yeni açılacak markalar', 'Birden fazla pazaryerinde satan ve takipte zorlanan işletmeler', 'Satışı olan ama kârlılığını göremeyen mağazalar'],
    sss: [
      ['Hangi pazaryerlerinde çalışıyorsunuz?', 'Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti ve Pazarama’da çalışıyoruz.'],
      ['Pazaryeri reklamları bu hizmete dahil mi?', 'Pazaryeri içi reklamlar ayrı bir hizmettir (Pazaryeri reklam yönetimi); ikisi birlikte de alınabilir.'],
      ['Kârlılığı nasıl hesaplıyorsunuz?', 'Satış fiyatından ürün maliyeti, komisyon, kargo ve diğer giderler düşülür. Ana sayfamızdaki ücretsiz hesaplayıcıyla kendi rakamlarınızı deneyebilirsiniz.']
    ]
  },
  'e-ticaret-entegrasyon-yonetimi': {
    giris: 'Mağaza, pazaryeri, muhasebe, kargo ve stok sistemlerinizi birbirine bağlıyoruz; aynı bilgi bir kez girilir, her yerde doğru görünür.',
    neden: 'Entegrasyon yoksa ya da yanlış kurulmuşsa stok iki yerde farklı görünür, olmayan ürün satılır, fatura ve kargo bilgisi elle taşınır. Bu hem zaman kaybettirir hem de müşteri şikâyetine dönüşen hatalara yol açar. Doğru kurulmuş entegrasyon, büyüdükçe artan iş yükünü taşır.',
    yap: [
      ['Mevcut yapının haritası', 'Hangi sistemin hangi bilgiyi nereye gönderdiği çıkarılır; çift kayıt ve kopukluklar belirlenir.'],
      ['Entegratör seçimi ve kurulum', 'İhtiyaca ve bütçeye uygun entegrasyon yazılımı seçilir, kurulur ve ayarlanır.'],
      ['Stok ve fiyat eşitleme', 'Stok ve fiyatın tek merkezden tüm kanallara aktarılması sağlanır.'],
      ['Sipariş, fatura ve kargo akışı', 'Siparişin faturaya ve kargo etiketine kendiliğinden dönüşmesi kurulur.'],
      ['Hata takibi', 'Aktarım hataları düzenli izlenir; tekrarlayan hataların kaynağı düzeltilir.']
    ],
    olc: ['Aktarım hatası sayısı', 'Stok tutarsızlığı nedeniyle iptal edilen sipariş', 'Siparişten kargoya geçen süre', 'Elle yapılan işlem miktarı'],
    kim: ['Birden fazla kanalda satan işletmeler', 'Muhasebe ve kargo işlemlerini hâlâ elle yapanlar', 'Altyapı değiştirmeyi düşünen mağazalar'],
    sss: [
      ['Mevcut entegratörümüzü değiştirmemiz gerekir mi?', 'Gerekmeyebilir. Önce mevcut yapıyı inceleriz; sorun ayarlardaysa düzeltiriz, değişiklik gerekiyorsa gerekçesiyle öneririz.'],
      ['Hangi muhasebe yazılımlarıyla çalışıyorsunuz?', 'Logo, Mikro, Paraşüt ve BizimHesap gibi yaygın yazılımlarla çalışıyoruz.']
    ]
  },
  'e-ticaret-urun-kategori-yonetimi': {
    giris: 'Ürün içeriklerini, görsellerini ve kategori yapısını hem müşterinin hem de arama motorlarının anlayacağı şekilde düzenliyoruz.',
    neden: 'Müşteri ürünü elle tutamadığı için kararını sayfadaki bilgiye göre verir. Eksik ölçü, belirsiz malzeme bilgisi ya da yanlış kategori; satışı düşürür, iadeyi artırır. İyi kurgulanmış kategori yapısı ise hem ziyaretçinin aradığını bulmasını hem de Google’da görünürlüğü kolaylaştırır.',
    yap: [
      ['Kategori ağacı', 'Müşterinin arama ve gezinme alışkanlığına göre sade bir kategori yapısı kurulur.'],
      ['Ürün başlık ve açıklamaları', 'Ürünün ne olduğu, kime uygun olduğu ve neden tercih edilmesi gerektiği net anlatılır.'],
      ['Teknik bilgi ve varyantlar', 'Ölçü, malzeme, renk, beden gibi bilgiler eksiksiz ve tutarlı girilir.'],
      ['Görsel standartları', 'Görsel boyutu, arka plan ve açı standartları belirlenir; eksik görseller tamamlanır.'],
      ['Filtreler ve ürün özellikleri', 'Ziyaretçinin aradığı ürünü hızla bulmasını sağlayan filtreler düzenlenir.']
    ],
    olc: ['Ürün sayfası dönüşüm oranı', 'İade nedenleri', 'Kategori sayfalarının arama trafiği', 'Eksik bilgili ürün sayısı'],
    kim: ['Çok sayıda ürünü olan mağazalar', 'İade oranı yüksek kategorilerde satanlar', 'Yeni ürün yüklemeye yetişemeyen ekipler'],
    sss: [
      ['Ürün fotoğraflarını da çekiyor musunuz?', 'Evet, ürün fotoğraf ve video çekimi ayrı bir hizmetimizdir; içerik çalışmasıyla birlikte planlanabilir.'],
      ['Toplu ürün yüklemesi yapıyor musunuz?', 'Evet. Ürün listesi altyapınızın kabul ettiği biçime getirilip toplu olarak yüklenir; yükleme sonrası kontrol edilir.']
    ]
  },
  'e-ticaret-kargo-lojistik-yonetimi': {
    giris: 'Kargo anlaşmalarını, gönderim süreçlerini ve iade akışını düzenliyoruz; sipariş müşteriye zamanında ve sorunsuz ulaşır.',
    neden: 'Kargo, müşterinin markanızla yaşadığı son ve en akılda kalan deneyimdir. Geciken ya da hasarlı gelen sipariş olumsuz yoruma, pazaryerlerinde puan kaybına ve tekrar alışverişin kaybedilmesine yol açar. Kargo maliyeti ise doğrudan kârı etkiler.',
    yap: [
      ['Kargo firması ve anlaşma karşılaştırması', 'Gönderi hacmi, desi ve bölgeye göre teklifler karşılaştırılır.'],
      ['Paketleme standartları', 'Ürüne uygun paketleme ile hasar ve desi maliyeti azaltılır.'],
      ['Gönderim süreci', 'Siparişin hazırlanmasından kargoya verilmesine kadar adımlar ve sorumluluklar netleştirilir.'],
      ['İade akışı', 'İade talebinin alınması, ürünün kontrolü ve ödemenin yapılması düzenli bir sürece bağlanır.'],
      ['Teslimat takibi', 'Geciken ve sorunlu gönderiler izlenir; müşteri sorun yaşamadan bilgilendirilir.']
    ],
    olc: ['Siparişten kargoya geçen süre', 'Teslimat süresi', 'Sipariş başına kargo maliyeti', 'Hasar ve kayıp oranı'],
    kim: ['Günlük sipariş sayısı artan mağazalar', 'Kargo maliyeti kârını eriten işletmeler', 'Pazaryerinde gönderim performansı düşen satıcılar'],
    sss: [
      ['Depo hizmeti veriyor musunuz?', 'Depo hizmeti vermiyoruz; mevcut deponuzun ya da çalıştığınız lojistik firmasının süreçlerini düzenliyoruz.'],
      ['Kargo entegrasyonu da kuruyor musunuz?', 'Evet, sipariş ve kargo etiketinin kendiliğinden oluşması için entegrasyon yönetimiyle birlikte kurulur.']
    ]
  },
  'meta-business-ads-yonetimi': {
    giris: 'Facebook ve Instagram reklamlarınızı satış, form, mesaj ve arama gibi gerçek sonuçlara göre kuruyor ve yönetiyoruz.',
    neden: 'Meta reklamları, henüz sizi aramayan ama ilgilenebilecek kişilere ulaşmanın en güçlü yollarından biridir. Ancak piksel ve Dönüşüm API doğru kurulmazsa sistem yanlış kişilere gösterir; kreatif yenilenmezse aynı kişiler aynı reklamı tekrar tekrar görür ve maliyet yükselir.',
    yap: [
      ['Ölçüm kurulumu', 'Meta pikseli ve Dönüşüm API (CAPI) birlikte kurulur; satış, form ve mesaj olayları ayrı tanımlanır.'],
      ['Kampanya ve kitle kurgusu', 'Soğuk kitle, ilgilenen kitle ve yeniden pazarlama ayrı ele alınır.'],
      ['Kreatif testleri', 'Farklı görsel, video ve mesajlar kontrollü olarak test edilir; kazananlar büyütülür.'],
      ['Katalog ve dinamik reklamlar', 'E-ticarette ürün kataloğu bağlanır; ziyaretçiye baktığı ürünler gösterilir.'],
      ['Sıklık ve yorgunluk takibi', 'Aynı kişiye çok sık gösterilen reklamlar yenilenir.'],
      ['Onaylı bütçe değişiklikleri', 'Bütçe artırma ve kampanya kapatma kararları gerekçesiyle sunulur, onayınızla uygulanır.']
    ],
    olc: ['Sonuç türüne göre maliyet (satış, form, mesaj)', 'Reklam harcamasının getirisi (ROAS)', 'Sıklık ve tıklama oranı', 'Yeni ve geri dönen müşteri payı'],
    kim: ['Instagram ve Facebook’ta görünür olmak isteyen markalar', 'Görsel ürünü olan e-ticaret mağazaları', 'Mesaj veya form ile talep toplayan hizmet işletmeleri'],
    sss: [
      ['Reklam görsellerini siz mi hazırlıyorsunuz?', 'İhtiyaca göre. Tasarım ve video çekimini ekibimiz yapabilir ya da sizin içeriklerinizle çalışabiliriz.'],
      ['Dönüşüm API neden gerekli?', 'Tarayıcı kısıtlamaları nedeniyle yalnızca piksel bazı sonuçları kaçırır. Dönüşüm API, sonuçları sunucudan da ileterek ölçümü daha eksiksiz hale getirir.'],
      ['Reklam hesabı kime ait olur?', 'Hesap sizin işletme yöneticinizde açılır ve size aittir; biz iş ortağı olarak erişiriz.']
    ]
  },
  'dijital-pazarlama-yonetimi': {
    giris: 'Tüm dijital kanallarınız için hedef, bütçe ve öncelik planını yapıyor; kanalları tek bir strateji altında yönetiyoruz.',
    neden: 'Her kanal ayrı ayrı yönetildiğinde bütçe en çok gürültü yapan kanala akar; aynı müşteri iki kez sayılır, hangi kanalın gerçekten işe yaradığı görünmez. Tek bir plan ve ortak ölçüm, bütçenin işe yarayan yere gitmesini sağlar.',
    yap: [
      ['Hedef ve bütçe planı', 'Ticari hedeften geriye doğru gidilerek kanal bazında bütçe ve beklenti belirlenir.'],
      ['Kanal karması', 'Google, Meta, e-posta, SEO ve pazaryeri gibi kanalların rolü netleştirilir.'],
      ['Ortak ölçüm', 'Tüm kanallar aynı ölçüm altyapısına ve tanımlara bağlanır.'],
      ['Aylık strateji görüşmesi', 'Sonuçlar birlikte değerlendirilir, bir sonraki ayın öncelikleri belirlenir.'],
      ['Test takvimi', 'Yeni kanal ve fikirler küçük, ölçülebilir testlerle denenir.']
    ],
    olc: ['Kanal bazında sonuç ve maliyet', 'Toplam pazarlama getirisi', 'Müşteri edinme maliyeti', 'Hedefe göre ilerleme'],
    kim: ['Birden fazla kanalda reklam veren markalar', 'Pazarlama ekibi küçük olan işletmeler', 'Hangi kanalın işe yaradığını göremeyenler'],
    sss: [
      ['Bu hizmet reklam yönetimini kapsıyor mu?', 'Strateji ve koordinasyonu kapsar. Kanalların günlük yönetimi ihtiyaca göre aynı ekip tarafından eklenebilir.'],
      ['Mevcut ajansımızla birlikte çalışabilir misiniz?', 'Evet. Rolleri ve erişimleri netleştirerek diğer ekiplerle birlikte çalışabiliriz.']
    ]
  },
  'e-mail-sms-marketing-yonetimi': {
    giris: 'Müşterilerinize ve abonelerinize doğrudan ulaşan e-posta ve SMS kampanyalarını izinli liste ve otomasyonlarla yönetiyoruz.',
    neden: 'E-posta ve SMS, reklam bütçesi harcamadan mevcut müşterilere yeniden ulaşmanın yoludur. Sepette bırakılan ürün hatırlatması, hoş geldin serisi ve tekrar alışveriş kampanyaları en verimli kanallar arasındadır. Ticari ileti için izin ve İYS kaydı ise yasal zorunluluktur.',
    yap: [
      ['İzin ve İYS uyumu', 'Ticari ileti onayının doğru toplanması ve İYS süreçleri kontrol edilir.'],
      ['Liste ve segmentler', 'Müşteriler alışveriş geçmişine ve ilgisine göre gruplara ayrılır.'],
      ['Otomasyonlar', 'Hoş geldin, sepet hatırlatma, satın alma sonrası ve geri kazanım akışları kurulur.'],
      ['Kampanya e-postaları', 'Kampanya takvimine uygun, mobilde okunaklı e-postalar hazırlanır.'],
      ['Teslim edilebilirlik', 'Gönderen alan adı ayarları ve liste temizliği ile e-postaların gelen kutusuna ulaşması sağlanır.']
    ],
    olc: ['Açılma ve tıklama oranı', 'E-posta ve SMS kaynaklı satış', 'Abonelikten çıkma oranı', 'Teslim edilemeyen ileti oranı'],
    kim: ['Müşteri listesi olan e-ticaret mağazaları', 'Tekrar satış potansiyeli yüksek markalar', 'Kampanya duyurularını düzenli yapmak isteyen işletmeler'],
    sss: [
      ['Hangi gönderim servisleriyle çalışıyorsunuz?', 'Mevcut servisinizle çalışabiliriz; yoksa ihtiyacınıza uygun servisi birlikte seçeriz.'],
      ['İzinsiz listeye gönderim yapıyor musunuz?', 'Hayır. Ticari iletiler yalnızca izin vermiş kişilere gönderilir.']
    ]
  },
  'influencer-marketing-yonetimi': {
    giris: 'Markanıza ve hedef kitlenize uygun içerik üreticileriyle iş birliklerini buluyor, planlıyor ve ölçüyoruz.',
    neden: 'Doğru içerik üreticisi, markanızı güvendiği bir kişinin ağzından tanıtır. Yanlış seçim ise takipçi sayısı yüksek ama kitlesi ilgisiz bir hesaba bütçe harcatır. Kitle uyumu, içerik kalitesi ve ölçülebilirlik birlikte değerlendirilmelidir.',
    yap: [
      ['İçerik üreticisi araştırması', 'Kitle yapısı, etkileşim kalitesi ve marka uyumu incelenir.'],
      ['İş birliği kurgusu', 'Mesaj, içerik türü, yayın takvimi ve kullanım hakları netleştirilir.'],
      ['Reklam etiketi ve mevzuat', 'Paylaşımların reklam olduğu açıkça belirtilir; ilgili düzenlemelere uyulur.'],
      ['Takip bağlantıları ve kodlar', 'Her iş birliğinin getirisi ayrı ölçülebilsin diye bağlantı ve indirim kodları tanımlanır.'],
      ['Sonuç raporu', 'Erişim, etkileşim ve satış katkısı birlikte raporlanır.']
    ],
    olc: ['İş birliği başına erişim ve etkileşim', 'Bağlantı ve kod kaynaklı satış', 'Takipçi kazanımı', 'İçeriklerin reklamda yeniden kullanım performansı'],
    kim: ['Yeni ürün lansmanı yapan markalar', 'Güven oluşturması gereken kategorilerde satanlar', 'Instagram ve TikTok’ta görünürlük isteyen işletmeler'],
    sss: [
      ['Takipçi sayısı mı önemli, etkileşim mi?', 'İkisi de tek başına yeterli değildir. Kitlenin size uygun olması ve etkileşimin gerçek olması daha önemlidir.'],
      ['Sağlık alanında influencer çalışması yapılabilir mi?', 'Sağlık reklamlarında özel kısıtlamalar vardır; bu alanda iş birlikleri mevzuata uygunluk kontrol edilerek planlanır.']
    ]
  },
  'e-ticaret-pazaryeri-reklam-yonetimi': {
    giris: 'Trendyol, Hepsiburada ve Amazon gibi pazaryerlerinin kendi reklam alanlarında ürünlerinizi kârlılığı gözeterek öne çıkarıyoruz.',
    neden: 'Pazaryerlerinde rekabet arttıkça ürünlerin organik olarak öne çıkması zorlaşır. Pazaryeri reklamları satış getirir; ancak komisyon ve kargo üzerine eklenen reklam maliyeti hesaplanmazsa satış artarken kâr azalabilir.',
    yap: [
      ['Ürün seçimi', 'Reklam verilecek ürünler kâr marjı, stok ve rekabet durumuna göre seçilir.'],
      ['Kampanya ve teklif yapısı', 'Anahtar kelime ve ürün hedeflemeleri ayrı yönetilir; teklifler kârlılığa göre ayarlanır.'],
      ['Arama terimi analizi', 'Satış getirmeyen aramalar ayıklanır, getirenler güçlendirilir.'],
      ['Bütçe dağılımı', 'Bütçe, getirisi yüksek ürün ve kampanyalara kaydırılır; değişiklikler onayınızla yapılır.'],
      ['Kârlılık raporu', 'Reklam maliyeti dahil ürün başına kâr düzenli raporlanır.']
    ],
    olc: ['Reklam harcamasının getirisi', 'Reklam dahil ürün başına kâr', 'Reklam kaynaklı satış payı', 'Arama terimi bazında maliyet'],
    kim: ['Pazaryerinde rekabeti yoğun kategorilerde satanlar', 'Yeni ürünlerini hızla görünür yapmak isteyen satıcılar', 'Reklam verdiği halde kârını göremeyen mağazalar'],
    sss: [
      ['Pazaryeri reklamlarında minimum bütçe var mı?', 'Pazaryerinin kendi kuralları dışında zorunlu bir alt sınırımız yoktur; başlangıç bütçesini ürün ve kâr yapınıza göre birlikte belirleriz.'],
      ['Mağaza yönetimi olmadan sadece reklam alabilir miyiz?', 'Evet, yalnızca pazaryeri reklam yönetimi de alınabilir.']
    ]
  }
};
