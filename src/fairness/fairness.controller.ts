import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FairnessService } from './fairness.service';
import { FairnessVerifyRequest, JwtUser } from '../shared/types';

export class RotateSeedDto {
  // No additional fields needed
}

export class RevealSeedDto {
  seedId: string;
}

@ApiTags('Fairness')
@Controller('fairness')
export class FairnessController {
  constructor(private fairnessService: FairnessService) {}

  @Get('seed/current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current fairness seed for user' })
  @ApiResponse({ status: 200, description: 'Current seed retrieved successfully' })
  async getCurrentSeed(@Request() req: { user: JwtUser }) {
    return this.fairnessService.getCurrentSeed(req.user.id);
  }

  @Post('seed/rotate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate fairness seed (admin only)' })
  @ApiResponse({ status: 200, description: 'Seed rotated successfully' })
  async rotateSeed(
    @Request() req: { user: JwtUser },
    @Body() rotateSeedDto: RotateSeedDto,
  ) {
    return this.fairnessService.rotateSeed(req.user.id);
  }

  @Post('seed/reveal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reveal fairness seed (admin only)' })
  @ApiResponse({ status: 200, description: 'Seed revealed successfully' })
  async revealSeed(
    @Request() req: { user: JwtUser },
    @Body() revealSeedDto: RevealSeedDto,
  ) {
    return this.fairnessService.revealSeed(req.user.id, revealSeedDto.seedId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify fairness of a bet' })
  @ApiResponse({ status: 200, description: 'Fairness verification completed' })
  async verifyFairness(@Body() verifyRequest: FairnessVerifyRequest) {
    return this.fairnessService.verifyFairness(verifyRequest);
  }
}
