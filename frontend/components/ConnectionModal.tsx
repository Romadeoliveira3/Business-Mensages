import React, { useState, useEffect } from 'react';
import DatabaseIcon from './icons/DatabaseIcon';
import CodeIcon from './icons/CodeIcon';
import FileIcon from './icons/FileIcon';
import { AppConfig } from '../types';
import { useLocalization } from '../context/LocalizationContext';

interface SettingsModalProps {
  onSave: (config: Omit<AppConfig, 'id'> & { id?: string }) => void;
  onClose?: () => void;
  currentConfig?: AppConfig | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onSave, onClose, currentConfig }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [dbUrl, setDbUrl] = useState('postgresql://user:password@host:port/database');
  const [migrationsPath, setMigrationsPath] = useState('/app/alembic/versions');
  const [modelsPath, setModelsPath] = useState('/app/models');
  const { t } = useLocalization();

  const isEditing = !!currentConfig;

  useEffect(() => {
    if (currentConfig) {
      setProjectName(currentConfig.projectName || '');
      setDbUrl(currentConfig.dbUrl);
      setMigrationsPath(currentConfig.migrationsPath);
      setModelsPath(currentConfig.modelsPath);
    }
  }, [currentConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onSave({
        id: currentConfig?.id,
        projectName,
        dbUrl,
        migrationsPath,
        modelsPath,
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-primary-dark bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-primary-light rounded-xl shadow-2xl shadow-accent-purple/10 p-8 w-full max-w-lg border border-border-color relative">
        {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
        <h2 className="text-3xl font-bold text-center mb-2 text-text-primary">
            {isEditing ? t('connectionModal.editTitle') : t('connectionModal.addTitle')}
        </h2>
        <p className="text-center text-text-secondary mb-8">
            {isEditing ? t('connectionModal.editSubtitle') : t('connectionModal.addSubtitle')}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
             <label htmlFor="project-name" className="block text-text-secondary text-sm font-bold mb-2">
              {t('connectionModal.projectName')}
            </label>
            <div className="relative">
               <input
                id="project-name" type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-primary-dark border border-border-color rounded-md py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple transition"
                placeholder={t('connectionModal.projectNamePlaceholder')}
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="db-url" className="block text-text-secondary text-sm font-bold mb-2">
              {t('connectionModal.dbUrl')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DatabaseIcon />
              </div>
              <input
                id="db-url" type="text" value={dbUrl} onChange={(e) => setDbUrl(e.target.value)}
                className="w-full bg-primary-dark border border-border-color rounded-md py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple transition"
                placeholder="ex: postgresql://..."
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="migrations-path" className="block text-text-secondary text-sm font-bold mb-2">
              {t('connectionModal.migrationsPath')}
            </label>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CodeIcon />
              </div>
              <input
                id="migrations-path" type="text" value={migrationsPath} onChange={(e) => setMigrationsPath(e.target.value)}
                className="w-full bg-primary-dark border border-border-color rounded-md py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple transition"
                placeholder="ex: /path/to/migrations"
                required
              />
            </div>
          </div>
           <div className="mb-8">
            <label htmlFor="models-path" className="block text-text-secondary text-sm font-bold mb-2">
              {t('connectionModal.modelsPath')}
            </label>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileIcon />
              </div>
              <input
                id="models-path" type="text" value={modelsPath} onChange={(e) => setModelsPath(e.target.value)}
                className="w-full bg-primary-dark border border-border-color rounded-md py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple transition"
                placeholder="ex: /path/to/models"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold hover:bg-gold-light text-primary-dark font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-gold-dark disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('connectionModal.saving')}
              </>
            ) : (
              isEditing ? t('connectionModal.saveChanges') : t('connectionModal.addAndConnect')
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;

