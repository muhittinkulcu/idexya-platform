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
  - Gizli: `TURNSTILE_SECRET`; derleme değişkeni: `PUBLIC_TURNSTILE_SITE_KEY`
- Yerel deneme: `.dev.vars` içinde `YEREL_GIRIS=evet` (yalnız localhost'ta geçerli, repoya girmez), `npm run build && npx wrangler dev`,
  sonra boş veritabanıyla `node tools/test-yonetim.mjs http://127.0.0.1:8787 <ekran-klasörü>` (uçtan uca: form → talep → CRM → kart).
