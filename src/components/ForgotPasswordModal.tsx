import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { generateOTP, storeOTP, sendOTPEmail } from './OTPModal';
import { OTPModal } from './OTPModal';
import { showToast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setError('');
      setNewPassword('');
      setConfirmPassword('');
      setIsOwner(false);
      setShowCreateAccount(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    setShowCreateAccount(false);

    try {
      const checkRes = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isOwner })
      });
      
      const checkData = await checkRes.json();
      
      if (!checkRes.ok) {
        setError(checkData.error || "No user found");
        setShowCreateAccount(true);
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
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      sessionStorage.removeItem("otp");
      sessionStorage.removeItem("otpExpiry");
      sessionStorage.removeItem("otpEmail");
      
      setStep(4);
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
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Reset Password</h2>
                  <p className="text-gray-500 text-sm">
                    Enter your email address to receive a 6-digit verification code.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center flex flex-col items-center gap-3">
                    <span>{error}</span>
                    {showCreateAccount && (
                      <button 
                        onClick={() => {
                          onClose();
                          navigate('/auth?mode=register');
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                      >
                        Create Account
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                        EMAIL ADDRESS
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isOwner}
                          onChange={(e) => setIsOwner(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-gray-500">I'm a Property Owner</span>
                      </label>
                    </div>
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
                    className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4A] text-white font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase shadow-lg shadow-[#1A1A2E]/20"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
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
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      NEW PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-4 pr-12 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      CONFIRM NEW PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-4 pr-12 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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
                    {loading ? 'Updating...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            {step === 4 && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-4">Password Reset Successfully</h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    // Optionally, you could trigger a navigation to the login page here if needed,
                    // but since this modal is usually opened from the login page, closing it is sufficient.
                  }}
                  className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4A] text-white font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest uppercase shadow-lg shadow-[#1A1A2E]/20"
                >
                  Login with New Password
                </button>
              </div>
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
