import React, { useMemo } from 'react';
import useCurrency from '../../hooks/useCurrency';
import type { Currency } from '../../contexts/PreferencesTypes';

interface CurrencyDisplayProps {
  amount: number;
  currency?: Currency;
  originalCurrency?: Currency;
  showOriginal?: boolean;
  compact?: boolean;
  className?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * A component for displaying currency values with automatic conversion
 * based on the user's preferred currency.
 */
const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  originalCurrency = 'USD',
  showOriginal = false,
  compact = false,
  className = '',
  minimumFractionDigits,
  maximumFractionDigits
}) => {
  const { 
    currency: userCurrency, 
    formatUSD, 
    convertBetween, 
    format, 
    formatWithCurrency 
  } = useCurrency();
  
  // Determine which currency to display
  const displayCurrency = currency || userCurrency;
  
  // Format options
  const options = useMemo(() => ({
    minimumFractionDigits,
    maximumFractionDigits,
    compact
  }), [minimumFractionDigits, maximumFractionDigits, compact]);
  
  // If the original currency is USD, use formatUSD
  // Otherwise, convert from the original currency to the display currency
  const formattedAmount = useMemo(() => {
    if (originalCurrency === 'USD') {
      return formatUSD(amount, options);
    } else if (displayCurrency === originalCurrency) {
      return format(amount, options);
    } else {
      const convertedAmount = convertBetween(amount, originalCurrency, displayCurrency);
      return formatWithCurrency(convertedAmount, displayCurrency, options);
    }
  }, [amount, originalCurrency, displayCurrency, formatUSD, format, convertBetween, formatWithCurrency, options]);
  
  // If showOriginal is true and the currencies are different, show both
  const showBoth = showOriginal && originalCurrency !== displayCurrency;
  
  if (showBoth) {
    const originalFormatted = formatWithCurrency(amount, originalCurrency, options);
    
    return (
      <span className={className}>
        {formattedAmount}
        <span className="text-[var(--muted-foreground)] text-xs ml-1">
          ({originalFormatted})
        </span>
      </span>
    );
  }
  
  return <span className={className}>{formattedAmount}</span>;
};

export default CurrencyDisplay;
