# CRM 1. parça: satış çekirdeği (tasarım)

Tarih: 12.11.2026 · Durum: Muhittin'in incelemesini bekliyor · Depo: idexya-platform (Website Yönetim)

## 1. Amaç ve kararlar

Website Yönetim'deki CRM'i, Idexya'nın hem yeni müşteri kazanma hem mevcut müşteri yönetimi için kullandığı tek
yere dönüştürmek. Bu belge yalnız **1. parçayı** (satış çekirdeği) kapsar.

Muhittin'in kararları (12.11.2026):

| Konu | Karar |
|---|---|
| Kapsam | Satış + mevcut müşteri yönetimi tek yerde; üç parçada yapılır |
| Kullanıcılar | Muhittin + 1-3 kişilik ekip; her kayıtta sorumlu kişi |
| Mimari | A: CRM verisi Website Yönetim (D1) içinde; IDOS'tan yalnız salt okunur reklam özeti |
| Görünüm | İnce ve ferah tipografi (onaylı çizim: `body.ferah`), tüm panelde |
| Genel yön | Sistemler ayrı kalır; tek müşteri kaydı, tek giriş, tek görünüm ayrı planla gelir |

Parçalar:
1. **Satış çekirdeği** (bu belge): fırsatlar, kişiler, sonraki adım, zaman çizelgesi, kayıp nedeni, Bugün sayfası.
2. Müşteri 360 + finans takibi: sözleşmeler, satış/tahsilat takibi (BizimHesap'tan içe aktarma, yalnız takip), görev ve destek sekmeleri.
3. Raporlar ve hatırlatmalar: huni, kazanma oranı, aylık tekrarlayan tutar, kârlılık, yanıtsız teklif ve yenileme uyarıları.

## 2. Kapsam dışı (1. parça)

- Panel müşteriye hiçbir e-posta, SMS, WhatsApp ya da bildirim göndermez. Yazışmalar elle not olarak girilir.
- E-posta kutusu ya da WhatsApp bağlantısı yok.
- Finans, sözleşme, raporlar (2. ve 3. parça).
- Müşteri portalı (müşterinin kendisi giremez).
- IDOS ya da Creative tarafında değişiklik yok.

## 3. Veri modeli (D1, `worker/sema.js` deseni, `CREATE TABLE IF NOT EXISTS`)

### 3.1 `firsatlar` (yeni)
Bir müşteride birden çok satış ayrı ilerler.

| Alan | Not |
|---|---|
| `id` TEXT PK | |
| `musteri_id` TEXT NOT NULL | `musteriler.id` |
| `ad` TEXT NOT NULL | ör. "Google + Meta reklam yönetimi" |
| `hizmetler` TEXT | JSON: `[{hizmet_id, ad, tur: aylik|tek_seferlik, fiyat_kurus|null}]` (hizmet kataloğundan) |
| `aylik_kurus` INTEGER NULL | hizmetlerden hesaplanır; bilinmiyorsa NULL ("—") |
| `tek_seferlik_kurus` INTEGER NULL | ayrı tutulur; aylıkla **toplanmaz** |
| `asama` TEXT NOT NULL | `yeni | gorusme | teklif | goruldu | kazanildi | kaybedildi` (mevcut ASAMALAR) |
| `sorumlu` TEXT NOT NULL | ekip e-postası (`YONETICILER` listesinden) |
| `kaynak` TEXT | mevcut KAYNAK değerleri + `idos_sohbet`, `tavsiye`, `elle` |
| `tahmini_kapanis` TEXT NULL | GG.AA.YYYY gösterilir, ISO saklanır |
| `kayip_nedeni` TEXT NULL | `fiyat | zamanlama | rakip | yanit_yok | ihtiyac_yok | diger` |
| `kayip_notu` TEXT NULL | |
| `kapanis` TEXT NULL | kazanıldı/kaybedildi zamanı |
| `olusturma`, `guncelleme`, `olusturan` | |

Dizinler: `(musteri_id)`, `(asama, guncelleme)`, `(sorumlu, asama)`.

### 3.2 `kisiler` (yeni)
| Alan | Not |
|---|---|
| `id`, `musteri_id` NOT NULL | |
| `ad` TEXT NOT NULL, `unvan` TEXT | |
| `rol` TEXT | `karar_verici | pazarlama | muhasebe | teknik | diger` |
| `eposta`, `telefon` TEXT | |
| `birincil` INTEGER 0/1 | müşteri başına en çok bir |
| `olusturma`, `guncelleme` | |

Veri asgarisi: TCKN, doğum tarihi, kişisel adres gibi alanlar **yok**.

### 3.3 Mevcut tablolara eklemeler
- `gorevler`: `firsat_id TEXT NULL`, `tur TEXT NULL` (`ara | eposta | toplanti | teklif | diger`).
  **Sonraki adım = müşteriye ya da fırsata bağlı açık görev.** Ayrı tablo yok; Görevler ve takvim sayfası bunları zaten gösterir.
- `kayitlar` (zaman çizelgesi): `firsat_id TEXT NULL`, `kisi_id TEXT NULL`, `sonuc TEXT NULL` (`ulasildi | ulasilamadi`),
  `sure_dk INTEGER NULL`. `tur` değerleri: `not | arama | toplanti | yazisma | asama | teklif | talep | sistem`.

### 3.4 `musteriler.asama` korunur, türetilir
`worker/ana-kayit.js` ("Müşteri yap" yalnız `kazanildi` iken) ve `dashboard.astro` bu alanı okur. Alan kalır; sunucu her
fırsat değişikliğinde yeniden hesaplar:
- en az bir fırsat `kazanildi` → `kazanildi`;
- değilse açık fırsatların en ileri aşaması;
- tüm fırsatlar `kaybedildi` → `kaybedildi`;
- fırsat yoksa mevcut değer değişmez.
Kart başlığında bu, "Aday / Müşteri / Kaybedildi" olarak görünür.

### 3.5 Taşıma (tek seferlik, tekrar çalıştırılabilir)
- Fırsatı olmayan her müşteri için bir fırsat: `ad` = `paket` ya da "Genel", `asama` = `musteriler.asama`,
  `sorumlu` = `musteriler.sorumlu` ya da ilk yönetici, `aylik_kurus` = NULL (eski `deger` alanının birimi belirsiz;
  kart günlüğüne "eski tahmini değer: …" notu düşülür, tutar uydurulmaz).
- `musteriler.ad/eposta/telefon` doluysa birincil kişi oluşturulur.
- Taşıma `ayarlar` tablosunda bayrakla işaretlenir; ikinci çalıştırma hiçbir şey yapmaz.

## 4. Uçlar (`/api/yonetim/*`, mevcut `yonetici()` kapısı, Origin denetimi, `islemYaz`)

| Yöntem | Yol | İş |
|---|---|---|
| GET | `bugun?kim=ben|hepsi|<eposta>` | gecikmiş/bugün/bu hafta sonraki adımlar, adımsız açık fırsatlar, yeni talepler, bu ay özeti |
| GET/POST | `firsatlar` | liste (süzgeç: sorumlu, aşama, hizmet, kaynak, arama) / oluştur |
| GET/PATCH | `firsatlar/:id` | oku / güncelle (aşama değişimi `kayitlar`a yazılır; `kaybedildi` için `kayip_nedeni` zorunlu) |
| GET/POST | `musteriler/:id/kisiler` | |
| PATCH/DELETE | `kisiler/:id` | silme gerçek silme değil: `kayitlar`a not + satır kaldırılır (kişi verisi asgarisi) |
| POST | `musteriler/:id/kayitlar` | not, arama, toplantı, yazışma kaydı |
| POST | `gorevler/:id/yapildi` | görevi kapatır, `kayitlar`a yazar, yanıtta "sonraki adım" önerisi döner |
| GET | `ekip` | `YONETICILER` e-postaları + görünen ad (`ayarlar.ekip_adlari`, yoksa e-posta başı) |

Tüm tutarlar kuruş, tam sayı. Aylık ve tek seferlik ayrı alanlarda döner; hiçbir uç ikisini toplamaz.

## 5. Ekranlar (adres yolları İngilizce, metin Türkçe)

Onaylı çizim: `docs/superpowers/specs/2026-11-12-crm-satis-cekirdegi-cizim.html` (ferah görünüm; tüm veriler sahte).

- **`/today` (Bugün)**, CRM'in açılış sayfası. Sol: sonraki adımlar (gecikti kırmızı + "N gün gecikti" etiketi, bugün
  sarı, bu hafta gri), "Yapıldı" / "Ertele". "Yapıldı" → küçük pencere: sonuç, not, **sonraki adım** (tür, tarih, sorumlu;
  "adım yok" seçilirse fırsat sağdaki listeye düşer). Sağ: adımsız açık fırsatlar, yeni talepler ("CRM'e al"), bu ay
  (kazanılan, kaybedilen + en sık neden, açık fırsat aylık ve tek seferlik ayrı). Üst süzgeç: Bana atananlar / Tüm ekip / kişi.
