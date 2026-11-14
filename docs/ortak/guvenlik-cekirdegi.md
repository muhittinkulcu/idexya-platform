# Güvenlik çekirdeği (ortak, değişmez)

Kaynak: IDOS `AGENTS.md` 6. bölümü ve `docs/15-guvenlik-standardi.md`; ICOS `README.md` temel kuralları.
Bu maddeler üç projede de aynıdır ve ajan tarafından gevşetilemez. Projeye özgü ek kısıt, projenin
kendi belgesinde durur ve her zaman **eklenir**, hiçbir zaman buradakini hafifletmez.

## 1. Yürütme anahtarı kapalı kalır

Canlı yazma yetkisini açan ortam değişkenleri varsayılan olarak kapalıdır ve **yalnız Muhittin elle**
değiştirir. Hiçbir ajan ya da rutin bunu değiştirmez, değiştirmeyi önermez, geçici açmaz.

| Proje | Anahtar |
|---|---|
| IDOS | `ACTION_EXECUTION_ENABLED`, `SOCIAL_MCP_WRITES_ENABLED` |
| IDOS (e-posta) | `CLIENT_EMAIL_ENABLED` |
| ICOS | `PUBLISH_ENABLED` |

## 2. Onaysız gönderim yok

`info@idexya.com` dışındaki herkese giden her e-posta, bildirim ve mesaj onay kuyruğuna düşer; süper
admin tek tek "Gönder" der. **Kuyruğa yazılamazsa gönderilmez.** Sohbet asistanı yalnız taslak yazar,
gönderen insandır. Tek otomatik gönderim istisnası: IDOS'ta 08.00 özeti → `info@idexya.com`.

## 3. Ön yüz canlı hesaba yazmaz

Canlı reklam hesabına ya da sosyal hesaba değişiklik yalnız onay akışından ve süper admin onayıyla
gider. Ön yüzden doğrudan yazma yolu açılmaz.

## 4. Müşteri ve marka ayrımı

Bir müşterinin ya da markanın verisi, dosyası, şablonu başka müşteriye, markaya, rapora ya da yetkisiz
kullanıcıya görünmez ve orada kullanılmaz. Kişisel veri en az düzeyde tutulur; yapay zekâ
sağlayıcısına maskelenerek gider.

## 5. Veri asgarisi

Şu veriler projelerde **hiç tutulmaz:** TCKN, şahıs VKN, kart bilgisi, IBAN, şifre, KVKK'nın özel
nitelikli saydığı veriler. Gerekli göründüğü an iş durur ve Muhittin'e sorulur.

## 6. Sırlar yazılmaz

Anahtar, parola, jeton; dosyaya, commit'e, PR'a, günlüğe, ekran görüntüsüne ve sohbete yazılmaz.
Gerekirse yalnız değişken **adı** yazılır. Okunamayan bir sır tahmin edilmez: gerçek bir çağrıyla
doğrulanır ya da "doğrulanamadı" denir.

## 7. Güvenlik yolları etiket ister

Kimlik, rol, oturum, yürütme, CI, sırlar, herkese açık uçlar, dağıtım yapılandırması ve **ajan talimat
dosyaları** (`AGENTS.md`, `CLAUDE.md`, beceri klasörleri, rutin talimatları) listesindeki bir dosyayı
değiştiren PR, Muhittin `guvenlik-onay` etiketini koymadan birleştirilmez — CI yeşil olsa bile.
Etiketten sonra yapılan push etiketi düşürür; etiketli PR'a push yapılmaz.

## 8. Dal ve test disiplini

- `main`'e doğrudan push yok. Başkasının dalında rebase, amend ya da force push yok.
- Test atlatılmaz, kapatılmaz, susturulmaz. CI'ı tetiklemek için boş commit ya da PR kapatıp açma yok.
- CI çalışmıyorsa birleştirme yapılmaz; yerelde yeşil olması yetmez.
- `pytest ... | tail` gibi zincirler kırmızıyı gizler: çıkış kodu ya da `FAILED` satırları okunur.

## 9. Onaylanan dosya = yayınlanan dosya

Onaya giren içerik SHA-256 ile çıpalanır. Dosya onaydan sonra değişirse onay geçersizdir ve yayın
durur. (Kaynağı ICOS; aynı ilke IDOS'un onay kuyruğundaki ekler için de geçerlidir.)
