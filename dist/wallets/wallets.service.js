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
    async getOrCreateAccount(userId, currency, network = 'mainnet') {
        let account = await this.prisma.walletAccount.findUnique({
            where: {
                userId_currency_network: {
                    userId,
                    currency,
                    network,
                },
            },
        });
        if (!account) {
            account = await this.prisma.walletAccount.create({
                data: {
                    userId,
                    currency,
                    network,
                    available: 0n,
                    locked: 0n,
                },
            });
        }
        return account;
    }
    async getWalletBalance(userId, currency, network = 'mainnet') {
        const account = await this.getOrCreateAccount(userId, currency, network);
        return {
            currency,
            available: (0, utils_1.fromSmallestUnits)(account.available, currency),
            locked: (0, utils_1.fromSmallestUnits)(account.locked, currency),
            total: (0, utils_1.fromSmallestUnits)(account.available + account.locked, currency),
        };
    }
    async getWalletBalances(userId, network = 'mainnet') {
        const accounts = await this.prisma.walletAccount.findMany({
            where: { userId, network },
        });
        const balances = [];
        for (const currency of Object.values(constants_1.CURRENCIES)) {
            const account = accounts.find(acc => acc.currency === currency);
            const available = account ? account.available : 0n;
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
    async getBalance(userId, currency, network = 'mainnet') {
        const account = await this.getOrCreateAccount(userId, currency, network);
        const available = account.available;
        const locked = account.locked;
        const total = available + locked;
        return {
            currency,
            available: (0, utils_1.fromSmallestUnits)(available, currency),
            locked: (0, utils_1.fromSmallestUnits)(locked, currency),
            total: (0, utils_1.fromSmallestUnits)(total, currency),
        };
    }
    async getTestnetFaucet(userId, currency, network = 'testnet') {
        if (network !== 'testnet') {
            throw new common_1.BadRequestException('Faucet is only available on testnet');
        }
        const amount = constants_1.TESTNET_FAUCET_AMOUNTS[currency];
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount.toString(), currency);
        const account = await this.getOrCreateAccount(userId, currency, 'testnet');
        await this.ledgerService.createUserTransaction({
            userId,
            amount: amount.toString(),
            currency,
            type: 'FAUCET',
            network: 'testnet',
            description: `Testnet faucet: ${amount} ${currency}`,
            meta: { faucet: true, network: 'testnet', testnet: true },
        });
        return {
            currency,
            amount,
            network: 'testnet',
            message: `Successfully credited ${amount} ${currency} from testnet faucet`,
        };
    }
    async clearDemoFunds(userId) {
        const result = await this.prisma.walletAccount.updateMany({
            where: { userId },
            data: {
                available: 0n,
                locked: 0n,
            },
        });
        const ledgerResult = await this.prisma.ledgerEntry.deleteMany({
            where: {
                account: { userId },
                type: 'FAUCET',
                meta: {
                    path: ['faucet'],
                    equals: true,
                },
            },
        });
        return {
            message: 'Demo funds cleared successfully',
            accountsReset: result.count,
            ledgerEntriesCleared: ledgerResult.count,
        };
    }
    async lockFunds(userId, currency, amount, refId, network = 'mainnet') {
        const account = await this.getOrCreateAccount(userId, currency, network);
        console.log(`💰 LOCK FUNDS: User ${userId}, Currency ${currency}, Amount ${amount}, RefId ${refId}, Network ${network}`);
        console.log(`💰 Account before lock: Available ${account.available}, Locked ${account.locked}`);
        await this.ledgerService.lockFunds(account.id, amount, currency, refId);
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        console.log(`💰 Locking ${amountSmallest} funds`);
        const updatedAccount = await this.prisma.walletAccount.update({
            where: { id: account.id },
            data: {
                available: {
                    decrement: amountSmallest,
                },
                locked: {
                    increment: amountSmallest,
                },
            },
        });
        console.log(`💰 Account after lock: Available ${updatedAccount.available}, Locked ${updatedAccount.locked}`);
        return { success: true };
    }
    async releaseFunds(userId, currency, amount, refId, network = 'mainnet') {
        const account = await this.getOrCreateAccount(userId, currency, network);
        await this.ledgerService.releaseFunds(account.id, amount, currency, refId);
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        await this.prisma.walletAccount.update({
            where: { id: account.id },
            data: {
                available: {
                    increment: amountSmallest,
                },
                locked: {
                    decrement: amountSmallest,
                },
            },
        });
        return { success: true };
    }
    async creditWinnings(userId, currency, amount, refId, network = 'mainnet') {
        const account = await this.getOrCreateAccount(userId, currency, network);
        await this.ledgerService.creditWinnings(account.id, amount, currency, refId);
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        await this.prisma.walletAccount.update({
            where: { id: account.id },
            data: {
                available: {
                    increment: amountSmallest,
                },
            },
        });
        return { success: true };
    }
    async processBetLoss(userId, currency, amount, refId, network = 'mainnet') {
        const account = await this.getOrCreateAccount(userId, currency, network);
        console.log(`💰 PROCESS BET LOSS: User ${userId}, Currency ${currency}, Amount ${amount}, RefId ${refId}, Network ${network}`);
        console.log(`💰 Account before loss: Available ${account.available}, Locked ${account.locked}`);
        await this.ledgerService.releaseFunds(account.id, amount, currency, refId);
        const amountSmallest = (0, utils_1.toSmallestUnits)(amount, currency);
        console.log(`💰 Deducting ${amountSmallest} from locked funds`);
        const updatedAccount = await this.prisma.walletAccount.update({
            where: { id: account.id },
            data: {
                locked: {
                    decrement: amountSmallest,
                },
            },
        });
        console.log(`💰 Account after loss: Available ${updatedAccount.available}, Locked ${updatedAccount.locked}`);
        return { success: true };
    }
    async getDetailedWalletBalances(userId, network = 'mainnet') {
        const balances = await this.getWalletBalances(userId, network);
        const usdRates = {
            BTC: 45000,
            ETH: 2500,
            SOL: 100,
            USDC: 1,
            USDT: 1,
        };
        const detailedBalances = balances.map(balance => {
            const balanceFloat = parseFloat(balance.available);
            const usdValue = balanceFloat * (usdRates[balance.currency] || 1);
            return {
                currency: balance.currency,
                available: balance.available,
                locked: balance.locked,
                total: balance.total,
                usdValue: usdValue.toFixed(2),
            };
        });
        const totalUsdValue = detailedBalances.reduce((sum, balance) => {
            return sum + parseFloat(balance.usdValue);
        }, 0);
        return {
            balances: detailedBalances,
            totalUsdValue: totalUsdValue.toFixed(2),
        };
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