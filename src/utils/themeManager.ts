// Define theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// Simple theme manager that doesn't rely on React hooks
class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeMode;
  private listeners: Array<(theme: ThemeMode) => void> = [];

  private constructor() {
    // Initialize with stored theme or default to system
    try {
      const savedTheme = localStorage?.getItem('betsightly_theme');
      this.currentTheme = (savedTheme as ThemeMode) || 'system';
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      this.currentTheme = 'system';
    }

    // Apply the theme immediately
    this.applyTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public getTheme(): ThemeMode {
    return this.currentTheme;
  }

  public setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    
    // Save to localStorage
    try {
      localStorage?.setItem('betsightly_theme', theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
    
    // Apply the theme
    this.applyTheme();
    
    // Notify listeners
    this.notifyListeners();
  }

  public subscribe(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  private applyTheme(): void {
    try {
      // Remove any existing theme classes
      document.documentElement.classList.remove('light', 'dark');

      // Apply the selected theme
      if (this.currentTheme === 'light') {
        document.documentElement.classList.add('light');
      } else if (this.currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (this.currentTheme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.add('light');
        }

        // Listen for changes in system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(e.matches ? 'dark' : 'light');
        };

        // Remove previous listener if exists
        mediaQuery.removeEventListener('change', handleChange);
        // Add new listener
        mediaQuery.addEventListener('change', handleChange);
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      // Apply default theme as fallback
      document.documentElement.classList.add('dark');
    }
  }
}

export default ThemeManager;
