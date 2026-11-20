// Asistan KVKK maskelemesi: Anthropic'e giden istek gövdesinde ziyaretçinin telefonu ve e-postası yok, yer tutucu var;
// talep kartı ve ziyaretçiye dönen metin asıl değerle; D1 kaydı maskesiz; fiyat aralığı ve saat maskelenmez.
// Uçtan uca: worker/asistan.js paketlenir, D1 yerine node:sqlite, Anthropic yerine sahte HTTP sunucusu.
// Kullanım: node tools/test-asistan-maske.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { maskele, geriKoy } from '../worker/maske.js';

const h = [];
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };

// --- Birim: kalıplar IDOS sohbet_asistani.maskele ile aynı davranır ---
{
  const g = {};
  const m = maskele('Numaram 0532 123 45 67, e-postam ali.veli@ornek.com.tr; tekrar: 0532 123 45 67', g);
  k('telefon ve e-posta yer tutucuya döner', m === 'Numaram [[T2]], e-postam [[E1]]; tekrar: [[T2]]');
  k('aynı değer aynı yer tutucuyu alır', Object.keys(g).length === 2 && g['[[T2]]'] === '0532 123 45 67' && g['[[E1]]'] === 'ali.veli@ornek.com.tr');
  k('geri koyma asıl metni verir', geriKoy(m, g) === 'Numaram 0532 123 45 67, e-postam ali.veli@ornek.com.tr; tekrar: 0532 123 45 67');
  for (const tel of ['+90 532 123 45 67', '05321234567', '5321234567', '0312-555-12-34', '(312) 555 12 34', '+44 20 7946 0958', '+905321234567'])
    k(`telefon sayılır: ${tel}`, maskele(`ara ${tel} lütfen`, {}) === 'ara [[T1]] lütfen');
  for (const duz of ['Bütçemiz 15.000 - 30.000 TL arası', 'Çalışma saatimiz 09.00-18.00', 'Aylık 1.250.000 TL ciro', '2026 yılında 120 sipariş', 'Sipariş no 12345678'])
    k(`maskelenmez: ${duz}`, maskele(duz, {}) === duz);
  k('sözlüksüz maske geri çevrilemez', maskele('0532 123 45 67 / a@b.co') === '[telefon] / [e-posta]');
}

// --- Uçtan uca ---
const paket = await build({ entryPoints: [new URL('../worker/asistan.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'asistan-maske-')), 'asistan.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const { asistanApi } = await import(gecici);

function sahteD1() {
  const s = new DatabaseSync(':memory:');
  s.exec('CREATE TABLE asistan_mesajlari (id TEXT PRIMARY KEY, sohbet_id TEXT NOT NULL, zaman TEXT NOT NULL, rol TEXT NOT NULL, metin TEXT NOT NULL, ek TEXT, ip_ozet TEXT, sayfa TEXT)');
  s.exec('CREATE TABLE asistan_onay (sohbet_id TEXT PRIMARY KEY, zaman TEXT NOT NULL, ip_ozet TEXT, sayfa TEXT)');
  const temiz = (p) => p.map((v) => (v === undefined ? null : v));
  class Ifade {
    constructor(sql, p = []) { this.sql = sql; this.p = p; }
    bind(...p) { return new Ifade(this.sql, p); }
    async first() { const r = s.prepare(this.sql).get(...temiz(this.p)); return r ? { ...r } : null; }
    async all() { return { results: s.prepare(this.sql).all(...temiz(this.p)).map((r) => ({ ...r })) }; }
    async run() { s.prepare(this.sql).run(...temiz(this.p)); return { meta: {} }; }
  }
  return { ham: s, prepare: (sql) => new Ifade(sql), async batch(l) { const c = []; for (const i of l) c.push(await i.all()); return c; } };
}

// Sahte Anthropic: gelen gövdeleri saklar. İlk çağrıda son kullanıcı mesajındaki yer tutucularla talep kartı aracını
// çağırır; araç sonucundan sonra yer tutucuyu içeren bir metin yazar.
const gelen = [];
const sunucu = http.createServer((q, y) => {
  let ham = '';
  q.on('data', (p) => (ham += p));
  q.on('end', () => {
    gelen.push(ham);
    const g = JSON.parse(ham);
    const son = g.messages[g.messages.length - 1];
    y.setHeader('content-type', 'application/json');
    if (typeof son.content === 'string') {
      const e = (son.content.match(/\[\[E\d+\]\]/) || [''])[0], t = (son.content.match(/\[\[T\d+\]\]/) || [''])[0];
      y.end(JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'tu_1', name: 'talep_karti_goster', input: { ad: 'Maske Deneme', eposta: e, telefon: t, konu: 'Google Ads teklifi', ozet: `Bütçe 15.000 - 30.000 TL, aranma saati 09.00-18.00, dönüş ${t}` } }] }));
    } else {
      const t = g.messages[g.messages.length - 2].content.find((c) => c.type === 'tool_use').input.telefon;
      y.end(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: `Kartı ${t} numarasıyla hazırladım; kontrol edip gönderin.` }] }));
    }
  });
});
await new Promise((r) => sunucu.listen(0, '127.0.0.1', r));
const db = sahteD1();
const env = { DB: db, ANTHROPIC_API_KEY: 'test-anahtar', ASISTAN_API_URL: `http://127.0.0.1:${sunucu.address().port}/v1/messages` };

