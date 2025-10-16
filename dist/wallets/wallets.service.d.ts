import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Currency } from '../shared/constants';
import { WalletBalance } from '../shared/types';
export declare class WalletsService {
    private prisma;
    private ledgerService;
    constructor(prisma: PrismaService, ledgerService: LedgerService);
    getOrCreateAccount(userId: string, currency: Currency, network?: 'mainnet' | 'testnet'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        network: string;
        available: bigint;
        locked: bigint;
    }>;
    getWalletBalance(userId: string, currency: Currency, network?: 'mainnet' | 'testnet'): Promise<WalletBalance>;
    getWalletBalances(userId: string, network?: 'mainnet' | 'testnet'): Promise<WalletBalance[]>;
    getBalance(userId: string, currency: Currency, network?: 'mainnet' | 'testnet'): Promise<WalletBalance>;
    getTestnetFaucet(userId: string, currency: Currency, network?: 'testnet'): Promise<{
        currency: Currency;
        amount: 0.01 | 0.001 | 0.1 | 10;
        network: string;
        message: string;
    }>;
    clearDemoFunds(userId: string): Promise<{
        message: string;
        accountsReset: number;
        ledgerEntriesCleared: number;
    }>;
    lockFunds(userId: string, currency: Currency, amount: string, refId: string, network?: 'mainnet' | 'testnet'): Promise<{
        success: boolean;
    }>;
    releaseFunds(userId: string, currency: Currency, amount: string, refId: string, network?: 'mainnet' | 'testnet'): Promise<{
        success: boolean;
    }>;
    creditWinnings(userId: string, currency: Currency, amount: string, refId: string, network?: 'mainnet' | 'testnet'): Promise<{
        success: boolean;
    }>;
    processBetLoss(userId: string, currency: Currency, amount: string, refId: string, network?: 'mainnet' | 'testnet'): Promise<{
        success: boolean;
    }>;
    getDetailedWalletBalances(userId: string, network?: 'mainnet' | 'testnet'): Promise<{
        balances: {
            currency: Currency;
            available: string;
            locked: string;
            total: string;
            usdValue: string;
        }[];
        totalUsdValue: string;
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
