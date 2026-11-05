import { HIZMETLER } from './hizmetler.mjs';
// Bayrak açıkken üretilen adresler. Vitrin, ortak parçaları iki görsel yönde gösterir.
export const VITRINLER = [
  { yol: 'cati-onizleme', yon: 'c' },
  { yol: 'cati-onizleme-teknoloji', yon: 't' }
];
export const ONIZLEME_YOLLARI = [...VITRINLER.map((v) => v.yol), 'hizmetler', ...HIZMETLER.map((h) => h.s)];
