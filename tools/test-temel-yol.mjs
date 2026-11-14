// Temel yol (os.idexya.com/website), çoklu Access AUD ve yazma kaynağı (CSRF) testi; tarayıcı ve sunucu gerekmez:
//   node tools/test-temel-yol.mjs
// HTMLRewriter Node'da yok: HTML çıktısı tools/test-temel-yol-sunucu.mjs ile yerel `wrangler dev` üzerinde denetlenir.
import { readFileSync } from 'fs';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { onekGecerli, yolEkle, yolCikar, srcsetEkle, cssEkle, konumEkle, onekli } from '../src/data/temel-yol.js';
import { temelAyar, osAlaniMi, istekAyir, cerezOnekle, yanitOnekle, agBetigi } from '../worker/temel-yol.js';
import { audListesi, jetonDogrula, kaynakIzinli, izinliKokenler } from '../worker/erisim.js';

let kalan = 0, gecen = 0;
const kontrol = (ad, kosul) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad); if (kosul) gecen++; else kalan++; };
const T = '/website';

// 1. Önek kuralı
kontrol('geçerli önek /website', onekGecerli('/website'));
for (const k of ['', '/', 'website', '/web/site', '/Website', '/web.site', '/web site', '/../x', '//x', '/x/'] ) kontrol(`geçersiz önek ${JSON.stringify(k)}`, !onekGecerli(k));
kontrol('önek boşken adres aynen', yolEkle('/leads', '') === '/leads' && yolEkle('/leads', undefined) === '/leads');
kontrol('kök göreli adres önekli', yolEkle('/leads?tab=new', T) === '/website/leads?tab=new');
kontrol('kök adres /website/', yolEkle('/', T) === '/website/');
kontrol('çift önek yok: /website/leads', yolEkle('/website/leads', T) === '/website/leads');
kontrol('çift önek yok: /website, /website?x, /website#y', ['/website', '/website?x=1', '/website#y'].every((u) => yolEkle(u, T) === u));
kontrol('benzer ad öneklenir (/websites)', yolEkle('/websites', T) === '/website/websites');
kontrol('Access çıkışı öneksiz kalır', yolEkle('/cdn-cgi/access/logout', T) === '/cdn-cgi/access/logout');
for (const u of ['https://idexya.com/', '//cdn.ornek.com/x.js', 'x.js', '?id=1', '#bolum', 'data:image/png;base64,AA', 'javascript:void 0', 'mailto:a@b.c', '/\\evil.com'])
  kontrol(`dokunulmaz: ${u}`, yolEkle(u, T) === u);
kontrol('yolCikar /website/leads → /leads', yolCikar('/website/leads', T) === '/leads');
kontrol('yolCikar /website → /', yolCikar('/website', T) === '/' && yolCikar('/website/', T) === '/');
kontrol('yolCikar önek dışı → null', yolCikar('/leads', T) === null && yolCikar('/websitex/leads', T) === null);
kontrol('onekli /websitex değil', !onekli('/websitex', T));
kontrol('srcset', srcsetEkle('/a.png 1x, /website/b.png 2x, https://x/c.png 3x', T) === '/website/a.png 1x, /website/b.png 2x, https://x/c.png 3x');
kontrol('CSS url()', cssEkle("a{src:url(/fonts/a.woff2)}b{background:url('/x.png')}c{background:url(\"/website/y.png\")}d{background:url(data:x)}e{background:url(//cdn/x)}", T)
  === "a{src:url(/website/fonts/a.woff2)}b{background:url('/website/x.png')}c{background:url(\"/website/y.png\")}d{background:url(data:x)}e{background:url(//cdn/x)}");
kontrol('Location aynı köken önekli', konumEkle('https://os.idexya.com/dashboard', 'https://os.idexya.com/', T) === 'https://os.idexya.com/website/dashboard');
kontrol('Location göreli önekli', konumEkle('/leads?tab=new', 'https://os.idexya.com/leads/', T) === 'https://os.idexya.com/website/leads?tab=new');
kontrol('Location zaten önekli aynen', konumEkle('https://os.idexya.com/website/leads', 'https://os.idexya.com/x', T) === 'https://os.idexya.com/website/leads');
kontrol('Location başka köken aynen', konumEkle('https://idexya.com/tr/', 'https://os.idexya.com/x', T) === 'https://idexya.com/tr/');

