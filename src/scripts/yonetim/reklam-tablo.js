// Genel bakış · Reklam performansı ayrıntı tablosu: sekmeler (hesap, marka, platform, gün), dönem, arama ve platform süzgeci,
// sıralama, hesaba panel adı verme, CSV ve koşullu biçimlendirme. Kurallar sunucuda tutulur (ayarlar.reklam_kurallar), herkes aynısını görür.
import './reklam-tablo.css';
import { api, el, genelHata } from './ortak.js';
import { gunler } from './grafik.js';

const PLATFORM = { meta: 'Meta', google: 'Google Ads' };
const SONUC_ADI = { messaging_conversations: 'Mesaj', purchases: 'Satın alma', conversions: 'Dönüşüm', leads: 'Potansiyel müşteri', calls: 'Arama' };
const ALAN = {
  harcama: { ad: 'Harcama', birim: 'TL' }, degisim: { ad: 'Değişim', birim: '%' }, gosterim: { ad: 'Gösterim', birim: '' }, tiklama: { ad: 'Tıklama', birim: '' },
  ctr: { ad: 'TO (CTR)', birim: '%' }, cpc: { ad: 'TBM (CPC)', birim: 'TL' }, cpm: { ad: 'BGBM (CPM)', birim: 'TL' }, sonuc: { ad: 'Sonuç', birim: '' }
};
const KOSUL = { gt: 'büyükse', gte: 'büyük ya da eşitse', lt: 'küçükse', lte: 'küçük ya da eşitse', arasi: 'arasındaysa', sifir: 'sıfır ya da boşsa' };
const STIL = { yesil: 'Yeşil', kirmizi: 'Kırmızı', sari: 'Sarı', mavi: 'Mavi', gri: 'Soluk', kalin: 'Kalın' };
const HAZIR = [
  { ad: 'TO %1’in altı → kırmızı', k: { alan: 'ctr', kosul: 'lt', deger: 1, stil: 'kirmizi', kapsam: 'hucre' } },
  { ad: 'TBM 15 TL üstü → sarı', k: { alan: 'cpc', kosul: 'gt', deger: 15, stil: 'sari', kapsam: 'hucre' } },
  { ad: 'Harcama %30+ arttı → mavi', k: { alan: 'degisim', kosul: 'gte', deger: 30, stil: 'mavi', kapsam: 'hucre' } },
  { ad: 'Harcama %30+ düştü → kırmızı', k: { alan: 'degisim', kosul: 'lte', deger: -30, stil: 'kirmizi', kapsam: 'hucre' } },
  { ad: 'Harcaması olmayan → soluk satır', k: { alan: 'harcama', kosul: 'sifir', deger: null, stil: 'gri', kapsam: 'satir' } }
];
const SEKME = [{ k: 'hesap', ad: 'Hesaplar' }, { k: 'marka', ad: 'Markalar' }, { k: 'platform', ad: 'Platformlar' }, { k: 'gun', ad: 'Günlük' }];

const sayi = (n, k = 0) => (n === null || n === undefined || !Number.isFinite(n) ? '—' : new Intl.NumberFormat('tr-TR', { minimumFractionDigits: k, maximumFractionDigits: k }).format(n));
const para = (n, p, k = 0) => (n === null || !Number.isFinite(n) ? '—' : p === 'TRY' ? sayi(n, k) + ' TL' : sayi(n, 2) + ' ' + p);
const kucult = (t) => String(t || '').toLocaleLowerCase('tr-TR').replace(/[-\s_]/g, '').replace(/^act/, '');
const sonucTop = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
const sonucAdi = (k) => SONUC_ADI[k] || k.replace(/_/g, ' ');
const gunAd = (g) => { const [y, a, d] = g.split('-'); return `${d}.${a}.${y}`; };
const hafiza = { al: (k, v) => { try { return localStorage.getItem('idx-rt-' + k) || v; } catch { return v; } }, yaz: (k, v) => { try { localStorage.setItem('idx-rt-' + k, v); } catch {} } };

