import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';
import { CandlestickService } from './candlestick.service';

@Module({
  controllers: [PricesController],
  providers: [PricesService, CandlestickService],
  exports: [PricesService, CandlestickService],
})
export class PricesModule {}