// Site önizlemesi için sayfa başına konan ağ betiği aynı kuralı uygular (fetch, sendBeacon, XHR).
{
  const w = { navigator: { sendBeacon: (u) => u }, fetch: (u) => u };
  const xhr = function () {}; xhr.prototype.open = function (m, u) { return u; };
  new Function('window', 'document', 'XMLHttpRequest', 'MutationObserver', 'with (window) {' + agBetigi(T) + '}')(Object.assign(w, { XMLHttpRequest: xhr }), { documentElement: {} }, xhr, undefined);
  const ornek = ['/', '/a?b=1#c', '/website', '/website/', '/website?x', '/website#y', '/websitex', '/cdn-cgi/access/logout', '/cdn-cgix', '//x', '/\\x', 'x', '?a', 'https://a/b', ''];
  kontrol('ağ betiği kuralı yolEkle ile aynı (' + ornek.length + ' örnek)', ornek.every((u) => w.__idexyaOnek(u) === yolEkle(u, T)));
  kontrol('ağ betiği fetch/sendBeacon/XHR önekli', w.fetch('/api/olcum') === '/website/api/olcum' && w.navigator.sendBeacon('/api/olcum') === '/website/api/olcum' && new xhr().open('GET', '/api/x') === '/website/api/x');
  kontrol('ağ betiği önek metni güvenli (JSON)', agBetigi(T).endsWith('})("/website");'));
}

// 2. Ayar ve os alanı
kontrol('ayar boşken kapalı', temelAyar({}) === null && temelAyar({ PANEL_TEMEL_YOL: '/website' }) === null && temelAyar({ PANEL_OS_ALAN: 'os.idexya.com' }) === null);
kontrol('geçersiz önekle kapalı', temelAyar({ PANEL_TEMEL_YOL: 'website', PANEL_OS_ALAN: 'os.idexya.com' }) === null);
const A = temelAyar({ PANEL_TEMEL_YOL: ' /website ', PANEL_OS_ALAN: 'OS.idexya.com' });
kontrol('ayar açık', A && A.temel === '/website' && A.alan === 'os.idexya.com');
kontrol('os alanı yalnız tam ad', osAlaniMi(new URL('https://os.idexya.com/website/x'), A) && !osAlaniMi(new URL('https://panel.idexya.com/website/x'), A) && !osAlaniMi(new URL('https://os.idexya.com.evil.com/'), A));
kontrol('ayar kapalıyken os alanı yok', !osAlaniMi(new URL('https://os.idexya.com/website/x'), null));
const ic = istekAyir(new Request('https://os.idexya.com/website/api/yonetim/musteriler?arsiv=1', { method: 'POST', headers: { origin: 'https://os.idexya.com', 'cf-access-jwt-assertion': 'j', 'content-type': 'application/json' }, body: '{"a":1}' }), A);
kontrol('önek ayrılır, sorgu kalır', ic && ic.url === 'https://os.idexya.com/api/yonetim/musteriler?arsiv=1');
kontrol('yöntem ve başlıklar korunur', ic && ic.method === 'POST' && ic.headers.get('origin') === 'https://os.idexya.com' && ic.headers.get('cf-access-jwt-assertion') === 'j');
kontrol('gövde korunur', ic && (await ic.text()) === '{"a":1}');
kontrol('/website → /', istekAyir(new Request('https://os.idexya.com/website'), A).url === 'https://os.idexya.com/');
for (const y of ['/', '/dashboard', '/api/yonetim/ozet', '/_astro/x.js', '/websitex', '/tr/'])
  kontrol(`önek dışı ${y} → yok (404)`, istekAyir(new Request('https://os.idexya.com' + y), A) === null);

