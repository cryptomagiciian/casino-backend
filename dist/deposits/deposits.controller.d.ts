import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { DepositWebhookDto } from './dto/webhook.dto';
import { Currency } from '../shared/constants';
export declare class DepositsController {
    private readonly depositsService;
    constructor(depositsService: DepositsService);
    createDeposit(req: {
        user: {
            sub: string;
        };
    }, createDepositDto: CreateDepositDto): Promise<DepositResponseDto>;
    getDeposits(req: {
        user: {
            sub: string;
        };
    }, limit?: string, offset?: string): Promise<{
        deposits: {
            id: string;
            currency: Currency;
            amount: string;
            paymentMethod: string;
            status: import(".prisma/client").$Enums.DepositStatus;
            walletAddress: string;
            transactionHash: string;
            requiredConfirmations: number;
            currentConfirmations: number;
            createdAt: string;
            completedAt: string;
        }[];
        total: number;
    }>;
    getDeposit(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<DepositResponseDto>;
    getDepositLimits(currency: Currency): Promise<{
        min: number;
        max: number;
        dailyLimit: number;
        fees: {
            crypto: number;
            card: number;
            bank_transfer: number;
        };
    }>;
    confirmDeposit(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<DepositResponseDto>;
    processWebhook(webhookData: DepositWebhookDto, signature?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
