import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Bağlantı bilgilerini kontrol et
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPort = parseInt(process.env.DB_PORT as string);

console.log(`MySQL bağlantısı kuruluyor: ${dbHost}:${dbPort}/${dbName}`);

// MySQL bağlantı havuzu oluştur
const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Bağlantıyı test et
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL bağlantısı başarılı!');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL bağlantı hatası:', error);
    return false;
  }
};

testConnection();

export default pool; 