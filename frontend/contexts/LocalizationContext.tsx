import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const SUPPORTED_LOCALES = ['pt-BR', 'en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
type Translations = Record<string, any>;

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const normaliseLocale = (value?: string | null): Locale | null => {
    if (!value) {
      return null;
    }
    const cleaned = value.trim().replace('_', '-').toLowerCase();
    if (!cleaned) {
      return null;
    }
    if (cleaned === 'pt' || cleaned.startsWith('pt-')) {
      return 'pt-BR';
    }
    if (cleaned === 'es' || cleaned.startsWith('es')) {
      return 'es';
    }
    if (cleaned === 'en' || cleaned.startsWith('en')) {
      return 'en';
    }
    return null;
  };

  const [locale, setLocale] = useState<Locale>(() => {
    const storedLocale =
      typeof window !== 'undefined' ? window.localStorage.getItem('locale') : null;
    const savedLocale = normaliseLocale(storedLocale);
    if (savedLocale) {
      return savedLocale;
    }
    const browserLocale = normaliseLocale(
      typeof navigator !== 'undefined' ? navigator.language : undefined,
    );
    return browserLocale ?? 'pt-BR';
  });
  
  const [loadedTranslations, setLoadedTranslations] = useState<Translations>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('locale', locale);
    }

    setLoadedTranslations({});

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
        if (locale !== 'pt-BR') {
          try {
            const fallbackResponse = await fetch('./i18n/locales/pt-BR.json');
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              setLoadedTranslations(fallbackData);
            }
          } catch (fallbackError) {
            console.error('Failed to load fallback translations:', fallbackError);
          }
        }
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
