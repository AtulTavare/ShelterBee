import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { bookingService, GuestDetail } from '../services/bookingService';
import { emailService } from '../services/emailService';
import { emailTemplates } from '../services/emailTemplates';
import { userService } from '../services/userService';
import { sendBookingConfirmationToVisitor, sendNewBookingAlertToOwner } from '../services/whatsappService';
import { showToast } from '../utils/toast';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Users, 
  CreditCard, 
  Plus, 
  Trash2, 
  Info,
  CheckCircle2,
  MapPin
} from 'lucide-react';

export default function BookingPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  const [bookingContactNo, setBookingContactNo] = useState('');
  const [visitorCheckInTime, setVisitorCheckInTime] = useState('14:00');
  const [visitorCheckOutTime, setVisitorCheckOutTime] = useState('11:00');

  const formatTime12hr = (time24: string) => {
    if (!time24) return '';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const [h, m] = parts;
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  useEffect(() => {
    document.title = 'Book Property - ShelterBee'
  }, [])

  // Step 1: Dates
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  // Step 2: Guests
  const [guests, setGuests] = useState<GuestDetail[]>([
    { name: '', age: 0, gender: 'Male', contactNo: '', type: 'adult' }
  ]);

  // Step 3: Payment


  // Step 4: Policies
  const [govIdAcknowledged, setGovIdAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Coupons State
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [manualCouponCode, setManualCouponCode] = useState('');
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);
  const [couponSavings, setCouponSavings] = useState(0);

  useEffect(() => {
    if (step === 3 && propertyId && user) {
      const fetchCoupons = async () => {
        setCouponsLoading(true);
        try {
          const q = query(collection(db, "coupons"), where("isActive", "==", true));
          const snap = await getDocs(q);
          let validCoupons: any[] = [];
          const now = new Date();

          const userBookingsQ = query(collection(db, "bookings"), where("visitorId", "==", user.uid));
          const userBookingsSnap = await getDocs(userBookingsQ);
          const userBookings = userBookingsSnap.docs.map(d => d.data());
          const hasAnyBooking = userBookings.length > 0;
          const hasPropertyBooking = userBookings.some((b: any) => b.propertyId === propertyId);

          const usageQ = query(collection(db, "couponUsage"), where("visitorId", "==", user.uid));
          const usageSnap = await getDocs(usageQ);
          const usedCouponIds = usageSnap.docs.map(d => d.data().couponId);

          for (const docSnap of snap.docs) {
            const c = docSnap.data();
            if (!c.propertyIds.includes(propertyId)) continue;
            const getExpiry = (exp: any) => exp?.toDate ? exp.toDate() : new Date(exp.seconds ? exp.seconds * 1000 : exp);
            if (c.expiryType === 'date' && c.expiryDate && getExpiry(c.expiryDate) < now) continue;
            if (c.minGuests > guests.length) continue;
            if (usedCouponIds.includes(docSnap.id)) continue;
            
            if (c.eligibilityType === 'first_on_platform' && hasAnyBooking) continue;
            if (c.eligibilityType === 'first_on_property' && hasPropertyBooking) continue;
            
            validCoupons.push({ id: docSnap.id, ...c });
          }
          setAvailableCoupons(validCoupons);
        } catch (err) {
          console.error(err);
        } finally {
          setCouponsLoading(false);
        }
      };
      fetchCoupons();
    }
  }, [step, propertyId, user, guests.length]);

  const applyManualCoupon = () => {
    setCouponError('');
    if (!manualCouponCode) return;
    const found = availableCoupons.find(c => c.code === manualCouponCode.toUpperCase());
    if (found) {
      setAppliedCoupon(found);
      setManualCouponCode('');
      const saving = found.discountType === 'percentage'
        ? Math.round(baseTotalAmount * found.discountValue / 100)
        : Math.min(found.discountValue, baseTotalAmount);
      setCouponSavings(saving);
      setShowCouponSuccess(true);
      setTimeout(() => setShowCouponSuccess(false), 2500);
    } else {
      setCouponError('Invalid or unavailable coupon code');
    }
  };

  const handleApplyCoupon = (coupon: any) => {
    setAppliedCoupon(coupon);
    setCouponError('');
    const saving = coupon.discountType === 'percentage'
      ? Math.round(baseTotalAmount * coupon.discountValue / 100)
      : Math.min(coupon.discountValue, baseTotalAmount);
    setCouponSavings(saving);
    setShowCouponSuccess(true);
    setTimeout(() => setShowCouponSuccess(false), 2500);
  };

  useEffect(() => {
    if (authLoading || !propertyId) return;

    const fetchPropertyData = async (retryCounter = 1) => {
      try {
        const prop = await propertyService.getPropertyById(propertyId);
        if (prop) {
          // Check for approved status or if user is owner/admin
          const isOwner = user && prop.ownerId === user.uid;
          const isAdmin = profile?.role === 'admin';
          
          if (prop.status !== 'Approved' && !isOwner && !isAdmin) {
            throw new Error("This property is currently not available for booking.");
          }

          setProperty(prop);
          
          // Fetch bookings to disable dates
          const bookings = await bookingService.getBookingsByProperty(propertyId);
          const dates: Date[] = [];
          bookings.forEach(booking => {
            if (booking.status === 'confirmed' || booking.status === 'pending_owner') {
              let current = new Date(booking.checkIn);
              const end = new Date(booking.checkOut);
              while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
              }
            }
          });
          setBookedDates(dates);
        } else {
          showToast("Property not found", "error");
          navigate('/');
        }
      } catch (error: any) {
        console.error('Property load error:', error);
        if (retryCounter > 0) {
          // Retry once after 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchPropertyData(retryCounter - 1);
        }
        showToast(error.message || "Failed to load property", "error");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [propertyId, navigate, authLoading, user, profile]);

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!property) return null;

  const diffDays = dateRange.from && dateRange.to ? differenceInDays(dateRange.to, dateRange.from) : 0;
  const nights = (dateRange.from && !dateRange.to) ? "--" : diffDays;
  const isMinNightsError = dateRange.from && dateRange.to && diffDays < 1;
  const effectiveNights = diffDays >= 1 ? diffDays : 1;
  
  const totalGuests = guests.length;
  const baseTotalAmount = effectiveNights * property.pricePerDay * totalGuests;

  const maxAllowedDiscount = baseTotalAmount * 0.50;
  let calculatedDiscount = appliedCoupon ? (
    appliedCoupon.discountType === 'percentage' 
      ? Math.round(baseTotalAmount * appliedCoupon.discountValue / 100)
      : appliedCoupon.discountValue
  ) : 0;
  const discountAmount = Math.min(calculatedDiscount, maxAllowedDiscount);
  
  const totalAmount = baseTotalAmount - discountAmount;
  const platformCommission = totalAmount * 0.20;
  const receivedAmount = totalAmount - platformCommission;

  const handleAddGuest = () => {
    const maxGuests = property.guests || 6; // Default to 6 if not specified
    if (guests.length >= maxGuests) {
      showToast(`Maximum number of residents reached`, "error");
      return;
    }
    setGuests([...guests, { name: '', age: 0, gender: 'Male', contactNo: '', type: 'adult' }]);
  };

  const handleAddChild = () => {
    const maxGuests = property.guests || 6;
    if (guests.length >= maxGuests) {
      showToast(`Maximum number of residents reached`, "error");
      return;
    }
    setGuests([...guests, { name: '', age: 0, gender: 'Male', relation: '', type: 'child' }]);
  };

  const handleRemoveGuest = (index: number) => {
    if (guests.length === 1) return;
    const newGuests = [...guests];
    newGuests.splice(index, 1);
    setGuests(newGuests);
  };

  const handleGuestChange = (index: number, field: keyof GuestDetail, value: any) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);
  };

  const validateStep2 = () => {
    const allowedGenders = property.gender || [];
    const isEverybodyAllowed = allowedGenders.includes('Everybody');

    for (const guest of guests) {
      if (!guest.name) {
        showToast("Please enter name for all guests", "error");
        return false;
      }
      
      // Gender validation
      if (allowedGenders.length > 0) {
        if (!allowedGenders.includes(guest.gender)) {
          showToast(`${guest.gender} is not allowed. Add another guest.`, "error");
          return false;
        }
      }

      if (guest.type === 'adult' && guest.age < 18) {
        showToast("Adult guests must be 18 or older", "error");
        return false;
      }
      if (guest.type === 'child' && guest.age >= 18) {
        showToast("Children must be under 18", "error");
        return false;
      }
    }
    return true;
  };

  const handleRazorpayPayment = async () => {
    if (!user) return;

    if (!bookingContactNo || bookingContactNo.length !== 10) {
      showToast("Please provide a valid 10-digit primary contact number", "error");
      return;
    }

    if (!govIdAcknowledged || !termsAccepted) {
      showToast("Please accept the terms and conditions", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const guestsWithContact = [...guests];
      guestsWithContact[0] = { ...guests[0], contactNo: bookingContactNo };

      const referredBy = localStorage.getItem('shelterbee_referral') || undefined;

      const bookingId = await bookingService.createBooking({
        propertyId: property.id,
        visitorId: user.uid,
        ownerId: property.ownerId,
        visitorName: guests[0].name,
        visitorContact: bookingContactNo || '',
        isWhatsapp: true,
        checkIn: dateRange.from || null,
        checkOut: dateRange.to || null,
        nights: effectiveNights,
        totalAmount,
        originalAmount: baseTotalAmount,
        discountAmount,
        couponCode: appliedCoupon?.code,
        couponId: appliedCoupon?.id,
        status: 'pending_owner',
        guests: guestsWithContact,
        govIdAcknowledged,
        propertyTitle: property.title,
        referredBy,
      }, true);

      localStorage.removeItem('shelterbee_referral');

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount: totalAmount }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create payment order');
      }

      const order = await response.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ShelterBee',
        description: property.title,
        order_id: order.orderId,
        prefill: {
          name: guests[0].name,
          contact: bookingContactNo,
          email: user.email || '',
        },
        handler: async (paymentResponse: any) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            showToast("Payment verified! Confirming booking...", "success");
            setIsSubmitting(true);

            await bookingService.finalizeBookingAfterPayment(bookingId);

            // Send notifications (non-blocking — errors won't affect booking)
            try {
              // 1. Emails
              try {
                if (user.email) {
                  const guestTemplate = emailTemplates.getBookingConfirmationGuest(
                    guests[0].name,
                    property.title,
                    dateRange.from!,
                    dateRange.to!,
                    totalGuests,
                    totalAmount,
                    property.address || property.area
                  );
                  await emailService.sendEmail({
                    to: user.email,
                    subject: guestTemplate.subject,
                    html: guestTemplate.html
                  });
                }

                const ownerProfile = await userService.getUserProfile(property.ownerId);
                if (ownerProfile?.email) {
                  const ownerTemplate = emailTemplates.getBookingAlertOwner(
                    property.title,
                    guests[0].name,
                    guests[0].contactNo || 'Not provided',
                    dateRange.from!,
                    dateRange.to!,
                    effectiveNights,
                    totalGuests,
                    bookingId,
                    totalAmount,
                    platformCommission,
                    receivedAmount
                  );
                  await emailService.sendEmail({
                    to: ownerProfile.email,
                    subject: ownerTemplate.subject,
                    html: ownerTemplate.html
                  });
                }

                if (user.email) {
                  const paymentTemplate = emailTemplates.getPaymentNotification(
                    guests[0].name,
                    totalAmount,
                    'Property Booking',
                    bookingId
                  );
                  await emailService.sendEmail({
                    to: user.email,
                    subject: paymentTemplate.subject,
                    html: paymentTemplate.html
                  });
                }
              } catch (emailError) {
                console.error("Failed to send booking emails:", emailError);
              }

              // 2. WhatsApp
              try {
                const visitorProfile = await userService.getUserProfile(user.uid);
                const ownerProfile = await userService.getUserProfile(property.ownerId);

                const visitorMobile = bookingContactNo;
                let formattedMobile = '';
                if (visitorMobile) {
                  const cleanMobile = visitorMobile.toString().replace(/[\s\-\(\)]/g, '');
                  formattedMobile = cleanMobile.startsWith('+')
                    ? cleanMobile.slice(1)
                    : cleanMobile.startsWith('91')
                      ? cleanMobile
                      : `91${cleanMobile}`;
                }

                if (formattedMobile) {
                  const inDate = dateRange.from ? new Date(dateRange.from) : new Date();
                  const outDate = dateRange.to ? new Date(dateRange.to) : new Date();
                  await sendBookingConfirmationToVisitor(
                    formattedMobile,
                    visitorProfile?.displayName || guests[0]?.name || 'Guest',
                    property.title,
                    inDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                    outDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                    totalGuests || 1,
                    totalAmount,
                    property.address || '',
                    property.googleMapsLink || ''
                  );
                }

                let rawOwnerMobile = ownerProfile?.phone || ownerProfile?.phoneNumber || (ownerProfile as any)?.mobile || (ownerProfile as any)?.contactNumber;
                let ownerMobile = '';
                if (rawOwnerMobile) {
                  const cleanMobile = rawOwnerMobile.toString().replace(/[\s\-\(\)]/g, '');
                  ownerMobile = cleanMobile.startsWith('+')
                    ? cleanMobile.slice(1)
                    : cleanMobile.startsWith('91')
                      ? cleanMobile
                      : `91${cleanMobile}`;
                }

                if (ownerMobile) {
                  const inDate = dateRange.from ? new Date(dateRange.from) : new Date();
                  const outDate = dateRange.to ? new Date(dateRange.to) : new Date();
                  const diff = outDate.getTime() - inDate.getTime();
                  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));

                  await sendNewBookingAlertToOwner(
                    ownerMobile,
                    ownerProfile?.displayName || 'Owner',
                    property.title,
                    visitorProfile?.displayName || guests[0]?.name || 'Guest',
                    visitorMobile || 'N/A',
                    inDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                    outDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                    nights,
                    totalGuests || 1,
                    bookingId,
                    totalAmount
                  );
                }
              } catch (waError) {
                console.error('WhatsApp booking notifications failed:', waError);
              }
            } catch (notificationError) {
              console.error('Notification sending failed:', notificationError);
            }

            navigate(`/booking-success/${bookingId}`);
          } catch (verifyError: any) {
            console.error('Payment verification error:', verifyError);
            showToast(verifyError.message || 'Payment verification failed', 'error');
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled', 'info');
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        showToast(response.error?.description || 'Payment failed', 'error');
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      showToast(error instanceof Error ? error.message : "An error occurred", "error");
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Dates', icon: CalendarIcon },
    { id: 2, name: 'Guests', icon: Users },
    { id: 3, name: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-24 pb-12 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 md:mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all shadow-sm border border-slate-100 group"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] tracking-tight">Book your stay</h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium">{property.title}</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="max-w-3xl mx-auto mb-10 md:mb-16">
          <div className="relative">
            <div className="absolute top-5 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[3px] bg-slate-100 z-0 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#1E1B4B] via-[#F59E0B] to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
            <div className="flex justify-between relative z-10">
              {steps.map((s) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                return (
                  <div key={s.id} className="flex flex-col items-center">
                    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isActive 
                        ? 'bg-[#1E1B4B] text-white shadow-lg shadow-indigo-200/50 scale-110 ring-4 ring-indigo-100' 
                        : isCompleted 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                          : 'bg-white text-slate-300 border-2 border-slate-200'
                    }`}>
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      isActive ? 'text-[#1E1B4B]' : isCompleted ? 'text-emerald-600' : 'text-slate-300'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Form Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Select your dates</h2>
                      <p className="text-sm text-slate-400 font-medium">Choose check-in and check-out dates</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 flex justify-center bg-slate-50/80 rounded-2xl p-3 sm:p-5 border border-slate-100 relative w-full">
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            const hasBooked = bookedDates.some(d => {
                              const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                              const fromTime = new Date(range.from!.getFullYear(), range.from!.getMonth(), range.from!.getDate()).getTime();
                              const toTime = new Date(range.to!.getFullYear(), range.to!.getMonth(), range.to!.getDate()).getTime();
                              return dTime >= fromTime && dTime <= toTime;
                            });
                            if (hasBooked) {
                              showToast("Property is booked for these dates, please select another dates", "error");
                              setDateRange({ from: range.from, to: undefined });
                              return;
                            }
                          }
                          setDateRange(range as any);
                        }}
                        disabled={[
                          { before: new Date() },
                          ...bookedDates,
                          ...(property.availabilityStatus === 'unavailable' ? [
                            property.unavailabilityOption === 'manual' 
                              ? { after: new Date(0) } 
                              : (property.unavailableFrom && property.unavailableTo ? {
                                  from: new Date(property.unavailableFrom),
                                  to: new Date(property.unavailableTo)
                                } : [])
                          ] : [])
                        ].flat()}
                        modifiers={{ booked: bookedDates }}
                        modifiersStyles={{
                          booked: {
                            backgroundColor: '#FEF2F2',
                            color: '#EF4444',
                            textDecoration: 'line-through'
                          }
                        }}
                        className="font-sans scale-90 sm:scale-100"
                        style={{
                          '--rdp-accent-color': '#1E1B4B',
                          '--rdp-background-color': '#EEF2FF',
                        } as React.CSSProperties}
                      />
                      
                      {isMinNightsError && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm animate-pulse">
                          Minimum booking is 1 night
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5 space-y-5">
                      <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-[#1A1A2E] uppercase tracking-widest mb-4">Property Timing</h3>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 mb-3">
                          <span className="text-xs font-bold text-slate-400">Check-in</span>
                          <span className="text-sm font-black text-[#1E1B4B]">{property?.checkInTime || '12:00 PM'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-400">Check-out</span>
                          <span className="text-sm font-black text-[#1E1B4B]">{property?.checkOutTime || '11:00 AM'}</span>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-[#1A1A2E] uppercase tracking-widest mb-4">Your Expected Time</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Check-in</label>
                            <input 
                              type="time" 
                              value={visitorCheckInTime}
                              onChange={(e) => setVisitorCheckInTime(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white font-bold text-[#1A1A2E]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Check-out</label>
                            <input 
                              type="time" 
                              value={visitorCheckOutTime}
                              onChange={(e) => setVisitorCheckOutTime(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white font-bold text-[#1A1A2E]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {dateRange.from && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 overflow-hidden"
                      >
                        <div className="p-5 bg-gradient-to-r from-indigo-50 to-amber-50 rounded-2xl border border-indigo-100/50">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-[#1E1B4B]" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check-in</p>
                                <p className="text-sm font-black text-[#1A1A2E]">
                                  {format(dateRange.from, 'MMM dd, yyyy')}
                                  {visitorCheckInTime && <span className="text-slate-400 font-medium ml-1">• {formatTime12hr(visitorCheckInTime)}</span>}
                                </p>
                              </div>
                            </div>
                            <div className="hidden sm:block w-8 h-px border-t-2 border-dashed border-slate-300"></div>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check-out</p>
                                {dateRange.to ? (
                                  <p className="text-sm font-black text-[#1A1A2E]">
                                    {format(dateRange.to, 'MMM dd, yyyy')}
                                    {visitorCheckOutTime && <span className="text-slate-400 font-medium ml-1">• {formatTime12hr(visitorCheckOutTime)}</span>}
                                  </p>
                                ) : (
                                  <p className="text-sm font-medium text-slate-400">Select checkout date</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 flex justify-end">
                    <button
                      disabled={!dateRange.from || !dateRange.to || isMinNightsError}
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto px-10 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#312E81] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 group"
                    >
                      Next: Guest Details
                      <ChevronLeft className="w-5 h-5 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Guest Details</h2>
                        <p className="text-sm text-slate-400 font-medium">Who's coming along?</p>
                      </div>
                    </div>

                    <div className="mb-8 p-5 bg-gradient-to-r from-indigo-50 to-indigo-50/30 rounded-2xl border border-indigo-100">
                      <label className="text-[10px] font-black text-[#1E1B4B] uppercase tracking-widest block mb-2">Primary Contact Number</label>
                      <div className="flex gap-3">
                        <span className="flex items-center px-4 bg-[#1E1B4B] text-white rounded-xl text-sm font-bold">+91</span>
                        <input 
                          type="tel"
                          value={bookingContactNo}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setBookingContactNo(val);
                          }}
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white font-bold text-[#1A1A2E]"
                          placeholder="98765 43210"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest">
                        Guests <span className="text-slate-300 font-medium">({guests.length}/{property?.guests || 6})</span>
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleAddGuest}
                          disabled={guests.length >= (property?.guests || 6)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-[#1E1B4B] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adult
                        </button>
                        <button 
                          onClick={handleAddChild}
                          disabled={guests.length >= (property?.guests || 6)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" /> Child
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {guests.map((guest, idx) => {
                        const adultIndex = guests.slice(0, idx).filter(g => g.type === 'adult').length + 1;
                        const childIndex = guests.slice(0, idx).filter(g => g.type === 'child').length + 1;
                        return (
                        <div key={idx} className="relative group">
                          {guests.length > 1 && (
                            <button 
                              onClick={() => handleRemoveGuest(idx)}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-xl shadow-md flex items-center justify-center hover:bg-red-50 transition-all z-10 border border-slate-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div className={`p-5 rounded-2xl border-2 transition-all ${
                            guest.type === 'adult' ? 'border-indigo-100 bg-indigo-50/30' : 'border-amber-100 bg-amber-50/30'
                          }`}>
                            <div className="flex items-center gap-2 mb-4">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${
                                guest.type === 'adult' ? 'bg-[#1E1B4B] text-white' : 'bg-amber-600 text-white'
                              }`}>
                                {guest.type === 'adult' ? `A${adultIndex}` : `C${childIndex}`}
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                guest.type === 'adult' ? 'text-[#1E1B4B]' : 'text-amber-700'
                              }`}>
                                {guest.type === 'adult' ? 'Adult' : 'Child'} Guest
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                                <input 
                                  type="text"
                                  value={guest.name}
                                  onChange={(e) => handleGuestChange(idx, 'name', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-white bg-white focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-[#1A1A2E] shadow-sm"
                                  placeholder="Enter name"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Age</label>
                                <input 
                                  type="number"
                                  value={guest.age || ''}
                                  onChange={(e) => handleGuestChange(idx, 'age', parseInt(e.target.value))}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-white bg-white focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-[#1A1A2E] shadow-sm"
                                  placeholder={guest.type === 'adult' ? "18+" : "Under 18"}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
                                <select 
                                  value={guest.gender}
                                  onChange={(e) => handleGuestChange(idx, 'gender', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-white bg-white focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-[#1A1A2E] shadow-sm appearance-none"
                                >
                                  <option>Male</option>
                                  <option>Female</option>
                                  <option>Other</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="order-2 sm:order-1 px-8 py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (validateStep2()) setStep(3);
                        }}
                        className="order-1 sm:order-2 px-10 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#312E81] transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 group"
                      >
                        Next: Payment
                        <ChevronLeft className="w-5 h-5 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Payment</h2>
                      <p className="text-sm text-slate-400 font-medium">Complete your booking payment</p>
                    </div>
                  </div>
                  
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-[#1A1A2E] uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Info className="w-4 h-4 text-[#1E1B4B]" />
                          Cancellation Policy
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">&gt; 24h</p>
                            <p className="text-xs font-black text-green-600">75% Refund</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">24-6h</p>
                            <p className="text-xs font-black text-amber-600">50% Refund</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">&lt; 6h</p>
                            <p className="text-xs font-black text-red-600">No Refund</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">After In</p>
                            <p className="text-xs font-black text-red-600">No Refund</p>
                          </div>
                        </div>
                      </div>

                      {/* COUPONS SECTION */}
                      <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-[#1A1A2E] uppercase tracking-widest mb-4">Coupons & Offers</h3>
                        
                        {couponsLoading ? (
                          <div className="text-sm text-slate-400 font-medium animate-pulse">Checking available coupons...</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input 
                                  type="text" 
                                  value={manualCouponCode}
                                  onChange={e => setManualCouponCode(e.target.value)}
                                  placeholder="Enter coupon code" 
                                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1E1B4B] focus:ring-2 focus:ring-indigo-200 outline-none transition-all uppercase font-bold text-[#1A1A2E] placeholder:font-normal placeholder:normal-case"
                                />
                              </div>
                              <button onClick={applyManualCoupon} className="px-5 py-3 bg-[#1E1B4B] text-white rounded-xl font-bold hover:bg-[#312E81] transition-all shadow-md shadow-indigo-200 text-sm">Apply</button>
                            </div>
                            {couponError && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><Info className="w-3 h-3" />{couponError}</p>}
                            
                            {availableCoupons.length > 0 && (
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{availableCoupons.length} coupon{availableCoupons.length > 1 ? 's' : ''} available</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {availableCoupons.map(coupon => (
                                    <div 
                                      key={coupon.id} 
                                      onClick={() => handleApplyCoupon(coupon)}
                                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group overflow-hidden ${
                                        appliedCoupon?.id === coupon.id 
                                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' 
                                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                                      }`}
                                    >
                                      {appliedCoupon?.id === coupon.id && (
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 -rotate-45 translate-x-5 -translate-y-5"></div>
                                      )}
                                      <div className="flex justify-between items-center mb-1 relative">
                                        <span className="font-black text-base text-[#1A1A2E]">{coupon.code}</span>
                                        {appliedCoupon?.id === coupon.id ? (
                                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Tap</span>
                                        )}
                                      </div>
                                      <p className="text-sm font-bold text-indigo-700">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {appliedCoupon && (
                              <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-sm font-bold">Coupon {appliedCoupon.code} applied!</span>
                                </div>
                                <button onClick={() => setAppliedCoupon(null)} className="text-xs font-black text-emerald-800 underline hover:no-underline">Remove</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Terms & Conditions */}
                      <div className="space-y-3">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <h3 className="font-black text-[#1A1A2E] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Info className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            Terms & Conditions
                          </h3>
                          <ul className="text-xs text-slate-600 leading-relaxed font-medium space-y-2">
                            <li className="flex gap-2"><span className="text-[#1E1B4B] font-black">1.</span> By booking, you agree to follow house rules set by the host.</li>
                            <li className="flex gap-2"><span className="text-[#1E1B4B] font-black">2.</span> ShelterBee is a technology platform connecting guests with host-managed properties.</li>
                            <li className="flex gap-2"><span className="text-[#1E1B4B] font-black">3.</span> ShelterBee is not liable for issues arising from host negligence or property conditions.</li>
                          </ul>
                        </div>

                        <label className={`flex gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          govIdAcknowledged ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'
                        }`}>
                          <input 
                            type="checkbox"
                            checked={govIdAcknowledged}
                            onChange={(e) => setGovIdAcknowledged(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded-lg border-slate-300 text-[#1E1B4B] focus:ring-[#1E1B4B] shrink-0"
                          />
                          <span className="text-xs sm:text-sm font-bold text-[#1A1A2E] leading-snug">
                            I acknowledge that I/we will carry valid Government ID proof while visiting the property.
                          </span>
                        </label>

                        <label className={`flex gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          termsAccepted ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'
                        }`}>
                          <input 
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded-lg border-slate-300 text-[#1E1B4B] focus:ring-[#1E1B4B] shrink-0"
                          />
                          <span className="text-xs sm:text-sm text-slate-600 font-medium leading-snug">
                            By proceeding I accept ShelterBee's Terms of Use, Cancellation Policy, and Payment Terms. Refunds are credited to ShelterBee wallet within 5-10 business days.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-5">
                      <div className="p-6 bg-gradient-to-br from-[#1E1B4B] to-indigo-800 text-white rounded-3xl shadow-2xl shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <h3 className="text-base font-black tracking-wide">Payment Summary</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm text-white/70">
                              <span>Stay</span>
                              <span className="text-white font-bold">{nights} Night{Number(nights) > 1 ? 's' : ''} · {totalGuests} Guest{totalGuests > 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-px bg-white/10"></div>
                            <div className="flex justify-between text-sm text-white/70">
                              <span>Base Rent</span>
                              <span className="text-white font-bold">₹{(baseTotalAmount || 0).toLocaleString()}</span>
                            </div>
                            {appliedCoupon && (
                              <div className="flex justify-between text-sm">
                                <span className="text-emerald-300">Discount ({appliedCoupon.code})</span>
                                <span className="text-emerald-300 font-bold">- ₹{discountAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="h-px bg-white/20 mt-3"></div>
                            <div className="flex justify-between items-end pt-1">
                              <span className="text-sm font-bold text-white/80">Total Amount</span>
                              <span className="text-3xl font-black tracking-tight">₹{(totalAmount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="order-2 sm:order-1 px-8 py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={handleRazorpayPayment}
                      className="order-1 sm:order-2 px-10 py-4 bg-gradient-to-r from-[#1E1B4B] to-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest hover:from-[#312E81] hover:to-indigo-900 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group min-w-[200px]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ₹{totalAmount.toLocaleString()}
                          <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4 sticky top-24 self-start">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                <div className="relative -mx-6 -mt-6 mb-6">
                  <div className="aspect-[4/3] rounded-t-3xl overflow-hidden bg-slate-100">
                    <img 
                      src={property.photos?.[0] || 'https://picsum.photos/seed/prop/400/300'} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16">
                    <h3 className="text-lg font-black text-white leading-tight">{property.title}</h3>
                    <div className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{property.area}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate</p>
                        <p className="text-sm font-black text-[#1A1A2E]">₹{(property.pricePerDay || 0).toLocaleString()}<span className="text-[9px] text-slate-400 font-medium">/day</span></p>
                      </div>
                      <div className="text-center border-x border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nights</p>
                        <p className="text-sm font-black text-[#1A1A2E]">{nights}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Guests</p>
                        <p className="text-sm font-black text-[#1A1A2E]">{totalGuests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Base Rent</span>
                      <span className="text-sm font-black text-[#1A1A2E]">₹{(baseTotalAmount || 0).toLocaleString()}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Discount ({appliedCoupon.code})
                        </span>
                        <span className="text-sm font-black text-emerald-600">-₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                      <span className="text-xl font-black text-[#1E1B4B]">₹{(totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <p className="text-[9px] text-indigo-700 font-bold leading-relaxed italic text-center">
                      Hotel/Room taxes and applicable fees are included
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#1E1B4B] to-indigo-500" />
                  Your Stay
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Check-in — Check-out</p>
                      <p className="text-xs font-bold text-[#1A1A2E]">{dateRange.from ? format(dateRange.from, 'MMM dd') : '...'} — {dateRange.to ? format(dateRange.to, 'MMM dd') : '...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Guests</p>
                      <p className="text-xs font-bold text-[#1A1A2E]">{totalGuests} Guest(s)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCouponSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 pointer-events-auto text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-black text-[#1A1A2E] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Congratulations!
                </h3>
                <p className="text-slate-500 font-medium text-sm mb-4">
                  Coupon <span className="font-black text-indigo-700">{appliedCoupon?.code}</span> applied successfully
                </p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl"
                >
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">You're saving</p>
                  <p className="text-3xl font-black text-amber-700">₹{couponSavings.toLocaleString()}</p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
