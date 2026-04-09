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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setAttempts(0);
      setError('');
      setTimeLeft(60);
      // Focus first input after a short delay to allow modal to render
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
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
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 3) return;

    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) return;

    const result = verifyOTP(enteredOtp);
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
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Verify your email</h2>
              <p className="text-gray-500 text-sm">
                We've sent a 6-digit code to <br />
                <strong className="text-gray-800">{maskEmail(email)}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-[#F8F9FA] border border-gray-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-[#1A1A2E] text-center text-2xl font-bold"
                    required
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || attempts >= 3 || loading}
                className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4A] text-white font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase shadow-lg shadow-[#1A1A2E]/20"
              >
                Verify Email
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={timeLeft > 0 || loading}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {timeLeft > 0 ? `Resend code in ${timeLeft}s` : 'Click to resend'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
