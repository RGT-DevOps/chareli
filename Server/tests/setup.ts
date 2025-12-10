import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { DataSource, QueryRunner } from 'typeorm';

let queryRunner: QueryRunner;

// Mock Redis Service to prevent connection attempts during tests
jest.mock('../src/services/redis.service', () => ({
  redisService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    client: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
    },
    isConnected: jest.fn().mockReturnValue(true),
  },
}));

// Mock Queue Service
jest.mock('../src/services/queue.service', () => ({
  queueService: {
    addGameZipProcessingJob: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  },
}));

beforeAll(async () => {
  // Initialize database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

beforeEach(async () => {
  // Create a new query runner for this test
  queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  // Intercept AppDataSource.manager to use our transaction manager
  // This handles repository calls like AppDataSource.getRepository(User)
  Object.defineProperty(AppDataSource, 'manager', {
    configurable: true,
    get: () => queryRunner.manager,
  });

  // Intercept createQueryRunner to return our transaction-aware runner
  // This handles manual transaction management in controllers
  jest.spyOn(AppDataSource, 'createQueryRunner').mockReturnValue({
    ...queryRunner,
    startTransaction: jest.fn(), // No-op: we already started it
    commitTransaction: jest.fn(), // No-op: we will rollback instead
    rollbackTransaction: jest.fn(), // No-op: we handle rollback
    release: jest.fn(), // No-op: we release in afterEach
    connect: jest.fn(), // No-op: already connected
    manager: queryRunner.manager,
  } as any);
});

afterEach(async () => {
  // Rollback transaction to clean up database
  if (queryRunner && queryRunner.isTransactionActive) {
    await queryRunner.rollbackTransaction();
  }

  // Release query runner
  if (queryRunner && !queryRunner.isReleased) {
    await queryRunner.release();
  }

  // Restore mocks
  jest.restoreAllMocks();
});