- **`/crm` (Satış panosu)**: kartlar fırsat. Kartta firma (bağlantı), fırsat adı, tutar ("40.000 TL / ay" ya da
  "60.000 TL tek"), sonraki adım satırı, kaynak, sorumlu baş harfleri. Sol kenar çizgisi: kırmızı gecikti, sarı bugün;
  çizgi yanında metin etiketi de var (renk tek başına anlam taşımaz). Sürükle-bırak; "Kaybedildi"ye bırakınca neden
  penceresi. Üstte 4 özet: açık fırsat aylık, açık fırsat tek seferlik, gecikmiş adım, bu ay kazanma oranı
  (kazanılan / (kazanılan + kaybedilen); payda 0 ise "—"). Liste görünümü korunur, sayfalanır.
- **`/customer?id=` (Müşteri kartı)**: üst başlık (ad, sektör, şehir, site, kaynak, durum, etiketler, sorumlu, açık
  fırsat), sonraki adım şeridi, sekmeler: Genel bakış · Fırsatlar · Kişiler · Teklifler · Belgeler. Genel bakış: zaman
  çizelgesi (süzgeç: tümü / notlar / aramalar ve toplantılar / teklifler / sistem) + yanda fırsatlar, kişiler,
  IDOS reklam özeti kutusu. 2. parça sekmeleri bu parçada **görünmez**.
