import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Currency, LEDGER_TYPES } from '../shared/constants';
import { WithdrawalRequest } from '../shared/types';
import { toSmallestUnits, fromSmallestUnits, isDemoMode } from '../shared/utils';

@Injectable()
export class WithdrawalsService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

  /**
   * Create a withdrawal request
   */
  async createWithdrawal(userId: string, request: WithdrawalRequest) {
    const { currency, amount, address } = request;
    const amountSmallest = toSmallestUnits(amount, currency);

    // In demo mode, always reject withdrawals
    if (isDemoMode()) {
      const withdrawal = await this.prisma.withdrawal.create({
        data: {
          userId,
          currency,
          amount: amountSmallest,
          address,
          status: 'REJECTED',
          reviewNeeded: false,
          meta: {
            reason: 'Demo mode - withdrawals not allowed',
            createdAt: new Date().toISOString(),
          },
        },
      });

      return {
        ...withdrawal,
        amount: fromSmallestUnits(withdrawal.amount, currency),
        message: 'Withdrawals are not allowed in demo mode',
      };
    }

    // Check if user has sufficient balance
    const account = await this.prisma.walletAccount.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (!account) {
      throw new BadRequestException('No wallet account found for this currency');
    }

    const balance = await this.ledgerService.getAccountBalanceByCurrency(account.id, currency);
    if (balance < amountSmallest) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create withdrawal request
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        currency,
        amount: amountSmallest,
        address,
        status: 'PENDING',
        reviewNeeded: true, // All withdrawals require review in demo
        meta: {
          createdAt: new Date().toISOString(),
        },
      },
    });

    return {
      ...withdrawal,
      amount: fromSmallestUnits(withdrawal.amount, currency),
      message: 'Withdrawal request submitted for review',
    };
  }

  /**
   * Process withdrawal (admin only)
   */
  async processWithdrawal(withdrawalId: string, action: 'approve' | 'reject', txHash?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal already processed');
    }

    if (action === 'approve') {
      // Debit user balance
      const account = await this.prisma.walletAccount.findUnique({
        where: {
          userId_currency: {
            userId: withdrawal.userId,
            currency: withdrawal.currency,
          },
        },
      });

      if (account) {
        await this.ledgerService.createEntry({
          accountId: account.id,
          amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
          currency: withdrawal.currency as Currency,
          type: LEDGER_TYPES.WITHDRAWAL,
          refId: withdrawal.id,
          meta: {
            address: withdrawal.address,
            txHash,
            processed: true,
          },
        });
      }

      return this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'COMPLETED',
          txHash,
          processedAt: new Date(),
        },
      });
    } else {
      return this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
        },
      });
    }
  }

  /**
   * Get user withdrawals
   */
  async getUserWithdrawals(userId: string, limit: number = 50, offset: number = 0) {
    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.withdrawal.count({
        where: { userId },
      }),
    ]);

    return {
      withdrawals: withdrawals.map(withdrawal => ({
        id: withdrawal.id,
        currency: withdrawal.currency,
        amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
        address: withdrawal.address,
        status: withdrawal.status,
        reviewNeeded: withdrawal.reviewNeeded,
        txHash: withdrawal.txHash,
        createdAt: withdrawal.createdAt,
        processedAt: withdrawal.processedAt,
      })),
      total,
    };
  }

  /**
   * Get pending withdrawals (admin only)
   */
  async getPendingWithdrawals(limit: number = 50, offset: number = 0) {
    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.withdrawal.count({
        where: { status: 'PENDING' },
      }),
    ]);

    return {
      withdrawals: withdrawals.map(withdrawal => ({
        id: withdrawal.id,
        userId: withdrawal.userId,
        user: withdrawal.user,
        currency: withdrawal.currency,
        amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
        address: withdrawal.address,
        status: withdrawal.status,
        reviewNeeded: withdrawal.reviewNeeded,
        createdAt: withdrawal.createdAt,
      })),
      total,
    };
  }
}
