import pool from '../config/database';
import { Subscription } from '../models/types';

/**
 * Kullanıcı aboneliği ekleme
 * @param chatId Telegram chat ID
 * @param type Altın türü kodu
 */
export async function addSubscription(chatId: number, type: string): Promise<boolean> {
  try {
    await pool.query(
      'INSERT INTO subscriptions (chat_id, type) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP', 
      [chatId, type]
    );
    return true;
  } catch (error) {
    console.error('Abonelik ekleme hatası:', error);
    return false;
  }
}

/**
 * Kullanıcının aboneliklerini getirme
 * @param chatId Telegram chat ID
 */
export async function getUserSubscriptions(chatId: number): Promise<string[]> {
  try {
    const [rows] = await pool.query<any>(
      'SELECT type FROM subscriptions WHERE chat_id = ?',
      [chatId]
    );
    return rows.map((row: any) => row.type);
  } catch (error) {
    console.error('Abonelik getirme hatası:', error);
    return [];
  }
}

/**
 * Kullanıcının belirli bir aboneliğini silme
 * @param chatId Telegram chat ID
 * @param type Altın türü kodu
 */
export async function removeSubscription(chatId: number, type: string): Promise<boolean> {
  try {
    const [result] = await pool.query<any>(
      'DELETE FROM subscriptions WHERE chat_id = ? AND type = ?',
      [chatId, type]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Abonelik silme hatası:', error);
    return false;
  }
}

/**
 * Kullanıcının tüm aboneliklerini silme
 * @param chatId Telegram chat ID
 */
export async function removeAllSubscriptions(chatId: number): Promise<boolean> {
  try {
    const [result] = await pool.query<any>(
      'DELETE FROM subscriptions WHERE chat_id = ?',
      [chatId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Tüm abonelikler silme hatası:', error);
    return false;
  }
}

/**
 * Belirli bir altın türü için tüm aboneleri getirme
 * @param type Altın türü kodu
 */
export async function getSubscribersByType(type: string): Promise<number[]> {
  try {
    const [rows] = await pool.query<any>(
      'SELECT chat_id FROM subscriptions WHERE type = ?',
      [type]
    );
    return rows.map((row: any) => row.chat_id);
  } catch (error) {
    console.error('Abone getirme hatası:', error);
    return [];
  }
}

/**
 * Tüm abonelikleri getirme
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const [rows] = await pool.query<any>('SELECT * FROM subscriptions');
    return rows;
  } catch (error) {
    console.error('Tüm abonelikler getirme hatası:', error);
    return [];
  }
} 