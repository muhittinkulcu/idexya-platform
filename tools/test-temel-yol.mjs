// Temel yol (os.idexya.com/website), çoklu Access AUD ve yazma kaynağı (CSRF) testi; tarayıcı ve sunucu gerekmez:
//   node tools/test-temel-yol.mjs
// HTMLRewriter Node'da yok: HTML çıktısı tools/test-temel-yol-sunucu.mjs ile yerel `wrangler dev` üzerinde denetlenir.
import { readFileSync } from 'fs';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { onekGecerli, yolEkle, yolCikar, srcsetEkle, cssEkle, konumEkle, onekli, siteAdresi } from '../src/data/temel-yol.js';
import { temelAyar, osAlaniMi, istekAyir, cerezOnekle, yanitOnekle, osYoluIzinli, kapiDenetle, sabitSureliEsit, siteKoku } from '../worker/temel-yol.js';
import { audListesi, jetonDogrula, kaynakIzinli, yerelGiris } from '../worker/erisim.js';
import { onyuklemeKurallari, onyuklemeBasligi, ONYUKLEME_YOL } from '../worker/onyukleme.js';

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

// 2. Ayar ve os alanı
kontrol('ayar boşken kapalı', temelAyar({}) === null && temelAyar({ PANEL_TEMEL_YOL: '/website' }) === null && temelAyar({ PANEL_OS_ALAN: 'os.idexya.com' }) === null);
kontrol('geçersiz önekle kapalı', temelAyar({ PANEL_TEMEL_YOL: 'website', PANEL_OS_ALAN: 'os.idexya.com' }) === null);
const A = temelAyar({ PANEL_TEMEL_YOL: ' /website ', PANEL_OS_ALAN: 'OS.idexya.com' });
kontrol('ayar açık', A && A.temel === '/website' && JSON.stringify(A.alanlar) === '["os.idexya.com"]');
const A2 = temelAyar({ PANEL_TEMEL_YOL: '/website', PANEL_OS_ALAN: 'os.idexya.com, os-onizleme.idexya.com' });
kontrol('PANEL_OS_ALAN virgüllü liste', A2 && osAlaniMi(new URL('https://os-onizleme.idexya.com/website/'), A2) && osAlaniMi(new URL('https://os.idexya.com/website/'), A2) && !osAlaniMi(new URL('https://idexya.com/'), A2));
kontrol('listede geçersiz alan → kapalı', temelAyar({ PANEL_TEMEL_YOL: '/website', PANEL_OS_ALAN: 'os.idexya.com, *.idexya.com' }) === null && temelAyar({ PANEL_TEMEL_YOL: '/website', PANEL_OS_ALAN: ' , ' }) === null);
kontrol('os alanı yalnız tam ad', osAlaniMi(new URL('https://os.idexya.com/website/x'), A) && !osAlaniMi(new URL('https://panel.idexya.com/website/x'), A) && !osAlaniMi(new URL('https://os.idexya.com.evil.com/'), A));
kontrol('ayar kapalıyken os alanı yok', !osAlaniMi(new URL('https://os.idexya.com/website/x'), null));
const ic = istekAyir(new Request('https://os.idexya.com/website/api/yonetim/musteriler?arsiv=1', { method: 'POST', headers: { origin: 'https://os.idexya.com', 'cf-access-jwt-assertion': 'j', 'content-type': 'application/json' }, body: '{"a":1}' }), A);
kontrol('önek ayrılır, sorgu kalır', ic && ic.url === 'https://os.idexya.com/api/yonetim/musteriler?arsiv=1');
kontrol('kapı anahtarı başlığı içeri geçmez', !istekAyir(new Request('https://os.idexya.com/website/dashboard', { headers: { 'x-idexya-kapi': 'gizli' } }), A).headers.has('x-idexya-kapi'));
kontrol('yöntem ve başlıklar korunur', ic && ic.method === 'POST' && ic.headers.get('origin') === 'https://os.idexya.com' && ic.headers.get('cf-access-jwt-assertion') === 'j');
kontrol('gövde korunur', ic && (await ic.text()) === '{"a":1}');
kontrol('/website → /', istekAyir(new Request('https://os.idexya.com/website'), A).url === 'https://os.idexya.com/');
for (const y of ['/', '/dashboard', '/api/yonetim/ozet', '/_astro/x.js', '/websitex', '/tr/'])
  kontrol(`önek dışı ${y} → yok (404)`, istekAyir(new Request('https://os.idexya.com' + y), A) === null);

