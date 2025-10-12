import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { FairnessModule } from '../fairness/fairness.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [WalletsModule, FairnessModule, GamesModule],
  providers: [BetsService],
  controllers: [BetsController],
  exports: [BetsService],
})
export class BetsModule {}
