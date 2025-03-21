import TelegramBot from 'node-telegram-bot-api';
import { Portfolio, GOLD_TYPES } from '../models/types';
import * as subscriptionService from '../services/subscriptionService';
import * as portfolioService from '../services/portfolioService';
import * as priceHistoryService from '../services/priceHistoryService';
import * as socketService from '../services/socketService';
import { Socket } from 'socket.io-client';

export class BotController {
  private bot: TelegramBot;
  private socket: ReturnType<typeof socketService.initializeSocketConnection>;

  constructor(token: string) {
    this.bot = new TelegramBot(token, { polling: true });
    this.socket = socketService.initializeSocketConnection(this.bot);
    this.setupCommands();
  }

  private setupCommands(): void {
    // Başlangıç komutu
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `Hoş geldiniz! 👋\n\n` +
                           `Altın fiyatlarını takip etmek için aşağıdaki komutları kullanabilirsiniz:\n\n` +
                           `/takip KOD - Belirtilen altın türünü takip et\n` +
                           `/liste - Takip ettiğiniz altın türlerini görüntüle\n` +
                           `/durdur KOD - Belirtilen altın türü için takibi durdur\n` +
                           `/durdur_hepsi - Tüm takipleri durdur\n` +
                           `/turleri_goster - Takip edilebilecek tüm altın türlerini listele\n` +
                           `/fiyat_gecmisi KOD [GÜN] - Belirtilen altın türünün fiyat geçmişini göster\n\n` +
                           `Portföy Yönetimi:\n` +
                           `/portfoy_ekle KOD MIKTAR ALIS_FIYATI TARIH - Portföye altın ekle\n` +
                           `/portfoy_listele - Portföyünüzü görüntüle\n` +
                           `/portfoy_sil ID - Portföyden kayıt sil\n\n` +
                           `Hemen altın türlerini görmek için /turleri_goster komutunu kullanabilirsiniz.`;
      
      this.bot.sendMessage(chatId, welcomeMessage);
    });

    // Altın türlerini listele
    this.bot.onText(/\/turleri_goster/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, this.getGoldTypesList());
    });

    // Takip etme komutu
    this.bot.onText(/\/takip(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      // Parametre kontrolü
      if (!match || !match[1]) {
        this.bot.sendMessage(chatId,
          `📈 Altın fiyatlarını takip etmek için bir altın türü belirtmelisiniz.\n\n` +
          `Kullanım: /takip KOD\n\n` +
          `Örnek: /takip ALTIN\n\n` +
          `Takip edilebilecek altın türleri için /turleri_goster komutunu kullanabilirsiniz.`
        );
        return;
      }
      
      const type = match[1].toUpperCase();
      
      if (!GOLD_TYPES[type]) {
        this.bot.sendMessage(chatId, `❌ Geçersiz altın türü. Lütfen geçerli bir kod girin.\n\nGeçerli kodları görmek için /turleri_goster komutunu kullanın.`);
        return;
      }
      
      const currentSubscriptions = await subscriptionService.getUserSubscriptions(chatId);
      
      if (currentSubscriptions.includes(type)) {
        this.bot.sendMessage(chatId, `❗️ ${GOLD_TYPES[type]} zaten takip listenizde bulunuyor.`);
      } else {
        const success = await subscriptionService.addSubscription(chatId, type);
        
        if (success) {
          this.bot.sendMessage(chatId, `✅ ${GOLD_TYPES[type]} takip listenize eklendi.`);
        } else {
          this.bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
      }
    });

    // Takip listesi görüntüleme
    this.bot.onText(/\/liste/, async (msg) => {
      const chatId = msg.chat.id;
      
      const subscriptions = await subscriptionService.getUserSubscriptions(chatId);
      
      if (subscriptions.length === 0) {
        this.bot.sendMessage(chatId, "📝 Takip listeniz boş.");
      } else {
        let message = "📝 Takip ettiğiniz altın türleri:\n\n";
        subscriptions.forEach(type => {
          message += `🔸 ${GOLD_TYPES[type]} (${type})\n`;
        });
        this.bot.sendMessage(chatId, message);
      }
    });

    // Takibi durdurma komutu
    this.bot.onText(/^\/durdur(?:\s+(.+))?$/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      // Parametre kontrolü
      if (!match || !match[1]) {
        this.bot.sendMessage(chatId,
          `⛔ Takibi durdurmak için bir altın türü belirtmelisiniz.\n\n` +
          `Kullanım: /durdur KOD\n\n` +
          `Örnek: /durdur ALTIN\n\n` +
          `Takip ettiğiniz altın türlerini görmek için /liste komutunu kullanabilirsiniz.`
        );
        return;
      }
      
      const type = match[1].toUpperCase();
      
      const subscriptions = await subscriptionService.getUserSubscriptions(chatId);
      
      if (!subscriptions.includes(type)) {
        this.bot.sendMessage(chatId, `❗️ ${GOLD_TYPES[type] || type} takip listenizde bulunmuyor.`);
      } else {
        const success = await subscriptionService.removeSubscription(chatId, type);
        
        if (success) {
          this.bot.sendMessage(chatId, `❌ ${GOLD_TYPES[type]} takibi durduruldu.`);
        } else {
          this.bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
      }
    });

    // Tüm takipleri durdurma
    this.bot.onText(/^\/durdur_hepsi$/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const subscriptions = await subscriptionService.getUserSubscriptions(chatId);
        
        if (!subscriptions || subscriptions.length === 0) {
          this.bot.sendMessage(chatId, "📝 Takip listenizde hiç altın türü bulunmuyor.");
          return;
        }
        
        const success = await subscriptionService.removeAllSubscriptions(chatId);
        
        if (success) {
          this.bot.sendMessage(chatId, "❌ Tüm takipler durduruldu.");
        } else {
          this.bot.sendMessage(chatId, "📝 Takip listenizde hiç altın türü bulunmuyor.");
        }
      } catch (error) {
        console.error('Takipleri durdurma hatası:', error);
        this.bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    });

    // Fiyat geçmişi komutu
    this.bot.onText(/\/fiyat_gecmisi(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      // Parametre kontrolü
      if (!match || !match[1]) {
        this.bot.sendMessage(chatId, 
          `📊 Fiyat geçmişi görmek için altın türü kodu belirtmelisiniz.\n\n` +
          `Kullanım: /fiyat_gecmisi KOD [GÜN]\n\n` +
          `Örnek:\n` +
          `- 7 günlük geçmiş: /fiyat_gecmisi ALTIN\n` +
          `- 30 günlük geçmiş: /fiyat_gecmisi ALTIN 30\n\n` +
          `Altın kodlarını görmek için /turleri_goster komutunu kullanabilirsiniz.`
        );
        return;
      }
      
      const params = match[1].split(' ');
      const type = params[0].toUpperCase();
      const days = parseInt(params[1]) || 7; // Varsayılan olarak 7 gün
  
      if (!GOLD_TYPES[type]) {
        this.bot.sendMessage(chatId, `❌ Geçersiz altın türü. Geçerli kodları görmek için /turleri_goster komutunu kullanın.`);
        return;
      }
  
      try {
        const history = await priceHistoryService.getPriceHistory(type, days);
        
        if (!history || history.length === 0) {
          this.bot.sendMessage(chatId, `❌ ${GOLD_TYPES[type]} için geçmiş fiyat bilgisi bulunamadı.`);
          return;
        }
  
        let message = `📊 ${GOLD_TYPES[type]} Son ${days} Günlük Fiyat Geçmişi\n\n`;
        
        // En düşük ve en yüksek fiyatları bul
        const lowestPrice = Math.min(...history.map(h => parseFloat(h.alis as any)));
        const highestPrice = Math.max(...history.map(h => parseFloat(h.satis as any)));
        
        // Son fiyatlarla karşılaştırma
        const lastPrice = history[history.length - 1];
        const firstPrice = history[0];
        const priceChange = parseFloat(lastPrice.alis as any) - parseFloat(firstPrice.alis as any);
        const priceChangePercent = (priceChange / parseFloat(firstPrice.alis as any)) * 100;

        // Tarihleri Türkçe formatla
        const firstPriceDate = new Date(firstPrice.timestamp).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const lastPriceDate = new Date(lastPrice.timestamp).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
  
        message += `📈 En Yüksek Satış: ${highestPrice.toFixed(2)} TL\n`;
        message += `📉 En Düşük Alış: ${lowestPrice.toFixed(2)} TL\n\n`;
        message += `💰 İlk Fiyat (${firstPriceDate}):\n`;
        message += `   Alış: ${parseFloat(firstPrice.alis as any).toFixed(2)} TL\n`;
        message += `   Satış: ${parseFloat(firstPrice.satis as any).toFixed(2)} TL\n\n`;
        message += `💵 Son Fiyat (${lastPriceDate}):\n`;
        message += `   Alış: ${parseFloat(lastPrice.alis as any).toFixed(2)} TL\n`;
        message += `   Satış: ${parseFloat(lastPrice.satis as any).toFixed(2)} TL\n\n`;
        message += `📊 ${days} Günlük Değişim: ${priceChange.toFixed(2)} TL (${priceChangePercent.toFixed(2)}%)\n`;
  
        this.bot.sendMessage(chatId, message);
      } catch (err) {
        console.error('Fiyat geçmişi sorgulama hatası:', err);
        this.bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    });

    // Portföye altın ekleme
    this.bot.onText(/\/portfoy_ekle(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      // Parametre kontrolü
      if (!match || !match[1]) {
        this.bot.sendMessage(chatId, 
          `💰 Portföye altın eklemek için parametreleri belirtmelisiniz.\n\n` +
          `Kullanım:\n` +
          `1) Güncel fiyatla: /portfoy_ekle KOD MIKTAR\n` +
          `2) Özel fiyatla: /portfoy_ekle KOD MIKTAR ALIS_FIYATI TARIH\n\n` +
          `Örnekler:\n` +
          `- Güncel fiyatla 1 adet gram altın: /portfoy_ekle ALTIN 1\n` +
          `- Özel fiyatla ve tarihle: /portfoy_ekle ALTIN 1 1250.50 2024-03-20\n\n` +
          `Altın kodlarını görmek için /turleri_goster komutunu kullanabilirsiniz.`
        );
        return;
      }
      
      const params = match[1].split(' ');
      
      if (params.length !== 2 && params.length !== 4) {
        this.bot.sendMessage(chatId, `❌ Hatalı format. Doğru kullanım:\n` +
            `1) Güncel fiyat ve tarih ile: /portfoy_ekle KOD MIKTAR\n` +
            `2) Özel fiyat ve tarih ile: /portfoy_ekle KOD MIKTAR ALIS_FIYATI TARIH\n` +
            `Örnekler:\n` +
            `1) /portfoy_ekle ALTIN 1\n` +
            `2) /portfoy_ekle ALTIN 1 1250.50 2024-03-20`);
        return;
      }
  
      const [type, amount, buyPrice, date] = params;
      const goldType = type.toUpperCase();
  
      if (!GOLD_TYPES[goldType]) {
        this.bot.sendMessage(chatId, `❌ Geçersiz altın türü. Geçerli kodları görmek için /turleri_goster komutunu kullanın.`);
        return;
      }
  
      // Güncel fiyatı al
      let finalBuyPrice = buyPrice;
      let finalDate = date;
  
      // Eğer fiyat ve tarih belirtilmemişse güncel değerleri kullan
      if (!buyPrice) {
        // Güncel fiyatları al
        const prices = socketService.getCurrentPrices();
        const currentPrice = prices[goldType]?.satis ? parseFloat(prices[goldType].satis as any) : 0;
        
        if (currentPrice === 0) {
          this.bot.sendMessage(chatId, `❌ Güncel fiyat bilgisi alınamadı. Lütfen daha sonra tekrar deneyin veya fiyatı manuel girin.`);
          return;
        }
        
        finalBuyPrice = currentPrice.toString();
        finalDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
      }
  
      // Sayısal değerleri doğru şekilde dönüştür
      const parsedAmount = parseFloat(amount);
      const parsedBuyPrice = parseFloat(finalBuyPrice);
      
      if (isNaN(parsedAmount) || isNaN(parsedBuyPrice)) {
        this.bot.sendMessage(chatId, `❌ Geçersiz miktar veya alış fiyatı. Lütfen sayısal değerler girin.`);
        return;
      }
      
      const portfolioItem: Portfolio = {
        id: Date.now().toString(),
        chat_id: chatId,
        type: goldType,
        amount: parsedAmount,
        buy_price: parsedBuyPrice,
        date: finalDate,
      };
  
      const success = await portfolioService.addPortfolioItem(portfolioItem);
      
      if (success) {
        // Tarihi Türkçe formatla
        const dateObj = new Date(finalDate);
        const turkishDate = dateObj.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        this.bot.sendMessage(chatId, `✅ Portföye eklendi:\n` +
            `🔸 ${GOLD_TYPES[goldType]}\n` +
            `📈 Miktar: ${parsedAmount}\n` +
            `💰 Alış Fiyatı: ${parsedBuyPrice.toFixed(2)} TL\n` +
            `📅 Alış Tarihi: ${turkishDate}` +
            (buyPrice ? '' : ' (Otomatik kaydedildi)'));
      } else {
        this.bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    });

    // Portföy listeleme
    this.bot.onText(/\/portfoy_listele/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const portfolio = await portfolioService.getUserPortfolio(chatId);
        
        if (!portfolio || portfolio.length === 0) {
          this.bot.sendMessage(chatId, "📝 Portföyünüz boş.");
          return;
        }
  
        let totalValue = 0;
        let totalCost = 0;
        let message = "📊 PORTFÖY DURUMU\n\n";
  
        for (const item of portfolio) {
          const currentPrice = await socketService.getCurrentPrice(this.socket, item.type);
          const itemTotalCost = item.amount * item.buy_price;
          const itemCurrentValue = item.amount * currentPrice;
          const profit = itemCurrentValue - itemTotalCost;
          const profitPercentage = itemTotalCost > 0 ? ((itemCurrentValue / itemTotalCost) - 1) * 100 : 0;
  
          totalCost += itemTotalCost;
          totalValue += itemCurrentValue;

          const dateObj = new Date(item.date);
          const turkishDate = dateObj.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
  
          message += `🔸 ${GOLD_TYPES[item.type]} (ID: ${item.id})\n` +
                    `📈 Miktar: ${item.amount}\n` +
                    `💰 Alış Fiyatı: ${parseFloat(item.buy_price as any).toFixed(2)} TL\n` +
                    `💵 Güncel Satış Değeri: ${currentPrice.toFixed(2)} TL\n` +
                    `📊 Kar/Zarar: ${profit.toFixed(2)} TL (${profitPercentage.toFixed(2)}%)\n` +
                    `📅 Alış Tarihi: ${turkishDate}\n\n`;
        }
  
        const totalProfit = totalValue - totalCost;
        const totalProfitPercentage = totalCost > 0 ? ((totalValue / totalCost) - 1) * 100 : 0;
  
        message += `📈 TOPLAM DURUM\n` +
                  `💰 Toplam Maliyet: ${totalCost.toFixed(2)} TL\n` +
                  `💵 Güncel Satış Değeri: ${totalValue.toFixed(2)} TL\n` +
                  `📊 Toplam Kar/Zarar: ${totalProfit.toFixed(2)} TL (${totalProfitPercentage.toFixed(2)}%)\n`;
  
        this.bot.sendMessage(chatId, message);
      } catch (err) {
        console.error('Portföy listeleme hatası:', err);
        this.bot.sendMessage(chatId, '❌ Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    });

    // Portföyden altın silme
    this.bot.onText(/\/portfoy_sil(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      // Parametre kontrolü
      if (!match || !match[1]) {
        this.bot.sendMessage(chatId,
          `🗑️ Portföyden bir kayıt silmek için ID belirtmelisiniz.\n\n` +
          `Kullanım: /portfoy_sil ID\n\n` +
          `Örnek: /portfoy_sil 1680782945123\n\n` +
          `Portföyünüzdeki kayıtları ve ID'leri görmek için /portfoy_listele komutunu kullanabilirsiniz.`
        );
        return;
      }
      
      const id = match[1];
  
      const success = await portfolioService.removePortfolioItem(chatId, id);
      
      if (success) {
        this.bot.sendMessage(chatId, "✅ Portföy kaydı başarıyla silindi.");
      } else {
        this.bot.sendMessage(chatId, "❌ Belirtilen ID ile kayıt bulunamadı.");
      }
    });
  }

  // Takip edilebilecek altın türlerini listele
  private getGoldTypesList(): string {
    let message = "📋 Takip edilebilecek altın türleri:\n\n";
    for (const [code, name] of Object.entries(GOLD_TYPES)) {
      message += `🔸 ${name} (Kod: ${code})\n`;
    }
    message += "\nTakip etmek için örnek komut:\n/takip ALTIN";
    return message;
  }
} 