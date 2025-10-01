
import React, { useState } from 'react';
import type { BusinessMessage, MessageHistory } from './types';
import { initialMessages, initialHistory } from './data/mockData';
import MessageList from './components/MessageList';
import MessageEditor from './components/MessageEditor';
import { PlusIcon } from './components/icons/PlusIcon';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeSwitcher from './components/ThemeSwitcher';
import { useLocalization } from './contexts/LocalizationContext';


const APP_USER = import.meta.env.VITE_APP_USERNAME ?? 'admin';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? 'admin';

interface LoginProps {
    onLogin: (user: string, pass: string) => void;
    error: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
                        {t('login.title')}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md">
                        <div>
                            <label htmlFor="username" className="sr-only">{t('login.usernamePlaceholder')}</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                                placeholder={t('login.usernamePlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">{t('login.passwordPlaceholder')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                                placeholder={t('login.passwordPlaceholder')}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            {t('login.signInButton')}
                        </button>
                    </div>
                     <p 
                        className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: t('login.credentialsHint') }}
                     />
                </form>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [messages, setMessages] = useState<BusinessMessage[]>(initialMessages);
    const [history, setHistory] = useState<Record<string, MessageHistory[]>>(initialHistory);
    const [selectedMessage, setSelectedMessage] = useState<BusinessMessage | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState('');
    const { t } = useLocalization();

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
    
    const handleSaveMessage = (messageToSave: BusinessMessage) => {
        const now = new Date();
        const newHistoryEntry: MessageHistory = {
            version: messageToSave.version,
            updated_by: 'admin@example.com',
            updated_at: now.toISOString(),
            changes: messageToSave.version > 1 ? t('history.defaultUpdate') : t('history.defaultCreate'),
        };

        if (messages.some(m => m.id === messageToSave.id)) {
            // Update existing message
            setMessages(messages.map(m => m.id === messageToSave.id ? messageToSave : m));
            setHistory(prev => ({
                ...prev,
                [messageToSave.id]: [...(prev[messageToSave.id] || []), newHistoryEntry]
            }));

        } else {
            // Create new message
            const newMessage = { ...messageToSave, id: `msg_${Date.now()}` };
            setMessages([...messages, newMessage]);
            setHistory(prev => ({
                ...prev,
                [newMessage.id]: [newHistoryEntry]
            }));
        }

        handleCloseEditor();
    };
    
    const handleDeleteMessage = (id: string) => {
        setMessages(messages.filter(m => m.id !== id));
        const newHistory = { ...history };
        delete newHistory[id];
        setHistory(newHistory);
    };
    
    const handleLogin = (user: string, pass: string) => {
        if (user === APP_USER && pass === APP_PASSWORD) {
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError(t('login.invalidCredentials'));
        }
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} error={loginError} />;
    }

    const showEditor = selectedMessage || isCreating;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
             <header className="bg-white shadow-sm dark:bg-slate-800 sticky top-0 z-10">
                <div className="container flex items-center justify-between p-4 mx-auto">
                    <h1 className="text-xl font-bold text-primary-600">
                        {t('app.title')}
                    </h1>
                     <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                    </div>
                </div>
            </header>
            <main className="container p-8 mx-auto">
                {showEditor ? (
                    <MessageEditor 
                          message={selectedMessage} 
                          onSave={handleSaveMessage}
                          onClose={handleCloseEditor}
                          history={selectedMessage ? history[selectedMessage.id] || [] : []}
                       />
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('messageList.title')}</h1>
                            <button 
                                onClick={handleCreateNew} 
                                className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
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
            </main>
        </div>
    );
};

export default App;
