import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showConfirm } from '../utils/toast';

import { getAvatarUrl } from '../utils/avatar';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const authMode = searchParams.get('mode') === 'login' ? 'login' : 'register';

  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
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

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm shadow-indigo-900/5">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1775077949/shelterbee_logo_q0gz87.jpg" alt="Shelterbee Logo" className="h-[calc(100%-10px)] m-[5px] max-h-12 w-auto rounded" referrerPolicy="no-referrer" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`font-bold transition-colors ${location.pathname === '/' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>Home</Link>
            <Link to="/listings" className={`font-bold transition-colors ${location.pathname === '/listings' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>Stays</Link>
            <Link to="/support" className={`font-bold transition-colors ${location.pathname === '/support' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>Support</Link>
            <Link to="/about-us" className={`font-bold transition-colors ${location.pathname === '/about-us' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>About Us</Link>
            {(profile?.role === 'admin' || user?.email === 'tavareatul7192@gmail.com') && (
              <Link to="/admin-secret-dashboard" className={`font-bold transition-colors ${location.pathname.startsWith('/admin-secret-dashboard') ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}>Admin</Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-3">
                <Link to={(profile?.role === 'admin' || user?.email === 'tavareatul7192@gmail.com') ? '/admin-secret-dashboard' : '/profile'} className="hidden sm:flex flex-col items-end mr-2 hover:text-primary transition-colors cursor-pointer">
                  <span className="text-sm font-bold text-on-secondary-fixed">{profile?.displayName || user.email?.split('@')[0]}</span>
                </Link>
                <Link to={(profile?.role === 'admin' || user?.email === 'tavareatul7192@gmail.com') ? '/admin-secret-dashboard' : '/profile'} className="cursor-pointer">
                  <img 
                    src={user.photoURL || getAvatarUrl(user.email || user.uid, profile?.gender, profile?.role)} 
                    alt="Profile" 
                    className="w-9 h-9 rounded-full border border-outline-variant hover:border-primary transition-colors bg-gray-100" 
                  />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-on-secondary-fixed/60 hover:text-on-secondary-fixed transition-colors"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to="/auth?mode=login"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <img 
                    src={getAvatarUrl(`guest-${guestSeed}`)} 
                    alt="Guest Profile" 
                    className="w-9 h-9 rounded-full border border-outline-variant hover:border-primary transition-colors bg-gray-100" 
                  />
                </Link>
                
                <button 
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
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
        </div>
      </div>
      <div className="bg-gradient-to-b from-slate-100/50 to-transparent h-1"></div>
    </nav>
  );
}
