import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { emailService } from '../services/emailService';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void;
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(otp: string, email: string) {
  sessionStorage.setItem("otp", otp);
  sessionStorage.setItem("otpExpiry", (Date.now() + 5 * 60 * 1000).toString());
  sessionStorage.setItem("otpEmail", email);
}

export function verifyOTP(enteredOTP: string) {
  const storedOTP = sessionStorage.getItem("otp");
  const expiry = parseInt(sessionStorage.getItem("otpExpiry") || "0");
  if (Date.now() > expiry) return "expired";
  if (enteredOTP !== storedOTP) return "incorrect";
  sessionStorage.removeItem("otp");
  sessionStorage.removeItem("otpExpiry");
  sessionStorage.removeItem("otpEmail");
  return "success";
}

export const sendOTPEmail = async (email: string, otp: string, isPasswordReset = false) => {
  const subject = isPasswordReset ? "Reset Your Shelterbee Password" : "Your Shelterbee Verification Code";
  const message = isPasswordReset 
    ? `Your password reset code is ${otp}. This expires in 5 minutes. If you did not request this ignore this email.`
    : `Your OTP is ${otp}. This code expires in 5 minutes. Do not share this with anyone.`;
  
  await emailService.sendEmail({
    to: email,
    subject: subject,
    text: message,
    html: `<p>${message}</p>`
  });
};

export function OTPModal({ isOpen, onClose, email, onSuccess }: OTPModalProps) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setAttempts(0);
      setError('');
      setTimeLeft(60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name.substring(0, 2)}****@${domain}`;
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    const newOtp = generateOTP();
    storeOTP(newOtp, email);
    try {
      await sendOTPEmail(email, newOtp);
      setTimeLeft(60);
      setAttempts(0);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 3) return;

    const result = verifyOTP(otp);
    if (result === 'success') {
      onSuccess();
    } else if (result === 'expired') {
      setError('This OTP has expired. Please request a new one.');
      setTimeLeft(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setError('Too many attempts. Please request a new OTP.');
        setTimeLeft(0);
      } else {
        setError('Incorrect OTP. Please check your email and try again.');
      }
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
            <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Verify your email</h2>
            <p className="text-gray-500 text-sm mb-8">
              We've sent a 6-digit code to <br />
              <strong className="text-gray-800">{maskEmail(email)}</strong>
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ENTER 6-DIGIT OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800 text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || attempts >= 3 || loading}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase shadow-lg shadow-amber-500/20"
              >
                Verify Email
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={handleResend}
                disabled={timeLeft > 0 || loading}
                className="text-sm font-bold text-[#1A1A2E] hover:text-amber-500 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
