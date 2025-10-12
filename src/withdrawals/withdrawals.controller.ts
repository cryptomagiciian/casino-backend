import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalRequest } from '../shared/types';

export class WithdrawalDto {
  currency: string;
  amount: string;
  address: string;
}

@ApiTags('Withdrawals')
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a withdrawal request' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid withdrawal parameters' })
  async createWithdrawal(
    @Request() req: { user: { sub: string } },
    @Body() withdrawalDto: WithdrawalDto,
  ) {
    return this.withdrawalsService.createWithdrawal(req.user.sub, withdrawalDto as WithdrawalRequest);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user withdrawals' })
  @ApiResponse({ status: 200, description: 'Withdrawals retrieved successfully' })
  async getUserWithdrawals(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.withdrawalsService.getUserWithdrawals(req.user.sub, limit || 50, offset || 0);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending withdrawals (admin only)' })
  @ApiResponse({ status: 200, description: 'Pending withdrawals retrieved successfully' })
  async getPendingWithdrawals(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.withdrawalsService.getPendingWithdrawals(limit || 50, offset || 0);
  }
}
