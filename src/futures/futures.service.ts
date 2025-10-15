import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FuturesSymbolDto, TradingRoundDto } from './dto/futures-symbol.dto';
import { FuturesPositionDto, PositionListDto } from './dto/position.dto';

@Injectable()
export class FuturesService {
  private readonly logger = new Logger(FuturesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available futures symbols
   */
  async getSymbols(): Promise<FuturesSymbolDto[]> {
    const symbols = await this.prisma.futuresSymbol.findMany({
      where: { isEnabled: true },
      orderBy: [
        { isMajor: 'desc' }, // Majors first
        { base: 'asc' },
      ],
    });

    return symbols.map(symbol => ({
      id: symbol.id,
      base: symbol.base,
      quote: symbol.quote,
      maxLeverage: symbol.maxLeverage,
      isMajor: symbol.isMajor,
      isEnabled: symbol.isEnabled,
      createdAt: symbol.createdAt,
    }));
  }

  /**
   * Get current trading round
   */
  async getCurrentRound(): Promise<TradingRoundDto | null> {
    const round = await this.prisma.tradingRound.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });

    if (!round) {
      return null;
    }

    return {
      id: round.id,
      serverSeedHash: round.serverSeedHash,
      startsAt: round.startsAt,
      endsAt: round.endsAt,
      intervalMs: round.intervalMs,
      isActive: round.isActive,
      revealedAt: round.revealedAt,
    };
  }

  /**
   * Get user's positions
   */
  async getUserPositions(
    userId: string,
    status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED',
    page = 1,
    limit = 20
  ): Promise<PositionListDto> {
    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [positions, total] = await Promise.all([
      this.prisma.futuresPosition.findMany({
        where,
        include: {
          symbol: true,
        },
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
      }),
      this.prisma.futuresPosition.count({ where }),
    ]);

    const positionDtos = positions.map(position => ({
      id: position.id,
      symbolId: position.symbolId,
      side: position.side,
      qty: Number(position.qty),
      entryPrice: Number(position.entryPrice),
      collateral: Number(position.collateral),
      leverage: position.leverage,
      openedAt: position.openedAt,
      closedAt: position.closedAt,
      status: position.status,
      realizedPnl: Number(position.realizedPnl),
      feesPaid: Number(position.feesPaid),
      borrowStartAt: position.borrowStartAt,
    }));

    return {
      positions: positionDtos,
      total,
    };
  }

  /**
   * Get position by ID
   */
  async getPositionById(positionId: string, userId: string): Promise<FuturesPositionDto | null> {
    const position = await this.prisma.futuresPosition.findFirst({
      where: {
        id: positionId,
        userId,
      },
      include: {
        symbol: true,
      },
    });

    if (!position) {
      return null;
    }

    return {
      id: position.id,
      symbolId: position.symbolId,
      side: position.side,
      qty: Number(position.qty),
      entryPrice: Number(position.entryPrice),
      collateral: Number(position.collateral),
      leverage: position.leverage,
      openedAt: position.openedAt,
      closedAt: position.closedAt,
      status: position.status,
      realizedPnl: Number(position.realizedPnl),
      feesPaid: Number(position.feesPaid),
      borrowStartAt: position.borrowStartAt,
    };
  }

  /**
   * Get symbol by ID
   */
  async getSymbolById(symbolId: string) {
    return this.prisma.futuresSymbol.findUnique({
      where: { id: symbolId },
    });
  }

  /**
   * Seed initial futures symbols
   */
  async seedSymbols() {
    const majorSymbols = [
      { base: 'BTC', quote: 'USDC', maxLeverage: 1000 },
      { base: 'ETH', quote: 'USDC', maxLeverage: 1000 },
      { base: 'SOL', quote: 'USDC', maxLeverage: 1000 },
      { base: 'BNB', quote: 'USDC', maxLeverage: 1000 },
    ];

    const memeSymbols = [
      { base: 'ASTER', quote: 'USDC', maxLeverage: 10 },
      { base: 'COAI', quote: 'USDC', maxLeverage: 10 },
      { base: 'SUI', quote: 'USDC', maxLeverage: 10 },
      { base: 'USELESS', quote: 'USDC', maxLeverage: 10 },
      { base: 'TROLL', quote: 'USDC', maxLeverage: 10 },
      { base: 'PUMPFUN', quote: 'USDC', maxLeverage: 10 },
      { base: '4', quote: 'USDC', maxLeverage: 10 },
    ];

    const allSymbols = [
      ...majorSymbols.map(s => ({ ...s, isMajor: true })),
      ...memeSymbols.map(s => ({ ...s, isMajor: false })),
    ];

    for (const symbolData of allSymbols) {
      const symbolId = `${symbolData.base}-${symbolData.quote}`;
      
      await this.prisma.futuresSymbol.upsert({
        where: { id: symbolId },
        update: {
          maxLeverage: symbolData.maxLeverage,
          isMajor: symbolData.isMajor,
          isEnabled: true,
        },
        create: {
          id: symbolId,
          base: symbolData.base,
          quote: symbolData.quote,
          maxLeverage: symbolData.maxLeverage,
          isMajor: symbolData.isMajor,
          isEnabled: true,
        },
      });
    }

    this.logger.log(`Seeded ${allSymbols.length} futures symbols`);
  }
}
