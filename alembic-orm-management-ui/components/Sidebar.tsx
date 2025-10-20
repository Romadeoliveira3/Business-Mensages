import React from 'react';
import { View } from '../types';
import DatabaseIcon from './icons/DatabaseIcon';
import HistoryIcon from './icons/HistoryIcon';
import { useLocalization } from '../context/LocalizationContext';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { t, locale, setLocale } = useLocalization();
  
  const navItems = [
    { view: View.Migrations, label: t('sidebar.migrations'), icon: <HistoryIcon /> },
    { view: View.Models, label: t('sidebar.models'), icon: <DatabaseIcon /> },
  ];

  return (
    <nav className="w-64 bg-primary-light border-r border-border-color p-5 flex flex-col">
      <div className="text-3xl font-black mb-12 text-text-primary tracking-wider">
        Alembic<span className="text-gold">UI</span>
      </div>
      <ul>
        {navItems.map((item) => {
          const isActive = currentView === item.view || (item.view === View.Models && currentView === View.ModelDetail);
          return (
          <li key={item.view} className="mb-4">
            <button
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-gold text-primary-dark shadow-md'
                  : 'text-text-secondary hover:bg-primary-dark hover:text-gold'
              }`}
            >
              <span className={`mr-4 transition-colors ${isActive ? 'text-primary-dark' : 'text-text-secondary group-hover:text-gold'}`}>{item.icon}</span>
              <span className="font-bold">{item.label}</span>
            </button>
          </li>
        )})}
      </ul>
      <div className="mt-auto">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <button 
            onClick={() => setLocale('pt')} 
            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${locale === 'pt' ? 'bg-gold text-primary-dark' : 'bg-primary-dark text-text-secondary'}`}
          >
            PT
          </button>
          <button 
            onClick={() => setLocale('en')} 
            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${locale === 'en' ? 'bg-gold text-primary-dark' : 'bg-primary-dark text-text-secondary'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLocale('es')} 
            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${locale === 'es' ? 'bg-gold text-primary-dark' : 'bg-primary-dark text-text-secondary'}`}
          >
            ES
          </button>
        </div>
        <div className="text-center text-text-secondary/50 text-xs">
            <p>{t('sidebar.version')} 1.0.0</p>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;