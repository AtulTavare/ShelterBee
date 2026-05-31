import React, { useState, useEffect } from 'react';
import { partnerService } from '../../services/partnerService';
import { emailService } from '../../services/emailService';
import { emailTemplates } from '../../services/emailTemplates';
import { userService } from '../../services/userService';
import { CheckCircle2, XCircle, Clock, Search, BarChart3, Users, Banknote, TrendingUp, X, ExternalLink, MessageCircle, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PartnerUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessEmail: string;
  whatsappNumber: string;
  partnerContactNumber: string;
  website: string;
  status: 'pending' | 'approved' | 'rejected';
  partnerCode: string;
  mobile: string;
  createdAt: any;
}

const AdminPartners = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'analytics'>('applications');
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectPartnerId, setRejectPartnerId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const unsub = partnerService.subscribePartners((data) => {
      setPartners(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (partnerId: string) => {
    setActionLoading(partnerId);
    try {
      await partnerService.approvePartner(partnerId);

      const partner = partners.find(p => p.uid === partnerId);
      if (partner) {
        const recipientEmail = partner.businessEmail || partner.email;
        const profile = await userService.getUserProfile(partnerId);
        if (recipientEmail) {
          const template = emailTemplates.getPartnerApproval(
            profile?.displayName || partner.displayName,
            partner.businessName,
            `${window.location.origin}/partner-dashboard`
          );
          emailService.sendEmail({
            to: recipientEmail,
            subject: template.subject,
            html: template.html,
          });
        }
      }
    } catch (err) {
      console.error('Error approving partner:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (partnerId: string) => {
    setRejectPartnerId(partnerId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectPartnerId) return;
    setActionLoading(rejectPartnerId);
    try {
      await partnerService.rejectPartner(rejectPartnerId);
      setShowRejectModal(false);
      setRejectPartnerId(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting partner:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPartners = partners.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.businessName?.toLowerCase().includes(q) ||
        p.displayName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.businessType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date?.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  // Analytics calculations
  const totalApproved = partners.filter(p => p.status === 'approved').length;
  const totalPending = partners.filter(p => p.status === 'pending').length;
  const totalRejected = partners.filter(p => p.status === 'rejected').length;

  const PartnerAnalytics = () => {
    const [partnerCommissions, setPartnerCommissions] = useState<Record<string, any[]>>({});
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
      const approved = partners.filter(p => p.status === 'approved');
      const unsubs: (() => void)[] = [];

      approved.forEach(p => {
        const unsub = partnerService.subscribePartnerCommissions(p.uid, (commissions) => {
          setPartnerCommissions(prev => ({ ...prev, [p.uid]: commissions }));
        }, 3);
        unsubs.push(unsub);
      });

      setAnalyticsLoading(false);

      return () => unsubs.forEach(u => u());
    }, [partners]);

    if (analyticsLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1A1A2E]">{totalApproved}</p>
                <p className="text-xs text-gray-500">Approved Partners</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1A1A2E]">{totalPending}</p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1A1A2E]">{totalRejected}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Partner Earnings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-bold text-[#1A1A2E] flex items-center gap-2">
              <Banknote size={18} className="text-amber-500" />
              Partner Earnings & Booking Stats
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last 3 Commissions</th>
                </tr>
              </thead>
              <tbody>
                {partners.filter(p => p.status === 'approved').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      No approved partners yet
                    </td>
                  </tr>
                ) : (
                  partners.filter(p => p.status === 'approved').map((partner) => {
                    const commissions = partnerCommissions[partner.uid] || [];
                    const totalEarned = commissions
                      .filter(c => c.status === 'completed')
                      .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

                    return (
                      <tr key={partner.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#1A1A2E] text-sm">{partner.displayName}</p>
                          <p className="text-xs text-gray-400">{partner.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{partner.businessName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <CheckCircle2 size={14} />
                            Approved
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-[#1A1A2E]">{commissions.length}</p>
                          <p className="text-xs text-gray-400">₹{totalEarned} earned</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {commissions.length === 0 ? (
                            <span className="text-xs text-gray-400">No commissions</span>
                          ) : (
                            <div className="space-y-1">
                              {commissions.map((c: any) => (
                                <div key={c.id} className="flex items-center justify-end gap-2">
                                  <span className={`text-xs font-bold ${c.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                    ₹{c.amount || 0}
                                  </span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'completed' ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const statusConfig = {
    pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { icon: CheckCircle2, label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  const helpNumber = '+917021054239';
  const TotalStatsBar = () => (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-gray-500">
        <span className="font-bold text-[#1A1A2E]">{filteredPartners.length}</span> shown
      </span>
      <span className="text-gray-300">|</span>
      <span className="text-green-600 font-bold">{totalApproved} approved</span>
      <span className="text-gray-300">|</span>
      <span className="text-amber-600 font-bold">{totalPending} pending</span>
      <span className="text-gray-300">|</span>
      <span className="text-red-600 font-bold">{totalRejected} rejected</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Partner Program</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'applications' ? 'bg-white text-[#1A1A2E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Applications
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'analytics' ? 'bg-white text-[#1A1A2E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <PartnerAnalytics />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search partners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                    filter === f ? 'bg-[#1A1A2E] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <TotalStatsBar />

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">No partner applications found</td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => {
                      const status = statusConfig[partner.status];
                      const StatusIcon = status.icon;
                      return (
                        <tr key={partner.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-[#1A1A2E]">{partner.businessName || 'N/A'}</p>
                              <p className="text-xs text-gray-400">{partner.displayName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-gray-700">{partner.email}</p>
                              <p className="text-gray-400 text-xs">{partner.mobile}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{partner.businessType || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                              {partner.partnerCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(partner.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>
                              <StatusIcon size={14} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {partner.status === 'pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(partner.uid)}
                                  disabled={actionLoading === partner.uid}
                                  className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  <CheckCircle2 size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => openRejectModal(partner.uid)}
                                  disabled={actionLoading === partner.uid}
                                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                              </div>
                            )}
                            {partner.status === 'rejected' && (
                              <div className="flex items-center justify-end gap-1">
                                <a
                                  href={`mailto:${partner.businessEmail || partner.email}?subject=Partner Application Update`}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Email partner"
                                >
                                  <Mail size={16} />
                                </a>
                                <a
                                  href={`tel:${helpNumber}`}
                                  className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Call partner"
                                >
                                  <Phone size={16} />
                                </a>
                                <a
                                  href={`https://wa.me/${helpNumber.replace(/\+/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="WhatsApp partner"
                                >
                                  <MessageCircle size={16} />
                                </a>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRejectModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1A1A2E]">Reject Partner Application</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to reject this partner application? The partner will be notified.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === rejectPartnerId}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === rejectPartnerId ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPartners;
