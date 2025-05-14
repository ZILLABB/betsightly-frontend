import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createFocusTrap, generateId } from '../../utils/accessibility';

interface AccessibleModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Function to close the modal
   */
  onClose: () => void;

  /**
   * The title of the modal
   */
  title: string;

  /**
   * The content of the modal
   */
  children: React.ReactNode;

  /**
   * The description of the modal for screen readers
   */
  description?: string;

  /**
   * The size of the modal
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Whether to show a close button
   */
  showCloseButton?: boolean;

  /**
   * Whether to close the modal when clicking outside
   */
  closeOnOutsideClick?: boolean;

  /**
   * Whether to close the modal when pressing escape
   */
  closeOnEscape?: boolean;

  /**
   * Additional class names for the modal
   */
  className?: string;
}

/**
 * An accessible modal component that follows WAI-ARIA best practices
 */
const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = '',
}) => {

  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = generateId('modal-title');
  const descriptionId = description ? generateId('modal-description') : undefined;

  // Handle focus trap
  useEffect(() => {
    if (!isOpen) return;

    if (modalRef.current) {
      const focusTrap = createFocusTrap(modalRef as React.RefObject<HTMLElement>);
      const cleanup = focusTrap.activate();

      return () => {
        cleanup?.();
        focusTrap.deactivate();
      };
    }
    return undefined;
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Handle outside click
  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOutsideClick) return;

    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Size styles
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        ref={modalRef}
        className={`bg-[#1A1A27] rounded-xl border border-[#2A2A3C]/20 shadow-xl w-full ${sizeStyles[size]} max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#2A2A3C]/20">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#2A2A3C]/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Description (for screen readers) */}
        {description && (
          <div id={descriptionId} className="sr-only">
            {description}
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A3C]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2A2A3C]/30 hover:bg-[#2A2A3C]/50 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibleModal;
