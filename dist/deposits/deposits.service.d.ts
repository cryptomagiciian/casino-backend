import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { Currency } from '../shared/constants';
export declare class DepositsService {
    private prisma;
    private ledgerService;
    private walletsService;
    private walletService;
    private readonly logger;
    private readonly MIN_DEPOSITS;
    private readonly REQUIRED_CONFIRMATIONS;
    private readonly WITHDRAWAL_FEES;
    constructor(prisma: PrismaService, ledgerService: LedgerService, walletsService: WalletsService, walletService: WalletService);
    createDeposit(userId: string, createDepositDto: CreateDepositDto): Promise<DepositResponseDto>;
    getDeposits(userId: string, limit?: number, offset?: number): Promise<{
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
    getDeposit(userId: string, depositId: string): Promise<DepositResponseDto>;
    processDepositWebhook(depositId: string, confirmations: number, transactionHash?: string): Promise<void>;
    private completeDeposit;
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
    confirmDeposit(userId: string, depositId: string): Promise<DepositResponseDto>;
    private generateMockTxHash;
}
