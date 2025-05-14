/**
 * Utility functions for accessibility
 */

/**
 * Generate an ID for an element that needs to be referenced by aria attributes
 * @param prefix Prefix for the ID
 * @returns A unique ID
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Handle keyboard navigation for a menu
 * @param event Keyboard event
 * @param itemCount Number of items in the menu
 * @param activeIndex Current active index
 * @param setActiveIndex Function to set the active index
 * @param onSelect Function to call when an item is selected
 */
export const handleMenuKeyDown = (
  event: React.KeyboardEvent,
  itemCount: number,
  activeIndex: number,
  setActiveIndex: (index: number) => void,
  onSelect: () => void
): void => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      setActiveIndex((activeIndex + 1) % itemCount);
      break;
    case 'ArrowUp':
      event.preventDefault();
      setActiveIndex((activeIndex - 1 + itemCount) % itemCount);
      break;
    case 'Home':
      event.preventDefault();
      setActiveIndex(0);
      break;
    case 'End':
      event.preventDefault();
      setActiveIndex(itemCount - 1);
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      onSelect();
      break;
    case 'Escape':
      event.preventDefault();
      // Close the menu
      break;
    default:
      break;
  }
};

/**
 * Create props for a visually hidden element (for screen readers only)
 * @returns Props for a visually hidden element
 */
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
} as const;

/**
 * Check if reduced motion is preferred
 * @returns True if reduced motion is preferred
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if high contrast mode is enabled
 * @returns True if high contrast mode is enabled
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(forced-colors: active)').matches;
};

/**
 * Create a focus trap for modal dialogs
 * @param containerRef Reference to the container element
 * @returns Functions to activate and deactivate the focus trap
 */
export const createFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  let previouslyFocusedElement: HTMLElement | null = null;

  const activate = () => {
    // Save the currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement;

    // Find all focusable elements in the container
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    // Focus the first element
    (focusableElements[0] as HTMLElement).focus();

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // If shift+tab and focus is on first element, move to last element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // If tab and focus is on last element, move to first element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const deactivate = () => {
    // Restore focus to the previously focused element
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  };

  return { activate, deactivate };
};

/**
 * Create a live region for announcements
 * @param ariaLive The aria-live value (polite or assertive)
 * @returns Functions to announce messages
 */
export const createLiveRegion = (ariaLive: 'polite' | 'assertive' = 'polite') => {
  // Create a live region element if it doesn't exist
  let liveRegion = document.getElementById(`live-region-${ariaLive}`);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = `live-region-${ariaLive}`;
    liveRegion.setAttribute('aria-live', ariaLive);
    liveRegion.setAttribute('aria-relevant', 'additions');
    liveRegion.setAttribute('aria-atomic', 'true');
    
    // Hide visually but keep available to screen readers
    Object.assign(liveRegion.style, visuallyHidden);
    
    document.body.appendChild(liveRegion);
  }
  
  const announce = (message: string) => {
    // Clear the live region first
    liveRegion!.textContent = '';
    
    // Set the message after a small delay to ensure it's announced
    setTimeout(() => {
      liveRegion!.textContent = message;
    }, 50);
  };
  
  return { announce };
};
