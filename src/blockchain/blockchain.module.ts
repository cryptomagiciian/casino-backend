import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { WalletModule } from '../wallet/wallet.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [WalletModule, LedgerModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
