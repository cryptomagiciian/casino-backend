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
        currency: string;
        amount: bigint;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        accountId: string;
        type: string;
        refId: string | null;
    }>;
    createTransaction(debitData: LedgerEntryData, creditData: LedgerEntryData): Promise<{
        debit: {
            id: string;
            currency: string;
            amount: bigint;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            accountId: string;
            type: string;
            refId: string | null;
        };
        credit: {
            id: string;
            currency: string;
            amount: bigint;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            accountId: string;
            type: string;
            refId: string | null;
        };
    }>;
    getAccountBalance(accountId: string): Promise<bigint>;
    getAccountBalanceByCurrency(accountId: string, currency: Currency): Promise<bigint>;
    getAccountEntries(accountId: string, limit?: number, offset?: number): Promise<{
        entries: {
            amount: string;
            id: string;
            currency: string;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            accountId: string;
            type: string;
            refId: string | null;
        }[];
        total: number;
    }>;
    validateBalance(accountId: string, requiredAmount: string, currency: Currency): Promise<boolean>;
    lockFunds(accountId: string, amount: string, currency: Currency, refId: string): Promise<{
        id: string;
        currency: string;
        amount: bigint;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        accountId: string;
        type: string;
        refId: string | null;
    }>;
    releaseFunds(accountId: string, amount: string, currency: Currency, refId: string): Promise<{
        id: string;
        currency: string;
        amount: bigint;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        accountId: string;
        type: string;
        refId: string | null;
    }>;
    creditWinnings(accountId: string, amount: string, currency: Currency, refId: string): Promise<{
        id: string;
        currency: string;
        amount: bigint;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        accountId: string;
        type: string;
        refId: string | null;
    }>;
}
