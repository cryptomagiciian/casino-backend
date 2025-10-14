import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricesService } from '../prices/prices.service';
import * as crypto from 'crypto';

@Injectable()
export class CommittedMarkService {
  private readonly logger = new Logger(CommittedMarkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricesService: PricesService,
  ) {}

  /**
   * Get the committed mark price for a symbol at a specific time
   * This is the provably-fair price used for settlement and liquidation
   */
  async getCommittedMark(symbolId: string, timestamp: Date): Promise<number> {
    try {
      // Get the active trading round
      const round = await this.getActiveRound();
      if (!round) {
        throw new Error('No active trading round found');
      }

      // Get baseline price from Gate.io
      const baselinePrice = await this.getBaselinePrice(symbolId);
      if (!baselinePrice) {
        throw new Error(`No baseline price found for symbol ${symbolId}`);
      }

      // Calculate the deterministic delta using TURBOWAVE algorithm
      const delta = this.calculateDelta(round.serverSeed, symbolId, timestamp, round.intervalMs);
      
      // Apply delta to baseline price
      const committedMark = baselinePrice + delta;

      this.logger.debug(`Committed mark for ${symbolId} at ${timestamp.toISOString()}: ${committedMark} (baseline: ${baselinePrice}, delta: ${delta})`);

      return Math.max(0, committedMark); // Ensure non-negative price
    } catch (error) {
      this.logger.error(`Failed to get committed mark for ${symbolId}:`, error);
      throw error;
    }
  }

  /**
   * Get current committed mark price
   */
  async getCurrentCommittedMark(symbolId: string): Promise<number> {
    return this.getCommittedMark(symbolId, new Date());
  }

  /**
   * Get baseline price from Gate.io for a symbol
   */
  private async getBaselinePrice(symbolId: string): Promise<number> {
    try {
      const prices = await this.pricesService.getCryptoPrices();
      const symbol = this.parseSymbolId(symbolId);
      
      // Find the price for this symbol
      const priceData = prices.prices.find(p => 
        p.symbol === symbol.base || 
        p.symbol === `${symbol.base}${symbol.quote}` ||
        p.symbol === `${symbol.base}_${symbol.quote}`
      );

      if (!priceData) {
        throw new Error(`Price not found for symbol ${symbolId}`);
      }

      return parseFloat(priceData.price);
    } catch (error) {
      this.logger.error(`Failed to get baseline price for ${symbolId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate deterministic delta using TURBOWAVE algorithm
   */
  private calculateDelta(
    serverSeed: string,
    symbolId: string,
    timestamp: Date,
    intervalMs: number
  ): number {
    // Calculate tick index based on timestamp and interval
    const roundStart = new Date(timestamp);
    roundStart.setUTCHours(0, 0, 0, 0); // Round to start of day
    
    const tickIndex = Math.floor((timestamp.getTime() - roundStart.getTime()) / intervalMs);
    
    // Create input for HMAC
    const input = `${symbolId}:${tickIndex}`;
    
    // Generate HMAC-SHA256 hash
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(input);
    const hash = hmac.digest();
    
    // Convert first 8 bytes to unsigned 32-bit integer
    const uint32 = hash.readUInt32BE(0);
    
    // Normalize to 0-1 range
    const u = uint32 / 0xFFFFFFFF;
    
    // Determine volatility scale based on symbol type
    const symbol = this.parseSymbolId(symbolId);
    const sigmaBps = symbol.isMajor ? 2.5 : 6.0; // majors: 2.5 bps, memes: 6.0 bps
    
    // Calculate signed delta in basis points
    const deltaBps = (u - 0.5) * 2 * sigmaBps;
    
    // Convert to price delta
    const baselinePrice = this.getBaselinePrice(symbolId); // This should be cached
    const delta = baselinePrice * (deltaBps / 10000);
    
    return delta;
  }

  /**
   * Get active trading round
   */
  private async getActiveRound() {
    return this.prisma.tradingRound.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });
  }

  /**
   * Parse symbol ID to extract base and quote currencies
   */
  private parseSymbolId(symbolId: string): { base: string; quote: string; isMajor: boolean } {
    const parts = symbolId.split('-');
    if (parts.length !== 2) {
      throw new Error(`Invalid symbol ID format: ${symbolId}`);
    }

    const [base, quote] = parts;
    const majorSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'ASTER'];
    const isMajor = majorSymbols.includes(base);

    return { base, quote, isMajor };
  }

  /**
   * Verify committed mark for a given timestamp (for fairness verification)
   */
  async verifyCommittedMark(
    symbolId: string,
    timestamp: Date,
    serverSeed: string
  ): Promise<number> {
    // This method is used for fairness verification
    // It recalculates the committed mark using the revealed server seed
    const round = await this.prisma.tradingRound.findFirst({
      where: {
        serverSeed,
        startsAt: { lte: timestamp },
        endsAt: { gte: timestamp },
      },
    });

    if (!round) {
      throw new Error('No trading round found for the given server seed and timestamp');
    }

    return this.calculateDelta(serverSeed, symbolId, timestamp, round.intervalMs);
  }
}
