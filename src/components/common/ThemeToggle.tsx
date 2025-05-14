import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Moon, Sun, Monitor } from 'lucide-react';
import ThemeManager from '../../utils/themeManager';
import type { ThemeMode } from '../../utils/themeManager';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const [theme, setTheme] = useState<ThemeMode>(ThemeManager.getInstance().getTheme());
  const [isOpen, setIsOpen] = useState(false);

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = ThemeManager.getInstance().subscribe((newTheme) => {
      setTheme(newTheme);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Handle theme change
  const handleThemeChange = (newTheme: ThemeMode) => {
    ThemeManager.getInstance().setTheme(newTheme);
    setIsOpen(false);
  };

  // Get current theme icon
  const getCurrentThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={variant === 'icon' ? 18 : 14} />;
      case 'dark':
        return <Moon size={variant === 'icon' ? 18 : 14} />;
      case 'system':
        return <Monitor size={variant === 'icon' ? 18 : 14} />;
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          aria-label="Toggle theme"
        >
          {getCurrentThemeIcon()}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-card border border-[var(--border)] rounded-md shadow-lg z-50">
            <div className="p-1">
              <button
                className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeChange('light');
                }}
              >
                <Sun size={14} className="mr-2" />
                Light
              </button>
              <button
                className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeChange('dark');
                }}
              >
                <Moon size={14} className="mr-2" />
                Dark
              </button>
              <button
                className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeChange('system');
                }}
              >
                <Monitor size={14} className="mr-2" />
                System
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleThemeChange('light')}
          className="text-xs"
        >
          <Sun size={14} className="mr-1.5" />
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleThemeChange('dark')}
          className="text-xs"
        >
          <Moon size={14} className="mr-1.5" />
          Dark
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleThemeChange('system')}
          className="text-xs"
        >
          <Monitor size={14} className="mr-1.5" />
          System
        </Button>
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-xs"
      >
        {getCurrentThemeIcon()}
        <span className="ml-1.5">
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-card border border-[var(--border)] rounded-md shadow-lg z-50">
          <div className="p-1">
            <button
              className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleThemeChange('light');
              }}
            >
              <Sun size={14} className="mr-2" />
              Light
            </button>
            <button
              className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleThemeChange('dark');
              }}
            >
              <Moon size={14} className="mr-2" />
              Dark
            </button>
            <button
              className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleThemeChange('system');
              }}
            >
              <Monitor size={14} className="mr-2" />
              System
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
