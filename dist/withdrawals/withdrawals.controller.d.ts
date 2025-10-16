import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { Currency } from '../shared/constants';
export declare class WithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    createWithdrawal(req: {
        user: {
            sub: string;
        };
    }, createWithdrawalDto: CreateWithdrawalDto): Promise<WithdrawalResponseDto>;
    getWithdrawals(req: {
        user: {
            sub: string;
        };
    }, limit?: string, offset?: string): Promise<{
        withdrawals: {
            id: string;
            currency: Currency;
            amount: string;
            fee: string;
            netAmount: string;
            walletAddress: string;
            withdrawalMethod: string;
            status: import(".prisma/client").$Enums.WithdrawalStatus;
            transactionHash: string;
            processingTime: string;
            createdAt: string;
            completedAt: string;
        }[];
        total: number;
    }>;
    getWithdrawal(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<WithdrawalResponseDto>;
    cancelWithdrawal(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        message: string;
    }>;
    getWithdrawalLimits(currency: Currency): Promise<{
        min: number;
        max: number;
        dailyLimit: number;
        fee: number;
        processingTime: string;
    }>;
}
