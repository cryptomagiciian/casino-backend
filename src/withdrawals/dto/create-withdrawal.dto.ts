import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';
import { Currency } from '../../shared/constants';

export class CreateWithdrawalDto {
  @ApiProperty({ 
    description: 'Cryptocurrency for withdrawal', 
    example: 'BTC',
    enum: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']
  })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: Currency;

  @ApiProperty({ 
    description: 'Amount to withdraw', 
    example: '0.001',
    minimum: 0.0001
  })
  @IsNumber()
  @Min(0.0001)
  amount: number;

  @ApiProperty({ 
    description: 'Destination wallet address', 
    example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  })
  @IsString()
  walletAddress: string;

  @ApiProperty({ 
    description: 'Blockchain network', 
    example: 'mainnet',
    enum: ['mainnet', 'testnet']
  })
  @IsString()
  @IsIn(['mainnet', 'testnet'])
  network: 'mainnet' | 'testnet';

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
