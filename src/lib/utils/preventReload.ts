/**
 * Utility to prevent page reloads when the window regains focus.
 * This is particularly useful for Next.js applications where
 * development mode might cause unnecessary reloads.
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export function preventReloadOnFocus() {
  if (!isBrowser) return;

  // Store the original reload function
  const originalReload = window.location.reload;

  // Override the reload function
  window.location.reload = function(forcedReload?: boolean) {
    // Check if the reload was triggered by a focus/visibility event
    const stack = new Error().stack || '';
    if (stack.includes('visibilitychange') || stack.includes('focus')) {
      console.log('Prevented automatic reload on window focus');
      return undefined as any;
    }
    
    // Otherwise, use the original reload function
    return originalReload.apply(this, [forcedReload]);
  };

  // Also try to prevent the visibilitychange event from causing reloads
  document.addEventListener('visibilitychange', (e) => {
    if (document.visibilityState === 'visible') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Prevent focus events from causing reloads
  window.addEventListener('focus', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, true);

  console.log('Reload prevention initialized');
} 