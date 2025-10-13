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
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../ledger/ledger.service");
const constants_1 = require("../shared/constants");
const utils_1 = require("../shared/utils");
let WithdrawalsService = class WithdrawalsService {
    constructor(prisma, ledgerService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
    }
    async createWithdrawal(userId, request) {
        const { currency, amount, address } = request;
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        if ((0, utils_1.isDemoMode)()) {
            const withdrawal = await this.prisma.withdrawal.create({
                data: {
                    userId,
                    currency,
                    amount: amountSmallest,
                    address,
                    status: 'REJECTED',
                    reviewNeeded: false,
                    meta: {
                        reason: 'Demo mode - withdrawals not allowed',
                        createdAt: new Date().toISOString(),
                    },
                },
            });
            return {
                ...withdrawal,
                amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, currency),
                message: 'Withdrawals are not allowed in demo mode',
            };
        }
        const account = await this.prisma.walletAccount.findUnique({
            where: {
                userId_currency: {
                    userId,
                    currency,
                },
            },
        });
        if (!account) {
            throw new common_1.BadRequestException('No wallet account found for this currency');
        }
        const balance = await this.ledgerService.getAccountBalanceByCurrency(account.id, currency);
        if (balance < amountSmallest) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const withdrawal = await this.prisma.withdrawal.create({
            data: {
                userId,
                currency,
                amount: amountSmallest,
                address,
                status: 'PENDING',
                reviewNeeded: true,
                meta: {
                    createdAt: new Date().toISOString(),
                },
            },
        });
        return {
            ...withdrawal,
            amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, currency),
            message: 'Withdrawal request submitted for review',
        };
    }
    async processWithdrawal(withdrawalId, action, txHash) {
        const withdrawal = await this.prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });
        if (!withdrawal) {
            throw new common_1.NotFoundException('Withdrawal not found');
        }
        if (withdrawal.status !== 'PENDING') {
            throw new common_1.BadRequestException('Withdrawal already processed');
        }
        if (action === 'approve') {
            const account = await this.prisma.walletAccount.findUnique({
                where: {
                    userId_currency: {
                        userId: withdrawal.userId,
                        currency: withdrawal.currency,
                    },
                },
            });
            if (account) {
                await this.ledgerService.createEntry({
                    accountId: account.id,
                    amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
                    currency: withdrawal.currency,
                    type: constants_1.LEDGER_TYPES.WITHDRAWAL,
                    refId: withdrawal.id,
                    meta: {
                        address: withdrawal.address,
                        txHash,
                        processed: true,
                    },
                });
            }
            return this.prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'COMPLETED',
                    txHash,
                    processedAt: new Date(),
                },
            });
        }
        else {
            return this.prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'REJECTED',
                },
            });
        }
    }
    async getUserWithdrawals(userId, limit = 50, offset = 0) {
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
                address: withdrawal.address,
                status: withdrawal.status,
                reviewNeeded: withdrawal.reviewNeeded,
                txHash: withdrawal.txHash,
                createdAt: withdrawal.createdAt,
                processedAt: withdrawal.processedAt,
            })),
            total,
        };
    }
    async getPendingWithdrawals(limit = 50, offset = 0) {
        const [withdrawals, total] = await Promise.all([
            this.prisma.withdrawal.findMany({
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip: offset,
                include: {
                    user: {
                        select: {
                            id: true,
                            handle: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.withdrawal.count({
                where: { status: 'PENDING' },
            }),
        ]);
        return {
            withdrawals: withdrawals.map(withdrawal => ({
                id: withdrawal.id,
                userId: withdrawal.userId,
                user: withdrawal.user,
                currency: withdrawal.currency,
                amount: (0, utils_1.fromSmallestUnits)(withdrawal.amount, withdrawal.currency),
                address: withdrawal.address,
                status: withdrawal.status,
                reviewNeeded: withdrawal.reviewNeeded,
                createdAt: withdrawal.createdAt,
            })),
            total,
        };
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map