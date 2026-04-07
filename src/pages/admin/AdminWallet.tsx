import React, { useState, useEffect } from 'react';
import { walletService, WalletTransaction, WithdrawalRequest } from '../../services/walletService';
import { userService } from '../../services/userService';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Landmark,
  IndianRupee
} from 'lucide-react';

export const AdminWallet = () => {
  const [pendingSettlements, setPendingSettlements] = useState<WalletTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPendingSettlements: 0,
    totalPendingWithdrawals: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const settlements = await walletService.getAllPendingSettlements();
      const withdrawals = await walletService.getAllWithdrawalRequests();
      
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

      setPendingSettlements(settlements);
      setWithdrawalRequests(withdrawals);

      setStats({
        totalPendingSettlements: settlements.reduce((sum, s) => sum + s.amount, 0),
        totalPendingWithdrawals: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      });

    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const [confirmAction, setConfirmAction] = useState<{type: 'settle' | 'withdraw', id: string, action?: 'completed' | 'rejected'} | null>(null);
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSettle = async (transactionId: string) => {
    try {
      await walletService.markSettlementComplete(transactionId);
      showToast('success', 'Transaction settled successfully.');
      fetchData();
    } catch (error) {
      console.error("Error settling transaction:", error);
      showToast('error', 'Failed to settle transaction.');
    }
  };

  const handleWithdrawal = async (requestId: string, action: 'completed' | 'rejected') => {
    try {
      const request = withdrawalRequests.find(r => r.id === requestId);
      await walletService.processWithdrawalRequest(requestId, action);
      
      if (action === 'completed' && request) {
        try {
          const userProfile = await userService.getUserProfile(request.userId);
          if (userProfile?.email) {
            (window as any).sendEmail(
              userProfile.email,
              "Withdrawal Successful — Shelterbee",
              `Your withdrawal request for ₹${request.amount} has been successfully processed on ${new Date().toLocaleDateString()}.`
            );
          }
        } catch (e) {
          console.error("Failed to send email:", e);
        }
      }

      showToast('success', `Withdrawal marked as ${action}.`);
      fetchData();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      showToast('error', 'Failed to process withdrawal.');
    }
  };

  const confirmAndExecute = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'settle') {
      handleSettle(confirmAction.id);
    } else if (confirmAction.type === 'withdraw' && confirmAction.action) {
      handleWithdrawal(confirmAction.id, confirmAction.action);
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Wallet & Payments</h1>
          <p className="text-sm text-slate-500">Manage platform finances, payouts, and refunds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownRight className="w-24 h-24 text-orange-600" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Settlements</div>
          </div>
          <div className="text-3xl font-black text-slate-900 flex items-center gap-1">
            <IndianRupee className="w-6 h-6 text-orange-500" />
            {stats.totalPendingSettlements.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">To be moved to available balance</div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-24 h-24 text-blue-600" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Withdrawals</div>
          </div>
          <div className="text-3xl font-black text-slate-900 flex items-center gap-1">
            <IndianRupee className="w-6 h-6 text-blue-500" />
            {stats.totalPendingWithdrawals.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Requested by users</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900">Pending Settlements</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingSettlements.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {txn.createdAt ? format(txn.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-900 font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {txn.userId.substring(0, 2).toUpperCase()}
                        </div>
                        {txn.userId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 capitalize font-medium">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                        {txn.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">
                      +₹{txn.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => setConfirmAction({ type: 'settle', id: txn.id! })} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200/50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Settled
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingSettlements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No pending settlements</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900">Withdrawal Requests</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Details</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawalRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {req.requestedAt ? format(req.requestedAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-900 font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {req.userId.substring(0, 2).toUpperCase()}
                        </div>
                        {req.userId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-700">{req.bankAccount.bankName}</div>
                      <div className="text-[11px] text-slate-500 font-medium font-mono mt-0.5">
                        {req.bankAccount.accountNumber} <span className="text-slate-300">•</span> {req.bankAccount.ifsc}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-black text-slate-900">
                      ₹{req.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                        req.status === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-200/50' :
                        'bg-red-50 text-red-700 border border-red-200/50'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setConfirmAction({ type: 'withdraw', id: req.id!, action: 'completed' })} 
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-transparent hover:border-emerald-200" 
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ type: 'withdraw', id: req.id!, action: 'rejected' })} 
                            className="p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200" 
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawalRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Landmark className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No withdrawal requests</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Action</h3>
            <p className="text-slate-600 mb-6">
              {confirmAction.type === 'settle' 
                ? "Are you sure you want to mark this settlement as complete? This will move funds to the user's available balance."
                : `Are you sure you want to mark this withdrawal as ${confirmAction.action}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndExecute}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
