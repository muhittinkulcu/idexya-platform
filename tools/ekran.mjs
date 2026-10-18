// Yerel önizleme sunucusundan ekran görüntüsü alır: node tools/ekran.mjs <yol> [genislik] [cikti] [koyu]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , yol = '/', gen = '1440', cikti = '/tmp/ekran.png', koyu = ''] = process.argv;
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const s = await t.newPage({ viewport: { width: Number(gen), height: 900 } });
const hatalar = [];
s.on('pageerror', (e) => hatalar.push(e.message));
s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
if (koyu) await s.addInitScript(() => localStorage.setItem('idx-tema', 'koyu'));
await s.goto('http://localhost:4321' + yol, { waitUntil: 'networkidle' });
const tasma = await s.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await s.screenshot({ path: cikti, fullPage: !process.env.UST });
console.log(JSON.stringify({ yol, gen, tasma, hatalar }));
await t.close();
