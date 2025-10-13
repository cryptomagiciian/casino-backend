import { WalletsService } from './wallets.service';
import { WalletBalance } from '../shared/types';
import { Currency } from '../shared/constants';
export declare class FaucetDto {
    currency: Currency;
    amount: string;
}
export declare class WalletsController {
    private walletsService;
    constructor(walletsService: WalletsService);
    getBalances(req: {
        user: {
            sub: string;
        };
    }): Promise<WalletBalance[]>;
    getBalance(req: {
        user: {
            sub: string;
        };
    }, currency: Currency): Promise<WalletBalance>;
    faucet(req: {
        user: {
            sub: string;
        };
    }, faucetDto: FaucetDto): Promise<{
        currency: Currency;
        amount: string;
        message: string;
    }>;
    getLedgerEntries(req: {
        user: {
            sub: string;
        };
    }, currency: Currency, limit?: number, offset?: number): Promise<{
        entries: {
            amount: string;
            currency: string;
            id: string;
            createdAt: Date;
            accountId: string;
            type: string;
            refId: string | null;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        total: number;
    }>;
}
