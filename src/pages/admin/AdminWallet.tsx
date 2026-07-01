import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { walletService, WalletTransaction, WithdrawalRequest } from '../../services/walletService';
import { db } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Search, Download,
  Banknote, History, AlertCircle, Building2, ExternalLink, ChevronDown, RefreshCcw,
  Landmark, ChevronLeft, ChevronRight, User, ArrowUpRight, ArrowDownRight, DollarSign,
  PieChart, BarChart3, Play, X
} from 'lucide-react';
import { showToast, showConfirm } from '../../utils/toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminWallet = () => {
  const [adminUid, setAdminUid] = useState<string>('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAmountType, setFilterAmountType] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [releasingAll, setReleasingAll] = useState(false);
  const pageSize = 50;

  useEffect(() => {
    walletService.getAdminId().then(id => setAdminUid(id));
  }, []);

  useEffect(() => {
    if (!adminUid) return;

    const unsubBalance = walletService.subscribeToWalletBalance(adminUid, setBalance);
    const unsubTxns = walletService.subscribeToAllTransactions((txs: any[]) => {
      setTransactions(txs);
      setLoading(false);
    });
    const unsubSettlements = walletService.subscribeToPendingSettlements((s) => setPendingSettlements(s));
    const unsubWithdrawals = walletService.subscribeToWithdrawalRequests((r) => setWithdrawalRequests(r));

    return () => { unsubBalance(); unsubTxns(); unsubSettlements(); unsubWithdrawals(); };
  }, [adminUid]);

  // STRICT AGGREGATIONS using amountType
  const grossBookingRevenue = useMemo(() =>
    transactions
      .filter(t => t.amountType === 'BOOKING' && t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0),
  [transactions]);

  const commissionsEarned = useMemo(() =>
    transactions
      .filter(t => t.amountType === 'COMMISSION' && t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0),
  [transactions]);

  const refundsIssued = useMemo(() =>
    transactions
      .filter(t => t.amountType === 'REFUND' && t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0),
  [transactions]);

  const settlementsReleased = useMemo(() =>
    transactions
      .filter(t => t.amountType === 'SETTLEMENT' && t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0),
  [transactions]);

  const netRevenue = useMemo(() => grossBookingRevenue - refundsIssued - settlementsReleased, [grossBookingRevenue, refundsIssued, settlementsReleased]);

  const withdrawalVolume = useMemo(() =>
    transactions
      .filter(t => t.amountType === 'WITHDRAWAL' && t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0),
  [transactions]);

  // 30-day revenue chart data
  const chartData = useMemo(() => {
    const data: { date: string; revenue: number; refunds: number; settlements: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      const dayRevenue = transactions.filter(t => {
        const tDate = t.createdAt?.toDate?.() || new Date();
        return t.amountType === 'BOOKING' && t.type === 'credit' && tDate >= dayStart && tDate < dayEnd;
      }).reduce((s, t) => s + t.amount, 0);

      const dayRefunds = transactions.filter(t => {
        const tDate = t.createdAt?.toDate?.() || new Date();
        return t.amountType === 'REFUND' && t.type === 'debit' && tDate >= dayStart && tDate < dayEnd;
      }).reduce((s, t) => s + t.amount, 0);

      const daySettlements = transactions.filter(t => {
        const tDate = t.createdAt?.toDate?.() || new Date();
        return t.amountType === 'SETTLEMENT' && t.type === 'debit' && tDate >= dayStart && tDate < dayEnd;
      }).reduce((s, t) => s + t.amount, 0);

      data.push({ date: dayStr, revenue: dayRevenue, refunds: dayRefunds, settlements: daySettlements });
    }
    return data;
  }, [transactions]);

  const properties = useMemo(() => {
    const props = new Set<string>();
    transactions.forEach(t => { if (t.propertyTitle) props.add(t.propertyTitle); });
    return Array.from(props).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterAmountType !== 'ALL' && t.amountType !== filterAmountType) return false;

      if (dateFilter !== 'ALL') {
        const date = t.createdAt?.toDate?.() || new Date();
        const now = new Date();
        if (dateFilter === 'TODAY' && date.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'WEEK') {
          if (date < new Date(now.getTime() - 7 * 86400000)) return false;
        }
        if (dateFilter === 'MONTH') {
          const lastMonth = new Date(now);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          if (date < lastMonth) return false;
        }
      }

      if (propertyFilter !== 'ALL' && t.propertyTitle !== propertyFilter) return false;

      return true;
    });
  }, [transactions, filterAmountType, dateFilter, propertyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleReleaseAllSettlements = useCallback(async () => {
    showConfirm('Release all pending settlements now? This will credit owners and partners for all unsettled bookings.', async () => {
      setReleasingAll(true);
      try {
        await walletService.processAllPendingSettlements();
        showToast('All pending settlements processed', 'success');
      } catch (err) {
        showToast('Failed to process settlements', 'error');
      } finally {
        setReleasingAll(false);
      }
    });
  }, []);

  const handleWithdrawalAction = (requestId: string, status: 'completed' | 'rejected') => {
    const action = status === 'completed' ? 'approve' : 'reject';
    showConfirm(`Are you sure you want to ${action} this withdrawal request?`, async () => {
      try {
        await walletService.processWithdrawal(requestId, status);
        showToast(`Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully`, 'success');
      } catch (error) {
        showToast('Failed to process withdrawal', 'error');
      }
    });
  };

  const exportTransactions = () => {
    const headers = ['Date', 'User', 'Role', 'Type', 'Amount Type', 'Description', 'Property', 'Booking ID', 'Amount', 'Balance After', 'Payment Mode', 'Status'];
    const lines = filteredTransactions.map(t => [
      t.createdAt?.toDate?.() ? format(t.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : '',
      (t.userName || t.userId || '').replace(/"/g, '""'),
      t.userRole || '',
      t.type,
      t.amountType || '',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.propertyTitle || '').replace(/"/g, '""')}"`,
      t.bookingId || '',
      t.amount,
      t.balanceAfter ?? '',
      t.paymentMode || '',
      t.status || '',
    ]);
    const csv = headers.join(',') + '\n' + lines.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  };

  const statsCards = [
    { label: 'Gross Booking Revenue', value: grossBookingRevenue, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', prefix: '+' },
    { label: 'Commissions Earned', value: commissionsEarned, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', prefix: '+' },
    { label: 'Refunds Issued', value: refundsIssued, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', prefix: '-' },
    { label: 'Settlements Released', value: settlementsReleased, icon: Banknote, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', prefix: '-' },
    { label: 'Net Revenue', value: Math.max(0, netRevenue), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', prefix: '' },
    { label: 'Withdrawal Volume', value: withdrawalVolume, icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', prefix: '-' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Wallet</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time financial overview with strict calculations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReleaseAllSettlements}
            disabled={releasingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {releasingAll ? 'Releasing...' : 'Release All Settlements'}
          </button>
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Balance Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f172a] p-6 md:p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="w-24 h-24 md:w-32 md:h-32" />
        </div>
        <div className="relative z-10">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Platform Balance</div>
          <div className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            ₹{balance.toLocaleString('en-IN')}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pending Settlements</div>
              <div className="text-sm font-black">{pendingSettlements.length}</div>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pending Withdrawals</div>
              <div className="text-sm font-black">{withdrawalRequests.filter(r => r.status === 'pending').length}</div>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Net Revenue</div>
              <div className="text-sm font-black text-emerald-400">₹{netRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className={`text-xs font-bold ${netRevenue >= 0 && stat.label === 'Net Revenue' ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {stat.prefix}{stat.value > 0 ? 'Revenue' : 'Outflow'}
                </span>
              </div>
              <div className={`text-xl font-black tracking-tight ${stat.label === 'Net Revenue' ? (netRevenue >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900'}`}>
                ₹{stat.value.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* 30-Day Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">30-Day Revenue Trend</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                formatter={(value: number, name: string) => [`₹${value}`, name === 'revenue' ? 'Revenue' : name === 'refunds' ? 'Refunds' : 'Settlements']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="refunds" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="settlements" stroke="#f97316" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content: Transaction Table + Side Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Transaction Table - spans 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 rounded-lg">
                <History className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
              <span className="text-xs text-slate-400 ml-1">({filteredTransactions.length})</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={propertyFilter}
                  onChange={(e) => { setPropertyFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm max-w-[120px]"
                >
                  <option value="ALL">All Properties</option>
                  {properties.map(p => (<option key={p} value={p}>{p}</option>))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={filterAmountType}
                  onChange={(e) => { setFilterAmountType(e.target.value); setCurrentPage(1); }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Types</option>
                  <option value="BOOKING">Booking</option>
                  <option value="COMMISSION">Commission</option>
                  <option value="REFUND">Refund</option>
                  <option value="SETTLEMENT">Settlement</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="PENALTY">Penalty</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">Last 7 Days</option>
                  <option value="MONTH">Last 30 Days</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [1,2,3,4,5].map(n => (
                      <tr key={n} className="animate-pulse">
                        <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                        <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                        <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                        <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                        <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                        <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400">No transactions match filters</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-slate-900 truncate max-w-[100px] leading-tight">
                                {t.userName || 'N/A'}
                              </div>
                              {t.userRole && (
                                <span className={`inline-block mt-0.5 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest ${
                                  t.userRole === 'admin' ? 'bg-purple-50 text-purple-600' :
                                  t.userRole === 'owner' ? 'bg-blue-50 text-blue-600' :
                                  t.userRole === 'partner' ? 'bg-amber-50 text-amber-600' :
                                  t.userRole === 'visitor' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                                }`}>
                                  {t.userRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-[11px] font-bold text-slate-900">
                            {t.createdAt?.toDate?.() ? format(t.createdAt.toDate(), 'dd MMM') : '—'}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold tracking-widest">
                            {t.createdAt?.toDate?.() ? format(t.createdAt.toDate(), 'HH:mm') : ''}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight max-w-[180px]">{t.description}</div>
                          {t.bookingId && (
                            <div className="flex items-center gap-1 mt-0.5 text-[8px] font-bold text-blue-600">
                              <ExternalLink className="w-2 h-2" />
                              REF: {t.bookingId.slice(-8).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest w-fit shadow-sm ${
                            t.amountType === 'BOOKING' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            t.amountType === 'COMMISSION' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            t.amountType === 'REFUND' ? 'bg-red-50 text-red-600 border-red-100' :
                            t.amountType === 'WITHDRAWAL' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            t.amountType === 'SETTLEMENT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            t.amountType === 'PENALTY' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {t.amountType || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[90px]">
                              {t.propertyTitle || 'Platform'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className={`text-sm font-bold tracking-tighter ${
                            t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                          </div>
                          {t.balanceAfter !== undefined && (
                            <div className="text-[8px] font-bold text-slate-400 mt-0.5">
                              Bal: ₹{t.balanceAfter.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length > 0 && totalPages > 1 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-400">
                  {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredTransactions.length)} of {filteredTransactions.length}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, safePage - 2);
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                          page === safePage ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>{page}</button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Rail: Withdrawals + Settlements */}
        <div className="space-y-6">
          {/* Withdrawal Requests */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.15em]">Payout Requests</h2>
              {withdrawalRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="flex items-center gap-1.5 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="w-1 h-1 bg-amber-500 rounded-full animate-ping"></span>
                  <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest">
                    {withdrawalRequests.filter(r => r.status === 'pending').length}
                  </span>
                </span>
              )}
            </div>
            <div className="space-y-3">
              {withdrawalRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All cleared</p>
                </div>
              ) : (
                withdrawalRequests.filter(r => r.status === 'pending').map((req) => (
                  <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {req.createdAt?.toDate?.() ? format(req.createdAt.toDate(), 'MMM dd • HH:mm') : ''}
                        </div>
                        <div className="text-xl font-bold text-slate-900">₹{(req.amount || 0).toLocaleString()}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[8px] font-bold uppercase tracking-widest">Pending</span>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank</div>
                        <div className="text-[10px] font-bold text-slate-800 truncate">{req.bankAccount?.bankName || '—'}</div>
                        <div className="text-[9px] font-bold text-slate-500">**** {req.bankAccount?.accountNumber?.slice(-4) || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC</div>
                        <div className="text-[10px] font-bold text-slate-800">{req.bankAccount?.ifsc || '—'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleWithdrawalAction(req.id!, 'completed')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleWithdrawalAction(req.id!, 'rejected')}
                        className="px-4 py-2.5 bg-white text-rose-600 border border-rose-100 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-rose-50 active:scale-95">
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Pending Settlements */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.15em]">Pending Settlements</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pendingSettlements.length}</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              {pendingSettlements.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Queue empty</p>
                </div>
              ) : (
                pendingSettlements.slice(0, 10).map((s) => (
                  <div key={s.id} className="px-5 py-3.5 hover:bg-slate-50 transition-all flex items-center justify-between group">
                    <div className="flex flex-col min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate max-w-[120px] group-hover:text-blue-600 transition-colors">
                        {s.propertyTitle || s.description || 'Booking'}
                      </div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        ₹{((s.amount || s.bookingAmount || 0) * 0.20).toLocaleString()} commission
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-900">₹{(s.amount || s.bookingAmount || 0).toLocaleString()}</div>
                      <div className="text-[7px] font-bold text-slate-400 uppercase">Total</div>
                    </div>
                  </div>
                ))
              )}
              {pendingSettlements.length > 10 && (
                <div className="p-3 bg-slate-50/50 text-center text-[9px] font-bold text-slate-400">
                  +{pendingSettlements.length - 10} more
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
