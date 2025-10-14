import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CryptoPricesResponseDto } from './dto/crypto-prices-response.dto';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private priceCache: { data: CryptoPricesResponseDto; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60 * 1000; // 60 seconds

  constructor(private readonly httpService: HttpService) {}

  async getCryptoPrices(): Promise<CryptoPricesResponseDto> {
    // Check cache first
    if (this.priceCache && Date.now() - this.priceCache.timestamp < this.CACHE_DURATION) {
      return this.priceCache.data;
    }

    try {
      // Fetch from CoinGecko API
      const response = await firstValueFrom(
        this.httpService.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: 'bitcoin,ethereum,solana,usd-coin,tether,pepe,dogecoin,shiba-inu,dogwifcoin,bonk',
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
        }),
      );

      const data = response.data;
      
      const prices = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: data.bitcoin?.usd?.toString() || '0',
          change24h: data.bitcoin?.usd_24h_change || 0,
          icon: 'btc',
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: data.ethereum?.usd?.toString() || '0',
          change24h: data.ethereum?.usd_24h_change || 0,
          icon: 'eth',
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          price: data.solana?.usd?.toString() || '0',
          change24h: data.solana?.usd_24h_change || 0,
          icon: 'sol',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          price: data['usd-coin']?.usd?.toString() || '1.00',
          change24h: data['usd-coin']?.usd_24h_change || 0,
          icon: 'usdc',
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          price: data.tether?.usd?.toString() || '1.00',
          change24h: data.tether?.usd_24h_change || 0,
          icon: 'usdt',
        },
        {
          symbol: 'PEPE',
          name: 'Pepe',
          price: data.pepe?.usd?.toString() || '0',
          change24h: data.pepe?.usd_24h_change || 0,
          icon: 'pepe',
        },
        {
          symbol: 'DOGE',
          name: 'Dogecoin',
          price: data.dogecoin?.usd?.toString() || '0',
          change24h: data.dogecoin?.usd_24h_change || 0,
          icon: 'doge',
        },
        {
          symbol: 'SHIB',
          name: 'Shiba Inu',
          price: data['shiba-inu']?.usd?.toString() || '0',
          change24h: data['shiba-inu']?.usd_24h_change || 0,
          icon: 'shib',
        },
        {
          symbol: 'WIF',
          name: 'Dogwifcoin',
          price: data.dogwifcoin?.usd?.toString() || '0',
          change24h: data.dogwifcoin?.usd_24h_change || 0,
          icon: 'wif',
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: data.bonk?.usd?.toString() || '0',
          change24h: data.bonk?.usd_24h_change || 0,
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
