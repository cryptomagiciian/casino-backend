const crypto = require('crypto');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const ethers = require('ethers');
const { Connection, Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');

// Initialize bitcoinjs-lib with secp256k1
bitcoin.initEccLib(ecc);

// Your master seed (KEEP THIS SECURE!)
const MASTER_SEED = '362075f72c98e833be837d5b74dc87221e50c057e5330d44d2517e8a33152190';

console.log('🔐 CRYPTO CASINO HOT WALLET GENERATOR');
console.log('=====================================\n');

// Generate Bitcoin hot wallet
function generateBitcoinHotWallet() {
  console.log('📈 BITCOIN HOT WALLET');
  console.log('---------------------');
  
  const seed = crypto.createHash('sha256').update(MASTER_SEED + '-btc-hot').digest();
  const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 16));
  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
  
  const root = bitcoin.bip32.fromSeed(seedBuffer, bitcoin.networks.bitcoin);
  const hotWallet = root.derivePath("m/84'/0'/0'/0/0"); // Native SegWit
  
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: hotWallet.publicKey,
    network: bitcoin.networks.bitcoin,
  });

  console.log('Address:', address);
  console.log('Private Key:', hotWallet.privateKey.toString('hex'));
  console.log('Public Key:', hotWallet.publicKey.toString('hex'));
  console.log('Mnemonic:', mnemonic);
  console.log('');
  
  return {
    address,
    privateKey: hotWallet.privateKey.toString('hex'),
    publicKey: hotWallet.publicKey.toString('hex'),
    mnemonic
  };
}

// Generate Ethereum hot wallet
function generateEthereumHotWallet() {
  console.log('🔷 ETHEREUM HOT WALLET');
  console.log('----------------------');
  
  const seed = crypto.createHash('sha256').update(MASTER_SEED + '-eth-hot').digest();
  const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 16));
  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
  
  const hdNode = ethers.utils.HDNode.fromSeed(seedBuffer);
  const hotWallet = hdNode.derivePath("m/44'/60'/0'/0/0");
  
  console.log('Address:', hotWallet.address);
  console.log('Private Key:', hotWallet.privateKey);
  console.log('Public Key:', hotWallet.publicKey);
  console.log('Mnemonic:', mnemonic);
  console.log('');
  
  return {
    address: hotWallet.address,
    privateKey: hotWallet.privateKey,
    publicKey: hotWallet.publicKey,
    mnemonic
  };
}

// Generate Solana hot wallet
function generateSolanaHotWallet() {
  console.log('☀️ SOLANA HOT WALLET');
  console.log('--------------------');
  
  const seed = crypto.createHash('sha256').update(MASTER_SEED + '-sol-hot').digest();
  const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 16));
  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
  
  const keypair = Keypair.fromSeed(seedBuffer.slice(0, 32));
  
  console.log('Address:', keypair.publicKey.toString());
  console.log('Private Key:', Buffer.from(keypair.secretKey).toString('hex'));
  console.log('Public Key:', keypair.publicKey.toString());
  console.log('Mnemonic:', mnemonic);
  console.log('');
  
  return {
    address: keypair.publicKey.toString(),
    privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    publicKey: keypair.publicKey.toString(),
    mnemonic
  };
}

// Generate all hot wallets
function generateAllHotWallets() {
  const wallets = {
    bitcoin: generateBitcoinHotWallet(),
    ethereum: generateEthereumHotWallet(),
    solana: generateSolanaHotWallet()
  };
  
  console.log('🔒 SECURITY REMINDERS');
  console.log('====================');
  console.log('1. Store private keys OFFLINE in a secure location');
  console.log('2. Use hardware wallets for large amounts');
  console.log('3. Keep only small amounts in hot wallets');
  console.log('4. Set up multi-signature for large withdrawals');
  console.log('5. Monitor wallet balances regularly');
  console.log('6. Use cold storage for bulk funds');
  console.log('');
  
  console.log('📋 ENVIRONMENT VARIABLES FOR RAILWAY');
  console.log('====================================');
  console.log('MASTER_WALLET_SEED=362075f72c98e833be837d5b74dc87221e50c057e5330d44d2517e8a33152190');
  console.log('WITHDRAWAL_SECRET=ef29c16610018471fadb7c63912c5f6eb7b0cc9b07e050fec3e11242fe41ce86');
  console.log('');
  
  return wallets;
}

// Run the generator
if (require.main === module) {
  generateAllHotWallets();
}

module.exports = { generateAllHotWallets };
