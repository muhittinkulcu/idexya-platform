// Görünürlük ayarı uçtan uca: her görünürlük türü × ziyaretçi / yetkisiz üye / yetkili üye; yorumlar; arşiv; zamanlama.
// Boş veritabanlı yerel `wrangler dev` (YEREL_GIRIS=evet), adres localhost olmalı.
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const B = process.argv[2] || 'http://localhost:8787';
const SS = process.argv[3] || '.';
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const h = [];
const kontrol = (ad, k) => { console.log((k ? 'GEÇTİ ' : 'KALDI ') + ad); if (!k) h.push(ad); };
const baglam = async () => { const c = await t.newContext({ viewport: { width: 1280, height: 900 } }); const s = await c.newPage(); s.on('pageerror', (e) => h.push('JS: ' + e.message)); await s.goto(B + '/giris'); return s; };
const istek = (s, yol, govde) => s.evaluate(async ([y, g]) => { const r = await fetch(y, g === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) }); return { durum: r.status, ...(await r.json().catch(() => ({}))) }; }, [yol, govde]);

const yon = await baglam();
const ziyaretci = await baglam();
const uyeA = await baglam(), uyeB = await baglam();
for (const [s, e] of [[uyeA, 'a@ornek.com'], [uyeB, 'b@ornek.com']]) await istek(s, '/api/uye/kayit', { ad: e[0].toUpperCase() + ' Üye', eposta: e, sifre: 'GucluSifre2026', kvkk: true });
const uyeler = (await istek(yon, '/api/yonetim/uyeler')).uyeler;
const idA = uyeler.find((u) => u.eposta === 'a@ornek.com').id, idB = uyeler.find((u) => u.eposta === 'b@ornek.com').id;
const grup = (await istek(yon, '/api/yonetim/gruplar', { ad: 'Seçkin' })).id;
for (const id of [idA, idB]) await istek(yon, `/api/yonetim/uyeler/${id}/durum`, { durum: 'onayli' });
await istek(yon, `/api/yonetim/uyeler/${idA}/moduller`, { moduller: { 'uye-icerik': 'kullan' } });
await istek(yon, `/api/yonetim/uyeler/${idA}/gruplar`, { gruplar: [grup] });
for (const [s, e] of [[uyeA, 'a@ornek.com'], [uyeB, 'b@ornek.com']]) kontrol('giriş ' + e, (await istek(s, '/api/uye/giris', { eposta: e, sifre: 'GucluSifre2026' })).ok);

const yap = async (ad, ek) => (await istek(yon, '/api/yonetim/icerikler', { baslik: ad, ozet: ad + ' özeti', govde: 'Gizli metin ' + ad + '\n\n<img src=x onerror="window.__xss=1">', etkilesim: 'kimse', ...ek })).kisa_ad;
const k = {
  herkes: await yap('Herkese açık yazı', { gorunurluk: 'herkes', etkilesim: 'herkes', arama: true }),
  uyeler: await yap('Üyelere özel yazı', { gorunurluk: 'uyeler', etkilesim: 'uyeler' }),
  secili: await yap('Seçkin grup yazısı', { gorunurluk: 'secili', gruplar: [grup] }),
  liste: await yap('Liste dışı yazı', { gorunurluk: 'liste_disi' }),
  gizli: await yap('Gizli taslak', { gorunurluk: 'gizli' }),
  ileri: await yap('Gelecek yazı', { gorunurluk: 'herkes', yayin_zamani: new Date(Date.now() + 86400000).toISOString() }),
  arsiv: await yap('Arşivlik yazı', { gorunurluk: 'herkes' })
};
const tumIc = (await istek(yon, '/api/yonetim/icerikler')).icerikler;
await istek(yon, `/api/yonetim/icerikler/${tumIc.find((x) => x.kisa_ad === k.arsiv).id}/arsiv`, { arsiv: true });
kontrol('seçili görünürlük boş listeyle reddedilir', (await istek(yon, '/api/yonetim/icerikler', { baslik: 'Boş seçili', gorunurluk: 'secili' })).durum === 422);

