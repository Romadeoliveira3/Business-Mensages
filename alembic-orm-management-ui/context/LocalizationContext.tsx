import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Locale = 'pt' | 'en' | 'es';

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// A simple cache to hold the loaded translation files
const translationsCache: { [key in Locale]?: any } = {};

const fetchWithCache = async (locale: Locale) => {
    if (translationsCache[locale] && Object.keys(translationsCache[locale]!).length > 0) return;
    try {
        // Paths for fetch are relative to the root index.html
        const response = await fetch(`./languages/${locale}.json`);
        if (!response.ok) {
            throw new Error(`Network response was not ok for ${locale}.json`);
        }
        translationsCache[locale] = await response.json();
    } catch (error) {
        console.error(`Failed to fetch translations for ${locale}:`, error);
        translationsCache[locale] = {}; // Set to empty to prevent refetching on error
    }
};

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const savedLocale = localStorage.getItem('alembic-ui-locale');
      return (savedLocale === 'pt' || savedLocale === 'en' || savedLocale === 'es') ? savedLocale : 'pt';
    } catch {
      return 'pt';
    }
  });

  // This state simply triggers a re-render once translations are loaded
  const [areTranslationsLoaded, setAreTranslationsLoaded] = useState(false);

  useEffect(() => {
    // Preload all languages on initial mount
    Promise.all([fetchWithCache('pt'), fetchWithCache('en'), fetchWithCache('es')]).finally(() => {
        setAreTranslationsLoaded(true);
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('alembic-ui-locale', newLocale);
    } catch (error) {
      console.error("Failed to save locale to localStorage", error);
    }
  };

  const t = useCallback((key: string): string => {
    if (!areTranslationsLoaded) return key; // Return key if translations aren't ready

    const keys = key.split('.');
    const resolve = (obj: any) => keys.reduce((acc, k) => acc?.[k], obj);
    
    const currentLangTranslations = translationsCache[locale];
    let translation = currentLangTranslations ? resolve(currentLangTranslations) : undefined;

    if (translation === undefined) {
      // Fallback to English if key not found
      const fallbackTranslations = translationsCache['en'];
      translation = fallbackTranslations ? resolve(fallbackTranslations) : undefined;
    }

    return translation || key;
  }, [locale, areTranslationsLoaded]);
  
  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};