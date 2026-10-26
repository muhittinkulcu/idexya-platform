import { asistan } from './asistan.js';
import { formlar } from './form.js';
import { reklamIzBaslat } from './reklam-iz.js';
// Ortak istemci davranışları: tema, çerez onayı, sekme ve süzgeçler.
const oku = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const yaz = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* tarayıcı depolamayı engelliyor olabilir */ } };

function tema() {
  const dugmeler = document.querySelectorAll('[data-tema-dugme]');
  const guncelle = () => {
    const koyu = document.body.classList.contains('koyu');
    dugmeler.forEach((d) => d.setAttribute('aria-label', koyu ? 'Açık temaya geç' : 'Koyu temaya geç'));
  };
  dugmeler.forEach((d) => d.addEventListener('click', () => {
    const koyu = !document.body.classList.contains('koyu');
    document.body.className = koyu ? 'koyu' : 'acik';
    yaz('idx-tema', koyu ? 'koyu' : 'acik');
    guncelle();
  }));
  guncelle();
}

// Çerez onayı: tercih 6 ay saklanır. Onay yokken analitik ve pazarlama etiketleri çalışmaz.
const ALTI_AY = 1000 * 60 * 60 * 24 * 182;
function cerez() {
  const kutu = document.getElementById('cerez');
  if (!kutu) return;
  const detay = kutu.querySelector('[data-cerez-detay]');
  const turler = kutu.querySelectorAll('[data-cerez-tur]');
  let kayit = null;
  try { kayit = JSON.parse(oku('idx-cerez') || 'null'); } catch (e) { kayit = null; }
  const gecerli = kayit && Date.now() - kayit.zaman < ALTI_AY;
  const uygula = (t) => {
    window.idxOnay = t; // Etiket yöneticisi canlıda bu değere göre Consent Mode günceller.
    window.dispatchEvent(new CustomEvent('idx-onay', { detail: t }));
  };
  const kaydet = (t) => { yaz('idx-cerez', JSON.stringify({ ...t, zaman: Date.now() })); uygula(t); kutu.classList.add('gizli'); };
  if (gecerli) uygula(kayit); else kutu.classList.remove('gizli');
  kutu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cerez]');
    if (!b) return;
    const ne = b.dataset.cerez;
    if (ne === 'red') kaydet({ analitik: false, pazarlama: false });
    if (ne === 'kabul') {
      if (detay && !detay.classList.contains('gizli')) {
        const t = {}; turler.forEach((x) => { t[x.dataset.cerezTur] = x.checked; }); kaydet(t);
      } else kaydet({ analitik: true, pazarlama: true });
    }
    if (ne === 'detay' && detay) {
      const ac = detay.classList.toggle('gizli') === false;
      b.textContent = ac ? 'Gizle' : 'Tercihler';
      kutu.querySelector('[data-cerez="kabul"]').textContent = ac ? 'Seçimi kaydet' : 'Tümünü kabul et';
    }
  });
  document.querySelectorAll('[data-cerez-ac]').forEach((d) => d.addEventListener('click', () => {
    if (kayit) turler.forEach((x) => { x.checked = !!kayit[x.dataset.cerezTur]; });
    kutu.classList.remove('gizli');
  }));
}

// Sekme / süzgeç: [data-grup="ad"] düğmeleri data-deger taşır; [data-grup-icerik="ad"] öğeleri data-etiket ("a b c") taşır.
function suzgecler() {
  const gruplar = new Set([...document.querySelectorAll('[data-grup]')].map((d) => d.dataset.grup));
  gruplar.forEach((g) => {
    const dugmeler = [...document.querySelectorAll(`[data-grup="${g}"]`)];
    const ogeler = [...document.querySelectorAll(`[data-grup-icerik="${g}"]`)];
    const sec = (deger) => {
      dugmeler.forEach((d) => {
        const s = d.dataset.deger === deger;
        d.setAttribute('aria-pressed', String(s));
        if (d.getAttribute('role') === 'tab') d.setAttribute('aria-selected', String(s));
        if (d.dataset.secStil && d.dataset.normalStil) d.setAttribute('style', s ? d.dataset.secStil : d.dataset.normalStil);
      });
      let gorunen = 0;
      ogeler.forEach((o) => { const g2 = deger === 'tumu' || (o.dataset.etiket || '').split(' ').includes(deger); o.classList.toggle('gizli', !g2); if (g2) gorunen++; });
      document.querySelectorAll(`[data-grup-bos="${g}"]`).forEach((b) => b.classList.toggle('gizli', gorunen > 0));
    };
    dugmeler.forEach((d) => d.addEventListener('click', () => sec(d.dataset.deger)));
  });
}

