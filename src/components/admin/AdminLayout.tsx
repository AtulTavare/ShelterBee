import React, { useState } from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { showConfirm } from '../../utils/toast';
import { 
  LayoutDashboard, 
  Clock, 
  Wallet, 
  UserPlus, 
  Building, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, profile, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin-secret-dashboard', icon: LayoutDashboard },
    { name: 'Pending Approvals', path: '/admin-secret-dashboard/pending-approvals', icon: Clock },
    { name: 'Wallet & Payments', path: '/admin-secret-dashboard/wallet', icon: Wallet },
    { name: 'Recent Registrations', path: '/admin-secret-dashboard/recent-registrations', icon: UserPlus },
    { name: 'Manage Properties', path: '/admin-secret-dashboard/manage-properties', icon: Building },
    { name: 'Users', path: '/admin-secret-dashboard/users', icon: Users },
    { name: 'Feedback', path: '/admin-secret-dashboard/feedback', icon: MessageSquare },
    { name: 'Settings', path: '/admin-secret-dashboard/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ returnTo: '/admin-secret-dashboard' }} replace />;
  }

  const isAdmin = profile?.role === 'admin' || user.email === 'tavareatul7192@gmail.com';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 bg-white border-r border-slate-200 flex-col shrink-0 shadow-sm z-50">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">Admin Portal</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace</p>
            </div>
          </div>
        </div>
        
        <div className="px-4 pb-2">
          <div className="h-px w-full bg-slate-100"></div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin-secret-dashboard'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      className={`w-4 h-4 transition-colors duration-200 ${
                        isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`} 
                      strokeWidth={2} 
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <NavLink 
            to="/" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all duration-200 group"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={2} />
            Main Site
          </NavLink>
          <button 
            onClick={() => {
              showConfirm("Are you sure you want to logout?", async () => {
                try {
                  await logout();
                  window.location.href = '/';
                } catch (error) {
                  console.error("Logout failed:", error);
                }
              });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
