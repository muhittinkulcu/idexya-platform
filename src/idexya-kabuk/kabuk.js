// <idexya-kabuk>: üç ürünün ortak kabuğu. Sözleşme arayuz-kabugu.md, kullanım README.md.
// innerHTML, satır içi betik ve dış istek yok; veri textContent ile, stil CSSOM ile.
import {
  SIMGE, KALINLIK, YAZI_TIPI, TEMA, aile, ayarDogrula, etkinBul, aramaHavuzu, aramaSuz,
  sekmeListesi, sekmeEkle, sekmeKapat, gorunumCoz, sayiBicim, saatKisa, rozetSay, guvenliUrl, metinListesi
} from './kabuk-cekirdek.js';

const D = document, R = D.documentElement;
const MQ = matchMedia('(prefers-color-scheme: dark)');
const TEL = matchMedia('(max-width: 860px)');
const azHareket = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const oku = (k, v) => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x); } catch (e) { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli kip */ } };

let GOR = gorunumCoz(oku('idx-gorunum', null));
function gorunumUygula() {
  const k = KALINLIK[GOR.kalinlik];
  R.dataset.tema = GOR.tema === 'oto' ? (MQ.matches ? 'koyu' : 'acik') : GOR.tema;
  R.dataset.temaSecim = GOR.tema;
  R.style.setProperty('--ik-yazi', aile(GOR.yazi));
  ['ince', 'govde', 'orta', 'vurgu'].forEach((x) => R.style.setProperty('--w-' + x, k[x]));
}
gorunumUygula();
MQ.addEventListener('change', gorunumUygula);
addEventListener('storage', (e) => { if (e.key === 'idx-gorunum') { GOR = gorunumCoz(oku('idx-gorunum', null)); gorunumUygula(); } });

// Öğe kurucu: metin her zaman metin düğümü.
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
  ay: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'], menu: ['M4 6h16M4 12h16M4 18h16'],
  daralt: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M9 4v16'],
  ayar: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1']
};
const olay = (el, ad, detail, iptal) => el.dispatchEvent(new CustomEvent('idexya-kabuk:' + ad, { detail, bubbles: true, cancelable: !!iptal }));

