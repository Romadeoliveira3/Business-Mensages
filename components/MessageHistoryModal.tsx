import React from 'react';
import type { MessageHistory } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {t('history.title')} <span className="text-primary-600 dark:text-primary-400">{messageKey}</span>
                    </h2>
                </div>
                <div className="p-6 overflow-y-auto">
                    <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-4">
                        {[...history].reverse().map((entry, index) => (
                            <li key={index} className="mb-8 ml-6">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full -left-3 ring-8 ring-white dark:ring-slate-800 dark:bg-primary-900">
                                    <svg className="w-2.5 h-2.5 text-primary-800 dark:text-primary-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                                    </svg>
                                </span>
                                <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                                    {t('history.version', { version: entry.version })}
                                    {index === 0 && <span className="bg-primary-100 text-primary-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-primary-900 dark:text-primary-300 ml-3">{t('history.latest')}</span>}
                                </h3>
                                <time className="block mb-2 text-sm font-normal leading-none text-slate-400 dark:text-slate-500">{t('history.updatedBy', { date: new Date(entry.updated_at).toLocaleString(), user: entry.updated_by })}</time>
                                <p className="text-base font-normal text-slate-600 dark:text-slate-300">{entry.changes}</p>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 border-t dark:border-slate-600 flex justify-end">
                    <button onClick={onClose} className="py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageHistoryModal;
