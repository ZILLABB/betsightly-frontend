// Define theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// Define view preferences
export type ViewPreference = 'grid' | 'list' | 'compact';

// Define odds format
export type OddsFormat = 'decimal' | 'fractional' | 'american';

// Define currency
export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN';

// Define language
export type Language = 'en' | 'fr' | 'es' | 'de';

// Define the preferences interface
export interface UserPreferences {
  theme: ThemeMode;
  defaultView: ViewPreference;
  defaultTab: string;
  defaultOddsCategory: string;
  defaultSportFilter: string;
  defaultBookmakerFilter: string;
  showPremiumContent: boolean;
  enableNotifications: boolean;
  oddsFormat: OddsFormat;
  currency: Currency;
  language: Language;
  savedGameCodes: string[];
  favoriteTeams: string[];
}

// Define the default preferences
export const defaultPreferences: UserPreferences = {
  theme: 'system',
  defaultView: 'grid',
  defaultTab: 'predictions',
  defaultOddsCategory: 'all',
  defaultSportFilter: 'all',
  defaultBookmakerFilter: 'all',
  showPremiumContent: true,
  enableNotifications: true,
  oddsFormat: 'decimal',
  currency: 'USD',
  language: 'en',
  savedGameCodes: [],
  favoriteTeams: [],
};

// Define the context interface
export interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  toggleTheme: () => void;
  addSavedGameCode: (code: string) => void;
  removeSavedGameCode: (code: string) => void;
  addFavoriteTeam: (team: string) => void;
  removeFavoriteTeam: (team: string) => void;
}
