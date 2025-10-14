import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Currency, LEDGER_TYPES, LedgerType } from '../shared/constants';
import { toSmallestUnits, fromSmallestUnits } from '../shared/utils';

export interface LedgerEntryData {
  accountId: string;
  amount: string; // in display units
  currency: Currency;
  type: LedgerType;
  refId?: string;
  meta?: any;
}

export interface LedgerTransactionData {
  userId: string;
  amount: string; // in display units
  currency: Currency;
  type: LedgerType;
  description?: string;
  refId?: string;
  meta?: any;
}

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a single ledger entry (credit or debit)
   */
  async createEntry(data: LedgerEntryData) {
    const amountSmallest = toSmallestUnits(data.amount, data.currency);
    
    return this.prisma.ledgerEntry.create({
      data: {
        accountId: data.accountId,
        amount: amountSmallest,
        currency: data.currency,
        type: data.type,
        refId: data.refId,
        meta: data.meta,
      },
    });
  }

  /**
   * Create a transaction for a user (automatically gets account)
   */
  async createUserTransaction(data: LedgerTransactionData) {
    // Get or create the wallet account
    let account = await this.prisma.walletAccount.findUnique({
      where: {
        userId_currency: {
          userId: data.userId,
          currency: data.currency,
        },
      },
    });

    if (!account) {
      account = await this.prisma.walletAccount.create({
        data: {
          userId: data.userId,
          currency: data.currency,
          available: 0n,
          locked: 0n,
        },
      });
    }

    const amountSmallest = toSmallestUnits(data.amount, data.currency);
    
    // Update wallet balance
    const isCredit = amountSmallest > 0n;
    const updateData = isCredit 
      ? { available: { increment: amountSmallest } }
      : { available: { decrement: -amountSmallest } };

    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: updateData,
    });

    // Create ledger entry
    return this.prisma.ledgerEntry.create({
      data: {
        accountId: account.id,
        amount: amountSmallest,
        currency: data.currency,
        type: data.type,
        refId: data.refId,
        meta: {
          ...data.meta,
          description: data.description,
        },
      },
    });
  }

  /**
   * Create a double-entry transaction (debit + credit)
   */
  async createTransaction(
    debitData: LedgerEntryData,
    creditData: LedgerEntryData,
  ) {
    const debitAmount = toSmallestUnits(debitData.amount, debitData.currency);
    const creditAmount = toSmallestUnits(creditData.amount, creditData.currency);

    // Validate that debit and credit amounts are equal
    if (debitAmount !== creditAmount) {
      throw new BadRequestException('Debit and credit amounts must be equal');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      const debit = await tx.ledgerEntry.create({
        data: {
          accountId: debitData.accountId,
          amount: -debitAmount, // negative for debit
          currency: debitData.currency,
          type: debitData.type,
          refId: debitData.refId,
          meta: debitData.meta,
        },
      });

      const credit = await tx.ledgerEntry.create({
        data: {
          accountId: creditData.accountId,
          amount: creditAmount, // positive for credit
          currency: creditData.currency,
          type: creditData.type,
          refId: creditData.refId,
          meta: creditData.meta,
        },
      });

      return { debit, credit };
    });
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string) {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0n;
  }

  /**
   * Get account balance by currency
   */
  async getAccountBalanceByCurrency(accountId: string, currency: Currency) {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: { 
        accountId,
        currency,
      },
      _sum: { amount: true },
    });

    return result._sum.amount || 0n;
  }

  /**
   * Get ledger entries for an account
   */
  async getAccountEntries(
    accountId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.ledgerEntry.count({
        where: { accountId },
      }),
    ]);

    return {
      entries: entries.map(entry => ({
        ...entry,
        amount: fromSmallestUnits(entry.amount, entry.currency as Currency),
      })),
      total,
    };
  }

  /**
   * Validate account has sufficient balance
   */
  async validateBalance(accountId: string, requiredAmount: string, currency: Currency): Promise<boolean> {
    const balance = await this.getAccountBalanceByCurrency(accountId, currency);
    const requiredSmallest = toSmallestUnits(requiredAmount, currency);
    return balance >= requiredSmallest;
  }

  /**
   * Lock funds for a bet
   */
  async lockFunds(accountId: string, amount: string, currency: Currency, refId: string) {
    const amountSmallest = toSmallestUnits(amount, currency);
    
    // Check if account has sufficient balance
    const hasBalance = await this.validateBalance(accountId, amount, currency);
    if (!hasBalance) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create debit entry to lock funds
    return this.prisma.ledgerEntry.create({
      data: {
        accountId,
        amount: -amountSmallest,
        currency,
        type: LEDGER_TYPES.BET_STAKE,
        refId,
        meta: { locked: true },
      },
    });
  }

  /**
   * Release locked funds (for lost bets or refunds)
   */
  async releaseFunds(accountId: string, amount: string, currency: Currency, refId: string) {
    const amountSmallest = toSmallestUnits(amount, currency);
    
    return this.prisma.ledgerEntry.create({
      data: {
        accountId,
        amount: amountSmallest,
        currency,
        type: LEDGER_TYPES.BET_REFUND,
        refId,
        meta: { released: true },
      },
    });
  }

  /**
   * Credit winnings
   */
  async creditWinnings(accountId: string, amount: string, currency: Currency, refId: string) {
    const amountSmallest = toSmallestUnits(amount, currency);
    
    return this.prisma.ledgerEntry.create({
      data: {
        accountId,
        amount: amountSmallest,
        currency,
        type: LEDGER_TYPES.BET_WIN,
        refId,
        meta: { winnings: true },
      },
    });
  }
}
