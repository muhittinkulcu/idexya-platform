# `<idexya-kabuk>`: ortak arayüz kabuğu

Marketing (IDOS), Website ve CRM (Panel) ve Creative'in ortak iskeleti: üst alan (cam), tek sol menü (11 madde), arama
(komut paleti), tema düğmesi, Ayarlar sayfası (`<idexya-ayarlar>`), yan menü (geniş ve daraltılmış), sayfa sekmeleri, zemin ızgarası, asistan
düğmesi ve sayfa hareketleri. Sözleşme: [`../arayuz-kabugu.md`](../arayuz-kabugu.md) (renkler, yerler,
yapım kuralları). Onaylı tasarım: 14 Kas 2026 taslağı.

Çatıdan bağımsızdır (Astro, React, düz HTML), bağımlılığı yoktur, Shadow DOM kullanmaz; bütün sınıflar
`ik-` önekli, bütün depolama anahtarları `idx-` önekli.

**Bu klasör yalnız burada düzenlenir.** Projelerdeki kopya `betik/ortak_esitle.sh` ile gelir; projede elle
değiştirilmez (yapım kuralı 1).

## Dosyalar

| Dosya | Ne | Projeye gider |
|---|---|---|
| `kabuk.js` | Özel öğe (Custom Element), DOM ve olaylar | evet |
| `kabuk-cekirdek.js` | DOM'a dokunmayan saf işlevler: ayar doğrulama, arama, sekme kuralları, görünüm | evet |
| `ayarlar.js` | `<idexya-ayarlar>`: ortak Ayarlar sayfasının içeriği (aşağıda "Ayarlar sayfası") | evet |
| `kabuk.css` | Bütün stiller, renk değişkenleri, açık/koyu, hareketler, telefon düzeni | evet |
| `README.md` | Bu belge | evet |
| `katmanlar.json` | Sol menünün 11 maddesi (ad, simge, adres, renk, gruplar, modüller, sayfalar); sol menü ve arama için | evet |
| `kedi.webp` | Asistan düğmesinin kedisi (IDOS maskotu, Ankara kedisi; 200×200). `kabuk.css` göreli adresle (`url(kedi.webp)`) kullanır, ürünün paketleyicisi (Vite, Astro) dosyayı özetli adla yayar | evet |
| `demo.html`, `demo.js`, `demo.css`, `demo-ayar.json` | Yerel deneme sayfası | hayır |
| `test/` | Node birim testleri ve Playwright tarayıcı denemesi | hayır |

## Kullanım

```html
<head>
  <link rel="stylesheet" href="/kabuk/kabuk.css">
  <script type="module" src="/kabuk/kabuk.js"></script>
</head>
<body>
  <script type="application/json" id="idexya-kabuk-ayar">{ ...ayar... }</script>
  <idexya-kabuk>
    <!-- sayfanın kendi içeriği: kabuk bunu sarar (light DOM, slot yok) -->
  </idexya-kabuk>
</body>
```

- Ayar bir veri bloğudur (`type="application/json"`), betik değildir; CSP `script-src` kuralına takılmaz.
  Sunucu bu bloğu yazarken JSON içindeki her `<` karakterini `\u003c` olarak yazmalıdır (JS: `JSON.stringify(x).replace(/</g, '\\u003c')`,
  Python: `json.dumps(x).replace('<', '\\u003c')`). `&lt;` işe yaramaz: `<script>` içinde HTML varlıkları çözülmez,
  `</script>` dizisi bloğu erken kapatır.
- Kabuk, öğenin içindeki düğümleri `.ik-icerik` alanına taşır ve etrafını kurar. İçerik kabuktan önce
  yazılabilir; React gibi çatılar kendi kökünü öğenin içine koyar (`<idexya-kabuk><div id="kok"></div></idexya-kabuk>`).
- Yazı tipi dosyalarını kabuk getirmez. Ürün kendi sunucusundan `@font-face` ile Inter'i verir. Yazı tipi ve
  kalınlık seçimi yoktur (Muhittin, 15 Kas 2026): yazı Inter, kalınlık "Zarif" (`--w-ince` 300, `--w-govde` 350,
  `--w-orta` 400, `--w-vurgu` 500; `kabuk.css` `:root`). Inter yüklü değilse sistem yazısı görünür.

### Çok sayfalı ürün: kabuk ilk boyamadan önce (önerilen)

Modül betikleri (`type="module"`) ayrıştırma bittikten sonra çalışır; tarayıcı ilk kareyi (ve sayfa geçişinin yeni
görüntüsünü) çoğu zaman ondan önce çizer, içerik bir kare kabuksuz görünür. `blocking="render"` ve
`<link rel="expect">` bunu önlemez (14 Kas 2026, Chrome 157 ölçümü). Çok sayfalı üründe kabuk, `kabuk.js` ve ürünün
bağlantı kodu birlikte **klasik** tek dosyaya paketlenip (ör. esbuild `format: 'iife'`) `<head>`'de harici betik olarak
yüklenir (`<script src="/…/kabuk.js?v=<özet>">`, satır içi değil; uzun önbellek). Kabuk, `<head>`'de tanımlıysa
ayrıştırıcı öğeyi kapatır kapatmaz (sonraki kardeş eklenince, ilk boyamadan önce) kurulur; `DOMContentLoaded`
beklenmez. Örnek: idexya-platform `tools/panel-kabuk.mjs`. Tek sayfa uygulama (IDOS `web/`) bunu gerektirmez.

