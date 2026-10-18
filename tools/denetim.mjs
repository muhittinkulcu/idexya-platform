// Tüm sayfalarda yatay taşma, konsol hatası ve kırık iç bağlantı denetimi: node tools/denetim.mjs
import { createRequire } from 'module';
import { readdirSync, statSync, existsSync } from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const yollar = [];
const gez = (d, y) => { for (const f of readdirSync(d)) { const p = d + '/' + f; if (statSync(p).isDirectory()) gez(p, y + '/' + f); else if (f === 'index.html') yollar.push(y || '/'); } };
gez('dist', '');
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const sorun = []; const baglantilar = new Set();
for (const gen of [1440, 768, 390, 360]) {
  const s = await t.newPage({ viewport: { width: gen, height: 900 } });
  for (const y of yollar) {
    const h = [];
    s.removeAllListeners('pageerror'); s.on('pageerror', (e) => h.push(e.message));
    await s.goto('http://localhost:4321' + y);
    const tasma = await s.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (tasma > 0) sorun.push(`${gen}px ${y}: ${tasma}px yatay taşma`);
    if (h.length) sorun.push(`${gen}px ${y}: ${h.join('; ')}`);
    if (gen === 1440) (await s.$$eval('a[href^="/"]', (a) => a.map((x) => x.getAttribute('href')))).forEach((b) => baglantilar.add(b.split('#')[0]));
  }
  await s.close();
}
const kirik = [...baglantilar].filter((b) => { const p = 'dist' + b.replace(/\/$/, ''); return !(existsSync(p + '/index.html') || existsSync(p) || existsSync(p + '.html')); });
console.log(`${yollar.length} sayfa · 4 genişlik`);
console.log(sorun.length ? sorun.join('\n') : 'taşma ve betik hatası yok');
console.log(kirik.length ? 'kırık bağlantılar: ' + kirik.join(', ') : 'kırık iç bağlantı yok');
await t.close();
