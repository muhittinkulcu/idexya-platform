# CRM 1. parça (satış çekirdeği) uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Website Yönetim CRM'ine fırsatlar, kişiler, sonraki adım, zengin zaman çizelgesi, kayıp nedeni ve Bugün sayfasını eklemek; tüm paneli ince ve ferah tipografiye geçirmek.

**Architecture:** Cloudflare Worker (`worker/*.js`) + D1 şeması (`worker/sema.js` `SEMA`/`EK_SUTUNLAR`) + Astro yönetim sayfaları (`src/pages/yonetim/*.astro`, ortak `src/scripts/yonetim/ortak.js`). Yeni iş mantığı `worker/firsat.js` içinde; yönlendirme `worker/index.js:296` zincirine eklenir. Sonraki adım = `gorevler` satırı.

**Tech Stack:** Astro, Cloudflare Workers, D1 (SQLite), node:sqlite ile sunucusuz testler (`tools/test-*.mjs` kalıbı), esbuild.

**Spec:** `docs/superpowers/specs/2026-11-12-crm-satis-cekirdegi-design.md` (+ çizim `…-cizim.html`).

## Global Constraints

- Panel müşteriye hiçbir e-posta/SMS/WhatsApp/bildirim göndermez; yeni kodda gönderim çağrısı yok.
- Tutarlar kuruş, tam sayı; `aylik_kurus` ve `tek_seferlik_kurus` hiçbir uçta ve ekranda toplanmaz. Fırsat tutarları KDV hariç.
- Bilinmeyen değer "—", asla 0. Kazanma oranı paydası 0 ise "—".
- Aşamalar: `yeni | gorusme | teklif | goruldu | kazanildi | kaybedildi`. Kayıp nedenleri: `fiyat | zamanlama | rakip | yanit_yok | ihtiyac_yok | diger`.
- Kişi rolleri: `karar_verici | pazarlama | muhasebe | teknik | diger`. TCKN, doğum tarihi, kişisel adres alanı yok.
- Sorumlu yalnız `env.YONETICILER` listesindeki e-posta.
- Adres yolları İngilizce (`/today`, `/contacts`), ekran metni Türkçe TDK: tarih 12.11.2026, saat 14.00, "40.000 TL / ay", etikette yalnız ilk harf büyük.
- Renk tek başına anlam taşımaz: gecikti/bugün çizgisinin yanında metin etiketi.
- Tipografi: Inter 300 gövde, 400 düğme/etiket, 500 başlık; satır aralığı 1,65; yazı tipi dosyası depoda (OFL), dış yazı tipi isteği yok.
- Her PR Muhittin'in "birleştir" onayıyla; birleştirme sonrası Workers Builds sonucu kontrol edilir.

## Review Focus

- Fırsatı olmayan, `asama` değeri eski/boş müşteri taşımada → varsayılan `yeni` fırsatı, çökme yok (Task 2 testi).
- Birden çok yönetici aynı anda aşama değiştirir → `musteriler.asama` son duruma göre yeniden türetilir, eski değerde kalmaz (Task 3 testi).
- Sonraki adım tarihi Türkiye saatine göre "bugün"; UTC gece yarısı kayması yok (`bugunIst()` kullanılır, Task 4 testi).
- Arşivlenmiş müşterinin fırsatları Bugün ve panoda görünmez (Task 4 testi).
- Kişi silinince zaman çizelgesindeki eski kayıtlar bozulmaz (`kisi_id` boşa düşer, metin kalır; Task 3 testi).

---

### Task 1: İnce ve ferah tipografi (PR 1)

**Files:**
- Create: `public/fonts/inter-latin-{300,400,500}-normal.woff2`, `public/fonts/inter-latin-ext-{300,400,500}-normal.woff2`, `public/fonts/OFL-inter.txt` (kaynak: @fontsource/inter, OFL)
- Modify: `src/layouts/Yonetim.astro` (stil bloğu: `.kabuk`, başlıklar, `.dugme`, `.cip`, menü `.mo/.alt`, `.kart`, `.rozet`, satır aralıkları)
- Test: `tools/test-tema.mjs` (yeni kontroller)