### Sayfalar arası geçiş (çapraz belge View Transitions)

`kabuk.css` çok sayfalı üründe aynı kökendeki geçişleri `@view-transition { navigation: auto }` ile açar: yan
menü (`ik-yan`) ve sekme satırı (`ik-sekmeler`) adlandırılmış öğedir ve yerinde kalır (üst alan adlandırılmaz, camı bozulur;
her sayfada aynı olduğundan geçişte fark görünmez), yalnız
içerik alanı (`ik-icerik`) 150 ms çapraz geçişle değişir. "Hareketi azalt" açıksa geçiş yoktur. Tek sayfa uygulamada
etkisi yoktur (belge değişmez). Geçişin düzgün olması için kabuk ilk boyamadan önce kurulmalıdır (yukarıdaki bölüm).

## Ayar şeması

```jsonc
{
  "katman": "marketing",                 // ürünün varsayılan maddesi (adres menüde yoksa açık olan): genel | musteriler | gorevler |
                                         // marketing | crm | web | creative | marketplace | ai | raporlar | ayarlar
  "bayraklar": [],                       // isteğe bağlı: bayraklı maddeleri açar (ör. "marketplace"); verilmeyen bayraklı madde çizilmez
  "katmanlar": [{ "anahtar": "genel", "ad": "Genel bakış", "simge": "ev", "url": "https://os.idexya.com/", "renk": "#2F55D4", "renkKoyu": "#7F9AF2", "gruplar": [] }, {
    "anahtar": "marketing", "ad": "Marketing", "simge": "megafon", // madde simgesi (simge adı, aşağıda)
    "url": "https://marketing.idexya.com/meta", // maddenin adresi (sol menüdeki satır buraya gider; ağaçta da olmalı)
    "renk": "#2F55D4", "renkKoyu": "#7F9AF2", // açık temada vurgu, koyu temada vurgu (#RRGGBB)
    "aciklama": "Kısa açıklama",
    "gruplar": [{
      "baslik": "Reklam", "simge": "megafon", // simge adları aşağıda
      "moduller": [{ "ad": "Meta", "url": "/meta", "rozet": 3, // rozet isteğe bağlı: yeni iş sayısı
                     "sayfalar": [{ "ad": "Kampanyalar", "url": "/meta/kampanyalar", "rozet": 0 }] }]
    }]
  }],
  "etkin": { "modulUrl": "/meta", "sayfaUrl": "/meta/kampanyalar", "ad": "" }, // ad isteğe bağlı (menüde olmayan sayfa için)
  "kullanici": { "ad": "Muhittin", "rol": "süper admin", "eposta": "..." }, // eposta isteğe bağlı; Ayarlar > Hesap'ta görünür
  "durum": { "baglanti": true, "esitleme": "2026-11-14T10:39:00+03:00" }, // baglanti: true | false | "uyari" | null (bilinmiyor)
  // Uyarı (bağlı ama sorun var): { "baglanti": "uyari", "metin": "3 kaynak eşitlenemiyor", "esitleme": "...", "url": "/data" }
  // metin kapsülde görünür (en çok 80 karakter; boşsa "Eşitlemede sorun var"), nokta sarı; url verilirse kapsül oraya gider
  // (idexya-kabuk:git). url her durumda kullanılabilir; eski değerler (true, false, null) değişmeden çalışır. durumYap() aynı alanları alır.
  "asistan": { "etiket": "IDOS’a sor" },  // isteğe bağlı; yoksa düğme çizilmez. Görsel kabuğun kedisidir (kedi.webp), ürün vermez
  "eylemler": [{ "ad": "Yeni öneri oluştur", "url": "/oneriler?yeni=1", "katman": "marketing" }], // isteğe bağlı, aramada çıkar
  "bildirimUrl": "/notifications",
  "cikisUrl": "/cdn-cgi/access/logout",
  "ayarlarUrl": "/settings",            // Ayarlar sayfası; yoksa yan menüde ve profil menüsünde Ayarlar bağlantısı çizilmez
  "ayarBaglantilari": [{ "ad": "Profil", "url": "/profile", "aciklama": "Kişisel bilgiler" }] // isteğe bağlı, en çok 20
}
```

- **Tek gezinme** (talimat 4.2): "katman" sol menünün bir maddesidir. Sol menüde bütün maddeler alt alta durur; **açık madde**
  adresten bulunur (`etkinKatman`: önce sayfa, sonra modül, sonra maddenin kendi adresi; hiçbiri değilse `katman`). Açık
  maddenin yolu varsayılan açıktır. Aynı adres iki maddede olmaz (`test/katmanlar.test.mjs`).
