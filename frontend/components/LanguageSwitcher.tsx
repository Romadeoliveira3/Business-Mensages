import React, { useState, useRef, useEffect } from 'react';
import { useLocalization, SUPPORTED_LOCALES, Locale } from '../contexts/LocalizationContext';
import { GlobeIcon } from './icons/GlobeIcon';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Record<Locale, string> = {
    'pt-BR': 'Português (Brasil)',
    en: 'English',
    es: 'Español',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Locale) => {
    setLocale(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
        aria-label="Change language"
      >
        <GlobeIcon className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg z-20">
          <ul>
            {SUPPORTED_LOCALES.map((code) => (
              <li key={code}>
                <button
                  onClick={() => handleLanguageChange(code)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    locale === code
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {languages[code]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
