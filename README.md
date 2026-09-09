# Winkee 😉

**Mesajlaş, Oyna, Eğlen.**

Winkee, WhatsApp benzeri gerçek zamanlı sohbeti sosyal mini oyunlarla birleştiren mobil-first bir deneyimdir.

## İlk sürümde

- Neon mor/pembe, genç ve eğlenceli arayüz
- Sohbet listesi, kişi/grup/oyun filtreleri ve sohbet arama
- Hikaye/online kullanıcı görünümü
- 1:1 sohbet ekranı ve mesaj gönderme etkileşimi
- Emojiyle anlat → sohbet içinde tahmin kartı
- Oyunlar: Emoji Tahmin, Şarkı Tahmin, Film & Dizi, Deyim & Atasözü, This or That, Hızlı Quiz
- Günlük görev, XP/coin, seviye ve rozet odaklı oyunlaştırma
- Keşfet akışı
- Profil, arkadaşlar, oyun geçmişi, rozetler ve ayarlar menüsü
- Responsive/mobile-first tasarım

## Çalıştırma

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Sonraki backend katmanı

Arayüz, gerçek backend'e bağlanmaya hazır olacak şekilde ayrıştırılmıştır. Realtime chat, presence, medya depolama, özel sohbetler, grup/kanal odaları, oyun odaları ve kalıcı skorlar için Supabase Auth + Postgres + Realtime + Storage önerilir.
