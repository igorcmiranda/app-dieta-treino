import mysql, { Pool, RowDataPacket } from 'mysql2/promise';

const rawHost = process.env.MYSQL_HOST;
const normalizedHost = rawHost === 'localhost' ? '127.0.0.1' : rawHost;

const config = {
  host: normalizedHost,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

export const isMySqlConfigured = Boolean(
  config.host && config.user && config.password && config.database
);

let pool: Pool | null = null;

export function getMySqlPool(): Pool {
  if (!isMySqlConfigured) {
    throw new Error('MySQL não configurado. Defina MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.');
  }

  if (!pool) {
    pool = mysql.createPool({
      ...config,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      namedPlaceholders: true,
      charset: 'utf8mb4',
    });
  }

  return pool;
}

export async function dbQuery<T extends RowDataPacket[]>(sql: string, params?: any): Promise<T> {
  const [rows] = await getMySqlPool().query<T>(sql, params);
  return rows;
}

export async function dbExecute(sql: string, params?: any) {
  const [result] = await getMySqlPool().execute(sql, params);
  return result;
}
