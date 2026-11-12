// Teklif toplamları (Muhittin, 12 Kas 2026 ürün kuralı): aylık ve tek seferlik tutarlar TOPLANMAZ.
// Sunucu (worker/teklif.js) ve ekran önizlemesi (proposals.astro) aynı işlevi kullanır; tutarlar kuruş (tam sayı).
// · Kalem türü: 'aylik' | 'tek_seferlik' | null (eski teklif: tür bilinmiyor).
// · Teklifte iki tür de varsa iki ayrı blok (Aylık, Tek seferlik) hesaplanır; hiçbir yerde ikisinin toplamı yoktur.
//   Bu durumda indirim uygulanmaz (hangi bloğa düşeceği belirsiz) ve türü belirsiz kalem kabul edilmez.
// · Tek tür ya da türü bilinmeyen kalemler: bugünkü gibi tek blok (indirim bu bloğa uygulanır).
// · Kayıtlı teklif satırından bloklar: teklifBloklari(). İki türlü teklifte eski ara_toplam/kdv/toplam sütunları 0 yazılır,
//   gösterim ve hesap ara_aylik/kdv_aylik/toplam_aylik ile ara_tek/kdv_tek/toplam_tek sütunlarından yapılır.
export const TUR_ADI = { aylik: 'Aylık', tek_seferlik: 'Tek seferlik' };
export const kalemTuru = (k) => (k && TUR_ADI[k.tur] ? k.tur : null);

const kurus = (v) => Math.round((Number(v) || 0) * 100);

// kalemler: [{ adet, birim_fiyat, tur }] (TL). indirim TL, oran yüzde. Hata varsa { hata } da döner (bloklar yine hesaplanır).
export function teklifHesapla(kalemler, indirim, oran) {
  const oranYuz = Math.round((Number(oran) || 0) * 100);
  const satirlar = kalemler.map((k) => Math.round((kurus(k.adet) * kurus(k.birim_fiyat)) / 100));
  const turler = kalemler.map(kalemTuru);
  const karisik = turler.includes('aylik') && turler.includes('tek_seferlik');
  const indKurus = Math.max(0, kurus(indirim));
  let hata = '';
  const blok = (tur, ara, ind) => { const kdv = Math.round(((ara - ind) * oranYuz) / 10000); return { tur, ara, indirim: ind, kdv, toplam: ara - ind + kdv }; };
  if (karisik) {
    if (turler.includes(null)) hata = 'Aylık ve tek seferlik kalemlerin olduğu teklifte her kalemin türü seçilmeli';
    else if (indKurus > 0) hata = 'Aylık ve tek seferlik kalemler birlikteyken indirim uygulanamaz; indirimi kalem fiyatına yansıtın';
    const ara = (t) => satirlar.reduce((s, x, i) => s + (turler[i] === t ? x : 0), 0);
    return { satirlar, karisik, oranYuz, hata, bloklar: [blok('aylik', ara('aylik'), 0), blok('tek_seferlik', ara('tek_seferlik'), 0)] };
  }
  const ara = satirlar.reduce((s, x) => s + x, 0);
  const tur = turler.length && turler.every((t) => t && t === turler[0]) ? turler[0] : null;
  if (indKurus > ara) hata = 'İndirim ara toplamdan büyük olamaz';
  return { satirlar, karisik, oranYuz, hata, bloklar: [blok(tur, ara, Math.min(indKurus, ara))] };
}

// Kayıtlı teklif satırından (TL değerleri) gösterilecek bloklar. Eski teklif: tek blok, tür null.
export function teklifBloklari(t) {
  const v = (x) => x !== null && x !== undefined;
  if (v(t.toplam_aylik) && v(t.toplam_tek)) return [
    { tur: 'aylik', ara: t.ara_aylik, indirim: 0, kdv: t.kdv_aylik, toplam: t.toplam_aylik },
    { tur: 'tek_seferlik', ara: t.ara_tek, indirim: 0, kdv: t.kdv_tek, toplam: t.toplam_tek }
  ];
  return [{ tur: v(t.toplam_aylik) ? 'aylik' : v(t.toplam_tek) ? 'tek_seferlik' : null, ara: t.ara_toplam, indirim: Number(t.indirim) || 0, kdv: t.kdv, toplam: t.toplam }];
}

// Sunucuda saklanacak sütunlar (TL). bloklar kuruş.
export function toplamSutunlari(h) {
  const tl = (x) => x / 100;
  const b = (tur) => h.bloklar.find((x) => x.tur === tur) || null;
  const a = b('aylik'), t = b('tek_seferlik'), tek = h.bloklar.length === 1 ? h.bloklar[0] : null;
  return {
    ara_toplam: tek ? tl(tek.ara) : 0, kdv: tek ? tl(tek.kdv) : 0, toplam: tek ? tl(tek.toplam) : 0, indirim: tek ? tl(tek.indirim) : 0,
    ara_aylik: a ? tl(a.ara) : null, kdv_aylik: a ? tl(a.kdv) : null, toplam_aylik: a ? tl(a.toplam) : null,
    ara_tek: t ? tl(t.ara) : null, kdv_tek: t ? tl(t.kdv) : null, toplam_tek: t ? tl(t.toplam) : null
  };
}

// Kısa metin (bildirim, günlük): "24.000,00 TL / ay (aylık) · 6.000,00 TL (tek seferlik)"; tek blokta yalnız tutar.
export function bloklarMetni(bloklar, alan = 'toplam') {
  const tl = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0) + ' TL';
  return bloklar.map((b) => (b.tur === 'aylik' ? `${tl(b[alan])} / ay` : tl(b[alan])) + (b.tur ? ` (${TUR_ADI[b.tur].toLocaleLowerCase('tr')})` : '')).join(' · ');
}

// Toplam kutusu satırları: [etiket, değer, güçlü?]. İki blokta her blok kendi başlığıyla; "Genel toplam" yalnız tek blokta.
// bloklar TL değerli (teklifBloklari) ya da kuruş ({ kurus: true }). matrah: indirimde "KDV matrahı" satırı (yazdırma).
export function toplamSatirlari(bloklar, kdvOrani, { kurus: k = false, matrah = false } = {}) {
  const tl = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(n) || 0) / (k ? 100 : 1)) + ' TL';
  const oran = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(Number(kdvOrani) || 0);
  const iki = bloklar.length > 1;
  return bloklar.flatMap((b) => {
    const on = iki ? TUR_ADI[b.tur] + ' · ' : '', ay = b.tur === 'aylik' ? ' / ay' : '';
    return [
      [on + 'Ara toplam', tl(b.ara) + ay],
      Number(b.indirim) > 0 ? [on + 'İndirim', '−' + tl(b.indirim)] : null,
      Number(b.indirim) > 0 && matrah ? [on + 'KDV matrahı', tl((Number(b.ara) || 0) - (Number(b.indirim) || 0))] : null,
      [`${on}KDV (%${oran})`, tl(b.kdv) + ay],
      [iki ? `${TUR_ADI[b.tur]} toplam` : 'Genel toplam' + (b.tur ? ` (${TUR_ADI[b.tur].toLocaleLowerCase('tr')})` : ''), tl(b.toplam) + ay, true]
    ].filter(Boolean);
  });
}
