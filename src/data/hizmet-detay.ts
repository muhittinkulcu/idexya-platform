// Hizmet sayfası içerikleri (src/pages/tr/hizmet/[slug].astro). Google Ads yönetiminin kendi sayfası vardır.
import { DETAY_1 } from './hizmet-detay-1';
import { DETAY_2 } from './hizmet-detay-2';
import { DETAY_3 } from './hizmet-detay-3';

export interface HizmetDetay {
  giris: string; // hero altındaki açıklama
  neden: string; // neden önemli
  yap: [string, string][]; // neler yapıyoruz: [başlık, açıklama]
  olc: string[]; // neyi ölçüyoruz
  kim: string[]; // kimler için
  sss: [string, string][]; // sık sorulan sorular
}

export const DETAY: Record<string, HizmetDetay> = { ...DETAY_1, ...DETAY_2, ...DETAY_3 };

// Bütün hizmetlerde ortak çalışma adımları (ana sayfadaki "Dört adım" ile aynı mantık).
export const ADIMLAR: [string, string][] = [
  ['Ücretsiz analiz', 'Mevcut durumunuzu, hesaplarınızı ve hedefinizi inceleriz; nereden başlanacağını gerekçesiyle anlatırız.'],
  ['Plan ve teklif', 'Kapsam, öncelikler, takvim ve ölçülecek sonuçlar yazılı olarak netleşir.'],
  ['Onaylı uygulama', 'İşler plana göre yürür; bütçe ve canlı ayar değişiklikleri onayınız olmadan yapılmaz.'],
  ['Ölçüm ve rapor', 'Sonuçlar düzenli raporlanır; neyin işe yaradığını ve sonraki adımı birlikte değerlendiririz.']
];
