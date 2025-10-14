// Force testnet balance fetch - bypass all caching issues
console.log('🚀 FORCING TESTNET BALANCE FETCH...');

// Get the JWT token
const token = localStorage.getItem('accessToken');
if (!token) {
  console.error('❌ No JWT token found. Please login first.');
} else {
  console.log('✅ JWT token found, fetching testnet balances...');
  
  // Direct API call to testnet
  fetch('https://casino-backend-production-8186.up.railway.app/api/v1/wallets?network=testnet', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('💰 TESTNET BALANCES:', data);
    if (data && data.length > 0) {
      console.log('🎯 Your testnet funds:');
      data.forEach(wallet => {
        console.log(`  ${wallet.currency}: ${wallet.available} (available) / ${wallet.total} (total)`);
      });
      
      // Force update the global balance context if it exists
      if (window.forceBalanceUpdate) {
        console.log('🔄 Triggering global balance update...');
        window.forceBalanceUpdate(data);
      }
    } else {
      console.log('❌ No testnet balances found');
    }
  })
  .catch(error => {
    console.error('❌ Error fetching testnet balances:', error);
  });
}
