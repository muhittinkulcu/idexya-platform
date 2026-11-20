// <idexya-kabuk>: ortak kabuk. Kurallar README.md: innerHTML ve dış istek yok, veri textContent ile.
import {
  SIMGE, TEMA, temaCoz, sonrakiTema, sinirBekle, ayarDogrula, etkinBul, etkinKatman, katmanRozeti, aramaHavuzu, aramaSuz, kaynakAra, aramaBirlestir,
  kaynakDurumu, sekmeEkle, sekmeKapat, hepsiAcik, hepsiDegistir, gorunumCoz, sayiBicim, saatKisa, rozetSay, guvenliUrl, metinListesi, osAdresi, durumCoz, sutunBol, kediKonum
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
  cikis: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 17l5-5-5-5', 'M15 12H4'],
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
    // Tek gezinme: sol menüde bütün maddeler; açık madde adrese göre bulunur (etkinYap), yoksa ürünün varsayılanı (`katman`).
    this.k = etkinKatman(ayar.katmanlar, ayar.etkin, ayar.katman);
    this.ana = ayar.katmanlar.find((x) => x.anahtar === 'genel') || ayar.katmanlar[0] || null;
    // Ağaç kaydı (Muhittin, 18 Kas 2026): madde ve modül oku sayfaya gitmeden açar / kapatır. idx-yan-acik { madde: bool },
    // idx-yan-modul { modül adresi: bool }; kayıt yoksa açık sayfanın yolu açıktır.
    this.acik = null; this.acikKok = oku('idx-yan-acik', {}) || {}; this.acikMod = oku('idx-yan-modul', {}) || {};
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
      ana.append(this.sekmeNav);
    }
    ana.append(this.icerik);
    this.replaceChildren(this.ust, h('div', { class: 'ik-govde' }, this.yan, ana));
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
    TEL.addEventListener('change', () => { if (this.yan) { this.cekmece(false); this.ucanKapat(); this.yanCiz(); } });
    this.durumYap(a.durum); this.kullaniciYap(a.kullanici); this.temaCiz();
  }
  // Ürünün denetimlerinin yuvası (üst alan). Ürün içine kendi öğelerini koyar (React: createPortal); kabuk içine dokunmaz.
  get ustYuva() { return this.yuva; }
  get ustYuvaSag() { return this.yuvaSag; }
  renkYap() { const k = this.k; if (k) { this.style.setProperty('--ik-renk', k.renk); this.style.setProperty('--ik-renk-koyu', k.renkKoyu); } }
  // Kapalı gruplar madde başına saklanır (idx-yan-kapali-<madde>). Kayıt yoksa (null) çok gruplu (3'ten fazla) maddede yalnız
  // etkin sayfanın grubu açık başlar; kayıt kullanıcı bir grubu açıp kapatınca yazılır.
  kap(k = this.k) {
    const x = k ? oku('idx-yan-kapali-' + k.anahtar, null) : null;
    if (Array.isArray(x)) return metinListesi(x);
    const g = k ? k.gruplar : [], eg = k === this.k && this.e ? this.e.grup : -1;
    return g.length > 3 ? g.filter((y, i) => i !== eg).map((y) => y.baslik) : [];
  }
  kapaliYaz(l, k = this.k) { yaz('idx-yan-kapali-' + k.anahtar, l); }

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

  // Açılırlardan (mega, arama, profil) yalnız biri açık.
  ac(tur, donus) {
    if (this.acik && this.acik !== tur) this.kapat(false);
    this.acik = tur; this._donus = donus;
    this.cekmece(false); this.ucanKapat();
    const r = this.ust.getBoundingClientRect();
    this.perde.style.setProperty('top', Math.max(0, r.bottom) + 'px');
    this.perde.className = 'ik-perde' + (tur === 'profil' ? ' ik-perde-saydam' : '');
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
    if (k !== this.k) { this.k = k; this.gecici.clear(); this.renkYap(); if (k && this.acikKok[k.anahtar] === false) { delete this.acikKok[k.anahtar]; yaz('idx-yan-acik', this.acikKok); } }
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

  // Sol menü (tek gezinme, talimat 4.2; oklu ağaç, Muhittin 18 Kas 2026): bütün maddeler alt alta; her madde, grup ve modülün
  // oku sayfaya gitmeden alt düzeyi açar (madde › grup › modül › sayfa). Adın kendisi sayfaya gider. Tek gruplu maddede grup
  // başlığı çizilmez. Hareket yalnız kullanıcının açtığı düzeyde (ik-yeni).
  modulCiz(m) {
    const e = this.e, ic = e.modul === m, sec = ic && !e.sayfa, v = this.acikMod[m.url];
    const acik = m.sayfalar.length > 0 && (v === undefined ? ic : v);
    return h('div', { class: 'ik-modul' },
      h('div', { class: 'ik-modul-satir' + (sec ? ' ik-secili' : '') + (ic ? ' ik-icinde' : '') },
        h('a', { href: m.url, 'data-ik-git': '', 'data-ik-yol': m.url, 'aria-current': sec ? 'page' : null }, h('span', { class: 'ik-kare' }), h('span', null, m.ad), this.rz(m)),
        m.sayfalar.length ? h('button', {
          type: 'button', class: 'ik-modul-ac', 'aria-expanded': String(acik), 'aria-label': m.ad + ' sayfalarını ' + (acik ? 'gizle' : 'göster'),
          onclick: () => this.agacAc(this.acikMod, 'idx-yan-modul', m.url, !acik)
        }, svg(SAG, 12, 2)) : null),
      acik ? h('div', { class: 'ik-sayfalar' + (this._yeni === m.url ? ' ik-yeni' : '') }, m.sayfalar.map((s) => h('a', { href: s.url, 'data-ik-git': '', 'aria-current': e.sayfa === s ? 'page' : null }, s.ad, this.rz(s)))) : null);
  }
  // Maddenin alt ağacı. Fareyle geçici açma (grupUzerinde) yalnız açık sayfanın maddesinde.
  kokIc(x) {
    const et = x === this.k, tek = x.gruplar.length === 1;
    const ic = h('div', { class: 'ik-kok-ic' + (this._yeni === x.anahtar ? ' ik-yeni' : ''), onpointerleave: et && !tek ? (ev) => this.agacCik(ev) : null }, tek
      ? x.gruplar[0].moduller.map((m) => this.modulCiz(m))
      : x.gruplar.map((g, gi) => {
        const el = h('div', { class: 'ik-grup', onpointerenter: et ? (ev) => this.grupUzerinde(gi, ev, 1) : null, onpointerleave: et ? (ev) => this.grupUzerinde(gi, ev, 0) : null },
          h('button', { type: 'button', class: 'ik-grup-bas', 'data-ik-yol': x.anahtar + '/' + gi, onclick: () => this.grupTikla(gi, x) },
            h('span', null, svg(SIMGE[g.simge], 14), g.baslik), svg(ASAGI, 12, 2, 'ik-grup-ok')),
          h('div', { class: 'ik-grup-kap' }, h('div', { class: 'ik-grup-ic' }, g.moduller.map((m) => this.modulCiz(m)))));
        this.grupler.push([x, gi, el]);
        return el;
      }));
    if (et && !tek) this.grupEl = this.grupler.filter((y) => y[0] === x).map((y) => y[2]);
    return ic;
  }
  // Madde (kayıt acikKok) ya da modül (acikMod) açılır / kapanır; ağaç yeniden çizilir, odak aynı satırın okunda kalır.
  agacAc(kayit, ad, id, v) {
    kayit[id] = v; yaz(ad, kayit);
    const f = this.yan.contains(D.activeElement);
    this._yeni = v && id; this.yanCiz(); this._yeni = null;
    const r = this.yan.querySelector('[data-ik-yol="' + CSS.escape(id) + '"]');
    if (f && r) r.nextElementSibling.focus();
  }
  // Klavye (ağaç gibi): ↑ ↓ görünen satırlar arasında, → açar ya da ilk alt satıra iner, ← kapatır ya da üst satıra çıkar.
  // Enter bağlantıda sayfaya gider, okta (Enter, Space) açar / kapatır.
  agacTus(ev) {
    const y = ev.key, t = ev.target;
    if (!/^Arrow(Up|Down|Left|Right)$/.test(y) || ev.altKey || ev.metaKey || ev.ctrlKey) return;
    const sat = t.matches('.ik-kok-ac,.ik-modul-ac') ? t.previousElementSibling : t;
    const v = [...this.yan.querySelectorAll('.ik-agac a,.ik-grup-bas')].filter((x) => !x.closest('.ik-kapali>.ik-grup-kap')), i = v.indexOf(sat);
    if (i < 0) return;
    ev.preventDefault();
    if (y === 'ArrowUp' || y === 'ArrowDown') return (v[i + (y === 'ArrowDown' ? 1 : -1)] || sat).focus();
    const n = sat.nextElementSibling, ac = sat.matches('.ik-grup-bas') ? sat : n && n.matches('button') ? n : null;
    const acik = ac && ac.getAttribute('aria-expanded') === 'true', yol = sat.dataset.ikYol;
    const kap = (x) => x.closest('.ik-modul,.ik-grup,.ik-kok'), bas = (c) => c.querySelector('.ik-kok-satir,.ik-grup-bas,.ik-modul-satir>a');
    if (y === 'ArrowRight' ? ac && !acik : acik) { ac.click(); const r = this.yan.querySelector('[data-ik-yol="' + CSS.escape(yol) + '"]'); if (r) r.focus(); }
    else if (y === 'ArrowRight') { if (acik) (v[i + 1] || sat).focus(); }
    else { let c = kap(sat); if (c && bas(c) === sat) c = kap(c.parentElement); if (c) bas(c).focus(); }
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
    // Tüm grupları aç / kapat: açık maddenin grupları (kayıt idx-yan-kapali-<madde>); daraltılmış menüde ve tek grupta yok.
    const hepsi = this.hepsiDugme = dar || !k || k.gruplar.length < 2 ? null : h('button', {
      type: 'button', class: 'ik-ikon ik-cerceve ik-hepsi',
      onclick: () => { this.gecici.clear(); this.kapaliYaz(hepsiDegistir(k.gruplar, this.kap())); this.grupDurum(); }
    });
    const bas = h('div', { class: 'ik-yan-bas' }, dar ? null : h('div', { class: 'ik-soluk ik-kucuk' }, 'Menü'),
      h('div', { class: 'ik-yan-dugmeler' }, hepsi, daralt));
    // Ayarlar sol menüde bir maddedir. Ürünün Ayarlar sayfası ağaçta yoksa (ör. müşteri hesabında madde süzüldüyse) altta bağlantı kalır.
    const ayarAgacta = !this.a.ayarlarUrl || kl.some((x) => x.url === this.a.ayarlarUrl || x.gruplar.some((g) => g.moduller.some((m) => m.url === this.a.ayarlarUrl || m.sayfalar.some((y) => y.url === this.a.ayarlarUrl))));
    const alt = ayarAgacta ? null : h('div', { class: 'ik-yan-alt' }, h('a', {
      href: this.a.ayarlarUrl, 'data-ik-git': '', class: 'ik-yan-ayar' + (this.ayarda ? ' ik-secili' : ''), 'aria-current': this.ayarda ? 'page' : null,
      'aria-label': dar ? 'Ayarlar' : null, title: dar ? 'Ayarlar' : null
    }, svg(I.ayar, 15), dar ? null : h('span', null, 'Ayarlar')));
    let govde;
    this.grupEl = null; this.grupler = [];
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
      this.gecici.clear();
    } else {
      this.rayDugmeleri = null; this.ucan = null;
      // Açık maddelerin grupları her zaman çizilir, kapalı grup CSS ile (yükseklik geçişi) gizlenir: grubu açıp kapamak ağacı
      // yeniden kurmaz, kaydırma yerinde kalır. Fareyle üzerine gelince kapalı grup geçici açılır (grupUzerinde).
      govde = h('nav', { class: 'ik-agac', 'aria-label': 'IDOS menüsü', onkeydown: (ev) => this.agacTus(ev) }, kl.map((x) => {
        const etkin = x === k, burada = etkin && !e.modul && [this.a.etkin.sayfaUrl, this.a.etkin.modulUrl].includes(x.url);
        const v = this.acikKok[x.anahtar], acik = x.gruplar.length > 0 && (v === undefined ? etkin : v);
        return h('div', { class: 'ik-kok' + (etkin ? ' ik-etkin' : '') },
          h('a', { href: x.url, 'data-ik-git': '', 'data-ik-yol': x.anahtar, class: 'ik-kok-satir', 'aria-current': burada ? 'page' : null },
            h('span', { class: 'ik-kok-simge' }, svg(SIMGE[x.simge], 17, 1.8)), h('span', { class: 'ik-kok-ad' }, x.ad), acik ? null : this.kokRozet(x)),
          x.gruplar.length ? h('button', {
            type: 'button', class: 'ik-kok-ac', 'aria-expanded': String(acik), 'aria-label': x.ad + ' alt menüsünü ' + (acik ? 'kapat' : 'aç'),
            onclick: () => this.agacAc(this.acikKok, 'idx-yan-acik', x.anahtar, !acik)
          }, svg(SAG, 12, 2)) : null,
          acik ? this.kokIc(x) : null);
      }));
    }
    const eski = this.yan.querySelector('.ik-agac'), kaydir = eski ? eski.scrollTop : 0;
    this.hesapKap = h('div', { class: 'ik-yan-hesap' });
    this.yan.replaceChildren(...[bas].concat(govde, alt || [], this.hesapKap));
    this.hesapCiz();
    const yeni = this.yan.querySelector('.ik-agac');
    if (yeni && kaydir) yeni.scrollTop = kaydir;
    this.grupDurum();
    this.rozetTazele(this.yan);
  }

  // Grupların açık / kapalı hâli ve "tümünü aç / kapat" düğmesi yerinde güncellenir (ağaç yeniden kurulmaz).
  grupDurum() {
    const k = this.k, kap = this.kap();
    (this.grupler || []).forEach(([x, gi, el]) => {
      const g = x === k && this.gecici.has(gi), acik = !(x === k ? kap : this.kap(x)).includes(x.gruplar[gi].baslik) || g;
      el.classList.toggle('ik-kapali', !acik);
      el.classList.toggle('ik-gecici', g);
      el.firstChild.setAttribute('aria-expanded', String(acik));
    });
    const b = this.hepsiDugme;
    if (b) {
      const a = hepsiAcik(k.gruplar, kap), t = a ? 'Tüm grupları kapat' : 'Tüm grupları aç';
      b.setAttribute('aria-label', t); b.title = t; b.replaceChildren(svg(a ? I.hepsiKapat : I.hepsiAc, 16));
    }
  }
  // Tıklama kaydı değiştirir. Fareyle geçici açılmış grup (görünüşte açık) tıklanınca açık kalır ve kaydedilir.
  grupTikla(gi, k = this.k) {
    const b = k.gruplar[gi].baslik, kap = this.kap(k);
    clearTimeout(this._grupAc);
    if (k === this.k && this.gecici.delete(gi)) this.kapaliYaz(kap.filter((x) => x !== b));
    else this.kapaliYaz(kap.includes(b) ? kap.filter((x) => x !== b) : kap.concat(b), k);
    this.grupDurum();
  }
  // Fare (dokunmatik ve kalem değil) kapalı grubun üzerinde 150 ms durunca grup geçici açılır; yukarı ya da yana çıkınca
  // 300 ms sonra kapanır. Aşağıdaki gruba geçerken üstteki kapanmaz (içerik imlecin altından kaymasın); menüden çıkınca
  // 300 ms sonra hepsi kapanır. Kayıtla açık gruplar zaten açıktır; etkin sayfanın grubu ve odağı içeren grup kapanmaz.
  // Telefonda (çekmece) yok.
  grupUzerinde(gi, ev, gir) {
    if (ev.pointerType !== 'mouse' || TEL.matches || !this.grupEl) return;
    clearTimeout(this._grupAc);
    if (gir) {
      clearTimeout(this.grupZ.get(gi));
      if (this.kap().includes(this.k.gruplar[gi].baslik) && !this.gecici.has(gi)) this._grupAc = setTimeout(() => { this.gecici.add(gi); this.grupDurum(); }, 150);
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
