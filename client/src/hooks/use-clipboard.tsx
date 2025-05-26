import { useState, useCallback } from 'react';

interface ClipboardHook {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
}

export function useClipboard(timeout = 2000): ClipboardHook {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, timeout);
      
      return true;
    } catch (error) {
      console.error('Failed to copy text: ', error);
      setCopied(false);
      return false;
    }
  }, [timeout]);

  return { copied, copy };
}
