import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Settings, Moon, Sun, DollarSign, Database } from 'lucide-react';
import ThemeManager from '../utils/themeManager';
import { usePreferences } from '../hooks/usePreferences';
import { CURRENCY_SYMBOLS } from '../utils/currencyUtils';
import type { Currency } from '../contexts/PreferencesTypes';
import useCurrency from '../hooks/useCurrency';

const SettingsPage: React.FC = () => {
  const { preferences, updatePreference } = usePreferences();
  const { formatUSD } = useCurrency();

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

  // Sample amount to demonstrate currency conversion
  const sampleAmount = 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Data Settings Card */}
        <Card className="bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Database size={18} className="mr-2 text-[var(--primary)]" />
              Prediction Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prediction Categories</label>
                <div className="p-3 bg-[var(--secondary)]/10 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">2 Odds Predictions</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Target: 2.0 odds</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">5 Odds Predictions</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Target: 5.0 odds</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">10 Odds Predictions</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Target: 10.0 odds</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">10-Day Rollover</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Target: 3.0 odds per day</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confidence Threshold</label>
                <div className="p-3 bg-[var(--secondary)]/10 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Minimum Confidence</span>
                    <span className="text-xs font-semibold">70%</span>
                  </div>
                  <div className="w-full bg-[var(--secondary)]/20 rounded-full h-2">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full"
                      style={{ width: '70%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    All predictions have a minimum confidence level of 70% to ensure high-quality selections.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Sources</label>
                <div className="p-3 bg-[var(--secondary)]/10 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">API-Football</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Daily fixtures and match data</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">GitHub Football Dataset</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Historical data for ML training</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Connected</span>
                  </div>
                </div>
              </div>
            </div>
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


