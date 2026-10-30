// Yazı düzenleyici (Muhittin, 28 Eki 2026): bir textarea'yı araç çubuklu, görsel (WYSIWYG) düzenleyiciye çevirir.
// Kayıt biçimi değişmez: düzenleyici her değişiklikte textarea'ya güvenli Markdown alt kümesini yazar (worker/metin.js):
// "## / ### başlık", "**kalın**", "_eğik_", "- madde", "1. madde", "> alıntı", "[metin](adres)". Ham HTML kaydedilmez.
// Özellikler: araç çubuğu ve kısayollar, yapıştırırken temizleme, Markdown kaynak görünümü, bul ve değiştir, tam ekran,
// kelime/karakter sayacı ve okuma süresi, tarayıcıda otomatik taslak (yalnız bu tarayıcıda; kaydın yerini tutmaz).
import { metinHtml } from '../../../worker/metin.js';

const IKON = {
  geri: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  ileri: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  kalin: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  egik: '<path d="M11 5h6M7 19h6M14 5l-4 14"/>',
  baglanti: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  madde: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  sira: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5h1v4M4 9h2M4 14.5a1 1 0 0 1 2 0c0 1-2 2-2 3h2"/>',
  alinti: '<path d="M7 7h4v4H8v3H5v-4zM15 7h4v4h-3v3h-3v-4z"/>',
  temizle: '<path d="M4 7V5h12v2M10 5l-3 14M5 19h6"/><path d="M15 14l5 5M20 14l-5 5"/>',
  kaynak: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>',
  bul: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  tam: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  kucult: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'
};
const svg = (ad) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[ad]}</svg>`;

// ---- HTML → Markdown (yalnız izinli biçimler) ----
const BLOK = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'TR', 'SECTION', 'ARTICLE']);
function satirIci(dugum) {
  let s = '';
  for (const c of dugum.childNodes) {
    if (c.nodeType === 3) { s += c.nodeValue.replace(/\s+/g, ' '); continue; }
    if (c.nodeType !== 1) continue;
    const ad = c.nodeName;
    if (ad === 'BR') { s += '\n'; continue; }
    const ic = satirIci(c);
    const agirlik = c.style && (c.style.fontWeight === 'bold' || Number(c.style.fontWeight) >= 600);
    const yatik = c.style && c.style.fontStyle === 'italic';
    if (ad === 'STRONG' || ad === 'B' || agirlik) s += ic.trim() ? sar(ic, '**', '**') : ic;
    else if (ad === 'EM' || ad === 'I' || yatik) s += ic.trim() ? sar(ic, '_', '_') : ic;
    else if (ad === 'A') { const h = (c.getAttribute('href') || '').trim(); s += /^(https?:\/\/|\/(?![\/\\]))/.test(h) && ic.trim() ? `[${ic.trim().replace(/[[\]]/g, '')}](${h})` : ic; }
    else if (BLOK.has(ad)) s += '\n' + ic + '\n';
    else s += ic;
  }
  return s;
}
// Boşlukları işaretin dışında bırakır: " kalın " → " **kalın** "
const sar = (t, a, b) => { const m = t.match(/^(\s*)([\s\S]*?)(\s*)$/); return m[1] + a + m[2] + b + m[3]; };
const temizSatir = (t) => t.split('\n').map((x) => x.replace(/[ \t]+/g, ' ').trim()).filter((x, i, l) => x || (i > 0 && l[i - 1])).join('\n').trim();
export function htmlMarkdown(kok) {
  const bloklar = [];
  const paragraf = (t) => { t = temizSatir(t); if (t) bloklar.push(t); };
  const gez = (d) => {
    let bekleyen = '';
    const bosalt = () => { if (bekleyen.trim()) paragraf(bekleyen); bekleyen = ''; };
    for (const c of d.childNodes) {
      if (c.nodeType === 3) { bekleyen += c.nodeValue; continue; }
      if (c.nodeType !== 1) continue;
      const ad = c.nodeName;
      if (!BLOK.has(ad)) { if (ad === 'BR') bekleyen += '\n'; else bekleyen += satirIci({ childNodes: [c] }); continue; }
      bosalt();
      if (/^H[1-6]$/.test(ad)) { const t = temizSatir(satirIci(c)).replace(/\n+/g, ' '); if (t) bloklar.push((ad === 'H3' || ad === 'H4' || ad === 'H5' || ad === 'H6' ? '### ' : '## ') + t); }
      else if (ad === 'UL' || ad === 'OL') {
        const ogeler = [...c.children].filter((x) => x.nodeName === 'LI').map((li, i) => (ad === 'OL' ? `${i + 1}. ` : '- ') + temizSatir(satirIci(li)).replace(/\n+/g, ' ')).filter((x) => !/^(- |\d+\. )$/.test(x));
        if (ogeler.length) bloklar.push(ogeler.join('\n'));
      } else if (ad === 'BLOCKQUOTE') { const t = temizSatir(satirIci(c)); if (t) bloklar.push(t.split('\n').map((x) => '> ' + x).join('\n')); }
      else if ([...c.children].some((x) => BLOK.has(x.nodeName))) gez(c); // ör. <p> içine düşmüş liste ya da iç içe div
      else paragraf(satirIci(c));
    }
    bosalt();
  };
  gez(kok);
  return bloklar.join('\n\n');
}

let stilEklendi = false;
function stilEkle() {
  if (stilEklendi) return; stilEklendi = true;
  const st = document.createElement('style');
  st.textContent = `
