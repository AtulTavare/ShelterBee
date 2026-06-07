import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { showConfirm } from '../../utils/toast';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
  X,
  Handshake,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, profile, loading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openFeedbackCount, setOpenFeedbackCount] = useState(0);

  useEffect(() => {
    const collections = ['feedbacks', 'reports', 'support_inquiries', 'feedback'];
    const counts: Record<string, number> = {};
    const unsubscribes: (() => void)[] = [];

    collections.forEach(collName => {
      const q = query(collection(db, collName), where('status', '==', 'open'));
      const unsub = onSnapshot(q, (snapshot) => {
        counts[collName] = snapshot.size;
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
        setOpenFeedbackCount(total);
      }, (err) => {
        console.warn(`Sidebar monitor failed for ${collName}:`, err);
        counts[collName] = 0;
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  const navItems = [
    { name: 'Dashboard', path: '/admin-secret-dashboard', icon: LayoutDashboard },
    { name: 'Pending Approvals', path: '/admin-secret-dashboard/pending-approvals', icon: Clock },
    { name: 'Wallet & Payments', path: '/admin-secret-dashboard/wallet', icon: Wallet },
    { name: 'Payment Logs', path: '/admin-secret-dashboard/payments', icon: CreditCard },
    { name: 'Recent Registrations', path: '/admin-secret-dashboard/recent-registrations', icon: UserPlus },
    { name: 'Manage Properties', path: '/admin-secret-dashboard/manage-properties', icon: Building },
    { name: 'Users', path: '/admin-secret-dashboard/users', icon: Users },
    { name: 'Partners', path: '/admin-secret-dashboard/partners', icon: Handshake },

    { name: 'Feedback', path: '/admin-secret-dashboard/feedback', icon: MessageSquare, badge: openFeedbackCount },
    { name: 'Settings', path: '/admin-secret-dashboard/settings', icon: Settings },
  ];

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className={`p-6 pb-4 ${isCollapsed && !isMobile ? 'px-0 text-center' : ''}`}>
        <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight truncate">Admin Portal</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="h-px w-full bg-slate-100"></div>
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin-secret-dashboard'}
              onClick={() => { setMobileSidebarOpen(false); }}
              title={isCollapsed && !isMobile ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isCollapsed && !isMobile ? 'justify-center px-0' : ''
                } ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`w-4 h-4 transition-colors duration-200 shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                    }`} 
                    strokeWidth={2} 
                  />
                  {(!isCollapsed || isMobile) && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto w-5 h-5 flex items-center justify-center bg-blue-600 text-[10px] font-black text-white rounded-lg shadow-md shadow-blue-600/20 animate-in zoom-in-50 duration-300 shrink-0">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && !isMobile && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-blue-600 text-[8px] font-black text-white rounded-full shadow-md">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Main Site + Logout */}
      <div className={`p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        <NavLink 
          to="/" 
          title={isCollapsed && !isMobile ? 'Main Site' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition-all duration-200 group ${
            isCollapsed && !isMobile ? 'justify-center px-0' : 'border border-transparent hover:border-slate-200 hover:shadow-sm'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" strokeWidth={2} />
          {(!isCollapsed || isMobile) && <span>Main Site</span>}
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
          title={isCollapsed && !isMobile ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 group ${
            isCollapsed && !isMobile ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors shrink-0" strokeWidth={2} />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all z-10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      )}
    </>
  );

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

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-50 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">Admin Portal</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside 
        className={`hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 flex-col shrink-0 shadow-sm z-30 transition-all duration-300 relative ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="p-4 md:p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
