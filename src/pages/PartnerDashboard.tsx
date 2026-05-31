import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { partnerService } from '../services/partnerService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  Banknote, 
  TrendingUp, 
  Copy, 
  Share2, 
  CheckCircle2,
  Clock,
  Gift,
  XCircle,
  Mail,
  Phone,
  MessageCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const PartnerDashboard = () => {
  const { profile: userProfile, user } = useAuth();
  const [partnerStatus, setPartnerStatus] = useState<string>(userProfile?.partnerStatus || 'pending');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedBookings: 0,
    totalCommission: 0,
    pendingCommission: 0,
  });
  const [commissions, setCommissions] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartnerStatus(data.partnerStatus || 'pending');
      }
    });

    return () => unsubUser();
  }, [user?.uid]);

  useEffect(() => {
    if (!userProfile?.uid || partnerStatus !== 'approved') {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubStats = partnerService.subscribePartnerStats(userProfile.uid, (newStats) => {
      setStats(newStats);
      setLoading(false);
    });

    const unsubCommissions = partnerService.subscribePartnerCommissions(userProfile.uid, (newCommissions) => {
      setCommissions(newCommissions);
    });

    return () => {
      unsubStats();
      unsubCommissions();
    };
  }, [userProfile?.uid, partnerStatus]);

  const partnerCode = userProfile?.partnerCode || 'N/A';
  const referralLink = `${window.location.origin}/?ref=${partnerCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (partnerStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 max-w-lg w-full text-center border border-gray-50"
        >
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="text-amber-600" size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1A1A2E] mb-4">
            Application Under Review
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Thank you for registering as a ShelterBee Partner! Your application has been 
            submitted successfully and is currently being reviewed by our team. 
            We typically respond within <strong className="text-[#1A1A2E]">24-48 hours</strong>.
          </p>
          <div className="bg-amber-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <Mail size={18} />
              What Happens Next?
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>Our team reviews your business details and verifies your information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>You'll receive an email notification once your application is approved or if we need more information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>Once approved, you can access your Partner Dashboard and start earning commissions</span>
              </li>
            </ul>
          </div>
          <a
            href="/"
            className="inline-block w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest text-center shadow-lg shadow-amber-500/20"
          >
            BACK TO HOME
          </a>
        </motion.div>
      </div>
    );
  }

  if (partnerStatus === 'rejected') {
    const companyEmail = (userProfile as any)?.businessEmail || userProfile?.email || '';
    const helpNumber = '+917021054239';
    const waMessage = encodeURIComponent(
      `Hi ShelterBee team, I would like to get more information about my partner application rejection for ${(userProfile as any)?.businessName || 'my business'}. Please help me understand what went wrong.`
    );

    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 max-w-lg w-full text-center border border-gray-50"
        >
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-500" size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1A1A2E] mb-4">
            Application Not Approved
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Thank you for your interest in the ShelterBee Partner Program. Unfortunately, 
            your application could not be approved at this time. If you believe this is a 
            mistake or would like to discuss further, please reach out to us through any 
            of the channels below.
          </p>

          <div className="space-y-4 mb-8">
            <a
              href={`mailto:${companyEmail}?subject=Partner Application Reconsideration - ${(userProfile as any)?.businessName || ''}`}
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Mail className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm">Email Us</p>
                <p className="text-xs text-gray-500 truncate">Send us an email with your details</p>
              </div>
              <ExternalLink size={16} className="text-blue-400 shrink-0" />
            </a>

            <a
              href={`tel:${helpNumber}`}
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Phone className="text-green-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm">Call Support</p>
                <p className="text-xs text-gray-500">{helpNumber}</p>
              </div>
              <ExternalLink size={16} className="text-green-400 shrink-0" />
            </a>

            <a
              href={`https://wa.me/${helpNumber.replace(/\+/g, '').replace(/\s/g, '')}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm">WhatsApp</p>
                <p className="text-xs text-gray-500">Chat with us on WhatsApp</p>
              </div>
              <ExternalLink size={16} className="text-emerald-400 shrink-0" />
            </a>
          </div>

          <a
            href="/"
            className="inline-block w-full bg-[#1A1A2E] hover:bg-[#2a2a4e] text-white font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest text-center shadow-lg"
          >
            BACK TO HOME
          </a>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Referrals', value: stats.totalReferrals, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Completed Bookings', value: stats.completedBookings, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
    { label: 'Total Commission', value: `₹${stats.totalCommission}`, icon: Banknote, color: 'bg-amber-100 text-amber-600' },
    { label: 'Pending Commission', value: `₹${stats.pendingCommission}`, icon: Clock, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Partner Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back, {userProfile?.displayName || 'Partner'}</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
              <Gift size={18} className="text-amber-500" />
              <span className="text-sm font-bold text-gray-700">Code: {partnerCode}</span>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm mb-8">
            <h2 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <Share2 size={18} />
              Your Referral Link
            </h2>
            <div className="flex gap-3">
              <input
                readOnly
                value={referralLink}
                className="flex-1 px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 text-gray-600 text-sm outline-none"
              />
              <button
                onClick={copyReferralLink}
                className="px-6 py-3 bg-[#1A1A2E] text-white rounded-xl hover:bg-[#2a2a4e] transition-colors font-bold text-sm flex items-center gap-2"
              >
                {copySuccess ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                    <card.icon size={24} />
                  </div>
                  <TrendingUp size={20} className="text-green-500" />
                </div>
                <p className="text-2xl font-extrabold text-[#1A1A2E]">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Commissions */}
          {commissions.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm mb-8">
              <h2 className="font-bold text-[#1A1A2E] mb-4">Recent Commissions</h2>
              <div className="space-y-3">
                {commissions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-[#1A1A2E]">
                        Booking #{c.bookingId?.substring(0, 8).toUpperCase() || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.status === 'completed' ? 'Completed' : c.status === 'pending' ? 'Pending' : 'Cancelled'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${c.status === 'completed' ? 'text-green-600' : c.status === 'pending' ? 'text-amber-600' : 'text-red-600'}`}>
                        ₹{c.amount || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partner Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm">
            <h2 className="font-bold text-[#1A1A2E] mb-4">Partner Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Business Name</span>
                <p className="font-bold text-[#1A1A2E]">{(userProfile as any)?.businessName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-400">Business Type</span>
                <p className="font-bold text-[#1A1A2E]">{(userProfile as any)?.businessType || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-400">Status</span>
                <p className="font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Active
                </p>
              </div>
              <div>
                <span className="text-gray-400">Commission Rate</span>
                <p className="font-bold text-[#1A1A2E]">Up to 5%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