- [ ] **Step 1:** `tools/test-tema.mjs`'e kontroller ekle: derlenmiş `Yonetim.astro` stilinde `@font-face` içinde `Inter` ve yerel `/fonts/inter-` yolu var; `fonts.googleapis.com` yok; `.kabuk` `font-weight:300` ve `line-height:1.65`; `.dugme` ve menü öğelerinde `font-weight` ≤ 500 (logo `.logo b` hariç).
- [ ] **Step 2:** `node tools/test-tema.mjs` → yeni kontroller KALDI.
- [ ] **Step 3:** Yazı tiplerini ekle, `Yonetim.astro` stilini çizimdeki `body.ferah` değerlerine göre güncelle (kart iç boşluğu 20–22 px, satır ayırıcı `#F2EAE1` ton, ikincil metin `#8A8178`). Koyu tema değişkenleri korunur.
- [ ] **Step 4:** `node tools/test-tema.mjs` ve `node tools/test-yonetim.mjs` → tümü GEÇTİ; `npm run build` başarılı.
- [ ] **Step 5:** `wrangler dev --local` ile `/dashboard`, `/crm`, `/customer`, `/templates` ekran görüntüsü (açık + koyu tema) scratchpad'e; taşma/kırpılma yok.
- [ ] **Step 6:** Commit, push, PR "Website Yönetim: ince ve ferah görünüm".

### Task 2: Şema ve taşıma

