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
  `CREATE INDEX IF NOT EXISTS asistan_ip ON asistan_mesajlari (ip_ozet, zaman)`
];
