import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'partner') return <Navigate to="/partner-dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
