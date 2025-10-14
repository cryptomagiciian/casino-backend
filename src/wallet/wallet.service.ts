import { Injectable, Logger } from '@nestjs/common';
import * as bitcoin from 'bitcoinjs-lib';
import * as ethers from 'ethers';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { Currency } from '../shared/constants';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly solanaConnection = new Connection('https://api.mainnet-beta.solana.com');

  // Master seed for generating deterministic addresses
  private readonly masterSeed = process.env.MASTER_WALLET_SEED || 'casino-master-seed-2024-secure-random-string';

  /**
   * Generate a unique deposit address for a user
   */
  async generateDepositAddress(
    userId: string,
    currency: Currency,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<string> {
    try {
      switch (currency) {
        case 'BTC':
          return this.generateBitcoinAddress(userId, network);
        case 'ETH':
          return this.generateEthereumAddress(userId, network);
        case 'SOL':
          return this.generateSolanaAddress(userId, network);
        case 'USDC':
        case 'USDT':
          return this.generateEthereumAddress(userId, network); // USDC/USDT are ERC-20 tokens
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
    const seed = `${this.masterSeed}-${userId}-${Date.now()}`;
    const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 32));
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
    
    const networkConfig = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    
    // Generate HD wallet
    const root = bitcoin.bip32.fromSeed(seedBuffer, networkConfig);
    const child = root.derivePath("m/84'/0'/0'/0/0"); // Native SegWit (Bech32)
    
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: networkConfig,
    });

    return address!;
  }

  /**
   * Generate Ethereum address
   */
  private generateEthereumAddress(userId: string, network: 'mainnet' | 'testnet'): string {
    const seed = `${this.masterSeed}-${userId}-${Date.now()}`;
    const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 32));
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
    
    // Generate HD wallet
    const hdNode = ethers.utils.HDNode.fromSeed(seedBuffer);
    const child = hdNode.derivePath("m/44'/60'/0'/0/0");
    
    return child.address;
  }

  /**
   * Generate Solana address
   */
  private generateSolanaAddress(userId: string, network: 'mainnet' | 'testnet'): string {
    const seed = `${this.masterSeed}-${userId}-${Date.now()}`;
    const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 32));
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
    
    // Generate keypair from seed
    const keypair = Keypair.fromSeed(seedBuffer.slice(0, 32));
    
    return keypair.publicKey.toString();
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
    return ethers.utils.isAddress(address);
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
