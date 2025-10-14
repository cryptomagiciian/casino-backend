import { ApiProperty } from '@nestjs/swagger';

export class WithdrawalResponseDto {
  @ApiProperty({ description: 'Withdrawal ID', example: 'wth_123456' })
  id: string;

  @ApiProperty({ description: 'Cryptocurrency', example: 'BTC' })
  currency: string;

  @ApiProperty({ description: 'Amount withdrawn', example: '0.001' })
  amount: string;

  @ApiProperty({ description: 'Blockchain network fee', example: '0.0005' })
  fee: string;

  @ApiProperty({ description: 'Net amount (after fees)', example: '0.0005' })
  netAmount: string;

  @ApiProperty({ description: 'Destination wallet address', example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
  walletAddress: string;

  @ApiProperty({ description: 'Withdrawal method', example: 'crypto' })
  withdrawalMethod: string;

  @ApiProperty({ description: 'Blockchain network', example: 'mainnet' })
  network: string;

  @ApiProperty({ description: 'Withdrawal status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Blockchain transaction hash', example: '0x1234567890abcdef...', required: false })
  transactionHash?: string;

  @ApiProperty({ description: 'Block number', example: '18500000', required: false })
  blockNumber?: number;

  @ApiProperty({ description: 'Processing time estimate', example: '10-30 minutes' })
  processingTime: string;

  @ApiProperty({ description: 'Blockchain explorer URL', example: 'https://blockstream.info/tx/0x1234567890abcdef...', required: false })
  explorerUrl?: string;

  @ApiProperty({ description: 'Withdrawal creation timestamp', example: '2025-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Withdrawal completion timestamp', example: '2025-01-15T10:35:00Z', required: false })
  completedAt?: string;
}
