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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../ledger/ledger.service");
const constants_1 = require("../shared/constants");
const utils_1 = require("../shared/utils");
let WalletsService = class WalletsService {
    constructor(prisma, ledgerService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
    }
    async getOrCreateAccount(userId, currency) {
        let account = await this.prisma.walletAccount.findUnique({
            where: {
                userId_currency: {
                    userId,
                    currency,
                },
            },
        });
        if (!account) {
            account = await this.prisma.walletAccount.create({
                data: {
                    userId,
                    currency,
                    available: 0n,
                    locked: 0n,
                },
            });
        }
        return account;
    }
    async getWalletBalances(userId) {
        const accounts = await this.prisma.walletAccount.findMany({
            where: { userId },
        });
        const balances = [];
        for (const currency of Object.values(constants_1.CURRENCIES)) {
            const account = accounts.find(acc => acc.currency === currency);
            const available = account ? await this.ledgerService.getAccountBalanceByCurrency(account.id, currency) : 0n;
            const locked = account ? account.locked : 0n;
            const total = available + locked;
            balances.push({
                currency,
                available: (0, utils_1.fromSmallestUnits)(available, currency),
                locked: (0, utils_1.fromSmallestUnits)(locked, currency),
                total: (0, utils_1.fromSmallestUnits)(total, currency),
            });
        }
        return balances;
    }
    async getBalance(userId, currency) {
        const account = await this.getOrCreateAccount(userId, currency);
        const available = await this.ledgerService.getAccountBalanceByCurrency(account.id, currency);
        const locked = account.locked;
        const total = available + locked;
        return {
            currency,
            available: (0, utils_1.fromSmallestUnits)(available, currency),
            locked: (0, utils_1.fromSmallestUnits)(locked, currency),
            total: (0, utils_1.fromSmallestUnits)(total, currency),
        };
    }
    async faucet(userId, request) {
        if (!(0, utils_1.isDemoMode)()) {
            throw new common_1.BadRequestException('Faucet is only available in demo mode');
        }
        const { currency, amount } = request;
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        const dailyLimit = BigInt(constants_1.FAUCET_DAILY_LIMITS[currency]);
        if (amountSmallest > dailyLimit) {
            throw new common_1.BadRequestException(`Amount exceeds daily faucet limit for ${currency}`);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayFaucetUsage = await this.prisma.ledgerEntry.aggregate({
            where: {
                account: {
                    userId,
                    currency,
                },
                type: 'FAUCET',
                createdAt: {
                    gte: today,
                },
            },
            _sum: { amount: true },
        });
        const usedToday = todayFaucetUsage._sum.amount || 0n;
        if (usedToday + amountSmallest > dailyLimit) {
            throw new common_1.BadRequestException(`Daily faucet limit exceeded for ${currency}`);
        }
        const account = await this.getOrCreateAccount(userId, currency);
        await this.ledgerService.createEntry({
            accountId: account.id,
            amount,
            currency,
            type: 'FAUCET',
            meta: { faucet: true, dailyLimit: dailyLimit.toString() },
        });
        return {
            currency,
            amount,
            message: `Successfully credited ${amount} ${currency} from faucet`,
        };
    }
    async lockFunds(userId, currency, amount, refId) {
        const account = await this.getOrCreateAccount(userId, currency);
        await this.ledgerService.lockFunds(account.id, amount, currency, refId);
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        await this.prisma.walletAccount.update({
            where: { id: account.id },
            data: {
                locked: {
                    increment: amountSmallest,
                },
            },
        });
        return { success: true };
    }
    async releaseFunds(userId, currency, amount, refId) {
        const account = await this.getOrCreateAccount(userId, currency);
        await this.ledgerService.releaseFunds(account.id, amount, currency, refId);
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        await this.prisma.walletAccount.update({
            where: { id: account.id },
            data: {
                locked: {
                    decrement: amountSmallest,
                },
            },
        });
        return { success: true };
    }
    async creditWinnings(userId, currency, amount, refId) {
        const account = await this.getOrCreateAccount(userId, currency);
        await this.ledgerService.creditWinnings(account.id, amount, currency, refId);
        return { success: true };
    }
    async getLedgerEntries(userId, currency, limit = 50, offset = 0) {
        const account = await this.getOrCreateAccount(userId, currency);
        return this.ledgerService.getAccountEntries(account.id, limit, offset);
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map