import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class BorrowService {
  private readonly logger = new Logger(BorrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Apply borrow fees hourly after 8 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async applyBorrowFees() {
    try {
      this.logger.log('Applying borrow fees...');

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
        await this.applyPositionBorrowFee(position);
      }

      this.logger.log(`Applied borrow fees to ${positions.length} positions`);
    } catch (error) {
      this.logger.error('Failed to apply borrow fees:', error);
    }
  }

  /**
   * Apply borrow fee to a specific position
   */
  private async applyPositionBorrowFee(position: any) {
    try {
      // Calculate borrow fee
      const borrowRate = this.getBorrowRate(position.symbolId);
      const positionSize = Number(position.qty) * Number(position.entryPrice);
      const borrowFee = positionSize * borrowRate;
      
      if (borrowFee < 0.01) {
        return; // Skip very small borrow fees
      }

      const quoteCurrency = position.symbol.quote;
      
      // Debit borrow fee from user's wallet
      await this.walletsService.lockFunds(
        position.userId,
        quoteCurrency,
        borrowFee.toString(),
        `borrow-${position.id}`
      );

      // Record in ledger
      await this.ledgerService.createUserTransaction({
        userId: position.userId,
        currency: quoteCurrency,
        amount: (-borrowFee).toString(),
        type: 'FUTURES_BORROW_FEE',
        refId: position.id,
      });

      // Record futures transaction
      await this.prisma.futuresTx.create({
        data: {
          userId: position.userId,
          positionId: position.id,
          symbolId: position.symbolId,
          type: 'BORROW',
          amount: -borrowFee,
          currency: quoteCurrency,
          ref: position.id,
        },
      });

      // Update position fees
      await this.prisma.futuresPosition.update({
        where: { id: position.id },
        data: {
          feesPaid: {
            increment: borrowFee,
          },
        },
      });

      this.logger.debug(`Applied borrow fee ${borrowFee} to position ${position.id}`);
    } catch (error) {
      this.logger.error(`Failed to apply borrow fee to position ${position.id}:`, error);
    }
  }

  /**
   * Get borrow rate for a symbol
   */
  private getBorrowRate(symbolId: string): number {
    // Stub: return a small borrow rate (0.01% per hour)
    // In production, this would be calculated based on market conditions
    return 0.0001; // 0.01% per hour
  }

  /**
   * Get current borrow rate for display
   */
  getCurrentBorrowRate(symbolId: string): number {
    return this.getBorrowRate(symbolId);
  }
}
