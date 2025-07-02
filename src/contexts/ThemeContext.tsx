'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    // Only access localStorage after component mounts
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Default to dark theme (original design) unless user specifically prefers light
        const userPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        setTheme(userPrefersLight ? 'light' : 'dark');
      }
    } catch (error) {
      console.warn('Error accessing localStorage for theme:', error);
      // Fallback to dark theme
      setTheme('dark');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    try {
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Only add light class when in light mode
      // Dark mode is the default (no class needed)
      if (theme === 'light') {
        root.classList.add('light');
      }
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Error applying theme:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Always render children to prevent hydration mismatch
  // The opacity will fade in once mounted to smooth the transition
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: handleSetTheme }}>
      <div className={mounted ? 'opacity-100 transition-opacity duration-200' : 'opacity-0'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 