// 3. Yanıt: yönlendirme, çerez, CSS, uygulama bildirimi
const y302 = await yanitOnekle(Response.redirect('https://os.idexya.com/dashboard', 302), 'https://os.idexya.com/', T);
kontrol('302 yönlendirme önekli', y302.status === 302 && y302.headers.get('location') === 'https://os.idexya.com/website/dashboard');
const y301 = await yanitOnekle(Response.redirect('https://os.idexya.com/leads?tab=new', 301), 'https://os.idexya.com/leads/', T);
kontrol('301 yönlendirme önekli', y301.status === 301 && y301.headers.get('location') === 'https://os.idexya.com/website/leads?tab=new');
kontrol('çerez yolu', cerezOnekle('a=1; Path=/; HttpOnly', T) === 'a=1; Path=/website/; HttpOnly' && cerezOnekle('a=1; HttpOnly', T) === 'a=1; HttpOnly; Path=/website' && cerezOnekle('a=1; path=/website/x', T) === 'a=1; path=/website/x');
const css = await yanitOnekle(new Response('a{src:url(/fonts/x.woff2)}', { headers: { 'content-type': 'text/css', 'content-length': '26', etag: '"e"' } }), 'https://os.idexya.com/_astro/a.css', T);
kontrol('CSS yazı tipi adresi önekli', (await css.text()) === 'a{src:url(/website/fonts/x.woff2)}' && !css.headers.get('etag'));
const man = await yanitOnekle(new Response(JSON.stringify({ id: '/dashboard', start_url: '/dashboard', scope: '/', icons: [{ src: '/panel-ikon-192.png' }] }), { headers: { 'content-type': 'application/manifest+json' } }), 'https://os.idexya.com/panel.webmanifest', T);
const mj = await man.json();
kontrol('uygulama bildirimi önekli', mj.start_url === '/website/dashboard' && mj.scope === '/website/' && mj.icons[0].src === '/website/panel-ikon-192.png' && mj.id === '/website/dashboard');
const js = new Response('fetch("/api/x")', { headers: { 'content-type': 'text/javascript' } });
kontrol('JS dosyasına dokunulmaz', (await yanitOnekle(js, 'https://os.idexya.com/_astro/a.js', T)) === js);

// 4. Access jetonu: POLICY_AUD virgüllü birden çok değer; kapalı başarısızlık
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
const anahtarlar = createLocalJWKSet({ keys: [jwk] });
const TD = 'https://idexya.cloudflareaccess.com';
const jeton = (ozel = {}, aud = 'AUD_YENI', iss = TD, sure = '5m') => new SignJWT({ email: 'Muhittin@Idexya.com', ...ozel }).setProtectedHeader({ alg: 'RS256', kid: 'k1' })
  .setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime(sure).sign(privateKey);
