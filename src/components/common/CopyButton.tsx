import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  successMessage?: string;
  className?: string;
  iconClassName?: string;
  successIconClassName?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  successMessage = "Copied!",
  className,
  iconClassName,
  successIconClassName,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShowTooltip(true);

      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = successMessage;
      document.body.appendChild(announcement);

      // Hide tooltip after 2 seconds
      setTimeout(() => {
        setShowTooltip(false);
        // Reset copied state after tooltip is hidden
        setTimeout(() => setCopied(false), 300);
        // Remove the announcement after it's been read
        document.body.removeChild(announcement);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);

      // Announce error to screen readers
      const errorAnnouncement = document.createElement('div');
      errorAnnouncement.setAttribute('role', 'alert');
      errorAnnouncement.setAttribute('aria-live', 'assertive');
      errorAnnouncement.className = 'sr-only';
      errorAnnouncement.textContent = 'Failed to copy to clipboard';
      document.body.appendChild(errorAnnouncement);

      // Remove the error announcement after it's been read
      setTimeout(() => {
        document.body.removeChild(errorAnnouncement);
      }, 3000);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          copied
            ? "bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20"
            : "bg-[#2A2A3C]/30 text-[#A1A1AA] hover:bg-[#2A2A3C]/50 hover:text-white",
          className
        )}
        aria-label={copied ? successMessage : "Copy to clipboard"}
        {...props}
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-4 h-4", successIconClassName)}
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-4 h-4", iconClassName)}
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#1A1A27] text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          {successMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#1A1A27]"></div>
        </div>
      )}
    </div>
  );
};

export default CopyButton;
