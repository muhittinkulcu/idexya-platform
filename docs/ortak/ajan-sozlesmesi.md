# Ajan çalışma sözleşmesi (ortak)

Kaynak: IDOS `AGENTS.md` 4., 5., 10. ve 11. bölümleri. Üç projede de geçerlidir.
Projeye özgü ek kural, projenin kendi `AGENTS.md` dosyasında durur ve çelişkide **o kazanır.**

## 1. Çalışma biçimleri

Her görev bu üç biçimden biridir. Biçim belli değilse istek metninden çıkarılır; "incele",
"değerlendir", "öneri ver", "ne düşünüyorsun" **inceleme** demektir.

| | İnceleme | Uygulama | Otonom rutin |
|---|---|---|---|
| Dosya okuma, salt okuma sorgusu | ✅ | ✅ | ✅ |
| Dosya değiştirme | ❌ | ✅ görev kapsamında | ✅ yalnız iş listesindeki madde için |
| Dalda commit ve push | ❌ | ✅ | ✅ yalnız kendi dal önekinde |
| PR açma | ❌ | ✅ | ✅ |
| `main`'e birleştirme | ❌ | Muhittin'in açık "birleştir" onayıyla | ❌ |
| İlgisiz işe kendiliğinden geçme | ❌ | ❌ | ❌ |
| Canlı hesaba yazma, dış gönderim | ❌ | ❌ | ❌ |

- **Uygulama:** verilen görev bitirilir ve doğrulanır, sonra durulur ve raporlanır. Arka plan işi
  (CI, test) beklenirken aynı görevin kalan parçalarında çalışılır; ilgisiz backlog maddesine geçilmez.
- **Otonom rutin:** yalnız kendi talimatındaki iş listesiyle, süre ve maliyet sınırıyla, durma koşuluyla
  çalışır. Liste boşsa hiçbir şey yapmaz, commit ve PR açmaz, tek cümleyle biter.

## 2. Karar ve onay

**Kendin karar ver ve ilerle:** geri alınabilir, kapsamı belli teknik tercihler — kod yapısı, test,
adlandırma, bileşen seçimi, belge düzeni. Teknik ya da A/B sorusu sorulmaz.

**Önce sor ve onay al:**

- para harcama, ücretli servis veya plan;
- yeni anahtar, izin, erişim, kimlik bilgisi;
- müşteri ya da marka verisi, kişisel veri (KVKK), müşteri/marka ayrımı;
- dışarıya gönderim: e-posta, bildirim, mesaj;
- canlı sistem: reklam hesabı, yayın, `main`'e birleştirme, zamanlanmış görev, dağıtım ayarı;
- veri silme, üzerine yazma, geri dönüşü zor toplu işlem;
- iş hedefi belirsizse ya da yalnız Muhittin'in bilebileceği bilgi gerekiyorsa.

**Yeni ekran veya modül:** önce çizim (ekran + akış) ve Muhittin'in onayı, sonra inşaat. Değişiklik
istekleri listeye girer; işin ortasında yön değiştirilmez.

**Onay isterken** kısa ön kontrol özeti verilir: kapsam, mevcut durum, yapılacak iş, beklenen etki,
risk, doğrulama yolu, geri dönüş yolu. Yalnız gerçekten eksik olan bilgi sorulur. **Verilmiş ve hâlâ
geçerli bir onay tekrar istenmez.** Gün içinde biriken sorular günde bir kez, tek listede toplanır.

## 3. İş durumu sözlüğü

`planlandı → geliştiriliyor → incelemede (PR açık) → birleştirildi → canlıda → kullanımda doğrulandı`

"Kod yazıldı" ile "kullanıcı kullanabildi" karıştırılmaz. Engelli iş `engelli` yazılır ve engeli
(kimden ne bekleniyor) belirtilir. Ajan bir durumu varsayımla ileri almaz.

## 4. Rapor ve devir

Her görev sonunda ve iki ajan arasında iş devrinde şunlar yazılır:

- dal ve son commit;
- değişen dosyalar ya da alanlar;
- çalıştırılan kontroller ve sonuçları, **sayıyla**;
- çalıştırılmayan kontroller ve nedeni;
- açık sorun, engel ve sıradaki adım;
- Muhittin'den gereken (yoksa "yok").

**Çalıştırılmayan bir kontrol ya da yapılmayan bir inceleme yapılmış gibi raporlanmaz.**
İki ajan aynı dalda habersiz çalışmaz; devralan ajan önce `git fetch` ile dalın son durumunu okur.
Oturum sonunda gönderilmemiş commit kalmaz: `git rev-list origin/<dal>..<dal>` boş olmalı.

PR açıklamaları ve commit mesajları Türkçe yazılır; model adı yazılmaz.
