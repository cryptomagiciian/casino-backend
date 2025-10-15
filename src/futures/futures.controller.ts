import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FuturesService } from './futures.service';
import { OrderService } from './order.service';
import { RoundService } from './round.service';
import { LiquidationService } from './liquidation.service';
import { FundingService } from './funding.service';
import { BorrowService } from './borrow.service';
import { OpenOrderDto, CloseOrderDto, OrderResponseDto } from './dto/order.dto';
import { FuturesSymbolDto, TradingRoundDto } from './dto/futures-symbol.dto';
import { FuturesPositionDto, PositionListDto } from './dto/position.dto';

@ApiTags('futures')
@Controller('futures')
export class FuturesController {
  constructor(
    private readonly futuresService: FuturesService,
    private readonly orderService: OrderService,
    private readonly roundService: RoundService,
    private readonly liquidationService: LiquidationService,
    private readonly fundingService: FundingService,
    private readonly borrowService: BorrowService,
  ) {}

  @Get('symbols')
  @ApiOperation({ summary: 'Get all available futures symbols' })
  @ApiResponse({ status: 200, description: 'Futures symbols retrieved successfully', type: [FuturesSymbolDto] })
  async getSymbols(): Promise<FuturesSymbolDto[]> {
    return this.futuresService.getSymbols();
  }

  @Get('round/current')
  @ApiOperation({ summary: 'Get current trading round' })
  @ApiResponse({ status: 200, description: 'Current trading round retrieved successfully', type: TradingRoundDto })
  async getCurrentRound(): Promise<TradingRoundDto | null> {
    return this.futuresService.getCurrentRound();
  }

  @Post('order/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a new futures position' })
  @ApiResponse({ status: 201, description: 'Position opened successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async openOrder(@Request() req: any, @Body() orderData: OpenOrderDto): Promise<OrderResponseDto> {
    console.log('🔐 Futures Controller - User from JWT:', req.user);
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed - no user ID found');
    }
    return this.orderService.openPosition(req.user.id, orderData);
  }

  @Post('order/close')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a futures position' })
  @ApiResponse({ status: 200, description: 'Position closed successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid close data' })
  async closeOrder(@Request() req: any, @Body() orderData: CloseOrderDto): Promise<OrderResponseDto> {
    return this.orderService.closePosition(req.user.id, orderData);
  }

  @Post('order/cancel-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel all open positions' })
  @ApiResponse({ status: 200, description: 'All positions cancelled successfully' })
  async cancelAllOrders(@Request() req: any): Promise<{ cancelled: number }> {
    return this.orderService.cancelAllPositions(req.user.id);
  }

  @Get('positions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user positions' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED', 'LIQUIDATED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Positions retrieved successfully', type: PositionListDto })
  async getPositions(
    @Request() req: any,
    @Query('status') status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PositionListDto> {
    return this.futuresService.getUserPositions(req.user.id, status, page, limit);
  }

  @Get('positions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get position by ID' })
  @ApiResponse({ status: 200, description: 'Position retrieved successfully', type: FuturesPositionDto })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async getPosition(@Request() req: any, @Param('id') positionId: string): Promise<FuturesPositionDto | null> {
    return this.futuresService.getPositionById(positionId, req.user.id);
  }

  @Get('positions/:id/liquidation-price')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get liquidation price for a position' })
  @ApiResponse({ status: 200, description: 'Liquidation price retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async getLiquidationPrice(@Request() req: any, @Param('id') positionId: string): Promise<{ liquidationPrice: number }> {
    const liquidationPrice = await this.liquidationService.getLiquidationPrice(positionId);
    return { liquidationPrice };
  }

  @Get('funding-rate/:symbolId')
  @ApiOperation({ summary: 'Get current funding rate for a symbol' })
  @ApiResponse({ status: 200, description: 'Funding rate retrieved successfully' })
  async getFundingRate(@Param('symbolId') symbolId: string): Promise<{ fundingRate: number }> {
    const fundingRate = this.fundingService.getCurrentFundingRate(symbolId);
    return { fundingRate };
  }

  @Get('borrow-rate/:symbolId')
  @ApiOperation({ summary: 'Get current borrow rate for a symbol' })
  @ApiResponse({ status: 200, description: 'Borrow rate retrieved successfully' })
  async getBorrowRate(@Param('symbolId') symbolId: string): Promise<{ borrowRate: number }> {
    const borrowRate = this.borrowService.getCurrentBorrowRate(symbolId);
    return { borrowRate };
  }

  @Get('maintenance-margin-rate/:leverage')
  @ApiOperation({ summary: 'Get maintenance margin rate for a leverage level' })
  @ApiResponse({ status: 200, description: 'Maintenance margin rate retrieved successfully' })
  async getMaintenanceMarginRate(@Param('leverage') leverage: number): Promise<{ maintenanceMarginRate: number }> {
    const maintenanceMarginRate = this.liquidationService.getMaintenanceMarginRate(leverage);
    return { maintenanceMarginRate };
  }

  // Admin endpoints
  @Post('seed/reveal/:roundId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reveal server seed for a trading round (admin only)' })
  @ApiResponse({ status: 200, description: 'Server seed revealed successfully' })
  async revealServerSeed(@Param('roundId') roundId: string): Promise<{ serverSeed: string }> {
    const serverSeed = await this.roundService.revealServerSeed(roundId);
    return { serverSeed };
  }

  @Get('rounds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trading rounds (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Trading rounds retrieved successfully' })
  async getRounds(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.roundService.getRounds(page, limit);
  }

  // Admin endpoints for seeding
  @Post('seed/symbols')
  @ApiOperation({ summary: 'Seed futures symbols (admin only)' })
  @ApiResponse({ status: 200, description: 'Futures symbols seeded successfully' })
  async seedSymbols() {
    await this.futuresService.seedSymbols();
    return { success: true, message: 'Futures symbols seeded successfully' };
  }

  @Post('seed/round')
  @ApiOperation({ summary: 'Create initial trading round (admin only)' })
  @ApiResponse({ status: 200, description: 'Trading round created successfully' })
  async createInitialRound() {
    await this.roundService.initializeFirstRound();
    return { success: true, message: 'Initial trading round created successfully' };
  }
}
