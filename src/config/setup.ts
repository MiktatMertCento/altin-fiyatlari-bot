import pool from './database';

/**
 * Veritabanı tablolarını oluşturur
 */
export async function setupDatabase(): Promise<void> {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('Veritabanı bağlantısı başarılı, tablolar oluşturuluyor...');

    // Subscriptions tablosu
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_id (chat_id),
        INDEX idx_type (type),
        UNIQUE KEY unique_subscription (chat_id, type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('- subscriptions tablosu kontrol edildi');

    // Portfolios tablosu
    await connection.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id VARCHAR(50) PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 4) NOT NULL,
        buy_price DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_id (chat_id),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('- portfolios tablosu kontrol edildi');

    // Price history tablosu
    await connection.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        alis DECIMAL(10, 2) NOT NULL,
        satis DECIMAL(10, 2) NOT NULL,
        dusuk DECIMAL(10, 2) NOT NULL,
        yuksek DECIMAL(10, 2) NOT NULL,
        kapanis DECIMAL(10, 2) NOT NULL,
        tarih VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('- price_history tablosu kontrol edildi');

    // Örnek veri kontrolü için bir sorgu çalıştır
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM subscriptions');
    console.log(`- Mevcut abonelik sayısı: ${(rows as any)[0].count}`);

    console.log('Veritabanı tabloları başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Veritabanı tabloları oluşturulurken hata:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 