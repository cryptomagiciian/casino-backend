import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { Currency } from '../shared/constants';
export declare class WithdrawalsService {
    private prisma;
    private ledgerService;
    private walletsService;
    private walletService;
    private readonly logger;
    private readonly MIN_WITHDRAWALS;
    private readonly WITHDRAWAL_FEES;
    private readonly DAILY_LIMITS;
    constructor(prisma: PrismaService, ledgerService: LedgerService, walletsService: WalletsService, walletService: WalletService);
    createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto): Promise<WithdrawalResponseDto>;
    getWithdrawals(userId: string, limit?: number, offset?: number): Promise<{
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
    getWithdrawal(userId: string, withdrawalId: string): Promise<WithdrawalResponseDto>;
    cancelWithdrawal(userId: string, withdrawalId: string): Promise<void>;
    private checkDailyWithdrawalLimit;
    private performSecurityChecks;
    private getProcessingTime;
    private generateExplorerUrl;
    private processWithdrawal;
    private completeWithdrawal;
    private failWithdrawal;
    getWithdrawalLimits(currency: Currency): Promise<{
        min: number;
        max: number;
        dailyLimit: number;
        fee: number;
        processingTime: string;
    }>;
}
