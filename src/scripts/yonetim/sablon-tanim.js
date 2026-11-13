// Belge şablonlarının değişken tanımları (tarayıcı ve Node testleri ortak kullanır; DOM gerektirmez).
// · "Müşteriye belge oluştur" formu bu tanımlardan kurulur: tarih → tarih seçici, tutar → TL alanı, secim → açılır liste,
//   coklu → işaret kutuları, satirlar → küçük tablo. Serbest metin yalnız gerektiği yerde (ERP gibi seçimli giriş).
// · Ajans bilgileri Ayarlar'dan, müşteri bilgileri CRM kartından gelir. Boş değer belgede "—" basılır.
// · "hesap" alanlar (toplam, gecikme günü, yazıyla tutar…) formdan türetilir; elle girilmez.
import { tarihKisa, tlBelge, kurusOku } from './sablon-hesap.js';

export const BELGE_ONEK = { teklif: 'TKL', sozlesme: 'SZL', erisim: 'ERT', odeme_hatirlatma: 'OHT', teslim: 'TTN', fiyat_guncelleme: 'FGB' };

// Ayarlar → belge değişkenleri
export function ajansDegerleri(a = {}) {
  const s = (k) => String(a[k] ?? '').trim();
  return {
    ajans_unvan: s('firma_unvan') || s('firma_ad'), ajans_adres: s('adres'), ajans_vergi: s('vergi'), ajans_mersis: s('mersis'),
    ajans_eposta: s('eposta'), ajans_telefon: s('telefon'), ajans_iban: s('iban'), ajans_yetkili: s('ajans_yetkili'), ajans_yetkili_unvan: s('ajans_yetkili_unvan'),
    ajans_meta_isletme_id: s('meta_isletme_id'), ajans_mcc_id: s('google_ads_mcc'), ajans_google_eposta: s('google_eposta'), sehir: s('sehir')
  };
}
export const altSatir = (a) => [a.ajans_unvan, a.ajans_telefon, a.ajans_eposta, 'idexya.com'].filter(Boolean).join(' · ');

// --- Tutar yazıyla: 12500 TL → "on iki bin beş yüz Türk lirası" ---
const BIR = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const ON = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
function uclu(n) {
  const y = Math.floor(n / 100), o = Math.floor((n % 100) / 10), b = n % 10;
  return [y > 1 ? BIR[y] : '', y ? 'yüz' : '', ON[o], BIR[b]].filter(Boolean).join(' ');
}
export function sayiYaziyla(n) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n) || n < 0) return '';
  if (n === 0) return 'sıfır';
  const ad = ['', 'bin', 'milyon', 'milyar'], parca = [];
  for (let i = 0; n > 0 && i < ad.length; i++, n = Math.floor(n / 1000)) {
    const g = n % 1000;
    if (!g) continue;
    parca.unshift(i === 1 && g === 1 ? 'bin' : [uclu(g), ad[i]].filter(Boolean).join(' '));
  }
  return parca.join(' ');
}
export function tutarYaziyla(kurus) {
  if (kurus === null || kurus === undefined || !Number.isFinite(Number(kurus))) return '';
  const k = Math.round(Number(kurus)), tl = Math.floor(k / 100), kr = k % 100;
  return `${sayiYaziyla(tl)} Türk lirası${kr ? ' ' + sayiYaziyla(kr) + ' kuruş' : ''}`;
}

// Veri asgarisi: müşterinin vergi numarası yalnız şirket VKN'si (10 hane). Şahıs VKN'si TCKN ile aynıdır (11 hane) ve
// IDOS/panel kuralı gereği belgeye ve depoya girmez. Boş bırakılabilir (belgede "—"). Hata metni döner; geçerliyse ''.
export function vknDenetle(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^\d{11}$/.test(s)) return 'TCKN girilemez; yalnız şirket vergi numarası (10 hane)';
  return /^\d{10}$/.test(s) ? '' : 'Vergi numarası yalnız 10 hane rakam olmalı (şirket VKN’si)';
}

