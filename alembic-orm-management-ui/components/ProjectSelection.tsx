import React from 'react';
import { AppConfig } from '../types';
import { extractDbName } from '../utils/stringUtils';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import PlusIcon from './icons/PlusIcon';
import { useLocalization } from '../context/LocalizationContext';

interface ProjectSelectionProps {
  projects: AppConfig[];
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
  onEditProject: (project: AppConfig) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectCard: React.FC<{
  project: AppConfig;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ project, onSelect, onEdit, onDelete }) => {
  const { t } = useLocalization();
  const dbName = extractDbName(project.dbUrl);
  return (
    <div className="bg-primary-light border border-border-color rounded-xl shadow-lg p-6 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold hover:shadow-glow-gold hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-text-primary mb-2">{project.projectName}</h3>
          <div className="flex items-center space-x-2">
            <button onClick={onEdit} className="text-text-secondary hover:text-white transition-colors" aria-label="Edit project"><EditIcon /></button>
            <button onClick={onDelete} className="text-text-secondary hover:text-red-500 transition-colors" aria-label="Delete project"><DeleteIcon /></button>
          </div>
        </div>
        <p className="text-sm text-text-secondary font-mono break-all">{dbName}</p>
      </div>
      <button 
        onClick={onSelect}
        className="mt-6 w-full bg-gold hover:bg-gold-light text-primary-dark font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
      >
        {t('projectSelection.select')}
      </button>
    </div>
  );
};

const ProjectSelection: React.FC<ProjectSelectionProps> = ({ projects, onSelectProject, onAddProject, onEditProject, onDeleteProject }) => {
  const { t, locale, setLocale } = useLocalization();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in relative">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-text-primary mb-2 tracking-wide">
          {t('projectSelection.welcome')}<span className="text-gold">UI</span>
        </h1>
        <p className="text-lg text-text-secondary">{t('projectSelection.selectOrCreate')}</p>
      </div>
      
      <div className="w-full max-w-4xl">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <ProjectCard 
                key={p.id}
                project={p}
                onSelect={() => onSelectProject(p.id)}
                onEdit={() => onEditProject(p)}
                onDelete={() => onDeleteProject(p.id)}
              />
            ))}
             <button 
                onClick={onAddProject}
                className="border-2 border-dashed border-border-color rounded-xl text-text-secondary hover:bg-primary-light hover:border-gold hover:text-gold transition-all duration-300 flex flex-col items-center justify-center h-full min-h-[180px]">
                <PlusIcon />
                <span className="mt-2 font-semibold">{t('projectSelection.addNew')}</span>
            </button>
          </div>
        ) : (
           <div className="text-center">
            <p className="text-text-secondary mb-6">{t('projectSelection.noneFound')}</p>
            <button 
                onClick={onAddProject}
                className="bg-gold hover:bg-gold-light text-primary-dark font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out inline-flex items-center"
            >
              <PlusIcon />
              <span className="ml-2">{t('projectSelection.addFirst')}</span>
            </button>
          </div>
        )}
      </div>
      <div className="absolute bottom-8 right-8">
        <div className="flex justify-center items-center space-x-2">
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
      </div>
    </div>
  );
};

export default ProjectSelection;