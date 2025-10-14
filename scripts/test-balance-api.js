/**
 * Test script to check balance API response
 */

const API_BASE_URL = 'https://casino-backend-production-8186.up.railway.app/api/v1';

async function testBalanceAPI() {
  try {
    console.log('🧪 Testing balance API...\n');
    
    // You'll need to replace this with a valid JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    if (token === 'YOUR_JWT_TOKEN_HERE') {
      console.log('❌ Please replace YOUR_JWT_TOKEN_HERE with a valid JWT token');
      console.log('   You can get this from your browser\'s localStorage or network tab');
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test testnet balances
    console.log('📊 Testing testnet balances...');
    const testnetResponse = await fetch(`${API_BASE_URL}/wallets?network=testnet`, {
      headers
    });
    
    if (!testnetResponse.ok) {
      console.error('❌ Testnet balance request failed:', testnetResponse.status, testnetResponse.statusText);
      const errorText = await testnetResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const testnetBalances = await testnetResponse.json();
    console.log('✅ Testnet balances response:');
    console.log(JSON.stringify(testnetBalances, null, 2));
    
    // Test mainnet balances
    console.log('\n📊 Testing mainnet balances...');
    const mainnetResponse = await fetch(`${API_BASE_URL}/wallets?network=mainnet`, {
      headers
    });
    
    if (!mainnetResponse.ok) {
      console.error('❌ Mainnet balance request failed:', mainnetResponse.status, mainnetResponse.statusText);
      return;
    }
    
    const mainnetBalances = await mainnetResponse.json();
    console.log('✅ Mainnet balances response:');
    console.log(JSON.stringify(mainnetBalances, null, 2));
    
    // Test faucet
    console.log('\n🚰 Testing faucet...');
    const faucetResponse = await fetch(`${API_BASE_URL}/wallets/faucet`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ currency: 'USDC' })
    });
    
    if (!faucetResponse.ok) {
      console.error('❌ Faucet request failed:', faucetResponse.status, faucetResponse.statusText);
      const errorText = await faucetResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const faucetResult = await faucetResponse.json();
    console.log('✅ Faucet response:');
    console.log(JSON.stringify(faucetResult, null, 2));
    
    // Check balances again after faucet
    console.log('\n📊 Checking balances after faucet...');
    const afterFaucetResponse = await fetch(`${API_BASE_URL}/wallets?network=testnet`, {
      headers
    });
    
    if (afterFaucetResponse.ok) {
      const afterFaucetBalances = await afterFaucetResponse.json();
      console.log('✅ Balances after faucet:');
      console.log(JSON.stringify(afterFaucetBalances, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBalanceAPI();
