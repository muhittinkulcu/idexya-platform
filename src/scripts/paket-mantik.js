import PAKETLER from '../data/paketler.json';
// Üretilen dosya: tools/veri.mjs (kaynak design/Paketler.dc.html). Elle düzenlenmez.
export default function olustur(DCLogic) {

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { koyu: null, filtre: 'tumu', secili: null, adim: 0, cevap: {} };
  }
  katalog() {
    return PAKETLER;
  }
  sorular() {
    return [
      { id: 'tur', baslik: 'İşletmeniz nasıl satış yapıyor?', secenekler: [
        { d: 'eticaret', ad: 'Kendi e-ticaret sitemden', aciklama: 'Online mağazam var' },
        { d: 'pazaryeri', ad: 'Pazaryerlerinden', aciklama: 'Trendyol, Hepsiburada, Amazon vb.' },
        { d: 'yerel', ad: 'Hizmet veya yerel işletme', aciklama: 'Müşteri beni arıyor, bana yazıyor, bana geliyor' },
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