.ye{border:1px solid rgb(var(--line));border-radius:14px;background:rgb(var(--card));display:flex;flex-direction:column;min-width:0}
.ye:focus-within{border-color:var(--brand)}
.ye-cubuk{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:6px;border-bottom:1px solid rgb(var(--line));position:sticky;top:0;z-index:2;background:rgb(var(--card));border-radius:14px 14px 0 0}
.ye-cubuk button,.ye-cubuk select{min-height:34px;min-width:34px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--tx);font:inherit;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.ye-cubuk select{padding:0 6px;border:1px solid rgb(var(--line));min-width:120px}
.ye-cubuk button:hover{background:var(--card2,var(--bg))}
.ye-cubuk button[aria-pressed=true]{background:var(--tint);color:var(--tintx)}
.ye-ayrac{width:1px;height:22px;background:rgb(var(--line));margin:0 4px}
.ye-bosluk{flex:1}
.ye-alan{min-height:320px;max-height:70vh;overflow:auto;padding:18px 22px;outline:none;font-size:16px;line-height:1.7;color:var(--tx)}
.ye-alan:empty::before{content:attr(data-ipucu);color:var(--tx2)}
.ye-alan h2{font-size:24px;line-height:1.3;margin:18px 0 8px;color:var(--head)}
.ye-alan h3{font-size:19px;line-height:1.3;margin:14px 0 6px;color:var(--head)}
.ye-alan p{margin:0 0 12px}
.ye-alan ul,.ye-alan ol{margin:0 0 12px;padding-left:24px}
.ye-alan blockquote{margin:0 0 12px;padding:8px 16px;border-left:3px solid var(--brand);background:var(--tint);border-radius:0 10px 10px 0}
.ye-alan blockquote p{margin:0}
.ye-alan a{color:var(--acc)}
.ye-kaynak{min-height:320px;max-height:70vh;padding:18px 22px;border:0;outline:none;resize:vertical;background:rgb(var(--card));color:var(--tx);font:14px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace}
.ye-bul{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;border-bottom:1px solid rgb(var(--line));background:var(--card2,var(--bg))}
.ye-bul input{min-height:34px;padding:0 10px;border:1px solid rgb(var(--line));border-radius:8px;background:rgb(var(--card));color:var(--tx);font:inherit;font-size:14px;flex:1 1 160px}
.ye-bul button{min-height:34px;padding:0 10px;border:1px solid rgb(var(--line));border-radius:8px;background:rgb(var(--card));color:var(--tx);font:inherit;font-size:13px;cursor:pointer}
.ye-alt{display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:space-between;padding:8px 12px;border-top:1px solid rgb(var(--line));font-size:12.5px;color:var(--tx2)}
.ye-tam{position:fixed;inset:0;z-index:1000;border-radius:0;background:var(--bg)}
.ye-tam .ye-alan,.ye-tam .ye-kaynak{max-height:none;flex:1;width:min(860px,100%);margin:0 auto;box-sizing:border-box;padding:32px 24px;font-size:18px}
.ye-tam .ye-cubuk{border-radius:0}
.ye-taslak{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid rgb(var(--line));background:var(--infob,var(--tint));color:var(--info,var(--tx));font-size:13.5px}
.ye-taslak button{min-height:30px;padding:0 10px;border:1px solid rgb(var(--line));border-radius:8px;background:rgb(var(--card));color:var(--tx);font:inherit;font-size:13px;cursor:pointer}
`;
  document.head.append(st);
}

const el = (ad, oz = {}, ...cocuk) => { const e = document.createElement(ad); for (const [k, v] of Object.entries(oz)) { if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } e.append(...cocuk.filter((x) => x != null)); return e; };

/**
 * textarea'yı düzenleyiciye çevirir. secenek: { anahtar (taslak için benzersiz ad), ipucu, kaydet (Ctrl+S'te çağrılır), sinir }
 * Döndürür: { yenile(markdown) } — textarea değeri dışarıdan değiştirildiğinde görünümü yeniler.
 */
export function yaziEditoru(ta, secenek = {}) {
  stilEkle();
  const anahtar = secenek.anahtar ? 'idx-taslak:' + secenek.anahtar : null;
  const alan = el('div', { class: 'ye-alan', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': ta.getAttribute('aria-label') || 'Metin', 'data-ipucu': secenek.ipucu || 'Yazmaya başlayın…', spellcheck: 'true', lang: 'tr' });
  const kaynak = el('textarea', { class: 'ye-kaynak', 'aria-label': 'Markdown kaynağı', spellcheck: 'false', hidden: true });
  const sayac = el('span'), durum = el('span', { role: 'status' });
  const kutu = el('div', { class: 'ye' });
  let kaynakModu = false;

  const btn = (ad, etiket, is, kisayol) => el('button', { type: 'button', title: etiket + (kisayol ? ` (${kisayol})` : ''), 'aria-label': etiket, onmousedown: (o) => o.preventDefault(), onclick: is }, el('span', {}, ''));
  const ikonlu = (ad, etiket, is, kisayol) => { const b = btn(ad, etiket, is, kisayol); b.firstChild.outerHTML = svg(ad); return b; };
  const komut = (c, d) => { if (kaynakModu) return; alan.focus(); document.execCommand(c, false, d); esitle(); };
  const bicim = el('select', { 'aria-label': 'Paragraf biçimi', onchange: () => { komut('formatBlock', bicim.value); bicim.blur(); } },
    el('option', { value: 'P' }, 'Paragraf'), el('option', { value: 'H2' }, 'Ara başlık'), el('option', { value: 'H3' }, 'Alt başlık'), el('option', { value: 'BLOCKQUOTE' }, 'Alıntı'));
  const durumlu = {};
  const bagla = () => {
    if (kaynakModu) return;
    const sec = getSelection(); if (!sec.rangeCount || sec.isCollapsed) { const u = prompt('Bağlantı adresi (https://… ya da sitedeki /tr/… adresi)'); if (!u) return; if (!/^(https?:\/\/|\/(?![\/\\]))/.test(u.trim())) return alert('Adres https:// ya da / ile başlamalı.'); const metin = prompt('Bağlantı metni') || u; alan.focus(); document.execCommand('insertHTML', false, `<a href="${u.trim().replace(/"/g, '%22')}">${metin.replace(/[<>&]/g, '')}</a>`); esitle(); return; }
    const mevcut = sec.anchorNode && sec.anchorNode.parentElement && sec.anchorNode.parentElement.closest('a');
    const u = prompt('Bağlantı adresi (boş bırakırsanız bağlantı kaldırılır)', mevcut ? mevcut.getAttribute('href') : 'https://');
    if (u === null) return;
    if (!u.trim()) return komut('unlink');
    if (!/^(https?:\/\/|\/(?![\/\\]))/.test(u.trim())) return alert('Adres https:// ya da / ile başlamalı.');
    komut('createLink', u.trim());
  };
  const cubuk = el('div', { class: 'ye-cubuk', role: 'toolbar', 'aria-label': 'Biçimlendirme' },
    ikonlu('geri', 'Geri al', () => komut('undo'), 'Ctrl+Z'), ikonlu('ileri', 'Yinele', () => komut('redo'), 'Ctrl+Y'), el('span', { class: 'ye-ayrac' }),
    bicim, el('span', { class: 'ye-ayrac' }),
    (durumlu.bold = ikonlu('kalin', 'Kalın', () => komut('bold'), 'Ctrl+B')), (durumlu.italic = ikonlu('egik', 'Eğik', () => komut('italic'), 'Ctrl+I')), ikonlu('baglanti', 'Bağlantı', bagla, 'Ctrl+K'), el('span', { class: 'ye-ayrac' }),
    (durumlu.insertUnorderedList = ikonlu('madde', 'Madde işaretli liste', () => komut('insertUnorderedList'))), (durumlu.insertOrderedList = ikonlu('sira', 'Numaralı liste', () => komut('insertOrderedList'))), ikonlu('alinti', 'Alıntı', () => komut('formatBlock', 'BLOCKQUOTE')), ikonlu('temizle', 'Biçimi temizle', () => { komut('removeFormat'); komut('formatBlock', 'P'); }),
    el('span', { class: 'ye-bosluk' }),
    ikonlu('bul', 'Bul ve değiştir', () => { bulKutu.hidden = !bulKutu.hidden; if (!bulKutu.hidden) bulGirdi.focus(); }, 'Ctrl+F'),
    (durumlu.kaynak = ikonlu('kaynak', 'Markdown kaynağı', () => kaynakAc(!kaynakModu))),
    (durumlu.tam = ikonlu('tam', 'Tam ekran', () => tamEkran(), 'F11')));

  // Bul ve değiştir (Markdown metni üzerinde çalışır; biçimler korunur)
  const bulGirdi = el('input', { placeholder: 'Bul', 'aria-label': 'Bul' }), degGirdi = el('input', { placeholder: 'Değiştir', 'aria-label': 'Şununla değiştir' }), bulSonuc = el('span', { style: 'font-size: 13px; color: var(--tx2)' });
  const say = () => { const q = bulGirdi.value; bulSonuc.textContent = q ? `${ta.value.split(q).length - 1} sonuç` : ''; };
  bulGirdi.addEventListener('input', say);
  const bulKutu = el('div', { class: 'ye-bul', hidden: true }, bulGirdi, degGirdi,
    el('button', { type: 'button', onclick: () => { const q = bulGirdi.value; if (!q) return; const i = ta.value.indexOf(q); if (i < 0) return say(); disaridan(ta.value.slice(0, i) + degGirdi.value + ta.value.slice(i + q.length)); say(); } }, 'Değiştir'),
    el('button', { type: 'button', onclick: () => { const q = bulGirdi.value; if (!q) return; disaridan(ta.value.split(q).join(degGirdi.value)); say(); } }, 'Tümünü değiştir'), bulSonuc);

  const taslakSerit = el('div', { class: 'ye-taslak', hidden: true });
  kutu.append(cubuk, bulKutu, taslakSerit, alan, kaynak, el('div', { class: 'ye-alt' }, sayac, durum));
  ta.hidden = true; ta.after(kutu);

  const sayacYaz = () => {
    const duz = ta.value.replace(/[#>*_\[\]()]|\(https?:[^)]*\)/g, ' ');
    const k = (duz.match(/\S+/g) || []).length;
    sayac.textContent = `${k} kelime · ${ta.value.length}${secenek.sinir ? ' / ' + secenek.sinir : ''} karakter · ${Math.max(1, Math.round(k / 200))} dk okuma`;
    sayac.style.color = secenek.sinir && ta.value.length > secenek.sinir ? 'var(--err)' : '';
  };
  let zaman = null;
  const taslakYaz = () => { if (!anahtar) return; clearTimeout(zaman); zaman = setTimeout(() => { try { localStorage.setItem(anahtar, JSON.stringify({ metin: ta.value, zaman: Date.now(), ilk: ilkDeger })); durum.textContent = 'Taslak bu tarayıcıya kaydedildi'; } catch {} }, 800); };
  const esitle = () => {
    ta.value = kaynakModu ? kaynak.value.replace(/\r\n?/g, '\n') : htmlMarkdown(alan);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    sayacYaz(); taslakYaz();
  };
  const ciz = () => { alan.innerHTML = metinHtml(ta.value); kaynak.value = ta.value; sayacYaz(); };
  const disaridan = (md) => { ta.value = md; ciz(); ta.dispatchEvent(new Event('input', { bubbles: true })); taslakYaz(); };
  const kaynakAc = (ac) => {
    kaynakModu = ac;
    if (ac) { kaynak.value = ta.value; kaynak.style.minHeight = Math.max(320, alan.offsetHeight) + 'px'; }
    else ciz();
    alan.hidden = ac; kaynak.hidden = !ac; bicim.disabled = ac;
    durumlu.kaynak.setAttribute('aria-pressed', String(ac));
    (ac ? kaynak : alan).focus();
  };
  const tamEkran = () => {
    const ac = !kutu.classList.contains('ye-tam');
    kutu.classList.toggle('ye-tam', ac);
    document.documentElement.style.overflow = ac ? 'hidden' : '';
    durumlu.tam.innerHTML = svg(ac ? 'kucult' : 'tam'); durumlu.tam.setAttribute('aria-label', ac ? 'Tam ekrandan çık' : 'Tam ekran');
    (kaynakModu ? kaynak : alan).focus();
  };

  // Boş alana yazılan ilk satır ve kökteki çıplak metin <p> içine alınır (liste/başlık komutları doğru çalışsın)
  const kokuDuzelt = () => {
    if (!alan.firstChild) { alan.innerHTML = '<p><br></p>'; const r = document.createRange(); r.setStart(alan.firstChild, 0); r.collapse(true); const sec = getSelection(); sec.removeAllRanges(); sec.addRange(r); return; }
    const ciplak = [...alan.childNodes].filter((n) => (n.nodeType === 3 && n.nodeValue.trim()) || (n.nodeType === 1 && !BLOK.has(n.nodeName) && n.nodeName !== 'BR'));
    if (!ciplak.length) return;
    const sec = getSelection(), r = sec.rangeCount ? sec.getRangeAt(0) : null;
    const p = document.createElement('p'); ciplak[0].before(p);
    for (const n of ciplak) { if (n.previousSibling === p || p.contains(n.previousSibling) || n === ciplak[0]) p.append(n); }
    if (r && p.contains(r.startContainer)) { sec.removeAllRanges(); sec.addRange(r); }
  };
  alan.addEventListener('focus', () => { if (!alan.textContent.trim() && !alan.querySelector('li')) kokuDuzelt(); });
  alan.addEventListener('input', () => { kokuDuzelt(); esitle(); });
  kaynak.addEventListener('input', esitle);
  // Yapıştırma: biçim yalnız izinli öğelere indirgenir (Word, Google Dokümanlar, web sayfaları)
  alan.addEventListener('paste', (o) => {
    o.preventDefault();
    const html = o.clipboardData.getData('text/html'), duz = o.clipboardData.getData('text/plain');
    let md;
    if (html) { const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('script,style,meta,title,img,svg,iframe,object').forEach((x) => x.remove()); md = htmlMarkdown(d.body); }
    else md = duz.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
    const parca = metinHtml(md);
    document.execCommand('insertHTML', false, parca || '');
    esitle();
  });
  // Enter ile yeni paragraf <p> olsun (Chrome varsayılanı <div>)
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}
  const durumGuncelle = () => {
    if (kaynakModu || !alan.contains(getSelection().anchorNode)) return;
    for (const k of ['bold', 'italic', 'insertUnorderedList', 'insertOrderedList']) durumlu[k].setAttribute('aria-pressed', String(document.queryCommandState(k)));
    const b = String(document.queryCommandValue('formatBlock') || 'p').toUpperCase();
    bicim.value = ['H2', 'H3', 'BLOCKQUOTE'].includes(b) ? b : 'P';
  };
  document.addEventListener('selectionchange', durumGuncelle);
  kutu.addEventListener('keydown', (o) => {
    const k = o.key.toLowerCase(), ctrl = o.ctrlKey || o.metaKey;
    if (ctrl && k === 'k') { o.preventDefault(); bagla(); }
    else if (ctrl && k === 'f') { o.preventDefault(); bulKutu.hidden = false; bulGirdi.focus(); }
    else if (ctrl && k === 's' && secenek.kaydet) { o.preventDefault(); secenek.kaydet(); }
    else if (ctrl && o.altKey && (k === '2' || k === '3')) { o.preventDefault(); komut('formatBlock', 'H' + k); }
    else if (ctrl && o.altKey && k === '0') { o.preventDefault(); komut('formatBlock', 'P'); }
    else if (o.key === 'F11') { o.preventDefault(); tamEkran(); }
    else if (o.key === 'Escape' && kutu.classList.contains('ye-tam')) tamEkran();
  });

  const ilkDeger = ta.value;
  ciz();
  // Kaydedilmemiş taslak varsa geri yükleme önerisi
  if (anahtar) {
    try {
      const t = JSON.parse(localStorage.getItem(anahtar) || 'null');
      if (t && t.metin !== ta.value && t.ilk === ilkDeger) {
        taslakSerit.hidden = false;
        taslakSerit.append(el('span', {}, `Bu tarayıcıda ${new Date(t.zaman).toLocaleString('tr-TR')} tarihli kaydedilmemiş bir taslak var.`),
          el('button', { type: 'button', onclick: () => { disaridan(t.metin); taslakSerit.hidden = true; } }, 'Taslağı geri yükle'),
          el('button', { type: 'button', onclick: () => { try { localStorage.removeItem(anahtar); } catch {} taslakSerit.hidden = true; } }, 'Yok say'));
      } else if (t && t.ilk !== ilkDeger) localStorage.removeItem(anahtar);
    } catch {}
  }
  return {
    yenile: (md) => { ta.value = md; ciz(); },
    kaydedildi: () => { try { if (anahtar) localStorage.removeItem(anahtar); } catch {} durum.textContent = 'Kaydedildi'; taslakSerit.hidden = true; }
  };
}
