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
exports.BetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
const fairness_service_1 = require("../fairness/fairness.service");
const games_service_1 = require("../games/games.service");
const utils_1 = require("../shared/utils");
let BetsService = class BetsService {
    constructor(prisma, walletsService, fairnessService, gamesService) {
        this.prisma = prisma;
        this.walletsService = walletsService;
        this.fairnessService = fairnessService;
        this.gamesService = gamesService;
    }
    async previewBet(request) {
        return this.gamesService.previewBet(request.game, request.currency, request.stake, request.params);
    }
    async placeBet(userId, request) {
        const { game, currency, stake, clientSeed, params } = request;
        const preview = await this.previewBet(request);
        const fairnessSeed = await this.fairnessService.getCurrentSeed(userId);
        const finalClientSeed = clientSeed || (0, utils_1.generateClientSeed)();
        await this.walletsService.lockFunds(userId, currency, stake, 'bet_placement');
        const bet = await this.prisma.bet.create({
            data: {
                userId,
                game,
                currency,
                stake: (0, utils_1.toSmallestUnits)(stake, currency),
                potentialPayout: (0, utils_1.toSmallestUnits)(preview.potentialPayout, currency),
                serverSeedHash: fairnessSeed.serverSeedHash,
                clientSeed: finalClientSeed,
                nonce: fairnessSeed.nonce,
                params: params || {},
                status: 'PENDING',
            },
        });
        return {
            id: bet.id,
            game: bet.game,
            currency: bet.currency,
            stake,
            potentialPayout: preview.potentialPayout,
            clientSeed: finalClientSeed,
            serverSeedHash: fairnessSeed.serverSeedHash,
            nonce: fairnessSeed.nonce,
            status: 'PENDING',
        };
    }
    async resolveBet(betId) {
        const bet = await this.prisma.bet.findUnique({
            where: { id: betId },
        });
        if (!bet) {
            throw new common_1.NotFoundException('Bet not found');
        }
        if (bet.status !== 'PENDING') {
            throw new common_1.BadRequestException('Bet already resolved');
        }
        const fairnessSeed = await this.prisma.fairnessSeed.findFirst({
            where: {
                userId: bet.userId,
                serverSeedHash: bet.serverSeedHash,
            },
        });
        if (!fairnessSeed) {
            throw new common_1.NotFoundException('Fairness seed not found');
        }
        const rng = await (0, utils_1.generateRng)(fairnessSeed.serverSeed, bet.clientSeed, bet.nonce);
        const outcome = this.generateGameOutcome(bet.game, rng, bet.params);
        const stakeFloat = parseFloat((0, utils_1.fromSmallestUnits)(bet.stake, bet.currency));
        const payout = stakeFloat * outcome.multiplier;
        const payoutSmallest = (0, utils_1.toSmallestUnits)(payout.toString(), bet.currency);
        const updatedBet = await this.prisma.bet.update({
            where: { id: betId },
            data: {
                outcome: outcome.result,
                resultMultiplier: outcome.multiplier,
                status: outcome.multiplier > 0 ? 'WON' : 'LOST',
                rngTrace: {
                    serverSeed: fairnessSeed.serverSeed,
                    clientSeed: bet.clientSeed,
                    nonce: bet.nonce,
                    rng,
                    outcome,
                },
                resolvedAt: new Date(),
            },
        });
        if (outcome.multiplier > 0) {
            await this.walletsService.creditWinnings(bet.userId, bet.currency, payout.toString(), betId);
        }
        await this.walletsService.releaseFunds(bet.userId, bet.currency, (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency), betId);
        return {
            id: bet.id,
            game: bet.game,
            currency: bet.currency,
            stake: (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency),
            outcome: outcome.result,
            resultMultiplier: outcome.multiplier,
            payout: payout.toString(),
            status: outcome.multiplier > 0 ? 'WON' : 'LOST',
            rngTrace: updatedBet.rngTrace,
        };
    }
    async cashoutBet(betId, cashoutMultiplier) {
        const bet = await this.prisma.bet.findUnique({
            where: { id: betId },
        });
        if (!bet) {
            throw new common_1.NotFoundException('Bet not found');
        }
        if (bet.status !== 'PENDING') {
            throw new common_1.BadRequestException('Bet already resolved');
        }
        const cashoutGames = ['freeze_the_bag', 'to_the_moon', 'leverage_ladder'];
        if (!cashoutGames.includes(bet.game)) {
            throw new common_1.BadRequestException('This game does not support cashout');
        }
        const actualMultiplier = cashoutMultiplier || 1.0;
        const finalMultiplier = Math.max(1.0, actualMultiplier);
        const stakeFloat = parseFloat((0, utils_1.fromSmallestUnits)(bet.stake, bet.currency));
        const payout = stakeFloat * finalMultiplier;
        const updatedBet = await this.prisma.bet.update({
            where: { id: betId },
            data: {
                outcome: 'cashed_out',
                resultMultiplier: finalMultiplier,
                status: 'CASHED_OUT',
                resolvedAt: new Date(),
            },
        });
        await this.walletsService.creditWinnings(bet.userId, bet.currency, payout.toString(), betId);
        await this.walletsService.releaseFunds(bet.userId, bet.currency, (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency), betId);
        return {
            id: bet.id,
            game: bet.game,
            currency: bet.currency,
            stake: (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency),
            outcome: 'cashed_out',
            resultMultiplier: finalMultiplier,
            payout: payout.toString(),
            status: 'CASHED_OUT',
        };
    }
    async getBet(betId) {
        const bet = await this.prisma.bet.findUnique({
            where: { id: betId },
        });
        if (!bet) {
            throw new common_1.NotFoundException('Bet not found');
        }
        return {
            id: bet.id,
            game: bet.game,
            currency: bet.currency,
            stake: (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency),
            potentialPayout: (0, utils_1.fromSmallestUnits)(bet.potentialPayout, bet.currency),
            outcome: bet.outcome,
            resultMultiplier: bet.resultMultiplier,
            status: bet.status,
            serverSeedHash: bet.serverSeedHash,
            clientSeed: bet.clientSeed,
            nonce: bet.nonce,
            revealedServerSeed: bet.revealedServerSeed,
            rngTrace: bet.rngTrace,
            params: bet.params,
            createdAt: bet.createdAt,
            resolvedAt: bet.resolvedAt,
        };
    }
    async getUserBets(userId, limit = 50, offset = 0) {
        const [bets, total] = await Promise.all([
            this.prisma.bet.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.bet.count({
                where: { userId },
            }),
        ]);
        return {
            bets: bets.map(bet => ({
                id: bet.id,
                game: bet.game,
                currency: bet.currency,
                stake: (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency),
                potentialPayout: (0, utils_1.fromSmallestUnits)(bet.potentialPayout, bet.currency),
                outcome: bet.outcome,
                resultMultiplier: bet.resultMultiplier,
                status: bet.status,
                createdAt: bet.createdAt,
                resolvedAt: bet.resolvedAt,
            })),
            total,
        };
    }
    generateGameOutcome(game, rng, params) {
        switch (game) {
            case 'candle_flip':
            case 'pump_or_dump':
            case 'bull_vs_bear_battle':
                const winChance = 0.495;
                const won = rng < winChance;
                return {
                    result: won ? 'win' : 'lose',
                    multiplier: won ? 1.98 : 0,
                };
            case 'support_or_resistance':
                const srWinChance = 0.485;
                const srWon = rng < srWinChance;
                return {
                    result: srWon ? 'win' : 'lose',
                    multiplier: srWon ? 2.02 : 0,
                };
            case 'leverage_ladder':
                const targetRung = params?.targetRung || 0;
                const multipliers = [1.3, 1.69, 2.19, 2.85, 3.7, 4.8];
                const ladderMultiplier = multipliers[targetRung] || 1.0;
                const ladderWinChance = Math.pow(0.9, targetRung + 1);
                const ladderWon = rng < ladderWinChance;
                return {
                    result: ladderWon ? 'win' : 'lose',
                    multiplier: ladderWon ? ladderMultiplier : 0,
                };
            case 'stop_loss_roulette':
                const stopLossDistance = params?.stopLossDistance || 0.1;
                const slMultiplier = Math.min(4.0, 1 + (0.5 / stopLossDistance));
                const slWinChance = 1 / slMultiplier;
                const slWon = rng < slWinChance;
                return {
                    result: slWon ? 'win' : 'lose',
                    multiplier: slWon ? slMultiplier : 0,
                };
            case 'freeze_the_bag':
            case 'to_the_moon':
                const crashProbability = 0.01;
                let currentMultiplier = 1.0;
                let crashed = false;
                while (!crashed && currentMultiplier < 100) {
                    const stepRng = (rng * currentMultiplier) % 1;
                    if (stepRng < crashProbability) {
                        crashed = true;
                        break;
                    }
                    currentMultiplier += 0.01;
                }
                return {
                    result: crashed ? 'crash' : 'continue',
                    multiplier: crashed ? 0 : currentMultiplier,
                };
            case 'diamond_hands':
                const mines = params?.mines || 3;
                const picks = params?.picks || [];
                const gridSize = 25;
                const minePositions = [];
                let mineRng = rng;
                while (minePositions.length < mines) {
                    const pos = Math.floor(mineRng * gridSize);
                    if (!minePositions.includes(pos)) {
                        minePositions.push(pos);
                    }
                    mineRng = (mineRng * 1.618) % 1;
                }
                let dhMultiplier = 1.0;
                let hitMine = false;
                for (const pick of picks) {
                    if (minePositions.includes(pick)) {
                        hitMine = true;
                        break;
                    }
                    dhMultiplier += 0.1;
                }
                return {
                    result: hitMine ? 'lose' : 'win',
                    multiplier: hitMine ? 0 : dhMultiplier,
                };
            default:
                throw new common_1.BadRequestException(`Unknown game: ${game}`);
        }
    }
};
exports.BetsService = BetsService;
exports.BetsService = BetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallets_service_1.WalletsService,
        fairness_service_1.FairnessService,
        games_service_1.GamesService])
], BetsService);
//# sourceMappingURL=bets.service.js.map