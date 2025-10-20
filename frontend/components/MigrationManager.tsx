import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import IconButton from './IconButton';
import PlusIcon from './icons/PlusIcon';
import MagicWandIcon from './icons/MagicWandIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import { Migration } from '../types';
import { useAlembic } from '../hooks/useAlembic';
import { useLocalization } from '../context/LocalizationContext';

type AlembicHook = ReturnType<typeof useAlembic>;

interface MigrationManagerProps {
  alembic: AlembicHook;
}

const MigrationManager: React.FC<MigrationManagerProps> = ({ alembic }) => {
  const {
    migrations,
    loading,
    head,
    current,
    upgrade,
    downgrade,
    upgradeToHead,
    autogenerate,
    createEmpty,
    updateMessage,
  } = alembic;

  const [editingMigrationId, setEditingMigrationId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const { t } = useLocalization();
  const currentIndex = migrations.findIndex(m => m.revision === current);

  const handleEdit = (migration: Migration) => {
    setEditingMigrationId(migration.id);
    setEditedMessage(migration.message);
  };

  const handleSave = (id: string) => {
    updateMessage(id, editedMessage);
    setEditingMigrationId(null);
  };

  const handleCancel = () => {
    setEditingMigrationId(null);
    setEditedMessage('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-10 w-10 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('migrationManager.title')}</h1>
          <p className="text-text-secondary mt-1">{t('migrationManager.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <IconButton onClick={() => createEmpty('Nova migration vazia')} icon={<PlusIcon />} text={t('migrationManager.empty')} />
          <IconButton onClick={() => autogenerate('Auto-detectar mudanças')} icon={<MagicWandIcon />} text={t('migrationManager.autogenerate')} variant="secondary" />
          <IconButton onClick={upgradeToHead} icon={<ArrowUpIcon />} text={t('migrationManager.upgradeHead')} variant="primary" />
        </div>
      </div>
      
      <div className="bg-primary-light border border-border-color rounded-xl shadow-lg">
        <ul className="divide-y divide-border-color">
          {migrations.map((migration, idx) => {
            const isHead = migration.revision === head;
            const isCurrent = migration.revision === current;
            const isNewerThanCurrent = currentIndex !== -1 ? idx < currentIndex : false; // can upgrade to
            const isOlderThanCurrent = currentIndex !== -1 ? idx > currentIndex : false; // can downgrade to

            return (
              <li key={migration.id} className="p-4 sm:p-6 hover:bg-border-color/30 transition-colors duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-gold-light text-lg">{migration.revision}</span>
                      {isHead && <StatusBadge text="head" color="purple" />}
                      {isCurrent && <StatusBadge text="current" color="green" />}
                    </div>

                    {editingMigrationId === migration.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          className="bg-primary-dark border border-border-color rounded-md px-2 py-1 text-text-primary w-full focus:outline-none focus:ring-2 focus:ring-accent-purple"
                        />
                         <button onClick={() => handleSave(migration.id)} className="text-sm bg-accent-green hover:opacity-90 text-primary-dark font-bold px-3 py-1 rounded-md">{t('migrationManager.save')}</button>
                         <button onClick={handleCancel} className="text-sm bg-border-color hover:opacity-90 text-text-primary px-3 py-1 rounded-md">{t('migrationManager.cancel')}</button>
                      </div>
                    ) : (
                      <p className="text-text-primary text-md cursor-pointer" onClick={() => handleEdit(migration)}>
                        {migration.message}
                      </p>
                    )}

                    <p className="text-xs text-text-secondary/70 mt-1 font-mono">
                      <span>down: {migration.down_revision || 'base'}</span>
                      <span className="mx-2">|</span>
                      <span>{migration.timestamp}</span>
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                    <button
                      className="text-sm bg-gold-dark hover:bg-gold text-white font-semibold px-3 py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => downgrade(migration.revision)}
                      disabled={!isOlderThanCurrent || isCurrent}
                    >
                      {t('migrationManager.downgrade')}
                    </button>
                    <button
                      className="text-sm bg-accent-green hover:opacity-90 text-primary-dark font-bold px-3 py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => upgrade(migration.revision)}
                      disabled={!isNewerThanCurrent || isCurrent}
                    >
                      {t('migrationManager.upgrade')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {!migrations.length && (
        <div className="text-center text-text-secondary">{t('migrationManager.empty')}</div>
      )}
    </div>
  );
};

export default MigrationManager;
