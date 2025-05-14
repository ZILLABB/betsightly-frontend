import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus within a container
 * @param active Whether the focus trap is active
 * @param containerRef Reference to the container element
 * @param initialFocusRef Reference to the element that should receive focus initially
 * @returns void
 */
export function useFocusTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement>,
  initialFocusRef?: React.RefObject<HTMLElement>
): void {
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the currently focused element so we can restore it later
    previousActiveElement.current = document.activeElement;

    // Focus the initial element if provided, otherwise focus the container
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (containerRef.current) {
      containerRef.current.focus();
    }

    // Function to handle keydown events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current || event.key !== 'Tab') return;

      // Get all focusable elements in the container
      const focusableElements = containerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // If shift+tab and focus is on first element, move to last element
      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
      // If tab and focus is on last element, move to first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously active element
      if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus();
      }
    };
  }, [active, containerRef, initialFocusRef]);
}
