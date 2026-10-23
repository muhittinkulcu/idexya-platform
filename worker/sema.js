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
  // Teklifler (worker/teklif.js): kalemler JSON, tutarlar sunucuda hesaplanır (TL, 2 ondalık). Numara yıl başına sayaçtan.
  `CREATE TABLE IF NOT EXISTS teklifler (
    id TEXT PRIMARY KEY, no TEXT NOT NULL UNIQUE, musteri_id TEXT NOT NULL, baslik TEXT NOT NULL, kalemler TEXT NOT NULL,
    kdv_orani REAL NOT NULL DEFAULT 20, indirim REAL NOT NULL DEFAULT 0, para TEXT NOT NULL DEFAULT 'TRY', gecerlilik TEXT, notlar TEXT,
    durum TEXT NOT NULL DEFAULT 'taslak', ara_toplam REAL NOT NULL DEFAULT 0, kdv REAL NOT NULL DEFAULT 0, toplam REAL NOT NULL DEFAULT 0,
    olusturma TEXT NOT NULL, guncelleme TEXT NOT NULL, gonderim_zamani TEXT, karar_zamani TEXT, olusturan TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS teklif_musteri ON teklifler (musteri_id, olusturma)`,
  `CREATE INDEX IF NOT EXISTS teklif_durum ON teklifler (durum, guncelleme)`,
  `CREATE TABLE IF NOT EXISTS teklif_sayac (yil INTEGER PRIMARY KEY, son INTEGER NOT NULL)`
];
