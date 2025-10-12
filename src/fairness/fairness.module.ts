import { Module } from '@nestjs/common';
import { FairnessService } from './fairness.service';
import { FairnessController } from './fairness.controller';

@Module({
  providers: [FairnessService],
  controllers: [FairnessController],
  exports: [FairnessService],
})
export class FairnessModule {}
