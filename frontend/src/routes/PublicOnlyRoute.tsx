import { Navigate, Outlet } from "react-router-dom";
import { Loading } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import { getRoleRedirectPath } from "../utils/roleRedirect";

export function PublicOnlyRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading label="Carregando sessao" />;
  }

  if (isAuthenticated && user) {
    return <Navigate replace to={getRoleRedirectPath(user.role)} />;
  }

  return <Outlet />;
}

