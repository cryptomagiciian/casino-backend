import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { FairnessService } from '../fairness/fairness.service';
import { GamesService } from '../games/games.service';
import { PricesService } from '../prices/prices.service';
import { BetPreview, BetPlaceRequest, BetResult } from '../shared/types';
import { Currency, Game } from '../shared/constants';
import { generateClientSeed, generateRng, toSmallestUnits, fromSmallestUnits } from '../shared/utils';
import { BetFiltersDto } from './dto/bet-filters.dto';

@Injectable()
export class BetsService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
    private fairnessService: FairnessService,
    private gamesService: GamesService,
    private pricesService: PricesService,
  ) {}

  /**
   * Preview a bet
   */
  async previewBet(request: BetPlaceRequest): Promise<BetPreview> {
    return this.gamesService.previewBet(
      request.game,
      request.currency,
      request.stake,
      request.params,
    );
  }

  /**
   * Place a bet
   */
  async placeBet(userId: string, request: BetPlaceRequest) {
    const { game, currency, stake, clientSeed, params } = request;

    // Handle USD currency conversion first
    let actualCurrency = currency;
    let actualStake = stake;
    
    if ((currency as string) === 'USD') {
      // Get the user's display currency from params
      const displayCurrency = params?.displayCurrency || 'USDC';
      actualCurrency = displayCurrency;
      
      // Convert USD stake to crypto amount using real-time prices
      const usdStakeFloat = parseFloat(stake);
      let cryptoStakeFloat = usdStakeFloat;
      
      try {
        // Get real-time prices from PricesService
        const prices = await this.pricesService.getCryptoPrices();
        console.log(`💰 PricesService response:`, prices);
        
        const rate = prices[displayCurrency] || 1;
        console.log(`💰 Rate for ${displayCurrency}: ${rate} (type: ${typeof rate})`);
        
        if (isNaN(rate) || rate <= 0) {
          throw new Error(`Invalid rate for ${displayCurrency}: ${rate}`);
        }
        
        cryptoStakeFloat = usdStakeFloat / rate;
        actualStake = cryptoStakeFloat.toString();
        
        console.log(`💰 USD Conversion (Real-time): $${usdStakeFloat} USD → ${cryptoStakeFloat} ${displayCurrency}`);
        console.log(`💰 Real-time rate: ${rate}, Crypto stake: ${cryptoStakeFloat}`);
      } catch (error) {
        console.warn('⚠️ Failed to fetch real-time prices, using fallback rates:', error.message);
        
        // Fallback to static rates if real-time prices fail
        const fallbackRates = {
          'BTC': 45000, // $45,000 per BTC
          'ETH': 2500,  // $2,500 per ETH
          'SOL': 100,   // $100 per SOL
          'USDC': 1,    // $1 per USDC
          'USDT': 1,    // $1 per USDT
        };
        
        const rate = fallbackRates[displayCurrency] || 1;
        cryptoStakeFloat = usdStakeFloat / rate;
        actualStake = cryptoStakeFloat.toString();
        
        console.log(`💰 USD Conversion (Fallback): $${usdStakeFloat} USD → ${cryptoStakeFloat} ${displayCurrency}`);
        console.log(`💰 Fallback rate: ${rate}, Crypto stake: ${cryptoStakeFloat}`);
      }
    }

    // Preview bet to validate (using converted currency and stake)
    console.log(`💰 Preview bet params:`, {
      originalCurrency: currency,
      originalStake: stake,
      actualCurrency,
      actualStake,
      displayCurrency: params?.displayCurrency
    });
    
    const preview = await this.previewBet({
      ...request,
      currency: actualCurrency,
      stake: actualStake,
    });

    // Get current fairness seed
    const fairnessSeed = await this.fairnessService.getCurrentSeed(userId);

    // Use provided client seed or generate one
    const finalClientSeed = clientSeed || generateClientSeed();

    // Extract network from params, default to mainnet
    const network = params?.network || 'mainnet';
    
    // Check if user has funds in testnet first, then mainnet
    let actualNetwork = network;
    if (network === 'mainnet') {
      try {
        const testnetBalance = await this.walletsService.getWalletBalance(userId, actualCurrency, 'testnet');
        if (parseFloat(testnetBalance.available) > 0) {
          actualNetwork = 'testnet';
          console.log(`🎯 Bet service: User has testnet funds, using testnet for bet placement`);
        }
      } catch (error) {
        console.log(`🎯 Bet service: No testnet funds, using mainnet`);
      }
    }
    
    // Check available balance before attempting to lock funds
    const balance = await this.walletsService.getWalletBalance(userId, actualCurrency, actualNetwork);
    const stakeFloat = parseFloat(actualStake);
    const availableFloat = parseFloat(balance.available);
    
    console.log(`💰 Balance check: Available ${availableFloat} ${actualCurrency}, Required ${stakeFloat} ${actualCurrency}`);
    console.log(`💰 Balance details:`, {
      userId,
      currency: actualCurrency,
      network: actualNetwork,
      balance: balance,
      stakeFloat,
      availableFloat,
      comparison: availableFloat >= stakeFloat ? 'SUFFICIENT' : 'INSUFFICIENT'
    });
    
    if (availableFloat < stakeFloat) {
      throw new BadRequestException(`Insufficient balance. Available: ${availableFloat} ${actualCurrency}, Required: ${stakeFloat} ${actualCurrency}`);
    }
    
    // Lock funds using the correct network and currency
    await this.walletsService.lockFunds(userId, actualCurrency, actualStake, 'bet_placement', actualNetwork);

    // Create bet record
    const bet = await this.prisma.bet.create({
      data: {
        userId,
        game,
        currency: actualCurrency as Currency,
        stake: toSmallestUnits(actualStake, actualCurrency as Currency),
        potentialPayout: toSmallestUnits(preview.potentialPayout, actualCurrency as Currency),
        serverSeedHash: fairnessSeed.serverSeedHash,
        clientSeed: finalClientSeed,
        nonce: fairnessSeed.nonce,
        params: {
          ...params,
          originalCurrency: currency, // Store original currency (USD)
          originalStake: stake, // Store original stake amount
        },
        status: 'PENDING',
      },
    });

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: currency as Currency, // Return original currency (USD) for display
      stake, // Return original stake for display
      potentialPayout: preview.potentialPayout,
      clientSeed: finalClientSeed,
      serverSeedHash: fairnessSeed.serverSeedHash,
      nonce: fairnessSeed.nonce,
      status: 'PENDING',
    };
  }

  /**
   * Resolve a bet
   */
  async resolveBet(betId: string, resolveParams?: any) {
    try {
      const bet = await this.prisma.bet.findUnique({
        where: { id: betId },
      });

      if (!bet) {
        throw new NotFoundException('Bet not found');
      }

      if (bet.status !== 'PENDING') {
        throw new BadRequestException('Bet already resolved');
      }

      // Get the server seed for this bet
      const fairnessSeed = await this.prisma.fairnessSeed.findFirst({
        where: {
          userId: bet.userId,
          serverSeedHash: bet.serverSeedHash,
        },
      });

      if (!fairnessSeed) {
        console.error(`Fairness seed not found for bet ${betId}, user ${bet.userId}`);
        throw new NotFoundException('Fairness seed not found');
      }

      // Generate RNG
      const rng = await generateRng(fairnessSeed.serverSeed, bet.clientSeed, bet.nonce);

      // Generate game outcome
      const mergedParams = { ...(bet.params as any || {}), ...(resolveParams || {}) };
      console.log(`🎲 RESOLVE DEBUG: Bet ${betId}, Game: ${bet.game}`);
      console.log(`🎲 RESOLVE DEBUG: Original bet.params:`, bet.params);
      console.log(`🎲 RESOLVE DEBUG: resolveParams:`, resolveParams);
      console.log(`🎲 RESOLVE DEBUG: Merged params:`, mergedParams);
      const outcome = this.generateGameOutcome(bet.game as Game, rng, mergedParams);

      if (!outcome || typeof outcome.multiplier === 'undefined') {
        console.error(`Invalid game outcome for game ${bet.game}:`, outcome);
        throw new BadRequestException('Failed to generate game outcome');
      }

      // Calculate payout
      const stakeFloat = parseFloat(fromSmallestUnits(bet.stake, bet.currency as Currency));
      const payout = stakeFloat * outcome.multiplier;
      const payoutSmallest = toSmallestUnits(payout.toString(), bet.currency as Currency);

      // Update bet with outcome
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
            ...((outcome as any).rngTrace || {}), // Include pump_or_dump specific trace data
          },
          resolvedAt: new Date(),
        },
      });

      // Extract network from bet params, default to mainnet
      const network = (bet.params as any)?.network || 'mainnet';

      // Handle funds
      if (outcome.multiplier > 0) {
        // WIN: Credit winnings AND release locked funds
        await this.walletsService.creditWinnings(
          bet.userId,
          bet.currency as Currency,
          payout.toString(),
          betId,
          network,
        );
        
        // Release locked funds back to available balance
        await this.walletsService.releaseFunds(
          bet.userId,
          bet.currency as Currency,
          fromSmallestUnits(bet.stake, bet.currency as Currency),
          betId,
          network,
        );
      } else {
        // LOSS: Process bet loss - funds are lost, not returned
        await this.walletsService.processBetLoss(
          bet.userId,
          bet.currency as Currency,
          fromSmallestUnits(bet.stake, bet.currency as Currency),
          betId,
          network,
        );
      }

      return {
        id: bet.id,
        game: bet.game as Game,
        currency: bet.currency as Currency,
        stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
        outcome: outcome.result,
        resultMultiplier: outcome.multiplier,
        payout: payout.toString(),
        status: outcome.multiplier > 0 ? 'WON' : 'LOST',
        rngTrace: updatedBet.rngTrace,
      };
    } catch (error) {
      console.error(`Error resolving bet ${betId}:`, error);
      throw error;
    }
  }

  /**
   * Cash out a bet (for crash games)
   */
  async cashoutBet(betId: string, cashoutMultiplier?: number) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== 'PENDING') {
      throw new BadRequestException('Bet already resolved');
    }

    // Games that support cashout
    const cashoutGames = ['freeze_the_bag', 'to_the_moon', 'leverage_ladder'];
    if (!cashoutGames.includes(bet.game)) {
      throw new BadRequestException('This game does not support cashout');
    }

    // Use provided multiplier or default to 1.0 (return stake)
    const actualMultiplier = cashoutMultiplier || 1.0;
    
    // Minimum multiplier of 1.0 (can't cash out for less than stake)
    const finalMultiplier = Math.max(1.0, actualMultiplier);
    
    const stakeFloat = parseFloat(fromSmallestUnits(bet.stake, bet.currency as Currency));
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

    // Extract network from bet params, default to mainnet
    const network = (bet.params as any)?.network || 'mainnet';

    // Credit winnings
    await this.walletsService.creditWinnings(
      bet.userId,
      bet.currency as Currency,
      payout.toString(),
      betId,
      network,
    );

    // Release locked funds
    await this.walletsService.releaseFunds(
      bet.userId,
      bet.currency as Currency,
      fromSmallestUnits(bet.stake, bet.currency as Currency),
      betId,
      network,
    );

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: bet.currency as Currency,
      stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
      outcome: 'cashed_out',
      resultMultiplier: finalMultiplier,
      payout: payout.toString(),
      status: 'CASHED_OUT',
    };
  }

  /**
   * Get bet details
   */
  async getBet(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: bet.currency as Currency,
      stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
      potentialPayout: fromSmallestUnits(bet.potentialPayout, bet.currency as Currency),
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

  /**
   * Get user's bets
   */
  async getUserBets(userId: string, limit: number = 50, offset: number = 0) {
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
        game: bet.game as Game,
        currency: bet.currency as Currency,
        stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
        potentialPayout: fromSmallestUnits(bet.potentialPayout, bet.currency as Currency),
        outcome: bet.outcome,
        resultMultiplier: bet.resultMultiplier,
        status: bet.status,
        createdAt: bet.createdAt,
        resolvedAt: bet.resolvedAt,
      })),
      total,
    };
  }

  /**
   * Get user bets with filters
   */
  async getUserBetsWithFilters(userId: string, filters: BetFiltersDto) {
    const where: any = { userId };

    // Apply filters
    if (filters.game) {
      where.game = filters.game;
    }

    if (filters.status) {
      if (filters.status === 'won') {
        where.outcome = 'win';
        where.resultMultiplier = { gt: 0 };
      } else if (filters.status === 'lost') {
        where.outcome = 'lose';
        where.resultMultiplier = 0;
      } else if (filters.status === 'pending') {
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
        game: bet.game as Game,
        currency: bet.currency as Currency,
        stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
        potentialPayout: fromSmallestUnits(bet.potentialPayout, bet.currency as Currency),
        outcome: bet.outcome,
        resultMultiplier: bet.resultMultiplier,
        status: bet.status,
        createdAt: bet.createdAt,
        resolvedAt: bet.resolvedAt,
      })),
      total,
    };
  }

  /**
   * Generate Pump or Dump outcome with configurable house edge
   */
  private generatePumpOrDumpOutcome(rng: number, params?: any) {
    // Configurable house edge (2-3.5%)
    const PAYOUT_MULTIPLIER = 1.95; // Default payout
    const HOUSE_EDGE = 0.0256; // 2.56% house edge
    
    // Calculate win probability: pWin = (1 / payout) * (1 - houseEdge)
    const pWin = (1 / PAYOUT_MULTIPLIER) * (1 - HOUSE_EDGE); // ≈ 0.487
    
    const userChoice = params?.choice || params?.prediction || 'pump';
    const userPickedPump = userChoice.toLowerCase() === 'pump';
    
    // Determine if user wins
    const willWin = rng < pWin;
    
    // Outcome: if user wins, they get their choice; if they lose, they get the opposite
    const outcome = willWin ? userChoice : (userPickedPump ? 'dump' : 'pump');
    
    // Generate volatility profile and end magnitude for path simulation
    const profileSeed = rng * 1000000; // Use rng to seed profile generation
    const profiles = ['spiky', 'meanRevert', 'trendThenSnap', 'chopThenRip'];
    const profile = profiles[Math.floor(profileSeed % profiles.length)];
    
    // End magnitude: 25-180 basis points (0.25% - 1.8%)
    const endBps = 25 + (profileSeed % 155); // 25-180 bps
    
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

  /**
   * Generate game outcome based on RNG
   */
  private generateGameOutcome(game: Game, rng: number, params?: any) {
    // This is a simplified version - the full implementation would be in the fairness service
    switch (game) {
      case 'pump_or_dump':
        return this.generatePumpOrDumpOutcome(rng, params);
      
      case 'candle_flip':
      case 'bull_vs_bear_battle':
        // HOUSE EDGE: 44% win chance × 1.88× payout = ~17% house edge
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
        // ADDICTIVE DESIGN: High win rate early, massive multipliers, but house always wins
        const currentLevel = params?.currentLevel || 1;
        const action = params?.action || 'climb';
        
        if (action === 'climb') {
          // BALANCED ADDICTION CURVE - No easy farming, but still tempting:
          // Levels 1-3: 50% win rate (fair start, no easy wins)
          // Levels 4-8: 45% win rate (getting harder)
          // Levels 9-15: 40% win rate (risky but multipliers are tempting)
          // Levels 16-25: 35% win rate (getting dangerous)
          // Levels 26-40: 25% win rate (rare but life-changing)
          // Levels 41-60: 15% win rate (legendary territory)
          // Levels 61+: 10% win rate (god mode)
          
          let winChance;
          if (currentLevel <= 3) {
            winChance = 0.50; // 50% win rate - fair start, no easy farming
          } else if (currentLevel <= 8) {
            winChance = 0.45; // 45% win rate - getting harder
          } else if (currentLevel <= 15) {
            winChance = 0.40; // 40% win rate - risky but tempting
          } else if (currentLevel <= 25) {
            winChance = 0.35; // 35% win rate - getting dangerous
          } else if (currentLevel <= 40) {
            winChance = 0.25; // 25% win rate - rare but possible
          } else if (currentLevel <= 60) {
            winChance = 0.15; // 15% win rate - legendary territory
          } else {
            winChance = 0.10; // 10% win rate - god mode
          }
          
          const ladderWon = rng < winChance;
          
          if (ladderWon) {
            // MASSIVE MULTIPLIER CURVE - make them dream big
            // Level 1: 1.2×, Level 5: 2.5×, Level 10: 6×, Level 20: 37×, Level 30: 230×, Level 50: 8,900×
            const multiplier = Math.pow(1.2, currentLevel);
            return {
              result: 'win',
              multiplier: multiplier,
            };
          } else {
            // Liquidation - but they'll want to try again
            return {
              result: 'lose',
              multiplier: 0,
            };
          }
        }
        
        // Fallback for other actions
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
        // Simulate crash point
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
        // CRITICAL FIX: Use frontend-determined outcome to prevent casino losses
        // The frontend has the actual game state and mine positions
        const diamondFrontendOutcome = params?.frontendOutcome;
        const diamondFrontendMultiplier = params?.frontendMultiplier || 0;
        
        if (diamondFrontendOutcome) {
          // Trust the frontend outcome (it has the actual game state)
          return {
            result: diamondFrontendOutcome,
            multiplier: diamondFrontendMultiplier,
          };
        }
        
        // Fallback: Use RNG with house edge (40% win chance)
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
        } else {
          return {
            result: 'lose',
            multiplier: 0,
          };
        }

      default:
        throw new BadRequestException(`Unknown game: ${game}`);
    }
  }

  /**
   * Get recent wins across all users for live wins feed
   */
  async getLiveWins(limit: number = 20) {
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
        amount: fromSmallestUnits(win.stake, win.currency as Currency).toString(),
        multiplier: win.resultMultiplier,
        payout: fromSmallestUnits(
          BigInt(Math.floor(parseFloat(fromSmallestUnits(win.stake, win.currency as Currency)) * win.resultMultiplier)),
          win.currency as Currency
        ).toString(),
        currency: win.currency,
        timestamp: win.resolvedAt.toISOString(),
      })),
    };
  }

  private formatGameName(game: string): string {
    const gameNames: Record<string, string> = {
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

  private getGameSlug(game: string): string {
    const gameSlugs: Record<string, string> = {
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
}
