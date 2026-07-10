import mysql from 'mysql2/promise';

const globalForMysql = global;

export const dbPool = globalForMysql.pool || mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'poojitha',
  database: process.env.DB_NAME || 'interview_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

if (process.env.NODE_ENV !== 'production') globalForMysql.pool = dbPool;