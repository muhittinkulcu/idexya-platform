#!/bin/sh
# Tüm kamu sayfalarını tasarım dosyalarından yeniden üretir. Kullanım: sh tools/donustur.sh
set -e
C="python3 tools/dc2astro.py"
node tools/veri.mjs
$C design/Main.dc.html src/pages/index.astro --kok ../layouts/Site.astro --ekyok --props '{"referansGoster":false}' --aciklama "Google Ads, Meta reklamları, e-ticaret, SEO ve yazılımı tek ekipte yöneten 360° dijital performans ajansı. Ücretsiz analiz isteyin."
$C design/Hizmetler.dc.html src/pages/tr/hizmetler.astro --kok ../../layouts/Site.astro --aktif Hizmetler --baslik "Hizmetler" --aciklama "E-ticaret, dijital reklam, SEO, web ve yazılım, tasarım ve içerik: 27 hizmet, tek ekip." --bag "g.hizmetler:/tr/hizmet/:slug"
$C design/Paketler.dc.html src/pages/tr/paketler.astro --kok ../../layouts/Site.astro --aktif Paketler --baslik "Paketler" --aciklama "Google Ads, Meta, SEO, e-ticaret ve web sitesi paketleri; size uygun paketi birkaç soruda bulun." --suzgec "liste=filtreler,anahtar=filtre,degerler=tumu|reklam|birlesik|web|eticaret|pazaryeri|seo|icerik,icerik=gorunenGruplar,etiket=tur,grup=paket"
$C design/Idos.dc.html src/pages/tr/idos.astro --kok ../../layouts/Site.astro --aktif IDOS --baslik "IDOS" --aciklama "Tüm reklam hesaplarınız, raporlarınız ve onaylı değişiklikler tek panelde."
$C design/Iletisim.dc.html src/pages/tr/iletisim.astro --kok ../../layouts/Site.astro --aktif "İletişim" --baslik "İletişim" --aciklama "Ücretsiz analiz isteyin; telefon, WhatsApp veya e-postayla ulaşın."
$C design/Hakkimizda.dc.html src/pages/tr/sayfa/hakkimizda.astro --kok ../../../layouts/Site.astro --aktif "Hakkımızda" --baslik "Hakkımızda" --aciklama "10 yılı aşkın e-ticaret ve dijital pazarlama deneyimi."
# Blog listesi elle yazıldı (yalnız gerçek yazılar); örnek yazı şablonu yayında yok (Muhittin, 22 Eki 2026).
# $C design/Blog.dc.html src/pages/tr/haberler.astro --kok ../../layouts/Site.astro --aktif Blog --baslik "Blog" --aciklama "Reklam, e-ticaret ve ölçüm üzerine notlar." --suzgec "liste=kategoriler,anahtar=kat,degerler=tumu|reklam|eticaret|olcum|seo|idos,icerik=yazilar,etiket=anahtar,grup=blog"
$C design/HizmetDetay.dc.html src/pages/tr/hizmet/google-ads-yonetimi.astro --kok ../../../layouts/Site.astro --aktif Hizmetler --baslik "Google Ads yönetimi" --aciklama "Google aramalarında, alışverişte ve YouTube’da satışa odaklı reklam yönetimi."
# $C design/BlogYazi.dc.html src/pages/tr/haber/ornek-yazi.astro --kok ../../../layouts/Site.astro --aktif Blog --baslik "Blog yazısı şablonu"
for x in kvkk:kvkk-aydinlatma-metni:"KVKK aydınlatma metni" cerez:cerez-politikasi:"Çerez politikası" gizlilik:gizlilik-politikasi:"Gizlilik politikası"; do
  k=$(echo "$x" | cut -d: -f1); d=$(echo "$x" | cut -d: -f2); b=$(echo "$x" | cut -d: -f3)
  $C design/Yasal.dc.html src/pages/tr/sayfa/$d.astro --kok ../../../layouts/Site.astro --baslik "$b" --durum "{\"sekme\":\"$k\"}"
done
python3 tools/sonislem.py
