import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

type Theme = 'light' | 'dark';

const ThemeIcon: React.FC<{ theme: Theme, className?: string }> = ({ theme, className }) => {
    switch (theme) {
        case 'light':
            return <SunIcon className={className} />;
        case 'dark':
            return <MoonIcon className={className} />;
        default:
            return null;
    }
};

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const themes: { id: Theme; name: string }[] = [
        { id: 'light', name: 'Light' },
        { id: 'dark', name: 'Dark' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center p-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
                aria-label="Change theme"
            >
                <ThemeIcon theme={theme} className="w-6 h-6" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5">
                    <ul>
                        {themes.map(({ id, name }) => (
                            <li key={id}>
                                <button
                                    onClick={() => handleThemeChange(id)}
                                    className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm ${
                                        theme === id
                                            ? 'bg-primary-500 text-white'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <ThemeIcon theme={id} className="w-4 h-4" />
                                    {name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;