// Sayfa sekmeleri (src/scripts/yonetim/sekmeler.js) liste kuralları; tarayıcı gerekmez: node tools/test-sekmeler.mjs
import { temizle, ekle, kapat, EN_COK } from '../src/scripts/yonetim/sekmeler.js';
let kalan = 0;
const kontrol = (ad, kosul) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad); if (!kosul) kalan++; };
const s = (y, ad = y) => ({ yol: y, href: y, ad });

let l = temizle(null);
kontrol('boş listede yalnız Genel bakış', l.length === 1 && l[0].yol === '/dashboard' && l[0].ad === 'Genel bakış');
l = ekle(l, s('/crm', 'CRM')); l = ekle(l, s('/leads', 'Talepler'));
kontrol('yeni sayfalar sona eklenir', l.map((x) => x.yol).join() === '/dashboard,/crm,/leads');
l = ekle(l, { yol: '/crm', href: '/crm?x=1', ad: 'CRM' });
kontrol('açık sayfa yeniden açılınca yeri değişmez, adresi güncellenir', l.map((x) => x.yol).join() === '/dashboard,/crm,/leads' && l[1].href === '/crm?x=1');
for (let i = 0; i < 10; i++) l = ekle(l, s('/s' + i));
kontrol(`en çok ${EN_COK} sekme`, l.length === EN_COK);
kontrol('Genel bakış hep ilk', l[0].yol === '/dashboard');
kontrol('en eskiler düşer, en yeni kalır', !l.some((x) => x.yol === '/crm') && l[l.length - 1].yol === '/s9');
let k = kapat(l, '/dashboard');
kontrol('Genel bakış kapatılamaz', k.liste.length === EN_COK && k.sol === null);
k = kapat(l, '/s5');
kontrol('kapatılınca soldaki sekmeye gidilir', k.liste.length === EN_COK - 1 && k.sol.yol === '/s4');
kontrol('bozuk kayıt ve dış adres ayıklanır', temizle([{ yol: '/a' }, { yol: '/b', href: 'https://kotu.example/', ad: 'b' }, 5, s('/c')]).map((x) => x.yol).join() === '/dashboard,/c');
kontrol('Genel bakış listede kaydırılmışsa yine ilk', temizle([s('/c'), { yol: '/dashboard', href: '/dashboard', ad: 'X' }]).map((x) => x.yol + ':' + x.ad).join() === '/dashboard:Genel bakış,/c:/c');
console.log(kalan ? kalan + ' KALDI' : 'hepsi geçti');
process.exit(kalan ? 1 : 0);
