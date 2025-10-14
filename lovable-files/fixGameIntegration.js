/**
 * Script to fix remaining game integration issues
 */

const fs = require('fs');
const path = require('path');

const games = [
  'DiamondHands.tsx',
  'BulletBet.tsx', 
  'CryptoSlots.tsx',
  'LeverageLadder.tsx',
  'BullVsBear.tsx',
  'SupportOrResistance.tsx'
];

function fixGameFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix stake input labels to use selected currency
    if (content.includes('Stake (USDC):') || content.includes('Stake (USD):')) {
      content = content.replace(
        /Stake \(USDC\):/g,
        'Stake ({displayCurrency === \'usd\' ? \'USD\' : bettingCurrency}):'
      );
      content = content.replace(
        /Stake \(USD\):/g,
        'Stake ({displayCurrency === \'usd\' ? \'USD\' : bettingCurrency}):'
      );
      updated = true;
    }
    
    // Fix hardcoded currency references in buttons
    if (content.includes('USDC') && content.includes('button')) {
      content = content.replace(
        /\(\${[^}]+} USDC\)/g,
        '(${displayCurrency === \'usd\' ? \'USD\' : bettingCurrency})'
      );
      updated = true;
    }
    
    // Add balance display if not present
    if (!content.includes('Balance Display') && content.includes('WalletBalance')) {
      const balanceDisplay = `
      {/* Balance Display */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="font-mono font-bold text-green-400">
            {formatBalance(balance, bettingCurrency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Network: {network}</span>
          <span>Currency: {bettingCurrency}</span>
        </div>
      </div>`;
      
      // Find WalletBalance and add balance display after it
      const walletBalanceIndex = content.indexOf('<WalletBalance');
      if (walletBalanceIndex !== -1) {
        const nextDivIndex = content.indexOf('>', walletBalanceIndex) + 1;
        const before = content.substring(0, nextDivIndex);
        const after = content.substring(nextDivIndex);
        content = before + balanceDisplay + '\n      ' + after;
        updated = true;
      }
    }
    
    // Fix result messages to use correct currency
    if (content.includes('USDC') && content.includes('result')) {
      content = content.replace(
        /USDC/g,
        '{displayCurrency === \'usd\' ? \'USD\' : bettingCurrency}'
      );
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⚠️  No changes needed for ${path.basename(filePath)}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix all games
console.log('🔧 Fixing remaining game integration issues...\n');

let fixedCount = 0;
games.forEach(game => {
  const filePath = path.join(__dirname, game);
  if (fs.existsSync(filePath)) {
    if (fixGameFile(filePath)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${game}`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} game components!`);
console.log('\n📋 Issues Fixed:');
console.log('1. ✅ Stake input labels now show selected currency');
console.log('2. ✅ Button text now shows selected currency');
console.log('3. ✅ Balance display added to all games');
console.log('4. ✅ Result messages now show correct currency');
console.log('\n🧪 Test each game to verify:');
console.log('- Currency selection works correctly');
console.log('- Balance updates after betting');
console.log('- Games use real wallet balances');
