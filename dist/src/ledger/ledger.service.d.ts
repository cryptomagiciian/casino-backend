import { PrismaService } from '../prisma/prisma.service';
import { Currency, LedgerType } from '../shared/constants';
export interface LedgerEntryData {
    accountId: string;
    amount: string;
    currency: Currency;
    type: LedgerType;
    refId?: string;
    meta?: any;
}
export declare class LedgerService {
    private prisma;
    constructor(prisma: PrismaService);
    createEntry(data: LedgerEntryData): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        amount: bigint;
        type: string;
        refId: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        accountId: string;
    }>;
    createTransaction(debitData: LedgerEntryData, creditData: LedgerEntryData): Promise<{
        debit: {
            id: string;
            createdAt: Date;
            currency: string;
            amount: bigint;
            type: string;
            refId: string | null;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            accountId: string;
        };
        credit: {
            id: string;
            createdAt: Date;
            currency: string;
            amount: bigint;
            type: string;
            refId: string | null;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            accountId: string;
        };
    }>;
    getAccountBalance(accountId: string): Promise<bigint>;
    getAccountBalanceByCurrency(accountId: string, currency: Currency): Promise<bigint>;
    getAccountEntries(accountId: string, limit?: number, offset?: number): Promise<{
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
    validateBalance(accountId: string, requiredAmount: string, currency: Currency): Promise<boolean>;
    lockFunds(accountId: string, amount: string, currency: Currency, refId: string): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        amount: bigint;
        type: string;
        refId: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        accountId: string;
    }>;
    releaseFunds(accountId: string, amount: string, currency: Currency, refId: string): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        amount: bigint;
        type: string;
        refId: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        accountId: string;
    }>;
    creditWinnings(accountId: string, amount: string, currency: Currency, refId: string): Promise<{
        id: string;
        createdAt: Date;
        currency: string;
        amount: bigint;
        type: string;
        refId: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        accountId: string;
    }>;
}
