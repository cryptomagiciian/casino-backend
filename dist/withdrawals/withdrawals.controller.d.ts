import { WithdrawalsService } from './withdrawals.service';
export declare class WithdrawalDto {
    currency: string;
    amount: string;
    address: string;
}
export declare class WithdrawalsController {
    private withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    createWithdrawal(req: {
        user: {
            sub: string;
        };
    }, withdrawalDto: WithdrawalDto): Promise<{
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
    getUserWithdrawals(req: {
        user: {
            sub: string;
        };
    }, limit?: number, offset?: number): Promise<{
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
