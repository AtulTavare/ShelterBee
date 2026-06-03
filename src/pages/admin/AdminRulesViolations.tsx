import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { userService } from '../../services/userService';
import { bookingService } from '../../services/bookingService';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, AlertTriangle, Ban, UserX, Search, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { showToast } from '../../utils/toast';

interface OwnerWithMeta {
  uid: string;
  email: string;
  displayName: string;
  mobile: string;
  rejectionCount: number;
  totalBookings: number;
  propertyCount: number;
  warnings: number;
  hasPenalty: boolean;
}

export const AdminRulesViolations = () => {
  const { user } = useAuth();
  const [owners, setOwners] = useState<OwnerWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithMeta | null>(null);
  const [actionType, setActionType] = useState<'warning' | 'ban' | 'penalty' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionAmount, setActionAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'owner')),
      async (snap) => {
        const ownerDocs = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        const enriched: OwnerWithMeta[] = await Promise.all(
          ownerDocs.map(async (o: any) => {
            const bookings = await bookingService.getBookingsByOwner(o.uid);
            const properties = await propertyService.getPropertiesByOwner(o.uid);
            const rejectedBookings = bookings.filter(b => b.status === 'rejected_by_owner');
            const warningsSnap = await Promise.resolve(
              (await import('firebase/firestore')).getDocs(
                (await import('firebase/firestore')).query(
                  collection(db, 'warnings'),
                  where('ownerId', '==', o.uid),
                  where('dismissed', '==', false),
                )
              )
            );
            const penaltiesSnap = await Promise.resolve(
              (await import('firebase/firestore')).getDocs(
                (await import('firebase/firestore')).query(
                  collection(db, 'penalties'),
                  where('ownerId', '==', o.uid),
                  where('status', '==', 'pending'),
                )
              )
            );
            return {
              uid: o.uid,
              email: o.email || '',
              displayName: o.displayName || 'Unknown',
              mobile: o.mobile || o.phone || '',
              rejectionCount: rejectedBookings.length,
              totalBookings: bookings.length,
              propertyCount: properties.length,
              warnings: warningsSnap.size,
              hasPenalty: penaltiesSnap.size > 0,
            };
          })
        );
        enriched.sort((a, b) => b.rejectionCount - a.rejectionCount);
        setOwners(enriched);
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub();
  }, [user]);

  const filtered = owners.filter(o =>
    o.displayName.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async () => {
    if (!selectedOwner || !actionType || !actionReason.trim()) return;
    if (actionType === 'penalty' && (!actionAmount || Number(actionAmount) <= 0)) {
      showToast('Enter a valid penalty amount', 'error');
      return;
    }
    setProcessing(true);
    try {
      if (actionType === 'warning') {
        await userService.sendWarning(selectedOwner.uid, actionReason, user!.uid);
        showToast('Warning sent to owner', 'success');
      } else if (actionType === 'ban') {
        await userService.banUser(selectedOwner.uid, actionReason, user!.uid);
        showToast('Owner banned', 'success');
      } else if (actionType === 'penalty') {
        await userService.addPenalty(selectedOwner.uid, Number(actionAmount), actionReason, 'admin');
        showToast(`Penalty of ₹${actionAmount} added`, 'success');
      }
      setActionType(null);
      setActionReason('');
      setActionAmount('');
      setSelectedOwner(null);
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            Rules & Violations
          </h2>
          <p className="text-sm text-slate-500 mt-1">Monitor owner compliance, issue warnings, penalties, and bans</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search owners..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-400">All owners are compliant</h3>
          <p className="text-sm text-slate-400">No violations found across the platform.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bookings</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rejections</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Warnings</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Penalty</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((owner) => (
                <tr key={owner.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{owner.displayName}</p>
                      <p className="text-xs text-slate-500">{owner.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-900">{owner.propertyCount}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-900">{owner.totalBookings}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-bold ${owner.rejectionCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {owner.rejectionCount}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-bold ${owner.warnings > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {owner.warnings}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {owner.hasPenalty ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> Pending
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setSelectedOwner(owner); setActionType('warning'); setActionReason(''); }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> Warn
                      </button>
                      <button
                        onClick={() => { setSelectedOwner(owner); setActionType('penalty'); setActionReason(''); setActionAmount(''); }}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" /> Penalty
                      </button>
                      <button
                        onClick={() => { setSelectedOwner(owner); setActionType('ban'); setActionReason(''); }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                      >
                        <UserX className="w-3 h-3" /> Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionType && selectedOwner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => !processing && setActionType(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {actionType === 'warning' && <><AlertTriangle className="w-5 h-5 text-amber-500" /> Issue Warning</>}
                {actionType === 'penalty' && <><Ban className="w-5 h-5 text-orange-500" /> Add Penalty</>}
                {actionType === 'ban' && <><UserX className="w-5 h-5 text-red-500" /> Ban Owner</>}
              </h3>
              <button onClick={() => !processing && setActionType(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-2">
              Owner: <span className="font-bold text-slate-900">{selectedOwner.displayName}</span>
            </p>
            {actionType === 'penalty' && (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Penalty Amount (₹)</label>
                <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium" placeholder="1000" min="1" />
              </div>
            )}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reason</label>
              <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium h-24 resize-none" placeholder="Describe the violation..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActionType(null)} disabled={processing} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAction} disabled={processing || !actionReason.trim() || (actionType === 'penalty' && (!actionAmount || Number(actionAmount) <= 0))} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {actionType === 'warning' ? 'Send Warning' : actionType === 'penalty' ? 'Add Penalty' : 'Ban Owner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};