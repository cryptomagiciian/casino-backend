import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Currency, LEDGER_TYPES } from '../shared/constants';
import { DepositRequest } from '../shared/types';
import { toSmallestUnits } from '../shared/utils';

@Injectable()
export class DepositsService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

  /**
   * Create a deposit request
   */
  async createDeposit(userId: string, request: DepositRequest) {
    const { currency, amount, provider, txRef } = request;
    const amountSmallest = toSmallestUnits(amount, currency);

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        currency,
        amount: amountSmallest,
        provider,
        status: 'PENDING',
        txRef,
        meta: {
          createdAt: new Date().toISOString(),
        },
      },
    });

    return deposit;
  }

  /**
   * Process webhook from deposit provider
   */
  async processWebhook(provider: string, payload: any) {
    // This is a stub implementation
    // In a real system, you would:
    // 1. Verify webhook signature
    // 2. Parse provider-specific payload
    // 3. Update deposit status
    // 4. Credit user balance

    const { txRef, status, amount, currency } = payload;

    if (!txRef) {
      throw new BadRequestException('Missing transaction reference');
    }

    const deposit = await this.prisma.deposit.findFirst({
      where: { txRef },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (status === 'confirmed') {
      // Update deposit status
      await this.prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'CONFIRMED',
        },
      });

      // Credit user balance
      const account = await this.prisma.walletAccount.findUnique({
        where: {
          userId_currency: {
            userId: deposit.userId,
            currency: deposit.currency,
          },
        },
      });

      if (account) {
        await this.ledgerService.createEntry({
          accountId: account.id,
          amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
          currency: deposit.currency as Currency,
          type: LEDGER_TYPES.DEPOSIT,
          refId: deposit.id,
          meta: {
            provider,
            txRef,
            webhook: true,
          },
        });
      }
    } else if (status === 'failed') {
      await this.prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'FAILED',
        },
      });
    }

    return { success: true };
  }

  /**
   * Get user deposits
   */
  async getUserDeposits(userId: string, limit: number = 50, offset: number = 0) {
    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.deposit.count({
        where: { userId },
      }),
    ]);

    return {
      deposits: deposits.map(deposit => ({
        id: deposit.id,
        currency: deposit.currency,
        amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
        provider: deposit.provider,
        status: deposit.status,
        txRef: deposit.txRef,
        createdAt: deposit.createdAt,
      })),
      total,
    };
  }
}

// Helper function to convert from smallest units
function fromSmallestUnits(amount: bigint, currency: Currency): string {
  const decimals = {
    BTC: 8,
    ETH: 18,
    SOL: 9,
    USDC: 6,
    USDT: 6,
  }[currency];

  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  
  if (trimmed === '') {
    return whole.toString();
  }
  
  return `${whole}.${trimmed}`;
}
