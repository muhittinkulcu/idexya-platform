"""Dönüşümden sonra sayfaya özgü küçük düzeltmeler."""
import re
YASAL = {'KVKK aydınlatma metni': '/tr/sayfa/kvkk-aydinlatma-metni', 'Çerez politikası': '/tr/sayfa/cerez-politikasi', 'Gizlilik politikası': '/tr/sayfa/gizlilik-politikasi'}
for d in YASAL.values():
    p = 'src/pages' + d + '.astro'
    s = open(p, encoding='utf-8').read()
    eski = '<button type="button" role="tab" aria-selected={String(t.secili)} style={t.stil}>{t.ad}</button>'
    assert eski in s, p
    s = s.replace(eski, '<a href={({' + ', '.join(f"'{k}': '{v}'" for k, v in YASAL.items()) + '})[t.ad]} aria-current={t.secili ? \'page\' : undefined} style={t.stil + \'; display: inline-flex; align-items: center; text-decoration: none\'}>{t.ad}</a>')
    s = s.replace('role="tablist"', 'role="navigation"')
    open(p, 'w', encoding='utf-8').write(s)
p = 'src/pages/tr/paketler.astro'
s = open(p, encoding='utf-8').read()
a = '<a href="#teklif" style={k.dugmeStil}>Teklif al</a>'
assert a in s, 'paket düğmesi'
s = s.replace(a, '<a href="#teklif" data-paket={g.birlesik ? k.ad : g.ad + ' + "' · '" + ' + k.ad} style={k.dugmeStil}>Teklif al</a>')
a = '>{seciliPaketAdi}</span>'
assert a in s
s = s.replace(a, ' id="secili-paket" aria-live="polite">{seciliPaketAdi}</span>')
s = s.replace('</Site>', '<script>\n  import { sihirbazBaslat } from \'../../scripts/sihirbaz.js\';\n  sihirbazBaslat();\n</script>\n</Site>')
open(p, 'w', encoding='utf-8').write(s)
print('son işlem tamam')

# Site formları: sunucuya bağla (src/scripts/form.js), tuzak alan ve durum satırı ekle, KVKK bağlantısını düzelt.
FORMLAR = {'src/pages/index.astro': 'analiz', 'src/pages/tr/iletisim.astro': 'iletisim', 'src/pages/tr/paketler.astro': 'paket'}
TUZAK = '<label aria-hidden="true" style="position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden">Bu alanı boş bırakın<input type="text" name="web_adresi_tekrar" tabindex="-1" autocomplete="off"></label>\n'
DURUM = '<p data-form-durum role="status" aria-live="polite" hidden style="flex: 1 1 100%; margin: 0; padding: 12px 14px; border-radius: 10px; font-size: 15px"></p>\n'
for p, kaynak in FORMLAR.items():
    s = open(p, encoding='utf-8').read()
    assert s.count('<form style=') == 1, p
    s = s.replace('<form style=', f'<form data-talep="{kaynak}" novalidate style=')
    s = re.sub(r'<a href="#[a-z]+">KVKK aydınlatma metnini</a>', '<a href="/tr/sayfa/kvkk-aydinlatma-metni" target="_blank" rel="noopener">KVKK aydınlatma metnini</a>', s)
    i = s.index('<button type="submit"')
    s = s[:i] + TUZAK + '<div data-turnstile style="flex: 1 1 100%"></div>\n' + DURUM + s[i:]
    open(p, 'w', encoding='utf-8').write(s)
print('formlar bağlandı')