- Üst alanda modül sekmesi ve mega menü **yoktur**. Logo (X + "IDOS") Genel bakış maddesine (ana ekran) gider.
- Genel bakış maddesinin adresi tek adresin köküdür: `https://os.idexya.com/`. Ana ekranı IDOS uygulaması üretir,
  yönlendirici kökte yönlendirmesiz sunar (`tek-adres-plani.md` "Ana ekran"). Kökte karşılama ekranı (Modüller) açılır;
  Genel bakış grubunun ilk modülü "Operasyon merkezi" `https://os.idexya.com/dashboard` (Muhittin, 18 Kas 2026). Tek adresin
  kendi ekranları (`os.idexya.com/<yol>`) yalnız Genel bakış maddesinde olur; öteki adresler ürün kökenlerindedir.
- **Bayrak**: `bayrak` alanı olan madde (Marketplace: verisi yok) ürün `bayraklar` listesinde açmadıkça sessizce atılır;
  açılsa da adresi yoksa çizilmez (çalışmayan ekran gösterilmez).
- Madde listesi boşsa yan menü ve sekme satırı çizilmez.
- **Rozet** (Muhittin, 14 Kas 2026): modül ve sayfada isteğe bağlı `rozet` (sayı). Yan menüde, daraltılmış
  paneldeki modül satırında turuncu küçük sayı olarak görünür; kapalı maddenin satırında ve daraltılmış raydaki simgede
  içindekilerin toplamı görünür (`katmanRozeti`). 0 ya da yoksa görünmez. Bağlantının
  erişilebilir adına "N yeni" eklenir. 99'dan büyükse "99+". Sonradan `rozetYap(url, sayi)` ile güncellenir.
- **Madde simgesi**: her maddenin `simge` alanı (simge adı) `katmanlar.json`'da verilir; kabuk sol menü satırında, daraltılmış
  rayda, uçan panelin başlığında ve ⌘K aramasında o maddenin sayfa satırlarında çizer. Eksik ya da bilinmeyen ad anahtarın
  varsayılanına döner (`KATMAN_SIMGE`). SVG yolu kabul edilmez (yalnız ad; dışarıdan çizim verisi alınmaz).
- **Asistan kedisi** (Muhittin, 15 Kas 2026: "ben kediyi sevmiştim"): asistan düğmesinin görseli kabuğun parçasıdır
  (`kedi.webp`, eşitlemeyle gelir); üç üründe aynıdır. Ayardaki `asistan.gorsel` yok sayılır. Düğme yalnız ürün `asistan`
  verdiğinde (asistan paneli olan üründe) çizilir.
- **Kararlar** (Muhittin, 14 Kas 2026): modül başına simge yoktur, grup simgesi yeter. Adresi olmayan ("Yakında")
  modül ve sayfa gösterilmez; doğrulama onları atar.
- **Yetki kabukta değildir.** Kullanıcının görmemesi gereken modül sunucu tarafından ayara hiç konmaz.
- Doğrulama (`ayarDogrula`): adres yalnız http(s) olabilir ve sayfanın kendi kökenine (göreli adres) ya da
  ayardaki bir katman `url`'sinin kökenine gitmelidir; başka dış adres atılır. Ters bölü (`\`), boşluk, denetim
  karakteri, `javascript:`, `data:` ve `//` ile başlayanlar atılır. Renk `#RRGGBB` değilse varsayılana döner.
  Geçersiz parça atılır, neden konsola tek bir uyarı olarak yazılır, kabuk yine çizilir.
- Esitleme metni ISO saat (`...T10:39`) ya da `14.11.2026 10.39` olabilir; kapsülde `Eşitleme 10.39`, yoksa
  `Eşitleme —` görünür (bilinmeyen değer 0 değil "—").

Simge adları (grup ve katman): `ev`, `izgara`, `megafon`, `grafik`, `yildiz`, `belge`, `gelen`, `kisiler`, `dunya`, `esitle`,
`takvim`, `gorsel`, `palet`, `ayrac`, `onay`, `huni`, `magaza`, `ayar`. Grupta bilinmeyen ad `izgara` olur.

**Üst alan** (talimat 4.2, "A, cam"): yarı saydam buzlu cam, temaya uyan (açıkta `rgba(255,255,255,.85)`, koyuda
`rgba(21,32,43,.66)`; bulanıklık `.ik-ust::before` üzerinde). İçerik soldan sağa: IDOS kimliği, **ürün yuvası** (`ustYuva`;
aktif müşteri seçimi ve tarih aralığı gibi ürünün denetimleri), arama, veri eşitleme durumu (1280 px altında yalnız saat),
sabitleme, bildirimler, tema, kullanıcı menüsü. Turuncu (`--ik-turuncu`: açıkta `#DE681B`, koyuda `#F07A23`; yüzeyde en az
3:1) yalnız X logosunun rozetinde (sabit `#F07A23` zemin, beyaz X) ve sol menüdeki açık maddenin 2 px çizgisindedir. `.ik-ust` adlandırılmış görünüm geçişi almaz
(`view-transition-name` öğeyi "backdrop root" yapar, cam arkadaki sayfayı göremez). Açılır menüler (arama sonuçları, profil)
koyu cam olarak kalır. Telefonda arama ikinci, ürün yuvası üçüncü satırdadır.

