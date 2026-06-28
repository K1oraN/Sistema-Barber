import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth";
import { getRoleRedirectPath } from "../utils/roleRedirect";

type RequireAuthProps = {
  allowedRoles: UserRole[];
};

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading label="Validando sessao" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={getRoleRedirectPath(user.role)} />;
  }

  return <Outlet />;
}

