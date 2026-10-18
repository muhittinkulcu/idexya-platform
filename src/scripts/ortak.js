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
  const ac = document.querySelector('.ust-ac');
  const ust = document.querySelector('.ust');
  if (!ac || !ust) return;
  ac.addEventListener('click', () => { const acik = ust.classList.toggle('menu-acik'); ac.setAttribute('aria-expanded', String(acik)); });
}

// Üç satır ve üzeri paragraflar iki yana yaslanır; kısa giriş metinlerinde boşluk açılmaz.
function yasla() {
  const isle = () => document.querySelectorAll('main p').forEach((p) => {
    const satir = parseFloat(getComputedStyle(p).lineHeight) || 24;
    p.classList.toggle('yasli', p.offsetHeight / satir >= 2.6);
  });
  isle();
  let z; window.addEventListener('resize', () => { clearTimeout(z); z = setTimeout(isle, 150); });
}

export function baslat() { tema(); cerez(); suzgecler(); menu(); yasla(); formlar(); efektler(); uyeBaglantisi(); }

// Kaydırınca üst menü yarı saydam ve gölgeli olur; süreç adımları sırayla görününce yanar; koyu bölümdeki kartlarda imleci izleyen ışık.
function efektler() {
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
