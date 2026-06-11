import React, { useEffect } from 'react';
import { usePreferences } from '../../hooks/usePreferences';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Keep the browser chrome (status bar, overscroll rubber-band areas on
 * mobile) in sync with the app theme. Without this the meta theme-color
 * stays whatever index.html shipped, which shows as colored bands when
 * dragging the page past its edges.
 */
const setThemeColorMeta = (isDark: boolean) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0a0a0f' : '#f5f5f7');
};

/**
 * ThemeProvider component that applies the selected theme to the HTML element
 * This component should be placed at the root of the application
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Wrap in try-catch to handle potential errors
  try {
    const context = usePreferences();
    const { theme } = context.preferences;

    useEffect(() => {
      try {
        // Remove any existing theme classes
        document.documentElement.classList.remove('light', 'dark');

        // Apply the selected theme
        if (theme === 'light') {
          document.documentElement.classList.add('light');
          setThemeColorMeta(false);
          // Force a small delay to ensure styles are properly applied
          setTimeout(() => {
            document.body.style.backgroundColor = 'var(--background)';
            document.body.style.color = 'var(--foreground)';
          }, 10);
        } else if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          setThemeColorMeta(true);
        } else if (theme === 'system') {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setThemeColorMeta(prefersDark);
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.add('light');
            // Force a small delay to ensure styles are properly applied
            setTimeout(() => {
              document.body.style.backgroundColor = 'var(--background)';
              document.body.style.color = 'var(--foreground)';
            }, 10);
          }

          // Listen for changes in system preference
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(e.matches ? 'dark' : 'light');
            setThemeColorMeta(e.matches);

            // Force a small delay to ensure styles are properly applied
            if (!e.matches) {
              setTimeout(() => {
                document.body.style.backgroundColor = 'var(--background)';
                document.body.style.color = 'var(--foreground)';
              }, 10);
            }
          };

          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      } catch (error) {
        console.error('Error applying theme:', error);
        // Apply default theme as fallback
        document.documentElement.classList.add('dark');
      }
    }, [theme]);

    return <>{children}</>;
  } catch (error) {
    console.error('Error in ThemeProvider:', error);
    // Return children without theme handling if there's an error
    return <>{children}</>;
  }
};

export default ThemeProvider;
