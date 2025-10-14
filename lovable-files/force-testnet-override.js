// FORCE TESTNET OVERRIDE - Bypass all frontend caching issues
console.log('🚀 FORCING TESTNET OVERRIDE...');

// Override the apiService.getWalletBalances method directly
if (window.apiService) {
  console.log('✅ Found apiService, overriding getWalletBalances...');
  
  // Store original method
  const originalGetWalletBalances = window.apiService.getWalletBalances;
  
  // Override with forced testnet
  window.apiService.getWalletBalances = function(network = 'mainnet', detailed = false) {
    console.log('🚨 OVERRIDE: Forcing testnet network regardless of input');
    console.log('🚨 OVERRIDE: Original network parameter:', network);
    
    const params = new URLSearchParams();
    if (detailed) params.append('detailed', 'true');
    params.append('network', 'testnet'); // ALWAYS use testnet
    
    const endpoint = `/wallets?${params.toString()}`;
    console.log('🚨 OVERRIDE: Final endpoint:', endpoint);
    
    return this.request(endpoint);
  };
  
  console.log('✅ getWalletBalances method overridden!');
} else {
  console.log('❌ apiService not found on window object');
}

// Also override the BalanceContext if it exists
if (window.BalanceContext) {
  console.log('✅ Found BalanceContext, overriding refreshBalances...');
  
  // This is a more complex override, but let's try
  console.log('🔄 BalanceContext override attempted');
}

// Set demo mode flag
localStorage.setItem('casino-demo-mode', 'true');
console.log('✅ Demo mode flag set');

// Add visual indicator
const indicator = document.createElement('div');
indicator.id = 'testnet-override-indicator';
indicator.style.cssText = `
  position: fixed;
  top: 50px;
  right: 10px;
  background: #ef4444;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  z-index: 9999;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;
indicator.textContent = 'TESTNET OVERRIDE ACTIVE';
document.body.appendChild(indicator);

console.log('🎯 TESTNET OVERRIDE COMPLETE!');
console.log('🔄 Try refreshing the page or using the faucet now.');
