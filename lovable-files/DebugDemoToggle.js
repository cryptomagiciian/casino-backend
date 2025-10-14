// Run this in your browser console to debug the demo toggle
// This will help us understand how your demo toggle works

console.log('🔍 DEBUGGING DEMO TOGGLE...');

// Check for demo-related elements
const demoElements = document.querySelectorAll('*');
const demoRelated = [];

demoElements.forEach(el => {
  if (el.textContent?.includes('Demo') || 
      el.textContent?.includes('demo') ||
      el.classList.toString().includes('demo') ||
      el.getAttribute('class')?.includes('demo')) {
    demoRelated.push({
      element: el,
      text: el.textContent?.trim(),
      classes: el.className,
      href: el.href,
      style: el.style.cssText,
      active: el.classList.contains('active'),
      selected: el.classList.contains('selected')
    });
  }
});

console.log('🎯 Found demo-related elements:', demoRelated);

// Check for orange dots or active indicators
const orangeElements = Array.from(document.querySelectorAll('*')).filter(el => 
  el.style.color?.includes('orange') || 
  el.style.backgroundColor?.includes('orange') ||
  el.classList.toString().includes('orange')
);

console.log('🟠 Found orange elements:', orangeElements);

// Check localStorage
console.log('💾 localStorage casino-demo-mode:', localStorage.getItem('casino-demo-mode'));

// Check URL
console.log('🌐 URL search params:', window.location.search);

// Check for any active toggles
const activeElements = document.querySelectorAll('.active, .selected, [aria-selected="true"]');
console.log('✅ Active elements:', Array.from(activeElements).map(el => ({
  text: el.textContent?.trim(),
  classes: el.className
})));

console.log('🔍 Debug complete!');
