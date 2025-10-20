import React, { useMemo, useState } from 'react';
import MessageList from './MessageList';
import MessageEditor from './MessageEditor';
import PlusIcon from './icons/PlusIcon';
import { useLocalization } from '../context/LocalizationContext';
import { useMessages } from '../hooks/useMessages';
import type { BusinessMessage, MessageInput } from '../types';

const MessagesView: React.FC = () => {
  const { t, locale } = useLocalization();
  const apiLanguage = useMemo(() => {
    if (locale === 'pt') return 'pt-BR';
    if (locale === 'es') return 'es';
    return 'en';
  }, [locale]);

  const {
    messages,
    history: historyMap,
    loading,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
  } = useMessages(apiLanguage);

  const [selectedMessage, setSelectedMessage] = useState<BusinessMessage | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectMessage = (message: BusinessMessage) => {
    setSelectedMessage(message);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedMessage(null);
    setIsCreating(true);
  };

  const handleCloseEditor = () => {
    setSelectedMessage(null);
    setIsCreating(false);
  };

  const handleSaveMessage = async (messageInput: MessageInput) => {
    try {
      if (selectedMessage) {
        await updateMessage(selectedMessage.id, messageInput);
      } else {
        await createMessage(messageInput);
      }
      handleCloseEditor();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteMessage(id);
      if (selectedMessage?.id === id) {
        handleCloseEditor();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const errorMessage = useMemo(() => {
    if (!error) return '';
    if (error === 'load') return t('alerts.loadError');
    if (error === 'delete') return t('alerts.deleteError');
    return t('alerts.saveError');
  }, [error, t]);

  const showEditor = selectedMessage || isCreating;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {(loading) && (
        <div className="mb-4 rounded-lg bg-primary-light/40 px-4 py-3 text-sm text-text-secondary" role="status">
          {t('status.loading')}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-200" role="alert">
          {errorMessage}
        </div>
      )}

      {showEditor ? (
        <MessageEditor
          message={selectedMessage}
          onSave={handleSaveMessage}
          onClose={handleCloseEditor}
          history={selectedMessage ? historyMap[selectedMessage.id] || [] : []}
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black tracking-wide">
              {t('messageList.title')}
            </h1>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 font-bold text-primary-dark bg-gold rounded-lg hover:bg-gold-light transition-colors shadow-glow-gold"
            >
              <PlusIcon className="w-5 h-5" />
              {t('messageList.newMessageButton')}
            </button>
          </div>
          <MessageList
            messages={messages}
            onEdit={handleSelectMessage}
            onDelete={handleDeleteMessage}
          />
        </div>
      )}
    </div>
  );
};

export default MessagesView;
