import React from 'react';
import type { MessageHistory } from '../types';
import { useLocalization } from '../context/LocalizationContext';

interface MessageHistoryModalProps {
    isVisible: boolean;
    onClose: () => void;
    history: MessageHistory[];
    messageKey: string;
}

const MessageHistoryModal: React.FC<MessageHistoryModalProps> = ({ isVisible, onClose, history, messageKey }) => {
    const { t } = useLocalization();
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-primary-dark bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-primary-light border border-border-color rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border-color">
                    <h2 className="text-xl font-bold text-text-primary">
                        {t('history.title')} <span className="text-gold">{messageKey}</span>
                    </h2>
                </div>
                <div className="p-6 overflow-y-auto">
                    <ol className="relative border-l border-border-color ml-4">
                        {[...history].reverse().map((entry, index) => (
                            <li key={index} className="mb-8 ml-6">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-gold/20 rounded-full -left-3 ring-8 ring-primary-light">
                                    <svg className="w-2.5 h-2.5 text-gold" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                                    </svg>
                                </span>
                                <h3 className="flex items-center mb-1 text-lg font-semibold text-text-primary">
                                    {t('history.version', { version: entry.version })}
                                    {index === 0 && <span className="bg-gold/20 text-gold text-sm font-bold mr-2 px-2.5 py-0.5 rounded ml-3">{t('history.latest')}</span>}
                                </h3>
                                <time className="block mb-2 text-sm font-normal leading-none text-text-secondary">{t('history.updatedBy', { date: new Date(entry.updated_at).toLocaleString(), user: entry.updated_by })}</time>
                                <p className="text-base font-normal text-text-secondary">{entry.changes}</p>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="p-4 bg-primary-light border-t border-border-color flex justify-end">
                    <button onClick={onClose} className="py-2 px-4 border border-border-color rounded-lg text-sm font-semibold text-text-primary hover:bg-border-color transition-colors">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageHistoryModal;