function menu() {
  const c = document.getElementById('cekmece');
  const ac = document.querySelector('[data-cekmece-ac]');
  if (!c || !ac || typeof c.showModal !== 'function') return;
  const kapat = () => c.close();
  const baglantilar = [...c.querySelectorAll('[data-onizle]')];
  const goster = (k) => {
    baglantilar.forEach((a) => a.classList.toggle('etkin', a.dataset.onizle === k));
    c.querySelectorAll('[data-pano]').forEach((p) => { p.hidden = p.dataset.pano !== k; });
  };
  baglantilar.forEach((a) => { a.addEventListener('mouseenter', () => goster(a.dataset.onizle)); a.addEventListener('focus', () => goster(a.dataset.onizle)); });
  ac.addEventListener('click', () => {
    const etkin = baglantilar.find((a) => a.getAttribute('aria-current') === 'page') || baglantilar[0];
    if (etkin) goster(etkin.dataset.onizle);
    c.showModal(); ac.setAttribute('aria-expanded', 'true');
  });
  c.addEventListener('close', () => { ac.setAttribute('aria-expanded', 'false'); ac.focus(); });
  c.querySelector('[data-cekmece-kapat]').addEventListener('click', kapat);
  c.querySelector('[data-cekmece-ara]').addEventListener('click', () => { kapat(); document.querySelector('.arama-dugme')?.click(); });
  c.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { const h = a.getAttribute('href') || ''; if (h.includes('#') && h.split('#')[0] === location.pathname.replace(/\/$/, '')) kapat(); }));
  if (matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
    let b = false;
    c.addEventListener('pointermove', (o) => { if (b) return; b = true; requestAnimationFrame(() => { c.style.setProperty('--mx', (o.clientX / innerWidth * 100).toFixed(1) + '%'); c.style.setProperty('--my', (o.clientY / innerHeight * 100).toFixed(1) + '%'); b = false; }); });
  }
}

