// <idexya-kabuk>: ortak kabuk. Kurallar README.md: innerHTML ve dış istek yok, veri textContent ile.
import {
  SIMGE, TEMA, temaCoz, sonrakiTema, sinirBekle, ayarDogrula, etkinBul, aramaHavuzu, aramaSuz, kaynakAra, aramaBirlestir, kaynakDurumu,
  sekmeListesi, sekmeEkle, sekmeKapat, hepsiAcik, hepsiDegistir, gorunumCoz, sayiBicim, saatKisa, rozetSay, guvenliUrl, metinListesi, osAdresi
} from './kabuk-cekirdek.js';

const D = document, R = D.documentElement;
const MQ = matchMedia('(prefers-color-scheme: dark)');
const TEL = matchMedia('(max-width: 860px)');
const oku = (k, v) => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x); } catch (e) { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli kip */ } };

// Görünüm (idx-gorunum): tema açık | koyu | sistem | zaman, zaman sınırları, hareketi azalt. Eski kayıt (oto, yazı, kalınlık)
// okunurken yeni biçime çevrilip yazılır.
const gorunumOku = () => { const ham = oku('idx-gorunum', null), g = gorunumCoz(ham); if (ham && JSON.stringify(ham) !== JSON.stringify(g)) yaz('idx-gorunum', g); return g; };
let GOR = gorunumOku(), zZaman;
const azHareket = () => GOR.azHareket || matchMedia('(prefers-reduced-motion: reduce)').matches;
function gorunumUygula() {
  R.dataset.tema = temaCoz(GOR, MQ.matches, new Date());
  R.dataset.temaSecim = GOR.tema;
  if (GOR.azHareket) R.dataset.hareket = 'az'; else delete R.dataset.hareket;
  clearTimeout(zZaman);
  if (GOR.tema === 'zaman') zZaman = setTimeout(gorunumUygula, sinirBekle(new Date(), GOR.zamanAcik, GOR.zamanKoyu));
}
gorunumUygula();
MQ.addEventListener('change', gorunumUygula);
D.addEventListener('visibilitychange', () => { if (!D.hidden) gorunumUygula(); });
const gorunumYayinla = () => D.querySelectorAll('idexya-kabuk').forEach((k) => k.temaDugme && (k.temaCiz(), olay(k, 'gorunum', Object.assign({}, GOR))));
addEventListener('storage', (e) => { if (e.key === 'idx-gorunum') { GOR = gorunumOku(); gorunumUygula(); gorunumYayinla(); } });

