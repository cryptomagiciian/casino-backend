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
exports.FairnessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const utils_1 = require("../shared/utils");
let FairnessService = class FairnessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCurrentSeed(userId) {
        const seed = await this.prisma.fairnessSeed.findFirst({
            where: {
                userId,
                active: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!seed) {
            throw new common_1.NotFoundException('No active fairness seed found');
        }
        const nonce = await this.getNextNonce(userId);
        return {
            serverSeedHash: seed.serverSeedHash,
            nonce,
        };
    }
    async rotateSeed(userId) {
        await this.prisma.fairnessSeed.updateMany({
            where: {
                userId,
                active: true,
            },
            data: {
                active: false,
            },
        });
        const serverSeed = this.generateServerSeed();
        const serverSeedHash = await (0, utils_1.sha256)(serverSeed);
        return this.prisma.fairnessSeed.create({
            data: {
                userId,
                serverSeed,
                serverSeedHash,
                active: true,
            },
        });
    }
    async revealSeed(userId, seedId) {
        const seed = await this.prisma.fairnessSeed.findFirst({
            where: {
                id: seedId,
                userId,
            },
        });
        if (!seed) {
            throw new common_1.NotFoundException('Fairness seed not found');
        }
        if (seed.revealedAt) {
            throw new common_1.BadRequestException('Seed already revealed');
        }
        return this.prisma.fairnessSeed.update({
            where: { id: seedId },
            data: {
                revealedAt: new Date(),
            },
        });
    }
    async verifyFairness(request) {
        try {
            const { serverSeed, clientSeed, nonce, game, betId } = request;
            let bet = null;
            if (betId) {
                bet = await this.prisma.bet.findUnique({
                    where: { id: betId },
                });
            }
            const rng = await (0, utils_1.generateRng)(serverSeed, clientSeed, nonce);
            const expectedHash = await (0, utils_1.sha256)(serverSeed);
            const providedHash = bet?.serverSeedHash || '';
            if (bet && expectedHash !== providedHash) {
                return {
                    valid: false,
                    error: 'Server seed hash mismatch',
                };
            }
            const outcome = this.generateGameOutcome(game, rng, bet?.params);
            return {
                valid: true,
                outcome: outcome.result,
                multiplier: outcome.multiplier,
                rngTrace: {
                    serverSeed,
                    clientSeed,
                    nonce,
                    rng,
                    game,
                    outcome,
                },
            };
        }
        catch (error) {
            return {
                valid: false,
                error: error.message,
            };
        }
    }
    async getNextNonce(userId) {
        const lastBet = await this.prisma.bet.findFirst({
            where: { userId },
            orderBy: { nonce: 'desc' },
        });
        return (lastBet?.nonce || 0) + 1;
    }
    generateServerSeed() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    generateGameOutcome(game, rng, params) {
        switch (game) {
            case 'candle_flip':
                return this.generateCandleFlipOutcome(rng, params);
            case 'pump_or_dump':
                return this.generatePumpOrDumpOutcome(rng, params);
            case 'support_or_resistance':
                return this.generateSupportOrResistanceOutcome(rng, params);
            case 'bull_vs_bear_battle':
                return this.generateBullVsBearOutcome(rng, params);
            case 'leverage_ladder':
                return this.generateLeverageLadderOutcome(rng, params);
            case 'stop_loss_roulette':
                return this.generateStopLossRouletteOutcome(rng, params);
            case 'freeze_the_bag':
                return this.generateFreezeTheBagOutcome(rng, params);
            case 'to_the_moon':
                return this.generateToTheMoonOutcome(rng, params);
            case 'diamond_hands':
                return this.generateDiamondHandsOutcome(rng, params);
            default:
                throw new common_1.BadRequestException(`Unknown game: ${game}`);
        }
    }
    generateCandleFlipOutcome(rng, params) {
        const winChance = 0.495;
        const won = rng < winChance;
        const multiplier = won ? 1.98 : 0;
        return {
            result: won ? 'win' : 'lose',
            multiplier,
            details: {
                rng,
                winChance,
                prediction: params?.prediction,
            },
        };
    }
    generatePumpOrDumpOutcome(rng, params) {
        const winChance = 0.495;
        const won = rng < winChance;
        const multiplier = won ? 1.98 : 0;
        return {
            result: won ? 'win' : 'lose',
            multiplier,
            details: {
                rng,
                winChance,
                prediction: params?.prediction,
            },
        };
    }
    generateSupportOrResistanceOutcome(rng, params) {
        const winChance = 0.485;
        const won = rng < winChance;
        const multiplier = won ? 2.02 : 0;
        return {
            result: won ? 'win' : 'lose',
            multiplier,
            details: {
                rng,
                winChance,
                prediction: params?.prediction,
                level: params?.level,
            },
        };
    }
    generateBullVsBearOutcome(rng, params) {
        const winChance = 0.49;
        const won = rng < winChance;
        const multiplier = won ? 2.0 : 0;
        return {
            result: won ? 'win' : 'lose',
            multiplier,
            details: {
                rng,
                winChance,
                prediction: params?.prediction,
            },
        };
    }
    generateLeverageLadderOutcome(rng, params) {
        const targetRung = params?.targetRung || 0;
        const multipliers = [1.3, 1.69, 2.19, 2.85, 3.7, 4.8];
        let currentRung = 0;
        let busted = false;
        for (let i = 0; i <= targetRung; i++) {
            const stepRng = (rng * (i + 1)) % 1;
            if (stepRng < 0.1) {
                busted = true;
                break;
            }
            currentRung = i;
        }
        const multiplier = busted ? 0 : multipliers[currentRung];
        return {
            result: busted ? 'lose' : 'win',
            multiplier,
            details: {
                rng,
                targetRung,
                achievedRung: currentRung,
                busted,
            },
        };
    }
    generateStopLossRouletteOutcome(rng, params) {
        const stopLossDistance = params?.stopLossDistance || 0.1;
        const maxMultiplier = 4.0;
        const multiplier = Math.min(maxMultiplier, 1 + (0.5 / stopLossDistance));
        const winChance = 1 / multiplier;
        const won = rng < winChance;
        const finalMultiplier = won ? multiplier : 0;
        return {
            result: won ? 'win' : 'lose',
            multiplier: finalMultiplier,
            details: {
                rng,
                stopLossDistance,
                winChance,
                maxMultiplier,
            },
        };
    }
    generateFreezeTheBagOutcome(rng, params) {
        const crashProbability = 0.01;
        let multiplier = 1.0;
        let crashed = false;
        while (!crashed && multiplier < 100) {
            const stepRng = (rng * multiplier) % 1;
            if (stepRng < crashProbability) {
                crashed = true;
                break;
            }
            multiplier += 0.01;
        }
        return {
            result: crashed ? 'crash' : 'continue',
            multiplier: crashed ? 0 : multiplier,
            details: {
                rng,
                crashProbability,
                crashPoint: crashed ? multiplier : null,
            },
        };
    }
    generateToTheMoonOutcome(rng, params) {
        const crashProbability = 0.01;
        let multiplier = 1.0;
        let crashed = false;
        while (!crashed && multiplier < 1000) {
            const stepRng = (rng * multiplier) % 1;
            if (stepRng < crashProbability) {
                crashed = true;
                break;
            }
            multiplier += 0.01;
        }
        return {
            result: crashed ? 'crash' : 'continue',
            multiplier: crashed ? 0 : multiplier,
            details: {
                rng,
                crashProbability,
                crashPoint: crashed ? multiplier : null,
            },
        };
    }
    generateDiamondHandsOutcome(rng, params) {
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
        let multiplier = 1.0;
        let hitMine = false;
        for (const pick of picks) {
            if (minePositions.includes(pick)) {
                hitMine = true;
                break;
            }
            multiplier += 0.1;
        }
        return {
            result: hitMine ? 'lose' : 'win',
            multiplier: hitMine ? 0 : multiplier,
            details: {
                rng,
                mines,
                minePositions,
                picks,
                hitMine,
            },
        };
    }
};
exports.FairnessService = FairnessService;
exports.FairnessService = FairnessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FairnessService);
//# sourceMappingURL=fairness.service.js.map