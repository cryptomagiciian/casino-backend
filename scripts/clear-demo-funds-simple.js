/**
 * Simple script to clear demo funds using fetch API
 */

const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWdvZTVuZjUwMDAwbnExcGRxOWpsdGVyIiwiaGFuZGxlIjoidGVzdHVzZXIxMjM0IiwiZW1haWwiOiJ0ZXN0dXNlcjEyMzRAZ21haWwuY29tIiwiaWF0IjoxNzYwMzE1MDkzLCJleHAiOjE3NjA5MTk4OTN9.lz7Lwxg-sygul-hNPsnpLqFj5KodcQVS0kPeY4iZMu0";

const API_BASE_URL = 'https://casino-backend-production-8186.up.railway.app/api/v1';

async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  console.log(`🌐 ${method} ${endpoint}`);
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseData.message || responseData}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    throw error;
  }
}

async function clearDemoFunds() {
  console.log('🧹 Clearing demo funds using API...');
  
  try {
    // First, let's check current balances
    console.log('📊 Checking current balances...');
    
    try {
      const mainnetBalances = await makeRequest('/wallets?network=mainnet');
      console.log('✅ Current mainnet balances:', mainnetBalances);
    } catch (error) {
      console.log('⚠️ Could not fetch mainnet balances:', error.message);
    }
    
    try {
      const testnetBalances = await makeRequest('/wallets?network=testnet');
      console.log('✅ Current testnet balances:', testnetBalances);
    } catch (error) {
      console.log('⚠️ Could not fetch testnet balances:', error.message);
    }

    // Try to clear demo funds
    console.log('🧹 Clearing demo funds...');
    try {
      const result = await makeRequest('/wallets/clear-demo-funds', 'POST', { confirm: true });
      console.log('✅ Demo funds cleared:', result);
    } catch (error) {
      console.log('⚠️ Could not clear demo funds:', error.message);
      console.log('💡 The endpoint might not be deployed yet. Let\'s try a different approach...');
      
      // Try to get testnet faucet to see if the API is working
      console.log('🧪 Testing faucet API...');
      try {
        const faucetResult = await makeRequest('/wallets/faucet', 'POST', { currency: 'USDC' });
        console.log('✅ Faucet test successful:', faucetResult);
      } catch (faucetError) {
        console.log('❌ Faucet test failed:', faucetError.message);
      }
    }

    // Check balances again
    console.log('📊 Checking balances after clearing...');
    try {
      const newMainnetBalances = await makeRequest('/wallets?network=mainnet');
      console.log('✅ New mainnet balances:', newMainnetBalances);
    } catch (error) {
      console.log('⚠️ Could not fetch new mainnet balances:', error.message);
    }
    
    try {
      const newTestnetBalances = await makeRequest('/wallets?network=testnet');
      console.log('✅ New testnet balances:', newTestnetBalances);
    } catch (error) {
      console.log('⚠️ Could not fetch new testnet balances:', error.message);
    }

    console.log('🎉 Demo funds clearing attempt completed!');
    console.log('💡 If the clear-demo-funds endpoint is not available yet, you can:');
    console.log('   1. Wait for the backend to fully deploy');
    console.log('   2. Use the frontend TestWalletAPI component');
    console.log('   3. Manually clear funds through the web interface');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
clearDemoFunds();