function h(tag, a, ...c) {
  const e = D.createElement(tag);
  for (const k in a) {
    const v = a[k];
    if (v == null || v === false) continue;
    if (k[0] === 'o' && k[1] === 'n') e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'css') for (const p in v) e.style.setProperty(p, v[p]);
    else e.setAttribute(k, v === true ? '' : v);
  }
  c.flat(3).forEach((x) => x != null && x !== false && e.append(x));
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
function svg(yollar, boy = 16, kalin = 1.8, sinif) {
  const s = D.createElementNS(NS, 'svg');
  Object.entries({ width: boy, height: boy, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': kalin, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }).forEach((x) => s.setAttribute(x[0], x[1]));
  if (sinif) s.setAttribute('class', sinif);
  yollar.forEach((d) => { const p = D.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); });
  return s;
}
const ASAGI = ['M6 9l6 6 6-6'], SAG = ['M9 6l6 6-6 6'];
const I = {
  x: ['M5 5l14 14M19 5L5 19'], ara: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-3.5-3.5'],
  raptiye: ['M12 17v5M9 3h6l-1 6 4 4H6l4-4z'], zil: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4z', 'M10 20a2 2 0 0 0 4 0'],
  acik: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  koyu: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'], sistem: ['M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M8 21h8M12 17v4'],
  zaman: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'], menu: ['M4 6h16M4 12h16M4 18h16'],
  hepsiAc: ['M7 15l5 5 5-5', 'M7 9l5-5 5 5'], hepsiKapat: ['M7 20l5-5 5 5', 'M7 4l5 5 5-5'],
  daralt: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M9 4v16'],
  ayar: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1']
};
const olay = (el, ad, detail, iptal) => el.dispatchEvent(new CustomEvent('idexya-kabuk:' + ad, { detail, bubbles: true, cancelable: !!iptal }));

class IdexyaKabuk extends HTMLElement {
  kaynaklar = []; kd = new Map(); gecici = new Set(); grupZ = new Map();
  connectedCallback() {
    if (this._kuruldu) return;
    // Ayrıştırılırken: öğe kapanınca, ilk boyamadan önce kurulur (README).
    if (D.readyState === 'loading' && !this.nextSibling) {
      const g = new MutationObserver(() => this.nextSibling && this.connectedCallback());
      g.observe(this.parentNode, { childList: true });
      D.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      return this._g = g;
    }
    if (this._g) this._g.disconnect();
    this._kuruldu = true;
    olay(this, 'kur', {});
    try { this._sakin = sessionStorage.getItem('idx-acildi'); sessionStorage.setItem('idx-acildi', 1); } catch (e) { /* gizli kip */ }
    let ham = null;
    try { ham = JSON.parse((D.querySelector('script#idexya-kabuk-ayar[type="application/json"]') || {}).textContent || 'null'); } catch (e) { ham = null; }
    const { ayar, hatalar } = ayarDogrula(ham);
    if (hatalar.length) console.warn('idexya-kabuk ayarı:', hatalar.join('; '));
    this.a = ayar;
    this.k = ayar.katmanlar.find((x) => x.anahtar === ayar.katman);
    this.acik = null; this.acikMod = {};
    this.dar = !!oku('idx-yan-dar', false);
    this.kapali = metinListesi(oku('idx-yan-kapali-' + ayar.katman, []));
    this.havuz = aramaHavuzu(ayar);
    this.rozet = {};
    this.gorulen = new Set(this.havuz.map((x) => x.url));
    ayar.katmanlar.forEach((k) => k.gruplar.forEach((g) => g.moduller.forEach((m) => [m].concat(m.sayfalar).forEach((x) => { if (x.rozet) this.rozet[x.url] = x.rozet; }))));
    this.kur();
    this.etkinYap(ayar.etkin);
    this._ilk = 1;
    D.addEventListener('keydown', (e) => {
      const t = e.target;
      if (e.defaultPrevented || e.isComposing || !(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 'k') return;
      if (t !== this.giris && t.closest && t.closest('input,textarea,select,[contenteditable]:not([contenteditable=false])')) return;
      e.preventDefault(); this.giris.focus(); this.aramaAc();
    });
    olay(this, 'hazir', { ayar });
  }

  kur() {
    const k = this.k, a = this.a;
    const icerik = [...this.childNodes];
    this.classList.add('ik');
    if (k) { this.style.setProperty('--ik-renk', k.renk); this.style.setProperty('--ik-renk-koyu', k.renkKoyu); }
    const idos = a.katmanlar.find((x) => x.anahtar === 'idos');
    const menuVar = k && k.gruplar.length;

    this.giris = h('input', {
      type: 'search', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'ik-ara-sonuc', 'aria-autocomplete': 'list',
      'aria-label': 'Tüm katmanlarda ara', placeholder: 'Tüm katmanlarda ara: sayfa, modül, eylem', autocomplete: 'off', spellcheck: 'false',
      onfocus: () => this.aramaAc(), onclick: () => this.aramaAc(),
      oninput: () => { this.secim = 0; this.aramaAc(); this.kaynakBaslat(); this.aramaCiz(); },
      onkeydown: (e) => this.aramaTus(e)
    });
    this.sonuc = h('div', { id: 'ik-ara-sonuc', class: 'ik-ara-sonuc', role: 'listbox', 'aria-label': 'Arama sonuçları', hidden: true });
    this.kDurum = h('div', { class: 'ik-ara-durum', role: 'status' });
    this.kapsul = h('div', { class: 'ik-kapsul' });
    this.sabitDugme = h('button', { type: 'button', class: 'ik-ikon ik-masa', onclick: () => this.sabitle(!this.sabit) }, svg(I.raptiye, 16, 1.9));
    this.temaDugme = h('button', { type: 'button', class: 'ik-ikon ik-tema-dugme', onclick: () => this.gorunumYap({ tema: sonrakiTema(GOR.tema) }) });
    this.profilDugme = h('button', { type: 'button', class: 'ik-profil', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'ik-profil-menu', onclick: (e) => this.degistir('profil', e.currentTarget) });
    this.profil = h('div', { id: 'ik-profil-menu', class: 'ik-acilir ik-profil-menu', hidden: true });
    this.mega = h('div', { id: 'ik-mega', class: 'ik-mega', role: 'dialog', hidden: true });
    this.perde = h('div', { class: 'ik-perde', hidden: true, onclick: () => { this.kapat(false); this.cekmece(false); } });
    this.katmanNav = h('nav', { class: 'ik-katmanlar', 'aria-label': 'Katmanlar' });
    this.menuDugme = menuVar ? h('button', { type: 'button', class: 'ik-ikon ik-tel', 'aria-label': 'Menüyü aç', 'aria-expanded': 'false', 'aria-controls': 'ik-yan', onclick: () => this.cekmece(!this.cekmeceAcik) }, svg(I.menu, 18)) : null;

    this.ust = h('header', { class: 'ik-ust' },
      this.menuDugme,
      h('a', { class: 'ik-logo', href: idos ? idos.url : '/', 'data-ik-git': '', 'aria-label': 'Idexya ana sayfası' },
        h('span', { class: 'ik-logo-x', css: { color: idos ? idos.renkKoyu : '#F07A23' } }, svg(I.x, 22, 3)), h('span', { class: 'ik-logo-ad' }, 'Idexya')),
      this.katmanNav,
      h('div', { class: 'ik-ara-kap' }, h('div', { class: 'ik-ara-alan' },
        h('label', { class: 'ik-ara' }, svg(I.ara, 15, 2), this.giris, h('kbd', { class: 'ik-masa' }, /Mac|iP/.test(navigator.platform) ? '⌘K' : 'Ctrl K')),
        this.sonuc)),
      h('div', { class: 'ik-arac' },
        this.kapsul, this.sabitDugme,
        a.bildirimUrl ? h('a', { class: 'ik-ikon', href: a.bildirimUrl, 'data-ik-git': '', 'aria-label': 'Bildirimler', title: 'Bildirimler' }, svg(I.zil, 17)) : null,
        this.temaDugme,
        h('div', { class: 'ik-profil-kap' }, this.profilDugme, this.profil)),
      this.perde, this.mega);

    this.icerik = h('div', { class: 'ik-icerik' }, icerik);
    const ana = h('main', { class: 'ik-ana' });
    if (menuVar) {
      this.sekmeNav = h('nav', { class: 'ik-sekmeler', 'aria-label': 'Açık sayfalar' });
      this.yan = h('aside', { id: 'ik-yan', class: 'ik-yan', 'aria-label': k.ad + ' menüsü' });
      ana.append(this.sekmeNav);
    }
    ana.append(this.icerik);
    this.replaceChildren(this.ust, h('div', { class: 'ik-govde' }, this.yan, ana));
    if (a.asistan) {
      this.append(h('div', { class: 'ik-asistan-kap' },
        h('span', { class: 'ik-asistan-ipucu', 'aria-hidden': 'true' }, a.asistan.etiket),
        // Görsel kabuğun kedisidir (kabuk.css .ik-kedi → kedi.webp); üç üründe aynı.
        h('button', { type: 'button', class: 'ik-asistan', 'aria-label': a.asistan.etiket + ': asistanı aç', 'aria-haspopup': 'dialog', onclick: () => olay(this, 'asistan', {}) },
          h('span', { class: 'ik-kedi', 'aria-hidden': 'true' }))));
    }

    this.addEventListener('click', (e) => this.tikla(e));
    this.addEventListener('keydown', (e) => this.tus(e));
    [this.mega, this.profil].forEach((p) => p.addEventListener('focusout', (e) => {
      const r = e.relatedTarget;
      if (r && !p.contains(r) && r !== this._donus) this.kapat(false);
    }));
    this.giris.addEventListener('blur', (e) => { const r = e.relatedTarget; if (r && !this.sonuc.contains(r) && this.acik === 'arama') this.kapat(false); });
    this.sabitle(oku('idx-ust-sabit', true));
    TEL.addEventListener('change', () => { this.katmanGoster(); if (this.yan) { this.cekmece(false); this.ucanKapat(); this.yanCiz(); } });
    this.katmanCiz(); this.katmanGoster(); this.durumYap(a.durum); this.kullaniciYap(a.kullanici); this.temaCiz();
  }

  // `idexya-kabuk:git` iptal edilirse yönlendirmeyi ürün yapar.
  tikla(e) {
    const l = e.target.closest('a[data-ik-git]');
    if (!l || !this.contains(l) || this.icerik.contains(l)) return;
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (this.sonuc.contains(l)) this.giris.value = '';
    this.kapat(false); this.cekmece(false); this.ucanKapat();
    if (l.classList.contains('ik-profil-cikis')) try { Object.keys(localStorage).forEach((k) => /^idx-(sekme|yan-kapali)-/.test(k) && localStorage.removeItem(k)); Object.keys(sessionStorage).forEach((k) => /^idx-/.test(k) && sessionStorage.removeItem(k)); } catch (x) { /* gizli kip */ }
    const url = guvenliUrl(l.getAttribute('href'), this.a.kokenler);
    if (!url || !olay(this, 'git', { url }, true)) e.preventDefault();
  }
  git(url) { this.kapat(false); url = guvenliUrl(osAdresi(url), this.a.kokenler); if (url && olay(this, 'git', { url }, true)) location.assign(url); }

  tus(e) {
    if (e.key !== 'Escape') return;
    if (this.ucanGrup != null) { const b = this.rayDugmeleri && this.rayDugmeleri[this.ucanGrup]; this.ucanKapat(); if (b) { this._sessiz = 1; b.focus(); this._sessiz = 0; } }
    else if (this.acik) this.kapat(this.acik !== 'arama');
    else if (this.cekmeceAcik) { this.cekmece(false); this.menuDugme.focus(); }
    else return;
    e.preventDefault();
  }

  // Açılırlardan (mega, arama, profil) yalnız biri açık.
  ac(tur, donus) {
    if (this.acik && this.acik !== tur) this.kapat(false);
    this.acik = tur; this._donus = donus;
    this.cekmece(false); this.ucanKapat();
    const r = this.ust.getBoundingClientRect();
    this.perde.style.setProperty('top', Math.max(0, r.bottom) + 'px');
    this.perde.className = 'ik-perde' + (tur === 'profil' ? ' ik-perde-saydam' : '');
    this.perde.hidden = false;
    this.ust.style.setProperty('--ik-ust-alt', Math.max(0, r.bottom) + 'px');
  }
  degistir(tur, dugme) {
    if (this.acik === tur) return this.kapat(true);
    this.ac(tur, dugme);
    const p = this.profil;
    p.hidden = false; dugme.setAttribute('aria-expanded', 'true');
    const ilk = p.querySelector('a, button');
    if (ilk) ilk.focus();
  }
  kapat(odak) {
    const t = this.acik;
    if (!t) return;
    this.acik = null; this.perde.hidden = true;
    if (t === 'mega') { this.mega.hidden = true; this.megaKey = null; this.katmanGuncelle(); }
    if (t === 'arama') { this.sonuc.hidden = true; this.giris.setAttribute('aria-expanded', 'false'); this.giris.removeAttribute('aria-activedescendant'); this.ust.classList.remove('ik-arama-acik'); if (this.kIptal) this.kIptal(); this.kd.clear(); }
    if (t === 'profil') { this.profil.hidden = true; this.profilDugme.setAttribute('aria-expanded', 'false'); }
    const d = this._donus; this._donus = null;
    if (odak && d && d.isConnected) d.focus();
  }

  sabitle(v) {
    this.sabit = !!v; yaz('idx-ust-sabit', this.sabit);
    this.ust.classList.toggle('ik-sabit', this.sabit);
    this.sabitDugme.setAttribute('aria-pressed', String(this.sabit));
    const t = this.sabit ? 'Üst çubuk sabit: kaydırınca da görünür. Serbest bırakmak için tıkla' : 'Üst çubuk serbest: sayfayla kayar. Sabitlemek için tıkla';
    this.sabitDugme.setAttribute('aria-label', t); this.sabitDugme.title = t;
  }

  durumYap(d) {
    this.a.durum = Object.assign({}, this.a.durum, d);
    const { baglanti, esitleme } = this.a.durum;
    const b = baglanti === true ? 'Bağlı' : baglanti === false ? 'Bağlantı yok' : 'Bağlantı bilinmiyor';
    const ad = this.k ? this.k.ad : '';
    this.kapsul.title = b + '. ' + ad + '. Son eşitleme ' + (esitleme || '—');
    this.kapsul.replaceChildren(
      h('span', { class: 'ik-canli', 'data-durum': String(baglanti) }), h('span', { class: 'ik-kapsul-ana' }, b),
      h('span', { class: 'ik-ayrac' }), h('span', null, ad), h('span', { class: 'ik-ayrac' }), h('span', null, 'Eşitleme ' + saatKisa(esitleme)));
  }

  // Rozet: 0 ise görünmez; bağlantı adına "N yeni" eklenir.
  rz(x) { return h('span', { class: 'ik-rozet', 'aria-hidden': 'true', 'data-r': x.url, 'data-ad': x.ad }); }
  rozetTazele(kok) {
    kok.querySelectorAll('.ik-rozet').forEach((s) => {
      const n = this.rozet[s.dataset.r] || 0;
      s.textContent = n > 99 ? '99+' : n; s.hidden = !n;
      s.parentNode.setAttribute('aria-label', s.dataset.ad + (n ? ', ' + n + ' yeni' : ''));
    });
  }
  rozetYap(url, sayi) { this.rozet[url] = rozetSay(sayi); this.rozetTazele(this); }

  kullaniciYap(k) {
    const kul = this.a.kullanici = { ad: String(k && k.ad || 'Kullanıcı').slice(0, 120), rol: String(k && k.rol || '').slice(0, 120), eposta: String(k && k.eposta || '').slice(0, 254) };
    const t = kul.ad + (kul.rol ? ', ' + kul.rol : '');
    this.profilDugme.setAttribute('aria-label', 'Profil: ' + t); this.profilDugme.title = t;
    this.profilDugme.textContent = kul.ad.charAt(0).toLocaleUpperCase('tr-TR');
    this.profil.replaceChildren(...[h('div', { class: 'ik-profil-ad' }, kul.ad), kul.rol ? h('div', { class: 'ik-soluk' }, kul.rol) : null,
      this.a.ayarlarUrl ? h('a', { href: this.a.ayarlarUrl, 'data-ik-git': '', class: 'ik-profil-ayar' }, svg(I.ayar, 14), 'Ayarlar') : null,
      this.a.cikisUrl ? h('a', { href: this.a.cikisUrl, 'data-ik-git': '', class: 'ik-profil-cikis' }, 'Çıkış yap') : null].filter(Boolean));
  }

  katmanCiz() {
    this.oklar = {};
    this.katmanNav.replaceChildren(...this.a.katmanlar.map((k) => {
      const sec = k.anahtar === this.a.katman, menu = k.gruplar.length > 0;
      const ok = menu ? h('button', {
        type: 'button', class: 'ik-ok', 'aria-expanded': 'false', 'aria-controls': 'ik-mega', 'aria-label': k.ad + ' sayfalarını göster',
        onclick: () => (this.acik === 'mega' && this.megaKey === k.anahtar ? this.kapat(true) : this.megaAc(k.anahtar))
      }, svg(ASAGI, 14, 2.2)) : null;
      if (ok) this.oklar[k.anahtar] = ok;
      return h('div', {
        class: 'ik-katman' + (sec ? ' ik-secili' : ''), css: { '--ik-k': k.renkKoyu },
        onmouseenter: () => { if (this.acik === 'mega' && menu && this.megaKey !== k.anahtar) this.megaAc(k.anahtar, true); }
      },
      h('a', { href: k.url, 'data-ik-git': '', class: 'ik-katman-ad', 'aria-current': sec ? 'page' : null, title: k.ad + ' ana sayfası' },
        h('span', { class: 'ik-katman-simge', 'aria-hidden': 'true' }, svg(SIMGE[k.simge], 14, 1.9)), k.ad), ok);
    }));
  }
  // Dar ekranda katman şeridi yatay kayar: seçili katman (simgeyle genişledi) görünür alana getirilir.
  katmanGoster() { const n = this.katmanNav, x = n.querySelector('.ik-secili'); if (x && n.scrollWidth > n.clientWidth) n.scrollLeft = x.offsetLeft - n.offsetLeft - 8; }
  katmanGuncelle() {
    for (const key in this.oklar) this.oklar[key].setAttribute('aria-expanded', String(this.acik === 'mega' && this.megaKey === key));
  }

  megaAc(key, gecis) {
    const odakIcerde = this.mega.contains(D.activeElement);
    this.ac('mega', this.oklar[key]);
    this.megaKey = key;
    const k = this.a.katmanlar.find((x) => x.anahtar === key);
    this.mega.style.setProperty('--ik-mr', k.renkKoyu);
    this.mega.setAttribute('aria-label', k.ad + ' sayfaları');
    let col = 1;
    this.mega.replaceChildren(
      h('div', { class: 'ik-mega-isik', 'aria-hidden': 'true' }), h('div', { class: 'ik-mega-cizgi', 'aria-hidden': 'true' }),
      h('div', { class: 'ik-mega-ic' },
        h('div', { class: 'ik-mega-sutun ik-mega-bas', css: { '--i': 0 } },
          h('div', { class: 'ik-mega-baslik' }, h('span', { class: 'ik-mega-kare', 'aria-hidden': 'true' }, svg(SIMGE[k.simge], 18, 1.8)), h('span', null, k.ad)),
          k.aciklama ? h('p', null, k.aciklama) : null,
          h('a', { href: k.url, 'data-ik-git': '', class: 'ik-mega-ana' }, 'Katman ana sayfası')),
        h('div', { class: 'ik-mega-gruplar' }, k.gruplar.map((g) => h('div', { class: 'ik-mega-sutun', css: { '--i': col++ } },
          h('div', { class: 'ik-mega-grup' }, g.baslik),
          g.moduller.map((m) => {
            if (!m.sayfalar.length) return h('div', null, h('a', { href: m.url, 'data-ik-git': '', class: 'ik-mega-oge', title: m.ad }, h('span', { class: 'ik-oge-nokta' }), h('span', { class: 'ik-oge-ad' }, m.ad), this.rz(m)));
            const kap = h('div');
            const b = h('button', {
              type: 'button', class: 'ik-mega-oge', 'aria-expanded': 'false', title: m.ad,
              onclick: () => {
                const acik = b.getAttribute('aria-expanded') === 'true';
                this.mega.querySelectorAll('.ik-akordeon').forEach((x) => { x.previousSibling.setAttribute('aria-expanded', 'false'); x.remove(); });
                if (acik) return;
                b.setAttribute('aria-expanded', 'true');
                let j = 0;
                kap.append(h('div', { class: 'ik-akordeon' }, [{ ad: m.ad + ' ana sayfası', url: m.url, ana: 1 }].concat(m.sayfalar).map((s) =>
                  h('a', { href: s.url, 'data-ik-git': '', class: 'ik-mega-oge ik-akordeon-oge' + (s.ana ? ' ik-ana-satir' : ''), css: { '--j': j++ } },
                    h('span', { class: 'ik-oge-ad' }, s.ad), s.ana ? null : this.rz(s), svg(SAG, 13, 2.2, 'ik-oge-ok')))));
                this.rozetTazele(kap);
              }
            }, h('span', { class: 'ik-oge-nokta' }), h('span', { class: 'ik-oge-ad' }, m.ad), this.rz(m), svg(ASAGI, 13, 2.2, 'ik-oge-don'));
            kap.append(b);
            return kap;
          }))))));
    this.mega.hidden = false;
    this.rozetTazele(this.mega);
    this.katmanGuncelle();
    if (!gecis || odakIcerde) { const ilk = this.mega.querySelector('a, button'); if (ilk) ilk.focus({ preventScroll: true }); }
  }

  aramaAc() {
    if (this.acik === 'arama') return;
    this.ac('arama', null);
    this.ust.classList.add('ik-arama-acik');
    this.secim = 0; this.sonuc.hidden = false; this.giris.setAttribute('aria-expanded', 'true');
    this.kaynakBaslat(); this.aramaCiz();
  }
  aramaKaynagiEkle(k) {
    const ad = k && typeof k.ara === 'function' && String(k.ad || '').trim();
    if (!ad || ad === 'Sayfalar' || ad === 'Eylemler') return () => {};
    const y = { ad, ara: k.ara };
    this.kaynaklar = this.kaynaklar.filter((x) => x.ad !== ad).concat(y);
    return () => { this.kaynaklar = this.kaynaklar.filter((x) => x !== y); if (this.kIptal) this.kIptal(); };
  }
  kaynakBaslat() {
    if (this.kIptal) this.kIptal();
    this.kd.clear();
    this.kIptal = kaynakAra(this.kaynaklar, this.giris.value, this.a.kokenler, (k, r) => { this.kd.set(k.ad, r); this.aramaCiz(1); });
    if (this.kIptal) this.kaynaklar.forEach((k) => this.kd.set(k.ad, 0));
  }
  aramaCiz(sakin) {
    const q = this.giris.value, kd = this.kDurum.textContent = kaynakDurumu(this.kaynaklar, this.kd);
    const sik = this.sekmeler.map((s) => s.url).concat(this.a.katmanlar.map((k) => (k.gruplar[0] && k.gruplar[0].moduller[0] || {}).url));
    const b = this.bulunan = aramaBirlestir(aramaSuz(this.havuz, q, sik), this.kaynaklar, this.kd);
    this.secim = Math.min(this.secim || 0, Math.max(0, b.length - 1));
    this.sonuc.classList.toggle('ik-ara-sakin', !!sakin);
    const grup = ['Sayfalar', 'Eylemler', ...this.kaynaklar.map((k) => k.ad)].map((tur) => {
      const s = b.filter((x) => x.tur === tur);
      if (!s.length) return null;
      return [h('div', { class: 'ik-ara-grup', role: 'presentation' }, q.trim() ? tur : tur === 'Sayfalar' ? 'Sık kullanılan sayfalar' : tur),
        s.map((x) => { const i = b.indexOf(x); return h('a', {
          id: 'ik-ara-' + i, role: 'option', tabindex: '-1', href: x.url, 'data-ik-git': '', class: 'ik-mega-oge ik-ara-oge',
          'aria-selected': String(i === this.secim), css: { '--j': i }, onmousedown: (e) => e.preventDefault()
        }, h('span', { class: 'ik-ara-simge', css: { color: x.renk } }, x.ksimge ? svg(SIMGE[x.ksimge], 15, 1.9) : x.simge), h('span', { class: 'ik-oge-ad' }, x.ad), h('span', { class: 'ik-ara-yol' }, x.yol)); })];
    });
    this.sonuc.replaceChildren(...[grup, b.length || kd ? null : h('div', { class: 'ik-ara-bos' }, '“' + q.trim() + '” için sonuç yok. Sayfa ya da modül adını dene.'), this.kDurum,
      h('div', { class: 'ik-ara-ipucu', 'aria-hidden': 'true' }, h('span', null, '↑ ↓ seç'), h('span', null, 'Enter git'), h('span', null, 'Esc kapat'))].flat(3).filter(Boolean));
    if (b.length) this.giris.setAttribute('aria-activedescendant', 'ik-ara-' + this.secim); else this.giris.removeAttribute('aria-activedescendant');
  }
  aramaTus(e) {
    const n = (this.bulunan || []).length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); this.aramaAc();
      this.secim = Math.max(0, Math.min(n - 1, this.secim + (e.key === 'ArrowDown' ? 1 : -1)));
      this.sonuc.querySelectorAll('[role=option]').forEach((o) => o.setAttribute('aria-selected', String(o.id === 'ik-ara-' + this.secim)));
      const s = D.getElementById('ik-ara-' + this.secim);
      if (s) { this.giris.setAttribute('aria-activedescendant', s.id); s.scrollIntoView({ block: 'nearest' }); }
    } else if (e.key === 'Enter' && n && this.acik === 'arama') {
      e.preventDefault();
      const x = this.bulunan[this.secim];
      this.giris.value = ''; this.giris.blur(); this.git(x.url);
    }
  }

  // Üst çubuktaki tema düğmesi açılır pencere açmaz: tıklayınca dört tema arasında sırayla geçer (Muhittin, 15 Kas 2026).
  temaCiz() {
    const ad = TEMA[GOR.tema], t = 'Tema: ' + ad + ' (değiştirmek için tıkla)';
    this.temaDugme.setAttribute('aria-label', t); this.temaDugme.title = t;
    this.temaDugme.replaceChildren(svg(I[GOR.tema], 17));
  }
  // Görünümü değiştirir (tema düğmesi ve <idexya-ayarlar>): kaydeder, uygular, `idexya-kabuk:gorunum` yayar.
  gorunumYap(p) {
    GOR = gorunumCoz(Object.assign({}, GOR, p)); yaz('idx-gorunum', GOR); gorunumUygula(); gorunumYayinla();
  }
  get gorunum() { return Object.assign({}, GOR); }
  darYap(v) { this.dar = !!v; yaz('idx-yan-dar', this.dar); this.ucanKapat(); if (this.yan) this.yanCiz(); }

  etkinYap(etkin) {
    const U = (x) => guvenliUrl(osAdresi(x), this.a.kokenler);
    if (this._ilk) this._sakin = 0;
    etkin = etkin || {};
    this.a.etkin = { modulUrl: U(etkin.modulUrl), sayfaUrl: U(etkin.sayfaUrl), ad: String(etkin.ad || '').slice(0, 120) };
    this.e = etkinBul(this.k, this.a.etkin);
    this.ayarda = !!this.a.ayarlarUrl && [this.a.etkin.sayfaUrl, this.a.etkin.modulUrl].includes(this.a.ayarlarUrl);
    if (this.ayarda && !this.a.etkin.ad) this.e.ad = 'Ayarlar';
    if (this.yan) {
      const genel = { ad: 'Genel bakış', url: this.k.url };
      const anahtar = 'idx-sekme-' + this.k.anahtar;
      const u = this.a.etkin.sayfaUrl || this.a.etkin.modulUrl;
      if (u) this.gorulen.add(u);
      this.sekmeler = sekmeEkle(oku(anahtar, []), u && u !== genel.url ? { ad: this.e.ad || u, url: u } : null, genel, 8, this.gorulen);
      yaz(anahtar, this.sekmeler);
      this.yanCiz(); this.sekmeCiz();
    } else this.sekmeler = [];
    this.sahneOynat();
  }

  get konum() {
    const g = this.k && this.e && this.k.gruplar[this.e.grup];
    return { katman: this.k ? this.k.ad : '', grup: g ? g.baslik : '', ad: this.e ? this.e.ad : '' };
  }

  sekmeCiz() {
    const u = this.a.etkin.sayfaUrl || this.a.etkin.modulUrl || this.k.url;
    const genel = { ad: 'Genel bakış', url: this.k.url };
    this.sekmeNav.replaceChildren(...this.sekmeler.map((s, i) => h('div', { class: 'ik-sekme' + (s.url === u ? ' ik-secili' : '') },
      h('a', { href: s.url, 'data-ik-git': '', 'aria-current': s.url === u ? 'page' : null }, s.ad),
      i ? h('button', {
        type: 'button', class: 'ik-sekme-kapat', 'aria-label': s.ad + ' sekmesini kapat',
        onclick: () => {
          const r = sekmeKapat(this.sekmeler, s.url, genel, u, this.gorulen);
          this.sekmeler = r.liste; yaz('idx-sekme-' + this.k.anahtar, r.liste); this.sekmeCiz();
          if (r.git) this.git(r.git); else { const l = this.sekmeNav.querySelector('a'); if (l) l.focus(); }
        }
      }, '×') : null)));
  }

  yanCiz() {
    const k = this.k, e = this.e;
    const dar = this.dar && !TEL.matches;
    this.yan.classList.toggle('ik-dar', dar);
    const dt = this.dar ? 'Menüyü genişlet' : 'Menüyü daralt';
    const daralt = h('button', {
      type: 'button', class: 'ik-ikon ik-cerceve ik-masa ik-daralt', 'aria-label': dt, title: dt,
      onclick: () => { this.darYap(!this.dar); this.yan.querySelector('.ik-daralt').focus(); }
    }, svg(I.daralt, 16));
    // Tüm grupları aç / kapat (Muhittin, 15 Kas 2026): seçim idx-yan-kapali-<katman> kaydında kalır; daraltılmış menüde yok.
    const hepsi = this.hepsiDugme = dar || k.gruplar.length < 2 ? null : h('button', {
      type: 'button', class: 'ik-ikon ik-cerceve ik-hepsi',
      onclick: () => { this.gecici.clear(); this.kapali = hepsiDegistir(k.gruplar, this.kapali); yaz('idx-yan-kapali-' + k.anahtar, this.kapali); this.grupDurum(); }
    });
    const bas = h('div', { class: 'ik-yan-bas' }, dar ? null : h('div', null, h('div', { class: 'ik-soluk ik-kucuk' }, 'Katman'), h('div', { class: 'ik-yan-ad' }, k.ad)),
      h('div', { class: 'ik-yan-dugmeler' }, hepsi, daralt));
    // Ayarlar ayrı bir sayfadır (ürünün `ayarlarUrl` adresi); adres yoksa bağlantı çizilmez.
    const alt = this.a.ayarlarUrl ? h('div', { class: 'ik-yan-alt' }, h('a', {
      href: this.a.ayarlarUrl, 'data-ik-git': '', class: 'ik-yan-ayar' + (this.ayarda ? ' ik-secili' : ''), 'aria-current': this.ayarda ? 'page' : null,
      'aria-label': dar ? 'Ayarlar' : null, title: dar ? 'Ayarlar' : null
    }, svg(I.ayar, 15), dar ? null : h('span', null, 'Ayarlar'))) : null;
    let govde;
    if (dar) {
      this.ucan = h('div', { id: 'ik-ucan', class: 'ik-ucan', role: 'dialog', hidden: true, onmouseenter: () => clearTimeout(this._ucanZ), onmouseleave: () => this.ucanBirak() });
      this.ucan.addEventListener('focusout', (ev) => { const r = ev.relatedTarget; if (r && !this.ucan.contains(r) && !(this.rayDugmeleri || []).includes(r)) this.ucanKapat(); });
      this.rayDugmeleri = k.gruplar.map((g, gi) => h('button', {
          type: 'button', class: 'ik-ray-dugme' + (gi === e.grup ? ' ik-icinde' : ''), 'aria-expanded': 'false', 'aria-controls': 'ik-ucan', 'aria-label': g.baslik + ': modülleri göster',
          onmouseenter: () => this.ucanAc(gi), onfocus: () => { if (!this._sessiz) this.ucanAc(gi); }, onmouseleave: () => this.ucanBirak(),
          onclick: (ev) => { this.ucanAc(gi); if (!ev.detail) this.ucanOdak(); },
          onkeydown: (ev) => { if (ev.key === 'ArrowRight') { ev.preventDefault(); this.ucanOdak(); } }
        }, svg(SIMGE[g.simge], 20, 1.7), h('span', { class: 'ik-ray-isaret' })));
      govde = [h('nav', { class: 'ik-ray', 'aria-label': k.ad + ' grupları' }, this.rayDugmeleri), this.ucan];
    } else {
      this.rayDugmeleri = null; this.ucan = null;
      // Gruplar her zaman çizilir, kapalı grup CSS ile (yükseklik geçişi) gizlenir: açıp kapamak ağacı yeniden kurmaz,
      // kaydırma yerinde kalır. Fareyle üzerine gelince kapalı grup geçici açılır (grupUzerinde; Muhittin, 15 Kas 2026).
      govde = h('nav', { class: 'ik-agac', 'aria-label': k.ad + ' modülleri', onpointerleave: (ev) => this.agacCik(ev) }, this.grupEl = k.gruplar.map((g, gi) => {
        return h('div', { class: 'ik-grup', onpointerenter: (ev) => this.grupUzerinde(gi, ev, 1), onpointerleave: (ev) => this.grupUzerinde(gi, ev, 0) },
          h('button', { type: 'button', class: 'ik-grup-bas', onclick: () => this.grupTikla(gi) },
            h('span', null, svg(SIMGE[g.simge], 14), g.baslik), svg(ASAGI, 12, 2, 'ik-grup-ok')),
          h('div', { class: 'ik-grup-kap' }, h('div', { class: 'ik-grup-ic' }, g.moduller.map((m) => {
            const ic = e.modul === m, sec = ic && !e.sayfa;
            const acik = m.sayfalar.length > 0 && (this.acikMod[m.url] === undefined ? ic : this.acikMod[m.url]);
            return h('div', { class: 'ik-modul' },
              h('div', { class: 'ik-modul-satir' + (sec ? ' ik-secili' : '') + (ic ? ' ik-icinde' : '') },
                h('a', { href: m.url, 'data-ik-git': '', 'aria-current': sec ? 'page' : null }, h('span', { class: 'ik-kare' }), h('span', null, m.ad), this.rz(m)),
                m.sayfalar.length ? h('button', {
                  type: 'button', class: 'ik-modul-ac', 'aria-expanded': String(acik), 'aria-label': m.ad + ' sayfalarını ' + (acik ? 'gizle' : 'göster'),
                  onclick: () => { this.acikMod[m.url] = !acik; this.yanCiz(); this.odakBul('.ik-modul-ac', m.ad); }
                }, svg(SAG, 12, 2)) : null),
              acik ? h('div', { class: this._sakin ? 'ik-sayfalar ik-sakin' : 'ik-sayfalar' }, m.sayfalar.map((s) => h('a', { href: s.url, 'data-ik-git': '', 'aria-current': e.sayfa === s ? 'page' : null }, s.ad, this.rz(s)))) : null);
          }))));
      }));
    }
    // Yeniden çizimde (modül açma, gezinme) fareyle açılmış grup açık kalır; dar kipte grup yok.
    if (dar) { this.grupEl = null; this.gecici.clear(); }
    const eski = this.yan.querySelector('.ik-agac'), kaydir = eski ? eski.scrollTop : 0;
    this.yan.replaceChildren(...[bas].concat(govde, alt || []));
    const yeni = this.yan.querySelector('.ik-agac');
    if (yeni && kaydir) yeni.scrollTop = kaydir;
    this.grupDurum();
    this.rozetTazele(this.yan);
  }

  // Grupların açık / kapalı hâli ve "tümünü aç / kapat" düğmesi yerinde güncellenir (ağaç yeniden kurulmaz).
  grupDurum() {
    const k = this.k;
    (this.grupEl || []).forEach((el, gi) => {
      const acik = !this.kapali.includes(k.gruplar[gi].baslik) || this.gecici.has(gi);
      el.classList.toggle('ik-kapali', !acik);
      el.classList.toggle('ik-gecici', this.gecici.has(gi));
      el.firstChild.setAttribute('aria-expanded', String(acik));
    });
    const b = this.hepsiDugme;
    if (b) {
      const a = hepsiAcik(k.gruplar, this.kapali), t = a ? 'Tüm grupları kapat' : 'Tüm grupları aç';
      b.setAttribute('aria-label', t); b.title = t; b.replaceChildren(svg(a ? I.hepsiKapat : I.hepsiAc, 16));
    }
  }
  // Tıklama kaydı değiştirir. Fareyle geçici açılmış grup (görünüşte açık) tıklanınca açık kalır ve kaydedilir.
  grupTikla(gi) {
    const b = this.k.gruplar[gi].baslik;
    clearTimeout(this._grupAc);
    if (this.gecici.delete(gi)) this.kapali = this.kapali.filter((x) => x !== b);
    else this.kapali = this.kapali.includes(b) ? this.kapali.filter((x) => x !== b) : this.kapali.concat(b);
    yaz('idx-yan-kapali-' + this.k.anahtar, this.kapali); this.grupDurum();
  }
  // Fare (dokunmatik ve kalem değil) kapalı grubun üzerinde 150 ms durunca grup geçici açılır; yukarı ya da yana çıkınca
  // 300 ms sonra kapanır. Aşağıdaki gruba geçerken üstteki kapanmaz (içerik imlecin altından kaymasın); menüden çıkınca
  // 300 ms sonra hepsi kapanır. Kayıtla açık gruplar (tıklama, "tümünü aç") zaten açıktır; etkin sayfanın grubu ve odağı
  // içeren grup kapanmaz. Telefonda (çekmece) yok.
  grupUzerinde(gi, ev, gir) {
    if (ev.pointerType !== 'mouse' || TEL.matches) return;
    clearTimeout(this._grupAc);
    if (gir) {
      clearTimeout(this.grupZ.get(gi));
      if (this.kapali.includes(this.k.gruplar[gi].baslik) && !this.gecici.has(gi)) this._grupAc = setTimeout(() => { this.gecici.add(gi); this.grupDurum(); }, 150);
    } else if (this.gecici.has(gi) && ev.clientY < this.grupEl[gi].getBoundingClientRect().bottom - 1) this.grupKapat(gi);
  }
  agacCik(ev) { if (ev.pointerType === 'mouse') { clearTimeout(this._grupAc); this.gecici.forEach((gi) => this.grupKapat(gi)); } }
  grupKapat(gi) {
    clearTimeout(this.grupZ.get(gi));
    this.grupZ.set(gi, setTimeout(() => {
      const el = this.grupEl && this.grupEl[gi];
      if (!el || gi === this.e.grup || el.contains(D.activeElement)) return;
      this.gecici.delete(gi); this.grupDurum();
    }, 300));
  }
  odakBul(sec, ad) { const b = [...this.yan.querySelectorAll(sec)].find((x) => (x.getAttribute('aria-label') || x.textContent).includes(ad)); if (b) b.focus(); }

  ucanAc(gi) {
    clearTimeout(this._ucanZ);
    if (this.acik) this.kapat(false);
    const b = this.rayDugmeleri[gi], g = this.k.gruplar[gi], e = this.e;
    this.rayDugmeleri.forEach((x, i) => x.setAttribute('aria-expanded', String(i === gi)));
    this.ucan.style.setProperty('top', Math.max(8, b.offsetTop - 10) + 'px');
    if (this.ucanGrup === gi && !this.ucan.hidden) return;
    this.ucanGrup = gi;
    this.ucan.setAttribute('aria-label', g.baslik);
    let u = 1;
    this.ucan.replaceChildren(h('div', { class: 'ik-ucan-ic' },
      h('div', { class: 'ik-u-oge ik-ucan-bas', css: { '--u': 0 } }, svg(SIMGE[g.simge], 18, 1.7), h('span', null, g.baslik), h('span', { class: 'ik-soluk' }, this.k.ad)),
      g.moduller.map((m) => h('div', { class: 'ik-u-oge', css: { '--u': u++ } },
        h('a', { href: m.url, 'data-ik-git': '', class: 'ik-ucan-modul', 'aria-current': e.modul === m && !e.sayfa ? 'page' : null },
          h('span', { class: 'ik-oge-nokta' }), h('span', { class: 'ik-oge-ad' }, m.ad), this.rz(m), svg(SAG, 13, 2.2, 'ik-oge-ok')),
        m.sayfalar.length ? h('div', { class: 'ik-ucan-sayfalar' }, m.sayfalar.map((s) => h('a', { href: s.url, 'data-ik-git': '', class: 'ik-ucan-sayfa', 'aria-current': e.sayfa === s ? 'page' : null }, s.ad))) : null))));
    this.ucan.hidden = false;
    this.rozetTazele(this.ucan);
  }
  ucanOdak() { const l = this.ucan && this.ucan.querySelector('a'); if (l) l.focus(); }
  ucanBirak() { clearTimeout(this._ucanZ); this._ucanZ = setTimeout(() => { if (!this.ucan || !this.ucan.contains(D.activeElement)) this.ucanKapat(); }, 180); }
  ucanKapat() {
    clearTimeout(this._ucanZ);
    if (this.ucan) this.ucan.hidden = true;
    (this.rayDugmeleri || []).forEach((x) => x.setAttribute('aria-expanded', 'false'));
    this.ucanGrup = null;
  }

  cekmece(v) {
    if (!this.yan || this.cekmeceAcik === v) return;
    this.cekmeceAcik = v;
    this.yan.classList.toggle('ik-cekmece-acik', v);
    this.menuDugme.setAttribute('aria-expanded', String(v));
    this.menuDugme.setAttribute('aria-label', v ? 'Menüyü kapat' : 'Menüyü aç');
    if (!this.acik) {
      this.perde.hidden = !v; this.perde.className = 'ik-perde ik-perde-cekmece';
      this.perde.style.setProperty('top', '0px');
    }
    if (v) { const l = this.yan.querySelector('a, button'); if (l) l.focus(); }
  }

  sahneOynat(kok) {
    kok = kok || this.icerik;
    if (!this._sakin) kok.querySelectorAll('[data-ik-sahne]').forEach((s) => {
      ['oge', 'satir'].forEach((a) => s.querySelectorAll('[data-ik-' + a + ']').forEach((o, i) => o.style.setProperty('--ik-s', i)));
      s.classList.remove('ik-sahne'); void s.offsetWidth; s.classList.add('ik-sahne');
    });
    const say = [...kok.querySelectorAll('[data-ik-sayac]')];
    say.forEach((x) => { if (x.dataset.ikHedef == null) x.dataset.ikHedef = x.textContent; });
    cancelAnimationFrame(this._raf);
    const bitir = () => say.forEach((x) => { x.textContent = x.dataset.ikHedef; });
    if (!say.length || azHareket() || this._sakin) return bitir();
    const bas = performance.now() + 250, sure = 1200;
    const adim = (t) => {
      const x = Math.min(1, Math.max(0, (t - bas) / sure)), y = 1 - Math.pow(1 - x, 3);
      say.forEach((el) => { el.textContent = sayiBicim(el.dataset.ikHedef, y); });
      if (x < 1) this._raf = requestAnimationFrame(adim); else bitir();
    };
    this._raf = requestAnimationFrame(adim);
  }
}

if (!customElements.get('idexya-kabuk')) customElements.define('idexya-kabuk', IdexyaKabuk);
