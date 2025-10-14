// Bypass Cache Test - Run this in browser console
console.log('🔧 Testing if testnet funds exist by bypassing the problematic API method...');

// Get the current token
const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
console.log('🔑 Token found:', token ? 'Yes' : 'No');

if (!token) {
  console.log('❌ No authentication token found. Please log in first.');
} else {
  // Test the backend directly with a simple fetch
  console.log('🧪 Testing backend directly...');
  
  // Create a simple test function
  async function testTestnetBalances() {
    try {
      const response = await fetch('https://casino-backend-production-8186.up.railway.app/api/v1/wallets?network=testnet', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Testnet balances received:', data);
        
        if (data && data.length > 0) {
          console.log('💰 Your testnet funds:');
          let totalValue = 0;
          data.forEach(wallet => {
            const available = parseFloat(wallet.available);
            console.log(`  ${wallet.currency}: ${wallet.available} (available), ${wallet.locked} (locked)`);
            totalValue += available;
          });
          console.log(`💵 Total testnet value: ${totalValue}`);
        } else {
          console.log('❌ No testnet balances found - faucet may not be working');
        }
      } else {
        console.log('❌ Backend error:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
  
  // Run the test
  testTestnetBalances();
}
