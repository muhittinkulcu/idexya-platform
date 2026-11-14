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
    // Yalnız RS256 (Access imzası); süresi (exp) ve veriliş zamanı (iat) olmayan jeton kabul edilmez.
    const { payload } = await jwtVerify(jeton, anahtarlar, { issuer: env.TEAM_DOMAIN, audience: aud, algorithms: ['RS256'], requiredClaims: ['exp', 'iat'] });
    const izinli = liste(env.YONETICILER).map((x) => x.toLowerCase());
    const e = String(payload.email || '').toLowerCase();
    // İzinli yönetici listesi boşsa panel kapalıdır (Access politikası geniş olsa bile).
    if (!izinli.length || !e || !izinli.includes(e)) return null;
    return { eposta: e };
  } catch (h) {
    return null;
  }
}

// Yerel geliştirme girişi (YEREL_GIRIS=evet): yalnız yerel makine adları. os.idexya.com, panel.idexya.com ya da başka
// gerçek alan adında ayar açık kalsa bile etkin olmaz.
const YEREL_ADLAR = ['localhost', '127.0.0.1', 'panel.localhost', 'os.localhost'];
export const yerelGiris = (url, env) => !!env && env.YEREL_GIRIS === 'evet' && YEREL_ADLAR.includes(url.hostname);

// Yazma isteğinin Origin başlığı isteğin kendi kökeniyle aynı olmalı; os isteğinde ayrıca yalnız https://<os alanı>.
// Origin yoksa, bozuksa ya da "null" ise reddedilir.
export function kaynakIzinli(istek, izinli = []) {
  const k = istek.headers.get('origin');
  if (!k || k === 'null') return false;
  let ko, iu;
  try { ko = new URL(k); iu = new URL(istek.url); } catch (e) { return false; }
  if (ko.origin === iu.origin && k.replace(/\/$/, '') === ko.origin) return true; // şema da aynı olmalı (http → https ret)
  return Array.isArray(izinli) && izinli.length > 0 && ko.origin === k.replace(/\/$/, '') && izinli.includes(ko.origin);
}
