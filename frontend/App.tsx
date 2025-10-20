import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/ConnectionModal';
import MigrationManager from './components/MigrationManager';
import ModelViewer from './components/ModelViewer';
import ModelDetailView from './components/ModelDetailView';
import ProjectSelection from './components/ProjectSelection';
import MessagesView from './components/MessagesView';
import { View, ModelDefinition, AppConfig } from './types';
import { useModels } from './hooks/useModels';
import { useAlembic } from './hooks/useAlembic';
import { useLocalization } from './context/LocalizationContext';

const App: React.FC = () => {
  const [projects, setProjects] = useState<AppConfig[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AppConfig | null>(null);

  const [currentView, setCurrentView] = useState<View>(View.Migrations);
  const [selectedModel, setSelectedModel] = useState<ModelDefinition | null>(null);
  
  const alembic = useAlembic();
  const { models, loading: modelsLoading, fetchModels } = useModels();
  const { t } = useLocalization();

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('alembic-ui-projects');
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('alembic-ui-projects', JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
    }
  }, [projects]);
  
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  useEffect(() => {
    if (activeProject) {
      fetchModels(activeProject.modelsPath);
      alembic.fetchData();
    }
  }, [activeProject, fetchModels, alembic.fetchData]);

  const handleSaveProject = (projectData: Omit<AppConfig, 'id'> & { id?: string }) => {
    if (projectData.id) {
      setProjects(projects.map(p => p.id === projectData.id ? { ...p, ...projectData } : p));
    } else {
      const newProject: AppConfig = { ...projectData, id: `proj_${Date.now()}` };
      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
    }
    setIsSettingsOpen(false);
    setEditingProject(null);
  };
  
  const handleDeleteProject = (projectId: string) => {
    if (window.confirm(t('app.deleteConfirmation'))) {
      setProjects(projects.filter(p => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
    }
  };

  const handleOpenSettingsToAdd = () => {
    setEditingProject(null);
    setIsSettingsOpen(true);
  };

  const handleOpenSettingsToEdit = (project: AppConfig) => {
    setEditingProject(project);
    setIsSettingsOpen(true);
  };
  
  const handleExitProject = () => {
    setActiveProjectId(null);
    setCurrentView(View.Migrations);
    setSelectedModel(null);
  };

  const handleRefresh = useCallback(() => {
    if (!activeProject) return;
    fetchModels(activeProject.modelsPath);
    alembic.fetchData();
  }, [activeProject, fetchModels, alembic.fetchData]);

  const handleSelectModel = (model: ModelDefinition) => {
    setSelectedModel(model);
    setCurrentView(View.ModelDetail);
  };

  const handleBackToModels = () => {
    setSelectedModel(null);
    setCurrentView(View.Models);
  };

  const changeView = (view: View) => {
    if (view !== View.ModelDetail) {
      setSelectedModel(null);
    }
    setCurrentView(view);
  };

  const renderContent = () => {
    if (!activeProject) {
      return (
        <ProjectSelection 
          projects={projects}
          onSelectProject={setActiveProjectId}
          onAddProject={handleOpenSettingsToAdd}
          onEditProject={handleOpenSettingsToEdit}
          onDeleteProject={handleDeleteProject}
        />
      );
    }

    const isLoading = modelsLoading || alembic.loading;
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <svg className="animate-spin h-10 w-10 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    
    switch (currentView) {
      case View.Models:
        return <ModelViewer models={models} onSelectModel={handleSelectModel} />;
      case View.ModelDetail:
        return selectedModel ? (
          <ModelDetailView 
            model={selectedModel} 
            allModels={models} 
            onBack={handleBackToModels} 
          />
        ) : (
          <ModelViewer models={models} onSelectModel={handleSelectModel} />
        );
      case View.Messages:
        return <MessagesView />;
      case View.Migrations:
      default:
        return <MigrationManager alembic={alembic} />;
    }
  };

  return (
    <div className="flex h-screen bg-primary-dark text-text-primary font-sans">
      {isSettingsOpen && (
        <SettingsModal 
          onSave={handleSaveProject} 
          currentConfig={editingProject} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
      
      {activeProject && <Sidebar currentView={currentView} setCurrentView={changeView} />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeProject && (
          <Header 
            onExitProject={handleExitProject} 
            onRefresh={handleRefresh} 
            onOpenSettings={() => handleOpenSettingsToEdit(activeProject)} 
            config={activeProject}
            allProjects={projects}
            onSelectProject={setActiveProjectId}
          />
        )}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-primary-dark p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
