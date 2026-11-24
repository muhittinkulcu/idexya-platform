// Sayfanın modül rengi ve simgesi (9. tur, Muhittin 25 Kas 2026): ortak sol menünün maddesinden (katmanlar.json `ton`, `simge`)
// okunur, elle yazılmaz; menüde rengi neyse sayfa bandında da odur. Menüde olmayan sayfa Web Site Yönetimi rengini alır.
import { SIMGE } from '../idexya-kabuk/kabuk-cekirdek.js';
import { PANEL_KOKEN } from './ortak-menu.js';

export const uclu = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

export function modulGorseli(katmanlar, href) {
  const tam = href ? PANEL_KOKEN + href : null;
  const k = (tam && katmanlar.find((x) => x.gruplar.some((g) => g.moduller.some((m) => m.url === tam || m.sayfalar.some((s) => s.url === tam)))))
    || katmanlar.find((x) => x.anahtar === 'web');
  return { anahtar: k.anahtar, ton: uclu(k.ton), yollar: SIMGE[k.simge] || SIMGE.dunya };
}
