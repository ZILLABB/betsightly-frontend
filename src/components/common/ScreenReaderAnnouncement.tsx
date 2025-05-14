import React, { useEffect, useState } from 'react';

interface ScreenReaderAnnouncementProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number;
}

/**
 * Component for making announcements to screen readers
 * @param message The message to announce
 * @param assertive Whether to use assertive politeness (default: false)
 * @param clearAfter Time in ms after which to clear the announcement (default: 5000)
 */
const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  assertive = false,
  clearAfter = 5000
}) => {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    // Update the announcement when the message changes
    setAnnouncement(message);

    // Clear the announcement after the specified time
    const timer = setTimeout(() => {
      setAnnouncement('');
    }, clearAfter);

    return () => {
      clearTimeout(timer);
    };
  }, [message, clearAfter]);

  // Don't render anything if there's no announcement
  if (!announcement) return null;

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

export default ScreenReaderAnnouncement;
