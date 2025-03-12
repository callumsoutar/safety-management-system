'use client';

import { useEffect } from 'react';

/**
 * This component prevents the page from reloading when the window regains focus.
 * It works by intercepting the 'visibilitychange' event and preventing the default
 * behavior if it would cause a reload.
 */
export default function PreventReload() {
  useEffect(() => {
    // Function to prevent page reload on visibility change
    const handleVisibilityChange = (event: Event) => {
      // If the page is becoming visible again
      if (document.visibilityState === 'visible') {
        // Prevent any default behavior that might cause a reload
        event.preventDefault();
      }
    };

    // Function to prevent page reload on focus
    const handleFocus = (event: Event) => {
      event.preventDefault();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // This is for when the page is restored from the bfcache
        event.preventDefault();
      }
    }, true);

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