// os alanında yalnız panel yolları (önek ayrılmış hali)
for (const y of ['/', '/dashboard', '/leads', '/leads/', '/customer', '/api/yonetim/ozet', '/api/yonetim/musteriler/toplu', '/yonetim', '/yonetim/talepler/', '/yonetim/veri/sablon/ortak/logo.png',
  '/api/medya/abc', '/api/instagram/123/gorsel', '/api/instagram/akis/123/gorsel', '/_astro/x.js', '/fonts/inter.woff2', '/kapak/cizim/arama.webp', '/favicon-panel.svg', '/favicon-panel-32.png', '/panel-ikon-192.png', '/panel.webmanifest', '/panel-gorunum.js', '/panel-kabuk.js', '/panel-onyukleme.json'])
  kontrol(`os izinli: ${y}`, osYoluIzinli(y, ''));
for (const [y, a] of [['/', '?tema=onizleme'], ['/tr/', ''], ['/tr/iletisim', ''], ['/en/', ''], ['/icerik/x', ''], ['/api/talep', ''], ['/api/uye/giris', ''], ['/uye/', ''], ['/uye/hesap', ''],
  ['/api/icerik', ''], ['/api/tema', ''], ['/api/bannerlar', ''], ['/api/olcum', ''], ['/api/asistan/mesaj', ''], ['/api/bulten', ''], ['/api/instagram', ''], ['/arama.json', ''], ['/referans', ''], ['/sitemap.xml', ''], ['/robots.txt', ''], ['/tr/bulten/x/', ''], ['/kabuk/icerik/', ''], ['/maskot/idos-kedi.webp', ''], ['/favicon.svg', ''], ['/panel-sw.js', ''], ['/bilinmeyen', '']])
  kontrol(`os 404: ${y}${a}`, !osYoluIzinli(y, a));

// Yönlendirici kapısı (X-Idexya-Kapi)
const kapi = (anahtar, baslik) => kapiDenetle(new Request('https://os.idexya.com/website/', { headers: baslik === undefined ? {} : { 'x-idexya-kapi': baslik } }), { KAPI_ANAHTARI_WEBSITE: anahtar });
kontrol('kapı: anahtar tanımsız → 503', (await kapi('', 'x')) === 503 && (await kapiDenetle(new Request('https://os.idexya.com/'), {})) === 503);
kontrol('kapı: başlık yok → 404', (await kapi('gizli-anahtar')) === 404);
kontrol('kapı: yanlış anahtar → 404', (await kapi('gizli-anahtar', 'gizli-anahtaR')) === 404 && (await kapi('gizli-anahtar', 'gizli')) === 404 && (await kapi('gizli-anahtar', '')) === 404);
kontrol('kapı: doğru anahtar → geçer', (await kapi('gizli-anahtar', 'gizli-anahtar')) === 0);
kontrol('sabit süreli karşılaştırma', (await sabitSureliEsit('a', 'a')) && !(await sabitSureliEsit('a', 'b')) && !(await sabitSureliEsit('a', 'aa')));
const kapiKod = readFileSync(new URL('../worker/temel-yol.js', import.meta.url), 'utf8');
kontrol('kapı karşılaştırması erken çıkışsız (=== ile metin karşılaştırması yok)', !/gelen\s*[!=]==/.test(kapiKod) && /fark \|= x\[i\] \^ y\[i\]/.test(kapiKod));

// Site bağlantıları os alanında panel.idexya.com'da
kontrol('site yolu panel köküne', siteAdresi('/tr/bulten/x/?onizleme=1', T, 'https://panel.idexya.com') === 'https://panel.idexya.com/tr/bulten/x/?onizleme=1' && siteAdresi('/icerik/y', T, 'https://panel.idexya.com') === 'https://panel.idexya.com/icerik/y');
kontrol('panel yolu site köküne gitmez', siteAdresi('/leads', T, 'https://panel.idexya.com') === null && siteAdresi('/trx', T, 'https://panel.idexya.com') === null && siteAdresi('/tr/x', '', 'https://panel.idexya.com') === null);
kontrol('site kökü: canlıda panel.idexya.com, yerelde panel.localhost', siteKoku(new URL('https://os.idexya.com/x'), { YEREL_GIRIS: 'evet' }) === 'https://panel.idexya.com' && siteKoku(new URL('http://os.localhost:8791/x'), { YEREL_GIRIS: 'evet' }) === 'http://panel.localhost:8791');

