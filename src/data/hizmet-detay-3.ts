// Hizmet sayfası içerikleri: Tasarım ve içerik.
import type { HizmetDetay } from './hizmet-detay';

export const DETAY_3: Record<string, HizmetDetay> = {
  'grafik-tasarim-hizmetleri': {
    giris: 'Sosyal medya gönderileri, reklam görselleri, kampanya afişleri ve basılı materyaller için markanıza uygun tasarımlar hazırlıyoruz.',
    neden: 'Reklamda ve sosyal medyada ilk saniyede dikkat çekmeyen görsel kaydırılıp geçilir. Her seferinde farklı görünen tasarımlar ise markanın tanınmasını zorlaştırır. Tutarlı ve platforma uygun tasarım, aynı bütçeyle daha fazla etki demektir.',
    yap: [
      ['Reklam görselleri', 'Google ve Meta reklamları için farklı boyut ve mesajlarda test edilebilir görseller hazırlanır.'],
      ['Sosyal medya tasarımları', 'Gönderi, hikâye ve kapak tasarımları marka kimliğine uygun hazırlanır.'],
      ['Kampanya materyalleri', 'İndirim, lansman ve özel gün kampanyaları için görsel seti oluşturulur.'],
      ['Basılı materyaller', 'Katalog, broşür, kartvizit ve ambalaj tasarımları yapılır.'],
      ['Şablon kütüphanesi', 'Ekibinizin hızlıca kullanabileceği düzenlenebilir şablonlar hazırlanır.']
    ],
    olc: ['Reklam görsellerinin tıklama oranı', 'Sosyal medya etkileşimi', 'Teslim süresi', 'Revizyon sayısı'],
    kim: ['Düzenli içerik ve reklam görseline ihtiyaç duyan markalar', 'Tasarım ekibi olmayan işletmeler', 'Kampanya dönemlerinde hızlı üretim isteyenler'],
    sss: [
      ['Kaynak dosyalar bize teslim ediliyor mu?', 'Evet, onaylanan tasarımların kaynak dosyaları teslim edilir.'],
      ['Kaç revizyon hakkı var?', 'Revizyon kapsamını işin büyüklüğüne göre başlangıçta birlikte belirleriz.']
    ]
  },
  'logo-tasarimi': {
    giris: 'Markanızın karakterini yansıtan, küçük ekranda da büyük tabelada da okunaklı kalan bir logo tasarlıyoruz.',
    neden: 'Logo, markanızın her yerde ilk görülen yüzüdür: site, sosyal medya profili, ambalaj, fatura. Karmaşık ya da sadece belirli bir boyutta iyi görünen logolar, uygulamada sorun çıkarır. İyi bir logo yıllarca değiştirmeden kullanılabilir.',
    yap: [
      ['Marka görüşmesi', 'Markanın değerleri, hedef kitlesi ve rakipleri konuşulur.'],
      ['Konsept önerileri', 'Farklı yönlerde logo konseptleri gerekçeleriyle sunulur.'],
      ['Geliştirme', 'Seçilen konsept üzerinde renk, yazı karakteri ve oranlar netleştirilir.'],
      ['Kullanım sürümleri', 'Yatay, dikey, tek renk ve küçük boyut sürümleri hazırlanır.'],
      ['Teslim paketi', 'Baskı ve dijital kullanım için tüm dosya biçimleri teslim edilir.']
    ],
    olc: ['Küçük boyutta okunabilirlik', 'Farklı zeminlerde kullanılabilirlik', 'Rakiplerden ayrışma', 'Marka kılavuzuna uyum'],
    kim: ['Yeni kurulan markalar', 'Logosu eskiyen ya da dijitalde zor kullanılan işletmeler', 'Yeni ürün markası çıkaran firmalar'],
    sss: [
      ['Logo tescili yapıyor musunuz?', 'Tescil başvurusu marka vekilleri tarafından yapılır; tasarım sürecinde benzer markalara dikkat ederiz, başvuru öncesi vekilinize danışmanızı öneririz.'],
      ['Logo dosyaları hangi biçimlerde teslim ediliyor?', 'Vektörel kaynak dosya, SVG, PNG ve PDF biçimlerinde teslim edilir.']
    ]
  },
  'kurumsal-kimlik-tasarimi': {
    giris: 'Logo, renk, yazı karakteri ve görsel dilden oluşan, her yerde tutarlı kullanılabilecek bir kurumsal kimlik sistemi hazırlıyoruz.',
    neden: 'Müşteriler bir markayı tekrar eden görsel işaretlerle tanır ve hatırlar. Her çalışanın ya da ajansın farklı renk ve yazı kullandığı bir marka dağınık ve güvensiz görünür. Kurumsal kimlik kılavuzu, tutarlılığı kişilere değil sisteme bağlar.',
    yap: [
      ['Renk paleti', 'Ana ve yardımcı renkler, ekranda ve baskıda karşılıklarıyla belirlenir.'],
      ['Yazı karakterleri', 'Başlık ve metin için okunaklı, lisansı uygun yazı karakterleri seçilir.'],
      ['Görsel dil', 'Fotoğraf, ikon ve illüstrasyon tarzı tanımlanır.'],
      ['Kurumsal materyaller', 'Kartvizit, antetli kâğıt, e-posta imzası ve sunum şablonu hazırlanır.'],
      ['Marka kılavuzu', 'Tüm kuralların doğru ve yanlış örnekleriyle anlatıldığı kılavuz teslim edilir.']
    ],
    olc: ['Materyaller arası tutarlılık', 'Kılavuzun ekip ve ajanslarca kullanımı', 'Yeni materyal hazırlama süresi', 'Marka bilinirliği'],
    kim: ['Büyüyen ve birden çok ekiple çalışan markalar', 'Yeniden markalaşan işletmeler', 'Bayi veya şube ağı olan firmalar'],
    sss: [
      ['Logomuz var, sadece kimlik çalışması yapılabilir mi?', 'Evet, mevcut logonuz korunarak etrafında kurumsal kimlik sistemi kurulabilir.'],
      ['Web sitesi tasarımı bu hizmete dahil mi?', 'Değil; ancak kimlik çalışması web tasarımına doğrudan uygulanabilir şekilde hazırlanır.']
    ]
  },
  'instagram-reels-youtube-shorts-cekimleri': {
    giris: 'Instagram Reels, YouTube Shorts ve TikTok için kısa, dikey ve izlenmeye değer videolar planlıyor, çekiyor ve kurguluyoruz.',
    neden: 'Kısa dikey videolar, sosyal platformlarda yeni kişilere ulaşmanın en güçlü biçimlerinden biridir. Ancak ilk saniyelerde dikkat çekmeyen video kaydırılıp geçilir. Plan, çekim ve kurgunun platformun diline göre yapılması gerekir; aynı videolar reklamda da kullanılabilir.',
    yap: [
      ['İçerik planı', 'Markanıza ve hedef kitlenize uygun video fikirleri ve aylık takvim hazırlanır.'],
      ['Senaryo ve ilk saniyeler', 'Her video için dikkat çekici açılış ve net bir mesaj yazılır.'],
      ['Çekim', 'Ürün, hizmet ve ekip çekimleri dikey formatta yapılır.'],
      ['Kurgu, altyazı ve müzik', 'Sessiz izleyenler için altyazı eklenir; müzik ve efektler lisansına uygun seçilir.'],
      ['Reklamda kullanım', 'Başarılı videolar Meta ve diğer platformlarda reklam olarak kullanılmak üzere uyarlanır.']
    ],
    olc: ['İzlenme ve izlenme süresi', 'Etkileşim ve paylaşım', 'Profil ziyareti ve takipçi kazanımı', 'Reklamda kullanıldığında sonuç başına maliyet'],
    kim: ['Instagram ve YouTube’da büyümek isteyen markalar', 'Ürününü hareket halinde göstermesi gereken işletmeler', 'Reklam için düzenli video ihtiyacı olanlar'],
    sss: [
      ['Çekimler nerede yapılıyor?', 'İşletmenizde, ürününüzün kullanıldığı ortamda ya da ihtiyaca göre stüdyoda yapılabilir.'],
      ['Videoları biz mi paylaşıyoruz?', 'İsterseniz siz paylaşırsınız, isterseniz paylaşım takvimini de biz yönetiriz.']
    ]
  },
  'urun-fotograf-video-cekimleri': {
    giris: 'E-ticaret, pazaryeri ve reklamlar için ürününüzü doğru renk, ölçü ve detayla gösteren fotoğraf ve videolar çekiyoruz.',
    neden: 'İnternetten alışverişte müşteri ürünü yalnızca görsellerden tanır. Rengi farklı görünen, ölçüsü anlaşılmayan ya da detayı görünmeyen ürünler daha az satar ve daha çok iade edilir. Pazaryerlerinin görsel kurallarına uymayan fotoğraflar ise ürünün yayından kalkmasına neden olabilir.',
    yap: [
      ['Çekim planı', 'Her ürün için gereken açılar, detaylar ve kullanım sahneleri listelenir.'],
      ['Beyaz zemin çekimleri', 'Pazaryeri ve e-ticaret kurallarına uygun, temiz arka planlı fotoğraflar çekilir.'],
      ['Kullanım ve atmosfer çekimleri', 'Ürünün gerçek kullanımını ve ölçeğini gösteren sahneler hazırlanır.'],
      ['Ürün videoları', 'Ürünün her açıdan göründüğü kısa videolar çekilir.'],
      ['Düzenleme ve teslim', 'Renk düzeltmesi yapılır; site, pazaryeri ve reklam için gereken boyutlarda teslim edilir.']
    ],
    olc: ['Ürün sayfası dönüşüm oranı', '“Görseldeki gibi değil” iade nedeni', 'Reklam görsellerinin tıklama oranı', 'Pazaryeri görsel ret sayısı'],
    kim: ['Yeni ürün yükleyen e-ticaret mağazaları', 'Pazaryerinde görsel kalitesi düşük kalan satıcılar', 'Reklam için ürün görseli ihtiyacı olanlar'],
    sss: [
      ['Ürünleri size mi göndermemiz gerekiyor?', 'Çekim, ürün sayısına göre işletmenizde ya da ürünler bize ulaştırılarak yapılabilir.'],
      ['Mankenli çekim yapıyor musunuz?', 'Evet, ihtiyaca göre planlanır; manken ve mekân maliyetleri ayrıca belirlenir.']
    ]
  }
};
