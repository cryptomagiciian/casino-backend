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
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const constants_1 = require("../shared/constants");
const utils_1 = require("../shared/utils");
let GamesService = class GamesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getGames() {
        const games = Object.entries(constants_1.GAME_CONFIGS).map(([id, config]) => ({
            id,
            name: config.name,
            description: config.description,
            houseEdge: config.houseEdgeBps / 100,
            rtp: 100 - (config.houseEdgeBps / 100),
        }));
        return games;
    }
    async getGameConfig(game) {
        const config = constants_1.GAME_CONFIGS[game];
        if (!config) {
            throw new common_1.NotFoundException(`Game ${game} not found`);
        }
        const dbConfig = await this.prisma.gameConfig.findUnique({
            where: { game },
        });
        return {
            ...config,
            houseEdgeBps: dbConfig?.houseEdgeBps || config.houseEdgeBps,
            params: dbConfig?.params || {},
        };
    }
    async previewBet(game, currency, stake, params) {
        const config = await this.getGameConfig(game);
        const stakeSmallest = (0, utils_1.toSmallestUnits)(stake, currency);
        if (stakeSmallest <= 0n) {
            throw new common_1.BadRequestException('Invalid stake amount');
        }
        const { winChance, multiplier } = this.calculateGameOdds(game, config, params);
        const stakeFloat = parseFloat(stake);
        const potentialPayout = stakeFloat * multiplier;
        const potentialPayoutSmallest = (0, utils_1.toSmallestUnits)(potentialPayout.toString(), currency);
        return {
            game,
            currency: currency,
            stake,
            potentialPayout: (0, utils_1.fromSmallestUnits)(potentialPayoutSmallest, currency),
            winChance,
            multiplier,
            houseEdge: config.houseEdgeBps / 100,
        };
    }
    calculateGameOdds(game, config, params) {
        switch (game) {
            case 'candle_flip':
            case 'pump_or_dump':
            case 'bull_vs_bear_battle':
                return {
                    winChance: config.winChance,
                    multiplier: config.multiplier,
                };
            case 'support_or_resistance':
                return {
                    winChance: config.winChance,
                    multiplier: config.multiplier,
                };
            case 'leverage_ladder':
                const targetRung = params?.targetRung || 0;
                const multipliers = config.multipliers;
                const ladderMultiplier = multipliers[targetRung] || 1.0;
                const ladderWinChance = Math.pow(0.9, targetRung + 1);
                return { winChance: ladderWinChance, multiplier: ladderMultiplier };
            case 'stop_loss_roulette':
                const stopLossDistance = params?.stopLossDistance || 0.1;
                const maxMultiplier = config.maxMultiplier;
                const slMultiplier = Math.min(maxMultiplier, 1 + (0.5 / stopLossDistance));
                const slWinChance = 1 / slMultiplier;
                return { winChance: slWinChance, multiplier: slMultiplier };
            case 'freeze_the_bag':
            case 'to_the_moon':
                return {
                    winChance: 0.5,
                    multiplier: 2.0,
                };
            case 'diamond_hands':
                const mines = params?.mines || 3;
                const gridSize = config.gridSize;
                const safeSpots = gridSize - mines;
                const dhWinChance = safeSpots / gridSize;
                const dhMultiplier = 1.0 + (safeSpots * 0.1);
                return { winChance: dhWinChance, multiplier: dhMultiplier };
            default:
                throw new common_1.BadRequestException(`Unknown game: ${game}`);
        }
    }
    async searchGames(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return { results: [] };
        }
        const searchTerm = query.toLowerCase().trim();
        const allGames = Object.entries(constants_1.GAME_CONFIGS);
        const results = allGames
            .filter(([id, config]) => {
            const name = config.name.toLowerCase();
            const description = config.description.toLowerCase();
            const slug = this.getGameSlug(id);
            return (name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                slug.includes(searchTerm) ||
                id.toLowerCase().includes(searchTerm));
        })
            .slice(0, limit)
            .map(([id, config]) => ({
            slug: this.getGameSlug(id),
            name: config.name,
            type: 'prediction',
            description: config.description,
            minBet: '1.00',
            maxBet: '10000.00',
        }));
        return { results };
    }
    getGameSlug(gameId) {
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
        return gameSlugs[gameId] || gameId;
    }
    async updateGameConfig(game, houseEdgeBps, params) {
        return this.prisma.gameConfig.upsert({
            where: { game },
            update: {
                houseEdgeBps: houseEdgeBps || constants_1.DEFAULT_HOUSE_EDGE_BPS,
                params: params || {},
            },
            create: {
                game,
                houseEdgeBps: houseEdgeBps || constants_1.DEFAULT_HOUSE_EDGE_BPS,
                params: params || {},
            },
        });
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamesService);
//# sourceMappingURL=games.service.js.map