import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface PrivateRouteProps {
  isAuthenticated: boolean;
}

// Componente para proteger rotas privadas - redireciona para o login se não estiver autenticado
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  isAuthenticated,
}) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Componente para rotas públicas - redireciona para o dashboard se já estiver autenticado
export const PublicRoute: React.FC<PrivateRouteProps> = ({
  isAuthenticated,
}) => {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default { PrivateRoute, PublicRoute };
