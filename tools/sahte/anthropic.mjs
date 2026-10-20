// Yerel test için sahte Anthropic API: "teklif" geçen mesajda araç çağırır, diğerlerinde metin döner.
import http from 'http';
http.createServer((q, r) => {
  let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
    const g = JSON.parse(b), son = g.messages[g.messages.length - 1];
    const metin = typeof son.content === 'string' ? son.content : '';
    let cevap;
    if (Array.isArray(son.content)) cevap = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Bilgilerinizi karta ekledim. Kontrol edip KVKK onayını işaretleyerek gönderebilirsiniz.' }] };
    else if (/teklif/i.test(metin)) cevap = { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'talep_karti_goster', input: { ad: 'Sohbet Deneme', eposta: 'sohbet@ornek.com', konu: 'Google Ads teklifi', ozet: 'E-ticaret sitesi için Google Ads yönetimi istiyor.' } }] };
    else cevap = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Size uygun seçenekler:\n- Google Ads yönetimi /tr/hizmet/google-ads-yonetimi\n- Paket sihirbazı /tr/paketler\n<script>window.__xss=1</script>' }] };
    r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify(cevap));
  });
}).listen(Number(process.argv[2] || 8999), '127.0.0.1');
