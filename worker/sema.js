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
    id TEXT PRIMARY KEY, zaman TEXT NOT NULL, kim TEXT NOT NULL, islem TEXT NOT NULL, hedef TEXT, detay TEXT)`
];
