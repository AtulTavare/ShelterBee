import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { propertyService, Property } from '../../services/propertyService';
import { UserProfile } from '../../contexts/AuthContext';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export const AdminOwnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubOwner = onSnapshot(doc(db, 'users', id), (snapshot) => {
      if (snapshot.exists()) {
        setOwner({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        setOwner(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching owner profile:", error);
      setLoading(false);
    });

    const q = query(collection(db, 'properties'), where('ownerId', '==', id));
    const unsubProps = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(data);
    }, (error) => {
      console.error("Error fetching owner properties:", error);
    });

    return () => {
      unsubOwner();
      unsubProps();
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading owner details...</div>;
  }

  if (!owner) {
    return <div className="p-8 text-center text-red-500">Owner not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Owner Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed view of property owner and their listings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl mb-4">
              {owner.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{owner.name}</h2>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              (owner as any).status === 'Active' || !(owner as any).status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {(owner as any).status || 'Active'}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</div>
              <div className="text-sm font-medium text-slate-900">{owner.email}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</div>
              <div className="text-sm font-medium text-slate-900">{owner.phoneNumber || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Member Since</div>
              <div className="text-sm font-medium text-slate-900">{owner.createdAt ? (owner.createdAt.toDate ? owner.createdAt.toDate().toLocaleDateString() : new Date(owner.createdAt).toLocaleDateString()) : 'Unknown'}</div>
            </div>
          </div>
        </div>

        {/* Documents & Properties */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Documents */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-white">
              <h3 className="text-lg font-semibold text-slate-900">Verification Documents</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500">Documents are associated with individual property listings. Please review the properties below to see their specific verification documents.</p>
            </div>
          </div>

          {/* Properties */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-white">
              <h3 className="text-lg font-semibold text-slate-900">Listed Properties</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Property Name</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {properties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/property/${prop.id}`)}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{prop.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{prop.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          prop.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : prop.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">₹{(prop.pricePerDay || 0).toLocaleString()}/day</td>
                    </tr>
                  ))}
                  {properties.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No properties listed by this owner.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