**Oklu ağaç** (Muhittin, 18 Kas 2026): geniş yan menü madde › grup › modül › sayfa ağacıdır. Grubu olan her maddenin, her
grubun ve sayfası olan her modülün yanında ok vardır; oka basmak sayfaya gitmeden alt düzeyi açar / kapatır, adın kendisi
sayfaya gider (madde adı maddenin ilk sayfasına). Açık sayfanın yolu varsayılan açıktır; başka maddeye geçince o maddenin yolu
açılır. Kayıt: `idx-yan-acik` (madde), `idx-yan-modul` (modül), `idx-yan-kapali-<madde>` (grup); açık olmayan maddede kayıt
yoksa üçten çok grup kapalı başlar. Klavye: ↑ ↓ görünen satırlar arasında, → açar ya da ilk alt satıra iner, ← kapatır ya da
üst satıra çıkar; okta Enter ve Space açar / kapatır. Açılan düzey yalnız kullanıcı açınca hareketlenir (`ik-yeni`).

**Daraltılmış menüdeki pencere** (uçan panel; 18 Kas 2026): sıkı liste, ağaçla aynı yapı (simgeli grup başlığı, modül,
sayfalar). Pencere hep görünür alanda kalır: üst çubuğun altı ile ekranın altı arasına sığacak biçimde yukarı kayar,
`max-height` bu aralıktır, gerekirse yalnız pencerenin içi kayar. Fareyle pencereye geçerken kapanmaz.

**Tüm grupları aç / kapat** (Muhittin, 15 Kas 2026): yan menü başlığında ("Menü" satırı), daraltma düğmesinin solunda simge
düğme; açık maddenin gruplarına etki eder. Hiç kapalı grup yoksa "Tüm grupları kapat", varsa "Tüm grupları aç". Seçim
`idx-yan-kapali-<madde>` kaydında saklanır; kayıt yoksa dörtten çok gruplu maddede yalnız etkin sayfanın grubu açık başlar.
Daraltılmış (dar) yan menüde ve tek gruplu maddede çizilmez (tek gruplu maddede grup başlığı da çizilmez).

