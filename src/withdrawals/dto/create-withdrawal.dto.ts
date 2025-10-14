import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, Min, Max } from 'class-validator';
import { Currency } from '../../shared/constants';

export class CreateWithdrawalDto {
  @ApiProperty({ 
    description: 'Currency for withdrawal', 
    example: 'BTC',
    enum: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']
  })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: Currency;

  @ApiProperty({ 
    description: 'Amount to withdraw', 
    example: '50.00',
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ 
    description: 'Destination wallet address', 
    example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  })
  @IsString()
  walletAddress: string;

  @ApiProperty({ 
    description: 'Withdrawal method', 
    example: 'crypto',
    enum: ['crypto', 'bank_transfer']
  })
  @IsString()
  @IsIn(['crypto', 'bank_transfer'])
  withdrawalMethod: 'crypto' | 'bank_transfer';

  @ApiProperty({ 
    description: 'Two-factor authentication code', 
    example: '123456',
    required: false
  })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @ApiProperty({ 
    description: 'Withdrawal password', 
    example: 'mySecurePassword123',
    required: false
  })
  @IsOptional()
  @IsString()
  withdrawalPassword?: string;
}
