import React, { useState, useEffect } from 'react';
import { PreferencesContext } from './PreferencesContextInstance';
import { defaultPreferences } from './PreferencesTypes';
import type { UserPreferences } from './PreferencesTypes';

// Create the provider component
export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const savedPreferences = localStorage?.getItem('betsightly_preferences');
      return savedPreferences ? JSON.parse(savedPreferences) : defaultPreferences;
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error);
      return defaultPreferences;
    }
  });

  useEffect(() => {
    try {
      localStorage?.setItem('betsightly_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }, [preferences]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const toggleTheme = () => {
    setPreferences(prev => {
      const currentTheme = prev.theme;
      const newTheme = 
        currentTheme === 'light' ? 'dark' :
        currentTheme === 'dark' ? 'system' : 'light';
      return { ...prev, theme: newTheme };
    });
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreference,
        resetPreferences,
        toggleTheme,
        addSavedGameCode: (code: string) => {
          setPreferences(prev => ({
            ...prev,
            savedGameCodes: [...prev.savedGameCodes, code]
          }));
        },
        removeSavedGameCode: (code: string) => {
          setPreferences(prev => ({
            ...prev,
            savedGameCodes: prev.savedGameCodes.filter(c => c !== code)
          }));
        },
        addFavoriteTeam: (team: string) => {
          setPreferences(prev => ({
            ...prev,
            favoriteTeams: [...prev.favoriteTeams, team]
          }));
        },
        removeFavoriteTeam: (team: string) => {
          setPreferences(prev => ({
            ...prev,
            favoriteTeams: prev.favoriteTeams.filter(t => t !== team)
          }));
        },
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};
