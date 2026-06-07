import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { walletService } from '../../services/walletService';
import { CreditCard, Search, X, ExternalLink, Filter, Download, ChevronLeft, ChevronRight, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentLogEntry {
  id: string;
  source: 'razorpay' | 'wallet';
  eventType: string;
  orderId: string;
  paymentId: string;
  refundId: string;
  bookingId: string | null;
  amount: number;
  fee: number;
  method: string;
  status: string;
  fullPayload: any;
  createdAt: Timestamp;
  description?: string;
  userName?: string;
  userRole?: string;
}

export const AdminPaymentLogs = () => {
  const [razorpayLogs, setRazorpayLogs] = useState<PaymentLogEntry[]>([]);
  const [walletPayments, setWalletPayments] = useState<PaymentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLog, setSelectedLog] = useState<PaymentLogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('ALL');
  const pageSize = 50;

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, 'paymentLogs'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          source: 'razorpay' as const,
          ...doc.data()
        })) as PaymentLogEntry[];
        setRazorpayLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching payment logs:", error);
        setLoading(false);
      }
    );

    const unsub2 = walletService.subscribeToAllTransactions((txns: any[]) => {
      const onlinePk = txns
        .filter((t: any) => t.paymentMode === 'Online Payment')
        .map((t: any) => ({
          id: t.id,
          source: 'wallet' as const,
          eventType: t.amountType === 'BOOKING' ? 'payment.captured' : t.amountType === 'REFUND' ? 'refund.processed' : t.amountType || 'unknown',
          orderId: t.bookingId || '',
          paymentId: '',
          refundId: '',
          bookingId: t.bookingId || null,
          amount: t.amount || 0,
          fee: 0,
          method: 'Online',
          status: t.status || 'completed',
          fullPayload: t,
          createdAt: t.createdAt,
          description: t.description || '',
          userName: t.userName || '',
          userRole: t.userRole || '',
        }));
      setWalletPayments(onlinePk);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const allLogs = useMemo(() => {
    const combined = [...razorpayLogs, ...walletPayments];
    combined.sort((a, b) => {
      const aT = a.createdAt?.toMillis?.() || 0;
      const bT = b.createdAt?.toMillis?.() || 0;
      return bT - aT;
    });
    return combined;
  }, [razorpayLogs, walletPayments]);

  const tabs = [
    { key: 'all', label: 'All Transactions' },
    { key: 'payment.captured', label: 'Captured' },
    { key: 'payment.failed', label: 'Failed' },
    { key: 'refund.', label: 'Refunds' },
    { key: 'payment.dispute', label: 'Disputes' },
    { key: 'wallet', label: 'Wallet Payments' },
  ];

  const filteredLogs = useMemo(() => {
    return allLogs.filter(l => {
      const matchesTab = activeTab === 'all'
        ? true
        : activeTab === 'wallet'
          ? l.source === 'wallet'
          : activeTab === 'refund.'
            ? l.eventType.startsWith('refund.')
            : l.source === 'razorpay' && l.eventType.startsWith(activeTab);

      if (!matchesTab) return false;

      if (dateFilter !== 'ALL') {
        const date = l.createdAt?.toDate?.() || new Date();
        const now = new Date();
        if (dateFilter === 'TODAY' && date.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'WEEK') {
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (date < lastWeek) return false;
        }
        if (dateFilter === 'MONTH') {
          const lastMonth = new Date(now);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          if (date < lastMonth) return false;
        }
      }

      const searchStr = searchQuery.toLowerCase();
      if (!searchStr) return true;

      return (
        l.orderId?.toLowerCase().includes(searchStr) ||
        l.paymentId?.toLowerCase().includes(searchStr) ||
        (l.bookingId || '').toLowerCase().includes(searchStr) ||
        (l.description || '').toLowerCase().includes(searchStr) ||
        (l.userName || '').toLowerCase().includes(searchStr)
      );
    });
  }, [allLogs, activeTab, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);

  const formatAmount = (amount?: number) =>
    amount ? `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00';

  const getEventBadge = (type: string) => {
    if (type.startsWith('payment.captured')) return 'bg-emerald-100 text-emerald-800';
    if (type.startsWith('payment.failed')) return 'bg-red-100 text-red-800';
    if (type.startsWith('refund.')) return 'bg-amber-100 text-amber-800';
    if (type.startsWith('payment.dispute')) return 'bg-purple-100 text-purple-800';
    if (type.startsWith('payment.authorized')) return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getSourceBadge = (source: string) =>
    source === 'razorpay'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-blue-50 text-blue-700 border-blue-200';

  const formatTime = (ts: Timestamp) => {
    if (!ts?.toDate) return '—';
    const d = ts.toDate();
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Source', 'Event', 'Description', 'Amount', 'Order ID', 'Payment ID', 'Booking ID', 'Method', 'Fee'];
    const lines = filteredLogs.map(l => [
      l.createdAt?.toDate?.() ? format(l.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : '',
      l.source,
      l.eventType,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.amount ? l.amount / 100 : 0,
      l.orderId || '',
      l.paymentId || '',
      l.bookingId || '',
      l.method || '',
      l.fee ? l.fee / 100 : 0,
    ]);
    const csv = headers.join(',') + '\n' + lines.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            All Razorpay webhook events and online payment records
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setCurrentPage(1); setSearchQuery(''); setActiveTab('all'); setDateFilter('ALL'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === t.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                  {t.key !== 'all' && t.key !== 'wallet' && (
                    <span className="ml-1.5 opacity-70">
                      ({razorpayLogs.filter(l => t.key === 'refund.' ? l.eventType.startsWith('refund.') : l.eventType.startsWith(t.key)).length})
                    </span>
                  )}
                  {t.key === 'wallet' && (
                    <span className="ml-1.5 opacity-70">({walletPayments.length})</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
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
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, user, description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Source / Event</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map(log => (
                <tr
                  key={log.id + log.source}
                  onClick={() => setSelectedLog(log)}
                  className="border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getSourceBadge(log.source)}`}>
                        {log.source}
                      </span>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getEventBadge(log.eventType)}`}>
                        {log.eventType.replace('payment.', '').replace('dispute.', 'dispute:')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-xs text-slate-700 max-w-[200px] truncate">
                      {log.description || log.eventType}
                    </div>
                    {log.userName && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.userName} · {log.userRole}</div>
                    )}
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{formatAmount(log.amount)}</td>
                  <td className="px-6 py-3">
                    <div className="space-y-0.5">
                      {log.orderId && <div className="font-mono text-[10px] text-slate-500 truncate max-w-[160px]">O: {log.orderId}</div>}
                      {log.paymentId && <div className="font-mono text-[10px] text-slate-500 truncate max-w-[160px]">P: {log.paymentId}</div>}
                      {log.bookingId && <div className="font-mono text-[10px] text-blue-600 truncate max-w-[160px]">B: {log.bookingId}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 text-xs">{log.method || '—'}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap text-xs">{formatTime(log.createdAt)}</td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <CreditCard className="w-12 h-12 text-slate-200 mb-3" />
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No payment records</h3>
                      <p className="text-sm text-slate-500 max-w-sm">
                        {razorpayLogs.length === 0 && walletPayments.length === 0
                          ? 'No Razorpay webhooks or online payment transactions found yet. Payment data will appear once bookings are made.'
                          : 'No records match your current filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedLogs.map(log => (
            <div
              key={log.id + log.source}
              onClick={() => setSelectedLog(log)}
              className="p-4 hover:bg-blue-50/50 cursor-pointer transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${getSourceBadge(log.source)}`}>
                    {log.source}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${getEventBadge(log.eventType)}`}>
                    {log.eventType}
                  </span>
                </div>
                <span className="font-bold text-slate-900">{formatAmount(log.amount)}</span>
              </div>
              {log.description && (
                <div className="text-xs text-slate-600 truncate">{log.description}</div>
              )}
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-mono truncate max-w-[50%]">{log.orderId || log.bookingId || '—'}</span>
                <span>{formatTime(log.createdAt)}</span>
              </div>
            </div>
          ))}
          {paginatedLogs.length === 0 && (
            <div className="p-12 text-center text-slate-400">No payment logs found.</div>
          )}
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredLogs.length)} of {filteredLogs.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, safePage - 2);
                const page = start + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === safePage
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-400">
          {filteredLogs.length} records · {razorpayLogs.length} Razorpay · {walletPayments.length} Wallet
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-900">Transaction Details</h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getSourceBadge(selectedLog.source)}`}>
                  {selectedLog.source}
                </span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Event</span>
                  <p className="font-semibold text-slate-900">{selectedLog.eventType}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Amount</span>
                  <p className="font-semibold text-slate-900">{formatAmount(selectedLog.amount)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Description</span>
                  <p className="text-slate-700">{selectedLog.description || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Status</span>
                  <p className="text-slate-700">{selectedLog.status || '—'}</p>
                </div>
                {selectedLog.userName && (
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">User</span>
                    <p className="text-slate-700">{selectedLog.userName} ({selectedLog.userRole})</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Order ID</span>
                  <p className="font-mono text-xs text-slate-700 break-all">{selectedLog.orderId || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Payment ID</span>
                  <p className="font-mono text-xs text-slate-700 break-all">{selectedLog.paymentId || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Refund ID</span>
                  <p className="font-mono text-xs text-slate-700 break-all">{selectedLog.refundId || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Booking ID</span>
                  <p className="font-mono text-xs text-blue-600 break-all">{selectedLog.bookingId || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Method</span>
                  <p className="text-slate-700">{selectedLog.method || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Fee</span>
                  <p className="text-slate-700">{formatAmount(selectedLog.fee)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Timestamp</span>
                  <p className="text-slate-700">{formatTime(selectedLog.createdAt)}</p>
                </div>
              </div>
              {selectedLog.source === 'razorpay' && selectedLog.fullPayload && (
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Raw Payload</span>
                  <pre className="mt-1 p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selectedLog.fullPayload, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.source === 'wallet' && selectedLog.fullPayload && (
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Full Transaction Data</span>
                  <pre className="mt-1 p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selectedLog.fullPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
