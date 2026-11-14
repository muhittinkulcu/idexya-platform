// Panelin os.idexya.com/website/... arkasında çalışması (temel yol). Ayar Worker değişkenleridir:
//   PANEL_TEMEL_YOL  boş ya da "/website"   · PANEL_OS_ALAN  virgüllü alan adları ("os.idexya.com, os-onizleme.idexya.com")
//   KAPI_ANAHTARI_WEBSITE  (gizli) yönlendiricinin X-Idexya-Kapi başlığıyla gönderdiği modül anahtarı
// Önek ve alan birlikte geçerli değilse hiçbir şey değişmez (bugünkü panel.idexya.com davranışı). Önek Astro derlemesine
// konmaz (site aynı derlemede); gelen istekte önek ayrılır, yanıtta (HTML, CSS, yönlendirme, çerez) geri eklenir.
// os alanında yalnız panelin kendisi sunulur (osYoluIzinli); site ve herkese açık uçlar sunulmaz.
import { onekGecerli, yolEkle, srcsetEkle, cssEkle, konumEkle, yolCikar, siteAdresi } from '../src/data/temel-yol.js';
import { SAYFALAR } from './panel-yollar.js';

export function temelAyar(env) {
  const temel = String((env && env.PANEL_TEMEL_YOL) || '').trim();
  const alanlar = String((env && env.PANEL_OS_ALAN) || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!temel || !onekGecerli(temel) || !alanlar.length || !alanlar.every((a) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(a))) return null;
  return { temel, alanlar };
}

// İstek os alanında mı? Alan, isteğin kendi adresinden okunur (yönlendirici adresi korumalıdır); başlıklara güvenilmez.
export const osAlaniMi = (url, ayar) => !!ayar && ayar.alanlar.includes(url.hostname);

export const KAPI_BASLIK = 'x-idexya-kapi';

// "/website/leads?tab=new" → panelin bildiği "/leads?tab=new" isteği (yöntem, başlıklar, gövde aynen; kapı anahtarı
// başlığı silinir). Önek dışıysa null.
export function istekAyir(istek, ayar) {
  const url = new URL(istek.url);
  const yol = yolCikar(url.pathname, ayar.temel);
  if (yol === null) return null;
  const yeni = new URL(url);
  yeni.pathname = yol;
  const ic = new Request(yeni.toString(), istek);
  ic.headers.delete(KAPI_BASLIK);
  return ic;
}

// os alanında sunulan yollar (önek ayrılmış hali). Gerisi 404: site sayfaları, /api/talep, /api/uye, /uye, /tr …
const VARLIK = /^\/(favicon-panel[\w-]*\.(svg|png)|panel-ikon-[\w-]+\.png|panel\.webmanifest|panel-gorunum\.js)$/;
export function osYoluIzinli(yol, arama = '') {
  if (yol === '/') return !new URLSearchParams(arama).has('tema'); // panel ana sayfasına yönlendirme; site önizlemesi yok
  const m = yol.match(/^\/([a-z-]+)\/?$/);
  if (m && SAYFALAR.has(m[1])) return true;
  if (yol === '/yonetim' || yol.startsWith('/yonetim/')) return true; // eski adres yönlendirmesi, /yonetim/veri/*
  if (yol.startsWith('/api/yonetim/') || yol.startsWith('/api/medya/')) return true;
  if (/^\/api\/instagram\/(akis\/)?[\w-]{1,80}\/gorsel$/.test(yol)) return true; // Instagram sayfasındaki görseller
  if (yol.startsWith('/_astro/') || yol.startsWith('/fonts/') || yol.startsWith('/kapak/cizim/')) return true;
  return VARLIK.test(yol);
}

// Yönlendirici kapısı: anahtar tanımlı değilse os alanı kapalı (503); başlık tutmazsa 404. Karşılaştırma sabit sürelidir
// (iki değerin SHA-256 özeti bayt bayt, erken çıkış yok).
async function ozet(metin) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(metin))));
}
export async function sabitSureliEsit(a, b) {
  const [x, y] = await Promise.all([ozet(a), ozet(b)]);
  let fark = 0;
  for (let i = 0; i < x.length; i++) fark |= x[i] ^ y[i];
  return fark === 0;
}
export async function kapiDenetle(istek, env) {
  const anahtar = String((env && env.KAPI_ANAHTARI_WEBSITE) || '');
  if (!anahtar) return 503;
  const gelen = istek.headers.get(KAPI_BASLIK);
  if (!gelen || !(await sabitSureliEsit(gelen, anahtar))) return 404;
  return 0;
}

// os alanında site sayfası bağlantılarının (bülten önizlemesi, yazı) açıldığı köken.
export function siteKoku(url, env) {
  if (env && env.YEREL_GIRIS === 'evet' && url.hostname.endsWith('.localhost')) return `${url.protocol}//panel.localhost${url.port ? ':' + url.port : ''}`;
  return 'https://panel.idexya.com';
}

const OZNITELIK = ['href', 'src', 'action', 'formaction', 'poster'];

class OznitelikOnek {
  constructor(temel, koku) { this.temel = temel; this.koku = koku; }
  element(e) {
    for (const a of OZNITELIK) {
      const v = e.getAttribute(a);
      if (v !== null) { const y = siteAdresi(v, this.temel, this.koku) || yolEkle(v, this.temel); if (y !== v) e.setAttribute(a, y); }
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

// Önek ve site kökü sayfaya yalnız veri olarak (meta) konur; satır içi betik eklenmez.
class MetaEkle {
  constructor(temel, koku) { this.temel = temel; this.koku = koku; }
  element(e) {
    const koku = /^https?:\/\/[a-z0-9.-]+(:\d+)?$/.test(this.koku || '') ? `<meta name="idexya-site-koku" content="${this.koku}">` : '';
    e.prepend(`<meta name="idexya-temel-yol" content="${this.temel}">${koku}`, { html: true });
  }
}

export function htmlOnekle(yanit, temel, koku = '') {
  return new HTMLRewriter()
    .on('head', new MetaEkle(temel, koku))
    .on('[href], [src], [action], [formaction], [poster], [srcset], [style]', new OznitelikOnek(temel, koku))
    .on('style', new StilOnek(temel))
    .transform(yanit);
}

// Çerez yolu panelin kendi yoluna bağlanır (Path=/ → Path=/website/); başka uygulamanın çereziyle karışmaz.
export function cerezOnekle(deger, temel) {
  if (/;\s*path=/i.test(deger)) return deger.replace(/(;\s*path=)([^;]*)/i, (t, b, p) => b + (p.trim().startsWith('/') ? yolEkle(p.trim(), temel) : temel));
  return deger + '; Path=' + temel;
}

// os alanındaki yanıtın son hali: yönlendirme, çerez, HTML/CSS/uygulama bildirimi önekli.
export async function yanitOnekle(yanit, istekAdresi, temel, koku = '') {
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
  if (sonuc.body && sonuc.status !== 304 && tur.includes('text/html')) return htmlOnekle(sonuc, temel, koku);
  return sonuc;
}
