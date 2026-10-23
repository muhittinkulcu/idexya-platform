// Hizmet sayfası içerikleri: SEO ve GEO, web ve yazılım.
// Kurallar: sıralama veya sonuç garantisi yok; yalnızca yaptığımız işi ve neden önemli olduğunu anlatır.
import type { HizmetDetay } from './hizmet-detay';

export const DETAY_2: Record<string, HizmetDetay> = {
  'seo-icerik-optimizasyonu': {
    giris: 'Sitenizdeki içerikleri, arayan kişinin sorusuna net ve güvenilir cevap verecek şekilde yeniden düzenliyor ve yeni içerikler planlıyoruz.',
    neden: 'Arama motorları ve yapay zekâ asistanları, soruya en açık ve güvenilir cevabı veren sayfayı öne çıkarır. Ürün ve hizmet sayfalarındaki yüzeysel metinler hem sıralamayı hem de ziyaretçinin güvenini düşürür. İyi içerik, reklam durduğunda da ziyaretçi getirmeye devam eder.',
    yap: [
      ['İçerik envanteri', 'Mevcut sayfalar trafik, sıralama ve güncellik açısından incelenir; birleştirilecek ve güncellenecekler belirlenir.'],
      ['Arama niyeti eşleştirme', 'Her sayfanın hangi soruya cevap vereceği netleştirilir.'],
      ['Sayfa içeriklerinin yenilenmesi', 'Başlık yapısı, açıklamalar, sık sorulanlar ve iç bağlantılar düzenlenir.'],
      ['Yeni içerik takvimi', 'Müşterilerin sorduğu sorulara göre blog ve rehber içerikleri planlanır.'],
      ['Yapay zekâ cevaplarına uygunluk (GEO)', 'Kısa ve doğrudan cevaplar, kaynak gösterilebilir bilgiler ve yapılandırılmış veri eklenir.']
    ],
    olc: ['Organik trafik ve tıklama', 'Hedef sorgulardaki sıralama', 'İçerikten gelen dönüşümler', 'Yapay zekâ özetlerinde görünürlük'],
    kim: ['Sitesi olan ama aramadan ziyaretçi alamayan işletmeler', 'Uzmanlığını içerikle göstermek isteyen markalar', 'Reklam bağımlılığını azaltmak isteyenler'],
    sss: [
      ['Yapay zekâyla üretilmiş içerik kullanıyor musunuz?', 'Araştırma ve taslakta yapay zekâdan yararlanabiliriz; ancak her içerik uzman tarafından kontrol edilir, doğrulanır ve markanızın diline uyarlanır.'],
      ['İçerikler ne zaman sonuç verir?', 'Bu; sitenin mevcut durumuna, rekabete ve içeriğin kapsamına bağlıdır. Genellikle aylar içinde gelişen bir süreçtir; sıralama garantisi vermeyiz.']
    ]
  },
  'seo-anahtar-kelime-analizi': {
    giris: 'Müşterilerinizin sizi ararken gerçekte hangi kelimeleri kullandığını bulup sitenizin yapısını ve içerik planını buna göre kuruyoruz.',
    neden: 'İşletmelerin kendilerini anlatırken kullandığı kelimeler ile müşterilerin aradığı kelimeler çoğu zaman farklıdır. Doğru kelimeleri hedeflemeyen bir site, ne kadar iyi tasarlanmış olursa olsun aramada bulunmaz. Analiz, emeğin doğru yere harcanmasını sağlar.',
    yap: [
      ['Kelime araştırması', 'Arama hacmi, rekabet ve satın alma niyeti birlikte değerlendirilir.'],
      ['Rakip analizi', 'Rakiplerin hangi aramalarda göründüğü ve boşluklar çıkarılır.'],
      ['Kelime grupları', 'Kelimeler konulara göre gruplanır ve her grup bir sayfaya eşlenir.'],
      ['Önceliklendirme', 'Hızlı kazanılabilecek ve uzun vadeli hedefler ayrılır.'],
      ['Uygulama planı', 'Hangi sayfanın oluşturulacağı ya da güncelleneceği sırasıyla listelenir.']
    ],
    olc: ['Hedef kelimelerdeki görünürlük', 'Kelime grubu bazında organik trafik', 'Arama Konsolu gösterim ve tıklama', 'Dönüşüm getiren sorgular'],
    kim: ['Yeni site kuracak işletmeler', 'İçerik üretiyor ama trafik alamayanlar', 'Yeni bir pazara ya da şehre açılan markalar'],
    sss: [
      ['Analiz sonunda ne teslim ediyorsunuz?', 'Kelime grupları, sayfa eşleştirmesi ve öncelik sırasıyla bir uygulama planı teslim ederiz.'],
      ['Google Ads verisi analizde kullanılıyor mu?', 'Reklam hesabınız varsa, gerçek arama terimleri analize çok değerli bir kaynak olarak eklenir.']
    ]
  },
  'teknik-seo': {
    giris: 'Sitenizin hızını, taranabilirliğini ve altyapısını arama motorlarının sorunsuz okuyabileceği hale getiriyoruz.',
    neden: 'İçerik ne kadar iyi olursa olsun, arama motoru sayfayı tarayamıyor, yanlış sürümünü görüyor ya da sayfa çok yavaş açılıyorsa görünürlük düşer. Site taşımalarında yapılan yönlendirme hataları ise yılların emeğini kısa sürede kaybettirebilir.',
    yap: [
      ['Tarama ve dizine ekleme kontrolü', 'Robots, site haritası, kanonik etiketler ve dizine eklenme sorunları incelenir.'],
      ['Hız ve Önemli Web Verileri', 'Sayfa yükleme ve etkileşim hızını düşüren sorunlar bulunur ve düzeltilir.'],
      ['Yönlendirmeler ve kırık bağlantılar', 'Kalıcı (301) yönlendirmeler doğru kurulur; kırık bağlantılar giderilir.'],
      ['Yapılandırılmış veri', 'Ürün, işletme ve sık sorulan sorular gibi bilgiler arama motorlarına uygun biçimde işaretlenir.'],
      ['Site taşıma desteği', 'Alan adı ya da altyapı değişikliklerinde trafik kaybını önleyecek plan uygulanır.']
    ],
    olc: ['Dizine eklenen sayfa sayısı', 'Önemli Web Verileri', 'Tarama hataları', 'Organik trafik değişimi'],
    kim: ['Yeni siteye geçen ya da alan adı değiştiren işletmeler', 'Trafiği nedeni bilinmeden düşen siteler', 'Çok sayfalı e-ticaret siteleri'],
    sss: [
      ['Site taşırken trafik kaybı olur mu?', 'Doğru planlanmış yönlendirmelerle kayıp en aza indirilir; geçiş sonrası Arama Konsolu yakından izlenir.'],
      ['Teknik düzeltmeleri kim yapıyor?', 'Altyapınıza göre doğrudan biz uygularız ya da yazılımcınıza ayrıntılı iş listesi veririz.']
    ]
  },
  'site-ici-seo-on-page-seo': {
    giris: 'Sayfa başlıklarını, açıklamaları, başlık yapısını, iç bağlantıları ve görselleri her sayfanın hedefine göre düzenliyoruz.',
    neden: 'Arama motorları bir sayfanın neyle ilgili olduğunu başlık, alt başlık, metin ve bağlantılardan anlar. Aynı başlığı taşıyan sayfalar birbirleriyle yarışır, açıklaması olmayan sayfalar arama sonucunda tıklanmaz. Site içi düzenlemeler, mevcut içeriğin hakkını vermenin en hızlı yoludur.',
    yap: [
      ['Başlık ve açıklama etiketleri', 'Her sayfaya benzersiz, tıklamaya değer başlık ve açıklama yazılır.'],
      ['Başlık hiyerarşisi', 'Sayfa içindeki ana ve alt başlıklar düzenlenir.'],
      ['İç bağlantılar', 'Önemli sayfalara site içinden doğru bağlantılar verilir.'],
      ['Görsel optimizasyonu', 'Görsel boyutları küçültülür, açıklayıcı alternatif metinler eklenir.'],
      ['Yinelenen içerik', 'Birbirine çok benzeyen sayfalar birleştirilir ya da ayrıştırılır.']
    ],
    olc: ['Arama sonuçlarında tıklama oranı', 'Hedef sorgulardaki sıralama', 'Sayfa başına organik trafik', 'Sayfada kalma ve dönüşüm'],
    kim: ['İçeriği olan ama sıralaması zayıf siteler', 'Ürün ve kategori sayfası çok olan mağazalar', 'Kendi sitesini güncelleyen ama SEO bilgisi olmayan ekipler'],
    sss: [
      ['Site içi SEO ile teknik SEO arasındaki fark ne?', 'Teknik SEO sitenin altyapısıyla, site içi SEO ise her sayfanın içeriği ve düzeniyle ilgilenir. İkisi birlikte en iyi sonucu verir.'],
      ['Değişiklikler siteyi bozar mı?', 'Değişiklikler önce listelenir ve onayınızla uygulanır; geri alınabilir şekilde kayıt altına alınır.']
    ]
  },
  'yerel-seo-hizmeti': {
    giris: 'Google Haritalar’da ve “yakınımdaki” aramalarda işletmenizin bulunmasını, doğru bilgilerle görünmesini sağlıyoruz.',
    neden: 'Klinik, mağaza, servis ya da showroom gibi fiziksel konumu olan işletmelerde müşterilerin büyük kısmı Haritalar’dan gelir. Yanlış çalışma saati, eksik kategori ya da cevapsız yorumlar müşteriyi rakibe yönlendirir. Google İşletme Profili, ücretsiz ama en çok ihmal edilen kanallardandır.',
    yap: [
      ['Google İşletme Profili', 'Kategori, hizmetler, çalışma saatleri, fotoğraflar ve açıklama eksiksiz düzenlenir.'],
      ['Tutarlı işletme bilgisi', 'Ad, adres ve telefon bilgisi site ve rehberlerde tutarlı hale getirilir.'],
      ['Yorum yönetimi', 'Yorum isteme süreci kurulur; yorumlar zamanında ve özenle cevaplanır.'],
      ['Yerel sayfalar', 'Birden fazla şube ya da hizmet bölgesi için ayrı sayfalar oluşturulur.'],
      ['Gönderi ve güncellemeler', 'Profilde düzenli gönderi ve kampanya duyurusu yapılır.']
    ],
    olc: ['Haritalar’da görüntülenme', 'Yol tarifi, arama ve web sitesi tıklamaları', 'Yorum sayısı ve puanı', 'Yerel aramalarda sıralama'],
    kim: ['Klinikler ve sağlık işletmeleri', 'Mağaza, showroom ve servis noktaları', 'Belirli şehir ya da bölgelere hizmet verenler'],
    sss: [
      ['Sahte yorum hizmeti veriyor musunuz?', 'Hayır. Sahte yorum hem kurallara aykırıdır hem de markaya zarar verir. Gerçek müşterilerden yorum isteme sürecini kuruyoruz.'],
      ['Birden fazla şube için çalışır mı?', 'Evet, her şube için ayrı profil ve yerel sayfa yönetilir.']
    ]
  },
  'backlink-stratejisi': {
    giris: 'Sitenize güvenilir ve konuyla ilgili kaynaklardan bağlantı kazanmak için içerik ve iş birliği odaklı bir plan uyguluyoruz.',
    neden: 'Başka sitelerden gelen bağlantılar, arama motorları için güven işaretidir. Ancak satın alınan ya da ilgisiz sitelerden gelen bağlantılar fayda yerine ceza riski taşır. Kalıcı etki, gerçekten bahsedilmeye değer içerik ve doğru iş birlikleriyle gelir.',
    yap: [
      ['Bağlantı profili analizi', 'Mevcut bağlantılar incelenir; riskli olanlar belirlenir.'],
      ['Rakip karşılaştırması', 'Rakiplerin bağlantı aldığı kaynaklar ve fırsatlar çıkarılır.'],
      ['Bahsedilmeye değer içerik', 'Rehber, araştırma ve araç gibi doğal bağlantı kazandıracak içerikler planlanır.'],
      ['İş birliği ve basın', 'Sektör yayınları, iş ortakları ve yerel kaynaklarla iletişim kurulur.'],
      ['Kırık bağlantı fırsatları', 'Sizden bahseden ama bağlantı vermeyen ya da kırık bağlantı veren siteler tespit edilir.']
    ],
    olc: ['Bağlantı veren alan adı sayısı ve kalitesi', 'Hedef sayfalara gelen bağlantılar', 'Organik görünürlük değişimi', 'Bağlantı kaynaklı ziyaret'],
    kim: ['İçeriği güçlü ama otoritesi düşük siteler', 'Rekabetçi sektörlerde görünür olmak isteyenler', 'Geçmişte riskli bağlantı almış siteler'],
    sss: [
      ['Paket halinde backlink satıyor musunuz?', 'Hayır. Toplu ve ücretli bağlantı paketleri arama motoru kurallarına aykırıdır ve risk taşır.'],
      ['Kaç bağlantı garanti ediyorsunuz?', 'Sayı garantisi vermeyiz; kaliteye ve konuyla ilgiye odaklanırız.']
    ]
  },
  'web-tasarim-hizmetleri': {
    giris: 'Hızlı açılan, telefonda rahat kullanılan, ölçümü baştan doğru kurulmuş ve satışa ya da talebe odaklı web siteleri tasarlıyoruz.',
    neden: 'Web sitesi çoğu müşterinin sizinle ilk temasıdır ve reklamla gelen ziyaretçinin karar verdiği yerdir. Yavaş açılan, telefonda zor kullanılan ya da formu çalışmayan bir site, reklam bütçesini de boşa harcatır. Sonradan eklenen ölçüm ise eksik kalır.',
    yap: [
      ['İhtiyaç ve içerik planı', 'Ziyaretçinin hangi sorularla geldiği ve sitede ne yapmasını istediğiniz netleştirilir.'],
      ['Önce telefon tasarımı', 'Tasarım önce telefon ekranına göre yapılır, sonra büyük ekranlara uyarlanır.'],
      ['Hız ve erişilebilirlik', 'Sayfalar hızlı açılacak ve herkesin kullanabileceği şekilde hazırlanır.'],
      ['Ölçüm ve form altyapısı', 'GA4, etiketler, form ve arama ölçümü yayından önce kurulur ve test edilir.'],
      ['KVKK ve çerez uyumu', 'Aydınlatma metni, çerez onayı ve form izinleri baştan doğru kurulur.'],
      ['Yayın ve yönlendirmeler', 'Eski siteden geçişte kalıcı yönlendirmeler yapılır, yayın sonrası kontrol edilir.']
    ],
    olc: ['Sayfa hızı', 'Form ve arama dönüşümleri', 'Telefon kullanıcılarının dönüşüm oranı', 'Hata ve kırık bağlantı sayısı'],
    kim: ['Sitesi eskiyen ya da telefonda zor kullanılan işletmeler', 'Reklam veren ama siteden talep alamayanlar', 'Yeni kurulan markalar'],
    sss: [
      ['Site yayına alındıktan sonra güncellemeleri kim yapıyor?', 'İçeriği kendiniz yönetebileceğiniz bir yapı kuruyoruz; isterseniz bakım ve güncellemeyi biz üstleniyoruz.'],
      ['Alan adı ve barındırma kime ait olur?', 'Alan adı ve barındırma hesapları sizin adınıza olur.']
    ]
  },
  'yazilim-danismanligi': {
    giris: 'İşinizi kolaylaştıracak yazılımı seçmenize, kurmanıza ve mevcut sistemlerinizle bağlamanıza yardım ediyoruz.',
    neden: 'Yanlış seçilen yazılım, aylar süren uyum sürecine, kullanılmayan lisanslara ve verinin birden çok yerde tutulmasına yol açar. İhtiyacın net tanımlanması ve seçeneklerin tarafsız karşılaştırılması, hem maliyeti hem de zaman kaybını azaltır.',
    yap: [
      ['İhtiyaç analizi', 'Ekibin günlük iş akışı ve sorun yaşadığı noktalar çıkarılır.'],
      ['Seçenek karşılaştırması', 'Hazır yazılımlar ve özel geliştirme seçenekleri maliyet ve uygunluk açısından karşılaştırılır.'],
      ['Kurulum ve veri aktarımı', 'Seçilen yazılım kurulur, mevcut veriler kontrollü şekilde aktarılır.'],
      ['Entegrasyon', 'Yazılımın web sitesi, e-ticaret ve muhasebe sistemleriyle bağlantısı kurulur.'],
      ['Ekip eğitimi', 'Ekibin yazılımı doğru kullanması için eğitim ve kısa kılavuzlar hazırlanır.']
    ],
    olc: ['Elle yapılan işlem miktarı', 'Aynı verinin girildiği yer sayısı', 'Kullanıcıların yazılımı benimseme oranı', 'Süreç başına harcanan süre'],
    kim: ['Excel ve e-postayla yürüyen işleri sisteme taşımak isteyenler', 'Yazılım seçiminde kararsız kalan işletmeler', 'Birbiriyle konuşmayan yazılımları olanlar'],
    sss: [
      ['Belirli bir yazılım firmasının bayisi misiniz?', 'Danışmanlıkta tarafsız kalırız; öneriyi ihtiyacınıza göre yaparız.'],
      ['Özel yazılım geliştiriyor musunuz?', 'Gerekli durumlarda özel çözüm ve entegrasyon geliştiriyoruz; önce hazır seçenekleri değerlendiririz.']
    ]
  },
  'erp-yazilim-danismanligi': {
    giris: 'Stok, satın alma, üretim, satış ve muhasebeyi tek sistemde toplayan ERP yazılımının seçimi ve kurulumunda yanınızdayız.',
    neden: 'ERP doğru kurulduğunda işletmenin tek doğru bilgi kaynağı olur; yanlış kurulduğunda ise ekip eski yöntemlere geri döner ve yatırım boşa gider. Süreçlerin yazılımdan önce netleştirilmesi başarının en önemli koşuludur.',
    yap: [
      ['Süreç analizi', 'Satın alma, stok, satış ve muhasebe süreçleri uçtan uca çıkarılır.'],
      ['ERP seçimi', 'İşletmenin büyüklüğüne ve sektörüne uygun ERP seçenekleri karşılaştırılır.'],
      ['Kurulum planı', 'Modüller, veri aktarımı ve canlıya geçiş takvimi planlanır.'],
      ['E-ticaret ve pazaryeri bağlantısı', 'ERP’nin satış kanallarıyla stok ve sipariş alışverişi kurulur.'],
      ['Canlıya geçiş desteği', 'İlk dönemde ortaya çıkan sorunlar takip edilir ve çözülür.']
    ],
    olc: ['Stok doğruluğu', 'Siparişten faturaya geçen süre', 'Raporlama için harcanan süre', 'Kanallar arası veri tutarlılığı'],
    kim: ['Büyüyen ve süreçleri karmaşıklaşan işletmeler', 'Üretim ve stok yönetimi olan firmalar', 'Birden çok satış kanalını tek merkezden yönetmek isteyenler'],
    sss: [
      ['Hangi ERP yazılımlarıyla çalışıyorsunuz?', 'Logo ve Mikro gibi yaygın yerli çözümlerle çalışıyoruz; ihtiyaca göre diğer seçenekleri de değerlendiriyoruz.'],
      ['ERP geçişi ne kadar sürer?', 'Kapsama, modül sayısına ve veri durumuna göre değişir; analizden sonra gerçekçi bir takvim çıkarırız.']
    ]
  },
  'crm-yazilim-danismanligi': {
    giris: 'Müşteri ve satış süreçlerinizi takip edeceğiniz CRM sistemini seçiyor, kuruyor ve reklam ile web formlarınıza bağlıyoruz.',
    neden: 'Talepler e-posta, telefon ve mesaj arasında dağıldığında hangi talebin satışa döndüğü bilinmez, takip edilmeyen müşteriler kaybolur. CRM, talepten satışa kadar her adımı görünür kılar ve reklamların gerçek satış katkısını ölçmeyi mümkün kılar.',
    yap: [
      ['Satış süreci tasarımı', 'Talep, görüşme, teklif ve kazanım aşamaları tanımlanır.'],
      ['CRM seçimi ve kurulumu', 'Ekip büyüklüğüne ve ihtiyaca uygun CRM seçilir ve kurulur.'],
      ['Form ve reklam bağlantısı', 'Web formları, reklam formları ve mesajlar CRM’e kendiliğinden düşer.'],
      ['Otomatik hatırlatmalar', 'Takip edilmeyen talepler ve süresi geçen teklifler için hatırlatmalar kurulur.'],
      ['Satış raporları', 'Kaynak bazında talep, teklif ve kazanım raporları hazırlanır.']
    ],
    olc: ['Talepten satışa dönüşüm oranı', 'İlk dönüş süresi', 'Kaynak bazında kazanılan satış', 'Takipsiz kalan talep sayısı'],
    kim: ['Form ve telefonla talep toplayan hizmet işletmeleri', 'Satış ekibi olan B2B firmalar', 'Reklamın gerçek satış katkısını görmek isteyenler'],
    sss: [
      ['Hangi CRM’leri kullanıyorsunuz?', 'HubSpot başta olmak üzere ihtiyaca uygun CRM’lerle çalışıyoruz.'],
      ['Satış verisi reklam platformlarına gönderilebilir mi?', 'Evet, kişisel verilere ilişkin kurallara uyularak çevrim dışı dönüşüm olarak gönderilebilir; bu, reklamların nitelikli talebe göre öğrenmesini sağlar.']
    ]
  },
  'on-muhasebe-yazilim-danismanligi': {
    giris: 'Fatura, cari, tahsilat ve gider takibini kolaylaştıran ön muhasebe yazılımını seçiyor, kuruyor ve satış kanallarınıza bağlıyoruz.',
    neden: 'Faturalar elle kesildiğinde hata ve gecikme artar; tahsilatlar takip edilmezse nakit akışı bozulur. Ön muhasebe yazılımının e-ticaret ve pazaryerleriyle bağlanması, hem zaman kazandırır hem de mali müşavirinizle çalışmayı kolaylaştırır.',
    yap: [
      ['Yazılım seçimi', 'İşlem hacmine ve e-fatura ihtiyacına uygun yazılım seçilir.'],
      ['Kurulum ve tanımlar', 'Cari kartlar, ürünler, vergi ayarları ve belge şablonları hazırlanır.'],
      ['Satış kanalı bağlantısı', 'E-ticaret ve pazaryeri siparişlerinin faturaya dönüşmesi kurulur.'],
      ['Tahsilat ve gider takibi', 'Vadesi gelen alacak ve ödemeler için düzenli takip kurulur.'],
      ['Mali müşavirle uyum', 'Verilerin mali müşavirinizin ihtiyacına uygun aktarılması sağlanır.']
    ],
    olc: ['Fatura kesme süresi', 'Hatalı ya da iptal edilen fatura sayısı', 'Vadesi geçmiş alacak', 'Elle yapılan kayıt miktarı'],
    kim: ['Faturalarını hâlâ elle kesen işletmeler', 'E-ticaret ve pazaryeri siparişi artan mağazalar', 'Nakit akışını daha iyi görmek isteyenler'],
    sss: [
      ['Muhasebe hizmeti veriyor musunuz?', 'Hayır, muhasebe ve beyanname işleri mali müşavirinizde kalır. Biz yazılımın seçimi, kurulumu ve bağlantısında destek oluyoruz.'],
      ['Hangi yazılımlarla çalışıyorsunuz?', 'Paraşüt ve BizimHesap gibi yaygın ön muhasebe yazılımlarıyla çalışıyoruz.']
    ]
  }
};
