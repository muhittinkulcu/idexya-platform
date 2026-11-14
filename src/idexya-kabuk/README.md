# `<idexya-kabuk>`: ortak arayüz kabuğu

Marketing (IDOS), Website ve CRM (Panel) ve Creative'in ortak iskeleti: paket çubuğu, mega menü, arama
(komut paleti), Görünüm paneli, yan menü (geniş ve daraltılmış), sayfa sekmeleri, zemin ızgarası, asistan
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
| `kabuk.css` | Bütün stiller, renk değişkenleri, açık/koyu, hareketler, telefon düzeni | evet |
| `README.md` | Bu belge | evet |
| `katmanlar.json` | Dört katmanın ortak listesi (ad, adres, renk, gruplar, modüller, sayfalar); mega menü ve arama için | evet |
| `demo.html`, `demo.js`, `demo.css`, `demo-ayar.json`, `demo-kedi.svg` | Yerel deneme sayfası | hayır |
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
- Yazı tipi dosyalarını kabuk getirmez. Ürün kendi sunucusundan `@font-face` ile verir (Inter zorunlu,
  diğerleri isteğe bağlı). Seçilen aile yüklü değilse tarayıcı Inter'e, o da yoksa sistem yazısına düşer.

## Ayar şeması

```jsonc
{
  "katman": "marketing",                 // geçerli katman: idos | marketing | website | creative
  "katmanlar": [{ "anahtar": "idos", "ad": "IDOS", "url": "https://marketing.idexya.com/dashboard", "renk": "#C2510F", "renkKoyu": "#F07A23", "gruplar": [] }, {
    "anahtar": "marketing", "ad": "Marketing",
    "url": "https://marketing.idexya.com/", // katman ana sayfası (ilk sekme "Genel bakış" buraya gider)
    "renk": "#2F55D4", "renkKoyu": "#7F9AF2", // açık temada vurgu, koyu temada ve paket çubuğunda vurgu (#RRGGBB)
    "aciklama": "Mega menünün solundaki açıklama",
    "gruplar": [{
      "baslik": "Reklam", "simge": "megafon", // simge adları aşağıda
      "moduller": [{ "ad": "Meta", "url": "/meta", "rozet": 3, // rozet isteğe bağlı: yeni iş sayısı
                     "sayfalar": [{ "ad": "Kampanyalar", "url": "/meta/kampanyalar", "rozet": 0 }] }]
    }]
  }],
  "etkin": { "modulUrl": "/meta", "sayfaUrl": "/meta/kampanyalar", "ad": "" }, // ad isteğe bağlı (menüde olmayan sayfa için)
  "kullanici": { "ad": "Muhittin", "rol": "süper admin" },
  "durum": { "baglanti": true, "esitleme": "2026-11-14T10:39:00+03:00" }, // baglanti: true | false | null (bilinmiyor)
  "asistan": { "gorsel": "/img/kedi.webp", "etiket": "IDOS’a sor" },     // isteğe bağlı; yoksa düğme çizilmez
  "eylemler": [{ "ad": "Yeni öneri oluştur", "url": "/oneriler?yeni=1", "katman": "marketing" }], // isteğe bağlı, aramada çıkar
  "bildirimUrl": "/notifications",
  "cikisUrl": "/cdn-cgi/access/logout"
}
```

- IDOS katmanının (ana sayfa) adresi, tek adres (`os.idexya.com`) gelene kadar
  `https://marketing.idexya.com/dashboard` (Muhittin, 14 Kas 2026).
- `idos` katmanının `gruplar` listesi boştur: ok düğmesi, yan menü ve sekmeler çizilmez; logo ("Idexya") ona gider.
- Gruplar boşsa (ya da katman `idos` ise) yan menü ve sekme satırı çizilmez.
- **Rozet** (Muhittin, 14 Kas 2026): modül ve sayfada isteğe bağlı `rozet` (sayı). Yan menüde, daraltılmış
  paneldeki modül satırında ve mega menüde turuncu küçük sayı olarak görünür; 0 ya da yoksa görünmez. Bağlantının
  erişilebilir adına "N yeni" eklenir. 99'dan büyükse "99+". Sonradan `rozetYap(url, sayi)` ile güncellenir.
- **Kararlar** (Muhittin, 14 Kas 2026): modül başına simge yoktur, grup simgesi yeter. Adresi olmayan ("Yakında")
  modül ve sayfa gösterilmez; doğrulama onları atar.
- **Yetki kabukta değildir.** Kullanıcının görmemesi gereken modül sunucu tarafından ayara hiç konmaz.
- Doğrulama (`ayarDogrula`): adres yalnız http(s) olabilir ve sayfanın kendi kökenine (göreli adres) ya da
  ayardaki bir katman `url`'sinin kökenine gitmelidir; başka dış adres atılır. Ters bölü (`\`), boşluk, denetim
  karakteri, `javascript:`, `data:` ve `//` ile başlayanlar atılır. `asistan.gorsel` yalnız aynı köken. Renk `#RRGGBB` değilse varsayılana döner.
  Geçersiz parça atılır, neden konsola tek bir uyarı olarak yazılır, kabuk yine çizilir.
