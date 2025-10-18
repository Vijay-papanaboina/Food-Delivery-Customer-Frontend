import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Debug logging
  console.log("[ProtectedRoute] Auth state:", { isAuthenticated, isLoading });

  if (!isLoading && !isAuthenticated) {
    console.log("[ProtectedRoute] Not authenticated, redirecting to login");
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("[ProtectedRoute] Authenticated, rendering children");
  return <>{children}</>;
}
