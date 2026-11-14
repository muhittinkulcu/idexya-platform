// Sunucu tarafı ortak yardımcılar.
import { SEMA, EK_SUTUNLAR, EK_DIZINLER } from './sema.js';

export const GUVENLIK_BASLIKLARI = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store'
};

export const json = (veri, durum = 200) => new Response(JSON.stringify(veri), { status: durum, headers: { 'Content-Type': 'application/json; charset=utf-8', ...GUVENLIK_BASLIKLARI } });
export const hata = (mesaj, durum) => json({ ok: false, hata: mesaj }, durum);
export const simdi = () => new Date().toISOString();
export const kimlik = () => crypto.randomUUID();
export const kirp = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

let semaHazir = false;
export async function semaKur(db) {
  if (semaHazir) return;
  await db.batch(SEMA.map((s) => db.prepare(s)));
  for (const [tablo, sutun, tur] of EK_SUTUNLAR) {
    const r = await db.prepare(`PRAGMA table_info(${tablo})`).all();
    if (!r.results.some((x) => x.name === sutun)) {
      // Aynı anda iki istek eklemeye çalışırsa ikincisi "duplicate column" alır; bu zararsızdır.
      try { await db.prepare(`ALTER TABLE ${tablo} ADD COLUMN ${sutun} ${tur}`).run(); }
      catch (e) { if (!/duplicate column/i.test(String(e && e.message))) throw e; }
    }
  }
  await db.batch(EK_DIZINLER.map((s) => db.prepare(s)));
  semaHazir = true;
}

export async function ozet(metin) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
  return [...new Uint8Array(b)].slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
}

export async function islemYaz(db, kim, islem, hedef, detay) {
  await db.prepare('INSERT INTO islem_kaydi (id, zaman, kim, islem, hedef, detay) VALUES (?, ?, ?, ?, ?, ?)').bind(kimlik(), simdi(), kim, islem, hedef || null, detay || null).run();
}


export const EPOSTA_DESEN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Aynı kaynaktan gelmeyen yazma isteklerini reddeder (CSRF'e karşı; çerezler ayrıca SameSite=Lax).
export function ayniKaynak(istek) {
  const k = istek.headers.get('origin');
  try { return !!k && new URL(k).host === new URL(istek.url).host; } catch (e) { return false; }
}

export async function govdeOku(istek, sinir = 20000) {
  if (!(istek.headers.get('content-type') || '').includes('application/json')) return { hata: hata('Geçersiz istek', 415) };
  if (Number(istek.headers.get('content-length') || 0) > sinir) return { hata: hata('İstek çok büyük', 413) };
  try {
    const ham = await istek.text();
    if (ham.length > sinir) return { hata: hata('İstek çok büyük', 413) };
    const g = JSON.parse(ham);
    if (!g || typeof g !== 'object' || Array.isArray(g)) return { hata: hata('Geçersiz istek', 400) };
    return { g };
  } catch (e) { return { hata: hata('Geçersiz istek', 400) }; }
}

export const ipAl = (istek) => istek.headers.get('cf-connecting-ip') || 'yerel';

// Turnstile: gizli anahtar tanımlıysa zorunlu; değilse 'yapilandirilmadi' döner (sunucu yine hız sınırı uygular).
export async function robotDogrula(env, jeton, ip) {
  if (!env.TURNSTILE_SECRET) return 'yapilandirilmadi';
  const f = new FormData();
  f.append('secret', env.TURNSTILE_SECRET); f.append('response', kirp(jeton, 4096)); f.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
  const s = await r.json().catch(() => ({}));
  return s.success ? 'gecti' : 'kaldi';
}
