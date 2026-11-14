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

## Yönetim paneli (`/yonetim`)

- Sunucu kodu `worker/index.js`; veritabanı Cloudflare D1 (`DB`), şema `worker/sema.js` ilk istekte kendiliğinden kurulur.
- Herkese açık tek uç: `POST /api/talep` (site formları). Korumalar: KVKK onayı zorunlu, tuzak alan, IP başına 10 dakikada 5 talep, Turnstile (anahtar tanımlıysa).
- `/yonetim/*` ve `/api/yonetim/*` yalnız Cloudflare Access girişiyle açılır; sunucu Access jetonunu ayrıca doğrular.
  Değişkenler tanımlanmadan panel **kapalıdır** (401):
  - `TEAM_DOMAIN` — ör. `https://<ekip>.cloudflareaccess.com`
  - `POLICY_AUD` — Access uygulamasının "Application Audience (AUD) Tag" değeri
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

## Gizli referans sayfası (`/r/<kod>`)

- Menüde, site haritasında ve site içi aramada yer almayan, yalnız bağlantıyla açılan kategorili referans listesi (`worker/referans.js`,
  kabuk `src/pages/kabuk/referanslar.astro`, veri `src/data/referanslar.json`, panelde Site içeriği › Referanslar).
- Kod D1 `ayarlar` tablosunda (`referans_kodu`); panelde "Kod üret / Yeni kod üret" ile değişir, eski bağlantılar o an geçersiz olur.
  Kod yoksa ya da yanlışsa sitenin sıradan 404 sayfası döner. Yanıt başlıkları: `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`.
- Teklif çıktısında QR kod (sunucuda SVG, `qrcode-generator` MIT, hata düzeltme M, 4 modül sessiz alan): `/r/<kod>?t=<teklif anahtarı>`.
  Anahtar `teklifler.referans_anahtari` (teklif ilk okunduğunda üretilir). Geçerli `t` ile açılışta müşteri kartına günde en çok bir
  "Müşteri referansları açtı" kaydı düşer (`referans_acilis`: yalnız teklif, gün, zaman). Bağlantı önizleyicileri sayılmaz.
- Kod hiçbir kayda yazılmaz: talep, asistan, bülten ve ziyaret sayacına gelen `/r/<kod>` yolu `worker/ortak.js` `sayfaMaskele` ile `/r/…` olur.
  `referans_acilis` satırları 12 ay sonra silinir (`worker/saklama.js`).
- Test: `node tools/test-referans.mjs` (sunucu gerekmez).
