import { ApiProperty } from '@nestjs/swagger';

export class WithdrawalResponseDto {
  @ApiProperty({ description: 'Withdrawal ID', example: 'wth_123456' })
  id: string;

  @ApiProperty({ description: 'Currency', example: 'BTC' })
  currency: string;

  @ApiProperty({ description: 'Amount withdrawn', example: '50.00' })
  amount: string;

  @ApiProperty({ description: 'Withdrawal fee', example: '0.001' })
  fee: string;

  @ApiProperty({ description: 'Net amount (after fees)', example: '49.999' })
  netAmount: string;

  @ApiProperty({ description: 'Destination wallet address', example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
  walletAddress: string;

  @ApiProperty({ description: 'Withdrawal method', example: 'crypto' })
  withdrawalMethod: string;

  @ApiProperty({ description: 'Withdrawal status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Transaction hash', example: '0x1234567890abcdef...', required: false })
  transactionHash?: string;

  @ApiProperty({ description: 'Processing time estimate', example: '10-30 minutes', required: false })
  processingTime?: string;

  @ApiProperty({ description: 'Withdrawal creation timestamp', example: '2025-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Withdrawal completion timestamp', example: '2025-01-15T10:35:00Z', required: false })
  completedAt?: string;
}
