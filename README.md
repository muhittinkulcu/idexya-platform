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
  - Test: `node tools/sahte/idos-ortak.mjs 8799 <deneme-jetonu>` + `wrangler dev --var IDOS_ORTAK_URL:http://127.0.0.1:8799 --var IDOS_ORTAK_JETON:<deneme-jetonu>`,
    sonra `node tools/test-ana-kayit.mjs <panel adresi> http://127.0.0.1:8799 <ekran klasörü> <persist klasörü>`
- Asistan testi: `node tools/sahte/anthropic.mjs 8999` (sahte API) + `wrangler dev --var ANTHROPIC_API_KEY:sahte --var ASISTAN_API_URL:http://127.0.0.1:8999/`,
  sonra `node tools/test-asistan.mjs <anahtarsız-adres> <sahte-anahtarlı-adres>`
- Yerel deneme: `.dev.vars` içinde `YEREL_GIRIS=evet` (yalnız localhost'ta geçerli, repoya girmez), `npm run build && npx wrangler dev`,
  sonra boş veritabanıyla `node tools/test-yonetim.mjs http://127.0.0.1:8787 <ekran-klasörü>` (uçtan uca: form → talep → CRM → kart).
