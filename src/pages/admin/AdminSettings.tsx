import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSettings = () => {
  const { isMaintenanceMode, setMaintenanceMode } = useAdmin();
  const { user } = useAuth();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure global platform settings and maintenance modes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl">
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">System Controls</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Maintenance Mode</h3>
              <p className="text-sm text-slate-500 mt-1">
                When active, the public site will display a maintenance page. Admin portal remains accessible.
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!isMaintenanceMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isMaintenanceMode ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isMaintenanceMode ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {isMaintenanceMode && (
            <div className="p-5 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
              <div>
                <h4 className="text-sm font-bold text-red-800">Maintenance Mode is Active</h4>
                <p className="text-sm text-red-700 mt-1">
                  Users cannot access the main platform right now. Ensure you turn this off once updates are complete.
                </p>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
