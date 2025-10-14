import { Injectable, BadRequestException, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { Currency } from '../shared/constants';
import { toSmallestUnits, fromSmallestUnits, generateId } from '../shared/utils';
import * as crypto from 'crypto';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  // Minimum withdrawal amounts per currency
  private readonly MIN_WITHDRAWALS: Record<Currency, number> = {
    BTC: 0.001,
    ETH: 0.01,
    SOL: 0.1,
    USDC: 10,
    USDT: 10,
  };

  // Withdrawal fees per currency
  private readonly WITHDRAWAL_FEES: Record<Currency, number> = {
    BTC: 0.0005,
    ETH: 0.005,
    SOL: 0.01,
    USDC: 1,
    USDT: 1,
  };

  // Daily withdrawal limits per currency
  private readonly DAILY_LIMITS: Record<Currency, number> = {
    BTC: 1, // 1 BTC per day
    ETH: 10, // 10 ETH per day
    SOL: 1000, // 1000 SOL per day
    USDC: 50000, // $50k per day
    USDT: 50000, // $50k per day
  };

  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
    private walletsService: WalletsService,
  ) {}

  async createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto): Promise<WithdrawalResponseDto> {
    const { currency, amount, walletAddress, network, twoFactorCode, withdrawalPassword } = createWithdrawalDto;

    // Validate minimum withdrawal amount
    if (amount < this.MIN_WITHDRAWALS[currency]) {
      throw new BadRequestException(
        `Minimum withdrawal amount for ${currency} is ${this.MIN_WITHDRAWALS[currency]}`
      );
    }

    // Check daily withdrawal limit
    await this.checkDailyWithdrawalLimit(userId, currency, amount);

    // Validate wallet address format
    this.validateWalletAddress(currency, walletAddress);

    // Check user balance
    const userBalance = await this.walletsService.getWalletBalance(userId, currency);
    const balanceAmount = parseFloat(userBalance.available);
    
    if (balanceAmount < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Calculate fees
    const fee = this.WITHDRAWAL_FEES[currency];
    const netAmount = amount - fee;

    if (netAmount <= 0) {
      throw new BadRequestException('Withdrawal amount too small to cover fees');
    }

    // Security checks
    await this.performSecurityChecks(userId, twoFactorCode, withdrawalPassword);

    // Generate withdrawal ID
    const withdrawalId = generateId('wth');

    // Create withdrawal record
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        id: withdrawalId,
        userId,
        currency,
        amount: toSmallestUnits(amount.toString(), currency),
        fee: toSmallestUnits(fee.toString(), currency),
        netAmount: toSmallestUnits(netAmount.toString(), currency),
        walletAddress,
        withdrawalMethod: 'crypto', // Always crypto for Web3
        status: 'PENDING',
        processingTime: this.getProcessingTime(currency, 'crypto'),
      },
    });

    this.logger.log(`Created Web3 withdrawal ${withdrawalId} for user ${userId}: ${amount} ${currency} to ${walletAddress} on ${network}`);

    // Lock the funds immediately
    await this.ledgerService.createUserTransaction({
      userId,
      type: 'WITHDRAWAL_LOCK',
      currency,
      amount: amount.toString(),
      description: `Withdrawal ${withdrawalId} - funds locked`,
      refId: withdrawal.id,
      meta: {
        walletAddress,
        network,
      },
    });

    // Process withdrawal (in real implementation, this would be queued)
    await this.processWithdrawal(withdrawalId);

    // Generate blockchain explorer URL
    const explorerUrl = this.generateExplorerUrl(currency, walletAddress, network);

    return {
      id: withdrawal.id,
      currency: withdrawal.currency as Currency,
      amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
      fee: fromSmallestUnits(withdrawal.fee, withdrawal.currency as Currency),
      netAmount: fromSmallestUnits(withdrawal.netAmount, withdrawal.currency as Currency),
      walletAddress: withdrawal.walletAddress,
      network,
      status: withdrawal.status,
      processingTime: withdrawal.processingTime,
      explorerUrl,
      createdAt: withdrawal.createdAt.toISOString(),
      completedAt: withdrawal.completedAt?.toISOString(),
    };
  }

  async getWithdrawals(userId: string, limit = 50, offset = 0) {
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
        currency: withdrawal.currency as Currency,
        amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
        fee: fromSmallestUnits(withdrawal.fee, withdrawal.currency as Currency),
        netAmount: fromSmallestUnits(withdrawal.netAmount, withdrawal.currency as Currency),
        walletAddress: withdrawal.walletAddress,
        withdrawalMethod: withdrawal.withdrawalMethod,
        status: withdrawal.status,
        transactionHash: withdrawal.transactionHash,
        processingTime: withdrawal.processingTime,
        createdAt: withdrawal.createdAt.toISOString(),
        completedAt: withdrawal.completedAt?.toISOString(),
      })),
      total,
    };
  }

  async getWithdrawal(userId: string, withdrawalId: string): Promise<WithdrawalResponseDto> {
    const withdrawal = await this.prisma.withdrawal.findFirst({
      where: { id: withdrawalId, userId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return {
      id: withdrawal.id,
      currency: withdrawal.currency as Currency,
      amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
      fee: fromSmallestUnits(withdrawal.fee, withdrawal.currency as Currency),
      netAmount: fromSmallestUnits(withdrawal.netAmount, withdrawal.currency as Currency),
      walletAddress: withdrawal.walletAddress,
      withdrawalMethod: withdrawal.withdrawalMethod,
      status: withdrawal.status,
      transactionHash: withdrawal.transactionHash,
      processingTime: withdrawal.processingTime,
      createdAt: withdrawal.createdAt.toISOString(),
      completedAt: withdrawal.completedAt?.toISOString(),
    };
  }

  async cancelWithdrawal(userId: string, withdrawalId: string): Promise<void> {
    const withdrawal = await this.prisma.withdrawal.findFirst({
      where: { id: withdrawalId, userId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Only pending withdrawals can be cancelled');
    }

    // Update withdrawal status
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'CANCELLED' },
    });

    // Unlock the funds
    await this.ledgerService.createUserTransaction({
      userId,
      type: 'WITHDRAWAL_UNLOCK',
      currency: withdrawal.currency as Currency,
      amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
      description: `Withdrawal ${withdrawalId} cancelled - funds unlocked`,
      refId: withdrawal.id,
      meta: {},
    });

    this.logger.log(`Cancelled withdrawal ${withdrawalId} for user ${userId}`);
  }

  private async checkDailyWithdrawalLimit(userId: string, currency: Currency, amount: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWithdrawals = await this.prisma.withdrawal.findMany({
      where: {
        userId,
        currency,
        status: { in: ['COMPLETED', 'PROCESSING'] },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totalWithdrawnToday = todayWithdrawals.reduce((sum, w) => {
      return sum + parseFloat(fromSmallestUnits(w.amount, w.currency as Currency));
    }, 0);

    if (totalWithdrawnToday + amount > this.DAILY_LIMITS[currency]) {
      throw new BadRequestException(
        `Daily withdrawal limit exceeded. Limit: ${this.DAILY_LIMITS[currency]} ${currency}, Already withdrawn: ${totalWithdrawnToday} ${currency}`
      );
    }
  }

  private validateWalletAddress(currency: Currency, address: string): void {
    const validators = {
      BTC: (addr: string) => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(addr),
      ETH: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr),
      SOL: (addr: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr),
      USDC: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr),
      USDT: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr),
    };

    const validator = validators[currency];
    if (!validator(address)) {
      throw new BadRequestException(`Invalid ${currency} wallet address format`);
    }
  }

  private async performSecurityChecks(userId: string, twoFactorCode?: string, withdrawalPassword?: string): Promise<void> {
    // In a real implementation, you would:
    // 1. Verify 2FA code
    // 2. Verify withdrawal password
    // 3. Check for suspicious activity
    // 4. Verify user identity if needed

    // For demo purposes, we'll just log the security check
    this.logger.log(`Performing security checks for user ${userId}`);
    
    // Simulate security validation
    if (twoFactorCode && twoFactorCode.length !== 6) {
      throw new BadRequestException('Invalid 2FA code format');
    }

    if (withdrawalPassword && withdrawalPassword.length < 8) {
      throw new BadRequestException('Withdrawal password must be at least 8 characters');
    }
  }

  private getProcessingTime(currency: Currency, method: string): string {
    const times = {
      crypto: {
        BTC: '10-60 minutes',
        ETH: '5-30 minutes',
        SOL: '1-5 minutes',
        USDC: '5-30 minutes',
        USDT: '5-30 minutes',
      },
    };

    return times[method]?.[currency] || '10-60 minutes';
  }

  private generateExplorerUrl(currency: Currency, address: string, network: 'mainnet' | 'testnet'): string {
    const explorers = {
      BTC: {
        mainnet: 'https://blockstream.info/address',
        testnet: 'https://blockstream.info/testnet/address',
      },
      ETH: {
        mainnet: 'https://etherscan.io/address',
        testnet: 'https://sepolia.etherscan.io/address',
      },
      SOL: {
        mainnet: 'https://explorer.solana.com/address',
        testnet: 'https://explorer.solana.com/address?cluster=testnet',
      },
      USDC: {
        mainnet: 'https://etherscan.io/token/0xa0b86a33e6ba0e0e5c4b8b8b8b8b8b8b8b8b8b8b8b?a=',
        testnet: 'https://sepolia.etherscan.io/token/0xa0b86a33e6ba0e0e5c4b8b8b8b8b8b8b8b8b8b8b8b?a=',
      },
      USDT: {
        mainnet: 'https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a=',
        testnet: 'https://sepolia.etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a=',
      },
    };

    const explorer = explorers[currency][network];
    return `${explorer}/${address}`;
  }

  private async processWithdrawal(withdrawalId: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Queue the withdrawal for processing
    // 2. Integrate with crypto payment processors
    // 3. Handle blockchain transactions
    // 4. Update withdrawal status based on transaction status

    // For demo purposes, simulate processing
    setTimeout(async () => {
      try {
        await this.completeWithdrawal(withdrawalId);
      } catch (error) {
        this.logger.error(`Failed to process withdrawal ${withdrawalId}:`, error);
        await this.failWithdrawal(withdrawalId);
      }
    }, 5000); // Simulate 5-second processing time
  }

  private async completeWithdrawal(withdrawalId: string): Promise<void> {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal || withdrawal.status !== 'PENDING') {
      return;
    }

    // Generate mock transaction hash
    const transactionHash = crypto.randomBytes(32).toString('hex');

    // Update withdrawal status
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'COMPLETED',
        transactionHash,
        completedAt: new Date(),
      },
    });

    // Create final withdrawal transaction
    await this.ledgerService.createUserTransaction({
      userId: withdrawal.userId,
      type: 'WITHDRAWAL',
      currency: withdrawal.currency as Currency,
      amount: fromSmallestUnits(withdrawal.netAmount, withdrawal.currency as Currency),
      description: `Withdrawal ${withdrawal.id} completed`,
      refId: withdrawal.id,
      meta: {
        walletAddress: withdrawal.walletAddress,
        transactionHash,
        fee: fromSmallestUnits(withdrawal.fee, withdrawal.currency as Currency),
      },
    });

    this.logger.log(`Completed withdrawal ${withdrawalId}: ${fromSmallestUnits(withdrawal.netAmount, withdrawal.currency as Currency)} ${withdrawal.currency}`);
  }

  private async failWithdrawal(withdrawalId: string): Promise<void> {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal || withdrawal.status !== 'PENDING') {
      return;
    }

    // Update withdrawal status
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'FAILED' },
    });

    // Unlock the funds
    await this.ledgerService.createUserTransaction({
      userId: withdrawal.userId,
      type: 'WITHDRAWAL_UNLOCK',
      currency: withdrawal.currency as Currency,
      amount: fromSmallestUnits(withdrawal.amount, withdrawal.currency as Currency),
      description: `Withdrawal ${withdrawal.id} failed - funds unlocked`,
      refId: withdrawal.id,
      meta: {},
    });

    this.logger.log(`Failed withdrawal ${withdrawalId} for user ${withdrawal.userId}`);
  }

  async getWithdrawalLimits(currency: Currency) {
    return {
      min: this.MIN_WITHDRAWALS[currency],
      max: this.DAILY_LIMITS[currency],
      dailyLimit: this.DAILY_LIMITS[currency],
      fee: this.WITHDRAWAL_FEES[currency],
      processingTime: this.getProcessingTime(currency, 'crypto'),
    };
  }
}