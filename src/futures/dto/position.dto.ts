import { ApiProperty } from '@nestjs/swagger';

export class FuturesPositionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  symbolId: string;

  @ApiProperty()
  side: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  entryPrice: number;

  @ApiProperty()
  collateral: number;

  @ApiProperty()
  leverage: number;

  @ApiProperty()
  openedAt: Date;

  @ApiProperty({ required: false })
  closedAt?: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  realizedPnl: number;

  @ApiProperty()
  feesPaid: number;

  @ApiProperty({ required: false })
  borrowStartAt?: Date;

  @ApiProperty({ required: false })
  liquidationPrice?: number;

  @ApiProperty({ required: false })
  unrealizedPnl?: number;

  @ApiProperty({ required: false })
  markPrice?: number;
}

export class PositionListDto {
  @ApiProperty({ type: [FuturesPositionDto] })
  positions: FuturesPositionDto[];

  @ApiProperty()
  total: number;
}
