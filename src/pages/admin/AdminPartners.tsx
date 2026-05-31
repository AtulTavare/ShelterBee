import React, { useState, useEffect } from 'react';
import { partnerService } from '../../services/partnerService';
import { CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

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
  partnerStatus: 'pending' | 'approved' | 'rejected';
  partnerCode: string;
  mobile: string;
  createdAt: any;
}

const AdminPartners = () => {
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await partnerService.getAllPartners();
      setPartners(data);
    } catch (err) {
      console.error('Error loading partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnerId: string) => {
    setActionLoading(partnerId);
    try {
      await partnerService.approvePartner(partnerId);
      setPartners(prev => prev.map(p => 
        p.uid === partnerId ? { ...p, partnerStatus: 'approved' as const } : p
      ));
    } catch (err) {
      console.error('Error approving partner:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (partnerId: string) => {
    setActionLoading(partnerId);
    try {
      await partnerService.rejectPartner(partnerId);
      setPartners(prev => prev.map(p => 
        p.uid === partnerId ? { ...p, partnerStatus: 'rejected' as const } : p
      ));
    } catch (err) {
      console.error('Error rejecting partner:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPartners = partners.filter(p => {
    if (filter !== 'all' && p.partnerStatus !== filter) return false;
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
    if (date instanceof Timestamp) return date.toDate().toLocaleDateString();
    if (date?.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const statusConfig = {
    pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    approved: { icon: CheckCircle2, label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Partner Applications</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{filteredPartners.length} partners</span>
        </div>
      </div>

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
                  const status = statusConfig[partner.partnerStatus];
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
                        {partner.partnerStatus === 'pending' && (
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
                              onClick={() => handleReject(partner.uid)}
                              disabled={actionLoading === partner.uid}
                              className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
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

export default AdminPartners;
