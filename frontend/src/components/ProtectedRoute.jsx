// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Handles ProtectedRoute.
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main><p>Checking your session...</p></main>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

