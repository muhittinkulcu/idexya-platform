// Metin sayfası ve metin şablonları denetimleri (tools/test-sablon.mjs içinden çağrılır; tek başına çalışmaz).
// Ayrıştırma (başlık, madde, tablo, kalın), değişken doldurma ve "—", uzun metnin sayfalara akması, HTML/komut dizisi içeren
// değerin düz metin kalması, taslak damgası, şablon içerikleri, ayar alanları, üretilen belge ucu (yetki, PDF yapısı).
import { metinAyristir, metinYerlesim, metinPlani, planSusle, degiskenleriBul, degerTemizle, satirla, DAMGA_METNI, SINIR, sayfaKosulu } from '../src/scripts/yonetim/sablon-metin.js';
import { TANIMLAR, MUSTERI_ALANLARI, degerleriHazirla, varsayilan, ajansDegerleri, tutarYaziyla, sayiYaziyla, fiyatDegisim } from '../src/scripts/yonetim/sablon-tanim.js';
import { SABLON_ICERIK } from '../worker/sablon-icerik.js';
import { sayfalariDenetle } from '../worker/belge-sablon.js';

// Sahte ölçü: karakter başına boyutun yarısı (kalın biraz geniş)
const olc = (m, f) => [...m].length * f.boyut * 0.5 * (f.kalin ? 1.06 : 1);
const yazilar = (sayfa) => sayfa.filter((o) => o.t === 'yazi').map((o) => o.metin);

