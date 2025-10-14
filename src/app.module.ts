import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
// import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { LedgerModule } from './ledger/ledger.module';
import { FairnessModule } from './fairness/fairness.module';
import { BetsModule } from './bets/bets.module';
import { GamesModule } from './games/games.module';
import { DepositsModule } from './deposits/deposits.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { HealthModule } from './health/health.module';
import { PricesModule } from './prices/prices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
      {
        name: 'crypto-prices',
        ttl: 60 * 1000, // 1 minute
        limit: 1, // 1 request per minute per IP
      },
      {
        name: 'live-wins',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // 10 requests per minute per IP
      },
      {
        name: 'game-search',
        ttl: 60 * 1000, // 1 minute
        limit: 30, // 30 requests per minute per IP
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      store: 'memory',
    }),
    // LoggerModule.forRoot({
    //   pinoHttp: {
    //     level: process.env.LOG_LEVEL || 'info',
    //     transport: {
    //       target: 'pino-pretty',
    //       options: {
    //         colorize: true,
    //       },
    //     },
    //   },
    // }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    LedgerModule,
    FairnessModule,
    BetsModule,
    GamesModule,
    DepositsModule,
    WithdrawalsModule,
    LeaderboardModule,
    HealthModule,
    PricesModule,
  ],
})
export class AppModule {}
