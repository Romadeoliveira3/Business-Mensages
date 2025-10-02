import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useLocalization } from "../contexts/LocalizationContext";

interface LoginPageProps {
  onLogin: (user: string, pass: string) => void;
  error: string;
}

const APP_USER = import.meta.env.VITE_APP_USERNAME ?? "admin";
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? "admin";

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { t } = useLocalization();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Verificar credenciais
    if (username === APP_USER && password === APP_PASSWORD) {
      // Guarda o estado de autenticação no localStorage
      localStorage.setItem("isAuthenticated", "true");

      // Notifica o componente pai sobre o login
      onLogin(username, password);

      // Redireciona para o dashboard
      navigate("/dashboard");
    } else {
      setIsLoggingIn(false);
      // Exibir erro - será passado via props
      onLogin(username, password);
    }
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
              disabled={isLoggingIn}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("login.loggingIn")}
                </>
              ) : (
                t("login.signInButton")
              )}
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

export default LoginPage;
