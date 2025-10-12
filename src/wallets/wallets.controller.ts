import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import { FaucetRequest, WalletBalance } from '../shared/types';
import { Currency } from '../shared/constants';

export class FaucetDto {
  currency: Currency;
  amount: string;
}

@ApiTags('Wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wallet balances' })
  @ApiResponse({ status: 200, description: 'Wallet balances retrieved successfully' })
  async getBalances(@Request() req: { user: { sub: string } }): Promise<WalletBalance[]> {
    return this.walletsService.getWalletBalances(req.user.sub);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get balance for specific currency' })
  @ApiQuery({ name: 'currency', description: 'Currency to get balance for' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(
    @Request() req: { user: { sub: string } },
    @Query('currency') currency: Currency,
  ): Promise<WalletBalance> {
    return this.walletsService.getBalance(req.user.sub, currency);
  }

  @Post('faucet')
  @ApiOperation({ summary: 'Get demo funds from faucet (demo mode only)' })
  @ApiResponse({ status: 200, description: 'Funds credited successfully' })
  @ApiResponse({ status: 400, description: 'Faucet not available or limit exceeded' })
  async faucet(
    @Request() req: { user: { sub: string } },
    @Body() faucetDto: FaucetDto,
  ) {
    return this.walletsService.faucet(req.user.sub, faucetDto);
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
}
