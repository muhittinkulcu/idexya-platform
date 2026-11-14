// Temel yol (önek) yardımcıları: panel os.idexya.com/website/... yönlendiricisinin arkasında çalışırken kök göreli adreslere
// önek eklenir. Hem Worker (worker/temel-yol.js, HTMLRewriter) hem tarayıcı (src/scripts/yonetim/temel-yol.js) bu dosyayı
// kullanır; kural tek yerde durur. Önek boşsa her işlev girdiyi aynen döndürür (bugünkü davranış).
// Plan: idexya-ortak tek-adres-plani.md "Envanter sonucu ve kararlar".

// Geçerli önek: tek parça, küçük harf/rakam/tire ("/website"). Boş, "/", iç içe yol, nokta, ters bölü kabul edilmez.
export const ONEK_DESEN = /^\/[a-z0-9][a-z0-9-]{0,39}$/;
export const onekGecerli = (t) => typeof t === 'string' && ONEK_DESEN.test(t);

// Önek eklenmeyen kök yollar: Cloudflare Access'in kendi uçları (çıkış /cdn-cgi/access/logout) alan kökünde kalır.
const DOKUNMA = /^\/cdn-cgi(\/|$)/;

// Yol zaten önekli mi? "/website", "/website/…", "/website?…", "/website#…"
export function onekli(u, temel) {
  if (!onekGecerli(temel) || typeof u !== 'string') return false;
  return u === temel || ['/', '?', '#'].includes(u.charAt(temel.length)) && u.startsWith(temel);
}

// Kök göreli adrese ("/leads?tab=new") önek ekler. Göreli ("?id=1", "x.js"), tam adres ("https://…"), protokol göreli
// ("//…"), data:, javascript:, #çapa ve zaten önekli adres aynen kalır (çift önek yok).
export function yolEkle(u, temel) {
  if (!onekGecerli(temel) || typeof u !== 'string') return u;
  if (!u.startsWith('/') || u.startsWith('//') || u.startsWith('/\\')) return u;
  if (DOKUNMA.test(u) || onekli(u, temel)) return u;
  return temel + u;
}

// Önekli yolu panelin bildiği yola çevirir: "/website/leads" → "/leads", "/website" → "/". Önekli değilse null.
export function yolCikar(yol, temel) {
  if (!onekGecerli(temel) || typeof yol !== 'string' || !onekli(yol, temel)) return null;
  const kalan = yol.slice(temel.length);
  return kalan.startsWith('/') ? kalan : '/' + kalan;
}

// srcset: "a.png 1x, /b.png 2x" → her adayın adresine yolEkle.
export function srcsetEkle(deger, temel) {
  if (!onekGecerli(temel) || typeof deger !== 'string') return deger;
  return deger.split(',').map((parca) => {
    const m = parca.match(/^(\s*)(\S+)(.*)$/s);
    return m ? m[1] + yolEkle(m[2], temel) + m[3] : parca;
  }).join(',');
}

// CSS içindeki url(/…) adresleri (satır içi <style>, style="" ve .css dosyaları).
export function cssEkle(metin, temel) {
  if (!onekGecerli(temel) || typeof metin !== 'string') return metin;
  return metin.replace(/url\(\s*(['"]?)(\/[^'")\s]*)\1\s*\)/g, (tam, tirnak, u) => `url(${tirnak}${yolEkle(u, temel)}${tirnak})`);
}

// Worker yönlendirmelerinin Location başlığı: aynı kökendeki öneksiz adres önekli olur; başka köken aynen kalır.
export function konumEkle(konum, istekAdresi, temel) {
  if (!onekGecerli(temel) || typeof konum !== 'string') return konum;
  let hedef, kaynak;
  try { kaynak = new URL(istekAdresi); hedef = new URL(konum, kaynak); } catch (e) { return konum; }
  if (hedef.origin !== kaynak.origin) return konum;
  const yol = yolEkle(hedef.pathname, temel);
  return hedef.origin + yol + hedef.search + hedef.hash;
}
