import { Injectable, Logger } from '@nestjs/common';

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class CandlestickService {
  private readonly logger = new Logger(CandlestickService.name);
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds cache
  private candlestickCache: Map<string, { data: CandlestickData[]; timestamp: number }> = new Map();

  constructor() {}

  /**
   * Get candlestick data for a symbol and timeframe
   */
  async getCandlestickData(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<CandlestickData[]> {
    const cacheKey = `${symbol}_${timeframe}_${limit}`;
    
    // Check cache first
    const cached = this.candlestickCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Convert timeframe to Gate.io format
      const gateTimeframe = this.convertTimeframe(timeframe);
      
      // Fetch from Gate.io API
      const response = await fetch(
        `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${symbol}_USDT&interval=${gateTimeframe}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any[];
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Gate.io');
      }

      const candlesticks: CandlestickData[] = data.map((candle: any) => ({
        timestamp: parseInt(candle[0]) * 1000, // Convert to milliseconds
        open: parseFloat(candle[2]),
        high: parseFloat(candle[3]),
        low: parseFloat(candle[4]),
        close: parseFloat(candle[5]),
        volume: parseFloat(candle[6]),
      }));

      // Cache the result
      this.candlestickCache.set(cacheKey, {
        data: candlesticks,
        timestamp: Date.now()
      });

      this.logger.log(`Fetched ${candlesticks.length} candlesticks for ${symbol} ${timeframe}`);
      return candlesticks;

    } catch (error) {
      this.logger.error(`Failed to fetch candlestick data for ${symbol} ${timeframe}:`, error);
      
      // Return mock data as fallback
      return this.generateMockData(symbol, timeframe, limit);
    }
  }

  /**
   * Convert our timeframe format to Gate.io format
   */
  private convertTimeframe(timeframe: string): string {
    const timeframeMap: Record<string, string> = {
      '5s': '5s',
      '15s': '15s', 
      '30s': '30s',
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d'
    };
    
    return timeframeMap[timeframe] || '1m';
  }

  /**
   * Generate mock candlestick data as fallback
   */
  private generateMockData(symbol: string, timeframe: string, limit: number): CandlestickData[] {
    const now = Date.now();
    const intervalMs = this.getIntervalMs(timeframe);
    const basePrice = this.getBasePrice(symbol);
    
    const candlesticks: CandlestickData[] = [];
    let currentPrice = basePrice;
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      
      // Generate realistic price movement
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      const newPrice = currentPrice * (1 + change);
      
      const open = currentPrice;
      const close = newPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;
      
      candlesticks.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = newPrice;
    }
    
    this.logger.log(`Generated ${candlesticks.length} mock candlesticks for ${symbol} ${timeframe}`);
    return candlesticks;
  }

  /**
   * Get interval in milliseconds for timeframe
   */
  private getIntervalMs(timeframe: string): number {
    const intervalMap: Record<string, number> = {
      '5s': 5 * 1000,
      '15s': 15 * 1000,
      '30s': 30 * 1000,
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    
    return intervalMap[timeframe] || 60 * 1000; // Default to 1 minute
  }

  /**
   * Get base price for symbol
   */
  private getBasePrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTC': 45000,
      'ETH': 2500,
      'SOL': 100,
      'BNB': 300,
      'ASTER': 0.5,
      'COAI': 0.1,
      'SUI': 2,
      'USELESS': 0.0001,
      'TROLL': 0.01,
      'PUMPFUN': 0.05,
      '4': 0.02
    };
    
    return basePrices[symbol] || 100;
  }
}
