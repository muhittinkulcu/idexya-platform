// Güvenli metin biçimlendirme (Markdown alt kümesi). Önce her şey kaçışlanır, sonra yalnız izinli biçimler eklenir;
// ham HTML hiçbir zaman geçmez. Sunucu ve yönetim paneli önizlemesi aynı kodu kullanır.
const kac = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function satirIci(s) {
  let t = kac(s);
  t = t.replace(/\[([^\]]{1,200})\]\((https?:\/\/[^\s)]{1,500}|\/(?![\/\\])[^\s)]{0,500})\)/g, (_, y, u) => `<a href="${u}"${u.startsWith('/') ? '' : ' rel="noopener nofollow" target="_blank"'}>${y}</a>`);
  t = t.replace(/\*\*([^*]{1,500})\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[\s(])_([^_]{1,500})_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  return t;
}
export function metinHtml(girdi) {
  const satirlar = String(girdi || '').replace(/\r\n?/g, '\n').split('\n');
  const cikti = []; let liste = null, paragraf = [];
  const bitir = () => {
    if (paragraf.length) { cikti.push('<p>' + paragraf.map(satirIci).join('<br>') + '</p>'); paragraf = []; }
    if (liste) { cikti.push(`<${liste.tur}>` + liste.ogeler.map((o) => '<li>' + satirIci(o) + '</li>').join('') + `</${liste.tur}>`); liste = null; }
  };
  for (const ham of satirlar) {
    const s = ham.trimEnd();
    let m;
    if (!s.trim()) { bitir(); continue; }
    if ((m = s.match(/^(#{2,3})\s+(.+)$/))) { bitir(); const d = m[1].length; cikti.push(`<h${d}>${satirIci(m[2])}</h${d}>`); continue; }
    if ((m = s.match(/^>\s?(.*)$/))) { bitir(); cikti.push('<blockquote><p>' + satirIci(m[1]) + '</p></blockquote>'); continue; }
    if ((m = s.match(/^[-*]\s+(.+)$/)) || (m = s.match(/^\d+[.)]\s+(.+)$/))) {
      const tur = /^\d/.test(s) ? 'ol' : 'ul';
      if (paragraf.length) { const p = paragraf; paragraf = []; cikti.push('<p>' + p.map(satirIci).join('<br>') + '</p>'); }
      if (!liste || liste.tur !== tur) { if (liste) bitir(); liste = { tur, ogeler: [] }; }
      liste.ogeler.push(m[1]); continue;
    }
    if (liste) bitir();
    paragraf.push(s);
  }
  bitir();
  return cikti.join('\n');
}
export const kacis = kac;
