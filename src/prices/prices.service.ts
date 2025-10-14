import { Injectable, Logger } from '@nestjs/common';
import { CryptoPricesResponseDto } from './dto/crypto-prices-response.dto';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private priceCache: { data: CryptoPricesResponseDto; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60 * 1000; // 60 seconds

  constructor() {}

  async getCryptoPrices(): Promise<CryptoPricesResponseDto> {
    // Check cache first
    if (this.priceCache && Date.now() - this.priceCache.timestamp < this.CACHE_DURATION) {
      return this.priceCache.data;
    }

    try {
      // Fetch from Gate.io API using built-in fetch
      const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any[];
      
      // Create a map of Gate.io ticker symbols to our desired format
      const tickerMap: Record<string, any> = {};
      data.forEach((ticker: any) => {
        tickerMap[ticker.currency_pair] = ticker;
      });

      const prices = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: tickerMap['BTC_USDT']?.last || '45000.00',
          change24h: tickerMap['BTC_USDT']?.change_percentage ? parseFloat(tickerMap['BTC_USDT'].change_percentage) : 0,
          icon: 'btc',
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: tickerMap['ETH_USDT']?.last || '2500.00',
          change24h: tickerMap['ETH_USDT']?.change_percentage ? parseFloat(tickerMap['ETH_USDT'].change_percentage) : 0,
          icon: 'eth',
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          price: tickerMap['SOL_USDT']?.last || '100.00',
          change24h: tickerMap['SOL_USDT']?.change_percentage ? parseFloat(tickerMap['SOL_USDT'].change_percentage) : 0,
          icon: 'sol',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          price: tickerMap['USDC_USDT']?.last || '1.00',
          change24h: tickerMap['USDC_USDT']?.change_percentage ? parseFloat(tickerMap['USDC_USDT'].change_percentage) : 0,
          icon: 'usdc',
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          price: '1.00',
          change24h: 0,
          icon: 'usdt',
        },
        {
          symbol: 'PEPE',
          name: 'Pepe',
          price: tickerMap['PEPE_USDT']?.last || '0.00000123',
          change24h: tickerMap['PEPE_USDT']?.change_percentage ? parseFloat(tickerMap['PEPE_USDT'].change_percentage) : 0,
          icon: 'pepe',
        },
        {
          symbol: 'DOGE',
          name: 'Dogecoin',
          price: tickerMap['DOGE_USDT']?.last || '0.1500',
          change24h: tickerMap['DOGE_USDT']?.change_percentage ? parseFloat(tickerMap['DOGE_USDT'].change_percentage) : 0,
          icon: 'doge',
        },
        {
          symbol: 'SHIB',
          name: 'Shiba Inu',
          price: tickerMap['SHIB_USDT']?.last || '0.00000800',
          change24h: tickerMap['SHIB_USDT']?.change_percentage ? parseFloat(tickerMap['SHIB_USDT'].change_percentage) : 0,
          icon: 'shib',
        },
        {
          symbol: 'WIF',
          name: 'Dogwifhat',
          price: tickerMap['WIF_USDT']?.last || '2.5000',
          change24h: tickerMap['WIF_USDT']?.change_percentage ? parseFloat(tickerMap['WIF_USDT'].change_percentage) : 0,
          icon: 'wif',
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: tickerMap['BONK_USDT']?.last || '0.00002000',
          change24h: tickerMap['BONK_USDT']?.change_percentage ? parseFloat(tickerMap['BONK_USDT'].change_percentage) : 0,
          icon: 'bonk',
        },
      ];

      const result = { prices };
      
      // Cache the result
      this.priceCache = {
        data: result,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch crypto prices:', error);
      
      // Return cached data if available, otherwise return default prices
      if (this.priceCache) {
        return this.priceCache.data;
      }
      
      // Fallback prices
      return {
        prices: [
          { symbol: 'BTC', name: 'Bitcoin', price: '45000', change24h: 0, icon: 'btc' },
          { symbol: 'ETH', name: 'Ethereum', price: '2500', change24h: 0, icon: 'eth' },
          { symbol: 'SOL', name: 'Solana', price: '100', change24h: 0, icon: 'sol' },
          { symbol: 'USDC', name: 'USD Coin', price: '1.00', change24h: 0, icon: 'usdc' },
          { symbol: 'USDT', name: 'Tether', price: '1.00', change24h: 0, icon: 'usdt' },
        ],
      };
    }
  }
}
