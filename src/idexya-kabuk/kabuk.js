// <idexya-kabuk>: ortak kabuk. Kurallar README.md: innerHTML ve dış istek yok, veri textContent ile.
import {
  SIMGE, TEMA, temaCoz, sonrakiTema, sinirBekle, ayarDogrula, etkinBul, etkinKatman, katmanRozeti, aramaHavuzu, aramaSuz, kaynakAra, aramaBirlestir,
  kaynakDurumu, sekmeEkle, sekmeKapat, gorunumCoz, sayiBicim, saatKisa, rozetSay, guvenliUrl, metinListesi, osAdresi, durumCoz, sutunBol, kediKonum, grupOzet, onizlemeCoz, egriYol
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
  daralt: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M9 4v16'],
  cikis: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 17l5-5-5-5', 'M15 12H4'],
  ayar: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1']
};
const olay = (el, ad, detail, iptal) => el.dispatchEvent(new CustomEvent('idexya-kabuk:' + ad, { detail, bubbles: true, cancelable: !!iptal }));

class IdexyaKabuk extends HTMLElement {
  kaynaklar = []; kd = new Map(); uyari = {}; oz = new Map(); _oz = 0;
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
    // Tek gezinme: sol menüde bütün maddeler; açık madde adrese göre bulunur (etkinYap), yoksa ürünün varsayılanı (`katman`).
    this.k = etkinKatman(ayar.katmanlar, ayar.etkin, ayar.katman);
    this.ana = ayar.katmanlar.find((x) => x.anahtar === 'genel') || ayar.katmanlar[0] || null;
    this.acik = null;
    this.dar = !!oku('idx-yan-dar', false);
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
    addEventListener('storage', (e) => { if (e.key === 'idx-musteri') this.onizlemeSifirla(); });
    olay(this, 'hazir', { ayar });
  }

  kur() {
    const a = this.a, kok = this.ana;
    const icerik = [...this.childNodes];
    this.classList.add('ik');
    this.renkYap();
    const menuVar = a.katmanlar.length > 0;

    this.giris = h('input', {
      type: 'search', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'ik-ara-sonuc', 'aria-autocomplete': 'list',
      'aria-label': 'IDOS içinde ara', placeholder: 'Ara: sayfa, modül, eylem', autocomplete: 'off', spellcheck: 'false',
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
    this.perde = h('div', { class: 'ik-perde', hidden: true, onclick: () => { this.kapat(false); this.cekmece(false); } });
    // Üst alandaki ürün yuvası (aktif müşteri seçimi, tarih aralığı): ürün kendi denetimlerini buraya koyar (README "Üst alan").
    this.yuva = h('div', { class: 'ik-ust-yuva' });
    // Sağ yuva (Muhittin, 20 Kas 2026): tarih aralığı aramanın sağında; sol yuvada müşteri ve platform kalır.
    this.yuvaSag = h('div', { class: 'ik-ust-yuva ik-ust-yuva-sag' });
    this.menuDugme = menuVar ? h('button', { type: 'button', class: 'ik-ikon ik-tel', 'aria-label': 'Menüyü aç', 'aria-expanded': 'false', 'aria-controls': 'ik-yan', onclick: () => this.cekmece(!this.cekmeceAcik) }, svg(I.menu, 18)) : null;

    // Üst alan (talimat 4.2): IDOS kimliği, ürün yuvası (müşteri, tarih), arama, eşitleme durumu, bildirimler, tema, kullanıcı.
    // Modül sekmesi ve mega menü yoktur: modül gezinmesi yalnız sol menüdedir.
    this.ust = h('header', { class: 'ik-ust' },
      this.menuDugme,
      h('a', { class: 'ik-logo', href: kok ? kok.url : '/', 'data-ik-git': '', 'aria-label': 'IDOS ana ekranı' },
        h('span', { class: 'ik-logo-x' }, svg(I.x, 22, 3)), h('span', { class: 'ik-logo-ad' }, 'IDOS')),
      this.yuva,
      h('div', { class: 'ik-ara-kap' }, h('div', { class: 'ik-ara-alan' },
        h('label', { class: 'ik-ara' }, svg(I.ara, 15, 2), this.giris, h('kbd', { class: 'ik-masa' }, /Mac|iP/.test(navigator.platform) ? '⌘K' : 'Ctrl K')),
        this.sonuc)),
      this.yuvaSag,
      h('div', { class: 'ik-arac' },
        this.kapsul, this.sabitDugme,
        a.bildirimUrl ? h('a', { class: 'ik-ikon', href: a.bildirimUrl, 'data-ik-git': '', 'aria-label': 'Bildirimler', title: 'Bildirimler' }, svg(I.zil, 17)) : null,
        this.temaDugme,
        h('div', { class: 'ik-profil-kap' }, this.profilDugme, this.profil)),
      this.perde);

    this.icerik = h('div', { class: 'ik-icerik' }, icerik);
    const ana = h('main', { class: 'ik-ana' });
    if (menuVar) {
      this.sekmeNav = h('nav', { class: 'ik-sekmeler', 'aria-label': 'Açık sayfalar' });
      this.yan = h('aside', { id: 'ik-yan', class: 'ik-yan', 'aria-label': 'IDOS menüsü' });
      this.gez = h('div', { id: 'ik-gez', class: 'ik-gez', role: 'dialog', 'aria-label': 'Sayfa gezgini', hidden: true, onkeydown: (ev) => this.gezTus(ev) });
      ana.append(this.sekmeNav);
    }
    ana.append(this.icerik);
    this.replaceChildren(this.ust, h('div', { class: 'ik-govde' }, this.yan, ana), this.gez || []);
    if (a.asistan) {
      // Görsel kabuğun kedisidir (kabuk.css .ik-kedi → kedi.webp); üç üründe aynı.
      // Sürükle bırak (Muhittin, 20 Kas 2026): kedi bırakıldığı yere yapışır (idx-asistan-konum, ekran oranı olarak);
      // 5 px'ten az kayma tıklamadır. Çift tık eski yerine (sağ alt) döndürür.
      const düğme = h('button', { type: 'button', class: 'ik-asistan', 'aria-label': a.asistan.etiket + ': asistanı aç (sürükleyerek taşıyabilirsin)', 'aria-haspopup': 'dialog' },
        h('span', { class: 'ik-kedi', 'aria-hidden': 'true' }));
      this.asistanKap = h('div', { class: 'ik-asistan-kap' }, h('span', { class: 'ik-asistan-ipucu', 'aria-hidden': 'true' }, a.asistan.etiket), düğme);
      this.append(this.asistanKap);
      this.kediYerlestir(oku('idx-asistan-konum', null));
      let baş = null, sürüklendi = false;
      düğme.addEventListener('pointerdown', (e) => {
        if (e.button) return;
        const r = this.asistanKap.getBoundingClientRect(), k = düğme.getBoundingClientRect();
        baş = { x: e.clientX, y: e.clientY, dx: e.clientX - k.left, dy: e.clientY - k.top, w: k.width, h: k.height, sol: r.left };
        sürüklendi = false;
        düğme.setPointerCapture(e.pointerId);
      });
      düğme.addEventListener('pointermove', (e) => {
        if (!baş) return;
        if (!sürüklendi && Math.hypot(e.clientX - baş.x, e.clientY - baş.y) < 5) return;
        sürüklendi = true;
        this.asistanKap.classList.add('ik-suruklen');
        const p = kediKonum(e.clientX - baş.dx, e.clientY - baş.dy, baş.w, baş.h, innerWidth, innerHeight);
        this.kediYerlestir({ x: p.x / innerWidth, y: p.y / innerHeight }, true);
      });
      const bitir = (e) => {
        if (!baş) return;
        baş = null;
        this.asistanKap.classList.remove('ik-suruklen');
        if (sürüklendi) { yaz('idx-asistan-konum', this._kediKonum); e.preventDefault(); }
      };
      düğme.addEventListener('pointerup', bitir);
      düğme.addEventListener('pointercancel', bitir);
      düğme.addEventListener('click', (e) => { if (sürüklendi) { sürüklendi = false; e.preventDefault(); return; } olay(this, 'asistan', {}); });
      düğme.addEventListener('dblclick', () => { yaz('idx-asistan-konum', null); this.kediYerlestir(null); });
      addEventListener('resize', () => this.kediYerlestir(this._kediKonum));
    }

    this.addEventListener('click', (e) => this.tikla(e));
    this.addEventListener('keydown', (e) => this.tus(e));
    this.profil.addEventListener('focusout', (e) => {
      const r = e.relatedTarget;
      if (r && !this.profil.contains(r) && r !== this._donus) this.kapat(false);
    });
    this.giris.addEventListener('blur', (e) => { const r = e.relatedTarget; if (r && !this.sonuc.contains(r) && this.acik === 'arama') this.kapat(false); });
    this.sabitle(oku('idx-ust-sabit', true));
    TEL.addEventListener('change', () => { if (this.yan) { this.kapat(false); this.cekmece(false); this.ucanKapat(); this.yanCiz(); } });
    this.durumYap(a.durum); this.kullaniciYap(a.kullanici); this.temaCiz();
  }
  // Ürünün denetimlerinin yuvası (üst alan). Ürün içine kendi öğelerini koyar (React: createPortal); kabuk içine dokunmaz.
  get ustYuva() { return this.yuva; }
  get ustYuvaSag() { return this.yuvaSag; }
  renkYap() { const k = this.k; if (k) { this.style.setProperty('--ik-renk', k.renk); this.style.setProperty('--ik-renk-koyu', k.renkKoyu); } }

  // `idexya-kabuk:git` iptal edilirse yönlendirmeyi ürün yapar.
  tikla(e) {
    const l = e.target.closest('a[data-ik-git]');
    if (!l || !this.contains(l) || this.icerik.contains(l)) return;
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (this.sonuc.contains(l)) this.giris.value = '';
    this.kapat(false); this.cekmece(false); this.ucanKapat();
    if (l.classList.contains('ik-profil-cikis')) try { Object.keys(localStorage).forEach((k) => /^idx-(sekme|musteri|yan-(kapali|acik|modul))/.test(k) && localStorage.removeItem(k)); Object.keys(sessionStorage).forEach((k) => /^idx-/.test(k) && sessionStorage.removeItem(k)); } catch (x) { /* gizli kip */ }
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

  // Açılırlardan (gezgin, arama, profil) yalnız biri açık.
  ac(tur, donus) {
    if (this.acik && this.acik !== tur) this.kapat(false);
    this.acik = tur; this._donus = donus;
    this.cekmece(false); this.ucanKapat();
    const r = this.ust.getBoundingClientRect();
    this.perde.style.setProperty('top', Math.max(0, r.bottom) + 'px');
    this.perde.className = 'ik-perde' + (tur === 'profil' ? ' ik-perde-saydam' : tur === 'gezgin' ? ' ik-perde-gez' : '');
    this.perde.hidden = false;
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
    if (t === 'arama') { this.sonuc.hidden = true; this.giris.setAttribute('aria-expanded', 'false'); this.giris.removeAttribute('aria-activedescendant'); this.ust.classList.remove('ik-arama-acik'); if (this.kIptal) this.kIptal(); this.kd.clear(); }
    if (t === 'profil') { this.profil.hidden = true; this.profilDugme.setAttribute('aria-expanded', 'false'); }
    if (t === 'gezgin') { clearTimeout(this._gz); this.gez.hidden = true; this.classList.remove('ik-gez-acik'); this.kokDurum(); }
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

  // Durum kapsülü: Bağlı | Bağlantı yok | uyarı (ürünün kısa metni, sarı nokta; yalnız renkle anlatılmaz) | bilinmiyor.
  // `url` varsa kapsül o adrese gider (idexya-kabuk:git olayıyla). Eski değerler (true, false, null) aynen çalışır.
  durumYap(d) {
    const g = Object.assign({}, this.a.durum, d);
    this.a.durum = durumCoz(g, (x) => guvenliUrl(osAdresi(x), this.a.kokenler));
    const { baglanti, esitleme, metin, url } = this.a.durum;
    const b = baglanti === true ? 'Bağlı' : baglanti === false ? 'Bağlantı yok' : baglanti === 'uyari' ? metin : 'Bağlantı bilinmiyor';
    const t = 'Veri eşitleme: ' + b + '. Son eşitleme ' + (esitleme || '—') + (url ? '. Ayrıntı için tıkla' : '');
    const ic = [h('span', { class: 'ik-canli', 'data-durum': String(baglanti) }), h('span', { class: 'ik-kapsul-ana' }, b),
      h('span', { class: 'ik-ayrac' }), h('span', null, 'Eşitleme ' + saatKisa(esitleme))];
    this.kapsul.classList.toggle('ik-kapsul-uyari', baglanti === 'uyari');
    this.kapsul.title = t;
    this.kapsul.replaceChildren(url ? h('a', { href: url, 'data-ik-git': '', class: 'ik-kapsul-bag', 'aria-label': t }, ic) : h('span', { class: 'ik-kapsul-bag' }, ic));
  }

  // Rozet: 0 ise görünmez; bağlantı adına "N yeni" eklenir.
  rz(x) { return h('span', { class: 'ik-rozet', 'aria-hidden': 'true', 'data-r': x.url, 'data-ad': x.ad }); }
  rozetTazele(kok) {
    kok.querySelectorAll('.ik-rozet').forEach((s) => {
      const km = s.dataset.k && this.a.katmanlar.find((x) => x.anahtar === s.dataset.k);
      const n = km ? katmanRozeti(km, this.rozet) : this.rozet[s.dataset.r] || 0;
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
    this.hesapCiz();
  }

  // Hesap sol menünün altında (Muhittin, 20 Kas 2026): baş harf + ad + rol, yanında Çıkış. Daraltılmış menüde alt alta iki
  // simge. Üst çubuktaki profil düğmesi telefonda kalır (menü orada çekmece); masaüstünde CSS ile gizlenir.
  // Kedinin yeri: null = varsayılan (sağ alt, kenara yarı gizli); {x, y} = ekran oranı. İpucu boş tarafa açılır.
  kediYerlestir(o, sürüklerken = false) {
    const kap = this.asistanKap;
    if (!kap) return;
    this._kediKonum = o && Number.isFinite(o.x) && Number.isFinite(o.y) ? { x: o.x, y: o.y } : null;
    kap.classList.toggle('ik-serbest', !!this._kediKonum);
    if (!this._kediKonum) { kap.style.removeProperty('left'); kap.style.removeProperty('top'); kap.classList.remove('ik-ipucu-sag'); return; }
    const d = kap.querySelector('.ik-asistan'), w = d.offsetWidth || 52, hh = d.offsetHeight || 52;
    const p = kediKonum(this._kediKonum.x * innerWidth, this._kediKonum.y * innerHeight, w, hh, innerWidth, innerHeight);
    const sağa = p.x < innerWidth / 2;
    kap.classList.toggle('ik-ipucu-sag', sağa);
    const ipucu = sağa ? 0 : (kap.querySelector('.ik-asistan-ipucu').offsetWidth + 10);
    kap.style.left = (p.x - ipucu) + 'px'; kap.style.top = p.y + 'px';
    if (!sürüklerken) this._kediKonum = { x: p.x / innerWidth, y: p.y / innerHeight };
  }

  hesapCiz() {
    if (!this.hesapKap) return;
    const kul = this.a.kullanici || { ad: 'Kullanıcı', rol: '' }, dar = this.yan.classList.contains('ik-dar');
    const t = kul.ad + (kul.rol ? ', ' + kul.rol : '');
    const kim = h('div', { class: 'ik-hesap-kim', title: dar ? t : null, 'aria-label': dar ? t : null, role: dar ? 'img' : null },
      h('span', { class: 'ik-hesap-harf', 'aria-hidden': 'true' }, kul.ad.charAt(0).toLocaleUpperCase('tr-TR')),
      dar ? null : h('span', { class: 'ik-hesap-yazi' }, h('span', { class: 'ik-hesap-ad' }, kul.ad), kul.rol ? h('span', { class: 'ik-hesap-rol' }, kul.rol) : null));
    const çıkış = this.a.cikisUrl ? h('a', { href: this.a.cikisUrl, 'data-ik-git': '', class: 'ik-profil-cikis ik-hesap-cikis', 'aria-label': 'Çıkış yap', title: 'Çıkış yap' },
      svg(I.cikis, 16)) : null;
    this.hesapKap.replaceChildren(...[kim, çıkış].filter(Boolean));
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
          id: 'ik-ara-' + i, role: 'option', tabindex: '-1', href: x.url, 'data-ik-git': '', class: 'ik-liste-oge ik-ara-oge',
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
    const k = etkinKatman(this.a.katmanlar, this.a.etkin, this.a.katman);
    // Başka maddeye geçince o maddenin yolu açılır (kullanıcı daha önce kapatmış olsa da).
    if (k !== this.k) { this.k = k; this.renkYap(); }
    this.e = etkinBul(this.k, this.a.etkin);
    this.ayarda = !!this.a.ayarlarUrl && [this.a.etkin.sayfaUrl, this.a.etkin.modulUrl].includes(this.a.ayarlarUrl);
    if (this.ayarda && !this.e.ad) this.e.ad = 'Ayarlar';
    if (!this.e.ad && this.k && [this.a.etkin.sayfaUrl, this.a.etkin.modulUrl].includes(this.k.url)) this.e.ad = this.k.ad;
    if (this.yan) {
      // Sekmeler tek listedir (idx-sekme): bütün maddeler tek gezinmede; ilk sekme ana ekrandır.
      const genel = this.genelSekme();
      const u = this.a.etkin.sayfaUrl || this.a.etkin.modulUrl;
      if (u) this.gorulen.add(u);
      // Adı bilinmeyen adres (menüde yok, ürün ad vermedi) sekme olmaz: sekmede ham adres görünmez.
      this.sekmeler = sekmeEkle(oku('idx-sekme', []), u && u !== genel.url && this.e.ad ? { ad: this.e.ad, url: u } : null, genel, 8, this.gorulen);
      yaz('idx-sekme', this.sekmeler);
      this.yanCiz(); this.sekmeCiz();
    } else this.sekmeler = [];
    this.sahneOynat();
  }

  genelSekme() { return { ad: 'Genel bakış', url: this.ana ? this.ana.url : '/' }; }
  get konum() {
    const g = this.k && this.e && this.k.gruplar[this.e.grup];
    return { katman: this.k ? this.k.ad : '', grup: g ? g.baslik : '', ad: this.e ? this.e.ad : '' };
  }

  sekmeCiz() {
    const genel = this.genelSekme();
    const u = this.a.etkin.sayfaUrl || this.a.etkin.modulUrl || genel.url;
    this.sekmeNav.replaceChildren(...this.sekmeler.map((s, i) => h('div', { class: 'ik-sekme' + (s.url === u ? ' ik-secili' : '') },
      h('a', { href: s.url, 'data-ik-git': '', 'aria-current': s.url === u ? 'page' : null }, s.ad),
      i ? h('button', {
        type: 'button', class: 'ik-sekme-kapat', 'aria-label': s.ad + ' sekmesini kapat',
        onclick: () => {
          const r = sekmeKapat(this.sekmeler, s.url, genel, u, this.gorulen);
          this.sekmeler = r.liste; yaz('idx-sekme', r.liste); this.sekmeCiz();
          if (r.git) this.git(r.git); else { const l = this.sekmeNav.querySelector('a'); if (l) l.focus(); }
        }
      }, '×') : null)));
  }

  kokRozet(k) { return h('span', { class: 'ik-rozet', 'aria-hidden': 'true', 'data-k': k.anahtar, 'data-ad': k.ad }); }

  yanCiz() {
    const k = this.k, e = this.e, kl = this.a.katmanlar;
    const dar = this.dar && !TEL.matches;
    this.yan.classList.toggle('ik-dar', dar);
    const dt = this.dar ? 'Menüyü genişlet' : 'Menüyü daralt';
    const daralt = h('button', {
      type: 'button', class: 'ik-ikon ik-cerceve ik-masa ik-daralt', 'aria-label': dt, title: dt,
      onclick: () => { this.darYap(!this.dar); this.yan.querySelector('.ik-daralt').focus(); }
    }, svg(I.daralt, 16));
    const bas = h('div', { class: 'ik-yan-bas' }, dar ? null : h('div', { class: 'ik-soluk ik-kucuk' }, 'Modül'),
      h('div', { class: 'ik-yan-dugmeler' }, daralt));
    // Ayarlar sol menüde bir maddedir. Ürünün Ayarlar sayfası ağaçta yoksa (ör. müşteri hesabında madde süzüldüyse) altta bağlantı kalır.
    const ayarAgacta = !this.a.ayarlarUrl || kl.some((x) => x.url === this.a.ayarlarUrl || x.gruplar.some((g) => g.moduller.some((m) => m.url === this.a.ayarlarUrl || m.sayfalar.some((y) => y.url === this.a.ayarlarUrl))));
    const alt = ayarAgacta ? null : h('div', { class: 'ik-yan-alt' }, h('a', {
      href: this.a.ayarlarUrl, 'data-ik-git': '', class: 'ik-yan-ayar' + (this.ayarda ? ' ik-secili' : ''), 'aria-current': this.ayarda ? 'page' : null,
      'aria-label': dar ? 'Ayarlar' : null, title: dar ? 'Ayarlar' : null
    }, svg(I.ayar, 15), dar ? null : h('span', null, 'Ayarlar')));
    let govde;
    if (this.acik === 'gezgin') this.kapat(false);
    this.kokDugmeleri = [];
    if (dar) {
      this.ucan = h('div', { id: 'ik-ucan', class: 'ik-ucan', role: 'dialog', hidden: true, onmouseenter: () => clearTimeout(this._ucanZ), onmouseleave: () => this.ucanBirak() });
      this.ucan.addEventListener('focusout', (ev) => { const r = ev.relatedTarget; if (r && !this.ucan.contains(r) && !(this.rayDugmeleri || []).includes(r)) this.ucanKapat(); });
      this.rayDugmeleri = kl.map((x, ki) => h('button', {
          type: 'button', class: 'ik-ray-dugme' + (x === k ? ' ik-icinde' : ''), 'aria-expanded': 'false', 'aria-controls': 'ik-ucan', 'aria-label': x.ad + ': sayfaları göster',
          onmouseenter: () => this.ucanAc(ki), onfocus: () => { if (!this._sessiz) this.ucanAc(ki); }, onmouseleave: () => this.ucanBirak(),
          onclick: (ev) => { this.ucanAc(ki); if (!ev.detail) this.ucanOdak(); },
          onkeydown: (ev) => { if (ev.key === 'ArrowRight') { ev.preventDefault(); this.ucanOdak(); } }
        }, svg(SIMGE[x.simge], 20, 1.7), h('span', { class: 'ik-ray-isaret' }), this.kokRozet(x)));
      govde = [h('nav', { class: 'ik-ray', 'aria-label': 'IDOS menüsü' }, this.rayDugmeleri), this.ucan];
    } else {
      this.rayDugmeleri = null; this.ucan = null;
      // Geniş menü: yalnız madde satırları (F2). Grubu olan madde gezgini açar; grupsuz madde (Ayarlar) doğrudan bağlantıdır.
      govde = h('nav', { class: 'ik-agac', 'aria-label': 'IDOS menüsü', onkeydown: (ev) => this.kokTus(ev) }, kl.map((x) => {
        const ic = [h('span', { class: 'ik-kok-simge' }, svg(SIMGE[x.simge], 17, 1.8)), h('span', { class: 'ik-kok-ad' }, x.ad), this.kokRozet(x)];
        const sinif = 'ik-kok-satir' + (x === k ? ' ik-etkin' : '');
        if (!x.gruplar.length) return h('a', { href: x.url, 'data-ik-git': '', class: sinif, 'aria-current': [this.a.etkin.sayfaUrl, this.a.etkin.modulUrl].includes(x.url) ? 'page' : null }, ic);
        const ki = kl.indexOf(x), b = h('button', {
          type: 'button', class: sinif, 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'ik-gez', 'data-ik-yol': x.anahtar,
          onclick: (ev) => this.gezAc(ki, !ev.detail)
        }, ic, svg(SAG, 13, 2, 'ik-kok-ok'));
        this.kokDugmeleri[ki] = b;
        return b;
      }));
    }
    const eski = this.yan.querySelector('.ik-agac'), kaydir = eski ? eski.scrollTop : 0;
    this.hesapKap = h('div', { class: 'ik-yan-hesap' });
    this.yan.replaceChildren(...[bas].concat(govde, alt || [], this.hesapKap));
    this.hesapCiz();
    const yeni = this.yan.querySelector('.ik-agac');
    if (yeni && kaydir) yeni.scrollTop = kaydir;
    this.rozetTazele(this.yan);
  }

  // Sütun gezgini (F2; Muhittin, 22 Kas 2026; karar IDOS docs/kararlar/2026-11-22-yeni-arayuz-sutun-gezgini.md). Geniş menüde
  // maddeye tıklayınca sayfanın üstünde açılır: gruplar (tek gruplu maddede yok) › bölümler ve "<bölüm> içinde" sayfaları ›
  // önizleme kartı. Bölüm ve sayfa satırı bağlantıdır (tık sayfaya gider); fareyle üzerinde durmak ya da odak seçer, sağdaki
  // sütun ve kart yenilenir. Klavye: ↑ ↓ sütunda, → sonraki sütun, ← önceki sütun ya da menü, Esc kapatır.
  gezAc(ki, odak) {
    const k = this.a.katmanlar[ki];
    if (this.acik === 'gezgin' && this.gk === k && !odak) return this.kapat(true);
    this.ac('gezgin', this.kokDugmeleri[ki]);
    const e = k === this.k ? this.e : { grup: -1, modul: null, sayfa: null };
    this.gk = k; this.gs = { g: Math.max(0, e.grup), m: e.modul, s: e.sayfa };
    this.classList.add('ik-gez-acik'); this.kokDurum(ki);
    const yt = Math.max(0, this.ust.getBoundingClientRect().bottom);
    this.gez.style.setProperty('top', yt + 'px'); this.gez.style.setProperty('left', this.yan.getBoundingClientRect().right + 'px');
    this.gez.hidden = false; this.gezCiz(1);
    if (odak) { const l = this.gez.querySelector('.ik-secili,.ik-gez-oge'); if (l) l.focus(); }
  }
  kokDurum(ki) { (this.kokDugmeleri || []).forEach((b, i) => b.setAttribute('aria-expanded', String(i === ki))); }
  gezSec(y, gecikme) {
    clearTimeout(this._gz);
    if (gecikme) return this._gz = setTimeout(() => this.gezSec(y), gecikme);
    const s = this.gs;
    if (s.g === y.g && s.m === y.m && s.s === y.s) return;
    this.gs = y; this.gezCiz();
  }
  gezBag(x, sec, y, ok) {
    const e = this.e, su = x === e.sayfa || (x === e.modul && !e.sayfa);
    const a = h('a', {
      href: x.url, 'data-ik-git': '', 'data-ik-yol': x.url, class: 'ik-gez-oge' + (sec ? ' ik-secili' : ''), 'aria-current': su ? 'page' : null,
      onpointerenter: (ev) => ev.pointerType === 'mouse' && this.gezSec(y, 120), onpointerleave: () => clearTimeout(this._gz),
      onfocus: () => this._sessiz || this.gezSec(y),
      // Dokunmatikte üzerinde durmak yok: sayfaları olan bölüme ilk dokunuş seçer ("içinde" listesi), ikincisi sayfaya gider.
      // Seçili olup olmadığı dokunuşun başında okunur (odak olayı tıklamadan önce seçebilir).
      onpointerdown: (ev) => { a._d = ok && ev.pointerType !== 'mouse' && !a.classList.contains('ik-secili'); },
      onclick: (ev) => { if (a._d) { a._d = 0; ev.preventDefault(); this.gezSec(y); } }
    }, h('span', { class: 'ik-oge-ad' }, x.ad), this.rz(x), this.uyari[x.url] ? h('span', { class: 'ik-gez-nokta', title: this.uyari[x.url] }) : null, ok ? svg(SAG, 13, 2) : null);
    a._y = y;
    return a;
  }
  gezCiz(tam) {
    const k = this.gk, s = this.gs, gr = k.gruplar, cok = gr.length > 1, g = gr[s.g] || gr[0];
    const m = g && g.moduller.includes(s.m) ? s.m : null;
    const onz = this.onizleme(m && m.sayfalar.includes(s.s) ? s.s : m || { ad: k.ad, url: k.url, aciklama: k.aciklama });
    // Aynı grupta seçim değişince yalnız işaret, "içinde" listesi ve kart yenilenir: üzerindeki satır yerinde kalır, tık kaybolmaz.
    if (!tam && this._gk === k && this._gg === s.g) {
      this.gez.querySelectorAll('.ik-gez-oge').forEach((el) => {
        const y = el._y, x = y.s ? y.s === s.s : y.m ? y.m === m : y.g === s.g;
        el.classList.toggle('ik-secili', x); if (!y.m) el.setAttribute('aria-pressed', String(x));
      });
      if (this._gm !== m) { const ic = this.icinde(m); this._ic.replaceWith(ic); this._ic = ic; this._gm = m; }
      this._onz.replaceWith(onz); this._onz = onz;
      return this.rozetTazele(this.gez);
    }
    this._gk = k; this._gg = s.g; this._gm = m;
    const odak = this.gez.contains(D.activeElement) && D.activeElement.dataset.ikYol;
    // İlk sütunun başlığı maddenin kendi sayfasına bağlantıdır (ör. Ayarlar sayfası hiçbir bölümün adresi değildir; telefonda kart yoktur).
    const sutun = (bas, ...ic) => h('div', { class: 'ik-gez-sutun', role: 'group', 'aria-label': bas },
      kol.length ? h('div', { class: 'ik-gez-bas' }, bas) : h('a', { href: k.url, 'data-ik-git': '', class: 'ik-gez-bas ik-gez-bas-bag' }, bas, svg(SAG, 11, 2)), ic);
    const kol = [];
    if (cok) kol.push(sutun(k.ad, gr.map((x, i) => {
      const y = { g: i, m: null, s: null }, uy = x.moduller.some((z) => [z].concat(z.sayfalar).some((w) => this.uyari[w.url]));
      const b = h('button', {
        type: 'button', class: 'ik-gez-oge ik-gez-grup' + (i === s.g ? ' ik-secili' : ''), 'data-ik-yol': 'g' + i, 'aria-pressed': String(i === s.g),
        onclick: () => this.gezSec(y), onfocus: () => this._sessiz || this.gezSec(y),
        onpointerenter: (ev) => ev.pointerType === 'mouse' && this.gezSec(y, 120), onpointerleave: () => clearTimeout(this._gz)
      }, h('span', { class: 'ik-gez-simge' }, svg(SIMGE[x.simge], 15)),
      h('span', { class: 'ik-oge-ad' }, x.baslik, h('small', null, grupOzet(x) + (uy ? ' · eşitlenemedi' : ''))), uy ? h('span', { class: 'ik-gez-nokta' }) : null, svg(SAG, 13, 2));
      b._y = y;
      return b;
    })));
    this._ic = this.icinde(m);
    if (g) kol.push(sutun(cok ? g.baslik : k.ad, g.moduller.map((x) => this.gezBag(x, x === m, { g: s.g, m: x, s: null }, x.sayfalar.length)), this._ic));
    kol.push(this._onz = onz);
    this.gez.replaceChildren(...kol, h('button', { type: 'button', class: 'ik-ikon ik-gez-geri ik-tel', 'aria-label': 'Önceki sütun', onclick: () => this.gez.scrollBy({ left: -innerWidth }) }, svg(['M15 6l-6 6 6 6'], 18)),
      h('button', { type: 'button', class: 'ik-ikon ik-gez-kapat', 'aria-label': 'Gezgini kapat', title: 'Kapat (Esc)', onclick: () => this.kapat(true) }, svg(I.x, 15)));
    this.rozetTazele(this.gez);
    const r = odak && this.gez.querySelector('[data-ik-yol="' + CSS.escape(odak) + '"]');
    if (r) { this._sessiz = 1; r.focus(); this._sessiz = 0; }
    // Telefonda açılışta ilk sütun, grup seçilince bölümler.
    if (TEL.matches) kol[tam || !cok ? 0 : 1].scrollIntoView({ inline: 'start', block: 'nearest' });
  }
  icinde(m) {
    const s = this.gs;
    return h('div', { class: 'ik-gez-icinde' }, m && m.sayfalar.length ? [h('div', { class: 'ik-gez-bas ik-gez-ic' }, m.ad + ' içinde'), m.sayfalar.map((y) => this.gezBag(y, y === s.s, { g: s.g, m, s: y }))] : null);
  }
  // Önizleme kartı: ad, açıklama; ürün `onizleme(url)` işlevini verdiyse uyarı, en çok 4 sayı ve eğri (README "Sütun gezgini").
  onizleme(x) {
    const u = x.url;
    if (typeof this.onizlemeKaynagi === 'function' && !this.oz.has(u)) {
      // Sürüm: müşteri değişince (onizlemeSifirla) yoldaki eski yanıt önbelleğe yazılmaz.
      const n = this._oz, koy = (v) => n === this._oz && this.oz.set(u, onizlemeCoz(v));
      this.oz.set(u, null);
      Promise.resolve().then(() => this.onizlemeKaynagi(u)).then(koy, () => koy({}))
        .then(() => { if (this.acik === 'gezgin' && this.gez.querySelector('.ik-onz[data-u="' + CSS.escape(u) + '"]')) this.gezCiz(); });
    }
    const v = this.oz.get(u), uy = (v && v.uyari) || this.uyari[u], sab = this.sekmeler.some((t) => t.url === u);
    const yol = v && egriYol(v.egri, 300, 64), e = yol ? D.createElementNS(NS, 'svg') : null;
    if (e) {
      [['viewBox', '0 0 300 64'], ['preserveAspectRatio', 'none'], ['class', 'ik-onz-egri'], ['aria-hidden', 'true']].forEach((a) => e.setAttribute(a[0], a[1]));
      [yol + 'L300 64L0 64Z', yol].forEach((d) => { const p = D.createElementNS(NS, 'path'); p.setAttribute('d', d); e.append(p); });
    }
    return h('section', { class: 'ik-onz', 'data-u': u, 'aria-label': 'Önizleme: ' + x.ad },
      h('div', { class: 'ik-gez-bas' }, 'Önizleme'), h('h2', null, x.ad), x.aciklama ? h('p', { class: 'ik-soluk' }, x.aciklama) : null,
      uy ? h('div', { class: 'ik-onz-uyari', role: 'note' }, uy) : null,
      v === null ? h('div', { class: 'ik-soluk ik-kucuk' }, 'Özet yükleniyor…') : null,
      v && v.sayilar.length ? h('div', { class: 'ik-onz-sayilar' }, v.sayilar.map((y) => h('div', { class: 'ik-onz-sayi' }, h('span', { class: 'ik-soluk' }, y.ad),
        h('b', null, y.deger, y.degisim ? h('small', { class: y.iyi === true ? 'ik-iyi' : y.iyi === false ? 'ik-kotu' : null }, y.degisim) : null)))) : null,
      e, v && v.not ? h('div', { class: 'ik-soluk ik-kucuk' }, v.not) : null,
      h('div', { class: 'ik-onz-eylem' },
        h('a', { href: u, 'data-ik-git': '', class: 'ik-dugme ik-dugme-ana' }, 'Aç ↵'),
        h('a', { href: u, target: '_blank', rel: 'noopener', class: 'ik-dugme' }, 'Yeni sekmede'),
        h('button', { type: 'button', class: 'ik-dugme', disabled: sab, onclick: () => this.sabitleSekme(x) }, svg(I.raptiye, 14), sab ? 'Sekmede' : 'Sabitle')));
  }
  // Sabitle: sayfa sekme satırına eklenir (sekme listesi kuralları, en çok 8).
  sabitleSekme(x) {
    this.gorulen.add(x.url);
    this.sekmeler = sekmeEkle(this.sekmeler, { ad: x.ad, url: x.url }, this.genelSekme(), 8, this.gorulen);
    yaz('idx-sekme', this.sekmeler); this.sekmeCiz(); this.gezCiz();
  }
  // Önizleme ve uyarılar müşteriye özeldir (müşteri ayrımı): müşteri değişince önbellek boşalır. Başka sekmedeki değişiklik
  // (idx-musteri, storage olayı) kendiliğinden; aynı sekmede ürün çağırır.
  onizlemeSifirla() { this.oz.clear(); this.uyari = {}; this._oz++; if (this.acik === 'gezgin') this.gezCiz(1); }
  // Ürünün kaynak uyarısı (ör. Search Console eşitlenemedi): menü adresine kısa metin; boş metin kaldırır.
  uyariYap(url, m) { url = guvenliUrl(osAdresi(url), this.a.kokenler); if (!url) return; if (m) this.uyari[url] = String(m).slice(0, 120); else delete this.uyari[url]; this.oz.delete(url); if (this.acik === 'gezgin') this.gezCiz(1); }
  gezTus(ev) {
    const y = ev.key;
    if (!/^Arrow(Up|Down|Left|Right)$/.test(y) || ev.altKey || ev.metaKey || ev.ctrlKey) return;
    const sut = [...this.gez.querySelectorAll('.ik-gez-sutun')], t = ev.target, si = sut.findIndex((c) => c.contains(t));
    if (si < 0) return;
    ev.preventDefault();
    const og = (c) => [...c.querySelectorAll('.ik-gez-oge')], l = og(sut[si]), i = l.indexOf(t);
    if (y === 'ArrowUp' || y === 'ArrowDown') return (l[i + (y === 'ArrowDown' ? 1 : -1)] || t).focus();
    if (y === 'ArrowRight') { const c = sut[si + 1]; if (c) (c.querySelector('.ik-secili') || og(c)[0]).focus(); return; }
    if (si) (sut[si - 1].querySelector('.ik-secili') || og(sut[si - 1])[0]).focus(); else this.kapat(true);
  }
  // Menü satırları arasında ↑ ↓; → gezgini açıp içine girer.
  kokTus(ev) {
    const y = ev.key, l = [...this.yan.querySelectorAll('.ik-kok-satir')], i = l.indexOf(ev.target);
    if (i < 0) return;
    if (y === 'ArrowUp' || y === 'ArrowDown') { ev.preventDefault(); (l[i + (y === 'ArrowDown' ? 1 : -1)] || ev.target).focus(); }
    else if (y === 'ArrowRight' && this.kokDugmeleri.includes(ev.target)) { ev.preventDefault(); this.gezAc(this.kokDugmeleri.indexOf(ev.target), 1); }
  }

  // Daraltılmış menü: rayda madde simgeleri; üzerine gelince ya da odakta maddenin sayfaları uçan panelde.
  ucanAc(ki) {
    clearTimeout(this._ucanZ);
    if (this.acik) this.kapat(false);
    const b = this.rayDugmeleri[ki], k = this.a.katmanlar[ki], e = this.e, u = this.ucan;
    this.rayDugmeleri.forEach((x, i) => x.setAttribute('aria-expanded', String(i === ki)));
    if (this.ucanGrup !== ki || u.hidden) {
      this.ucanGrup = ki;
      u.setAttribute('aria-label', k.ad);
      // Sıkı liste, ağaçla aynı yapı: grup başlığı (simgeli) › modül › sayfalar.
      let n = 1;
      const modul = (m) => h('div', { class: 'ik-u-oge', css: { '--u': Math.min(n++, 8) } },
        h('a', { href: m.url, 'data-ik-git': '', class: 'ik-ucan-modul', 'aria-current': e.modul === m && !e.sayfa ? 'page' : null }, h('span', { class: 'ik-oge-ad' }, m.ad), this.rz(m)),
        m.sayfalar.length ? h('div', { class: 'ik-ucan-sayfalar' }, m.sayfalar.map((s) => h('a', { href: s.url, 'data-ik-git': '', class: 'ik-ucan-sayfa', 'aria-current': e.sayfa === s ? 'page' : null }, s.ad))) : null);
      // Mega menü (Muhittin, 20 Kas 2026; "tüm modüller için"): birden çok grup (Meta, Google Ads, …) yan yana sütun;
      // tek grupta modüller sayfa sayısına göre dengeli en çok 3 sütuna (sutunBol); 1-2 modüllük madde tek sütun.
      const sütunlar = k.gruplar.length > 1
        ? k.gruplar.map((g) => ({ g, moduller: g.moduller }))
        : sutunBol(k.gruplar.flatMap((g) => g.moduller), 3).map((m) => ({ g: null, moduller: m }));
      const sütunlu = sütunlar.length > 1;
      u.classList.toggle('ik-ucan-genis', sütunlu);
      const baş = h('a', { href: k.url, 'data-ik-git': '', class: 'ik-u-oge ik-ucan-bas', css: { '--u': 0 } }, svg(SIMGE[k.simge], 18, 1.7), h('span', null, k.ad), svg(SAG, 13, 2.2, 'ik-oge-ok'));
      u.replaceChildren(h('div', { class: 'ik-ucan-ic' }, baş, sütunlu
        ? h('div', { class: 'ik-ucan-sutunlar', css: { '--sutun': sütunlar.length } }, sütunlar.map(({ g, moduller }) => h('div', { class: 'ik-ucan-sutun', role: 'group', 'aria-label': g ? g.baslik : null },
          g ? h('div', { class: 'ik-ucan-grup' }, svg(SIMGE[g.simge], 13), g.baslik) : null, moduller.map(modul))))
        : sütunlar[0].moduller.map(modul)));
      u.hidden = false;
      this.rozetTazele(u);
    }
    // Pencere hep görünür alanda (Muhittin, 18 Kas 2026): üst çubuğun altıyla ekranın altı arasına sığar, gerekirse yalnız içi kayar.
    const yt = this.yan.getBoundingClientRect().top, ust = Math.max(0, this.ust.getBoundingClientRect().bottom) + 8, alt = innerHeight - 8;
    u.style.setProperty('max-height', alt - ust + 'px');
    u.style.setProperty('top', Math.max(ust, Math.min(b.getBoundingClientRect().top - 10, alt - u.offsetHeight)) - yt + 'px');
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
