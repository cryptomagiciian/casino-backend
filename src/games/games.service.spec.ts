import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GamesService', () => {
  let service: GamesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: {
            gameConfig: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    prismaService = module.get<PrismaService>(PrismaService);
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
      await expect(
        service.previewBet('candle_flip', 'USDC', '0', { prediction: 'red' }),
      ).rejects.toThrow('Invalid stake amount');
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
      await expect(service.getGameConfig('unknown_game' as any)).rejects.toThrow(
        'Game unknown_game not found',
      );
    });
  });
});
