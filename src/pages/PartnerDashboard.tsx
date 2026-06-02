import React, { useState, useEffect } from "react";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { partnerService } from "../services/partnerService";
import { walletService } from "../services/walletService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";
import { showToast } from "../utils/toast";
import {
  User,
  Wallet as WalletIcon,
  Handshake,
  Copy,
  Share2,
  CheckCircle2,
  Banknote,
  TrendingUp,
  Users,
  Clock,
  Gift,
  XCircle,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard,
  MapPin,
  Globe,
  ShieldCheck,
  Edit3,
  HelpCircle,
} from "lucide-react";

import { getAvatarUrl } from "../utils/avatar";

type PartnerTab = "profile" | "wallet" | "partner-program";

const tabs: { id: PartnerTab; label: string; icon: React.ElementType }[] = [
  { id: "partner-program", label: "Partner Program", icon: Handshake },
  { id: "profile", label: "Profile", icon: User },
  { id: "wallet", label: "Wallet", icon: WalletIcon },
];

const PartnerDashboard = () => {
  const { profile: userProfile, user } = useAuth();
  const [partnerStatus, setPartnerStatus] = useState<string>(
    userProfile?.partnerStatus || "pending",
  );
  const [initDone, setInitDone] = useState(false);
  const [activeTab, setActiveTab] = useState<PartnerTab>("partner-program");

  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedBookings: 0,
    totalCommission: 0,
  });
  const [commissions, setCommissions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartnerStatus(data.partnerStatus || "pending");
        setInitDone(true);
      }
    });

    return () => unsubUser();
  }, [user?.uid]);

  useEffect(() => {
    if (!userProfile?.uid || partnerStatus !== "approved") {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubStats = partnerService.subscribePartnerStats(
      userProfile.uid,
      (newStats) => {
        setStats({
          totalReferrals: newStats.totalReferrals,
          completedBookings: newStats.completedBookings,
          totalCommission: newStats.totalCommission,
        });
        setLoading(false);
      },
    );

    const unsubCommissions = partnerService.subscribePartnerCommissions(
      userProfile.uid,
      (newCommissions) => {
        setCommissions(newCommissions);
      },
    );

    const unsubBookings = partnerService.subscribePartnerBookings(
      userProfile?.partnerCode || "N/A",
      (newBookings) => {
        setBookings(newBookings);
        setStats({
          totalReferrals: newBookings.length,
          completedBookings: newBookings.filter(
            (b: any) => b.status === "completed" || b.status === "confirmed",
          ).length,
          totalCommission: newBookings.reduce(
            (sum: number, b: any) => sum + (b.totalAmount || 0) * 0.05,
            0,
          ),
        });
        if (userProfile.partnerCode && userProfile.uid) {
          partnerService.backfillPartnerData(
            userProfile.partnerCode,
            userProfile.uid,
          );
        }
      },
    );

    const unsubBalance = walletService.subscribeToWalletBalance(
      userProfile.uid,
      (balance) => setWalletBalance(balance),
    );

    const unsubTransactions = walletService.subscribeToWalletTransactions(
      userProfile.uid,
      (transactions) => setWalletTransactions(transactions),
    );

    return () => {
      unsubStats();
      unsubCommissions();
      unsubBookings();
      unsubBalance();
      unsubTransactions();
    };
  }, [userProfile?.uid, partnerStatus]);

  const partnerCode = userProfile?.partnerCode || "N/A";
  const referralLink = `${window.location.origin}/?ref=${partnerCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (initDone && partnerStatus === "pending") {
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
            Thank you for registering as a ShelterBee Partner! Your application
            has been submitted successfully and is currently being reviewed by
            our team. We typically respond within{" "}
            <strong className="text-[#1A1A2E]">24-48 hours</strong>.
          </p>

          <div className="bg-amber-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <Mail size={18} />
              What Happens Next?
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Our team reviews your business details and verifies your
                  information
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  You'll receive an email notification once your application is
                  approved or if we need more information
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Once approved, you can access your Partner Dashboard and start
                  earning commissions
                </span>
              </li>
            </ul>
          </div>

          <a
            href="/"
            className="inline-block w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1A1A2E] font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest text-center shadow-lg shadow-amber-500/20"
          >
            BACK TO HOME
          </a>
        </motion.div>
      </div>
    );
  }

  if (initDone && partnerStatus === "rejected") {
    const companyEmail =
      (userProfile as any)?.businessEmail || userProfile?.email || "";
    const helpNumber = "+917021054239";
    const waMessage = encodeURIComponent(
      `Hi ShelterBee team, I would like to get more information about my partner application rejection for ${(userProfile as any)?.businessName || "my business"}. Please help me understand what went wrong.`,
    );

    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 max-w-lg w-full text-center border border-gray-50"
        >
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-500" size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1A1A2E] mb-4">
            Application Not Approved
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Thank you for your interest in the ShelterBee Partner Program.
            Unfortunately, your application could not be approved at this time.
            If you believe this is a mistake or would like to discuss further,
            please reach out to us through any of the channels below.
          </p>

          <div className="space-y-4 mb-8">
            <a
              href={`mailto:${companyEmail}?subject=Partner Application Reconsideration - ${(userProfile as any)?.businessName || ""}`}
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Mail className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm">Email Us</p>
                <p className="text-xs text-gray-500 truncate">
                  Send us an email with your details
                </p>
              </div>
              <ExternalLink size={16} className="text-blue-400 shrink-0" />
            </a>

            <a
              href={`tel:${helpNumber}`}
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Phone className="text-green-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm">Call Support</p>
                <p className="text-xs text-gray-500">{helpNumber}</p>
              </div>
              <ExternalLink size={16} className="text-green-400 shrink-0" />
            </a>

            <a
              href={`https://wa.me/${helpNumber.replace(/\+/g, "").replace(/\s/g, "")}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm">WhatsApp</p>
                <p className="text-xs text-gray-500">
                  Chat with us on WhatsApp
                </p>
              </div>
              <ExternalLink size={16} className="text-emerald-400 shrink-0" />
            </a>
          </div>

          <a
            href="/"
            className="inline-block w-full bg-[#1A1A2E] hover:bg-[#2a2a4e] text-white font-extrabold py-4 rounded-xl transition-colors text-sm tracking-widest text-center shadow-lg"
          >
            BACK TO HOME
          </a>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <DotLottiePlayer
          src="https://lottie.host/91f9f628-b5ab-4ea9-bfa4-862211e3b137/X75GVjGtxX.lottie"
          autoplay
          loop
          style={{ width: 120, height: 120 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative">
      <aside className="hidden md:flex sticky top-[80px] h-[calc(100vh-80px)] w-64 bg-[#F8F9FA] border-r border-gray-200 flex-col flex-shrink-0 z-50">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src={user?.photoURL || getAvatarUrl((userProfile as any)?.gender)}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-[#F59E0B]/20 object-cover"
            />
            <div>
              <p className="text-sm font-bold text-[#1A1A2E] truncate max-w-[140px]">
                {userProfile?.displayName || user?.email?.split("@")[0]}
              </p>
              <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
                Partner
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-bold transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-[#FDF6E3] text-[#8B5A2B] border-r-2 border-[#F59E0B]"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Code: {partnerCode}
          </p>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {activeTab === "profile" && (
                <ProfileTab
                  userProfile={userProfile}
                  user={user}
                  partnerCode={partnerCode}
                />
              )}
              {activeTab === "wallet" && (
                <WalletTab
                  userId={user?.uid || ""}
                  walletBalance={walletBalance}
                  walletTransactions={walletTransactions}
                />
              )}
              {activeTab === "partner-program" && (
                <PartnerProgramTab
                  stats={stats}
                  commissions={commissions}
                  bookings={bookings}
                  referralLink={referralLink}
                  copySuccess={copySuccess}
                  onCopy={copyReferralLink}
                  userProfile={userProfile}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

function ProfileTab({
  userProfile,
  user,
  partnerCode,
}: {
  userProfile: any;
  user: any;
  partnerCode: string;
}) {
  const personalInfo = [
    { label: "First Name", value: (userProfile as any)?.firstName },
    { label: "Last Name", value: (userProfile as any)?.lastName },
    { label: "Display Name", value: userProfile?.displayName },
    { label: "Email", value: user?.email },
    { label: "Mobile", value: (userProfile as any)?.mobile },
    { label: "Gender", value: (userProfile as any)?.gender },
  ];

  const businessInfo = [
    { label: "Business Name", value: (userProfile as any)?.businessName },
    { label: "Business Type", value: (userProfile as any)?.businessType },
    { label: "Business Address", value: (userProfile as any)?.businessAddress },
    { label: "Business Email", value: (userProfile as any)?.businessEmail },
    { label: "WhatsApp Number", value: (userProfile as any)?.whatsappNumber },
    {
      label: "Contact Person Number",
      value: (userProfile as any)?.partnerContactNumber,
    },
    { label: "Website", value: (userProfile as any)?.website },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user?.photoURL || getAvatarUrl((userProfile as any)?.gender)}
            alt="Profile"
            className="w-16 h-16 rounded-full border-2 border-[#F59E0B]/20 object-cover"
          />
          <div>
            <h2 className="text-xl font-extrabold text-[#1A1A2E]">
              {userProfile?.displayName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase tracking-wider">
                Active Partner
              </span>
              <span className="text-xs text-gray-400">Code: {partnerCode}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
          <User size={18} className="text-[#F59E0B]" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {personalInfo.map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-sm font-bold text-[#1A1A2E]">{value}</p>
              </div>
            ) : null,
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
          <Building2 size={18} className="text-[#F59E0B]" />
          Business Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {businessInfo.map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-sm font-bold text-[#1A1A2E]">{value}</p>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

function WalletTab({
  userId,
  walletBalance,
  walletTransactions,
}: {
  userId: string;
  walletBalance: number;
  walletTransactions: any[];
}) {
  const [wallet, setWallet] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    branchName: "",
    bankName: "",
  });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (userId) {
      walletService.getWallet(userId).then(setWallet);
    }
  }, [userId]);

  useEffect(() => {
    if (wallet?.bankAccount) {
      setBankDetails(wallet.bankAccount);
    }
  }, [wallet]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (showWithdrawModal || showBankDetailsModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showWithdrawModal, showBankDetailsModal]);

  const pendingWithdrawalsAmount = walletTransactions
    .filter((t: any) => t.type === "debit" && t.status === "pending")
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const handleSaveBankDetails = async () => {
    if (
      !bankDetails.accountHolderName ||
      !bankDetails.accountNumber ||
      !bankDetails.ifsc ||
      !bankDetails.branchName ||
      !bankDetails.bankName
    ) {
      showToast("Please fill all bank details", "error");
      return;
    }
    try {
      await walletService.updateBankAccount(userId, {
        ...bankDetails,
        verified: true,
      });
      setShowBankDetailsModal(false);
      showToast("Bank details updated successfully", "success");
      const updatedWallet = await walletService.getWallet(userId);
      setWallet(updatedWallet);
    } catch (error) {
      console.error("Error saving bank details:", error);
      showToast("Failed to update bank details", "error");
    }
  };

  const handleNextStep = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (amount > walletBalance) {
      showToast("Insufficient balance", "error");
      return;
    }
    if (
      !bankDetails.accountNumber ||
      !bankDetails.ifsc ||
      !bankDetails.bankName
    ) {
      showToast("Please add your bank details first", "error");
      setShowWithdrawModal(false);
      setShowBankDetailsModal(true);
      return;
    }
    setWithdrawStep(2);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    try {
      await walletService.requestWithdrawal(userId, amount, bankDetails);
      showToast(
        `₹${amount} will be credited to your bank in 3-4 working days.`,
        "success",
      );
      setShowWithdrawModal(false);
      setWithdrawStep(1);
      setWithdrawAmount("");
      setCooldown(10);
    } catch (error: any) {
      console.error("Error requesting withdrawal:", error);
      showToast(error.message || "Failed to request withdrawal", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-white/80">
              <WalletIcon className="w-5 h-5" />
              <span className="font-medium">Available Balance</span>
            </div>
            <h2 className="text-4xl font-extrabold mb-6">
              ₹{walletBalance.toLocaleString()}
            </h2>
            <button
              onClick={() => {
                setShowWithdrawModal(true);
                setWithdrawStep(1);
              }}
              disabled={walletBalance <= 0 || cooldown > 0}
              className="bg-white text-[#1E1B4B] px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Wait ${cooldown}s` : "Withdraw to Bank"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Pending Withdrawals</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#1A1A2E] mb-2">
            ₹{(pendingWithdrawalsAmount || 0).toLocaleString()}
          </h2>
          <p className="text-sm text-gray-500">
            Will be credited to your bank account in 3-4 working days.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#1A1A2E]">
            Saved Bank Details
          </h3>
          <button
            onClick={() => setShowBankDetailsModal(true)}
            className="text-sm font-bold text-[#F59E0B] hover:text-amber-600 transition-colors"
          >
            Edit Details
          </button>
        </div>
        {wallet?.bankAccount ? (
          <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                <Building2 className="w-6 h-6 text-[#4B5563]" />
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">
                  {wallet.bankAccount.bankName}
                </p>
                <p className="text-sm text-gray-500">
                  Account: •••• {wallet.bankAccount.accountNumber.slice(-4)}
                </p>
                <p className="text-xs text-gray-400">
                  IFSC: {wallet.bankAccount.ifsc}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#F59E0B] bg-[#FDF6E3] px-3 py-1 rounded-full">
              Primary
            </span>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-4">
              No bank details saved yet.
            </p>
            <button
              onClick={() => setShowBankDetailsModal(true)}
              className="text-sm font-bold text-[#1E1B4B] bg-white px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Add Bank Account
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#1A1A2E] mb-6">
          Transaction History
        </h3>
        {walletTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {walletTransactions.map((txn: any) => (
              <div
                key={txn.id}
                className="p-4 border border-gray-100 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === "credit" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
                    >
                      {txn.type === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E]">
                        {txn.description}
                      </p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {txn.createdAt
                          ? format(
                              txn.createdAt.toDate(),
                              "MMM dd, yyyy • HH:mm",
                            )
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-black text-lg ${txn.type === "credit" ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {txn.type === "credit" ? "+" : "-"}₹
                    {(txn.amount || 0).toLocaleString()}
                  </p>
                </div>
                {txn.bookingAmount > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Total Booking
                      </p>
                      <p className="text-xs font-bold text-slate-600">
                        ₹{txn.bookingAmount.toLocaleString()}
                      </p>
                    </div>
                    {txn.platformCommission > 0 && (
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Platform Commission
                        </p>
                        <p className="text-xs font-bold text-red-400">
                          -₹{txn.platformCommission.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {txn.receivedAmount > 0 && (
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Net Received
                        </p>
                        <p className="text-xs font-bold text-emerald-600">
                          ₹{txn.receivedAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Result Balance
                      </p>
                      <p className="text-xs font-bold text-slate-900">
                        ₹{txn.balanceAfter?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBankDetailsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBankDetailsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100"
            >
              <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">
                Bank Details
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountHolderName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        accountHolderName: e.target.value,
                      })
                    }
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        bankName: e.target.value,
                      })
                    }
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifsc}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, ifsc: e.target.value })
                    }
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.branchName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        branchName: e.target.value,
                      })
                    }
                    placeholder="e.g. Main Branch"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBankDetailsModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBankDetails}
                  className="flex-[2] bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowWithdrawModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100"
            >
              {withdrawStep === 1 ? (
                <>
                  <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">
                    Withdraw Funds
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`Max: ₹${(wallet?.availableBalance || 0).toLocaleString()}`}
                        max={wallet?.availableBalance || 0}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Daily limit: ₹{Number(10000).toLocaleString()} (Max 2
                        withdrawals/day)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-[2] bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-6">
                    Confirm Withdrawal
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Amount</span>
                      <span className="font-bold text-[#1A1A2E]">
                        ₹{(parseFloat(withdrawAmount) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Bank</span>
                      <span className="font-bold text-[#1A1A2E]">
                        {bankDetails.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Account</span>
                      <span className="font-bold text-[#1A1A2E]">
                        {bankDetails.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">IFSC</span>
                      <span className="font-bold text-[#1A1A2E]">
                        {bankDetails.ifsc}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6">
                    Please verify your bank details. Incorrect details may lead
                    to failed or delayed transfers.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setWithdrawStep(1)}
                      className="flex-1 py-3 rounded-xl font-bold text-[#64748B] bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="flex-[2] bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      Confirm & Submit
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PartnerProgramTab({
  stats,
  commissions,
  bookings,
  referralLink,
  copySuccess,
  onCopy,
  userProfile,
}: {
  stats: {
    totalReferrals: number;
    completedBookings: number;
    totalCommission: number;
  };
  commissions: any[];
  bookings: any[];
  referralLink: string;
  copySuccess: boolean;
  onCopy: () => void;
  userProfile: any;
}) {
  const statCards = [
    {
      label: "Total Referrals",
      value: stats.totalReferrals,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completed Bookings",
      value: stats.completedBookings,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Commission",
      value: `₹${stats.totalCommission}`,
      icon: Banknote,
      color: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <img
          src="https://res.cloudinary.com/dtnsxrc2c/image/upload/v1780394835/partner_program_ad_u0lhxj.png"
          alt="Partner Program"
          className="w-full h-auto object-contain rounded-2xl"
        />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1A1A2E]">
            Welcome, {userProfile?.displayName || "Partner"}
          </h1>
          <p className="text-gray-500 mt-1">Partner Program Dashboard</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
          <Gift size={18} className="text-amber-500" />
          <span className="text-sm font-bold text-gray-700">
            Code: {userProfile?.partnerCode || "N/A"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm mb-8">
        <h2 className="font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
          <Share2 size={18} />
          Your Referral Link
        </h2>
        <div className="flex gap-3">
          <input
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-3 rounded-xl bg-[#F8F9FA] border border-gray-100 text-gray-600 text-sm outline-none"
          />
          <button
            onClick={onCopy}
            className="px-6 py-3 bg-[#1A1A2E] text-white rounded-xl hover:bg-[#2a2a4e] transition-colors font-bold text-sm flex items-center gap-2"
          >
            {copySuccess ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            {copySuccess ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}
              >
                <card.icon size={24} />
              </div>
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-extrabold text-[#1A1A2E]">
              {card.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {commissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm mb-8">
          <h2 className="font-bold text-[#1A1A2E] mb-4">Recent Commissions</h2>
          <div className="space-y-3">
            {commissions.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-xl"
              >
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E]">
                    Booking #
                    {c.bookingId?.substring(0, 8).toUpperCase() || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.status === "completed"
                      ? "Completed"
                      : c.status === "pending"
                        ? "Pending"
                        : "Cancelled"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${c.status === "completed" ? "text-green-600" : c.status === "pending" ? "text-amber-600" : "text-red-600"}`}
                  >
                    ₹{c.amount || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm mb-8">
          <h2 className="font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <Users size={18} />
            Bookings from Your Link ({bookings.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Property
                  </th>
                  <th className="pb-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="pb-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Booked On
                  </th>
                  <th className="pb-3 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Commission
                  </th>
                  <th className="pb-3 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-[#1A1A2E]">
                        {b.propertyTitle || "N/A"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-600">{b.visitorName || "N/A"}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-500 text-xs">
                        {b.createdAt?.toDate
                          ? format(b.createdAt.toDate(), "MMM dd, yyyy • HH:mm")
                          : "Recently"}
                      </p>
                    </td>
                    <td className="py-3 text-right">
                      <p className="font-bold text-emerald-600">
                        ₹{((b.totalAmount || 0) * 0.05).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === "confirmed" || b.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : b.status === "cancelled" ||
                                b.status === "rejected_by_owner"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {b.status === "confirmed"
                          ? "Confirmed"
                          : b.status === "completed"
                            ? "Completed"
                            : b.status === "cancelled"
                              ? "Cancelled"
                              : b.status === "rejected_by_owner"
                                ? "Rejected"
                                : b.status === "pending_owner"
                                  ? "Pending"
                                  : b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerDashboard;
