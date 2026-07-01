import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SEOHead from '../components/SEOHead';
import {
  Handshake,
  UserPlus,
  Link2,
  Share2,
  Banknote,
  Wallet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Percent,
  Target,
  TrendingUp,
  ShieldCheck,
  LogIn,
  ArrowRight,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
} as const;

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Sign Up as a Partner",
    desc: "Register through your ShelterBee account. Submit your basic details, verification documents, and bank account info for payouts.",
  },
  {
    step: 2,
    icon: Link2,
    title: "Get Your Unique Code",
    desc: "Once approved, you'll receive a unique referral link and promo code linked to your account. These are your tools to start earning.",
  },
  {
    step: 3,
    icon: Share2,
    title: "Share & Refer",
    desc: "Share your referral link or code with friends, family, social media followers, or your audience. Every genuine booking through your link earns you commission.",
  },
  {
    step: 4,
    icon: Banknote,
    title: "Earn 5% Commission",
    desc: "When a referred customer completes their stay (check-in done), you earn 5% of the net booking value. Track all earnings in real time from your dashboard.",
  },
  {
    step: 5,
    icon: Wallet,
    title: "Withdraw Your Earnings",
    desc: "Once your accumulated commission crosses ₹500, payouts are processed weekly to your partner wallet. Withdraw anytime to your linked bank account or UPI.",
  },
];

const highlights = [
  {
    icon: Percent,
    value: "5%",
    label: "Commission per booking",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Target,
    value: "No Limit",
    label: "Unlimited referrals",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: TrendingUp,
    value: "Live",
    label: "Dashboard tracking",
    color: "bg-purple-100 text-purple-600",
  },
];

