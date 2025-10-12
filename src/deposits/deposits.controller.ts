import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositsService } from './deposits.service';
import { DepositRequest } from '../shared/types';

export class DepositDto {
  currency: string;
  amount: string;
  provider: string;
  txRef?: string;
}

@ApiTags('Deposits')
@Controller('deposits')
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a deposit request' })
  @ApiResponse({ status: 201, description: 'Deposit request created successfully' })
  async createDeposit(
    @Request() req: { user: { sub: string } },
    @Body() depositDto: DepositDto,
  ) {
    return this.depositsService.createDeposit(req.user.sub, depositDto as DepositRequest);
  }

  @Post('provider/webhook')
  @ApiOperation({ summary: 'Process deposit provider webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async processWebhook(
    @Body() body: { provider: string; payload: any },
  ) {
    return this.depositsService.processWebhook(body.provider, body.payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user deposits' })
  @ApiResponse({ status: 200, description: 'Deposits retrieved successfully' })
  async getUserDeposits(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.depositsService.getUserDeposits(req.user.sub, limit || 50, offset || 0);
  }
}
