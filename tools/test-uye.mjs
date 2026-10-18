// Üyelik uçtan uca: üye ol → onay bekliyor → yönetici onaylar ve bölüm açar → üye görür → askı → şifre yenileme.
// Boş veritabanlı yerel `wrangler dev` ister (YEREL_GIRIS=evet). Güvenli çerez için adres localhost olmalı.
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const B = process.argv[2] || 'http://localhost:8787';
const SS = process.argv[3] || '.';
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const h = [];
const kontrol = (ad, k) => { console.log((k ? 'GEÇTİ ' : 'KALDI ') + ad); if (!k) h.push(ad); };
const sayfa = async (ctx) => { const s = await ctx.newPage(); s.on('pageerror', (e) => h.push('JS: ' + e.message)); return s; };
const uyeCtx = await t.newContext({ viewport: { width: 1280, height: 900 } });
const u = await sayfa(uyeCtx);
const E = 'deneme.uye@ornek.com', S1 = 'GucluSifre2026', S2 = 'YeniSifre2027x';

await u.goto(B + '/uye-ol');
const c = await u.$('[data-cerez="red"]'); if (c && await c.isVisible()) await c.click();
await u.click('button[type=submit]');
kontrol('boş üyelik formu uyarır', (await u.textContent('[data-form-durum]')).includes('Adınızı'));
await u.fill('[name=ad]', 'Deneme Üye'); await u.fill('[name=eposta]', E); await u.fill('[name=sifre]', 'kisa1');
await u.check('[name=kvkk]'); await u.click('button[type=submit]');
kontrol('zayıf şifre reddedilir', (await u.textContent('[data-form-durum]')).includes('10 karakter'));
await u.fill('[name=sifre]', S1); await u.fill('[name=neden]', 'Eğitimleri izlemek istiyorum.');
await u.click('button[type=submit]');
await u.waitForSelector('[data-tamam]:not([hidden])');
kontrol('üyelik talebi alındı', true);
// Aynı e-postayla ikinci kayıt da aynı yanıtı verir (adres sızdırmaz)
const ikinci = await u.evaluate(async (e) => (await fetch('/api/uye/kayit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad: 'Başka', eposta: e, sifre: 'BaskaSifre123', kvkk: true }) })).json(), E);
kontrol('kayıtlı e-posta sızdırılmaz', ikinci.ok === true);

await u.goto(B + '/giris');
await u.fill('[name=eposta]', E); await u.fill('[name=sifre]', 'yanlis-sifre1'); await u.click('button[type=submit]');
await u.waitForSelector('[data-form-durum]:not([hidden])');
kontrol('yanlış şifre genel mesaj', (await u.textContent('[data-form-durum]')).includes('E-posta veya şifre hatalı'));
await u.fill('[name=sifre]', 'BaskaSifre123'); await u.click('button[type=submit]'); await u.waitForTimeout(600);
kontrol('ikinci kayıt şifreyi değiştirmedi', (await u.textContent('[data-form-durum]')).includes('hatalı'));
await u.fill('[name=sifre]', S1); await u.click('button[type=submit]');
await u.waitForURL('**/hesabim**');
await u.waitForSelector('[data-icerik]:not([hidden])');
kontrol('bekleyen üye giriş yapar, onay bekliyor görür', !(await u.$eval('[data-bekliyor]', (e) => e.hidden)));
const cerez = (await uyeCtx.cookies()).find((x) => x.name === '__Host-idx_oturum');
kontrol('oturum çerezi HttpOnly + Secure + Lax', !!cerez && cerez.httpOnly && cerez.secure && cerez.sameSite === 'Lax');
kontrol('başlıkta Hesabım görünür', (await u.textContent('[data-uye-baglanti]')).includes('Hesabım'));

const y = await sayfa(await t.newContext({ viewport: { width: 1440, height: 900 } }));
await y.goto(B + '/yonetim/uyeler/');
await y.waitForSelector('[data-ayrinti] strong');
kontrol('menü rozeti 1 bekleyen üye', (await y.textContent('[data-sayac="uye"]')) === '1');
await y.screenshot({ path: SS + '/u-yonetim-bekleyen.png', fullPage: true });
await y.fill('[data-grup-form] [name=ad]', 'Eğitim katılımcıları'); await y.click('[data-grup-form] button');
await y.waitForSelector('[data-gruplar] >> text=Eğitim katılımcıları');
await y.click('[data-ayrinti] >> text="Onayla"');
await y.waitForSelector('[data-ayrinti] >> text=Durum: Onaylı.');
kontrol('yönetici onayladı', true);
await y.selectOption('[aria-label="Üyelere özel içerikler yetkisi"]', 'kullan');
await y.selectOption('[aria-label="Eğitimler yetkisi"]', 'gor');
await y.click('text=Yetkileri kaydet');
await y.waitForSelector('[data-ayrinti] >> text=Yetkiler kaydedildi.');
await y.check('[data-ayrinti] label:has-text("Eğitim katılımcıları") input');
await y.click('text=Grupları kaydet');
await y.waitForSelector('[data-ayrinti] >> text=Gruplar kaydedildi.');
kontrol('geçmişte yetki değişikliği yazılı', (await y.textContent('[data-ayrinti]')).includes('Kapalı → Görüntüle ve kullan'.replace('Kapalı', 'kapalı')));
await y.screenshot({ path: SS + '/u-yonetim-onayli.png', fullPage: true });

await u.reload(); await u.waitForSelector('[data-moduller] .uye-kart');
const mod = await u.textContent('[data-moduller]');
kontrol('üye açılan bölümleri görür', mod.includes('Üyelere özel içerikler') && mod.includes('Eğitimler') && mod.includes('Yakında açılacak'));
kontrol('üye açılmayan bölümü görmez', !mod.includes('Destek talepleri'));
await u.screenshot({ path: SS + '/u-hesabim.png', fullPage: true });

await y.click('[data-ayrinti] >> text="Askıya al"');
await y.waitForSelector('[data-ayrinti] >> text=Durum: Askıya alındı.');
const ben = await u.evaluate(async () => (await fetch('/api/uye/ben')).json());
kontrol('askıya alınan üyenin oturumu düşer', ben.ok && ben.uye === null);
await u.goto(B + '/giris'); await u.fill('[name=eposta]', E); await u.fill('[name=sifre]', S1); await u.click('button[type=submit]');
await u.waitForSelector('[data-form-durum]:not([hidden])');
kontrol('askıdaki üye giriş yapamaz', (await u.textContent('[data-form-durum]')).includes('aktif değil'));
await y.click('[data-ayrinti] >> text="Yeniden etkinleştir"');
await y.waitForSelector('[data-ayrinti] >> text=Durum: Onaylı.');
await y.click('text=Şifre yenileme bağlantısı oluştur');
const adres = await y.inputValue('[aria-label="Şifre yenileme bağlantısı"]');
kontrol('bağlantı jetonu # içinde', adres.includes('/sifre-yenile#') && adres.split('#')[1].length > 30);
await u.goto(adres.replace(/^https?:\/\/[^/]+/, B));
kontrol('jeton adres çubuğundan silinir', !u.url().includes('#'));
await u.fill('[name=sifre]', S2); await u.fill('[name=tekrar]', S2); await u.click('button[type=submit]');
await u.waitForSelector('text=Şifreniz değişti');
const tekrar = await u.evaluate(async (j) => (await fetch('/api/uye/sifre-yenile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jeton: j, sifre: 'BirBaska123456' }) })).status, adres.split('#')[1]);
kontrol('bağlantı ikinci kez kullanılamaz', tekrar === 410);
await u.goto(B + '/giris'); await u.fill('[name=eposta]', E); await u.fill('[name=sifre]', S2); await u.click('button[type=submit]');
await u.waitForURL('**/hesabim**'); kontrol('yeni şifreyle giriş', true);
const kaynak = await u.evaluate(async () => (await fetch('/api/uye/cikis', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: '{}' })).status);
kontrol('aynı kaynak başlığıyla çıkış çalışır', kaynak === 200);

// Kaba kuvvet: 8 hatalı denemeden sonra kilit
let son = 0;
for (let i = 0; i < 9; i++) son = await u.evaluate(async (e) => (await fetch('/api/uye/giris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eposta: e, sifre: 'yanlis' + Math.random() }) })).status, E);
kontrol('hatalı denemelerden sonra kilit (429)', son === 429);

for (const g of [390, 768]) {
  await u.setViewportSize({ width: g, height: 800 });
  for (const yol of ['/uye-ol', '/giris', '/hesabim', '/sifre-yenile']) { await u.goto(B + yol); await u.waitForTimeout(300); const tas = await u.evaluate(() => document.documentElement.scrollWidth - innerWidth); kontrol(`${g}px ${yol} taşma yok`, tas <= 0); }
}
await y.setViewportSize({ width: 390, height: 900 }); await y.goto(B + '/yonetim/uyeler/'); await y.waitForSelector('[data-ayrinti] strong');
kontrol('390px yönetim üyeler taşma yok', (await y.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
console.log(h.length ? 'SORUNLAR:\n' + h.join('\n') : 'Tüm kontroller geçti, JS hatası yok.');
await t.close();
process.exit(h.length ? 1 : 0);
