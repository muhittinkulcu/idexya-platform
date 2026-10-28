"""Yayın içeriği: tasarımdaki yer tutucuların yerine Muhittin'in verdiği bilgiler (22 Eki 2026).
donustur.sh sonunda çalışır; tekrar çalıştırmak zararsızdır (değişiklik zaten varsa atlanır)."""
import re

YASAL = ['src/pages/tr/sayfa/kvkk-aydinlatma-metni.astro', 'src/pages/tr/sayfa/cerez-politikasi.astro', 'src/pages/tr/sayfa/gizlilik-politikasi.astro']
SAKLAMA = ('Saklama süreleri: müşteriye dönüşmeyen talepler 2 yıl; müşteri, sözleşme ve fatura kayıtları 10 yıl; '
           'ticari elektronik ileti onay kayıtları onayın geri alınmasından itibaren 3 yıl; site erişim (IP) kayıtları 2 yıl; '
           'yapay zekâ asistanı sohbet kayıtları 1 yıl.')
DEGISIM = {p: [
    ('İletişim: info@idexya.com · [Veri sorumlusu adresi].', 'İletişim: info@idexya.com · Ankara.'),
    ('Kanun’un 9. maddesindeki şartlara uygun yapılır. [Aktarım dayanağı ve tedarikçi listesi hukuk danışmanıyla netleşecek.]\'',
     'Kanun’un 9. maddesindeki şartlara uygun yapılır.\''),
    ('anonim hâle getirilir. [Veri türlerine göre saklama süreleri tablosu eklenecek.]\'', 'anonim hâle getirilir.\', \'' + SAKLAMA + '\''),
] for p in YASAL}
DEGISIM['src/pages/tr/sayfa/hakkimizda.astro'] = [
    ("{ yil: '[Yıl]', ad: 'İlk adım'", "{ yil: '2018', ad: 'İlk adım'"),
    ("{ yil: '[Yıl]', ad: 'Idexya kuruldu', metin: 'Ajans olarak markalara 360° hizmet.' }",
     "{ yil: '2026', ad: 'Idexya kuruldu', metin: 'Haziran 2026’da resmî olarak kuruldu; markalara 360° hizmet.' }"),
    # Rakamı doğrulanmamış iki kutu yerine sözleşmeye bağlı iki ilke
    ("{ deger: '[X]', ad: 'yönetilen marka' }, { deger: '[X]', ad: 'yönetilen reklam bütçesi' }",
     "{ deger: '360°', ad: 'reklam, mağaza, SEO ve yazılım tek planda' }, { deger: '%100', ad: 'reklam hesapları ve veriler sizde kalır' }"),
    ('<p style="margin: 0; font-size: 18px; color: var(--tx2)">[Kurucunun kendi anlatımıyla kısa bir paragraf: neden bu işi yapıyor, müşteriye ne söz veriyor.]</p>\n', ''),
]
DEGISIM['src/pages/tr/iletisim.astro'] = [
    ('[Hafta içi saatleri doğrulanacak]', 'Hafta içi 09.00–18.00'),
]
DEGISIM['src/pages/tr/paketler.astro'] = [
    ('Formu gönderdikten sonra size dönüş yaparız. [Dönüş süresi doğrulanacak]', 'Formu gönderdikten sonra 1 iş günü içinde size dönüş yaparız.'),
    ('en az [X ay] ile başlamayı öneriyoruz.', 'en az 3 ay ile başlamayı öneriyoruz; süre ihtiyacınıza göre görüşülebilir.'),
]
# Ana sayfa açılışı: rakamlar tıklanabilir, platform şeridindeki adlar platform sayfalarına bağlanır (Muhittin, 28 Eki 2026).
_RAKAM = 'style="display: flex; flex-direction: column; padding-{}: 28px{}"><span style="font-size: 32px; font-weight: 700; color: var(--head)">{}</span><span style="font-size: 14px; color: var(--tx2)">{}</span></div>'
DEGISIM['src/pages/index.astro'] = [
    ('<div ' + _RAKAM.format('right', '; border-right: 1px solid var(--line)', '10+ yıl', 'e-ticaret ve dijital pazarlama'),
     '<a href="/tr/sayfa/hakkimizda" class="ust-rakam" ' + _RAKAM.format('right', '; border-right: 1px solid var(--line)', '10+ yıl', 'e-ticaret ve dijital pazarlama deneyimi').replace('</div>', '</a>')),
    ('<div ' + _RAKAM.format('left', '', '5 alan', 'tek ekipte yönetilir'),
     '<a href="/tr/platformlar/" class="ust-rakam" ' + _RAKAM.format('left', '', '5+ platform', 'ayrı dijital platform tek ekipte bir arada').replace('</div>', '</a>')),
    ('<span>Google Ads</span><span>Meta</span><span>Google Analytics 4</span><span>Search Console</span><span>Tag Manager</span><span>ikas</span><span>Ticimax</span>',
     '<a class="ust-platform" href="/tr/platformlar/google-ads">Google Ads</a><a class="ust-platform" href="/tr/platformlar/meta">Meta</a><a class="ust-platform" href="/tr/platformlar/google-analytics-4">Google Analytics 4</a><a class="ust-platform" href="/tr/platformlar/search-console">Search Console</a><a class="ust-platform" href="/tr/platformlar/tag-manager">Tag Manager</a><a class="ust-platform" href="/tr/platformlar/ikas">ikas</a><a class="ust-platform" href="/tr/platformlar/ticimax">Ticimax</a><a class="ust-platform ust-platform-tum" href="/tr/platformlar/">Tümü →</a>'),
]
CEVAP = [
    'Doğru bütçe; sektörünüze, hedef bölgenize, rekabete ve hedeflediğiniz satış ya da talep sayısına göre değişir. Akıllı teklif stratejilerinin öğrenebilmesi için kampanyanın düzenli dönüşüm toplayabileceği bir bütçeyle başlamak gerekir. Ücretsiz analizde hesabınızı ve pazarınızı inceleyip gerekçesiyle bir başlangıç bütçesi öneririz.',
    'Tıklama ve ziyaretler kampanya yayına girdiği gün başlar. Teklif stratejilerinin öğrenme dönemi ve anlamlı iyileştirmeler için genellikle birkaç hafta gerekir; kesin süre sektöre, bütçeye ve dönüşüm sayısına bağlıdır. Bu yüzden ilk dönemi ölçüm ve öğrenme, sonrasını büyüme dönemi olarak planlarız.',
    'Reklam hesabı sizin adınıza açılır ve size aittir. Biz yönetici olarak erişiriz; çalışmamız sona erdiğinde erişimimiz kaldırılır, hesap ve tüm geçmiş veriler sizde kalır.',
    'Sonuçlarınızı IDOS panelinde takip edebilirsiniz; satış, form ve arama gibi sonuçlar ayrı ayrı görünür. Düzenli değerlendirmelerde neyin işe yaradığını ve bir sonraki adımları sizinle paylaşırız.',
]
DEGISIM['src/pages/tr/hizmet/google-ads-yonetimi.astro'] = [
    ('[Doğrulanacak: hesap sahipliği politikası]', 'Hesap sizin adınıza açılır; çalışma bittiğinde erişimimiz kaldırılır, hesap ve veriler sizde kalır.'),
] + [('[Cevap yazılacak]', c) for c in CEVAP]
# Bilgisi gelene kadar gizlenen alanlar: kurucu fotoğrafı ve harita yer tutucusu
BLOK = {
    'src/pages/tr/sayfa/hakkimizda.astro': r'<div role="img" aria-label="Kurucu fotoğrafı alanı".*?\[Kurucu fotoğrafı\]</span>\n</div>\n',
    'src/pages/tr/iletisim.astro': r'<div role="img" aria-label="Harita alanı".*?\[Harita: canlıda Google Haritalar\]</span>\n</div>\n',
}

