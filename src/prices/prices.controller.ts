import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { PricesService } from './prices.service';
import { CandlestickService } from './candlestick.service';
import { CryptoPricesResponseDto } from './dto/crypto-prices-response.dto';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(
    private readonly pricesService: PricesService,
    private readonly candlestickService: CandlestickService
  ) {}

  @Get('crypto')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Get real-time crypto prices' })
  @ApiResponse({ status: 200, description: 'Crypto prices retrieved successfully', type: CryptoPricesResponseDto })
  async getCryptoPrices() {
    return this.pricesService.getCryptoPrices();
  }

  @Get('candlesticks')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Get candlestick data for trading charts' })
  @ApiQuery({ name: 'symbol', description: 'Trading symbol (e.g., BTC, ETH, SOL)', example: 'BTC' })
  @ApiQuery({ name: 'timeframe', description: 'Timeframe (5s, 15s, 30s, 1m, 5m, 15m, 1h, 4h, 1d)', example: '1m' })
  @ApiQuery({ name: 'limit', description: 'Number of candles to return', example: 100, required: false })
  @ApiResponse({ status: 200, description: 'Candlestick data retrieved successfully' })
  async getCandlestickData(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('limit') limit?: number
  ) {
    return this.candlestickService.getCandlestickData(symbol, timeframe, limit || 100);
  }
}
