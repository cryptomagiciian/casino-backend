import { Test, TestingModule } from '@nestjs/testing';
import { FairnessService } from './fairness.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FairnessService', () => {
  let service: FairnessService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FairnessService,
        {
          provide: PrismaService,
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

    service = module.get<FairnessService>(FairnessService);
    prismaService = module.get<PrismaService>(PrismaService);
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
        game: 'candle_flip' as any,
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
        game: 'candle_flip' as any,
        betId: 'test_bet_id',
      };

      // Mock bet with different server seed hash
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
        id: 'test_bet_id',
        serverSeedHash: 'different_hash',
      } as any);

      const result = await service.verifyFairness(request);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Server seed hash mismatch');
    });
  });
});
