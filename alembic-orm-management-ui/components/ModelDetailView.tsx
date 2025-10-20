import React from 'react';
import { ModelDefinition } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface ModelDetailViewProps {
  model: ModelDefinition;
  allModels: ModelDefinition[];
  onBack: () => void;
}

const RelationshipNode: React.FC<{ name: string; type: 'primary' | 'related' }> = ({ name, type }) => {
  const nodeClasses = type === 'primary' 
    ? 'bg-gold text-primary-dark border-gold-light' 
    : 'bg-primary-light border-border-color';
  return (
    <div className={`w-40 h-20 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg border-2 ${nodeClasses}`}>
      {name}
    </div>
  );
}

const RelationshipLine: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full h-1 bg-border-color relative">
        <div className="absolute right-0 top-1/2 -mt-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-text-secondary" />
      </div>
    </div>
  );
}

const ModelDetailView: React.FC<ModelDetailViewProps> = ({ model, allModels, onBack }) => {
  const { t } = useLocalization();

  const findRelationships = () => {
    const relations: { to: string, type: 'one-to-many' | 'many-to-one' }[] = [];
    const sqlalchemyModels = allModels.filter(m => m.type === 'SQLAlchemy');
    
    // Find 'many-to-one' relationships (this model has a foreign key to another)
    for (const field of model.fields) {
      if (field.options) {
        for (const option of field.options) {
          // Use a more robust regex to capture model name from ForeignKey regardless of the column name (.id, .code, etc.)
          const match = option.match(/ForeignKey\("(.+?)\..+?"\)/);
          if (match) {
            const relatedModelName = match[1];
            const relatedModel = sqlalchemyModels.find(m => m.name.toLowerCase() === relatedModelName.toLowerCase());
            if (relatedModel) {
              relations.push({ to: relatedModel.name, type: 'many-to-one' });
            }
          }
        }
      }
    }

    // Find 'one-to-many' relationships (another model has a foreign key to this one)
    for (const otherModel of sqlalchemyModels) {
      if (otherModel.name === model.name) continue;
      for (const field of otherModel.fields) {
        if (field.options) {
          for (const option of field.options) {
            // Use a more robust regex to capture model name from ForeignKey
            const match = option.match(/ForeignKey\("(.+?)\..+?"\)/);
            if (match && match[1].toLowerCase() === model.name.toLowerCase()) {
               relations.push({ to: otherModel.name, type: 'one-to-many' });
            }
          }
        }
      }
    }
    // Remove duplicate relationships for a cleaner view
    return relations.filter((v,i,a)=>a.findIndex(t=>(t.to === v.to && t.type === v.type))===i)
  }

  const relationships = findRelationships();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm bg-primary-light hover:bg-border-color text-text-primary transition-colors duration-200">
          <ArrowLeftIcon />
          <span>{t('modelDetail.back')}</span>
        </button>
        <h1 className="text-3xl font-bold text-text-primary">{t('modelDetail.model')} {model.name}</h1>
      </div>

      <div className="bg-primary-light border border-border-color rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-border-color">
          <h3 className="text-xl font-bold text-text-primary">{t('modelDetail.fields')}</h3>
        </div>
        <ul className="divide-y divide-border-color">
          {model.fields.map((field) => (
            <li key={field.name} className="px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <span className="font-mono text-text-primary text-md">{field.name}</span>
                <span className="font-mono text-sm text-accent-purple ml-3">{field.type}</span>
              </div>
              {field.options && <code className="text-xs text-text-secondary mt-2 sm:mt-0 bg-primary-dark px-2 py-1 rounded">{field.options.join(', ')}</code>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-primary-light border border-border-color rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-border-color">
          <h3 className="text-xl font-bold text-text-primary">{t('modelDetail.relations')}</h3>
        </div>
        <div className="p-8">
          {relationships.length > 0 ? (
            <div className="space-y-6">
              {relationships.map((rel, index) => (
                <div key={index} className="flex items-center justify-center gap-4 p-4 bg-primary-dark/50 rounded-lg">
                  {rel.type === 'many-to-one' && (
                    <>
                      <RelationshipNode name={model.name} type="primary" />
                      <RelationshipLine />
                      <RelationshipNode name={rel.to} type="related" />
                      <p className="w-40 text-center text-text-secondary text-sm">({model.name} {t('modelDetail.belongsTo')} {rel.to})</p>
                    </>
                  )}
                  {rel.type === 'one-to-many' && (
                    <>
                       <RelationshipNode name={rel.to} type="related" />
                       <RelationshipLine />
                       <RelationshipNode name={model.name} type="primary" />
                       <p className="w-40 text-center text-text-secondary text-sm">({model.name} {t('modelDetail.hasMany')} {rel.to})</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center">{t('modelDetail.noRelations')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelDetailView;