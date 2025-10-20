import React from 'react';
import { ModelDefinition } from '../types';
import { useLocalization } from '../context/LocalizationContext';

interface ModelViewerProps {
  models: ModelDefinition[];
  onSelectModel: (model: ModelDefinition) => void;
}

const ModelCard: React.FC<{ model: ModelDefinition }> = ({ model }) => {
  const badgeColor = 'bg-gold-dark/30 text-gold-light';

  return (
    <div className="bg-primary-light border border-border-color rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-border-color flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-primary">{model.name}</h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeColor}`}>{model.type}</span>
      </div>
      <ul className="divide-y divide-border-color flex-1">
        {model.fields.map((field) => (
          <li key={field.name} className="px-5 py-3 flex justify-between items-center">
            <div>
              <span className="font-mono text-text-primary">{field.name}</span>
              <span className="font-mono text-sm text-accent-purple ml-3">{field.type}</span>
            </div>
            {field.options && <code className="text-xs text-text-secondary">{field.options.join(', ')}</code>}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ModelViewer: React.FC<ModelViewerProps> = ({ models, onSelectModel }) => {
  const sqlalchemyModels = models.filter(m => m.type === 'SQLAlchemy');
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">{t('modelViewer.title')}</h1>
        <p className="text-text-secondary mt-1">{t('modelViewer.subtitle')}</p>
      </div>
      {sqlalchemyModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sqlalchemyModels.map((model) => (
            <div 
              key={model.name} 
              onClick={() => onSelectModel(model)} 
              className="cursor-pointer transition-all duration-300 ease-in-out rounded-xl hover:shadow-glow-gold hover:border-gold hover:-translate-y-1"
              role="button"
              tabIndex={0}
              aria-label={`View details for ${model.name}`}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectModel(model)}}
            >
              <ModelCard model={model} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-primary-light rounded-xl border border-border-color">
          <h3 className="text-xl font-semibold text-text-primary">{t('modelViewer.noneFound')}</h3>
          <p className="text-text-secondary mt-2">{t('modelViewer.noneFoundSubtitle')}</p>
          <p className="text-text-secondary/70 mt-1 text-sm">{t('modelViewer.checkPath')}</p>
        </div>
      )}
    </div>
  );
};

export default ModelViewer;