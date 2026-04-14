import { showToast, showConfirm } from '../utils/toast';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { mockProperties } from '../data/mockProperties';
import { bookingService, Booking } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { emailService } from '../services/emailService';
import { userService } from '../services/userService';
import { reviewService, Review } from '../services/reviewService';
import { Bed } from 'lucide-react';
import { emailTemplates } from '../services/emailTemplates';
import { format } from 'date-fns';
import { 
  User, 
  CreditCard, 
  History, 
  Heart, 
  ShieldCheck, 
  Edit3, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Plus, 
  FileText, 
  HelpCircle,
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Star,
  Users,
  TrendingUp,
  Calendar,
  XCircle
} from 'lucide-react';

import { OTPModal, generateOTP, storeOTP, sendOTPEmail } from '../components/OTPModal';
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

import { getAvatarUrl } from '../utils/avatar';

type Tab = 'personal' | 'wallet' | 'payments' | 'history' | 'favourites' | 'security' | 'dashboard' | 'approvals' | 'new-bookings';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, loading, navigate]);

  const isOwner = profile?.role === 'owner';
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const validTabs: Tab[] = ['personal', 'wallet', 'payments', 'history', 'favourites', 'security', 'dashboard', 'approvals', 'new-bookings'];
      if (validTabs.includes(hash as Tab)) {
        setActiveTab(hash as Tab);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    if (isOwner && (activeTab === 'history' || activeTab === 'personal') && !location.hash) {
      setActiveTab('dashboard');
    }
  }, [isOwner, activeTab, location.hash]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  const tabs = isOwner ? [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'new-bookings', label: 'New Bookings', icon: Calendar },
    { id: 'favourites', label: 'My Listings', icon: Heart },
    { id: 'approvals', label: 'Property Approvals', icon: CheckCircle2 },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ] : [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'history', label: 'Stay History', icon: History },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <aside className="hidden md:flex sticky top-[80px] h-[calc(100vh-80px)] w-64 bg-[#F8F9FA] border-r border-gray-200 flex-col flex-shrink-0 z-50">
        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E] truncate mb-1">
              {profile?.displayName || user.email?.split('@')[0]}
            </h2>
            <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mt-1">
              Premium Member
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-[#FDF6E3] text-[#8B5A2B]' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#8B5A2B]' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-gray-200 space-y-4">
          <button className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors w-full">
            <FileText className="w-4 h-4" /> Terms & Policies
          </button>
          <button className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors w-full">
            <HelpCircle className="w-4 h-4" /> Support
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
            {(activeTab === 'personal' || activeTab === 'dashboard') && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-[#F59E0B]/20"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <OwnerDashboardTab user={user} profile={profile} isEditing={isEditing} setIsEditing={setIsEditing} setActiveTab={setActiveTab} setShowOTPModal={setShowOTPModal} />}
              {activeTab === 'personal' && <PersonalInfoTab user={user} profile={profile} isEditing={isEditing} setIsEditing={setIsEditing} setShowOTPModal={setShowOTPModal} />}
              {activeTab === 'wallet' && <WalletTab />}
              {activeTab === 'history' && <StayHistoryTab />}
              {activeTab === 'payments' && <PaymentsTab />}
              {activeTab === 'favourites' && <FavouritesTab />}
              {activeTab === 'new-bookings' && <NewBookingsTab />}
              {activeTab === 'approvals' && <PropertyApprovalsTab />}
              {activeTab === 'security' && <SecurityTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <OTPModal 
        isOpen={showOTPModal} 
        onClose={() => setShowOTPModal(false)} 
        email={user?.email || ''} 
        onSuccess={async () => {
          if (user) {
            await updateDoc(doc(db, 'users', user.uid), {
              emailVerified: true
            });
            setShowOTPModal(false);
            showToast("Email verified successfully!", "success");
            // Note: In a real app, you might want to trigger a context refresh here
            // or use updateProfileData if available in this scope.
            // For now, a reload or next fetch will show the updated status.
            window.location.reload();
          }
        }} 
      />
    </div>
  );
}

function NewBookingsTab() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const allOwnerBookings = await bookingService.getBookingsByOwner(user.uid);
      // Sort by date descending
      const sorted = allOwnerBookings.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setBookings(sorted);
    } catch (error) {
      console.error("Error fetching owner bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">No bookings yet</h3>
          <p className="text-gray-500">You haven't received any bookings for your properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              onClick={() => setSelectedBooking(booking)}
              className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer bg-slate-50/50 hover:bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-[#1A1A2E] text-lg">{booking.visitorName}</h3>
                  <p className="text-sm text-[#F59E0B] font-bold">{booking.status.toUpperCase()}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <Calendar className="w-5 h-5 text-[#1E1B4B]" />
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{booking.checkIn ? format(booking.checkIn, 'MMM dd') : 'N/A'} - {booking.checkOut ? format(booking.checkOut, 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{booking.guests?.length || 1} Guest(s)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                <span className="font-black text-[#1A1A2E]">₹{booking.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative z-10 border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#1E1B4B]">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Visitor Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Name</span>
                      <span className="text-sm font-bold text-[#1A1A2E]">{selectedBooking.visitorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Contact</span>
                      <span className="text-sm font-bold text-[#1A1A2E]">{selectedBooking.visitorContact}</span>
                    </div>
                    {selectedBooking.whatsappNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">WhatsApp</span>
                        <span className="text-sm font-bold text-[#1A1A2E]">{selectedBooking.whatsappNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Stay Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Check-in</span>
                      <span className="text-sm font-bold text-[#1A1A2E]">{selectedBooking.checkIn ? format(selectedBooking.checkIn, 'PPP') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Check-out</span>
                      <span className="text-sm font-bold text-[#1A1A2E]">{selectedBooking.checkOut ? format(selectedBooking.checkOut, 'PPP') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="text-sm font-bold text-[#1A1A2E]">{selectedBooking.nights} Nights</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Guest List</h4>
                  <div className="space-y-3">
                    {selectedBooking.guests?.map((guest: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-[#1A1A2E]">{guest.name}</p>
                          <p className="text-xs text-gray-500">{guest.age} years • {guest.gender}</p>
                        </div>
                        <span className="text-[10px] font-black bg-white px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider text-gray-400">
                          {guest.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-[#1E1B4B]">Total Revenue</span>
                  <span className="text-2xl font-black text-[#F59E0B]">₹{selectedBooking.totalAmount}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedBooking(null)}
                className="w-full mt-8 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#312E81] transition-all shadow-xl shadow-indigo-200"
              >
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonalInfoTab({ user, profile, isEditing, setIsEditing, setShowOTPModal }: { user: any, profile: any, isEditing: boolean, setIsEditing: (v: boolean) => void, setShowOTPModal: (v: boolean) => void }) {
  const { updateProfileData } = useAuth();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    mobile: profile?.mobile || '',
    whatsapp: profile?.whatsapp || '',
    gender: profile?.gender || '',
    dob: profile?.dob || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [recentBookings, setRecentBookings] = useState<(Booking & { property?: any })[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!user) return;
      try {
        const userBookings = await bookingService.getBookingsByVisitor(user.uid);
        
        // Fetch property details for each booking
        const bookingsWithProperties = await Promise.all(
          userBookings.map(async (booking) => {
            const property = await propertyService.getPropertyById(booking.propertyId);
            return { ...booking, property };
          })
        );
        
        // Sort by checkIn date descending and take top 2
        bookingsWithProperties.sort((a, b) => {
          if (!a.checkIn || !b.checkIn) return 0;
          return b.checkIn.getTime() - a.checkIn.getTime();
        });

        setRecentBookings(bookingsWithProperties.slice(0, 2));
      } catch (error) {
        console.error("Error fetching recent bookings:", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchRecentBookings();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfileData(formData);
      setIsEditing(false);
      showToast("Profile updated successfully", "success");
    } catch (error) {
      console.error("Failed to save profile", error);
      showToast("An error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Personal Details Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#F3F4F6] rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-[#1A1A2E]" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.displayName} 
                  onChange={e => setFormData({...formData, displayName: e.target.value})}
                  className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                />
              ) : (
                <p className="text-[#1A1A2E] font-medium">{profile?.displayName || 'Not provided'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
              <div className="flex items-center gap-3">
                <p className="text-[#1A1A2E] font-medium">{user.email}</p>
                {profile?.emailVerified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                    <CheckCircle2 size={12} />
                    Verified
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Number</p>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value})}
                  className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                  placeholder="98765 43210"
                />
              ) : (
                <p className="text-[#1A1A2E] font-medium">{profile?.mobile || 'Not provided'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp Number</p>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.whatsapp} 
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                  placeholder="98765 43210"
                />
              ) : (
                <p className="text-[#1A1A2E] font-medium">{profile?.whatsapp || 'Not provided'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
              {isEditing ? (
                <input 
                  type="date" 
                  value={formData.dob} 
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                />
              ) : (
                <p className="text-[#1A1A2E] font-medium">{profile?.dob || 'Not provided'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</p>
              {isEditing ? (
                <select 
                  value={formData.gender} 
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-[#1A1A2E] font-medium">{profile?.gender || 'Not provided'}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-bold bg-[#F59E0B] text-white rounded-lg hover:bg-amber-400 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Verified Resident Card */}
        <div className="bg-[#4A4A68] rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-[#F59E0B] rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Verified Resident</h2>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Your identity and payment methods have been fully verified. Enjoy instant booking privileges.
            </p>
            <div className="inline-block bg-white/10 px-4 py-2 rounded-lg text-xs font-bold tracking-wider">
              JOINED MARCH 2024
            </div>
          </div>
        </div>

        {/* Recent Stays Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1A1A2E]">Recent Stays</h3>
            <button className="text-sm font-bold text-[#F59E0B] hover:text-amber-600">View All</button>
          </div>
          
          <div className="space-y-4">
            {loadingBookings ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-100 rounded-xl"></div>
                <div className="h-16 bg-gray-100 rounded-xl"></div>
              </div>
            ) : recentBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent stays</p>
            ) : (
              recentBookings.map(booking => (
                <div key={booking.id} className="flex gap-4 items-center">
                  <img src={booking.property?.photos?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=100"} alt="Stay" className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h4 className="font-bold text-[#1A1A2E] text-sm truncate">{booking.property?.title || 'Unknown Property'}</h4>
                    <p className="text-xs text-gray-500">{booking.property?.area || 'Unknown'} • {booking.checkIn ? format(booking.checkIn, 'MMM dd') : 'TBD'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    booking.status === 'confirmed' ? 'text-emerald-600 bg-emerald-50' :
                    booking.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                    booking.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment History Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-6">Payment History</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Date</span>
              <span>Invoice</span>
              <span>Amount</span>
            </div>
            
            {loadingBookings ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-100 rounded"></div>
                <div className="h-6 bg-gray-100 rounded"></div>
              </div>
            ) : recentBookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent payments</p>
            ) : (
              recentBookings.map(booking => (
                <div key={booking.id} className="flex justify-between items-center text-sm">
                  <span className="text-[#1A1A2E] font-medium">{booking.createdAt ? format(booking.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}</span>
                  <span className="text-gray-400">#{booking.id?.substring(0, 8).toUpperCase()}</span>
                  <span className="font-bold text-[#1A1A2E]">₹{booking.totalAmount || booking.estimatedCost}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { differenceInHours } from 'date-fns';
import { walletService } from '../services/walletService';

function StayHistoryTab() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { property?: any })[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    const q = query(collection(db, 'bookings'), where('visitorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const userBookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkIn: doc.data().checkIn?.toDate() || null,
          checkOut: doc.data().checkOut?.toDate() || null,
        })) as Booking[];

        // Fetch property details for each booking
        const bookingsWithProperties = await Promise.all(
          userBookings.map(async (booking) => {
            const property = await propertyService.getPropertyById(booking.propertyId);
            return { ...booking, property };
          })
        );
        
        // Sort by checkIn date descending
        bookingsWithProperties.sort((a, b) => {
          if (!a.checkIn || !b.checkIn) return 0;
          return b.checkIn.getTime() - a.checkIn.getTime();
        });

        setBookings(bookingsWithProperties);
      } catch (error) {
        console.error("Error syncing bookings:", error);
      } finally {
        setLoading(false);
      }
    });

    // Fetch user reviews
    const reviewsQ = query(collection(db, 'reviews'), where('visitorId', '==', user.uid));
    const unsubscribeReviews = onSnapshot(reviewsQ, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserReviews(reviews);
    });

    return () => {
      unsubscribe();
      unsubscribeReviews();
    };
  }, [user]);

  const handleCancelBooking = async (booking: Booking) => {
    if (!booking.id || !booking.createdAt) return;
    
    const hoursSinceBooking = differenceInHours(new Date(), booking.createdAt.toDate());
    
    if (hoursSinceBooking > 24) {
      showToast("An error occurred", "error");
      return;
    }

    showConfirm("Are you sure you want to cancel this booking? You will receive a full refund to your wallet.", async () => {
      setCancellingId(booking.id!);
      try {
        await bookingService.updateBookingStatus(booking.id!, 'cancelled');
        const amount = booking.totalAmount || (booking as any).estimatedCost || 0;
        await walletService.processRefund(booking.visitorId, booking.ownerId, amount, amount * 0.75, booking.id!);
        
        // Send Refund Email
        try {
          if (user?.email) {
            const template = emailTemplates.getRefundNotification(
              profile?.displayName || 'User',
              amount,
              booking.id!,
              'Booking Cancellation (within 24 hours)'
            );
            await emailService.sendEmail({
              to: user.email,
              subject: template.subject,
              html: template.html
            });
          }
        } catch (e) {
          console.error("Failed to send refund email:", e);
        }

        showToast("Booking cancelled successfully", "success");
      } catch (error) {
        console.error("Error cancelling booking:", error);
        showToast("An error occurred", "error");
      } finally {
        setCancellingId(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">No stays yet</h3>
          <p className="text-gray-500">When you book a property, your stay history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const hoursSinceBooking = booking.createdAt ? differenceInHours(new Date(), booking.createdAt.toDate()) : 999;
            const canCancel = booking.status === 'confirmed' && hoursSinceBooking <= 24;
            const isCompleted = booking.status === 'completed' || (booking.checkOut && booking.checkOut < new Date());

            return (
              <div key={booking.id} className="flex flex-col gap-4 p-4 border border-gray-100 rounded-2xl hover:shadow-md transition-shadow bg-white">
                <div className="flex flex-col sm:flex-row gap-6">
                  <img 
                    src={booking.property?.photos?.[0] || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=300&h=200`} 
                    alt="Property" 
                    className="w-full sm:w-48 h-32 object-cover rounded-xl" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-[#1A1A2E]">{booking.property?.title || 'Unknown Property'}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          booking.status === 'confirmed' ? 'text-emerald-600 bg-emerald-50' :
                          booking.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                          booking.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                          'text-gray-600 bg-gray-50'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" /> {booking.property?.area || 'Unknown Location'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Stayed: {booking.checkIn ? format(booking.checkIn, 'MMM dd, yyyy') : 'TBD'} - {booking.checkOut ? format(booking.checkOut, 'MMM dd, yyyy') : 'TBD'} ({booking.nights} nights)
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-bold text-[#1A1A2E]">₹{booking.totalAmount || (booking as any).estimatedCost}</span>
                      <div className="flex gap-3">
                        {canCancel && (
                          <button 
                            onClick={() => handleCancelBooking(booking)}
                            disabled={cancellingId === booking.id}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        )}
                        {!canCancel && booking.status === 'confirmed' && (
                          <button 
                            onClick={() => showToast("Cancellation request window will be available soon.", "success")}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                          >
                            Apply for Cancellation
                          </button>
                        )}
                        
                        {isCompleted && !userReviews.find(r => r.propertyId === booking.propertyId) && (
                          <button 
                            onClick={() => { setSelectedBooking(booking); setShowReviewModal(true); }}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-50 text-[#F59E0B] hover:bg-amber-100 transition-colors border border-amber-100"
                          >
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= 3 ? 'fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </button>
                        )}

                        <button 
                          onClick={() => { setSelectedBooking(booking); setShowReportModal(true); }}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Show user's review if it exists */}
                {userReviews.find(r => r.propertyId === booking.propertyId) && (
                  <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= userReviews.find(r => r.propertyId === booking.propertyId).rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-400">Your Review</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{userReviews.find(r => r.propertyId === booking.propertyId).date}</span>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{userReviews.find(r => r.propertyId === booking.propertyId).text}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal 
        isOpen={showReviewModal} 
        onClose={() => setShowReviewModal(false)} 
        booking={selectedBooking} 
        profile={profile}
      />

      {/* Report Modal */}
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        booking={selectedBooking} 
      />
    </div>
  );
}

function PaymentsTab() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { property?: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const userBookings = await bookingService.getBookingsByVisitor(user.uid);
        
        // Fetch property details for each booking
        const bookingsWithProperties = await Promise.all(
          userBookings.map(async (booking) => {
            const property = await propertyService.getPropertyById(booking.propertyId);
            return { ...booking, property };
          })
        );
        
        // Sort by checkIn date descending
        bookingsWithProperties.sort((a, b) => {
          if (!a.checkIn || !b.checkIn) return 0;
          return b.checkIn.getTime() - a.checkIn.getTime();
        });

        setBookings(bookingsWithProperties);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">No payments yet</h3>
          <p className="text-gray-500">Your payment history will appear here once you make a booking.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 text-sm text-[#1A1A2E] font-medium">
                    {booking.createdAt ? format(booking.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">Booking: {booking.property?.title || 'Unknown Property'}</td>
                  <td className="py-4 px-4 text-sm text-gray-400">#{booking.id?.substring(0, 8).toUpperCase()}</td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      booking.status === 'confirmed' ? 'text-emerald-600 bg-emerald-50' :
                      booking.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                      booking.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                      'text-gray-600 bg-gray-50'
                    }`}>
                      {booking.status === 'confirmed' ? 'Paid' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-[#1A1A2E] text-right">₹{booking.totalAmount || booking.estimatedCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FavouritesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedPropertyBookings, setSelectedPropertyBookings] = useState<any[]>([]);
  const [selectedPropertyReviews, setSelectedPropertyReviews] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedPropertyTitle, setSelectedPropertyTitle] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const fetchMyProperties = async () => {
    if (!user) return;
    try {
      const myProps = await propertyService.getPropertiesByOwner(user.uid);
      setProperties(myProps);
    } catch (error) {
      console.error("Error fetching my properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProperties();
  }, [user]);

  const [showHideModal, setShowHideModal] = useState(false);
  const [selectedPropertyToHide, setSelectedPropertyToHide] = useState<any>(null);
  const [hideOption, setHideOption] = useState<'today' | 'manual' | 'range'>('manual');
  const [unavailabilityFrom, setUnavailabilityFrom] = useState('');
  const [unavailabilityTo, setUnavailabilityTo] = useState('');

  const handleHideProperty = async () => {
    if (!selectedPropertyToHide) return;
    
    let from = '';
    let to = '';
    
    if (hideOption === 'today') {
      from = new Date().toISOString().split('T')[0];
      to = new Date().toISOString().split('T')[0];
    } else if (hideOption === 'range') {
      from = unavailabilityFrom;
      to = unavailabilityTo;
    }

    const toDateStr = hideOption === 'manual' ? 'I make it available' : (to || 'today');

    showConfirm(`Your property will be unavailable and will not visible to others publicly till ${toDateStr}. Are you sure?`, async () => {
      try {
        await propertyService.updateProperty(selectedPropertyToHide.id, { 
          availabilityStatus: 'unavailable',
          unavailabilityOption: hideOption,
          unavailableFrom: from,
          unavailableTo: to
        });
        showToast(`Property hidden from website`, "success");
        fetchMyProperties();
        setShowHideModal(false);
      } catch (error) {
        console.error("Error hiding property:", error);
        showToast("An error occurred", "error");
      }
    });
  };

  const removeListing = async (id: string) => {
    showConfirm("Are you sure you want to remove this listing?", async () => {
      try {
        await propertyService.deleteProperty(id);
        fetchMyProperties();
      } catch (error) {
        console.error("Error removing listing:", error);
        showToast("An error occurred", "error");
      }
    });
  };

  const viewBookings = async (propertyId: string, title: string) => {
    setSelectedPropertyTitle(title);
    setShowBookingsModal(true);
    setLoadingBookings(true);
    try {
      const allOwnerBookings = await bookingService.getBookingsByOwner(user!.uid);
      const propBookings = allOwnerBookings.filter(b => b.propertyId === propertyId);
      
      // Fetch financials for each booking (Owners are allowed to see this)
      const bookingsWithFinancials = await Promise.all(
        propBookings.map(async (booking) => {
          const financials = await bookingService.getBookingFinancials(booking.id!);
          return { ...booking, ...financials };
        })
      );

      setSelectedPropertyBookings(bookingsWithFinancials);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const viewReviews = (propertyId: string, title: string) => {
    setSelectedPropertyTitle(title);
    setShowReviewsModal(true);
    setLoadingReviews(true);
    
    // Realtime reviews for owner
    const reviewsQ = query(
      collection(db, 'reviews'),
      where('propertyId', '==', propertyId)
    );

    const unsubscribe = onSnapshot(reviewsQ, (snapshot) => {
      const reviews = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
      setSelectedPropertyReviews(reviews);
      setLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews realtime:", error);
      setLoadingReviews(false);
    });

    // Store unsubscribe to cleanup when modal closes
    (window as any)._reviewsUnsubscribe = unsubscribe;
  };

  // Cleanup unsubscribe when modal closes
  useEffect(() => {
    if (!showReviewsModal && (window as any)._reviewsUnsubscribe) {
      (window as any)._reviewsUnsubscribe();
      (window as any)._reviewsUnsubscribe = null;
    }
  }, [showReviewsModal]);

  const submitReply = async (reviewId: string) => {
    if (!replyText[reviewId]) return;
    try {
      await reviewService.addReply(reviewId, replyText[reviewId]);
      showToast("An error occurred", "error");
      // Update local state
      setSelectedPropertyReviews(prev => 
        prev.map(r => r.id === reviewId ? { ...r, reply: replyText[reviewId] } : r)
      );
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (error) {
      console.error("Error submitting reply:", error);
      showToast("An error occurred", "error");
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await bookingService.updateBookingStatus(bookingId, status);
      
      // Send email notification to visitor
      const booking = selectedPropertyBookings.find(b => b.id === bookingId);
      if (booking) {
        const visitor = await userService.getUserProfile(booking.visitorId);
        if (visitor && visitor.email) {
          await emailService.sendEmail({
            to: visitor.email,
            subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}: ${selectedPropertyTitle}`,
            text: `Hello ${visitor.displayName || 'User'},\n\nYour booking for "${selectedPropertyTitle}" has been ${status}.\n\nThank you,\nAdmin Team`,
            html: `<p>Hello ${visitor.displayName || 'User'},</p><p>Your booking for "<strong>${selectedPropertyTitle}</strong>" has been <strong>${status}</strong>.</p><p>Thank you,<br/>Admin Team</p>`
          });
        }
      }

      // Refresh bookings
      const allOwnerBookings = await bookingService.getBookingsByOwner(user!.uid);
      const propBookings = allOwnerBookings.filter(b => b.propertyId === selectedPropertyBookings[0]?.propertyId);
      setSelectedPropertyBookings(propBookings);
    } catch (error) {
      console.error("Error updating booking:", error);
      showToast("An error occurred", "error");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div />
        <button 
          onClick={() => navigate('/list-property')}
          className="flex items-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Property
        </button>
      </div>
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">No listings yet</h3>
          <p className="text-gray-500">You haven't listed any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property, index) => (
            <div key={`${property.id}-${index}`} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative h-48">
                <img src={property.photos?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=100"} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    property.status === 'Approved' ? 'bg-emerald-500 text-white' :
                    property.status === 'Pending' ? 'bg-amber-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {property.status}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    property.availabilityStatus !== 'unavailable' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {property.availabilityStatus !== 'unavailable' ? 'Available' : 'Hidden'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#1A1A2E] text-lg mb-1 truncate">{property.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {property.area}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-[#F59E0B]">₹{property.pricePerDay}<span className="text-xs text-gray-400 font-normal">/day</span></span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{property.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                  <Link to={`/property/${property.id}`} className="text-center py-2 text-sm font-bold text-[#1E1B4B] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    View Details
                  </Link>
                  <button 
                    onClick={() => navigate(`/list-property?edit=${property.id}`)}
                    className="text-center py-2 text-sm font-bold text-[#1E1B4B] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Edit Property
                  </button>
                  <button 
                    onClick={() => {
                      if (property.availabilityStatus !== 'unavailable') {
                        setSelectedPropertyToHide(property);
                        setShowHideModal(true);
                      } else {
                        propertyService.updateProperty(property.id, { availabilityStatus: 'available', unavailabilityOption: null, unavailableFrom: null, unavailableTo: null }).then(() => {
                          showToast("Property is now available", "success");
                          fetchMyProperties();
                        });
                      }
                    }}
                    className="text-center py-2 text-sm font-bold text-[#1E1B4B] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {property.availabilityStatus !== 'unavailable' ? 'Hide Listing' : 'Make Available'}
                  </button>
                  <button 
                    onClick={() => viewBookings(property.id, property.title)}
                    className="text-center py-2 text-sm font-bold text-[#1E1B4B] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Bookings
                  </button>
                  <button 
                    onClick={() => viewReviews(property.id, property.title)}
                    className="text-center py-2 text-sm font-bold text-[#1E1B4B] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Reviews
                  </button>
                  <button 
                    onClick={() => removeListing(property.id)}
                    className="text-center py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hide Property Modal */}
      <AnimatePresence>
        {showHideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHideModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100">
              <h3 className="text-2xl font-bold text-[#1E1B4B] mb-6 text-center">Hide Property</h3>
              
              <div className="space-y-4 mb-8">
                <p className="text-sm text-gray-500 mb-4">Select how long you want to hide this property from the website.</p>
                
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${hideOption === 'today' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="hideOption" checked={hideOption === 'today'} onChange={() => setHideOption('today')} className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm">Only for today</span>
                </label>

                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${hideOption === 'manual' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="hideOption" checked={hideOption === 'manual'} onChange={() => setHideOption('manual')} className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm">Until I make it available</span>
                </label>

                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${hideOption === 'range' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="hideOption" checked={hideOption === 'range'} onChange={() => setHideOption('range')} className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm">Specific date range</span>
                </label>

                {hideOption === 'range' && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From</label>
                      <input 
                        type="date" 
                        value={unavailabilityFrom}
                        onChange={(e) => setUnavailabilityFrom(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To</label>
                      <input 
                        type="date" 
                        value={unavailabilityTo}
                        onChange={(e) => setUnavailabilityTo(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        min={unavailabilityFrom || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowHideModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                <button 
                  onClick={handleHideProperty}
                  disabled={hideOption === 'range' && (!unavailabilityFrom || !unavailabilityTo)}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-md bg-amber-500 hover:bg-amber-600 disabled:opacity-50`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReviewsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReviewsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-10 border border-slate-100 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-[#1E1B4B]">Reviews for {selectedPropertyTitle}</h3>
                <button onClick={() => setShowReviewsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {loadingReviews ? (
                  <div className="text-center py-8 text-gray-500">Loading reviews...</div>
                ) : selectedPropertyReviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No reviews yet for this property.</div>
                ) : (
                  selectedPropertyReviews.map((review) => (
                    <div key={review.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-4">
                        <img src={review.visitorAvatar || getAvatarUrl(review.visitorName)} alt={review.visitorName} className="w-12 h-12 rounded-full bg-slate-200" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-bold text-[#1E1B4B]">{review.visitorName}</h4>
                          <p className="text-xs text-[#64748B]">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#64748B] leading-relaxed">{review.text}</p>
                      
                      <div className="pt-4 border-t border-slate-200">
                        {review.reply ? (
                          <div className="bg-white p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-[#1E1B4B] mb-1">Your Reply:</p>
                            <p className="text-sm text-[#64748B]">{review.reply}</p>
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={replyText[review.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                              placeholder="Write a reply..."
                              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 text-sm mb-3 resize-none h-20"
                            />
                            <button 
                              onClick={() => submitReply(review.id)}
                              disabled={!replyText[review.id]}
                              className="text-sm font-bold bg-[#1E1B4B] text-white px-4 py-2 rounded-lg hover:bg-[#1E1B4B]/90 disabled:opacity-50 transition-colors"
                            >
                              Submit Reply
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bookings Modal */}
      <AnimatePresence>
        {showBookingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBookingsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-10 border border-slate-100 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-[#1E1B4B]">Bookings for {selectedPropertyTitle}</h3>
                <button onClick={() => setShowBookingsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
                </div>
              ) : selectedPropertyBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found for this property.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPropertyBookings.map(booking => (
                    <div key={booking.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#1A1A2E]">{booking.visitorName}</p>
                        <p className="text-sm text-gray-500">Contact: {booking.visitorContact}</p>
                        <p className="text-sm text-gray-500">
                          {booking.checkIn ? format(booking.checkIn, 'MMM dd, yyyy') : 'N/A'} - {booking.checkOut ? format(booking.checkOut, 'MMM dd, yyyy') : 'N/A'} ({booking.nights} nights)
                        </p>
                        <p className="text-sm font-medium mt-1">Total Amount: ₹{booking.totalAmount || booking.estimatedCost}</p>
                        <p className="text-sm font-medium text-emerald-600">Your Revenue: ₹{booking.receivedAmount || (booking.estimatedCost * 0.75)}</p>
                        
                        {booking.guests && booking.guests.length > 0 && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider mb-2">Guest Details</p>
                            <div className="space-y-2">
                              {booking.guests.map((guest: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-600 flex justify-between">
                                  <span>{guest.name} ({guest.age}, {guest.gender})</span>
                                  <span className="text-gray-400">{guest.relation || guest.contact || 'Guest'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          booking.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="text-xs font-bold bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 mt-2"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WalletTab() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', branchName: '', bankName: '' });
  const [cooldown, setCooldown] = useState(0);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      const walletData = await walletService.getWallet(user.uid);
      setWallet(walletData);
      const txns = await walletService.getTransactions(user.uid);
      setTransactions(txns);
      if (walletData.bankAccount) {
        setBankDetails(walletData.bankAccount);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const pendingWithdrawalsAmount = transactions
    .filter(t => t.type === 'debit' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysWithdrawals = transactions.filter(t => 
    t.type === 'debit' && 
    t.reason === 'withdrawal' && 
    t.createdAt && 
    t.createdAt.toDate() >= today
  );
  
  const todaysWithdrawalCount = todaysWithdrawals.length;
  const todaysWithdrawalAmount = todaysWithdrawals.reduce((sum, t) => sum + t.amount, 0);

  const handleSaveBankDetails = async () => {
    if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.branchName || !bankDetails.bankName) {
      showToast("An error occurred", "error");
      return;
    }
    try {
      await walletService.updateBankAccount(user!.uid, { ...bankDetails, verified: false });
      fetchWalletData();
      setShowBankDetailsModal(false);
      showToast("An error occurred", "error");
    } catch (error) {
      console.error("Error saving bank details:", error);
      showToast("An error occurred", "error");
    }
  };

  const handleNextStep = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("An error occurred", "error");
      return;
    }
    if (amount > (wallet?.availableBalance || 0)) {
      showToast("An error occurred", "error");
      return;
    }
    if (todaysWithdrawalCount >= 2) {
      showToast("An error occurred", "error");
      return;
    }
    if (todaysWithdrawalAmount + amount > 10000) {
      showToast("An error occurred", "error");
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.bankName) {
      showToast("An error occurred", "error");
      setShowWithdrawModal(false);
      setShowBankDetailsModal(true);
      return;
    }
    setWithdrawStep(2);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    try {
      await walletService.requestWithdrawal(user!.uid, amount, bankDetails);
      showToast("An error occurred", "error");
      setShowWithdrawModal(false);
      setWithdrawStep(1);
      setWithdrawAmount('');
      setCooldown(10);
      fetchWalletData();
    } catch (error: any) {
      console.error("Error requesting withdrawal:", error);
      showToast("An error occurred", "error");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-white/80">
              <WalletIcon className="w-5 h-5" />
              <span className="font-medium">Available Balance</span>
            </div>
            <h2 className="text-4xl font-extrabold mb-6">₹{wallet?.availableBalance || 0}</h2>
            <button 
              onClick={() => { setShowWithdrawModal(true); setWithdrawStep(1); }}
              disabled={(wallet?.availableBalance || 0) <= 0 || cooldown > 0}
              className="bg-white text-[#1E1B4B] px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Wait ${cooldown}s` : 'Withdraw to Bank'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Pending Withdrawals</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#1A1A2E] mb-2">₹{pendingWithdrawalsAmount}</h2>
          <p className="text-sm text-gray-500">
            Will be credited to your bank account in 3-4 working days.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#1A1A2E]">Saved Bank Details</h3>
          <button 
            onClick={() => setShowBankDetailsModal(true)}
            className="text-sm font-bold text-[#F59E0B] hover:text-amber-600 transition-colors"
          >
            Edit Details
          </button>
        </div>
        
        {wallet?.bankAccount ? (
          <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                <Building2 className="w-6 h-6 text-[#4B5563]" />
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">{wallet.bankAccount.bankName}</p>
                <p className="text-sm text-gray-500">Account: •••• {wallet.bankAccount.accountNumber.slice(-4)}</p>
                <p className="text-xs text-gray-400">IFSC: {wallet.bankAccount.ifsc}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#F59E0B] bg-[#FDF6E3] px-3 py-1 rounded-full">Primary</span>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-4">No bank details saved yet.</p>
            <button 
              onClick={() => setShowBankDetailsModal(true)}
              className="text-sm font-bold text-[#1E1B4B] bg-white px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Add Bank Account
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#1A1A2E] mb-6">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {txn.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E] capitalize">{txn.reason.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">
                      {txn.createdAt ? format(txn.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-[#1A1A2E]'}`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    txn.status === 'completed' || txn.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                    txn.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showBankDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBankDetailsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100"
            >
              <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">Bank Details</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">Account Holder Name</label>
                  <input 
                    type="text" 
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">Bank Name</label>
                  <input 
                    type="text" 
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">Account Number</label>
                  <input 
                    type="text" 
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">IFSC Code</label>
                  <input 
                    type="text" 
                    value={bankDetails.ifsc}
                    onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">Branch Name</label>
                  <input 
                    type="text" 
                    value={bankDetails.branchName}
                    onChange={(e) => setBankDetails({...bankDetails, branchName: e.target.value})}
                    placeholder="e.g. Main Branch"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBankDetailsModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBankDetails}
                  className="flex-[2] bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowWithdrawModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100"
            >
              {withdrawStep === 1 ? (
                <>
                  <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">Withdraw Funds</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">Amount (₹)</label>
                      <input 
                        type="number" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`Max: ₹${wallet?.availableBalance || 0}`}
                        max={wallet?.availableBalance || 0}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Daily limit: ₹10,000 (Max 2 withdrawals/day)</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleNextStep}
                      className="flex-[2] bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">Confirm Withdrawal</h3>
                  
                  <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Amount</span>
                      <span className="font-bold text-[#1A1A2E]">₹{withdrawAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Bank</span>
                      <span className="font-bold text-[#1A1A2E]">{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Account</span>
                      <span className="font-bold text-[#1A1A2E]">{bankDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">IFSC</span>
                      <span className="font-bold text-[#1A1A2E]">{bankDetails.ifsc}</span>
                    </div>
                  </div>

                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6">
                    Please verify your bank details. Incorrect details may lead to failed or delayed transfers.
                  </p>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setWithdrawStep(1)}
                      className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Edit Details
                    </button>
                    <button 
                      onClick={handleWithdraw}
                      className="flex-[2] bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      Confirm & Submit
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F59E0B]" /> Terms & Conditions
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            By using Shelterbee, you agree to our terms of service. All bookings are subject to host approval and availability. Users must provide accurate identification when requested. Shelterbee reserves the right to suspend accounts that violate our community guidelines.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F59E0B]" /> Payment & Refund Policy
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Payments are securely processed via our payment partners. A platform fee is applied to all bookings. Refunds for cancellations are subject to the specific property's cancellation policy. The platform fee is non-refundable.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#F59E0B]" /> Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-bold text-[#1A1A2E] text-sm mb-2">Is it safe to book?</h4>
              <p className="text-sm text-gray-600">Yes, stays are verified before approval and basic safety checks are done to ensure your security.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-bold text-[#1A1A2E] text-sm mb-2">What if my payment fails?</h4>
              <p className="text-sm text-gray-600">You can retry or use another method. Your booking is not confirmed until the payment succeeds.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-bold text-[#1A1A2E] text-sm mb-2">Are there any hidden charges?</h4>
              <p className="text-sm text-gray-600">No hidden charges. The total price is shown before you make the payment.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PropertyApprovalsTab() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingProperties = async () => {
      if (!user) return;
      try {
        const myProps = await propertyService.getPropertiesByOwner(user.uid);
        setProperties(myProps.filter(p => p.status === 'Pending'));
      } catch (error) {
        console.error("Error fetching pending properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingProperties();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">All Caught Up!</h3>
          <p className="text-gray-500">You have no properties waiting for admin approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property, index) => (
            <div key={`${property.id}-${index}`} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative h-48">
                <img src={property.photos?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=100"} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-amber-500 text-white">
                    Pending Review
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#1A1A2E] text-lg mb-1 truncate">{property.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {property.area}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-[#F59E0B]">₹{property.pricePerDay}<span className="text-xs text-gray-400 font-normal">/day</span></span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{property.type}</span>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    This property is currently under review by our admin team. It will be visible to visitors once approved.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerDashboardTab({ user, profile, isEditing, setIsEditing, setActiveTab, setShowOTPModal }: { user: any, profile: any, isEditing: boolean, setIsEditing: (v: boolean) => void, setActiveTab: (tab: Tab) => void, setShowOTPModal: (v: boolean) => void }) {
  const { updateProfileData } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    location: profile?.location || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const properties = await propertyService.getPropertiesByOwner(user.uid);
        const wallet = await walletService.getWallet(user.uid);
        const txns = await walletService.getTransactions(user.uid);
        
        // Fetch all bookings for owner's properties
        const allBookings = await bookingService.getBookingsByOwner(user.uid);
        const completedBookings = allBookings.filter(b => b.status === 'completed');
        
        // Fetch reviews for owner's properties
        const reviewsSnapshot = await getDocs(query(collection(db, 'reviews'), where('propertyOwnerId', '==', user.uid)));
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        
        const totalRatings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const averageRating = reviews.length > 0 ? (totalRatings / reviews.length).toFixed(1) : 0;

        const pendingPayments = txns
          .filter(t => t.type === 'debit' && t.status === 'pending')
          .reduce((sum, t) => sum + t.amount, 0);

        setStats({
          totalListings: properties.length,
          availableListings: properties.filter(p => p.status === 'Approved' && p.isAvailable !== false).length,
          pendingListings: properties.filter(p => p.status === 'Pending').length,
          walletBalance: wallet?.availableBalance || 0,
          pendingPayments,
          totalRevenue: wallet?.availableBalance || 0, // Simplified
          averageRating,
          totalVisitors: completedBookings.length,
          occupancyRate: properties.length > 0 ? Math.round((completedBookings.length / (properties.length * 30)) * 100) : 0, // Mock occupancy over 30 days
          rejections: properties.filter(p => p.status === 'Rejected').length,
          reviewCount: reviews.length
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfileData(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      showToast("An error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Details Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#F3F4F6] rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-[#1A1A2E]" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.displayName} 
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
              />
            ) : (
              <p className="text-[#1A1A2E] font-medium">{profile?.displayName || 'Not provided'}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
            <div className="flex items-center gap-3">
              <p className="text-[#1A1A2E] font-medium">{user.email}</p>
              {profile?.emailVerified ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                  <CheckCircle2 size={12} />
                  Verified
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">
                    Not Verified
                  </div>
                  <button 
                    onClick={async () => {
                      if (user?.email) {
                        const otp = generateOTP();
                        storeOTP(otp, user.email);
                        await sendOTPEmail(user.email, otp);
                        setShowOTPModal(true);
                      }
                    }}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline"
                  >
                    Verify Now
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                placeholder="+1 (555) 012 - 3456"
              />
            ) : (
              <p className="text-[#1A1A2E] font-medium">{profile?.phoneNumber || 'Not provided'}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                placeholder="San Francisco, CA"
              />
            ) : (
              <p className="text-[#1A1A2E] font-medium">{profile?.location || 'Not provided'}</p>
            )}
          </div>
        </div>
        
        {isEditing && (
          <div className="mt-8 flex justify-end gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-bold bg-[#F59E0B] text-white rounded-lg hover:bg-amber-400 transition-colors"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div />
        <Link 
          to="/list-property"
          className="flex items-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" /> Add New Property
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveTab('wallet')}
          className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-white/80">
              <WalletIcon className="w-5 h-5" />
              <span className="font-medium">Wallet Balance</span>
            </div>
            <h3 className={`text-3xl font-extrabold mb-1 ${stats?.walletBalance < 0 ? 'text-red-400' : ''}`}>
              ₹{stats?.walletBalance}
            </h3>
            {stats?.walletBalance < 0 && (
              <p className="text-xs text-red-400 font-medium mb-1">Negative balance will be deducted from future earnings.</p>
            )}
            <p className="text-sm text-emerald-400 font-medium">+₹{stats?.pendingPayments} pending</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('favourites')}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Total Listings</span>
          </div>
          <h3 className="text-3xl font-extrabold text-[#1A1A2E] mb-1">{stats?.totalListings}</h3>
          <p className="text-sm text-gray-500 font-medium">{stats?.availableListings} active, {stats?.pendingListings} pending</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Star className="w-5 h-5 text-[#F59E0B]" />
            <span className="font-medium">Average Rating</span>
          </div>
          <h3 className="text-3xl font-extrabold text-[#1A1A2E] mb-1">{stats?.averageRating}</h3>
          <p className="text-sm text-gray-500 font-medium">Based on {stats?.reviewCount || 0} reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Visitors</p>
            <p className="text-xl font-bold text-[#1A1A2E]">{stats?.totalVisitors}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Occupancy Rate</p>
            <p className="text-xl font-bold text-[#1A1A2E]">{stats?.occupancyRate}%</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('wallet')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-xl font-bold text-[#1A1A2E]">₹{stats?.totalRevenue}</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('approvals')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rejections</p>
            <p className="text-xl font-bold text-[#1A1A2E]">{stats?.rejections}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ isOpen, onClose, booking, profile }: { isOpen: boolean, onClose: () => void, booking: any, profile: any }) {
  const [rating, setRating] = useState(5);
  const [ratings, setRatings] = useState({
    cleanliness: 5,
    safety: 5,
    ownerBehavior: 5,
    comfort: 5
  });
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!booking || !text) return;
    setIsSubmitting(true);
    try {
      await reviewService.addReview({
        propertyId: booking.propertyId,
        visitorId: booking.visitorId,
        visitorName: profile?.displayName || 'Anonymous',
        visitorAvatar: profile?.photoURL || getAvatarUrl(profile?.displayName || 'Anonymous', profile?.gender, profile?.role),
        text,
        rating,
        ratings,
        date: format(new Date(), 'MMM dd, yyyy')
      });

      // Send Email to Owner
      try {
        const property = await propertyService.getPropertyById(booking.propertyId);
        if (property) {
          const ownerProfile = await userService.getUserProfile(property.ownerId);
          if (ownerProfile?.email) {
            const template = emailTemplates.getReviewNotification(
              ownerProfile.displayName || 'Owner',
              property.title,
              profile?.displayName || 'A guest',
              rating,
              text
            );
            await emailService.sendEmail({
              to: ownerProfile.email,
              subject: template.subject,
              html: template.html
            });
          }
        }
      } catch (e) {
        console.error("Failed to send review email:", e);
      }

      showToast("Review submitted successfully!", "success");
      onClose();
    } catch (error) {
      console.error("Error adding review:", error);
      showToast("Failed to submit review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">Rate your stay</h3>
        
        <div className="space-y-6 mb-8">
          {[
            { label: 'Cleanliness', key: 'cleanliness' },
            { label: 'Safety & Security', key: 'safety' },
            { label: 'Owner Behavior', key: 'ownerBehavior' },
            { label: 'Comfort', key: 'comfort' }
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-sm font-bold text-[#1E1B4B] mb-2">{item.label}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRatings({ ...ratings, [item.key as keyof typeof ratings]: star })}
                    className={`p-1 transition-colors ${ratings[item.key as keyof typeof ratings] >= star ? 'text-amber-500' : 'text-gray-200'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-bold text-[#1E1B4B] mb-2">Overall Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors ${rating >= star ? 'text-amber-500' : 'text-gray-200'}`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1E1B4B] mb-2">Your Review</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 text-sm h-32 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !text}
            className="flex-[2] bg-[#1E1B4B] text-white font-bold py-3 rounded-xl hover:bg-[#1E1B4B]/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReportModal({ isOpen, onClose, booking }: { isOpen: boolean, onClose: () => void, booking: any }) {
  const [reason, setReason] = useState('');
  const [otherIssue, setOtherIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Cleanliness Issues',
    'Misleading Information',
    'Safety & Security Concerns',
    'Owner Behavior Issues',
    'Pricing & Payment Issues',
    'Booking Issues',
    'Maintenance Problems',
    'Noise or Disturbance',
    'Illegal or Suspicious Activity',
    'Other Issue'
  ];

  const handleSubmit = async () => {
    if (!booking || !reason) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        visitorId: booking.visitorId,
        reason,
        otherIssue: reason === 'Other Issue' ? otherIssue : '',
        createdAt: serverTimestamp()
      });
      showToast("Report submitted successfully", "success");
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      showToast("Failed to submit report", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100">
        <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">Report Property</h3>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-bold text-[#1E1B4B] mb-2">Reason for Reporting</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 text-sm"
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === 'Other Issue' && (
            <div>
              <label className="block text-sm font-bold text-[#1E1B4B] mb-2">Please specify</label>
              <textarea 
                value={otherIssue}
                onChange={(e) => setOtherIssue(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 text-sm h-32 resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason || (reason === 'Other Issue' && !otherIssue)}
            className="flex-[2] bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}