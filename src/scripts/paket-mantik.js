// Üretilen dosya: tools/veri.mjs (kaynak design/Paketler.dc.html). Elle düzenlenmez.
export default function olustur(DCLogic) {

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { koyu: null, filtre: 'tumu', secili: null, adim: 0, cevap: {} };
  }
  katalog() {
    return [
      { id: 'google-ads', tur: 'reklam', turEtiket: 'REKLAM · TEK KANAL', ad: 'Google Ads yönetimi', ozet: 'Google aramalarında, alışverişte ve YouTube’da satışa odaklı reklam.', ucretNotu: 'Aylık · fiyat analizden sonra', kademeler: [
        { ad: 'Başlangıç', kimIcin: 'Tek kampanya türüyle başlayanlar için.', maddeler: ['Hesap denetimi ve kurulum', 'Arama ağı kampanyaları', 'Anahtar ve negatif kelime yönetimi', 'GA4 ve Tag Manager dönüşüm kontrolü', 'Aylık rapor'] },
        { ad: 'Büyüme', rozet: 'Önerilen', kimIcin: 'Satışını ölçerek büyütmek isteyenler için.', maddeler: ['Başlangıç kapsamı', 'Alışveriş ve Performance Max', 'Yeniden pazarlama', 'Haftalık optimizasyon', 'Aylık rapor ve görüşme'] },
        { ad: 'Kurumsal', kimIcin: 'Çoklu ürün, marka veya pazar için.', maddeler: ['Büyüme kapsamı', 'Görüntülü reklam ve YouTube', 'Rakip analizi', 'Çoklu hesap ve ülke yapısı', 'Aylık strateji toplantısı'] } ] },
      { id: 'meta-ads', tur: 'reklam', turEtiket: 'REKLAM · TEK KANAL', ad: 'Meta Ads yönetimi', ozet: 'Facebook ve Instagram reklamlarıyla doğru kitleye ulaşın.', ucretNotu: 'Aylık · fiyat analizden sonra', kademeler: [
        { ad: 'Başlangıç', kimIcin: 'Mesaj, form veya trafik hedefiyle başlayanlar için.', maddeler: ['Business Manager ve piksel kurulumu', 'Hedef kitle yapısı', 'Ayda 4 reklam kreatifi', 'Aylık rapor'] },
        { ad: 'Büyüme', rozet: 'Önerilen', kimIcin: 'Satışa ve yeniden pazarlamaya odaklananlar için.', maddeler: ['Başlangıç kapsamı', 'Dönüşüm API (CAPI) kurulumu', 'Satış hunisi ve yeniden pazarlama', 'Ayda 8 reklam kreatifi ve A/B testi', 'Aylık rapor ve görüşme'] },
        { ad: 'Kurumsal', kimIcin: 'Geniş ürün kataloğu olan markalar için.', maddeler: ['Büyüme kapsamı', 'Katalog ve dinamik reklamlar', 'Advantage+ kampanyaları', 'Ayda 16 reklam kreatifi', 'Aylık strateji toplantısı'] } ] },
      { id: 'birlesik', tur: 'birlesik', turEtiket: 'BİRLEŞİK PAKETLER', ad: 'Birden fazla hizmet, tek plan', ozet: 'Kanallar birlikte çalışır: tek bütçe planı, tek rapor, tek ekip.', ucretNotu: 'Aylık · tek tek almaktan daha avantajlı', birlesik: true, kademeler: [
        { ad: 'Reklam ikilisi', rozet: 'En çok önerilen', kimIcin: 'Google + Meta Ads', maddeler: ['İki kanalın Büyüme kapsamı', 'Tek bütçe planı', 'Kanallar arası sonuç karşılaştırması', 'Tüm kanallar tek panelde (IDOS)'] },
        { ad: 'E-ticaret büyüme seti', kimIcin: 'E-ticaret yönetimi + Google + Meta', maddeler: ['Mağaza yönetimi Büyüme kapsamı', 'Google ve Meta reklamları', 'Ürün ve kampanya takvimi', 'Satış odaklı aylık rapor'] },
        { ad: 'Pazaryeri satış seti', kimIcin: 'Pazaryeri yönetimi + pazaryeri reklamları', maddeler: ['2–3 pazaryerinde yönetim', 'Pazaryeri içi reklam yönetimi', 'Fiyat ve stok takibi', 'Haftalık rapor'] },
        { ad: 'Dijital başlangıç seti', kimIcin: 'Kurumsal web sitesi + Google Ads + sosyal medya', maddeler: ['Kurumsal web sitesi kurulumu', 'Google Ads Başlangıç', 'Sosyal medya Başlangıç', 'İlk 3 ay yakın takip'] } ] },
      { id: 'kurumsal-site', tur: 'web', turEtiket: 'WEB SİTESİ', ad: 'Kurumsal web sitesi', ozet: 'Hızlı, mobil uyumlu ve Google dostu kurumsal site. Kurulum tek seferlik, bakım isteğe bağlı aylık.', ucretNotu: 'Kurulum tek seferlik', kademeler: [
        { ad: 'Tanıtım', kimIcin: 'Küçük işletmeler ve tek hizmet sunanlar için.', maddeler: ['5 sayfaya kadar', 'Mobil uyumlu tasarım', 'İletişim formu ve WhatsApp', 'Temel SEO ayarları', 'İlk yıl alan adı ve barındırma'] },
        { ad: 'Kurumsal', rozet: 'Önerilen', kimIcin: 'Çok hizmetli firmalar için.', maddeler: ['15 sayfaya kadar', 'Blog ve referans bölümü', 'Kendi içerik yönetim paneli', 'GA4 ve Tag Manager kurulumu', 'Teslim sonrası 1 ay destek'] },
        { ad: 'Çok dilli', kimIcin: 'Yurt dışına açılan firmalar için.', maddeler: ['Kurumsal kapsamı', 'İki veya daha fazla dil', 'Dile göre SEO yapısı', 'Özel modüller (bayi, kariyer vb.)', 'Aylık bakım seçeneği'] } ] },
      { id: 'eticaret-site', tur: 'eticaret', turEtiket: 'E-TİCARET · KURULUM', ad: 'E-ticaret sitesi kurulumu (ikas)', ozet: 'ikas altyapısıyla satışa hazır mağaza. Platform lisansı ayrıca ikas’a ödenir.', ucretNotu: 'Kurulum tek seferlik', kademeler: [
        { ad: 'Grow', kimIcin: 'E-ticarete başlangıç paketi.', maddeler: ['Tema kurulumu ve marka uyarlaması', '[X] ürün yükleme', 'Ödeme ve kargo ayarları', 'Temel SEO ayarları'] },
        { ad: 'Scale', rozet: 'En çok tercih edilen', kimIcin: 'Büyüyen mağazalar için.', maddeler: ['Grow kapsamı', '[X] ürün yükleme', 'Banner tasarımları', 'E-posta otomasyonları', 'Pazaryeri entegrasyonu'] },
        { ad: 'Scale Plus', kimIcin: 'E-ticaret büyüme paketi.', maddeler: ['Scale kapsamı', '[X] ürün yükleme', 'Eski siteden SEO taşıma', 'Gelişmiş ölçüm kurulumu'] } ] },
      { id: 'eticaret-yonetim', tur: 'eticaret', turEtiket: 'E-TİCARET · YÖNETİM', ad: 'E-ticaret yönetimi', ozet: 'Mağazanızın günlük işleyişini biz yönetelim, siz işinize odaklanın.', ucretNotu: 'Aylık · fiyat analizden sonra', kademeler: [
        { ad: 'Başlangıç', kimIcin: 'Yeni açılan mağazalar için.', maddeler: ['Ürün ve kategori düzenleme', 'Kampanya takvimi', 'Fiyat ve stok kontrolü', 'Aylık rapor'] },
        { ad: 'Büyüme', rozet: 'Önerilen', kimIcin: 'Satışı artırmak isteyen mağazalar için.', maddeler: ['Başlangıç kapsamı', 'Ürün içerik ve SEO iyileştirme', 'Dönüşüm oranı analizi', 'Haftalık takip ve aylık görüşme'] },
        { ad: 'Kurumsal', kimIcin: 'Geniş katalog ve çoklu kanal için.', maddeler: ['Büyüme kapsamı', 'Entegrasyon ve ERP bağlantıları', 'Kargo ve iade süreç tasarımı', 'Aylık strateji toplantısı'] } ] },
      { id: 'pazaryeri', tur: 'pazaryeri', turEtiket: 'PAZARYERİ', ad: 'Pazaryeri yönetimi', ozet: 'Trendyol, Hepsiburada, Amazon, N11 ve diğer pazaryerlerinde mağaza yönetimi.', ucretNotu: 'Aylık · fiyat analizden sonra', kademeler: [
        { ad: 'Tek pazaryeri', kimIcin: 'Tek pazaryerinde başlayanlar için.', maddeler: ['1 pazaryeri', 'Ürün yükleme ve içerik', 'Soru ve yorumlara günlük yanıt', 'Aylık fiyat analizi', 'Aylık rapor'] },
        { ad: 'Çoklu pazaryeri', rozet: 'Önerilen', kimIcin: 'Satışını yaymak isteyenler için.', maddeler: ['2–3 pazaryeri', 'Kampanya takvimi', 'Pazaryeri reklam yönetimi', 'Haftalık fiyat analizi', 'Haftalık rapor ve aylık görüşme'] },
        { ad: 'Tam yönetim', kimIcin: 'Yüksek hacimli satıcılar için.', maddeler: ['5 ve üzeri pazaryeri', 'Tam reklam yönetimi', 'İade ve satıcı puanı yönetimi', 'Günlük fiyat ve stok takibi', 'Ürün bazında kârlılık raporu'] } ] },
      { id: 'seo', tur: 'seo', turEtiket: 'SEO', ad: 'SEO paketleri', ozet: 'Google ve yapay zekâ aramalarında kalıcı görünürlük.', ucretNotu: 'Aylık · fiyat analizden sonra', kademeler: [
        { ad: 'Başlangıç', kimIcin: 'Sitesinin temelini düzeltmek isteyenler için.', maddeler: ['Teknik SEO denetimi', 'Anahtar kelime analizi', 'Ayda 2 içerik', 'Search Console takibi', 'Aylık rapor'] },
        { ad: 'Büyüme', rozet: 'Önerilen', kimIcin: 'Düzenli içerikle trafik artırmak isteyenler için.', maddeler: ['Başlangıç kapsamı', 'Ayda 4 içerik', 'Yerel SEO', 'Aylık bağlantı (backlink) planı', 'Aylık görüşme'] },
        { ad: 'Otorite', kimIcin: 'Rekabetçi sektörlerde öne çıkmak isteyenler için.', maddeler: ['Büyüme kapsamı', 'Ayda 8 içerik', 'Dijital PR', 'Yapay zekâ aramalarında görünürlük', 'Çok dilli SEO'] } ] },
      { id: 'sosyal-medya', tur: 'icerik', turEtiket: 'İÇERİK', ad: 'Sosyal medya yönetimi', ozet: 'Markanıza uygun, düzenli ve ölçülen içerik.', ucretNotu: 'Aylık · fiyat analizden sonra', kademeler: [
        { ad: 'Başlangıç', kimIcin: 'Düzenli paylaşıma başlamak isteyenler için.', maddeler: ['Ayda 8 gönderi', 'Ayda 8 hikâye', 'Ayda 2 Reels', 'İçerik takvimi', 'Aylık rapor'] },
        { ad: 'Büyüme', rozet: 'Önerilen', kimIcin: 'Etkileşimi ve takipçiyi büyütmek isteyenler için.', maddeler: ['Ayda 12 gönderi', 'Ayda 16 hikâye', 'Ayda 4 Reels', 'Mesaj ve yorum yönetimi', 'Meta reklam desteği'] },
        { ad: 'Profesyonel', kimIcin: 'Profesyonel çekimle marka dili kuranlar için.', maddeler: ['Ayda 20 gönderi', 'Ayda 30 hikâye', 'Ayda 8 Reels', 'Profesyonel çekim günü', 'Influencer iş birliği planı'] } ] }
    ];
  }
  sorular() {
    return [
      { id: 'tur', baslik: 'İşletmeniz nasıl satış yapıyor?', secenekler: [
        { d: 'eticaret', ad: 'Kendi e-ticaret sitemden', aciklama: 'Online mağazam var' },
        { d: 'pazaryeri', ad: 'Pazaryerlerinden', aciklama: 'Trendyol, Hepsiburada, Amazon vb.' },
        { d: 'yerel', ad: 'Hizmet veya yerel işletme', aciklama: 'Müşteri bana arıyor, yazıyor, geliyor' },
        { d: 'yok', ad: 'Henüz dijitalde yokum', aciklama: 'Web sitem veya mağazam yok' } ] },
      { id: 'hedef', baslik: 'Önümüzdeki 3 ayda en önemli hedefiniz ne?', secenekler: [
        { d: 'satis', ad: 'Daha fazla satış', aciklama: 'Ciroyu artırmak' },
        { d: 'talep', ad: 'Daha fazla müşteri talebi', aciklama: 'Arama, form, mesaj' },
        { d: 'bilinirlik', ad: 'Marka bilinirliği', aciklama: 'Daha çok kişi tanısın' },
        { d: 'kurulum', ad: 'Site veya mağaza kurmak', aciklama: 'Dijital altyapıyı oluşturmak' } ] },
      { id: 'kanal', baslik: 'Şu an hangi kanallarda reklam veriyorsunuz?', secenekler: [
        { d: 'hic', ad: 'Hiçbirinde', aciklama: 'Henüz reklam vermiyorum' },
        { d: 'google', ad: 'Sadece Google', aciklama: '' },
        { d: 'meta', ad: 'Sadece Facebook / Instagram', aciklama: '' },
        { d: 'ikisi', ad: 'İkisinde de', aciklama: 'Google ve Meta' } ] },
      { id: 'butce', baslik: 'Aylık reklam bütçeniz ne kadar?', secenekler: [
        { d: 'yok', ad: 'Henüz belirlemedim', aciklama: '' },
        { d: 'dusuk', ad: '15.000 TL altı', aciklama: '' },
        { d: 'orta', ad: '15.000–40.000 TL', aciklama: '' },
        { d: 'yuksek', ad: '40.000 TL üzeri', aciklama: '' } ] }
    ];
  }
  oner(c) {
    const yuksek = c.butce === 'orta' || c.butce === 'yuksek';
    if (c.tur === 'yok' || c.hedef === 'kurulum') {
      if (c.tur === 'eticaret' || c.tur === 'pazaryeri') return { ad: 'E-ticaret sitesi kurulumu · Scale', hedef: 'eticaret-site', neden: 'Satışa hazır bir mağaza ile başlamanız en doğru adım.', maddeler: ['ikas ile mağaza kurulumu', 'Pazaryeri entegrasyonu', 'Sonrasında reklama hazır altyapı'] };
      return { ad: 'Dijital başlangıç seti', hedef: 'birlesik', neden: 'Önce sağlam bir site, ardından ilk müşteriler için reklam ve sosyal medya.', maddeler: ['Kurumsal web sitesi', 'Google Ads Başlangıç', 'Sosyal medya Başlangıç'] };
    }
    if (c.tur === 'pazaryeri') {
      if (yuksek) return { ad: 'Pazaryeri satış seti', hedef: 'birlesik', neden: 'Bütçeniz pazaryeri içi reklamla birlikte büyümeye yetiyor.', maddeler: ['2–3 pazaryerinde yönetim', 'Pazaryeri reklam yönetimi', 'Haftalık rapor'] };
      return { ad: 'Pazaryeri yönetimi · Tek pazaryeri', hedef: 'pazaryeri', neden: 'Önce tek pazaryerinde düzeni kurup sonra genişlemek daha güvenli.', maddeler: ['Ürün yükleme ve içerik', 'Soru ve yorum yönetimi', 'Aylık fiyat analizi'] };
    }
    if (c.hedef === 'bilinirlik') {
      if (yuksek) return { ad: 'Meta Ads yönetimi · Büyüme', hedef: 'meta-ads', neden: 'Bilinirlik için en verimli kanal Facebook ve Instagram.', maddeler: ['Satış hunisi ve yeniden pazarlama', 'Ayda 8 reklam kreatifi', 'Dönüşüm API kurulumu'] };
      return { ad: 'Sosyal medya yönetimi · Büyüme', hedef: 'sosyal-medya', neden: 'Düzenli içerikle önce organik görünürlük kurmak bütçenizi korur.', maddeler: ['Ayda 12 gönderi ve 4 Reels', 'Mesaj ve yorum yönetimi', 'Meta reklam desteği'] };
    }
    if (c.tur === 'eticaret') {
      if (c.butce === 'yuksek') return { ad: 'E-ticaret büyüme seti', hedef: 'birlesik', neden: 'Mağaza, Google ve Meta birlikte yönetilince satış en hızlı büyür.', maddeler: ['E-ticaret yönetimi', 'Google ve Meta reklamları', 'Satış odaklı aylık rapor'] };
      if (yuksek || c.kanal === 'ikisi') return { ad: 'Reklam ikilisi (Google + Meta)', hedef: 'birlesik', neden: 'İki kanalı tek bütçe planıyla yönetmek israfı azaltır.', maddeler: ['İki kanalın Büyüme kapsamı', 'Tek bütçe planı', 'Tek panelde rapor'] };
      return { ad: 'Google Ads yönetimi · Büyüme', hedef: 'google-ads', neden: 'Satın almaya hazır kişilere ulaşmak için en doğrudan kanal.', maddeler: ['Alışveriş ve Performance Max', 'Yeniden pazarlama', 'Haftalık optimizasyon'] };
    }
    if (c.kanal === 'ikisi' && yuksek) return { ad: 'Reklam ikilisi (Google + Meta)', hedef: 'birlesik', neden: 'Zaten iki kanaldasınız; tek planla yönetmek sonuçları netleştirir.', maddeler: ['Tek bütçe planı', 'Kanallar arası karşılaştırma', 'Tek panelde rapor'] };
    if (c.kanal === 'meta') return { ad: 'Meta Ads yönetimi · ' + (yuksek ? 'Büyüme' : 'Başlangıç'), hedef: 'meta-ads', neden: 'Mevcut Meta hesabınızı düzene sokup sonuca odaklayalım.', maddeler: ['Hedef kitle yapısı', 'Piksel ve ölçüm kontrolü', 'Düzenli kreatif yenileme'] };
    return { ad: 'Google Ads yönetimi · ' + (yuksek ? 'Büyüme' : 'Başlangıç'), hedef: 'google-ads', neden: 'Sizi arayan müşteriye en hızlı ulaşan kanal Google arama reklamları.', maddeler: ['Arama ağı kampanyaları', 'Anahtar ve negatif kelime yönetimi', 'Dönüşüm takibi kontrolü'] };
  }
  renderVals() {
    const self = this;
    const koyu = this.state.koyu === null ? (this.props.koyu ?? false) : this.state.koyu;
    const sorular = this.sorular();
    const adim = this.state.adim;
    const cevap = this.state.cevap;
    const bitti = adim >= sorular.length;
    const soruHam = sorular[Math.min(adim, sorular.length - 1)];
    const soru = { baslik: soruHam.baslik, secenekler: soruHam.secenekler.map(function (s) {
      const secili = cevap[soruHam.id] === s.d;
      return { ad: s.ad, aciklama: s.aciklama, secili: secili,
        sec: function () { const yeni = Object.assign({}, cevap); yeni[soruHam.id] = s.d; self.setState({ cevap: yeni, adim: adim + 1 }); },
        stil: 'min-height: 64px; width: 100%; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 14px; font: inherit; font-size: 16px; cursor: pointer; color: var(--head); ' + (secili ? 'border: 2px solid var(--brand); background: var(--tint)' : 'border: 1px solid var(--line); background: var(--card2)') };
    }) };
    const oneri = bitti ? this.oner(cevap) : { ad: '', hedef: '', neden: '', maddeler: [] };
    const katalog = this.katalog();
    const filtreTanim = [ ['tumu', 'Tümü'], ['reklam', 'Reklam'], ['birlesik', 'Birleşik'], ['web', 'Web sitesi'], ['eticaret', 'E-ticaret'], ['pazaryeri', 'Pazaryeri'], ['seo', 'SEO'], ['icerik', 'Sosyal medya'] ];
    const aktif = this.state.filtre;
    const filtreler = filtreTanim.map(function (f) {
      const secili = f[0] === aktif;
      return { ad: f[1], secili: secili, sec: function () { self.setState({ filtre: f[0] }); },
        stil: 'min-height: 44px; padding: 0 16px; border-radius: 999px; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; ' + (secili ? 'border: 1px solid var(--fill); background: var(--fill); color: #FFFFFF' : 'border: 1px solid var(--line); background: var(--card); color: var(--head)') };
    });
    const gorunenGruplar = katalog.filter(function (g) { return aktif === 'tumu' || g.tur === aktif; }).map(function (g) {
      return Object.assign({}, g, {
        kutuStil: 'border-radius: 26px; padding: 32px; display: flex; flex-direction: column; gap: 26px; scroll-margin-top: 90px; ' + (g.birlesik ? 'background: var(--tint); border: 2px solid var(--brand)' : 'background: var(--card); border: 1px solid var(--line); box-shadow: 0 18px 44px var(--shadow)'),
        kademeler: g.kademeler.map(function (k) {
          const one = !!k.rozet;
          const tamAd = g.birlesik ? k.ad : g.ad + ' · ' + k.ad;
          return Object.assign({}, k, { rozet: k.rozet || '',
            sec: function () { self.setState({ secili: tamAd }); },
            kutuStil: 'flex: 1 1 250px; min-width: 0; border-radius: 18px; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; ' + (one ? 'background: var(--card); border: 2px solid var(--brand)' : 'background: ' + (g.birlesik ? 'var(--card)' : 'var(--card2)') + '; border: 1px solid var(--line)'),
            dugmeStil: 'margin-top: auto; min-height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; text-decoration: none; font-weight: 600; ' + (one ? 'background: var(--fill); color: #FFFFFF' : 'border: 1px solid var(--line); background: var(--card); color: var(--head)') });
        }) });
    });
    return {
      temaSinifi: koyu ? 'koyu' : 'acik',
      temaEtiketi: koyu ? 'Açık temaya geç' : 'Koyu temaya geç',
      temaDegistir: () => this.setState({ koyu: !koyu }),
      soruGoster: !bitti,
      sonucGoster: bitti,
      soru: soru,
      geriVar: adim > 0 && !bitti,
      geri: function () { self.setState({ adim: Math.max(0, adim - 1) }); },
      bastan: function () { self.setState({ adim: 0, cevap: {} }); },
      ilerlemeYazi: bitti ? 'Tamamlandı' : ('Soru ' + (adim + 1) + ' / ' + sorular.length),
      ilerlemeYuzde: (bitti ? 100 : Math.round((adim / sorular.length) * 100)) + '%',
      oneri: oneri,
      oneriSec: function () { self.setState({ secili: oneri.ad }); },
      filtreler: filtreler,
      gorunenGruplar: gorunenGruplar,
      seciliPaketAdi: this.state.secili || 'Henüz seçilmedi'
    };
  }
}

return Component;
}
