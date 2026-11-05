// Hizmet sayfası denetimleri (tools/test-cati.mjs çağırır): ağ tuvali, yön, metin sınırları, teklif formu ve /api/talep.
import { HIZMETLER } from '../src/cati/hizmetler.mjs';
export default async function ({ t, B, SS, k }) {
  const yol = (s) => `${B}/${s.s}/`;
  const TEK = ['ai-agent-otomasyon-yonetimi', 'kurumsal-web-site-tasarimi', 'e-ticaret-web-site-tasarimi'];
  k('dokuz hizmet', HIZMETLER.length === 9);
  k('Teknoloji yalnız üç sayfada', HIZMETLER.filter((s) => s.yon === 't').map((s) => s.s).sort().join() === [...TEK].sort().join());
  const agBekle = (s) => s.waitForFunction(() => document.querySelector('canvas.ag')?.dataset.parca, null, { timeout: 8000 });
  for (const s of HIZMETLER) {
    const c = await t.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
    await p.goto(yol(s), { waitUntil: 'load' });
    const d = await p.evaluate(() => ({
      yon: document.documentElement.dataset.yon,
      tuval: document.querySelectorAll('canvas.ag').length,
      metin: (() => { const a = document.querySelector('.hz-ana').cloneNode(true); a.querySelectorAll('.no').forEach((n) => n.remove()); return a.textContent; })(),
      secili: document.querySelector('select[name=alan]').selectedOptions[0].textContent
    }));
    k(`${s.s} yön doğru`, d.yon === s.yon);
    k(`${s.s} tuval yalnız Teknoloji'de`, d.tuval === (s.yon === 't' ? 1 : 0), String(d.tuval));
    k(`${s.s} form hizmeti seçili`, d.secili === s.ad, d.secili);
    k(`${s.s} metinde sayı yok`, !/\d/.test(d.metin), (d.metin.match(/.{0,20}\d.{0,20}/) || [''])[0]);
    k(`${s.s} fiyat, belge, garanti iddiası yok`, !/\d\s*TL|SHGM|lisanslı|sertifikalı|ruhsatlı|garanti ediyoruz/i.test(d.metin));
    await c.close();
  }
  // Ağ: masaüstünde çalışır, sekme gizliyken durur, geri gelince sürer; görünüm dışında durur; telefonda seyrek; hareket azaltmada yok.
  const ai = HIZMETLER.find((s) => s.s === 'ai-agent-otomasyon-yonetimi');
  const c = await t.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  await p.goto(yol(ai), { waitUntil: 'load' }); await agBekle(p); await p.waitForTimeout(200);
  const calisir = () => p.evaluate(() => document.querySelector('canvas.ag').dataset.calisiyor);
  const masa = Number(await p.evaluate(() => document.querySelector('canvas.ag').dataset.parca));
  k('ağ masaüstünde çalışıyor', (await calisir()) === 'evet');
  k('ağ masaüstünde en çok 78 parça', masa > 22 && masa <= 78, String(masa));
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(200);
  k('ağ sekme gizliyken duruyor', (await calisir()) === 'hayir');
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(200);
  k('ağ sekme dönünce sürüyor', (await calisir()) === 'evet');
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(300);
  k('ağ görünüm dışında duruyor', (await calisir()) === 'hayir');
  await c.close();
  const c2 = await t.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await c2.newPage();
  await p2.goto(yol(ai), { waitUntil: 'load' }); await agBekle(p2);
  const tel = Number(await p2.evaluate(() => document.querySelector('canvas.ag').dataset.parca));
  k('ağ telefonda seyrek (en çok 22)', tel > 0 && tel <= 22, String(tel));
  await c2.close();
  const c3 = await t.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } }); const p3 = await c3.newPage();
  await p3.goto(yol(ai), { waitUntil: 'load' }); await p3.waitForTimeout(3500);
  k('hareket azaltmada ağ başlamıyor', (await p3.evaluate(() => document.querySelector('canvas.ag').dataset.parca)) === undefined);
  await c3.close();
  // Form: tarayıcıdan uçtan uca (yerel D1). Önce eksikler reddedilir, sonra kayıt gider.
  const c4 = await t.newContext({ viewport: { width: 1440, height: 900 } }); const f = await c4.newPage();
  const giden = []; f.on('request', (r) => { if (r.url().endsWith('/api/talep')) giden.push(r.postDataJSON()); });
  await f.goto(`${B}/dron-cekimi/`, { waitUntil: 'load' });
  const dr = () => f.textContent('[data-form-durum]');
  await f.click('.form button[type=submit]');
  k('ad boşsa gönderilmez', /adınızı/.test(await dr()) && giden.length === 0);
  await f.fill('.form [name=ad]', 'Deneme Kişi');
  await f.click('.form button[type=submit]');
  k('iletişim boşsa gönderilmez', /e-posta veya telefon/.test(await dr()) && giden.length === 0);
  await f.fill('.form [name=eposta]', 'deneme@example.com');
  await f.click('.form button[type=submit]');
  k('KVKK işaretsizse gönderilmez', /KVKK/.test(await dr()) && giden.length === 0);
  await f.check('.form [name=kvkk]');
  await f.fill('.form [name=mesaj]', 'Yerel deneme kaydı');
  await f.click('.form button[type=submit]');
  await f.waitForFunction(() => /Teşekkürler|gönderilemedi|Bağlantı/.test(document.querySelector('[data-form-durum]').textContent));
  k('kayıt başarılı', /Teşekkürler/.test(await dr()), await dr());
  k('konu hizmet adı', giden[0]?.alan === 'Dron Çekimi' && giden[0]?.konu === 'Dron Çekimi' && giden[0]?.sayfa === '/dron-cekimi/', JSON.stringify(giden[0]));
  k('izinsiz reklam verisi yok', !giden[0]?.reklam && !giden[0]?.pazarlama_izni);
  if (SS) await f.screenshot({ path: `${SS}/form-sonuc.png` });
  await c4.close();
  // Sunucu korumaları doğrudan: KVKK, tuzak, hız sınırı (aynı IP 10 dakikada 5).
  const gonder = (g) => fetch(`${B}/api/talep`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
  k('sunucu KVKK onayı ister', (await gonder({ ad: 'A', eposta: 'a@example.com' })).status === 422);
  const tz = await gonder({ ad: 'A', eposta: 'a@example.com', kvkk: true, web_adresi_tekrar: 'robot' });
  k('tuzak alan kaydedilmeden kabul', tz.status === 200);
  const son = [];
  for (let i = 0; i < 6; i++) son.push((await gonder({ ad: 'Sınır', eposta: `s${i}@example.com`, kvkk: true, kaynak: 'teklif' })).status);
  k('hız sınırı 429', son.includes(429) && son[0] === 200, son.join());
}
