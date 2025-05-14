import { useEffect, useCallback } from 'react';

type KeyboardShortcutOptions = {
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  disabled?: boolean;
};

/**
 * Hook to handle keyboard shortcuts
 * @param key The key to listen for
 * @param callback The function to call when the key is pressed
 * @param options Options for the keyboard shortcut
 * @returns void
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const { alt = false, ctrl = false, shift = false, meta = false, disabled = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if the key and modifiers match
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const altMatches = event.altKey === alt;
      const ctrlMatches = event.ctrlKey === ctrl;
      const shiftMatches = event.shiftKey === shift;
      const metaMatches = event.metaKey === meta;

      // If all conditions match, call the callback
      if (keyMatches && altMatches && ctrlMatches && shiftMatches && metaMatches) {
        callback(event);
      }
    },
    [key, alt, ctrl, shift, meta, callback]
  );

  useEffect(() => {
    // Don't add the event listener if the shortcut is disabled
    if (disabled) return;

    // Add the event listener
    document.addEventListener('keydown', handleKeyDown);

    // Remove the event listener on cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);
}
