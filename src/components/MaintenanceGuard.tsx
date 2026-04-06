import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useLocation } from 'react-router-dom';

export const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { isMaintenanceMode } = useAdmin();
  const location = useLocation();

  // Allow access to homepage, auth, and admin routes
  const isAllowedRoute = 
    location.pathname === '/' || 
    location.pathname.startsWith('/auth') || 
    location.pathname.startsWith('/admin-secret-dashboard');

  if (isMaintenanceMode && !isAllowedRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-[#F59E0B] mb-4">construction</span>
        <h1 className="text-3xl font-extrabold text-[#1E1B4B] mb-2">We're under maintenance, back soon</h1>
        <p className="text-[#64748B] max-w-md">We are currently updating our platform to serve you better. We'll be back shortly!</p>
      </div>
    );
  }

  return <>{children}</>;
};
