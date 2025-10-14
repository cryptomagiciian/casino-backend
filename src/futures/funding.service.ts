import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class FundingService {
  private readonly logger = new Logger(FundingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Apply funding payments hourly after 8 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async applyFunding() {
    try {
      this.logger.log('Applying funding payments...');

      // Get positions that have been open for more than 8 hours
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
      
      const positions = await this.prisma.futuresPosition.findMany({
        where: {
          status: 'OPEN',
          openedAt: { lte: eightHoursAgo },
        },
        include: {
          symbol: true,
        },
      });

      for (const position of positions) {
        await this.applyPositionFunding(position);
      }

      this.logger.log(`Applied funding to ${positions.length} positions`);
    } catch (error) {
      this.logger.error('Failed to apply funding:', error);
    }
  }

  /**
   * Apply funding to a specific position
   */
  private async applyPositionFunding(position: any) {
    try {
      // Get current funding rate (stub implementation)
      const fundingRate = this.getFundingRate(position.symbolId);
      
      // Calculate funding payment
      const notional = Number(position.qty) * Number(position.entryPrice);
      const fundingPayment = notional * fundingRate;
      
      if (Math.abs(fundingPayment) < 0.01) {
        return; // Skip very small funding payments
      }

      const quoteCurrency = position.symbol.quote;
      
      // Apply funding payment
      if (fundingPayment > 0) {
        // Positive funding: longs pay shorts
        if (position.side === 'LONG') {
          // Long pays (debit)
          await this.walletsService.lockFunds(
            position.userId,
            quoteCurrency,
            fundingPayment.toString(),
            `funding-${position.id}`
          );
        } else {
          // Short receives (credit)
          await this.walletsService.creditWinnings(
            position.userId,
            quoteCurrency,
            fundingPayment.toString(),
            `funding-${position.id}`
          );
        }
      } else {
        // Negative funding: shorts pay longs
        if (position.side === 'SHORT') {
          // Short pays (debit)
          await this.walletsService.lockFunds(
            position.userId,
            quoteCurrency,
            Math.abs(fundingPayment).toString(),
            `funding-${position.id}`
          );
        } else {
          // Long receives (credit)
          await this.walletsService.creditWinnings(
            position.userId,
            quoteCurrency,
            Math.abs(fundingPayment).toString(),
            `funding-${position.id}`
          );
        }
      }

      // Record in ledger
      await this.ledgerService.createUserTransaction({
        userId: position.userId,
        currency: quoteCurrency,
        amount: fundingPayment.toString(),
        type: 'FUTURES_FUNDING',
        refId: position.id,
      });

      // Record futures transaction
      await this.prisma.futuresTx.create({
        data: {
          userId: position.userId,
          positionId: position.id,
          symbolId: position.symbolId,
          type: 'FUNDING',
          amount: fundingPayment,
          currency: quoteCurrency,
          ref: position.id,
        },
      });

      this.logger.debug(`Applied funding ${fundingPayment} to position ${position.id}`);
    } catch (error) {
      this.logger.error(`Failed to apply funding to position ${position.id}:`, error);
    }
  }

  /**
   * Get funding rate for a symbol (stub implementation)
   * In production, this would come from a funding oracle
   */
  private getFundingRate(symbolId: string): number {
    // Stub: return a small funding rate (±0.10% per hour)
    // In production, this would be calculated based on market conditions
    const baseRate = 0.001; // 0.10% per hour
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    return baseRate * randomFactor;
  }

  /**
   * Get current funding rate for display
   */
  getCurrentFundingRate(symbolId: string): number {
    return this.getFundingRate(symbolId);
  }
}
