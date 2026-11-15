// <idexya-ayarlar>: ortak Ayarlar sayfasının içeriği (Muhittin, 15 Kas 2026). Kurallar kabuk.js ile aynı (README.md):
// innerHTML ve dış istek yok, veri textContent ile, stil yalnız kabuk.css'te. Yalnız gerçekten çalışan ayarlar çizilir.
// Ayar, içinde bulunduğu <idexya-kabuk> öğesinin doğrulanmış ayarından (kullanıcı, çıkış adresi, modül ayarları) okunur;
// değişiklik kabuğun yöntemleriyle yapılır (gorunumYap, sabitle, darYap).
import { TEMA, TEMA_SIRASI, OS_ALANLARI, gorunumCoz, temaCoz, sinirBekle, saatMetni, saatOku, ayarDogrula } from './kabuk-cekirdek.js';

const D = document;
const oku = (k, v) => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x); } catch (e) { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli kip */ } };
const MQ = matchMedia('(prefers-color-scheme: dark)'), AZ = matchMedia('(prefers-reduced-motion: reduce)');
const MAC = /Mac|iP/.test(navigator.platform);

function h(tag, a, ...c) {
  const e = D.createElement(tag);
  for (const k in a) {
    const v = a[k];
    if (v == null || v === false) continue;
    if (k[0] === 'o' && k[1] === 'n') e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  c.flat(3).forEach((x) => x != null && x !== false && e.append(x));
  return e;
}
const ACIKLAMA = { acik: 'Her zaman açık', koyu: 'Her zaman koyu', sistem: 'Cihazının ayarını izler', zaman: 'Gündüz açık, gece koyu' };
let sira = 0;

class IdexyaAyarlar extends HTMLElement {
  connectedCallback() {
    this.kabuk = this.closest('idexya-kabuk');
    this._d = () => this.ciz();
    this._g = () => this.guncelle();
    D.addEventListener('idexya-kabuk:hazir', this._d);
    D.addEventListener('idexya-kabuk:gorunum', this._g);
    MQ.addEventListener('change', this._g);
    this.ciz();
  }
  disconnectedCallback() {
    D.removeEventListener('idexya-kabuk:hazir', this._d);
    D.removeEventListener('idexya-kabuk:gorunum', this._g);
    MQ.removeEventListener('change', this._g);
    clearTimeout(this._z);
  }

  get ayar() {
    const k = this.kabuk;
    if (k && k.a) return k.a;
    let ham = null;
    try { ham = JSON.parse((D.querySelector('script#idexya-kabuk-ayar[type="application/json"]') || {}).textContent || 'null'); } catch (e) { ham = null; }
    return ayarDogrula(ham).ayar;
  }
  get gor() { return this.kabuk && this.kabuk.a ? this.kabuk.gorunum : gorunumCoz(oku('idx-gorunum', null)); }
  gorunumYap(p) {
    if (this.kabuk && this.kabuk.a) this.kabuk.gorunumYap(p);
    else { yaz('idx-gorunum', gorunumCoz(Object.assign({}, this.gor, p))); this.guncelle(); }
  }

  kart(id, baslik, aciklama, ...ic) {
    return h('section', { class: 'ik-ayar-kart', 'aria-labelledby': id },
      h('div', { class: 'ik-ayar-bas' }, h('h2', { id }, baslik), aciklama ? h('p', null, aciklama) : null), ic);
  }
  anahtar(ad, aciklama, deger, degisti) {
    const g = h('input', { type: 'checkbox', role: 'switch', class: 'ik-anahtar', onchange: () => degisti(g.checked) });
    g.checked = deger;
    return h('label', { class: 'ik-ayar-satir' }, h('span', null, h('span', { class: 'ik-ayar-ad' }, ad), h('span', { class: 'ik-soluk' }, aciklama)), g);
  }

  ciz() {
    const a = this.ayar, k = this.kabuk && this.kabuk.a ? this.kabuk : null, n = 'ik-ayar-' + ++sira;
    this.classList.add('ik-ayarlar');

    // a. Görünüm: dört tema, zamana göre seçiliyse geçiş saatleri.
    this.temalar = TEMA_SIRASI.map((t) => h('label', { class: 'ik-tema-kart' },
      h('input', { type: 'radio', name: n + '-tema', value: t, onchange: () => this.gorunumYap({ tema: t }) }),
      h('span', { class: 'ik-onizleme ik-oniz-' + t, 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('i'), h('i'), h('i')),
      h('span', { class: 'ik-ayar-ad' }, TEMA[t]), h('span', { class: 'ik-soluk' }, ACIKLAMA[t])));
    const saat = (ad, alan) => {
      const g = h('input', { type: 'time', step: 60, required: true, onchange: () => {
        const d = saatOku(g.value), diger = this.gor[alan === 'zamanAcik' ? 'zamanKoyu' : 'zamanAcik'];
        if (d === null || d === diger) { this.zDurum.textContent = d === null ? 'Saati ss.dd biçiminde gir.' : 'Açık ve koyu tema aynı saatte başlayamaz.'; this.zDurum.dataset.hata = ''; return; }
        this.gorunumYap({ [alan]: d });
      } });
      return h('label', { class: 'ik-saat' }, h('span', { class: 'ik-ayar-ad' }, ad), g);
    };
    this.zAcik = saat('Açık tema başlar', 'zamanAcik');
    this.zKoyu = saat('Koyu tema başlar', 'zamanKoyu');
    this.zDurum = h('p', { class: 'ik-soluk', role: 'status' });
    this.zaman = h('div', { class: 'ik-zaman' }, this.zAcik, this.zKoyu, this.zDurum);
    const gorunum = this.kart(n + '-g', 'Görünüm', 'Tema üç modülde (Marketing, Website ve CRM, Creative) ortaktır; seçim bu tarayıcıda saklanır. Üst çubuktaki tema düğmesi de aynı dört seçenek arasında sırayla geçer.',
      h('div', { class: 'ik-tema-secici', role: 'radiogroup', 'aria-label': 'Tema' }, this.temalar), this.zaman);
    gorunum.classList.add('ik-ayar-genis');

    // b. Arayüz: yalnız kabukta karşılığı olanlar.
    this.azNot = h('p', { class: 'ik-soluk ik-ayar-not' });
    const arayuz = this.kart(n + '-a', 'Arayüz', 'Bu tarayıcıda saklanır.',
      k ? this.anahtar('Üst çubuğu sabitle', 'Sayfayı kaydırınca da üst çubuk görünür.', k.sabit, (v) => k.sabitle(v)) : null,
      k && k.yan ? this.anahtar('Yan menüyü daraltılmış göster', 'Yalnız simgeler; üzerine gelince modüller açılır. Telefonda menü her zaman çekmecedir.', k.dar, (v) => k.darYap(v)) : null,
      this.az = this.anahtar('Hareketleri azalt', 'Geçiş, sayaç ve açılış hareketleri kapanır.', this.gor.azHareket, (v) => this.gorunumYap({ azHareket: v })),
      this.azNot);

    // c. Bölge: salt gösterim.
    const simdi = new Date();
    let dilim = '—';
    try {
      const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const f = (new Intl.DateTimeFormat('tr-TR', { timeZoneName: 'shortOffset' }).formatToParts(simdi).find((x) => x.type === 'timeZoneName') || {}).value;
      dilim = (z || '—') + (f ? ' (' + f + ')' : '');
    } catch (e) { /* eski tarayıcı */ }
    const bolge = this.kart(n + '-b', 'Bölge', 'Tarih ve sayılar Türkçe yazım kuralına göre gösterilir; saat dilimi tarayıcından okunur, burada değiştirilmez.',
      h('dl', { class: 'ik-ayar-liste' },
        h('dt', null, 'Saat dilimi'), h('dd', null, dilim),
        h('dt', null, 'Tarih'), h('dd', { class: 'ik-sayi' }, simdi.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })),
        h('dt', null, 'Saat'), h('dd', { class: 'ik-sayi' }, saatMetni(simdi.getHours() * 60 + simdi.getMinutes())),
        h('dt', null, 'Sayı'), h('dd', { class: 'ik-sayi' }, (1234567.89).toLocaleString('tr-TR')),
        h('dt', null, 'Tutar'), h('dd', { class: 'ik-sayi' }, (18000).toLocaleString('tr-TR') + ' TL'),
        h('dt', null, 'Oran'), h('dd', { class: 'ik-sayi' }, '%' + (20.5).toLocaleString('tr-TR'))));

    // d. Hesap: kabuğa verilen kullanıcı bilgisi, salt okuma.
    const kul = a.kullanici || {};
    const cikis = a.cikisUrl || (OS_ALANLARI.includes(location.host) ? '/cdn-cgi/access/logout' : null);
    const hesap = this.kart(n + '-h', 'Hesap', 'Ad, e-posta ve rol oturumdan gelir; değişiklik yöneticiden istenir.',
      h('dl', { class: 'ik-ayar-liste' },
        h('dt', null, 'Ad'), h('dd', null, kul.ad || '—'),
        h('dt', null, 'E-posta'), h('dd', null, kul.eposta || '—'),
        h('dt', null, 'Rol'), h('dd', null, kul.rol || '—')),
      cikis ? h('div', { class: 'ik-kart-son' }, h('a', { href: cikis, class: 'ik-dugme', onclick: (e) => this.cikis(e) }, 'Oturumu kapat')) : null);

    // e. Klavye kısayolları: yalnız kabukta olanlar.
    const kisayol = [[MAC ? '⌘ K' : 'Ctrl K', 'Tüm katmanlarda ara'], ['↑ ↓', 'Arama sonuçlarında gez'], ['Enter', 'Seçili sonuca git'],
      ['Esc', 'Açık menüyü ya da aramayı kapat'], ['→', 'Daraltılmış menüde grup panelinin içine gir']];
    const kisa = this.kart(n + '-k', 'Klavye kısayolları', 'Üç modülde aynıdır. Modüle özel kısayollar o modülün sayfasında yazar.',
      h('dl', { class: 'ik-ayar-liste ik-kisayol' }, kisayol.map((x) => [h('dt', null, h('kbd', null, x[0])), h('dd', null, x[1])])));

    // f. Modül ayarları: ürün verirse.
    const bag = a.ayarBaglantilari || [];
    const modul = bag.length ? this.kart(n + '-m', 'Modül ayarları', 'Bu modülün kendi ayar ve yönetim sayfaları.',
      h('ul', { class: 'ik-ayar-baglar' }, bag.map((b) => h('li', null, h('a', { href: b.url, onclick: (e) => this.git(e, b.url) },
        h('span', { class: 'ik-ayar-ad' }, b.ad), b.aciklama ? h('span', { class: 'ik-soluk' }, b.aciklama) : null))))) : null;

    this.replaceChildren(...[gorunum, arayuz, bolge, hesap, kisa, modul].filter(Boolean));
    this.guncelle();
  }

  guncelle() {
    if (!this.zaman) return;
    const g = this.gor;
    this.temalar.forEach((l) => { const r = l.firstChild; r.checked = r.value === g.tema; });
    this.zaman.hidden = g.tema !== 'zaman';
    const v = (x) => saatMetni(x).replace('.', ':');
    if (D.activeElement !== this.zAcik.lastChild) this.zAcik.lastChild.value = v(g.zamanAcik);
    if (D.activeElement !== this.zKoyu.lastChild) this.zKoyu.lastChild.value = v(g.zamanKoyu);
    clearTimeout(this._z);
    if (g.tema === 'zaman') {
      const su = temaCoz(g, MQ.matches), sonra = su === 'acik' ? g.zamanKoyu : g.zamanAcik;
      this.zDurum.textContent = 'Şu an ' + (su === 'acik' ? 'açık' : 'koyu') + ' tema. Sonraki geçiş ' + saatMetni(sonra) + ', ' + (su === 'acik' ? 'koyu' : 'açık') + ' tema.';
      delete this.zDurum.dataset.hata;
      this._z = setTimeout(() => this.guncelle(), sinirBekle(new Date(), g.zamanAcik, g.zamanKoyu));
    }
    this.az.lastChild.checked = g.azHareket;
    this.azNot.textContent = AZ.matches ? 'Cihazında "hareketi azalt" açık; hareketler bu ayardan bağımsız olarak kapalı.' : '';
  }

  // Modül bağlantısı: tek sayfa uygulama yönlendirsin diye kabuğun `idexya-kabuk:git` olayı yayılır (README).
  git(e, url) {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !this.kabuk) return;
    if (!this.kabuk.dispatchEvent(new CustomEvent('idexya-kabuk:git', { detail: { url }, bubbles: true, cancelable: true }))) e.preventDefault();
  }
  cikis() {
    try { Object.keys(localStorage).forEach((k) => /^idx-(sekme|yan-kapali)-/.test(k) && localStorage.removeItem(k)); Object.keys(sessionStorage).forEach((k) => /^idx-/.test(k) && sessionStorage.removeItem(k)); } catch (x) { /* gizli kip */ }
  }
}

if (!customElements.get('idexya-ayarlar')) customElements.define('idexya-ayarlar', IdexyaAyarlar);
