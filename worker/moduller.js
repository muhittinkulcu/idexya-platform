// Üyelere tek tek açılabilen modüller. Yeni modül buraya eklenir; yönetim paneli listeyi buradan okur.
// hazir: false olan modül atanabilir ama üye tarafında "yakında" görünür.
export const MODULLER = [
  { k: 'uye-icerik', ad: 'Üyelere özel içerikler', aciklama: 'Yalnız üyelere açılan yazılar, rehberler ve dosyalar.', hazir: true },
  { k: 'belgelerim', ad: 'Teklif ve belgelerim', aciklama: 'Size gönderilen teklifler, sözleşmeler ve onay geçmişi.', hazir: false },
  { k: 'destek', ad: 'Destek talepleri', aciklama: 'Ekibimize talep açın, yanıtları tek yerden izleyin.', hazir: false },
  { k: 'egitim', ad: 'Eğitimler', aciklama: 'Reklam, e-ticaret ve ölçüm eğitimleri.', hazir: false },
  { k: 'araclar', ad: 'Araçlar', aciklama: 'İşinizi kolaylaştıran küçük yazılımlar.', hazir: false }
];
// gor: yalnız görüntüler · kullan: görüntüler ve etkileşime geçer (yorum, dosya yükleme, form gönderme)
export const YETKILER = { gor: 'Görüntüle', kullan: 'Görüntüle ve kullan' };
export const UYE_DURUM = { bekliyor: 'Onay bekliyor', onayli: 'Onaylı', reddedildi: 'Reddedildi', askida: 'Askıya alındı' };
