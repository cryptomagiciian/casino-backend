import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WithdrawalRequest } from '../shared/types';
export declare class WithdrawalsService {
    private prisma;
    private ledgerService;
    constructor(prisma: PrismaService, ledgerService: LedgerService);
    createWithdrawal(userId: string, request: WithdrawalRequest): Promise<{
        amount: string;
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        currency: string;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        address: string;
        reviewNeeded: boolean;
        txHash: string | null;
        processedAt: Date | null;
    }>;
    processWithdrawal(withdrawalId: string, action: 'approve' | 'reject', txHash?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        currency: string;
        amount: bigint;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        address: string;
        reviewNeeded: boolean;
        txHash: string | null;
        processedAt: Date | null;
    }>;
    getUserWithdrawals(userId: string, limit?: number, offset?: number): Promise<{
        withdrawals: {
            id: string;
            currency: string;
            amount: string;
            address: string;
            status: import(".prisma/client").$Enums.WithdrawalStatus;
            reviewNeeded: boolean;
            txHash: string;
            createdAt: Date;
            processedAt: Date;
        }[];
        total: number;
    }>;
    getPendingWithdrawals(limit?: number, offset?: number): Promise<{
        withdrawals: {
            id: string;
            userId: string;
            user: {
                handle: string;
                email: string;
                id: string;
            };
            currency: string;
            amount: string;
            address: string;
            status: import(".prisma/client").$Enums.WithdrawalStatus;
            reviewNeeded: boolean;
            createdAt: Date;
        }[];
        total: number;
    }>;
}
