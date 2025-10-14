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
    const { currency, amount, network, transactionHash, blockNumber } = createDepositDto;

    // Validate minimum deposit amount
    if (amount < this.MIN_DEPOSITS[currency]) {
      throw new BadRequestException(
        `Minimum deposit amount for ${currency} is ${this.MIN_DEPOSITS[currency]}`
      );
    }

    // Generate deposit ID
    const depositId = generateId('dep');

    // Generate unique wallet address for this deposit
    const depositWalletAddress = await this.generateWalletAddress(currency, network);

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
      },
    });

    this.logger.log(`Created Web3 deposit ${depositId} for user ${userId}: ${amount} ${currency} on ${network}`);

    // Generate QR code data for easy scanning
    const qrCodeData = this.generateQrCodeData(currency, depositWalletAddress, amount);

    // Generate blockchain explorer URL
    const explorerUrl = this.generateExplorerUrl(currency, depositWalletAddress, network);

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
    const qrCodeData = this.generateQrCodeData(deposit.currency as Currency, deposit.walletAddress, parseFloat(fromSmallestUnits(deposit.amount, deposit.currency as Currency)));
    const explorerUrl = this.generateExplorerUrl(deposit.currency as Currency, deposit.walletAddress, 'mainnet'); // Default to mainnet for existing deposits

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
    await this.ledgerService.createUserTransaction({
      userId: deposit.userId,
      type: 'DEPOSIT',
      currency: deposit.currency as Currency,
      amount: fromSmallestUnits(deposit.amount, deposit.currency as Currency),
      description: `Deposit ${deposit.id}`,
      refId: deposit.id,
      meta: {
        paymentMethod: deposit.paymentMethod,
        transactionHash: deposit.transactionHash,
      },
    });

    this.logger.log(`Completed deposit ${depositId}: ${fromSmallestUnits(deposit.amount, deposit.currency as Currency)} ${deposit.currency}`);
  }

  private async generateWalletAddress(currency: Currency, network: 'mainnet' | 'testnet'): Promise<string> {
    // In a real Web3 implementation, this would integrate with:
    // - Bitcoin: HD wallet generation, BIP32/BIP44
    // - Ethereum: Web3.js, ethers.js, or HD wallet
    // - Solana: @solana/web3.js, HD wallet
    // - USDC/USDT: Ethereum network (ERC-20 tokens)
    
    // For demo purposes, generate realistic-looking addresses
    const addressGenerators = {
      BTC: (net: string) => {
        // Bitcoin addresses: Legacy (1...), SegWit (3...), Bech32 (bc1...)
        const prefixes = net === 'testnet' ? ['m', 'n', '2', 'tb1'] : ['1', '3', 'bc1'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomPart = Math.random().toString(36).substring(2, 34);
        return `${prefix}${randomPart}`;
      },
      ETH: (net: string) => {
        // Ethereum addresses: 0x + 40 hex characters
        const randomHex = Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return `0x${randomHex}`;
      },
      SOL: (net: string) => {
        // Solana addresses: Base58 encoded, 32-44 characters
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const length = 32 + Math.floor(Math.random() * 12);
        return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      },
      USDC: (net: string) => {
        // USDC is ERC-20 token on Ethereum
        const randomHex = Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return `0x${randomHex}`;
      },
      USDT: (net: string) => {
        // USDT is ERC-20 token on Ethereum
        const randomHex = Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return `0x${randomHex}`;
      },
    };

    return addressGenerators[currency](network);
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
        mainnet: 'https://etherscan.io/token/0xa0b86a33e6ba0e0e5c4b8b8b8b8b8b8b8b8b8b8b?a=',
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