import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, Min, Max } from 'class-validator';
import { Currency } from '../../shared/constants';

export class CreateDepositDto {
  @ApiProperty({ 
    description: 'Currency for deposit', 
    example: 'BTC',
    enum: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']
  })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: Currency;

  @ApiProperty({ 
    description: 'Amount to deposit', 
    example: '100.00',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ 
    description: 'Payment method', 
    example: 'crypto',
    enum: ['crypto', 'card', 'bank_transfer']
  })
  @IsString()
  @IsIn(['crypto', 'card', 'bank_transfer'])
  paymentMethod: 'crypto' | 'card' | 'bank_transfer';

  @ApiProperty({ 
    description: 'Wallet address for crypto deposits (optional)', 
    example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    required: false
  })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiProperty({ 
    description: 'Transaction hash for crypto deposits (optional)', 
    example: '0x1234567890abcdef...',
    required: false
  })
  @IsOptional()
  @IsString()
  transactionHash?: string;
}
