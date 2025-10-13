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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const constants_1 = require("../shared/constants");
const utils_1 = require("../shared/utils");
let LedgerService = class LedgerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEntry(data) {
        const amountSmallest = (0, utils_1.toSmallestUnits)(data.amount, data.currency);
        return this.prisma.ledgerEntry.create({
            data: {
                accountId: data.accountId,
                amount: amountSmallest,
                currency: data.currency,
                type: data.type,
                refId: data.refId,
                meta: data.meta,
            },
        });
    }
    async createTransaction(debitData, creditData) {
        const debitAmount = (0, utils_1.toSmallestUnits)(debitData.amount, debitData.currency);
        const creditAmount = (0, utils_1.toSmallestUnits)(creditData.amount, creditData.currency);
        if (debitAmount !== creditAmount) {
            throw new common_1.BadRequestException('Debit and credit amounts must be equal');
        }
        return this.prisma.$transaction(async (tx) => {
            const debit = await tx.ledgerEntry.create({
                data: {
                    accountId: debitData.accountId,
                    amount: -debitAmount,
                    currency: debitData.currency,
                    type: debitData.type,
                    refId: debitData.refId,
                    meta: debitData.meta,
                },
            });
            const credit = await tx.ledgerEntry.create({
                data: {
                    accountId: creditData.accountId,
                    amount: creditAmount,
                    currency: creditData.currency,
                    type: creditData.type,
                    refId: creditData.refId,
                    meta: creditData.meta,
                },
            });
            return { debit, credit };
        });
    }
    async getAccountBalance(accountId) {
        const result = await this.prisma.ledgerEntry.aggregate({
            where: { accountId },
            _sum: { amount: true },
        });
        return result._sum.amount || 0n;
    }
    async getAccountBalanceByCurrency(accountId, currency) {
        const result = await this.prisma.ledgerEntry.aggregate({
            where: {
                accountId,
                currency,
            },
            _sum: { amount: true },
        });
        return result._sum.amount || 0n;
    }
    async getAccountEntries(accountId, limit = 50, offset = 0) {
        const [entries, total] = await Promise.all([
            this.prisma.ledgerEntry.findMany({
                where: { accountId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.ledgerEntry.count({
                where: { accountId },
            }),
        ]);
        return {
            entries: entries.map(entry => ({
                ...entry,
                amount: (0, utils_1.fromSmallestUnits)(entry.amount, entry.currency),
            })),
            total,
        };
    }
    async validateBalance(accountId, requiredAmount, currency) {
        const balance = await this.getAccountBalanceByCurrency(accountId, currency);
        const requiredSmallest = (0, utils_1.toSmallestUnits)(requiredAmount, currency);
        return balance >= requiredSmallest;
    }
    async lockFunds(accountId, amount, currency, refId) {
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        const hasBalance = await this.validateBalance(accountId, amount, currency);
        if (!hasBalance) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        return this.prisma.ledgerEntry.create({
            data: {
                accountId,
                amount: -amountSmallest,
                currency,
                type: constants_1.LEDGER_TYPES.BET_STAKE,
                refId,
                meta: { locked: true },
            },
        });
    }
    async releaseFunds(accountId, amount, currency, refId) {
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        return this.prisma.ledgerEntry.create({
            data: {
                accountId,
                amount: amountSmallest,
                currency,
                type: constants_1.LEDGER_TYPES.BET_REFUND,
                refId,
                meta: { released: true },
            },
        });
    }
    async creditWinnings(accountId, amount, currency, refId) {
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        return this.prisma.ledgerEntry.create({
            data: {
                accountId,
                amount: amountSmallest,
                currency,
                type: constants_1.LEDGER_TYPES.BET_WIN,
                refId,
                meta: { winnings: true },
            },
        });
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map