import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { updatePassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { generateOTP, storeOTP, sendOTPEmail } from './OTPModal';
import { OTPModal } from './OTPModal';
import { showToast } from '../utils/toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setError('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("No account found with this email address.");
        setLoading(false);
        return;
      }

      const otp = generateOTP();
      storeOTP(otp, email);
      await sendOTPEmail(email, otp, true);
      setStep(2);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0
  };

  const allRulesMet = Object.values(rules).every(Boolean);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) return;
    setLoading(true);
    setError('');

    try {
      // Find user document
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword);
        }
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          passwordUpdatedAt: new Date().toISOString()
        });
      }

      await signOut(auth);
      sessionStorage.removeItem("otp");
      sessionStorage.removeItem("otpExpiry");
      sessionStorage.removeItem("otpEmail");
      
      showToast("Password updated successfully. Please login with your new password.", "success");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="p-8 sm:p-10">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Reset Password</h2>
                <p className="text-gray-500 text-sm mb-8">
                  Enter your email address to receive a password reset code.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                      placeholder="name@example.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase shadow-lg shadow-amber-500/20"
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">New Password</h2>
                <p className="text-gray-500 text-sm mb-8">
                  Create a new secure password for your account.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${rules.length ? 'text-green-600' : 'text-gray-400'}`}>
                      {rules.length ? <Check size={16} /> : <X size={16} />} Minimum 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${rules.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      {rules.uppercase ? <Check size={16} /> : <X size={16} />} At least one uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${rules.number ? 'text-green-600' : 'text-gray-400'}`}>
                      {rules.number ? <Check size={16} /> : <X size={16} />} At least one number
                    </div>
                    <div className={`flex items-center gap-2 ${rules.special ? 'text-green-600' : 'text-gray-400'}`}>
                      {rules.special ? <Check size={16} /> : <X size={16} />} At least one special character
                    </div>
                    <div className={`flex items-center gap-2 ${rules.match ? 'text-green-600' : 'text-gray-400'}`}>
                      {rules.match ? <Check size={16} /> : <X size={16} />} Passwords match
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !allRulesMet}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase shadow-lg shadow-amber-500/20"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
      
      {step === 2 && (
        <OTPModal 
          isOpen={true} 
          onClose={onClose} 
          email={email} 
          onSuccess={() => setStep(3)} 
        />
      )}
    </AnimatePresence>
  );
}
