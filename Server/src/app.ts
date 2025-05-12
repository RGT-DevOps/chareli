import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import logger from './utils/logger';
import { specs } from './config/swagger';

const app: Express = express();

// Request logging middleware
app.use(requestLogger);

// Security middleware
app.use(helmet()); 
app.use(cors()); 

// Body parsing middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'none',
  },
}));

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);
logger.info('Express application initialized');

export default app;
