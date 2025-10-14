// Force Demo Mode - Run this in browser console
console.log('🔧 Forcing demo mode...');

// Set localStorage flag
localStorage.setItem('casino-demo-mode', 'true');

// Add DOM indicator
const demoIndicator = document.createElement('div');
demoIndicator.setAttribute('data-demo-mode', 'true');
demoIndicator.style.display = 'none';
document.body.appendChild(demoIndicator);

// Add body class
document.body.classList.add('demo-mode');

// Add orange demo indicator
const orangeDemo = document.createElement('div');
orangeDemo.className = 'text-orange-500';
orangeDemo.style.display = 'none';
orangeDemo.textContent = 'Demo Mode Active';
document.body.appendChild(orangeDemo);

console.log('✅ Demo mode forced! Refresh the page or trigger a balance refresh.');
console.log('🧪 You can now use the faucet and balances should show testnet funds.');

// Trigger a balance refresh
if (window.location.reload) {
  console.log('🔄 Refreshing page to apply demo mode...');
  setTimeout(() => window.location.reload(), 1000);
}
