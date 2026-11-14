# idexya-ortak — Idexya projelerinin ortak ajan sözleşmesi

Üç depoda birebir aynı olan kurallar yalnız burada yazılır: ajan çalışma biçimi, güvenlik çekirdeği,
ürün ilkeleri ve Türkçe yazım çekirdeği. Bir kural üç yere kopyalanırsa üç ayrı yerde eskir; bu depo
onu tek yerde tutar.

Oluşturuldu: 3 Kas 2026, Muhittin'in onayıyla.

## Bağlı depolar

| Depo | Ne | Ortak kopya |
|---|---|---|
| `muhittinkulcu/idexya-agency-os` (IDOS) | Ajans operasyon paneli | `docs/ortak/` |
| `muhittinkulcu/idexya-creative-os` (ICOS) | Kreatif içerik paneli | `docs/ortak/` |
| `idexya-ai.os` | Henüz boş | — |

## Dosyalar

| Dosya | İçerik |
|---|---|
| `ajan-sozlesmesi.md` | Çalışma biçimleri, onay sınırları, rapor ve devir biçimi, iş durumu sözlüğü |
| `guvenlik-cekirdegi.md` | Üç projede de değişmeyen güvenlik kuralları |
| `urun-ilkeleri.md` | Her ekranda, raporda ve yapay zekâ metninde geçerli ilkeler |
| `yazim-cekirdegi.md` | TDK Türkçe yazım, proje-bağımsız çekirdek |
| `arayuz-kabugu.md` | Üç ürünün ortak arayüz iskeleti, renkleri ve parçaları |
| `kabuk/` | Ortak arayüz kabuğu bileşeni `<idexya-kabuk>` (JS + CSS); kullanım: `kabuk/README.md` |

## Nasıl kullanılır

Her proje bu dosyaların bir kopyasını `docs/ortak/` altında taşır ve kendi `AGENTS.md` dosyasından ona
atıf yapar. Kopya elle düzenlenmez; kural burada değişir, sonra projeye eşitlenir:

```bash
scripts/ortak_esitle.sh          # projede koşar, docs/ortak/ içeriğini bu depodan tazeler
scripts/ortak_esitle.sh --kontrol  # yalnız fark var mı bakar, dosyaya dokunmaz
```

Kabuk (`kabuk/`) yalnız kökünde `.idexya-kabuk-hedef` dosyası olan projeye kopyalanır; dosyanın ilk
satırı hedef klasördür (ör. `public/kabuk`). Ayrıntı: `kabuk/README.md`.

Sembolik bağlantı kullanılmaz: bulut oturumu depoyu tek başına klonlar, kardeş klasör orada yoktur.
Bu yüzden kopya depoya girer — `app/static/idos/` derleme çıktısının depoya girmesiyle aynı gerekçe.

## Sınır

Bu depo **yeni kural koymaz.** Buradaki her madde, kendi projesinde Muhittin tarafından onaylanmış bir
kuralın ortak hale getirilmiş özetidir; kaynağı maddenin yanında yazılıdır. Yeni kalıcı kural önce
ilgili projede onaylanır, üç projede de geçerliyse sonra buraya taşınır.

Bu depoyu değiştiren iş, projelerdeki ajan talimatı değişikliğiyle aynı sayılır: Muhittin'in onayı
olmadan bağlı depolara eşitlenmez.