class IdexyaKabuk extends HTMLElement {
  connectedCallback() {
    if (this._kuruldu) return;
    // Kabuk <head>'de klasik betikle tanımlıysa ayrıştırıcı öğenin içini yazarken buraya gelinir: kurulum kapanış etiketinden
    // hemen sonra (sonraki kardeş eklenince, ilk boyamadan önce) yapılır; içerik kabuksuz çizilmez.
    if (D.readyState === 'loading' && !this.nextSibling) {
      const g = new MutationObserver(() => { if (this.nextSibling) { g.disconnect(); this.connectedCallback(); } });
      g.observe(this.parentNode, { childList: true });
      D.addEventListener('DOMContentLoaded', () => { g.disconnect(); this.connectedCallback(); }, { once: true });
      return;
    }
    this._kuruldu = true;
    olay(this, 'kur', {}); // ürün ayar bloğunu son kez değiştirebilir (ör. etkin adres)
    // Oturumdaki ilk açılış değilse giriş hareketleri ve sayaçlar oynamaz; kabuk son hâliyle çizilir.
    try { this._sakin = sessionStorage.getItem('idx-acildi') === '1'; sessionStorage.setItem('idx-acildi', '1'); } catch (e) { /* gizli kip */ }
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
      oninput: () => { this.secim = 0; this.aramaAc(); this.aramaCiz(); },
      onkeydown: (e) => this.aramaTus(e)
    });
    this.sonuc = h('div', { id: 'ik-ara-sonuc', class: 'ik-ara-sonuc', role: 'listbox', 'aria-label': 'Arama sonuçları', hidden: true });
    this.kapsul = h('div', { class: 'ik-kapsul' });
    this.sabitDugme = h('button', { type: 'button', class: 'ik-ikon ik-masa', onclick: () => this.sabitle(!this.sabit) }, svg(I.raptiye, 16, 1.9));
    this.gorDugme = h('button', { type: 'button', class: 'ik-ikon', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'ik-gorunum', onclick: (e) => this.degistir('gorunum', e.currentTarget) }, svg(I.ay, 17));
    this.profilDugme = h('button', { type: 'button', class: 'ik-profil', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'ik-profil-menu', onclick: (e) => this.degistir('profil', e.currentTarget) });
    this.profil = h('div', { id: 'ik-profil-menu', class: 'ik-acilir ik-profil-menu', hidden: true });
    this.mega = h('div', { id: 'ik-mega', class: 'ik-mega', role: 'dialog', hidden: true });
    this.gorunum = h('div', { id: 'ik-gorunum', class: 'ik-acilir ik-gorunum', role: 'dialog', 'aria-label': 'Görünüm', hidden: true });
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
        this.gorDugme,
        h('div', { class: 'ik-profil-kap' }, this.profilDugme, this.profil)),
      this.perde, this.mega, this.gorunum);

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
        h('button', { type: 'button', class: 'ik-asistan', 'aria-label': a.asistan.etiket + ': asistanı aç', 'aria-haspopup': 'dialog', onclick: () => olay(this, 'asistan', {}) },
          h('img', { src: a.asistan.gorsel, alt: '', width: 52, height: 52, draggable: 'false' }))));
    }

    this.addEventListener('click', (e) => this.tikla(e));
    this.addEventListener('keydown', (e) => this.tus(e));
    [this.mega, this.gorunum, this.profil].forEach((p) => p.addEventListener('focusout', (e) => {
      const r = e.relatedTarget;
      if (r && !p.contains(r) && r !== this._donus) this.kapat(false);
    }));
    this.giris.addEventListener('blur', (e) => { const r = e.relatedTarget; if (r && !this.sonuc.contains(r) && this.acik === 'arama') this.kapat(false); });
    this.sabitle(oku('idx-ust-sabit', true));
    TEL.addEventListener('change', () => { if (this.yan) { this.cekmece(false); this.ucanKapat(); this.yanCiz(); } });
    this.katmanCiz(); this.durumYap(a.durum); this.kullaniciYap(a.kullanici); this.gorunumCiz();
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
  git(url) { this.kapat(false); url = guvenliUrl(url, this.a.kokenler); if (url && olay(this, 'git', { url }, true)) location.assign(url); }

  tus(e) {
    if (e.key !== 'Escape') return;
    if (this.ucanGrup != null) { const b = this.rayDugmeleri && this.rayDugmeleri[this.ucanGrup]; this.ucanKapat(); if (b) { this._sessiz = 1; b.focus(); this._sessiz = 0; } }
    else if (this.acik) this.kapat(this.acik !== 'arama');
    else if (this.cekmeceAcik) { this.cekmece(false); this.menuDugme.focus(); }
    else return;
    e.preventDefault();
  }

  // Açılırlardan (mega, arama, görünüm, profil) yalnız biri açık.
  ac(tur, donus) {
    if (this.acik && this.acik !== tur) this.kapat(false);
    this.acik = tur; this._donus = donus;
    this.cekmece(false); this.ucanKapat();
    const r = this.ust.getBoundingClientRect();
    this.perde.style.setProperty('top', Math.max(0, r.bottom) + 'px');
    this.perde.className = 'ik-perde' + (tur === 'gorunum' || tur === 'profil' ? ' ik-perde-saydam' : '');
    this.perde.hidden = false;
    this.ust.style.setProperty('--ik-ust-alt', Math.max(0, r.bottom) + 'px');
  }
  degistir(tur, dugme) {
    if (this.acik === tur) return this.kapat(true);
    this.ac(tur, dugme);
    const p = tur === 'gorunum' ? this.gorunum : this.profil;
    p.hidden = false; dugme.setAttribute('aria-expanded', 'true');
    const ilk = p.querySelector('[aria-pressed=true], a, button');
    if (ilk) ilk.focus();
  }
  kapat(odak) {
    const t = this.acik;
    if (!t) return;
    this.acik = null; this.perde.hidden = true;
    if (t === 'mega') { this.mega.hidden = true; this.megaKey = null; this.katmanGuncelle(); }
    if (t === 'arama') { this.sonuc.hidden = true; this.giris.setAttribute('aria-expanded', 'false'); this.giris.removeAttribute('aria-activedescendant'); this.ust.classList.remove('ik-arama-acik'); }
    if (t === 'gorunum') { this.gorunum.hidden = true; this.gorDugme.setAttribute('aria-expanded', 'false'); }
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
    const kul = this.a.kullanici = { ad: String(k && k.ad || 'Kullanıcı').slice(0, 120), rol: String(k && k.rol || '').slice(0, 120) };
    const t = kul.ad + (kul.rol ? ', ' + kul.rol : '');
    this.profilDugme.setAttribute('aria-label', 'Profil: ' + t); this.profilDugme.title = t;
    this.profilDugme.textContent = kul.ad.charAt(0).toLocaleUpperCase('tr-TR');
    this.profil.replaceChildren(...[h('div', { class: 'ik-profil-ad' }, kul.ad), kul.rol ? h('div', { class: 'ik-soluk' }, kul.rol) : null,
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
        k.anahtar === 'idos' ? null : h('span', { class: 'ik-nokta' }), k.ad), ok);
    }));
  }
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
          h('div', { class: 'ik-mega-baslik' }, h('span', { class: 'ik-mega-kare' }), h('span', null, k.ad)),
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
    this.aramaCiz();
  }
  aramaCiz() {
    const q = this.giris.value;
    const sik = this.sekmeler.map((s) => s.url).concat(this.a.katmanlar.map((k) => (k.gruplar[0] && k.gruplar[0].moduller[0] || {}).url));
    const b = this.bulunan = aramaSuz(this.havuz, q, sik);
    this.secim = Math.min(this.secim || 0, Math.max(0, b.length - 1));
    const grup = ['Sayfalar', 'Eylemler'].map((tur) => {
      const s = b.filter((x) => x.tur === tur);
      if (!s.length) return null;
      return [h('div', { class: 'ik-ara-grup', role: 'presentation' }, q.trim() ? tur : tur === 'Sayfalar' ? 'Sık kullanılan sayfalar' : tur),
        s.map((x) => { const i = b.indexOf(x); return h('a', {
          id: 'ik-ara-' + i, role: 'option', tabindex: '-1', href: x.url, 'data-ik-git': '', class: 'ik-mega-oge ik-ara-oge',
          'aria-selected': String(i === this.secim), css: { '--j': i }, onmousedown: (e) => e.preventDefault()
        }, h('span', { class: 'ik-ara-simge', css: { color: x.renk } }, x.simge), h('span', { class: 'ik-oge-ad' }, x.ad), h('span', { class: 'ik-ara-yol' }, x.yol)); })];
    });
    this.sonuc.replaceChildren(...[grup, b.length ? null : h('div', { class: 'ik-ara-bos' }, '“' + q.trim() + '” için sonuç yok. Sayfa ya da modül adını dene.'),
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

  gorunumCiz() {
    const sec = (alan, d, kapat) => () => {
      GOR = Object.assign({}, GOR, { [alan]: d }); yaz('idx-gorunum', GOR); gorunumUygula(); this.gorunumCiz();
      if (kapat) this.kapat(true); else { const b = this.gorunum.querySelector('[data-' + alan + '="' + d + '"]'); if (b) b.focus(); }
      olay(this, 'gorunum', Object.assign({}, GOR));
    };
    const k = KALINLIK[GOR.kalinlik];
    this.gorDugme.setAttribute('aria-label', 'Görünüm ve yazı: ' + TEMA[GOR.tema] + ', ' + YAZI_TIPI[GOR.yazi][0] + ', ' + k.ad);
    this.gorunum.replaceChildren(
      h('div', { class: 'ik-gor-baslik' }, 'Görünüm'),
      h('div', { class: 'ik-gor-temalar', role: 'group', 'aria-label': 'Tema' }, Object.keys(TEMA).map((t) => h('button', {
        type: 'button', class: 'ik-gor-tema', 'data-tema': t, 'aria-pressed': String(GOR.tema === t), onclick: sec('tema', t, true)
      }, h('span', { class: 'ik-onizleme ik-oniz-' + t, 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('i'), h('i'), h('i')), h('span', null, TEMA[t])))),
      h('p', { class: 'ik-gor-not' }, 'Otomatik, cihazının açık ya da koyu ayarını izler. Seçim bu tarayıcıda saklanır.'),
      h('div', { class: 'ik-gor-ara' }),
      h('div', { class: 'ik-gor-satir' }, h('div', { class: 'ik-gor-alt' }, 'Yazı kalınlığı'), h('div', { class: 'ik-soluk' }, k.aciklama)),
      h('div', { class: 'ik-gor-kalinlik', role: 'group', 'aria-label': 'Yazı kalınlığı' }, Object.keys(KALINLIK).map((x) => h('button', {
        type: 'button', 'data-kalinlik': x, 'aria-pressed': String(GOR.kalinlik === x), onclick: sec('kalinlik', x)
      }, h('span', { class: 'ik-aa', css: { 'font-weight': KALINLIK[x].orta } }, 'Aa'), h('span', null, KALINLIK[x].ad)))),
      h('div', { class: 'ik-gor-alt ik-ust-bosluk' }, 'Yazı tipi'),
      h('div', { class: 'ik-soluk' }, 'Hepsi Türkçe karakterleri tam destekler; örnekler seçtiğin kalınlıkla gösterilir.'),
      h('div', { class: 'ik-gor-yazilar', role: 'group', 'aria-label': 'Yazı tipi' }, Object.keys(YAZI_TIPI).map((y) => h('button', {
        type: 'button', class: 'ik-yazi-kart', 'data-yazi': y, 'aria-pressed': String(GOR.yazi === y), css: { 'font-family': aile(y) }, onclick: sec('yazi', y)
      }, h('span', { class: 'ik-yazi-ad' }, YAZI_TIPI[y][0], h('span', null, YAZI_TIPI[y][1])),
      h('span', { class: 'ik-yazi-buyuk' }, 'Günaydın ' + this.a.kullanici.ad + '.'),
      h('span', { class: 'ik-yazi-kucuk' }, '23 kritik konu · 18.000 TL · çğış ÇĞİŞ')))));
  }

  etkinYap(etkin) {
    const U = (x) => guvenliUrl(x, this.a.kokenler);
    if (this._ilk) this._sakin = 0;
    etkin = etkin || {};
    this.a.etkin = { modulUrl: U(etkin.modulUrl), sayfaUrl: U(etkin.sayfaUrl), ad: String(etkin.ad || '').slice(0, 120) };
    this.e = etkinBul(this.k, this.a.etkin);
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
    const daralt = h('button', {
      type: 'button', class: 'ik-ikon ik-cerceve ik-masa', 'aria-label': this.dar ? 'Menüyü genişlet' : 'Menüyü daralt', title: this.dar ? 'Menüyü genişlet' : 'Menüyü daralt',
      onclick: () => { this.dar = !this.dar; yaz('idx-yan-dar', this.dar); this.ucanKapat(); this.yanCiz(); this.yan.querySelector('.ik-yan-bas button').focus(); }
    }, svg(I.daralt, 16));
    const bas = h('div', { class: 'ik-yan-bas' }, dar ? null : h('div', null, h('div', { class: 'ik-soluk ik-kucuk' }, 'Katman'), h('div', { class: 'ik-yan-ad' }, k.ad)), daralt);
    const alt = h('div', { class: 'ik-yan-alt' }, h('button', { type: 'button', class: 'ik-yan-ayar', 'aria-label': 'Ayarlar: görünüm ve yazı', onclick: (ev) => this.degistir('gorunum', ev.currentTarget) },
      svg(I.ayar, 15), dar ? null : h('span', null, 'Ayarlar')));
    let govde;
    if (dar) {
      this.ucan = h('div', { id: 'ik-ucan', class: 'ik-ucan', role: 'dialog', hidden: true, onmouseenter: () => clearTimeout(this._ucanZ), onmouseleave: () => this.ucanBirak() });
      this.ucan.addEventListener('focusout', (ev) => { const r = ev.relatedTarget; if (r && !this.ucan.contains(r) && !(this.rayDugmeleri || []).includes(r)) this.ucanKapat(); });
      this.rayDugmeleri = k.gruplar.map((g, gi) => {
        const b = h('button', {
          type: 'button', class: 'ik-ray-dugme' + (gi === e.grup ? ' ik-icinde' : ''), 'aria-expanded': 'false', 'aria-controls': 'ik-ucan', 'aria-label': g.baslik + ': modülleri göster',
          onmouseenter: () => this.ucanAc(gi), onfocus: () => { if (!this._sessiz) this.ucanAc(gi); }, onmouseleave: () => this.ucanBirak(),
          onclick: (ev) => { this.ucanAc(gi); if (!ev.detail) this.ucanOdak(); },
          onkeydown: (ev) => { if (ev.key === 'ArrowRight') { ev.preventDefault(); this.ucanOdak(); } }
        }, svg(SIMGE[g.simge], 20, 1.7), h('span', { class: 'ik-ray-isaret' }));
        return b;
      });
      govde = [h('nav', { class: 'ik-ray', 'aria-label': k.ad + ' grupları' }, this.rayDugmeleri), this.ucan];
    } else {
      this.rayDugmeleri = null; this.ucan = null;
      govde = h('nav', { class: 'ik-agac', 'aria-label': k.ad + ' modülleri' }, k.gruplar.map((g) => {
        const kapali = this.kapali.includes(g.baslik);
        return h('div', { class: 'ik-grup' },
          h('button', {
            type: 'button', class: 'ik-grup-bas', 'aria-expanded': String(!kapali),
            onclick: () => { this.kapali = kapali ? this.kapali.filter((x) => x !== g.baslik) : this.kapali.concat(g.baslik); yaz('idx-yan-kapali-' + k.anahtar, this.kapali); this.yanCiz(); this.odakBul('.ik-grup-bas', g.baslik); }
          }, h('span', null, svg(SIMGE[g.simge], 14), g.baslik), svg(ASAGI, 12, 2, 'ik-grup-ok')),
          kapali ? null : h('div', { class: 'ik-grup-ic' }, g.moduller.map((m) => {
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
          })));
      }));
    }
    this.yan.replaceChildren(bas, ...[].concat(govde), alt);
    this.rozetTazele(this.yan);
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

  // Sahne hareketi; sayaç rAF ile bir kez sayar.
  sahneOynat(kok) {
    kok = kok || this.icerik;
    if (!this._sakin) kok.querySelectorAll('[data-ik-sahne]').forEach((s) => {
      s.querySelectorAll('[data-ik-oge]').forEach((o, i) => o.style.setProperty('--ik-s', i));
      s.querySelectorAll('[data-ik-satir]').forEach((o, i) => o.style.setProperty('--ik-s', i));
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
