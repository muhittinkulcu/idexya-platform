# Türkçe yazım çekirdeği (ortak, TDK)

Kaynak: IDOS `docs/yazim-kilavuzu.md` (Muhittin'in kararı, 7 Eki 2026). Burada yalnız **proje-bağımsız
çekirdek** durur. IDOS'ta tam liste, kalıcı sözlük ve denetim betiği kendi kılavuzundadır ve çelişkide
**o kazanır.** Kapsam: arayüz, PDF rapor, e-posta, sunucuda üretilen uyarı ve öneri metinleri, yapay
zekâ metinleri.

## Büyük harf

- **Etiket, düğme, başlık, sekme, süzgeç değeri, durum etiketi:** yalnız ilk harf büyük.
  "Tüm müşteriler", "Toplu düzenle", "Son 30 gün".
- **Özel adlar kendi yazımıyla:** Meta Ads, Google Ads, GA4, Search Console, Tag Manager, Instagram,
  Canva, Idexya, IDOS, ICOS. Kısaltmalar büyük kalır: CTR, CPC, CPM, ROAS, CPA, TL, PDF, CRM, SHA-256.
- **Ürün sayfa adları özel ad değildir:** cümle içinde küçük ve kesmesiz ("müşteri detayında").
  Gezinme yolunda her adım büyük harfle başlar ("Müşteri detayı > Detaylar").
- **"Etiket: Değer" satırında** ve " · " ile ayrılan bölümlerde her bölüm büyük harfle başlar.

## Sayı, para, yüzde

- **Ondalık virgül, binlik nokta:** 1.234,56 · %0,65 · 1,35x.
- Ekrana giden sayı `toFixed()` ile yazılmaz (nokta üretir); projenin biçimleyici yardımcısı kullanılır.
- **Yüzde işareti sayıdan önce:** %20.
- **Para sayıdan sonra "TL":** "1.234 TL", kuruşlu "59,70 TL". "₺" öneki ve `currency: 'TRY'` biçimi
  kullanılmaz.

## Tarih ve saat

- Tarih **07.10.2026**; aralık **07.09 – 06.10.2026** (yıl tekrar edilmez, uzun tire ve boşluk).
- Saat **08.00** — TDK saat ile dakika arasında nokta kullanır; "08:00" yazılmaz.
- Gün ve ay adları tarihle birlikte büyük ("7 Ekim 2026 Salı"), tek başına küçük ("her pazartesi").

## Noktalama ve ekler

- İki noktadan sonra **her zaman bir boşluk.** Devamında tam cümle yoksa küçük harf.
- **Özel ada gelen ek kesmeyle ayrılır:** Meta'nın, Google'da, GA4'te, Idexya'nın.
- Özel ad olmayan sözcüğe kesme konmaz ("müşteri detayında").
- **"de/da" ve "ki" bağlaçları ayrı yazılır:** "rapor da hazır", "bilinmeli ki".
- **Yer tutucu ve süren iş tek karakterli "…" ile biter:** "Yükleniyor…", "Müşteri ara…".
  Üç ayrı nokta ("...") yazılmaz.

## İngilizce sözcük yok

Türkçe cümlede İngilizce sözcük kullanılmaz. Karşılığı olmayan teknik ad özel ad sayılır ve kendi
yazımıyla kalır (Performance Max, Audience Network). Projenin kalıcı sözlüğü bağlayıcıdır.

## Veri değerleri değiştirilmez

API ya da veritabanından gelen durum ve tür adları ("Geri Alındı", "Satın Alma") kodda
karşılaştırıldığı için dizgede değiştirilmez; denetim bunları kaynaktan türeterek muaf tutar.
Ekranda farklı görünmesi gerekiyorsa ayrı bir görüntü eşlemesi yazılır.
