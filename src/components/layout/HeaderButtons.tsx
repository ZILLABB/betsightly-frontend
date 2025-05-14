import React from 'react';
import { usePreferences } from '../../hooks/usePreferences';

interface HeaderButtonsProps {
  className?: string;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({ className = '' }) => {
  const { preferences, updatePreference } = usePreferences();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreference('theme', theme);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Theme Toggle Buttons */}
      <div className="flex items-center bg-[var(--secondary)] rounded-lg p-0.5 mr-2">
        <button
          onClick={() => handleThemeChange('light')}
          className={`p-1.5 rounded-md transition-colors ${
            preferences.theme === 'light'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
          title="Light Mode"
        >
          <span>☀️</span>
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`p-1.5 rounded-md transition-colors ${
            preferences.theme === 'dark'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
          title="Dark Mode"
        >
          <span>🌙</span>
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`p-1.5 rounded-md transition-colors ${
            preferences.theme === 'system'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
          title="System Theme"
        >
          <span>🖥️</span>
        </button>
      </div>

      {/* Currency Selector */}
      <select
        className="text-xs bg-[var(--secondary)] text-[var(--foreground)] rounded-md px-2 py-1.5 border-none outline-none"
        value={preferences.currency}
        onChange={(e) => updatePreference('currency', e.target.value as any)}
        title="Select Currency"
      >
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="NGN">NGN</option>
      </select>
    </div>
  );
};

export default HeaderButtons;
