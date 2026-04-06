import React, { useState, useEffect } from 'react';
import { propertyService, Property } from '../../services/propertyService';
import { userService } from '../../services/userService';

const rejectionReasons = [
  'Incomplete Property Details',
  'Blurry or Fake Images',
  'Invalid Ownership Documents',
  'Price Unreasonably High',
  'Other'
];

export const AdminPendingApprovals = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const fetchPendingProperties = async () => {
    setLoading(true);
    try {
      const allProps = await propertyService.getAllProperties();
      setProperties(allProps.filter(p => p.status === 'Pending'));
    } catch (error) {
      console.error("Error fetching pending properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await propertyService.updatePropertyStatus(id, 'Approved');
      
      const property = properties.find(p => p.id === id);
      if (property) {
        try {
          const ownerProfile = await userService.getUserProfile(property.ownerId);
          if (ownerProfile?.email) {
            (window as any).sendEmail(
              ownerProfile.email,
              "Your Property is Now Live — Shelterbee",
              `Great news! Your property "${property.title}" has been approved and is now live on Shelterbee.`
            );
          }
        } catch (e) {
          console.error("Failed to send email:", e);
        }
      }

      setProperties(properties.filter(p => p.id !== id));
      setSelectedProperty(null);
    } catch (error) {
      console.error("Error approving property:", error);
      // alert("Failed to approve property.");
    }
  };

  const handleReject = async () => {
    if (!rejectReason || !selectedProperty) return;
    try {
      await propertyService.updatePropertyStatus(selectedProperty.id, 'Rejected');
      
      try {
        const ownerProfile = await userService.getUserProfile(selectedProperty.ownerId);
        if (ownerProfile?.email) {
          (window as any).sendEmail(
            ownerProfile.email,
            "Property Listing Update — Shelterbee",
            `Your property listing "${selectedProperty.title}" requires updates.\nReason: ${rejectReason}`
          );
        }
      } catch (e) {
        console.error("Failed to send email:", e);
      }

      setProperties(properties.filter(p => p.id !== selectedProperty.id));
      setShowRejectModal(false);
      setSelectedProperty(null);
      setRejectReason('');
    } catch (error) {
      console.error("Error rejecting property:", error);
      // alert("Failed to reject property.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading pending approvals...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve new property listings submitted by owners.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => (
          <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedProperty(prop)}>
            <div className="h-48 relative">
              <img src={prop.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300'} alt={prop.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Pending
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">{prop.type}</div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{prop.title}</h3>
              <div className="text-sm font-medium text-slate-600 mb-3">₹{prop.pricePerDay}/day</div>
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>By: {prop.ownerId?.substring(0, 8) || 'Unknown'}</span>
                <span>{prop.createdAt ? (prop.createdAt.toDate ? prop.createdAt.toDate().toLocaleDateString() : new Date(prop.createdAt).toLocaleDateString()) : 'Unknown'}</span>
              </div>
            </div>
          </div>
        ))}
        {properties.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No pending approvals at the moment.
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {selectedProperty && !showRejectModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedProperty(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Review Property</h2>
              <button onClick={() => setSelectedProperty(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Images */}
              <div>
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Images</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {selectedProperty.photos?.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt="Property" className="w-48 h-32 object-cover rounded-xl shrink-0 border border-slate-200" />
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Property Name</div>
                  <div className="font-semibold text-slate-900 text-base">{selectedProperty.title}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Type & Price</div>
                  <div className="font-semibold text-slate-900 text-base">{selectedProperty.type} • ₹{selectedProperty.pricePerDay}/day</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</div>
                  <div className="text-sm text-slate-700 leading-relaxed">{selectedProperty.description}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Owner ID</div>
                  <div className="font-medium text-slate-900 text-sm">{selectedProperty.ownerId}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Submitted Date</div>
                  <div className="font-medium text-slate-900 text-sm">{selectedProperty.createdAt ? (selectedProperty.createdAt.toDate ? selectedProperty.createdAt.toDate().toLocaleDateString() : new Date(selectedProperty.createdAt).toLocaleDateString()) : 'Unknown'}</div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Uploaded Documents</h3>
                <div className="flex flex-col gap-2">
                  {selectedProperty.aadhaarFront && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-blue-500">badge</span>
                      <span className="font-medium text-sm text-slate-900">Aadhaar Card (Front)</span>
                      <a href={selectedProperty.aadhaarFront} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-medium text-blue-600 hover:underline">View</a>
                    </div>
                  )}
                  {selectedProperty.aadhaarBack && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-blue-500">badge</span>
                      <span className="font-medium text-sm text-slate-900">Aadhaar Card (Back)</span>
                      <a href={selectedProperty.aadhaarBack} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-medium text-blue-600 hover:underline">View</a>
                    </div>
                  )}
                  {selectedProperty.propertyProof && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-blue-500">description</span>
                      <span className="font-medium text-sm text-slate-900">Property Proof</span>
                      <a href={selectedProperty.propertyProof} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-medium text-blue-600 hover:underline">View</a>
                    </div>
                  )}
                  {(!selectedProperty.aadhaarFront && !selectedProperty.aadhaarBack && !selectedProperty.propertyProof) && (
                    <div className="text-sm text-slate-500">No documents uploaded.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0 rounded-b-2xl">
              <button 
                onClick={() => handleApprove(selectedProperty.id)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Approve Property
              </button>
              <button 
                onClick={() => setShowRejectModal(true)}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Reject Property
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
                <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
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
                disabled={!rejectReason}
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
