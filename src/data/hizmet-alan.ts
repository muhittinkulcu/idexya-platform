// Hizmet alanlarının "neden önemli" ve "neye dikkat ediyoruz" metinleri: ana sayfa vitrini, Hizmetler sayfası ve hizmet sayfaları ortak kullanır.
export const ALAN: Record<string, { baslik: string; neden: string; dikkat: string[] }> = {
  'e-ticaret': {
    baslik: 'E-ticaret',
    neden: 'Satış yalnızca reklamla gelmez. Stok, fiyat, ürün içeriği, kargo ve iade birbirine bağlı bir zincirdir. Bir halkadaki aksama, örneğin yanlış stok, eksik ürün bilgisi ya da geciken kargo, reklam bütçesini boşa harcatır ve pazaryerlerindeki mağaza puanınızı düşürür.',
    dikkat: ['Mağaza, pazaryerleri ve muhasebe arasında tek merkezden stok ve fiyat', 'Satışa hazır ürün sayfası: doğru görsel, açıklama, varyant ve kategori', 'Hızlı, izlenebilir kargo ve düzenli işleyen iade süreci']
  },
  'dijital-reklam': {
    baslik: 'Dijital reklam',
    neden: 'Doğru ölçülmeyen bir hesapta bütçe, en çok satış getiren reklama değil en kolay tıklanan reklama akar. Satış, form, arama ve mesaj ayrı ayrı ölçüldüğünde kararlar gerçek ticari sonuca göre verilir; bütçe büyütülmeden önce neyin işe yaradığı bilinir.',
    dikkat: ['Her sonuç türünün ayrı ölçülmesi: satış, form, arama ve mesaj karışmaz', 'Kontrollü testler ve kademeli bütçe değişiklikleri', 'Bütçe ve kampanya değişiklikleri onayınız olmadan yapılmaz']
  },
  'seo': {
    baslik: 'SEO ve GEO',
    neden: 'Müşterileriniz artık yalnızca arama sonuçlarına değil, Google’ın yapay zekâ özetlerine ve ChatGPT gibi asistanların cevaplarına da bakıyor. Sitenizin teknik olarak sağlam, içeriğinizin soruya net ve güvenilir cevap veriyor olması hem sıralamanızı hem de yapay zekâ cevaplarında kaynak gösterilmenizi belirler. Reklam durduğunda da ziyaretçi getirmeye devam eden kalıcı bir yatırımdır.',
    dikkat: ['Teknik altyapı: hız, taranabilirlik, doğru yönlendirme ve site haritası', 'Uzman, soruya doğrudan cevap veren ve kaynak gösterilebilir içerik (GEO)', 'Yerel görünürlük: Google İşletme Profili ve harita aramaları']
  },
  'web-yazilim': {
    baslik: 'Web ve yazılım',
    neden: 'Web siteniz çoğu müşterinin sizinle ilk temas noktasıdır. Yavaş açılan, telefonda zor kullanılan ya da formu çalışmayan bir site, reklamla gelen ziyaretçiyi de kaybettirir. Doğru seçilip birbirine bağlanan ERP, CRM ve ön muhasebe yazılımları ise aynı bilgiyi iki kez girmeyi ve buna bağlı hataları ortadan kaldırır.',
    dikkat: ['Hızlı ve önce telefona göre tasarlanmış sayfalar', 'Ölçüm, form ve kişisel veri altyapısının baştan doğru kurulması', 'Yazılımlar arası bağlantı: aynı veri bir kez girilir']
  },
  'tasarim-icerik': {
    baslik: 'Tasarım ve içerik',
    neden: 'İnsanlar bir markaya güvenip güvenmeyeceğine çoğu zaman ilk birkaç saniyede, gördükleriyle karar verir. Tutarlı bir kurumsal kimlik ve ürünü doğru anlatan görseller reklamın etkisini artırır; e-ticarette kararsızlığı ve iadeleri azaltır. Kısa dikey videolar ise Instagram ve YouTube’da keşfedilmenin önemli bir yoludur.',
    dikkat: ['Logo, renk ve yazı kullanımında tutarlılık', 'Ürünü her açıdan, gerçek ölçüleriyle gösteren fotoğraf ve video', 'Her platforma uygun biçim: dikey video, kare gönderi, reklam görseli']
  }
};
