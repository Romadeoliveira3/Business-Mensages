import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useLocalization } from "./contexts/LocalizationContext";

// Componentes de páginas
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

// Proteção de rotas
import { PrivateRoute, PublicRoute } from "./components/RouteGuard";

const APP_USER = import.meta.env.VITE_APP_USERNAME ?? "admin";
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? "admin";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const [loginError, setLoginError] = useState("");
  const { t } = useLocalization();
  const navigate = useNavigate();

  // Verificar autenticação ao iniciar o aplicativo
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, []);

  // Função de login que será passada para a página de login
  const handleLogin = (user: string, pass: string) => {
    if (user === APP_USER && pass === APP_PASSWORD) {
      // Guarda o estado de autenticação no localStorage
      localStorage.setItem("isAuthenticated", "true");
      // Atualiza o estado de autenticação
      setIsAuthenticated(true);
      // Limpa qualquer erro de login anterior
      setLoginError("");
      // Navega para o dashboard
      navigate("/dashboard");
    } else {
      setLoginError(t("login.invalidCredentials"));
    }
  };

  // Função de logout que será passada para o componente Dashboard
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <Routes>
      {/* Rota padrão - redireciona para login ou dashboard dependendo da autenticação */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Rotas públicas - acessíveis apenas quando não autenticado */}
      <Route element={<PublicRoute isAuthenticated={isAuthenticated} />}>
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} error={loginError} />}
        />
      </Route>

      {/* Rotas privadas - requerem autenticação */}
      <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
        <Route
          path="/dashboard"
          element={<DashboardPage onLogout={handleLogout} />}
        />
      </Route>

      {/* Rota 404 - redireciona para a página inicial */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
