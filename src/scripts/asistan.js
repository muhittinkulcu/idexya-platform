// IDOS asistan sohbet penceresi (eski adı Idexya Asistan). Düğme sürüklenebilir; bırakılınca en yakın kenara yapışır,
// konum bu tarayıcıda hatırlanır. Pencere düğmenin bulunduğu kenara ve yüksekliğe göre açılır. Metinler güvenli biçimde (textContent) yazılır; yalnız site içi ve https bağlantıları tıklanır olur.
import { reklamBilgisi } from './reklam-iz.js';
import { robotBagla } from './form.js';
const ANAHTAR = 'idx-asistan';
const oku = () => { try { return JSON.parse(sessionStorage.getItem(ANAHTAR) || 'null'); } catch (e) { return null; } };
const yaz = (v) => { try { sessionStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch (e) {} };
const el = (t, o = {}, ...c) => { const e = document.createElement(t); for (const [k, v] of Object.entries(o)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } c.flat().forEach((x) => x != null && x !== false && e.append(x)); return e; };
const IKON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="4"></rect><path d="M12 8V4M12 4h.01"></path><path d="M9 13.5v1M15 13.5v1"></path><path d="M2 13v3M22 13v3"></path></svg>';
const KONUM = 'idx-asistan-konum';
let BASLIKLAR = {};
fetch('/arama.json').then((r) => r.json()).then((d) => { BASLIKLAR = Object.fromEntries(d.map((x) => [x.u, x.t])); }).catch(() => {});
const ONERILER = ['Hangi paket bana uygun?', 'Google Ads yönetimi nasıl çalışıyor?', 'E-ticaret sitem için ne yapabilirsiniz?', 'Ücretsiz analiz istiyorum'];

function satirIci(metin) {
  const f = document.createDocumentFragment();
  const re = /(https?:\/\/[^\s)]+|\/(?:tr|icerik|uye-ol|giris|hesabim)[^\s),.;]*|info@idexya\.com)/g;
  let i = 0, m;
  while ((m = re.exec(metin))) {
    f.append(metin.slice(i, m.index));
    const u = m[0];
    const href = u.includes('@') ? 'mailto:' + u : u;
    const a = el('a', { href, target: u.startsWith('http') ? '_blank' : null, rel: u.startsWith('http') ? 'noopener' : null }, u.startsWith('/') ? (BASLIKLAR[u.replace(/\/$/, '')] || BASLIKLAR[u] || 'ilgili sayfa') : u);
    f.append(a); i = m.index + u.length;
  }
  f.append(metin.slice(i));
  return f;
}
function bicim(metin) {
  const kap = el('div', { class: 'as-metin' });
  let liste = null;
  String(metin).split('\n').forEach((s) => {
    const t = s.trim();
    if (!t) { liste = null; return; }
    if (/^[-•*]\s+/.test(t)) { if (!liste) { liste = el('ul'); kap.append(liste); } liste.append(el('li', {}, satirIci(t.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '')))); }
    else { liste = null; kap.append(el('p', {}, satirIci(t.replace(/\*\*/g, '')))); }
  });
  return kap;
}

