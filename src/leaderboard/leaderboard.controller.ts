import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily leaderboard' })
  @ApiQuery({ name: 'date', required: false, description: 'Date for leaderboard (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of entries to return' })
  @ApiResponse({ status: 200, description: 'Daily leaderboard retrieved successfully' })
  async getDailyLeaderboard(
    @Query('date') date?: string,
    @Query('limit') limit?: number,
  ) {
    const targetDate = date ? new Date(date) : undefined;
    return this.leaderboardService.getDailyLeaderboard(targetDate, limit || 100);
  }

  @Get('position')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user leaderboard position' })
  @ApiQuery({ name: 'date', required: false, description: 'Date for leaderboard (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'User position retrieved successfully' })
  async getUserPosition(
    @Request() req: { user: { sub: string } },
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : undefined;
    return this.leaderboardService.getUserLeaderboardPosition(req.user.sub, targetDate);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user leaderboard history' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to retrieve' })
  @ApiResponse({ status: 200, description: 'User history retrieved successfully' })
  async getUserHistory(
    @Request() req: { user: { sub: string } },
    @Query('days') days?: number,
  ) {
    return this.leaderboardService.getUserLeaderboardHistory(req.user.sub, days || 30);
  }
}