**Üzerine gelince açılan grup** (Muhittin, 15 Kas 2026: "Sidebar açıkken modüllerin üzerine geldiğimde otomatik olarak açılsın
alt menüleri"): geniş yan menüde fare kapalı bir grubun üzerinde 150 ms durunca grup geçici açılır (kayıt değişmez). Fare
gruptan yukarı ya da yana çıkınca 300 ms sonra kapanır; aşağıdaki gruba geçerken üstteki kapanmaz (içerik imlecin altından
kaymasın), menüden çıkınca 300 ms sonra hepsi kapanır. Kayıtla açık gruplar (tıklama, "tümünü aç") hiç kapanmaz; etkin
sayfanın grubu ve odağı içeren grup açık kalır; geçici açık grup tıklanırsa açık kaydedilir. Yalnız fare (`pointerType`
`mouse`); dokunmatik, kalem ve klavyede tıklama davranışı aynıdır; telefonda (çekmece) ve daraltılmış menüde (uçan panel) yoktur.
Açılıp kapanma yükseklik geçişiyledir (`grid-template-rows` 0fr ↔ 1fr), "hareketleri azalt"ta geçiş yoktur. Gruplar her zaman
çizilir, kapalı olan CSS ile gizlenir (`visibility`, odak almaz); açıp kapamak ağacı yeniden kurmaz, kaydırma yerinde kalır.

## Sol menü listesi (`katmanlar.json`)

Üç ürün aynı listeyi kullanır: sol menü her üründe aynıdır. Dosya `{ "surum": 2, "katmanlar": [...] }` biçimindedir;
`katmanlar` ayar şemasındaki madde nesneleridir (adresler mutlak `https://`, sayfalar bulundukları uygulamanın kökeninde).
Eşleme (talimat 4.2): Marketing → IDOS Meta ve Google Ads sayfaları; CRM → IDOS CRM ve satış hattı + Panel talep, teklif,
belge ve finans sayfaları (Panel adresinde bağlantı); Web ve Commerce → Panel site yönetimi ve site analizi + IDOS GA4,
Search Console, Tag Manager, Merchant ve İşletme profili; Creative → Creative uygulaması; AI Center → IDOS sabah masası,
analizler, öneri döngüsü, gelen kutusu + Panel asistan sohbetleri; Raporlar → IDOS rapor sayfaları; Genel bakış, Müşteriler,
Görevler ve onaylar → IDOS (+ Panel hesap envanteri, müşteri alanı, görevler ve bildirimler); Ayarlar → üç ürünün ayar
sayfaları. Her ürün ayarını yazarken:

1. `katmanlar.json` içindeki listeyi alır;
2. **kendi kökenindeki adresleri** göreli adrese (temel yol dahil) çevirir ve yetkiye göre süzer (kendi menüsünde olmayan ya da
   oturumun göremeyeceği sayfa atılır; yalnız ona özel sayfaları kendisi ekler, ör. IDOS süper admin sayfaları);
3. sonucu `katmanlar` alanına koyar.

Liste elle güncellenir; kaynaklar: Marketing `idexya-agency-os/web/src/lib/moduller.ts` (`yok` ve `süperAdmin` öğeleri
konmaz), Website ve CRM `idexya-platform/src/data/panel-menu.js` (adressiz "Yakında" öğeleri konmaz), Creative
`idexya-creative-os/web/src/lib/rotalar.ts` (hesap sahibine özel "Doğrula" sayfası konmaz). Her ürünün testi bu listeyi kendi
menüsüyle karşılaştırır. `test/katmanlar.test.mjs` sırayı, bayrağı, adres tekliğini ve eşlemeyi denetler.

## Olaylar ve yöntemler

| Olay (öğeden kabarcıklanır) | Ne zaman | `detail` |
|---|---|---|
| `idexya-kabuk:kur` | Kurulumdan hemen önce, ayar okunmadan | `{}` — ürün ayar bloğunu son kez değiştirebilir (ör. etkin adres, oturumdaki kullanıcı) |
| `idexya-kabuk:hazir` | Kabuk kuruldu | `{ ayar }` (doğrulanmış) |
| `idexya-kabuk:git` | Kabuktaki bir bağlantıya tıklandı ya da aramada Enter | `{ url }` — **iptal edilebilir** |
| `idexya-kabuk:asistan` | Asistan düğmesine tıklandı | `{}` — paneli ürün açar |
| `idexya-kabuk:gorunum` | Tema, zaman sınırları ya da "hareketleri azalt" değişti (bu sekmede ya da başka sekmede) | `{ tema, zamanAcik, zamanKoyu, azHareket }` |

Tek sayfa uygulama (IDOS `web/`) `idexya-kabuk:git` olayını `preventDefault()` ile durdurur, kendi
yönlendiricisiyle gider, sonra kabuğa haber verir:

```js
const kabuk = document.querySelector('idexya-kabuk');
kabuk.addEventListener('idexya-kabuk:git', (e) => { e.preventDefault(); router.navigate(e.detail.url); });
router.onChange((yol) => { kabuk.etkinYap({ sayfaUrl: yol }); /* içerik çizildikten sonra: */ kabuk.sahneOynat(); });
```

Olay iptal edilmezse kabuk normal bağlantı gibi gider (çok sayfalı Panel bunu kullanır). Ctrl, ⌘, Shift ve
orta tık tarayıcıya bırakılır (yeni sekme).

| Yöntem / alan | Ne yapar |
|---|---|
| `etkinYap({ modulUrl, sayfaUrl, ad })` | Etkin sayfayı değiştirir: yan menü vurgusu, sekme ekleme, sahne hareketi |
| `sahneOynat(kok?)` | `[data-ik-sahne]` hareketlerini ve sayaçları yeniden oynatır |
| `durumYap({ baglanti, esitleme })` | Durum kapsülünü günceller |
| `rozetYap(url, sayi)` | Modül ya da sayfa rozetini günceller (0 gizler) |
| `kullaniciYap({ ad, rol, eposta })` | Profil düğmesini günceller (oturum bilgisi sonradan gelirse) |
| `kapat()` | Açık açılırı (arama, profil) kapatır |
| `ustYuva` | Üst alandaki ürün yuvası (öğe): ürün aktif müşteri, tarih gibi denetimlerini içine koyar (React: `createPortal`); kabuğun genel öğe kuralları yuvaya karışmaz |
| `gorunumYap({ tema?, zamanAcik?, zamanKoyu?, azHareket? })` | Görünümü değiştirir, kaydeder, uygular, `idexya-kabuk:gorunum` yayar |
| `gorunum` | Geçerli görünüm `{ tema, zamanAcik, zamanKoyu, azHareket }` (kopya) |
| `sabitle(acik)`, `darYap(dar)` | Üst çubuğu sabitler; yan menüyü daraltır (ikisi de kaydedilir) |
| `aramaKaynagiEkle({ ad, ara })` | ⌘K aramasına ürünün kendi sonuçlarını ekler (aşağıda "Arama kaynağı"); kaldıran işlevi döndürür |
| `konum` | `{ katman, grup, ad }` — açık maddenin adı, grup ve sayfa adı (konum yolu ve başlık için) |

## Arama kaynağı (`aramaKaynagiEkle`)

Menü sonuçlarının yanında ürünün kendi verisi de aranabilir (ilk kullanım: Marketing müşterileri; Muhittin, 14 Kas 2026).

```js
const kaldir = kabuk.aramaKaynagiEkle({
  ad: 'Müşteriler',                                  // grup başlığı; "Sayfalar" ve "Eylemler" kullanılmaz
  ara: async (sorgu, sinyal) => {                    // sinyal: AbortSignal, fetch'e verilir
    const liste = await (await fetch('/api/...', { signal: sinyal })).json();
    return liste.map((x) => ({ ad: x.ad, url: '/clients/' + x.id }));  // { ad, url, yol?, simge? }
  }
});
// React: useEffect(() => kabuk.aramaKaynagiEkle({...}), []);  (dönen işlev temizlikte kaynağı kaldırır)
```

- Kabuk kaynağı yalnız sorgu **en az 2 karakter** iken, yazma durduktan **150 ms** sonra çağırır. Yeni tuş, Esc ya da
  aramanın kapanması önceki isteği `AbortController` ile iptal eder; iptal edilen isteğin yanıtı çizilmez.
- Sonuçlar menü sonuçlarının **altında**, kaynağın adıyla kendi grubunda, kaynağın verdiği sırayla, **en çok 8** satır.
  Klavye (↑ ↓ Enter) menü ve kaynak sonuçlarını tek liste olarak gezer; tıklama ve Enter `idexya-kabuk:git` olayını yayar.
- Her sonuç doğrulanır: `ad` ve `yol` metindir (textContent, 120 karakter), `url` `guvenliUrl`'den geçer (aynı köken ya da
  katman kökenleri); adı ya da geçerli adresi olmayan satır atılır. `simge` verilmezse adın ilk harfi.
