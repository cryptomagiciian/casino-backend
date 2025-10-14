import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { Currency } from '../shared/constants';
import { toSmallestUnits, fromSmallestUnits, generateId } from '../shared/utils';

@Injectable()
export class DepositsService {
  private readonly logger = new Logger(DepositsService.name);

  // Minimum deposit amounts per currency
  private readonly MIN_DEPOSITS: Record<Currency, number> = {
    BTC: 0.0001,
    ETH: 0.001,
    SOL: 0.01,
    USDC: 1,
    USDT: 1,
  };

  // Required confirmations per currency
  private readonly REQUIRED_CONFIRMATIONS: Record<Currency, number> = {
    BTC: 3,
    ETH: 12,
    SOL: 32,
    USDC: 12,
    USDT: 12,
  };

  // Withdrawal fees per currency
  private readonly WITHDRAWAL_FEES: Record<Currency, number> = {
    BTC: 0.0005,
    ETH: 0.005,
    SOL: 0.01,
    USDC: 1,
    USDT: 1,
  };

  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
    private walletsService: WalletsService,
  ) {}

  async createDeposit(userId: string, createDepositDto: CreateDepositDto): Promise<DepositResponseDto> {
    const { currency, amount, paymentMethod, walletAddress, transactionHash } = createDepositDto;

    // Validate minimum deposit amount
    if (amount < this.MIN_DEPOSITS[currency]) {
      throw new BadRequestException(
        `Minimum deposit amount for ${currency} is ${this.MIN_DEPOSITS[currency]}`
      );
    }

    // Generate deposit ID
    const depositId = generateId('dep');

    // Generate wallet address for crypto deposits
    let depositWalletAddress = walletAddress;
    if (paymentMethod === 'crypto' && !depositWalletAddress) {
      depositWalletAddress = await this.generateWalletAddress(currency);
    }

    // Create deposit record
    const deposit = await this.prisma.deposit.create({
      data: {
        id: depositId,
        userId,
        currency,
        amount: toSmallestUnits(amount.toString(), currency),
        paymentMethod,
        status: 'pending',
        walletAddress: depositWalletAddress,
        transactionHash,
        requiredConfirmations: this.REQUIRED_CONFIRMATIONS[currency],
        currentConfirmations: 0,
      },
    });

    this.logger.log(`Created deposit ${depositId} for user ${userId}: ${amount} ${currency}`);

    // Generate QR code data for crypto deposits
    let qrCodeData: string | undefined;
    if (paymentMethod === 'crypto' && depositWalletAddress) {
      qrCodeData = this.generateQrCodeData(currency, depositWalletAddress, amount);
    }

    // Generate confirmation URL for card/bank transfers
    let confirmationUrl: string | undefined;
    if (paymentMethod === 'card' || paymentMethod === 'bank_transfer') {
      confirmationUrl = await this.generateConfirmationUrl(depositId, amount, currency);
    }

    return {
      id: deposit.id,
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      paymentMethod: deposit.paymentMethod,
      status: deposit.status,
      walletAddress: deposit.walletAddress,
      transactionHash: deposit.transactionHash,
      confirmationUrl,
      qrCodeData,
      requiredConfirmations: deposit.requiredConfirmations,
      currentConfirmations: deposit.currentConfirmations,
      createdAt: deposit.createdAt.toISOString(),
      completedAt: deposit.completedAt?.toISOString(),
    };
  }

  async getDeposits(userId: string, limit = 50, offset = 0) {
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
        currency: deposit.currency as Currency,
        amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        walletAddress: deposit.walletAddress,
        transactionHash: deposit.transactionHash,
        requiredConfirmations: deposit.requiredConfirmations,
        currentConfirmations: deposit.currentConfirmations,
        createdAt: deposit.createdAt.toISOString(),
        completedAt: deposit.completedAt?.toISOString(),
      })),
      total,
    };
  }

  async getDeposit(userId: string, depositId: string): Promise<DepositResponseDto> {
    const deposit = await this.prisma.deposit.findFirst({
      where: { id: depositId, userId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    return {
      id: deposit.id,
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      paymentMethod: deposit.paymentMethod,
      status: deposit.status,
      walletAddress: deposit.walletAddress,
      transactionHash: deposit.transactionHash,
      requiredConfirmations: deposit.requiredConfirmations,
      currentConfirmations: deposit.currentConfirmations,
      createdAt: deposit.createdAt.toISOString(),
      completedAt: deposit.completedAt?.toISOString(),
    };
  }

  async processDepositWebhook(depositId: string, confirmations: number, transactionHash?: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.status === 'completed') {
      return; // Already processed
    }

    // Update confirmations
    await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        currentConfirmations: confirmations,
        transactionHash: transactionHash || deposit.transactionHash,
      },
    });

    // Check if enough confirmations
    if (confirmations >= deposit.requiredConfirmations) {
      await this.completeDeposit(depositId);
    }
  }

  private async completeDeposit(depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit || deposit.status === 'completed') {
      return;
    }

    // Update deposit status
    await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Credit user's wallet
    await this.ledgerService.createTransaction({
      userId: deposit.userId,
      type: 'DEPOSIT',
      currency: deposit.currency as Currency,
      amount: deposit.amount,
      description: `Deposit ${deposit.id}`,
      metadata: {
        depositId: deposit.id,
        paymentMethod: deposit.paymentMethod,
        transactionHash: deposit.transactionHash,
      },
    });

    this.logger.log(`Completed deposit ${depositId}: ${fromSmallestUnits(deposit.amount, deposit.currency as Currency)} ${deposit.currency}`);
  }

  private async generateWalletAddress(currency: Currency): Promise<string> {
    // In a real implementation, this would integrate with:
    // - Bitcoin: Electrum, Bitcoin Core, or third-party service
    // - Ethereum: Web3 providers, Infura, Alchemy
    // - Solana: Solana Web3.js
    // - USDC/USDT: Ethereum network
    
    // For demo purposes, generate a mock address
    const addressPrefixes = {
      BTC: '1',
      ETH: '0x',
      SOL: '',
      USDC: '0x',
      USDT: '0x',
    };

    const prefix = addressPrefixes[currency];
    const randomPart = Math.random().toString(36).substring(2, 42);
    
    return `${prefix}${randomPart}`;
  }

  private generateQrCodeData(currency: Currency, address: string, amount: number): string {
    const schemes = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      USDC: 'ethereum',
      USDT: 'ethereum',
    };

    const scheme = schemes[currency];
    return `${scheme}:${address}?amount=${amount}`;
  }

  private async generateConfirmationUrl(depositId: string, amount: number, currency: Currency): Promise<string> {
    // In a real implementation, this would integrate with payment processors like:
    // - Stripe for card payments
    // - Plaid for bank transfers
    // - MoonPay, Ramp, or similar for crypto on-ramps
    
    // For demo purposes, return a mock URL
    return `https://payment-provider.com/confirm/${depositId}?amount=${amount}&currency=${currency}`;
  }

  async getDepositLimits(currency: Currency) {
    return {
      min: this.MIN_DEPOSITS[currency],
      max: 1000000, // $1M max per deposit
      dailyLimit: 10000000, // $10M daily limit
      fees: {
        crypto: 0, // No fees for crypto deposits
        card: 0.029, // 2.9% for card payments
        bank_transfer: 0.01, // 1% for bank transfers
      },
    };
  }
}