import { AuthContext, useAuth } from "@/contexts/AuthContext";
import { useContext, ReactNode } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authData } = useAuth();

  if (!authData.user || !authData.password || !authData.endpoint) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
