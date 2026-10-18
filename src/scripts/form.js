// Site formlarını /api/talep'e gönderir. Robot doğrulaması (Turnstile) site anahtarı tanımlıysa yüklenir.
const ANAHTAR = document.documentElement.dataset.turnstile || '';
let turnstileYuklendi = null;

function turnstileYukle() {
  if (!ANAHTAR) return Promise.resolve(false);
  if (turnstileYuklendi) return turnstileYuklendi;
  turnstileYuklendi = new Promise((coz) => {
    const b = document.createElement('script');
    b.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    b.async = true; b.onload = () => coz(true); b.onerror = () => coz(false);
    document.head.appendChild(b);
  });
  return turnstileYuklendi;
}

function durum(form, metin, tur) {
  const d = form.querySelector('[data-form-durum]');
  if (!d) return;
  d.hidden = false; d.textContent = metin;
  d.style.background = tur === 'ok' ? 'var(--okb, #E3F4EA)' : 'var(--errb, #FCE4E6)';
  d.style.color = tur === 'ok' ? 'var(--ok, #1E6B3E)' : 'var(--err, #7A1F2B)';
}

export function formlar() {
  document.querySelectorAll('form[data-talep]').forEach((form) => {
    const kutu = form.querySelector('[data-turnstile]');
    let widget = null;
    form.addEventListener('focusin', async () => {
      if (widget !== null || !kutu) return;
      widget = false;
      if (await turnstileYukle() && window.turnstile) widget = window.turnstile.render(kutu, { sitekey: ANAHTAR, language: 'tr' });
    });
    form.addEventListener('submit', async (o) => {
      o.preventDefault();
      const v = new FormData(form);
      const g = { kaynak: form.dataset.talep, sayfa: location.pathname, kvkk: !!form.querySelector('[name=kvkk]:checked') };
      ['ad', 'firma', 'eposta', 'telefon', 'konu', 'mesaj', 'site', 'alan', 'not', 'web_adresi_tekrar'].forEach((k) => { if (v.get(k)) g[k] = String(v.get(k)); });
      const paket = document.getElementById('secili-paket');
      if (form.dataset.talep === 'paket' && paket && !/seçilmedi/i.test(paket.textContent)) g.paket = paket.textContent.trim();
      if (g.alan && !g.konu) g.konu = g.alan;
      if (!g.ad) return durum(form, 'Lütfen adınızı ve soyadınızı yazın.', 'hata');
      if (!g.eposta && !g.telefon) return durum(form, 'Size ulaşabilmemiz için e-posta veya telefon yazın.', 'hata');
      if (!g.kvkk) return durum(form, 'Devam etmek için KVKK aydınlatma metnini onaylayın.', 'hata');
      if (ANAHTAR) {
        const t = form.querySelector('[name="cf-turnstile-response"]');
        g.turnstile = t ? t.value : '';
        if (!g.turnstile) return durum(form, 'Robot doğrulaması tamamlanmadı. Birkaç saniye bekleyip tekrar deneyin.', 'hata');
      }
      const dugme = form.querySelector('button[type=submit]');
      dugme.disabled = true; const eski = dugme.textContent; dugme.textContent = 'Gönderiliyor…';
      try {
        const r = await fetch('/api/talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
        const s = await r.json().catch(() => ({}));
        if (r.ok && s.ok) {
          form.reset();
          durum(form, 'Teşekkürler, mesajınız bize ulaştı. En geç bir iş günü içinde size dönüyoruz.', 'ok');
        } else {
          durum(form, s.hata || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin veya info@idexya.com adresine yazın.', 'hata');
        }
      } catch (e) {
        durum(form, 'Bağlantı kurulamadı. Lütfen tekrar deneyin veya info@idexya.com adresine yazın.', 'hata');
      } finally {
        dugme.disabled = false; dugme.textContent = eski;
        if (widget && window.turnstile) window.turnstile.reset(widget);
      }
    });
  });
}