for p, liste in DEGISIM.items():
    s = open(p, encoding='utf-8').read()
    if p in YASAL and 'yasal.json' in s:
        continue  # metinler src/data/yasal.json'a taşındı (aşağıda); panelden düzenlenir
    for eski, yeni in liste:
        if eski in s:
            s = s.replace(eski, yeni, 1)
        else:
            assert yeni in s or yeni == '', f'{p}: ne eski ne yeni metin bulundu: {eski[:60]}'
    if p in BLOK:
        s = re.sub(BLOK[p], '', s, flags=re.S)
    open(p, 'w', encoding='utf-8').write(s)
print('yayın içeriği uygulandı')

# Ana sayfa hizmet kartları yerine hizmet vitrini (src/components/HizmetAlanlari.astro): neden önemli, temsilî görsel,
# dikkat ettiklerimiz ve alt hizmetler (Muhittin, 23 Eki 2026).
p = 'src/pages/index.astro'
s = open(p, encoding='utf-8').read()
if '<HizmetAlanlari />' not in s:
    bas = s.index('<div style="display: flex; flex-wrap: wrap; gap: 20px">\n<article style="flex: 2 1 560px;')
    son = s.index('</article>\n</div>\n</div>\n</section>', bas) + len('</article>\n</div>')
    s = s[:bas] + '<HizmetAlanlari />' + s[son:]
    s = s.replace("import Site from '../layouts/Site.astro';", "import Site from '../layouts/Site.astro';\nimport HizmetAlanlari from '../components/HizmetAlanlari.astro';", 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ana sayfa hizmet vitrini uygulandı')

# Ana sayfa ek bölümleri (Muhittin, 23 Eki 2026): pazaryeri, ücretsiz araçlar, çalışma ilkeleri, sektörler,
# platformlar, blog + Instagram ve SSS. Bileşenler src/components/ana/ altında.
s = open(p, encoding='utf-8').read()
if '<Pazaryeri />' not in s:
    def ekle(bul, metin, sonra=True):
        global s
        assert s.count(bul) == 1, bul[:60]
        s = s.replace(bul, (bul + metin) if sonra else (metin + bul), 1)
    # Zemin sırası düz / açık gri dönüşümlü kalsın: Dört adım (düz) > Pazaryeri (gri) > Araçlar (düz) > IDOS
    ekle('<section id="idos"', '<Pazaryeri />\n\n<Araclar />\n\n', sonra=False)
    ekle('<section id="paketler"', '<Ilkeler />\n\n', sonra=False)
    ekle('<section id="analiz"', '<Sektorler />\n\n<Platformlar />\n\n<BlogSss />\n\n', sonra=False)
    ithal = "".join(f"\nimport {a} from '../components/ana/{a}.astro';" for a in ['Pazaryeri', 'Araclar', 'Ilkeler', 'Sektorler', 'Platformlar', 'BlogSss'])
    s = s.replace("import HizmetAlanlari from '../components/HizmetAlanlari.astro';", "import HizmetAlanlari from '../components/HizmetAlanlari.astro';" + ithal, 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ana sayfa ek bölümleri uygulandı')

# IDOS tanıtım sayfası (Muhittin, 23 Eki 2026): etkileşimli demo (src/components/IdosDemo.astro), hero'da demo düğmesi,
# "Neler var" kartları tıklanınca demonun ilgili modülünü açar.
p = 'src/pages/tr/idos.astro'
s = open(p, encoding='utf-8').read()
if '<IdosDemo />' not in s:
    def degistir(eski, yeni):
        global s
        assert s.count(eski) == 1, eski[:70]
        s = s.replace(eski, yeni, 1)
    degistir("import Site from '../../layouts/Site.astro';", "import Site from '../../layouts/Site.astro';\nimport IdosDemo from '../../components/IdosDemo.astro';")
    tanitim = '<a href="/tr/iletisim" style="min-height: 54px; display: flex; align-items: center; padding: 0 26px; border-radius: 12px; background: #F07A23; color: #1A1206; text-decoration: none; font-weight: 700; font-size: 17px">Tanıtım iste</a>'
    degistir(tanitim, '<a href="#demo" style="min-height: 54px; display: flex; align-items: center; gap: 10px; padding: 0 26px; border-radius: 12px; background: #F07A23; color: #1A1206; text-decoration: none; font-weight: 700; font-size: 17px">Canlı demoyu deneyin <span aria-hidden="true">↓</span></a>\n'
              + tanitim.replace('background: #F07A23; color: #1A1206', 'border: 1px solid rgba(255,255,255,.35); color: #FFFFFF'))
    neler = '<section style="max-width: 1240px; margin: 0 auto; padding: 96px 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 44px">\n<div style="display: flex; flex-direction: column; gap: 14px; max-width: 700px">'
    degistir(neler, '<IdosDemo />\n\n' + neler)
    degistir('<figcaption style="font-size: 13px; color: #C6D2E3">Temsili görünüm, gerçek müşteri verisi içermez.</figcaption>',
             '<figcaption style="font-size: 13px; color: #C6D2E3">Temsili görünüm, gerçek müşteri verisi içermez. <a href="#demo" style="color: #FFB58A; font-weight: 600">Etkileşimli demoyu açın ↓</a></figcaption>')
    degistir('<article style="flex: 1 1 340px; min-width: 0; background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 12px">',
             "<a href=\"#demo\" class=\"idos-oz\" data-demo-git={({ '01': 'genel', '02': 'kontrol', '03': 'oneriler', '04': 'kayit', '05': 'raporlar', '06': 'portal' })[o.no]} style=\"flex: 1 1 340px; min-width: 0; background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 12px; text-decoration: none; color: inherit\">")
    degistir('<p style="margin: 0; color: var(--tx2); font-size: 15px">{o.aciklama}</p>\n</article>',
             '<p style="margin: 0; color: var(--tx2); font-size: 15px">{o.aciklama}</p>\n<span class="idos-oz-git">Demoda görün →</span>\n</a>')
    open(p, 'w', encoding='utf-8').write(s)
print('IDOS demo uygulandı')

# Hizmetler sayfası (Muhittin, 23 Eki 2026): her alanın sol sütununa temsilî görsel ve "neden önemli" açılır kutusu.
p = 'src/pages/tr/hizmetler.astro'
s = open(p, encoding='utf-8').read()
if '<HizmetAlanEk' not in s:
    eski = '<p style="margin: 0; color: var(--tx2); font-size: 17px">{g.aciklama}</p>\n'
    assert s.count(eski) == 1, 'hizmetler açıklama'
    s = s.replace(eski, eski + '<HizmetAlanEk id={g.id} />\n', 1)
    # Kartlar sol sütunun yüksekliğine uzamasın
    liste = '<ul style="flex: 2 1 560px; min-width: 0; margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 14px">'
    assert s.count(liste) == 1, 'hizmetler liste'
    s = s.replace(liste, liste.replace('gap: 14px"', 'gap: 14px; align-content: flex-start; align-self: flex-start"'), 1)
    s = s.replace("import Site from '../../layouts/Site.astro';", "import Site from '../../layouts/Site.astro';\nimport HizmetAlanEk from '../../components/HizmetAlanEk.astro';", 1)
    open(p, 'w', encoding='utf-8').write(s)
print('Hizmetler sayfası alan görselleri uygulandı')

# Panelden düzenlenen içerik (Muhittin, 23 Eki 2026): tasarımdan üretilen sayfalardaki gömülü veriler src/data/*.json'dan okunur.
import json as _json
def _blok_degistir(s, bas_metni, ac, kapa, yeni):
    """bas_metni'nden sonraki ilk `ac` ile eşleşen `kapa`ya kadar olan bloğu `yeni` ile değiştirir."""
    i = s.index(bas_metni); j = s.index(ac, i); d = 0; k = j
    while True:
        if s[k] == ac: d += 1
        elif s[k] == kapa:
            d -= 1
            if d == 0: break
        k += 1
    return s[:j] + yeni + s[k + 1:]

# Yasal sayfalar: metinler ve çerez tablosu src/data/yasal.json
for p in YASAL:
    s = open(p, encoding='utf-8').read()
    if 'yasal.json' not in s:
        s = _blok_degistir(s, 'const M = ', '{', '}', "Object.fromEntries(['kvkk', 'cerez', 'gizlilik'].map((k) => [k, { ad: yasal[k].ad, bolumler: yasal[k].bolumler.map((b) => [b.baslik, b.metin]) }]))")
        s = _blok_degistir(s, 'const cerezler = ', '[', ']', 'yasal.cerezler.map((c) => [c.ad, c.saglayici, c.tur, c.amac, c.sure])')
        s = s.replace("import Site from '../../../layouts/Site.astro';", "import Site from '../../../layouts/Site.astro';\nimport yasal from '../../../data/yasal.json';", 1)
        open(p, 'w', encoding='utf-8').write(s)
    if 'Son güncelleme: [tarih]' in s:
        s = s.replace('Son güncelleme: [tarih]', 'Son güncelleme: {yasal.guncelleme}', 1)
        open(p, 'w', encoding='utf-8').write(s)

# Paketler: katalog src/data/paketler.json (sayfa ve sihirbaz aynı veriyi kullanır)
for p, ithal in (('src/pages/tr/paketler.astro', "import PAKETLER from '../../data/paketler.json';"), ('src/scripts/paket-mantik.js', "import PAKETLER from '../data/paketler.json';")):
    s = open(p, encoding='utf-8').read()
    if 'paketler.json' not in s:
        s = _blok_degistir(s, 'katalog() {', '[', ']', 'PAKETLER')
        if p.endswith('.astro'):
            s = s.replace("import Site from '../../layouts/Site.astro';", "import Site from '../../layouts/Site.astro';\n" + ithal, 1)
        else:
            s = ithal + '\n' + s
        open(p, 'w', encoding='utf-8').write(s)

# Ana sayfa referansları: src/data/referanslar.json (liste boşsa bölüm görünmez)
p = 'src/pages/index.astro'
s = open(p, encoding='utf-8').read()
if 'referanslar.json' not in s:
    assert s.count('const markaListesi = __v.markaListesi;') == 1 and s.count('const referansGoster = __v.referansGoster;') == 1
    s = s.replace('const markaListesi = __v.markaListesi;', 'const markaListesi = referanslar.filter((r) => r.ad);', 1)
    s = s.replace('const referansGoster = __v.referansGoster;', 'const referansGoster = markaListesi.length > 0;', 1)
    eski = '<span style="font-weight: 700; color: var(--head)">{marka.ad}</span>'
    assert s.count(eski) == 1, 'referans öğesi'
    s = s.replace(eski, '{marka.logo ? <img src={marka.logo} alt={marka.ad} loading="lazy" style="max-height: 56px; max-width: 100%; object-fit: contain" /> : <span style="font-weight: 700; color: var(--head)">{marka.ad}</span>}', 1)
    s = s.replace("import Site from '../layouts/Site.astro';", "import Site from '../layouts/Site.astro';\nimport referanslar from '../data/referanslar.json';", 1)
    open(p, 'w', encoding='utf-8').write(s)
print('panelden düzenlenen içerik bağlandı')
