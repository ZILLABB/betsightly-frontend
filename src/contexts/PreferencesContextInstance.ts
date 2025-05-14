import { createContext } from 'react';
import type { PreferencesContextType } from './PreferencesTypes';

// Create the context
export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);
