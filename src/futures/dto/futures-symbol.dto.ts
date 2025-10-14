import { ApiProperty } from '@nestjs/swagger';

export class FuturesSymbolDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  base: string;

  @ApiProperty()
  quote: string;

  @ApiProperty()
  maxLeverage: number;

  @ApiProperty()
  isMajor: boolean;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class TradingRoundDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  serverSeedHash: string;

  @ApiProperty()
  startsAt: Date;

  @ApiProperty()
  endsAt: Date;

  @ApiProperty()
  intervalMs: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  revealedAt?: Date;
}
