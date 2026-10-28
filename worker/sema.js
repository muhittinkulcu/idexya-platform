// Veritabanı şeması. İlk istekte kendiliğinden kurulur (CREATE ... IF NOT EXISTS), tekrar çalıştırmak zararsızdır.
export const SEMA = [
  `CREATE TABLE IF NOT EXISTS talepler (
    id TEXT PRIMARY KEY, olusturma TEXT NOT NULL, kaynak TEXT NOT NULL, sayfa TEXT,
    ad TEXT, firma TEXT, eposta TEXT, telefon TEXT, konu TEXT, mesaj TEXT, ek TEXT,
    iys_izni INTEGER NOT NULL DEFAULT 0, ip_ozet TEXT, dogrulama TEXT NOT NULL,
    durum TEXT NOT NULL DEFAULT 'yeni', musteri_id TEXT)`,
  `CREATE INDEX IF NOT EXISTS talep_durum ON talepler (durum, olusturma)`,
  `CREATE INDEX IF NOT EXISTS talep_ip ON talepler (ip_ozet, olusturma)`,
  `CREATE TABLE IF NOT EXISTS musteriler (
    id TEXT PRIMARY KEY, olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL,
    firma TEXT, ad TEXT, eposta TEXT, telefon TEXT, sektor TEXT, kaynak TEXT,
    asama TEXT NOT NULL DEFAULT 'yeni', deger INTEGER, paket TEXT, sorumlu TEXT)`,
  `CREATE INDEX IF NOT EXISTS musteri_eposta ON musteriler (eposta)`,
  `CREATE INDEX IF NOT EXISTS musteri_telefon ON musteriler (telefon)`,
  `CREATE TABLE IF NOT EXISTS kayitlar (
    id TEXT PRIMARY KEY, musteri_id TEXT NOT NULL, zaman TEXT NOT NULL,
    tur TEXT NOT NULL, baslik TEXT NOT NULL, detay TEXT, kim TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS kayit_musteri ON kayitlar (musteri_id, zaman)`,
  `CREATE TABLE IF NOT EXISTS islem_kaydi (
    id TEXT PRIMARY KEY, zaman TEXT NOT NULL, kim TEXT NOT NULL, islem TEXT NOT NULL, hedef TEXT, detay TEXT)`,
  `CREATE TABLE IF NOT EXISTS uyeler (
    id TEXT PRIMARY KEY, olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL,
    ad TEXT NOT NULL, eposta TEXT NOT NULL UNIQUE, telefon TEXT, firma TEXT, neden TEXT,
    sifre_ozet TEXT NOT NULL, sifre_tuz TEXT NOT NULL, sifre_tur TEXT NOT NULL,
    durum TEXT NOT NULL DEFAULT 'bekliyor', karar_zamani TEXT, karar_veren TEXT, yonetici_notu TEXT,
    kvkk_zamani TEXT NOT NULL, iys_izni INTEGER NOT NULL DEFAULT 0, son_giris TEXT)`,
  `CREATE INDEX IF NOT EXISTS uye_durum ON uyeler (durum, olusturma)`,
  `CREATE TABLE IF NOT EXISTS uye_moduller (
    uye_id TEXT NOT NULL, modul TEXT NOT NULL, yetki TEXT NOT NULL, verildi TEXT NOT NULL, veren TEXT NOT NULL,
    PRIMARY KEY (uye_id, modul))`,
  `CREATE TABLE IF NOT EXISTS gruplar (id TEXT PRIMARY KEY, ad TEXT NOT NULL UNIQUE, aciklama TEXT, olusturma TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS uye_gruplar (uye_id TEXT NOT NULL, grup_id TEXT NOT NULL, PRIMARY KEY (uye_id, grup_id))`,
  `CREATE TABLE IF NOT EXISTS oturumlar (
    ozet TEXT PRIMARY KEY, uye_id TEXT NOT NULL, olusturma TEXT NOT NULL, bitis TEXT NOT NULL, son_kullanim TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS oturum_uye ON oturumlar (uye_id)`,
  `CREATE TABLE IF NOT EXISTS giris_denemeleri (id TEXT PRIMARY KEY, zaman TEXT NOT NULL, eposta TEXT, ip_ozet TEXT NOT NULL, basarili INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS giris_eposta ON giris_denemeleri (eposta, zaman)`,
  `CREATE INDEX IF NOT EXISTS giris_ip ON giris_denemeleri (ip_ozet, zaman)`,
  `CREATE TABLE IF NOT EXISTS sifre_yenileme (ozet TEXT PRIMARY KEY, uye_id TEXT NOT NULL, olusturma TEXT NOT NULL, bitis TEXT NOT NULL, kullanildi TEXT, olusturan TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS icerikler (
    id TEXT PRIMARY KEY, olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL, yazar TEXT NOT NULL,
    baslik TEXT NOT NULL, kisa_ad TEXT NOT NULL UNIQUE, ozet TEXT, govde TEXT, kategori TEXT,
    gorunurluk TEXT NOT NULL DEFAULT 'gizli', etkilesim TEXT NOT NULL DEFAULT 'kimse', arama INTEGER NOT NULL DEFAULT 0,
    arsiv INTEGER NOT NULL DEFAULT 0, yayin_zamani TEXT)`,
  `CREATE INDEX IF NOT EXISTS icerik_yayin ON icerikler (arsiv, gorunurluk, yayin_zamani)`,
  `CREATE TABLE IF NOT EXISTS icerik_erisim (icerik_id TEXT NOT NULL, tur TEXT NOT NULL, hedef_id TEXT NOT NULL, PRIMARY KEY (icerik_id, tur, hedef_id))`,
  `CREATE TABLE IF NOT EXISTS yorumlar (
    id TEXT PRIMARY KEY, icerik_id TEXT NOT NULL, zaman TEXT NOT NULL, uye_id TEXT, ad TEXT NOT NULL, eposta TEXT,
    metin TEXT NOT NULL, durum TEXT NOT NULL DEFAULT 'bekliyor', ip_ozet TEXT, karar_veren TEXT, karar_zamani TEXT)`,
  `CREATE INDEX IF NOT EXISTS yorum_icerik ON yorumlar (icerik_id, durum, zaman)`,
  `CREATE TABLE IF NOT EXISTS asistan_mesajlari (id TEXT PRIMARY KEY, sohbet_id TEXT NOT NULL, zaman TEXT NOT NULL, rol TEXT NOT NULL, metin TEXT NOT NULL, ek TEXT, ip_ozet TEXT, sayfa TEXT)`,
  `CREATE INDEX IF NOT EXISTS asistan_sohbet ON asistan_mesajlari (sohbet_id, zaman)`,
  `CREATE INDEX IF NOT EXISTS asistan_ip ON asistan_mesajlari (ip_ozet, zaman)`,
  // Asistan: sohbet öncesi KVKK onayı ve ziyaretçinin kendi e-postasına istediği yazışma dökümleri (Muhittin, 28 Eki 2026)
  `CREATE TABLE IF NOT EXISTS asistan_onay (sohbet_id TEXT PRIMARY KEY, zaman TEXT NOT NULL, ip_ozet TEXT, sayfa TEXT)`,
  `CREATE TABLE IF NOT EXISTS asistan_dokum (id TEXT PRIMARY KEY, sohbet_id TEXT NOT NULL, zaman TEXT NOT NULL, ip_ozet TEXT, sonuc TEXT)`,
  `CREATE INDEX IF NOT EXISTS asistan_dokum_ip ON asistan_dokum (ip_ozet, zaman)`,
  // IDOS reklam özeti: IDOS BigQuery görünümünden günde bir kez okunur (worker/reklam.js); IDP'de yalnız okunur.
  `CREATE TABLE IF NOT EXISTS reklam_ozet (
    gun TEXT NOT NULL, platform TEXT NOT NULL, hesap TEXT NOT NULL, para TEXT NOT NULL, musteri_id TEXT, marka TEXT,
    harcama REAL NOT NULL DEFAULT 0, gosterim INTEGER, tiklama INTEGER, sonuclar TEXT,
    PRIMARY KEY (gun, platform, hesap, para))`,
  `CREATE TABLE IF NOT EXISTS reklam_cekim (
    id TEXT PRIMARY KEY, zaman TEXT NOT NULL, durum TEXT NOT NULL, satir INTEGER, baslangic TEXT, mesaj TEXT, tetikleyen TEXT NOT NULL)`,
  // Bülten ilgi listesi (worker/bulten.js): e-posta, ticari ileti onay kaydı ve abonelikten çıkma anahtarı.
  `CREATE TABLE IF NOT EXISTS bulten (
    id TEXT PRIMARY KEY, eposta TEXT NOT NULL UNIQUE, durum TEXT NOT NULL DEFAULT 'aktif', onay_zamani TEXT NOT NULL, onay_surum TEXT NOT NULL,
    sayfa TEXT, ip_ozet TEXT, dogrulama TEXT NOT NULL, ayrilma_anahtari TEXT NOT NULL UNIQUE, ayrilma_zamani TEXT)`,
  `CREATE INDEX IF NOT EXISTS bulten_ip ON bulten (ip_ozet, onay_zamani)`,
  // Sitede gösterilen Instagram gönderileri (worker/instagram.js): yöneticinin seçtiği bağlantı, açıklama ve küçültülmüş görsel.
  `CREATE TABLE IF NOT EXISTS instagram (
    id TEXT PRIMARY KEY, baglanti TEXT NOT NULL, aciklama TEXT, gorsel TEXT NOT NULL, sira INTEGER NOT NULL DEFAULT 0,
    gorunur INTEGER NOT NULL DEFAULT 1, olusturma TEXT NOT NULL, ekleyen TEXT NOT NULL)`,
  // Panel ayarları ve medya kütüphanesi (worker/sistem.js)
  `CREATE TABLE IF NOT EXISTS ayarlar (anahtar TEXT PRIMARY KEY, deger TEXT, guncelleme TEXT NOT NULL, guncelleyen TEXT NOT NULL)`,
  // Instagram otomatik akışı (worker/instagram.js): son gönderiler ve görsel kopyaları
  `CREATE TABLE IF NOT EXISTS instagram_akis (
    id TEXT PRIMARY KEY, permalink TEXT NOT NULL, aciklama TEXT, tur TEXT NOT NULL, zaman TEXT, gorsel_tur TEXT NOT NULL, gorsel TEXT NOT NULL, sira INTEGER NOT NULL, cekim TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS medya (
    id TEXT PRIMARY KEY, ad TEXT NOT NULL, alt TEXT, tur TEXT NOT NULL, boyut INTEGER NOT NULL, genislik INTEGER, yukseklik INTEGER,
    veri TEXT NOT NULL, olusturma TEXT NOT NULL, ekleyen TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS islem_zaman ON islem_kaydi (zaman)`,
  // Teklifler (worker/teklif.js): kalemler JSON, tutarlar sunucuda hesaplanır (TL, 2 ondalık). Numara yıl başına sayaçtan.
  `CREATE TABLE IF NOT EXISTS teklifler (
    id TEXT PRIMARY KEY, no TEXT NOT NULL UNIQUE, musteri_id TEXT NOT NULL, baslik TEXT NOT NULL, kalemler TEXT NOT NULL,
    kdv_orani REAL NOT NULL DEFAULT 20, indirim REAL NOT NULL DEFAULT 0, para TEXT NOT NULL DEFAULT 'TRY', gecerlilik TEXT, notlar TEXT,
    durum TEXT NOT NULL DEFAULT 'taslak', ara_toplam REAL NOT NULL DEFAULT 0, kdv REAL NOT NULL DEFAULT 0, toplam REAL NOT NULL DEFAULT 0,
    olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL, gonderim_zamani TEXT, karar_zamani TEXT, olusturan TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS teklif_musteri ON teklifler (musteri_id, olusturma)`,
  `CREATE INDEX IF NOT EXISTS teklif_durum ON teklifler (durum, guncelleme)`,
  `CREATE TABLE IF NOT EXISTS teklif_sayac (yil INTEGER PRIMARY KEY, son INTEGER NOT NULL)`,
  // IDOS eşitleme (worker/crm.js): IDOS reklam hesabı (platform + hesap) ↔ IDP CRM müşterisi. Yönetici elle eşleştirir.
  `CREATE TABLE IF NOT EXISTS reklam_eslesme (
    platform TEXT NOT NULL, hesap TEXT NOT NULL, musteri_id TEXT NOT NULL, eslestiren TEXT NOT NULL, zaman TEXT NOT NULL,
    PRIMARY KEY (platform, hesap))`,
  `CREATE INDEX IF NOT EXISTS reklam_eslesme_musteri ON reklam_eslesme (musteri_id)`,
  // Çakışmalar (worker/crm.js): "Bunlar farklı" denen müşteri çiftleri (a < b) bir daha önerilmez.
  `CREATE TABLE IF NOT EXISTS cakisma_ayri (a TEXT NOT NULL, b TEXT NOT NULL, isaretleyen TEXT NOT NULL, zaman TEXT NOT NULL, PRIMARY KEY (a, b))`,
  // Müşteri alanı (worker/portal.js): üye ↔ CRM müşterisi bağlantısı ve davetle üyelik. Davet jetonunun yalnız özeti saklanır.
  `CREATE TABLE IF NOT EXISTS uye_musteri (uye_id TEXT PRIMARY KEY, musteri_id TEXT NOT NULL, baglayan TEXT NOT NULL, zaman TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS uye_musteri_musteri ON uye_musteri (musteri_id)`,
  `CREATE TABLE IF NOT EXISTS davetler (
    ozet TEXT PRIMARY KEY, id TEXT NOT NULL UNIQUE, eposta TEXT NOT NULL, musteri_id TEXT, moduller TEXT NOT NULL DEFAULT '{}',
    olusturma TEXT NOT NULL, bitis TEXT NOT NULL, olusturan TEXT NOT NULL, kullanildi TEXT, uye_id TEXT, iptal TEXT, iptal_eden TEXT)`,
  // Site denetimi çalıştırmaları (worker/denetim.js): özet ve sayfa sonuçları JSON; son 20 çalıştırma saklanır.
  `CREATE TABLE IF NOT EXISTS denetimler (id TEXT PRIMARY KEY, zaman TEXT NOT NULL, tetikleyen TEXT NOT NULL, ozet TEXT NOT NULL, sonuc TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS denetim_zaman ON denetimler (zaman)`,
  // Çerezsiz ziyaret sayacı (worker/olcum.js): yalnız günlük toplamlar; IP, tarayıcı bilgisi ya da kimlik tutulmaz.
  `CREATE TABLE IF NOT EXISTS ziyaret_gunluk (gun TEXT NOT NULL, sayfa TEXT NOT NULL, kaynak TEXT NOT NULL, cihaz TEXT NOT NULL, adet INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (gun, sayfa, kaynak, cihaz))`,
  // Gerçek kullanıcı hız örnekleri (LCP ms, INP ms, CLS): sayfa başına günde en çok 500 örnek.
  `CREATE TABLE IF NOT EXISTS hiz_olcum (gun TEXT NOT NULL, sayfa TEXT NOT NULL, cihaz TEXT NOT NULL, lcp REAL, inp REAL, cls REAL)`,
  `CREATE INDEX IF NOT EXISTS hiz_gun_sayfa ON hiz_olcum (gun, sayfa)`,
  // Görevler ve takvim (worker/gorev.js): tarih İstanbul takvim günü (YYYY-AA-GG), saat isteğe bağlı (SS:DD).
  `CREATE TABLE IF NOT EXISTS gorevler (
    id TEXT PRIMARY KEY, baslik TEXT NOT NULL, aciklama TEXT, tarih TEXT NOT NULL, saat TEXT, musteri_id TEXT,
    atanan TEXT NOT NULL, oncelik TEXT NOT NULL DEFAULT 'normal', durum TEXT NOT NULL DEFAULT 'acik',
    olusturma TEXT NOT NULL, tamamlanma TEXT, olusturan TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS gorev_tarih ON gorevler (durum, tarih)`,
  // Belgeler (worker/belge.js): dosya bulunduğu yerde kalır (ör. Google Drive); yalnız bağlantı ve bilgileri saklanır.
  `CREATE TABLE IF NOT EXISTS belgeler (
    id TEXT PRIMARY KEY, ad TEXT NOT NULL, tur TEXT NOT NULL, musteri_id TEXT, baglanti TEXT NOT NULL, tarih TEXT NOT NULL,
    aciklama TEXT, olusturma TEXT NOT NULL, ekleyen TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS belge_tarih ON belgeler (tarih)`,
  // Basit gelir-gider defteri (worker/muhasebe.js); resmî muhasebe değildir. tutar: KDV dâhil, kuruş cinsinden tam sayı.
  `CREATE TABLE IF NOT EXISTS muhasebe (
    id TEXT PRIMARY KEY, tur TEXT NOT NULL, tarih TEXT NOT NULL, tutar INTEGER NOT NULL, kdv_orani INTEGER NOT NULL DEFAULT 0,
    aciklama TEXT NOT NULL, kategori TEXT, musteri_id TEXT, belge_no TEXT, durum TEXT NOT NULL DEFAULT 'bekliyor',
    vade TEXT, odeme_tarihi TEXT, olusturma TEXT NOT NULL, ekleyen TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS muhasebe_tarih ON muhasebe (tarih)`,
  `CREATE INDEX IF NOT EXISTS muhasebe_vade ON muhasebe (durum, vade)`,
  // Müşteri alanı (worker/musteri-alani.js): yöneticinin üyeyle paylaştığı belgeler ve üyelerin destek talepleri.
  `CREATE TABLE IF NOT EXISTS belge_paylasim (belge_id TEXT PRIMARY KEY, paylasan TEXT NOT NULL, zaman TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS destek_talepleri (
    id TEXT PRIMARY KEY, no TEXT NOT NULL UNIQUE, uye_id TEXT NOT NULL, musteri_id TEXT, konu TEXT NOT NULL, durum TEXT NOT NULL DEFAULT 'acik',
    olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL, son_yazan TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS destek_uye ON destek_talepleri (uye_id, guncelleme)`,
  `CREATE INDEX IF NOT EXISTS destek_durum ON destek_talepleri (durum, guncelleme)`,
  `CREATE TABLE IF NOT EXISTS destek_mesajlari (id TEXT PRIMARY KEY, talep_id TEXT NOT NULL, yazan TEXT NOT NULL, yazan_id TEXT NOT NULL, ad TEXT, metin TEXT NOT NULL, zaman TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS destek_mesaj_talep ON destek_mesajlari (talep_id, zaman)`,
  `CREATE INDEX IF NOT EXISTS destek_mesaj_yazan ON destek_mesajlari (yazan_id, zaman)`,
  `CREATE TABLE IF NOT EXISTS destek_sayac (k INTEGER PRIMARY KEY, son INTEGER NOT NULL)`,
  // Hesap envanteri (worker/envanter.js): müşteri hesapları ve erişimleri. Şifre/anahtar saklanmaz; platform + kimlik tek müşteriye aittir.
  `CREATE TABLE IF NOT EXISTS hesap_envanteri (
    id TEXT PRIMARY KEY, musteri_id TEXT NOT NULL, platform TEXT NOT NULL, hesap_adi TEXT, hesap_kimligi TEXT, erisim_turu TEXT NOT NULL,
    erisim_sahibi TEXT, durum TEXT NOT NULL, verilis TEXT, kaldirilma TEXT, not_ TEXT, olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL, ekleyen TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS envanter_musteri ON hesap_envanteri (musteri_id)`,
  `CREATE INDEX IF NOT EXISTS envanter_kimlik ON hesap_envanteri (platform, hesap_kimligi)`,
  // Müşteri sitesi sağlık kontrolü (worker/site-saglik.js): hedef siteler ve son 30 kontrol sonucu.
  `CREATE TABLE IF NOT EXISTS site_saglik_hedef (
    id TEXT PRIMARY KEY, musteri_id TEXT NOT NULL, adres TEXT NOT NULL UNIQUE, aktif INTEGER NOT NULL DEFAULT 1, son_kontrol TEXT, son_durum TEXT,
    alan_kok TEXT, alan_bitis TEXT, rdap_zaman TEXT, olusturma TEXT NOT NULL, ekleyen TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS site_saglik_sonuc (
    id TEXT PRIMARY KEY, hedef_id TEXT NOT NULL, zaman TEXT NOT NULL, durum TEXT NOT NULL, http INTEGER, sure INTEGER, son_adres TEXT, bulunan TEXT, sorunlar TEXT, notlar TEXT)`,
  `CREATE INDEX IF NOT EXISTS site_saglik_sonuc_hedef ON site_saglik_sonuc (hedef_id, zaman)`,
  // Reklam dönüşümü (worker/donusum.js): pazarlama çerezi izniyle gelen tıklama kimlikleri ve platforma yüklenen dönüşümler.
  `CREATE TABLE IF NOT EXISTS talep_reklam (
    talep_id TEXT PRIMARY KEY, gclid TEXT, gbraid TEXT, wbraid TEXT, fbclid TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT, tiklama_zamani TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS donusum_aktarim (talep_id TEXT NOT NULL, platform TEXT NOT NULL, zaman TEXT NOT NULL, kim TEXT NOT NULL, PRIMARY KEY (talep_id, platform))`
];
