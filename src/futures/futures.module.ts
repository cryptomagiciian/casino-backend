import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PricesModule } from '../prices/prices.module';
import { FuturesController } from './futures.controller';
import { FuturesService } from './futures.service';
import { CommittedMarkService } from './committed-mark.service';
import { OrderService } from './order.service';
import { LiquidationService } from './liquidation.service';
import { FundingService } from './funding.service';
import { BorrowService } from './borrow.service';
import { RoundService } from './round.service';
import { ImpactFeeService } from './impact-fee.service';

@Module({
  imports: [PrismaModule, WalletsModule, LedgerModule, PricesModule],
  controllers: [FuturesController],
  providers: [
    FuturesService,
    CommittedMarkService,
    OrderService,
    LiquidationService,
    FundingService,
    BorrowService,
    RoundService,
    ImpactFeeService,
  ],
  exports: [
    FuturesService,
    CommittedMarkService,
    OrderService,
    LiquidationService,
    FundingService,
    BorrowService,
    RoundService,
    ImpactFeeService,
  ],
})
export class FuturesModule {}
