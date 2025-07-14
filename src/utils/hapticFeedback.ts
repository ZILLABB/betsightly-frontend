/**
 * Haptic Feedback Utilities
 * 
 * Provides vibration feedback for mobile devices to enhance user experience
 */

export enum HapticFeedbackType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection'
}

interface HapticPattern {
  pattern: number[];
  description: string;
}

// Vibration patterns for different feedback types
const HAPTIC_PATTERNS: Record<HapticFeedbackType, HapticPattern> = {
  [HapticFeedbackType.LIGHT]: {
    pattern: [10],
    description: 'Light tap feedback'
  },
  [HapticFeedbackType.MEDIUM]: {
    pattern: [20],
    description: 'Medium tap feedback'
  },
  [HapticFeedbackType.HEAVY]: {
    pattern: [30],
    description: 'Heavy tap feedback'
  },
  [HapticFeedbackType.SUCCESS]: {
    pattern: [10, 50, 10],
    description: 'Success confirmation'
  },
  [HapticFeedbackType.WARNING]: {
    pattern: [20, 100, 20],
    description: 'Warning notification'
  },
  [HapticFeedbackType.ERROR]: {
    pattern: [50, 100, 50, 100, 50],
    description: 'Error notification'
  },
  [HapticFeedbackType.SELECTION]: {
    pattern: [5],
    description: 'Selection feedback'
  }
};

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

/**
 * Check if the device is mobile (where haptic feedback is most relevant)
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if haptic feedback should be enabled
 */
export const shouldEnableHaptic = (): boolean => {
  return isHapticSupported() && isMobileDevice();
};

/**
 * Trigger haptic feedback
 */
export const triggerHaptic = (type: HapticFeedbackType = HapticFeedbackType.LIGHT): void => {
  if (!shouldEnableHaptic()) {
    return;
  }

  try {
    const pattern = HAPTIC_PATTERNS[type];
    navigator.vibrate(pattern.pattern);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

/**
 * Trigger custom haptic pattern
 */
export const triggerCustomHaptic = (pattern: number[]): void => {
  if (!shouldEnableHaptic()) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Custom haptic feedback failed:', error);
  }
};

/**
 * Stop any ongoing vibration
 */
export const stopHaptic = (): void => {
  if (!isHapticSupported()) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.warn('Stop haptic failed:', error);
  }
};

/**
 * React hook for haptic feedback
 */
export const useHapticFeedback = () => {
  const triggerFeedback = (type: HapticFeedbackType = HapticFeedbackType.LIGHT) => {
    triggerHaptic(type);
  };

  const triggerCustomFeedback = (pattern: number[]) => {
    triggerCustomHaptic(pattern);
  };

  const stopFeedback = () => {
    stopHaptic();
  };

  return {
    triggerFeedback,
    triggerCustomFeedback,
    stopFeedback,
    isSupported: shouldEnableHaptic(),
    patterns: HAPTIC_PATTERNS
  };
};

/**
 * Haptic feedback for common UI interactions
 */
export const HapticInteractions = {
  // Button interactions
  buttonPress: () => triggerHaptic(HapticFeedbackType.LIGHT),
  buttonLongPress: () => triggerHaptic(HapticFeedbackType.MEDIUM),
  
  // Navigation
  tabSwitch: () => triggerHaptic(HapticFeedbackType.SELECTION),
  pageTransition: () => triggerHaptic(HapticFeedbackType.LIGHT),
  
  // Feedback
  success: () => triggerHaptic(HapticFeedbackType.SUCCESS),
  error: () => triggerHaptic(HapticFeedbackType.ERROR),
  warning: () => triggerHaptic(HapticFeedbackType.WARNING),
  
  // Interactions
  cardTap: () => triggerHaptic(HapticFeedbackType.LIGHT),
  swipeAction: () => triggerHaptic(HapticFeedbackType.MEDIUM),
  pullToRefresh: () => triggerHaptic(HapticFeedbackType.MEDIUM),
  
  // Data actions
  refresh: () => triggerHaptic(HapticFeedbackType.LIGHT),
  copy: () => triggerHaptic(HapticFeedbackType.SUCCESS),
  share: () => triggerHaptic(HapticFeedbackType.LIGHT),
};

export default {
  HapticFeedbackType,
  isHapticSupported,
  isMobileDevice,
  shouldEnableHaptic,
  triggerHaptic,
  triggerCustomHaptic,
  stopHaptic,
  useHapticFeedback,
  HapticInteractions
};
