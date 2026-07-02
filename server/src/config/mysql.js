import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool;

const tables = ['users', 'categories', 'products', 'coupons', 'carts', 'orders', 'currency_settings', 'galleries', 'search_logs'];

export const getMysqlPool = () => {
  if (!pool) {
    if (!env.mysql.host || !env.mysql.user || !env.mysql.database) {
      throw new Error('MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE are required when DATABASE_PROVIDER=mysql');
    }

    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 5000,
      charset: 'utf8mb4',
      dateStrings: true
    });
  }

  return pool;
};

export const initMysql = async () => {
  const mysqlPool = getMysqlPool();

  await Promise.all(
    tables.map((table) =>
      mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS \`${table}\` (
          id CHAR(24) NOT NULL PRIMARY KEY,
          data LONGTEXT NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_${table}_created_at (created_at),
          INDEX idx_${table}_updated_at (updated_at)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `)
    )
  );

  console.log(`MySQL connected: ${env.mysql.host}/${env.mysql.database}`);
  return mysqlPool;
};

export const closeMysql = async () => {
  if (!pool) return;
  await pool.end();
  pool = undefined;
};