export function asistan() {
  if (document.querySelector('.as-dugme')) return;
  let durum = oku() || { sohbet: null, mesajlar: [], acik: false };
  let yapayZeka = null, bekliyor = false;
  const dugme = el('button', { type: 'button', class: 'as-dugme', 'aria-label': 'IDOS asistanı aç (sürükleyerek yerini değiştirebilirsiniz)', title: 'Sürükleyerek yerini değiştirebilirsiniz', 'aria-expanded': 'false', 'aria-controls': 'asistan' });
  dugme.innerHTML = '<i class="as-robot">' + IKON + '</i><span>IDOS’a sor</span>';
  const liste = el('div', { class: 'as-liste', role: 'log', 'aria-live': 'polite' });
  const girdi = el('textarea', { rows: '1', placeholder: 'Sorunuzu yazın…', 'aria-label': 'Mesajınız', maxlength: '1500' });
  const gonder = el('button', { type: 'submit', class: 'as-gonder', 'aria-label': 'Gönder' });
  gonder.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';
  const form = el('form', { class: 'as-form' }, girdi, gonder);
  const durumYazi = el('span', { class: 'as-durum' }, 'Genelde birkaç saniyede yanıt verir');
  const panel = el('section', { id: 'asistan', class: 'as-panel', role: 'dialog', 'aria-label': 'IDOS asistan', hidden: true },
    el('header', { class: 'as-bas' },
      (() => { const a = el('span', { class: 'as-avatar', 'aria-hidden': 'true' }); a.innerHTML = IKON; return a; })(),
      el('span', { class: 'as-baslik' }, el('strong', {}, 'IDOS asistan'), durumYazi),
      el('button', { type: 'button', class: 'as-kucult', 'aria-label': 'Pencereyi kapat', onclick: () => ac(false) }, '×')),
    liste, form,
    el('p', { class: 'as-not' }, 'Yanıtları yapay zekâ üretir, hata içerebilir. Sohbet hizmet kalitesi için kaydedilir; ', el('a', { href: '/tr/sayfa/kvkk-aydinlatma-metni', target: '_blank', rel: 'noopener' }, 'KVKK'), '.'));
  document.body.append(dugme, panel);

  const kaydir = () => { liste.scrollTop = liste.scrollHeight; };
  const balon = (rol, metin) => el('div', { class: 'as-balon as-' + rol }, rol === 'asistan' ? bicim(metin) : el('p', {}, metin));
  const eylemler = (anahtarlar) => el('div', { class: 'as-eylemler' }, anahtarlar.map((k) => k === 'whatsapp'
    ? el('a', { class: 'as-cip', href: 'https://wa.me/905078700629', target: '_blank', rel: 'noopener' }, 'WhatsApp’tan yaz')
    : el('button', { type: 'button', class: 'as-cip', onclick: () => kartGoster({ konu: 'Ücretsiz analiz', mesaj: '' }) }, 'Ücretsiz analiz iste')));

  function kartGoster(v) {
    const alan = (ad, etiket, deger, tip = 'text', zorunlu) => el('label', {}, etiket, el('input', { name: ad, type: tip, value: deger || '', required: zorunlu, autocomplete: { ad: 'name', eposta: 'email', telefon: 'tel', firma: 'organization' }[ad] || 'off' }));
    const durumP = el('p', { 'data-form-durum': '', role: 'status', hidden: true });
    const k = el('form', { class: 'as-kart', novalidate: true },
      el('strong', {}, 'Talebinizi kontrol edin'),
      alan('ad', 'Ad soyad', v.ad, 'text', true), alan('eposta', 'E-posta', v.eposta, 'email'), alan('telefon', 'Telefon', v.telefon, 'tel'), alan('firma', 'Firma (isteğe bağlı)', v.firma),
      el('label', {}, 'Konu', el('input', { name: 'konu', value: v.konu || '' })),
      el('label', {}, 'Not', (() => { const t = el('textarea', { name: 'mesaj', rows: '3' }); t.value = v.mesaj || ''; return t; })()),
      el('label', { class: 'as-onay' }, el('input', { type: 'checkbox', name: 'kvkk' }), el('span', {}, el('a', { href: '/tr/sayfa/kvkk-aydinlatma-metni', target: '_blank', rel: 'noopener' }, 'KVKK aydınlatma metnini'), ' okudum, iletişim için bilgilerimin işlenmesini kabul ediyorum.')),
      el('div', { 'data-turnstile': '' }), durumP,
      el('button', { type: 'submit', class: 'as-kart-gonder' }, 'Talebi gönder'));
    const robot = robotBagla(k);
    k.addEventListener('submit', async (o) => {
      o.preventDefault();
      const f = Object.fromEntries(new FormData(k));
      const sorun = !f.ad.trim() ? 'Adınızı yazın.' : !f.eposta.trim() && !f.telefon.trim() ? 'E-posta veya telefon yazın.' : !k.kvkk.checked ? 'KVKK onayını işaretleyin.' : robot.gerekli && !robot.jeton() ? 'Robot doğrulamasını bekleyin.' : null;
      const yazDurum = (m, ok) => { durumP.hidden = false; durumP.textContent = m; durumP.className = ok ? 'as-ok' : 'as-hata'; };
      if (sorun) return yazDurum(sorun);
      const b = k.querySelector('.as-kart-gonder'); b.disabled = true; b.textContent = 'Gönderiliyor…';
      try {
        const r = await fetch('/api/talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, ...(reklamBilgisi() ? { reklam: reklamBilgisi(), pazarlama_izni: true } : {}), kvkk: true, kaynak: 'asistan', sayfa: location.pathname, sohbet: durum.sohbet || '', turnstile: robot.jeton() }) });
        const s = await r.json().catch(() => ({}));
        if (!r.ok || !s.ok) throw new Error(s.hata || 'Gönderilemedi');
        k.replaceWith(balon('asistan', 'Teşekkürler, talebiniz ekibimize ulaştı. En geç bir iş günü içinde size dönüyoruz.'));
        durum.mesajlar.push({ rol: 'asistan', metin: 'Teşekkürler, talebiniz ekibimize ulaştı. En geç bir iş günü içinde size dönüyoruz.' }); yaz(durum); kaydir();
      } catch (e) { yazDurum(e.message + ' İsterseniz WhatsApp’tan da yazabilirsiniz.'); b.disabled = false; b.textContent = 'Talebi gönder'; robot.sifirla(); }
    });
    liste.append(k); kaydir();
    const ilk = k.querySelector('input:not([value]), input[value=""]'); if (ilk) setTimeout(() => ilk.focus(), 50);
  }

  function ciz() {
    liste.replaceChildren();
    if (!durum.mesajlar.length) {
      liste.append(balon('asistan', 'Merhaba, ben IDOS, Idexya’nın asistanıyım. Reklam, e-ticaret, SEO veya paketlerimizle ilgili sorularınızı yanıtlayabilir, size uygun hizmeti bulmanıza yardım edebilirim.'));
      liste.append(el('div', { class: 'as-eylemler' }, ONERILER.map((o) => el('button', { type: 'button', class: 'as-cip', onclick: () => sor(o) }, o))));
    }
    durum.mesajlar.forEach((m) => liste.append(balon(m.rol, m.metin)));
    kaydir();
  }
  async function sor(metin) {
    metin = metin.trim(); if (!metin || bekliyor) return;
    if (!durum.mesajlar.length) liste.replaceChildren();
    durum.mesajlar.push({ rol: 'ziyaretci', metin }); yaz(durum);
    liste.querySelectorAll('.as-eylemler').forEach((e) => e.remove());
    liste.append(balon('ziyaretci', metin));
    const yaziyor = el('div', { class: 'as-balon as-asistan as-yaziyor', 'aria-label': 'Asistan yazıyor' }, el('i'), el('i'), el('i'));
    liste.append(yaziyor); kaydir();
    bekliyor = true; gonder.disabled = true;
    try {
      const r = await fetch('/api/asistan/mesaj', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sohbet: durum.sohbet, sayfa: location.pathname, mesajlar: durum.mesajlar }) });
      const s = await r.json().catch(() => ({}));
      yaziyor.remove();
      if (!r.ok || !s.ok) throw new Error(s.hata || 'Yanıt alınamadı.');
      durum.sohbet = s.sohbet;
      durum.mesajlar.push({ rol: 'asistan', metin: s.metin }); yaz(durum);
      liste.append(balon('asistan', s.metin));
      if (s.eylemler) liste.append(eylemler(s.eylemler));
      if (s.kart) kartGoster(s.kart);
      kaydir();
    } catch (e) {
      yaziyor.remove();
      liste.append(balon('asistan', e.message + ' Ekibimize WhatsApp’tan ya da info@idexya.com adresinden ulaşabilirsiniz.'), eylemler(['analiz', 'whatsapp']));
      durum.mesajlar.pop(); yaz(durum); kaydir();
    } finally { bekliyor = false; gonder.disabled = false; girdi.focus(); }
  }
  function ac(acik) {
    durum.acik = acik; yaz(durum);
    panel.hidden = !acik; dugme.setAttribute('aria-expanded', String(acik)); dugme.classList.toggle('as-acik', acik);
    document.body.classList.toggle('as-gorunur', acik);
    if (acik) {
      ciz(); setTimeout(() => girdi.focus(), 60);
      if (yapayZeka === null) fetch('/api/asistan/durum').then((r) => r.json()).then((s) => { yapayZeka = !!s.yapayZeka; if (!yapayZeka) durumYazi.textContent = 'Şu an ekibimize yönlendiriyor'; }).catch(() => {});
    } else dugme.focus();
  }
  // Sürükle-bırak: 6 pikselden fazla hareket sürükleme sayılır (tıklama açmaz). Bırakınca en yakın sol/sağ kenara yapışır.
  const konumOku = () => { try { return JSON.parse(localStorage.getItem(KONUM) || 'null'); } catch (e) { return null; } };
  let konum = konumOku() || { kenar: 'sag', alt: 20 };
  const yerlestir = () => {
    const h = dugme.offsetHeight || 46;
    konum.alt = Math.max(12, Math.min(konum.alt, innerHeight - h - 12));
    dugme.style.left = konum.kenar === 'sol' ? '16px' : 'auto'; dugme.style.right = konum.kenar === 'sag' ? '16px' : 'auto';
    dugme.style.top = 'auto'; dugme.style.bottom = konum.alt + 'px';
    dugme.classList.toggle('as-sol', konum.kenar === 'sol');
    // Pencere: düğmenin kenarında; düğme ekranın üst yarısındaysa altına, değilse üstüne açılır
    panel.style.left = konum.kenar === 'sol' ? '16px' : 'auto'; panel.style.right = konum.kenar === 'sag' ? '16px' : 'auto';
    const ustte = konum.alt > innerHeight / 2;
    panel.style.bottom = ustte ? 'auto' : (konum.alt + h + 12) + 'px';
    panel.style.top = ustte ? (innerHeight - konum.alt + 12) + 'px' : 'auto';
    const bosluk = ustte ? konum.alt - 24 : innerHeight - (konum.alt + h + 12) - 12;
    panel.style.height = Math.max(320, Math.min(620, bosluk)) + 'px';
  };
  let surukle = null, suruklendi = false;
  dugme.addEventListener('dragstart', (o) => o.preventDefault());
  dugme.addEventListener('pointerdown', (o) => { if (o.button !== 0) return; o.preventDefault(); surukle = { x: o.clientX, y: o.clientY, r: dugme.getBoundingClientRect() }; suruklendi = false; dugme.setPointerCapture(o.pointerId); });
  dugme.addEventListener('pointermove', (o) => {
    if (!surukle) return;
    const dx = o.clientX - surukle.x, dy = o.clientY - surukle.y;
    if (!suruklendi && Math.hypot(dx, dy) < 6) return;
    suruklendi = true; dugme.classList.add('as-suruk');
    const x = Math.max(4, Math.min(innerWidth - surukle.r.width - 4, surukle.r.left + dx)), y = Math.max(4, Math.min(innerHeight - surukle.r.height - 4, surukle.r.top + dy));
    Object.assign(dugme.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
  });
  const birak = () => {
    if (!surukle) return;
    if (suruklendi) {
      const r = dugme.getBoundingClientRect();
      konum = { kenar: r.left + r.width / 2 < innerWidth / 2 ? 'sol' : 'sag', alt: Math.round(innerHeight - r.bottom) };
      try { localStorage.setItem(KONUM, JSON.stringify(konum)); } catch (e) {}
      dugme.classList.remove('as-suruk'); yerlestir();
    }
    surukle = null;
  };
  dugme.addEventListener('pointerup', birak); dugme.addEventListener('pointercancel', birak);
  // Klavyeyle taşıma: düğme odaktayken Alt + ok tuşları
  dugme.addEventListener('keydown', (o) => {
    if (!o.altKey) return;
    if (o.key === 'ArrowLeft' || o.key === 'ArrowRight') konum.kenar = o.key === 'ArrowLeft' ? 'sol' : 'sag';
    else if (o.key === 'ArrowUp' || o.key === 'ArrowDown') konum.alt += o.key === 'ArrowUp' ? 60 : -60;
    else return;
    o.preventDefault(); yerlestir(); try { localStorage.setItem(KONUM, JSON.stringify(konum)); } catch (e) {}
  });
  addEventListener('resize', yerlestir);
  requestAnimationFrame(yerlestir);
  dugme.addEventListener('click', (o) => { if (suruklendi) { o.preventDefault(); suruklendi = false; return; } ac(panel.hidden); });
  panel.addEventListener('keydown', (o) => { if (o.key === 'Escape') ac(false); });
  form.addEventListener('submit', (o) => { o.preventDefault(); const m = girdi.value; girdi.value = ''; girdi.style.height = ''; sor(m); });
  girdi.addEventListener('keydown', (o) => { if (o.key === 'Enter' && !o.shiftKey) { o.preventDefault(); form.requestSubmit(); } });
  girdi.addEventListener('input', () => { girdi.style.height = 'auto'; girdi.style.height = Math.min(girdi.scrollHeight, 120) + 'px'; });
  if (durum.acik) ac(true);
}
