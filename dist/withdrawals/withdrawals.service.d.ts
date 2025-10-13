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
        currency: string;
        address: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        reviewNeeded: boolean;
        txHash: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        processedAt: Date | null;
        userId: string;
    }>;
    processWithdrawal(withdrawalId: string, action: 'approve' | 'reject', txHash?: string): Promise<{
        id: string;
        currency: string;
        amount: bigint;
        address: string;
        status: import(".prisma/client").$Enums.WithdrawalStatus;
        reviewNeeded: boolean;
        txHash: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        processedAt: Date | null;
        userId: string;
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
                id: string;
                handle: string;
                email: string;
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
