#!/usr/bin/env python3
"""Tasarım (.dc.html) dosyasını Astro sayfasına çevirir.

Kullanım: python3 tools/dc2astro.py <tasarim.dc.html> <cikti.astro> [--aktif Hizmetler] [--baslik "..."] [--aciklama "..."]

- Gövde: tasarımdaki </header> ile <footer arasındaki bölüm (üst menü ve alt kısım ortak yerleşimden gelir).
- Veri: tasarımın Component sınıfı derleme anında çalıştırılır; renderVals() değerleri şablona verilir.
- sc-for / sc-if Astro ifadelerine çevrilir; onClick işleyicileri kaldırılır (etkileşim istemci betikleriyle eklenir).
- X.dc.html bağlantıları gerçek adreslere çevrilir (ROTALAR).
"""
import re, sys, json, argparse

ROTALAR = {
    'Main.dc.html': '/', 'Hizmetler.dc.html': '/tr/hizmetler', 'HizmetDetay.dc.html': '/tr/hizmet/google-ads-yonetimi',
    'Paketler.dc.html': '/tr/paketler', 'Referanslar.dc.html': '/tr/referanslar', 'ProjeDetay.dc.html': '/tr/proje/marco-polo-chocolate',
    'Idos.dc.html': '/tr/idos', 'Iletisim.dc.html': '/tr/iletisim', 'Hakkimizda.dc.html': '/tr/sayfa/hakkimizda',
    'Blog.dc.html': '/tr/haberler', 'BlogYazi.dc.html': '/tr/haber/ornek-yazi', 'Yasal.dc.html': '/tr/sayfa/kvkk-aydinlatma-metni',
    'TeklifOnay.dc.html': '/tr/teklif/ornek',
}

DELIK = re.compile(r'\{\{\s*([^{}]+?)\s*\}\}')


def rota(href):
    m = re.match(r'^([A-Za-z]+\.dc\.html)(#.*)?$', href)
    if not m:
        return href
    return ROTALAR.get(m.group(1), '/') + (m.group(2) or '')


def oznitelik_cevir(etiket):
    """Bir açılış etiketinin özniteliklerini Astro biçimine çevirir."""
    # onClick vb. işleyicileri kaldır
    etiket = re.sub(r'\s+on[A-Z][a-zA-Z]*="\{\{[^"]*\}\}"', '', etiket)

    def tek(m):
        ad, deger = m.group(1), m.group(2)
        if ad == 'href':
            deger = rota(deger)
        if '{{' not in deger:
            return f' {ad}="{deger}"'
        tam = DELIK.fullmatch(deger)
        if tam:
            ifade = tam.group(1)
            if ad.startswith('aria-'):
                return f' {ad}={{String({ifade})}}'
            return f' {ad}={{{ifade}}}'
        # karışık metin: şablon dizgesi
        sablon = DELIK.sub(lambda q: '${' + q.group(1) + '}', deger.replace('`', '\\`'))
        return f' {ad}={{`{sablon}`}}'
    return re.sub(r'\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="([^"]*)"', tek, etiket)