- Esitleme metni ISO saat (`...T10:39`) ya da `14.11.2026 10.39` olabilir; kapsülde `Eşitleme 10.39`, yoksa
  `Eşitleme —` görünür (bilinmeyen değer 0 değil "—").

Simge adları: `izgara`, `megafon`, `grafik`, `yildiz`, `belge`, `gelen`, `kisiler`, `dunya`, `esitle`,
`takvim`, `gorsel`, `ayrac`. Bilinmeyen ad `izgara` olur.

## Katman listesi (`katmanlar.json`)

Üç ürün aynı katman listesini kullanır; böylece mega menüde ve aramada diğer katmanların **gerçek** modülleri
görünür. Dosya `{ "surum": 1, "katmanlar": [...] }` biçimindedir; `katmanlar` ayar şemasındaki katman nesneleridir
(adresler mutlak `https://`). Her ürün ayarını yazarken:

1. `katmanlar.json` içindeki listeyi alır;
2. **kendi katmanını kendi menüsünden ezer** (göreli adreslerle, yetkiye göre süzülmüş hâliyle);
3. sonucu `katmanlar` alanına koyar.

Liste elle güncellenir; kaynaklar: Marketing `idexya-agency-os/web/src/lib/moduller.ts` (`MODÜLLER`: modül → grup,
bölüm → modül, öğe → sayfa; `yok` ve `süperAdmin` öğeleri konmaz), Website ve CRM `idexya-platform/src/data/panel-menu.js`
(adressiz "Yakında" öğeleri konmaz), Creative `idexya-creative-os/web/src/lib/rotalar.ts` (`ANA_MENÜ` ve sekme listeleri).
Bir ürünün menüsü değişince bu dosya da güncellenir; `test/katmanlar.test.mjs` dosyanın doğrulamadan kayıpsız geçtiğini denetler.

## Olaylar ve yöntemler

| Olay (öğeden kabarcıklanır) | Ne zaman | `detail` |
|---|---|---|
| `idexya-kabuk:hazir` | Kabuk kuruldu | `{ ayar }` (doğrulanmış) |
| `idexya-kabuk:git` | Kabuktaki bir bağlantıya tıklandı ya da aramada Enter | `{ url }` — **iptal edilebilir** |
| `idexya-kabuk:asistan` | Asistan düğmesine tıklandı | `{}` — paneli ürün açar |
| `idexya-kabuk:gorunum` | Tema, kalınlık ya da yazı tipi değişti | `{ tema, kalinlik, yazi }` |

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
| `kullaniciYap({ ad, rol })` | Profil düğmesini günceller (oturum bilgisi sonradan gelirse) |
| `kapat()` | Açık açılırı (mega, arama, görünüm, profil) kapatır |
| `konum` | `{ katman, grup, ad }` — ürünün konum yolu ve başlığı için |

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

Renk değişkenleri (`:root` ve `html[data-tema=koyu]`): `--ik-zemin`, `--ik-yuzey`, `--ik-gomuk`,
`--ik-cizgi`, `--ik-metin`, `--ik-ikincil`, `--ik-paket`, `--ik-izgara`; katman vurgusu `--ik-vurgu`,
`--ik-vurgu-yazi`, `--ik-yumusak`. Yazı: `--ik-yazi` (aile), `--w-ince`, `--w-govde`, `--w-orta`,
`--w-vurgu`. Bileşenlerde sabit kalınlık sayısı yazılmaz.

## Tarayıcıda saklananlar (`localStorage`)

**Kural:** sekme adına ya da adresine ve menü adına müşteri ya da kişi adı konmaz (sekme adı menüdeki
sayfa adından gelir; müşteri kartı gibi sayfalarda `etkin.ad` genel tutulur, ör. "Müşteri kartı"). Saklanan
sekme yalnız aynı kökende ve menüde ya da bu oturumda açılmış bir adresse geri yüklenir. Profil menüsündeki
"Çıkış yap" `idx-sekme-*` ve `idx-yan-kapali-*` anahtarlarını siler.

| Anahtar | İçerik |
|---|---|
| `idx-gorunum` | `{ tema: acik\|koyu\|oto, kalinlik: ince\|zarif\|dengeli, yazi: inter\|manrope\|... }` |
| `idx-sekme-<katman>` | Açık sekmeler `[{ ad, url }]`, en çok 8 |
| `idx-yan-dar` | Yan menü daraltılmış mı |
| `idx-yan-kapali-<katman>` | Kapalı grup başlıkları |
| `idx-ust-sabit` | Üst çubuk sabit mi |

`<html>` üzerine `data-tema` (`acik`/`koyu`) ve `data-tema-secim` yazılır. localStorage alan adına bağlıdır:
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
panel açılır, → ile panele girilir.

## Bütçe (yapım kuralı 3)

```bash
cd kabuk
for f in kabuk.js kabuk-cekirdek.js kabuk.css; do echo "$f $(gzip -c $f | wc -c)"; done
```

Sınır: `kabuk.js` + `kabuk-cekirdek.js` toplam ≤ 15 kB, `kabuk.css` ≤ 10 kB (gzip). Test bu sınırı da denetler.

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
