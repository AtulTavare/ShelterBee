import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { showToast } from '../utils/toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  
  // OTP State (stored ONLY in React state)
  const [storedOTP, setStoredOTP] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [otpTimeLeft, setOtpTimeLeft] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetState();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Timers for OTP and Resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && otpTimeLeft > 0) {
      interval = setInterval(() => {
        setOtpTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const resetState = () => {
    setStep(1);
    setEmail('');
    setError('');
    setLoading(false);
    setAccountType(null);
    setStoredOTP(null);
    setOtpExpiry(null);
    setUid(null);
    setOtpInputs(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setOtpTimeLeft(300);
    setResendCooldown(0);
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTP = async (targetEmail: string) => {
    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000;
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          subject: "ShelterBee - Password Reset OTP",
          text: `Your OTP for password reset is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
          html: `<div style="font-family: sans-serif; padding: 20px; color: #1a1a2e;">
            <h2 style="color: #f59e0b;">ShelterBee Password Reset</h2>
            <p>Your OTP for password reset is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #f8f9fa; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Valid for 5 minutes. Do not share this with anyone.</p>
          </div>`
        })
      });

      if (!response.ok) throw new Error("Failed to send OTP email");

      setStoredOTP(otp);
      setOtpExpiry(expiry);
      setResendCooldown(60);
      setOtpTimeLeft(300);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      // 1. Check if user exists in Auth
      const checkRes = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-user', email })
      });
      
      const checkData = await checkRes.json();
      
      // Fix: check response.ok AND data.exists
      if (!checkRes.ok || !checkData.exists) {
        setError(checkData.error || "No account found with this email. Please register.");
        return;
      }

      // Store UID for the next steps
      setUid(checkData.uid);

      // 2. Query user type from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      let typeLabel = "Unknown Account";
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        typeLabel = userData.role === 'owner' ? "Property Owner" : "Visitor";
      }
      setAccountType(typeLabel);

      // 3. Send OTP
      const sent = await sendOTP(email);
      if (sent) {
        setStep(2);
      } else {
        setError("Failed to send OTP. Please try again later.");
      }
    } catch (err) {
      setError("An error occurred while verifying the email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    const sent = await sendOTP(email);
    if (sent) {
      setOtpInputs(['', '', '', '', '', '']);
      showToast('New OTP sent successfully!', 'success');
    } else {
      setError("Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpInputs.join('');
    if (enteredOtp.length !== 6) return;

    if (!storedOTP || !otpExpiry) {
      setError("Session expired. Please start over.");
      setStep(1);
      return;
    }

    if (Date.now() > otpExpiry) {
      setError("OTP expired. Please request a new one.");
      return;
    }

    if (enteredOtp !== storedOTP) {
      setError("Incorrect OTP. Try again.");
      return;
    }

    // Success
    setError('');
    setStep(3);
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
    if (!allRulesMet || !uid) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-password', uid, newPassword }),
      });

      if (!response.ok) throw new Error("Failed to update password");
      
      setStep(4);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="modal-content bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Forgot Password</h2>
                    <p className="text-gray-500 text-sm">
                      Enter your registered email to receive a verification code.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
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
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4A] text-white font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase shadow-lg shadow-[#1A1A2E]/20 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP'}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-100">
                      Resetting {accountType} Account
                    </span>
                    <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Verify OTP</h2>
                    <p className="text-gray-500 text-sm">
                      We've sent a 6-digit code to <br/>
                      <strong className="text-gray-900">{email}</strong>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleOtpSubmit} className="space-y-8">
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otpInputs.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { if (el) otpInputRefs.current[index] = el; }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isNaN(Number(val))) return;
                            const newOtp = [...otpInputs];
                            newOtp[index] = val;
                            setOtpInputs(newOtp);
                            if (val && index < 5) otpInputRefs.current[index + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
                              otpInputRefs.current[index - 1]?.focus();
                            }
                          }}
                          className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl bg-[#F8F9FA] border border-gray-200 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-[#1A1A2E] text-center text-xl font-bold"
                          required
                        />
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                       <button
                        type="submit"
                        disabled={otpInputs.join('').length !== 6 || otpTimeLeft <= 0}
                        className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4A] text-white font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 text-sm tracking-widest uppercase shadow-lg shadow-[#1A1A2E]/20"
                      >
                        Verify OTP
                      </button>
                      
                      <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        OTP expires in <span className="font-bold text-amber-600">{formatTime(otpTimeLeft)}</span>
                      </div>
                    </div>
                  </form>

                  <div className="mt-8">
                    <button
                      onClick={handleResendOTP}
                      disabled={resendCooldown > 0 || loading}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">New Password</h2>
                  <p className="text-gray-500 text-sm mb-8">
                    Set a new strong password for your account.
                  </p>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">NEW PASSWORD</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800 pr-12"
                          placeholder="••••••••"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">CONFIRM PASSWORD</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800 pr-12"
                          placeholder="••••••••"
                          required
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-medium transition-colors ${rules.length ? 'text-green-600' : 'text-gray-400'}`}>
                        {rules.length ? <Check size={14} /> : <X size={14} />} 8+ Characters
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-medium transition-colors ${rules.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {rules.uppercase ? <Check size={14} /> : <X size={14} />} Uppercase Letter
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-medium transition-colors ${rules.number ? 'text-green-600' : 'text-gray-400'}`}>
                        {rules.number ? <Check size={14} /> : <X size={14} />} At least one number
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-medium transition-colors ${rules.special ? 'text-green-600' : 'text-gray-400'}`}>
                        {rules.special ? <Check size={14} /> : <X size={14} />} Special character
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-medium transition-colors ${rules.match ? 'text-green-600' : 'text-gray-400'}`}>
                        {rules.match ? <Check size={14} /> : <X size={14} />} Passwords match
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !allRulesMet}
                      className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 text-sm tracking-widest uppercase shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                    <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-4">Password Reset Done!</h2>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Account updated successfully. Redirecting to login...
                  </p>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                      className="h-full bg-green-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
