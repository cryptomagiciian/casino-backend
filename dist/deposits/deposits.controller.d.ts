import { DepositsService } from './deposits.service';
export declare class DepositDto {
    currency: string;
    amount: string;
    provider: string;
    txRef?: string;
}
export declare class DepositsController {
    private depositsService;
    constructor(depositsService: DepositsService);
    createDeposit(req: {
        user: {
            sub: string;
        };
    }, depositDto: DepositDto): Promise<{
        id: string;
        currency: string;
        amount: bigint;
        status: import(".prisma/client").$Enums.DepositStatus;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string;
        provider: string;
        txRef: string | null;
    }>;
    processWebhook(body: {
        provider: string;
        payload: any;
    }): Promise<{
        success: boolean;
    }>;
    getUserDeposits(req: {
        user: {
            sub: string;
        };
    }, limit?: number, offset?: number): Promise<{
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