const TEL = '0532 123 45 67', EP = 'maske.deneme@ornek.com', TEL2 = '+90 312 555 12 34';
const mesajlar = [
  { rol: 'ziyaretci', metin: `Merhaba, eski numaram ${TEL2}` },
  { rol: 'asistan', metin: `Not aldım: ${TEL2}. Size nasıl yardımcı olabilirim?` },
  { rol: 'ziyaretci', metin: `Google Ads teklifi istiyorum. Bütçemiz 15.000 - 30.000 TL, 09.00-18.00 arası arayın. Adım Maske Deneme, ${EP}, ${TEL}` }
];
const istek = new Request('https://idexya.com/api/asistan/mesaj', { method: 'POST', headers: { origin: 'https://idexya.com', 'content-type': 'application/json' }, body: JSON.stringify({ kvkk: true, sohbet: 'sohbet-maske-0001', sayfa: '/', mesajlar }) });
const yanit = await (await asistanApi(istek, env, 'mesaj')).json();

const tum = gelen.join('\n');
k('sağlayıcıya iki çağrı gitti (araç + sonuç)', gelen.length === 2);
k('sağlayıcı gövdesinde e-posta yok', !tum.includes(EP) && !/maske\.deneme@/.test(tum));
k('sağlayıcı gövdesinde telefonlar yok', !tum.includes(TEL) && !tum.includes(TEL2) && !tum.includes('5321234567'));
k('sağlayıcı gövdesinde yer tutucular var', tum.includes('[[E') && tum.includes('[[T'));
k('geçmişteki asistan mesajı da maskeli', JSON.parse(gelen[0]).messages[1].content.includes('[[T1]]'));
k('fiyat aralığı ve saat sağlayıcıya aynen gitti', tum.includes('15.000 - 30.000 TL') && tum.includes('09.00-18.00'));
k('ad maskelenmez (kalıp yok)', tum.includes('Maske Deneme'));
k('talep kartı asıl e-postayla', yanit.kart && yanit.kart.eposta === EP);
k('talep kartı asıl telefonla', yanit.kart && yanit.kart.telefon === TEL);
k('kart özetinde yer tutucu kalmaz', yanit.kart && yanit.kart.mesaj.includes(TEL) && !/\[\[[TE]\d+\]\]/.test(yanit.kart.mesaj));
k('ziyaretçiye dönen metin asıl değerle', yanit.metin === `Kartı ${TEL} numarasıyla hazırladım; kontrol edip gönderin.`);
const kayitlar = db.ham.prepare('SELECT rol, metin, ek FROM asistan_mesajlari ORDER BY rowid').all();
k('D1 ziyaretçi kaydı maskesiz (eskisi gibi)', kayitlar[0].rol === 'ziyaretci' && kayitlar[0].metin.includes(EP) && kayitlar[0].metin.includes(TEL));
k('D1 asistan kaydında yer tutucu yok', kayitlar[1].rol === 'asistan' && !/\[\[[TE]\d+\]\]/.test(kayitlar[1].metin + kayitlar[1].ek));

sunucu.close();
console.log(h.length ? 'SORUNLAR:\n' + h.join('\n') : 'Tüm kontroller geçti.');
process.exit(h.length ? 1 : 0);
