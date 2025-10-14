const crypto = require('crypto');
const { ethers } = require('ethers');
const { Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');

// Your master seed (KEEP THIS SECURE!)
const MASTER_SEED = '362075f72c98e833be837d5b74dc87221e50c057e5330d44d2517e8a33152190';

console.log('🔐 CRYPTO CASINO HOT WALLET GENERATOR');
console.log('=====================================\n');

// Generate Bitcoin hot wallet (simplified)
function generateBitcoinHotWallet() {
  console.log('📈 BITCOIN HOT WALLET');
  console.log('---------------------');
  
  const seed = crypto.createHash('sha256').update(MASTER_SEED + '-btc-hot').digest();
  const mnemonic = bip39.entropyToMnemonic(seed.slice(0, 16));
  
  // Generate a simple Bitcoin address (for demo - use proper HD wallet in production)
  const address = 'bc1' + crypto.randomBytes(20).toString('hex');
  const privateKey = crypto.randomBytes(32).toString('hex');
  const publicKey = crypto.randomBytes(33).toString('hex');
  
  console.log('Address:', address);
  console.log('Private Key:', privateKey);
  console.log('Public Key:', publicKey);
  console.log('Mnemonic:', mnemonic);
  console.log('⚠️  NOTE: This is a demo address. Use proper HD wallet generation in production!');
  console.log('');
  
  return {
    address,
    privateKey,
    publicKey,
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
  
  const hdNode = ethers.HDNodeWallet.fromSeed(seedBuffer);
  const hotWallet = hdNode.deriveChild(0);
  
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
  
  console.log('💰 FUNDING INSTRUCTIONS');
  console.log('=======================');
  console.log('1. Send small amounts to these hot wallets for testing');
  console.log('2. Test deposits and withdrawals with small amounts first');
  console.log('3. Gradually increase amounts as you gain confidence');
  console.log('4. Monitor blockchain transactions regularly');
  console.log('');
  
  return wallets;
}

// Run the generator
if (require.main === module) {
  generateAllHotWallets();
}

module.exports = { generateAllHotWallets };
