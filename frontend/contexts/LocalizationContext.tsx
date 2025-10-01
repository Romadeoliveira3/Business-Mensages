import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'en' | 'pt';
type Translations = Record<string, any>;

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale === 'en' || savedLocale === 'pt') {
      return savedLocale;
    }
    // Default to browser language or 'en'
    const browserLang = navigator.language.split(/[-_]/)[0];
    return browserLang === 'pt' ? 'pt' : 'en';
  });
  
  const [loadedTranslations, setLoadedTranslations] = useState<Translations>({});

  useEffect(() => {
    localStorage.setItem('locale', locale);

    const fetchTranslations = async () => {
      try {
        const response = await fetch(`./i18n/locales/${locale}.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch translations: ${response.statusText}`);
        }
        const data = await response.json();
        setLoadedTranslations(data);
      } catch (error) {
        console.error(`Failed to load translations for locale "${locale}":`, error);
      }
    };
    
    fetchTranslations();
  }, [locale]);

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const translation = key.split('.').reduce((acc: any, currentKey: string) => {
        if (acc !== undefined && acc !== null && typeof acc === 'object' && Object.prototype.hasOwnProperty.call(acc, currentKey)) {
            return acc[currentKey];
        }
        return undefined;
    }, loadedTranslations);

    if (translation === undefined || translation === null) {
      return key;
    }

    let translationString = String(translation);

    if (replacements) {
        for (const placeholder in replacements) {
            if (Object.prototype.hasOwnProperty.call(replacements, placeholder)) {
                const value = replacements[placeholder];
                const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
                translationString = translationString.replace(regex, String(value));
            }
        }
    }

    return translationString;
  };

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
