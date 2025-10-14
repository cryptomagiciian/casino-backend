// Enable demo mode immediately
console.log('🚀 ENABLING DEMO MODE...');

// Set the demo mode flag
localStorage.setItem('casino-demo-mode', 'true');

// Verify it was set
const demoMode = localStorage.getItem('casino-demo-mode');
console.log('✅ Demo mode set to:', demoMode);

// Add visual indicator
document.body.classList.add('demo-mode');
document.body.setAttribute('data-demo-mode', 'true');

// Create a visible indicator
const indicator = document.createElement('div');
indicator.id = 'demo-mode-indicator';
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: #10b981;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  z-index: 9999;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;
indicator.textContent = 'DEMO MODE';
document.body.appendChild(indicator);

console.log('🎯 Demo mode enabled! The balance API should now use testnet.');
console.log('🔄 Try refreshing the page or using the faucet again.');
