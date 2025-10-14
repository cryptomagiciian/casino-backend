/**
 * Script to clear demo funds using the API endpoint
 * This requires authentication, so you'll need to provide a valid JWT token
 */

const https = require('https');

// You need to get a JWT token by logging in first
// Replace this with your actual JWT token
const JWT_TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

const API_BASE_URL = 'https://casino-backend-production-8186.up.railway.app/api/v1';

function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || responseData}`));
          }
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function clearDemoFunds() {
  console.log('🧹 Clearing demo funds using API...');
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('❌ Please set JWT_TOKEN environment variable or update the script with your token');
    console.log('💡 To get a token:');
    console.log('   1. Login to your casino app');
    console.log('   2. Open browser dev tools');
    console.log('   3. Go to Application/Storage > Local Storage');
    console.log('   4. Copy the "accessToken" value');
    console.log('   5. Set it as JWT_TOKEN environment variable');
    return;
  }

  try {
    // First, let's check current balances
    console.log('📊 Checking current balances...');
    const balances = await makeRequest('/wallets?network=mainnet');
    console.log('Current mainnet balances:', balances);
    
    const testnetBalances = await makeRequest('/wallets?network=testnet');
    console.log('Current testnet balances:', testnetBalances);

    // Clear demo funds
    console.log('🧹 Clearing demo funds...');
    const result = await makeRequest('/wallets/clear-demo-funds', 'POST', { confirm: true });
    console.log('✅ Demo funds cleared:', result);

    // Check balances again
    console.log('📊 Checking balances after clearing...');
    const newBalances = await makeRequest('/wallets?network=mainnet');
    console.log('New mainnet balances:', newBalances);
    
    const newTestnetBalances = await makeRequest('/wallets?network=testnet');
    console.log('New testnet balances:', newTestnetBalances);

    console.log('🎉 Demo funds cleared successfully!');
    console.log('💡 Now switch to testnet mode and use the faucet to get testnet tokens.');

  } catch (error) {
    console.error('❌ Error clearing demo funds:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 Authentication failed. Please check your JWT token.');
    } else if (error.message.includes('404')) {
      console.log('💡 API endpoint not found. Make sure the backend is deployed.');
    }
  }
}

// Run the script
clearDemoFunds();