// Site içi arama (Spotlight gibi): boşken öneriler ve kısayollar, yazınca gruplu sonuçlar. Ctrl/⌘+K veya "/" ile açılır.
const sade = (t) => String(t || '').toLocaleLowerCase('tr-TR').replace(/[çğıöşüâî]/g, (h) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i' })[h]);
const IKON = {
  Sayfa: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path>',
  Hizmet: '<path d="M12 2l10 5-10 5L2 7z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>',
  Blog: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path>',
  İçerik: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"></path>',
  Üyelik: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a7 7 0 0 1 16 0v1"></path>',
  Yasal: '<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"></path>',
  Eylem: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"></path>'
};
const GRUP = ['Eylem', 'Sayfa', 'Hizmet', 'İçerik', 'Blog', 'Üyelik', 'Yasal'];
const GRUP_AD = { Eylem: 'Hızlı işlemler', Sayfa: 'Sayfalar', Hizmet: 'Hizmetler', İçerik: 'İçerikler', Blog: 'Blog', Üyelik: 'Üyelik', Yasal: 'Yasal' };
const ONERI = ['/tr/hizmet/google-ads-yonetimi', '/tr/hizmet/meta-business-ads-yonetimi', '/tr/paketler', '/tr/hizmetler', '/tr/idos'];
function arama() {
  const d = document.getElementById('arama');
  if (!d || typeof d.showModal !== 'function') return;
  const girdi = d.querySelector('[data-arama-girdi]'), liste = d.querySelector('#arama-sonuc');
  let dizin = null, secili = 0;
  const uye = () => /(?:^|;\s*)idx_uye=1/.test(document.cookie);
  const eylemler = () => [
    { t: 'Ücretsiz analiz iste', u: '/tr/iletisim#form', d: 'Formu doldurun, size dönelim', k: 'Eylem', a: 'analiz teklif iletisim form' },
    { t: "WhatsApp'tan yaz", u: 'https://wa.me/905078700629', d: '0507 870 06 29', k: 'Eylem', a: 'whatsapp mesaj telefon' },
    uye() ? { t: 'Hesabım', u: '/hesabim', d: 'Size açılan bölümler', k: 'Eylem', a: 'hesap uyelik' } : { t: 'Üye ol', u: '/uye-ol', d: 'Üyelik talebi gönderin', k: 'Eylem', a: 'kayit uyelik hesap' },
    { t: document.body.classList.contains('koyu') ? 'Açık temaya geç' : 'Koyu temaya geç', u: '#tema', d: 'Görünümü değiştir', k: 'Eylem', a: 'tema karanlik gece koyu acik', is: () => document.querySelector('[data-tema-dugme]')?.click() }
  ].map((x) => ({ ...x, st: sade(x.t), sd: sade(x.d + ' ' + x.a) }));
  const yukle = async () => {
    if (dizin) return dizin;
    const [a, b] = await Promise.all([
      fetch('/arama.json').then((r) => r.json()).catch(() => []),
      fetch('/api/icerik', { credentials: 'same-origin' }).then((r) => r.json()).then((s) => (s.icerikler || []).filter((i) => !i.ozel).map((i) => ({ t: i.baslik, u: '/icerik/' + i.kisa_ad, d: i.ozet || '', k: 'İçerik' + (i.kategori ? ' · ' + i.kategori : '') }))).catch(() => [])
    ]);
    dizin = [...a, ...b].map((x) => ({ ...x, st: sade(x.t), sd: sade(x.d + ' ' + x.k) }));
    return dizin;
  };
  const tur = (x) => x.k.split(' · ')[0];
  const vurgula = (metin, sozcukler) => {
    const f = document.createDocumentFragment(), s = sade(metin), ar = [];
    sozcukler.forEach((w) => { let j = s.indexOf(w); while (j > -1) { ar.push([j, j + w.length]); j = s.indexOf(w, j + w.length); } });
    let i = 0;
    ar.sort((x, y) => x[0] - y[0]).forEach(([b, e]) => { if (b < i) return; f.append(metin.slice(i, b)); const m = document.createElement('mark'); m.textContent = metin.slice(b, e); f.append(m); i = e; });
    f.append(metin.slice(i)); return f;
  };
  let gorunen = [];
  const yaz = (gruplar) => {
    gorunen = []; secili = 0;
    const parcalar = [];
    gruplar.forEach(([ad, ogeler, s]) => {
      if (!ogeler.length) return;
      const h = document.createElement('li'); h.className = 'arama-baslik'; h.setAttribute('role', 'presentation'); h.textContent = ad; parcalar.push(h);
      ogeler.forEach((x) => {
        const i = gorunen.length; gorunen.push(x);
        const li = document.createElement('li'), a = document.createElement('a');
        a.href = x.u; a.id = 'arama-s' + i; a.setAttribute('role', 'option'); a.setAttribute('aria-selected', String(i === 0));
        if (x.u.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
        const ik = document.createElement('span'); ik.className = 'arama-ikon'; ik.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[tur(x)] || IKON.Sayfa}</svg>`;
        const m = document.createElement('span'); m.className = 'arama-metin';
        const b = document.createElement('strong'); b.append(s ? vurgula(x.t, s) : x.t);
        const t = document.createElement('span'); t.className = 'aciklama'; t.textContent = x.d;
        m.append(b, t);
        const k = document.createElement('small'); k.textContent = x.k.includes(' · ') ? x.k.split(' · ')[1] : '';
        a.append(ik, m, k);
        a.addEventListener('mouseenter', () => sec(i, false));
        if (x.is) a.addEventListener('click', (o) => { o.preventDefault(); x.is(); d.close(); });
        li.append(a); parcalar.push(li);
      });
    });
    liste.replaceChildren(...parcalar);
    if (gorunen.length) girdi.setAttribute('aria-activedescendant', 'arama-s0');
  };
  const ciz = async () => {
    const q = sade(girdi.value.trim());
    const idx = await yukle();
    if (!q) { yaz([['Hızlı işlemler', eylemler().slice(0, 3)], ['Önerilenler', ONERI.map((u) => idx.find((x) => x.u === u)).filter(Boolean)]]); return; }
    const s = q.split(/\s+/).filter(Boolean);
    const puanla = (x) => {
      if (!s.every((w) => x.st.includes(w) || x.sd.includes(w))) return null;
      let p = 0;
      s.forEach((w) => { if (x.st.startsWith(w)) p += 6; else if (x.st.split(/[\s-]+/).some((k) => k.startsWith(w))) p += 4; else if (x.st.includes(w)) p += 3; else p += 1; });
      return { x, p };
    };
    const bulunan = [...eylemler(), ...idx].map(puanla).filter(Boolean).sort((a, b) => b.p - a.p).slice(0, 14).map((o) => o.x);
    if (!bulunan.length) { const li = document.createElement('li'); li.className = 'arama-bos'; li.textContent = `“${girdi.value.trim()}” için sonuç yok. Farklı bir sözcük deneyin veya info@idexya.com adresine yazın.`; liste.replaceChildren(li); gorunen = []; return; }
    const enIyi = bulunan[0];
    yaz([['En iyi eşleşme', [enIyi], s], ...GRUP.map((g) => [GRUP_AD[g], bulunan.slice(1).filter((x) => tur(x) === g), s])]);
  };
  const sec = (n, kaydir = true) => {
    const a = liste.querySelectorAll('a'); if (!a.length) return;
    secili = (n + a.length) % a.length;
    a.forEach((x, i) => x.setAttribute('aria-selected', String(i === secili)));
    if (kaydir) a[secili].scrollIntoView({ block: 'nearest' });
    girdi.setAttribute('aria-activedescendant', a[secili].id);
  };
  const ac = () => { if (d.open) return; const c = document.getElementById('cekmece'); if (c && c.open) c.close(); d.showModal(); girdi.value = ''; girdi.focus(); ciz(); };
  document.querySelectorAll('[data-arama-ac]').forEach((b) => b.addEventListener('click', ac));
  d.querySelector('[data-arama-kapat]').addEventListener('click', () => d.close());
  d.addEventListener('click', (o) => { if (o.target === d) d.close(); });
  girdi.addEventListener('input', ciz);
  girdi.addEventListener('keydown', (o) => {
    if (o.key === 'ArrowDown') { o.preventDefault(); sec(secili + 1); }
    else if (o.key === 'ArrowUp') { o.preventDefault(); sec(secili - 1); }
    else if (o.key === 'Enter') { const a = liste.querySelectorAll('a')[secili]; if (a) { o.preventDefault(); a.click(); } }
  });
  addEventListener('keydown', (o) => {
    const e = document.activeElement || {}, yaziyor = /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName || '') || e.isContentEditable;
    if ((o.key === 'k' || o.key === 'K') && (o.metaKey || o.ctrlKey)) { o.preventDefault(); ac(); }
    else if (o.key === '/' && !yaziyor && !d.open) { o.preventDefault(); ac(); }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) document.querySelectorAll('.arama-dugme kbd').forEach((k) => (k.textContent = 'Ctrl K'));
}

// Üç satır ve üzeri paragraflar iki yana yaslanır; kısa giriş metinlerinde boşluk açılmaz.
function yasla() {
  const isle = () => document.querySelectorAll('main p').forEach((p) => {
    const satir = parseFloat(getComputedStyle(p).lineHeight) || 24;
    // Dar sütunda iki yana yaslama sözcük arasında büyük boşluk açar; yalnız yeterince geniş paragraflar yaslanır.
    p.classList.toggle('yasli', p.offsetHeight / satir >= 2.6 && p.clientWidth >= 420);
  });
  isle();
  let z; window.addEventListener('resize', () => { clearTimeout(z); z = setTimeout(isle, 150); });
}

export function baslat() { tema(); reklamIzBaslat(); cerez(); suzgecler(); menu(); arama(); yasla(); formlar(); efektler(); uyeBaglantisi(); asistan(); }

// Kaydırınca üst menü yarı saydam ve gölgeli olur; süreç adımları sırayla görününce yanar; koyu bölümdeki kartlarda imleci izleyen ışık.
function efektler() {
  const sahne = document.getElementById('ust');
  if (sahne && matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
    let bekliyor = false;
    sahne.addEventListener('pointermove', (o) => {
      if (bekliyor) return; bekliyor = true;
      requestAnimationFrame(() => { const r = sahne.getBoundingClientRect(); sahne.style.setProperty('--mx', ((o.clientX - r.left) / r.width * 100).toFixed(1) + '%'); sahne.style.setProperty('--my', ((o.clientY - r.top) / r.height * 100).toFixed(1) + '%'); bekliyor = false; });
    });
  }
  const ust = document.querySelector('.site-ust');
  if (ust) { const k = () => ust.classList.toggle('kaydi', scrollY > 8); k(); addEventListener('scroll', k, { passive: true }); }
  const sira = document.querySelector('main ol');
  if (sira && sira.querySelector('li span[style*="border-radius: 50%"]')) {
    sira.classList.add('adim-sira');
    const li = [...sira.children];
    if ('IntersectionObserver' in window) {
      const g = new IntersectionObserver((e) => e.forEach((x) => {
        if (!x.isIntersecting) return;
        li.forEach((l, i) => setTimeout(() => l.classList.add('gorundu'), i * 220));
        g.disconnect();
      }), { threshold: 0.4 });
      g.observe(sira);
    } else li.forEach((l) => l.classList.add('gorundu'));
  }
  document.querySelectorAll('#idos [style*="rgba(255,255,255,.06)"]').forEach((k) => {
    k.classList.add('isik');
    k.addEventListener('pointermove', (o) => { const r = k.getBoundingClientRect(); k.style.setProperty('--x', o.clientX - r.left + 'px'); k.style.setProperty('--y', o.clientY - r.top + 'px'); });
  });
}

// Oturum açık üyeye "Giriş" yerine "Hesabım" gösterilir (idx_uye yalnız görünüm ipucudur; yetki sunucuda denetlenir).
function uyeBaglantisi() {
  if (!/(?:^|;\s*)idx_uye=1/.test(document.cookie)) return;
  document.querySelectorAll('[data-uye-baglanti]').forEach((a) => { a.href = '/hesabim'; a.textContent = 'Hesabım'; });
}
