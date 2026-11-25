// Panel kabuğunun giriş dosyası: önce bağlantı (kabuk-bagla.js, kabuğun olaylarını dinler), sonra kabuk (öğeyi tanımlar).
// Derlemede tools/panel-kabuk.mjs bunu tek klasik betik olarak public/panel-kabuk.js'e paketler; Yonetim.astro onu <head>'de
// yükler. Betik yüklenemezse (ör. astro dev) Yonetim.astro'nun modül betiği bu dosyayı sonradan içe aktarır.
import './kabuk-bagla.js';
import '../../idexya-kabuk/kabuk.js';
// Üst alandaki ortak müşteri seçicisi (1.3): kabuğun ürün yuvasına konur.
import './musteri-secici.js';
// Mega menünün önizleme kartı.
import './onizleme.js';
