# Müşteri ana kaydı — tasarım belgesi (onaylandı, 30 Eki 2026)

Karar (Muhittin, 30 Eki 2026): tüm müşteri bilgisi **tek ana kayıtta** tutulur. Panel (panel.idexya.com), Creative ve
Marketing (IDOS) müşteri bilgisini oradan okur. Bu belge yalnız tasarımdır; kod yoktur. Onaydan sonra iş ürünlere bölünür.

Dayanak (30 Eki 2026'da okunan kaynaklar):
- Panel: `worker/sema.js` (`musteriler`, `kayitlar`, `reklam_eslesme`, `hesap_envanteri`, `uye_musteri`, `site_saglik_hedef`), canlı D1 sayımı.
- IDOS: `idexya-agency-os` deposunda `app/models/client.py`, `app/services/client_resolver.py`, `docs/idp/*`.
- Creative (Neon): şemasını görmedim. Creative'e ait her satır **doğrulanacak** diye işaretlidir.

---

## 0. Ana kayıt nerede durmalı? Öneri: IDOS (Marketing)

| Ölçüt | IDOS | Panel (D1) | Creative (Neon) |
|---|---|---|---|
| Müşteri modeli bugün ne kadar dolu | **Zengin.** `idexya_ops.clients`: marka, unvan, reklam hesapları (ana, ek, arşiv), GA4, Search Console, GTM, Merchant, sosyal hesaplar, yaşam döngüsü, sorumlu, hedefler | Basit CRM: firma, ad, e-posta, telefon, sektör, aşama, sorumlu. Canlıda **0 müşteri** | Doğrulanacak |
| Hesap eşlemeleri ve raporlar | **Burada** (`client_resolver`, reklam ve GA4 senkronları) | Yok, IDOS'tan okur | Yok |
| Kişisel veri kuralları | Var. T.C. kimlik / şahıs vergi no saklanmaz, vergi bilgisi Bizim Hesap'ta | Var. Talepler KVKK onaylı | Doğrulanacak |
| Erişim | Google kimliği + rol | Cloudflare Access | Doğrulanacak |

**Sonuç:** Ana kayıt IDOS'ta durmalı. Panel'in yan menüsündeki eski kartta da "Müşteri asıl kaydı IDOS'ta olacak" yazıyordu.
Panel'in CRM'i satış hunisi (aday, fırsat, teklif) olarak kalır. Satış kazanılınca müşteri ana kayda geçer (§2).

Dikkat edilecek tek nokta: IDOS'un verisi BigQuery'de. BigQuery her okumada sorgu maliyeti ve gecikme getirir. Bu yüzden
ürünler BigQuery'yi doğrudan sorgulamaz; IDOS'un **küçük bir salt okuma API'si** üzerinden okur, ürün tarafında önbellek tutulur (§3).

---

## 1. Veri modeli

Kalıcı kimlik: **`musteri_id`**. IDOS'taki `client_id` aynen kullanılır, yeni kimlik üretilmez. Kimlik hiç değişmez, yeniden
kullanılmaz. Silme yoktur; müşteri `arsiv` durumuna alınır.

| Alan | IDOS'taki karşılığı (bugün) | Not |
|---|---|---|
| `musteri_id` | `client_id` | Kalıcı, değişmez |
| `marka` | `brand_name` | Zorunlu. Ekranlarda görünen ad. Paylaşımlarda (v2 görünüm, ortak API) yalnız marka adı gider; şahıs müşteride marka yoksa NULL (karar, 30 Eki) |
| `unvan` | `legal_name` | Ticari unvan. Şahıs müşteride boş kalabilir |
| `sektor` | `business_model` (yakın) | **Eksik.** Sabit listeden `sektor` alanı eklenmeli |
| `durum` | `lifecycle_status`: aday, aktif, duraklatildi, ayrildi, arsiv | İstenen aktif/pasif/ayrıldı karşılığı: pasif = duraklatildi. `aday` ana kayıtta kullanılmaz (aday Panel'de kalır, §2) |
| `sorumlu` | `assigned_to` | Ekip üyesinin e-postası |
| Meta reklam hesapları | `meta_ad_account_id` + `_ek` + `_arsiv` | Ana, ek ve arşiv ayrımı korunur. Bir hesap tek müşteride olabilir (§4 kuralı) |
| Google Ads hesapları | `google_ads_customer_id` + `_ek` + `_arsiv` | Aynı |
| Meta işletme | `meta_business_id` | |
| GA4 | `ga4_property_id` | |
| Search Console | `search_console_property` | |
| GTM | `gtm_container_id`, `gtm_server_container_id`, `sgtm_url` | |
| Merchant Center | `merchant_id` | |
| Sosyal hesaplar | `instagram_url`, `facebook_url`, `tiktok_url`, `linkedin_url`, `youtube_url`, `gbp_url` | |
| Web sitesi | `website` | Panel'deki "Müşteri siteleri" sağlık kontrolü bunu kullanır |
| Ana sonuç türü | `primary_conversion` (+ `primary_goal`) | Sabit liste: satış, form, arama, mesaj, uygulama… |
| Para birimi | **Yok** | **Eksik.** `para_birimi` (ISO 4217, varsayılan TRY) eklenmeli. Reklam hesabının kendi para birimi ayrıca hesapta durur |
| İletişim kişileri | `report_email`, `billing_email`, `phone` (dağınık) | **Yeni alt tablo** `musteri_kisi` önerilir (aşağıda) |
| Notlar | `next_step` + IDOS not uçları (`client_notes`) | Ana kayıtta kalır. Diğer ürünler yalnız son notun özetini görmez (§5) |
| Ajans ilişkisi | `engagement_start_date`, `contract_end_date`, `monthly_fee`, `payment_day` | Yalnız yönetici rolü görür (§5) |

**İletişim kişileri (`musteri_kisi`), KVKK gereği en az veri:**
`kisi_id, musteri_id, ad, rol (karar verici / pazarlama / muhasebe / teknik), eposta, telefon, tercih_kanal, iletisim_izni (evet/hayır + tarih), aktif`.
- T.C. kimlik, doğum tarihi, adres gibi alanlar **tutulmaz**.
- Ayrılan kişi silinmez ama `aktif = hayır` olur. Müşteri ayrıldıktan sonra 2 yıl (ayarlanabilir) dolunca kişi kaydı anonimleştirilir (karar 4).
- Kişi verisi yalnız ana kayıtta durur. Diğer ürünlere **gönderilmez** (§3, §5).

---

## 2. Yazma ve okuma kuralı

1. **Yazma yalnız ana kayıtta (IDOS) yapılır.** Panel ve Creative müşteri alanlarını salt okur. Bu ürünlerde müşteri alanı düzenleme
   ekranı olmaz; yerine "Ana kayıtta düzenle" bağlantısı olur (§6).
2. **Panel CRM'deki aday ve fırsatlar Panel'de kalır.** Talepler, aşamalar (yeni → görüşme → teklif → kazanıldı/kaybedildi), teklifler
   ve görüşme kayıtları satış verisidir; ana kayda taşınmaz.
3. **"Müşteri yap":** Fırsat "Kazanıldı" olunca Panel'de **Müşteri yap** düğmesi çıkar:
   - Panel, IDOS'un yazma ucuna yalnız şu alanlarla bir **müşteri adayı** gönderir: marka, unvan, sektör, sorumlu, web sitesi, iletişim kişisi (KVKK onayı olan).
   - IDOS bunu **onay kuyruğuna** alır. Kayıt, IDOS'ta bir yönetici onaylayınca oluşur. Bu yazma Panel'den doğrudan yapılmaz; aynı firma iki kez açılmaz (IDOS kopya denetimi).
   - Onaylanınca dönen `musteri_id`, Panel CRM kaydına `ana_kayit_id` olarak yazılır. O andan sonra Panel bu müşterinin bilgisini ana kayıttan okur.
   - Reddedilirse Panel'de "Ana kayda alınmadı: <gerekçe>" görünür.
4. **Creative'deki markalar `musteri_id`'ye bağlanır.** Creative'de marka kaydı kalabilir; marka adı, logo ve renk ana kayıttan okunur. Creative'e özgü alanlar Creative'de kalır (doğrulanacak).
5. **Bağlantılar tek yönlüdür.** Ürünler kendi kayıtlarında yalnız `musteri_id` tutar, müşteri alanlarının kopyasını kalıcı olarak saklamaz. Önbellek kopya sayılmaz (§3).

---

## 3. Okuma yolu

**IDOS'ta salt okuma API'si (yeni, küçük):**
- `GET /api/ortak/musteriler?degisen_sonra=<zaman>`: liste. Yalnız ortak alanlar döner; iletişim kişileri ve ajans ücreti dönmez.
- `GET /api/ortak/musteriler/<musteri_id>`: tek müşteri, aynı alanlar.
- `GET /api/ortak/hesap-esleme`: `platform, hesap_kimligi, musteri_id` listesi. Belirsiz hesap (birden çok müşteri) **dönmez**.
- `POST /api/ortak/musteri-adayi`: yalnız Panel'in "Müşteri yap" isteği. Onay kuyruğuna düşer, kayıt açmaz.

**Kimlik doğrulama:** ürün başına ayrı servis jetonu. Sır adları:
- IDOS tarafında: `ORTAK_JETON_PANEL`, `ORTAK_JETON_CREATIVE` (her jeton yalnız kendi ürününün izinlerini taşır; Panel'in jetonu `musteri-adayi` yazabilir, Creative'inki yazamaz).
- Panel tarafında: `IDOS_ORTAK_JETON` (Cloudflare Secret), `IDOS_ORTAK_URL` (değişken).
- Creative tarafında: `IDOS_ORTAK_JETON`, `IDOS_ORTAK_URL` (doğrulanacak: Creative'in sır yönetimi).
- Jetonlar sohbete ya da koda yazılmaz. Döndürme: 90 günde bir ya da sızıntı şüphesinde hemen.

**Önbellek ve eşitleme:**
- API, BigQuery'yi her istekte sorgulamaz. IDOS kendi tarafında müşteri tablosunun küçük bir kopyasını (ör. 5 dakikalık bellek önbelleği) tutar.
- Panel: D1'de `ana_musteri` önbellek tablosu. Her saat `degisen_sonra` ile yalnız değişenler çekilir; ayrıca günlük tam eşitleme yapılır.
- Panel'de müşteri kartı açılınca tek müşteri isteği atılır, sonuç 10 dakika önbellekte kalır.
- IDOS'a ulaşılamazsa son önbellek gösterilir ve "Son eşitleme: <zaman>" uyarısı çıkar. Yazma işleri kuyrukta bekler.
- Reklam hesabı eşlemesi bugünkü `idexya_share.reklam_ozet_gunluk` görünümünden değil, `hesap-esleme` ucundan gelir. Görünüm yalnız rakamları taşır.

---

## 4. Taşıma planı (Panel CRM + IDOS müşterileri + Creative markaları → ana kayıt)

Bugünkü durum: Panel CRM canlıda **0 müşteri**. IDOS'ta müşteriler var. Creative markaları doğrulanacak.

1. **Hazırlık (yazma yok):** IDOS'a `sektor`, `para_birimi` alanları ve `musteri_kisi` tablosu eklenir. Panel'e `ana_kayit_id` sütunu, Creative'e `musteri_id` sütunu eklenir (boş).
2. **Kuru deneme raporu (yazma yok):** Her üç kaynak için eşleşme önerisi çıkar. Eşleşme anahtarları sırasıyla:
   - (a) reklam hesabı kimliği,
   - (b) web sitesi alan adı,
   - (c) normalize edilmiş marka adı (küçük harf, Türkçe karakter, "ltd/şti/a.ş." atılmış). (c) tek başına **öneri** sayılır, otomatik bağlanmaz.

   Rapor sütunları: kaynak, kayıt, önerilen `musteri_id`, eşleşme türü, güven (kesin / öneri / yok).
3. **Elle onay:** "kesin" (a veya b) eşleşmeler toplu onaylanabilir. "öneri" ve "yok" tek tek onaya düşer. **Tahmin yapılmaz;** onaylanmayan kayıt bağlanmadan kalır.
4. **Uygulama:** Yalnız onaylanan bağlar yazılır (`ana_kayit_id`, Creative `musteri_id`). Ana kayıtta olmayan ama Panel/Creative'de olan müşteri, "Müşteri yap" akışıyla onay kuyruğuna gider.
5. **Geri dönüş:**
   - Her uygulama adımı bir `tasima_partisi` kimliğiyle günlüğe yazılır.
   - Geri alma, o partideki bağları boşaltır (`ana_kayit_id = NULL`). Ana kayıttaki müşteriler silinmez.
   - Uygulama öncesi her üç ürünün yedeği alınır: Panel'de R2 yedeği; IDOS'ta BigQuery tablo anlık görüntüsü; Creative'de Neon dalı (doğrulanacak).
6. **Doğrulama:** Taşıma sonrası her ürünün müşteri sayısı ve bağlı hesap sayısı rapordakiyle karşılaştırılır.

---

## 5. Müşteri ayrımı ve yetki

| Alan grubu | Yönetici (Muhittin) | Ekip (sorumlu) | Panel (salt okuma) | Creative (salt okuma) | Müşteri (Panel müşteri alanı) |
|---|---|---|---|---|---|
| Kimlik, marka, unvan, sektör, durum | Yazar | Okur (kendi müşterileri yazar) | Okur | Okur | Yalnız kendi markası |
| Sorumlu | Yazar | Okur | Okur | — | — |
| Reklam ve ölçüm hesapları (Meta, Google, GA4, SC, GTM, Merchant) | Yazar | Okur (karar 3) | Okur | — | — |
| Sosyal hesaplar, web sitesi | Yazar | Yazar | Okur | Okur | Yalnız kendi |
| Ana sonuç, para birimi, hedefler | Yazar | Yazar | Okur | — | — |
| İletişim kişileri | Yazar | Okur (kendi müşterileri) | **Yok** | **Yok** | Yalnız kendi kaydı |
| Notlar | Yazar | Yazar | **Yok** | **Yok** | — |
| Ajans ücreti, sözleşme, ödeme günü | Yazar | **Yok** | **Yok** | **Yok** | — |

Kurallar:
- **Müşteri ayrımı:** Ekip üyesi yalnız sorumlu olduğu müşterileri yazar. Bir müşterinin verisi başka müşterinin ekranında görünmez (IDOS'taki `client_scope` denetimi ortak API'de de uygulanır).
- Ortak API alan listesi **beyaz listedir**. Yeni alan otomatik paylaşılmaz.
- Her yazma ana kayıtta işlem günlüğüne düşer: kim, ne zaman, eski ve yeni değer.

---

## 6. Ekran çizimi

**Ana kayıt (IDOS) › Müşteriler: liste**
```
┌ Müşteriler ───────────────────────────── [+ Yeni müşteri] [Onay kuyruğu (2)] ┐
│ Ara: [marka, unvan, hesap no…]   Durum: [Aktif ▾]  Sorumlu: [Hepsi ▾]          │
├────────────┬───────────┬────────┬──────────┬──────────────┬──────────────────┤
│ Marka      │ Sektör    │ Durum  │ Sorumlu  │ Hesaplar     │ Son değişiklik   │
│ Örnek Marka│ E-ticaret │ Aktif  │ ayse@    │ Meta 2 · G 1 │ 28 Eki, Muhittin │
│ …          │           │        │          │ GA4 ✓ GTM ✓  │                  │
└────────────┴───────────┴────────┴──────────┴──────────────┴──────────────────┘
```

**Ana kayıt › Müşteri kartı** (sekmeler):
- Genel: marka, unvan, sektör, durum, sorumlu, para birimi, ana sonuç.
- Hesaplar: Meta, Google Ads (ana / ek / arşiv), GA4, Search Console, GTM, Merchant. Her biri senkron durumu ile.
- Sosyal: Instagram, Facebook, TikTok, LinkedIn, YouTube, Google İşletme.
- Kişiler: iletişim kişileri, izin durumu.
- Notlar.
- Geçmiş: işlem günlüğü.

**Diğer ürünlerde müşteri (salt okuma):**
```
┌ Örnek Marka ·  Aktif · Sorumlu: ayse@ ──────────── [Ana kayıtta düzenle ↗] ┐
│ Sektör: E-ticaret   Para birimi: TRY   Ana sonuç: Satış                       │
│ Hesaplar: Meta 2 · Google Ads 1 · GA4 ✓ · GTM ✓                               │
│ Son eşitleme: 30 Eki 14.05                                                    │
└───────────────────────────────────────────────────────────────────────────────┘
```
- **Panel:**
  - Müşteri kartında üstte bu salt okuma bloğu, altında Panel'e özgü satış geçmişi, teklifler, görevler, hesap envanteri ve site sağlığı yer alır.
  - Müşteri alanlarında düzenleme düğmesi olmaz.
  - Henüz ana kayda bağlı olmayan CRM kaydında "Ana kayda bağlı değil · Müşteri yap" görünür.
- **Creative:** Marka seçicide yalnız `musteri_id`'li markalar görünür. Marka adı, logo ve renk ana kayıttan gelir; "Ana kayıtta düzenle" bağlantısı vardır (doğrulanacak).
- **Ana kayıtta düzenle** bağlantısı IDOS'taki müşteri kartını yeni sekmede açar. Yetkisi olmayan kullanıcıda bağlantı görünmez.

---

## 7. Maliyet, risk ve iş bölümü

**Maliyet**
- BigQuery: ortak API önbellekli olduğu için sorgu sayısı saatte birkaç taneyle sınırlı; maliyet ihmal edilebilir. Tam liste günde bir kez okunur.
- Cloudflare: D1'de küçük önbellek tablosu ve saatlik zamanlayıcı; ücretsiz/mevcut plan içinde.
- Yeni ücretli servis yok.

**Riskler**
| Risk | Etki | Önlem |
|---|---|---|
| IDOS kapalıyken ürünler müşteri göremez | Orta | Önbellekten okuma + "son eşitleme" uyarısı |
| Yanlış eşleşme başka müşterinin verisini gösterir | Yüksek | Tahmin yok; yalnız kesin anahtar otomatik; geri dönüşlü taşıma partisi |
| Kişisel verinin ürünlere sızması | Yüksek | Beyaz liste alanlar; kişi verisi API'de yok; denetim testi |
| Jeton sızıntısı | Orta | Ürün başına jeton, en az izin, 90 gün döndürme |
| Çift kayıt ("Müşteri yap" iki kez) | Düşük | IDOS onay kuyruğu + kopya denetimi |

**İş bölümü ve sıra**
| Sıra | Ürün | İş | Büyüklük |
|---|---|---|---|
| 0 | IDOS | **İlk adım:** `idexya_share.reklam_ozet_gunluk` v2: `account_name`, `client_id`, `brand_name` (Marketing'e iletildi). Karar: `brand_name` = marka adı; şahıs müşteride marka yoksa NULL. Panel'de kod değişikliği gerekmez | Küçük |
| 1 | IDOS | `sektor`, `para_birimi`, `musteri_kisi`; ortak salt okuma API'si (3 GET) + servis jetonları + `client_scope` | Orta |
| 2 | IDOS | `musteri-adayi` yazma ucu + onay kuyruğu ekranı | Orta |
| 3 | Panel | `ana_kayit_id`, `ana_musteri` önbelleği, saatlik eşitleme, müşteri kartında salt okuma bloğu | Orta |
| 4 | Panel | "Müşteri yap" akışı; Reklam ayrıntılarında hesap→müşteri bilgisini `hesap-esleme`'den okumak | Küçük–orta |
| 5 | Creative | Markalara `musteri_id`, marka bilgisini ana kayıttan okuma | Orta (doğrulanacak) |
| 6 | Hepsi | Kuru deneme raporu → elle onay → uygulama → doğrulama | Orta |

Planın 0. adımı (Marketing'e iletildi; karar: `brand_name` marka adıdır, şahıs müşteride marka yoksa NULL): `idexya_share.reklam_ozet_gunluk` görünümüne
`account_name`, `client_id`, `brand_name` eklenmesi. Bu, §3'teki `hesap-esleme` ucu gelene kadar Panel'in "Adsız hesap /
Atanmamış" sorununu çözer. Ortak API gelince görünüm yine yalnız rakam taşıyacak hâle döndürülebilir.

## Kararlar (Muhittin, 30 Eki 2026)
1. **Ana kayıt IDOS'ta.**
2. **Pasif = `duraklatildi`.**
3. **Hesap alanlarını (Meta, Google Ads, GA4, Search Console, GTM, Merchant) şimdilik yalnız yönetici (Muhittin) yazar; ekip okur.** §5'teki tabloda ekip satırı buna göre okunmalıdır: "Yazar (kendi müşterileri)" hesap alanları için geçerli değildir.
4. **İletişim kişisi saklama süresi:** müşteri ayrıldıktan sonra **2 yıl**, ardından anonimleştirme. Süre ayarlanabilir olmalı (`MUSTERI_KISI_SAKLAMA_GUN`, varsayılan 730). Hukuki teyit Muhittin'de.
5. **"Müşteri yap" onayı her zaman Muhittin'den geçer.** Onay kuyruğunu yalnız yönetici rolü onaylar ya da reddeder.