- Durum sessizdir: yüklenirken ve hata olunca sonuç listesinin altında küçük bir satır ("Müşteriler aranıyor…",
  "Müşteriler alınamadı"); satır `role="status"` (aria-live) olduğundan ekran okuyucu duyurur. Kaynak ararken
  "sonuç yok" yazılmaz.
- Aynı adla ikinci kez eklenen kaynak öncekinin yerini alır; "Sayfalar" ve "Eylemler" adları reddedilir. Kaldırma süren isteği iptal eder.
- **Yetki ve kişisel veri ürünündür:** `ara` yalnız oturumdaki kullanıcının görebileceği kayıtları döndürür (sunucu
  süzgeci); sonuçta yalnız gereken ad bulunur (müşteri adı gibi), kişi adı, e-posta ya da telefon konmaz.

## Tema ve Ayarlar sayfası

Muhittin, 15 Kas 2026: "Ayarlara basınca bu pencere gelmesin. Ayarlar sayfası ayrı ve kapsamlı olsun, font vs seçimi
olmasın, tema değiştirici 4'lü olsun: açık, koyu, sistem, zaman; açılır pencere gelmesin."

- **Tema** dört seçenektir: `acik`, `koyu`, `sistem` (cihazın açık/koyu ayarı), `zaman` (gündüz açık, gece koyu;
  varsayılan 07.00–19.00 açık, saatler Ayarlar sayfasından değişir, aralık gece yarısını aşabilir). Zaman seçiliyken kabuk
  sonraki sınırda (en geç dakikada bir) ve sekme yeniden görünür olunca temayı yeniden hesaplar.
- **Üst çubuktaki tema düğmesi açılır pencere açmaz**: her tıklamada açık → koyu → sistem → zaman → açık sırasıyla geçer;
  simge seçimi gösterir (güneş, ay, ekran, saat), `aria-label` ve `title` "Tema: Koyu (değiştirmek için tıkla)".
- **Yan menünün altındaki "Ayarlar"** ve profil menüsündeki "Ayarlar" gerçek bağlantıdır (`ayarlarUrl`); diğer menü
  bağlantıları gibi `idexya-kabuk:git` yayar, etkin sayfa `ayarlarUrl` ise `aria-current="page"` ve vurgu alır, sekme adı
  "Ayarlar" olur, ⌘K aramasında "Ayarlar" sayfası çıkar. `ayarlarUrl` yoksa bağlantı çizilmez. os.idexya.com'da öneke çevrilir.
- **Eski kayıt göçü**: `idx-gorunum` içindeki `tema: "oto"` → `sistem`; `kalinlik` ve `yazi` okunur, atılır (kayıt yeni
  biçimle yeniden yazılır). Hata vermez.
- **Hareketleri azalt**: `azHareket: true` iken `<html data-hareket="az">`; kabuk ve içerik alanındaki bütün CSS hareketi,
  sayaç ve sayfa geçişi kapanır (cihazın "hareketi azalt" ayarına ek).

`ayarlar.js` ürünün Ayarlar sayfasında yüklenir ve içerik alanına `<idexya-ayarlar></idexya-ayarlar>` konur. Sayfa başlığını
ürün çizer (ör. `ik-sayfa-bas`); bileşen yalnız bölümleri çizer. Ayarı içinde bulunduğu `<idexya-kabuk>` öğesinin doğrulanmış
ayarından okur. Bölümler (yalnız gerçekten çalışan ayarlar; karşılığı olmayan alan uydurulmaz):

| Bölüm | Ne |
|---|---|
| Görünüm | Dört tema (radyo grubu, kart); Zaman seçiliyse "Açık tema başlar" ve "Koyu tema başlar" saatleri (aynı saat reddedilir) |
| Arayüz | Üst çubuğu sabitle (`idx-ust-sabit`), yan menüyü daraltılmış göster (`idx-yan-dar`), hareketleri azalt |
| Bölge | Tarayıcının saat dilimi ve tarih, saat, sayı, tutar, oran örnekleri (salt gösterim) |
| Hesap | `kullanici` (ad, e-posta, rol) salt okuma; "Oturumu kapat" `cikisUrl`'ye (yoksa os.idexya.com'da `/cdn-cgi/access/logout`) |
| Klavye kısayolları | Kabukta gerçekten olanlar: ⌘K / Ctrl K, ↑ ↓, Enter, Esc, → |
| Modül ayarları | `ayarBaglantilari` (ürünün kendi ayar ve yönetim sayfaları; yetki süzgeci üründe). Liste boşsa bölüm çizilmez |

Bağlantılar `idexya-kabuk:git` yayar (tek sayfa uygulama kendi yönlendiricisiyle gider). "Oturumu kapat" profil menüsündeki
çıkışla aynı `idx-` kayıtlarını siler.

