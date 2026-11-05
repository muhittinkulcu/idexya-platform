// Bayrak kapalı derlemenin main derlemesiyle bayt bayt aynı olduğunu kanıtlar.
// Kullanım: main'de `npm run build`, dist'i bir yere kopyala; dalda `npm run build`; sonra
//   node tools/cati-kanit.mjs <main dist klasörü> [dal dist klasörü = dist]
// Tek istisna: src/components/KapakGorsel.astro her derlemede rastgele SVG kimliği üretir (main iki kez derlense de değişir);
// karşılaştırmadan önce yalnız bu kimlik sabitlenir.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const [, , ana, dal = 'dist'] = process.argv;
if (!ana) { console.error('Kullanım: node tools/cati-kanit.mjs <main dist> [dal dist]'); process.exit(2); }
const RASTGELE = /(kg-[a-z]+-)[a-z0-9]{1,8}/g;
const ozet = (y) => {
  const veri = readFileSync(y);
  if (!y.endsWith('.html')) return createHash('sha256').update(veri).digest('hex');
  return createHash('sha256').update(veri.toString('utf8').replace(RASTGELE, '$1x')).digest('hex');
};
const liste = (kok) => {
  const m = new Map();
  const gez = (d) => {
    for (const ad of readdirSync(d)) {
      const y = join(d, ad);
      if (statSync(y).isDirectory()) gez(y);
      else m.set(relative(kok, y), ozet(y));
    }
  };
  gez(kok);
  return m;
};
const a = liste(ana), b = liste(dal);
const eksik = [...a.keys()].filter((k) => !b.has(k));
const yeni = [...b.keys()].filter((k) => !a.has(k));
const farkli = [...a.keys()].filter((k) => b.has(k) && a.get(k) !== b.get(k));
console.log(`main: ${a.size} dosya · dal: ${b.size} dosya · aynı: ${[...a.keys()].filter((k) => a.get(k) === b.get(k)).length}`);
console.log(`eksik: ${eksik.length} · yeni: ${yeni.length} · farklı: ${farkli.length}`);
[...eksik.map((x) => `eksik ${x}`), ...yeni.map((x) => `yeni ${x}`), ...farkli.map((x) => `farklı ${x}`)].slice(0, 40).forEach((x) => console.log(x));
process.exit(eksik.length || yeni.length || farkli.length ? 1 : 0);
