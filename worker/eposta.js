// E-posta bildirimleri (Muhittin, 26 Eki 2026): Cloudflare Email Service "send_email" bağlantısı (EPOSTA) ile işlem e-postası.
// Gönderim yalnız ayarlarda bildirim adresi girildiyse yapılır; idexya.com alan adı Cloudflare Email Sending'e eklenmeden
// gönderim başarısız olur ve hata ayarlar tablosuna (eposta_son_hata) yazılır, bildirimlerde görünür. Hiçbir hata asıl işlemi durdurmaz.
// Toplu/pazarlama e-postası için kullanılmaz. Gönderen adres wrangler.jsonc'taki allowed_sender_addresses ile sınırlıdır.
import { simdi, json, hata, islemYaz } from './ortak.js';
import { PANEL_ALAN, panelYoluMu } from './panel-yollar.js';

export const GONDEREN = { email: 'bildirim@idexya.com', name: 'Idexya Panel' };
const SITE = 'https://idexya.com';
const kok = (yol) => (panelYoluMu(yol) ? `https://${PANEL_ALAN}` : SITE);
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function ayar(db, k) { const r = await db.prepare('SELECT deger FROM ayarlar WHERE anahtar = ?').bind(k).first(); return r ? r.deger : null; }
async function hataYaz(db, metin) {
  await db.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme')
    .bind('eposta_son_hata', String(metin).slice(0, 500), simdi(), 'E-posta').run();
}
const kacis = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// satirlar: [etiket, değer] dizisi; bag: { metin, yol } panel ya da site bağlantısı.
function govde(baslik, satirlar, bag, alt) {
  const text = [baslik, '', ...satirlar.map(([e, d]) => `${e}: ${d}`), '', bag ? `${bag.metin}: ${kok(bag.yol)}${bag.yol}` : '', '', alt || 'Bu e-posta Idexya panelinden otomatik gönderildi.'].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1F2A3A;max-width:560px">
<h2 style="font-size:18px;margin:0 0 12px">${kacis(baslik)}</h2>
<table style="border-collapse:collapse">${satirlar.map(([e, d]) => `<tr><td style="padding:4px 12px 4px 0;color:#5B6B80;vertical-align:top">${kacis(e)}</td><td style="padding:4px 0;white-space:pre-wrap">${kacis(d)}</td></tr>`).join('')}</table>
${bag ? `<p style="margin:18px 0"><a href="${kok(bag.yol)}${kacis(bag.yol)}" style="background:#B84406;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${kacis(bag.metin)}</a></p>` : ''}
<p style="font-size:12px;color:#8A96A8">${kacis(alt || 'Bu e-posta Idexya panelinden otomatik gönderildi.')}</p></div>`;
  return { text, html };
}

export async function epostaGonder(env, { to, subject, text, html, replyTo }) {
  if (!env.EPOSTA || !EPOSTA.test(to || '')) return { ok: false, atlandi: true };
  try {
    const r = await env.EPOSTA.send({ from: GONDEREN, to, subject: subject.slice(0, 200), text, html, ...(replyTo && EPOSTA.test(replyTo) ? { replyTo } : {}) });
    if (await ayar(env.DB, 'eposta_son_hata')) await env.DB.prepare("DELETE FROM ayarlar WHERE anahtar = 'eposta_son_hata'").run();
    await env.DB.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme')
      .bind('eposta_son_gonderim', simdi(), simdi(), 'E-posta').run();
    return { ok: true, id: r && r.messageId };
  } catch (e) {
    await hataYaz(env.DB, (e && e.message) || 'Gönderilemedi').catch(() => {});
    return { ok: false, hata: e && e.message };
  }
}

// Ekibe bildirim: ayarlardaki "bildirim_eposta" adresine. Adres boşsa gönderilmez.
export async function ekibeBildir(env, baslik, satirlar, bag, replyTo) {
  try {
    const to = await ayar(env.DB, 'bildirim_eposta');
    if (!to) return { ok: false, atlandi: true };
    const g = govde(baslik, satirlar, bag);
    return await epostaGonder(env, { to, subject: baslik, ...g, replyTo });
  } catch (e) { return { ok: false, hata: e && e.message }; }
}

// Üyeye bildirim (yalnız ayarlarda açıksa). İçerik e-postaya yazılmaz; üye siteye girip okur.
export async function uyeyeBildir(env, to, baslik, satirlar, bag) {
  try {
    if (String(await ayar(env.DB, 'eposta_uye_bildirim') || '').toLocaleLowerCase('tr-TR') !== 'evet') return { ok: false, atlandi: true };
    const g = govde(baslik, satirlar, bag, 'Bu e-postayı Idexya müşteri alanındaki hesabınızla ilgili bir gelişme olduğu için aldınız.');
    return await epostaGonder(env, { to, subject: baslik, ...g });
  } catch (e) { return { ok: false, hata: e && e.message }; }
}

// Panel › Ayarlar › "Deneme e-postası gönder": Email Sending kurulumunu gerçek bir talep beklemeden doğrular.
export async function yonetimEpostaApi(db, env, yontem, yol, kim) {
  if (yol !== 'eposta/deneme') return null;
  if (yontem !== 'POST') return hata('Yöntem desteklenmiyor', 405);
  if (!env.EPOSTA || env.EPOSTA_ACIK !== 'evet') return hata('E-posta gönderimi kapalı (Email Sending kurulup EPOSTA_ACIK=evet yapılınca açılır)', 409);
  const to = await ayar(db, 'bildirim_eposta');
  if (!to) return hata('Önce Ayarlar’da bildirim e-postası adresini girip kaydedin', 409);
  const g = govde('Idexya panel: deneme e-postası', [['Gönderen', GONDEREN.email], ['İsteyen', kim.eposta], ['Zaman', new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })]], { metin: 'Paneli aç', yol: '/dashboard' });
  const r = await epostaGonder(env, { to, subject: 'Idexya panel: deneme e-postası', ...g });
  await islemYaz(db, kim.eposta, 'eposta_deneme', to, r.ok ? 'gönderildi' : 'başarısız');
  if (!r.ok) return hata('Gönderilemedi: ' + (r.hata || 'bilinmeyen hata') + ' · idexya.com, Cloudflare Email Sending’de doğrulanmış olmalı', 502);
  return json({ ok: true, alici: to });
}
