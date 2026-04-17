import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showConfirm } from '../utils/toast';
import { Menu, X, LogOut, User as UserIcon, Home, Map, LifeBuoy, Info, Shield, Plus, Clock, Wallet as WalletIcon, UserPlus, Building, Users as UsersIcon, MessageSquare, Settings as SettingsIcon, Building2, Calendar, Heart, CheckCircle2, ShieldCheck, History, CreditCard, FileText } from 'lucide-react';

import { getAvatarUrl } from '../utils/avatar';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const authMode = searchParams.get('mode') === 'login' ? 'login' : 'register';

  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [guestSeed] = useState(() => Math.random().toString());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAuthDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    showConfirm("Are you sure you want to logout?", async () => {
      try {
        await logout();
        window.location.href = '/';
      } catch (error) {
        console.error("Logout failed:", error);
        throw error; // Rethrow to let showConfirm handle it
      }
    });
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Stays', path: '/listings', icon: Map },
    { name: 'Support', path: '/support', icon: LifeBuoy },
    { name: 'About Us', path: '/about-us', icon: Info },
  ];

  const dashboardLinks = profile?.role === 'admin' || user?.email === 'tavareatul7192@gmail.com' ? [
    { name: 'Dashboard', path: '/admin-secret-dashboard', icon: Home },
    { name: 'Pending Approvals', path: '/admin-secret-dashboard/pending-approvals', icon: Clock },
    { name: 'Wallet & Payments', path: '/admin-secret-dashboard/wallet', icon: WalletIcon },
    { name: 'Recent Registrations', path: '/admin-secret-dashboard/recent-registrations', icon: UserPlus },
    { name: 'Manage Properties', path: '/admin-secret-dashboard/manage-properties', icon: Building },
    { name: 'Users', path: '/admin-secret-dashboard/users', icon: UsersIcon },
    { name: 'Feedback', path: '/admin-secret-dashboard/feedback', icon: MessageSquare },
    { name: 'Settings', path: '/admin-secret-dashboard/settings', icon: SettingsIcon },
  ] : profile?.role === 'owner' ? [
    { name: 'Dashboard', path: '/profile#dashboard', icon: Building2 },
    { name: 'New Bookings', path: '/profile#new-bookings', icon: Calendar },
    { name: 'My Listings', path: '/profile#favourites', icon: Heart },
    { name: 'Property Approvals', path: '/profile#approvals', icon: CheckCircle2 },
    { name: 'Wallet', path: '/profile#wallet', icon: WalletIcon },
    { name: 'Security', path: '/profile#security', icon: ShieldCheck },
  ] : [
    { name: 'Personal Info', path: '/profile#personal', icon: UserIcon },
    { name: 'Stay History', path: '/profile#history', icon: History },
    { name: 'Payments', path: '/profile#payments', icon: CreditCard },
    { name: 'Security', path: '/profile#security', icon: ShieldCheck },
  ];

  const isAdmin = profile?.role === 'admin' || user?.email === 'tavareatul7192@gmail.com';

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant/10 shadow-sm">
        <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1775077949/shelterbee_logo_q0gz87.jpg" alt="Shelterbee Logo" className="h-8 md:h-10 lg:h-12 w-auto rounded" referrerPolicy="no-referrer" />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`font-bold transition-colors ${location.pathname === link.path ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin-secret-dashboard" className={`font-bold transition-colors ${location.pathname.startsWith('/admin-secret-dashboard') ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>Admin</Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {location.pathname === '/auth' || location.pathname === '/host-auth' ? (
              <div className="hidden sm:flex items-center gap-4 mr-4">
                <span className="text-gray-500 text-sm font-medium">
                  {authMode === 'register' ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <Link 
                  to={`${location.pathname}?mode=${authMode === 'register' ? 'login' : 'register'}`}
                  state={location.state}
                  className="text-[#8B5A2B] font-bold hover:text-[#F59E0B] transition-colors text-sm"
                >
                  {authMode === 'register' ? 'Log in' : 'Create Account'}
                </Link>
              </div>
            ) : (
              user ? (
                profile?.role !== 'visitor' && (
                  <Link 
                    to="/list-property" 
                    className="hidden lg:block bg-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold active:scale-95 duration-200 transition-all"
                  >
                    {profile?.role === 'owner' ? 'List your property' : 'Become a Host'}
                  </Link>
                )
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <Link 
                    to="/host-auth?mode=register" 
                    className="bg-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold active:scale-95 duration-200 transition-all"
                  >
                    Become a Host
                  </Link>
                  <Link 
                    to="/auth?mode=login" 
                    className="bg-[#FFF8E1] text-[#8B5A2B] border border-[#FFE082] px-6 py-2 rounded-xl font-bold active:scale-95 duration-200 transition-all"
                  >
                    Book a Property
                  </Link>
                </div>
              )
            )}
            
            <div className="flex items-center gap-2 relative" ref={dropdownRef}>
              {user ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <Link to={isAdmin ? '/admin-secret-dashboard' : '/profile'} className="hidden sm:flex flex-col items-end mr-2 hover:text-primary transition-colors cursor-pointer">
                    <span className="text-sm font-bold text-on-secondary-fixed">{profile?.displayName || user.email?.split('@')[0]}</span>
                  </Link>
                  <Link to={isAdmin ? '/admin-secret-dashboard' : '/profile'} className="hidden sm:block cursor-pointer">
                    <img 
                      src={user.photoURL || getAvatarUrl(user.email || user.uid)} 
                      alt="Profile" 
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-outline-variant hover:border-primary transition-colors bg-gray-100" 
                    />
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="hidden sm:block p-2 text-on-secondary-fixed/60 hover:text-on-secondary-fixed transition-colors"
                    title="Logout"
                  >
                    <span className="material-symbols-outlined text-xl">logout</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link 
                    to="/auth?mode=login"
                    className="hidden sm:flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <img 
                      src={getAvatarUrl(`guest-${guestSeed}`)} 
                      alt="Guest Profile" 
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-outline-variant hover:border-primary transition-colors bg-gray-100" 
                    />
                  </Link>
                  
                  <button 
                    onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                    className="hidden sm:block p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-secondary-fixed text-2xl">expand_more</span>
                  </button>
                  
                  {showAuthDropdown && (
                    <div className="absolute top-12 right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 flex flex-col overflow-hidden">
                      <Link 
                        to="/auth?mode=login" 
                        onClick={() => setShowAuthDropdown(false)}
                        className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors text-left"
                      >
                        Log in
                      </Link>
                      <Link 
                        to="/auth?mode=register" 
                        onClick={() => setShowAuthDropdown(false)}
                        className="px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors text-left"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-on-surface-variant hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-b from-slate-100/50 to-transparent h-1"></div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : 'text-gray-400'}`}>
          <Home size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/listings" className={`flex flex-col items-center gap-1 ${location.pathname === '/listings' ? 'text-primary' : 'text-gray-400'}`}>
          <Map size={20} />
          <span className="text-[10px] font-bold">Stays</span>
        </Link>
        
        {/* Host Button - Always visible in mobile bottom nav */}
        <Link 
          to={user ? "/list-property" : "/auth?mode=login"} 
          state={!user ? { returnTo: '/list-property' } : undefined}
          className={`flex flex-col items-center gap-1 ${location.pathname === '/list-property' ? 'text-primary' : 'text-gray-400'}`}
        >
          <div className={`flex items-center justify-center ${profile?.role === 'owner' ? 'bg-primary text-white rounded-full w-8 h-8 -mt-1 shadow-lg' : ''}`}>
            <Plus size={profile?.role === 'owner' ? 20 : 24} />
          </div>
          <span className="text-[10px] font-bold">Host</span>
        </Link>

        <Link 
          to={user ? "/profile" : "/auth?mode=login"} 
          className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-primary' : 'text-gray-400'}`}
        >
          <UserIcon size={20} />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 bg-white z-[60] transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col h-full bg-[#F8F9FA]">
          <div className="p-4 flex items-center justify-between bg-white border-b border-gray-100">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
            <h2 className="text-base font-bold text-[#1A1A2E]">Profile</h2>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-24">
            {/* Profile Card */}
            <div className="p-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                <img 
                  src={user?.photoURL || getAvatarUrl(user?.email || user?.uid || 'guest')} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-2 border-primary/10 object-cover" 
                />
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A2E]">
                    {user ? (profile?.displayName || user.email?.split('@')[0]) : 'Guest User'}
                  </h3>
                  <p className="text-xs font-medium text-gray-400">
                    {user ? (profile?.role === 'admin' ? 'Administrator' : profile?.role === 'owner' ? 'Property Owner' : user.email) : 'Sign in to access more features'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="px-4 mb-6">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Account</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {user ? (
                  <>
                    {dashboardLinks.map((link, idx) => {
                      const Icon = link.icon;
                      return (
                        <Link 
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${idx !== dashboardLinks.length - 1 ? 'border-b border-gray-50' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                              <Icon size={18} className="text-gray-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{link.name}</span>
                          </div>
                          <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Link 
                    to="/auth?mode=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <UserIcon size={18} className="text-gray-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Log in / Sign up</span>
                    </div>
                    <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Preferences Section */}
            <div className="px-4 mb-6">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Preferences</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <Link 
                  to="/about-us"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <Info size={18} className="text-gray-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">About Us</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                </Link>
                <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg text-gray-600">dark_mode</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Theme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Light</span>
                    <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="px-4 mb-6">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Support</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <Link 
                  to="/help-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <LifeBuoy size={18} className="text-gray-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Help Center</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                </Link>
                <Link 
                  to="/support#policies"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <FileText size={18} className="text-gray-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Terms & Conditions</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                </Link>
              </div>
            </div>

            {user && (
              <div className="px-4 mt-4">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
