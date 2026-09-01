/** Route gates: unauthenticated users hit `/login`; signed-in guests skip auth pages. */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/context";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function GuestOnly() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