const env = { TEAM_DOMAIN: TD, POLICY_AUD: 'AUD_ESKI, AUD_YENI', YONETICILER: 'muhittin@idexya.com' };
kontrol('AUD listesi ayrıştırılır', JSON.stringify(audListesi(env)) === '["AUD_ESKI","AUD_YENI"]' && audListesi({ POLICY_AUD: ' , ' }).length === 0);
kontrol('ikinci AUD geçerli → kabul', (await jetonDogrula(await jeton(), env, anahtarlar))?.eposta === 'muhittin@idexya.com');
kontrol('ilk AUD geçerli → kabul', !!(await jetonDogrula(await jeton({}, 'AUD_ESKI'), env, anahtarlar)));
kontrol('tek AUD (bugünkü ayar) → kabul', !!(await jetonDogrula(await jeton({}, 'AUD_ESKI'), { ...env, POLICY_AUD: 'AUD_ESKI' }, anahtarlar)));
kontrol('jeton dizi aud, biri listede → kabul', !!(await jetonDogrula(await jeton({}, ['BASKA', 'AUD_YENI']), env, anahtarlar)));
kontrol('hiçbir AUD eşleşmez → ret', (await jetonDogrula(await jeton({}, 'AUD_BASKA'), env, anahtarlar)) === null);
kontrol('AUD parçası eşleşmez (AUD_YEN) → ret', (await jetonDogrula(await jeton({}, 'AUD_YEN'), env, anahtarlar)) === null);
kontrol('virgüllü metin tek aud olarak → ret', (await jetonDogrula(await jeton({}, 'AUD_ESKI, AUD_YENI'), env, anahtarlar)) === null);
kontrol('POLICY_AUD boş → ret', (await jetonDogrula(await jeton(), { ...env, POLICY_AUD: '' }, anahtarlar)) === null);
kontrol('POLICY_AUD yalnız virgül → ret', (await jetonDogrula(await jeton(), { ...env, POLICY_AUD: ' , ,' }, anahtarlar)) === null);
kontrol('TEAM_DOMAIN yok → ret', (await jetonDogrula(await jeton(), { ...env, TEAM_DOMAIN: '' }, anahtarlar)) === null);
kontrol('başka yayıncı → ret', (await jetonDogrula(await jeton({}, 'AUD_YENI', 'https://kotu.cloudflareaccess.com'), env, anahtarlar)) === null);
kontrol('süresi dolmuş → ret', (await jetonDogrula(await jeton({}, 'AUD_YENI', TD, Math.floor(Date.now() / 1000) - 60), env, anahtarlar)) === null);
kontrol('yönetici listesi boş → ret', (await jetonDogrula(await jeton(), { ...env, YONETICILER: '' }, anahtarlar)) === null);
kontrol('listede olmayan e-posta → ret', (await jetonDogrula(await jeton({ email: 'baska@idexya.com' }), env, anahtarlar)) === null);
kontrol('e-postasız jeton → ret', (await jetonDogrula(await jeton({ email: '' }), env, anahtarlar)) === null);
const { privateKey: yabanci } = await generateKeyPair('RS256');
const sahte = await new SignJWT({ email: 'muhittin@idexya.com' }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(TD).setAudience('AUD_YENI').setIssuedAt().setExpirationTime('5m').sign(yabanci);
kontrol('başka anahtarla imzalı → ret', (await jetonDogrula(sahte, env, anahtarlar)) === null);
kontrol('bozuk jeton → ret', (await jetonDogrula('a.b.c', env, anahtarlar)) === null && (await jetonDogrula('', env, anahtarlar)) === null);

// 5. Yazma kaynağı (CSRF): IZINLI_KOKENLER yalnız os isteğinde ve yalnız tam köken
const istek = (url, origin) => new Request(url, { method: 'POST', headers: origin === undefined ? {} : { origin } });
kontrol('aynı köken → kabul', kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://panel.idexya.com')));
kontrol('Origin yok → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x')));
kontrol('Origin "null" → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'null')));
kontrol('bozuk Origin → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'bozuk')));
kontrol('başka köken, liste boş → ret (bugünkü davranış)', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://os.idexya.com')));
const IZ = izinliKokenler({ IZINLI_KOKENLER: 'https://os.idexya.com, *, null, http://os.idexya.com, https://os.idexya.com/website, HTTPS://OS.IDEXYA.COM, https://u:p@x.com, http://os.localhost:8787, bozuk' });
kontrol('izinli liste yalnız tam https köken (+ yerel http *.localhost)', JSON.stringify(IZ) === '["https://os.idexya.com","http://os.localhost:8787"]');
kontrol('izinli köken (os isteği) → kabul', kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://os.idexya.com'), IZ));
kontrol('izinli köken ama http → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'http://os.idexya.com'), IZ));
kontrol('izinli köken benzeri alan → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://os.idexya.com.evil.com'), IZ));
kontrol('izinli köken farklı bağlantı noktası → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://os.idexya.com:8443'), IZ));
kontrol('listede olmayan köken → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://marketing.idexya.com'), IZ));
kontrol('izinli liste boşsa → yalnız aynı köken', izinliKokenler({}).length === 0 && izinliKokenler({ IZINLI_KOKENLER: ' , ' }).length === 0);

// 6. Worker: os isteği yalnız os alanında izinli listeyi alır (kod yapısı)
const kod = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
kontrol('yonetimApi izinli listeyi yalnız os isteğinde alır', /kim, os \? os\.izinli : \[\]\)/.test(kod) && /izinli: izinliKokenler\(env\)/.test(kod) && (kod.match(/izinliKokenler\(env\)/g) || []).length === 1);
kontrol('yazma isteği kaynak denetimi kaynakIzinli ile', /yontem !== 'GET' && !kaynakIzinli\(istek, izinli\)/.test(kod));
kontrol('ayar kapalıyken isle(…, null)', /return await isle\(istek, env, ctx, null\)/.test(kod));
const wr = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
kontrol('run_worker_first /website ve /website/*', wr.includes('"/website", "/website/*"'));

console.log(`${gecen} GEÇTİ, ${kalan} KALDI`);
process.exit(kalan ? 1 : 0);
