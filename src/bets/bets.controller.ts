import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BetsService } from './bets.service';
import { BetPreview, BetPlaceRequest } from '../shared/types';

export class BetPreviewDto {
  @ApiProperty({ description: 'Game to play', example: 'candle-flip' })
  @IsString()
  game: string;

  @ApiProperty({ description: 'Currency to bet with', example: 'USDC' })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: string;

  @ApiProperty({ description: 'Bet amount', example: '100' })
  @IsString()
  stake: string;

  @ApiProperty({ description: 'Game-specific parameters', required: false })
  @IsOptional()
  params?: any;
}

export class BetPlaceDto {
  @ApiProperty({ description: 'Game to play', example: 'candle-flip' })
  @IsString()
  game: string;

  @ApiProperty({ description: 'Currency to bet with', example: 'USDC' })
  @IsString()
  @IsIn(['BTC', 'ETH', 'SOL', 'USDC', 'USDT'])
  currency: string;

  @ApiProperty({ description: 'Bet amount', example: '100' })
  @IsString()
  stake: string;

  @ApiProperty({ description: 'Client seed for provably fair', required: false })
  @IsOptional()
  @IsString()
  clientSeed?: string;

  @ApiProperty({ description: 'Game-specific parameters', required: false })
  @IsOptional()
  params?: any;
}

@ApiTags('Bets')
@Controller('bets')
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview a bet (calculate potential payout)' })
  @ApiResponse({ status: 200, description: 'Bet preview calculated successfully' })
  async previewBet(@Body() previewDto: BetPreviewDto): Promise<BetPreview> {
    return this.betsService.previewBet(previewDto as BetPlaceRequest);
  }

  @Post('place')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bet' })
  @ApiResponse({ status: 201, description: 'Bet placed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bet parameters' })
  async placeBet(
    @Request() req: { user: { sub: string } },
    @Body() placeDto: BetPlaceDto,
  ) {
    return this.betsService.placeBet(req.user.sub, placeDto as BetPlaceRequest);
  }

  @Post('resolve/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve a bet (admin only)' })
  @ApiResponse({ status: 200, description: 'Bet resolved successfully' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async resolveBet(@Param('id') betId: string) {
    return this.betsService.resolveBet(betId);
  }

  @Post('cashout/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cash out a bet (for crash games)' })
  @ApiResponse({ status: 200, description: 'Bet cashed out successfully' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  @ApiResponse({ status: 400, description: 'Bet cannot be cashed out' })
  async cashoutBet(
    @Param('id') betId: string,
    @Body() body?: { multiplier?: number }
  ) {
    return this.betsService.cashoutBet(betId, body?.multiplier);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bet details' })
  @ApiResponse({ status: 200, description: 'Bet details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async getBet(@Param('id') betId: string) {
    return this.betsService.getBet(betId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user bets' })
  @ApiResponse({ status: 200, description: 'User bets retrieved successfully' })
  async getUserBets(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.betsService.getUserBets(req.user.sub, limit || 50, offset || 0);
  }
}
