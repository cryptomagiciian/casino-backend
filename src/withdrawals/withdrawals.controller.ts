import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { Currency } from '../shared/constants';

@ApiTags('withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal created successfully', type: WithdrawalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid withdrawal data' })
  @ApiResponse({ status: 403, description: 'Insufficient balance or security check failed' })
  async createWithdrawal(
    @Request() req: { user: { sub: string } },
    @Body() createWithdrawalDto: CreateWithdrawalDto,
  ): Promise<WithdrawalResponseDto> {
    return this.withdrawalsService.createWithdrawal(req.user.sub, createWithdrawalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user withdrawals' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of withdrawals to return', example: '50' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of withdrawals to skip', example: '0' })
  @ApiResponse({ status: 200, description: 'Withdrawals retrieved successfully' })
  async getWithdrawals(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.withdrawalsService.getWithdrawals(
      req.user.sub,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal retrieved successfully', type: WithdrawalResponseDto })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  async getWithdrawal(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<WithdrawalResponseDto> {
    return this.withdrawalsService.getWithdrawal(req.user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Withdrawal cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  async cancelWithdrawal(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.withdrawalsService.cancelWithdrawal(req.user.sub, id);
    return { message: 'Withdrawal cancelled successfully' };
  }

  @Get('limits/:currency')
  @ApiOperation({ summary: 'Get withdrawal limits for a currency' })
  @ApiResponse({ status: 200, description: 'Withdrawal limits retrieved successfully' })
  async getWithdrawalLimits(@Param('currency') currency: Currency) {
    return this.withdrawalsService.getWithdrawalLimits(currency);
  }
}