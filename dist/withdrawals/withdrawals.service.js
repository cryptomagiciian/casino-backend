"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WithdrawalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../ledger/ledger.service");
const wallets_service_1 = require("../wallets/wallets.service");
const wallet_service_1 = require("../wallet/wallet.service");
const utils_1 = require("../shared/utils");
const crypto = require("crypto");
let WithdrawalsService = WithdrawalsService_1 = class WithdrawalsService {
    constructor(prisma, ledgerService, walletsService, walletService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.walletsService = walletsService;
        this.walletService = walletService;
        this.logger = new common_1.Logger(WithdrawalsService_1.name);
        this.MIN_WITHDRAWALS = {
            BTC: 0.001,
            ETH: 0.01,
            SOL: 0.1,
            USDC: 10,
            USDT: 10,
        };
        this.WITHDRAWAL_FEES = {
            BTC: 0.0005,
            ETH: 0.005,
            SOL: 0.01,
            USDC: 1,
            USDT: 1,
        };
        this.DAILY_LIMITS = {
            BTC: 1,
            ETH: 10,
            SOL: 1000,
            USDC: 50000,
            USDT: 50000,
        };
    }
    async createWithdrawal(userId, createWithdrawalDto) {
        const { currency, amount, walletAddress, network, twoFactorCode, withdrawalPassword } = createWithdrawalDto;
        if (amount < this.MIN_WITHDRAWALS[currency]) {
            throw new common_1.BadRequestException(`Minimum withdrawal amount for ${currency} is ${this.MIN_WITHDRAWALS[currency]}`);
        }
        await this.checkDailyWithdrawalLimit(userId, currency, amount);
        if (!this.walletService.validateAddress(currency, walletAddress, network)) {
            throw new common_1.BadRequestException(`Invalid ${currency} address format`);
        }
        const userBalance = await this.walletsService.getWalletBalance(userId, currency);
        const balanceAmount = parseFloat(userBalance.available);
        if (balanceAmount < amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const fee = this.WITHDRAWAL_FEES[currency];
        const netAmount = amount - fee;
        if (netAmount <= 0) {
            throw new common_1.BadRequestException('Withdrawal amount too small to cover fees');
        }
        await this.performSecurityChecks(userId, twoFactorCode, withdrawalPassword);
        const withdrawalId = (0, utils_1.generateId)('wth');
        const withdrawal = await this.prisma.withdrawal.create({
            data: {
                id: withdrawalId,
                userId,
                currency,
                amount: (0, utils_1.toSmallestUnits)(amount.toString(), currency),
                fee: (0, utils_1.toSmallestUnits)(fee.toString(), currency),
                netAmount: (0, utils_1.toSmallestUnits)(netAmount.toString(), currency),
                walletAddress,
                withdrawalMethod: 'crypto',
                status: 'PENDING',
                processingTime: this.getProcessingTime(currency, 'crypto'),
            },
        });
        this.logger.log(`Created Web3 withdrawal ${withdrawalId} for user ${userId}: ${amount} ${currency} to ${walletAddress} on ${network}`);
        await this.ledgerService.createUserTransaction({
            userId,
            type: 'WITHDRAWAL_LOCK',
            currency,
            amount: amount.toString(),
            description: `Withdrawal ${withdrawalId} - funds locked`,
            refId: withdrawal.id,
            meta: {
                walletAddress,
                network,
            },
        });
        await this.processWithdrawal(withdrawalId);
        const explorerUrl = this.walletService.getExplorerUrl(currency, walletAddress, network);
        return {
            id: withdrawal.id,
            currency: withdrawal.currency,
            amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
            fee: (0, utils_1.fromSmallestUnits)(withdrawal.fee, withdrawal.currency),
            netAmount: (0, utils_1.fromSmallestUnits)(withdrawal.netAmount, withdrawal.currency),
            walletAddress: withdrawal.walletAddress,
            withdrawalMethod: withdrawal.withdrawalMethod,
            network,
            status: withdrawal.status,
            transactionHash: withdrawal.transactionHash,
            blockNumber: withdrawal.blockNumber,
            processingTime: withdrawal.processingTime,
            explorerUrl,
            createdAt: withdrawal.createdAt.toISOString(),
            completedAt: withdrawal.completedAt?.toISOString(),
        };
    }
    async getWithdrawals(userId, limit = 50, offset = 0) {
        const [withdrawals, total] = await Promise.all([
            this.prisma.withdrawal.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.withdrawal.count({
                where: { userId },
            }),
        ]);
        return {
            withdrawals: withdrawals.map(withdrawal => ({
                id: withdrawal.id,
                currency: withdrawal.currency,
                amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
                fee: (0, utils_1.fromSmallestUnits)(withdrawal.fee, withdrawal.currency),
                netAmount: (0, utils_1.fromSmallestUnits)(withdrawal.netAmount, withdrawal.currency),
                walletAddress: withdrawal.walletAddress,
                withdrawalMethod: withdrawal.withdrawalMethod,
                status: withdrawal.status,
                transactionHash: withdrawal.transactionHash,
                processingTime: withdrawal.processingTime,
                createdAt: withdrawal.createdAt.toISOString(),
                completedAt: withdrawal.completedAt?.toISOString(),
            })),
            total,
        };
    }
    async getWithdrawal(userId, withdrawalId) {
        const withdrawal = await this.prisma.withdrawal.findFirst({
            where: { id: withdrawalId, userId },
        });
        if (!withdrawal) {
            throw new common_1.NotFoundException('Withdrawal not found');
        }
        const explorerUrl = this.walletService.getExplorerUrl(withdrawal.currency, withdrawal.walletAddress, 'mainnet');
        return {
            id: withdrawal.id,
            currency: withdrawal.currency,
            amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
            fee: (0, utils_1.fromSmallestUnits)(withdrawal.fee, withdrawal.currency),
            netAmount: (0, utils_1.fromSmallestUnits)(withdrawal.netAmount, withdrawal.currency),
            walletAddress: withdrawal.walletAddress,
            withdrawalMethod: withdrawal.withdrawalMethod,
            network: 'mainnet',
            status: withdrawal.status,
            transactionHash: withdrawal.transactionHash,
            blockNumber: withdrawal.blockNumber,
            processingTime: withdrawal.processingTime,
            explorerUrl,
            createdAt: withdrawal.createdAt.toISOString(),
            completedAt: withdrawal.completedAt?.toISOString(),
        };
    }
    async cancelWithdrawal(userId, withdrawalId) {
        const withdrawal = await this.prisma.withdrawal.findFirst({
            where: { id: withdrawalId, userId },
        });
        if (!withdrawal) {
            throw new common_1.NotFoundException('Withdrawal not found');
        }
        if (withdrawal.status !== 'PENDING') {
            throw new common_1.BadRequestException('Only pending withdrawals can be cancelled');
        }
        await this.prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'CANCELLED' },
        });
        await this.ledgerService.createUserTransaction({
            userId,
            type: 'WITHDRAWAL_UNLOCK',
            currency: withdrawal.currency,
            amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
            description: `Withdrawal ${withdrawalId} cancelled - funds unlocked`,
            refId: withdrawal.id,
            meta: {},
        });
        this.logger.log(`Cancelled withdrawal ${withdrawalId} for user ${userId}`);
    }
    async checkDailyWithdrawalLimit(userId, currency, amount) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayWithdrawals = await this.prisma.withdrawal.findMany({
            where: {
                userId,
                currency,
                status: { in: ['COMPLETED', 'PROCESSING'] },
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        const totalWithdrawnToday = todayWithdrawals.reduce((sum, w) => {
            return sum + parseFloat((0, utils_1.fromSmallestUnits)(w.amount, w.currency));
        }, 0);
        if (totalWithdrawnToday + amount > this.DAILY_LIMITS[currency]) {
            throw new common_1.BadRequestException(`Daily withdrawal limit exceeded. Limit: ${this.DAILY_LIMITS[currency]} ${currency}, Already withdrawn: ${totalWithdrawnToday} ${currency}`);
        }
    }
    async performSecurityChecks(userId, twoFactorCode, withdrawalPassword) {
        this.logger.log(`Performing security checks for user ${userId}`);
        if (twoFactorCode && twoFactorCode.length !== 6) {
            throw new common_1.BadRequestException('Invalid 2FA code format');
        }
        if (withdrawalPassword && withdrawalPassword.length < 8) {
            throw new common_1.BadRequestException('Withdrawal password must be at least 8 characters');
        }
    }
    getProcessingTime(currency, method) {
        const times = {
            crypto: {
                BTC: '10-60 minutes',
                ETH: '5-30 minutes',
                SOL: '1-5 minutes',
                USDC: '5-30 minutes',
                USDT: '5-30 minutes',
            },
        };
        return times[method]?.[currency] || '10-60 minutes';
    }
    generateExplorerUrl(currency, address, network) {
        const explorers = {
            BTC: {
                mainnet: 'https://blockstream.info/address',
                testnet: 'https://blockstream.info/testnet/address',
            },
            ETH: {
                mainnet: 'https://etherscan.io/address',
                testnet: 'https://sepolia.etherscan.io/address',
            },
            SOL: {
                mainnet: 'https://explorer.solana.com/address',
                testnet: 'https://explorer.solana.com/address?cluster=testnet',
            },
            USDC: {
                mainnet: 'https://etherscan.io/token/0xa0b86a33e6ba0e0e5c4b8b8b8b8b8b8b8b8b8b8b8b?a=',
                testnet: 'https://sepolia.etherscan.io/token/0xa0b86a33e6ba0e0e5c4b8b8b8b8b8b8b8b8b8b8b8b?a=',
            },
            USDT: {
                mainnet: 'https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a=',
                testnet: 'https://sepolia.etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a=',
            },
        };
        const explorer = explorers[currency][network];
        return `${explorer}/${address}`;
    }
    async processWithdrawal(withdrawalId) {
        setTimeout(async () => {
            try {
                await this.completeWithdrawal(withdrawalId);
            }
            catch (error) {
                this.logger.error(`Failed to process withdrawal ${withdrawalId}:`, error);
                await this.failWithdrawal(withdrawalId);
            }
        }, 5000);
    }
    async completeWithdrawal(withdrawalId) {
        const withdrawal = await this.prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });
        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return;
        }
        const transactionHash = crypto.randomBytes(32).toString('hex');
        await this.prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'COMPLETED',
                transactionHash,
                completedAt: new Date(),
            },
        });
        await this.ledgerService.createUserTransaction({
            userId: withdrawal.userId,
            type: 'WITHDRAWAL',
            currency: withdrawal.currency,
            amount: (0, utils_1.fromSmallestUnits)(withdrawal.netAmount, withdrawal.currency),
            description: `Withdrawal ${withdrawal.id} completed`,
            refId: withdrawal.id,
            meta: {
                walletAddress: withdrawal.walletAddress,
                transactionHash,
                fee: (0, utils_1.fromSmallestUnits)(withdrawal.fee, withdrawal.currency),
            },
        });
        this.logger.log(`Completed withdrawal ${withdrawalId}: ${(0, utils_1.fromSmallestUnits)(withdrawal.netAmount, withdrawal.currency)} ${withdrawal.currency}`);
    }
    async failWithdrawal(withdrawalId) {
        const withdrawal = await this.prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });
        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return;
        }
        await this.prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'FAILED' },
        });
        await this.ledgerService.createUserTransaction({
            userId: withdrawal.userId,
            type: 'WITHDRAWAL_UNLOCK',
            currency: withdrawal.currency,
            amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
            description: `Withdrawal ${withdrawal.id} failed - funds unlocked`,
            refId: withdrawal.id,
            meta: {},
        });
        this.logger.log(`Failed withdrawal ${withdrawalId} for user ${withdrawal.userId}`);
    }
    async getWithdrawalLimits(currency) {
        return {
            min: this.MIN_WITHDRAWALS[currency],
            max: this.DAILY_LIMITS[currency],
            dailyLimit: this.DAILY_LIMITS[currency],
            fee: this.WITHDRAWAL_FEES[currency],
            processingTime: this.getProcessingTime(currency, 'crypto'),
        };
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = WithdrawalsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        wallets_service_1.WalletsService,
        wallet_service_1.WalletService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map