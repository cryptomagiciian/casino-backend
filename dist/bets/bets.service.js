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
        const network = params?.network || 'mainnet';
        let actualNetwork = network;
        if (network === 'mainnet') {
            try {
                const testnetBalance = await this.walletsService.getWalletBalance(userId, currency, 'testnet');
                if (parseFloat(testnetBalance.available) > 0) {
                    actualNetwork = 'testnet';
                    console.log(`🎯 Bet service: User has testnet funds, using testnet for bet placement`);
                }
            }
            catch (error) {
                console.log(`🎯 Bet service: No testnet funds, using mainnet`);
            }
        }
        const balance = await this.walletsService.getWalletBalance(userId, currency, actualNetwork);
        const stakeFloat = parseFloat(stake);
        const availableFloat = parseFloat(balance.available);
        console.log(`💰 Balance check: Available ${availableFloat} ${currency}, Required ${stakeFloat} ${currency}`);
        if (availableFloat < stakeFloat) {
            throw new common_1.BadRequestException(`Insufficient balance. Available: ${availableFloat} ${currency}, Required: ${stakeFloat} ${currency}`);
        }
        await this.walletsService.lockFunds(userId, currency, stake, 'bet_placement', actualNetwork);
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
    async resolveBet(betId, resolveParams) {
        try {
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
                console.error(`Fairness seed not found for bet ${betId}, user ${bet.userId}`);
                throw new common_1.NotFoundException('Fairness seed not found');
            }
            const rng = await (0, utils_1.generateRng)(fairnessSeed.serverSeed, bet.clientSeed, bet.nonce);
            const mergedParams = { ...(bet.params || {}), ...(resolveParams || {}) };
            console.log(`🎲 RESOLVE DEBUG: Bet ${betId}, Game: ${bet.game}`);
            console.log(`🎲 RESOLVE DEBUG: Original bet.params:`, bet.params);
            console.log(`🎲 RESOLVE DEBUG: resolveParams:`, resolveParams);
            console.log(`🎲 RESOLVE DEBUG: Merged params:`, mergedParams);
            const outcome = this.generateGameOutcome(bet.game, rng, mergedParams);
            if (!outcome || typeof outcome.multiplier === 'undefined') {
                console.error(`Invalid game outcome for game ${bet.game}:`, outcome);
                throw new common_1.BadRequestException('Failed to generate game outcome');
            }
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
                        ...(outcome.rngTrace || {}),
                    },
                    resolvedAt: new Date(),
                },
            });
            const network = bet.params?.network || 'mainnet';
            if (outcome.multiplier > 0) {
                await this.walletsService.creditWinnings(bet.userId, bet.currency, payout.toString(), betId, network);
                await this.walletsService.releaseFunds(bet.userId, bet.currency, (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency), betId, network);
            }
            else {
                await this.walletsService.processBetLoss(bet.userId, bet.currency, (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency), betId, network);
            }
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
        catch (error) {
            console.error(`Error resolving bet ${betId}:`, error);
            throw error;
        }
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
        const network = bet.params?.network || 'mainnet';
        await this.walletsService.creditWinnings(bet.userId, bet.currency, payout.toString(), betId, network);
        await this.walletsService.releaseFunds(bet.userId, bet.currency, (0, utils_1.fromSmallestUnits)(bet.stake, bet.currency), betId, network);
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
    async getUserBetsWithFilters(userId, filters) {
        const where = { userId };
        if (filters.game) {
            where.game = filters.game;
        }
        if (filters.status) {
            if (filters.status === 'won') {
                where.outcome = 'win';
                where.resultMultiplier = { gt: 0 };
            }
            else if (filters.status === 'lost') {
                where.outcome = 'lose';
                where.resultMultiplier = 0;
            }
            else if (filters.status === 'pending') {
                where.resolvedAt = null;
            }
        }
        if (filters.currency) {
            where.currency = filters.currency;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }
        const limit = parseInt(filters.limit || '50');
        const offset = parseInt(filters.offset || '0');
        const [bets, total] = await Promise.all([
            this.prisma.bet.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.bet.count({
                where,
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
    generatePumpOrDumpOutcome(rng, params) {
        const PAYOUT_MULTIPLIER = 1.95;
        const HOUSE_EDGE = 0.0256;
        const pWin = (1 / PAYOUT_MULTIPLIER) * (1 - HOUSE_EDGE);
        const userChoice = params?.choice || params?.prediction || 'pump';
        const userPickedPump = userChoice.toLowerCase() === 'pump';
        const willWin = rng < pWin;
        const outcome = willWin ? userChoice : (userPickedPump ? 'dump' : 'pump');
        const profileSeed = rng * 1000000;
        const profiles = ['spiky', 'meanRevert', 'trendThenSnap', 'chopThenRip'];
        const profile = profiles[Math.floor(profileSeed % profiles.length)];
        const endBps = 25 + (profileSeed % 155);
        return {
            result: willWin ? 'win' : 'lose',
            multiplier: willWin ? PAYOUT_MULTIPLIER : 0,
            outcome: outcome,
            rngTrace: {
                pWin,
                profile,
                endBps,
                userChoice,
                willWin,
                rng
            }
        };
    }
    generateGameOutcome(game, rng, params) {
        switch (game) {
            case 'pump_or_dump':
                return this.generatePumpOrDumpOutcome(rng, params);
            case 'candle_flip':
            case 'bull_vs_bear_battle':
                const bullBearWinChance = 0.44;
                const bullBearWon = rng < bullBearWinChance;
                return {
                    result: bullBearWon ? 'win' : 'lose',
                    multiplier: bullBearWon ? 1.88 : 0,
                };
            case 'support_or_resistance':
                const srWinChance = 0.485;
                const srWon = rng < srWinChance;
                return {
                    result: srWon ? 'win' : 'lose',
                    multiplier: srWon ? 2.02 : 0,
                };
            case 'leverage_ladder':
                const currentLevel = params?.currentLevel || 1;
                const action = params?.action || 'climb';
                if (action === 'climb') {
                    let winChance;
                    if (currentLevel <= 3) {
                        winChance = 0.50;
                    }
                    else if (currentLevel <= 8) {
                        winChance = 0.45;
                    }
                    else if (currentLevel <= 15) {
                        winChance = 0.40;
                    }
                    else if (currentLevel <= 25) {
                        winChance = 0.35;
                    }
                    else if (currentLevel <= 40) {
                        winChance = 0.25;
                    }
                    else if (currentLevel <= 60) {
                        winChance = 0.15;
                    }
                    else {
                        winChance = 0.10;
                    }
                    const ladderWon = rng < winChance;
                    if (ladderWon) {
                        const multiplier = Math.pow(1.2, currentLevel);
                        return {
                            result: 'win',
                            multiplier: multiplier,
                        };
                    }
                    else {
                        return {
                            result: 'lose',
                            multiplier: 0,
                        };
                    }
                }
                return {
                    result: 'lose',
                    multiplier: 0,
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
                const diamondFrontendOutcome = params?.frontendOutcome;
                const diamondFrontendMultiplier = params?.frontendMultiplier || 0;
                if (diamondFrontendOutcome) {
                    return {
                        result: diamondFrontendOutcome,
                        multiplier: diamondFrontendMultiplier,
                    };
                }
                const diamondHandsWinChance = 0.4;
                const diamondHandsWon = rng > diamondHandsWinChance;
                if (diamondHandsWon) {
                    const mineCount = params?.mineCount || 3;
                    const gridSize = params?.gridSize || 25;
                    const safeTiles = gridSize - mineCount;
                    const multiplier = 1.0 + (safeTiles * 0.1);
                    return {
                        result: 'win',
                        multiplier: multiplier,
                    };
                }
                else {
                    return {
                        result: 'lose',
                        multiplier: 0,
                    };
                }
            default:
                throw new common_1.BadRequestException(`Unknown game: ${game}`);
        }
    }
    async getLiveWins(limit = 20) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const wins = await this.prisma.bet.findMany({
            where: {
                outcome: 'win',
                resultMultiplier: { gt: 0 },
                resolvedAt: { gte: twentyFourHoursAgo },
            },
            include: {
                user: {
                    select: {
                        handle: true,
                    },
                },
            },
            orderBy: {
                resolvedAt: 'desc',
            },
            take: limit,
        });
        return {
            wins: wins.map(win => ({
                id: win.id,
                username: win.user.handle,
                game: this.formatGameName(win.game),
                gameSlug: this.getGameSlug(win.game),
                amount: (0, utils_1.fromSmallestUnits)(win.stake, win.currency).toString(),
                multiplier: win.resultMultiplier,
                payout: (0, utils_1.fromSmallestUnits)(BigInt(Math.floor(parseFloat((0, utils_1.fromSmallestUnits)(win.stake, win.currency)) * win.resultMultiplier)), win.currency).toString(),
                currency: win.currency,
                timestamp: win.resolvedAt.toISOString(),
            })),
        };
    }
    formatGameName(game) {
        const gameNames = {
            'pump_or_dump': 'Pump or Dump',
            'candle_flip': 'Candle Flip',
            'support_or_resistance': 'Support or Resistance',
            'bull_vs_bear_battle': 'Bull vs Bear',
            'leverage_ladder': 'Leverage Ladder',
            'stop_loss_roulette': 'Stop Loss Roulette',
            'freeze_the_bag': 'Freeze the Bag',
            'to_the_moon': 'To the Moon',
            'diamond_hands': 'Diamond Hands',
            'crypto_slots': 'Crypto Slots',
        };
        return gameNames[game] || game;
    }
    getGameSlug(game) {
        const gameSlugs = {
            'pump_or_dump': 'pump-or-dump',
            'candle_flip': 'candle-flip',
            'support_or_resistance': 'support-or-resistance',
            'bull_vs_bear_battle': 'bull-vs-bear',
            'leverage_ladder': 'leverage-ladder',
            'stop_loss_roulette': 'bullet-bet',
            'freeze_the_bag': 'freeze-the-bag',
            'to_the_moon': 'to-the-moon',
            'diamond_hands': 'diamond-hands',
            'crypto_slots': 'crypto-slots',
        };
        return gameSlugs[game] || game;
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