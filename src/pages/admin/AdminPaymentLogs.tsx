import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CreditCard, Search, X, ExternalLink } from 'lucide-react';

interface PaymentLog {
  id: string;
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
}

export const AdminPaymentLogs = () => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'paymentLogs'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PaymentLog[];
        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching payment logs:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'payment.captured', label: 'Captured' },
    { key: 'payment.failed', label: 'Failed' },
    { key: 'refund.', label: 'Refunds' },
    { key: 'payment.dispute', label: 'Disputes' },
  ];

  const filteredLogs = logs.filter(l => {
    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'refund.'
        ? l.eventType.startsWith('refund.')
        : l.eventType.startsWith(activeTab);
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = !searchStr
      ? true
      : l.orderId.toLowerCase().includes(searchStr) ||
        l.paymentId.toLowerCase().includes(searchStr) ||
        (l.bookingId || '').toLowerCase().includes(searchStr);
    return matchesTab && matchesSearch;
  });

  const formatAmount = (paise: number) =>
    paise ? `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

  const getEventBadge = (type: string) => {
    if (type.startsWith('payment.captured')) return 'bg-emerald-100 text-emerald-800';
    if (type.startsWith('payment.failed')) return 'bg-red-100 text-red-800';
    if (type.startsWith('refund.')) return 'bg-amber-100 text-amber-800';
    if (type.startsWith('payment.dispute')) return 'bg-purple-100 text-purple-800';
    if (type.startsWith('payment.authorized')) return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const formatTime = (ts: Timestamp) => {
    if (!ts?.toDate) return '—';
    const d = ts.toDate();
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          All Razorpay webhook events — captured, failed, refunds, disputes, and more.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === t.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                  {t.key !== 'all' && (
                    <span className="ml-1.5 opacity-70">
                      ({logs.filter(l => t.key === 'refund.' ? l.eventType.startsWith('refund.') : l.eventType.startsWith(t.key)).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search order / payment / booking ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payment ID</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Booking</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getEventBadge(log.eventType)}`}>
                      {log.eventType.replace('payment.', '').replace('dispute.', 'dispute:')}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{formatAmount(log.amount)}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-600">{log.orderId ? log.orderId.slice(0, 20) + '…' : '—'}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-600">{log.paymentId ? log.paymentId.slice(0, 20) + '…' : '—'}</td>
                  <td className="px-6 py-3">
                    {log.bookingId ? (
                      <span className="font-mono text-xs text-blue-600">{log.bookingId.slice(0, 12)}…</span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{log.method || '—'}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{formatTime(log.createdAt)}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">No payment logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="p-4 hover:bg-blue-50/50 cursor-pointer transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getEventBadge(log.eventType)}`}>
                  {log.eventType}
                </span>
                <span className="font-bold text-slate-900">{formatAmount(log.amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-mono">{log.orderId?.slice(0, 16) || '—'}</span>
                <span>{formatTime(log.createdAt)}</span>
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-400">No payment logs found.</div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-400">
          {filteredLogs.length} of {logs.length} events
        </div>
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Event Details</h3>
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
              </div>
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Raw Payload</span>
                <pre className="mt-1 p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog.fullPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
