import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PricesService } from './prices.service';
import { CryptoPricesResponseDto } from './dto/crypto-prices-response.dto';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('crypto')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Get real-time crypto prices' })
  @ApiResponse({ status: 200, description: 'Crypto prices retrieved successfully', type: CryptoPricesResponseDto })
  async getCryptoPrices() {
    return this.pricesService.getCryptoPrices();
  }
}
