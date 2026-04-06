import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export const AdminSettings = () => {
  const { isMaintenanceMode, setMaintenanceMode } = useAdmin();
  const { user } = useAuth();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearDemoData = async () => {
    if (!window.confirm("Are you sure you want to delete all properties, bookings, and non-admin users? This action cannot be undone.")) {
      return;
    }
    
    setIsClearing(true);
    try {
      // Clear properties
      const propertiesSnap = await getDocs(collection(db, 'properties'));
      const propertyDeletions = propertiesSnap.docs.map(d => deleteDoc(doc(db, 'properties', d.id)));
      
      // Clear bookings
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookingDeletions = bookingsSnap.docs.map(d => deleteDoc(doc(db, 'bookings', d.id)));
      
      // Clear wallet transactions
      const walletSnap = await getDocs(collection(db, 'wallet_transactions'));
      const walletDeletions = walletSnap.docs.map(d => deleteDoc(doc(db, 'wallet_transactions', d.id)));
      
      // Clear reviews
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      const reviewDeletions = reviewsSnap.docs.map(d => deleteDoc(doc(db, 'reviews', d.id)));
      
      // Clear support tickets
      const ticketsSnap = await getDocs(collection(db, 'support_tickets'));
      const ticketDeletions = ticketsSnap.docs.map(d => deleteDoc(doc(db, 'support_tickets', d.id)));
      
      // Clear users (except current admin)
      const usersSnap = await getDocs(collection(db, 'users'));
      const userDeletions = usersSnap.docs
        .filter(d => d.id !== user?.uid)
        .map(d => deleteDoc(doc(db, 'users', d.id)));

      await Promise.all([
        ...propertyDeletions,
        ...bookingDeletions,
        ...walletDeletions,
        ...reviewDeletions,
        ...ticketDeletions,
        ...userDeletions
      ]);

      setSuccessMessage("All demo data has been successfully cleared. The platform is now clean.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to clear demo data:", error);
      setErrorMessage("Failed to clear demo data. Check the console for details.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure global platform settings and maintenance modes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl">
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">System Controls</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Maintenance Mode</h3>
              <p className="text-sm text-slate-500 mt-1">
                When active, the public site will display a maintenance page. Admin portal remains accessible.
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!isMaintenanceMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isMaintenanceMode ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isMaintenanceMode ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-5 bg-red-50 rounded-xl border border-red-100">
            <div>
              <h3 className="font-semibold text-red-900 text-base">Clear All Data (Factory Reset)</h3>
              <p className="text-sm text-red-700 mt-1">
                Wipe all properties, bookings, transactions, and users (except your admin account). Use this to remove demo data before handing over to the client.
              </p>
            </div>
            <button
              onClick={handleClearDemoData}
              disabled={isClearing}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap ml-4"
            >
              {isClearing ? 'Clearing...' : 'Wipe Data'}
            </button>
          </div>

          {isMaintenanceMode && (
            <div className="p-5 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
              <div>
                <h4 className="text-sm font-bold text-red-800">Maintenance Mode is Active</h4>
                <p className="text-sm text-red-700 mt-1">
                  Users cannot access the main platform right now. Ensure you turn this off once updates are complete.
                </p>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
