import { formlar } from './form.js';
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
  ac.addEventListener('click', () => { c.showModal(); ac.setAttribute('aria-expanded', 'true'); });
  c.addEventListener('close', () => { ac.setAttribute('aria-expanded', 'false'); ac.focus(); });
  c.querySelector('[data-cekmece-kapat]').addEventListener('click', kapat);
  // Karartılmış alana tıklayınca kapanır.
  c.addEventListener('click', (o) => { if (o.target === c) kapat(); });
  c.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (a.getAttribute('href').startsWith('/tr/hizmetler#')) kapat(); }));
}

// Site içi arama: derlemede üretilen dizin + herkese açık içerikler. Ctrl/⌘+K veya "/" ile açılır.
const sade = (t) => String(t || '').toLocaleLowerCase('tr-TR').replace(/[çğıöşüâî]/g, (h) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i' })[h]);
function arama() {
  const d = document.getElementById('arama');
  if (!d || typeof d.showModal !== 'function') return;
  const girdi = d.querySelector('[data-arama-girdi]'), liste = d.querySelector('#arama-sonuc'), ipucu = d.querySelector('[data-arama-ipucu]');
  let dizin = null, sonuclar = [], secili = 0;
  const yukle = async () => {
    if (dizin) return dizin;
    const [a, b] = await Promise.all([
      fetch('/arama.json').then((r) => r.json()).catch(() => []),
      fetch('/api/icerik', { credentials: 'same-origin' }).then((r) => r.json()).then((s) => (s.icerikler || []).filter((i) => !i.ozel).map((i) => ({ t: i.baslik, u: '/icerik/' + i.kisa_ad, d: i.ozet || '', k: 'İçerik' + (i.kategori ? ' · ' + i.kategori : '') }))).catch(() => [])
    ]);
    dizin = [...a, ...b].map((x) => ({ ...x, st: sade(x.t), sd: sade(x.d + ' ' + x.k) }));
    return dizin;
  };
  const vurgula = (metin, sozcukler) => {
    const f = document.createDocumentFragment(), s = sade(metin);
    let i = 0;
    const araliklar = [];
    sozcukler.forEach((w) => { let j = s.indexOf(w); while (j > -1) { araliklar.push([j, j + w.length]); j = s.indexOf(w, j + w.length); } });
    araliklar.sort((x, y) => x[0] - y[0]).forEach(([b, e]) => { if (b < i) return; f.append(metin.slice(i, b)); const m = document.createElement('mark'); m.textContent = metin.slice(b, e); f.append(m); i = e; });
    f.append(metin.slice(i));
    return f;
  };
  const ciz = async () => {
    const q = sade(girdi.value.trim());
    ipucu.hidden = !!q;
    if (!q) { liste.replaceChildren(); return; }
    const s = q.split(/\s+/).filter(Boolean);
    const idx = await yukle();
    sonuclar = idx.map((x) => {
      if (!s.every((w) => x.st.includes(w) || x.sd.includes(w))) return null;
      let p = 0;
      s.forEach((w) => { if (x.st.startsWith(w)) p += 6; else if (x.st.split(/[\s-]+/).some((k) => k.startsWith(w))) p += 4; else if (x.st.includes(w)) p += 3; else p += 1; });
      if (x.k === 'Sayfa') p += 0.5;
      return { x, p };
    }).filter(Boolean).sort((a, b) => b.p - a.p).slice(0, 12).map((o) => o.x);
    secili = 0;
    if (!sonuclar.length) { const li = document.createElement('li'); li.className = 'arama-bos'; li.textContent = `“${girdi.value.trim()}” için sonuç yok. Farklı bir sözcük deneyin veya bize yazın: info@idexya.com`; liste.replaceChildren(li); return; }
    liste.replaceChildren(...sonuclar.map((x, i) => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = x.u; a.setAttribute('role', 'option'); a.setAttribute('aria-selected', String(i === secili)); a.id = 'arama-s' + i;
      const k = document.createElement('small'); k.textContent = x.k;
      const b = document.createElement('strong'); b.append(vurgula(x.t, s));
      const t = document.createElement('span'); t.textContent = x.d;
      a.append(k, b, t); li.append(a); return li;
    }));
  };
  const sec = (n) => {
    const a = liste.querySelectorAll('a'); if (!a.length) return;
    secili = (n + a.length) % a.length;
    a.forEach((x, i) => x.setAttribute('aria-selected', String(i === secili)));
    a[secili].scrollIntoView({ block: 'nearest' }); girdi.setAttribute('aria-activedescendant', a[secili].id);
  };
  const ac = () => { if (d.open) return; const c = document.getElementById('cekmece'); if (c && c.open) c.close(); d.showModal(); girdi.focus(); girdi.select(); yukle(); };
  document.querySelectorAll('[data-arama-ac]').forEach((b) => b.addEventListener('click', ac));
  d.querySelector('[data-arama-kapat]').addEventListener('click', () => d.close());
  d.addEventListener('click', (o) => { if (o.target === d) d.close(); });
  d.querySelectorAll('[data-oneri]').forEach((b) => b.addEventListener('click', () => { girdi.value = b.textContent; ciz(); girdi.focus(); }));
  girdi.addEventListener('input', ciz);
  girdi.addEventListener('keydown', (o) => {
    if (o.key === 'ArrowDown') { o.preventDefault(); sec(secili + 1); }
    else if (o.key === 'ArrowUp') { o.preventDefault(); sec(secili - 1); }
    else if (o.key === 'Enter') { const a = liste.querySelectorAll('a')[secili]; if (a) { o.preventDefault(); location.href = a.href; } }
  });
  addEventListener('keydown', (o) => {
    const yaziyor = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') || (document.activeElement || {}).isContentEditable;
    if ((o.key === 'k' || o.key === 'K') && (o.metaKey || o.ctrlKey)) { o.preventDefault(); ac(); }
    else if (o.key === '/' && !yaziyor && !d.open) { o.preventDefault(); ac(); }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) d.ownerDocument.querySelectorAll('.arama-dugme kbd').forEach((k) => (k.textContent = 'Ctrl K'));
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

export function baslat() { tema(); cerez(); suzgecler(); menu(); arama(); yasla(); formlar(); efektler(); uyeBaglantisi(); }

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
