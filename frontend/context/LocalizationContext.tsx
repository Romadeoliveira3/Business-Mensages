import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Locale = 'pt' | 'en' | 'es';

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const translationsCache: { [key in Locale]?: any } = {};

const fetchWithCache = async (locale: Locale) => {
    if (translationsCache[locale] && Object.keys(translationsCache[locale]!).length > 0) return;
    try {
        const response = await fetch(`./languages/${locale}.json`);
        if (!response.ok) {
            throw new Error(`Network response was not ok for ${locale}.json`);
        }
        translationsCache[locale] = await response.json();
    } catch (error) {
        console.error(`Failed to fetch translations for ${locale}:`, error);
        translationsCache[locale] = {};
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

  const [areTranslationsLoaded, setAreTranslationsLoaded] = useState(false);

  useEffect(() => {
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

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    if (!areTranslationsLoaded) return key;
    const keys = key.split('.');
    const resolve = (obj: any) => keys.reduce((acc, k) => acc?.[k], obj);
    
    const currentLangTranslations = translationsCache[locale];
    let translation = currentLangTranslations ? resolve(currentLangTranslations) : undefined;

    if (translation === undefined) {
      const fallbackTranslations = translationsCache['en'];
      translation = fallbackTranslations ? resolve(fallbackTranslations) : undefined;
    }

    if (typeof translation !== 'string') {
      return translation || key;
    }

    if (!vars) return translation;

    // Simple interpolation: replace {var} with provided values
    return translation.replace(/\{(\w+)\}/g, (_, name) => {
      const value = vars[name as keyof typeof vars];
      return value !== undefined && value !== null ? String(value) : `{${name}}`;
    });
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
