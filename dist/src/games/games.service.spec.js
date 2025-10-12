"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const games_service_1 = require("./games.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('GamesService', () => {
    let service;
    let prismaService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                games_service_1.GamesService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        gameConfig: {
                            findUnique: jest.fn(),
                            upsert: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();
        service = module.get(games_service_1.GamesService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getGames', () => {
        it('should return all available games', async () => {
            const games = await service.getGames();
            expect(games).toBeDefined();
            expect(games.length).toBeGreaterThan(0);
            expect(games[0]).toHaveProperty('id');
            expect(games[0]).toHaveProperty('name');
            expect(games[0]).toHaveProperty('description');
            expect(games[0]).toHaveProperty('houseEdge');
            expect(games[0]).toHaveProperty('rtp');
        });
    });
    describe('previewBet', () => {
        it('should preview a candle flip bet correctly', async () => {
            const preview = await service.previewBet('candle_flip', 'USDC', '10.00', {
                prediction: 'red',
            });
            expect(preview).toBeDefined();
            expect(preview.game).toBe('candle_flip');
            expect(preview.currency).toBe('USDC');
            expect(preview.stake).toBe('10.00');
            expect(preview.potentialPayout).toBeDefined();
            expect(preview.winChance).toBeDefined();
            expect(preview.multiplier).toBeDefined();
            expect(preview.houseEdge).toBeDefined();
        });
        it('should throw error for invalid stake amount', async () => {
            await expect(service.previewBet('candle_flip', 'USDC', '0', { prediction: 'red' })).rejects.toThrow('Invalid stake amount');
        });
    });
    describe('getGameConfig', () => {
        it('should return game configuration', async () => {
            jest.spyOn(prismaService.gameConfig, 'findUnique').mockResolvedValue(null);
            const config = await service.getGameConfig('candle_flip');
            expect(config).toBeDefined();
            expect(config.houseEdgeBps).toBeDefined();
            expect(config.params).toBeDefined();
        });
        it('should throw error for unknown game', async () => {
            await expect(service.getGameConfig('unknown_game')).rejects.toThrow('Game unknown_game not found');
        });
    });
});
//# sourceMappingURL=games.service.spec.js.map