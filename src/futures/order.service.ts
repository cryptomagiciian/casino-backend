import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { LedgerService } from '../ledger/ledger.service';
import { CommittedMarkService } from './committed-mark.service';
import { ImpactFeeService } from './impact-fee.service';
import { OpenOrderDto, CloseOrderDto, OrderResponseDto, PositionSide } from './dto/order.dto';
import { Currency } from '../shared/constants';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
    private readonly ledgerService: LedgerService,
    private readonly committedMarkService: CommittedMarkService,
    private readonly impactFeeService: ImpactFeeService,
  ) {}

  /**
   * Open a new futures position
   */
  async openPosition(userId: string, orderData: OpenOrderDto): Promise<OrderResponseDto> {
    try {
      this.logger.log(`Opening position for user ${userId}:`, orderData);

      // Validate symbol
      const symbol = await this.prisma.futuresSymbol.findUnique({
        where: { id: orderData.symbolId },
      });

      if (!symbol || !symbol.isEnabled) {
        throw new BadRequestException('Invalid or disabled symbol');
      }

      // Validate leverage
      if (orderData.leverage > symbol.maxLeverage) {
        throw new BadRequestException(`Leverage exceeds maximum allowed (${symbol.maxLeverage}x)`);
      }

      // Get current committed mark price
      const entryPrice = await this.committedMarkService.getCurrentCommittedMark(orderData.symbolId);
      
      // Calculate quantity if not provided
      const qty = orderData.qty || (orderData.collateral * orderData.leverage) / entryPrice;
      const notional = qty * entryPrice;

      // Calculate fees
      const fees = this.impactFeeService.calculateOpenFees(notional);

      // Check if user has sufficient balance
      const quoteCurrency = symbol.quote as Currency;
      const network = orderData.network || 'mainnet'; // Default to mainnet if not specified
      this.logger.log(`Checking balance for user ${userId}, currency ${quoteCurrency}, network ${network}`);
      const walletBalance = await this.walletsService.getWalletBalance(userId, quoteCurrency, network as 'mainnet' | 'testnet');
      const availableBalance = parseFloat(walletBalance.available);
      this.logger.log(`Available balance: ${availableBalance}, Required: ${orderData.collateral + fees.totalFee}`);
      
      if (availableBalance < orderData.collateral + fees.totalFee) {
        throw new BadRequestException('Insufficient balance for position and fees');
      }

      // Create position
      const position = await this.prisma.futuresPosition.create({
        data: {
          userId,
          symbolId: orderData.symbolId,
          side: orderData.side,
          qty,
          entryPrice,
          collateral: orderData.collateral,
          leverage: orderData.leverage,
          openedAt: new Date(),
          status: 'OPEN',
          realizedPnl: 0,
          feesPaid: fees.totalFee,
        },
      });

      // Lock collateral and pay fees
      await this.walletsService.lockFunds(userId, quoteCurrency, orderData.collateral.toString(), position.id, network as 'mainnet' | 'testnet');
      await this.walletsService.lockFunds(userId, quoteCurrency, fees.totalFee.toString(), `fee-${position.id}`, network as 'mainnet' | 'testnet');

      // Record fees in ledger
      await this.ledgerService.createUserTransaction({
        userId,
        currency: quoteCurrency,
        amount: (-fees.openFee).toString(),
        type: 'FUTURES_OPEN_FEE',
        refId: position.id,
      });

      if (fees.impactFee > 0) {
        await this.ledgerService.createUserTransaction({
          userId,
          currency: quoteCurrency,
          amount: (-fees.impactFee).toString(),
          type: 'FUTURES_IMPACT_FEE',
          refId: position.id,
        });
      }

      // Record futures transaction
      await this.prisma.futuresTx.create({
        data: {
          userId,
          positionId: position.id,
          symbolId: orderData.symbolId,
          type: 'OPEN_FEE',
          amount: -fees.totalFee,
          currency: quoteCurrency,
          ref: position.id,
        },
      });

      this.logger.log(`Position opened: ${position.id} for user ${userId}`);

      return {
        success: true,
        positionId: position.id,
        message: 'Position opened successfully',
        fees: {
          openFee: fees.openFee,
          impactFee: fees.impactFee,
          totalFee: fees.totalFee,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to open position for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Close a futures position
   */
  async closePosition(userId: string, orderData: CloseOrderDto): Promise<OrderResponseDto> {
    try {
      const network = orderData.network || 'mainnet'; // Default to mainnet if not specified
      this.logger.log(`Closing position ${orderData.positionId} for user ${userId} on network ${network}`);

      // Get position
      const position = await this.prisma.futuresPosition.findFirst({
        where: {
          id: orderData.positionId,
          userId,
          status: 'OPEN',
        },
        include: {
          symbol: true,
        },
      });

      if (!position) {
        throw new BadRequestException('Position not found or not open');
      }

      // Get current committed mark price
      const exitPrice = await this.committedMarkService.getCurrentCommittedMark(position.symbolId);
      
      // Calculate PnL
      const closeQty = orderData.qty || Number(position.qty);
      const pnl = this.calculatePnL(
        position.side as PositionSide,
        Number(position.entryPrice),
        exitPrice,
        closeQty
      );

      // Calculate close fee
      const notional = closeQty * exitPrice;
      const closeFee = this.impactFeeService.calculateCloseFee(notional);

      // Calculate total settlement
      const totalSettlement = pnl + Number(position.collateral) - closeFee;

      // Update position
      const isFullClose = closeQty >= Number(position.qty);
      const newQty = isFullClose ? 0 : Number(position.qty) - closeQty;
      const newStatus = isFullClose ? 'CLOSED' : 'OPEN';

      await this.prisma.futuresPosition.update({
        where: { id: position.id },
        data: {
          qty: newQty,
          status: newStatus,
          closedAt: isFullClose ? new Date() : undefined,
          realizedPnl: Number(position.realizedPnl) + pnl,
          feesPaid: Number(position.feesPaid) + closeFee,
        },
      });

      // Release collateral and settle PnL
      const quoteCurrency = position.symbol.quote as Currency;
      
      if (isFullClose) {
        // Release all collateral
        await this.walletsService.releaseFunds(userId, quoteCurrency, position.collateral.toString(), position.id, network as 'mainnet' | 'testnet');
      } else {
        // Release proportional collateral
        const releasedCollateral = (closeQty / Number(position.qty)) * Number(position.collateral);
        await this.walletsService.releaseFunds(userId, quoteCurrency, releasedCollateral.toString(), position.id, network as 'mainnet' | 'testnet');
      }

      // Settle PnL
      if (totalSettlement > 0) {
        await this.walletsService.creditWinnings(userId, quoteCurrency, totalSettlement.toString(), position.id, network as 'mainnet' | 'testnet');
      } else if (totalSettlement < 0) {
        await this.walletsService.lockFunds(userId, quoteCurrency, Math.abs(totalSettlement).toString(), `close-${position.id}`, network as 'mainnet' | 'testnet');
      }

      // Record close fee
      if (closeFee > 0) {
        await this.ledgerService.createUserTransaction({
          userId,
          currency: quoteCurrency,
          amount: (-closeFee).toString(),
          type: 'FUTURES_CLOSE_FEE',
          refId: position.id,
        });
      }

      // Record PnL
      if (pnl !== 0) {
        await this.ledgerService.createUserTransaction({
          userId,
          currency: quoteCurrency,
          amount: pnl.toString(),
          type: pnl > 0 ? 'FUTURES_PNL_WIN' : 'FUTURES_PNL_LOSS',
          refId: position.id,
        });
      }

      // Record futures transactions
      await this.prisma.futuresTx.createMany({
        data: [
          {
            userId,
            positionId: position.id,
            symbolId: position.symbolId,
            type: 'CLOSE_FEE',
            amount: -closeFee,
            currency: quoteCurrency,
            ref: position.id,
          },
          {
            userId,
            positionId: position.id,
            symbolId: position.symbolId,
            type: 'PNL',
            amount: pnl,
            currency: quoteCurrency,
            ref: position.id,
          },
        ],
      });

      this.logger.log(`Position closed: ${position.id} for user ${userId}, PnL: ${pnl}`);

      return {
        success: true,
        positionId: position.id,
        message: isFullClose ? 'Position closed successfully' : 'Position partially closed',
        pnl,
      };
    } catch (error) {
      this.logger.error(`Failed to close position ${orderData.positionId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate PnL for a position
   */
  private calculatePnL(side: PositionSide, entryPrice: number, exitPrice: number, qty: number): number {
    if (side === PositionSide.LONG) {
      return qty * (exitPrice - entryPrice);
    } else {
      return qty * (entryPrice - exitPrice);
    }
  }

  /**
   * Cancel all open positions for a user (emergency function)
   */
  async cancelAllPositions(userId: string): Promise<{ cancelled: number }> {
    try {
      const openPositions = await this.prisma.futuresPosition.findMany({
        where: {
          userId,
          status: 'OPEN',
        },
      });

      let cancelled = 0;
      for (const position of openPositions) {
        try {
          await this.closePosition(userId, { positionId: position.id });
          cancelled++;
        } catch (error) {
          this.logger.error(`Failed to cancel position ${position.id}:`, error);
        }
      }

      this.logger.log(`Cancelled ${cancelled} positions for user ${userId}`);
      return { cancelled };
    } catch (error) {
      this.logger.error(`Failed to cancel all positions for user ${userId}:`, error);
      throw error;
    }
  }
}