const terms = [
  {
    title: "1. Eligibility",
    content: `1.1 The applicant must be:
• An individual (18 years or older), OR
• A registered business entity, travel agent, tour operator, or service provider

1.2 The applicant must possess:
• Valid government-issued identification (Aadhaar, PAN, etc.)
• Active bank account details for commission payouts
• Valid mobile number and email ID

1.3 A person/entity shall NOT be eligible if:
• Involved in fraudulent activities
• Using fake bookings or self-referrals
• Violating ShelterBee policies or terms
• Previously terminated from the program`,
  },
  {
    title: "2. Referral Tracking",
    content: `2.1 Unique Identification
Each Referral Partner shall be assigned:
• A unique referral link, and/or
• A unique coupon/promo code
All referrals must be made using these identifiers.

2.2 Tracking Mechanism
• ShelterBee shall track referrals through its internal system using:
  o Referral links (URL tracking)
  o Coupon codes applied at checkout
• A referral shall be considered valid only if recorded in ShelterBee's system

2.3 Last-Click Attribution Rule
• In case multiple referral sources are involved, the last valid referral link or coupon code used before booking shall be considered for commission attribution

2.4 Valid Referral Criteria
A referral will be considered valid only if:
• The customer is a genuine user
• Booking is completed through the referral link or code
• Payment is successfully made
• No fraudulent or suspicious activity is detected

2.6 Cookie Duration (Optional but Recommended)
• Referral tracking via link shall remain valid for 7 days from the first click
• If the customer books within this period, commission will be attributed

2.7 Limitations
ShelterBee shall not be responsible for tracking failures due to:
• Incorrect use of referral link/code
• Disabled cookies or browser restrictions
• Third-party interference
• Technical issues beyond reasonable control

2.8 Fraud Prevention
ShelterBee reserves the right to:
• Reject or cancel referrals identified as fraudulent
• Withhold commission in case of suspicious activity`,
  },
  {
    title: "3. Commission",
    content: `3.1 Commission Rate
• The Referral Partner shall be entitled to a 5% (Five Percent) commission on the Net Booking Value of each successful referral.

3.2 Definition of Net Booking Value
"Net Booking Value" means:
• Total amount paid by the customer.

3.3 Commission Eligibility
Commission shall be payable only if:
• The booking is successfully completed (customer check-in is done)
• Full payment is received by ShelterBee
• No cancellation or refund is initiated

3.4 Exclusions
No commission shall be paid in the following cases:
• Cancelled bookings
• Partially or fully refunded bookings
• Fraudulent or suspicious transactions
• Self-bookings or misuse of referral codes

3.5 Payment Timeline
• Commission shall be calculated and settled on a weekly basis
• Payment will be processed after:
  o Completion of stay
  o Expiry of refund/cancellation window

3.6 Mode of Payment
• Commission shall be paid via:
  o Partner wallet system
• Payments may be processed using platforms such as Razorpay or equivalent services

3.7 Minimum Payout Threshold
• Commission will be released only when the accumulated amount reaches ₹500
• Any unpaid balance will be carried forward to the next cycle

3.8 Taxes & Compliance
• Referral Partner shall be responsible for:
  o Applicable taxes (including GST, if required)
  o Issuing invoices (if applicable)
• ShelterBee may deduct TDS (Tax Deducted at Source) as per Indian laws

3.9 Right to Modify
• ShelterBee reserves the right to:
  o Change commission percentage
  o Modify payout structure
  o Update payment terms with prior notice`,
  },
  {
    title: "4. Payment Conditions",
    content: `4.1 Payment Trigger
Commission shall become payable only after:
• Successful customer check-in is completed
• Full booking amount is received by ShelterBee
• The booking is not cancelled or disputed

4.2 Payout Schedule
• Commission will be processed on a weekly basis
• Settlement cycle shall be calculated from the date of completed stay

4.3 Minimum Payout Threshold
• Payment will be released only if the payable amount exceeds ₹500
• Any balance below this threshold will be carried forward

4.4 Mode of Payment
• Payments shall be made via:
  o Partner wallet system
• Payment processing may be facilitated through services such as Razorpay or equivalent

4.5 Deductions & Adjustments
ShelterBee reserves the right to:
• Deduct commissions in case of:
  o Booking cancellations
  o Refunds (full or partial)
  o Fraudulent or disputed transactions
• Adjust future payouts accordingly

4.6 Taxes & Compliance
• All payments are subject to:
  o Applicable TDS (Tax Deducted at Source)
  o Other statutory deductions as per Indian law

4.7 Payment Failure / Delay
• ShelterBee shall not be liable for delays caused due to:
  o Incorrect bank details provided by the partner
  o Technical failures in banking/payment systems
  o Force majeure events

4.8 Disputes
• Any payment-related dispute must be raised within 7 days of payout
• ShelterBee's records shall be considered final unless proven otherwise`,
  },
  {
    title: "5. Fraud & Misuse",
    content: `5.1 Prohibited Activities
The Referral Partner shall strictly NOT engage in:
• Misleading customers with false promises, pricing, or offers
• Unauthorized use of ShelterBee brand name, logo, or identity
• Spamming, mass messaging, or unethical marketing practices
• Manipulating or attempting to manipulate the referral tracking system

5.2 Definition of Fraudulent Activity
Fraudulent activity includes:
• Multiple bookings from the same user/device/IP for commission gain
• Cancellation and rebooking cycles to exploit commission
• Use of bots, scripts, or automated systems
• Any activity deemed suspicious by ShelterBee's internal monitoring system

5.3 Monitoring & Detection
• ShelterBee reserves the right to:
  o Monitor all referral activities
  o Audit bookings and partner performance
  o Use automated systems to detect fraud
• ShelterBee's findings shall be final and binding

5.4 Consequences of Violation
In case of fraud or misuse, ShelterBee may:
• Immediately suspend or terminate the partner account
• Withhold or cancel pending commissions
• Recover previously paid commissions (if fraud is detected later)
• Take legal action under applicable laws

5.5 Commission Reversal
• Any commission earned through:
  o Cancelled bookings
  o Fraudulent activity
  o Policy violations
shall be reversed or deducted from future payouts

5.6 Blacklisting
• Partners involved in serious violations may be:
  o Permanently banned from the platform
  o Restricted from re-registering

5.7 Indemnification
• The Referral Partner agrees to indemnify and hold ShelterBee harmless against:
  o Losses
  o Damages
  o Legal claims arising from misuse or fraud`,
  },
  {
    title: "6. Payment Cycle",
    content: `6.1 Settlement Period
• The commission earned by the Referral Partner shall be calculated based on completed bookings (post check-in)
• Each eligible booking shall be considered for payout only after the applicable holding period

6.2 Payout Frequency
• Commission payouts shall be processed on a weekly basis

6.3 Cut-off Date
• A cut-off date shall be applied for each payout cycle
• Only bookings completed before the cut-off date will be included in that cycle
• Bookings after the cut-off will be carried forward to the next cycle

6.4 Holding & Clearance
• Payments shall be released only after:
  o Completion of stay (check-in done)

6.5 Minimum Payout Condition
• Commission shall be paid only if the total payable amount exceeds ₹500
• Any unpaid amount shall be carried forward to the next payout cycle

6.6 Statement & Reporting
• ShelterBee shall provide:
  o A commission statement/dashboard showing:
    • Bookings
    • Earnings
    • Deductions (if any)

6.7 Adjustments
• ShelterBee reserves the right to:
  o Adjust payouts for cancellations, refunds, or disputes
  o Deduct any excess or incorrect payments in future cycles

6.8 Mode of Disbursement
• Payments shall be made via:
  o Bank transfer / UPI, or
  o Partner wallet system
• Payment processing may be facilitated through services such as Razorpay or equivalent`,
  },
  {
    title: "7. Program Changes",
    content: `7.1 Right to Modify
• ShelterBee reserves the full right, at its sole discretion, to:
  o Modify, update, or revise any part of the Referral Partner Program
  o Change commission structure, payout terms, or eligibility criteria
  o Introduce or remove features, benefits, or incentives

7.2 Notice of Changes
• ShelterBee shall make reasonable efforts to notify Referral Partners of any material changes through:
  o Email communication
  o Platform dashboard notification
  o Official website updates
• Continued participation in the program after such changes shall be deemed as acceptance of the updated terms

7.3 Immediate Changes
• ShelterBee reserves the right to implement changes with immediate effect in cases involving:
  o Fraud prevention
  o Legal or regulatory requirements
  o Security concerns

7.4 Impact on Existing Earnings
• Any changes in commission or payout structure shall apply:
  o Prospectively (future bookings only)
• Earnings from previously completed eligible bookings shall not be affected

7.5 Suspension or Discontinuation
• ShelterBee reserves the right to:
  o Suspend or discontinue the Referral Program (fully or partially)
  o Modify partner participation conditions at any time

7.6 No Liability
• ShelterBee shall not be liable for:
  o Any loss of expected earnings
  o Any impact resulting from program changes or discontinuation`,
  },
  {
    title: "8. Termination",
    content: `8.1 Termination by Either Party
• Either Party may terminate this Agreement without cause by providing 7 (Seven) days' prior written notice to the other Party

8.2 Immediate Termination by ShelterBee
ShelterBee reserves the right to terminate the Agreement with immediate effect (without prior notice) in case of:
• Fraudulent activities or misuse (as defined in Clause 5)
• Breach of any terms of this Agreement
• Misrepresentation of ShelterBee services
• Violation of applicable laws or regulations
• Any activity that may harm ShelterBee's reputation or business

8.3 Suspension Rights
• ShelterBee may temporarily suspend the partner account during:
  o Investigation of suspicious activity
  o Compliance or verification checks
• During suspension:
  o Commission payouts may be put on hold

8.4 Effect of Termination
Upon termination:
• The Referral Partner shall:
  o Immediately stop using referral links/codes
  o Cease representing ShelterBee in any form
• ShelterBee shall:
  o Disable access to the partner account
  o Settle any valid, eligible commissions (subject to verification)

8.5 Forfeiture of Commission
• ShelterBee reserves the right to:
  o Withhold or forfeit any unpaid commission in case of:
    • Fraud
    • Policy violations
    • Breach of agreement

8.6 Survival Clause
The following clauses shall survive termination:
• Commission (pending settlements)
• Confidentiality
• Fraud & Misuse
• Limitation of Liability
• Governing Law

8.7 No Liability on Termination
• ShelterBee shall not be liable for:
  o Loss of future earnings
  o Business opportunities
  o Any indirect or consequential damages due to termination`,
  },
  {
    title: "9. Liability",
    content: `9.1 Limitation of Liability
• To the maximum extent permitted by law, ShelterBee shall not be liable for:
  o Any indirect, incidental, special, or consequential damages
  o Loss of profits, business, data, or reputation
  o Any loss arising out of participation in the Referral Program

9.2 No Responsibility for Customer Disputes
• ShelterBee shall not be responsible for:
  o Any disputes between the Referral Partner and referred customers
  o Any dissatisfaction regarding property, stay, or services
• All customer services shall be governed by ShelterBee's platform policies

9.3 Technical Failures
• ShelterBee shall not be liable for:
  o Failure in tracking referrals due to technical issues
  o Server downtime, system errors, or third-party service failures
  o Loss of commission due to incorrect use of referral links or codes

9.4 Third-Party Services
• ShelterBee shall not be responsible for:
  o Failures or delays caused by third-party services such as payment gateways (e.g., Razorpay)
  o Banking or financial transaction errors beyond its control

9.5 Force Majeure
• ShelterBee shall not be liable for failure or delay caused by:
  o Natural disasters
  o Government actions
  o Internet or infrastructure failures
  o Any events beyond reasonable control

9.6 Indirect Losses Excluded
• ShelterBee shall not be liable for:
  o Loss of business opportunities
  o Expected earnings or goodwill`,
  },
];

