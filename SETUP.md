# Casino Backend Setup Guide

## 🎯 Project Overview

This is a production-grade mini-casino backend with multi-asset balances and 9 simple games, featuring provably fair gaming, deposit webhooks, and a clean REST API.

## ✅ Completed Features

### Core Infrastructure
- ✅ NestJS with TypeScript
- ✅ PostgreSQL with Prisma ORM
- ✅ Redis for caching
- ✅ Docker & Docker Compose setup
- ✅ JWT Authentication (access + refresh tokens)
- ✅ Rate limiting and CORS
- ✅ Swagger/OpenAPI documentation
- ✅ Comprehensive logging setup

### Database Models
- ✅ User management with auth providers
- ✅ Multi-currency wallet accounts (BTC, ETH, SOL, USDC, USDT)
- ✅ Double-entry ledger system
- ✅ Bet tracking with provably fair seeds
- ✅ Game configurations
- ✅ Deposit/withdrawal management
- ✅ Daily leaderboards

### Provably Fair System
- ✅ Server seed generation and hashing
- ✅ Client seed support
- ✅ Nonce-based RNG
- ✅ Fairness verification endpoint
- ✅ Seed rotation and revelation

### 9 Casino Games
1. ✅ **Candle Flip** - Predict next candle color (49.5% @ 1.98x)
2. ✅ **Pump or Dump** - Price direction prediction (49.5% @ 1.98x)
3. ✅ **Support or Resistance** - Level break/reject (48.5% @ 2.02x)
4. ✅ **Bull vs Bear Battle** - Tug-of-war direction (49% @ 2.0x)
5. ✅ **Leverage Ladder** - Progressive multipliers [1.3, 1.69, 2.19, 2.85, 3.7, 4.8]
6. ✅ **Stop Loss Roulette** - Dynamic payout based on SL distance
7. ✅ **Freeze the Bag** - Cash out before crash
8. ✅ **To the Moon** - Classic crash game
9. ✅ **Diamond Hands** - Mines replica (5x5 grid)

### API Endpoints
- ✅ Authentication (register, login, refresh, profile)
- ✅ Wallet management (balances, faucet, ledger)
- ✅ Game catalog and configuration
- ✅ Bet placement and resolution
- ✅ Fairness verification
- ✅ Deposit/withdrawal handling
- ✅ Leaderboard system
- ✅ Health checks

### Demo Mode Features
- ✅ Faucet functionality for all currencies
- ✅ Daily limits and restrictions
- ✅ Demo user seeding
- ✅ Withdrawal rejection in demo mode

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Ensure you have:
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
```

### 2. Installation
```bash
# Clone and install
git clone <repository-url>
cd casino
npm install

# Copy environment file
cp env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
```bash
# Start services
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Seed database
npm run prisma:seed
```

### 4. Start Development
```bash
npm run start:dev
```

### 5. Access Points
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/api/v1/health

## 🧪 Testing

### Run Tests
```bash
npm run test
npm run test:watch
npm run test:cov
```

### API Testing
Use the provided `examples.http` file with your HTTP client (VS Code REST Client, Postman, etc.)

## 🎮 Demo Users

The seed script creates these demo users:
- **demo_user_1** / **demo_user_2** - Regular users with demo funds
- **admin** - Admin user for testing admin endpoints

All users have password: `password123`

## 💰 Demo Funds

Demo users start with:
- 1000 USDC (from faucet)
- Access to all currencies via faucet
- Daily faucet limits per currency

## 🔧 Configuration

### Environment Variables
Key settings in `.env`:
```env
# Demo Mode
DEMO_MODE=true
DEMO_ONLY=false

# Database
DATABASE_URL="postgresql://casino:casino123@localhost:5432/casino_db"

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Game Configuration
Games can be configured via the database:
- House edge (basis points)
- Game-specific parameters
- RTP calculations

## 📊 API Examples

### Authentication Flow
```bash
# 1. Register
POST /auth/register
{
  "handle": "testuser",
  "email": "test@example.com", 
  "password": "password123"
}

# 2. Login
POST /auth/login
{
  "handle": "testuser",
  "password": "password123"
}

# 3. Use token in subsequent requests
Authorization: Bearer <access_token>
```

### Betting Flow
```bash
# 1. Get faucet funds (demo mode)
POST /wallets/faucet
{
  "currency": "USDC",
  "amount": "100.00"
}

# 2. Preview bet
POST /bets/preview
{
  "game": "candle_flip",
  "currency": "USDC", 
  "stake": "10.00",
  "params": {"prediction": "red"}
}

# 3. Place bet
POST /bets/place
{
  "game": "candle_flip",
  "currency": "USDC",
  "stake": "10.00",
  "clientSeed": "my_seed_123",
  "params": {"prediction": "red"}
}

# 4. Resolve bet (admin)
POST /bets/resolve/{betId}

# 5. Verify fairness
POST /fairness/verify
{
  "serverSeed": "revealed_seed",
  "clientSeed": "my_seed_123", 
  "nonce": 1,
  "game": "candle_flip"
}
```

## 🏗️ Architecture

### Project Structure
```
src/
├── auth/           # JWT authentication
├── bets/           # Bet engine and management
├── deposits/       # Deposit handling
├── fairness/       # Provably fair system
├── games/          # Game logic and configuration
├── health/         # Health checks
├── leaderboard/    # Daily leaderboards
├── ledger/         # Double-entry accounting
├── prisma/         # Database service
├── shared/         # Types, constants, utilities
├── users/          # User management
├── wallets/        # Wallet and balance management
└── withdrawals/    # Withdrawal handling
```

### Key Design Patterns
- **Modular Architecture**: Each feature in its own module
- **Service Layer**: Business logic separated from controllers
- **Repository Pattern**: Prisma for data access
- **DTO Pattern**: Request/response validation
- **Guard Pattern**: Authentication and authorization
- **Factory Pattern**: Game outcome generation

## 🔒 Security Features

- JWT authentication with refresh tokens
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation with class-validator
- SQL injection protection via Prisma
- XSS protection
- Demo mode restrictions

## 📈 Monitoring & Observability

- Health check endpoint
- Structured logging
- Error tracking
- Performance monitoring hooks
- Database query logging
- Request/response logging

## 🚀 Production Deployment

### Docker Production
```bash
# Build production image
docker build -t casino-backend .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database
- Set secure JWT secrets
- Configure Redis cluster
- Set up monitoring
- Configure load balancer

## 🎯 Acceptance Criteria Met

✅ **Registration/Login**: Users can register and login with JWT tokens
✅ **Faucet Functionality**: Demo users can get USDC from faucet
✅ **Bet Placement**: Users can place Candle Flip bets
✅ **Provably Fair**: Bet outcomes are verifiable with seed system
✅ **Ledger Reconciliation**: All transactions properly recorded
✅ **Crash Games**: To the Moon with cashout functionality
✅ **Mines Game**: Diamond Hands with consistent grid generation
✅ **API Documentation**: Complete Swagger documentation for all 9 games

## 🎉 Ready for Demo!

The casino backend is now fully functional and ready for demonstration. All core features are implemented, tested, and documented. Users can:

1. Register and authenticate
2. Get demo funds via faucet
3. Play all 9 games with provably fair outcomes
4. View transaction history and balances
5. Verify fairness of any bet
6. Access comprehensive API documentation

The system is production-ready with proper security, monitoring, and scalability considerations.