export async function calistir({ k, istek, post, jsn, db, r2, env, B, worker, pdfOlustur, jpeg }) {
  // --- Ayrıştırma ---
  const b = metinAyristir('# Başlık\n## Alt başlık\nDüz **kalın** metin\n- madde bir\n- [ ] kutu\n- [x] dolu\n> not\n// gizli not\n| A | B |\n|---|---|\n| 1 | **2** |\n@imza\n| Ajans | Müşteri |\n@sayfa\nson', {});
  k('metin: başlık 1 ve 2', b[0].tur === 'baslik' && b[0].seviye === 1 && b[1].seviye === 2 && b[0].parcalar[0].metin === 'Başlık');
  k('metin: kalın parça ayrılır', b[2].tur === 'paragraf' && b[2].parcalar.length === 3 && b[2].parcalar[1].kalin && b[2].parcalar[1].metin === 'kalın' && !b[2].parcalar[0].kalin);
  k('metin: madde ve işaret kutuları', b[3].tur === 'madde' && !b[3].kutu && b[4].kutu === 'bos' && b[5].kutu === 'dolu');
  k('metin: not kutusu; // düzenleyici notu PDF\'e girmez', b[6].tur === 'not' && !JSON.stringify(b).includes('gizli not'));
  const tb = b.find((x) => x.tur === 'tablo' && !x.imza);
  k('metin: tablo başlıklı, ayraç satırı atlanır, hücrede kalın', tb && tb.baslikli && tb.satirlar.length === 2 && tb.satirlar[1][1][0].kalin && tb.satirlar[1][1][0].metin === '2');
  k('metin: @imza tablosu ve @sayfa', b.some((x) => x.tur === 'tablo' && x.imza) && b.some((x) => x.tur === 'sayfa') && b[b.length - 1].parcalar[0].metin === 'son');

  // --- Değişkenler ---
  const d1 = metinAyristir('Sayın {yetkili}, {firma} için {yok_boyle}.', { yetkili: 'Ayşe Örnek', firma: 'Örnek Mobilya Ltd. Şti.' });
  k('değişken dolar, eksik değişken "—" olur', d1[0].parcalar[0].metin === 'Sayın Ayşe Örnek, Örnek Mobilya Ltd. Şti. için —.');
  k('boş değer de "—" olur', metinAyristir('A {x} B', { x: '   ' })[0].parcalar[0].metin === 'A — B');
  k('değişkenler bulunur (koşuldakiler dahil, düzenleyici notu hariç)', degiskenleriBul('?{ton=2} {a} ve {b}\n// {c}').join() === 'ton,a,b');
  const kos = metinAyristir('?{ton=1} bir\n?{ton=2} iki\n?{ton!=1} değil bir\n?{x=} boş\n?{y=a,b} ab', { ton: '2', y: 'b' });
  k('satır koşulu: =, !=, boş ve seçenekli', kos.map((x) => x.parcalar[0].metin).join('|') === 'iki|değil bir|boş|ab');
  k('sayfa koşulu', sayfaKosulu('ek_1b=evet', { ek_1b: 'evet' }) && !sayfaKosulu('ek_1b=evet', { ek_1b: 'hayir' }) && sayfaKosulu('', {}));
  const sat = metinAyristir('| No | Tutar |\n|---|---|\n| {faturalar} |', { faturalar: [['F1', '10 TL'], ['F2', '20 TL']] });
  k('satırlar değişkeni tablo satırlarına açılır', sat[0].satirlar.length === 3 && sat[0].satirlar[2][0][0].metin === 'F2');
  k('boş satırlar değişkeni tek "—" satırı olur', metinAyristir('| A | B |\n|---|---|\n| {l} |', { l: [] })[0].satirlar[1].map((h) => h[0].metin).join() === '—,—');

  // --- Güvenlik: değer düz metin kalır ---
  const kotu = '<img src=x onerror=alert(1)><script>alert(1)</script> **kalın değil** | sütun | {firma} # başlık';
  const g = metinAyristir('Değer: {v}', { v: kotu, firma: 'GİZLİ' });
  k('HTML/komut içeren değer düz metin: tek parça, kalın yok, iç içe değişken doldurulmaz', g.length === 1 && g[0].tur === 'paragraf' && g[0].parcalar.length === 1 && !g[0].parcalar[0].kalin
    && g[0].parcalar[0].metin === 'Değer: ' + kotu && !g[0].parcalar[0].metin.includes('GİZLİ'));
  const gt = metinAyristir('| A |\n|---|\n| {v} |\n| {l} |', { v: '| x | y |', l: [['**b**', '<b>c</b>']] });
  k('tablo hücresindeki değer yeni sütun açmaz, satır değeri biçimlenmez', gt[0].satirlar[1].length === 1 && gt[0].satirlar[1][0][0].metin === '| x | y |' && gt[0].satirlar[2][0][0].metin === '**b**' && !gt[0].satirlar[2][0][0].kalin);
  k('değer temizliği: denetim ve yön karakterleri atılır, satır sonu boşluk olur', degerTemizle('a\u0000b\nc\u202ed\t') === 'a b c d');
  k('değer uzunluğu sınırlı', degerTemizle('x'.repeat(5000)).length === SINIR.deger && degerTemizle({ a: 1 }) === '');
  const gop = metinYerlesim(g, olc);
  k('çizim listesinde değer yalnız "yazi" işlemi metni olarak bulunur', gop.flat().filter((o) => o.t === 'yazi').map((o) => o.metin).join(' ').includes('<script>alert(1)</script>') && gop.flat().every((o) => ['yazi', 'cizgi', 'kutu', 'nokta', 'onay', 'gorsel'].includes(o.t)));

  // --- Satır kırma ve sayfalara akış ---
  const s1 = satirla([{ metin: 'bir iki üç dört beş altı yedi', kalin: false }], 27 * 0.5 * 12, 27, olc);
  k('satır kırma sözcük sınırında', s1.length > 1 && s1.every((s) => s.en <= 27 * 0.5 * 12 + 0.01) && s1.map((s) => s.parcalar.map((p) => p.metin).join('')).join(' ') === 'bir iki üç dört beş altı yedi');
  const s2 = satirla([{ metin: 'x'.repeat(200), kalin: false }], 500, 27, olc);
  k('satırdan uzun sözcük harf harf bölünür, karakter kaybolmaz', s2.length > 1 && s2.map((s) => s.parcalar.map((p) => p.metin).join('')).join('').length === 200);
  const uzun = Array.from({ length: 140 }, (_, i) => `${i + 1}. Paragraf: Ajans hizmetleri mesleğin gerektirdiği özen ve dürüstlükle yürütür; ayrıntılar eklerdedir.`).join('\n');
  const us = metinYerlesim(metinAyristir(uzun, {}), olc);
  const tumYazi = us.map(yazilar).flat().join(' ');
  k('uzun metin birden çok sayfaya bölünür', us.length >= 3);
  k('bölünen metinde paragraf kaybolmaz ve sıra korunur', tumYazi.includes('1. Paragraf') && tumYazi.includes('140. Paragraf') && tumYazi.indexOf('70. Paragraf') < tumYazi.indexOf('71. Paragraf'));
  k('hiçbir yazı alt sınırı aşmaz', us.every((p) => p.filter((o) => o.t === 'yazi').every((o) => o.y + 39 <= 2150 + 1)));
  const ut = metinYerlesim(metinAyristir('| Başlık A | Başlık B |\n|---|---|\n' + Array.from({ length: 90 }, (_, i) => `| satır ${i + 1} | değer |`).join('\n'), {}), olc);
  k('uzun tablo sayfalara bölünür, başlık her sayfada tekrarlanır', ut.length >= 2 && ut.every((p) => yazilar(p).includes('Başlık A')) && ut.map(yazilar).flat().filter((x) => /^satır \d+$/.test(x)).length === 90);
  const bas = metinYerlesim(metinAyristir(Array.from({ length: 46 }, () => 'Dolgu satırı').join('\n') + '\n## Sondaki başlık\nİçerik', {}), olc);
  k('başlık sayfa sonunda yalnız kalmaz', bas.length === 2 && yazilar(bas[1]).includes('Sondaki başlık'));

  // --- Antet, alt bilgi, taslak damgası ---
  const plan = planSusle(metinPlani([{ tip: 'kapak', ad: 'Kapak', gorsel: '/x.jpg', metinler: {} }, { tip: 'metin', ad: 'Metin', metin: uzun, metinler: { paraf: 'evet' } }], {}, olc), { taslak: true, belgeNo: 'SZL-2026-001', altSatir: 'Idexya · 0507 870 06 29' });
  k('taslak: her sayfanın üstünde damga (kapak dahil)', plan.length >= 4 && plan.every((p) => p.ek.some((o) => o.t === 'yazi' && o.metin === DAMGA_METNI && o.y < 100)));
  k('metin sayfasında logo, turuncu çizgi, "Sayfa X / Y" ve belge no', plan.slice(1).every((p, i) => p.ek.some((o) => o.t === 'gorsel' && o.ad === 'logo') && p.ek.some((o) => o.t === 'cizgi' && o.renk === '#eb7305')
    && p.ek.some((o) => o.metin === `Sayfa ${i + 2} / ${plan.length}`) && p.ek.some((o) => o.metin === 'SZL-2026-001')));
  k('paraf satırı yalnız paraflı sayfada', plan.slice(1).every((p) => p.ek.some((o) => /^Paraf:/.test(o.metin || ''))) && !plan[0].ek.some((o) => /^Paraf:/.test(o.metin || '')));
  k('hazır şablonda damga yok', planSusle(metinPlani([{ tip: 'metin', ad: 'M', metin: 'a', metinler: {} }], {}, olc), { taslak: false })[0].ek.every((o) => o.metin !== DAMGA_METNI));

  // --- Şablon içerikleri ---
  const bugun = '2026-11-12';
  const ajans = ajansDegerleri({ firma_ad: 'Idexya | Good Things', telefon: '0507 870 06 29', eposta: 'info@idexya.com', adres: 'Ankara', sehir: 'Ankara' });
  const musteri = { firma: 'Örnek Mobilya Ltd. Şti.', ad: 'Ayşe Örnek', eposta: 'ayse@ornekmobilya.com.tr' };
  const tanimli = (tur) => {
    const t = TANIMLAR[tur], ham = {};
    const bg = { tarih: bugun, belgeNo: 'X-2026-001', musteri, ajans };
    for (const a of MUSTERI_ALANLARI) ham[a.k] = musteri[a.kaynak];
    for (const a of t.alanlar) ham[a.k] = varsayilan(a, bg);
    return { ham, bg };
  };
  for (const [id, ic] of Object.entries(SABLON_ICERIK)) {
    k(`${id}: sunucu denetiminden geçer`, !sayfalariDenetle(ic.sayfalar, id).hata);
    const { ham, bg } = tanimli(id);
    const d = degerleriHazirla(id, ham, bg);
    const bilinen = new Set([...Object.keys(d)]);
    const eksik = ic.sayfalar.flatMap((s) => degiskenleriBul(s.metin || '')).filter((v) => !bilinen.has(v));
    k(`${id}: metindeki her değişken tanımlı (ayar, müşteri, form ya da hesap)`, !eksik.length);
    if (eksik.length) console.log('   eksik:', eksik.join(', '));
  }
  const say = (id, ham2 = {}) => { const { ham, bg } = tanimli(id); const d = degerleriHazirla(id, { ...ham, ...ham2 }, bg); return metinPlani(SABLON_ICERIK[id].sayfalar, d, olc); };
  k('erişim talebi 2 sayfa', say('erisim').length === 2);
  const e2 = say('erisim', { erisim: ['erisim_meta', 'erisim_pazaryeri'] }).map((p) => (p.ops ? yazilar(p.ops) : [])).flat().join(' ');
  k('erişim tablosu yalnız seçilen platformları basar', e2.includes('Pazaryeri') && e2.includes('Meta') && !e2.includes('Search Console') && !e2.includes('Tag Manager'));
  const o1 = say('odeme_hatirlatma', { ton: '1' }), o2 = say('odeme_hatirlatma', { ton: '2' });
  const o1y = o1.flatMap((p) => yazilar(p.ops)).join(' '), o2y = o2.flatMap((p) => yazilar(p.ops)).join(' ');
  k('ödeme hatırlatma: ton 1 kibar tek sayfa, ton 2 kesin', o1.length === 1 && /Ödeme hatırlatması/.test(o1y) && !/ikinci bildirim/.test(o1y) && /ikinci bildirim/.test(o2y));
  k('ödeme hatırlatma: "resmî ihtarname değildir" iki tonda da var; avukat notu PDF\'te yok', /resmî ihtarname değildir/.test(o1y.replace(/\s+/g, ' ')) && /resmî ihtarname değildir/.test(o2y.replace(/\s+/g, ' ')) && !/avukatla teyit/.test(o2y));
  k('ödeme hatırlatma: faiz oranı değişkenden basılır', /yıllık %43/.test(o2y) && !SABLON_ICERIK.odeme_hatirlatma.sayfalar.some((s) => /%43/.test(s.metin)));
  k('fiyat güncelleme 1 sayfa', say('fiyat_guncelleme', { fiyat_satirlari: [{ hizmet: 'Meta Reklam Yönetimi', eski: '20.000', yeni: '23.000' }] }).length === 1);
  const tsl = say('teslim').length;
  k('teslim tutanağı 3–4 sayfa (kapak dahil)', tsl >= 3 && tsl <= 4);
  const szA = say('sozlesme'), szB = say('sozlesme', { ekler: ['ek_1a', 'ek_1b', 'ek_2'] });
  k('sözleşme: seçilmeyen ek PDF\'e girmez', !szA.some((p) => p.sayfa.ad.startsWith('Ek-1B')) && szB.some((p) => p.sayfa.ad.startsWith('Ek-1B')) && szB.length > szA.length);
  k('sözleşme: müşteri tacir değilse yetki şartı basılmaz', !say('sozlesme', { musteri_tacir: 'hayir' }).flatMap((p) => p.ops ? yazilar(p.ops) : []).join(' ').includes('İcra Daireleri yetkilidir'));

  // --- Tanımlar ve hesaplar ---
  k('yazıyla: 12.500 TL', tutarYaziyla(1250000) === 'on iki bin beş yüz Türk lirası' && sayiYaziyla(1001) === 'bin bir' && sayiYaziyla(2000000) === 'iki milyon' && tutarYaziyla(null) === '');
  const od = degerleriHazirla('odeme_hatirlatma', { ton: '2', faturalar: [{ no: 'IDX1', tarih: '2026-10-01', vade: '2026-10-08', tutar: '30.000' }, { no: 'IDX2', tarih: '2026-11-01', vade: '2026-11-08', tutar: '12.000,50' }] }, { tarih: bugun, musteri, ajans });
  k('ödeme: toplam "42.000,50 TL", gecikme 35 gün, tarih 08.10.2026', od.toplam_borc === '42.000,50 TL' && od.gecikme_gun === '35' && od.faturalar[0][2] === '08.10.2026' && od.tarih === '12.11.2026');
  k('fiyat değişimi: %15 artış, değişmedi', fiyatDegisim(2000000, 2300000) === '%15 artış' && fiyatDegisim(100, 100) === 'Değişmedi');
  k('fiyat güncelleme: 30 günden kısa bildirimde uyarı', !!TANIMLAR.fiyat_guncelleme.uyari({}, { yururluk_tarihi: '2026-11-20' }, { tarih: bugun }) && !TANIMLAR.fiyat_guncelleme.uyari({}, { yururluk_tarihi: '2027-01-01' }, { tarih: bugun }));
  // --- Veri asgarisi: müşteri VKN'si yalnız şirket (10 hane); TCKN (11 hane) girilemez ---
  const { vknDenetle } = await import('../src/scripts/yonetim/sablon-tanim.js');
  const vb = { tarih: bugun, musteri, ajans };
  const vkn = (x) => degerleriHazirla('sozlesme', { firma_vkn: x }, vb).firma_vkn;
  k('VKN: 10 hane kabul', vknDenetle('1234567890') === '' && vkn('1234567890') === '1234567890');
  k('VKN: 11 hane (TCKN) açık mesajla reddedilir ve belgeye girmez', /TCKN girilemez/.test(vknDenetle('12345678901')) && vkn('12345678901') === '');
  k('VKN: harf reddedilir', !!vknDenetle('12345abcde') && vkn('12345abcde') === '');
  k('VKN: boş bırakılabilir, belgede "—"', vknDenetle('') === '' && metinAyristir('VKN {firma_vkn}', degerleriHazirla('sozlesme', { firma_vkn: '' }, vb))[0].parcalar[0].metin === 'VKN —');
  k('sözleşme metninde serbest vergi alanı yok, VKN ayrı alan', !SABLON_ICERIK.sozlesme.sayfalar.some((x) => /\{firma_vergi\}/.test(x.metin || '')) && TANIMLAR.sozlesme.alanlar.find((a) => a.k === 'firma_vkn').tur === 'vkn');
  // --- IBAN boşsa ödeme hatırlatma hesap cümlesi ---
  const ibansiz = (ton) => metinPlani(SABLON_ICERIK.odeme_hatirlatma.sayfalar, degerleriHazirla('odeme_hatirlatma', { ton }, { tarih: bugun, musteri, ajans }), olc).flatMap((p) => yazilar(p.ops)).join(' ');
  k('IBAN boşsa "Hesap bilgilerimiz faturada yer almaktadır." (iki tonda), "IBAN: —" yok', [ibansiz('1'), ibansiz('2')].every((x) => x.includes('Hesap bilgilerimiz faturada yer almaktadır.') && !/IBAN/.test(x) && !/— numaralı/.test(x)));
  const ibanli = metinPlani(SABLON_ICERIK.odeme_hatirlatma.sayfalar, degerleriHazirla('odeme_hatirlatma', { ton: '1' }, { tarih: bugun, musteri, ajans: { ...ajans, ajans_iban: 'TR00 0000' } }), olc).flatMap((p) => yazilar(p.ops)).join(' ');
  k('IBAN doluysa yazılır', ibanli.includes('TR00 0000') && !ibanli.includes('faturada yer almaktadır'));
  k('ajans bilgisi boşsa belge "—" basar', metinAyristir('MCC: {ajans_mcc_id}', ajans)[0].parcalar[0].metin === 'MCC: —');

  // --- Sunucu: sürüm denetimi ---
  const v = (await jsn(await istek('belge-sablonlari/sozlesme'))).surum.sayfalar;
  k('sözleşme sürüm 1: kapak + ana metin + 3 ek (koşullu)', v.length === 5 && v[0].tip === 'kapak' && v.slice(1).every((s) => s.tip === 'metin') && v.filter((s) => s.kosul).length === 3);
  const v2 = structuredClone(v); v2[1].metin += '\nEk paragraf.';
  let r = await jsn(await post('belge-sablonlari/sozlesme/surum', { sayfalar: v2 }));
  const sz = (await jsn(await istek('belge-sablonlari'))).sablonlar.find((s) => s.id === 'sozlesme');
  k('taslak şablonda sürüm kaydı durumu taslak bırakır', r.ok && r.surum === 2 && sz.durum === 'taslak' && sz.aktif_surum === 2);
  k('sürüm 1 metni değişmedi', !(await jsn(await istek('belge-sablonlari/sozlesme/surum/1'))).surum.sayfalar[1].metin.includes('Ek paragraf.'));
  const kotuS = (deg) => { const x = structuredClone(v); deg(x); return post('belge-sablonlari/sozlesme/surum', { sayfalar: x }); };
  k('metin sınırı aşılırsa 422', (await kotuS((x) => { x[1].metin = 'a'.repeat(30001); })).status === 422);
  k('metin dizge değilse 422', (await kotuS((x) => { x[1].metin = { html: '<b>' }; })).status === 422);
  k('geçersiz koşul 422', (await kotuS((x) => { x[2].kosul = 'ek_1a=<script>'; })).status === 422);
  const temiz = sayfalariDenetle([{ tip: 'metin', ad: 'M', metin: 'a\u0000b\u202ec\r\nd', gorsel: 'https://kotu.example/a.jpg', metinler: {}, alanlar: {} }], 'erisim').sayfalar[0];
  k('metin sayfası: denetim karakterleri atılır, dış görsel yolu yok sayılır', temiz.metin === 'abc\nd' && temiz.gorsel === '');
  k('durum: taslak → hazır → taslak', (await jsn(await post('belge-sablonlari/sozlesme/durum', { durum: 'hazir' }))).degisen && (await jsn(await post('belge-sablonlari/sozlesme/durum', { durum: 'taslak' }))).degisen
    && db.ham.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem = 'sablon_durum'").get().n === 2);
  k('durum: önerilen şablon 409, geçersiz durum 422', (await post('belge-sablonlari/brief/durum', { durum: 'hazir' })).status === 409 && (await post('belge-sablonlari/sozlesme/durum', { durum: 'onerilen' })).status === 422);

  // --- Eski veritabanı geçişi: önerilen satırlar içerik alır ---
  {
    const { DatabaseSync } = await import('node:sqlite');
    const ham = new DatabaseSync(':memory:');
    for (const s of (await import('../worker/sema.js')).SEMA) ham.exec(s);
    for (const [id, ad] of [['teklif', 'Fiyat teklifi'], ['erisim', 'E'], ['sozlesme', 'S'], ['odeme_hatirlatma', 'O'], ['teslim', 'T'], ['fiyat_guncelleme', 'F']]) ham.prepare('INSERT INTO belge_sablonlari (id, tur, ad, durum, aktif_surum, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, id, ad, id === 'teklif' ? 'hazir' : 'onerilen', id === 'teklif' ? 1 : null, 'z', 'z');
    const sar = { prepare: (sql) => { const i = { sql, p: [], bind: (...p) => ({ ...i, p }), first: async () => { const x = ham.prepare(sql).get(...(i.p || [])); return x ? { ...x } : null; } }; i.bind = (...p) => ({ sql, p, first: async () => { const x = ham.prepare(sql).get(...p); return x ? { ...x } : null; } }); return i; },
      batch: async (l) => { for (const x of l) ham.prepare(x.sql).run(...(x.p || [])); } };
    await (await import('../worker/belge-sablon.js?gecis')).sablonTohumla(sar);
    const dur = Object.fromEntries(ham.prepare('SELECT id, durum, aktif_surum FROM belge_sablonlari').all().map((x) => [x.id, x.durum + (x.aktif_surum || '')]));
    k('geçiş: eski önerilen satırlar hazır/taslak olur, 6 yeni kart eklenir', dur.erisim === 'hazir1' && dur.sozlesme === 'taslak1' && dur.teslim === 'hazir1' && dur.brief === 'onerilen' && Object.keys(dur).length === 12);
    ham.exec("UPDATE belge_sablonlari SET durum = 'hazir' WHERE id = 'sozlesme'");
    await (await import('../worker/belge-sablon.js?gecis2')).sablonTohumla(sar);
    k('geçiş tekrar çalışınca elle değiştirilen duruma ve sürüme dokunmaz', ham.prepare("SELECT durum FROM belge_sablonlari WHERE id = 'sozlesme'").get().durum === 'hazir' && ham.prepare("SELECT COUNT(*) AS n FROM belge_sablon_surumleri WHERE sablon_id = 'sozlesme'").get().n === 1);
  }

  // --- Ayarlar: ajans bilgileri ---
  const ay = await jsn(await istek('ayarlar'));
  k('ayarlar: ajans alanları (Meta işletme kimliği, Google Ads yönetici hesabı, Google e-postası, IBAN, yetkili)', ['meta_isletme_id', 'google_ads_mcc', 'google_eposta', 'iban', 'ajans_yetkili', 'mersis', 'sehir'].every((x) => ay.alanlar.some((a) => a.k === x)));
  k('ayarlar: boş ajans bilgisi boş döner (belgede "—")', ay.degerler.meta_isletme_id === '' && ay.degerler.google_ads_mcc === '');
  k('ayarlar: geçersiz MCC, Meta kimliği, IBAN ve e-posta 422', (await post('ayarlar', { google_ads_mcc: '1234' })).status === 422 && (await post('ayarlar', { meta_isletme_id: 'abc' })).status === 422
    && (await post('ayarlar', { iban: 'DE00' })).status === 422 && (await post('ayarlar', { google_eposta: 'x' })).status === 422);
  r = await jsn(await post('ayarlar', { google_ads_mcc: '123-456-7890', meta_isletme_id: '1234567890123456', iban: 'TR00 0000 0000 0000 0000 0000 00', google_eposta: 'reklam@idexya.com' }));
  k('ayarlar: geçerli ajans bilgileri kaydedilir', r.ok && (await jsn(await istek('ayarlar'))).degerler.google_ads_mcc === '123-456-7890');

  // --- Üretilen belge: karta kayıt ---
  const pdf = pdfOlustur([jpeg(1654, 2339)], { baslik: 'Erişim talebi', yazar: 'Idexya' });
  const bf = (alan = {}, dosya = pdf) => { const f = new FormData(); f.append('dosya', new Blob([dosya], { type: 'application/pdf' }), 'ornek-mobilya-erisim-talebi.pdf'); for (const [a, x] of Object.entries({ musteri_id: 'm1', sablon_id: 'erisim', sablon_surum: '1', ad: 'Erişim talebi · Örnek Mobilya', belge_no: 'ERT-2026-001', tarih: '2026-11-12', ...alan })) f.append(a, x); return f; };
  const bYukle = (f, o = {}) => istek('belge-dosyalari', { method: 'POST', headers: o.origin === null ? {} : { origin: o.origin || B }, body: f, env: o.env });
  k('siradaki belge no: ERT-2026-001', (await jsn(await istek('belge-dosyalari/siradaki-no/erisim'))).belge_no === `ERT-${new Date().toISOString().slice(0, 4)}-001`);
  r = await jsn(await bYukle(bf()));
  k('belge PDF karta kaydedildi', r.d === 200 && r.ok && r2.m.has(`belge-dosyalari/m1/${r.id}.pdf`));
  const yeniId = r.id;
  const liste = (await jsn(await istek('belge-dosyalari/musteri/m1'))).belgeler;
  k('müşteri belgeleri: tür etiketiyle listelenir', liste.length === 1 && liste[0].tur_adi === 'Başlangıç ve erişim talebi' && liste[0].belge_no === 'ERT-2026-001' && liste[0].taslak === 0);
  k('günlüğe "Belge oluşturuldu" yazıldı, gönderim yok', db.ham.prepare("SELECT COUNT(*) AS n FROM kayitlar WHERE musteri_id = 'm1' AND baslik LIKE 'Belge oluşturuldu%' AND detay LIKE '%panel göndermedi%'").get().n === 1);
  r = await jsn(await bYukle(bf({ sablon_id: 'sozlesme', belge_no: 'SZL-2026-001' })));
  k('taslak şablondan üretilen belge "taslak" işaretli', r.ok && db.ham.prepare('SELECT taslak FROM belge_dosyalari WHERE id = ?').get(r.id).taslak === 1);
  const ac = await istek(`belge-dosyalari/${yeniId}/dosya`);
  const acB = new Uint8Array(await ac.arrayBuffer()), acM = new TextDecoder('latin1').decode(acB);
  k('belge açılır: application/pdf, nosniff, no-store', ac.status === 200 && ac.headers.get('content-type') === 'application/pdf' && ac.headers.get('x-content-type-options') === 'nosniff' && /no-store/.test(ac.headers.get('cache-control')));
  const xr = Number(/startxref\n(\d+)/.exec(acM)[1]);
  k('kaydedilen PDF yapısı geçerli (%PDF, xref, %%EOF)', acM.startsWith('%PDF-1.4') && acM.slice(xr, xr + 4) === 'xref' && acM.trimEnd().endsWith('%%EOF') && acB.byteLength === pdf.byteLength);
  // Sunucu: VKN alanı (yalnız doğrulama için gelir, saklanmaz) 11 hane ya da harf → 422; 10 hane ve boş kabul
  k('sunucu: TCKN (11 hane) VKN olarak gelirse 422 ve açık mesaj', await (async () => { const x = await jsn(await bYukle(bf({ sablon_id: 'sozlesme', belge_no: '', firma_vkn: '12345678901' }))); return x.d === 422 && /TCKN girilemez/.test(x.hata); })());
  k('sunucu: harfli VKN 422, 10 hane ve boş kabul', (await bYukle(bf({ sablon_id: 'sozlesme', belge_no: '', firma_vkn: 'abc' }))).status === 422
    && (await bYukle(bf({ sablon_id: 'sozlesme', belge_no: '', firma_vkn: '1234567890' }))).status === 200 && (await bYukle(bf({ sablon_id: 'sozlesme', belge_no: '', firma_vkn: '' }))).status === 200);
  // Belge numarası tekil: aynı numarayla aynı anda iki kayıt farklı numara alır
  const [c1, c2] = await Promise.all([bYukle(bf({ belge_no: 'ERT-2026-050' })).then(jsn), bYukle(bf({ belge_no: 'ERT-2026-050' })).then(jsn)]);
  const nolar = db.ham.prepare('SELECT belge_no FROM belge_dosyalari WHERE id IN (?, ?)').all(c1.id || '', c2.id || '').map((x) => x.belge_no);
  k('aynı anda iki kayıt: ikisi de kaydedilir, numaralar farklı', c1.ok && c2.ok && nolar.length === 2 && nolar[0] !== nolar[1] && [c1.belge_no, c2.belge_no].includes('ERT-2026-050'));
  k('belge no tekil dizini var', db.ham.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name = 'belge_dosya_no' AND sql LIKE '%UNIQUE%'").get().n === 1);
  k('PDF olmayan dosya 415', (await bYukle(bf({}, new TextEncoder().encode('<html><script>alert(1)</script>')))).status === 415);
  k('önerilen şablon 409, teklif şablonu 422, olmayan sürüm 422', (await bYukle(bf({ sablon_id: 'brief' }))).status === 409 && (await bYukle(bf({ sablon_id: 'teklif' }))).status === 422 && (await bYukle(bf({ sablon_surum: '99' }))).status === 422);
  k('olmayan müşteri 404, geçersiz tarih ve belge no 422', (await bYukle(bf({ musteri_id: 'yok' }))).status === 404 && (await bYukle(bf({ tarih: '2026-13-40' }))).status === 422 && (await bYukle(bf({ belge_no: '<b>x</b>' }))).status === 422);
  const yetkisiz = { DB: db, YEDEK: r2 };
  k('oturumsuz belge yükleme 401', (await bYukle(bf(), { env: yetkisiz })).status === 401);
  k('oturumsuz belge listesi ve dosya 401', (await istek('belge-dosyalari/musteri/m1', { env: yetkisiz })).status === 401 && (await istek(`belge-dosyalari/${yeniId}/dosya`, { env: yetkisiz })).status === 401);
  k('oturumsuz şablon durumu 401', (await istek('belge-sablonlari/sozlesme/durum', { method: 'POST', headers: { origin: B, 'content-type': 'application/json' }, body: '{"durum":"hazir"}', env: yetkisiz })).status === 401);
  k('Origin başlığı olmadan belge yükleme 403', (await bYukle(bf(), { origin: null })).status === 403);
  k('Origin başlığı olmadan şablon durumu ve sürüm kaydı 403', (await istek('belge-sablonlari/sozlesme/durum', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"durum":"hazir"}' })).status === 403
    && (await istek('belge-sablonlari/sozlesme/surum', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sayfalar: v }) })).status === 403);
  k('başka kaynaktan belge yükleme 403', (await bYukle(bf(), { origin: 'https://kotu.example' })).status === 403);
  k('R2 yokken belge yükleme 409', (await bYukle(bf(), { env: { DB: db, YEREL_GIRIS: 'evet' } })).status === 409);
  k('reddedilen yüklemeler depoya yazılmadı', [...r2.m.keys()].filter((a) => a.startsWith('belge-dosyalari/')).length === 6);
  void worker;
}
