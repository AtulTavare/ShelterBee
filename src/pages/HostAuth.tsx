import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Home, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { OTPModal, generateOTP, storeOTP, sendOTPEmail } from '../components/OTPModal';

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4 my-6">
    <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase whitespace-nowrap">{title}</h3>
    <div className="flex-1 h-px bg-gray-100"></div>
  </div>
);

const Input = ({ label, wrapperClassName, ...props }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';

  return (
    <div className={`space-y-2 w-full ${wrapperClassName || ''}`}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          {...props} 
          type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
          className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800 ${props.className || ''} ${isPassword ? 'pr-12' : ''}`} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function HostAuth() {
  const [step, setStep] = useState<1 | 2>(1);
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('register');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setMode(searchParams.get('mode') === 'login' ? 'login' : 'register');
  }, [location.search]);
  
  // Form State
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('Male');
  const [password, setPassword] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyHolderName, setPropertyHolderName] = useState('');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const termsRef = useRef<HTMLDivElement>(null);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin(e);
      return;
    }

    if (!propertyName || !propertyHolderName || !email || !password || !mobile || !gender) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!sameAsWhatsapp && !whatsapp) {
      setErrorMsg("Please provide your WhatsApp number.");
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [pendingUserCreds, setPendingUserCreds] = useState<any>(null);

  const handleCreateAccount = async () => {
    if (!termsAccepted) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const otp = generateOTP();
      storeOTP(otp, email);
      await sendOTPEmail(email, otp);
      
      setPendingUserCreds({ email, password });
      
      const userData: any = {
        email,
        role: 'owner',
        createdAt: new Date().toISOString(),
        termsAccepted: true,
        propertyName,
        propertyHolderName,
        displayName: propertyHolderName,
        mobile,
        whatsapp: sameAsWhatsapp ? mobile : whatsapp,
        gender
      };
      
      setPendingUserData(userData);
      setShowOTPModal(true);
    } catch (error: any) {
      setErrorMsg("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (isVerified: boolean) => {
    if (!isVerified) {
      setShowOTPModal(false);
      return;
    }
    setLoading(true);
    try {
      const userCredential = await register(pendingUserCreds.email, pendingUserCreds.password);
      const user = userCredential.user;

      const finalUserData = {
        ...pendingUserData,
        uid: user.uid,
        emailVerified: true
      };

      await setDoc(doc(db, 'users', user.uid), finalUserData);
      setShowOTPModal(false);
      navigate('/list-property');
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to create account.");
      setStep(1);
      setShowOTPModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please enter email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(loginEmail, loginPassword);
      navigate('/list-property');
    } catch (error: any) {
      setErrorMsg("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF9F6] font-sans">
      {/* Left Column */}
      <div className="hidden lg:flex flex-col justify-start w-5/12 p-16 xl:p-24 pt-24 xl:pt-32 bg-[#FAF9F6] relative overflow-hidden border-r border-gray-100">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-50/50 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-0.5 bg-amber-500"></div>
            <span className="text-xs font-bold tracking-widest text-amber-700 uppercase">
              Shelterbee Partner
            </span>
          </div>
          
          <h1 className="text-5xl xl:text-7xl font-extrabold text-[#1A1A2E] leading-[1.1] mb-6">
            Begin Your <br/><span className="text-amber-500">Property Management</span> <br/>Journey
          </h1>
          
          <p className="text-lg text-gray-600 mb-12 max-w-md">
            Register your premium property to access the elite Shelterbee management ecosystem. Crafted for the modern property owner.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-indigo-600" size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#1A1A2E]">Secure Verification</h4>
                <p className="text-gray-500 text-sm">Enterprise-grade identity protection for your peace of mind.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100/50 flex items-center justify-center shrink-0">
                <Home className="text-indigo-600" size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#1A1A2E]">Direct Management</h4>
                <p className="text-gray-500 text-sm">Full control over your assets with real-time analytics.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-7/12 flex flex-col min-h-screen relative">
        <div className="flex-grow flex flex-col items-center justify-start p-6 sm:p-12 pt-12 sm:pt-24">
          
          {/* Form Card */}
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-12 border border-gray-50 relative z-10">
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center">
                {errorMsg}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleProceedToStep2}
                >
                  {mode === 'register' ? (
                    <>
                      <SectionHeader title="PROPERTY PORTFOLIO" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <Input label="PROPERTY NAME" placeholder="The Radiant Heights" value={propertyName} onChange={(e: any) => setPropertyName(e.target.value)} required />
                        <Input label="LEGAL HOLDER NAME" placeholder="M/S Sharma Realty Holdings" value={propertyHolderName} onChange={(e: any) => setPropertyHolderName(e.target.value)} required />
                      </div>

                      <SectionHeader title="CONTACT & DEMOGRAPHICS" />
                      <Input label="EMAIL ADDRESS" type="email" placeholder="name@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required wrapperClassName="mb-6" />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2 w-full">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">CONTACT NUMBER</label>
                          <div className="flex gap-2">
                            <div className="w-16 px-0 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center font-bold text-gray-700 shrink-0">
                              +91
                            </div>
                            <input
                              type="tel"
                              required
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                              placeholder="98765 43210"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setSameAsWhatsapp(!sameAsWhatsapp)}
                              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                sameAsWhatsapp ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border border-gray-300'
                              }`}
                            >
                              {sameAsWhatsapp && <Check size={12} strokeWidth={3} />}
                            </button>
                            <span className="text-xs text-gray-500">Same as Contact Number for WhatsApp</span>
                          </div>
                          {!sameAsWhatsapp && (
                            <div className="flex gap-2 mt-3">
                              <div className="w-16 px-0 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center font-bold text-gray-700 shrink-0">
                                +91
                              </div>
                              <input
                                type="tel"
                                required
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-gray-800"
                                placeholder="WhatsApp Number"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 w-full">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">GENDER</label>
                          <div className="flex bg-[#F8F9FA] border border-gray-100 rounded-xl p-1">
                            {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setGender(g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                  gender.toUpperCase() === g 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <Input label="CREATE PASSWORD" type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
                      </div>
                    </>
                  ) : (
                    <>
                      <SectionHeader title="OWNER LOGIN" />
                      <Input label="EMAIL ADDRESS" type="email" placeholder="name@example.com" value={loginEmail} onChange={(e: any) => setLoginEmail(e.target.value)} required wrapperClassName="mb-6" />
                      <div className="mb-6">
                        <Input label="PASSWORD" type="password" placeholder="••••••••" value={loginPassword} onChange={(e: any) => setLoginPassword(e.target.value)} required />
                        <div className="flex justify-end mt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest flex items-center justify-center gap-2 mt-8 shadow-lg disabled:opacity-70"
                  >
                    {loading ? 'PROCESSING...' : (mode === 'login' ? 'LOGIN AS OWNER' : 'CONTINUE REGISTRATION')}
                    {!loading && <ArrowRight size={18} strokeWidth={3} />}
                  </button>

                  <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button 
                      type="button"
                      onClick={() => {
                        navigate(`/host-auth?mode=${mode === 'login' ? 'register' : 'login'}`);
                        setErrorMsg(null);
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-[#1A1A2E] uppercase tracking-wider transition-colors"
                    >
                      {mode === 'login' ? "Don't have an account? Register here" : "Already have an account? Log in here"}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <SectionHeader title="REVIEW POLICIES" />
                  
                  <div 
                    ref={termsRef}
                    onScroll={handleScroll}
                    className="h-[300px] overflow-y-auto bg-[#F8F9FA] rounded-xl p-6 text-sm text-gray-600 space-y-6 border border-gray-100"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">1. Terms & Conditions</h3>
                      <p className="mb-2">Welcome to Shelterbee. By accessing our platform, you agree to be bound by these Terms and Conditions. Our platform serves as a marketplace connecting property owners with seekers.</p>
                      <p>Property owners are responsible for the accuracy of their listings. Shelterbee reserves the right to remove any listing that violates our community guidelines.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">2. Privacy Policy</h3>
                      <p className="mb-2">We collect personal information such as name, email, phone number, and date of birth to provide and improve our services.</p>
                      <p>Your data is encrypted and stored securely. We do not sell your personal information to third parties.</p>
                    </div>

                    <div className="pt-10 pb-4 text-center text-gray-400 italic text-xs">
                      End of policies.
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 font-medium">
                      I have read and accept all the Terms & Conditions and Privacy Policy.
                    </label>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-4 rounded-xl font-bold text-gray-500 bg-[#F8F9FA] hover:bg-gray-200 transition-colors text-sm tracking-widest uppercase"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAccount}
                      disabled={!termsAccepted || loading}
                      className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {loading ? 'CREATING...' : 'ACCEPT & CREATE'}
                      {!loading && <ArrowRight size={18} strokeWidth={3} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
      <OTPModal 
        isOpen={showOTPModal} 
        onClose={() => completeRegistration(false)} 
        email={email} 
        onSuccess={() => completeRegistration(true)} 
      />
    </div>
  );
}
