import React, { useState, useMemo } from 'react';
import type { BusinessMessage } from '../types';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import { useLocalization } from '../context/LocalizationContext';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface MessageListProps {
    messages: BusinessMessage[];
    onEdit: (message: BusinessMessage) => void;
    onDelete: (id: string) => void;
}

const statusBadgeClass = (status?: number) => {
    if (typeof status !== 'number') return 'bg-border-color/30 text-text-secondary';
    if (status >= 200 && status < 300) return 'bg-accent-green/20 text-accent-green';
    if (status >= 400 && status < 500) return 'bg-gold-dark/30 text-gold-light';
    if (status >= 500) return 'bg-red-500/20 text-red-400';
    return 'bg-border-color/30 text-text-secondary';
};

const MessageList: React.FC<MessageListProps> = ({ messages, onEdit, onDelete }) => {
    const [filterKey, setFilterKey] = useState('');
    const [filterHttpStatus, setFilterHttpStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { t } = useLocalization();

    const filteredMessages = useMemo(() => {
        return messages.filter(message => {
            const keyMatch = message.message_key.toLowerCase().includes(filterKey.toLowerCase());
            const httpStatusMatch = filterHttpStatus ? message.http_status?.toString().includes(filterHttpStatus) : true;
            return keyMatch && httpStatusMatch;
        });
    }, [messages, filterKey, filterHttpStatus]);

    const totalPages = Math.ceil(filteredMessages.length / itemsPerPage) || 1;
    const paginatedMessages = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMessages.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMessages, currentPage, itemsPerPage]);

    const handleDelete = (id: string) => {
        if (window.confirm(t('messageList.deleteConfirmation'))) onDelete(id);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
                <input
                    type="text"
                    placeholder={t('messageList.filterKeyPlaceholder')}
                    value={filterKey}
                    onChange={(e) => { setFilterKey(e.target.value); setCurrentPage(1); }}
                    className="flex-grow md:flex-grow-0 md:w-1/3 px-4 py-2 border border-border-color rounded-lg bg-primary-dark text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <input
                    type="text"
                    placeholder={t('messageList.filterHttpStatusPlaceholder')}
                    value={filterHttpStatus}
                    onChange={(e) => { setFilterHttpStatus(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border border-border-color rounded-lg bg-primary-dark text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
            </div>

            <div className="bg-primary-light border border-border-color shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary">
                        <thead className="text-xs uppercase bg-primary-dark text-text-secondary">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('messageList.table.key')}</th>
                                <th scope="col" className="px-6 py-3">{t('messageList.table.httpStatus')}</th>
                                <th scope="col" className="px-6 py-3">{t('messageList.table.version')}</th>
                                <th scope="col" className="px-6 py-3">{t('messageList.table.languages')}</th>
                                <th scope="col" className="px-6 py-3">{t('messageList.table.lastUpdated')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('messageList.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMessages.map((message) => (
                                <tr key={message.id} className="bg-primary-light border-b border-border-color/60 hover:bg-border-color/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-text-primary">{message.message_key}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusBadgeClass(message.http_status ?? undefined)}`}>
                                            {message.http_status ?? '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-primary">{message.version}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(message.available_languages || []).map((lang) => (
                                                <span key={lang} className="px-2 py-0.5 rounded-md text-xs bg-border-color/30 text-text-secondary font-mono">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        {t('messageList.table.updatedBy', { date: new Date(message.updated_at).toLocaleString(), user: message.updated_by })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-3">
                                            <button onClick={() => onEdit(message)} className="text-text-secondary hover:text-gold transition-colors">
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDelete(message.id)} className="text-text-secondary hover:text-red-400 transition-colors">
                                                <DeleteIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredMessages.length === 0 && (
                        <div className="text-center py-10 text-text-secondary">
                            {t('messageList.noMessagesFound')}
                        </div>
                    )}
                </div>
                {totalPages > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border-color">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-text-primary">
                                {t('pagination.pageInfo', { currentPage, totalPages })}
                            </span>
                            <select
                                id="items-per-page"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="px-2 py-1 text-sm border border-border-color rounded-md bg-primary-dark text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
                                aria-label={t('pagination.itemsPerPageLabel')}
                            >
                                {[10, 25, 50, 100].map(size => (
                                    <option key={size} value={size}>
                                        {t('pagination.itemsPerPage', { count: size })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center justify-center p-2 text-sm font-bold text-primary-dark transition-colors rounded-lg bg-gold hover:bg-gold-light disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center justify-center p-2 text-sm font-bold text-primary-dark transition-colors rounded-lg bg-gold hover:bg-gold-light disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageList;
