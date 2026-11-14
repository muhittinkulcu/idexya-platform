// Tema düzenleyici ayarlarını sayfaya uygular (worker/tema-ayar.js, panel: /yonetim/tema/).
// Ayar yoksa derlenmiş site olduğu gibi kalır. Son ayar localStorage'da tutulur; Site.astro'daki erken betik
// gizli öğeleri ilk boyamadan önce saklar. ?tema=onizleme adresinde paneldeki kaydedilmemiş taslak kullanılır.
const ONIZLEME = new URLSearchParams(location.search).get('tema') === 'onizleme';
const ANAHTAR = ONIZLEME ? 'idx-tema-onizleme' : 'idx-tema';
const oku = () => { try { const r = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); return r && (r.tema || r); } catch { return null; } };
const kac = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const varsayilan = new WeakMap();
const ilkMetin = (e) => { if (!varsayilan.has(e)) varsayilan.set(e, e.textContent); return varsayilan.get(e); };

function menuUygula(m) {
  const nav = document.querySelector('.ust-menu');
  const liste = document.querySelector('.cm-liste'), akordiyon = document.querySelector('.cm-akordiyon');
  if (!nav || !m) return;
  document.querySelectorAll('[data-menu-ozel]').forEach((e) => e.remove());
  const sira = (m.ogeler || []);
  for (const o of sira) {
    if (o.k.startsWith('ozel-')) {
      const hedef = o.yeniSekme ? ' target="_blank" rel="noopener"' : '';
      nav.insertAdjacentHTML('beforeend', `<a href="${kac(o.href)}" data-menu-k="${kac(o.k)}" data-menu-ozel${hedef}>${kac(o.ad)}</a>`);
      liste?.insertAdjacentHTML('beforeend', `<a href="${kac(o.href)}" data-menu-k="${kac(o.k)}" data-menu-ozel${hedef}><span class="cm-ad">${kac(o.ad)}</span></a>`);
      akordiyon?.insertAdjacentHTML('beforeend', `<a href="${kac(o.href)}" class="cm-ak" data-menu-k="${kac(o.k)}" data-menu-ozel${hedef} style="display:block;padding:14px 4px;color:var(--head);font-weight:600;text-decoration:none">${kac(o.ad)}</a>`);
    }
    document.querySelectorAll(`[data-menu-k="${CSS.escape(o.k)}"]`).forEach((e) => {
      e.hidden = o.gorunur === false;
      if (o.ad && !o.k.startsWith('ozel-')) {
        const etiket = e.matches('.ust-acilir') ? e.querySelector(':scope > a') : e.matches('a') && !e.closest('.cm-liste') ? e : e.querySelector('.cm-ad');
        if (etiket) { ilkMetin(etiket); etiket.textContent = o.ad; }
        const ana = e.querySelector('.cm-ak-ana'); if (ana) ana.textContent = `${o.ad} sayfasına gidin`;
      }
      if (e.matches('.ust-acilir')) e.classList.toggle('menu-duz', o.acilir === false);
    });
  }
  // Sıra: ayardaki sıra; ayarda olmayan öğeler sonda kalır
  for (const kap of [nav, liste, akordiyon]) {
    if (!kap) continue;
    sira.forEach((o) => { const e = kap.querySelector(`:scope > [data-menu-k="${CSS.escape(o.k)}"]`); if (e) kap.append(e); });
  }
  if (m.stil && !sessionStorage.getItem('idx-menu')) { document.documentElement.dataset.mk = m.stil; document.documentElement.dataset.ma = m.stil; }
}

function ustUygula(u) {
  if (!u) return;
  document.querySelectorAll('.ust-giris').forEach((e) => { e.hidden = u.giris === false; });
  document.querySelectorAll('[data-arama-ac]').forEach((e) => { e.hidden = u.arama === false; });
  document.querySelectorAll('[data-tema-dugme]').forEach((e) => { e.hidden = u.temaDugme === false; });
  if (u.ctaMetin) document.querySelectorAll('.ust-cta').forEach((e) => {
    e.textContent = u.ctaMetin;
    if (u.ctaEylem === 'bag' && u.ctaHref) { e.removeAttribute('data-hizli-talep'); e.setAttribute('href', u.ctaHref); }
    else { e.setAttribute('data-hizli-talep', u.ctaEylem === 'teklif' ? 'teklif' : 'analiz'); e.setAttribute('href', '/tr/iletisim#form'); }
  });
}

function altUygula(a) {
  if (!a) return;
  const tanitim = document.querySelector('[data-alt-tanitim]'); if (tanitim && a.tanitim) tanitim.textContent = a.tanitim;
  const telif = document.querySelector('[data-alt-telif]'); if (telif && a.telif) telif.textContent = a.telif;
  const sosyal = document.querySelector('[data-alt-sosyal]'); if (sosyal) sosyal.hidden = a.sosyal === false;
  const ilk = document.querySelector('[data-alt-sutun]');
  if (ilk && Array.isArray(a.sutunlar) && a.sutunlar.length) {
    const kap = ilk.parentElement, stil = ilk.getAttribute('style') || '', bs = ilk.querySelector('span')?.getAttribute('style') || '', as = ilk.querySelector('a')?.getAttribute('style') || '';
    kap.querySelectorAll('[data-alt-sutun]').forEach((e) => e.remove());
    kap.insertAdjacentHTML('beforeend', a.sutunlar.map((s) => `<nav aria-label="${kac(s.baslik)}" data-alt-sutun style="${kac(stil)}"><span style="${kac(bs)}">${kac(s.baslik)}</span>${s.baglantilar.map((b) => `<a href="${kac(b.href)}" style="${kac(as)}"${/^https?:/.test(b.href) ? ' rel="noopener"' : ''}>${kac(b.ad)}</a>`).join('')}</nav>`).join(''));
  }
}

export function temaAyarUygula(t) {
  if (!t) return;
  menuUygula(t.menu); ustUygula(t.ust); altUygula(t.alt);
  document.getElementById('tema-erken')?.remove();
}

export function temaAyarKur() {
  const eldeki = oku();
  if (eldeki) temaAyarUygula(eldeki);
  if (ONIZLEME) {
    // Panel taslağı değiştikçe önizleme yeniden çizilir
    addEventListener('storage', (o) => { if (o.key === ANAHTAR) location.reload(); });
    return;
  }
  fetch('/api/tema', { credentials: 'omit' }).then((r) => r.json()).then((s) => {
    if (!s || !s.ok) return;
    const onceki = localStorage.getItem(ANAHTAR) || 'null';
    const yeni = JSON.stringify(s.tema ? { tema: s.tema, surum: s.surum } : null);
    if (yeni === onceki) return;
    try { if (s.tema) localStorage.setItem(ANAHTAR, yeni); else localStorage.removeItem(ANAHTAR); } catch {}
    if (s.tema) temaAyarUygula(s.tema); else if (eldeki) location.reload();
  }).catch(() => {});
}
