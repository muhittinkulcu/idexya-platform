// Tasarım dosyalarındaki veriyi JSON'a çıkarır: node tools/veri.mjs
import { readFileSync, writeFileSync } from 'fs';
const calistir = (dosya, durum = {}) => {
  const s = readFileSync(dosya, 'utf8');
  const kod = s.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
  const f = new Function('DCLogic', kod + '\nreturn Component;');
  const C = f(class { constructor(p) { this.props = p || {}; this.state = {}; } setState() {} });
  const c = new C({}); Object.assign(c.state, durum); return c.renderVals();
};
const h = calistir('design/Hizmetler.dc.html');
writeFileSync('src/data/hizmetler.json', JSON.stringify(h.gruplar.map((g) => ({ id: g.id, ad: g.ad, aciklama: g.aciklama, hizmetler: g.hizmetler })), null, 2));
const r = calistir('design/Referanslar.dc.html', { filtre: 'tumu' });
writeFileSync('src/data/projeler.json', JSON.stringify(r.gorunenProjeler.map((p) => ({ ad: p.ad, kat: p.kat, kategoriAd: p.kategoriAd, sektor: p.sektor, hizmet: p.hizmet, basHarf: p.basHarf })), null, 2));
console.log('hizmet', h.gruplar.reduce((a, g) => a + g.hizmetler.length, 0), 'proje', r.gorunenProjeler.length);
// Paket sihirbazı mantığı istemcide aynı kodla çalışsın diye modül olarak yazılır.
{
  const s = readFileSync('design/Paketler.dc.html', 'utf8');
  const kod = s.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
  writeFileSync('src/scripts/paket-mantik.js', '// Üretilen dosya: tools/veri.mjs (kaynak design/Paketler.dc.html). Elle düzenlenmez.\nexport default function olustur(DCLogic) {\n' + kod + '\nreturn Component;\n}\n');
}
