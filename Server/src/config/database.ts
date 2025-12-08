import { DataSource } from 'typeorm';
import config from './config';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: false, // Set to false to disable SQL query logs
  entities: [path.join(__dirname, '../entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.{ts,js}')],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timed out')), 5000)
    );
    await Promise.race([AppDataSource.initialize(), timeout]);
    console.log('Database connection established');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};
