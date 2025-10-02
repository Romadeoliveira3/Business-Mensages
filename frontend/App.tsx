import React, { useEffect, useMemo, useState } from "react";
import type { BusinessMessage, MessageInput } from "./types";
import MessageList from "./components/MessageList";
import MessageEditor from "./components/MessageEditor";
import { PlusIcon } from "./components/icons/PlusIcon";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { useLocalization } from "./contexts/LocalizationContext";
import { useMessages } from "./hooks/useMessages";

const APP_USER = import.meta.env.VITE_APP_USERNAME ?? "admin";
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? "admin";

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
  error: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useLocalization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg dark:bg-slate-800">
        <div className="flex justify-end gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400">
            {t("login.title")}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="username" className="sr-only">
                {t("login.usernamePlaceholder")}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                placeholder={t("login.usernamePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t("login.passwordPlaceholder")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                placeholder={t("login.passwordPlaceholder")}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-center text-red-500 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t("login.signInButton")}
            </button>
          </div>
          <p
            className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400"
            dangerouslySetInnerHTML={{ __html: t("login.credentialsHint") }}
          />
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
    messages,
    history: historyMap,
    loading,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
  } = useMessages();
  const [selectedMessage, setSelectedMessage] =
    useState<BusinessMessage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verifica se já existe autenticação salva no localStorage
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [loginError, setLoginError] = useState("");
  const { t } = useLocalization();

  useEffect(() => {
    if (!selectedMessage) {
      return;
    }
    const updatedMessage = messages.find((m) => m.id === selectedMessage.id);
    if (updatedMessage && updatedMessage !== selectedMessage) {
      setSelectedMessage(updatedMessage);
    }
  }, [messages, selectedMessage]);

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

  const handleLogin = (user: string, pass: string) => {
    if (user === APP_USER && pass === APP_PASSWORD) {
      // Guarda o estado de autenticação no localStorage
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError(t("login.invalidCredentials"));
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

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
              onClick={() => {
                localStorage.removeItem("isAuthenticated");
                setIsAuthenticated(false);
              }}
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
        {loading && (
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

export default App;
