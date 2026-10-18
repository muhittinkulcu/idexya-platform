import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const y of process.argv.slice(2)) {
  const s = await t.newPage({ viewport: { width: 390, height: 800 } });
  await s.goto('http://localhost:4321' + y);
  const r = await s.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 6).map(e => e.tagName + ' ' + (e.getAttribute('style') || '').slice(0, 90) + ' | ' + (e.textContent || '').trim().slice(0, 30)));
  console.log(y, r);
}
await t.close();
