# Chareli Backend Server

A production-ready Express.js backend with TypeScript, PostgreSQL, and TypeORM.

## Features

- Express.js with TypeScript
- PostgreSQL database with TypeORM
- RESTful API architecture
- Error handling middleware
- Environment configuration
- Production-ready setup
- Swagger API documentation
- Comprehensive logging system

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Database Setup

1. Create a PostgreSQL database named `chareli_db` (or update the .env file with your database name)
2. Update the database configuration in the `.env` file

### Development

```bash
# Run in development mode
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── config/         # Configuration files
│   ├── config.ts   # Environment configuration
│   └── database.ts # Database connection setup
├── controllers/    # Request handlers
│   └── userController.ts # User CRUD operations
├── entities/       # TypeORM entities
│   └── User.ts     # User entity definition
├── middlewares/    # Express middlewares
│   ├── errorHandler.ts  # Error handling middleware
│   └── requestLogger.ts # HTTP request logging
├── migrations/     # Database migrations
│   └── *-CreateUserTable.ts # User table migration
├── routes/         # API routes
│   ├── index.ts    # Main router
│   └── userRoutes.ts # User routes
├── utils/          # Utility functions
│   └── logger.ts   # Winston logger configuration
├── app.ts          # Express app setup
└── index.ts        # Entry point
```

## Logging System

This project uses Winston for logging with the following features:

- **Multiple Log Levels**: error, warn, info, http, debug
- **Console Logging**: Colorized logs in development
- **File Logging**: 
  - `logs/all.log`: Contains all logs
  - `logs/error.log`: Contains only error logs
- **HTTP Request Logging**: Logs all HTTP requests with method, URL, status code, and response time
- **Error Logging**: Detailed error logging with stack traces

### Log Levels by Environment

- **Development**: All logs (debug level and above)
- **Production**: Only important logs (warn level and above)

## Database Migrations

This project uses TypeORM migrations to manage database schema changes. Migrations ensure that database changes are tracked in version control and can be applied consistently across different environments.

### Migration Commands

```bash
# Generate a migration based on entity changes
npm run migration:generate -- src/migrations/MigrationName

# Create an empty migration file
npm run migration:create -- src/migrations/MigrationName

# Run all pending migrations
npm run migration:run

# Revert the most recent migration
npm run migration:revert
```

### Migration Workflow

1. Update your entity files (e.g., User.ts)
2. Generate a migration: `npm run migration:generate -- src/migrations/AddNewFieldToUser`
3. Review the generated migration file in src/migrations/
4. Run the migration: `npm run migration:run`

## API Documentation

This project uses Swagger (OpenAPI) for API documentation and testing. The Swagger UI provides an interactive interface to explore and test the API endpoints without needing external tools like Postman.

### Accessing Swagger UI

When the server is running, you can access the Swagger documentation at:

```
http://localhost:5000/api-docs
```

### Features

- Interactive API documentation
- Test API endpoints directly from the browser
- Detailed request and response schemas
- Authentication support
- API endpoint grouping by tags

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update an existing user
- `DELETE /api/users/:id` - Delete a user

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=chareli_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=1h
