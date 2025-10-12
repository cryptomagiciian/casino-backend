import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Currency } from '../shared/constants';
import { WalletBalance, FaucetRequest } from '../shared/types';
export declare class WalletsService {
    private prisma;
    private ledgerService;
    constructor(prisma: PrismaService, ledgerService: LedgerService);
    getOrCreateAccount(userId: string, currency: Currency): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        available: bigint;
        locked: bigint;
    }>;
    getWalletBalances(userId: string): Promise<WalletBalance[]>;
    getBalance(userId: string, currency: Currency): Promise<WalletBalance>;
    faucet(userId: string, request: FaucetRequest): Promise<{
        currency: Currency;
        amount: string;
        message: string;
    }>;
    lockFunds(userId: string, currency: Currency, amount: string, refId: string): Promise<{
        success: boolean;
    }>;
    releaseFunds(userId: string, currency: Currency, amount: string, refId: string): Promise<{
        success: boolean;
    }>;
    creditWinnings(userId: string, currency: Currency, amount: string, refId: string): Promise<{
        success: boolean;
    }>;
    getLedgerEntries(userId: string, currency: Currency, limit?: number, offset?: number): Promise<{
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
}
