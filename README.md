# Idexya Platform

idexya.com’un yeni sitesi ve ileride yönetim paneli. Astro (statik) + Cloudflare Workers.

## Komutlar
- `npm run dev` — yerel geliştirme
- `npm run build` — `dist/` üretir
- `sh tools/donustur.sh` — kamu sayfalarını `design/` içindeki tasarım dosyalarından yeniden üretir
- `node tools/ekran.mjs <yol> <genişlik> <çıktı.png>` — ekran görüntüsü (önizleme sunucusu açıkken)

## Yapı
- `design/` — onaylanan tasarım dosyaları (.dc.html). Sayfa metinleri ve veriler buradan gelir.
- `src/layouts/Site.astro` — ortak üst menü, alt kısım, tema, çerez onayı
- `src/pages/` — eski sitenin adresleri korunur: `/tr/hizmet/…`, `/tr/proje/…`, `/tr/haber/…`, `/tr/sayfa/…`, `/tr/iletisim`
- `public/_redirects` — taşınan eski adresler için 301 yönlendirmeleri
- `public/_headers` — güvenlik başlıkları; deneme ortamında arama motorlarına kapalı (noindex)

## Kurallar
- Canlı alan adına geçiş, DNS ve e-posta ayarları yalnız Muhittin’in onayıyla yapılır.
- Anahtarlar ve şifreler repoya yazılmaz.
- Metinler TDK yazım kurallarına uyar; paragraflar iki yana yaslıdır.

## Çatı site önizlemesi (bayrak arkasında)

Yeni çatı site `src/cati/`, `src/layouts/Cati.astro`, `src/components/cati/` altında gelişir. Bayrak kapalıyken bu dosyalar derlemeye girmez.

- Bayrak: `CATI_ONIZLEME=evet` ya da Workers Builds'te `main` dışındaki dal (`src/cati/bayrak.mjs`). `CATI_ONIZLEME=kapali` her durumda kapatır.
- Yerel: `CATI_ONIZLEME=evet npm run build && npx wrangler dev --port 8795 --local --persist-to <geçici klasör>`, adresler `/cati-onizleme/`, `/hizmetler/`, dokuz hizmet sayfası (`src/cati/hizmetler.mjs`). Hepsi noindex, menü dışı, site haritası dışı.
- Denetim: `PW_KOK=<playwright klasörü> node tools/test-cati.mjs http://127.0.0.1:8795 <ekran klasörü>`.
- Canlı değişmedi kanıtı: main'de ve dalda bayraksız `npm run build`, sonra `node tools/cati-kanit.mjs <main dist> dist`.

## Tek adres: panel `os.idexya.com/website` arkasında (isteğe bağlı, varsayılan kapalı)

Plan: idexya-ortak `tek-adres-plani.md`. Önek Astro derlemesine konmaz (site aynı derlemede); Worker isteği ayırır, yanıtı
öneklendirir (`worker/temel-yol.js`, kural `src/data/temel-yol.js`).

- Değişkenler: `PANEL_TEMEL_YOL` (boş ya da `/website`), `PANEL_OS_ALAN` (virgüllü alan adları, ör. `os.idexya.com,os-onizleme.idexya.com`),
  gizli `KAPI_ANAHTARI_WEBSITE` (yönlendiricinin `X-Idexya-Kapi` başlığındaki modül anahtarı). Önek ve alan birlikte geçerli
  değilse hiçbir şey değişmez; anahtar boşsa os alanı 503, başlık tutmazsa 404.
- os alanında **yalnız panelin kendisi** sunulur: panel sayfaları, `/api/yonetim/*`, `/yonetim/*` (eski adres yönlendirmesi ve
  `/yonetim/veri/*`), `/api/medya/*`, Instagram görselleri, `/_astro/*`, `/fonts/*`, `/kapak/cizim/*`, panel simgeleri,
  `panel.webmanifest`, `panel-gorunum.js`. Site sayfaları ve herkese açık uçlar (`/tr/…`, `/api/talep`, `/uye/…`) os alanında 404.
- Tema düzenleyicinin canlı önizlemesi os alanında kapalıdır (site sayfası panelle aynı kökende açılmaz); önizleme
  `panel.idexya.com`'da. Paneldeki site bağlantıları (bülten önizlemesi, yazı sayfası) os alanında `panel.idexya.com`'da açılır.
- Yazma isteği kaynağı: aynı köken; os alanında yalnız `https://<os alanı>`. `YEREL_GIRIS` yalnız `*.localhost` adlarında etkindir.
- `panel.idexya.com` bugünkü gibi çalışır. Yönlendirici isteği **adresini değiştirmeden** iletmelidir (Host = os alanı;
  `Origin`, `Cookie`, `Cf-Access-Jwt-Assertion` korunur, `X-Idexya-Kapi` eklenir).
- Test: `npm test` (sunucusuz). Uçtan uca: `npx wrangler dev --local --port 8791 --var YEREL_GIRIS:evet --var PANEL_TEMEL_YOL:/website
  --var PANEL_OS_ALAN:os.localhost --var KAPI_ANAHTARI_WEBSITE:yerel-deneme --persist-to <boş klasör>`, sonra
  `KAPI=yerel-deneme PW_KANAL=chrome PW_KOK=<playwright klasörü> node tools/test-temel-yol-sunucu.mjs 8791 <ekran klasörü>`.

