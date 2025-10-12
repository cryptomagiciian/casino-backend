import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { DepositRequest } from '../shared/types';
export declare class DepositsService {
    private prisma;
    private ledgerService;
    constructor(prisma: PrismaService, ledgerService: LedgerService);
    createDeposit(userId: string, request: DepositRequest): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        currency: string;
        amount: bigint;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.DepositStatus;
        provider: string;
        txRef: string | null;
    }>;
    processWebhook(provider: string, payload: any): Promise<{
        success: boolean;
    }>;
    getUserDeposits(userId: string, limit?: number, offset?: number): Promise<{
        deposits: {
            id: string;
            currency: string;
            amount: string;
            provider: string;
            status: import(".prisma/client").$Enums.DepositStatus;
            txRef: string;
            createdAt: Date;
        }[];
        total: number;
    }>;
}
