import React, { createContext, useState, useContext } from 'react';

interface AdminContextType {
  isMaintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;
}

const AdminContext = createContext<AdminContextType>({
  isMaintenanceMode: false,
  setMaintenanceMode: () => {},
});

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMaintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <AdminContext.Provider value={{ isMaintenanceMode, setMaintenanceMode }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
