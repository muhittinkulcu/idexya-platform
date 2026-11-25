// Mega menünün önizleme kartı (ortak kabuk "Mega menü"; Muhittin, 25 Kas 2026): Website ve CRM sayfalarında panelin kendi genel bakış
// özetinden sayılar. Salt okuma, var olan uç (`ozet`); üstte müşteri seçiliyse CRM sayılarını sunucu süzer. Kişi adı, e-posta ve mesaj
// karta girmez. Öteki modüllerin sayfalarında kart ad, açıklama ve bölümün öteki sayfalarıyla kalır. Okunamayan sayı yazılmaz.
import { api, asamaAdi, para, yol, panelYolu } from './ortak.js';
import { musteriDegisince, seciliMusteri, suzulmusYol } from './musteri-suzgec.js';

const say = (n) => (typeof n === 'number' ? new Intl.NumberFormat('tr-TR').format(n) : '—');
const ASAMA_SIRA = ['yeni', 'gorusme', 'teklif', 'goruldu', 'kazanildi'];

async function onizle(url) {
  let u;
  try { u = new URL(url, location.href); } catch (e) { return {}; }
  if (u.origin !== location.origin) return {};
  const p = panelYolu(u.pathname);
  // Os adresinde önek dışı yol başka modülündür.
  if (yol('/dashboard') !== '/dashboard' && p === u.pathname) return {};
  const o = await api(suzulmusYol('ozet'));
  const talep = (d) => (o.talepler || []).find((t) => t.durum === d)?.n ?? 0;
  const asama = (a) => (o.asamalar || []).find((x) => x.asama === a)?.n ?? 0;
  const acik = (o.asamalar || []).filter((a) => !['kazanildi', 'kaybedildi'].includes(a.asama)).reduce((t, a) => t + (a.n || 0), 0);
  const liste = (baslik, l) => { const en = Math.max(0, ...l.map((x) => x.n)); return en ? { baslik, ogeler: l.map(({ n, ...x }) => ({ ...x, deger: say(n), oran: n / en })) } : null; };
  if (p.startsWith('/leads')) return { not: 'Ajans geneli', sayilar: [{ ad: 'Yanıt bekleyen', deger: say(talep('yeni')) }, { ad: 'CRM’e alınan', deger: say(talep('crm')) }, { ad: 'Spam', deger: say(talep('spam')) }] };
  const crm = liste('CRM aşamaları', ASAMA_SIRA.map((a) => ({ ad: asamaAdi(a), n: asama(a), url: yol('/crm') })));
  if (/^\/(dashboard|crm|proposals|crm-conflicts|crm-migrate)/.test(p)) return { not: seciliMusteri() ? 'CRM sayıları seçili müşteriden; talepler ajans geneli' : 'Site talepleri ve CRM',
    sayilar: [{ ad: 'Açık fırsat değeri', deger: o.musteri && o.musteri.n ? para(o.musteri.hat || 0) : '—' }, { ad: 'Açık fırsat', deger: say(acik) }, { ad: 'Yanıt bekleyen', deger: say(talep('yeni')) }, { ad: 'Kazanılan', deger: say(asama('kazanildi')) }], liste: crm };
  return {};
}

// Panel kabuğu <head>'de yüklenir; öğe kurulunca bağlanır.
document.addEventListener('idexya-kabuk:hazir', () => {
  const kabuk = document.querySelector('idexya-kabuk');
  if (!kabuk) return;
  kabuk.onizlemeKaynagi = onizle;
  musteriDegisince(() => kabuk.onizlemeSifirla?.());
}, { once: true });
