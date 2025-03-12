// Prevent page reload on focus/visibility change
if (typeof window !== 'undefined') {
  window.addEventListener('focus', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);
  
  document.addEventListener('visibilitychange', function(e) {
    if (document.visibilityState === 'visible') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
  
  // Store original reload function
  const originalReload = window.location.reload;
  window.location.reload = function(forcedReload) {
    const stack = new Error().stack || '';
    if (stack.includes('visibilitychange') || stack.includes('focus')) {
      console.log('Prevented automatic reload on window focus');
      return undefined;
    }
    return originalReload.apply(this, [forcedReload]);
  };
  
  console.log('Reload prevention initialized');
} 