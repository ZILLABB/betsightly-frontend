/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param format Optional format string (default: MM/DD/YYYY)
 * @returns Formatted date string
 */
export const formatDate = (date: Date, format: string = 'MM/DD/YYYY'): string => {
  if (!date) return '';

  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  // Replace format tokens with actual values
  return format
    .replace(/yyyy/g, year.toString())
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds)
    .replace(/M\/D\/YYYY/g, `${parseInt(month)}/${parseInt(day)}/${year}`)
    .replace(/MM\/DD\/YYYY/g, `${month}/${day}/${year}`);
};

/**
 * Format a date with time (MM/DD/YYYY, HH:MM AM/PM)
 * @param date The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
  if (!date) return '';

  const d = new Date(date);
  const dateStr = formatDate(d);

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12

  return `${dateStr}, ${hours}:${minutes} ${ampm}`;
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date The date to compare with current time
 * @returns Relative time string
 */
export const getRelativeTimeString = (date: Date): string => {
  if (!date) return '';

  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `in ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
  } else if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} ${Math.abs(diffInDays) === 1 ? 'day' : 'days'} ago`;
  } else if (diffInHours > 0) {
    return `in ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
  } else if (diffInHours < 0) {
    return `${Math.abs(diffInHours)} ${Math.abs(diffInHours) === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInMins > 0) {
    return `in ${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'}`;
  } else if (diffInMins < 0) {
    return `${Math.abs(diffInMins)} ${Math.abs(diffInMins) === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'just now';
  }
};
