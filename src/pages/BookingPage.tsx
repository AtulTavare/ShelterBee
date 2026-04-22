import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { bookingService, GuestDetail } from '../services/bookingService';
import { walletService } from '../services/walletService';
import { emailService } from '../services/emailService';
import { emailTemplates } from '../services/emailTemplates';
import { userService } from '../services/userService';
import { showToast } from '../utils/toast';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Info,
  QrCode,
  Smartphone,
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
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'phonepe' | 'paytm'>('upi');

  // Step 4: Policies
  const [govIdAcknowledged, setGovIdAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
  const isMinNightsError = dateRange.from && dateRange.to && diffDays < 2;
  const effectiveNights = diffDays >= 2 ? diffDays : 2;
  
  const totalGuests = guests.length;
  const totalAmount = effectiveNights * property.pricePerDay * totalGuests;
  const platformCommission = totalAmount * 0.25;
  const receivedAmount = totalAmount - platformCommission;

  const handleAddGuest = () => {
    const maxGuests = property.maxGuests || 6; // Default to 6 if not specified
    if (guests.length >= maxGuests) {
      showToast(`Maximum ${maxGuests} guests allowed for this property`, "error");
      return;
    }
    setGuests([...guests, { name: '', age: 0, gender: 'Male', contactNo: '', type: 'adult' }]);
  };

  const handleAddChild = () => {
    const maxGuests = property.maxGuests || 6;
    if (guests.length >= maxGuests) {
      showToast(`Maximum ${maxGuests} guests allowed for this property`, "error");
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
      if (guest.type === 'adult' && !guest.contactNo) {
        showToast("Please enter contact number for all adults", "error");
        return false;
      }
    }
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const bookingId = await bookingService.createBooking({
        propertyId: property.id,
        visitorId: user.uid,
        ownerId: property.ownerId,
        visitorName: guests[0].name,
        visitorContact: guests[0].contactNo || '',
        isWhatsapp: true,
        checkIn: dateRange.from || null,
        checkOut: dateRange.to || null,
        nights: effectiveNights,
        totalAmount,
        status: 'confirmed',
        guests,
        govIdAcknowledged,
        propertyTitle: property.title
      }, {
        platformCommission,
        receivedAmount
      });

      // Send Emails
      try {
        // 1. Email to Guest
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

        // 2. Email to Owner
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

        // 3. Payment Notification to Guest
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

      showToast("Booking confirmed successfully!", "success");
      navigate('/profile#history');
    } catch (error) {
      console.error("Booking failed:", error);
      showToast("Failed to create booking. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Dates', icon: CalendarIcon },
    { id: 2, name: 'Guests', icon: Users },
    { id: 3, name: 'Payment', icon: CreditCard },
    { id: 4, name: 'Confirm', icon: ShieldCheck },
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
        <div className="max-w-3xl mx-auto mb-10 md:mb-16 relative px-2">
          <div className="absolute top-4 sm:top-5 left-8 right-8 h-0.5 bg-slate-200 z-0"></div>
          <div className="flex justify-between relative z-10">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isActive ? 'bg-[#1E1B4B] text-white shadow-lg shadow-indigo-200 scale-110' : 
                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span className={`mt-2 sm:mt-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${
                    isActive ? 'text-[#1E1B4B]' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {s.name}
                  </span>
                </div>
              );
            })}
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
                  className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#1E1B4B]">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Select your dates</h2>
                  </div>
                  
                  <div className="flex justify-center bg-slate-50/50 rounded-2xl sm:rounded-3xl p-2 sm:p-6 border border-slate-100 overflow-x-auto relative">
                    <DayPicker
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range as any)}
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
                      className="font-sans scale-90 sm:scale-100"
                      style={{
                        '--rdp-accent-color': '#1E1B4B',
                        '--rdp-background-color': '#EEF2FF',
                      } as React.CSSProperties}
                    />
                    
                    {isMinNightsError && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm animate-pulse">
                        Minimum booking is 2 nights
                      </div>
                    )}
                  </div>

                  <div className="mt-8 sm:mt-10 flex justify-end">
                    <button
                      disabled={!dateRange.from || !dateRange.to || isMinNightsError}
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto px-10 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#312E81] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
                    >
                      Next: Guest Details
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
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#1E1B4B]">
                          <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Guest Details</h2>
                      </div>
                      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button 
                          onClick={handleAddGuest}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-[#1E1B4B] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-all"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Guest
                        </button>
                        <button 
                          onClick={handleAddChild}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-orange-100 transition-all"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Child
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8 sm:space-y-10">
                      {guests.map((guest, idx) => (
                        <div key={idx} className="p-6 sm:p-8 bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100">
                          {guests.length > 1 && (
                            <button 
                              onClick={() => handleRemoveGuest(idx)}
                              className="absolute -top-3 -right-3 w-10 h-10 bg-white text-red-500 rounded-xl shadow-lg flex items-center justify-center hover:bg-red-50 transition-all sm:opacity-0 sm:group-hover:opacity-100 border border-slate-100 z-10"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          <div className="flex items-center gap-3 mb-6">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              guest.type === 'adult' ? 'bg-indigo-100 text-[#1E1B4B]' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {guest.type === 'adult' ? 'Adult' : 'Child'} {idx + 1}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                              <input 
                                type="text"
                                value={guest.name}
                                onChange={(e) => handleGuestChange(idx, 'name', e.target.value)}
                                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#1E1B4B] outline-none transition-all bg-white font-medium"
                                placeholder="Enter name"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                              <input 
                                type="number"
                                value={guest.age || ''}
                                onChange={(e) => handleGuestChange(idx, 'age', parseInt(e.target.value))}
                                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#1E1B4B] outline-none transition-all bg-white font-medium"
                                placeholder={guest.type === 'adult' ? "18+" : "Under 18"}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                              <select 
                                value={guest.gender}
                                onChange={(e) => handleGuestChange(idx, 'gender', e.target.value)}
                                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#1E1B4B] outline-none transition-all bg-white font-medium appearance-none"
                              >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                              </select>
                            </div>
                            {guest.type === 'adult' ? (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact No.</label>
                                <input 
                                  type="tel"
                                  value={guest.contactNo}
                                  onChange={(e) => handleGuestChange(idx, 'contactNo', e.target.value)}
                                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#1E1B4B] outline-none transition-all bg-white font-medium"
                                  placeholder="Phone number"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relation</label>
                                <input 
                                  type="text"
                                  value={guest.relation}
                                  onChange={(e) => handleGuestChange(idx, 'relation', e.target.value)}
                                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#1E1B4B] outline-none transition-all bg-white font-medium"
                                  placeholder="e.g. Son, Daughter"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-between gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="order-2 sm:order-1 px-8 py-4 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (validateStep2()) setStep(3);
                        }}
                        className="order-1 sm:order-2 px-10 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#312E81] transition-all shadow-xl shadow-indigo-200"
                      >
                        Next: Payment
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
                  className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center gap-3 mb-8 sm:mb-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#1E1B4B]">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Payment Simulation</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                    <div className="space-y-6 sm:space-y-8">
                      <div className="p-6 sm:p-8 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Scan to Pay securely</p>
                        <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white mx-auto rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-6 flex items-center justify-center shadow-inner">
                          <QrCode className="w-full h-full text-[#1A1A2E]" />
                        </div>
                        <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-[#1E1B4B] font-black text-xs bg-white py-3 px-4 rounded-2xl border border-slate-100 inline-flex">
                          <Smartphone className="w-4 h-4" />
                          <span>shelterbee@okaxis</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-[2rem] p-6 sm:p-8 space-y-4 sm:space-y-6 border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#1E1B4B]/5 flex items-center justify-center">
                            <Info className="w-5 h-5 text-[#1E1B4B]" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-black text-[#1E1B4B]">Cancellation Policy</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Before 24h</p>
                            <p className="text-sm font-black text-green-600">75% Refund</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">24h - 6h</p>
                            <p className="text-sm font-black text-amber-600">50% Refund</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Within 6h</p>
                            <p className="text-sm font-black text-red-600">No Refund</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">After Check-in</p>
                            <p className="text-sm font-black text-red-600">No Refund</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Payment App</p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {[
                            { id: 'upi', name: 'UPI', color: 'indigo' },
                            { id: 'phonepe', name: 'PhonePe', color: 'purple' },
                            { id: 'paytm', name: 'Paytm', color: 'blue' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setPaymentMethod(m.id as any)}
                              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-center ${
                                paymentMethod === m.id 
                                  ? 'border-[#1E1B4B] bg-indigo-50 text-[#1E1B4B]' 
                                  : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200 text-slate-500'
                              }`}
                            >
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">{m.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 sm:space-y-8">
                      <div className="p-6 sm:p-8 indigo-gradient text-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <h3 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 relative z-10">Payment Summary</h3>
                        <div className="space-y-3 sm:space-y-4 relative z-10">
                          <div className="flex justify-between text-xs sm:text-sm text-white/70 font-medium">
                            <span>Stay Duration</span>
                            <span className="text-white font-bold">{nights} Nights</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm text-white/70 font-medium">
                            <span>Total Guests</span>
                            <span className="text-white font-bold">{totalGuests} Persons</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm text-white/70 font-medium">
                            <span>Base Rent</span>
                            <span className="text-white font-bold">₹{(property.pricePerDay || 0).toLocaleString()}/day</span>
                          </div>
                          <div className="pt-4 sm:pt-6 border-t border-white/10 flex justify-between items-end">
                            <span className="text-xs sm:text-sm font-bold text-white/70">Total Amount</span>
                            <span className="text-3xl sm:text-4xl font-black">₹{(totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 bg-amber-50 border border-amber-100 rounded-2xl sm:rounded-3xl flex gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                          <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-[10px] sm:text-xs text-amber-800 leading-relaxed font-medium">
                          This is a simulated payment screen for demonstration. In a real application, you would be redirected to your chosen payment app to complete the transaction.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-between gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="order-2 sm:order-1 px-8 py-4 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="order-1 sm:order-2 px-10 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#312E81] transition-all shadow-xl shadow-indigo-200"
                    >
                      Next: Final Review
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-8 sm:mb-10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#1E1B4B]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">Terms & Policies</h2>
                    </div>
                    
                    <div className="space-y-6 sm:space-y-8 mb-10 sm:mb-12">
                      <div className="p-6 sm:p-8 bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-100">
                        <h3 className="font-black text-[#1A1A2E] text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Cancellation Policy
                        </h3>
                        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-2">
                          <p>• More than 24h: 75% Refund</p>
                          <p>• 24h to 6h: 50% Refund</p>
                          <p>• Within 6h / After check-in: No Refund</p>
                          <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] italic">Refunds processed in 5-10 business days.</p>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-100">
                        <h3 className="font-black text-[#1A1A2E] text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-500" />
                          Terms & Conditions
                        </h3>
                        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-2">
                          <p>1. Acceptance: By booking, you agree to follow house rules.</p>
                          <p>2. Services: ShelterBee is a technology platform connecting guests with host-managed properties.</p>
                          <p>3. Liability: ShelterBee is not liable for issues arising from host negligence or property conditions.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <label className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl sm:rounded-3xl cursor-pointer group transition-all hover:bg-indigo-50">
                          <input 
                            type="checkbox"
                            checked={govIdAcknowledged}
                            onChange={(e) => setGovIdAcknowledged(e.target.checked)}
                            className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 rounded-lg border-slate-300 text-[#1E1B4B] focus:ring-[#1E1B4B]"
                          />
                          <span className="text-xs sm:text-sm font-black text-[#1E1B4B] leading-snug">
                            I/we have our respected Government ID's, I/we acknowledge that I/we will carry one while visiting the property.
                          </span>
                        </label>

                        <label className="flex gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl cursor-pointer group transition-all">
                          <input 
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 rounded-lg border-slate-300 text-[#1E1B4B] focus:ring-[#1E1B4B]"
                          />
                          <span className="text-xs sm:text-sm text-slate-500 font-bold leading-snug">
                            I agree that 25% platform commission applies to this booking. Payment via UPI/QR is final and non-reversible. Cancellation refunds are: 75% if cancelled more than 24hrs before check-in, 50% if cancelled between 24-6hrs before check-in, and 0% if cancelled within 6hrs of check-in or after check-in time. Refunds are credited to ShelterBee wallet within 5-10 business days. By proceeding I accept ShelterBee's Terms of Use and Payment & Commission Policy.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <button
                        onClick={() => setStep(3)}
                        className="order-2 sm:order-1 px-8 py-4 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        disabled={!govIdAcknowledged || !termsAccepted || isSubmitting}
                        onClick={handleConfirmBooking}
                        className="order-1 sm:order-2 px-8 sm:px-12 py-4 sm:py-5 bg-[#1E1B4B] text-white rounded-2xl font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:bg-[#312E81] transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 sm:gap-4"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          'Confirm Booking'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24 space-y-8">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 group">
                <img 
                  src={property.photos?.[0] || 'https://picsum.photos/seed/prop/400/300'} 
                  alt={property.title}
                  className="w-full h-full object-cover bento-img"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="space-y-6">
                <div className="pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-black text-[#1A1A2E] leading-tight mb-2">{property.title}</h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{property.area}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Price per day</span>
                    <span className="text-[#1A1A2E] font-black">₹{(property.pricePerDay || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nights</span>
                    <span className="text-[#1A1A2E] font-black">{nights}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Guests</span>
                    <span className="text-[#1A1A2E] font-black">{totalGuests}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                    <span className="text-3xl font-black text-[#1A1A2E]">₹{(totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] text-[#1E1B4B] font-bold leading-relaxed italic">
                      * Taxes and platform fees are included in the total amount shown above.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  <Info className="w-4 h-4" />
                  Booking Summary
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <CalendarIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    {dateRange.from ? format(dateRange.from, 'MMM dd') : '...'} - {dateRange.to ? format(dateRange.to, 'MMM dd') : '...'}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-indigo-500" />
                    </div>
                    {totalGuests} Guest(s)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
