import socketIO from 'socket.io-client';
import { GoldPrice, GOLD_TYPES } from '../models/types';
import { savePriceHistory } from './priceHistoryService';
import { getSubscribersByType } from './subscriptionService';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// Önbellek değişkenleri
let currentPrices: { [key: string]: GoldPrice } = {};
let lastPriceUpdate = 0;
const PRICE_UPDATE_INTERVAL = 1000; // 1 saniye

/**
 * WebSocket bağlantısı başlatma
 * @param bot Telegram bot örneği
 */
export function initializeSocketConnection(bot: TelegramBot) {
  // WebSocket bağlantısı oluştur
  const socket = socketIO(process.env.WS_URL as string, {
    transports: ["websocket"],
    path: "/socket.io",
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 5000
  });

  // Bağlantı olaylarını dinle
  socket.on("connect", () => {
    console.log("WebSocket bağlantısı başarılı!");
    socket.send("40");
    // Bağlantı kurulduğunda tüm fiyatları güncelle
    updateAllPrices(socket);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket bağlantısı kesildi!");
  });

  // Fiyat değişikliklerini dinle
  socket.on("price_changed", (data: { data: { [key: string]: GoldPrice } }) => {
    const prices = data.data;
    currentPrices = { ...currentPrices, ...prices };
    lastPriceUpdate = Date.now();
    
    // Fiyat geçmişini kaydet
    savePricesHistory(prices);
    
    // Abonelere bildirim gönder
    notifySubscribers(bot, prices);
  });

  // Hata durumlarını yakala
  socket.on("connect_error", (error: Error) => {
    console.error("Bağlantı hatası:", error);
  });

  socket.on("error", (error: Error) => {
    console.error("Soket hatası:", error);
  });

  return socket;
}

/**
 * Tüm fiyatları güncelleme
 */
export async function updateAllPrices(socket: ReturnType<typeof socketIO>): Promise<void> {
  const types = Object.keys(GOLD_TYPES);
  for (const type of types) {
    socket.emit("get_price", { type }, (data: GoldPrice) => {
      if (data && data.satis) {
        currentPrices[type] = data;
      }
    });
  }
  lastPriceUpdate = Date.now();
}

/**
 * Fiyat geçmişini kaydetme
 */
async function savePricesHistory(prices: { [key: string]: GoldPrice }): Promise<void> {
  for (const [type, price] of Object.entries(prices)) {
    await savePriceHistory(type, price);
  }
}

/**
 * Abonelere bildirim gönderme
 */
async function notifySubscribers(bot: TelegramBot, prices: { [key: string]: GoldPrice }): Promise<void> {
  for (const [type, price] of Object.entries(prices)) {
    const subscribers = await getSubscribersByType(type);
    const goldName = GOLD_TYPES[type] || type;
    const message = formatPriceMessage(goldName, type, price);
    
    for (const chatId of subscribers) {
      bot.sendMessage(chatId, message).catch(err => {
        console.error('Mesaj gönderme hatası:', err);
      });
    }
  }
}

/**
 * Fiyat mesajı formatı
 */
function formatPriceMessage(goldName: string, type: string, price: GoldPrice): string {
  return `💰 ${goldName} (${type}) Güncel Fiyat:\n` +
         `📈 Alış: ${price.alis} TL\n` +
         `📉 Satış: ${price.satis} TL\n` +
         `🕒 Tarih: ${price.tarih}\n` +
         `📊 Günlük:\n` +
         `⬇️ En Düşük: ${price.dusuk}\n` +
         `⬆️ En Yüksek: ${price.yuksek}\n` +
         `🔚 Önceki Kapanış: ${price.kapanis}`;
}

/**
 * Güncel fiyat alma - önbellekli
 */
export async function getCurrentPrice(socket: ReturnType<typeof socketIO>, type: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      // Önbellekteki fiyatı kontrol et
      if (currentPrices[type] && currentPrices[type].alis && 
          Date.now() - lastPriceUpdate < PRICE_UPDATE_INTERVAL) {
        resolve(parseFloat(currentPrices[type].alis as any) || 0);
        return;
      }

      // Fiyat güncel değilse veya yoksa socket üzerinden iste
      socket.emit("get_price", { type }, (data: GoldPrice) => {
        try {
          if (data && data.alis) {
            currentPrices[type] = data;
            lastPriceUpdate = Date.now();
            resolve(parseFloat(data.alis as any) || 0);
          } else {
            // Önbellekte varsa eski fiyatı kullan
            if (currentPrices[type] && currentPrices[type].alis) {
              resolve(parseFloat(currentPrices[type].alis as any) || 0);
            } else {
              resolve(0);
            }
          }
        } catch (error) {
          console.error('Fiyat çevirme hatası:', error);
          resolve(0);
        }
      });

      // Timeout ekle - socket yanıt vermezse
      setTimeout(() => {
        try {
          if (currentPrices[type] && currentPrices[type].alis) {
            resolve(parseFloat(currentPrices[type].alis as any) || 0);
          } else {
            resolve(0);
          }
        } catch (error) {
          console.error('Timeout sırasında fiyat okuma hatası:', error);
          resolve(0);
        }
      }, 3000);
    } catch (error) {
      console.error('getCurrentPrice hatası:', error);
      resolve(0);
    }
  });
}

/**
 * Önbellekteki güncel fiyatları döndür
 */
export function getCurrentPrices(): { [key: string]: GoldPrice } {
  return currentPrices;
} 