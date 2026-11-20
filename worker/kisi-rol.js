// Kişi ve rol tek kayıt (IDOS kararı 2026-11-20-kisi-rol-tek-kayit.md, 2. adım): yönetim paneline kimin, hangi yetkiyle
// gireceğini IDOS söyler. Anahtar: KISI_ROL_IDOS=1 (varsayılan kapalı; kapalıyken yalnız YONETICILER listesi, bugünkü gibi).
// · İstek: GET /api/ortak/kisi, e-posta adreste değil X-Idexya-Eposta başlığında (istek günlüklerine kişi verisi düşmesin).
// · Rol → izin: yonetici / hesap_yoneticisi = tam yönetim; izleyici = salt okuma (yalnız GET); musteri ya da null = ret.
// · YONETICILER listesindeki e-posta her zaman tam yetkiyle girer (IDOS düşükken kilitlenme olmasın); IDOS'a sorulmaz.
// · Önbellek bellekte: taze kayıt 5 dk. IDOS okunamazsa (503, ağ, zaman aşımı, bozuk yanıt) en çok 12 saatlik son geçerli
//   kayıt kullanılır; yoksa ret (kapalı başarısız). E-posta günlüğe yazılmaz.
// · musteri_idleri yalnız `kim` nesnesinde taşınır; hesap yöneticisinin müşteri süzgecine henüz bağlı değildir (sonraki adım).
import { idosIstek, anaKayitKurulu } from './ana-kayit.js';
import { yoneticiListesi } from './erisim.js';

export const ROLLER = new Set(['yonetici', 'hesap_yoneticisi', 'izleyici', 'musteri']);
const YONETIM = new Set(['yonetici', 'hesap_yoneticisi']);
export const TAZE_MS = 5 * 60 * 1000;
export const YEDEK_EN_COK_MS = 12 * 60 * 60 * 1000;
const ZAMAN_ASIMI_MS = 5000;
const EN_COK_KAYIT = 500;
const KIMLIK = /^[\w-]{1,100}$/;
const EPOSTA = /^[^\s@,]{1,100}@[^\s@,]{1,150}$/;

export const kisiRolAcik = (env) => !!env && String(env.KISI_ROL_IDOS || '').trim() === '1';

const bellek = new Map(); // eposta → { kayit, zaman }
export const onbellekTemizle = () => bellek.clear();

// IDOS yanıtı yalnız beklenen alanlarla alınır; sorulan e-postayla eşleşmeyen ya da bilinmeyen rol taşıyan yanıt bozuk sayılır.
export function yanitTemizle(v, eposta) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  if (String(v.eposta || '').toLowerCase() !== eposta) return null;
  if (v.rol !== null && !ROLLER.has(v.rol)) return null;
  const musteri_idleri = Array.isArray(v.musteri_idleri) ? v.musteri_idleri.filter((x) => typeof x === 'string' && KIMLIK.test(x)).slice(0, 1000) : null;
  return { rol: v.rol, super_admin: v.super_admin === true, musteri_idleri };
}

// Rol kaydından yönetim kararı: null = giriş yok.
export function rolKarari(eposta, kayit, kaynak) {
  if (!kayit || !kayit.rol) return null;
  if (YONETIM.has(kayit.rol)) return { eposta, rol: kayit.rol, salt_okuma: false, super_admin: kayit.super_admin, musteri_idleri: kayit.musteri_idleri, kaynak };
  if (kayit.rol === 'izleyici') return { eposta, rol: 'izleyici', salt_okuma: true, super_admin: false, musteri_idleri: kayit.musteri_idleri, kaynak };
  return null; // musteri: yönetim paneli değil
}

// Doğrulanmış Access e-postası için yönetim yetkisi. Anahtar kapalıyken bugünkü kural (yalnız YONETICILER) aynen uygulanır.
export async function kisiYetki(env, eposta, simdi = Date.now()) {
  const e = String(eposta || '').toLowerCase();
  if (!e) return null;
  if (yoneticiListesi(env).includes(e)) return { eposta: e, rol: 'yonetici', salt_okuma: false, kaynak: 'yedek_liste' };
  if (!kisiRolAcik(env) || !anaKayitKurulu(env) || !EPOSTA.test(e)) return null;
  const onceki = bellek.get(e);
  if (onceki && simdi - onceki.zaman < TAZE_MS) return rolKarari(e, onceki.kayit, 'onbellek');
  try {
    const r = await idosIstek(env, '/api/ortak/kisi', ZAMAN_ASIMI_MS, { 'X-Idexya-Eposta': e });
    if (r.yok) throw new Error('IDOS kişi ucu bulunamadı');
    const kayit = yanitTemizle(r.veri, e);
    if (!kayit) throw new Error('IDOS kişi yanıtı beklenen biçimde değil');
    if (bellek.size >= EN_COK_KAYIT && !bellek.has(e)) bellek.delete(bellek.keys().next().value);
    bellek.set(e, { kayit, zaman: simdi });
    return rolKarari(e, kayit, 'idos');
  } catch (h) {
    // Yalnız hata iletisi; e-posta yazılmaz.
    console.error('kişi rolü', h && h.message);
    if (onceki && simdi - onceki.zaman < YEDEK_EN_COK_MS) return rolKarari(e, onceki.kayit, 'eski_onbellek');
    return null;
  }
}

// Salt okuma kişisi yalnız GET/HEAD isteyebilir.
export const yontemIzinli = (kim, yontem) => !(kim && kim.salt_okuma) || yontem === 'GET' || yontem === 'HEAD';
