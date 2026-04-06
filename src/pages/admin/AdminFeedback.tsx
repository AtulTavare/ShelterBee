import React, { useState } from 'react';

const mockFeedback = [
  { id: 1, type: 'Report', user: 'John Doe', target: 'Sunrise Apartments', date: '2023-11-16', status: 'Open', description: 'The property images are misleading. The actual room is much smaller.' },
  { id: 2, type: 'Feedback', user: 'Jane Smith', target: 'Platform', date: '2023-11-15', status: 'Reviewed', description: 'The search filters could be improved to include distance from university.' },
  { id: 3, type: 'Report', user: 'Mike Johnson', target: 'Rahul Sharma (Owner)', date: '2023-11-14', status: 'Resolved', description: 'Owner is asking for extra money outside the platform.' },
];

export const AdminFeedback = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feedback & Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Manage user feedback and investigate reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockFeedback.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedItem(item)}>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                item.type === 'Report' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {item.type}
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                item.status === 'Open' ? 'text-orange-600' : item.status === 'Reviewed' ? 'text-blue-600' : 'text-emerald-600'
              }`}>
                {item.status}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2 line-clamp-2">{item.description}</h3>
            <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">From:</span>
                <span>{item.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Target:</span>
                <span>{item.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-slate-900">{selectedItem.type} Details</h2>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedItem.type === 'Report' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedItem.type}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedItem.status === 'Open' ? 'bg-orange-100 text-orange-700' : selectedItem.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Status: {selectedItem.status}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Submitted By</div>
                <div className="font-medium text-slate-900 text-sm">{selectedItem.user} <span className="text-slate-500 font-normal">on {selectedItem.date}</span></div>
              </div>
              
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Entity</div>
                <div className="font-medium text-slate-900 text-sm">{selectedItem.target}</div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  {selectedItem.description}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end shrink-0 rounded-b-2xl">
              {selectedItem.status === 'Open' && (
                <button className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
                  Mark as Reviewed
                </button>
              )}
              {(selectedItem.status === 'Open' || selectedItem.status === 'Reviewed') && (
                <button className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors">
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
