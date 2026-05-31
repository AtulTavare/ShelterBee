import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { partnerService } from '../services/partnerService';
import { 
  Users, 
  Banknote, 
  TrendingUp, 
  Copy, 
  Share2, 
  CheckCircle2,
  Clock,
  Gift
} from 'lucide-react';

const PartnerDashboard = () => {
  const { profile: userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedBookings: 0,
    totalCommission: 0,
    pendingCommission: 0,
    loading: true
  });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      loadStats();
    }
  }, [userProfile]);

  const loadStats = async () => {
    if (!userProfile?.uid) return;
    try {
      const data = await partnerService.getPartnerStats(userProfile.uid);
      setStats({ ...data, loading: false });
    } catch {
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const partnerCode = userProfile?.partnerCode || 'N/A';
  const referralLink = `${window.location.origin}/?ref=${partnerCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (stats.loading) {
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
