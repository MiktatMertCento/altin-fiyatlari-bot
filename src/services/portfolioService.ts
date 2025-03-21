import pool from '../config/database';
import { Portfolio } from '../models/types';

/**
 * Portföye yeni altın ekleme
 * @param portfolio Portföy bilgileri
 */
export async function addPortfolioItem(portfolio: Portfolio): Promise<boolean> {
  try {
    await pool.query(
      'INSERT INTO portfolios (id, chat_id, type, amount, buy_price, date) VALUES (?, ?, ?, ?, ?, ?)',
      [portfolio.id, portfolio.chat_id, portfolio.type, portfolio.amount, portfolio.buy_price, portfolio.date]
    );
    return true;
  } catch (error) {
    console.error('Portföy ekleme hatası:', error);
    return false;
  }
}

/**
 * Kullanıcının portföyünü getirme
 * @param chatId Telegram chat ID
 */
export async function getUserPortfolio(chatId: number): Promise<Portfolio[]> {
  try {
    const [rows] = await pool.query<any>(
      'SELECT * FROM portfolios WHERE chat_id = ?',
      [chatId]
    );
    return rows;
  } catch (error) {
    console.error('Portföy getirme hatası:', error);
    return [];
  }
}

/**
 * Belirli bir portföy kaydını silme
 * @param chatId Telegram chat ID
 * @param id Portföy kaydının ID'si
 */
export async function removePortfolioItem(chatId: number, id: string): Promise<boolean> {
  try {
    const [result] = await pool.query<any>(
      'DELETE FROM portfolios WHERE chat_id = ? AND id = ?',
      [chatId, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Portföy silme hatası:', error);
    return false;
  }
} 