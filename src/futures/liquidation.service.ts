import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CommittedMarkService } from './committed-mark.service';
import { OrderService } from './order.service';
import { WalletsService } from '../wallets/wallets.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class LiquidationService {
  private readonly logger = new Logger(LiquidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly committedMarkService: CommittedMarkService,
    private readonly orderService: OrderService,
    private readonly walletsService: WalletsService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Check for liquidations every 5 seconds
   */
  @Cron('*/5 * * * * *') // Every 5 seconds
  async checkLiquidations() {
    try {
      const openPositions = await this.prisma.futuresPosition.findMany({
        where: { status: 'OPEN' },
        include: { symbol: true },
      });

      for (const position of openPositions) {
        await this.checkPositionLiquidation(position);
      }
    } catch (error) {
      this.logger.error('Failed to check liquidations:', error);
    }
  }

  /**
   * Check if a position should be liquidated
   */
  private async checkPositionLiquidation(position: any) {
    try {
      // Get current committed mark price
      const markPrice = await this.committedMarkService.getCurrentCommittedMark(position.symbolId);
      
      // Calculate liquidation price
      const liquidationPrice = this.calculateLiquidationPrice(position);
      
      // Check if position should be liquidated
      const shouldLiquidate = this.shouldLiquidate(position, markPrice, liquidationPrice);
      
      if (shouldLiquidate) {
        await this.liquidatePosition(position, markPrice);
      }
    } catch (error) {
      this.logger.error(`Failed to check liquidation for position ${position.id}:`, error);
    }
  }

  /**
   * Calculate liquidation price for a position
   */
  private calculateLiquidationPrice(position: any): number {
    const { side, entryPrice, leverage, collateral, feesPaid } = position;
    const qty = Number(position.qty);
    
    // Calculate maintenance margin rate
    const mmr = this.calculateMaintenanceMarginRate(leverage);
    
    // Calculate available margin (collateral - fees paid)
    const availableMargin = Number(collateral) - Number(feesPaid);
    
    if (side === 'LONG') {
      // LONG liquidation: liq = entryPrice * (1 - (availableMargin / (qty * entryPrice)) - mmr)
      const marginRatio = availableMargin / (qty * entryPrice);
      return entryPrice * (1 - marginRatio - mmr);
    } else {
      // SHORT liquidation: liq = entryPrice * (1 + (availableMargin / (qty * entryPrice)) + mmr)
      const marginRatio = availableMargin / (qty * entryPrice);
      return entryPrice * (1 + marginRatio + mmr);
    }
  }

  /**
   * Calculate maintenance margin rate based on leverage
   */
  private calculateMaintenanceMarginRate(leverage: number): number {
    // mmr = 0.5% + (0.5% * log10(leverage)) (cap at 2.5%)
    const baseRate = 0.005; // 0.5%
    const leverageRate = 0.005 * Math.log10(leverage); // 0.5% * log10(leverage)
    return Math.min(0.025, baseRate + leverageRate); // Cap at 2.5%
  }

  /**
   * Determine if a position should be liquidated
   */
  private shouldLiquidate(position: any, markPrice: number, liquidationPrice: number): boolean {
    const { side } = position;
    
    if (side === 'LONG') {
      // LONG: liquidate if mark price falls below liquidation price
      return markPrice <= liquidationPrice;
    } else {
      // SHORT: liquidate if mark price rises above liquidation price
      return markPrice >= liquidationPrice;
    }
  }

  /**
   * Liquidate a position
   */
  private async liquidatePosition(position: any, markPrice: number) {
    try {
      this.logger.log(`Liquidating position ${position.id} at mark price ${markPrice}`);

      // Calculate liquidation PnL (always a loss for the user)
      const pnl = this.calculateLiquidationPnL(position, markPrice);
      
      // Calculate liquidation fee (penalty for being liquidated)
      const liquidationFee = Number(position.collateral) * 0.1; // 10% of collateral as penalty
      
      // Update position status
      await this.prisma.futuresPosition.update({
        where: { id: position.id },
        data: {
          status: 'LIQUIDATED',
          closedAt: new Date(),
          realizedPnl: pnl,
          feesPaid: Number(position.feesPaid) + liquidationFee,
        },
      });

      // Release remaining collateral (after liquidation fee)
      const remainingCollateral = Number(position.collateral) - liquidationFee;
      const quoteCurrency = position.symbol.quote;
      
      if (remainingCollateral > 0) {
        await this.walletsService.releaseFunds(
          position.userId,
          quoteCurrency,
          remainingCollateral.toString(),
          position.id
        );
      }

      // Record liquidation fee
      if (liquidationFee > 0) {
        await this.ledgerService.createUserTransaction(
          position.userId,
          quoteCurrency,
          -liquidationFee,
          'FUTURES_LIQUIDATION_FEE',
          position.id,
        );
      }

      // Record liquidation PnL (always negative)
      await this.ledgerService.createUserTransaction(
        position.userId,
        quoteCurrency,
        pnl,
        'FUTURES_LIQUIDATION_LOSS',
        position.id,
      );

      // Record futures transactions
      await this.prisma.futuresTx.createMany({
        data: [
          {
            userId: position.userId,
            positionId: position.id,
            symbolId: position.symbolId,
            type: 'LIQUIDATION',
            amount: pnl,
            currency: quoteCurrency,
            ref: position.id,
          },
          {
            userId: position.userId,
            positionId: position.id,
            symbolId: position.symbolId,
            type: 'LIQUIDATION',
            amount: -liquidationFee,
            currency: quoteCurrency,
            ref: position.id,
          },
        ],
      });

      this.logger.log(`Position ${position.id} liquidated: PnL ${pnl}, Fee ${liquidationFee}`);
    } catch (error) {
      this.logger.error(`Failed to liquidate position ${position.id}:`, error);
    }
  }

  /**
   * Calculate PnL for liquidation
   */
  private calculateLiquidationPnL(position: any, markPrice: number): number {
    const { side, entryPrice } = position;
    const qty = Number(position.qty);
    
    if (side === 'LONG') {
      return qty * (markPrice - entryPrice);
    } else {
      return qty * (entryPrice - markPrice);
    }
  }

  /**
   * Get liquidation price for a position (for display purposes)
   */
  async getLiquidationPrice(positionId: string): Promise<number> {
    const position = await this.prisma.futuresPosition.findUnique({
      where: { id: positionId },
    });

    if (!position || position.status !== 'OPEN') {
      throw new Error('Position not found or not open');
    }

    return this.calculateLiquidationPrice(position);
  }

  /**
   * Get maintenance margin rate for a leverage level
   */
  getMaintenanceMarginRate(leverage: number): number {
    return this.calculateMaintenanceMarginRate(leverage);
  }
}
