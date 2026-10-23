// Derlemeden sonra panelden düzenlenen içerik dosyalarının yayındaki kopyasını dist/yonetim/veri/ altına koyar.
// Panel, GitHub anahtarı tanımlı değilken içeriği buradan okur (/yonetim altı Cloudflare Access ile korunur).
import { mkdirSync, copyFileSync } from 'node:fs';
import { DOSYALAR } from '../src/data/icerik-sema.js';

mkdirSync('dist/yonetim/veri', { recursive: true });
for (const [ad, d] of Object.entries(DOSYALAR)) copyFileSync(d.yol, `dist/yonetim/veri/${ad}.json`);
console.log(`panel verisi: ${Object.keys(DOSYALAR).length} dosya`);
