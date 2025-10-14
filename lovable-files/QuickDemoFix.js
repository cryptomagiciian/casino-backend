// Run this in your browser console to force demo mode immediately
// This will make the balance API use testnet

console.log('🔧 QUICK DEMO FIX - Forcing demo mode...');

// Method 1: Set localStorage flag
localStorage.setItem('casino-demo-mode', 'true');

// Method 2: Add demo indicator to the page
const demoIndicator = document.createElement('div');
demoIndicator.setAttribute('data-demo-mode', 'true');
demoIndicator.style.display = 'none';
document.body.appendChild(demoIndicator);

// Method 3: Add demo class to body
document.body.classList.add('demo-mode');

// Method 4: Add demo class to the demo toggle element
const demoElements = document.querySelectorAll('*');
demoElements.forEach(el => {
  if (el.textContent?.includes('• Demo')) {
    el.classList.add('demo', 'active');
    el.setAttribute('data-demo', 'true');
    console.log('🎯 Found demo element:', el);
  }
});

console.log('✅ Demo mode forced! Balance API will now use testnet.');
console.log('🔄 Refresh the page to see the changes.');

// Test the detection
setTimeout(() => {
  const isDemo = localStorage.getItem('casino-demo-mode') === 'true' ||
                document.querySelector('[data-demo-mode="true"]') !== null ||
                document.body.classList.contains('demo-mode');
  console.log('🧪 Demo mode check:', isDemo);
}, 1000);
