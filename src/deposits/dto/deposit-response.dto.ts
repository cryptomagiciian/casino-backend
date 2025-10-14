import { ApiProperty } from '@nestjs/swagger';

export class DepositResponseDto {
  @ApiProperty({ description: 'Deposit ID', example: 'dep_123456' })
  id: string;

  @ApiProperty({ description: 'Currency', example: 'BTC' })
  currency: string;

  @ApiProperty({ description: 'Amount deposited', example: '100.00' })
  amount: string;

  @ApiProperty({ description: 'Payment method used', example: 'crypto' })
  paymentMethod: string;

  @ApiProperty({ description: 'Deposit status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Wallet address for crypto deposits', example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', required: false })
  walletAddress?: string;

  @ApiProperty({ description: 'Transaction hash', example: '0x1234567890abcdef...', required: false })
  transactionHash?: string;

  @ApiProperty({ description: 'Confirmation URL for card/bank payments', example: 'https://payment-provider.com/confirm/123', required: false })
  confirmationUrl?: string;

  @ApiProperty({ description: 'QR code data for crypto deposits', example: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.001', required: false })
  qrCodeData?: string;

  @ApiProperty({ description: 'Minimum confirmations required', example: 3, required: false })
  requiredConfirmations?: number;

  @ApiProperty({ description: 'Current confirmations', example: 1, required: false })
  currentConfirmations?: number;

  @ApiProperty({ description: 'Deposit creation timestamp', example: '2025-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Deposit completion timestamp', example: '2025-01-15T10:35:00Z', required: false })
  completedAt?: string;
}
