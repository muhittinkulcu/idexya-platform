// Yönetim paneli ortak yardımcıları. Sunucudan gelen her metin textContent ile yazılır (HTML olarak yorumlanmaz).
export const ASAMALAR = [
  { k: 'yeni', ad: 'Yeni' }, { k: 'gorusme', ad: 'Görüşülüyor' }, { k: 'teklif', ad: 'Teklif gönderildi' },
  { k: 'goruldu', ad: 'Teklif görüldü' }, { k: 'kazanildi', ad: 'Kazanıldı' }, { k: 'kaybedildi', ad: 'Kaybedildi' }
];
export const asamaAdi = (k) => (ASAMALAR.find((a) => a.k === k) || { ad: k || '—' }).ad;
export const KAYNAK = { iletisim: 'İletişim formu', analiz: 'Ücretsiz analiz formu', paket: 'Paket teklif formu', sihirbaz: 'Paket sihirbazı', form: 'Web formu' };
export const TALEP_DURUM = { yeni: 'Yeni', crm: 'CRM’e alındı', spam: 'Spam' };

export function el(etiket, ozellik = {}, ...cocuklar) {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(ozellik || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of cocuklar.flat()) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : String(c));
  return e;
}

const iki = (n) => String(n).padStart(2, '0');
// TDK: tarih 19.10.2026, saat 08.15
export function tarih(iso, saatli = true) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const t = `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
  return saatli ? `${t} ${iki(d.getHours())}.${iki(d.getMinutes())}` : t;
}
export function once(iso) {
  const fark = (Date.now() - new Date(iso).getTime()) / 60000;
  if (!isFinite(fark)) return '—';
  if (fark < 1) return 'az önce';
  if (fark < 60) return `${Math.floor(fark)} dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)} sa önce`;
  return tarih(iso, false);
}
export const para = (n) => (n === null || n === undefined || n === '' ? '—' : new Intl.NumberFormat('tr-TR').format(n) + ' TL');

export async function api(yol, govde) {
  const r = await fetch('/api/yonetim/' + yol, govde === undefined ? { credentials: 'same-origin' } : {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde)
  });
  const s = await r.json().catch(() => ({ ok: false, hata: 'Sunucudan geçersiz yanıt geldi' }));
  if (!r.ok || !s.ok) {
    const h = new Error(s.hata || `İstek başarısız (${r.status})`);
    h.durum = r.status;
    throw h;
  }
  return s;
}

export function genelHata(metin) {
  const k = document.querySelector('[data-genel-hata]');
  if (!k) return;
  k.hidden = !metin; k.textContent = metin || '';
}

export function sayacGuncelle(ozet) {
  // Bilinmiyorsa veya sıfırsa gizli; yalnız bilinen ve sıfırdan büyük sayı görünür.
  const yaz = (ad, n) => { const r = document.querySelector(`[data-sayac="${ad}"]`); if (!r) return; r.hidden = !(n > 0); r.textContent = n > 0 ? String(n) : ''; };
  const say = (liste, d) => (liste ? (liste.find((t) => t.durum === d) || { n: 0 }).n : null);
  yaz('talep', ozet ? say(ozet.talepler, 'yeni') : null);
  yaz('uye', ozet ? say(ozet.uyeler, 'bekliyor') : null);
  yaz('yorum', ozet && ozet.bekleyenYorum !== undefined ? ozet.bekleyenYorum : null);
}

export function kabuk() {
  const yan = document.getElementById('yan');
  const ac = document.querySelector('[data-menu-ac]');
  if (ac) ac.addEventListener('click', () => { const a = yan.classList.toggle('acik-menu'); ac.setAttribute('aria-expanded', String(a)); });
  const t = document.querySelector('[data-tema-dugme]');
  if (t) t.addEventListener('click', () => {
    const yeni = document.documentElement.dataset.tema === 'koyu' ? 'acik' : 'koyu';
    document.documentElement.dataset.tema = yeni;
    document.getElementById('kabuk').className = 'kabuk ' + yeni;
    try { localStorage.setItem('idx-tema', yeni); } catch (e) {}
  });
  api('ozet').then((o) => {
    sayacGuncelle(o);
    const k = document.querySelector('[data-kim]');
    if (k && o.kim) k.textContent = o.kim;
  }).catch((h) => {
    sayacGuncelle(null);
    if (h.durum === 401) genelHata('Oturumunuz kapanmış. Sayfayı yenileyip yeniden giriş yapın.');
  });
}
