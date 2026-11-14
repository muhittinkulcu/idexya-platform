// Cloudflare Access jetonu doğrulama ve yazma isteği kaynak (CSRF) denetimi. Varsayılan kapalıdır: ayar eksikse ya da
// herhangi bir adım tutmazsa yetki verilmez. Node'da tarayıcısız test: node tools/test-temel-yol.mjs
import { jwtVerify } from 'jose';

const liste = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

// POLICY_AUD virgülle birden çok değer alabilir (tek adrese geçişte eski panel.idexya.com uygulaması + yeni os.idexya.com
// uygulaması). Jetonun aud değerlerinden biri listedekilerden biriyle tam eşleşmelidir (jose audience dizisi).
export const audListesi = (env) => liste(env && env.POLICY_AUD);

// Jetonu doğrular; geçerli ve izinli yöneticiyse { eposta } döner, değilse null. anahtarlar: jose anahtar kümesi.
export async function jetonDogrula(jeton, env, anahtarlar) {
  const aud = audListesi(env);
  if (!env || !env.TEAM_DOMAIN || !aud.length || !jeton || !anahtarlar) return null;
  try {
    const { payload } = await jwtVerify(jeton, anahtarlar, { issuer: env.TEAM_DOMAIN, audience: aud });
    const izinli = liste(env.YONETICILER).map((x) => x.toLowerCase());
    const e = String(payload.email || '').toLowerCase();
    // İzinli yönetici listesi boşsa panel kapalıdır (Access politikası geniş olsa bile).
    if (!izinli.length || !e || !izinli.includes(e)) return null;
    return { eposta: e };
  } catch (h) {
    return null;
  }
}

// IZINLI_KOKENLER: yalnız os alanından gelen panel isteğinde, isteğin kendi kökenine ek olarak kabul edilen tam kökenler
// ("https://os.idexya.com"). Yalnız https (yerel geliştirmede http://*.localhost) ve yolsuz köken; joker, "null" yok.
export function izinliKokenler(env) {
  const sonuc = [];
  for (const x of liste(env && env.IZINLI_KOKENLER)) {
    let u;
    try { u = new URL(x); } catch (e) { continue; }
    const yerel = u.protocol === 'http:' && /(^|\.)localhost$/.test(u.hostname);
    if (u.protocol !== 'https:' && !yerel) continue;
    if (u.username || u.password || (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) continue;
    if (x.replace(/\/$/, '') !== u.origin) continue; // yazım tam köken olmalı (büyük harf, yol, boşluk yok)
    sonuc.push(u.origin);
  }
  return sonuc;
}

// Yazma isteğinin Origin başlığı isteğin kendi kökeniyle aynı olmalı; os isteğinde ayrıca izinli listeden biri olabilir.
// Origin yoksa, bozuksa ya da "null" ise reddedilir.
export function kaynakIzinli(istek, izinli = []) {
  const k = istek.headers.get('origin');
  if (!k || k === 'null') return false;
  let ko, iu;
  try { ko = new URL(k); iu = new URL(istek.url); } catch (e) { return false; }
  if (ko.host === iu.host) return true;
  return Array.isArray(izinli) && izinli.length > 0 && ko.origin === k.replace(/\/$/, '') && izinli.includes(ko.origin);
}
