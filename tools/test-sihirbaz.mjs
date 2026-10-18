import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const s = await t.newPage({ viewport: { width: 1440, height: 900 } });
const h = []; s.on('pageerror', (e) => h.push(e.message));
await s.goto('http://localhost:4321/tr/paketler');
await s.click('[data-cerez="red"]');
for (let i = 0; i < 6; i++) { const b = await s.$('#sihirbaz [data-secenek="1"]'); if (!b) break; await b.click(); }
console.log('sonuç:', (await s.textContent('#sihirbaz')).slice(0, 200));
await s.click('[data-grup="paket"][data-deger="seo"]');
const gorunen = await s.$$eval('[data-grup-icerik="paket"]', (x) => x.filter((e) => !e.classList.contains('gizli')).map((e) => e.dataset.etiket));
console.log('süzgeç:', gorunen);
await s.click('[data-grup-icerik="paket"]:not(.gizli) [data-paket]'); console.log('seçili:', await s.textContent('#secili-paket'));
console.log('hata', h);
await t.close();
