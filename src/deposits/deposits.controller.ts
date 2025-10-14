import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { DepositWebhookDto } from './dto/webhook.dto';
import { Currency } from '../shared/constants';

@ApiTags('deposits')
@Controller('deposits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deposit' })
  @ApiResponse({ status: 201, description: 'Deposit created successfully', type: DepositResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid deposit data' })
  async createDeposit(
    @Request() req: { user: { sub: string } },
    @Body() createDepositDto: CreateDepositDto,
  ): Promise<DepositResponseDto> {
    return this.depositsService.createDeposit(req.user.sub, createDepositDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user deposits' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of deposits to return', example: '50' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of deposits to skip', example: '0' })
  @ApiResponse({ status: 200, description: 'Deposits retrieved successfully' })
  async getDeposits(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.depositsService.getDeposits(
      req.user.sub,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific deposit' })
  @ApiResponse({ status: 200, description: 'Deposit retrieved successfully', type: DepositResponseDto })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async getDeposit(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<DepositResponseDto> {
    return this.depositsService.getDeposit(req.user.sub, id);
  }

  @Get('limits/:currency')
  @ApiOperation({ summary: 'Get deposit limits for a currency' })
  @ApiResponse({ status: 200, description: 'Deposit limits retrieved successfully' })
  async getDepositLimits(@Param('currency') currency: Currency) {
    return this.depositsService.getDepositLimits(currency);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook endpoint for deposit confirmations' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async processWebhook(
    @Body() webhookData: DepositWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ): Promise<{ success: boolean; message: string }> {
    // In a real implementation, you would verify the webhook signature
    // For demo purposes, we'll just process the webhook
    
    await this.depositsService.processDepositWebhook(
      webhookData.depositId,
      webhookData.confirmations,
      webhookData.transactionHash,
    );

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }
}