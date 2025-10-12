import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Currency, CURRENCIES, FAUCET_DAILY_LIMITS } from '../shared/constants';
import { WalletBalance, FaucetRequest } from '../shared/types';
import { fromSmallestUnits, toSmallestUnits, isDemoMode } from '../shared/utils';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

  /**
   * Get or create wallet account for user and currency
   */
  async getOrCreateAccount(userId: string, currency: Currency) {
    let account = await this.prisma.walletAccount.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (!account) {
      account = await this.prisma.walletAccount.create({
        data: {
          userId,
          currency,
          available: 0n,
          locked: 0n,
        },
      });
    }

    return account;
  }

  /**
   * Get all wallet balances for a user
   */
  async getWalletBalances(userId: string): Promise<WalletBalance[]> {
    const accounts = await this.prisma.walletAccount.findMany({
      where: { userId },
    });

    const balances: WalletBalance[] = [];

    for (const currency of Object.values(CURRENCIES)) {
      const account = accounts.find(acc => acc.currency === currency);
      const available = account ? await this.ledgerService.getAccountBalanceByCurrency(account.id, currency) : 0n;
      const locked = account ? account.locked : 0n;
      const total = available + locked;

      balances.push({
        currency,
        available: fromSmallestUnits(available, currency),
        locked: fromSmallestUnits(locked, currency),
        total: fromSmallestUnits(total, currency),
      });
    }

    return balances;
  }

  /**
   * Get balance for specific currency
   */
  async getBalance(userId: string, currency: Currency): Promise<WalletBalance> {
    const account = await this.getOrCreateAccount(userId, currency);
    const available = await this.ledgerService.getAccountBalanceByCurrency(account.id, currency);
    const locked = account.locked;
    const total = available + locked;

    return {
      currency,
      available: fromSmallestUnits(available, currency),
      locked: fromSmallestUnits(locked, currency),
      total: fromSmallestUnits(total, currency),
    };
  }

  /**
   * Faucet functionality for demo mode
   */
  async faucet(userId: string, request: FaucetRequest) {
    if (!isDemoMode()) {
      throw new BadRequestException('Faucet is only available in demo mode');
    }

    const { currency, amount } = request;
    const amountSmallest = toSmallestUnits(amount, currency);

    // Check daily limit
    const dailyLimit = BigInt(FAUCET_DAILY_LIMITS[currency]);
    if (amountSmallest > dailyLimit) {
      throw new BadRequestException(`Amount exceeds daily faucet limit for ${currency}`);
    }

    // Check if user has already used faucet today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayFaucetUsage = await this.prisma.ledgerEntry.aggregate({
      where: {
        account: {
          userId,
          currency,
        },
        type: 'FAUCET',
        createdAt: {
          gte: today,
        },
      },
      _sum: { amount: true },
    });

    const usedToday = todayFaucetUsage._sum.amount || 0n;
    if (usedToday + amountSmallest > dailyLimit) {
      throw new BadRequestException(`Daily faucet limit exceeded for ${currency}`);
    }

    // Get or create account
    const account = await this.getOrCreateAccount(userId, currency);

    // Credit faucet amount
    await this.ledgerService.createEntry({
      accountId: account.id,
      amount,
      currency,
      type: 'FAUCET',
      meta: { faucet: true, dailyLimit: dailyLimit.toString() },
    });

    return {
      currency,
      amount,
      message: `Successfully credited ${amount} ${currency} from faucet`,
    };
  }

  /**
   * Lock funds for betting
   */
  async lockFunds(userId: string, currency: Currency, amount: string, refId: string) {
    const account = await this.getOrCreateAccount(userId, currency);
    
    // Lock funds in ledger
    await this.ledgerService.lockFunds(account.id, amount, currency, refId);
    
    // Update locked amount in account
    const amountSmallest = toSmallestUnits(amount, currency);
    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: {
        locked: {
          increment: amountSmallest,
        },
      },
    });

    return { success: true };
  }

  /**
   * Release locked funds
   */
  async releaseFunds(userId: string, currency: Currency, amount: string, refId: string) {
    const account = await this.getOrCreateAccount(userId, currency);
    
    // Release funds in ledger
    await this.ledgerService.releaseFunds(account.id, amount, currency, refId);
    
    // Update locked amount in account
    const amountSmallest = toSmallestUnits(amount, currency);
    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: {
        locked: {
          decrement: amountSmallest,
        },
      },
    });

    return { success: true };
  }

  /**
   * Credit winnings
   */
  async creditWinnings(userId: string, currency: Currency, amount: string, refId: string) {
    const account = await this.getOrCreateAccount(userId, currency);
    
    // Credit winnings in ledger
    await this.ledgerService.creditWinnings(account.id, amount, currency, refId);
    
    return { success: true };
  }

  /**
   * Get ledger entries for a user's wallet
   */
  async getLedgerEntries(
    userId: string,
    currency: Currency,
    limit: number = 50,
    offset: number = 0,
  ) {
    const account = await this.getOrCreateAccount(userId, currency);
    return this.ledgerService.getAccountEntries(account.id, limit, offset);
  }
}
