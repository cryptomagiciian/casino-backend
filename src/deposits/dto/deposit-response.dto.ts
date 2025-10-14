import { ApiProperty } from '@nestjs/swagger';

export class DepositResponseDto {
  @ApiProperty({ description: 'Deposit ID', example: 'dep_123456' })
  id: string;

  @ApiProperty({ description: 'Cryptocurrency', example: 'BTC' })
  currency: string;

  @ApiProperty({ description: 'Amount deposited', example: '0.001' })
  amount: string;

  @ApiProperty({ description: 'Payment method', example: 'crypto' })
  paymentMethod: string;

  @ApiProperty({ description: 'Blockchain network', example: 'mainnet' })
  network: string;

  @ApiProperty({ description: 'Deposit status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Generated wallet address for deposits', example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
  walletAddress: string;

  @ApiProperty({ description: 'Blockchain transaction hash', example: '0x1234567890abcdef...', required: false })
  transactionHash?: string;

  @ApiProperty({ description: 'Block number', example: '18500000', required: false })
  blockNumber?: number;

  @ApiProperty({ description: 'QR code data for easy scanning', example: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.001' })
  qrCodeData: string;

  @ApiProperty({ description: 'Minimum confirmations required', example: 3 })
  requiredConfirmations: number;

  @ApiProperty({ description: 'Current confirmations', example: 1 })
  currentConfirmations: number;

  @ApiProperty({ description: 'Blockchain explorer URL', example: 'https://blockstream.info/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
  explorerUrl: string;

  @ApiProperty({ description: 'Deposit creation timestamp', example: '2025-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Deposit completion timestamp', example: '2025-01-15T10:35:00Z', required: false })
  completedAt?: string;

  @ApiProperty({ description: 'Solana account initialization instructions (for SOL deposits only)', example: 'Solana Account Initialization: 1. The address is valid but needs to be initialized...', required: false })
  solanaInstructions?: string;
}
