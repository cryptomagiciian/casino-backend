import { Injectable, Logger } from '@nestjs/common';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as ethers from 'ethers';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as crypto from 'crypto';
import { Currency } from '../shared/constants';

// Initialize bitcoinjs-lib with secp256k1 for version 7.x
bitcoin.initEccLib(ecc);

// Create BIP32 factory instance
const bip32 = BIP32Factory(ecc);

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly solanaConnection = new Connection('https://api.mainnet-beta.solana.com');

  // Master seed for generating deterministic addresses
  private readonly masterSeed = process.env.MASTER_WALLET_SEED || 'casino-master-seed-2024-secure-random-string';

  /**
   * Generate a unique deposit address for a user
   * @param userId - User ID
   * @param currency - Currency type
   * @param network - Network (mainnet/testnet)
   * @param depositId - Optional deposit ID to make address unique per deposit
   */
  async generateDepositAddress(
    userId: string,
    currency: Currency,
    network: 'mainnet' | 'testnet' = 'mainnet',
    depositId?: string
  ): Promise<string> {
    try {
      // Use depositId if provided to make each deposit address unique
      const uniqueId = depositId ? `${userId}-${depositId}` : userId;
      
      switch (currency) {
        case 'BTC':
          return this.generateBitcoinAddress(uniqueId, network);
        case 'ETH':
          return this.generateEthereumAddress(uniqueId, network);
        case 'SOL':
          return this.generateSolanaAddress(uniqueId, network);
        case 'USDC':
        case 'USDT':
          return this.generateEthereumAddress(uniqueId, network); // USDC/USDT are ERC-20 tokens
        default:
          throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      this.logger.error(`Failed to generate ${currency} address for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate Bitcoin address
   */
  private generateBitcoinAddress(userId: string, network: 'mainnet' | 'testnet'): string {
    // Create a deterministic seed from master seed + user ID
    const seedString = `${this.masterSeed}-${userId}-btc`;
    const seedHash = crypto.createHash('sha256').update(seedString).digest();
    
    const networkConfig = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    
    // Generate HD wallet using separate bip32 package for bitcoinjs-lib v7.x
    const root = bip32.fromSeed(seedHash, networkConfig);
    const child = root.derivePath("m/84'/0'/0'/0/0"); // Native SegWit (Bech32)
    
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: networkConfig,
    });

    this.logger.debug(`Generated BTC address for ${userId} on ${network}: ${address}`);
    return address!;
  }

  /**
   * Generate Ethereum address
   */
  private generateEthereumAddress(userId: string, network: 'mainnet' | 'testnet'): string {
    // Create a deterministic seed from master seed + user ID
    const seedString = `${this.masterSeed}-${userId}-eth`;
    const seedHash = crypto.createHash('sha256').update(seedString).digest();
    
    // Generate HD wallet using modern ethers API
    const wallet = ethers.HDNodeWallet.fromSeed(seedHash).derivePath("m/44'/60'/0'/0/0");
    
    this.logger.debug(`Generated ETH address for ${userId} on ${network}: ${wallet.address}`);
    return wallet.address;
  }

  /**
   * Generate Solana address
   */
  private generateSolanaAddress(userId: string, network: 'mainnet' | 'testnet'): string {
    // Create a deterministic seed from master seed + user ID
    const seedString = `${this.masterSeed}-${userId}-sol`;
    const seedHash = crypto.createHash('sha256').update(seedString).digest();
    
    // Generate keypair from the hash (32 bytes for Solana)
    const keypair = Keypair.fromSeed(seedHash.slice(0, 32));
    
    // For Solana, the address is valid but needs to be initialized on-chain
    // This happens automatically when the first transaction is sent to it
    // The address will show "Account does not exist" until it receives funds
    
    this.logger.debug(`Generated SOL address for ${userId} on ${network}: ${keypair.publicKey.toString()}`);
    return keypair.publicKey.toString();
  }

  /**
   * Get Solana account initialization instructions
   */
  getSolanaInitializationInstructions(address: string, network: 'mainnet' | 'testnet'): string {
    const networkName = network === 'testnet' ? 'devnet' : 'mainnet';
    return `Solana Account Initialization:

1. The address ${address} is valid but needs to be initialized
2. Send a small amount (0.001 SOL) to initialize the account
3. After initialization, the account will appear on Solana Explorer
4. Network: ${networkName}
5. Explorer: https://explorer.solana.com/address/${address}?cluster=${networkName}

Note: This is normal for Solana - accounts are created when first funded.`;
  }

  /**
   * Validate crypto address format
   */
  validateAddress(currency: Currency, address: string, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
    try {
      switch (currency) {
        case 'BTC':
          return this.validateBitcoinAddress(address, network);
        case 'ETH':
        case 'USDC':
        case 'USDT':
          return this.validateEthereumAddress(address);
        case 'SOL':
          return this.validateSolanaAddress(address);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Address validation failed for ${currency}:`, error);
      return false;
    }
  }

  private validateBitcoinAddress(address: string, network: 'mainnet' | 'testnet'): boolean {
    try {
      const networkConfig = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
      bitcoin.address.toOutputScript(address, networkConfig);
      return true;
    } catch {
      return false;
    }
  }

  private validateEthereumAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  private validateSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get blockchain explorer URL
   */
  getExplorerUrl(currency: Currency, address: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
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

  /**
   * Generate QR code data
   */
  generateQrCodeData(currency: Currency, address: string, amount?: number): string {
    const schemes = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      USDC: 'ethereum',
      USDT: 'ethereum',
    };

    const scheme = schemes[currency];
    return amount ? `${scheme}:${address}?amount=${amount}` : `${scheme}:${address}`;
  }
}
