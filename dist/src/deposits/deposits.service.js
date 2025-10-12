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
exports.DepositsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../ledger/ledger.service");
const constants_1 = require("../shared/constants");
const utils_1 = require("../shared/utils");
let DepositsService = class DepositsService {
    constructor(prisma, ledgerService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
    }
    async createDeposit(userId, request) {
        const { currency, amount, provider, txRef } = request;
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        const deposit = await this.prisma.deposit.create({
            data: {
                userId,
                currency,
                amount: amountSmallest,
                provider,
                status: 'PENDING',
                txRef,
                meta: {
                    createdAt: new Date().toISOString(),
                },
            },
        });
        return deposit;
    }
    async processWebhook(provider, payload) {
        const { txRef, status, amount, currency } = payload;
        if (!txRef) {
            throw new common_1.BadRequestException('Missing transaction reference');
        }
        const deposit = await this.prisma.deposit.findFirst({
            where: { txRef },
        });
        if (!deposit) {
            throw new common_1.NotFoundException('Deposit not found');
        }
        if (status === 'confirmed') {
            await this.prisma.deposit.update({
                where: { id: deposit.id },
                data: {
                    status: 'CONFIRMED',
                },
            });
            const account = await this.prisma.walletAccount.findUnique({
                where: {
                    userId_currency: {
                        userId: deposit.userId,
                        currency: deposit.currency,
                    },
                },
            });
            if (account) {
                await this.ledgerService.createEntry({
                    accountId: account.id,
                    amount: fromSmallestUnits(deposit.amount, deposit.currency),
                    currency: deposit.currency,
                    type: constants_1.LEDGER_TYPES.DEPOSIT,
                    refId: deposit.id,
                    meta: {
                        provider,
                        txRef,
                        webhook: true,
                    },
                });
            }
        }
        else if (status === 'failed') {
            await this.prisma.deposit.update({
                where: { id: deposit.id },
                data: {
                    status: 'FAILED',
                },
            });
        }
        return { success: true };
    }
    async getUserDeposits(userId, limit = 50, offset = 0) {
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
                amount: fromSmallestUnits(deposit.amount, deposit.currency),
                provider: deposit.provider,
                status: deposit.status,
                txRef: deposit.txRef,
                createdAt: deposit.createdAt,
            })),
            total,
        };
    }
};
exports.DepositsService = DepositsService;
exports.DepositsService = DepositsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService])
], DepositsService);
function fromSmallestUnits(amount, currency) {
    const decimals = {
        BTC: 8,
        ETH: 18,
        SOL: 9,
        USDC: 6,
        USDT: 6,
    }[currency];
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    if (remainder === 0n) {
        return whole.toString();
    }
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');
    if (trimmed === '') {
        return whole.toString();
    }
    return `${whole}.${trimmed}`;
}
//# sourceMappingURL=deposits.service.js.map