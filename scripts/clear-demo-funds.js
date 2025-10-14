/**
 * Script to clear old demo funds from the database
 * This will reset all wallet accounts to 0 balance
 * Run this after implementing the new network-specific system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDemoFunds() {
  console.log('🧹 Clearing old demo funds from database...');
  
  try {
    // Reset all wallet accounts to 0 balance
    const result = await prisma.walletAccount.updateMany({
      data: {
        available: 0n,
        locked: 0n,
      },
    });
    
    console.log(`✅ Reset ${result.count} wallet accounts to 0 balance`);
    
    // Also clear any old ledger entries that might be causing issues
    const ledgerResult = await prisma.ledgerEntry.deleteMany({
      where: {
        type: 'FAUCET',
        meta: {
          path: ['faucet'],
          equals: true,
        },
      },
    });
    
    console.log(`✅ Cleared ${ledgerResult.count} old faucet ledger entries`);
    
    console.log('🎉 Demo funds cleared! Users will now start with 0 balance on both networks.');
    console.log('💡 Users can get testnet tokens from the faucet when in testnet mode.');
    
  } catch (error) {
    console.error('❌ Error clearing demo funds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDemoFunds();
