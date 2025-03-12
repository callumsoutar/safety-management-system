'use client';

import { useEffect } from 'react';
import { preventReloadOnFocus } from '@/lib/utils/preventReload';

/**
 * Client component that prevents page reloads when the window regains focus.
 */
export default function ReloadPreventer() {
  useEffect(() => {
    // Initialize the reload prevention
    preventReloadOnFocus();
  }, []);

  // This component doesn't render anything
  return null;
} 