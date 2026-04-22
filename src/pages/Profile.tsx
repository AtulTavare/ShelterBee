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
import { walletService } from '../services/walletService';
import { Bed } from 'lucide-react';
import { emailTemplates } from '../services/emailTemplates';
import { format, differenceInHours } from 'date-fns';
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
  Home,
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Star,
  Users,
  TrendingUp,
  Calendar,
  XCircle,
  Phone,
  ShieldAlert,
  RefreshCw,
  Trash2,
  MessageSquare,
  Eye,
  EyeOff,
  IndianRupee,
  Landmark
} from 'lucide-react';

import PropertyCard from '../components/PropertyCard';

import { OTPModal, generateOTP, storeOTP, sendOTPEmail } from '../components/OTPModal';
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

import { getAvatarUrl } from '../utils/avatar';
import { auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type Tab = 'personal' | 'wallet' | 'payments' | 'history' | 'favourites' | 'security' | 'dashboard' | 'approvals' | 'new-bookings';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isOwner = profile?.role === 'owner';
  const isAdminUser = profile?.role === 'admin';
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rejectedProperties, setRejectedProperties] = useState<any[]>([]);

  // Realtime Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('Setting up wallet subscriptions for:', user.uid);
    const unsubBalance = walletService.subscribeToWalletBalance(
      user.uid,
      (balance) => setWalletBalance(balance)
    );
    
    const unsubTransactions = walletService.subscribeToWalletTransactions(
      user.uid,
      (transactions) => setWalletTransactions(transactions)
    );
    
    return () => {
      unsubBalance();
      unsubTransactions();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (showOTPModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showOTPModal]);

  useEffect(() => {
    if (isOwner && user) {
      const q = query(collection(db, 'properties'), where('ownerId', '==', user.uid), where('status', '==', 'Rejected'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const rejected = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRejectedProperties(rejected);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'properties');
      });
      return () => unsubscribe();
    }
  }, [isOwner, user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, loading, navigate]);

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
    { id: 'new-bookings', label: 'Bookings', icon: Calendar },
    { id: 'favourites', label: 'My Listings', icon: Heart },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ] : [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'history', label: 'My Bookings', icon: History },
    { id: 'favourites', label: 'Favourites', icon: Heart },
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

          {isOwner && rejectedProperties.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">Property Listing Rejected</h4>
                <div className="mt-1 space-y-1">
                  {rejectedProperties.map(prop => (
                    <p key={prop.id} className="text-xs text-red-700">
                      <span className="font-bold">{prop.title}:</span> {prop.rejectionReason || 'No reason provided by admin.'}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <OwnerDashboardTab user={user} profile={profile} isEditing={isEditing} setIsEditing={setIsEditing} setActiveTab={setActiveTab} setShowOTPModal={setShowOTPModal} walletBalance={walletBalance} />}
              {activeTab === 'personal' && <PersonalInfoTab user={user} profile={profile} isEditing={isEditing} setIsEditing={setIsEditing} setShowOTPModal={setShowOTPModal} />}
              {activeTab === 'wallet' && <WalletTab walletBalance={walletBalance} walletTransactions={walletTransactions} />}
              {activeTab === 'history' && <MyBookingsTab />}
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
            try {
              await updateDoc(doc(db, 'users', user.uid), {
                emailVerified: true
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, 'users');
            }
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
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'confirmed' | 'cancelled' | 'rejected' | 'past'>('new');

  const handleAccept = async (booking: any) => {
    if (processing) return;
    setProcessing(true);
    try {
      await bookingService.acceptBooking(booking.id);
      showToast("Booking accepted and visitor notified", "success");
      fetchBookings();
    } catch (error: any) {
      console.error("Error accepting booking:", error);
      showToast(error.message || "Failed to accept booking", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || !selectedBooking) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    setProcessing(true);
    try {
      await bookingService.rejectBooking(selectedBooking.id, rejectionReason);

      const template = emailTemplates.getBookingRejection(
        selectedBooking.visitorName,
        selectedBooking.property?.title || 'Property',
        rejectionReason
      );
      
      const visitorProfile = await userService.getUserProfile(selectedBooking.visitorId);
      if (visitorProfile?.email) {
        await emailService.sendEmail({
          to: visitorProfile.email,
          subject: template.subject,
          html: template.html
        });
      }

      showToast("Booking rejected and refund processed", "success");
      setShowRejectModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      console.error("Error rejecting booking:", error);
      showToast(error.message || "Failed to reject booking", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    // ... same as before
    if (!visitTime.trim() || !selectedBooking) {
      showToast("Please specify visit time", "error");
      return;
    }
    setProcessing(true);
    try {
      await bookingService.updateBookingStatus(selectedBooking.id, 'confirmed', {
        visitTime,
        confirmedAt: serverTimestamp()
      });

      const template = emailTemplates.getBookingConfirmationWithVisit(
        selectedBooking.visitorName,
        selectedBooking.property?.title || 'Property',
        visitTime
      );
      
      const visitorProfile = await userService.getUserProfile(selectedBooking.visitorId);
      if (visitorProfile?.email) {
        await emailService.sendEmail({
          to: visitorProfile.email,
          subject: template.subject,
          html: template.html
        });
      }

      showToast("Booking confirmed", "success");
      setShowConfirmModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error("Error confirming booking:", error);
      showToast("Failed to confirm booking", "error");
    } finally {
      setProcessing(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const allOwnerBookings = await bookingService.getBookingsByOwner(user.uid);
      const sorted = allOwnerBookings.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setAllBookings(sorted);
    } catch (error) {
      console.error("Error fetching owner bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  useEffect(() => {
    const now = new Date();
    let filtered = [];
    if (activeSubTab === 'new') {
      filtered = allBookings.filter(b => b.status === 'pending_owner');
    } else if (activeSubTab === 'confirmed') {
      filtered = allBookings.filter(b => b.status === 'confirmed');
    } else if (activeSubTab === 'cancelled') {
      filtered = allBookings.filter(b => b.status === 'cancelled');
    } else if (activeSubTab === 'rejected') {
      filtered = allBookings.filter(b => b.status === 'rejected_by_owner');
    } else if (activeSubTab === 'past') {
      filtered = allBookings.filter(b => b.status === 'completed' || (b.checkOut && b.checkOut < now));
    }
    setBookings(filtered);
  }, [activeSubTab, allBookings]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-xl font-black text-[#1A1A2E] flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          Bookings
        </h2>
        
        <div className="flex bg-slate-50 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'new', label: 'New' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'past', label: 'Past' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? 'bg-white text-[#1A1A2E] shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-400">No {activeSubTab} bookings</h3>
          <p className="text-sm text-slate-400">Bookings in this category will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <motion.div 
              key={booking.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <img src={getAvatarUrl(booking.visitorName)} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm shrink-0" alt="Visitor" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#1A1A2E] text-xs leading-tight truncate">{booking.visitorName}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${booking.status === 'pending_owner' ? 'bg-amber-400 animate-pulse' : booking.status === 'confirmed' ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest truncate">
                          {booking.status === 'pending_owner' ? 'Pending' : booking.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right flex items-center sm:block gap-2 sm:gap-0 mt-1 sm:mt-0">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5 whitespace-nowrap">Payout</p>
                    <p className="font-black text-emerald-600 text-sm">₹{(booking.receivedAmount || (booking.totalAmount * 0.75) || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="font-bold text-[#1A1A2E] text-[10px] truncate">
                      {booking.checkIn ? format(booking.checkIn, 'MMM dd') : 'N/A'} - {booking.checkOut ? format(booking.checkOut, 'MMM dd') : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="font-bold text-[#1A1A2E] text-[10px] truncate">
                      {booking.guests?.length || 1} Guest(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4 text-[10px] font-medium text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  <Home className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span className="truncate">{booking.property?.title || 'Property Details'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {booking.status === 'pending_owner' ? (
                  <>
                    <button 
                      onClick={() => { setSelectedBooking(booking); setShowRejectModal(true); }} 
                      disabled={processing}
                      className="flex-1 h-10 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-red-100 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button 
                      onClick={() => handleAccept(booking)} 
                      disabled={processing}
                      className="flex-[1.5] h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {processing ? 'Processing...' : 'Accept Booking'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setSelectedBooking(booking)} className="w-full h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-2">Details</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && !showRejectModal && !showConfirmModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="modal-content bg-white rounded-3xl p-8 max-w-lg shadow-2xl relative z-10 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-[#1A1A2E] tracking-tight">Booking Details</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">ID: #{selectedBooking.id?.substring(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 p-2">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                 {/* Visitor Identity */}
                 <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <img src={getAvatarUrl(selectedBooking.visitorName)} className="w-16 h-16 rounded-full border-2 border-white shadow-sm" alt="Visitor" />
                    <div>
                       <h4 className="font-black text-lg text-[#1A1A2E] leading-tight">{selectedBooking.visitorName}</h4>
                       <p className="text-sm text-slate-500 font-medium">{selectedBooking.visitorContact}</p>
                       <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Verified Visitor</span>
                       </div>
                    </div>
                 </div>

                 {/* Stay Summary */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Check-in</p>
                       <p className="font-black text-[#1A1A2E]">{selectedBooking.checkIn ? format(selectedBooking.checkIn, 'MMM dd, yyyy') : 'TBD'}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Check-out</p>
                       <p className="font-black text-[#1A1A2E]">{selectedBooking.checkOut ? format(selectedBooking.checkOut, 'MMM dd, yyyy') : 'TBD'}</p>
                    </div>
                 </div>

                 {/* Guest List */}
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Guest Occupants ({selectedBooking.guests?.length || 1})</p>
                    <div className="space-y-2">
                       {(selectedBooking.guests || [{ name: selectedBooking.visitorName, age: 'Adult', gender: 'Not specified' }]).map((guest: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <div>
                              <p className="text-xs font-bold text-[#1A1A2E]">{guest.name}</p>
                              <p className="text-[10px] text-slate-500">{guest.age} • {guest.gender}</p>
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{guest.relation || 'Guest'}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Financial Overview */}
                 <div className="p-5 bg-[#1A1A2E] rounded-3xl text-white shadow-xl shadow-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payout Overview</p>
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Total Value</span>
                          <span className="font-bold">₹{(selectedBooking.totalAmount || 0).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Service Fee (25%)</span>
                          <span className="font-bold text-red-300">-₹{((selectedBooking.totalAmount || 0) * 0.25).toLocaleString()}</span>
                       </div>
                       <div className="pt-3 border-t border-slate-700 flex justify-between">
                          <span className="font-bold">Your Revenue</span>
                          <span className="font-black text-xl text-emerald-400">₹{((selectedBooking.totalAmount || 0) * 0.75).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 {/* Sticky Actions */}
                 {selectedBooking.status === 'pending' && (
                    <div className="flex gap-3 pt-4">
                       <button onClick={() => setShowRejectModal(true)} className="flex-1 py-4 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl font-bold transition-all border border-red-100">Reject</button>
                       <button onClick={() => setShowConfirmModal(true)} className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20">Confirm Visit</button>
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content bg-white rounded-3xl p-8 max-w-md shadow-2xl relative z-[120]">
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-4">Reject Booking</h3>
              <p className="text-sm text-gray-500 mb-6">Please provide a reason for rejecting this booking. This will be shared with the visitor.</p>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." className="w-full h-32 p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-500/50 outline-none transition-all text-gray-800 resize-none mb-6" />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button disabled={!rejectionReason || processing} onClick={handleReject} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50">{processing ? 'Rejecting...' : 'Confirm Reject'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content bg-white rounded-3xl p-8 max-w-md shadow-2xl relative z-[120]">
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-4">Confirm Booking</h3>
              <p className="text-sm text-gray-500 mb-6">Schedule a property visit for the visitor. Please select a date and time.</p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Visit Date & Time</label>
                  <input type="datetime-local" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button disabled={!visitTime || processing} onClick={handleConfirm} className="flex-1 py-3 bg-[#1A1A2E] text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50">{processing ? 'Confirming...' : 'Confirm Booking'}</button>
              </div>
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
    location: profile?.location || '',
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
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full border-b border-gray-300 focus:border-[#F59E0B] outline-none py-1 text-[#1A1A2E] font-medium bg-transparent"
                  placeholder="City, Area"
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
                    booking.status === 'pending_owner' ? 'text-amber-600 bg-amber-50' :
                    booking.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>
                    {booking.status === 'pending_owner' ? 'Pending' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
                  <span className="font-bold text-[#1A1A2E]">₹{(booking.totalAmount || booking.estimatedCost || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MyBookingsTab() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { property?: any })[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const getVisitorStatusDisplay = (status: string, checkOut: Date | null) => {
    const now = new Date();
    if (status === 'completed' || (checkOut && now > checkOut)) return { label: 'Completed', note: '', color: 'bg-slate-500/90' };
    if (status === 'pending_owner') return { label: 'Confirmed', note: 'Awaiting property owner confirmation', color: 'bg-emerald-500/90' };
    if (status === 'confirmed') return { label: 'Confirmed', note: '', color: 'bg-emerald-500/90' };
    if (status === 'rejected_by_owner') return { label: 'Cancelled', note: 'Cancelled by property owner. 95% refund credited to your wallet.', color: 'bg-rose-500/90' };
    if (status === 'cancelled') return { label: 'Cancelled by you', note: '', color: 'bg-gray-500/90' };
    return { label: status.replace('_', ' '), note: '', color: 'bg-slate-500/90' };
  };

  useEffect(() => {
    if (showReviewModal || showReportModal || showCancellationModal || !!selectedBooking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showReviewModal, showReportModal, showCancellationModal, selectedBooking]);
  const [ownersInfo, setOwnersInfo] = useState<Record<string, any>>({});
  const [loadingOwners, setLoadingOwners] = useState<Record<string, boolean>>({});

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

        // Fetch owner info for confirmed bookings
        bookingsWithProperties.forEach(async (booking) => {
          if (booking.status === 'confirmed' && !ownersInfo[booking.ownerId]) {
            setLoadingOwners(prev => ({ ...prev, [booking.ownerId]: true }));
            try {
              const owner = await userService.getUserProfile(booking.ownerId);
              setOwnersInfo(prev => ({ ...prev, [booking.ownerId]: owner }));
            } catch (error) {
              console.error("Error fetching owner info:", error);
            } finally {
              setLoadingOwners(prev => ({ ...prev, [booking.ownerId]: false }));
            }
          }
        });

      } catch (error) {
        console.error("Error syncing bookings:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });

    const reviewsQ = query(collection(db, 'reviews'), where('visitorId', '==', user.uid));
    const unsubscribeReviews = onSnapshot(reviewsQ, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserReviews(reviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });

    return () => {
      unsubscribe();
      unsubscribeReviews();
    };
  }, [user]);

  const closeModals = () => {
    setShowReviewModal(false);
    setShowReportModal(false);
    setShowCancellationModal(false);
    document.body.style.overflow = 'unset';
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
      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
          <History className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">No bookings yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">Your travel history is empty. Start exploring properties to make your first stay unforgettable!</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-8 px-8 py-3 bg-[#1A1A2E] text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm"
          >
            Explore Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {bookings.map((booking) => {
            const owner = ownersInfo[booking.ownerId];
            const isLoadingOwner = loadingOwners[booking.ownerId];
            const hasReviewed = userReviews.some(r => r.bookingId === booking.id);

            return (
              <div 
                key={booking.id} 
                className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left: Property Preview */}
                  <div className="lg:w-1/3 relative h-64 lg:h-auto overflow-hidden">
                    <img 
                      src={booking.property?.photos?.[0] || `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600&h=400`} 
                      alt="Property" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-6 left-6 flex flex-col gap-2 items-start">
                      {(() => {
                        const display = getVisitorStatusDisplay(booking.status, booking.checkOut);
                        return (
                          <>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl border border-white/20 ${display.color}`}>
                              {display.label}
                            </span>
                            {display.note && (
                              <p className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded-lg backdrop-blur-md max-w-[200px]">
                                {display.note}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right: Detailed Info */}
                  <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-black text-[#1A1A2E] text-2xl lg:text-3xl mb-2 tracking-tight">{booking.property?.title || 'Unknown Property'}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2 font-medium">
                            <MapPin className="w-4 h-4 text-[#F59E0B]" /> {booking.property?.address || booking.property?.area || 'Location hidden'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                          <p className="text-2xl font-black text-[#1A1A2E]">₹{(booking.totalAmount || (booking as any).estimatedCost || 0).toLocaleString()}</p>
                          
                          {booking.status === 'pending_owner' && (
                            <div className="mt-2 bg-amber-50 text-amber-600 px-3 py-1 rounded-lg border border-amber-100 text-[9px] font-bold text-center">
                              Awaiting final confirmation from property owner.
                            </div>
                          )}

                          {booking.status === 'rejected_by_owner' && (
                            <div className="mt-2 bg-red-50 text-red-600 px-3 py-1 rounded-lg border border-red-100 text-[9px] font-bold text-center">
                              Booking rejected by owner. 95% refund credited to wallet.
                            </div>
                          )}

                          {booking.visitTime && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                              <Clock className="w-3 h-3" /> Visit: {booking.visitTime}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Check In
                          </p>
                          <p className="font-bold text-[#1A1A2E] text-lg">{booking.checkIn ? format(booking.checkIn, 'MMM dd, yyyy') : 'TBD'}</p>
                        </div>
                        <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Check Out
                          </p>
                          <p className="font-bold text-[#1A1A2E] text-lg">{booking.checkOut ? format(booking.checkOut, 'MMM dd, yyyy') : 'TBD'}</p>
                        </div>
                      </div>

                      {/* Owner Info - Only shown post-booking (confirmed) */}
                      {booking.status === 'confirmed' && (
                        <div className="mb-8 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                          <h4 className="text-[10px] font-black text-[#F59E0B] uppercase tracking-[0.2em] mb-4">Host Contact Details</h4>
                          {isLoadingOwner ? (
                            <div className="flex items-center gap-4 animate-pulse">
                              <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                              </div>
                            </div>
                          ) : owner ? (
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                              <div className="flex items-center gap-4 flex-1">
                                <img 
                                  src={getAvatarUrl(owner.displayName || 'Owner')} 
                                  className="w-14 h-14 rounded-full border-2 border-amber-100"
                                  alt="Owner"
                                />
                                <div>
                                  <p className="font-black text-[#1A1A2E] text-lg">{owner.displayName || 'Host'}</p>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{owner.phone || 'Contact not listed'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <a 
                                  href={`tel:${owner.phone || '9876543210'}`}
                                  className="flex-1 sm:flex-none p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/5"
                                >
                                  <Phone className="w-5 h-5 font-bold" />
                                </a>
                                <a 
                                  href={`https://wa.me/${(owner.phone || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I've booked your property \"${booking.property?.title}\" on ShelterBee.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 sm:flex-none px-6 py-3 bg-[#25D366] hover:bg-[#20bd5c] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                >
                                  <span className="material-symbols-outlined text-xl">chat</span>
                                  <span className="text-xs uppercase">WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                              <p className="text-sm text-slate-400 italic">Host information will be available shortly.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Suite */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => { setSelectedBooking(booking); setShowReviewModal(true); }}
                          disabled={hasReviewed}
                          className={`flex-1 min-w-[140px] py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                            hasReviewed 
                              ? 'bg-amber-50 text-amber-300 cursor-not-allowed border border-amber-100' 
                              : 'bg-amber-50 text-[#F59E0B] hover:bg-amber-100 border border-amber-100 shadow-amber-500/5'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${hasReviewed ? 'fill-amber-200' : 'fill-amber-400 text-amber-400'}`} />
                          {hasReviewed ? 'Reviewed' : 'Rate & Review'}
                        </button>
                      )}
                      
                      {booking.status === 'confirmed' && (() => {
                        const now = new Date();
                        const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
                        const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;
                        
                        if (!checkIn) return null;
                        
                        // Hide if past check-out
                        if (checkOut && now > checkOut) return null;
                        
                        // Hide if within 6 hours of check-in OR past check-in
                        const hoursToCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
                        if (hoursToCheckIn < 6) return null;

                        return (
                          <button 
                            onClick={() => { setSelectedBooking(booking); setShowCancellationModal(true); }}
                            className="flex-1 min-w-[140px] py-4 bg-white hover:bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-red-100 flex items-center justify-center gap-2 shadow-lg shadow-red-500/5"
                          >
                            <XCircle className="w-4 h-4" /> Cancel Booking
                          </button>
                        );
                      })()}

                      <button 
                        onClick={() => { setSelectedBooking(booking); setShowReportModal(true); }}
                        className="flex-1 min-w-[140px] py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-500/5"
                      >
                        <ShieldAlert className="w-4 h-4" /> Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals are kept separate to maintain context and clean code */}
      <ReviewModal 
        isOpen={showReviewModal} 
        onClose={closeModals} 
        booking={selectedBooking} 
        profile={profile}
      />

      <ReportModal 
        isOpen={showReportModal} 
        onClose={closeModals} 
        booking={selectedBooking} 
      />

      <CancellationModal
        isOpen={showCancellationModal}
        onClose={closeModals}
        booking={selectedBooking}
      />
    </div>
  );
}

      function CancellationModal({ isOpen, onClose, booking }: { isOpen: boolean, onClose: () => void, booking: any }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handleCancel = async () => {
    if (!agreed || !reason) return;
    setLoading(true);
    try {
      const amount = booking.totalAmount || booking.estimatedCost || 0;
      
      let refundPercentage = 0;
      let refundAmount = 0;

      // New Logic: If pending_owner, 100% refund. If confirmed, calc based on time.
      if (booking.status === 'pending_owner') {
        refundPercentage = 100;
        refundAmount = amount;
      } else {
        const now = new Date();
        const checkInDate = new Date(booking.checkIn);
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilCheckIn >= 24) {
          refundPercentage = 75;
        } else if (hoursUntilCheckIn >= 6) {
          refundPercentage = 50;
        }
        refundAmount = (amount * refundPercentage) / 100;
      }

      // Process wallet via service
      await walletService.processCancellationWallet(booking, refundPercentage);

      if (refundAmount > 0) {
        showToast(`Booking cancelled. ₹${refundAmount.toLocaleString()} (${refundPercentage}%) refund initiated to your wallet.`, "success");
      } else {
        showToast("Booking cancelled. Non-refundable per policy.", "info");
      }

      // Send emails
      const owner = await userService.getUserProfile(booking.ownerId);
      if (owner && owner.email) {
        const template = emailTemplates.getBookingCancellationByVisitor(
          owner.displayName || 'Owner',
          booking.property?.title || 'Property',
          booking.visitorName,
          reason
        );
        await emailService.sendEmail({
          to: owner.email,
          subject: template.subject,
          html: template.html
        });
      }

      onClose();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showToast("Failed to cancel booking", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-content bg-white rounded-3xl max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-[#1A1A2E]">Cancel Booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Please tell us why you want to cancel your stay at <span className="font-bold">{booking.property?.title}</span>.</p>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full h-32 p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800 resize-none"
              />
              <button
                disabled={!reason}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#1A1A2E] text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h4 className="font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Cancellation & Refund Policy
                </h4>
                <div className="space-y-4 mb-6">
                  {(() => {
                    const now = new Date();
                    const checkInDate = new Date(booking.checkIn);
                    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    
                    let refundPercent = 0;
                    if (hoursUntilCheckIn >= 24) refundPercent = 75;
                    else if (hoursUntilCheckIn >= 6) refundPercent = 50;
                    
                    const amount = booking.totalAmount || booking.estimatedCost || 0;
                    const refundAmount = (amount * refundPercent) / 100;

                    return (
                      <>
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Refund Percentage</span>
                            <span className="text-lg font-black text-[#1E1B4B]">{refundPercent}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase">Expected Refund</span>
                            <span className="text-lg font-black text-emerald-600">₹{refundAmount.toLocaleString()}</span>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-400 italic">
                            Calculated based on {hoursUntilCheckIn.toFixed(1)} hours remaining until check-in.
                          </p>
                        </div>
                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 mt-4">
                          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                            Note: Refund will be credited to your ShelterBee wallet within 5-10 business days. Platform service charges may be retained. Once cancelled, this booking cannot be restored. By confirming you accept ShelterBee's Cancellation and Refund Policy.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    More than 24 hours before check-in: 75% refund.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    Between 24 hours and 6 hours before check-in: 50% refund.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    Within 6 hours of check-in: No refund.
                  </li>
                </ul>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-300 group-hover:border-amber-500'}`}>
                  {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  <input type="checkbox" className="hidden" checked={agreed} onChange={() => setAgreed(!agreed)} />
                </div>
                <span className="text-sm text-gray-600 leading-relaxed">I have read and agree to ShelterBee's Terms of Use, Privacy Policy, and applicable platform policies.</span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  disabled={!agreed || loading}
                  onClick={handleCancel}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PaymentsTab() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { property?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawType, setWithdrawType] = useState<'upi' | 'bank'>('upi');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    ifsc: '',
    upiId: ''
  });

  const fetchData = async () => {
    if (!user) return;
    try {
      // Fetch Bookings
      const userBookings = await bookingService.getBookingsByVisitor(user.uid);
      const bookingsWithProperties = await Promise.all(
        userBookings.map(async (booking) => {
          const property = await propertyService.getPropertyById(booking.propertyId);
          return { ...booking, property };
        })
      );
      bookingsWithProperties.sort((a, b) => {
        if (!a.checkIn || !b.checkIn) return 0;
        return b.checkIn.getTime() - a.checkIn.getTime();
      });
      setBookings(bookingsWithProperties);

      // Fetch Wallet
      const userWallet = await walletService.getWallet(user.uid);
      setWallet(userWallet);

      // Fetch Refund Transactions
      const txns = await walletService.getTransactions(user.uid);
      const refundTxns = txns.filter(t => t.type === 'credit' && t.reason === 'refund');
      
      const enhancedRefunds = await Promise.all(refundTxns.map(async (t) => {
        if (t.bookingId) {
          const b = await bookingService.getBookingById(t.bookingId);
          if (b) {
            const p = await propertyService.getPropertyById(b.propertyId);
            return { ...t, propertyName: p?.title || 'Unknown Property' };
          }
        }
        return { ...t, propertyName: 'Booking Refund' };
      }));
      setRefunds(enhancedRefunds);

    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    
    if (Number(withdrawAmount) > (wallet?.availableBalance || 0)) {
      showToast("Insufficient balance", "error");
      return;
    }

    if (withdrawType === 'upi' && !bankDetails.upiId) {
      showToast("Please enter UPI ID", "error");
      return;
    }

    if (withdrawType === 'bank' && (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.ifsc)) {
      showToast("Please enter complete bank details", "error");
      return;
    }

    setWithdrawalLoading(true);
    try {
      const details = withdrawType === 'upi' 
        ? { accountNumber: bankDetails.upiId, bankName: 'UPI Transfer', ifsc: 'UPI', branchName: 'Online', accountHolderName: user?.displayName || 'Visitor' } 
        : { ...bankDetails, branchName: 'Pending', accountHolderName: user?.displayName || 'Visitor' };

      await walletService.requestWithdrawal(user!.uid, Number(withdrawAmount), details);
      showToast("Withdrawal request submitted. Amount will be credited in 3-4 working days.", "success");
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchData();
    } catch (error: any) {
      showToast(error.message || "Withdrawal failed", "error");
    } finally {
      setWithdrawalLoading(false);
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
      {/* Wallet Balance Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <WalletIcon className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Wallet Balance (Refunds collected)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-600">₹{(wallet?.availableBalance || 0).toLocaleString()}</span>
              {wallet?.pendingBalance > 0 && (
                <span className="text-sm text-gray-400 font-medium ml-2">
                  (₹{wallet.pendingBalance.toLocaleString()} pending)
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowWithdrawModal(true)}
          disabled={(wallet?.availableBalance || 0) <= 0}
          className="px-6 py-3 bg-[#1A1A2E] text-white rounded-xl font-bold hover:bg-[#2A2A4E] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          Withdraw to Bank
        </button>
      </div>

      {/* Refund History Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <RefreshCw className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-[#1A1A2E]">Refund History</h3>
        </div>
        
        {refunds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No refunds yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Property</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-500 font-medium">
                      {refund.createdAt ? format(refund.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#1A1A2E] font-medium">{refund.propertyName}</td>
                    <td className="py-4 px-4 text-sm font-bold text-emerald-600">+₹{refund.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md uppercase tracking-wider">
                        Credited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="text-lg font-bold text-[#1A1A2E]">Payment History</h3>
        </div>

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
                        booking.status === 'pending_owner' ? 'text-amber-600 bg-amber-50' :
                        booking.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                        'text-gray-600 bg-gray-50'
                      }`}>
                        {booking.status === 'confirmed' ? 'Paid' : 
                         booking.status === 'pending_owner' ? 'Pending' : 
                         booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-[#1A1A2E] text-right">₹{(booking.totalAmount || booking.estimatedCost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !withdrawalLoading && setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content bg-white rounded-3xl shadow-2xl p-8 max-w-md border border-slate-100"
            >
              <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Withdraw Funds</h2>
              <p className="text-gray-500 mb-6 font-medium">Collect your refunds into your bank account or UPI.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount to Withdraw</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-[#F59E0B] focus:bg-white outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Available: ₹{wallet?.availableBalance.toLocaleString()}</p>
                </div>

                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                  <button 
                    onClick={() => setWithdrawType('upi')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${withdrawType === 'upi' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
                  >
                    UPI ID
                  </button>
                  <button 
                    onClick={() => setWithdrawType('bank')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${withdrawType === 'bank' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                  >
                    Bank Account
                  </button>
                </div>

                {withdrawType === 'upi' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">UPI ID</label>
                    <input 
                      type="text"
                      placeholder="username@bank"
                      value={bankDetails.upiId}
                      onChange={(e) => setBankDetails({...bankDetails, upiId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Number</label>
                      <input 
                        type="text"
                        placeholder="Enter account number"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bank Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">IFSC Code</label>
                      <input 
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={bankDetails.ifsc}
                        onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={handleWithdraw}
                  disabled={withdrawalLoading}
                  className="w-full py-4 bg-[#1A1A2E] text-white rounded-2xl font-bold hover:bg-[#2A2A4E] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {withdrawalLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Withdrawal
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawalLoading}
                  className="w-full py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FavouritesTab() {
  const { user, profile, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [allProperties, setAllProperties] = useState<any[]>([]);
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
  
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionBooking, setRejectionBooking] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingRejection, setIsProcessingRejection] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<'live' | 'approved' | 'rejected' | 'hidden' | 'pending'>('live');

  const isOwner = profile?.role === 'owner';

  const fetchContent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isOwner) {
        const myProps = await propertyService.getPropertiesByOwner(user.uid);
        setAllProperties(myProps);
      } else {
        const favoriteIds = profile?.favorites || [];
        if (favoriteIds.length > 0) {
          const favoriteProps = await Promise.all(
            favoriteIds.map(id => propertyService.getPropertyById(id))
          );
          const validFavs = favoriteProps.filter(Boolean);
          setAllProperties(validFavs);
          setProperties(validFavs);
        } else {
          setAllProperties([]);
          setProperties([]);
        }
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [user, profile?.favorites]);

  useEffect(() => {
    if (!isOwner) return;
    
    const now = new Date();
    let filtered = [];
    
    switch (activeSubTab) {
      case 'live':
        filtered = allProperties.filter(prop => propertyService.isPropertyAvailable(prop, now));
        break;
      case 'approved':
        filtered = allProperties.filter(prop => prop.status === 'Approved');
        break;
      case 'rejected':
        filtered = allProperties.filter(prop => prop.status === 'Rejected');
        break;
      case 'hidden':
        filtered = allProperties.filter(prop => prop.availabilityStatus === 'unavailable');
        break;
      case 'pending':
        filtered = allProperties.filter(prop => prop.status === 'Pending');
        break;
      default:
        filtered = allProperties;
    }
    setProperties(filtered);
  }, [activeSubTab, allProperties, isOwner]);

  const [showHideModal, setShowHideModal] = useState(false);

  useEffect(() => {
    if (showBookingsModal || showReviewsModal || showRejectionModal || showHideModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBookingsModal, showReviewsModal, showRejectionModal, showHideModal]);
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
        fetchContent();
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
        fetchContent();
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
      handleFirestoreError(error, OperationType.GET, 'reviews');
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
      showToast("Reply submitted successfully", "success");
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

  const handleRejectBooking = async () => {
    if (!rejectionBooking || !rejectionReason.trim()) {
      showToast("Please provide a reason for rejection", "error");
      return;
    }

    setIsProcessingRejection(true);
    try {
      const bookingId = rejectionBooking.id;
      const amount = rejectionBooking.totalAmount || rejectionBooking.estimatedCost || 0;
      
      // 1. Update booking status and reason (Atomic transaction inside walletService)
      await bookingService.rejectBooking(bookingId, rejectionReason);

      // 3. Notify Visitor
      const visitor = await userService.getUserProfile(rejectionBooking.visitorId);
      if (visitor && visitor.email) {
        await emailService.sendEmail({
          to: visitor.email,
          subject: `Booking Rejected: ${selectedPropertyTitle}`,
          text: `Hello ${visitor.displayName || 'User'},\n\nYour booking for "${selectedPropertyTitle}" has been rejected by the property owner.\nReason: ${rejectionReason}\n\nThe booking amount of ₹${amount.toLocaleString()} has been refunded to your wallet.\n\nThank you,\nShelterbee Team`,
          html: `<p>Hello ${visitor.displayName || 'User'},</p><p>Your booking for "<strong>${selectedPropertyTitle}</strong>" has been rejected by the property owner.</p><p><strong>Reason:</strong> ${rejectionReason}</p><p>The booking amount of <strong>₹${amount.toLocaleString()}</strong> has been refunded to your wallet.</p><p>Thank you,<br/>Shelterbee Team</p>`
        });
      }

      showToast("Booking rejected and refund processed successfully", "success");
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionBooking(null);
      
      // Refresh bookings list
      await viewBookings(rejectionBooking.propertyId, selectedPropertyTitle);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      showToast("Failed to process rejection and refund", "error");
    } finally {
      setIsProcessingRejection(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    if (status === 'cancelled') {
      const booking = selectedPropertyBookings.find(b => b.id === bookingId);
      setRejectionBooking(booking);
      setShowRejectionModal(true);
      return;
    }

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
            text: `Hello ${visitor.displayName || 'User'},\n\nYour booking for "${selectedPropertyTitle}" has been ${status}.\n\nThank you,\nShelterbee Team`,
            html: `<p>Hello ${visitor.displayName || 'User'},</p><p>Your booking for "<strong>${selectedPropertyTitle}</strong>" has been <strong>${status}</strong>.</p><p>Thank you,<br/>Shelterbee Team</p>`
          });
        }
      }

      showToast(`Booking ${status} successfully`, "success");
      
      // Refresh bookings
      const allOwnerBookings = await bookingService.getBookingsByOwner(user!.uid);
      const propBookings = allOwnerBookings.filter(b => b.propertyId === selectedPropertyBookings[0]?.propertyId);
      
      // Refetch financials
      const bookingsWithFinancials = await Promise.all(
        propBookings.map(async (b) => {
          const financials = await bookingService.getBookingFinancials(b.id!);
          return { ...b, ...financials };
        })
      );
      setSelectedPropertyBookings(bookingsWithFinancials);
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
      {isOwner && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Building2 className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1A1A2E] tracking-tight">Manage Listings</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Control your property presence</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/list-property')}
              className="flex items-center gap-2 bg-[#F59E0B] hover:bg-amber-400 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> Add New Property
            </button>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-10 overflow-x-auto no-scrollbar">
            {[
              { id: 'live', label: 'Live' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'hidden', label: 'Hidden' },
              { id: 'pending', label: 'Pending' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeSubTab === tab.id 
                    ? 'bg-white text-[#1A1A2E] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
            {isOwner ? (
              <Building2 className="w-10 h-10 text-slate-300" />
            ) : (
              <Heart className="w-10 h-10 text-slate-300" />
            )}
          </div>
          <h3 className="text-2xl font-black text-[#1A1A2E] mb-3 tracking-tight">
            {isOwner ? "No listings yet" : "No saved properties"}
          </h3>
          <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium leading-relaxed">
            {isOwner 
              ? "You haven't listed any properties yet. Start your hosting journey today!" 
              : "Your favorites list is empty. Start exploring properties and save the ones you love!"}
          </p>
          {!isOwner && (
            <button 
              onClick={() => navigate('/stays')}
              className="mt-8 px-8 py-3 bg-[#1A1A2E] text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm"
            >
              Explore Properties
            </button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${isOwner ? 'md:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6`}>
          {properties.map((property, index) => (
            isOwner ? (
              <motion.div 
                key={`${property.id}-${index}`} 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className={`group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col ${property.status === 'Rejected' ? 'ring-2 ring-red-100' : ''}`}
              >
                <div className="relative h-40 md:h-44 overflow-hidden">
                  <img 
                    src={property.photos?.[0] || "https://images.picsum.photos/seed/property/600/400"} 
                    alt={property.title} 
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                  />
                  
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 ${
                      property.status === 'Approved' ? 'bg-emerald-500/90 text-white' :
                      property.status === 'Pending' ? 'bg-amber-500/90 text-white' :
                      'bg-red-500/90 text-white'
                    }`}>
                      {property.status}
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-white font-black text-[10px]">{property.rating || 'New'}</span>
                      <span className="text-white/60 text-[8px] font-bold">({property.reviewCount || 0})</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-1 mb-1">
                       <h3 className="font-bold text-[#1A1A2E] text-sm tracking-tight truncate w-full sm:flex-1 group-hover:text-amber-600 transition-colors leading-tight">{property.title || 'Property'}</h3>
                       <p className="text-sm font-black text-[#F59E0B] shrink-0">₹{(property.pricePerDay || 0).toLocaleString()}<span className="text-[8px] text-slate-400 font-bold ml-0.5">/d</span></p>
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium truncate">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" /> {property.area}
                    </p>
                  </div>

                  {property.status === 'Rejected' && (
                    <div className="mb-3 p-2.5 bg-red-50 border border-red-100 rounded-xl flex gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-red-700 font-medium leading-tight line-clamp-2">{property.rejectionReason || 'No reason provided.'}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    {property.status === 'Rejected' ? (
                      <>
                        <button 
                          onClick={() => navigate(`/list-property?edit=${property.id}`)}
                          className="h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reapply
                        </button>
                        <button 
                          onClick={() => removeListing(property.id)}
                          className="h-10 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg font-bold text-[8px] uppercase tracking-widest transition-all border border-red-100 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => navigate(`/list-property?edit=${property.id}`)}
                          className="h-10 bg-slate-50 hover:bg-slate-100 text-[#1A1A2E] rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => viewBookings(property.id, property.title)}
                          className="h-10 bg-white hover:bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Bookings
                        </button>
                        <button 
                          onClick={() => viewReviews(property.id, property.title)}
                          className="h-10 bg-white hover:bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Reviews
                        </button>
                        <button 
                          onClick={() => {
                            if (property.availabilityStatus !== 'unavailable') {
                              setSelectedPropertyToHide(property);
                              setShowHideModal(true);
                            } else {
                              propertyService.updateProperty(property.id, { availabilityStatus: 'available', unavailabilityOption: null, unavailableFrom: null, unavailableTo: null }).then(() => {
                                showToast("Listing is now visible.", "success");
                                fetchContent();
                              });
                            }
                          }}
                          className={`h-10 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 ${
                            property.availabilityStatus !== 'unavailable' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}
                        >
                          {property.availabilityStatus !== 'unavailable' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {property.availabilityStatus !== 'unavailable' ? 'Hide' : 'Show'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <PropertyCard 
                key={`${property.id}-${index}`}
                property={property}
                isFavorite={true}
                onToggleFavorite={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const favs = profile?.favorites || [];
                  const newFavs = favs.filter(id => id !== property.id);
                  await updateProfileData({ favorites: newFavs });
                }}
              />
            )
          ))}
        </div>
      )}

      {/* Hide Property Modal */}
      <AnimatePresence>
        {showHideModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHideModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="modal-content bg-white rounded-3xl p-8 max-w-md shadow-2xl relative z-10 border border-slate-100">
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
          <div className="modal-overlay">
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
              className="modal-content bg-white rounded-3xl p-8 max-w-2xl border border-slate-100"
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
          <div className="modal-overlay p-4">
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
              className="modal-content bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-100"
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
                        <p className="text-sm font-medium mt-1">Total Amount: ₹{(booking.totalAmount || booking.estimatedCost || 0).toLocaleString()}</p>
                        <p className="text-sm font-medium text-emerald-600">Your Revenue: ₹{(booking.receivedAmount || (booking.estimatedCost * 0.75) || 0).toLocaleString()}</p>
                        
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

      <AnimatePresence>
        {showRejectionModal && (
          <div className="modal-overlay p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isProcessingRejection && setShowRejectionModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100"
            >
              <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-2 text-center">Reject Booking</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Please provide a reason for rejecting this booking. The visitor will be notified and their payment will be refunded.</p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rejection Reason</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., Property maintenance, overlap with personal use, etc."
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm h-32 resize-none"
                    disabled={isProcessingRejection}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRejectionModal(false)} 
                  disabled={isProcessingRejection}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectBooking}
                  disabled={isProcessingRejection || !rejectionReason.trim()}
                  className="flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingRejection ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                  ) : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WalletTab({ walletBalance, walletTransactions }: { walletBalance: number, walletTransactions: any[] }) {
  const { user, profile } = useAuth();
  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin';
  const isVisitor = profile?.role === 'visitor';
  const [wallet, setWallet] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      walletService.getWallet(user.uid).then(setWallet);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (showWithdrawModal || showBankDetailsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showWithdrawModal, showBankDetailsModal]);

  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', branchName: '', bankName: '' });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (wallet?.bankAccount) {
      setBankDetails(wallet.bankAccount);
    }
  }, [wallet]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const pendingWithdrawalsAmount = walletTransactions
    .filter(t => t.type === 'debit' && t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const handleSaveBankDetails = async () => {
    if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.branchName || !bankDetails.bankName) {
      showToast("Please fill all bank details", "error");
      return;
    }
    try {
      await walletService.updateBankAccount(user!.uid, { ...bankDetails, verified: true });
      setShowBankDetailsModal(false);
      showToast("Bank details updated successfully", "success");
      const updatedWallet = await walletService.getWallet(user!.uid);
      setWallet(updatedWallet);
    } catch (error) {
      console.error("Error saving bank details:", error);
      showToast("Failed to update bank details", "error");
    }
  };

  const handleNextStep = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (amount > walletBalance) {
      showToast("Insufficient balance", "error");
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.bankName) {
      showToast("Please add your bank details first", "error");
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
      showToast(`₹${amount} will be credited to your bank in 3-4 working days.`, "success");
      setShowWithdrawModal(false);
      setWithdrawStep(1);
      setWithdrawAmount('');
      setCooldown(10);
    } catch (error: any) {
      console.error("Error requesting withdrawal:", error);
      showToast(error.message || "Failed to request withdrawal", "error");
    }
  };

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
            <h2 className="text-4xl font-extrabold mb-6">₹{walletBalance.toLocaleString()}</h2>
            <button 
              onClick={() => { setShowWithdrawModal(true); setWithdrawStep(1); }}
              disabled={walletBalance <= 0 || cooldown > 0}
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
          <h2 className="text-3xl font-extrabold text-[#1A1A2E] mb-2">₹{(pendingWithdrawalsAmount || 0).toLocaleString()}</h2>
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
        {walletTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {walletTransactions
              .filter(txn => {
                if (isVisitor) return txn.type === 'credit' && (txn.refundPercentage || txn.paymentPartnerCharge);
                return true;
              })
              .map((txn) => (
              <div key={txn.id} className="p-4 border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {txn.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E]">{txn.description}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {txn.createdAt ? format(txn.createdAt.toDate(), 'MMM dd, yyyy • HH:mm') : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <p className={`font-black text-lg ${txn.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{(txn.amount || 0).toLocaleString()}
                  </p>
                </div>

                {/* Detailed Breakdown for Owner/Admin */}
                {(isOwner || isAdmin) && txn.bookingAmount > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Booking</p>
                      <p className="text-xs font-bold text-slate-600">₹{txn.bookingAmount.toLocaleString()}</p>
                    </div>
                    {txn.platformCommission > 0 && (
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission (25%)</p>
                        <p className="text-xs font-bold text-red-400">-₹{txn.platformCommission.toLocaleString()}</p>
                      </div>
                    )}
                    {txn.receivedAmount > 0 && (
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Received (75%)</p>
                        <p className="text-xs font-bold text-emerald-600">₹{txn.receivedAmount.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Result Balance</p>
                      <p className="text-xs font-bold text-slate-900">₹{txn.balanceAfter?.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Breakdown for Visitor */}
                {isVisitor && txn.refundPercentage > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Original Amount</span>
                      <span className="font-bold text-slate-600">₹{txn.bookingAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Refund Percentage</span>
                      <span className="font-bold text-emerald-600">{txn.refundPercentage}%</span>
                    </div>
                    {txn.paymentPartnerCharge > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-400 uppercase">Payment Partner Charge (5%)</span>
                        <span className="font-bold text-red-400">-₹{txn.paymentPartnerCharge.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showBankDetailsModal && (
          <div className="modal-overlay p-4">
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
              className="modal-content bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100"
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
          <div className="modal-overlay p-4">
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
              className="modal-content bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100"
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
                        placeholder={`Max: ₹${(wallet?.availableBalance || 0).toLocaleString()}`}
                        max={wallet?.availableBalance || 0}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Daily limit: ₹{(10000).toLocaleString()} (Max 2 withdrawals/day)</p>
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
                      <span className="font-bold text-[#1A1A2E]">₹{(parseFloat(withdrawAmount) || 0).toLocaleString()}</span>
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
            By using ShelterBee, you agree to ShelterBee's Terms of Use, Privacy Policy, and applicable platform policies. All bookings are subject to host approval and availability. Users must provide accurate identification when requested. ShelterBee reserves the right to suspend accounts that violate our community guidelines.
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
        // Show both Pending and Rejected properties
        setProperties(myProps.filter(p => p.status === 'Pending' || p.status === 'Rejected'));
      } catch (error) {
        console.error("Error fetching properties:", error);
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
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${property.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'} text-white`}>
                    {property.status === 'Rejected' ? 'Rejected' : 'Pending Review'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#1A1A2E] text-lg mb-1 truncate">{property.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {property.area}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-[#F59E0B]">₹{(property.pricePerDay || 0).toLocaleString()}<span className="text-xs text-gray-400 font-normal">/day</span></span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{property.type}</span>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  {property.status === 'Rejected' ? (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <p className="text-xs font-bold text-red-600 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{property.rejectionReason || 'No reason provided by admin.'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      This property is currently under review by our admin team. It will be visible to visitors once approved.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerDashboardTab({ user, profile, isEditing, setIsEditing, setActiveTab, setShowOTPModal, walletBalance }: { user: any, profile: any, isEditing: boolean, setIsEditing: (v: boolean) => void, setActiveTab: (tab: Tab) => void, setShowOTPModal: (v: boolean) => void, walletBalance: number }) {
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
        // Trigger retry for failed wallet transactions
        bookingService.retryFailedWalletTransactions(user.uid);

        const [properties, txns, allBookings] = await Promise.all([
          propertyService.getPropertiesByOwner(user.uid),
          walletService.getWalletTransactions(user.uid),
          bookingService.getBookingsByOwner(user.uid)
        ]);
        
        const completedBookings = allBookings.filter(b => b.status === 'completed');
        
        // Calculate aggregate ratings from property documents directly
        const totalReviewsCount = properties.reduce((sum, p: any) => sum + (p.totalReviews || p.reviewCount || 0), 0);
        const weightedSum = properties.reduce((sum, p: any) => sum + ((p.averageRating || p.rating || 0) * (p.totalReviews || p.reviewCount || 0)), 0);
        const aggregateAverageRating = totalReviewsCount > 0 ? Number((weightedSum / totalReviewsCount).toFixed(1)) : 0;

        const totalEarnings = txns
          .filter(t => t.type === 'credit' && t.bookingAmount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        setStats({
          totalListings: properties.length,
          availableListings: properties.filter(p => p.status === 'Approved' && p.isAvailable !== false).length,
          pendingListings: properties.filter(p => p.status === 'Pending').length,
          walletBalance: walletBalance,
          totalRevenue: totalEarnings,
          averageRating: aggregateAverageRating,
          totalVisitors: completedBookings.length,
          occupancyRate: properties.length > 0 ? Math.round((completedBookings.length / (properties.length * 30)) * 100) : 0, 
          rejections: properties.filter(p => p.status === 'Rejected').length,
          reviewCount: totalReviewsCount
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, walletBalance]);

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
              ₹{(stats?.walletBalance || 0).toLocaleString()}
            </h3>
            {stats?.walletBalance < 0 && (
              <p className="text-xs text-red-400 font-medium mb-1">Negative balance will be deducted from future earnings.</p>
            )}
            <p className="text-sm text-emerald-400 font-medium">+₹{(stats?.pendingPayments || 0).toLocaleString()} pending</p>
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
            <p className="text-xl font-bold text-[#1A1A2E]">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!booking || !text) return;
    setIsSubmitting(true);
    try {
      await reviewService.addReview({
        propertyId: booking.propertyId,
        visitorId: booking.visitorId,
        bookingId: booking.id,
        visitorName: profile?.displayName || 'Anonymous',
        visitorAvatar: profile?.photoURL || getAvatarUrl(profile?.displayName || 'Anonymous'),
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
    <div className="modal-overlay text-left">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content bg-white rounded-3xl p-8 max-w-md shadow-2xl relative z-10 border border-slate-100">
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay text-left">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content bg-white rounded-3xl p-8 max-w-md shadow-2xl relative z-10 border border-slate-100">
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