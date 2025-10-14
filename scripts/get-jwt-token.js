/**
 * Script to help you get a JWT token for API calls
 * This will show you how to get the token from your browser
 */

console.log('🔑 How to get your JWT token:');
console.log('');
console.log('1. 🌐 Open your casino app in the browser');
console.log('2. 🔐 Login with your credentials');
console.log('3. 🛠️  Open Developer Tools (F12)');
console.log('4. 📱 Go to Application tab (Chrome) or Storage tab (Firefox)');
console.log('5. 🗄️  Click on "Local Storage" in the left sidebar');
console.log('6. 🎯 Click on your domain (e.g., localhost:3000 or your deployed URL)');
console.log('7. 🔍 Look for "accessToken" in the list');
console.log('8. 📋 Copy the value (it should start with "eyJ")');
console.log('');
console.log('💡 Then run:');
console.log('   JWT_TOKEN=your_token_here node scripts/clear-demo-funds-api.js');
console.log('');
console.log('🔗 Or set it as an environment variable:');
console.log('   export JWT_TOKEN=your_token_here');
console.log('   node scripts/clear-demo-funds-api.js');
console.log('');
console.log('🌐 Your casino app URL:');
console.log('   https://casino-backend-production-8186.up.railway.app');
console.log('');
console.log('📝 Example token (starts with eyJ):');
console.log('   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
