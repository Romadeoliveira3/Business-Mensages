import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MessageList from "../components/MessageList";
import MessageEditor from "../components/MessageEditor";
import { PlusIcon } from "../components/icons/PlusIcon";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useLocalization } from "../contexts/LocalizationContext";
import { useMessages } from "../hooks/useMessages";
import type { BusinessMessage, MessageInput } from "../types";

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const { t, locale } = useLocalization();
  const apiLanguage = useMemo(
    () => (locale === "pt" ? "pt-BR" : "en"),
    [locale],
  );
  const {
    messages,
    history: historyMap,
    loading: apiLoading,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    refresh: refreshMessages,
  } = useMessages(apiLanguage);

  const [selectedMessage, setSelectedMessage] =
    useState<BusinessMessage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    setLoading(true);
    localStorage.removeItem("isAuthenticated");

    // Pequeno timeout para garantir que a UI seja atualizada
    setTimeout(() => {
      onLogout();
      navigate("/login");
      setLoading(false);
    }, 100);
  };

  const showEditor = selectedMessage || isCreating;

  const errorMessage = useMemo(() => {
    if (!error) return "";
    if (error === "load") return t("alerts.loadError");
    if (error === "delete") return t("alerts.deleteError");
    return t("alerts.saveError");
  }, [error, t]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="bg-white shadow-sm dark:bg-slate-800 sticky top-0 z-10">
        <div className="container flex items-center justify-between p-4 mx-auto">
          <h1 className="text-xl font-bold text-primary-600">
            {t("app.title")}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Sair
            </button>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="container p-8 mx-auto">
        {(apiLoading || loading) && (
          <div
            className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
            role="status"
          >
            {t("status.loading")}
          </div>
        )}
        {errorMessage && (
          <div
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200"
            role="alert"
          >
            {errorMessage}
          </div>
        )}
        {showEditor ? (
          <MessageEditor
            message={selectedMessage}
            onSave={handleSaveMessage}
            onClose={handleCloseEditor}
            history={
              selectedMessage ? historyMap[selectedMessage.id] || [] : []
            }
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {t("messageList.title")}
              </h1>
              <button
                onClick={handleCreateNew}
                className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="w-5 h-5" />
                {t("messageList.newMessageButton")}
              </button>
            </div>
            <MessageList
              messages={messages}
              onEdit={handleSelectMessage}
              onDelete={handleDeleteMessage}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
