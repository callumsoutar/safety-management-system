'use client';

import { useEffect } from 'react';

export default function ClientReloadPreventer() {
  useEffect(() => {
    // Function to prevent page reload on visibility change
    const handleVisibilityChange = (event: Event) => {
      // If the page is becoming visible again
      if (document.visibilityState === 'visible') {
        // Prevent any default behavior that might cause a reload
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Function to prevent page reload on focus
    const handleFocus = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    // Store original reload function
    const originalReload = window.location.reload;
    window.location.reload = function(forcedReload?: boolean) {
      const stack = new Error().stack || '';
      if (stack.includes('visibilitychange') || stack.includes('focus')) {
        console.log('Prevented automatic reload on window focus');
        return undefined as any;
      }
      return originalReload.apply(this, [forcedReload]);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // This is for when the page is restored from the bfcache
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);

    console.log('Reload prevention initialized');

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('pageshow', handleFocus, true);
    };
  }, []);

  // This component doesn't render anything
  return null;
} 