## Sayfa parçaları ve hareketler

Kabuk sayfa içeriğine dokunmaz; ama sözleşmedeki ortak parçaların sınıfları `kabuk.css` içindedir, ürün
bunları kullanır (bkz. `demo.html`):

`ik-sayfa-bas` (konum + başlık + eylemler), `ik-konum`, `ik-eylemler`, `ik-dugme`, `ik-dugme-ana`,
`ik-suzgec`, `ik-suzgec-not`, `ik-sayfa` (içerik alanı), `ik-ozet`, `ik-kartlar`, `ik-kart`, `ik-kart-bas`,
`ik-kart-arac`, `ik-kart-deger`, `ik-kart-alt`, `ik-kart-son`, `ik-egri` (+ `ik-cizgi-ciz`, `ik-alan-dol`,
`ik-uc-nokta`), `ik-tablo-kart`, `ik-tablo-bas`, `ik-kaydir`, `ik-tablo`, `ik-sayi`, `ik-durum[data-tur=ok|uyari|hata|bilgi]`.

Hareket işaretleri: `[data-ik-sahne]` kapsayıcı; içinde `[data-ik-baslik]` soldan kayar, `[data-ik-oge]`
sırayla süzülür, `[data-ik-satir]` tablo satırı akar, `[data-ik-sayac]` metindeki ilk sayı sıfırdan sayar
(bir kez, `requestAnimationFrame` biter). Uyarı ve hata etiketinin noktası yavaşça atar.
"Hareketi azalt" açıksa bütün hareket kapanır, sayaçlar hemen son değeri gösterir.

**Yalnız oturumdaki ilk açılışta** (Muhittin, 14 Kas 2026): kabuk `sessionStorage` `idx-acildi` işaretine bakar. Sekmede
daha önce bir kabuklu sayfa açıldıysa sayfa yüklenirken giriş hareketleri (sahne, sayaç, yan menüdeki alt sayfa listesinin
açılışı) oynamaz, kabuk ve içerik hemen son hâliyle çizilir. Sonraki `etkinYap` çağrısından (uygulama içi gezinme) itibaren
hareketler yine oynar.

Renk değişkenleri (`:root` ve `html[data-tema=koyu]`): `--ik-zemin`, `--ik-yuzey`, `--ik-gomuk`,
`--ik-cizgi`, `--ik-metin`, `--ik-ikincil`, `--ik-turuncu`, `--ik-izgara`, üst alan `--ik-cu-*`; madde vurgusu `--ik-vurgu`,
`--ik-vurgu-yazi`, `--ik-yumusak`. Yazı: `--ik-yazi` (aile), `--w-ince`, `--w-govde`, `--w-orta`,
`--w-vurgu`. Bileşenlerde sabit kalınlık sayısı yazılmaz.

## Tarayıcıda saklananlar (`localStorage`, `sessionStorage`)

**Kural:** sekme adına ya da adresine ve menü adına müşteri ya da kişi adı konmaz (sekme adı menüdeki
sayfa adından gelir; müşteri kartı gibi sayfalarda `etkin.ad` genel tutulur, ör. "Müşteri kartı"). Saklanan
sekme yalnız aynı kökende ve menüde ya da bu oturumda açılmış bir adresse geri yüklenir. Profil menüsündeki
"Çıkış yap" `idx-sekme*`, `idx-musteri`, `idx-yan-kapali-*`, `idx-yan-acik` ve `idx-yan-modul` anahtarlarını ve `sessionStorage` içindeki bütün `idx-*`
anahtarlarını (kabuğun ve ürünün oturum kayıtları) siler.

| Anahtar | İçerik |
|---|---|
| `idx-gorunum` | `{ tema: acik\|koyu\|sistem\|zaman, zamanAcik: 420, zamanKoyu: 1140, azHareket: false }` (zaman: gün içindeki dakika) |
| `idx-sekme` | Açık sekmeler `[{ ad, url }]`, en çok 8 (tek liste; ilk sekme ana ekran; adı bilinmeyen adres sekme olmaz) |
| `idx-yan-dar` | Yan menü daraltılmış mı |
| `idx-yan-kapali-<madde>` | Maddenin kapalı grup başlıkları |
| `idx-yan-acik` | Ağaçta açık / kapalı maddeler `{ madde: true\|false }` |
| `idx-yan-modul` | Ağaçta açık / kapalı modüller `{ modül adresi: true\|false }` |
| `idx-ust-sabit` | Üst çubuk sabit mi |
| `idx-musteri` | Ortak aktif müşteri: IDOS `client_id` (düz metin, ad değil). Üç modül aynı seçimi okur ve yazar; `kabuk-cekirdek.js` `musteriOku(localStorage)` / `musteriYaz(localStorage, id)`. Başka sekmedeki değişiklik `storage` olayıyla gelir. Ürün kendi kimliğini (Creative marka, Website/CRM kartı) IDOS kimliğine çevirir; eşi olmayan kayıt anahtara yazılmaz |
| `idx-acildi` (`sessionStorage`) | Bu sekmede kabuk daha önce açıldı mı (giriş hareketleri yalnız ilk açılışta) |

