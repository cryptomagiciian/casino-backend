/**
 * Debug script to check wallet balances in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function debugBalance() {
  try {
    console.log('🔍 Debugging wallet balances...\n');
    
    // Get all wallet accounts
    const accounts = await prisma.walletAccount.findMany({
      where: {
        network: 'testnet'
      },
      include: {
        ledgerEntries: true
      }
    });
    
    console.log(`📊 Found ${accounts.length} testnet wallet accounts:\n`);
    
    for (const account of accounts) {
      console.log(`👤 User: ${account.userId}`);
      console.log(`💰 Currency: ${account.currency}`);
      console.log(`🌐 Network: ${account.network}`);
      console.log(`💵 Available (DB): ${account.available.toString()}`);
      console.log(`🔒 Locked (DB): ${account.locked.toString()}`);
      console.log(`📈 Total (DB): ${(account.available + account.locked).toString()}`);
      
      // Calculate balance from ledger entries
      const ledgerSum = account.ledgerEntries.reduce((sum, entry) => {
        return sum + entry.amount;
      }, 0n);
      
      console.log(`📋 Ledger Sum: ${ledgerSum.toString()}`);
      console.log(`📋 Ledger Entries: ${account.ledgerEntries.length}`);
      
      // Show recent ledger entries
      if (account.ledgerEntries.length > 0) {
        console.log('📝 Recent ledger entries:');
        account.ledgerEntries.slice(-5).forEach(entry => {
          console.log(`   ${entry.type}: ${entry.amount.toString()} (${entry.createdAt.toISOString()})`);
        });
      }
      
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBalance();
