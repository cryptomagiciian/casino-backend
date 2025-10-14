import { Controller, Get, Post, Body, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import { WalletBalance } from '../shared/types';
import { Currency } from '../shared/constants';
import { ClearDemoFundsDto } from './dto/clear-demo-funds.dto';

export class FaucetDto {
  @ApiProperty({ description: 'Currency to request', example: 'USDC' })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: Currency;
}

@ApiTags('Wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wallet balances' })
  @ApiQuery({ name: 'detailed', required: false, description: 'Include detailed balance information' })
  @ApiQuery({ name: 'network', required: false, description: 'Network to get balances for (mainnet/testnet)', enum: ['mainnet', 'testnet'] })
  @ApiResponse({ status: 200, description: 'Wallet balances retrieved successfully' })
  async getBalances(
    @Request() req: { user: { sub: string } },
    @Query('detailed') detailed?: string,
    @Query('network') network?: 'mainnet' | 'testnet',
  ): Promise<WalletBalance[] | any> {
    const targetNetwork = network || 'mainnet';
    if (detailed === 'true') {
      return this.walletsService.getDetailedWalletBalances(req.user.sub, targetNetwork);
    }
    return this.walletsService.getWalletBalances(req.user.sub, targetNetwork);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get balance for specific currency' })
  @ApiQuery({ name: 'currency', description: 'Currency to get balance for' })
  @ApiQuery({ name: 'network', required: false, description: 'Network to get balance for (mainnet/testnet)', enum: ['mainnet', 'testnet'] })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(
    @Request() req: { user: { sub: string } },
    @Query('currency') currency: Currency,
    @Query('network') network?: 'mainnet' | 'testnet',
  ): Promise<WalletBalance> {
    const targetNetwork = network || 'mainnet';
    return this.walletsService.getBalance(req.user.sub, currency, targetNetwork);
  }

  @Post('faucet')
  @ApiOperation({ summary: 'Get testnet funds from faucet (testnet only)' })
  @ApiResponse({ status: 200, description: 'Funds credited successfully' })
  @ApiResponse({ status: 400, description: 'Faucet not available or limit exceeded' })
  async faucet(
    @Request() req: { user: { sub: string } },
    @Body() faucetDto: FaucetDto,
  ) {
    return this.walletsService.getTestnetFaucet(req.user.sub, faucetDto.currency, 'testnet');
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get ledger entries for wallet' })
  @ApiQuery({ name: 'currency', description: 'Currency to get ledger for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of entries to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of entries to skip' })
  @ApiResponse({ status: 200, description: 'Ledger entries retrieved successfully' })
  async getLedgerEntries(
    @Request() req: { user: { sub: string } },
    @Query('currency') currency: Currency,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.walletsService.getLedgerEntries(
      req.user.sub,
      currency,
      limit || 50,
      offset || 0,
    );
  }

  @Post('clear-demo-funds')
  @ApiOperation({ summary: 'Clear old demo funds (for testing)' })
  @ApiResponse({ status: 200, description: 'Demo funds cleared successfully' })
  @ApiResponse({ status: 400, description: 'Confirmation required' })
  async clearDemoFunds(
    @Request() req: { user: { sub: string } },
    @Body() clearDto: ClearDemoFundsDto,
  ) {
    if (!clearDto.confirm) {
      throw new BadRequestException('Confirmation required to clear demo funds');
    }
    return this.walletsService.clearDemoFunds(req.user.sub);
  }
}
