import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { walletService, WalletTransaction, WithdrawalRequest } from '../../services/walletService';
import { userService } from '../../services/userService';
import { format } from 'date-fns';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Download,
  Search,
  Banknote,
  TrendingUp,
  History,
  AlertCircle,
  Building2,
  ExternalLink,
  ChevronDown,
  RefreshCcw,
  Landmark
} from 'lucide-react';
import { showToast, showConfirm } from '../../utils/toast';

export const AdminWallet = () => {
  const [adminUid, setAdminUid] = useState<string>('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  useEffect(() => {
    const initAdmin = async () => {
      const id = await walletService.getAdminId();
      setAdminUid(id);
    };
    initAdmin();
  }, []);

  useEffect(() => {
    if (!adminUid) return;

    const unsubBalance = walletService.subscribeToWalletBalance(adminUid, (bal) => {
      setBalance(bal);
    });

    const unsubTxns = walletService.subscribeToWalletTransactions(adminUid, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });

    const unsubSettlements = walletService.subscribeToPendingSettlements((settlements) => {
      setPendingSettlements(settlements);
    });

    const unsubWithdrawals = walletService.subscribeToWithdrawalRequests((reqs) => {
      setWithdrawalRequests(reqs);
    });

    return () => {
      unsubBalance();
      unsubTxns();
      unsubSettlements();
      unsubWithdrawals();
    };
  }, [adminUid]);

  const handleWithdrawalAction = async (requestId: string, status: 'completed' | 'rejected') => {
    const action = status === 'completed' ? 'approve' : 'reject';
    showConfirm(`Are you sure you want to ${action} this withdrawal request?`, async () => {
      try {
        await walletService.processWithdrawal(requestId, status);
        showToast(`Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully`, "success");
      } catch (error) {
        console.error(`Error processing withdrawal:`, error);
        showToast("Failed to process withdrawal", "error");
      }
    });
  };

  const exportTransactions = () => {
    try {
      const headers = ['Date', 'Type', 'Description', 'Property', 'Amount', 'Balance After'];
      const lines = transactions.map(t => [
        format(t.createdAt?.toDate?.() || new Date(), 'yyyy-MM-dd HH:mm'),
        t.type.toUpperCase(),
        `"${t.description.replace(/"/g, '""')}"`,
        `"${(t.propertyTitle || 'N/A').replace(/"/g, '""')}"`,
        t.amount,
        t.balanceAfter
      ]);
      
      const csvContent = headers.join(",") + "\n" + lines.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `platform_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("CSV exported successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to export CSV", "error");
    }
  };

  const getTransactionTypeColor = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('commission')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (d.includes('refund')) return 'bg-red-50 text-red-600 border-red-100';
    if (d.includes('cancellation')) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (d.includes('charge')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (d.includes('withdrawal')) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'ALL') {
      const desc = t.description.toLowerCase();
      if (filterType === 'COMMISSION' && !desc.includes('commission')) return false;
      if (filterType === 'REFUND' && !desc.includes('refund')) return false;
      if (filterType === 'CANCELLATION' && !desc.includes('cancellation')) return false;
      if (filterType === 'CHARGE' && !desc.includes('charge')) return false;
      if (filterType === 'WITHDRAWAL' && !desc.includes('withdrawal')) return false;
    }

    if (dateFilter !== 'ALL') {
      const date = t.createdAt?.toDate?.() || new Date();
      const now = new Date();
      if (dateFilter === 'TODAY' && date.toDateString() !== now.toDateString()) return false;
      if (dateFilter === 'WEEK') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (date < lastWeek) return false;
      }
      if (dateFilter === 'MONTH') {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  const totalCommissions = transactions
    .filter(t => t.description.toLowerCase().includes('commission'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCharges = transactions
    .filter(t => t.description.toLowerCase().includes('charge'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter(t => t.description.toLowerCase().includes('refund'))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Wallet</h1>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-black text-[10px]">Real-time Financial Overview</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={exportTransactions}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 bg-[#0f172a] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Platform Revenue Balance</div>
            <div className="text-5xl font-black tracking-tighter mb-8">
              ₹{balance.toLocaleString('en-IN')}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="px-5 py-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Growth Forecast</div>
                <div className="text-sm font-black text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +15.2%
                </div>
              </div>
              <div className="px-5 py-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Settlements</div>
                <div className="text-sm font-black">{pendingSettlements.length} <span className="text-[10px] text-slate-400 font-medium ml-1">UNPROCESSED</span></div>
              </div>
            </div>
          </div>
          {/* Decorative Glow */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:col-span-2">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-emerald-200 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-105 transition-transform">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commissions Earned</div>
              <div className="text-2xl font-black text-slate-900 leading-none">₹{totalCommissions.toLocaleString('en-IN')}</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-105 transition-transform">
              <Banknote className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Surcharge</div>
              <div className="text-2xl font-black text-slate-900 leading-none">₹{totalCharges.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-red-200 transition-all group">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner group-hover:scale-105 transition-transform">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Refund Reversals</div>
              <div className="text-2xl font-black text-slate-900 leading-none">₹{totalRefunds.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <History className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ledger History</h2>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Sources</option>
                  <option value="COMMISSION">Booking Comm.</option>
                  <option value="REFUND">Refund Adj.</option>
                  <option value="CANCELLATION">Cancellation Fees</option>
                  <option value="CHARGE">Service Charges</option>
                  <option value="WITHDRAWAL">Payouts</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">Forever</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">Last 7 Days</option>
                  <option value="MONTH">This Month</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden border-separate">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description & Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Delta Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [1,2,3,4,5,6].map(n => (
                      <tr key={n} className="animate-pulse">
                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center grayscale opacity-50">
                          <History className="w-12 h-12 text-slate-300 mb-4" />
                          <h3 className="text-lg font-bold text-slate-900">Clean Slate</h3>
                          <p className="text-slate-500 text-xs mt-1">No recorded financial entries for this filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-8 py-6">
                          <div className="text-xs font-black text-slate-900">
                            {format(t.createdAt?.toDate?.() || new Date(), 'dd MMM yyyy')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {format(t.createdAt?.toDate?.() || new Date(), 'HH:mm:ss')}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <span className={`px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest w-fit shadow-sm ${getTransactionTypeColor(t.description)}`}>
                              {t.description.split('-')[0].trim()}
                            </span>
                            <div className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">{t.description}</div>
                            {t.bookingId && (
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-lg w-fit group-hover:border-blue-300 transition-colors">
                                <ExternalLink className="w-2.5 h-2.5" />
                                REF: {t.bookingId.slice(-8).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50 group-hover:bg-white transition-colors">
                              <Building2 className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="text-[11px] font-black text-slate-700 truncate max-w-[140px]">
                              {t.propertyTitle || 'Platform'}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className={`text-sm font-black tracking-tighter ${
                            t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {t.type === 'credit' ? '▲' : '▼'} ₹{t.amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center justify-end gap-1">
                            <Wallet className="w-2.5 h-2.5" />
                            Bal: ₹{t.balanceAfter?.toLocaleString('en-IN') || '---'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length > 0 && (
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all flex items-center gap-2">
                  <RefreshCcw className="w-3 h-3" />
                  Load More Entries
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
          {/* Withdrawal Requests */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Payout Requests</h2>
              <div className="flex items-center gap-1.5 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-ping"></div>
                <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest">
                  {withdrawalRequests.filter(r => r.status === 'pending').length} Action
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {withdrawalRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="bg-white p-10 rounded-[2rem] border border-slate-100 text-center shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">All requests cleared</p>
                </div>
              ) : (
                withdrawalRequests.filter(r => r.status === 'pending').map((req) => (
                  <motion.div 
                    layout
                    key={req.id} 
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {format(req.createdAt?.toDate?.() || new Date(), 'MMM dd • HH:mm')}
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">₹{(req.amount || 0).toLocaleString()}</div>
                      </div>
                      <div className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                        PENDING
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4 relative z-10 shadow-inner">
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Landmark className="w-2.5 h-2.5" /> Source
                        </div>
                        <div className="text-[10px] font-black text-slate-800 tracking-tight line-clamp-1">
                          {req.bankAccount?.bankName}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                          **** {req.bankAccount?.accountNumber.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <ShieldAlert className="w-2.5 h-2.5" /> ID Check
                        </div>
                        <div className="text-[10px] font-black text-slate-800 tracking-tight uppercase">
                          {req.bankAccount?.ifsc}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                      <button 
                        onClick={() => handleWithdrawalAction(req.id!, 'completed')}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Execute
                      </button>
                      <button 
                        onClick={() => handleWithdrawalAction(req.id!, 'rejected')}
                        className="px-4 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-50 active:scale-95"
                      >
                        Deny
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Pending Settlements */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Live Pipeline</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pendingSettlements.length} Cycles</span>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {pendingSettlements.length === 0 ? (
                <div className="p-10 text-center">
                  <Clock className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Queue Clean</p>
                </div>
              ) : (
                pendingSettlements.slice(0, 8).map((s) => (
                  <div key={s.id} className="px-6 py-4 hover:bg-slate-50 transition-all flex items-center justify-between group">
                    <div className="flex flex-col min-w-0">
                      <div className="text-[11px] font-black text-slate-900 tracking-tight truncate max-w-[140px] group-hover:text-blue-600 transition-colors">{s.propertyTitle}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        <span className="text-emerald-600 font-black">₹{((s.amount || s.bookingAmount || 0) * 0.25).toLocaleString()}</span> Commission • {format(s.createdAt?.toDate?.() || new Date(), 'MMM dd')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-900">₹{(s.amount || s.bookingAmount || 0).toLocaleString()}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">Total Amt</div>
                    </div>
                  </div>
                ))
              )}
              {pendingSettlements.length > 8 && (
                <div className="p-4 bg-slate-50/50 text-center">
                  <button className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">See all pipeline items</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ShieldAlert = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
