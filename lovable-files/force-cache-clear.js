// FORCE CACHE CLEAR - Nuclear option
console.log('🚀 FORCING CACHE CLEAR - NUCLEAR OPTION...');

// Method 1: Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log('🗑️ Deleted cache:', name);
    });
  });
}

// Method 2: Clear localStorage
localStorage.clear();
console.log('🗑️ Cleared localStorage');

// Method 3: Clear sessionStorage
sessionStorage.clear();
console.log('🗑️ Cleared sessionStorage');

// Method 4: Set demo mode flag
localStorage.setItem('casino-demo-mode', 'true');
console.log('✅ Set demo mode flag');

// Method 5: Force reload with cache bypass
console.log('🔄 Reloading page with cache bypass...');
window.location.reload(true);

// If reload doesn't work, try this:
// window.location.href = window.location.href + '?cache-bust=' + Date.now();