export default function PartnerProgram() {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState<number | null>(null);

  useEffect(() => {}, []);

  return (
    <>
      <SEOHead title="Partner Program" />
      <div className="min-h-screen bg-[#FAF9F6]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] py-20 md:py-28 px-4 md:px-8">
        <div className="absolute top-10 -left-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-5">
              <Handshake size={14} />
              Referral Partner Program
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Earn by Referring.
              <br />
              Grow with ShelterBee.
            </h1>
            <p className="text-white/70 text-sm md:text-lg mt-4 max-w-2xl mx-auto font-medium">
              Join our Referral Partner Program — earn 5% commission on every
              booking you refer. No limits, full transparency.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              {user ? (
                <Link
                  to="/partner-dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#1A1A2E] font-extrabold text-sm rounded-xl transition-all tracking-wider"
                >
                  <ArrowRight size={18} />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth?mode=register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#1A1A2E] font-extrabold text-sm rounded-xl transition-all tracking-wider"
                  >
                    <LogIn size={18} />
                    Get Started
                  </Link>
                  <Link
                    to="/auth?mode=login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold text-sm rounded-xl border border-white/25 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Image */}
      <section className="py-12 md:py-16 px-4 md:px-8 -mt-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <img
            src="https://res.cloudinary.com/dtnsxrc2c/image/upload/v1780397828/booking_ad_2_egivct.png"
            alt="Partner Program"
            className="w-full h-auto object-contain rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* Hero Content */}
      <section className="py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200/50 mb-4">
              <Handshake size={14} />
              Referral Partner Program
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1A1A2E] tracking-tight leading-tight">
              Earn by Referring.
              <br />
              Grow with ShelterBee.
            </h1>
            <p className="text-slate-500 text-sm md:text-lg mt-3 max-w-2xl mx-auto font-medium">
              Join our Referral Partner Program — earn 5% commission on every
              booking you refer. No limits, full transparency.
            </p>
            {!user && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Link
                  to="/auth?mode=register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#1A1A2E] font-extrabold text-sm rounded-xl transition-all tracking-wider"
                >
                  <LogIn size={18} />
                  Get Started
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A2E] hover:bg-[#2a2a4e] text-white font-bold text-sm rounded-xl transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* How It Works — Alternating Timeline */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16 md:mb-20"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200/50 mb-4"
            >
              <Target size={14} />
              How It Works
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight"
            >
              Start Earning in 5 Simple Steps
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-sm md:text-base text-slate-500 mt-2 font-medium max-w-xl mx-auto"
            >
              From sign-up to payout — here's how the ShelterBee Referral
              Partner Program works.
            </motion.p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Central vertical line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-amber-200 -translate-x-1/2" />

            <div className="relative space-y-12 lg:space-y-16">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isLeft = idx % 2 === 0;

                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`relative flex flex-col lg:flex-row items-start gap-6 lg:gap-0 ${
                      isLeft ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                  >
                    {/* Card */}
                    <div
                      className={`w-full lg:w-[calc(50%-2rem)] ${isLeft ? "lg:pr-8 lg:text-right" : "lg:pl-8"}`}
                    >
                      <div className="bg-[#FAF9F6] rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center ${!isLeft ? "lg:order-1" : ""}`}
                          >
                            <Icon size={24} className="text-amber-600" />
                          </div>
                          <div className={!isLeft ? "lg:text-left" : ""}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-black uppercase tracking-widest mb-2">
                              Step {step.step}
                            </div>
                            <h3 className="text-base md:text-lg font-extrabold text-[#1A1A2E] mb-2">
                              {step.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center milestone dot */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="w-5 h-5 rounded-full bg-amber-500 border-4 border-white shadow-md" />
                    </div>

                    {/* Empty space on opposite side */}
                    <div className="hidden lg:block w-[calc(50%-2rem)]" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-200/50 mb-4"
            >
              <ShieldCheck size={14} />
              Why Join?
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight"
            >
              Program Highlights
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-sm md:text-base text-slate-500 mt-2 font-medium"
            >
              Everything you get as a ShelterBee Referral Partner.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <motion.div
                  key={h.label}
                  variants={itemVariants}
                  className="bg-[#FAF9F6] rounded-3xl p-6 border border-slate-100 shadow-sm text-center"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${h.color}`}
                  >
                    <Icon size={28} />
                  </div>
                  <p className="text-2xl font-extrabold text-[#1A1A2E]">
                    {h.value}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {h.label}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200/50 mb-4">
              <ShieldCheck size={14} />
              Terms & Conditions
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight">
              Referral Partner Program — Terms & Conditions
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">
              Please read the following terms carefully before joining the
              program.
            </p>
          </motion.div>

          <div className="space-y-3">
            {terms.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() =>
                    setOpenSection(openSection === idx ? null : idx)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-extrabold text-[#1A1A2E]">
                    {section.title}
                  </span>
                  {openSection === idx ? (
                    <ChevronUp className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openSection === idx && (
                  <div className="px-6 pb-6">
                    <div className="h-px bg-slate-100 mb-4" />
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                      {section.content}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-gradient-to-br from-[#1E1B4B] to-[#312E81]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest border border-white/10 mb-4">
            <Handshake size={14} />
            Start Earning Today
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Ready to grow with ShelterBee?
          </h2>
          <p className="text-white/70 text-sm md:text-base mt-3 max-w-xl mx-auto font-medium">
            Join our Referral Partner Program and earn 5% commission on every
            successful booking you refer. No caps, full transparency.
          </p>
          {user ? (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link
                to="/partner-dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#1A1A2E] font-extrabold text-sm rounded-xl transition-all tracking-wider"
              >
                <ArrowRight size={18} />
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link
                to="/auth?mode=register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#1A1A2E] font-extrabold text-sm rounded-xl transition-all tracking-wider"
              >
                <CheckCircle2 size={18} />
                Become a Partner
              </Link>
              <Link
                to="/auth?mode=login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold text-sm rounded-xl border border-white/25 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </motion.div>
      </section>
    </div>
    </>
  );
}
