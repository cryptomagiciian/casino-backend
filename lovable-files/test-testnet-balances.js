// Test Testnet Balances - Run this in browser console
console.log('🧪 Testing testnet balances directly...');

// Test the new getTestnetBalances method
fetch('https://casino-backend-production-8186.up.railway.app/api/v1/wallets?network=testnet', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Testnet balances received:', data);
  if (data && data.length > 0) {
    console.log('💰 Available balances:');
    data.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.available} (available), ${wallet.locked} (locked)`);
    });
  } else {
    console.log('❌ No testnet balances found');
  }
})
.catch(error => {
  console.error('❌ Error fetching testnet balances:', error);
});

// Also test the regular method
console.log('🧪 Testing regular getWalletBalances method...');
fetch('https://casino-backend-production-8186.up.railway.app/api/v1/wallets?network=testnet', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Regular method testnet balances:', data);
})
.catch(error => {
  console.error('❌ Error with regular method:', error);
});
