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
