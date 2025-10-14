// AGGRESSIVE TESTNET OVERRIDE - Multiple approaches
console.log('🚀 AGGRESSIVE TESTNET OVERRIDE STARTING...');

// Method 1: Override apiService
if (window.apiService) {
  console.log('✅ Method 1: Overriding apiService.getWalletBalances...');
  
  const originalGetWalletBalances = window.apiService.getWalletBalances;
  window.apiService.getWalletBalances = function(network = 'mainnet', detailed = false) {
    console.log('🚨 OVERRIDE: Forcing testnet network regardless of input');
    
    const params = new URLSearchParams();
    if (detailed) params.append('detailed', 'true');
    params.append('network', 'testnet'); // ALWAYS testnet
    
    const endpoint = `/wallets?${params.toString()}`;
    console.log('🚨 OVERRIDE: Final endpoint:', endpoint);
    
    return this.request(endpoint);
  };
  
  console.log('✅ apiService.getWalletBalances overridden!');
}

// Method 2: Override BalanceContext refreshBalances if accessible
if (window.BalanceContext) {
  console.log('✅ Method 2: Found BalanceContext');
}

// Method 3: Set multiple demo mode flags
localStorage.setItem('casino-demo-mode', 'true');
localStorage.setItem('demo-mode', 'true');
localStorage.setItem('testnet-mode', 'true');
console.log('✅ Multiple demo mode flags set');

// Method 4: Add DOM indicators
document.body.classList.add('demo-mode', 'testnet-mode');
document.body.setAttribute('data-demo-mode', 'true');
document.body.setAttribute('data-testnet-mode', 'true');

// Method 5: Create visual indicator
const indicator = document.createElement('div');
indicator.id = 'aggressive-override-indicator';
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: #dc2626;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  z-index: 99999;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border: 2px solid #fbbf24;
`;
indicator.innerHTML = '🚨 AGGRESSIVE TESTNET OVERRIDE ACTIVE<br/>All balance calls forced to testnet';
document.body.appendChild(indicator);

// Method 6: Test the override immediately
if (window.apiService) {
  console.log('🔄 Method 6: Testing override with immediate fetch...');
  
  setTimeout(() => {
    window.apiService.getWalletBalances().then(data => {
      console.log('💰 OVERRIDE TEST SUCCESS:', data);
      if (data && data.length > 0) {
        console.log('🎯 Your testnet balances:');
        data.forEach(wallet => {
          console.log(`  ${wallet.currency}: ${wallet.available} (available) / ${wallet.total} (total)`);
        });
      }
    }).catch(err => {
      console.error('❌ Override test failed:', err);
    });
  }, 1000);
}

console.log('🎯 AGGRESSIVE OVERRIDE COMPLETE!');
console.log('🔄 Now try using the faucet - it should show testnet funds!');
