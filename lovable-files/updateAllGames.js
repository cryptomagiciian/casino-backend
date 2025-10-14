/**
 * Script to update all game components to use the new betting system
 * This script will update all games to use real wallet balances
 */

const fs = require('fs');
const path = require('path');

const games = [
  'ToTheMoon.tsx',
  'DiamondHands.tsx', 
  'BulletBet.tsx',
  'CryptoSlots.tsx',
  'LeverageLadder.tsx',
  'BullVsBear.tsx',
  'SupportOrResistance.tsx'
];

const gameUpdates = {
  // Common imports to replace
  imports: {
    old: `import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';`,
    new: `import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';`
  },
  
  // Common hooks to add
  hooks: {
    old: `const { fetchBalances } = useWallet();`,
    new: `const { placeBet, resolveBet, getBalance, isBetting, error } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, displayCurrency, formatBalance } = useCurrency();
  const [balance, setBalance] = useState<number>(0);`
  },
  
  // Balance refresh function
  balanceRefresh: `// Refresh balance when network or currency changes
  useEffect(() => {
    refreshBalance();
  }, [network, bettingCurrency]);

  const refreshBalance = async () => {
    try {
      const currentBalance = await getBalance(bettingCurrency);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };`,
  
  // Bet placement pattern
  betPlacement: {
    old: `const bet = await apiService.placeBet({`,
    new: `// Check if user has sufficient balance
    if (balance < parseFloat(stake)) {
      setResult('❌ Insufficient balance!');
      setIsPlaying(false);
      return;
    }

    const bet = await placeBet({`
  },
  
  // Bet resolution pattern
  betResolution: {
    old: `const resolved = await apiService.resolveBet(betId);
    await fetchBalances();`,
    new: `const resolved = await resolveBet(betId);
    await refreshBalance();`
  }
};

function updateGameFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update imports
    if (content.includes("import { apiService } from '../services/api'")) {
      content = content.replace(
        /import { apiService } from '\.\.\/services\/api';\s*import { useWallet } from '\.\.\/hooks\/useWallet';/g,
        gameUpdates.imports.new
      );
      updated = true;
    }
    
    // Update hooks
    if (content.includes('const { fetchBalances } = useWallet();')) {
      content = content.replace(
        /const { fetchBalances } = useWallet\(\);/g,
        gameUpdates.hooks.new
      );
      updated = true;
    }
    
    // Add balance refresh function
    if (!content.includes('refreshBalance') && content.includes('useEffect')) {
      // Find the first useEffect and add balance refresh before it
      const useEffectIndex = content.indexOf('useEffect(');
      if (useEffectIndex !== -1) {
        const beforeUseEffect = content.substring(0, useEffectIndex);
        const afterUseEffect = content.substring(useEffectIndex);
        content = beforeUseEffect + gameUpdates.balanceRefresh + '\n\n  ' + afterUseEffect;
        updated = true;
      }
    }
    
    // Update bet placement
    if (content.includes('await apiService.placeBet({')) {
      content = content.replace(
        /const bet = await apiService\.placeBet\(\{/g,
        gameUpdates.betPlacement.new
      );
      updated = true;
    }
    
    // Update bet resolution
    if (content.includes('await apiService.resolveBet(')) {
      content = content.replace(
        /const resolved = await apiService\.resolveBet\([^)]+\);\s*await fetchBalances\(\);/g,
        gameUpdates.betResolution.new
      );
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⚠️  No changes needed for ${path.basename(filePath)}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Update all games
console.log('🎮 Updating all game components to use real wallet balances...\n');

let updatedCount = 0;
games.forEach(game => {
  const filePath = path.join(__dirname, game);
  if (fs.existsSync(filePath)) {
    if (updateGameFile(filePath)) {
      updatedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${game}`);
  }
});

console.log(`\n🎉 Updated ${updatedCount} game components!`);
console.log('\n📋 Manual updates still needed:');
console.log('1. Add balance display UI to each game');
console.log('2. Update stake input labels to show selected currency');
console.log('3. Update result messages to show correct currency');
console.log('4. Add network and currency indicators');
console.log('5. Test each game to ensure balance updates work correctly');
