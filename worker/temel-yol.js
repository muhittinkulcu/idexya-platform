// Panelin os.idexya.com/website/... arkasında çalışması (temel yol). Ayar Worker değişkenleridir:
//   PANEL_TEMEL_YOL  boş ya da "/website"   · PANEL_OS_ALAN  ör. "os.idexya.com"   · IZINLI_KOKENLER  virgüllü tam kökenler
// İkisi birden geçerli değilse hiçbir şey değişmez (bugünkü panel.idexya.com davranışı). Önek Astro derlemesine konmaz
// (site aynı derlemede); gelen istekte önek ayrılır, yanıtta (HTML, CSS, yönlendirme, çerez) geri eklenir.
import { onekGecerli, yolEkle, srcsetEkle, cssEkle, konumEkle, yolCikar } from '../src/data/temel-yol.js';

export function temelAyar(env) {
  const temel = String((env && env.PANEL_TEMEL_YOL) || '').trim();
  const alan = String((env && env.PANEL_OS_ALAN) || '').trim().toLowerCase();
  if (!temel || !alan || !onekGecerli(temel) || !/^[a-z0-9.-]+$/.test(alan)) return null;
  return { temel, alan };
}

// İstek os alanında mı? Alan, isteğin kendi adresinden okunur (yönlendirici adresi korumalıdır); başlıklara güvenilmez.
export const osAlaniMi = (url, ayar) => !!ayar && url.hostname === ayar.alan;

// "/website/leads?tab=new" → panelin bildiği "/leads?tab=new" isteği (yöntem, başlıklar, gövde aynen). Önek dışıysa null.
export function istekAyir(istek, ayar) {
  const url = new URL(istek.url);
  const yol = yolCikar(url.pathname, ayar.temel);
  if (yol === null) return null;
  const yeni = new URL(url);
  yeni.pathname = yol;
  return new Request(yeni.toString(), istek);
}

const OZNITELIK = ['href', 'src', 'action', 'formaction', 'poster'];

class OznitelikOnek {
  constructor(temel) { this.temel = temel; }
  element(e) {
    for (const a of OZNITELIK) {
      const v = e.getAttribute(a);
      if (v !== null) { const y = yolEkle(v, this.temel); if (y !== v) e.setAttribute(a, y); }
    }
    const ss = e.getAttribute('srcset');
    if (ss !== null) { const y = srcsetEkle(ss, this.temel); if (y !== ss) e.setAttribute('srcset', y); }
    const st = e.getAttribute('style');
    if (st !== null) { const y = cssEkle(st, this.temel); if (y !== st) e.setAttribute('style', y); }
  }
}

// <style> metni parça parça gelir; url( bir parçanın sonunda bölünebileceği için metin biriktirilip sonda bir kez yazılır.
class StilOnek {
  constructor(temel) { this.temel = temel; this.tampon = ''; }
  text(t) {
    this.tampon += t.text;
    if (t.lastInTextNode) { t.replace(cssEkle(this.tampon, this.temel), { html: true }); this.tampon = ''; }
    else t.remove();
  }
}

// Önek ağı: panelin iframe ile önizlediği site sayfaları (Tema düzenleyici, bülten önizlemesi) kendi betikleriyle
// fetch('/api/…'), sendBeacon ve öneksiz görsel kullanır; bunlar önek dışına (os alanında 404) gitmesin diye sayfanın en
// başında kurulur. Kural src/data/temel-yol.js yolEkle ile aynıdır (tools/test-temel-yol.mjs ikisini karşılaştırır).
export function agBetigi(temel) {
  return `(function(T){var e=function(u){if(typeof u!=='string'||u.charAt(0)!=='/'||u.charAt(1)==='/'||u.charAt(1)==='\\\\'||/^\\/cdn-cgi(\\/|$)/.test(u))return u;if(u===T||(u.indexOf(T)===0&&'/?#'.indexOf(u.charAt(T.length))>=0))return u;return T+u;};`
    + `window.__idexyaOnek=e;var f=window.fetch;if(f)window.fetch=function(i,o){return f.call(this,typeof i==='string'?e(i):i,o);};`
    + `var n=window.navigator;if(n&&n.sendBeacon){var b=n.sendBeacon.bind(n);n.sendBeacon=function(u,d){return b(e(u),d);};}`
    + `var X=window.XMLHttpRequest&&XMLHttpRequest.prototype,x=X&&X.open;if(x)X.open=function(m,u){var a=[].slice.call(arguments);a[1]=e(u);return x.apply(this,a);};`
    + `var A=['href','src','action','poster'],d=function(el){if(!el||el.nodeType!==1)return;for(var i=0;i<A.length;i++){var v=el.getAttribute(A[i]);if(v!==null){var y=e(v);if(y!==v)el.setAttribute(A[i],y);}}},`
    + `g=function(k){if(!k||k.nodeType!==1)return;d(k);var l=k.querySelectorAll('[href],[src],[action],[poster]');for(var i=0;i<l.length;i++)d(l[i]);};`
    + `if(window.MutationObserver)new MutationObserver(function(r){for(var i=0;i<r.length;i++){if(r[i].type==='attributes')d(r[i].target);else for(var j=0;j<r[i].addedNodes.length;j++)g(r[i].addedNodes[j]);}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:A});`
    + `})(${JSON.stringify(temel)});`;
}

