import { showToast } from '../../utils/toast';
import React, { useState, useEffect } from 'react';
import { propertyService, Property } from '../../services/propertyService';
import { emailService } from '../../services/emailService';
import { userService } from '../../services/userService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const rejectionReasons = [
  'Mismatch between property details and submitted documents',
  'Invalid or unclear ID proof (Aadhar/light bill)',
  'Poor quality images',
  'Owner identity mismatch',
  'Improper address',
  'Inappropriate bank details',
  'Other'
];

export const AdminManageProperties = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'rejected' | 'approved' | 'pending'>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const allProps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(allProps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching properties:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProperties = properties.filter(p => {
    if (activeTab === 'all') return true;
    return p.status.toLowerCase() === activeTab;
  });

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Rejected' | 'Pending', reason?: string) => {
    try {
      await propertyService.updatePropertyStatus(id, newStatus);
      
      const prop = properties.find(p => p.id === id);
      if (prop) {
        const owner = await userService.getUserProfile(prop.ownerId);
        if (owner && owner.email) {
          const reasonText = reason ? `\nReason: ${reason}` : '';
          await emailService.sendEmail({
            to: owner.email,
            subject: `Property ${newStatus}: ${prop.title}`,
            text: `Hello ${owner.displayName || 'User'},\n\nYour property "${prop.title}" has been ${newStatus.toLowerCase()} by the admin.${reasonText}\n\nThank you,\nAdmin Team`,
            html: `<p>Hello ${owner.displayName || 'User'},</p><p>Your property "<strong>${prop.title}</strong>" has been <strong>${newStatus.toLowerCase()}</strong> by the admin.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}<p>Thank you,<br/>Admin Team</p>`
          });
        }
      }

      if (selectedProperty?.id === id) {
        setSelectedProperty({ ...selectedProperty, status: newStatus });
      }
      
      if (newStatus === 'Rejected') {
        setShowRejectModal(false);
        setRejectReason('');
        setOtherReason('');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("An error occurred", "error");
    }
  };

  const handleReject = () => {
    const finalReason = rejectReason === 'Other' ? otherReason : rejectReason;
    if (!finalReason || !selectedProperty) return;
    handleStatusChange(selectedProperty.id!, 'Rejected', finalReason);
  };

  const handleDelete = async (id: string) => {
    try {
      await propertyService.deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
      if (selectedProperty?.id === id) {
        setSelectedProperty(null);
      }
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Error deleting property:", error);
      showToast("An error occurred", "error");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading properties...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Properties</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage all property listings on the platform.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab} Properties
            </button>
          ))}
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((prop) => (
          <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 relative cursor-pointer" onClick={() => setSelectedProperty(prop)}>
              <img src={prop.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300'} alt={prop.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                  prop.status === 'Approved' ? 'bg-emerald-500 text-white' : prop.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {prop.status}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">{prop.type}</div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSelectedProperty(prop)}>{prop.title}</h3>
              <div className="text-sm font-medium text-slate-600 mb-3">₹{prop.pricePerDay}/day</div>
              
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">By: {prop.ownerId}</span>
                <div className="flex gap-2">
                  {prop.status !== 'Approved' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(prop.id!, 'Approved'); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      Approve
                    </button>
                  )}
                  {prop.status !== 'Rejected' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(prop.id!, 'Rejected'); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowDeleteModal(prop.id!); }}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProperties.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No properties found in this category.
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-slate-900">Property Details</h2>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedProperty.photos?.map((photo, idx) => (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-100 group relative">
                      <img src={photo} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const newTab = window.open();
                          if (newTab) {
                            newTab.document.body.innerHTML = `<img src="${photo}" style="max-width: 100%; height: auto;" />`;
                          }
                        }}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                      >
                        View Full
                      </button>
                    </div>
                  ))}
                  {(!selectedProperty.photos || selectedProperty.photos.length === 0) && (
                    <div className="col-span-full py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                      No photos uploaded.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Property Name</h3>
                  <p className="text-slate-900 font-medium">{selectedProperty.title}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Owner ID</h3>
                  <p className="text-slate-900 font-medium truncate">{selectedProperty.ownerId}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Type</h3>
                  <p className="text-slate-900 font-medium">{selectedProperty.type}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price</h3>
                  <p className="text-slate-900 font-medium">₹{selectedProperty.pricePerDay}/day</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Area</h3>
                  <p className="text-slate-900 font-medium">{selectedProperty.area}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm inline-block mt-1 ${
                    selectedProperty.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : selectedProperty.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedProperty.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedProperty.description || 'No description provided.'}
                </p>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded Documents</h3>
                <div className="flex flex-col gap-2">
                  {selectedProperty.aadhaarFront && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-blue-500">badge</span>
                      <span className="font-medium text-sm text-slate-900">Aadhaar Card (Front)</span>
                      <button 
                        onClick={() => {
                          const newTab = window.open();
                          if (newTab) {
                            newTab.document.body.innerHTML = `<img src="${selectedProperty.aadhaarFront}" style="max-width: 100%; height: auto;" />`;
                          }
                        }}
                        className="ml-auto text-xs font-medium text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  )}
                  {selectedProperty.aadhaarBack && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-blue-500">badge</span>
                      <span className="font-medium text-sm text-slate-900">Aadhaar Card (Back)</span>
                      <button 
                        onClick={() => {
                          const newTab = window.open();
                          if (newTab) {
                            newTab.document.body.innerHTML = `<img src="${selectedProperty.aadhaarBack}" style="max-width: 100%; height: auto;" />`;
                          }
                        }}
                        className="ml-auto text-xs font-medium text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  )}
                  {selectedProperty.propertyProof && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-blue-500">description</span>
                      <span className="font-medium text-sm text-slate-900">Property Proof</span>
                      <button 
                        onClick={() => {
                          const newTab = window.open();
                          if (newTab) {
                            newTab.document.body.innerHTML = `<img src="${selectedProperty.propertyProof}" style="max-width: 100%; height: auto;" />`;
                          }
                        }}
                        className="ml-auto text-xs font-medium text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  )}
                  {(!selectedProperty.aadhaarFront && !selectedProperty.aadhaarBack && !selectedProperty.propertyProof) && (
                    <div className="text-sm text-slate-500">No documents uploaded.</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {selectedProperty.status !== 'Approved' && (
                  <button 
                    onClick={() => handleStatusChange(selectedProperty.id!, 'Approved')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Approve Property
                  </button>
                )}
                {selectedProperty.status !== 'Rejected' && (
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 rounded-xl transition-colors"
                  >
                    Reject Property
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Confirm Deletion</h2>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this property? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Reason for Rejection</h2>
              <p className="text-sm text-slate-500 mt-1">Select a reason to notify the property owner.</p>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {rejectionReasons.map((reason) => (
                <div key={reason} className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="rejectReason" 
                      value={reason} 
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-4 h-4 text-red-600 focus:ring-red-600"
                    />
                    <span className="font-medium text-slate-900 text-sm">{reason}</span>
                  </label>
                  {reason === 'Other' && rejectReason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter other reason..."
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="ml-7 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0 rounded-b-2xl">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectReason || (rejectReason === 'Other' && !otherReason)}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
