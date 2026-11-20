// Yapay zekâ sağlayıcısına giden metinde kişisel veri maskeleme (KVKK; IDOS AGENTS.md 6.4).
// IDOS app/services/sohbet_asistani.py içindeki maskele / geri_koy ile aynı davranış: telefon ve e-posta geri
// çevrilebilir yer tutucuya ("[[T1]]", "[[E1]]") döner, asıl değer yalnız sunucudaki `geri` sözlüğünde kalır.
// Ad soyadın güvenilir bir kalıbı olmadığı için maskelenmez.

export const EPOSTA_KALIBI = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
// TR cep ve sabit hat (+90 / 0 önekli ya da öneksiz; 3-3-2-2 öbekleri tek boşluk / tire / noktayla) ve yurt dışı
// (+ ile başlayan 9-14 rakam). Fiyat aralığı ("15.000 - 30.000 TL") ve saat ("09.00-18.00") telefon sayılmaz.
export const TELEFON_KALIBI = /(?<![\d+])(?:(?:\+?90[\s\-.]?|0[\s\-.]?)?\(?[2-5]\d{2}\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}|\+\d{1,3}[\s\-.]?\d(?:[\s\-.]?\d){7,12})(?!\d)/g;

// `geri` verilirse geri çevrilebilir yer tutucu yazılır ve asıl değer sözlüğe konur (aynı değer aynı yer tutucuyu alır);
// verilmezse "[telefon]" / "[e-posta]" yazılır.
export function maskele(metin, geri) {
  if (!metin) return metin || '';
  const yer = (tur) => (deger) => {
    if (!geri) return tur === 'T' ? '[telefon]' : '[e-posta]';
    for (const [k, v] of Object.entries(geri)) if (v === deger) return k;
    const k = `[[${tur}${Object.keys(geri).length + 1}]]`;
    geri[k] = deger;
    return k;
  };
  return String(metin).replace(EPOSTA_KALIBI, yer('E')).replace(TELEFON_KALIBI, yer('T'));
}

export function geriKoy(metin, geri) {
  if (typeof metin !== 'string' || !geri) return metin;
  for (const [k, v] of Object.entries(geri)) metin = metin.split(k).join(v);
  return metin;
}