// YEREL_GIRIS yalnız yerel adlarda
kontrol('YEREL_GIRIS os.idexya.com\'da etkin değil', !yerelGiris(new URL('https://os.idexya.com/website/'), { YEREL_GIRIS: 'evet' }) && !yerelGiris(new URL('https://os-onizleme.idexya.com/'), { YEREL_GIRIS: 'evet' }) && !yerelGiris(new URL('https://panel.idexya.com/'), { YEREL_GIRIS: 'evet' }));
kontrol('YEREL_GIRIS yerel adlarda etkin, kapalıyken değil', yerelGiris(new URL('http://os.localhost:8791/'), { YEREL_GIRIS: 'evet' }) && yerelGiris(new URL('http://panel.localhost/'), { YEREL_GIRIS: 'evet' }) && !yerelGiris(new URL('http://os.localhost/'), {}) && !yerelGiris(new URL('http://kotu.localhost/'), { YEREL_GIRIS: 'evet' }));

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
const ham = (talep, alg = 'RS256', anahtar = privateKey) => { let j = new SignJWT({ email: 'muhittin@idexya.com', ...talep }).setProtectedHeader({ alg, kid: 'k1' }).setIssuer(TD).setAudience('AUD_YENI'); return j; };
kontrol('exp olmayan jeton → ret', (await jetonDogrula(await ham().setIssuedAt().sign(privateKey), env, anahtarlar)) === null);
kontrol('iat olmayan jeton → ret', (await jetonDogrula(await ham().setExpirationTime('5m').sign(privateKey), env, anahtarlar)) === null);
const { privateKey: psAnahtar } = await generateKeyPair('PS256');
kontrol('RS256 dışı algoritma (PS256) → ret', (await jetonDogrula(await ham({}, 'PS256').setIssuedAt().setExpirationTime('5m').sign(psAnahtar), env, anahtarlar)) === null);
const imzasiz = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ email: 'muhittin@idexya.com', iss: TD, aud: 'AUD_YENI', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url') + '.';
kontrol('alg none → ret', (await jetonDogrula(imzasiz, env, anahtarlar)) === null);
const { privateKey: yabanci } = await generateKeyPair('RS256');
const sahte = await new SignJWT({ email: 'muhittin@idexya.com' }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(TD).setAudience('AUD_YENI').setIssuedAt().setExpirationTime('5m').sign(yabanci);
kontrol('başka anahtarla imzalı → ret', (await jetonDogrula(sahte, env, anahtarlar)) === null);
kontrol('bozuk jeton → ret', (await jetonDogrula('a.b.c', env, anahtarlar)) === null && (await jetonDogrula('', env, anahtarlar)) === null);

// 5. Yazma kaynağı (CSRF): aynı köken; os isteğinde yalnız https://<os alanı>
const istek = (url, origin) => new Request(url, { method: 'POST', headers: origin === undefined ? {} : { origin } });
kontrol('aynı köken → kabul', kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://panel.idexya.com')));
kontrol('Origin yok → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x')));
kontrol('Origin "null" → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'null')));
kontrol('bozuk Origin → ret', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'bozuk')));
kontrol('başka köken, liste boş → ret (bugünkü davranış)', !kaynakIzinli(istek('https://panel.idexya.com/api/yonetim/x', 'https://os.idexya.com')));
kontrol('os isteği: https://<os alanı> kabul', kaynakIzinli(istek('https://os.idexya.com/api/yonetim/x', 'https://os.idexya.com'), ['https://os.idexya.com']));
kontrol('os isteği: http os kökeni → ret', !kaynakIzinli(istek('https://os.idexya.com/api/yonetim/x', 'http://os.idexya.com'), ['https://os.idexya.com']));
kontrol('os isteği: benzer alan → ret', !kaynakIzinli(istek('https://os.idexya.com/api/yonetim/x', 'https://os.idexya.com.evil.com'), ['https://os.idexya.com']));
kontrol('os isteği: başka Idexya alanı → ret', !kaynakIzinli(istek('https://os.idexya.com/api/yonetim/x', 'https://marketing.idexya.com'), ['https://os.idexya.com']));