// --- Tarih yardımcıları ('YYYY-AA-GG') ---
export const gunEkle = (g, n) => { const d = new Date(g + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const gunFarki = (a, b) => (/^\d{4}-\d{2}-\d{2}$/.test(a) && /^\d{4}-\d{2}-\d{2}$/.test(b) ? Math.round((Date.parse(b) - Date.parse(a)) / 86400000) : null);
const ayBasi = (g) => { const d = new Date(gunEkle(g, 30) + 'T00:00:00Z'); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10); };
const tutarYaz = (v) => { const k = kurusOku(v); return k === null || Number.isNaN(k) ? '' : tlBelge(k); };
const yuzde = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

const EVET_HAYIR = [{ v: 'evet', ad: 'Evet' }, { v: 'hayir', ad: 'Hayır' }];
const HAYIR_EVET = [{ v: 'hayir', ad: 'Hayır' }, { v: 'evet', ad: 'Evet' }];
const secenek = (...l) => l.map((x) => (typeof x === 'string' ? { v: x, ad: x } : x));

// Müşteri kartından dolan alanlar (her belgede)
export const MUSTERI_ALANLARI = [
  { k: 'firma', ad: 'Müşteri unvanı', tur: 'metin', kaynak: 'firma' },
  { k: 'yetkili', ad: 'Müşteri yetkilisi', tur: 'metin', kaynak: 'ad' },
  { k: 'yetkili_eposta', ad: 'Yetkilinin e-postası', tur: 'metin', kaynak: 'eposta' }
];

export const TANIMLAR = {
  erisim: {
    alanlar: [
      { k: 'erisim', ad: 'İstenen erişimler', tur: 'coklu', vars: ['erisim_google_ads', 'erisim_meta', 'erisim_ga4', 'erisim_gtm', 'erisim_gsc'], secenekler: [
        { v: 'erisim_google_ads', ad: 'Google Ads' }, { v: 'erisim_meta', ad: 'Meta (Facebook, Instagram)' }, { v: 'erisim_ga4', ad: 'Google Analytics 4' },
        { v: 'erisim_gtm', ad: 'Google Tag Manager' }, { v: 'erisim_gsc', ad: 'Search Console' }, { v: 'erisim_merchant', ad: 'Merchant Center' },
        { v: 'erisim_hosting', ad: 'Barındırma (hosting)' }, { v: 'erisim_alan_adi', ad: 'Alan adı' }, { v: 'erisim_pazaryeri', ad: 'Pazaryeri satıcı paneli' }] },
      { k: 'baslangic', ad: 'Hizmet başlangıcı', tur: 'tarih', vars: 14 },
      { k: 'son_tarih', ad: 'Erişimler için son tarih', tur: 'tarih', vars: 7 },
      { k: 'ajans_muhatap', ad: 'Teknik sorular için ajans kişisi', tur: 'metin', vars: (b) => [b.ajans.ajans_yetkili, b.ajans.ajans_telefon].filter(Boolean).join(', ') }
    ],
    hesap: (d) => ({
      google_urunu: ['erisim_google_ads', 'erisim_ga4', 'erisim_gtm', 'erisim_gsc', 'erisim_merchant'].some((k) => d[k] === 'evet') ? 'evet' : 'hayir',
      alan_adi_hosting: d.erisim_alan_adi === 'evet' || d.erisim_hosting === 'evet' ? 'evet' : 'hayir'
    })
  },
  odeme_hatirlatma: {
    not: 'Faiz dayanağı, oranı ve asgari giderim tutarı her yıl değişir; göndermeden önce avukatla teyit edin. Bu not PDF’te görünmez.',
    alanlar: [
      { k: 'ton', ad: 'Hatırlatma', tur: 'secim', vars: '1', secenekler: [{ v: '1', ad: '1. hatırlatma (kibar)' }, { v: '2', ad: '2. hatırlatma (kesin)' }] },
      { k: 'faturalar', ad: 'Açık faturalar', tur: 'satirlar', sutunlar: [{ k: 'no', ad: 'Fatura no', tur: 'metin' }, { k: 'tarih', ad: 'Fatura tarihi', tur: 'tarih' }, { k: 'vade', ad: 'Vade', tur: 'tarih' }, { k: 'tutar', ad: 'Tutar (KDV dahil)', tur: 'tutar' }], vars: [{}] },
      { k: 'onceki_hatirlatma_tarihi', ad: '1. hatırlatmanın tarihi', tur: 'tarih', gorunur: 'ton=2' },
      { k: 'son_odeme_tarihi', ad: 'Son ödeme tarihi', tur: 'tarih', vars: 7, gorunur: 'ton=2' },
      { k: 'askiya_alma', ad: 'Hizmet askıya alınacak mı? (sözleşmede hak varsa)', tur: 'secim', secenekler: HAYIR_EVET, gorunur: 'ton=2' },
      { k: 'askiya_alma_tarihi', ad: 'Askıya alma tarihi', tur: 'tarih', vars: 8, gorunur: 'askiya_alma=evet' },
      { k: 'sozlesme_no', ad: 'Sözleşme no', tur: 'metin', gorunur: 'askiya_alma=evet' },
      { k: 'faiz_dayanagi', ad: 'Faiz dayanağı (avukatla teyit edin)', tur: 'metin', vars: '6102 sayılı Türk Ticaret Kanunu m. 1530', gorunur: 'ton=2' },
      { k: 'faiz_orani', ad: 'Faiz oranı (avukatla teyit edin)', tur: 'metin', vars: 'yıllık %43 (TCMB, 2026)', gorunur: 'ton=2' },
      { k: 'asgari_giderim', ad: 'Asgari giderim tutarı (avukatla teyit edin)', tur: 'tutar', vars: '2.020', gorunur: 'ton=2' }
    ],
    hesap: (d, ham, b) => {
      const l = (ham.faturalar || []).filter((r) => r && (r.no || r.tutar));
      const top = l.reduce((t, r) => { const k = kurusOku(r.tutar); return k && !Number.isNaN(k) ? t + k : t; }, 0);
      const vadeler = l.map((r) => r.vade).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)).sort();
      const gec = vadeler.length ? gunFarki(vadeler[0], b.tarih) : null;
      return { toplam_borc: l.length ? tlBelge(top) : '', gecikme_gun: gec !== null && gec > 0 ? String(gec) : '' };
    }
  },
  fiyat_guncelleme: {
    alanlar: [
      { k: 'yururluk_tarihi', ad: 'Yeni fiyatın yürürlük tarihi (fatura dönemi başı)', tur: 'tarih', vars: (b) => ayBasi(b.tarih) },
      { k: 'fiyat_satirlari', ad: 'Hizmetler ve ücretler (aylık, KDV hariç)', tur: 'satirlar', sutunlar: [{ k: 'hizmet', ad: 'Hizmet', tur: 'katalog' }, { k: 'eski', ad: 'Mevcut aylık ücret', tur: 'tutar' }, { k: 'yeni', ad: 'Yeni aylık ücret', tur: 'tutar' }, { k: 'degisim', ad: 'Değişim', tur: 'hesap' }], vars: [{}] },
      { k: 'gerekce', ad: 'Gerekçe', tur: 'secim', vars: 'enflasyon', secenekler: [
        { v: 'enflasyon', ad: 'Enflasyon ve maliyet artışı', metin: 'Son on iki ayda ekibimizin ve kullandığımız yazılımların maliyetleri arttı. Yeni ücret, TÜİK’in açıkladığı yıllık enflasyon oranını aşmamaktadır.' },
        { v: 'kapsam', ad: 'Kapsam genişledi', metin: 'Çalışmamızın kapsamı başlangıçta planlanandan genişledi; yeni ücret bugünkü iş yükünü yansıtmaktadır.' },
        { v: 'ekip', ad: 'Ekip ve araç yatırımı', metin: 'Hesabınızda çalışan ekibi güçlendirdik ve ölçüm ve raporlama araçlarımızı yeniledik; yeni ücret bu yatırımı yansıtmaktadır.' },
        { v: 'diger', ad: 'Diğer (aşağıya yazın)', metin: '' }] },
      { k: 'gerekce_ek', ad: 'Gerekçe metni', tur: 'uzun', gorunur: 'gerekce=diger' },
      { k: 'kapsam_degisikligi', ad: 'Kapsamda değişiklik (yoksa boş bırakın)', tur: 'uzun' },
      { k: 'secenekler', ad: 'Müşteriye sunulan seçenekler (yoksa boş bırakın)', tur: 'uzun' },
      { k: 'sozlesme_maddesi_var', ad: 'Sözleşmede fiyat güncelleme maddesi var mı?', tur: 'secim', secenekler: EVET_HAYIR },
      { k: 'sozlesme_no', ad: 'Sözleşme no', tur: 'metin', gorunur: 'sozlesme_maddesi_var=evet' },
      { k: 'sozlesme_maddesi', ad: 'Sözleşme maddesi', tur: 'metin', vars: '10. maddesi', gorunur: 'sozlesme_maddesi_var=evet' },
      { k: 'yanit_tarihi', ad: 'Görüş için son tarih', tur: 'tarih', vars: 14 }
    ],
    satirHesap: { fiyat_satirlari: (r) => fiyatDegisim(kurusOku(r.eski), kurusOku(r.yeni)) },
    hesap: (d, ham, b) => {
      const l = (ham.fiyat_satirlari || []).filter((r) => r && (r.hizmet || r.eski || r.yeni));
      const top = (k) => l.reduce((t, r) => { const x = kurusOku(r[k]); return x && !Number.isNaN(x) ? t + x : t; }, 0);
      const e = top('eski'), y = top('yeni');
      const sec = (TANIMLAR.fiyat_guncelleme.alanlar.find((a) => a.k === 'gerekce').secenekler.find((s) => s.v === ham.gerekce) || {});
      const fark = gunFarki(b.tarih, ham.yururluk_tarihi);
      return { eski_toplam: l.length ? tlBelge(e) : '', yeni_toplam: l.length ? tlBelge(y) : '', toplam_degisim: l.length ? fiyatDegisim(e, y) : '',
        bildirim_gun: fark !== null && fark >= 0 ? String(fark) : '', gerekce_metni: ham.gerekce === 'diger' ? String(ham.gerekce_ek || '') : sec.metin || '' };
    },
    uyari: (d, ham, b) => { const f = gunFarki(b.tarih, ham.yururluk_tarihi); return f !== null && f < 30 ? `Bildirim ile yürürlük arası ${f} gün; en az 30 gün önerilir (sözleşmede süre yazılıysa o esas alınır).` : ''; }
  },
  teslim: {
    alanlar: [
      { k: 'proje_adi', ad: 'Proje adı', tur: 'metin', vars: 'Kurumsal internet sitesi' },
      { k: 'sozlesme_no', ad: 'Sözleşme no', tur: 'metin' },
      { k: 'teklif_no', ad: 'Teklif no', tur: 'metin' },
      { k: 'site_adresi', ad: 'Yayın adresi', tur: 'metin' },
      { k: 'yayin_tarihi', ad: 'Yayın tarihi', tur: 'tarih', vars: 0 },
      { k: 'altyapi', ad: 'Altyapı', tur: 'secim', vars: 'WordPress', secenekler: secenek('WordPress', 'WooCommerce', 'Shopify', 'Astro', 'Özel yazılım') },
      { k: 'teslim_kalemleri', ad: 'Teslim edilenler', tur: 'satirlar', sutunlar: [{ k: 'kalem', ad: 'Kalem', tur: 'metin' }, { k: 'aciklama', ad: 'Açıklama', tur: 'metin' },
        { k: 'yontem', ad: 'Teslim yöntemi', tur: 'secim', secenekler: secenek('Paylaşım bağlantısı', 'E-posta', 'Depo erişimi', 'Toplantıda') }, { k: 'durum', ad: 'Durum', tur: 'secim', secenekler: secenek('Teslim edildi', 'Bekliyor') }],
        vars: [{ kalem: 'Tasarım dosyaları', yontem: 'Paylaşım bağlantısı', durum: 'Teslim edildi' }, { kalem: 'Kaynak kod', yontem: 'Depo erişimi', durum: 'Teslim edildi' }, { kalem: 'Yönetim paneli eğitimi', yontem: 'Toplantıda', durum: 'Teslim edildi' }] },
      { k: 'hesaplar', ad: 'Hesaplar ve erişim', tur: 'satirlar', sutunlar: [{ k: 'hesap', ad: 'Hesap', tur: 'metin' }, { k: 'kimin', ad: 'Kimin adına kayıtlı', tur: 'metin' }, { k: 'erisim', ad: 'Ajans erişimi sürüyor mu', tur: 'secim', secenekler: secenek('Hayır', 'Evet') }],
        vars: (b) => ['Alan adı', 'Barındırma', 'Site yönetim paneli', 'Google Analytics'].map((h) => ({ hesap: h, kimin: b.musteri.firma || '', erisim: 'Hayır' })) },
      { k: 'testler', ad: 'Yapılan kontroller', tur: 'coklu', vars: ['test_mobil', 'test_form', 'test_ssl', 'test_hiz', 'test_404', 'test_yonlendirme', 'test_yedek'], secenekler: [
        { v: 'test_mobil', ad: 'Mobil uyum' }, { v: 'test_form', ad: 'Form gönderimi' }, { v: 'test_ssl', ad: 'SSL' }, { v: 'test_hiz', ad: 'Hız ölçümü' },
        { v: 'test_404', ad: '404 sayfası' }, { v: 'test_yonlendirme', ad: 'Yönlendirmeler' }, { v: 'test_yedek', ad: 'Yedek' }] },
      { k: 'acik_isler', ad: 'Açık işler', tur: 'satirlar', sutunlar: [{ k: 'is', ad: 'İş', tur: 'metin' }, { k: 'sorumlu', ad: 'Sorumlu', tur: 'secim', secenekler: secenek('Müşteri', 'Ajans') }, { k: 'hedef', ad: 'Hedef tarih', tur: 'tarih' }], vars: [] },
      { k: 'acik_is_engel', ad: 'Açık işler kabule engel mi?', tur: 'secim', secenekler: HAYIR_EVET },
      { k: 'bilesenler', ad: 'Üçüncü taraf bileşenler', tur: 'satirlar', sutunlar: [{ k: 'bilesen', ad: 'Bileşen', tur: 'metin' }, { k: 'lisans', ad: 'Lisans', tur: 'secim', secenekler: secenek('Ücretsiz', 'Yıllık', 'Ömür boyu', 'Açık kaynak') }, { k: 'yenileme', ad: 'Yenileme tarihi', tur: 'tarih' }], vars: [] },
      { k: 'odeme_durumu', ad: 'Ödeme durumu', tur: 'secim', secenekler: [{ v: 'odendi', ad: 'Bedelin tamamı ödendi' }, { v: 'kalan', ad: 'Kalan tutar ödenecek' }] },
      { k: 'kabul_suresi_gun', ad: 'İnceleme süresi (iş günü)', tur: 'sayi', vars: '10' },
      { k: 'garanti_bitis', ad: 'Garanti bitiş tarihi', tur: 'tarih', vars: 90 },
      { k: 'bakim_paketi', ad: 'Bakım', tur: 'secim', vars: 'Yok', secenekler: secenek('Yok', 'Aylık bakım anlaşması var') }
    ],
    hesap: (d, ham) => ({ odeme_durumu_metni: ham.odeme_durumu === 'kalan' ? 'Kalan tutar ödenecek' : 'Bedelin tamamı ödendi' })
  },
  sozlesme: {
    not: 'Bu şablon TASLAK: avukat incelemesinden geçmemiştir. PDF’in her sayfasının üstünde “TASLAK” damgası görünür. Faiz, damga vergisi ve süreleri avukat ve mali müşavirle teyit edin.',
    alanlar: [
      { k: 'ekler', ad: 'Sözleşmeye eklenecekler', tur: 'coklu', vars: ['ek_1a', 'ek_2'], secenekler: [{ v: 'ek_1a', ad: 'Ek-1A Aylık hizmet' }, { v: 'ek_1b', ad: 'Ek-1B Web projesi' }, { v: 'ek_2', ad: 'Ek-2 KVKK veri işleme' }] },
      { k: 'firma_adres', ad: 'Müşteri adresi', tur: 'metin' },
      { k: 'firma_vergi_dairesi', ad: 'Müşteri vergi dairesi', tur: 'metin' },
      { k: 'firma_vkn', ad: 'Müşteri vergi numarası (yalnız şirket, 10 hane; TCKN girilemez)', tur: 'vkn' },
      { k: 'yetkili_unvan', ad: 'Müşteri yetkilisinin unvanı', tur: 'secim', vars: 'Genel Müdür', secenekler: secenek('Genel Müdür', 'Şirket Ortağı', 'Pazarlama Müdürü', 'Yönetim Kurulu Üyesi', 'Kurucu') },
      { k: 'musteri_tacir', ad: 'Müşteri tacir mi? (şirket ise evet)', tur: 'secim', secenekler: EVET_HAYIR },
      { k: 'baslangic', ad: 'Yürürlük ve başlangıç tarihi', tur: 'tarih', vars: (b) => ayBasi(b.tarih) },
      { k: 'aylik_tutar', ad: 'Aylık ajans ücreti (KDV hariç)', tur: 'tutar', gorunur: 'ek_1a=evet' },
      { k: 'asgari_sure_ay', ad: 'Asgari süre (ay)', tur: 'sayi', vars: '6', gorunur: 'ek_1a=evet' },
      { k: 'ihbar_suresi_gun', ad: 'Fesih ihbar süresi (gün)', tur: 'sayi', vars: '30' },
      { k: 'butce_odeme', ad: 'Reklam bütçesini kim öder?', tur: 'secim', secenekler: [{ v: 'musteri', ad: 'Müşteri kendi kartıyla (önerilen)' }, { v: 'ajans', ad: 'Ajans aracılık eder (önceden ödeme)' }] },
      { k: 'reklam_butcesi', ad: 'Onaylı aylık reklam bütçesi', tur: 'tutar' },
      { k: 'iade_suresi_gun', ad: 'Kullanılmayan bütçe iade süresi (gün)', tur: 'sayi', vars: '15', gorunur: 'butce_odeme=ajans' },
      { k: 'fatura_gunu', ad: 'Aylık fatura günü', tur: 'sayi', vars: '1', gorunur: 'ek_1a=evet' },
      { k: 'vade', ad: 'Fatura vadesi (gün)', tur: 'sayi', vars: '7' },
      { k: 'gecikme_faizi', ad: 'Gecikme faizi ifadesi (avukatla teyit edin)', tur: 'metin', vars: '6102 sayılı Türk Ticaret Kanunu m. 1530 uyarınca Türkiye Cumhuriyet Merkez Bankasınca ilan edilen oranda' },
      { k: 'askiya_alma_gun', ad: 'Askıya alma için gecikme (gün)', tur: 'sayi', vars: '15' },
      { k: 'fiyat_guncelleme_sikligi', ad: 'Fiyat güncelleme sıklığı', tur: 'secim', secenekler: secenek('yılda', 'altı ayda') },
      { k: 'fiyat_bildirim_gun', ad: 'Fiyat güncellemesi bildirim süresi (gün)', tur: 'sayi', vars: '30' },
      { k: 'onay_suresi_gun', ad: 'İçerik onay süresi (iş günü)', tur: 'sayi', vars: '2' },
      { k: 'revizyon_hakki', ad: 'Ücretsiz düzeltme turu', tur: 'sayi', vars: '2' },
      { k: 'hak_devri', ad: 'Fikrî haklar', tur: 'secim', secenekler: [{ v: 'devir', ad: 'Devir (bedel ödenince)' }, { v: 'lisans', ad: 'Kullanma yetkisi (lisans)' }] },
      { k: 'gizlilik_suresi_yil', ad: 'Sözleşme sonrası gizlilik (yıl)', tur: 'sayi', vars: '2' },
      { k: 'sorumluluk_ay', ad: 'Sorumluluk sınırı (son kaç ay ücret)', tur: 'sayi', vars: '3' },
      { k: 'nusha', ad: 'Nüsha', tur: 'secim', secenekler: secenek('bir asıl ve bir onaylı suret', 'iki asıl') },
      { k: 'hizmetler', ad: 'Ek-1A hizmetleri', tur: 'coklu', vars: ['h_google', 'h_meta'], gorunur: 'ek_1a=evet', secenekler: [
        { v: 'h_google', ad: 'Google Ads' }, { v: 'h_meta', ad: 'Meta reklam' }, { v: 'h_sosyal', ad: 'Sosyal medya içerik' }, { v: 'h_seo', ad: 'SEO' }, { v: 'h_pazaryeri', ad: 'Pazaryeri' }] },
      { k: 'gonderi_sayisi', ad: 'Aylık gönderi', tur: 'sayi', vars: '12', gorunur: 'h_sosyal=evet' },
      { k: 'hikaye_sayisi', ad: 'Aylık hikâye', tur: 'sayi', vars: '8', gorunur: 'h_sosyal=evet' },
      { k: 'icerik_sayisi', ad: 'Aylık SEO içeriği', tur: 'sayi', vars: '2', gorunur: 'h_seo=evet' },
      { k: 'hedefler', ad: 'Hedefler (taahhüt değildir)', tur: 'metin', gorunur: 'ek_1a=evet' },
      { k: 'toplanti_sikligi', ad: 'Toplantı sıklığı', tur: 'secim', secenekler: secenek('aylık', 'iki haftada bir', 'haftalık'), gorunur: 'ek_1a=evet' },
      { k: 'proje_adi', ad: 'Proje adı', tur: 'metin', vars: 'Kurumsal internet sitesi', gorunur: 'ek_1b=evet' },
      { k: 'proje_kapsami', ad: 'Proje kapsamı (sayfalar, modüller, entegrasyonlar)', tur: 'uzun', gorunur: 'ek_1b=evet' },
      { k: 'proje_tutar', ad: 'Proje bedeli (KDV hariç)', tur: 'tutar', gorunur: 'ek_1b=evet' },
      { k: 'odeme_plani', ad: 'Ödeme planı', tur: 'satirlar', gorunur: 'ek_1b=evet', sutunlar: [{ k: 'asama', ad: 'Aşama', tur: 'metin' }, { k: 'oran', ad: 'Oran (%)', tur: 'sayi' }, { k: 'tutar', ad: 'Tutar', tur: 'hesap' }],
        vars: [{ asama: 'Sözleşme imzası', oran: '40' }, { asama: 'Tasarım onayı', oran: '40' }, { asama: 'Teslim', oran: '20' }] },
      { k: 'proje_teslim_tarihi', ad: 'Tahmini teslim tarihi', tur: 'tarih', vars: 60, gorunur: 'ek_1b=evet' },
      { k: 'kabul_suresi_gun', ad: 'Kabul için inceleme süresi (iş günü)', tur: 'sayi', vars: '10', gorunur: 'ek_1b=evet' },
      { k: 'garanti_suresi', ad: 'Garanti süresi', tur: 'secim', secenekler: secenek('3 ay', '6 ay', '12 ay'), gorunur: 'ek_1b=evet' },
      { k: 'hosting_sorumlusu', ad: 'Barındırma sorumlusu', tur: 'secim', secenekler: secenek('Müşteri', 'Ajans (ayrı ücretle)'), gorunur: 'ek_1b=evet' },
      { k: 'cms', ad: 'Altyapı', tur: 'secim', secenekler: secenek('WordPress', 'WooCommerce', 'Shopify', 'Astro', 'Özel yazılım'), gorunur: 'ek_1b=evet' },
      { k: 'ucuncu_taraf_bilesenler', ad: 'Üçüncü taraf bileşenler ve lisansları', tur: 'uzun', gorunur: 'ek_1b=evet' }
    ],
    satirHesap: { odeme_plani: (r, ham) => { const t = kurusOku(ham.proje_tutar), o = Number(String(r.oran || '').replace(',', '.')); return t && !Number.isNaN(t) && o > 0 ? tlBelge(Math.round(t * o / 100)) : ''; } },
    satirBicim: { odeme_plani: { oran: (v) => (v ? '%' + v : '') } },
    hesap: (d, ham) => ({
      aylik_tutar_yazi: tutarYaziyla(kurusOku(ham.aylik_tutar) || null), proje_tutar_yazi: tutarYaziyla(kurusOku(ham.proje_tutar) || null),
      ek_sayisi: String(['ek_1a', 'ek_1b', 'ek_2'].filter((k) => d[k] === 'evet').length)
    }),
    uyari: (d, ham) => {
      const l = (ham.odeme_plani || []).filter((r) => r && r.oran);
      const t = l.reduce((a, r) => a + Number(String(r.oran).replace(',', '.')), 0);
      return d.ek_1b === 'evet' && l.length && Math.abs(t - 100) > 0.01 ? `Ödeme planındaki oranların toplamı %${yuzde(t)}; %100 olmalı.` : '';
    }
  }
};

