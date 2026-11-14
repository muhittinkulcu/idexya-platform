#!/usr/bin/env bash
# idexya-ortak kurallarını bu depodaki docs/ortak/ kopyasına, ortak arayüz kabuğunu da projenin
# kabuk klasörüne eşitler.
#
#   scripts/ortak_esitle.sh            kopyayı tazeler
#   scripts/ortak_esitle.sh --kontrol  yalnız fark var mı bakar, dosyaya dokunmaz
#
# Kaynak depo sırayla aranır: $IDEXYA_ORTAK, ~/ai_projects/idexya-ortak.
# Bulut oturumunda kaynak depo yoktur; orada depodaki kopya zaten geçerlidir, betik koşulmaz.
#
# Kabuk (<idexya-kabuk>): projenin kökünde `.idexya-kabuk-hedef` dosyası varsa, ilk satırındaki klasöre
# (depo köküne göre, ör. `public/kabuk`) kabuk.js, kabuk-cekirdek.js, kabuk.css, katmanlar.json ve README.md kopyalanır.
# Dosya yoksa kabuk eşitlenmez. Demo ve testler projeye gitmez.
set -euo pipefail

DOSYALAR=(README.md ajan-sozlesmesi.md guvenlik-cekirdegi.md urun-ilkeleri.md yazim-cekirdegi.md arayuz-kabugu.md)
KABUK_DOSYALAR=(kabuk.js kabuk-cekirdek.js kabuk.css katmanlar.json README.md)
KOK="$(git rev-parse --show-toplevel)"
KONTROL=0
[[ "${1:-}" == "--kontrol" ]] && KONTROL=1

KAYNAK="${IDEXYA_ORTAK:-$HOME/ai_projects/idexya-ortak}"
if [[ ! -d "$KAYNAK" ]]; then
  echo "ortak_esitle: kaynak depo bulunamadı ($KAYNAK)."
  echo "Bulut oturumundaysan bu normaldir: docs/ortak/ içindeki kopya geçerlidir, eşitleme gerekmez."
  echo "Yereldeysen depoyu klonla: git clone git@github.com:muhittinkulcu/idexya-ortak.git \"$KAYNAK\""
  exit 2
fi

FARK=0
# esitle <kaynak klasör> <hedef klasör> <görünen ad> <dosya...>
esitle() {
  local kaynak="$1" hedef="$2" ad="$3" d
  shift 3
  for d in "$@"; do
    [[ -f "$kaynak/$d" ]] || { echo "ortak_esitle: kaynakta eksik dosya: $kaynak/$d"; exit 2; }
  done
  (( KONTROL )) || mkdir -p "$hedef"
  for d in "$@"; do
    if ! cmp -s "$kaynak/$d" "$hedef/$d"; then
      FARK=1
      if (( KONTROL )); then
        echo "fark: $ad/$d"
      else
        cp "$kaynak/$d" "$hedef/$d"
        echo "tazelendi: $ad/$d"
      fi
    fi
  done
}

esitle "$KAYNAK" "$KOK/docs/ortak" "docs/ortak" "${DOSYALAR[@]}"

KABUK_AD=""
if [[ -f "$KOK/.idexya-kabuk-hedef" ]]; then
  KABUK_AD="$(head -n 1 "$KOK/.idexya-kabuk-hedef" | tr -d '[:space:]')"
  case "$KABUK_AD" in
    ""|/*|*..*) echo "ortak_esitle: .idexya-kabuk-hedef geçersiz (depo köküne göre göreli bir klasör yaz)"; exit 2 ;;
  esac
  esitle "$KAYNAK/kabuk" "$KOK/$KABUK_AD" "$KABUK_AD" "${KABUK_DOSYALAR[@]}"
fi

OZET="docs/ortak/ (${#DOSYALAR[@]} dosya)"
[[ -n "$KABUK_AD" ]] && OZET="$OZET ve $KABUK_AD/ (${#KABUK_DOSYALAR[@]} dosya)"

if (( KONTROL )); then
  if (( FARK )); then
    echo
    echo "Ortak kopya idexya-ortak deposundan geride. Eşitlemek için: scripts/ortak_esitle.sh"
    exit 1
  fi
  echo "$OZET güncel."
  exit 0
fi

(( FARK )) || echo "$OZET zaten güncel."
echo "Kopya elle düzenlenmez: kural ve kabuk idexya-ortak deposunda değişir, sonra buraya eşitlenir."