const gor = async (s, kisa) => { const r = await s.goto(B + '/icerik/' + kisa); const metin = await s.textContent('[data-icerik-alan]'); return { durum: r.status(), tam: metin.includes('Gizli metin'), tanitim: metin.includes('Bu içerik üyelere özel') }; };
const beklenen = {
  herkes: ['tam', 'tam', 'tam'], uyeler: ['tanitim', 'tanitim', 'tam'], secili: ['yok', 'yok', 'tam'], liste: ['tam', 'tam', 'tam'],
  gizli: ['yok', 'yok', 'yok'], ileri: ['yok', 'yok', 'yok'], arsiv: ['yok', 'yok', 'yok']
};
for (const [tur, b] of Object.entries(beklenen)) {
  for (const [i, [s, ad]] of [[ziyaretci, 'ziyaretçi'], [uyeB, 'yetkisiz üye'], [uyeA, 'yetkili üye']].entries()) {
    const r = await gor(s, k[tur]);
    const sonuc = r.durum === 404 ? 'yok' : r.tam ? 'tam' : r.tanitim ? 'tanitim' : '?';
    kontrol(`${tur} · ${ad} → ${b[i]} (${sonuc})`, sonuc === b[i]);
  }
}
const liste = async (s) => (await istek(s, '/api/icerik')).icerikler.map((x) => x.kisa_ad);
const lz = await liste(ziyaretci), la = await liste(uyeA);
kontrol('ziyaretçi listesi: herkese açık + üyelere özel (kilitli)', lz.includes(k.herkes) && lz.includes(k.uyeler) && !lz.includes(k.secili) && !lz.includes(k.liste) && !lz.includes(k.gizli) && !lz.includes(k.ileri) && !lz.includes(k.arsiv));
kontrol('yetkili üye listesinde seçili içerik var, liste dışı yok', la.includes(k.secili) && !la.includes(k.liste));
kontrol('üyelere özel metin ziyaretçi sayfa kaynağında yok', !(await (await ziyaretci.goto(B + '/icerik/' + k.uyeler)).text()).includes('Gizli metin'));
const kaynak = await (await ziyaretci.goto(B + '/icerik/' + k.herkes)).text();
kontrol('HTML enjeksiyonu kaçışlanır', kaynak.includes('&lt;img') && !(await ziyaretci.evaluate(() => window.__xss)));
kontrol('arama izni olsa da yayın öncesi noindex kalır', kaynak.includes('noindex'));
kontrol('/kabuk doğrudan açılamaz', (await ziyaretci.goto(B + '/kabuk/icerik/')).status() === 404);

