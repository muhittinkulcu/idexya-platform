Şimdilik yayında olmayan sayfalar (Referanslar ve proje detayları) (Muhittin, 19 Eki 2026). `src/pages` dışında oldukları için derlenmezler.
Geri açmak için: dosyaları `src/pages/tr/` altına geri taşı, `tools/donustur.sh` içindeki "GİZLİ" satırlarının başındaki
yorumu kaldır, ana sayfa için `--props '{"referansGoster":false}'` değerini kaldır, `public/_redirects` içindeki geçici
yönlendirmeleri sil ve `src/layouts/Site.astro` menüsüne bağlantıları ekle.