// 6. Worker: os isteği yalnız os alanında izinli listeyi alır (kod yapısı)
const kod = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
kontrol('yonetimApi izinli listeyi yalnız os isteğinde alır', /kim, os \? os\.izinli : \[\]\)/.test(kod) && /izinli: \[`https:\/\/\$\{icUrl\.hostname\}`\]/.test(kod) && !/IZINLI_KOKENLER/.test(kod));
kontrol('os isteğinde sıra: kapı → önek → izin listesi', /kapiDenetle\(istek, env\)[\s\S]*istekAyir\(istek, ayar\)[\s\S]*osYoluIzinli\(/.test(kod));
kontrol('panel CSP: script-src \'self\' (unsafe-inline yok)', /script-src 'self'; connect-src/.test(kod) && !/script-src 'self' 'unsafe-inline'/.test(kod));
kontrol('yonetici yerel girişi yerelGiris ile', /if \(yerelGiris\(url, env\)\) return/.test(kod));
kontrol('yazma isteği kaynak denetimi kaynakIzinli ile', /yontem !== 'GET' && !kaynakIzinli\(istek, izinli\)/.test(kod));
kontrol('ayar kapalıyken isle(…, null)', /return await isle\(istek, env, ctx, null\)/.test(kod));
const wr = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
kontrol('run_worker_first /website ve /website/*', wr.includes('"/website", "/website/*"'));
kontrol('run_worker_first önceden yükleme kuralları', wr.includes(`"${ONYUKLEME_YOL}"`));

// Önceden yükleme kuralları (worker/onyukleme.js): yalnız aynı köken panel sayfaları; API, Access ve çıkış ASLA.
// URLPattern'ın yol kalıbı burada basit bir dönüştürücüyle sınanır (* = herhangi karakter dizisi).
const kalip = (k) => new RegExp('^' + k.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
function onyuklenir(kural, yol, secici = '') {
  const kosul = kural.prefetch[0].where.and;
  return kosul.every((c) => {
    if (c.href_matches) return kalip(c.href_matches.pathname).test(yol);
    if (c.not && c.not.href_matches) return !kalip(c.not.href_matches.pathname).test(yol);
    if (c.not && c.not.selector_matches) return !c.not.selector_matches.split(',').map((x) => x.trim()).includes(secici);
    return false;
  });
}
for (const [temel, ad] of [['', 'panel'], [T, 'os']]) {
  const k = onyuklemeKurallari(temel);
  kontrol(`${ad}: yalnız prefetch (prerender yok), eagerness moderate, belge kuralları`, Object.keys(k).join() === 'prefetch' && k.prefetch.length === 1 && k.prefetch[0].eagerness === 'moderate' && k.prefetch[0].source === 'document');
  kontrol(`${ad}: kurallar belgeye göre (aynı köken)`, k.prefetch[0].where.and.filter((c) => c.href_matches || (c.not && c.not.href_matches)).every((c) => (c.href_matches || c.not.href_matches) && (c.relative_to || c.not.relative_to) === 'document'));
  for (const y of ['/dashboard', '/leads', '/crm', '/proposals', '/customer']) kontrol(`${ad} önceden yüklenir: ${temel}${y}`, onyuklenir(k, temel + y));
  for (const y of ['/api/yonetim/ozet', '/api/yonetim/musteriler/toplu', '/api/talep', '/cdn-cgi/access/logout', '/yonetim/veri/x', '/yonetim/talepler/'])
    kontrol(`${ad} ASLA önceden yüklenmez: ${y.startsWith('/cdn-cgi') ? y : temel + y}`, !onyuklenir(k, y.startsWith('/cdn-cgi') ? y : temel + y));
  kontrol(`${ad} çıkış bağlantısı (.ik-profil-cikis) ve yeni pencere önceden yüklenmez`, !onyuklenir(k, temel + '/dashboard', '.ik-profil-cikis') && !onyuklenir(k, temel + '/dashboard', '[target]') && !onyuklenir(k, temel + '/dashboard', '[download]'));
  kontrol(`${ad} başlık: "${temel}${ONYUKLEME_YOL}"`, onyuklemeBasligi(temel) === `"${temel}${ONYUKLEME_YOL}"`);
}
kontrol('os: önek dışı yol önceden yüklenmez (başka uygulama, /marketing/…)', !onyuklenir(onyuklemeKurallari(T), '/marketing/dashboard'));

console.log(`${gecen} GEÇTİ, ${kalan} KALDI`);
process.exit(kalan ? 1 : 0);
