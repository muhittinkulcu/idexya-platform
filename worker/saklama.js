// Saklama süreleri (KVKK aydınlatma metni, Muhittin 22 Eki 2026). Günlük zamanlayıcıyla çalışır; süresi dolan kişisel veriyi siler.
// Müşteriye dönüşen talepler (durum 'crm') ve müşteri, sözleşme, fatura kayıtları burada silinmez (10 yıl; ayrıca ele alınacak).
// Ticari ileti onayı: bülten listesinden ayrılanların kaydı ayrılmadan 3 yıl sonra silinir (talep formundaki iys_izni için geri alma tarihi tutulmuyor).
import { simdi, kimlik } from './ortak.js';

const YIL = 365 * 86400000;
export const KURALLAR = [
  { ad: 'Müşteriye dönüşmeyen talepler (2 yıl)', sql: "DELETE FROM talepler WHERE durum IN ('yeni', 'spam') AND olusturma < ?", sure: 2 * YIL },
  { ad: 'Yapay zekâ asistanı sohbetleri (1 yıl)', sql: 'DELETE FROM asistan_mesajlari WHERE zaman < ?', sure: YIL },
  { ad: 'Giriş denemeleri ve IP özetleri (2 yıl)', sql: 'DELETE FROM giris_denemeleri WHERE zaman < ?', sure: 2 * YIL },
  { ad: 'Bültenden ayrılanların onay kayıtları (3 yıl)', sql: "DELETE FROM bulten WHERE durum = 'ayrildi' AND ayrilma_zamani < ?", sure: 3 * YIL },
  { ad: 'Süresi dolmuş oturumlar', sql: 'DELETE FROM oturumlar WHERE bitis < ?', sure: 0 },
  { ad: 'Süresi dolmuş şifre yenileme bağlantıları (30 gün sonra)', sql: 'DELETE FROM sifre_yenileme WHERE bitis < ?', sure: 30 * 86400000 }
];

export async function saklamaUygula(db, an = Date.now()) {
  const sonuc = await db.batch(KURALLAR.map((k) => db.prepare(k.sql).bind(new Date(an - k.sure).toISOString())));
  const ozet = KURALLAR.map((k, i) => ({ ad: k.ad, silinen: (sonuc[i].meta && sonuc[i].meta.changes) || 0 }));
  const toplam = ozet.reduce((s, x) => s + x.silinen, 0);
  if (toplam) {
    await db.prepare('INSERT INTO islem_kaydi (id, zaman, kim, islem, hedef, detay) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(kimlik(), simdi(), 'Zamanlayıcı', 'saklama_suresi', null, ozet.filter((x) => x.silinen).map((x) => `${x.ad}: ${x.silinen}`).join(' · ')).run();
  }
  return ozet;
}