## Yönetim paneli (`/yonetim`)

- Sunucu kodu `worker/index.js`; veritabanı Cloudflare D1 (`DB`), şema `worker/sema.js` ilk istekte kendiliğinden kurulur.
- Herkese açık tek uç: `POST /api/talep` (site formları). Korumalar: KVKK onayı zorunlu, tuzak alan, IP başına 10 dakikada 5 talep, Turnstile (anahtar tanımlıysa).
- `/yonetim/*` ve `/api/yonetim/*` yalnız Cloudflare Access girişiyle açılır; sunucu Access jetonunu ayrıca doğrular.
  Değişkenler tanımlanmadan panel **kapalıdır** (401):
  - `TEAM_DOMAIN` — ör. `https://<ekip>.cloudflareaccess.com`
  - `POLICY_AUD` — Access uygulamasının "Application Audience (AUD) Tag" değeri; tek adrese geçişte virgülle birden çok
    değer alabilir (eski panel + os uygulaması), jeton bunlardan biriyle eşleşmelidir
  - `YONETICILER` — izinli e-postalar, virgülle (ör. `info@idexya.com`)
  - Gizli: `IP_TUZ` (uzun rastgele metin; IP adresleri yalnız bununla özetlenerek saklanır, KVKK)
  - Gizli: `TURNSTILE_SECRET` ve derleme değişkeni `PUBLIC_TURNSTILE_SITE_KEY` — **ikisi birlikte** girilir; yalnız biri
    girilirse formlar çalışmaz
  - `YONETICILER` boşsa panel kapalı kalır
  - Gizli: `ANTHROPIC_API_KEY` — sitedeki yapay zekâ asistanı (Claude Haiku 5.5). Yoksa asistan ekibe yönlendirme modunda çalışır.
    İsteğe bağlı: `ASISTAN_AYLIK_SINIR` (aylık mesaj sınırı, varsayılan 3000), `ASISTAN_MODEL`.
- Saklama süreleri (`worker/saklama.js`, KVKK metniyle aynı): her gün 10.00'da müşteriye dönüşmeyen talepler (2 yıl), asistan sohbetleri (1 yıl),
  giriş denemeleri/IP özetleri (2 yıl), süresi dolan oturum ve şifre yenileme kayıtları silinir; özet işlem kaydına yazılır.
  CRM'e alınan talepler ve müşteri kayıtları silinmez.
- IDOS reklam özeti (`worker/reklam.js`): her gün 10.00'da (İstanbul) IDOS'un BigQuery **yetkili görünümünden** son 28 gün
  yalnız okunur, `reklam_ozet` tablosuna yazılır; panel yalnız bu tabloyu okur. Sorgu başına en fazla 100 MB işlenir.
  Ayarlar girilmeden hiçbir şey çalışmaz:
  - Gizli: `IDOS_BQ_ANAHTAR` — IDP'ye özel servis hesabının JSON anahtarı (yetki: yalnız `idexya_share` üzerinde Data Viewer + proje düzeyinde Job User)
  - `IDOS_BQ_GORUNUM` — `idexya-agency-os.idexya_share.<görünüm>`; `IDOS_BQ_KONUM` (varsayılan `europe-west1`)
  - Görünümde zorunlu sütunlar: `metric_date, platform, account_id, currency, spend`; isteğe bağlı `client_id, brand_name, impressions, clicks`.
    Diğer sayısal sütunlar sonuç türü sayılır (ör. `messaging_conversations`). Toplamlar yalnız TRY hesaplardan yapılır.
  - Test: `node tools/sahte/bigquery.mjs 8998` + `wrangler dev --test-scheduled` (`IDOS_BQ_API`, `IDOS_BQ_TOKEN_URL` sahte sunucuya),
    zamanlayıcı: `/cdn-cgi/handler/scheduled`
