import React, { useState, useRef, useEffect } from 'react';
import { AppConfig } from '../types';
import RefreshIcon from './icons/RefreshIcon';
import SettingsIcon from './icons/SettingsIcon';
import { extractDbName } from '../utils/stringUtils';
import { useLocalization } from '../context/LocalizationContext';

interface HeaderProps {
  onExitProject: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  config: AppConfig;
  allProjects: AppConfig[];
  onSelectProject: (projectId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onExitProject, onRefresh, onOpenSettings, config, allProjects, onSelectProject }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLocalization();

  const displayName = config.projectName || extractDbName(config.dbUrl);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-primary-light shadow-md p-4 flex justify-between items-center z-20 border-b border-border-color">
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 bg-primary-light px-3 py-2 rounded-md hover:bg-border-color transition-colors">
          <span className="text-sm text-text-secondary">{t('header.project')}</span>
          <span className="font-bold text-gold">{displayName}</span>
          <svg className={`w-4 h-4 text-text-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-primary-light border border-border-color rounded-md shadow-lg py-1">
            <div className="px-3 py-2 text-xs text-text-secondary uppercase font-semibold">{t('header.switchProject')}</div>
            {allProjects.map(p => (
              <a
                key={p.id}
                href="#"
                onClick={(e) => { e.preventDefault(); onSelectProject(p.id); setIsDropdownOpen(false); }}
                className={`block px-3 py-2 text-sm ${p.id === config.id ? 'bg-gold text-primary-dark' : 'text-text-primary hover:bg-border-color'}`}
              >
                {p.projectName || extractDbName(p.dbUrl)}
              </a>
            ))}
            <div className="border-t border-border-color my-1"></div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onExitProject(); setIsDropdownOpen(false); }}
              className="block px-3 py-2 text-sm text-text-primary hover:bg-border-color"
            >
              {t('header.exitProject')}
            </a>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={onRefresh} className="text-text-secondary hover:text-gold transition-colors" aria-label="Refresh data">
          <RefreshIcon />
        </button>
        <button onClick={onOpenSettings} className="text-text-secondary hover:text-gold transition-colors" aria-label="Open settings">
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;

