import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GamesService } from './games.service';
import { BetPreview, BetPlaceRequest } from '../shared/types';
import { Game } from '../shared/constants';

export class BetPreviewDto {
  game: Game;
  currency: string;
  stake: string;
  params?: any;
}

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available games' })
  @ApiResponse({ status: 200, description: 'Games retrieved successfully' })
  async getGames() {
    return this.gamesService.getGames();
  }

  @Get(':game')
  @ApiOperation({ summary: 'Get game configuration' })
  @ApiResponse({ status: 200, description: 'Game configuration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getGameConfig(@Body('game') game: Game) {
    return this.gamesService.getGameConfig(game);
  }
}
