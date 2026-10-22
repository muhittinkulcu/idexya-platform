// Yerel test için sahte Google token + BigQuery API (SAHTE veri). İlk sorguda iş "henüz bitmedi" döner, sonuç iki sayfada gelir.
// Kullanım: node tools/sahte/bigquery.mjs 8998   ·   wrangler dev --var IDOS_BQ_API:http://127.0.0.1:8998 --var IDOS_BQ_TOKEN_URL:http://127.0.0.1:8998/token ...
import http from 'http';
const kayit = [];
const MARKALAR = [['c1', 'Örnek Marka A', 'meta', 'act_1', 'TRY'], ['c1', 'Örnek Marka A', 'google', '111-111', 'TRY'], ['c2', 'Örnek Marka B', 'meta', 'act_2', 'TRY'], ['c3', 'Örnek Marka C', 'google', '333-333', 'TRY'], [null, null, 'meta', 'act_9', 'USD']];
const ALAN = ['metric_date:DATE', 'client_id:STRING', 'brand_name:STRING', 'platform:STRING', 'account_id:STRING', 'currency:STRING', 'spend:FLOAT', 'impressions:INTEGER', 'clicks:INTEGER', 'messaging_conversations:INTEGER', 'purchases:INTEGER', 'conversions:FLOAT'];
let tohum = 7; const r = () => (tohum = (tohum * 16807) % 2147483647) / 2147483647;
const satirlar = [];
for (let g = 28; g >= 1; g--) {
  const gun = new Date(Date.now() + 3 * 3600000 - g * 86400000).toISOString().slice(0, 10);
  for (const [c, b, p, a, para] of MARKALAR) {
    const harcama = Math.round((p === 'meta' ? 900 : 500) * (0.6 + r()) * 100) / 100;
    satirlar.push([gun, c, b, p, a, para, harcama, Math.round(harcama * 40), Math.round(harcama * 0.8),
      p === 'meta' ? Math.round(harcama / 45) : null, p === 'meta' ? Math.round(r() * 3) : null, p === 'google' ? Math.round(harcama / 60 * 10) / 10 : null]);
  }
}
const schema = { fields: ALAN.map((x) => ({ name: x.split(':')[0], type: x.split(':')[1] })) };
const kodla = (s) => ({ f: s.map((v) => ({ v: v === null ? null : String(v) })) });
const yarim = Math.ceil(satirlar.length / 2);
http.createServer((q, y) => {
  let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
    const yaz = (d, v) => { y.writeHead(d, { 'content-type': 'application/json' }); y.end(JSON.stringify(v)); };
    if (q.url === '/kayit') return yaz(200, kayit);
    if (q.url === '/token') { const p = new URLSearchParams(b); kayit.push({ tur: 'token', grant: p.get('grant_type'), jwt: (p.get('assertion') || '').split('.').length === 3 }); return yaz(200, { access_token: 'sahte-jeton', expires_in: 3600 }); }
    if (q.headers.authorization !== 'Bearer sahte-jeton') return yaz(401, { error: { message: 'yetkisiz' } });
    if (q.method === 'POST' && /\/queries$/.test(q.url)) { const g = JSON.parse(b); kayit.push({ tur: 'sorgu', sorgu: g.query, sinir: g.maximumBytesBilled, konum: g.location }); return yaz(200, { jobReference: { jobId: 'is1', location: g.location }, jobComplete: false }); }
    if (q.method === 'GET' && q.url.includes('/queries/is1')) {
      const u = new URL(q.url, 'http://x'); kayit.push({ tur: 'sonuc', sayfa: u.searchParams.get('pageToken') });
      if (!u.searchParams.get('pageToken')) return yaz(200, { jobComplete: true, schema, rows: satirlar.slice(0, yarim).map(kodla), pageToken: 's2', totalRows: String(satirlar.length) });
      return yaz(200, { jobComplete: true, schema, rows: satirlar.slice(yarim).map(kodla), totalRows: String(satirlar.length) });
    }
    yaz(404, { error: { message: 'yok' } });
  });
}).listen(Number(process.argv[2] || 8998), '127.0.0.1');
