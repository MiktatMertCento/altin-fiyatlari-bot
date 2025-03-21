import dotenv from 'dotenv';
import { BotController } from './controllers/botController';
import { setupDatabase } from './config/setup';

// Çevre değişkenlerini yükle
dotenv.config();

// Bot token'ını doğrula
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN bulunamadı! Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

// MySQL veritabanı bağlantısını kur ve tabloları oluştur
async function main() {
  try {
    // Veritabanı tablolarını oluştur
    await setupDatabase();
    
    // Token kontrolü tekrar yapılıyor (type safety için)
    if (token) {
      // Bot controller'ı başlat
      const botController = new BotController(token);
      console.log('Altın fiyatları takip botu başarıyla başlatıldı!');
    }
    
  } catch (error) {
    console.error('Bot başlatılırken hata oluştu:', error);
    process.exit(1);
  }
}

// Uygulamayı başlat
main(); 