`<html>` üzerine `data-tema` (`acik`/`koyu`), `data-tema-secim` (`acik`/`koyu`/`sistem`/`zaman`) ve hareketleri azalt açıksa
`data-hareket="az"` yazılır. Ürünün ilk boyama betiği (koyu temada açık zemin yanıp sönmesin diye) aynı kuralı uygular:
`sistem` ve eski `oto` → cihaz ayarı, `zaman` → `zamanAcik`/`zamanKoyu` aralığı. localStorage alan adına bağlıdır:
katmanlar ayrı alan adlarındayken seçim her birinde ayrı saklanır; tek adres (`os.idexya.com`, aşama 2)
gelince ortak olur.

## Güvenlik ve CSP

- `innerHTML`, `eval`, `new Function`, satır içi betik ve `setAttribute('style')` yok. DOM `createElement` +
  `textContent` ile, sabit SVG `createElementNS` ile kurulur. Stil CSSOM ile (`style.setProperty`) verilir;
  bu, `style-src 'self'` (unsafe-inline olmadan) politikasında da çalışır.
- Dış ağ isteği yok (yazı tipi, görsel, betik). `demo.html` katı CSP ile açılır ve konsolda hata vermez.
- Kabuğun genel `keydown` dinleyicisi yalnız ⌘K / Ctrl+K içindir; olay önceden işlenmişse, yazı birleştirme
  sürüyorsa ya da odak düzenlenebilir bir alandaysa (kabuğun arama kutusu hariç) karışmaz. Esc, öğenin kendi
  dinleyicisindedir.
- Kabuk yalnız kendi bağlantılarına karışır; içerikteki bağlantılar ürünündür. `idexya-kabuk:git` olayına ve
  `location.assign`'a giden adres yeniden doğrulanır; `etkinYap` adresleri de doğrular.
- Ayar yalnız `script#idexya-kabuk-ayar[type="application/json"]` öğesinden okunur.
- `test/yapim-kurallari.test.mjs` bu kuralları kaynak dosyada denetler.

## Erişilebilirlik

Gerçek `a` ve `button`; `aria-expanded`, `aria-current="page"`, `aria-pressed`, `role="dialog"`,
`role="combobox"` + `listbox`/`option` + `aria-activedescendant`. Her açılır klavyeyle kullanılır; Esc kapatır
ve odak açan düğmeye döner; odak açılırdan çıkınca açılır kapanır. Daraltılmış menüde simgeye odaklanınca
panel açılır, → ile panele girilir. Yan menü ağacı ok tuşlarıyla gezilir (yukarıda "Oklu ağaç").

**Köşe yuvarlaması** (Muhittin, 18 Kas 2026): tek değişken `--ik-yaricap: 5px` (`:root`); kart, düğme, girdi, açılır liste,
rozet, sekme ve açılır pencere bunu kullanır. Yalnız daireler (avatar, nokta, asistan) ve açma kapama anahtarı yuvarlaktır.
Ürünler kendi köşe ölçeğini bu değişkene bağlar (IDOS: Tailwind `borderRadius`).

## Bütçe (yapım kuralı 3)

Ürünlerin gerçekte sunduğu boyutla ölçülür: **küçültülmüş + gzip** (karar 14 Kas 2026). Ürünler (Vite/Astro,
esbuild) kabuğu zaten küçülterek sunar; kaynaktaki yorumlar ve okunaklı yazım bütçeye sayılmaz, korunur.

```bash
cd kabuk
for f in kabuk.js kabuk-cekirdek.js ayarlar.js kabuk.css; do echo "$f $(npx --yes esbuild@0.28.2 $f --minify --log-level=error | gzip -c | wc -c) (ham gzip $(gzip -c $f | wc -c))"; done
```

Sınır: `kabuk.js` + `kabuk-cekirdek.js` toplam ≤ 15 kB, `ayarlar.js` ≤ 5 kB, `kabuk.css` ≤ 10 kB (küçültülmüş + gzip). Test bu sınırı
denetler ve ham gzip boyutunu bilgi olarak yazar (esbuild sürümü testte sabittir; ilk koşuda `npx` ağdan indirir).

## Deneme

```bash
node --test kabuk/test/                         # saf işlevler + yapım kuralları (bağımlılık yok)
cd kabuk && python3 -m http.server 8765 --bind 127.0.0.1
# başka uçbirimde (pip install playwright; yüklü Chrome kullanılır, tarayıcı indirilmez):
python3 kabuk/test/tarayici_denemesi.py http://127.0.0.1:8765/demo.html /tmp/kabuk-ekran
```

Demo'da Inter görmek için Inter woff2 dosyalarını `kabuk/yazi/` altına koy (`inter-latin(-ext)-{300,400,500}-normal.woff2`;
klasör git'e girmez). Yoksa sistem yazısı görünür.

## Eşitleme

Projenin kökünde `.idexya-kabuk-hedef` dosyası açılır, ilk satırına kabuğun kopyalanacağı klasör yazılır
(depo köküne göre, ör. `public/kabuk`). Sonra projede:

```bash
scripts/ortak_esitle.sh            # docs/ortak/ ve kabuk klasörünü tazeler
scripts/ortak_esitle.sh --kontrol  # yalnız fark var mı bakar
```
