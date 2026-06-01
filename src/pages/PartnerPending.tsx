import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, ArrowRight, Mail } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const PartnerPending = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (!docSnap.exists()) return;
      const status = docSnap.data().partnerStatus;
      if (status === 'approved' || status === 'rejected') {
        navigate('/partner-dashboard', { replace: true });
      }
    });
    return () => unsub();
  }, [user?.uid, navigate]);

  if (profile?.partnerStatus === 'approved' || profile?.partnerStatus === 'rejected') {
    return <Navigate to="/partner-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 max-w-lg w-full text-center border border-gray-50"
      >
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="text-amber-600" size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[#1A1A2E] mb-4">
          Application Under Review
        </h1>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Thank you for registering as a ShelterBee Partner! Your application has been 
          submitted successfully and is currently being reviewed by our team. 
          We typically respond within <strong className="text-[#1A1A2E]">24-48 hours</strong>.
        </p>

        <div className="bg-amber-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
            <Mail size={18} />
            What Happens Next?
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <span>Our team reviews your business details and verifies your information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <span>You'll receive an email notification once your application is approved or if we need more information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <span>Once approved, you can access your Partner Dashboard and start earning commissions</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          BACK TO HOME
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </div>
  );
};

export default PartnerPending;