class MetaEkle {
  constructor(temel) { this.temel = temel; }
  element(e) { e.prepend(`<meta name="idexya-temel-yol" content="${this.temel}"><script>${agBetigi(this.temel)}</script>`, { html: true }); }
}

export function htmlOnekle(yanit, temel) {
  return new HTMLRewriter()
    .on('head', new MetaEkle(temel))
    .on('[href], [src], [action], [formaction], [poster], [srcset], [style]', new OznitelikOnek(temel))
    .on('style', new StilOnek(temel))
    .transform(yanit);
}

// Çerez yolu panelin kendi yoluna bağlanır (Path=/ → Path=/website/); başka uygulamanın çereziyle karışmaz.
export function cerezOnekle(deger, temel) {
  if (/;\s*path=/i.test(deger)) return deger.replace(/(;\s*path=)([^;]*)/i, (t, b, p) => b + (p.trim().startsWith('/') ? yolEkle(p.trim(), temel) : temel));
  return deger + '; Path=' + temel;
}

// os alanındaki yanıtın son hali: yönlendirme, çerez, HTML/CSS/uygulama bildirimi önekli.
export async function yanitOnekle(yanit, istekAdresi, temel) {
  const basliklar = new Headers(yanit.headers);
  let degisti = false;
  const konum = basliklar.get('location');
  if (konum) { const y = konumEkle(konum, istekAdresi, temel); if (y !== konum) { basliklar.set('location', y); degisti = true; } }
  const cerezler = typeof basliklar.getSetCookie === 'function' ? basliklar.getSetCookie() : [];
  if (cerezler.length) {
    basliklar.delete('set-cookie');
    cerezler.forEach((c) => basliklar.append('set-cookie', cerezOnekle(c, temel)));
    degisti = true;
  }
  const tur = (basliklar.get('content-type') || '').toLowerCase();
  const yol = new URL(istekAdresi).pathname;
  const govdeli = yanit.status === 200 && yanit.body;
  if (govdeli && tur.includes('text/css')) {
    basliklar.delete('content-length'); basliklar.delete('etag');
    return new Response(cssEkle(await yanit.text(), temel), { status: yanit.status, statusText: yanit.statusText, headers: basliklar });
  }
  if (govdeli && (tur.includes('manifest+json') || yol.endsWith('.webmanifest'))) {
    let m = null;
    try { m = JSON.parse(await yanit.clone().text()); } catch (e) { m = null; }
    if (m && typeof m === 'object') {
      for (const k of ['start_url', 'scope', 'id']) if (typeof m[k] === 'string') m[k] = yolEkle(m[k], temel);
      if (Array.isArray(m.icons)) m.icons.forEach((i) => { if (i && typeof i.src === 'string') i.src = yolEkle(i.src, temel); });
      if (Array.isArray(m.shortcuts)) m.shortcuts.forEach((s) => { if (s && typeof s.url === 'string') s.url = yolEkle(s.url, temel); });
      basliklar.delete('content-length'); basliklar.delete('etag');
      return new Response(JSON.stringify(m), { status: yanit.status, statusText: yanit.statusText, headers: basliklar });
    }
  }
  const sonuc = degisti ? new Response(yanit.body, { status: yanit.status, statusText: yanit.statusText, headers: basliklar }) : yanit;
  // HTML her durumda (404 sayfası dahil) öneklenir; 304 ve gövdesiz yanıt aynen geçer.
  if (sonuc.body && sonuc.status !== 304 && tur.includes('text/html')) return htmlOnekle(sonuc, temel);
  return sonuc;
}
