"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const fairness_service_1 = require("./fairness.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('FairnessService', () => {
    let service;
    let prismaService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                fairness_service_1.FairnessService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        fairnessSeed: {
                            findFirst: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            updateMany: jest.fn(),
                        },
                        bet: {
                            findUnique: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();
        service = module.get(fairness_service_1.FairnessService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('verifyFairness', () => {
        it('should verify a candle flip bet correctly', async () => {
            const request = {
                serverSeed: 'test_server_seed_123456789012345678901234567890123456789012345678901234567890',
                clientSeed: 'test_client_seed',
                nonce: 1,
                game: 'candle_flip',
                betId: 'test_bet_id',
            };
            const result = await service.verifyFairness(request);
            expect(result.valid).toBe(true);
            expect(result.outcome).toBeDefined();
            expect(result.multiplier).toBeDefined();
            expect(result.rngTrace).toBeDefined();
        });
        it('should handle invalid server seed hash', async () => {
            const request = {
                serverSeed: 'wrong_seed',
                clientSeed: 'test_client_seed',
                nonce: 1,
                game: 'candle_flip',
                betId: 'test_bet_id',
            };
            jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
                id: 'test_bet_id',
                serverSeedHash: 'different_hash',
            });
            const result = await service.verifyFairness(request);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Server seed hash mismatch');
        });
    });
});
//# sourceMappingURL=fairness.service.spec.js.map