- **`/contacts` (Kişiler)**: tüm kişiler; firma, rol, e-posta, telefon; arama; sayfalanır.
- Menü (Satış): Talepler · **Bugün** · Satış panosu · Müşteriler · **Kişiler** · Teklifler · Belge şablonları ·
  Görevler ve takvim · IDOS eşitleme · Çakışmalar.

IDOS reklam özeti kutusu 1. parçada yalnız ana kayıt bağı varsa mevcut `ana_musteri` önbelleğinden durum gösterir;
harcama ve sonuç türleri 2. parçada IDOS ortak API'sinden gelir. Veri yoksa "—" ve açıklama.

## 6. Görünüm

0. adım olarak ayrı, küçük bir PR: `body.ferah` tipografisi (Inter 300/400/500, satır 1,65, kart iç boşluğu 20-22 px,
düğme ve etiketlerde kalın yazı yok) `src/layouts/Yonetim.astro` ortak stiline taşınır ve tüm Website Yönetim
sayfalarına uygulanır. Yazı tipi dosyası depoya konur (OFL), dış yazı tipi sunucusuna istek yok. IDOS'a yayılım ayrı PR.

## 7. Hata durumları

- Sorumlu e-postası `YONETICILER` dışında → 422.
- `kaybedildi`ye geçişte neden yok → 422, pencere açık kalır.
- Aynı müşteride birincil kişi ikinci kez → öncekinin birincil işareti kalkar.
- Taşıma yarıda kalırsa bayrak yazılmaz, sonraki istek kaldığı yerden devam eder (her adım "yoksa ekle").
- Ekip adı ayarı yoksa e-posta başı gösterilir; bilinmeyen tutar "—".

## 8. Doğrulama

- `npm run build`; mevcut `tools/test-*.mjs` (özellikle `test-yonetim`, `test-teklif-dosya`, `test-sablon`, `test-tema`).
- Yeni `tools/test-crm-firsat.mjs`: şema; taşıma (iki kez çalıştırma aynı sonuç, kişi oluşturma, tutar uydurmama);
  fırsat CRUD; aşama türetme (kazanıldı/kaybedildi/açık karışımları); kayıp nedeni zorunluluğu; sorumlu denetimi;
  "Yapıldı" → kayıt + görev kapanışı; Bugün sıralaması (gecikmiş önce); aylık ve tek seferlik ayrı; yetkisiz 401;
  Origin'siz yazma reddi; "Müşteri yap" kazanılan fırsatla çalışmaya devam ediyor.
- Yerel `wrangler dev --local` + tarayıcıda uçtan uca: talep → CRM'e al → fırsat → sonraki adım → Yapıldı → teklif →
  kazanıldı. Sahte veriyle ekran görüntüleri.
- Bağımsız güvenlik incelemesi (yeni uçlar, kişi verisi).
- Hiçbir gönderim kodu eklenmediğinin denetimi.

## 9. Teslim sırası

1. PR: ferah tipografi (tüm Website Yönetim).
2. PR: şema + taşıma + uçlar + testler.
3. PR: Bugün, Satış panosu, Müşteri kartı, Kişiler ekranları.
Her PR Muhittin'in "birleştir" onayıyla; canlıya çıkıştan sonra Cloudflare dağıtımı izlenir.

## 10. Muhittin'den gereken

- Ekip üyelerinin panel girişi: e-postaları `YONETICILER` ve Cloudflare Access listesine Muhittin ekler (kimlik ayarı).
- İsteğe bağlı: ekip görünen adları (ör. "Ayşe K.").
