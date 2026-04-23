import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { showToast, showConfirm } from '../../utils/toast';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  Trash2, 
  CheckCircle2, 
  Eye,
  Filter,
  Search,
  ChevronDown,
  MoreVertical
} from 'lucide-react';

interface UnifiedSubmission {
  id: string;
  sourceCollection: string;
  type: string;
  status: 'open' | 'reviewed' | 'resolved';
  description: string;
  message?: string;
  subject?: string;
  name?: string;
  fullName?: string;
  email: string;
  userId?: string;
  target?: string;
  targetId?: string;
  createdAt: any;
}

export const AdminFeedback = () => {
  const [submissions, setSubmissions] = useState<UnifiedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UnifiedSubmission | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    
    // Collections to monitor
    const collections = [
      'feedbacks',
      'reports',
      'support_inquiries',
      'support_tickets',
      'support',
      'feedback'
    ];

    const unsubscribes: (() => void)[] = [];
    const allData: Record<string, UnifiedSubmission[]> = {};

    collections.forEach(collName => {
      const q = query(collection(db, collName), orderBy('createdAt', 'desc'));
      
      const unsub = onSnapshot(q, (snapshot) => {
        allData[collName] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            sourceCollection: collName,
            ...data,
            // Normalize fields
            type: data.type || collName.toUpperCase().replace('_INQUIRIES', '').replace('_TICKETS', ''),
            status: data.status || 'open',
            description: data.description || data.message || 'No description provided',
            name: data.name || data.fullName || 'Anonymous',
            createdAt: data.createdAt
          } as UnifiedSubmission;
        });

        // Merge all
        const merged = Object.values(allData).flat().sort((a, b) => {
          const dateA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
        
        setSubmissions(merged);
        setLoading(false);
      }, (error) => {
        console.warn(`Error fetching ${collName}:`, error);
        // If collection doesn't exist, it's fine, just skip
        allData[collName] = [];
      });
      
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleUpdateStatus = async (item: UnifiedSubmission, newStatus: string) => {
    try {
      const docRef = doc(db, item.sourceCollection, item.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showToast(`Status updated to ${newStatus}`, "success");
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...item, status: newStatus as any });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = (item: UnifiedSubmission) => {
    showConfirm("Are you sure you want to delete this submission? This action cannot be undone.", async () => {
      try {
        await deleteDoc(doc(db, item.sourceCollection, item.id));
        showToast("Submission deleted successfully", "success");
        setSelectedItem(null);
      } catch (error) {
        console.error("Error deleting submission:", error);
        showToast("Failed to delete submission", "error");
      }
    });
  };

  const filteredSubmissions = submissions.filter(item => {
    const matchesType = typeFilter === 'ALL' || item.type.toUpperCase().includes(typeFilter);
    const matchesStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter;
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-700 border-red-200';
      case 'reviewed': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('report') || t.includes('complaint')) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (t.includes('feedback')) return <MessageSquare className="w-3.5 h-3.5" />;
    if (t.includes('support')) return <HelpCircle className="w-3.5 h-3.5" />;
    return <ShieldAlert className="w-3.5 h-3.5" />;
  };

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('report') || t.includes('complaint')) return 'bg-red-50 text-red-600 border-red-100';
    if (t.includes('feedback')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (t.includes('support')) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feedback & Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Review user submissions and provide assistance.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-2 flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type Filter</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['ALL', 'REPORTS', 'FEEDBACK', 'SUPPORT'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  typeFilter === type 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="w-px bg-slate-100 hidden sm:block"></div>
        <div className="space-y-2 flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status Filter</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['ALL', 'OPEN', 'REVIEWED', 'RESOLVED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  statusFilter === status 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
                <div className="w-16 h-4 bg-slate-50 rounded"></div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="pt-4 border-t border-slate-50 space-y-2">
                <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                <div className="h-3 bg-slate-50 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No submissions found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">
            There are no user reports, feedback, or support inquiries matching your current filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSubmissions.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => setSelectedItem(item)}
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  item.status === 'open' ? 'bg-red-500' : item.status === 'reviewed' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>

                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                    {item.type.replace(/_/g, ' ')}
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.1em] ${getStatusColor(item.status)}`}>
                    {item.status}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base mb-3 line-clamp-3 leading-snug group-hover:text-blue-700 transition-colors">
                    {item.subject || item.description}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-6 font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="mt-auto pt-5 border-t border-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-widest">From</span>
                    <span className="font-black text-slate-900">{item.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-widest">Date</span>
                    <span className="font-black text-slate-900">
                      {item.createdAt?.seconds 
                        ? format(item.createdAt.toDate(), 'MMM dd, yyyy HH:mm') 
                        : typeof item.createdAt === 'string'
                        ? format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')
                        : 'Invalid Date'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setSelectedItem(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 30 }} 
              className="modal-content bg-white rounded-[2.5rem] w-full max-w-xl flex flex-col shadow-2xl relative z-[100] border border-slate-100"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[2.5rem]">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                    {getTypeIcon(selectedItem.type)}
                    {selectedItem.type.replace(/_/g, ' ')} Details
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{selectedItem.id.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)} 
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all hover:scale-110"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 ${getTypeColor(selectedItem.type)}`}>
                    {getTypeIcon(selectedItem.type)}
                    {selectedItem.type.replace(/_/g, ' ')}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.1em] ${getStatusColor(selectedItem.status)}`}>
                    Status: {selectedItem.status}
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Submitted By</label>
                    <div className="font-bold text-slate-900 text-sm">{selectedItem.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{selectedItem.email}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Submission Date</label>
                    <div className="font-bold text-slate-900 text-sm">
                      {selectedItem.createdAt?.seconds 
                        ? format(selectedItem.createdAt.toDate(), 'MMM dd, yyyy HH:mm:ss') 
                        : typeof selectedItem.createdAt === 'string'
                        ? format(new Date(selectedItem.createdAt), 'MMM dd, yyyy HH:mm:ss')
                        : 'Invalid date'}
                    </div>
                  </div>
                </div>

                {selectedItem.target && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Related Target</label>
                    <div className="font-bold text-blue-600 bg-blue-50 px-4 py-3 rounded-2xl border border-blue-100 text-sm inline-block">
                      {selectedItem.target} {selectedItem.targetId && <span className="text-[10px] font-medium text-slate-400">({selectedItem.targetId})</span>}
                    </div>
                  </div>
                )}
  
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description/Message</label>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line shadow-inner">
                    {selectedItem.subject && <div className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">{selectedItem.subject}</div>}
                    {selectedItem.description}
                  </div>
                </div>

                {/* Additional metadata if exists */}
                {Object.entries(selectedItem).map(([key, value]) => {
                  const skipKeys = ['id', 'sourceCollection', 'type', 'status', 'description', 'message', 'subject', 'name', 'fullName', 'email', 'userId', 'target', 'targetId', 'createdAt', 'updatedAt'];
                  if (skipKeys.includes(key) || !value || typeof value === 'object') return null;
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <div className="font-bold text-slate-900 text-sm">{String(value)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center shrink-0 rounded-b-[2.5rem]">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(selectedItem)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100 group"
                    title="Delete Submission"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                
                <div className="flex gap-3">
                  {selectedItem.status === 'open' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedItem, 'reviewed')}
                      className="py-3.5 px-6 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Mark as Reviewed
                    </button>
                  )}
                  {(selectedItem.status === 'open' || selectedItem.status === 'reviewed') && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedItem, 'resolved')}
                      className="py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Resolved
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="py-3.5 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