// Yorumlar
await ziyaretci.goto(B + '/icerik/' + k.herkes);
await ziyaretci.fill('[data-yorum-form] [name=ad]', 'Ziyaretçi Ali');
await ziyaretci.fill('[data-yorum-form] [name=eposta]', 'ali@ornek.com');
await ziyaretci.fill('[data-yorum-form] [name=metin]', 'Faydalı bir yazı <b>kalın</b>');
await ziyaretci.check('[data-yorum-form] [name=kvkk]');
await ziyaretci.click('[data-yorum-form] button[type=submit]');
await ziyaretci.waitForSelector('text=onaylandıktan sonra yayınlanacak');
kontrol('ziyaretçi yorumu onay bekler', !(await ziyaretci.textContent('.icerik-yorumlar')).includes('Faydalı'));
const icH = tumIc.find((x) => x.kisa_ad === k.herkes).id;
const yorum = (await istek(yon, '/api/yonetim/icerikler/' + icH)).yorumlar[0];
await istek(yon, `/api/yonetim/yorumlar/${yorum.id}/yayinla`, {});
await ziyaretci.reload();
kontrol('onaylanan yorum yayında ve kaçışlı', (await ziyaretci.textContent('.icerik-yorumlar')).includes('Faydalı bir yazı <b>kalın</b>'));
kontrol('yorum e-postası sayfada görünmez', !(await ziyaretci.content()).includes('ali@ornek.com'));
await uyeA.goto(B + '/icerik/' + k.uyeler);
await uyeA.fill('[data-yorum-form] [name=metin]', 'Üye yorumu');
await uyeA.click('[data-yorum-form] button[type=submit]');
await uyeA.waitForSelector('.icerik-yorum >> text=Üye yorumu');
kontrol('yetkili üye yorumu hemen yayınlanır', true);
await uyeB.goto(B + '/icerik/' + k.uyeler);
kontrol('yetkisiz üye yorum formu görmez', !(await uyeB.$('[data-yorum-form]')));
kontrol('yetkisiz üye API ile yorum yapamaz', (await istek(uyeB, `/api/icerik/${k.uyeler}/yorum`, { metin: 'Deneme' })).durum === 404);
kontrol('yetkisiz üyenin yorumu onay bekler', (await istek(uyeB, `/api/icerik/${k.herkes}/yorum`, { metin: 'B yorumu' })).durum === 'bekliyor');
kontrol('null gövde 400 döner', (await uyeB.evaluate(async (y) => (await fetch(y, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'null' })).status, `/api/icerik/${k.herkes}/yorum`)) === 400);
kontrol('yorumu kapalı içeriğe yorum yapılamaz', (await istek(uyeA, `/api/icerik/${k.secili}/yorum`, { metin: 'Deneme' })).durum === 403);

// Yönetim ekranı: arayüzden içerik oluştur
await yon.goto(B + '/yonetim/icerikler/');
await yon.waitForSelector('[data-duzen] input');
await yon.click('[data-yeni]');
await yon.waitForSelector('text=Yeni içerik');
await yon.fill('[data-duzen] label:has-text("Başlık") input', 'Arayüzden yazı');
await yon.fill('[data-duzen] textarea:not([maxlength])', '## Ara başlık\n\nİlk paragraf **kalın**.');
await yon.click('text=Önizle');
kontrol('önizleme biçimi uygular', (await yon.innerHTML('.icerik-metin')).includes('<strong>kalın</strong>'));
await yon.check('input[name=gor][value=uyeler]');
await yon.click('[data-duzen] button:has-text("Oluştur")');
await yon.waitForSelector('[data-duzen] >> text=Kaydedildi.');
kontrol('arayüzden içerik oluşturuldu', (await yon.textContent('[data-liste]')).includes('Arayüzden yazı'));
await yon.screenshot({ path: SS + '/i-yonetim.png', fullPage: true });
await uyeA.goto(B + '/icerik/'); await uyeA.waitForSelector('.icerik-kart');
await uyeA.screenshot({ path: SS + '/i-liste.png', fullPage: true });
await ziyaretci.goto(B + '/icerik/' + k.uyeler); await ziyaretci.screenshot({ path: SS + '/i-kilit.png', fullPage: true });
await uyeA.goto(B + '/icerik/' + k.uyeler); await uyeA.screenshot({ path: SS + '/i-yazi.png', fullPage: true });
await ziyaretci.setViewportSize({ width: 390, height: 800 });
for (const y of ['/icerik/', '/icerik/' + k.herkes]) { await ziyaretci.goto(B + y); await ziyaretci.waitForTimeout(400); kontrol(`390px ${y} taşma yok`, (await ziyaretci.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0); }
await yon.setViewportSize({ width: 390, height: 900 }); await yon.goto(B + '/yonetim/icerikler/'); await yon.waitForSelector('[data-duzen] input');
kontrol('390px yönetim içerikler taşma yok', (await yon.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
console.log(h.length ? 'SORUNLAR:\n' + h.join('\n') : 'Tüm kontroller geçti, JS hatası yok.');
await t.close();
process.exit(h.length ? 1 : 0);
