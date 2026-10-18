// Üye sayfaları (üye ol, giriş, hesabım, şifre yenile) için ortak yardımcılar.
import { robotBagla } from './form.js';
export async function uyeIstek(yol, govde) {
  const r = await fetch('/api/uye/' + yol, govde === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) });
  const s = await r.json().catch(() => ({ ok: false, hata: 'Sunucuya ulaşılamadı. Biraz sonra tekrar deneyin.' }));
  if (!r.ok || !s.ok) { const h = new Error(s.hata || 'İşlem yapılamadı.'); h.durum = r.status; throw h; }
  return s;
}
export function durumYaz(form, metin, tur) {
  const d = form.querySelector('[data-form-durum]');
  d.hidden = !metin; d.textContent = metin || '';
  d.style.background = tur === 'ok' ? 'var(--okb)' : 'var(--errb)';
  d.style.color = tur === 'ok' ? 'var(--ok)' : 'var(--err)';
}
// Form gönderimini bağlar: hazirla(veri) hata metni döndürürse gönderilmez.
export function formBagla(form, yol, hazirla, basarili) {
  const robot = robotBagla(form);
  form.addEventListener('submit', async (o) => {
    o.preventDefault();
    const veri = Object.fromEntries(new FormData(form));
    form.querySelectorAll('input[type=checkbox]').forEach((c) => { veri[c.name] = c.checked; });
    const sorun = hazirla ? hazirla(veri) : null;
    if (sorun) return durumYaz(form, sorun, 'hata');
    if (robot.gerekli) { veri.turnstile = robot.jeton(); if (!veri.turnstile) return durumYaz(form, 'Robot doğrulaması tamamlanmadı. Birkaç saniye bekleyip tekrar deneyin.', 'hata'); }
    const d = form.querySelector('button[type=submit]'); const eski = d.textContent;
    d.disabled = true; d.textContent = 'Gönderiliyor…'; durumYaz(form, '');
    try { const s = await uyeIstek(yol, veri); await basarili(s, veri); }
    catch (h) { durumYaz(form, h.message, 'hata'); }
    finally { d.disabled = false; d.textContent = eski; robot.sifirla(); }
  });
}
