import pool from '../config/database';
import { PriceHistory, GoldPrice } from '../models/types';

/**
 * Fiyat geçmişi kaydetme
 * @param priceData Kaydedilecek fiyat bilgileri
 */
export async function savePriceHistory(type: string, priceData: GoldPrice): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO price_history 
       (type, timestamp, alis, satis, dusuk, yuksek, kapanis, tarih) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type, 
        new Date(), 
        parseFloat(priceData.alis as any), 
        parseFloat(priceData.satis as any), 
        parseFloat(priceData.dusuk as any), 
        parseFloat(priceData.yuksek as any), 
        parseFloat(priceData.kapanis as any),
        priceData.tarih
      ]
    );
    return true;
  } catch (error) {
    console.error('Fiyat geçmişi kaydetme hatası:', error);
    return false;
  }
}

/**
 * Belirli bir altın türü için fiyat geçmişini getirme
 * @param type Altın türü kodu
 * @param days Geçmişe dönük gün sayısı
 */
export async function getPriceHistory(type: string, days: number = 7): Promise<PriceHistory[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [rows] = await pool.query<any>(
      `SELECT * FROM price_history 
       WHERE type = ? AND timestamp >= ? 
       ORDER BY timestamp ASC`,
      [type, startDate]
    );
    
    return rows;
  } catch (error) {
    console.error('Fiyat geçmişi getirme hatası:', error);
    return [];
  }
}

/**
 * En son fiyat bilgisini getirme
 * @param type Altın türü kodu
 */
export async function getLatestPrice(type: string): Promise<PriceHistory | null> {
  try {
    const [rows] = await pool.query<any>(
      `SELECT * FROM price_history 
       WHERE type = ? 
       ORDER BY timestamp DESC LIMIT 1`,
      [type]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    console.error('Son fiyat getirme hatası:', error);
    return null;
  }
} 