- **Müşteri ana kaydı (IDOS) önbelleği** (`worker/ana-kayit.js`, tasarım `docs/tasarim/musteri-ana-kayit.md` §3): CRM kartı
  `musteriler.ana_kayit_id` ile IDOS müşterisine bağlanır; müşteri kartında üstte salt okuma "Ana kayıt" bloğu görünür.
  Her saat başı yalnız değişenler, 07.00 UTC'de tam liste çekilir (`ana_musteri` tablosu, yedeğe girmez). Kart açılınca tek
  müşteri istenir, 10 dakika önbellekte kalır; IDOS'a ulaşılamazsa son önbellek "eski" uyarısıyla gösterilir. Ayarlar:
  - Gizli: `IDOS_ORTAK_JETON` — IDOS'taki `ORTAK_JETON_PANEL` ile aynı değer (değer hiçbir dosyaya yazılmaz)
  - `IDOS_ORTAK_URL` — IDOS adresi (https); `IDOS_MUSTERI_ADRESI` (isteğe bağlı) — "Ana kayıtta düzenle" bağlantısı, `{id}` yer tutucusuyla
  - Ayar yoksa eşitleme atlanır, blok gizlenir. Elle eşitleme: `POST /api/yonetim/ana-kayit/esitle` (`{"tam": true}` ile tam liste)
  - **Hesap eşleme:** her eşitlemede IDOS `hesap-esleme` listesi `ana_hesap_esleme` tablosuna bütün olarak yazılır (belirsiz
    hesaplar gelmez). Reklam tablosunda müşteri adı önce ana kayıttan, sonra CRM elle eşleşmesinden, sonra görünümdeki markadan okunur.
  - **Tek kayıt (2. adım, `worker/tek-kayit.js`; IDOS `docs/tasarim/musteri-tek-kayit.md`):** panelde açılan her yeni kart
    anında IDOS'ta "aday" olur (`POST /api/ortak/v2/musteriler`, HMAC imzalı; yazanın e-postası `YONETICILER`'de olmalı) ve
    `ana_kayit_id` ile bağlanır. Eski onay kuyruğuna istek gitmez; "Müşteri yap" da aynı yolu kullanır. Sır yoksa ya da IDOS
    reddederse (403 anahtar kapalı, 401, 429, 5xx, ağ) kart yerelde açılır, kartta "IDOS'a gönderilemedi — bekliyor" ve
    "Yeniden dene" görünür (kendiliğinden yeniden gönderilmez). Her kartın `Idempotency-Key`'i sabittir; çift aday açılmaz.
    Aday → aktif ("Müşteriye çevir") yalnız süper yöneticide (`info@idexya.com`, IDOS `SÜPER_ADMİNLER` ile aynı) görünür.
    TC kimlik, kart ve IBAN numarası gönderilmez. Gizli: `ORTAK_YAZMA_JETON_PANEL` (IDOS'taki aynı adlı değişkenle aynı değer).
  - **Taşıma (`/crm-migrate`):** IDOS karşılığı olmayan kartların önizlemesi (kesin / olası / zayıf eş, eşsiz, hatalı;
    kaybedildi kartlar aday + "kaybedildi" fırsatı; paket ve değer fırsat notu, tutar "—"). Gönderimi yalnız süper yönetici
    onaylar; 10'arlı parçalar, yarıda kalırsa kaldığı yerden, tamamlanan satır yeniden gönderilmez. Test: `node tools/test-tek-kayit.mjs`.
  - Test: `node tools/sahte/idos-ortak.mjs 8799 <deneme-jetonu>` + `wrangler dev --var IDOS_ORTAK_URL:http://127.0.0.1:8799 --var IDOS_ORTAK_JETON:<deneme-jetonu>`,
    sonra `node tools/test-ana-kayit.mjs <panel adresi> http://127.0.0.1:8799 <ekran klasörü> <persist klasörü>`
- Asistan testi: `node tools/sahte/anthropic.mjs 8999` (sahte API) + `wrangler dev --var ANTHROPIC_API_KEY:sahte --var ASISTAN_API_URL:http://127.0.0.1:8999/`,
  sonra `node tools/test-asistan.mjs <anahtarsız-adres> <sahte-anahtarlı-adres>`
- Yerel deneme: `.dev.vars` içinde `YEREL_GIRIS=evet` (yalnız localhost'ta geçerli, repoya girmez), `npm run build && npx wrangler dev`,
  sonra boş veritabanıyla `node tools/test-yonetim.mjs http://127.0.0.1:8787 <ekran-klasörü>` (uçtan uca: form → talep → CRM → kart).

## Referans sayfası (`/referans`)

- Kategorili referans listesi: https://idexya.com/referans (`worker/referans.js`, kabuk `src/pages/kabuk/referanslar.astro`,
  veri `src/data/referanslar.json`, panelde Site içeriği › Referanslar; orada sabit bağlantı ve "Bağlantıyı kopyala").
- Sitede hiçbir bağlantısı yok (menü, alt bilgi, site haritası, site içi arama); `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`.
  Adresi bilen ya da tahmin eden açabilir (kabul edilmiş durum). Liste boşken 404. `/r/*` ve `/referanslar` sıradan 404, yönlendirme yok.
- Teklif çıktısında QR kod (sunucuda SVG, `qrcode-generator` MIT, hata düzeltme M, 4 modül sessiz alan): `/referans?t=<teklif anahtarı>`.
  Anahtar `teklifler.referans_anahtari` (teklif ilk okunduğunda üretilir). Liste boşken QR basılmaz. Geçerli `t` ile açılışta müşteri kartına
  günde en çok bir "Müşteri referansları açtı" kaydı düşer (`referans_acilis`: yalnız teklif, gün, zaman; 12 ay saklanır). Bağlantı önizleyicileri sayılmaz.
  `t` sorgu dizgesinde kalır; talep, asistan, bülten ve ölçüm yalnız `location.pathname` kaydeder.
- Test: `node tools/test-referans.mjs` (sunucu gerekmez; `npm run build` sonrası derlenmiş site haritası ve sayfalar da denetlenir).