**Files:**
- Modify: `worker/sema.js` (`SEMA`: `firsatlar`, `kisiler` + dizinler; `EK_SUTUNLAR`: `gorevler.firsat_id`, `gorevler.tur`, `kayitlar.firsat_id`, `kayitlar.kisi_id`, `kayitlar.sonuc`, `kayitlar.sure_dk`)
- Create: `worker/firsat.js` (bu görevde yalnız `crmTasi`)
- Test: `tools/test-crm-firsat.mjs` (test-sablon.mjs'teki `sahteD1` ve esbuild kalıbı)

**Interfaces:**
- Produces: `export async function crmTasi(db, yoneticiler: string[]): Promise<{firsat: number, kisi: number}>`; bayrak anahtarı `ayarlar` tablosunda `crm_tasima_v1`.

- [ ] **Step 1:** Testler: (a) 3 müşteri (asama `kazanildi`, `teklif`, NULL) + biri `ad/eposta` dolu → `crmTasi` sonrası 3 fırsat, aşamalar `kazanildi/teklif/yeni`, `aylik_kurus` hepsi NULL, 1 birincil kişi; `deger` dolu olan için `kayitlar`'da "Eski tahmini değer" sistem kaydı. (b) İkinci çağrı `{firsat:0, kisi:0}` ve satır sayıları değişmez. (c) `sorumlu` boş müşteride fırsat sorumlusu `yoneticiler[0]`.
- [ ] **Step 2:** Çalıştır → KALDI.
- [ ] **Step 3:** Şema ve `crmTasi` yaz (her adım `INSERT … WHERE NOT EXISTS`; bayrak en sonda).
- [ ] **Step 4:** `node tools/test-crm-firsat.mjs` GEÇTİ; `node tools/test-sablon.mjs`, `node tools/test-teklif-dosya.mjs` hâlâ GEÇTİ.
- [ ] **Step 5:** Commit.

### Task 3: Fırsat, kişi ve zaman çizelgesi uçları

**Files:**
- Modify: `worker/firsat.js`, `worker/index.js:19-26` (içe aktarma) ve `:296` (zincire `yonetimFirsatApi`), `worker/crm.js` (müşteri kartı yanıtına `firsatlar`, `kisiler`)
- Test: `tools/test-crm-firsat.mjs`

**Interfaces:**
- Consumes: `crmTasi` (ilk API çağrısında bir kez çalışır), `islemYaz`, `kimlik`, `hata`, `json` (`worker/ortak.js`).
- Produces: `export async function yonetimFirsatApi(db, env, yontem, yol, govde, kim)`; `export async function asamaTuret(db, musteriId): Promise<string|null>`; uçlar spec §4 tablosundaki gibi (`firsatlar`, `firsatlar/:id`, `musteriler/:id/kisiler`, `kisiler/:id`, `musteriler/:id/kayitlar`, `ekip`).

- [ ] **Step 1:** Testler: fırsat oluştur (hizmetlerden `aylik_kurus=4000000`, `tek_seferlik_kurus=null`); PATCH `asama:'kaybedildi'` nedensiz → 422, nedenle → 200 + `kayitlar`'da `asama` kaydı; `asamaTuret`: {kazanildi, kaybedildi} → `kazanildi`, {kaybedildi, kaybedildi} → `kaybedildi`, {gorusme, teklif} → `teklif`; sorumlu listede yok → 422; kişi birincil ikinci kez → öncekinin `birincil=0`; kişi silinince ona bağlı `kayitlar` satırı kalır, `kisi_id` NULL; `musteriler/:id/kayitlar` `tur:'arama', sonuc:'ulasildi', sure_dk:8` kaydedilir; oturumsuz → 401; Origin'siz POST → 403; "Müşteri yap" (`ana-kayit.js`) kazanılan fırsatı olan müşteride 409 vermez; yanıtlarda `aylik_kurus + tek_seferlik_kurus` toplamı alanı yok.
- [ ] **Step 2:** KALDI.
- [ ] **Step 3:** Uçları yaz; her yazmada `islemYaz` ve gerektiğinde `asamaTuret`.
- [ ] **Step 4:** Tüm `tools/test-*.mjs` GEÇTİ.
- [ ] **Step 5:** Commit.

### Task 4: Bugün ve sonraki adım uçları

**Files:**
- Modify: `worker/firsat.js`, `worker/gorev.js` (`firsat_id`, `tur` alanlarını kabul et; `gorevler/:id/yapildi`)
- Test: `tools/test-crm-firsat.mjs`

**Interfaces:**
- Consumes: `bugunIst()` (`worker/gorev.js:18`).
- Produces: `GET bugun?kim=` → `{gecikmis:[], bugun:[], hafta:[], adimsiz:[], talepler:[], ay:{kazanilan:{n, aylik_kurus, tek_seferlik_kurus}, kaybedilen:{n, en_sik_neden}, acik:{n, aylik_kurus, tek_seferlik_kurus}, kazanma_orani: number|null}}`; `POST gorevler/:id/yapildi {sonuc?, not?, sonraki?:{tur, tarih, saat?, atanan}}`.

- [ ] **Step 1:** Testler: `bugunIst()` sabitlenmiş saatte (UTC 22.30 = TR 01.30 ertesi gün) "bugün" doğru; gecikmiş listesi en eski önce; `kim=ben` yalnız kendi atananları; arşivli müşterinin fırsat/görevleri listelerde yok; açık fırsat ve adımı yok → `adimsiz`; `yapildi` görevi `tamam` yapar, `kayitlar`'a yazar, `sonraki` verilirse yeni görev açar; ay özetinde kazanılan 0 + kaybedilen 0 → `kazanma_orani: null`.
- [ ] **Step 2:** KALDI. **Step 3:** Yaz. **Step 4:** Tüm testler GEÇTİ, `npm run build`.
- [ ] **Step 5:** Commit, push, PR "CRM: fırsatlar, kişiler, sonraki adım (arka uç)"; bağımsız güvenlik incelemesi (guvenlik-denetci) iste.

### Task 5: Ekranlar (PR 3)

**Files:**
- Create: `src/pages/yonetim/today.astro`, `src/pages/yonetim/contacts.astro`, `src/scripts/yonetim/firsat-ui.js` (fırsat kartı, "Yapıldı" penceresi, kayıp nedeni penceresi, tutar biçimi)
- Modify: `src/pages/yonetim/crm.astro` (kartlar fırsat; 4 özet; süzgeçler), `src/pages/yonetim/customer.astro` (başlık, sonraki adım şeridi, sekmeler: Genel bakış · Fırsatlar · Kişiler · Teklifler · Belgeler), `src/layouts/Yonetim.astro:46-49` (menü: Bugün, Kişiler), `worker/panel-yollar.js`, `wrangler.jsonc` (`/today*`, `/contacts*`), `src/data/panel-parametre.js`
- Test: `tools/test-yonetim.mjs` (rota ve menü), yeni `tools/test-crm-ekran.mjs` (yerel wrangler + Chromium, test-teklif-dosya kalıbı)

**Interfaces:**
- Consumes: Task 3–4 uçları; `el()`, `api()`, `para()` (`ortak.js`).
- Produces: `export function tutarMetni(f): string` → "40.000 TL / ay", "60.000 TL tek seferlik", ikisi varsa iki satır, hiçbiri "—".

- [ ] **Step 1:** Testler: `tutarMetni` dört durumu; `/today` ve `/contacts` oturumsuz 401/yönlendirme; menüde "Bugün" ve "Kişiler"; tarayıcı akışı: talep → CRM'e al → fırsat → sonraki adım → Bugün'de görünür → Yapıldı + yeni adım → panoda "Kaybedildi"ye sürükle → neden penceresi zorunlu → müşteri kartında zaman çizelgesi 4 kayıt; IDOS reklam özeti kutusu ana kayıt bağı yoksa "—" ve açıklama gösterir, bağ varsa `ana_musteri` önbelleğinden durum; konsol hatası yok; 2. parça sekmeleri DOM'da yok.
- [ ] **Step 2:** KALDI. **Step 3:** Ekranları çizime göre yaz. **Step 4:** Tüm testler GEÇTİ, build; açık/koyu ekran görüntüleri (sahte veri) scratchpad'e.
- [ ] **Step 5:** Commit, push, PR "CRM: Bugün, Satış panosu, Müşteri kartı, Kişiler"; PR'da Muhittin'den gereken: ekip e-postalarını `YONETICILER` ve Cloudflare Access listesine ekleme.