def govde_cevir(html):
    # sc-for / sc-if için yığın tabanlı dönüşüm
    out, i = [], 0
    jeton = re.compile(r'<sc-for\s+list="\{\{\s*([^}]+?)\s*\}\}"\s+as="([a-zA-Z_]\w*)"[^>]*>|<sc-if\s+value="\{\{\s*([^}]+?)\s*\}\}"[^>]*>|</sc-for>|</sc-if>|<[a-zA-Z][^<>]*>')
    for m in jeton.finditer(html):
        metin = html[i:m.start()]
        out.append(DELIK.sub(lambda q: '{' + q.group(1) + '}', metin))
        t = m.group(0)
        if t.startswith('<sc-for'):
            out.append('{(' + m.group(1).strip() + ' || []).map((' + m.group(2) + ') => (<Fragment>')
        elif t.startswith('<sc-if'):
            out.append('{(' + m.group(3).strip() + ') && (<Fragment>')
        elif t == '</sc-for>':
            out.append('</Fragment>))}')
        elif t == '</sc-if>':
            out.append('</Fragment>)}')
        else:
            out.append(oznitelik_cevir(t))
        i = m.end()
    out.append(DELIK.sub(lambda q: '{' + q.group(1) + '}', html[i:]))
    return ''.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('kaynak'); ap.add_argument('cikti')
    ap.add_argument('--aktif', default=''); ap.add_argument('--baslik', default=''); ap.add_argument('--aciklama', default='')
    ap.add_argument('--kok', default='../layouts/Site.astro'); ap.add_argument('--ekyok', action='store_true'); ap.add_argument('--durum', default='{}'); ap.add_argument('--suzgec', action='append', default=[]); ap.add_argument('--bag', action='append', default=[])
    a = ap.parse_args()
    s = open(a.kaynak, encoding='utf-8').read()
    b = s.index('</header>') + len('</header>')
    f = s.index('<footer')
    govde = s[b:f]
    # tasarım betiği sonrası eklenen çerez penceresi gibi bölümler footer'dan sonra olabilir
    son = s.index('</footer>') + len('</footer>')
    kapanis = s.rfind('</div>\n</x-dc>')
    ek = s[son:kapanis] if kapanis > son else ''
    tum = govde if a.ekyok else govde + ek
    tek_parantez = re.sub(r'\{\{[^{}]*\}\}', '', tum)
    if re.search(r'[{}]', tek_parantez):
        print('UYARI: tasarımda tekil süslü parantez var', file=sys.stderr)
    betik = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>(.*?)</script>', s, re.S).group(1)
    dongu = set(re.findall(r'\sas="([a-zA-Z_]\w*)"', tum))
    adlar = sorted(set(re.findall(r'\{\{\s*([a-zA-Z_]\w*)', tum)) - {'true', 'false'} - dongu)
    on = (
        "---\n"
        f"import Site from '{a.kok}';\n"
        "// Tasarım verisi derleme anında üretilir (tools/dc2astro.py).\n"
        "class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState() {} }\n"
        + betik.strip() + "\n"
        "const __c = new Component({}); Object.assign(__c.state, " + a.durum + ");\nconst __v = __c.renderVals();\n"
        "const __slug = (t) => String(t).toLocaleLowerCase('tr-TR').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');\n"
        "const __suz = (anahtar, degerler, liste) => degerler.map((d, i) => { const al = (x) => { const c = new Component({}); c.state[anahtar] = x; return c.renderVals()[liste][i].stil; }; return { deger: d, sec: al(d), nor: al(degerler.find((x) => x !== d)) }; });\n"
        + ''.join(f"const {n} = __v.{n};\n" for n in adlar)
        + "---\n"
    )

    sonuc = govde_cevir(tum)
    ek_on = ''
    for k, tanim in enumerate(a.suzgec):
        o = dict(x.split('=', 1) for x in tanim.split(','))
        degerler = o['degerler'].split('|')
        ek_on += f"const __sz{k} = __suz('{o['anahtar']}', {json.dumps(degerler)}, '{o['liste']}');\n"
        bas = '{(' + o['liste'] + ' || []).map(('
        i = sonuc.index(bas)
        j = sonuc.index(') => (<Fragment>', i)
        var = sonuc[i + len(bas):j]
        sonuc = sonuc[:j] + ', __i' + sonuc[j:]
        t = sonuc.index('<', sonuc.index('<Fragment>', i) + 10)
        te = re.match(r'<[a-zA-Z]+', sonuc[t:]).end() + t
        sonuc = sonuc[:te] + f' data-grup="{o["grup"]}" data-deger={{__sz{k}[__i].deger}} data-sec-stil={{__sz{k}[__i].sec}} data-normal-stil={{__sz{k}[__i].nor}}' + sonuc[te:]
        bas2 = '{(' + o['icerik'] + ' || []).map(('
        i2 = sonuc.index(bas2)
        v2 = sonuc[i2 + len(bas2):sonuc.index(') => (', i2)]
        t2 = sonuc.index('<', sonuc.index('<Fragment>', i2) + 10)
        te2 = re.match(r'<[a-zA-Z]+', sonuc[t2:]).end() + t2
        sonuc = sonuc[:te2] + f' data-grup-icerik="{o["grup"]}" data-etiket={{{v2}.{o["etiket"]}}}' + sonuc[te2:]
    for tanim in a.bag:
        liste, onek, alan = tanim.split(':')
        bas = '{(' + liste + ' || []).map(('
        i = sonuc.index(bas)
        v = sonuc[i + len(bas):sonuc.index(') => (', i)].split(',')[0]
        h = sonuc.index('href="', i)
        he = sonuc.index('"', h + 6)
        sonuc = sonuc[:h] + 'href={`' + onek + '${__slug(' + v + '.' + alan + ')}`}' + sonuc[he + 1:]
    on = on.replace('---\n<', '---\n<')  # yer tutucu
    on = on[:-4] + ek_on + '---\n'
    ust = f'<Site baslik={json.dumps(a.baslik, ensure_ascii=False)} aciklama={json.dumps(a.aciklama, ensure_ascii=False)} aktif="{a.aktif}">\n'
    open(a.cikti, 'w', encoding='utf-8').write(on + ust + sonuc + '\n</Site>\n')
    print('yazıldı', a.cikti, len(adlar), 'değişken')


if __name__ == '__main__':
    main()
