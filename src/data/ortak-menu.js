// Tek gezinme (talimat 4.2): ortak sol menü (idexya-ortak kabuk/katmanlar.json, 11 madde) panelin ayarına uyarlanır.
// Panelin kendi sayfaları (panel.idexya.com) göreli adrese çevrilir; panel menüsünde (panel-menu.js) adresi olmayan panel sayfası
// atılır (çalışmayan bağlantı gösterilmez). Öteki ürünlerin tam adresleri aynen kalır. Test: tools/test-panel-menu.mjs.
export const PANEL_KOKEN = 'https://panel.idexya.com';

/** Panel menüsündeki bütün adresler (modül ve alt sayfa). */
export const panelAdresleri = (menu) => new Set(menu.flatMap((g) => g.ogeler.flatMap((o) => [o.href, ...(o.altlar || []).map((a) => a.href)])).filter(Boolean));

/** Ortak listedeki panel sayfası adresi → göreli (menüde varsa) ya da null; öteki ürünün adresi aynen. */
export function yerel(u, adresler) {
  if (typeof u !== 'string' || !u.startsWith(PANEL_KOKEN + '/')) return u;
  const yol = u.slice(PANEL_KOKEN.length);
  return adresler.has(yol) ? yol : null;
}

export function ortakMenu(katmanlar, menu) {
  const adresler = panelAdresleri(menu);
  return katmanlar.map((k) => {
    const gruplar = k.gruplar.map((g) => ({
      ...g,
      moduller: g.moduller.map((m) => {
        const sayfalar = m.sayfalar.map((s) => ({ ...s, url: yerel(s.url, adresler) })).filter((s) => s.url);
        const url = yerel(m.url, adresler) || (sayfalar[0] && sayfalar[0].url);
        return url ? { ...m, url, sayfalar } : null;
      }).filter(Boolean)
    })).filter((g) => g.moduller.length);
    const url = k.url === null ? null : yerel(k.url, adresler) || (gruplar[0] && gruplar[0].moduller[0].url) || null;
    return { ...k, url, gruplar };
  });
}

/** Panel menüsünde olup sol menüye girmeyen adresler: boş olmalı (test). */
export function eksikAdresler(katmanlar, menu) {
  const var_ = new Set();
  ortakMenu(katmanlar, menu).forEach((k) => k.gruplar.forEach((g) => g.moduller.forEach((m) => [m.url, ...m.sayfalar.map((s) => s.url)].forEach((u) => var_.add(u)))));
  return [...panelAdresleri(menu)].filter((u) => !var_.has(u));
}
