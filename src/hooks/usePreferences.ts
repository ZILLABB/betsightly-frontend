import { useContext } from 'react';
import { PreferencesContext } from '../contexts/PreferencesContextInstance';

/**
 * Custom hook to access the preferences context
 * @returns The preferences context
 */
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default usePreferences;
