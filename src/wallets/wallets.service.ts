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
   * Get or create wallet account for user, currency, and network
   */
  async getOrCreateAccount(userId: string, currency: Currency, network: 'mainnet' | 'testnet' = 'mainnet') {
    let account = await this.prisma.walletAccount.findUnique({
      where: {
        userId_currency_network: {
          userId,
          currency,
          network,
        },
      },
    });

    if (!account) {
      account = await this.prisma.walletAccount.create({
        data: {
          userId,
          currency,
          network,
          available: 0n,
          locked: 0n,
        },
      });
    }

    return account;
  }

  /**
   * Get wallet balance for a specific currency and network
   */
  async getWalletBalance(userId: string, currency: Currency, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<WalletBalance> {
    const account = await this.getOrCreateAccount(userId, currency, network);
    
    return {
      currency,
      available: fromSmallestUnits(account.available, currency),
      locked: fromSmallestUnits(account.locked, currency),
      total: fromSmallestUnits(account.available + account.locked, currency),
    };
  }

  /**
   * Get all wallet balances for a user on a specific network
   */
  async getWalletBalances(userId: string, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<WalletBalance[]> {
    const accounts = await this.prisma.walletAccount.findMany({
      where: { userId, network },
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
   * Get balance for specific currency and network
   */
  async getBalance(userId: string, currency: Currency, network: 'mainnet' | 'testnet' = 'mainnet'): Promise<WalletBalance> {
    const account = await this.getOrCreateAccount(userId, currency, network);
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
   * Get testnet faucet for demo mode (testnet only)
   */
  async getTestnetFaucet(userId: string, currency: Currency, network: 'testnet' = 'testnet') {
    if (network !== 'testnet') {
      throw new BadRequestException('Faucet is only available on testnet');
    }

    // Small testnet amounts for testing
    const testnetAmounts = {
      BTC: 0.001,
      ETH: 0.01,
      SOL: 0.1,
      USDC: 10,
      USDT: 10,
    };

    const amount = testnetAmounts[currency];
    const amountSmallest = toSmallestUnits(amount, currency);

    // Get or create testnet account
    const account = await this.getOrCreateAccount(userId, currency, 'testnet');

    // Credit testnet faucet amount
    await this.ledgerService.createUserTransaction({
      userId,
      amount,
      currency,
      type: 'FAUCET',
      network: 'testnet',
      description: `Testnet faucet: ${amount} ${currency}`,
      meta: { faucet: true, network: 'testnet', testnet: true },
    });

    return {
      currency,
      amount,
      network: 'testnet',
      message: `Successfully credited ${amount} ${currency} from testnet faucet`,
    };
  }

  /**
   * Lock funds for betting
   */
  async lockFunds(userId: string, currency: Currency, amount: string, refId: string, network: 'mainnet' | 'testnet' = 'mainnet') {
    const account = await this.getOrCreateAccount(userId, currency, network);
    
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
  async releaseFunds(userId: string, currency: Currency, amount: string, refId: string, network: 'mainnet' | 'testnet' = 'mainnet') {
    const account = await this.getOrCreateAccount(userId, currency, network);
    
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
  async creditWinnings(userId: string, currency: Currency, amount: string, refId: string, network: 'mainnet' | 'testnet' = 'mainnet') {
    const account = await this.getOrCreateAccount(userId, currency, network);
    
    // Credit winnings in ledger
    await this.ledgerService.creditWinnings(account.id, amount, currency, refId);
    
    return { success: true };
  }

  /**
   * Get detailed wallet balances with USD values
   */
  async getDetailedWalletBalances(userId: string, network: 'mainnet' | 'testnet' = 'mainnet') {
    const balances = await this.getWalletBalances(userId, network);
    
    // For now, we'll use simple USD conversion rates
    // In a real implementation, you'd fetch these from a price API
    const usdRates: Record<Currency, number> = {
      BTC: 45000,
      ETH: 2500,
      SOL: 100,
      USDC: 1,
      USDT: 1,
    };

    const detailedBalances = balances.map(balance => {
      const balanceFloat = parseFloat(balance.available);
      const usdValue = balanceFloat * (usdRates[balance.currency] || 1);
      
      return {
        currency: balance.currency,
        available: balance.available,
        locked: balance.locked,
        total: balance.total,
        usdValue: usdValue.toFixed(2),
      };
    });

    const totalUsdValue = detailedBalances.reduce((sum, balance) => {
      return sum + parseFloat(balance.usdValue);
    }, 0);

    return {
      balances: detailedBalances,
      totalUsdValue: totalUsdValue.toFixed(2),
    };
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
