import React, { useMemo, useState } from "react";
import type { BusinessMessage } from "../types";
import { EditIcon } from "./icons/EditIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { useLocalization } from "../contexts/LocalizationContext";
import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";
import { ChevronRightIcon } from "./icons/ChevronRightIcon";

interface MessageListProps {
  messages: BusinessMessage[];
  onEdit: (message: BusinessMessage) => void;
  onDelete: (id: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onEdit, onDelete }) => {
  const { t } = useLocalization();
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredMessages = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) {
      return messages;
    }
    return messages.filter((message) => {
      const keyMatches = message.message_key.toLowerCase().includes(normalizedFilter);
      const codeMatches = message.code.toLowerCase().includes(normalizedFilter);
      return keyMatches || codeMatches;
    });
  }, [messages, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMessages.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMessages, currentPage, itemsPerPage]);

  const handleDelete = (id: string) => {
    if (window.confirm(t("messageList.deleteConfirmation"))) {
      onDelete(id);
    }
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder={t("messageList.filterPlaceholder")}
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="flex-grow md:flex-grow-0 md:w-1/3 px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-6 py-3">
                  {t("messageList.table.key")}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t("messageList.table.code")}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t("messageList.table.languages")}
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  {t("messageList.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedMessages.map((message) => (
                <tr
                  key={message.id}
                  className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {message.message_key}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                    {message.code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {message.available_languages.map((lang) => {
                        const isActive = lang === message.selected_language;
                        return (
                          <span
                            key={`${message.id}-${lang}`}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              isActive
                                ? "bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-200 dark:border-primary-700"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {lang}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => onEdit(message)}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMessages.length === 0 && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              {t("messageList.noMessagesFound")}
            </div>
          )}
        </div>
        {filteredMessages.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t dark:border-slate-700">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {t("pagination.pageInfo", { currentPage, totalPages })}
              </span>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 text-sm border border-slate-300 rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                aria-label={t("pagination.itemsPerPageLabel")}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {t("pagination.itemsPerPage", { count: size })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
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
