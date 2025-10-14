import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';
import { Currency } from '../../shared/constants';

export class CreateDepositDto {
  @ApiProperty({ 
    description: 'Cryptocurrency for deposit', 
    example: 'BTC',
    enum: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']
  })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: Currency;

  @ApiProperty({ 
    description: 'Amount to deposit', 
    example: '0.001',
    minimum: 0.0001
  })
  @IsNumber()
  @Min(0.0001)
  amount: number;

  @ApiProperty({ 
    description: 'Blockchain network', 
    example: 'mainnet',
    enum: ['mainnet', 'testnet']
  })
  @IsString()
  @IsIn(['mainnet', 'testnet'])
  network: 'mainnet' | 'testnet';

  @ApiProperty({ 
    description: 'Transaction hash from blockchain (optional)', 
    example: '0x1234567890abcdef...',
    required: false
  })
  @IsOptional()
  @IsString()
  transactionHash?: string;

  @ApiProperty({ 
    description: 'Block number (optional)', 
    example: '18500000',
    required: false
  })
  @IsOptional()
  @IsNumber()
  blockNumber?: number;
}
