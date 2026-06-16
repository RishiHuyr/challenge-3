import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'ecotrack_secret_jwt_key_987654321',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  DATA_DIR: path.join(__dirname, '..', '..', 'data'),
  ENV: process.env.NODE_ENV || 'development'
};