export function fiyatDegisim(e, y) {
  if (!e || !y || Number.isNaN(e) || Number.isNaN(y)) return '';
  const p = Math.round(((y - e) / e) * 1000) / 10;
  return p === 0 ? 'Değişmedi' : p > 0 ? `%${yuzde(p)} artış` : `%${yuzde(-p)} indirim`;
}

// Alanın varsayılanı: sayı → bugünden gün farkı (tarih), işlev → bağlamdan
export function varsayilan(a, b) {
  const v = typeof a.vars === 'function' ? a.vars(b) : a.vars;
  if (a.tur === 'tarih' && typeof v === 'number') return gunEkle(b.tarih, v);
  if (a.tur === 'coklu') return Array.isArray(v) ? [...v] : [];
  if (a.tur === 'satirlar') return Array.isArray(v) ? v.map((x) => ({ ...x })) : [];
  if (a.tur === 'secim' && v === undefined) return a.secenekler[0].v;
  return v ?? '';
}

// Ham form değerleri → belge değişkenleri. b: { tarih, belgeNo, musteri, ajans }
export function degerleriHazirla(tur, ham, b) {
  const t = TANIMLAR[tur] || { alanlar: [] };
  const d = { ...b.ajans, tarih: tarihKisa(b.tarih), belge_no: b.belgeNo || '' };
  for (const a of MUSTERI_ALANLARI) d[a.k] = String(ham[a.k] ?? '');
  d.firma_kisa = d.firma;
  for (const a of t.alanlar) {
    const v = ham[a.k];
    if (a.tur === 'tarih') d[a.k] = v ? tarihKisa(v) : '';
    else if (a.tur === 'vkn') d[a.k] = vknDenetle(v) ? '' : String(v ?? '').trim();
    else if (a.tur === 'tutar') d[a.k] = tutarYaz(v);
    else if (a.tur === 'coklu') {
      const l = Array.isArray(v) ? v : [];
      for (const s of a.secenekler) d[s.v] = l.includes(s.v) ? 'evet' : 'hayir';
      d[a.k] = a.secenekler.filter((s) => l.includes(s.v)).map((s) => s.ad).join(', ');
    } else if (a.tur === 'satirlar') {
      const hesapF = (t.satirHesap || {})[a.k], bicim = (t.satirBicim || {})[a.k] || {};
      d[a.k] = (Array.isArray(v) ? v : []).filter((r) => r && a.sutunlar.some((s) => s.tur !== 'hesap' && String(r[s.k] ?? '').trim()))
        .map((r) => a.sutunlar.map((s) => (s.tur === 'hesap' ? (hesapF ? hesapF(r, ham) : '') : s.tur === 'tarih' ? (r[s.k] ? tarihKisa(r[s.k]) : '') : s.tur === 'tutar' ? tutarYaz(r[s.k]) : bicim[s.k] ? bicim[s.k](r[s.k]) : String(r[s.k] ?? ''))));
    } else d[a.k] = String(v ?? '');
  }
  if (t.hesap) Object.assign(d, t.hesap(d, ham, b));
  return d;
}
