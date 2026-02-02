/**
 * Client-side hook to trigger email processing
 * Runs in background when users are active on the site
 * 
 * This ensures emails get sent even without cron jobs!
 */

import { useEffect, useRef } from 'react';

export function useEmailTrigger() {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger once per session
    if (hasTriggered.current) return;
    
    // Wait a bit after page load (don't block initial render)
    const timer = setTimeout(() => {
      fetch('/api/email/trigger', { method: 'GET' })
        .then(() => {
          hasTriggered.current = true;
        })
        .catch(() => {
          // Silent fail - non-critical
        });
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []);
}
