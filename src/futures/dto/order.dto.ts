import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export class OpenOrderDto {
  @ApiProperty({ description: 'Symbol ID (e.g., BTC-USDC)' })
  @IsString()
  symbolId: string;

  @ApiProperty({ enum: PositionSide, description: 'Position side' })
  @IsEnum(PositionSide)
  side: PositionSide;

  @ApiProperty({ description: 'Leverage (1-1000 for majors, 1-10 for memes)' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  leverage: number;

  @ApiProperty({ description: 'Collateral amount in quote currency' })
  @IsNumber()
  @Min(0.01)
  collateral: number;

  @ApiProperty({ description: 'Quantity in base units (optional, calculated from collateral if not provided)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  qty?: number;

  @ApiProperty({ description: 'Split size for impact reduction (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  splitSize?: number;

  @ApiProperty({ description: 'Network for trading (mainnet/testnet)', required: false })
  @IsOptional()
  @IsString()
  network?: string;
}

export class CloseOrderDto {
  @ApiProperty({ description: 'Position ID to close' })
  @IsString()
  positionId: string;

  @ApiProperty({ description: 'Quantity to close (partial close if less than position size)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  qty?: number;
}

export class OrderResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  positionId?: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  fees?: {
    openFee: number;
    impactFee: number;
    totalFee: number;
  };

  @ApiProperty({ required: false })
  pnl?: number;
}
