import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Settings, Moon, Sun, DollarSign, Key } from 'lucide-react';
import ThemeManager from '../utils/themeManager';
import { usePreferences } from '../hooks/usePreferences';
import { CURRENCY_SYMBOLS } from '../utils/currencyUtils';
import type { Currency } from '../contexts/PreferencesTypes';
import useCurrency from '../hooks/useCurrency';
import ApiKeyForm from '../components/settings/ApiKeyForm';

const SettingsPage: React.FC = () => {
  const { preferences, updatePreference } = usePreferences();
  const { formatUSD } = useCurrency();
  const [apiKey, setApiKey] = useState<string>('');

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('football_data_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Simple function to toggle theme
  const setLightTheme = () => {
    ThemeManager.getInstance().setTheme('light');
  };

  const setDarkTheme = () => {
    ThemeManager.getInstance().setTheme('dark');
  };

  // Function to update currency
  const setCurrency = (currency: Currency) => {
    updatePreference('currency', currency);
  };

  // Function to save API key
  const handleSaveApiKey = async (key: string): Promise<boolean> => {
    try {
      localStorage.setItem('football_data_api_key', key);
      setApiKey(key);
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  };

  // Sample amount to demonstrate currency conversion
  const sampleAmount = 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* API Key Settings Card */}
        <Card className="bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Key size={18} className="mr-2 text-[var(--primary)]" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApiKeyForm onSave={handleSaveApiKey} initialApiKey={apiKey} />
          </CardContent>
        </Card>

        {/* Theme Settings Card */}
        <Card className="bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Settings size={18} className="mr-2 text-[var(--primary)]" />
              Theme Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-4 py-2 rounded-md flex items-center ${
                      preferences.theme === 'light'
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'bg-[var(--secondary)] text-[var(--secondary-foreground)]'
                    }`}
                    onClick={setLightTheme}
                  >
                    <Sun size={14} className="mr-1.5" />
                    Light Mode
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md flex items-center ${
                      preferences.theme === 'dark'
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'bg-[var(--secondary)] text-[var(--secondary-foreground)]'
                    }`}
                    onClick={setDarkTheme}
                  >
                    <Moon size={14} className="mr-1.5" />
                    Dark Mode
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings Card */}
        <Card className="bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign size={18} className="mr-2 text-[var(--primary)]" />
              Currency Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Currency</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CURRENCY_SYMBOLS).map(([currency, symbol]) => (
                    <button
                      key={currency}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        preferences.currency === currency
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'bg-[var(--secondary)] text-[var(--secondary-foreground)]'
                      }`}
                      onClick={() => setCurrency(currency as Currency)}
                    >
                      <span className="mr-1.5">{symbol}</span>
                      {currency}
                    </button>
                  ))}
                </div>

                {/* Currency conversion example */}
                <div className="mt-4 p-3 bg-[var(--secondary)]/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Currency Conversion Example:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-[var(--card)] rounded-lg">
                      <p className="text-xs text-[var(--muted-foreground)]">Original (USD)</p>
                      <p className="text-sm font-bold">${sampleAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-[var(--card)] rounded-lg">
                      <p className="text-xs text-[var(--muted-foreground)]">Converted ({preferences.currency})</p>
                      <p className="text-sm font-bold">{formatUSD(sampleAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;


