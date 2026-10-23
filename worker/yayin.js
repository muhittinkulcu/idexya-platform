// Site içeriği yayını (Muhittin, 23 Eki 2026): panelde düzenlenen içerik dosyası doğrulanır ve GitHub'daki depoya
// kaydedilir; Cloudflare Workers Builds değişikliği görüp siteyi 1–2 dakikada yeniden yayınlar.
// Gerekli gizli değer: GITHUB_TOKEN (yalnız bu deponun "Contents: Read and write" izni olan ince ayarlı anahtar).
// İsteğe bağlı: GITHUB_DEPO (varsayılan muhittinkulcu/idexya-platform), GITHUB_DAL (varsayılan main).
// Anahtar yoksa panel yayındaki kopyayı (derlemede /yonetim/veri/ altına konur) gösterir, yayınlama kapalıdır.
import { json, hata, islemYaz } from './ortak.js';
import { DOSYALAR, dogrula, ekDenetim } from '../src/data/icerik-sema.js';

const depo = (env) => env.GITHUB_DEPO || 'muhittinkulcu/idexya-platform';
const dal = (env) => env.GITHUB_DAL || 'main';
// GITHUB_API yalnız yerel testte sahte sunucuya yönlendirmek içindir.
const gh = (env, yol, ayar = {}) => fetch(`${env.GITHUB_API || 'https://api.github.com'}/repos/${depo(env)}/${yol}`, {
  ...ayar, headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'idexya-panel', ...(ayar.headers || {}) }
});
const b64Coz = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
const b64Yap = (metin) => { const b = new TextEncoder().encode(metin); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };

async function oku(env, istek, ad) {
  const d = DOSYALAR[ad];
  if (env.GITHUB_TOKEN) {
    const r = await gh(env, `contents/${d.yol}?ref=${encodeURIComponent(dal(env))}`);
    if (!r.ok) throw new Error(`GitHub dosyayı vermedi (${r.status}). Anahtarın bu depoya okuma-yazma izni olduğundan emin olun.`);
    const s = await r.json();
    return { veri: JSON.parse(b64Coz(s.content)), sha: s.sha, kaynak: 'github' };
  }
  const r = await env.ASSETS.fetch(new Request(new URL(`/yonetim/veri/${ad}.json`, istek.url)));
  if (!r.ok) throw new Error('Yayındaki içerik okunamadı');
  return { veri: await r.json(), sha: null, kaynak: 'yayindaki' };
}

export async function yonetimYayinApi(db, env, istek, yontem, yol, govde, kim) {
  if (yol === 'icerik-dosya' && yontem === 'GET') {
    const son = await db.prepare("SELECT zaman, kim, hedef, detay FROM islem_kaydi WHERE islem = 'icerik_yayinlandi' ORDER BY zaman DESC LIMIT 10").all();
    return json({ ok: true, yayinAcik: !!env.GITHUB_TOKEN, depo: depo(env), dal: dal(env), dosyalar: Object.entries(DOSYALAR).map(([k, d]) => ({ k, ad: d.ad, aciklama: d.aciklama })), sonYayinlar: son.results });
  }
  const m = yol.match(/^icerik-dosya\/([a-z-]+)$/);
  if (!m) return null;
  const ad = m[1], d = DOSYALAR[ad];
  if (!d) return hata('Bilinmeyen içerik dosyası', 404);
  if (yontem === 'GET') {
    try { return json({ ok: true, ...(await oku(env, istek, ad)), yayinAcik: !!env.GITHUB_TOKEN }); }
    catch (e) { return hata(e.message, 502); }
  }
  if (yontem !== 'POST') return hata('Yöntem desteklenmiyor', 405);
  if (!env.GITHUB_TOKEN) return hata('Yayınlama kapalı: Cloudflare’de GITHUB_TOKEN gizli değeri tanımlı değil', 409);
  const r = dogrula(d.sema, govde.veri);
  if (r.hatalar) return json({ ok: false, hata: 'Bazı alanlar hatalı', hatalar: r.hatalar.slice(0, 30) }, 422);
  const ek = ekDenetim(ad, r.veri);
  if (ek.length) return json({ ok: false, hata: 'Bazı alanlar hatalı', hatalar: ek }, 422);
  const metin = JSON.stringify(r.veri, null, 2) + '\n';
  if (metin.length > 900000) return hata('İçerik çok büyük', 413);
  const not = String(govde.not || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const yanit = await gh(env, `contents/${d.yol}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    message: `Panel: ${d.ad} güncellendi${not ? ' – ' + not : ''}\n\nYayınlayan: ${kim.eposta}`,
    content: b64Yap(metin), sha: govde.sha || undefined, branch: dal(env)
  }) });
  if (yanit.status === 409 || yanit.status === 422) return hata('Dosya siz düzenlerken başka biri tarafından değiştirilmiş. Sayfayı yenileyip değişikliklerinizi yeniden uygulayın.', 409);
  if (!yanit.ok) return hata(`GitHub kaydı başarısız (${yanit.status})`, 502);
  const s = await yanit.json();
  await islemYaz(db, kim.eposta, 'icerik_yayinlandi', ad, `${d.ad}${not ? ' – ' + not : ''} · ${String(s.commit && s.commit.sha || '').slice(0, 7)}`);
  return json({ ok: true, sha: s.content && s.content.sha, commit: s.commit && s.commit.html_url });
}
