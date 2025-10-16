import { WalletsService } from './wallets.service';
import { WalletBalance } from '../shared/types';
import { Currency } from '../shared/constants';
import { ClearDemoFundsDto } from './dto/clear-demo-funds.dto';
export declare class FaucetDto {
    currency: Currency;
}
export declare class WalletsController {
    private walletsService;
    constructor(walletsService: WalletsService);
    getBalances(req: {
        user: {
            sub: string;
        };
    }, detailed?: string, network?: 'mainnet' | 'testnet'): Promise<WalletBalance[] | any>;
    getBalance(req: {
        user: {
            sub: string;
        };
    }, currency: Currency, network?: 'mainnet' | 'testnet'): Promise<WalletBalance>;
    faucet(req: {
        user: {
            sub: string;
        };
    }, faucetDto: FaucetDto): Promise<{
        currency: Currency;
        amount: 0.01 | 0.001 | 0.1 | 10;
        network: string;
        message: string;
    }>;
    getLedgerEntries(req: {
        user: {
            sub: string;
        };
    }, currency: Currency, limit?: number, offset?: number): Promise<{
        entries: {
            amount: string;
            id: string;
            createdAt: Date;
            currency: string;
            type: string;
            refId: string | null;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            accountId: string;
        }[];
        total: number;
    }>;
    clearDemoFunds(req: {
        user: {
            sub: string;
        };
    }, clearDto: ClearDemoFundsDto): Promise<{
        message: string;
        accountsReset: number;
        ledgerEntriesCleared: number;
    }>;
}
