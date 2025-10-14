import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class DepositWebhookDto {
  @ApiProperty({ description: 'Deposit ID', example: 'dep_123456' })
  @IsString()
  depositId: string;

  @ApiProperty({ description: 'Transaction hash', example: '0x1234567890abcdef...' })
  @IsString()
  transactionHash: string;

  @ApiProperty({ description: 'Number of confirmations', example: 3 })
  @IsNumber()
  confirmations: number;

  @ApiProperty({ description: 'Webhook signature for verification', example: 'sha256=abc123...' })
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Webhook source', example: 'blockchain_monitor', enum: ['blockchain_monitor', 'payment_processor', 'manual'] })
  @IsString()
  @IsIn(['blockchain_monitor', 'payment_processor', 'manual'])
  source: 'blockchain_monitor' | 'payment_processor' | 'manual';
}
