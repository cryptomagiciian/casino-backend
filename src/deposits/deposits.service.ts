import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { Currency } from '../shared/constants';
import { toSmallestUnits, fromSmallestUnits, generateId } from '../shared/utils';
import * as crypto from 'crypto';

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
    private walletService: WalletService,
  ) {}

  async createDeposit(userId: string, createDepositDto: CreateDepositDto): Promise<DepositResponseDto> {
    const { currency, amount, network, blockchain, transactionHash, blockNumber } = createDepositDto;

    // Validate minimum deposit amount
    if (amount < this.MIN_DEPOSITS[currency]) {
      throw new BadRequestException(
        `Minimum deposit amount for ${currency} is ${this.MIN_DEPOSITS[currency]}`
      );
    }

    // Generate deposit ID
    const depositId = generateId('dep');

    // Generate unique wallet address for this deposit
    // For multi-chain tokens, use the specified blockchain
    const targetCurrency = blockchain && ['USDC', 'USDT'].includes(currency) ? blockchain : currency;
    const depositWalletAddress = await this.walletService.generateDepositAddress(userId, targetCurrency as Currency, network, depositId);

    // Create deposit record
    const deposit = await this.prisma.deposit.create({
      data: {
        id: depositId,
        userId,
        currency,
        amount: toSmallestUnits(amount.toString(), currency),
        paymentMethod: 'crypto', // Always crypto for Web3
        status: 'PENDING',
        walletAddress: depositWalletAddress,
        transactionHash,
        requiredConfirmations: this.REQUIRED_CONFIRMATIONS[currency],
        currentConfirmations: 0,
        meta: {
          network,
          blockchain,
          transactionHash,
          blockNumber,
        },
      },
    });

    this.logger.log(`Created Web3 deposit ${depositId} for user ${userId}: ${amount} ${currency} on ${network}`);

    // Generate QR code data for easy scanning
    const qrCodeData = this.walletService.generateQrCodeData(currency, depositWalletAddress, amount);

    // Generate blockchain explorer URL
    const explorerUrl = this.walletService.getExplorerUrl(currency, depositWalletAddress, network);

    // Get Solana initialization instructions if needed
    const solanaInstructions = currency === 'SOL' ? 
      this.walletService.getSolanaInitializationInstructions(depositWalletAddress, network) : null;

    return {
      id: deposit.id,
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      paymentMethod: deposit.paymentMethod,
      network,
      status: deposit.status,
      walletAddress: deposit.walletAddress,
      transactionHash: deposit.transactionHash,
      blockNumber,
      qrCodeData,
      requiredConfirmations: deposit.requiredConfirmations,
      currentConfirmations: deposit.currentConfirmations,
      explorerUrl,
      createdAt: deposit.createdAt.toISOString(),
      completedAt: deposit.completedAt?.toISOString(),
      solanaInstructions,
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

    // Generate QR code data and explorer URL for existing deposit
    const qrCodeData = this.walletService.generateQrCodeData(deposit.currency as Currency, deposit.walletAddress, parseFloat(fromSmallestUnits(deposit.amount, deposit.currency as Currency)));
    const explorerUrl = this.walletService.getExplorerUrl(deposit.currency as Currency, deposit.walletAddress, 'mainnet'); // Default to mainnet for existing deposits

    return {
      id: deposit.id,
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      paymentMethod: deposit.paymentMethod,
      network: 'mainnet', // Default for existing deposits
      status: deposit.status,
      walletAddress: deposit.walletAddress,
      transactionHash: deposit.transactionHash,
      blockNumber: deposit.blockNumber,
      qrCodeData,
      requiredConfirmations: deposit.requiredConfirmations,
      currentConfirmations: deposit.currentConfirmations,
      explorerUrl,
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

    if (deposit.status === 'COMPLETED') {
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

    if (!deposit || deposit.status === 'COMPLETED') {
      return;
    }

    // Update deposit status
    await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Credit user's wallet
    const network = deposit.meta?.network || 'mainnet';
    await this.ledgerService.createUserTransaction({
      userId: deposit.userId,
      type: 'DEPOSIT',
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      description: `Deposit ${deposit.id}`,
      refId: deposit.id,
      network,
      meta: {
        paymentMethod: deposit.paymentMethod,
        transactionHash: deposit.transactionHash,
        network,
      },
    });

    this.logger.log(`Completed deposit ${depositId}: ${fromSmallestUnits(deposit.amount, deposit.currency as Currency)} ${deposit.currency}`);
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

  /**
   * Manually confirm a deposit (for testing purposes)
   */
  async confirmDeposit(userId: string, depositId: string): Promise<DepositResponseDto> {
    const deposit = await this.prisma.deposit.findFirst({
      where: {
        id: depositId,
        userId,
        status: 'PENDING',
      },
    });

    if (!deposit) {
      throw new BadRequestException('Deposit not found or already processed');
    }

    // Update deposit status to completed
    await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        currentConfirmations: deposit.requiredConfirmations,
        transactionHash: deposit.transactionHash || this.generateMockTxHash(),
      },
    });

    // Credit user's wallet
    const network = deposit.meta?.network || 'mainnet';
    await this.ledgerService.createUserTransaction({
      userId: deposit.userId,
      type: 'DEPOSIT',
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      description: `Deposit ${depositId} confirmed`,
      refId: depositId,
      network,
      meta: {
        depositId,
        walletAddress: deposit.walletAddress,
        confirmedAt: new Date(),
        network,
      },
    });

    this.logger.log(`Manually confirmed deposit ${depositId}: ${fromSmallestUnits(deposit.amount, deposit.currency as Currency)} ${deposit.currency}`);

    // Return updated deposit
    return this.getDeposit(userId, depositId);
  }

  private generateMockTxHash(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}