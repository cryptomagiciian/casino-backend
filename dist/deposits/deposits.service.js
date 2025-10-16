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
var DepositsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../ledger/ledger.service");
const wallets_service_1 = require("../wallets/wallets.service");
const wallet_service_1 = require("../wallet/wallet.service");
const utils_1 = require("../shared/utils");
const crypto = require("crypto");
let DepositsService = DepositsService_1 = class DepositsService {
    constructor(prisma, ledgerService, walletsService, walletService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.walletsService = walletsService;
        this.walletService = walletService;
        this.logger = new common_1.Logger(DepositsService_1.name);
        this.MIN_DEPOSITS = {
            BTC: 0.0001,
            ETH: 0.001,
            SOL: 0.01,
            USDC: 1,
            USDT: 1,
        };
        this.REQUIRED_CONFIRMATIONS = {
            BTC: 3,
            ETH: 12,
            SOL: 32,
            USDC: 12,
            USDT: 12,
        };
        this.WITHDRAWAL_FEES = {
            BTC: 0.0005,
            ETH: 0.005,
            SOL: 0.01,
            USDC: 1,
            USDT: 1,
        };
    }
    async createDeposit(userId, createDepositDto) {
        const { currency, amount, network, blockchain, transactionHash, blockNumber } = createDepositDto;
        if (amount < this.MIN_DEPOSITS[currency]) {
            throw new common_1.BadRequestException(`Minimum deposit amount for ${currency} is ${this.MIN_DEPOSITS[currency]}`);
        }
        const depositId = (0, utils_1.generateId)('dep');
        const targetCurrency = blockchain && ['USDC', 'USDT'].includes(currency) ? blockchain : currency;
        const depositWalletAddress = await this.walletService.generateDepositAddress(userId, targetCurrency, network, depositId);
        const deposit = await this.prisma.deposit.create({
            data: {
                id: depositId,
                userId,
                currency,
                amount: (0, utils_1.toSmallestUnits)(amount.toString(), currency),
                paymentMethod: 'crypto',
                status: 'PENDING',
                walletAddress: depositWalletAddress,
                transactionHash,
                requiredConfirmations: this.REQUIRED_CONFIRMATIONS[currency],
                currentConfirmations: 0,
                meta: {
                    network,
                    blockchain,
                    transactionHash,
                    blockNumber,
                },
            },
        });
        this.logger.log(`Created Web3 deposit ${depositId} for user ${userId}: ${amount} ${currency} on ${network}`);
        const qrCodeData = this.walletService.generateQrCodeData(currency, depositWalletAddress, amount);
        const explorerUrl = this.walletService.getExplorerUrl(currency, depositWalletAddress, network);
        const solanaInstructions = currency === 'SOL' ?
            this.walletService.getSolanaInitializationInstructions(depositWalletAddress, network) : null;
        return {
            id: deposit.id,
            currency: deposit.currency,
            amount: (0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency),
            paymentMethod: deposit.paymentMethod,
            network,
            status: deposit.status,
            walletAddress: deposit.walletAddress,
            transactionHash: deposit.transactionHash,
            blockNumber,
            qrCodeData,
            requiredConfirmations: deposit.requiredConfirmations,
            currentConfirmations: deposit.currentConfirmations,
            explorerUrl,
            createdAt: deposit.createdAt.toISOString(),
            completedAt: deposit.completedAt?.toISOString(),
            solanaInstructions,
        };
    }
    async getDeposits(userId, limit = 50, offset = 0) {
        const [deposits, total] = await Promise.all([
            this.prisma.deposit.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.deposit.count({
                where: { userId },
            }),
        ]);
        return {
            deposits: deposits.map(deposit => ({
                id: deposit.id,
                currency: deposit.currency,
                amount: (0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency),
                paymentMethod: deposit.paymentMethod,
                status: deposit.status,
                walletAddress: deposit.walletAddress,
                transactionHash: deposit.transactionHash,
                requiredConfirmations: deposit.requiredConfirmations,
                currentConfirmations: deposit.currentConfirmations,
                createdAt: deposit.createdAt.toISOString(),
                completedAt: deposit.completedAt?.toISOString(),
            })),
            total,
        };
    }
    async getDeposit(userId, depositId) {
        const deposit = await this.prisma.deposit.findFirst({
            where: { id: depositId, userId },
        });
        if (!deposit) {
            throw new common_1.NotFoundException('Deposit not found');
        }
        const qrCodeData = this.walletService.generateQrCodeData(deposit.currency, deposit.walletAddress, parseFloat((0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency)));
        const explorerUrl = this.walletService.getExplorerUrl(deposit.currency, deposit.walletAddress, 'mainnet');
        return {
            id: deposit.id,
            currency: deposit.currency,
            amount: (0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency),
            paymentMethod: deposit.paymentMethod,
            network: 'mainnet',
            status: deposit.status,
            walletAddress: deposit.walletAddress,
            transactionHash: deposit.transactionHash,
            blockNumber: deposit.blockNumber,
            qrCodeData,
            requiredConfirmations: deposit.requiredConfirmations,
            currentConfirmations: deposit.currentConfirmations,
            explorerUrl,
            createdAt: deposit.createdAt.toISOString(),
            completedAt: deposit.completedAt?.toISOString(),
        };
    }
    async processDepositWebhook(depositId, confirmations, transactionHash) {
        const deposit = await this.prisma.deposit.findUnique({
            where: { id: depositId },
        });
        if (!deposit) {
            throw new common_1.NotFoundException('Deposit not found');
        }
        if (deposit.status === 'COMPLETED') {
            return;
        }
        await this.prisma.deposit.update({
            where: { id: depositId },
            data: {
                currentConfirmations: confirmations,
                transactionHash: transactionHash || deposit.transactionHash,
            },
        });
        if (confirmations >= deposit.requiredConfirmations) {
            await this.completeDeposit(depositId);
        }
    }
    async completeDeposit(depositId) {
        const deposit = await this.prisma.deposit.findUnique({
            where: { id: depositId },
        });
        if (!deposit || deposit.status === 'COMPLETED') {
            return;
        }
        await this.prisma.deposit.update({
            where: { id: depositId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        const network = deposit.meta?.network || 'mainnet';
        await this.ledgerService.createUserTransaction({
            userId: deposit.userId,
            type: 'DEPOSIT',
            currency: deposit.currency,
            amount: (0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency),
            description: `Deposit ${deposit.id}`,
            refId: deposit.id,
            network,
            meta: {
                paymentMethod: deposit.paymentMethod,
                transactionHash: deposit.transactionHash,
                network,
            },
        });
        this.logger.log(`Completed deposit ${depositId}: ${(0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency)} ${deposit.currency}`);
    }
    async getDepositLimits(currency) {
        return {
            min: this.MIN_DEPOSITS[currency],
            max: 1000000,
            dailyLimit: 10000000,
            fees: {
                crypto: 0,
                card: 0.029,
                bank_transfer: 0.01,
            },
        };
    }
    async confirmDeposit(userId, depositId) {
        const deposit = await this.prisma.deposit.findFirst({
            where: {
                id: depositId,
                userId,
                status: 'PENDING',
            },
        });
        if (!deposit) {
            throw new common_1.BadRequestException('Deposit not found or already processed');
        }
        await this.prisma.deposit.update({
            where: { id: depositId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                currentConfirmations: deposit.requiredConfirmations,
                transactionHash: deposit.transactionHash || this.generateMockTxHash(),
            },
        });
        const network = deposit.meta?.network || 'mainnet';
        await this.ledgerService.createUserTransaction({
            userId: deposit.userId,
            type: 'DEPOSIT',
            currency: deposit.currency,
            amount: (0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency),
            description: `Deposit ${depositId} confirmed`,
            refId: depositId,
            network,
            meta: {
                depositId,
                walletAddress: deposit.walletAddress,
                confirmedAt: new Date(),
                network,
            },
        });
        this.logger.log(`Manually confirmed deposit ${depositId}: ${(0, utils_1.fromSmallestUnits)(deposit.amount, deposit.currency)} ${deposit.currency}`);
        return this.getDeposit(userId, depositId);
    }
    generateMockTxHash() {
        return crypto.randomBytes(32).toString('hex');
    }
};
exports.DepositsService = DepositsService;
exports.DepositsService = DepositsService = DepositsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        wallets_service_1.WalletsService,
        wallet_service_1.WalletService])
], DepositsService);
//# sourceMappingURL=deposits.service.js.map