export function reklamTablosu(r, yenile) {
  const dun = gunler(r.bugun, 2)[0];
  const hesapBilgi = new Map((r.hesaplar || []).map((h) => [h.platform + '|' + h.hesap, h]));
  const hesapAd = (h) => (h && (h.etiket || h.hesap_adi)) || null;
  const durum = {
    sekme: hafiza.al('sekme', 'hesap'), donem: Number(hafiza.al('donem', '7')), platform: hafiza.al('platform', 'tum'), ara: '',
    sirala: null, yon: -1, ayar: r.kurallar || { kurallar: [], cubuk: true, olcek: false }, panel: false, degisti: false
  };
  if (!SEKME.some((s) => s.k === durum.sekme)) durum.sekme = 'hesap';
  if (![7, 14, 28].includes(durum.donem)) durum.donem = 7;

  const kok = el('div', { class: 'rt' });
  const sekmeler = el('div', { class: 'rt-sekmeler', role: 'tablist', 'aria-label': 'Tablo görünümü' });
  const donemSec = el('div', { class: 'segment-kucuk', role: 'group', 'aria-label': 'Dönem' });
  const platformSec = el('div', { class: 'segment-kucuk', role: 'group', 'aria-label': 'Platform' });
  const ara = el('input', { type: 'search', class: 'rt-ara', placeholder: 'Müşteri, hesap adı veya kimlik ara', 'aria-label': 'Tabloda ara' });
  const kbDugme = el('button', { type: 'button', class: 'dugme kucuk', 'aria-expanded': 'false' });
  const csv = el('button', { type: 'button', class: 'dugme kucuk' }, 'CSV indir');
  const panel = el('div', { class: 'rt-panel', hidden: true });
  const sar = el('div', { class: 'rt-sar' });
  const alt = el('div', { class: 'rt-alt' });
  kok.append(sekmeler, el('div', { class: 'rt-arac' }, donemSec, platformSec, ara, el('span', { class: 'rt-bosluk' }), kbDugme, csv), panel, sar, alt);

  // Dönem günleri: bugün hariç, dün dahil; önceki dönem aynı uzunlukta hemen öncesi.
  const donemler = () => { const l = gunler(dun, durum.donem * 2); return { simdi: new Set(l.slice(durum.donem)), once: new Set(l.slice(0, durum.donem)), liste: l.slice(durum.donem) }; };

  function hesapUyar(s) {
    if (durum.platform !== 'tum' && s.platform !== durum.platform) return false;
    if (!durum.ara) return true;
    const h = hesapBilgi.get(s.platform + '|' + s.hesap) || {};
    const q = durum.ara.toLocaleLowerCase('tr-TR'), qk = kucult(durum.ara);
    return [h.musteri, hesapAd(h), PLATFORM[s.platform]].some((t) => t && t.toLocaleLowerCase('tr-TR').includes(q)) || kucult(s.hesap).includes(qk);
  }

  const bos = () => ({ harcama: 0, once: 0, gosterim: null, tiklama: null, sonuc: {}, hesaplar: new Set(), platformlar: new Set() });
  function ekle(o, s, simdiMi) {
    if (simdiMi) {
      o.harcama += s.harcama || 0;
      if (s.gosterim !== null && s.gosterim !== undefined) o.gosterim = (o.gosterim || 0) + s.gosterim;
      if (s.tiklama !== null && s.tiklama !== undefined) o.tiklama = (o.tiklama || 0) + s.tiklama;
      if (s.sonuclar) { try { for (const [a, v] of Object.entries(JSON.parse(s.sonuclar))) o.sonuc[a] = (o.sonuc[a] || 0) + v; } catch {} }
      o.hesaplar.add(s.platform + '|' + s.hesap); o.platformlar.add(s.platform);
    } else o.once += s.harcama || 0;
  }
  function turet(o) {
    o.degisim = o.once ? (o.harcama - o.once) / o.once * 100 : null;
    o.ctr = o.gosterim ? (o.tiklama || 0) / o.gosterim * 100 : null;
    o.cpc = o.tiklama ? o.harcama / o.tiklama : null;
    o.cpm = o.gosterim ? o.harcama / o.gosterim * 1000 : null;
    o.sonucTop = sonucTop(o.sonuc);
    return o;
  }

  function satirlar() {
    const d = donemler(), m = new Map();
    const kaynak = r.satirlar.filter(hesapUyar);
    if (durum.sekme === 'gun') {
      const gunListe = gunler(dun, durum.donem + 1);
      for (const s of kaynak) {
        if (!gunListe.includes(s.gun)) continue;
        const k = s.gun + '|' + s.para;
        const o = m.get(k) || Object.assign(bos(), { anahtar: k, gun: s.gun, para: s.para, meta: 0, google: 0 });
        ekle(o, s, true); o[s.platform] = (o[s.platform] || 0) + (s.harcama || 0); m.set(k, o);
      }
      // Değişim: bir önceki güne göre
      const liste = [...m.values()];
      for (const o of liste) { const onceki = m.get(gunler(o.gun, 2)[0] + '|' + o.para); o.once = onceki ? onceki.harcama : 0; turet(o); }
      return liste.filter((o) => d.liste.includes(o.gun));
    }
    for (const s of kaynak) {
      const simdiMi = d.simdi.has(s.gun), onceMi = d.once.has(s.gun);
      if (!simdiMi && !onceMi) continue;
      const h = hesapBilgi.get(s.platform + '|' + s.hesap) || {};
      const anahtar = durum.sekme === 'hesap' ? `${s.platform}|${s.hesap}|${s.para}` : durum.sekme === 'marka' ? `${h.musteri || ''}|${s.para}` : `${s.platform}|${s.para}`;
      const o = m.get(anahtar) || Object.assign(bos(), { anahtar, para: s.para, platform: s.platform, hesap: s.hesap, musteri: h.musteri || null, ad: hesapAd(h), crm: h.crm_id || null });
      ekle(o, s, simdiMi); m.set(anahtar, o);
    }
    return [...m.values()].map(turet).filter((o) => o.harcama || o.once);
  }

  // Sütunlar: k = değer alanı (sıralama ve kurallar), v = hücre içeriği
  const metrik = (o) => [
    { k: 'harcama', ad: 'Harcama', v: el('b', {}, para(o.harcama, o.para)), sayi: o.harcama },
    ...(durum.sekme === 'gun' ? [] : [{ k: 'once', ad: 'Önceki dönem', v: para(o.once, o.para), sayi: o.once }]),
    { k: 'degisim', ad: durum.sekme === 'gun' ? 'Önceki güne göre' : 'Değişim', v: o.degisim === null ? (o.harcama && !o.once && !o.toplam ? 'yeni' : '—') : (o.degisim > 0 ? '▲ %' : o.degisim < 0 ? '▼ %' : '= %') + sayi(Math.abs(o.degisim)), sayi: o.degisim },
    { k: 'gosterim', ad: 'Gösterim', v: sayi(o.gosterim), sayi: o.gosterim },
    { k: 'tiklama', ad: 'Tıklama', v: sayi(o.tiklama), sayi: o.tiklama },
    { k: 'ctr', ad: 'TO (CTR)', v: o.ctr === null ? '—' : '%' + sayi(o.ctr, 2), sayi: o.ctr },
    { k: 'cpc', ad: 'TBM (CPC)', v: para(o.cpc, o.para, 2), sayi: o.cpc },
    { k: 'cpm', ad: 'BGBM (CPM)', v: para(o.cpm, o.para, 2), sayi: o.cpm },
    { k: 'sonuc', ad: 'Sonuçlar', v: Object.entries(o.sonuc).filter(([, v]) => v).map(([a, v]) => `${sonucAdi(a)}: ${sayi(v)}`).join(' · ') || '—', sayi: o.sonucTop, sol: true }
  ];
  function sutunlar(o) {
    const pl = (o) => [...o.platformlar].map((p) => PLATFORM[p] || p).join(', ') || PLATFORM[o.platform] || o.platform;
    if (durum.sekme === 'hesap') return [
      { k: 'musteri', ad: 'Müşteri / marka', v: o.crm ? el('a', { href: `/yonetim/musteri/?id=${encodeURIComponent(o.crm)}` }, o.musteri) : o.musteri || el('span', { class: 'rt-soluk' }, 'Atanmamış'), metin: o.musteri || '', sol: true },
      { k: 'ad', ad: 'Hesap', v: hesapHucre(o), metin: (o.ad || '') + ' ' + o.hesap, sol: true },
      { k: 'platform', ad: 'Platform', v: PLATFORM[o.platform] || o.platform, metin: o.platform, sol: true },
      ...metrik(o)];
    if (durum.sekme === 'marka') return [
      { k: 'musteri', ad: 'Müşteri / marka', v: el('button', { type: 'button', class: 'rt-bag', title: 'Bu markanın hesaplarını göster', onclick: () => { durum.sekme = 'hesap'; durum.ara = o.musteri || ''; ara.value = durum.ara; ciz(); } }, o.musteri || 'Atanmamış hesaplar'), metin: o.musteri || '', sol: true },
      { k: 'hesapSay', ad: 'Hesap', v: sayi(o.hesaplar.size), sayi: o.hesaplar.size },
      { k: 'platform', ad: 'Platform', v: pl(o), metin: pl(o), sol: true },
      ...metrik(o)];
    if (durum.sekme === 'platform') return [
      { k: 'platform', ad: 'Platform', v: el('b', {}, PLATFORM[o.platform] || o.platform), metin: o.platform, sol: true },
      { k: 'hesapSay', ad: 'Hesap', v: sayi(o.hesaplar.size), sayi: o.hesaplar.size },
      ...metrik(o)];
    return [
      { k: 'gun', ad: 'Gün', v: gunAd(o.gun), metin: o.gun, sol: true },
      { k: 'meta', ad: 'Meta', v: para(o.meta, o.para), sayi: o.meta },
      { k: 'google', ad: 'Google Ads', v: para(o.google, o.para), sayi: o.google },
      ...metrik(o)];
  }

  function hesapHucre(o) {
    const kutu = el('div', { class: 'rt-hesap' });
    const goster = () => kutu.replaceChildren(
      el('span', { class: 'rt-hesap-ad' }, o.ad || el('span', { class: 'rt-soluk' }, 'Adsız hesap')),
      el('span', { class: 'rt-kimlik' }, el('code', {}, o.hesap),
        el('button', { type: 'button', class: 'rt-mini', title: 'Kimliği kopyala', 'aria-label': 'Hesap kimliğini kopyala', onclick: () => navigator.clipboard?.writeText(o.hesap) }, '⧉'),
        el('button', { type: 'button', class: 'rt-mini', title: 'Panelde görünen adı değiştir', 'aria-label': 'Hesap adını düzenle', onclick: duzenle }, '✎')));
    function duzenle() {
      const giris = el('input', { type: 'text', value: o.ad || '', maxlength: '120', class: 'rt-ad-giris', 'aria-label': 'Hesap adı', placeholder: 'Ör. Marka · Ana hesap' });
      const kaydet = async () => {
        giris.disabled = true;
        try { await api('reklam/hesap', { platform: o.platform, hesap: o.hesap, etiket: giris.value }); genelHata(''); await yenile(); }
        catch (h) { giris.disabled = false; genelHata(h.message); }
      };
      giris.addEventListener('keydown', (e) => { if (e.key === 'Enter') kaydet(); if (e.key === 'Escape') goster(); });
      kutu.replaceChildren(giris, el('span', { class: 'rt-kimlik' }, el('button', { type: 'button', class: 'rt-mini', onclick: kaydet }, 'Kaydet'), el('button', { type: 'button', class: 'rt-mini', onclick: goster }, 'Vazgeç')));
      giris.focus();
    }
    goster();
    return kutu;
  }

  // Koşullu biçimlendirme
  function uyar(k, deger) {
    if (k.kosul === 'sifir') return deger === null || deger === undefined || deger === 0;
    if (deger === null || deger === undefined || !Number.isFinite(deger)) return false;
    return k.kosul === 'gt' ? deger > k.deger : k.kosul === 'gte' ? deger >= k.deger : k.kosul === 'lt' ? deger < k.deger : k.kosul === 'lte' ? deger <= k.deger
      : deger >= Math.min(k.deger, k.deger2) && deger <= Math.max(k.deger, k.deger2);
  }
  function degerAl(o, alan) { return alan === 'sonuc' ? o.sonucTop : o[alan]; }

  function ciz() {
    hafiza.yaz('sekme', durum.sekme); hafiza.yaz('donem', String(durum.donem)); hafiza.yaz('platform', durum.platform);
    const tumu = satirlar();
    sekmeler.replaceChildren(...SEKME.map((s) => el('button', { type: 'button', role: 'tab', 'aria-selected': String(s.k === durum.sekme), onclick: () => { durum.sekme = s.k; durum.sirala = null; ciz(); } }, s.ad)));
    donemSec.replaceChildren(...[7, 14, 28].map((g) => el('button', { type: 'button', 'aria-pressed': String(g === durum.donem), onclick: () => { durum.donem = g; ciz(); } }, `${g} gün`)));
    platformSec.replaceChildren(...[['tum', 'Tümü'], ['meta', 'Meta'], ['google', 'Google Ads']].map(([k, a]) => el('button', { type: 'button', 'aria-pressed': String(k === durum.platform), onclick: () => { durum.platform = k; ciz(); } }, a)));
    const aktifKural = durum.ayar.kurallar.filter((k) => k.aktif !== false).length;
    kbDugme.textContent = `Koşullu biçimlendirme${aktifKural ? ` (${aktifKural})` : ''}`;
    kbDugme.setAttribute('aria-expanded', String(durum.panel));
    panel.hidden = !durum.panel;
    if (durum.panel) panelCiz();

    if (!tumu.length) { sar.replaceChildren(el('div', { class: 'bekleyen-kutu' }, durum.ara || durum.platform !== 'tum' ? 'Süzgece uyan hesap yok.' : 'Bu dönemde harcama yok.')); alt.textContent = ''; return; }
    const ornek = sutunlar(tumu[0]);
    const anahtar = durum.sirala || (durum.sekme === 'gun' ? 'gun' : 'harcama');
    const sol = ornek.find((c) => c.k === anahtar)?.sol;
    const yon = durum.sirala ? durum.yon : -1;
    const sirali = tumu.map((o) => ({ o, c: sutunlar(o) })).sort((a, b) => {
      // TRY satırları önce; diğer para birimleri karşılaştırılamaz
      if ((a.o.para === 'TRY') !== (b.o.para === 'TRY')) return a.o.para === 'TRY' ? -1 : 1;
      const x = a.c.find((c) => c.k === anahtar), y = b.c.find((c) => c.k === anahtar);
      if (sol) return yon * String(x?.metin ?? '').localeCompare(String(y?.metin ?? ''), 'tr');
      const xv = x?.sayi, yv = y?.sayi, xb = xv === null || xv === undefined, yb = yv === null || yv === undefined;
      if (xb || yb) return xb === yb ? 0 : xb ? 1 : -1; // boş değerler hep sonda
      return yon * (xv - yv);
    });
    const enBuyuk = Math.max(...tumu.filter((o) => o.para === 'TRY').map((o) => o.harcama), 1);
    const enDegisim = Math.max(...tumu.map((o) => Math.abs(o.degisim || 0)), 1);
    const kurallar = durum.ayar.kurallar.filter((k) => k.aktif !== false);

    const baslik = el('tr', {}, ...ornek.map((c) => el('th', { class: c.sol ? 'sol' : undefined, 'aria-sort': c.k === anahtar ? (yon === -1 ? 'descending' : 'ascending') : undefined, scope: 'col' },
      el('button', { type: 'button', onclick: () => { if (durum.sirala === c.k) durum.yon *= -1; else { durum.sirala = c.k; durum.yon = c.sol ? 1 : -1; } ciz(); } }, c.ad, c.k === anahtar ? (yon === -1 ? ' ↓' : ' ↑') : ''))));
    const govde = sirali.map(({ o, c }) => {
      const tr = el('tr', {});
      for (const kural of kurallar) if (kural.kapsam === 'satir' && uyar(kural, degerAl(o, kural.alan))) tr.classList.add('kb-' + kural.stil);
      for (const h of c) {
        const td = el('td', { class: h.sol ? 'sol' : undefined }, h.v);
        if (h.k === 'harcama' && durum.ayar.cubuk && o.para === 'TRY') { td.style.setProperty('--cubuk', Math.round(o.harcama / enBuyuk * 100) + '%'); td.classList.add('rt-cubuk'); }
        if (h.k === 'degisim' && durum.ayar.olcek && o.degisim !== null) { const g = Math.min(Math.abs(o.degisim) / enDegisim, 1); td.style.background = `color-mix(in srgb, var(${o.degisim >= 0 ? '--ok' : '--err'}) ${Math.round(8 + g * 30)}%, transparent)`; }
        for (const kural of kurallar) if (kural.kapsam !== 'satir' && kural.alan === h.k && uyar(kural, degerAl(o, kural.alan))) td.classList.add('kb-' + kural.stil);
        tr.append(td);
      }
      return tr;
    });
    // Toplam satırı: yalnız TRY
    const tr = tumu.filter((o) => o.para === 'TRY');
    let toplam = null;
    if (tr.length) {
      const t = Object.assign(bos(), { toplam: true, para: 'TRY', platform: durum.platform === 'tum' ? 'toplam' : durum.platform, hesap: '', meta: 0, google: 0, gun: '' });
      for (const o of tr) {
        t.harcama += o.harcama; t.once += o.once; t.meta += o.meta || 0; t.google += o.google || 0;
        if (o.gosterim !== null) t.gosterim = (t.gosterim || 0) + o.gosterim; if (o.tiklama !== null) t.tiklama = (t.tiklama || 0) + o.tiklama;
        for (const [a, v] of Object.entries(o.sonuc)) t.sonuc[a] = (t.sonuc[a] || 0) + v;
        o.hesaplar.forEach((x) => t.hesaplar.add(x)); o.platformlar.forEach((x) => t.platformlar.add(x));
      }
      if (durum.sekme === 'gun') t.once = 0;
      turet(t); if (durum.sekme === 'gun') t.degisim = null;
      const metrikler = metrik(t).map((h) => el('td', {}, h.v));
      const gunEk = durum.sekme === 'gun' ? [el('td', {}, para(t.meta, 'TRY')), el('td', {}, para(t.google, 'TRY'))] : [];
      const onSayi = ornek.length - metrikler.length - gunEk.length;
      toplam = el('tr', {}, el('td', { class: 'sol', colspan: String(onSayi) }, `Toplam · ${sayi(t.hesaplar.size)} hesap (TRY)`), ...gunEk, ...metrikler);
    }
    const tablo = el('table', { class: 'rt-tablo' }, el('thead', {}, baslik), el('tbody', {}, ...govde), toplam ? el('tfoot', {}, toplam) : null);
    sar.replaceChildren(tablo);
    const digerPara = [...new Set(tumu.filter((o) => o.para !== 'TRY').map((o) => o.para))];
    const adsiz = durum.sekme === 'hesap' && tumu.some((o) => !o.ad);
    alt.replaceChildren(...[
      el('span', {}, `${sayi(tumu.length)} satır · ${durum.sekme === 'gun' ? `son ${durum.donem} gün, bugün hariç` : `son ${durum.donem} gün (bugün hariç), önceki ${durum.donem} günle karşılaştırılır`}`),
      digerPara.length ? el('span', {}, ` · ${digerPara.join(', ')} hesapları toplama katılmadı`) : null,
      adsiz ? el('span', {}, ' · Adsız hesaplara ✎ ile panelde ad verebilir, müşteri adını ', el('a', { href: '/yonetim/crm-idos/' }, 'IDOS eşleştirmesinden'), ' bağlayabilirsiniz') : null].filter(Boolean));
  }

  function panelCiz() {
    const a = durum.ayar;
    const degis = () => { durum.degisti = true; ciz(); };
    const satir = (k, i) => el('div', { class: 'rt-kural' + (k.aktif === false ? ' kapali' : '') },
      el('input', { type: 'checkbox', checked: k.aktif !== false, 'aria-label': 'Kural etkin', onchange: (e) => { k.aktif = e.target.checked; degis(); } }),
      el('span', {}, 'Eğer'),
      el('select', { 'aria-label': 'Alan', onchange: (e) => { k.alan = e.target.value; degis(); } }, ...Object.entries(ALAN).map(([v, x]) => el('option', { value: v, selected: v === k.alan }, x.ad))),
      el('select', { 'aria-label': 'Koşul', onchange: (e) => { k.kosul = e.target.value; if (k.kosul === 'arasi' && k.deger2 == null) k.deger2 = k.deger; degis(); } }, ...Object.entries(KOSUL).map(([v, x]) => el('option', { value: v, selected: v === k.kosul }, x))),
      k.kosul === 'sifir' ? null : el('input', { type: 'number', step: 'any', value: k.deger ?? '', 'aria-label': 'Değer', class: 'rt-sayi', onchange: (e) => { k.deger = e.target.value === '' ? null : Number(e.target.value); degis(); } }),
      k.kosul === 'arasi' ? el('span', {}, 've') : null,
      k.kosul === 'arasi' ? el('input', { type: 'number', step: 'any', value: k.deger2 ?? '', 'aria-label': 'İkinci değer', class: 'rt-sayi', onchange: (e) => { k.deger2 = e.target.value === '' ? null : Number(e.target.value); degis(); } }) : null,
      k.kosul === 'sifir' ? null : el('span', { class: 'rt-soluk' }, ALAN[k.alan]?.birim || ''),
      el('span', {}, '→'),
      el('div', { class: 'rt-stiller', role: 'group', 'aria-label': 'Biçim' }, ...Object.entries(STIL).map(([v, x]) => el('button', { type: 'button', class: 'rt-stil kb-' + v, title: x, 'aria-label': x, 'aria-pressed': String(v === k.stil), onclick: () => { k.stil = v; degis(); } }, 'Aa'))),
      el('select', { 'aria-label': 'Kapsam', onchange: (e) => { k.kapsam = e.target.value; degis(); } }, el('option', { value: 'hucre', selected: k.kapsam !== 'satir' }, 'yalnız hücre'), el('option', { value: 'satir', selected: k.kapsam === 'satir' }, 'bütün satır')),
      el('button', { type: 'button', class: 'rt-mini', 'aria-label': 'Kuralı sil', onclick: () => { a.kurallar.splice(i, 1); degis(); } }, 'Sil'));
    const mesaj = el('span', { class: 'rt-soluk' }, durum.degisti ? 'Kaydedilmemiş değişiklik var; önizleme tabloda.' : 'Kurallar bütün yöneticiler için geçerlidir.');
    const kaydet = el('button', { type: 'button', class: 'dugme kucuk', style: 'background: var(--fill); color: #fff; border-color: var(--fill)', onclick: async () => {
      kaydet.disabled = true;
      try { const s = await api('reklam/kurallar', a); durum.ayar = s.kurallar; durum.degisti = false; genelHata(''); ciz(); }
      catch (h) { kaydet.disabled = false; genelHata(h.message); }
    } }, 'Kuralları kaydet');
    panel.replaceChildren(
      el('div', { class: 'rt-panel-ust' },
        el('label', { class: 'rt-anahtar' }, el('input', { type: 'checkbox', checked: a.cubuk !== false, onchange: (e) => { a.cubuk = e.target.checked; degis(); } }), 'Harcamada veri çubuğu'),
        el('label', { class: 'rt-anahtar' }, el('input', { type: 'checkbox', checked: !!a.olcek, onchange: (e) => { a.olcek = e.target.checked; degis(); } }), 'Değişimde renk skalası (artış yeşil, düşüş kırmızı)')),
      a.kurallar.length ? el('div', { class: 'rt-kurallar' }, ...a.kurallar.map(satir)) : el('p', { class: 'rt-soluk', style: 'margin: 0' }, 'Henüz kural yok. Hazır bir kuralla başlayın ya da yeni kural ekleyin. Kurallar sırayla uygulanır; aynı hücreye uyan son kural geçerli olur.'),
      el('div', { class: 'rt-hazir' }, el('span', { class: 'rt-soluk' }, 'Hazır:'), ...HAZIR.map((h) => el('button', { type: 'button', class: 'rt-cip', onclick: () => { a.kurallar.push({ ...h.k, aktif: true }); degis(); } }, h.ad))),
      el('div', { class: 'rt-panel-alt' },
        el('button', { type: 'button', class: 'dugme kucuk', onclick: () => { a.kurallar.push({ alan: 'harcama', kosul: 'gt', deger: 1000, stil: 'sari', kapsam: 'hucre', aktif: true }); degis(); } }, '+ Kural ekle'),
        mesaj, el('span', { class: 'rt-bosluk' }), kaydet));
  }

  ara.addEventListener('input', () => { durum.ara = ara.value.trim(); ciz(); });
  kbDugme.addEventListener('click', () => { durum.panel = !durum.panel; ciz(); });
  csv.addEventListener('click', () => {
    const tablo = sar.querySelector('table'); if (!tablo) return;
    const hucre = (t) => '"' + t.replace(/[⧉✎]/g, '').replace(/\s+/g, ' ').trim().replace(/"/g, '""') + '"';
    const satir = [...tablo.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => hucre(c.textContent.replace(/ [↓↑]$/, ''))).join(';'));
    const a = el('a', { href: URL.createObjectURL(new Blob(['﻿' + satir.join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: `reklam-${durum.sekme}-${durum.donem}gun-${dun}.csv` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  ciz();
  return kok;
}
